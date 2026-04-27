import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ChevronLeft,
  Instagram,
  MessageSquare,
  Skull,
  Check,
  ShieldOff,
  User,
  EyeOff,
  Eye,
  Send,
  Loader2,
  AlertCircle,
  Camera,
  ArrowRight,
} from 'lucide-react';
import { ContentRating, Critique, HonestyLevel, ReviewRequest } from '../types';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';

type CritiqueType = 'self' | 'anon';
type PortfolioReady = 'Yes' | 'No' | 'Almost' | '';

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
  profiles:
  | {
    display_name: string | null;
    username: string | null;
    instagram_handle: string | null;
    role: string | null;
    avatar_url: string | null;
  }
  | null;
};

type SupabaseCritiqueRow = {
  id: string;
  photo_id: string;
  reviewer_id: string | null;
  is_anonymous: boolean;
  what_works: string;
  what_needs_work: string;
  quick_fix: string;
  portfolio_ready: 'Yes' | 'No' | 'Almost';
  rating: number;
  created_at: string;
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
  return `https://picsum.photos/seed/${seed || 'creative-review'}/900/1200`;
}

function getBestPhotoImageUrl(photo: SupabasePhotoRow) {
  const watermarkedImageUrl = getPublicPhotoUrl(photo.watermarked_url);
  const originalImageUrl = getPublicPhotoUrl(photo.image_url);

  return watermarkedImageUrl || originalImageUrl || getFallbackImage(photo.id);
}

function mapSupabasePhotoToReviewRequest(
  photo: SupabasePhotoRow
): ReviewRequest {
  return {
    id: photo.id,
    creatorId: photo.user_id,
    creatorName: photo.profiles?.display_name || 'Creative Member',
    creatorUsername:
      photo.profiles?.instagram_handle ||
      photo.profiles?.username ||
      'creative',
    creatorRole: photo.profiles?.role || 'Creative',
    imageUrl: getBestPhotoImageUrl(photo),
    caption: photo.caption || 'Untitled review request',
    contentRating: photo.content_rating || 'Safe',
    feedbackCategories: photo.feedback_categories || [],
    honestyLevel: photo.honesty_level || 'Cook Me Respectfully',
    allowAnonymous: Boolean(photo.allow_anonymous),
    createdAt: photo.created_at,
    reviewCount: photo.review_count || 0,
  };
}

function mapSupabaseCritiqueToCritique(critique: SupabaseCritiqueRow): Critique {
  return {
    id: critique.id,
    requestId: critique.photo_id,
    reviewerId: critique.reviewer_id || 'unknown',
    isAnonymous: critique.is_anonymous,
    whatWorks: critique.what_works,
    whatNeedsWork: critique.what_needs_work,
    quickFix: critique.quick_fix,
    portfolioReady: critique.portfolio_ready,
    rating: critique.rating,
    createdAt: critique.created_at,
  };
}

