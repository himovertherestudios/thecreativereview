import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Bookmark,
  CheckCircle2,
  ExternalLink,
  Loader2,
} from 'lucide-react';
import { fetchTipById, TipCtaType, TipDetail as TipDetailData } from '../lib/tipLibrary';
import { useTipProgress } from '../hooks/useTipProgress';
import { trackEvent } from '../lib/analytics';

const CONTENT_TYPE_LABEL: Record<string, string> = {
  tip: 'Tip',
  exercise: 'Exercise',
  challenge: 'Challenge',
  conversation: 'Conversation',
};

const DEFAULT_CTA_LABEL: Record<TipCtaType, string> = {
  none: '',
  upload: 'Drop a shot for critique',
  challenge: 'Take the challenge',
  corner: 'Take it to The Corner',
  profile: 'Audit your profile',
  external: 'Learn more',
};

function resolveCtaDestination(tip: TipDetailData): { to?: string; href?: string } {
  switch (tip.ctaType) {
    case 'upload':
      return { to: '/submit' };
    case 'challenge':
      return { to: tip.challengeId ? `/challenge/${tip.challengeId}` : '/challenge-suggestion' };
    case 'corner':
      return { to: tip.cornerPostId ? `/vents/${tip.cornerPostId}` : '/vents' };
    case 'profile':
      return { to: '/profile' };
    case 'external':
      return { href: tip.ctaTarget || undefined };
    default:
      return {};
  }
}

