import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Bookmark,
  BookOpen,
  CheckCircle2,
  Flame,
  Loader2,
  Search,
  Sparkles,
  X,
} from 'lucide-react';
import { useTipSubjects } from '../hooks/useTipSubjects';
import { useTipLibrary } from '../hooks/useTipLibrary';
import { useSavedTips } from '../hooks/useSavedTips';
import {
  TipCard as TipCardData,
  TipDifficulty,
  TipSort,
  TipView,
  fetchAllTipProgress,
} from '../lib/tipLibrary';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';

const DIFFICULTY_LABEL: Record<TipDifficulty, string> = {
  beginner: 'Beginner',
  intermediate: 'Intermediate',
  advanced: 'Advanced',
  everybody: 'Everybody',
};

const CONTENT_TYPE_LABEL: Record<string, string> = {
  tip: 'Tip',
  exercise: 'Exercise',
  challenge: 'Challenge',
  conversation: 'Conversation',
};

type FilterChip = { key: string; label: string; view?: TipView; difficulty?: TipDifficulty | null };

const FILTER_CHIPS: FilterChip[] = [
  { key: 'all', label: 'All', view: 'all' },
  { key: 'saved', label: 'Saved', view: 'saved' },
  { key: 'featured', label: 'Featured', view: 'featured' },
  { key: 'challenges', label: 'Challenges', view: 'challenges' },
  { key: 'beginner', label: 'Beginner', view: 'all', difficulty: 'beginner' },
  { key: 'intermediate', label: 'Intermediate', view: 'all', difficulty: 'intermediate' },
  { key: 'advanced', label: 'Advanced', view: 'all', difficulty: 'advanced' },
];

const SORT_OPTIONS: { value: TipSort; label: string }[] = [
  { value: 'recommended', label: 'Recommended' },
  { value: 'az', label: 'A–Z' },
  { value: 'day', label: 'Day Order' },
];

function TipCardTile({
  tip,
  onOpen,
  isSaved,
  isCompleted,
}: {
  tip: TipCardData;
  onOpen: () => void;
  isSaved: boolean;
  isCompleted: boolean;
}) {
  const isChallenge = tip.contentType === 'challenge';

  return (
    <motion.button
      type="button"
      onClick={onOpen}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`text-left rounded-3xl border p-5 relative overflow-hidden transition-all hover:border-brand-accent/40 ${
        isChallenge
          ? 'border-brand-accent/30 bg-brand-accent/[0.06]'
          : 'border-white/10 bg-brand-gray'
      }`}
    >
      {isChallenge && (
        <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-brand-accent/10 blur-3xl" />
      )}

      <div className="relative z-10 space-y-3">
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-wrap items-center gap-1.5">
            {tip.subjects.slice(0, 2).map((subject) => (
              <span
                key={subject.slug}
                className="px-2.5 py-1 rounded-full bg-brand-black border border-white/10 text-[9px] font-black uppercase tracking-widest text-brand-accent"
              >
                {subject.name}
              </span>
            ))}
          </div>

          {isSaved && <Bookmark size={16} className="fill-brand-accent text-brand-accent flex-shrink-0" />}
        </div>

        <p className="text-lg font-black uppercase tracking-tight leading-tight text-white">
          {tip.title}
        </p>

        <p className="text-sm text-gray-400 leading-relaxed line-clamp-2">
          {tip.lessonPreview}
        </p>

        <div className="flex items-center justify-between gap-2 pt-1">
          <div className="flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-500">
            <span className={isChallenge ? 'text-brand-accent' : ''}>
              {isChallenge && <Flame size={11} className="inline mr-1 -mt-0.5" />}
              {CONTENT_TYPE_LABEL[tip.contentType] || 'Tip'}
            </span>
            <span className="text-gray-700">•</span>
            <span>{DIFFICULTY_LABEL[tip.difficulty]}</span>
            {tip.dayNumber && (
              <>
                <span className="text-gray-700">•</span>
                <span className="text-gray-600">Day {tip.dayNumber}</span>
              </>
            )}
          </div>

          {isCompleted && <CheckCircle2 size={16} className="text-brand-accent flex-shrink-0" />}
        </div>
      </div>
    </motion.button>
  );
}