function formatTimeAgo(dateString: string) {
  const date = new Date(dateString);
  const now = new Date();

  const seconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (Number.isNaN(seconds)) return 'Recently';

  if (seconds < 60) return 'Just now';

  const minutes = Math.floor(seconds / 60);
  if (minutes < 60) return `${minutes}m ago`;

  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;

  const days = Math.floor(hours / 24);
  if (days < 7) return `${days}d ago`;

  const weeks = Math.floor(days / 7);
  if (weeks < 5) return `${weeks}w ago`;

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

function BetaEmptyState({
  icon: Icon,
  eyebrow = 'Beta Empty State',
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

function InlineEmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center relative overflow-hidden">
      <div className="absolute -top-12 -right-12 w-32 h-32 rounded-full bg-brand-accent/10 blur-3xl" />

      <div className="relative z-10 w-12 h-12 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center mx-auto mb-4">
        <Icon size={22} className="text-brand-accent" />
      </div>

      <h4 className="relative z-10 text-lg font-black uppercase tracking-tight text-white mb-2">
        {title}
      </h4>

      <p className="relative z-10 text-xs text-gray-400 leading-relaxed">
        {body}
      </p>

      {action && <div className="relative z-10 mt-5">{action}</div>}
    </div>
  );
}

export default function PhotoDetail() {
  const { id } = useParams();
  const navigate = useNavigate();

  const [revealed, setRevealed] = useState(false);
  const [critiqueType, setCritiqueType] = useState<CritiqueType>('self');
  const [portfolioReady, setPortfolioReady] = useState<PortfolioReady>('');
  const [whatWorks, setWhatWorks] = useState('');
  const [whatNeedsWork, setWhatNeedsWork] = useState('');
  const [quickFix, setQuickFix] = useState('');

  const [realPhoto, setRealPhoto] = useState<ReviewRequest | null>(null);
  const [realCritiques, setRealCritiques] = useState<Critique[]>([]);
  const [localCritiques, setLocalCritiques] = useState<Critique[]>([]);
  const [isLoadingPhoto, setIsLoadingPhoto] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [pageError, setPageError] = useState('');
  const [submitError, setSubmitError] = useState('');
  const [displayImageUrl, setDisplayImageUrl] = useState('');

  const photo = realPhoto;
  const isExplicit = photo?.contentRating === 'Explicit';
  const shouldBlur = Boolean(isExplicit && !revealed);

  const allCritiques = [...localCritiques, ...realCritiques];
  const visibleReviewCount = realCritiques.length + localCritiques.length;

  const canSubmit =
    Boolean(photo) &&
    whatWorks.trim().length > 2 &&
    whatNeedsWork.trim().length > 2 &&
    Boolean(portfolioReady) &&
    !isSubmitting;

  useEffect(() => {
    if (!photo) {
      setDisplayImageUrl('');
      return;
    }

    const nextImageUrl = getPublicPhotoUrl(photo.imageUrl);

    setDisplayImageUrl(nextImageUrl || getFallbackImage(photo.id));
  }, [photo?.id, photo?.imageUrl]);

  const loadPhotoDetail = async () => {
    if (!id) {
      setPageError('This photo link is missing an ID.');
      setIsLoadingPhoto(false);
      return;
    }

    setIsLoadingPhoto(true);
    setPageError('');
    setRevealed(false);
    setRealPhoto(null);
    setRealCritiques([]);
    setLocalCritiques([]);

    try {
      const { data: photoData, error: photoError } = await supabase
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
          created_at
        `
        )
        .eq('id', id)
        .or('is_hidden.is.null,is_hidden.eq.false')
        .maybeSingle();

      if (photoError) throw photoError;

      if (!photoData) {
        setRealPhoto(null);
        setRealCritiques([]);
        setPageError('This review request is no longer available.');
        return;
      }

      let profileData: {
        display_name: string | null;
        username: string | null;
        instagram_handle: string | null;
        role: string | null;
        avatar_url: string | null;
      } | null = null;

      const { data: profileResult, error: profileError } = await supabase
        .from('profiles')
        .select(
          `
          display_name,
          username,
          instagram_handle,
          role,
          avatar_url
        `
        )
        .eq('id', photoData.user_id)
        .maybeSingle();

      if (!profileError) {
        profileData = profileResult;
      }

      const mappedPhoto = mapSupabasePhotoToReviewRequest({
        ...(photoData as unknown as Omit<SupabasePhotoRow, 'profiles'>),
        profiles: {
          display_name: profileData?.display_name || null,
          username: profileData?.username || null,
          instagram_handle: profileData?.instagram_handle || null,
          role: profileData?.role || null,
          avatar_url: profileData?.avatar_url || null,
        },
      } as SupabasePhotoRow);

      setRealPhoto(mappedPhoto);
      await trackEvent('photo_viewed', 'PhotoDetail', {
        photo_id: mappedPhoto.id,
        creator_id: mappedPhoto.creatorId,
        content_rating: mappedPhoto.contentRating,
        review_count: mappedPhoto.reviewCount,
      });

      const { data: critiqueData, error: critiqueError } = await supabase
        .from('critiques')
        .select(
          `
          id,
          photo_id,
          reviewer_id,
          is_anonymous,
          what_works,
          what_needs_work,
          quick_fix,
          portfolio_ready,
          rating,
          created_at
        `
        )
        .eq('photo_id', id)
        .order('created_at', { ascending: false });

      if (critiqueError) throw critiqueError;

      const mappedCritiques = (critiqueData || []).map((critique) =>
        mapSupabaseCritiqueToCritique(
          critique as unknown as SupabaseCritiqueRow
        )
      );

      setRealCritiques(mappedCritiques);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong loading this photo.';

      setPageError(message);
      setRealPhoto(null);
      setRealCritiques([]);
    } finally {
      setIsLoadingPhoto(false);
    }
  };

  useEffect(() => {
    loadPhotoDetail();
  }, [id]);

  const handleImageError = () => {
    if (!photo) return;

    const fallbackUrl = getFallbackImage(photo.id);

    if (displayImageUrl !== fallbackUrl) {
      setDisplayImageUrl(fallbackUrl);
    }
  };

  const resetCritiqueForm = () => {
    setWhatWorks('');
    setWhatNeedsWork('');
    setQuickFix('');
    setPortfolioReady('');
    setCritiqueType('self');
  };

  const handleSubmitCritique = async () => {
    if (!canSubmit || !photo) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error('You must be logged in to leave a critique.');
      }

      const { data, error } = await supabase
        .from('critiques')
        .insert({
          photo_id: photo.id,
          reviewer_id: user.id,
          is_anonymous: critiqueType === 'anon',
          what_works: whatWorks.trim(),
          what_needs_work: whatNeedsWork.trim(),
          quick_fix: quickFix.trim() || '',
          portfolio_ready: portfolioReady || 'Almost',
          rating: 4,
        })
        .select(
          `
          id,
          photo_id,
          reviewer_id,
          is_anonymous,
          what_works,
          what_needs_work,
          quick_fix,
          portfolio_ready,
          rating,
          created_at
        `
        )
        .single();

      if (error) {
        throw error;
      }

      const newCritique = mapSupabaseCritiqueToCritique(
        data as unknown as SupabaseCritiqueRow
      );

      const nextReviewCount = visibleReviewCount + 1;

      setLocalCritiques((current) => [newCritique, ...current]);
      setRealPhoto((current) =>
        current
          ? {
            ...current,
            reviewCount: nextReviewCount,
          }
          : current
      );

      await supabase
        .from('photos')
        .update({
          review_count: nextReviewCount,
        })
        .eq('id', photo.id);

      await trackEvent('critique_submitted', 'PhotoDetail', {
        photo_id: photo.id,
        critique_id: newCritique.id,
        creator_id: photo.creatorId,
        is_anonymous: critiqueType === 'anon',
        portfolio_ready: portfolioReady || 'Almost',
      });

      resetCritiqueForm();
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong while submitting your critique.';

      setSubmitError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoadingPhoto) {
    return (
      <div className="min-h-[60vh] flex items-center justify-center">
        <div className="rounded-3xl border border-white/10 bg-brand-gray/70 p-6 flex flex-col items-center gap-4 text-center">
          <Loader2 size={24} className="animate-spin text-brand-accent" />

          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-gray-500">
            Loading photo detail...
          </p>
        </div>
      </div>
    );
  }

  if (!photo) {
    return (
      <div className="space-y-6 pb-12">
        <button
          type="button"
          onClick={() => navigate(-1)}
          className="min-h-[44px] flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
        >
          <ChevronLeft size={18} /> Back
        </button>

        <BetaEmptyState
          icon={pageError ? AlertCircle : Camera}
          eyebrow={pageError ? 'Photo Unavailable' : 'Missing Review Request'}
          title="This Review Request Is Not Available"
          body={
            pageError ||
            'This photo may have been deleted, hidden by moderation, or the link may be outdated.'
          }
          action={
            <Link
              to="/feed"
              className="min-h-[44px] px-5 py-3 bg-brand-accent text-brand-black rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-all"
            >
              Back to feed <ArrowRight size={14} />
            </Link>
          }
        />
      </div>
    );
  }

  return (
    <div className="space-y-6 pb-12">
      <button
        type="button"
        onClick={() => navigate(-1)}
        className="min-h-[44px] flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
      >
        <ChevronLeft size={18} /> Back to feed
      </button>

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        <div className="flex-1 space-y-5">
          <div className="relative rounded-3xl overflow-hidden bg-brand-gray/50 border border-white/5 aspect-[4/5] max-h-[820px]">
            <img
              src={displayImageUrl}
              alt={photo.caption}
              className={`w-full h-full object-contain bg-black ${shouldBlur ? 'blur-3xl grayscale scale-105' : ''
                }`}
              draggable={false}
              onError={handleImageError}
              onContextMenu={(event) => event.preventDefault()}
            />
          </div>

          <div className="p-5 bg-brand-gray rounded-2xl border border-white/10 space-y-5">
            <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight">
              {photo.caption}
            </h1>

            <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">
              Posted {formatTimeAgo(photo.createdAt)}
            </p>

            <div className="pt-4 border-t border-white/10">
              <Link
                to="/profile"
                className="text-sm font-black uppercase hover:text-brand-accent transition-colors block truncate"
              >
                {photo.creatorName || 'Creative Member'}
              </Link>

              <div className="flex items-center gap-2 text-gray-500">
                <Instagram size={12} />
                <span className="text-[10px] font-bold uppercase tracking-wider truncate">
                  @{photo.creatorUsername || 'creative'}
                </span>
              </div>

              <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mt-1">
                {photo.creatorRole || 'Creative'}
              </p>
            </div>
          </div>
        </div>

        <div className="lg:w-[420px] space-y-8">
          <div className="space-y-4">
            <h3 className="text-xs font-black uppercase tracking-widest text-gray-500 flex items-center gap-2">
              <MessageSquare size={14} /> {visibleReviewCount} Reviews
            </h3>

            {allCritiques.map((critique) => (
              <motion.div
                key={critique.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-4 bg-white/5 rounded-2xl border border-white/5 space-y-3"
              >
                <p className="text-sm text-gray-200 leading-relaxed">
                  {critique.whatWorks}
                </p>

                <p className="text-sm text-gray-300 leading-relaxed">
                  {critique.whatNeedsWork}
                </p>

                {critique.quickFix && (
                  <p className="text-sm text-gray-400 leading-relaxed">
                    {critique.quickFix}
                  </p>
                )}

                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Do you think it’s portfolio ready?{' '}
                  <span className="text-white">{critique.portfolioReady}</span>
                </p>
              </motion.div>
            ))}
          </div>

          <div
            id="critique-form"
            className="bg-brand-gray border border-white/10 rounded-3xl p-5 md:p-8 space-y-6"
          >
            <h2 className="text-2xl font-black tracking-tighter uppercase">
              Drop the Review
            </h2>

            <textarea
              rows={4}
              value={whatWorks}
              onChange={(event) => setWhatWorks(event.target.value)}
              className="w-full bg-brand-black border border-white/10 rounded-2xl p-4 text-sm font-medium outline-none resize-none"
              placeholder="What works?"
            />

            <textarea
              rows={4}
              value={whatNeedsWork}
              onChange={(event) => setWhatNeedsWork(event.target.value)}
              className="w-full bg-brand-black border border-white/10 rounded-2xl p-4 text-sm font-medium outline-none resize-none"
              placeholder="What needs work?"
            />

            <input
              type="text"
              value={quickFix}
              onChange={(event) => setQuickFix(event.target.value)}
              className="w-full min-h-[54px] bg-brand-black border border-white/10 rounded-2xl p-4 text-sm font-medium outline-none"
              placeholder="Optional — what would you do differently?"
            />

            <div className="grid grid-cols-3 gap-2">
              {(['Yes', 'No', 'Almost'] as PortfolioReady[]).map((value) => {
                if (!value) return null;

                return (
                  <button
                    key={value}
                    type="button"
                    onClick={() => setPortfolioReady(value)}
                    className={`min-h-[48px] rounded-2xl text-[10px] font-black uppercase ${portfolioReady === value
                        ? 'bg-brand-accent text-brand-black'
                        : 'border border-white/10 text-gray-400'
                      }`}
                  >
                    {value}
                  </button>
                );
              })}
            </div>

            <button
              type="button"
              disabled={!canSubmit}
              onClick={handleSubmitCritique}
              className="w-full min-h-[56px] bg-white text-brand-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] disabled:opacity-20 flex items-center justify-center gap-2"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={15} className="animate-spin" />
                  Saving Review
                </>
              ) : (
                <>
                  Drop the Review <Send size={15} />
                </>
              )}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}