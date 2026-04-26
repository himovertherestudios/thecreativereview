import React, { useEffect, useMemo, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  MessageSquare,
  ShieldOff,
  Eye,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { RECENT_REVIEWS } from '../data';
import { ContentRating, HonestyLevel, ReviewRequest } from '../types';
import { supabase } from '../lib/supabase';

type SupabasePhotoRow = {
  id: string;
  user_id: string;
  image_url: string;
  watermarked_url: string | null;
  caption: string | null;
  content_rating: ContentRating;
  honesty_level: HonestyLevel;
  feedback_categories: string[] | null;
  allow_anonymous: boolean;
  review_count: number;
  created_at: string;
  profiles:
  | {
    display_name: string | null;
    username: string | null;
    role: string | null;
    avatar_url: string | null;
  }
  | null;
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
    .replace(/^\/+/, '')
    .replace(/^photos\//, '')
    .replace(/^public\//, '');

  const { data } = supabase.storage.from('photos').getPublicUrl(cleanPath);

  return data.publicUrl || '';
}

function getFallbackImage(seed: string | undefined) {
  return `https://picsum.photos/seed/${seed || 'creative-review-feed'}/900/1200`;
}

function getRatingBadgeStyles(rating: ContentRating) {
  if (rating === 'Safe') {
    return 'bg-green-500/20 text-green-300 border border-green-500/40';
  }

  if (rating === 'Suggestive') {
    return 'bg-orange-500/20 text-orange-300 border border-orange-500/40';
  }

  return 'bg-red-500/20 text-red-300 border border-red-500/40';
}

function buildFeedPage(pageNumber: number): ReviewRequest[] {
  return RECENT_REVIEWS.map((request, index) => ({
    ...request,
    id: `${request.id}-page-${pageNumber}-${index}`,
    caption:
      pageNumber === 1
        ? request.caption
        : `${request.caption} — Round ${pageNumber}`,
    reviewCount: request.reviewCount + pageNumber,
  }));
}

function mapSupabasePhotoToReviewRequest(photo: SupabasePhotoRow): ReviewRequest {
  return {
    id: photo.id,
    creatorId: photo.user_id,
    imageUrl: getPublicPhotoUrl(photo.watermarked_url || photo.image_url),
    caption: photo.caption || 'Untitled critique post',
    contentRating: photo.content_rating,
    feedbackCategories: photo.feedback_categories || [],
    honestyLevel: photo.honesty_level,
    allowAnonymous: photo.allow_anonymous,
    createdAt: photo.created_at,
    reviewCount: photo.review_count || 0,
    creatorName: photo.profiles?.display_name || 'Creative Member',
    creatorRole: photo.profiles?.role || 'Creative',
  };
}

function FeedImage({
  request,
  shouldBlur,
}: {
  request: ReviewRequest;
  shouldBlur: boolean;
}) {
  const [imageUrl, setImageUrl] = useState(
    getPublicPhotoUrl(request.imageUrl) || getFallbackImage(request.id)
  );

  useEffect(() => {
    setImageUrl(getPublicPhotoUrl(request.imageUrl) || getFallbackImage(request.id));
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

export default function ReviewFeed() {
  const [page, setPage] = useState(1);
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [isLoadingMore, setIsLoadingMore] = useState(false);
  const [realFeedItems, setRealFeedItems] = useState<ReviewRequest[]>([]);
  const [isLoadingRealFeed, setIsLoadingRealFeed] = useState(true);
  const [feedError, setFeedError] = useState('');

  const loadMoreRef = useRef<HTMLDivElement | null>(null);

  const fakeFeedItems = useMemo(() => {
    const pages = [];

    for (let currentPage = 1; currentPage <= page; currentPage += 1) {
      pages.push(...buildFeedPage(currentPage));
    }

    return pages;
  }, [page]);

  const feedItems = realFeedItems.length > 0 ? realFeedItems : fakeFeedItems;
  const isUsingFallbackFeed = realFeedItems.length === 0 && !isLoadingRealFeed;

  const loadRealFeed = async () => {
    setIsLoadingRealFeed(true);
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
          profiles (
            display_name,
            username,
            role,
            avatar_url
          )
        `
        )
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error) {
        throw error;
      }

      const mappedFeed = (data || []).map((photo) =>
        mapSupabasePhotoToReviewRequest(photo as unknown as SupabasePhotoRow)
      );

      setRealFeedItems(mappedFeed);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong loading the feed.';

      setFeedError(message);
      setRealFeedItems([]);
    } finally {
      setIsLoadingRealFeed(false);
    }
  };

  const toggleReveal = (id: string, event: React.MouseEvent) => {
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

  useEffect(() => {
    if (realFeedItems.length > 0) return;

    const target = loadMoreRef.current;

    if (!target) return;

    const observer = new IntersectionObserver(
      (entries) => {
        const firstEntry = entries[0];

        if (firstEntry.isIntersecting && !isLoadingMore) {
          setIsLoadingMore(true);

          window.setTimeout(() => {
            setPage((currentPage) => currentPage + 1);
            setIsLoadingMore(false);
          }, 700);
        }
      },
      {
        root: null,
        rootMargin: '500px',
        threshold: 0,
      }
    );

    observer.observe(target);

    return () => {
      observer.disconnect();
    };
  }, [isLoadingMore, realFeedItems.length]);

  return (
    <div className="space-y-5 pb-6">
      {isLoadingRealFeed && (
        <div className="min-h-[160px] bg-brand-gray border border-white/10 rounded-3xl flex items-center justify-center">
          <div className="flex items-center gap-3 text-gray-500">
            <Loader2 size={18} className="animate-spin" />

            <span className="text-[10px] font-black uppercase tracking-widest">
              Loading feed...
            </span>
          </div>
        </div>
      )}

      {feedError && (
        <div className="p-4 bg-brand-critique/10 border border-brand-critique/30 rounded-2xl flex items-start gap-3">
          <AlertCircle
            size={18}
            className="text-brand-critique flex-shrink-0 mt-0.5"
          />

          <p className="text-[10px] uppercase font-black tracking-widest text-brand-critique leading-relaxed">
            Feed error: {feedError}. Showing fallback posts.
          </p>
        </div>
      )}

      {isUsingFallbackFeed && !feedError && (
        <div className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl">
          <p className="text-[10px] uppercase font-black tracking-widest text-gray-600 leading-relaxed">
            No uploads found yet. Showing sample posts until the first beta
            uploads come in.
          </p>
        </div>
      )}

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
                className="bg-brand-gray border border-white/10 rounded-3xl overflow-hidden hover:border-brand-accent/40 hover:-translate-y-1 transition-all duration-300 flex flex-col shadow-black/20"
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
                        This post is marked explicit. Reveal the preview or open
                        the post to review it.
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

                  <FeedImage request={request} shouldBlur={shouldBlur} />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/5 to-transparent opacity-80 pointer-events-none" />

                  <div className="absolute top-4 left-4 flex flex-col gap-2 z-20">
                    <span
                      className={`px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest ${getRatingBadgeStyles(
                        request.contentRating
                      )}`}
                    >
                      {request.contentRating === 'Explicit'
                        ? 'NSFW'
                        : request.contentRating}
                    </span>

                    {request.contentRating === 'Suggestive' && (
                      <span className="px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-orange-500/10 text-orange-200 border border-orange-500/30">
                        Labeled Only
                      </span>
                    )}
                  </div>

                  <div className="absolute bottom-4 left-4 z-20">
                    <span className="px-2 py-1 bg-black/50 backdrop-blur-md rounded-full border border-white/10 text-[8px] font-black uppercase tracking-widest text-white/70">
                      Protected Preview
                    </span>
                  </div>

                  <div className="absolute bottom-4 right-4 z-20 flex items-center gap-1 px-3 py-2 bg-brand-accent text-brand-black rounded-full">
                    <MessageSquare size={13} />

                    <span className="text-[10px] font-black">
                      {request.reviewCount}
                    </span>
                  </div>
                </div>

                <div className="p-5 flex flex-col gap-4">
                  <div className="min-w-0">
                    <h4 className="text-sm font-black uppercase tracking-tight line-clamp-2 mb-2">
                      {request.caption}
                    </h4>

                    <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
                      By{' '}
                      <span className="text-white">
                        {request.creatorName || 'Creative Member'}
                      </span>{' '}
                      • {request.creatorRole || 'Creative'}
                    </p>
                  </div>

                  <div className="flex flex-wrap gap-2 pt-2 border-t border-white/5">
                    {request.feedbackCategories.slice(0, 3).map((category) => (
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

      <div
        ref={loadMoreRef}
        className="min-h-[120px] flex flex-col items-center justify-center text-center"
      >
        {realFeedItems.length > 0 ? (
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-700">
            End of current uploads.
          </p>
        ) : isLoadingMore ? (
          <div className="flex items-center gap-3 text-gray-500">
            <Loader2 size={18} className="animate-spin" />
            <span className="text-[10px] font-black uppercase tracking-widest">
              Loading more posts...
            </span>
          </div>
        ) : (
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-700">
            Keep scrolling. The critiques don’t stop.
          </p>
        )}
      </div>
    </div>
  );
}