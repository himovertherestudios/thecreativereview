import React, { useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ChevronLeft,
  Instagram,
  MoreHorizontal,
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
  AlertTriangle,
} from 'lucide-react';
import { RECENT_REVIEWS, FAKE_CRITIQUES } from '../data';
import { ContentRating, Critique, HonestyLevel, ReviewRequest } from '../types';
import { supabase } from '../lib/supabase';
import { createReport } from '../lib/reports';

type CritiqueType = 'self' | 'anon';
type PortfolioReady = 'Yes' | 'No' | 'Almost' | '';

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
    .replace(/^\/+/, '')
    .replace(/^photos\//, '')
    .replace(/^public\//, '');

  const { data } = supabase.storage.from('photos').getPublicUrl(cleanPath);

  return data.publicUrl || '';
}

function getFallbackImage(seed: string | undefined) {
  return `https://picsum.photos/seed/${seed || 'creative-review'}/900/1200`;
}

function mapSupabasePhotoToReviewRequest(photo: SupabasePhotoRow): ReviewRequest {
  return {
    id: photo.id,
    creatorId: photo.user_id,
    creatorName: photo.profiles?.display_name || 'Creative Member',
    creatorUsername:
      photo.profiles?.instagram_handle || photo.profiles?.username || 'creative',
    creatorRole: photo.profiles?.role || 'Creative',
    imageUrl: getPublicPhotoUrl(photo.watermarked_url || photo.image_url),
    caption: photo.caption || 'Untitled review request',
    contentRating: photo.content_rating,
    feedbackCategories: photo.feedback_categories || [],
    honestyLevel: photo.honesty_level,
    allowAnonymous: photo.allow_anonymous,
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
  const [isReporting, setIsReporting] = useState<Record<string, boolean>>({});
  const [reportMessages, setReportMessages] = useState<Record<string, string>>({});
  const [displayImageUrl, setDisplayImageUrl] = useState('');

  const fallbackPhoto = useMemo(() => {
    const exactMatch = RECENT_REVIEWS.find((review) => review.id === id);

    if (exactMatch) return exactMatch;

    const baseId = id?.split('-page-')[0];

    return (
      RECENT_REVIEWS.find((review) => review.id === baseId) ||
      RECENT_REVIEWS[0]
    );
  }, [id]);

  const photo = realPhoto || fallbackPhoto;
  const isRealSupabasePhoto = Boolean(realPhoto);

  const isExplicit = photo.contentRating === 'Explicit';
  const shouldBlur = isExplicit && !revealed;

  const allCritiques = isRealSupabasePhoto
    ? [...localCritiques, ...realCritiques]
    : [...localCritiques, ...FAKE_CRITIQUES];

  const visibleReviewCount = isRealSupabasePhoto
    ? realCritiques.length + localCritiques.length
    : photo.reviewCount + localCritiques.length;

  const canSubmit =
    whatWorks.trim().length > 2 &&
    whatNeedsWork.trim().length > 2 &&
    quickFix.trim().length > 2 &&
    Boolean(portfolioReady) &&
    !isSubmitting;

  useEffect(() => {
    const nextImageUrl = getPublicPhotoUrl(photo.imageUrl);

    setDisplayImageUrl(nextImageUrl || getFallbackImage(photo.id));
  }, [photo.id, photo.imageUrl]);

  const loadPhotoDetail = async () => {
    if (!id) return;

    setIsLoadingPhoto(true);
    setPageError('');
    setRevealed(false);

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
        .maybeSingle();

      if (photoError) throw photoError;

      if (!photoData) {
        setRealPhoto(null);
        setRealCritiques([]);
        setPageError('No live photo found for this ID');
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
    setDisplayImageUrl(getFallbackImage(photo.id));
  };

  const handleReportContent = async (
    contentType: 'photo' | 'critique',
    contentId: string
  ) => {
    const reportKey = `${contentType}-${contentId}`;

    if (isReporting[reportKey]) return;

    const label = contentType === 'photo' ? 'photo' : 'critique';

    const confirmed = window.confirm(
      `Report this ${label} for review? Use this for stolen work, harassment, doxxing, unsafe content, or anything that breaks the community rules.`
    );

    if (!confirmed) return;

    setIsReporting((current) => ({
      ...current,
      [reportKey]: true,
    }));

    setReportMessages((current) => ({
      ...current,
      [reportKey]: '',
    }));

    try {
      await createReport({
        contentType,
        contentId,
        reason: 'user_reported',
        details: `Reported ${label} from the photo detail page.`,
      });

      setReportMessages((current) => ({
        ...current,
        [reportKey]: 'Report sent. We’ll review it.',
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong while sending the report.';

      setReportMessages((current) => ({
        ...current,
        [reportKey]: message,
      }));
    } finally {
      setIsReporting((current) => ({
        ...current,
        [reportKey]: false,
      }));
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
    if (!canSubmit) return;

    setIsSubmitting(true);
    setSubmitError('');

    try {
      if (!isRealSupabasePhoto) {
        const newCritique: Critique = {
          id: `local-${Date.now()}`,
          requestId: photo.id,
          reviewerId: critiqueType === 'anon' ? 'anonymous' : 'current-user',
          isAnonymous: critiqueType === 'anon',
          whatWorks: whatWorks.trim(),
          whatNeedsWork: whatNeedsWork.trim(),
          quickFix: quickFix.trim(),
          portfolioReady: portfolioReady || 'Almost',
          rating: 4,
          createdAt: new Date().toISOString(),
        };

        setLocalCritiques((current) => [newCritique, ...current]);
        resetCritiqueForm();
        return;
      }

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
          quick_fix: quickFix.trim(),
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
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 size={20} className="animate-spin" />

          <p className="text-[10px] font-black uppercase tracking-widest">
            Loading photo detail...
          </p>
        </div>
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

      {pageError && (
        <div className="p-4 bg-brand-critique/10 border border-brand-critique/30 rounded-2xl flex items-start gap-3">
          <AlertCircle
            size={18}
            className="text-brand-critique flex-shrink-0 mt-0.5"
          />

          <p className="text-[10px] font-black uppercase tracking-widest text-brand-critique leading-relaxed">
            Live photo error: {pageError}. Showing fallback prototype photo.
          </p>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
        {/* Main Image Area */}
        <div className="flex-1 space-y-5">
          <div className="relative rounded-3xl overflow-hidden bg-brand-gray/50 border border-white/5 aspect-[4/5] max-h-[820px]">
            {shouldBlur && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center p-6 text-center backdrop-blur-[36px] bg-black/60">
                <ShieldOff size={48} className="text-brand-critique mb-6" />

                <h3 className="text-2xl font-black uppercase tracking-tighter mb-2">
                  NSFW Content
                </h3>

                <p className="text-gray-400 mb-8 max-w-xs font-medium text-xs leading-relaxed">
                  This image is marked explicit. Continue with respect. Critique
                  the work, not the person.
                </p>

                <button
                  type="button"
                  onClick={() => setRevealed(true)}
                  className="min-h-[48px] px-8 py-4 bg-white text-brand-black rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-brand-accent transition-all flex items-center gap-2"
                >
                  <Eye size={16} />
                  Reveal Image
                </button>
              </div>
            )}

            <img
              src={displayImageUrl}
              alt={photo.caption}
              className={`w-full h-full object-contain bg-black ${shouldBlur ? 'blur-3xl grayscale scale-105' : ''
                }`}
              draggable={false}
              onError={handleImageError}
              onContextMenu={(event) => event.preventDefault()}
            />

            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
              <div className="px-6 py-3 md:px-12 md:py-6 border-4 border-white/10 text-white/5 text-xl md:text-4xl font-black uppercase tracking-[0.5em] md:tracking-[1em] rotate-12 whitespace-nowrap">
                {photo.creatorName || 'Creative Review'} Proof
              </div>
            </div>

            <div className="absolute bottom-4 left-4 z-20">
              <span className="px-3 py-2 bg-black/50 backdrop-blur-md rounded-full border border-white/10 text-[8px] font-black uppercase tracking-widest text-white/70">
                Protected Preview
              </span>
            </div>

            <div className="absolute top-4 left-4 z-20">
              <span
                className={`px-3 py-2 rounded-full text-[8px] font-black uppercase tracking-widest border ${photo.contentRating === 'Safe'
                    ? 'bg-green-500/20 text-green-300 border-green-500/40'
                    : photo.contentRating === 'Suggestive'
                      ? 'bg-orange-500/20 text-orange-300 border-orange-500/40'
                      : 'bg-red-500/20 text-red-300 border-red-500/40'
                  }`}
              >
                {photo.contentRating === 'Explicit'
                  ? 'NSFW'
                  : photo.contentRating}
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between p-4 bg-brand-gray rounded-2xl border border-white/10">
            <div className="flex items-center gap-4 min-w-0">
              <div className="w-12 h-12 rounded-full overflow-hidden border border-white/20 flex-shrink-0">
                <img
                  src={`https://picsum.photos/seed/${photo.creatorId}/100/100`}
                  alt={photo.creatorName || 'Creative Member'}
                  className="w-full h-full object-cover"
                  draggable={false}
                />
              </div>

              <div className="min-w-0">
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

            <button
              type="button"
              className="p-3 bg-white/5 rounded-full hover:bg-white/10 transition-colors flex-shrink-0"
              aria-label="More options"
            >
              <MoreHorizontal size={20} />
            </button>
          </div>

          <div className="p-5 bg-brand-gray rounded-2xl border border-white/10 space-y-4">
            <div className="flex items-start justify-between gap-4">
              <div>
                <h1 className="text-xl md:text-2xl font-black uppercase tracking-tight">
                  {photo.caption}
                </h1>

                <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 mt-2">
                  Posted {formatTimeAgo(photo.createdAt)}
                </p>
              </div>

              <button
                type="button"
                disabled={Boolean(isReporting[`photo-${photo.id}`])}
                onClick={() => handleReportContent('photo', photo.id)}
                className="min-h-[38px] px-3 rounded-full border border-white/10 text-gray-500 hover:text-brand-critique hover:border-brand-critique flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50 flex-shrink-0"
              >
                {isReporting[`photo-${photo.id}`] ? (
                  <>
                    <Loader2 size={13} className="animate-spin" />
                    Reporting
                  </>
                ) : (
                  <>
                    <AlertTriangle size={13} />
                    Report
                  </>
                )}
              </button>
            </div>

            {reportMessages[`photo-${photo.id}`] && (
              <div className="p-3 bg-brand-black/60 border border-white/10 rounded-2xl">
                <p className="text-[9px] uppercase font-black tracking-widest text-gray-400 leading-relaxed">
                  {reportMessages[`photo-${photo.id}`]}
                </p>
              </div>
            )}

            <div className="flex flex-wrap gap-2">
              {photo.feedbackCategories.map((category) => (
                <span
                  key={category}
                  className="px-3 py-2 bg-white/5 rounded-full text-[9px] font-black uppercase tracking-widest text-gray-400"
                >
                  {category}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Critique Area */}
        <div className="lg:w-[420px] space-y-8">
          <div className="bg-brand-gray border border-white/10 rounded-3xl p-5 md:p-8 space-y-6">
            <div className="space-y-4">
              <div className="flex items-center gap-2 px-3 py-2 bg-brand-critique/20 border border-brand-critique/30 rounded-full w-fit">
                <Skull size={14} className="text-brand-critique" />

                <span className="text-[10px] font-black uppercase tracking-widest text-brand-critique">
                  {photo.honestyLevel}
                </span>
              </div>

              <h2 className="text-2xl font-black tracking-tighter uppercase">
                Drop the Review
              </h2>

              <p className="text-xs font-medium text-gray-400 leading-relaxed">
                The creator wants feedback on:{' '}
                <span className="text-white uppercase font-bold">
                  {photo.feedbackCategories.join(', ')}
                </span>
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  What works?
                </label>

                <textarea
                  rows={4}
                  value={whatWorks}
                  onChange={(event) => setWhatWorks(event.target.value)}
                  className="w-full bg-brand-black border border-white/10 rounded-2xl p-4 text-sm font-medium focus:border-brand-accent transition-all outline-none resize-none"
                  placeholder="Be specific about the wins..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  What needs work?
                </label>

                <textarea
                  rows={4}
                  value={whatNeedsWork}
                  onChange={(event) => setWhatNeedsWork(event.target.value)}
                  className="w-full bg-brand-black border border-white/10 rounded-2xl p-4 text-sm font-medium focus:border-brand-accent transition-all outline-none resize-none"
                  placeholder="Be honest, but make it useful..."
                />
              </div>

              <div className="space-y-2">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Quick fix
                </label>

                <input
                  type="text"
                  value={quickFix}
                  onChange={(event) => setQuickFix(event.target.value)}
                  className="w-full min-h-[54px] bg-brand-black border border-white/10 rounded-2xl p-4 text-sm font-medium focus:border-brand-accent transition-all outline-none"
                  placeholder="One thing to change right now..."
                />
              </div>

              <div className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  Portfolio ready?
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-3 lg:grid-cols-3 gap-2">
                  {(['Yes', 'No', 'Almost'] as PortfolioReady[]).map((value) => {
                    if (!value) return null;

                    const isSelected = portfolioReady === value;

                    return (
                      <button
                        key={value}
                        type="button"
                        onClick={() => setPortfolioReady(value)}
                        className={`min-h-[48px] py-3 text-[10px] font-black tracking-widest border rounded-2xl transition-all uppercase flex items-center justify-center gap-2 ${isSelected
                            ? 'bg-brand-accent border-brand-accent text-brand-black'
                            : 'border-white/10 text-gray-400 hover:border-white hover:text-white'
                          }`}
                      >
                        {value}
                        {isSelected && <Check size={14} strokeWidth={4} />}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>

            {submitError && (
              <div className="p-4 bg-brand-critique/10 border border-brand-critique/30 rounded-2xl">
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-critique leading-relaxed">
                  {submitError}
                </p>
              </div>
            )}

            <div className="space-y-4 pt-4 border-t border-white/5">
              <div className="grid grid-cols-2 gap-3">
                <button
                  type="button"
                  onClick={() => setCritiqueType('self')}
                  className={`min-h-[54px] rounded-2xl border flex items-center justify-center gap-2 transition-all text-[10px] font-black uppercase tracking-widest ${critiqueType === 'self'
                      ? 'bg-brand-accent border-brand-accent text-brand-black'
                      : 'border-white/20 text-gray-500 hover:text-white'
                    }`}
                >
                  <User size={16} />
                  Post as me
                </button>

                <button
                  type="button"
                  onClick={() => setCritiqueType('anon')}
                  className={`min-h-[54px] rounded-2xl border flex items-center justify-center gap-2 transition-all text-[10px] font-black uppercase tracking-widest ${critiqueType === 'anon'
                      ? 'bg-brand-accent border-brand-accent text-brand-black'
                      : 'border-white/20 text-gray-500 hover:text-white'
                    }`}
                >
                  <EyeOff size={16} />
                  Anonymous
                </button>
              </div>

              <button
                type="button"
                disabled={!canSubmit}
                onClick={handleSubmitCritique}
                className="w-full min-h-[56px] px-6 py-4 bg-white text-brand-black rounded-2xl text-[10px] font-black uppercase tracking-[0.2em] hover:bg-brand-accent transition-all disabled:opacity-20 flex items-center justify-center gap-2"
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

              {!canSubmit && !isSubmitting && (
                <p className="text-center text-[10px] text-gray-500 uppercase tracking-widest leading-relaxed">
                  Fill out all critique fields to submit.
                </p>
              )}
            </div>
          </div>

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
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2 min-w-0">
                    <div className="w-7 h-7 rounded-full bg-brand-accent/20 flex-shrink-0" />

                    <span className="text-[10px] font-black uppercase tracking-wider truncate">
                      {critique.isAnonymous
                        ? 'Anonymous Creative'
                        : 'Expert Reviewer'}
                    </span>
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    <span className="text-[9px] font-bold text-gray-600">
                      {formatTimeAgo(critique.createdAt)}
                    </span>

                    <button
                      type="button"
                      disabled={Boolean(isReporting[`critique-${critique.id}`])}
                      onClick={() =>
                        handleReportContent('critique', critique.id)
                      }
                      className="min-h-[30px] px-3 rounded-full border border-white/10 text-gray-500 hover:text-brand-critique hover:border-brand-critique flex items-center gap-2 text-[8px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                    >
                      {isReporting[`critique-${critique.id}`] ? (
                        <>
                          <Loader2 size={11} className="animate-spin" />
                          Reporting
                        </>
                      ) : (
                        <>
                          <AlertTriangle size={11} />
                          Report
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {reportMessages[`critique-${critique.id}`] && (
                  <div className="p-3 bg-brand-black/60 border border-white/10 rounded-2xl">
                    <p className="text-[8px] uppercase font-black tracking-widest text-gray-400 leading-relaxed">
                      {reportMessages[`critique-${critique.id}`]}
                    </p>
                  </div>
                )}

                <div className="space-y-2">
                  <p className="text-xs font-bold text-brand-accent uppercase leading-relaxed">
                    Works:{' '}
                    <span className="text-white font-medium normal-case">
                      {critique.whatWorks}
                    </span>
                  </p>

                  <p className="text-xs font-bold text-brand-critique uppercase leading-relaxed">
                    Needs work:{' '}
                    <span className="text-white font-medium normal-case">
                      {critique.whatNeedsWork}
                    </span>
                  </p>

                  <p className="text-xs font-bold text-gray-400 uppercase leading-relaxed">
                    Quick fix:{' '}
                    <span className="text-white font-medium normal-case">
                      {critique.quickFix}
                    </span>
                  </p>

                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    Portfolio ready:{' '}
                    <span className="text-white">
                      {critique.portfolioReady}
                    </span>
                  </p>
                </div>
              </motion.div>
            ))}

            {allCritiques.length === 0 && (
              <div className="p-5 bg-white/5 rounded-2xl border border-white/5 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                  No critiques yet. Be the first to drop one.
                </p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}