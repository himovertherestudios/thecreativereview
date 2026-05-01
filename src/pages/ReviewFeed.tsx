import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
  MessageSquare,
  ShieldOff,
  Eye,
  Loader2,
  AlertCircle,
  Camera,
  ArrowRight,
  Images,
  Layers,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { ContentRating, HonestyLevel, ReviewRequest } from '../types';
import { supabase } from '../lib/supabase';

type SupabaseProfile = {
  display_name: string | null;
  username: string | null;
  role: string | null;
  avatar_url: string | null;
};

type SupabasePhotoSet = {
  id: string;
  photo_count: number | null;
  cover_photo_url: string | null;
};

type SupabasePhotoRow = {
  id: string;
  user_id: string;
  image_url: string | null;
  watermarked_url: string | null;
  caption: string | null;
  content_rating: ContentRating | null;
  honesty_level: HonestyLevel | null;
  feedback_categories: string[] | null;
  allow_anonymous: boolean | null;
  review_count: number | null;
  created_at: string;
  photo_set_id: string | null;
  sort_order: number | null;
  profiles: SupabaseProfile | SupabaseProfile[] | null;
  photo_sets: SupabasePhotoSet | SupabasePhotoSet[] | null;
};

type FeedItem = ReviewRequest & {
  photoSetId: string | null;
  photoSetCount: number;
  isPhotoSet: boolean;
  sortOrder: number;
};

type FeedSetImage = {
  id: string;
  photoSetId: string;
  imageUrl: string;
  caption: string;
  sortOrder: number;
};

function isFullUrl(value: string | null | undefined) {
  if (!value) return false;

  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('blob:') ||
    value.startsWith('data:')
  );
}