export default function TipDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const [tip, setTip] = useState<TipDetailData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState('');

  const progress = useTipProgress(id);

  useEffect(() => {
    if (!id) return;

    let isMounted = true;

    const load = async () => {
      setIsLoading(true);
      setLoadError('');

      try {
        const data = await fetchTipById(id);
        if (!isMounted) return;

        if (!data) {
          setLoadError("This one's not here. It may have been unpublished.");
        } else {
          setTip(data);
          trackEvent('tip_opened', 'TipDetail', { tip_id: data.id, content_type: data.contentType });
        }
      } catch (err) {
        if (isMounted) {
          setLoadError(err instanceof Error ? err.message : 'Could not load this tip.');
        }
      } finally {
        if (isMounted) setIsLoading(false);
      }
    };

    load();

    return () => {
      isMounted = false;
    };
  }, [id]);

  const handleToggleSave = () => {
    progress.toggleSaved();
    trackEvent('tip_saved', 'TipDetail', { tip_id: id, saved: !progress.saved });
  };

  const handleToggleComplete = () => {
    progress.toggleCompleted();
    trackEvent('tip_completed', 'TipDetail', { tip_id: id, completed: !progress.completed });
  };

  const handleCtaClick = (destination: { to?: string; href?: string }) => {
    trackEvent('tip_cta_clicked', 'TipDetail', {
      tip_id: id,
      cta_type: tip?.ctaType,
      cta_target: destination.to || destination.href,
    });

    if (destination.to) {
      navigate(destination.to);
    } else if (destination.href) {
      window.open(destination.href, '_blank', 'noopener,noreferrer');
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 size={20} className="animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest">Loading…</p>
        </div>
      </div>
    );
  }

  if (loadError || !tip) {
    return (
      <div className="pb-10 space-y-6">
        <Link
          to="/tips"
          className="min-h-[44px] inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
        >
          <ArrowLeft size={18} />
          Tip Library
        </Link>

        <div className="min-h-[220px] rounded-3xl border border-white/10 bg-white/[0.03] p-6 flex flex-col items-center justify-center text-center">
          <p className="text-xl font-black uppercase tracking-tight text-white mb-2">
            Nothing hit for that
          </p>
          <p className="text-sm text-gray-400 max-w-sm">{loadError}</p>
        </div>
      </div>
    );
  }

  const ctaLabel = tip.ctaLabel || DEFAULT_CTA_LABEL[tip.ctaType];
  const ctaDestination = resolveCtaDestination(tip);
  const showCta = tip.ctaType !== 'none' && Boolean(ctaLabel);

  return (
    <div className="pb-10 space-y-6">
      <Link
        to="/tips"
        className="min-h-[44px] inline-flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
      >
        <ArrowLeft size={18} />
        Tip Library
      </Link>

      <motion.article
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        className="rounded-3xl border border-white/10 bg-brand-gray p-6 md:p-8 relative overflow-hidden"
      >
        <div className="absolute -top-24 -right-24 w-56 h-56 rounded-full bg-brand-accent/10 blur-3xl" />

        <div className="relative z-10 space-y-6">
          <div className="flex items-center justify-between gap-3 flex-wrap">
            <div className="flex flex-wrap items-center gap-2">
              <span className="px-3 py-1.5 rounded-full bg-brand-black border border-brand-accent/30 text-[9px] font-black uppercase tracking-widest text-brand-accent">
                {CONTENT_TYPE_LABEL[tip.contentType] || 'Tip'}
              </span>

              {tip.subjects.map((subject) => (
                <span
                  key={subject.slug}
                  className="px-3 py-1.5 rounded-full bg-brand-black border border-white/10 text-[9px] font-black uppercase tracking-widest text-gray-400"
                >
                  {subject.name}
                </span>
              ))}

              {tip.dayNumber && (
                <span className="text-[9px] font-bold uppercase tracking-widest text-gray-600">
                  Day {tip.dayNumber}
                </span>
              )}
            </div>

            {progress.isSignedIn && (
              <button
                type="button"
                onClick={handleToggleSave}
                aria-label={progress.saved ? 'Unsave this tip' : 'Save this tip'}
                className={`w-11 h-11 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
                  progress.saved
                    ? 'bg-brand-accent border-brand-accent text-brand-black'
                    : 'bg-brand-black border-white/10 text-gray-400 hover:text-white'
                }`}
              >
                <Bookmark size={18} className={progress.saved ? 'fill-current' : ''} />
              </button>
            )}
          </div>

          <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tight leading-[1.05] text-white">
            {tip.title}
          </h1>

          {tip.lesson && (
            <p className="text-base text-gray-300 leading-relaxed max-w-2xl">{tip.lesson}</p>
          )}

          {tip.takeaway && (
            <div className="rounded-2xl border border-white/10 bg-brand-black/60 p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent mb-2">
                Takeaway
              </p>
              <p className="text-sm md:text-base text-white font-medium leading-relaxed">
                {tip.takeaway}
              </p>
            </div>
          )}

          {tip.tryThis && (
            <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-5">
              <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
                Try This
              </p>
              <p className="text-sm md:text-base text-gray-300 leading-relaxed">{tip.tryThis}</p>
            </div>
          )}

          <div className="flex flex-col sm:flex-row gap-3 pt-2">
            {showCta && (
              <button
                type="button"
                onClick={() => handleCtaClick(ctaDestination)}
                className="min-h-[52px] flex-1 px-5 rounded-2xl bg-brand-accent text-brand-black text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-all"
              >
                {ctaLabel}
                {tip.ctaType === 'external' && <ExternalLink size={14} />}
              </button>
            )}

            {progress.isSignedIn && (
              <button
                type="button"
                onClick={handleToggleComplete}
                className={`min-h-[52px] px-5 rounded-2xl border text-[11px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all ${
                  progress.completed
                    ? 'bg-white/10 border-white/20 text-white'
                    : 'bg-transparent border-white/15 text-gray-300 hover:border-brand-accent/50 hover:text-white'
                }`}
              >
                {progress.completed ? (
                  <>
                    <CheckCircle2 size={16} className="text-brand-accent" />
                    Completed
                  </>
                ) : (
                  'Mark Complete'
                )}
              </button>
            )}
          </div>

          {!progress.isSignedIn && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
              Log in to save this lesson or mark it complete.
            </p>
          )}
        </div>
      </motion.article>
    </div>
  );
}