export default function TipLibrary() {
  const navigate = useNavigate();
  const { subjects, subjectIdBySlug, isLoading: subjectsLoading } = useTipSubjects();
  const savedTips = useSavedTips();

  const [searchInput, setSearchInput] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [selectedSubject, setSelectedSubject] = useState<string | null>(null);
  const [activeChip, setActiveChip] = useState('all');
  const [sort, setSort] = useState<TipSort>('recommended');
  const [savedTipIdSet, setSavedTipIdSet] = useState<Set<string>>(new Set());
  const [completedTipIdSet, setCompletedTipIdSet] = useState<Set<string>>(new Set());

  useEffect(() => {
    const timer = window.setTimeout(() => setDebouncedSearch(searchInput.trim()), 350);
    return () => window.clearTimeout(timer);
  }, [searchInput]);

  useEffect(() => {
    trackEvent('tip_library_opened', 'TipLibrary');
  }, []);

  useEffect(() => {
    setSavedTipIdSet(new Set(savedTips.tips.map((tip) => tip.id)));
  }, [savedTips.tips]);

  useEffect(() => {
    let isMounted = true;

    const loadCompleted = async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return;

      try {
        const progress = await fetchAllTipProgress(user.id);
        if (!isMounted) return;

        setCompletedTipIdSet(
          new Set(progress.filter((row) => row.completedAt).map((row) => row.tipId))
        );
      } catch (err) {
        console.warn('Could not load completed tips:', err);
      }
    };

    loadCompleted();

    return () => {
      isMounted = false;
    };
  }, []);

  const activeChipConfig = FILTER_CHIPS.find((chip) => chip.key === activeChip) || FILTER_CHIPS[0];

  const library = useTipLibrary({
    subjectIdBySlug,
    subjectSlug: selectedSubject,
    view: activeChipConfig.view,
    difficulty: activeChipConfig.difficulty ?? null,
    search: debouncedSearch,
    sort,
    pageSize: 60,
  });

  const featured = useTipLibrary({
    subjectIdBySlug,
    view: 'featured',
    pageSize: 6,
  });

  const isSearching = debouncedSearch.length > 0;

  const handleOpenTip = (tip: TipCardData) => {
    trackEvent('tip_opened', 'TipLibrary', { tip_id: tip.id, from: 'library' });
    navigate(`/tips/${tip.id}`);
  };

  const handleSelectSubject = (slug: string | null) => {
    setSelectedSubject((current) => (current === slug ? null : slug));
    if (slug) {
      trackEvent('tip_subject_selected', 'TipLibrary', { subject: slug });
    }
  };

  const handleChipSelect = (key: string) => {
    setActiveChip(key);
  };

  useEffect(() => {
    if (isSearching) {
      trackEvent('tip_search', 'TipLibrary', { query: debouncedSearch });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedSearch]);

  const showFeatured = !isSearching && !selectedSubject && activeChip === 'all' && featured.items.length > 0;
  const showSaved = !isSearching && !selectedSubject && activeChip === 'all' && savedTips.isSignedIn && savedTips.tips.length > 0;

  const browseHeading = useMemo(() => {
    if (isSearching) return `Results for “${debouncedSearch}”`;
    if (selectedSubject) {
      const subject = subjects.find((s) => s.slug === selectedSubject);
      return subject ? subject.name.toUpperCase() : 'BROWSE EVERYTHING';
    }
    if (activeChip !== 'all') {
      const chip = FILTER_CHIPS.find((c) => c.key === activeChip);
      return chip ? chip.label.toUpperCase() : 'BROWSE EVERYTHING';
    }
    return 'BROWSE EVERYTHING';
  }, [isSearching, debouncedSearch, selectedSubject, subjects, activeChip]);

  return (
    <div className="pb-10 space-y-8">
      <div className="space-y-2">
        <div className="flex items-center gap-2 text-brand-accent">
          <BookOpen size={18} />
          <p className="text-[10px] font-black uppercase tracking-[0.3em]">The Creative Review</p>
        </div>

        <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">
          Tip Library
        </h1>

        <p className="text-sm md:text-base text-gray-400 font-medium leading-relaxed max-w-xl">
          Learn what you need, when you need it.
        </p>
      </div>

      {/* Search */}
      <div className="sticky top-16 md:top-0 z-30 -mx-4 px-4 py-3 bg-brand-black/95 backdrop-blur-xl border-b border-white/10">
        <div className="relative max-w-5xl mx-auto">
          <Search
            size={18}
            className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500 pointer-events-none"
          />

          <input
            type="text"
            value={searchInput}
            onChange={(event) => setSearchInput(event.target.value)}
            placeholder="Search lighting, posing, pricing…"
            className="w-full min-h-[52px] bg-brand-gray border border-white/10 rounded-2xl pl-12 pr-10 text-sm font-medium text-white outline-none focus:border-brand-accent transition-all"
          />

          {searchInput && (
            <button
              type="button"
              onClick={() => setSearchInput('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-8 h-8 rounded-full flex items-center justify-center text-gray-500 hover:text-white transition-colors"
              aria-label="Clear search"
            >
              <X size={16} />
            </button>
          )}
        </div>
      </div>

      {!isSearching && (
        <section className="space-y-3">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-600 px-1">
            What do you need help with?
          </p>

          <div className="grid grid-cols-2 gap-2.5 md:flex md:gap-2.5 md:overflow-x-auto md:no-scrollbar md:pb-1">
            {subjectsLoading &&
              Array.from({ length: 6 }).map((_, index) => (
                <div
                  key={index}
                  className="h-[76px] rounded-2xl bg-brand-gray border border-white/10 animate-pulse md:min-w-[140px] md:flex-shrink-0"
                />
              ))}

            {!subjectsLoading &&
              subjects.map((subject) => {
                const isActive = selectedSubject === subject.slug;

                return (
                  <button
                    key={subject.slug}
                    type="button"
                    onClick={() => handleSelectSubject(subject.slug)}
                    className={`rounded-2xl border p-4 text-left transition-all md:min-w-[150px] md:flex-shrink-0 ${
                      isActive
                        ? 'bg-brand-accent border-brand-accent text-brand-black'
                        : 'bg-brand-gray border-white/10 text-white hover:border-brand-accent/40'
                    }`}
                  >
                    <p className="text-sm font-black uppercase tracking-tight leading-tight">
                      {subject.name}
                    </p>
                    <p
                      className={`text-[10px] font-bold uppercase tracking-widest mt-1 ${
                        isActive ? 'text-brand-black/70' : 'text-gray-500'
                      }`}
                    >
                      {subject.count} {subject.count === 1 ? 'lesson' : 'lessons'}
                    </p>
                  </button>
                );
              })}
          </div>
        </section>
      )}

      {!isSearching && (
        <section className="space-y-3">
          <div className="flex items-center justify-between gap-3 px-1">
            <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">
              Filter
            </p>

            <select
              value={sort}
              onChange={(event) => setSort(event.target.value as TipSort)}
              className="min-h-[36px] rounded-xl bg-brand-gray border border-white/10 px-3 text-[10px] font-black uppercase tracking-widest text-gray-300 outline-none focus:border-brand-accent"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
          </div>

          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {FILTER_CHIPS.map((chip) => {
              const isActive = activeChip === chip.key;

              return (
                <button
                  key={chip.key}
                  type="button"
                  onClick={() => handleChipSelect(chip.key)}
                  className={`min-h-[40px] px-4 rounded-full border flex items-center justify-center text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all flex-shrink-0 ${
                    isActive
                      ? 'bg-brand-accent border-brand-accent text-brand-black'
                      : 'border-white/10 bg-brand-gray text-gray-500 hover:text-white hover:border-white/20'
                  }`}
                >
                  {chip.label}
                </button>
              );
            })}
          </div>
        </section>
      )}

      {showFeatured && (
        <section className="space-y-3">
          <div className="flex items-center gap-2 px-1">
            <Sparkles size={14} className="text-brand-accent" />
            <p className="text-[10px] font-black uppercase tracking-widest text-white">Featured</p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {featured.items.map((tip) => (
              <TipCardTile
                key={tip.id}
                tip={tip}
                onOpen={() => handleOpenTip(tip)}
                isSaved={savedTipIdSet.has(tip.id)}
                isCompleted={completedTipIdSet.has(tip.id)}
              />
            ))}
          </div>
        </section>
      )}

      {showSaved && (
        <section className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-white">Saved</p>
              <p className="text-[10px] text-gray-600 mt-0.5">The stuff worth coming back to.</p>
            </div>

            <button
              type="button"
              onClick={() => setActiveChip('saved')}
              className="text-[9px] font-black uppercase tracking-widest text-brand-accent"
            >
              View all
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {savedTips.tips.slice(0, 4).map((tip) => (
              <TipCardTile
                key={tip.id}
                tip={tip}
                onOpen={() => handleOpenTip(tip)}
                isSaved
                isCompleted={completedTipIdSet.has(tip.id)}
              />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-3">
        <div className="flex items-center justify-between px-1">
          <p className="text-[10px] font-black uppercase tracking-widest text-white">
            {browseHeading}
          </p>

          {!library.isLoading && (
            <p className="text-[10px] font-bold uppercase tracking-widest text-gray-600">
              {library.total} {library.total === 1 ? 'result' : 'results'}
            </p>
          )}
        </div>

        {activeChip === 'saved' && !savedTips.isSignedIn && (
          <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-6 text-center">
            <Bookmark size={22} className="text-gray-600 mx-auto mb-3" />
            <p className="text-sm text-gray-400">Log in to save lessons for later.</p>
          </div>
        )}

        {library.isLoading && (
          <div className="min-h-[220px] rounded-3xl border border-white/10 bg-brand-gray flex items-center justify-center">
            <div className="flex items-center gap-3 text-gray-500">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-widest">Loading…</span>
            </div>
          </div>
        )}

        {library.error && !library.isLoading && (
          <div className="rounded-3xl border border-brand-accent/30 bg-brand-accent/10 p-5">
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent leading-relaxed">
              {library.error}
            </p>
          </div>
        )}

        {!library.isLoading &&
          !library.error &&
          library.items.length === 0 &&
          activeChip !== 'saved' && (
            <div className="min-h-[220px] rounded-3xl border border-white/10 bg-white/[0.03] p-6 flex flex-col items-center justify-center text-center">
              <Sparkles size={26} className="text-brand-accent mb-4" />
              <p className="text-xl font-black uppercase tracking-tight text-white mb-2">
                Nothing hit for that
              </p>
              <p className="text-sm text-gray-400 max-w-sm">
                Try another subject or search.
              </p>
            </div>
          )}

        {!library.isLoading && !library.error && library.items.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {library.items.map((tip) => (
              <TipCardTile
                key={tip.id}
                tip={tip}
                onOpen={() => handleOpenTip(tip)}
                isSaved={savedTipIdSet.has(tip.id)}
                isCompleted={completedTipIdSet.has(tip.id)}
              />
            ))}
          </div>
        )}
      </section>

      <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-center">
        <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed text-gray-500">
          Want the daily rhythm instead?{' '}
          <Link to="/dashboard" className="text-brand-accent">
            Back to today's tip
          </Link>
        </p>
      </div>
    </div>
  );
}