function getPublicPhotoUrl(value: string | null | undefined) {
  if (!value) return '';

  if (isFullUrl(value)) return value;

  const cleanPath = value
    .trim()
    .replace(/^\/+/, '')
    .replace(/^photos\//, '')
    .replace(/^public\//, '');

  if (!cleanPath) return '';

  const { data } = supabase.storage.from('photos').getPublicUrl(cleanPath);

  return data.publicUrl || '';
}

function getFallbackImage(seed: string | undefined) {
  return `https://picsum.photos/seed/${seed || 'creative-review-feed'}/900/1200`;
}

function getProfile(profileData: SupabasePhotoRow['profiles']) {
  if (!profileData) return null;
  if (Array.isArray(profileData)) return profileData[0] || null;
  return profileData;
}

function getPhotoSet(photoSetData: SupabasePhotoRow['photo_sets']) {
  if (!photoSetData) return null;
  if (Array.isArray(photoSetData)) return photoSetData[0] || null;
  return photoSetData;
}

function getBestPhotoImageUrl(photo: SupabasePhotoRow) {
  const watermarkedImageUrl = getPublicPhotoUrl(photo.watermarked_url);
  const originalImageUrl = getPublicPhotoUrl(photo.image_url);

  return watermarkedImageUrl || originalImageUrl || getFallbackImage(photo.id);
}

function getRatingBadgeStyles(rating: ContentRating) {
  if (rating === 'Safe') {
    return 'bg-green-500/10 text-green-300 border border-green-500/30';
  }

  if (rating === 'Suggestive') {
    return 'bg-orange-500/10 text-orange-300 border border-orange-500/30';
  }

  return 'bg-red-500/10 text-red-300 border border-red-500/30';
}

function mapSupabasePhotoToFeedItem(photo: SupabasePhotoRow): FeedItem {
  const profile = getProfile(photo.profiles);
  const photoSet = getPhotoSet(photo.photo_sets);
  const photoSetCount = photoSet?.photo_count || 1;

  return {
    id: photo.id,
    creatorId: photo.user_id,
    imageUrl: getBestPhotoImageUrl(photo),
    caption: photo.caption || 'Untitled critique post',
    contentRating: photo.content_rating || 'Safe',
    feedbackCategories: photo.feedback_categories || [],
    honestyLevel: photo.honesty_level || 'Cook Me Respectfully',
    allowAnonymous: Boolean(photo.allow_anonymous),
    createdAt: photo.created_at,
    reviewCount: photo.review_count || 0,
    creatorName: profile?.display_name || profile?.username || 'Creative Member',
    creatorRole: profile?.role || 'Creative',
    photoSetId: photo.photo_set_id,
    photoSetCount,
    isPhotoSet: Boolean(photo.photo_set_id && photoSetCount > 1),
    sortOrder: photo.sort_order || 0,
  };
}

function FeedImage({
  request,
  shouldBlur,
}: {
  request: FeedItem;
  shouldBlur: boolean;
}) {
  const [imageUrl, setImageUrl] = useState(
    getPublicPhotoUrl(request.imageUrl) || getFallbackImage(request.id)
  );

  useEffect(() => {
    setImageUrl(
      getPublicPhotoUrl(request.imageUrl) || getFallbackImage(request.id)
    );
  }, [request.id, request.imageUrl]);

  return (
    <img
      src={imageUrl}
      alt={request.caption}
      className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${shouldBlur ? 'blur-2xl scale-105 grayscale' : ''
        }`}
      draggable={false}
      onError={() => setImageUrl(getFallbackImage(request.id))}
      onContextMenu={(event) => event.preventDefault()}
    />
  );
}

function FeedPhotoSetCarousel({
  request,
  images,
  shouldBlur,
}: {
  request: FeedItem;
  images: FeedSetImage[];
  shouldBlur: boolean;
}) {
  const carouselImages =
    images.length > 0
      ? images
      : [
        {
          id: request.id,
          photoSetId: request.photoSetId || '',
          imageUrl: request.imageUrl,
          caption: request.caption,
          sortOrder: 0,
        },
      ];

  return (
    <div className="relative h-full w-full overflow-hidden">
      <div className="flex h-full w-full overflow-x-auto snap-x snap-mandatory no-scrollbar">
        {carouselImages.map((image, index) => (
          <div
            key={image.id}
            className="relative h-full w-full shrink-0 snap-center bg-brand-black"
          >
            <img
              src={image.imageUrl || getFallbackImage(image.id)}
              alt={image.caption || request.caption}
              className={`h-full w-full object-cover transition-transform duration-500 group-hover:scale-105 ${shouldBlur ? 'blur-2xl scale-105 grayscale' : ''
                }`}
              draggable={false}
              onContextMenu={(event) => event.preventDefault()}
            />

            <div className="absolute right-4 top-4 z-20 rounded-full bg-brand-black/75 border border-white/15 px-3 py-2 backdrop-blur-md">
              <span className="text-[9px] font-black uppercase tracking-widest text-white">
                {index + 1}/{carouselImages.length}
              </span>
            </div>
          </div>
        ))}
      </div>

      <div className="absolute bottom-4 left-1/2 z-20 flex -translate-x-1/2 items-center gap-1.5 rounded-full bg-brand-black/60 border border-white/10 px-3 py-2 backdrop-blur-md">
        {carouselImages.slice(0, 8).map((image, index) => (
          <span
            key={image.id}
            className={`h-1.5 rounded-full bg-white/70 ${index === 0 ? 'w-4' : 'w-1.5 opacity-50'
              }`}
          />
        ))}

        {carouselImages.length > 8 && (
          <span className="text-[8px] font-black uppercase tracking-widest text-white/60">
            +{carouselImages.length - 8}
          </span>
        )}
      </div>
    </div>
  );
}

function BetaEmptyState({
  icon: Icon,
  eyebrow = 'Ready When You Are',
  title,
  body,
  action,
}: {
  icon: React.ElementType;
  eyebrow?: string;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="min-h-[420px] rounded-3xl border border-white/10 bg-white/[0.03] p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
      <div className="absolute -top-20 -right-20 w-44 h-44 rounded-full bg-brand-accent/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-44 h-44 rounded-full bg-brand-critique/10 blur-3xl" />

      <div className="relative z-10 w-14 h-14 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center mb-5">
        <Icon size={26} className="text-brand-accent" />
      </div>

      <p className="relative z-10 text-[10px] font-black uppercase tracking-[0.25em] text-gray-500 mb-3">
        {eyebrow}
      </p>

      <h2 className="relative z-10 text-2xl md:text-3xl font-black uppercase tracking-tight text-white mb-4 max-w-lg">
        {title}
      </h2>

      <p className="relative z-10 text-sm text-gray-400 leading-relaxed max-w-md">
        {body}
      </p>

      {action && <div className="relative z-10 mt-6">{action}</div>}
    </div>
  );
}

export default function ReviewFeed() {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [feedItems, setFeedItems] = useState<FeedItem[]>([]);
  const [photoSetImagesBySetId, setPhotoSetImagesBySetId] = useState<
    Record<string, FeedSetImage[]>
  >({});
  const [isLoadingFeed, setIsLoadingFeed] = useState(true);
  const [feedError, setFeedError] = useState('');

  const loadRealFeed = async () => {
    setIsLoadingFeed(true);
    setFeedError('');

    try {
      const { data, error } = await supabase
        .from('photos')
        .select(
          `
          id,
          user_id,
          image_url,
          watermarked_url,
          caption,
          content_rating,
          honesty_level,
          feedback_categories,
          allow_anonymous,
          review_count,
          created_at,
          photo_set_id,
          sort_order,
          profiles (
            display_name,
            username,
            role,
            avatar_url
          ),
          photo_sets (
            id,
            photo_count,
            cover_photo_url
          )
        `
        )
        .or('is_hidden.is.null,is_hidden.eq.false')
        .or('photo_set_id.is.null,sort_order.eq.0')
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) throw error;

      const mappedFeed = (data || []).map((photo) =>
        mapSupabasePhotoToFeedItem(photo as unknown as SupabasePhotoRow)
      );

      const photoSetIds = Array.from(
        new Set(
          mappedFeed
            .map((item) => item.photoSetId)
            .filter((value): value is string => Boolean(value))
        )
      );

      if (photoSetIds.length > 0) {
        const { data: setImagesData, error: setImagesError } = await supabase
          .from('photos')
          .select(
            `
      id,
      photo_set_id,
      image_url,
      watermarked_url,
      caption,
      sort_order
    `
          )
          .in('photo_set_id', photoSetIds)
          .or('is_hidden.is.null,is_hidden.eq.false')
          .order('sort_order', { ascending: true });

        if (setImagesError) throw setImagesError;

        const groupedImages = (setImagesData || []).reduce<
          Record<string, FeedSetImage[]>
        >((groups, item) => {
          const row = item as {
            id: string;
            photo_set_id: string | null;
            image_url: string | null;
            watermarked_url: string | null;
            caption: string | null;
            sort_order: number | null;
          };

          if (!row.photo_set_id) return groups;

          const imageUrl =
            getPublicPhotoUrl(row.watermarked_url) ||
            getPublicPhotoUrl(row.image_url) ||
            getFallbackImage(row.id);

          const nextImage: FeedSetImage = {
            id: row.id,
            photoSetId: row.photo_set_id,
            imageUrl,
            caption: row.caption || 'Photo set image',
            sortOrder: row.sort_order || 0,
          };

          return {
            ...groups,
            [row.photo_set_id]: [...(groups[row.photo_set_id] || []), nextImage],
          };
        }, {});

        setPhotoSetImagesBySetId(groupedImages);
      } else {
        setPhotoSetImagesBySetId({});
      }

      setFeedItems(mappedFeed);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong loading the feed.';

      setFeedError(message);
      setFeedItems([]);
    } finally {
      setIsLoadingFeed(false);
    }
  };

  const toggleReveal = (
    id: string,
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    event.preventDefault();
    event.stopPropagation();

    setRevealed((current) => ({
      ...current,
      [id]: !current[id],
    }));
  };

  useEffect(() => {
    loadRealFeed();
  }, []);

  return (
    <div className="space-y-5 pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-8 overflow-x-hidden">
      {isLoadingFeed && (
        <div className="bg-brand-gray border border-white/10 rounded-3xl min-h-[220px] flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-500">
            <Loader2 size={18} className="animate-spin" />

            <span className="text-[10px] font-black uppercase tracking-widest">
              Loading review feed...
            </span>
          </div>
        </div>
      )}

      {!isLoadingFeed && feedError && (
        <BetaEmptyState
          icon={AlertCircle}
          eyebrow="Feed Error"
          title="The Feed Did Not Load"
          body={`Something blocked the live feed from loading: ${feedError}`}
          action={
            <button
              type="button"
              onClick={loadRealFeed}
              className="min-h-[44px] px-5 py-3 bg-brand-accent text-brand-black rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-all"
            >
              Try again <ArrowRight size={14} />
            </button>
          }
        />
      )}

      {!isLoadingFeed && !feedError && feedItems.length === 0 && (
        <BetaEmptyState
          icon={Camera}
          title="No Review Requests Yet"
          body="This is where beta members will post photos and photo sets for honest critique. Be the first to upload a shot and start the creative feedback loop."
          action={
            <Link
              to="/submit"
              className="min-h-[44px] px-5 py-3 bg-brand-accent text-brand-black rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-all"
            >
              Submit a review request <ArrowRight size={14} />
            </Link>
          }
        />
      )}

      {!isLoadingFeed && !feedError && feedItems.length > 0 && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-5 md:gap-6">
            {feedItems.map((request) => {
              const isExplicit = request.contentRating === 'Explicit';
              const isRevealed = Boolean(revealed[request.id]);
              const shouldBlur = isExplicit && !isRevealed;

              return (
                <Link
                  key={request.id}
                  to={`/photo/${request.id}`}
                  className="group block"
                >
                  <motion.article
                    layout
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-brand-gray border border-white/10 rounded-3xl overflow-hidden hover:border-brand-accent/40 hover:-translate-y-1 transition-all duration-300 flex flex-col shadow-xl shadow-black/20"
                  >
                    <div className="relative aspect-[4/5] bg-brand-black overflow-hidden">
                      {shouldBlur && (
                        <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center backdrop-blur-[24px] bg-black/50">
                          <ShieldOff
                            size={36}
                            className="text-brand-critique mb-4"
                          />

                          <p className="text-xs font-black uppercase tracking-[0.2em] mb-2 text-white">
                            NSFW Content Hidden
                          </p>

                          <p className="text-[11px] text-gray-400 max-w-xs mb-4 leading-relaxed">
                            This post is marked explicit. Reveal the preview or
                            open the post to review it.
                          </p>

                          <button
                            type="button"
                            onClick={(event) => toggleReveal(request.id, event)}
                            className="min-h-[42px] px-5 py-2 bg-white/10 border border-white/20 rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white/20 transition-all flex items-center gap-2"
                          >
                            <Eye size={14} />
                            Reveal Preview
                          </button>
                        </div>
                      )}

                      {request.isPhotoSet ? (
                        <FeedPhotoSetCarousel
                          request={request}
                          images={
                            request.photoSetId
                              ? photoSetImagesBySetId[request.photoSetId] || []
                              : []
                          }
                          shouldBlur={shouldBlur}
                        />
                      ) : (
                        <FeedImage request={request} shouldBlur={shouldBlur} />
                      )}


                    </div>

                    <div className="p-5 flex flex-col gap-4">
                      <div className="flex items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${getRatingBadgeStyles(
                              request.contentRating
                            )}`}
                          >
                            {request.contentRating === 'Explicit'
                              ? 'NSFW'
                              : request.contentRating}
                          </span>


                        </div>

                        <span className="flex items-center gap-1 px-3 py-2 bg-brand-accent text-brand-black rounded-full">
                          <MessageSquare size={13} />
                          <span className="text-[10px] font-black">
                            {request.reviewCount}
                          </span>
                        </span>
                      </div>

                      <div className="min-w-0">
                        <h4 className="text-sm font-black uppercase tracking-tight line-clamp-2 mb-2">
                          {request.caption}
                        </h4>

                        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                          By{' '}
                          <Link
                            to={`/profile/${request.creatorId}`}
                            onClick={(event) => event.stopPropagation()}
                            className="text-white hover:text-brand-accent transition-colors underline-offset-4 hover:underline"
                          >
                            {request.creatorName || 'Creative'}
                          </Link>{' '}
                          • {request.creatorRole || 'Creative'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                        {request.feedbackCategories
                          .slice(0, 3)
                          .map((category) => (
                            <span
                              key={category}
                              className="px-2 py-1 bg-white/5 rounded-full text-[8px] font-black uppercase tracking-widest text-gray-400"
                            >
                              {category}
                            </span>
                          ))}

                        {request.feedbackCategories.length > 3 && (
                          <span className="px-2 py-1 bg-white/5 rounded-full text-[8px] font-black uppercase tracking-widest text-gray-400">
                            +{request.feedbackCategories.length - 3}
                          </span>
                        )}

                        <span
                          className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${request.honestyLevel === 'Cook Me Respectfully'
                            ? 'bg-brand-critique/10 text-brand-critique'
                            : 'bg-brand-accent/10 text-brand-accent'
                            }`}
                        >
                          {request.honestyLevel}
                        </span>
                      </div>
                    </div>
                  </motion.article>
                </Link>
              );
            })}
          </div>

          <div className="min-h-[120px] flex flex-col items-center justify-center text-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-700">
              End of current uploads.
            </p>
          </div>
        </>
      )}
    </div>
  );
}