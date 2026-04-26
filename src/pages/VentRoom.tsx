import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  MessageSquare,
  EyeOff,
  User,
  Send,
  AlertTriangle,
  Flame,
  ThumbsUp,
  Loader2,
  AlertCircle,
  Reply,
  Sparkles,
} from 'lucide-react';
import { FAKE_VENTS } from '../data';
import { supabase } from '../lib/supabase';
import { createReport } from '../lib/reports';

type VentPostMode = 'self' | 'anon';

type LocalVent = {
  id: string;
  userId: string;
  content: string;
  isAnonymous: boolean;
  createdAt: string;
  upvotes: number;
  avatarUrl?: string | null;
};

type SupabaseVentRow = {
  id: string;
  user_id: string | null;
  content: string;
  is_anonymous: boolean;
  upvotes: number;
  comment_count: number;
  created_at: string;
  profiles?: {
    avatar_url: string | null;
  } | null;
};

type VentComment = {
  id: string;
  ventId: string;
  content: string;
  isAnonymous: boolean;
  createdAt: string;
};

type SupabaseVentCommentRow = {
  id: string;
  vent_id: string;
  user_id: string | null;
  content: string;
  is_anonymous: boolean;
  created_at: string;
};

const STARTER_COMMENTS: VentComment[] = [
  {
    id: 'vc1',
    ventId: 'v1',
    content:
      'That “I’ll know it when I see it” line needs to come with a consultation fee.',
    isAnonymous: false,
    createdAt: '2024-03-22T10:00:00Z',
  },
  {
    id: 'vc2',
    ventId: 'v2',
    content:
      'Credits cost zero dollars. People act like tagging the team is a tax bracket.',
    isAnonymous: true,
    createdAt: '2024-03-22T12:00:00Z',
  },
];

function mapSupabaseVentToLocalVent(vent: SupabaseVentRow): LocalVent {
  return {
    id: vent.id,
    userId: vent.user_id || 'anon',
    content: vent.content,
    isAnonymous: vent.is_anonymous,
    createdAt: vent.created_at,
    upvotes: vent.upvotes || 0,
    avatarUrl: vent.profiles?.avatar_url || null,
  };
}

function mapSupabaseCommentToVentComment(
  comment: SupabaseVentCommentRow
): VentComment {
  return {
    id: comment.id,
    ventId: comment.vent_id,
    content: comment.content,
    isAnonymous: comment.is_anonymous,
    createdAt: comment.created_at,
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

  return date.toLocaleDateString();
}

function AnonymousAvatar() {
  return (
    <div className="w-full h-full flex items-center justify-center bg-brand-accent/10">
      <EyeOff size={16} className="text-brand-accent" />
    </div>
  );
}

export default function VentRoom() {
  const [ventText, setVentText] = useState('');
  const [postMode, setPostMode] = useState<VentPostMode>('anon');

  const [localVents, setLocalVents] = useState<LocalVent[]>([]);
  const [realVents, setRealVents] = useState<LocalVent[]>([]);
  const [isLoadingVents, setIsLoadingVents] = useState(true);
  const [ventError, setVentError] = useState('');
  const [isPostingVent, setIsPostingVent] = useState(false);

  const [upvoted, setUpvoted] = useState<Record<string, boolean>>({});
  const [isUpvoting, setIsUpvoting] = useState<Record<string, boolean>>({});
  const [upvoteErrors, setUpvoteErrors] = useState<Record<string, string>>({});

  const [isReporting, setIsReporting] = useState<Record<string, boolean>>({});
  const [reportMessages, setReportMessages] = useState<Record<string, string>>(
    {}
  );

  const [comments, setComments] = useState<VentComment[]>(STARTER_COMMENTS);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>(
    {}
  );
  const [commentModes, setCommentModes] = useState<Record<string, VentPostMode>>(
    {}
  );
  const [isPostingComment, setIsPostingComment] = useState<
    Record<string, boolean>
  >({});
  const [commentErrors, setCommentErrors] = useState<Record<string, string>>(
    {}
  );
  const [activeCommentVentId, setActiveCommentVentId] = useState<string | null>(
    null
  );

  const allVents =
    realVents.length > 0
      ? [...localVents, ...realVents]
      : [...localVents, ...(FAKE_VENTS as LocalVent[])];

  const isUsingFallbackVents = realVents.length === 0 && !isLoadingVents;
  const canPost = ventText.trim().length >= 5;

  const getCommentMode = (ventId: string): VentPostMode => {
    return commentModes[ventId] || 'anon';
  };

  const setCommentModeForVent = (ventId: string, mode: VentPostMode) => {
    setCommentModes((current) => ({
      ...current,
      [ventId]: mode,
    }));
  };

  const handleCommentChange = (ventId: string, value: string) => {
    setCommentDrafts((current) => ({
      ...current,
      [ventId]: value,
    }));
  };

  const updateVentCountInState = (ventId: string, nextUpvoteCount: number) => {
    setRealVents((current) =>
      current.map((vent) =>
        vent.id === ventId ? { ...vent, upvotes: nextUpvoteCount } : vent
      )
    );

    setLocalVents((current) =>
      current.map((vent) =>
        vent.id === ventId ? { ...vent, upvotes: nextUpvoteCount } : vent
      )
    );
  };

  const loadRealVents = async () => {
    setIsLoadingVents(true);
    setVentError('');

    try {
      const { data, error } = await supabase
        .from('vents')
        .select(
          `
          id,
          user_id,
          content,
          is_anonymous,
          upvotes,
          comment_count,
          created_at,
          profiles (
            avatar_url
          )
        `
        )
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) throw error;

      const mappedVents = (data || []).map((vent) =>
        mapSupabaseVentToLocalVent(vent as unknown as SupabaseVentRow)
      );

      setRealVents(mappedVents);

      const ventIds = mappedVents.map((vent) => vent.id);

      if (ventIds.length > 0) {
        const { data: commentData, error: commentError } = await supabase
          .from('vent_comments')
          .select(
            `
            id,
            vent_id,
            user_id,
            content,
            is_anonymous,
            created_at
          `
          )
          .in('vent_id', ventIds)
          .order('created_at', { ascending: false });

        if (commentError) throw commentError;

        const mappedComments = (commentData || []).map((comment) =>
          mapSupabaseCommentToVentComment(
            comment as unknown as SupabaseVentCommentRow
          )
        );

        setComments((current) => {
          const starterOnly = current.filter((comment) =>
            comment.ventId.startsWith('v')
          );

          return [...mappedComments, ...starterOnly];
        });
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user || ventIds.length === 0) {
        setUpvoted({});
        return;
      }

      const { data: upvoteData, error: upvoteError } = await supabase
        .from('vent_upvotes')
        .select('vent_id')
        .eq('user_id', user.id)
        .in('vent_id', ventIds);

      if (upvoteError) throw upvoteError;

      const nextUpvoted: Record<string, boolean> = {};

      (upvoteData || []).forEach((item) => {
        nextUpvoted[item.vent_id] = true;
      });

      setUpvoted(nextUpvoted);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong loading vents.';

      setVentError(message);
      setRealVents([]);
    } finally {
      setIsLoadingVents(false);
    }
  };

  useEffect(() => {
    loadRealVents();
  }, []);

  const handlePostVent = async () => {
    if (!canPost || isPostingVent) return;

    setIsPostingVent(true);
    setVentError('');

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error('You must be logged in to post a vent.');

      const { data, error } = await supabase
        .from('vents')
        .insert({
          user_id: user.id,
          content: ventText.trim(),
          is_anonymous: postMode === 'anon',
          upvotes: 0,
          comment_count: 0,
          is_hidden: false,
        })
        .select(
          `
          id,
          user_id,
          content,
          is_anonymous,
          upvotes,
          comment_count,
          created_at,
          profiles (
            avatar_url
          )
        `
        )
        .single();

      if (error) throw error;

      const newVent = mapSupabaseVentToLocalVent(
        data as unknown as SupabaseVentRow
      );

      setLocalVents((current) => [newVent, ...current]);
      setVentText('');
      setPostMode('anon');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong while posting your vent.';

      setVentError(message);
    } finally {
      setIsPostingVent(false);
    }
  };

  const toggleUpvote = async (vent: LocalVent) => {
    if (isUpvoting[vent.id]) return;

    setIsUpvoting((current) => ({
      ...current,
      [vent.id]: true,
    }));

    setUpvoteErrors((current) => ({
      ...current,
      [vent.id]: '',
    }));

    try {
      const isRealVent = realVents.some((realVent) => realVent.id === vent.id);
      const hasAlreadyUpvoted = Boolean(upvoted[vent.id]);

      if (!isRealVent) {
        setUpvoted((current) => ({
          ...current,
          [vent.id]: !current[vent.id],
        }));
        return;
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error('You must be logged in to upvote.');

      const currentUpvotes = vent.upvotes || 0;
      const nextUpvoteCount = hasAlreadyUpvoted
        ? Math.max(0, currentUpvotes - 1)
        : currentUpvotes + 1;

      if (hasAlreadyUpvoted) {
        const { error } = await supabase
          .from('vent_upvotes')
          .delete()
          .eq('vent_id', vent.id)
          .eq('user_id', user.id);

        if (error) throw error;
      } else {
        const { error } = await supabase.from('vent_upvotes').insert({
          vent_id: vent.id,
          user_id: user.id,
        });

        if (error) throw error;
      }

      const { error: updateError } = await supabase
        .from('vents')
        .update({ upvotes: nextUpvoteCount })
        .eq('id', vent.id);

      if (updateError) throw updateError;

      updateVentCountInState(vent.id, nextUpvoteCount);

      setUpvoted((current) => ({
        ...current,
        [vent.id]: !hasAlreadyUpvoted,
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong while updating your upvote.';

      setUpvoteErrors((current) => ({
        ...current,
        [vent.id]: message,
      }));
    } finally {
      setIsUpvoting((current) => ({
        ...current,
        [vent.id]: false,
      }));
    }
  };

  const handlePostComment = async (ventId: string) => {
    const draft = commentDrafts[ventId] || '';

    if (draft.trim().length < 2 || isPostingComment[ventId]) return;

    setIsPostingComment((current) => ({
      ...current,
      [ventId]: true,
    }));

    setCommentErrors((current) => ({
      ...current,
      [ventId]: '',
    }));

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;
      if (!user) throw new Error('You must be logged in to reply.');

      const { data, error } = await supabase
        .from('vent_comments')
        .insert({
          vent_id: ventId,
          user_id: user.id,
          content: draft.trim(),
          is_anonymous: getCommentMode(ventId) === 'anon',
        })
        .select(
          `
          id,
          vent_id,
          user_id,
          content,
          is_anonymous,
          created_at
        `
        )
        .single();

      if (error) throw error;

      const newComment = mapSupabaseCommentToVentComment(
        data as unknown as SupabaseVentCommentRow
      );

      setComments((current) => [newComment, ...current]);

      setCommentDrafts((current) => ({
        ...current,
        [ventId]: '',
      }));

      setCommentModeForVent(ventId, 'anon');
      setActiveCommentVentId(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong while posting your reply.';

      setCommentErrors((current) => ({
        ...current,
        [ventId]: message,
      }));
    } finally {
      setIsPostingComment((current) => ({
        ...current,
        [ventId]: false,
      }));
    }
  };

  const handleReportVent = async (ventId: string) => {
    if (isReporting[ventId]) return;

    const confirmed = window.confirm(
      'Report this vent for review? Use this for doxxing, harassment, threats, or content that breaks the community rules.'
    );

    if (!confirmed) return;

    setIsReporting((current) => ({
      ...current,
      [ventId]: true,
    }));

    setReportMessages((current) => ({
      ...current,
      [ventId]: '',
    }));

    try {
      await createReport({
        contentType: 'vent',
        contentId: ventId,
        reason: 'user_reported',
        details: 'Reported from the main Vent Room feed.',
      });

      setReportMessages((current) => ({
        ...current,
        [ventId]: 'Report sent. We’ll review it.',
      }));
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong while sending the report.';

      setReportMessages((current) => ({
        ...current,
        [ventId]: message,
      }));
    } finally {
      setIsReporting((current) => ({
        ...current,
        [ventId]: false,
      }));
    }
  };

  return (
    <div className="pb-10">
      <div className="max-w-2xl mx-auto space-y-5">
        {/* Header */}
        <section className="space-y-3">
          <div className="flex items-center gap-2 text-brand-accent">
            <MessageSquare size={18} />

            <p className="text-[10px] font-black uppercase tracking-[0.3em]">
              The Vent Room
            </p>
          </div>

          <div className="space-y-2">
            <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">
              Say the quiet part.
            </h1>

            <p className="text-sm md:text-base text-gray-400 font-medium leading-relaxed">
              Funny, honest, useful. No names. No doxxing. No personal attacks.
              Keep it creative, not cruel.
            </p>
          </div>
        </section>

        {/* Prompt */}
        <section className="relative overflow-hidden rounded-3xl border border-brand-accent/20 bg-brand-accent/10 p-5">
          <div className="absolute -right-8 -top-8 w-28 h-28 bg-brand-accent/20 rounded-full blur-2xl" />

          <div className="relative z-10 flex gap-3">
            <div className="w-10 h-10 rounded-2xl bg-brand-accent text-brand-black flex items-center justify-center flex-shrink-0">
              <Flame size={20} />
            </div>

            <div className="space-y-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent">
                Today’s spark
              </p>

              <p className="text-lg md:text-xl font-black uppercase tracking-tight leading-tight">
                What’s something clients, photographers, models, or creatives do
                that makes your eye twitch?
              </p>
            </div>
          </div>
        </section>

        {/* Composer */}
        <section className="bg-brand-gray border border-white/10 rounded-3xl p-4 md:p-5">
          <div className="flex gap-3">
            <div className="w-10 h-10 rounded-full border border-brand-accent/30 overflow-hidden flex-shrink-0">
              {postMode === 'anon' ? (
                <AnonymousAvatar />
              ) : (
                <div className="w-full h-full flex items-center justify-center bg-white/10">
                  <User size={16} className="text-white" />
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0 space-y-4">
              <textarea
                value={ventText}
                onChange={(event) => {
                  setVentText(event.target.value);
                  if (ventError) setVentError('');
                }}
                rows={4}
                placeholder="Drop the creative truth nobody says out loud..."
                className="w-full bg-transparent border-none p-0 text-base font-medium text-white placeholder:text-gray-600 focus:outline-none resize-none leading-relaxed"
              />

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-white/10">
                <div className="grid grid-cols-2 gap-2 sm:flex sm:w-auto">
                  <button
                    type="button"
                    onClick={() => setPostMode('self')}
                    className={`min-h-[40px] px-4 rounded-full border flex items-center justify-center gap-2 transition-all text-[9px] font-black uppercase tracking-widest ${postMode === 'self'
                        ? 'bg-brand-accent border-brand-accent text-brand-black'
                        : 'border-white/20 text-gray-500 hover:text-white'
                      }`}
                  >
                    <User size={14} />
                    As me
                  </button>

                  <button
                    type="button"
                    onClick={() => setPostMode('anon')}
                    className={`min-h-[40px] px-4 rounded-full border flex items-center justify-center gap-2 transition-all text-[9px] font-black uppercase tracking-widest ${postMode === 'anon'
                        ? 'bg-brand-accent border-brand-accent text-brand-black'
                        : 'border-white/20 text-gray-500 hover:text-white'
                      }`}
                  >
                    <EyeOff size={14} />
                    Anon
                  </button>
                </div>

                <button
                  type="button"
                  disabled={!canPost || isPostingVent}
                  onClick={handlePostVent}
                  className="min-h-[42px] px-5 bg-brand-accent text-brand-black rounded-full font-black uppercase text-[10px] tracking-[0.2em] disabled:opacity-20 flex items-center justify-center gap-2 hover:bg-white transition-all"
                >
                  {isPostingVent ? (
                    <>
                      <Loader2 size={14} className="animate-spin" />
                      Posting
                    </>
                  ) : (
                    <>
                      Post <Send size={14} />
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>

          {ventError && (
            <div className="mt-4 p-4 bg-brand-critique/10 border border-brand-critique/30 rounded-2xl flex items-start gap-3">
              <AlertCircle
                size={18}
                className="text-brand-critique flex-shrink-0 mt-0.5"
              />

              <p className="text-[10px] uppercase font-black tracking-widest text-brand-critique leading-relaxed">
                {ventError}
              </p>
            </div>
          )}
        </section>

        {/* Feed heading */}
        <section className="flex items-center justify-between px-1">
          <div className="flex items-center gap-2 text-gray-600">
            <Sparkles size={14} />

            <p className="text-[10px] font-black uppercase tracking-widest">
              Community threads
            </p>
          </div>

          <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent">
            Real talk only
          </p>
        </section>

        {/* Loading */}
        {isLoadingVents && (
          <div className="min-h-[120px] bg-brand-gray border border-white/10 rounded-3xl flex items-center justify-center">
            <div className="flex items-center gap-3 text-gray-500">
              <Loader2 size={18} className="animate-spin" />
              <span className="text-[10px] font-black uppercase tracking-widest">
                Loading vents...
              </span>
            </div>
          </div>
        )}

        {/* Fallback notice */}
        {isUsingFallbackVents && !ventError && (
          <div className="p-4 bg-white/[0.03] border border-white/10 rounded-2xl">
            <p className="text-[10px] uppercase font-black tracking-widest text-gray-600 leading-relaxed">
              No live vents found yet. Sample threads are showing until members
              start posting.
            </p>
          </div>
        )}

        {/* Feed */}
        <section className="bg-brand-gray border border-white/10 rounded-3xl overflow-hidden">
          {allVents.map((vent, index) => {
            const hasUpvoted = Boolean(upvoted[vent.id]);
            const upvoteCount = vent.upvotes;
            const isThisVentUpvoting = Boolean(isUpvoting[vent.id]);

            const ventComments = comments.filter(
              (comment) => comment.ventId === vent.id
            );
            const visibleComments = ventComments.slice(0, 2);
            const draft = commentDrafts[vent.id] || '';
            const mode = getCommentMode(vent.id);
            const canComment = draft.trim().length >= 2;
            const isCommentBoxOpen = activeCommentVentId === vent.id;

            return (
              <motion.article
                key={vent.id}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className={`p-4 md:p-5 hover:bg-white/[0.025] transition-all ${index !== allVents.length - 1 ? 'border-b border-white/10' : ''
                  }`}
              >
                <div className="flex gap-3">
                  {/* Avatar rail */}
                  <div className="flex flex-col items-center flex-shrink-0">
                    <div className="w-10 h-10 rounded-full bg-brand-black border border-white/10 overflow-hidden">
                      {vent.isAnonymous || !vent.avatarUrl ? (
                        <AnonymousAvatar />
                      ) : (
                        <img
                          src={vent.avatarUrl}
                          alt="Creative member"
                          className="w-full h-full object-cover"
                          draggable={false}
                          onError={(event) => {
                            event.currentTarget.style.display = 'none';
                          }}
                        />
                      )}
                    </div>

                    {(visibleComments.length > 0 || isCommentBoxOpen) && (
                      <div className="w-px flex-1 bg-white/10 mt-3" />
                    )}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0 space-y-3">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <p className="text-sm font-black uppercase tracking-tight truncate">
                            {vent.isAnonymous
                              ? 'Anonymous Creative'
                              : 'Creative Member'}
                          </p>

                          <span className="text-gray-700 text-xs">•</span>

                          <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                            {formatTimeAgo(vent.createdAt)}
                          </p>
                        </div>

                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-700 mt-1">
                          {vent.isAnonymous ? 'Identity hidden' : 'Posted openly'}
                        </p>
                      </div>

                      <button
                        type="button"
                        disabled={Boolean(isReporting[vent.id])}
                        onClick={() => handleReportVent(vent.id)}
                        className="min-h-[32px] px-3 rounded-full border border-white/10 text-gray-600 hover:text-brand-critique hover:border-brand-critique flex items-center gap-2 text-[8px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                      >
                        {isReporting[vent.id] ? (
                          <Loader2 size={11} className="animate-spin" />
                        ) : (
                          <AlertTriangle size={11} />
                        )}
                        Report
                      </button>
                    </div>

                    <p className="text-[15px] md:text-base text-gray-100 font-medium leading-relaxed whitespace-pre-wrap">
                      {vent.content}
                    </p>

                    {reportMessages[vent.id] && (
                      <div className="p-3 bg-brand-black/60 border border-white/10 rounded-2xl">
                        <p className="text-[9px] uppercase font-black tracking-widest text-gray-400 leading-relaxed">
                          {reportMessages[vent.id]}
                        </p>
                      </div>
                    )}

                    {upvoteErrors[vent.id] && (
                      <div className="p-3 bg-brand-critique/10 border border-brand-critique/30 rounded-2xl">
                        <p className="text-[9px] uppercase font-black tracking-widest text-brand-critique leading-relaxed">
                          {upvoteErrors[vent.id]}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="flex items-center gap-2 pt-1 flex-wrap">
                      <button
                        type="button"
                        disabled={isThisVentUpvoting}
                        onClick={() => toggleUpvote(vent)}
                        className={`min-h-[36px] px-3 rounded-full border flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${hasUpvoted
                            ? 'bg-brand-accent/15 border-brand-accent/40 text-brand-accent'
                            : 'border-white/10 text-gray-500 hover:text-white hover:border-white/20'
                          }`}
                      >
                        {isThisVentUpvoting ? (
                          <Loader2 size={14} className="animate-spin" />
                        ) : (
                          <ThumbsUp size={14} />
                        )}
                        {upvoteCount}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          setActiveCommentVentId((current) =>
                            current === vent.id ? null : vent.id
                          )
                        }
                        className={`min-h-[36px] px-3 rounded-full border flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all ${isCommentBoxOpen
                            ? 'bg-white/10 border-white/20 text-white'
                            : 'border-white/10 text-gray-500 hover:text-brand-accent hover:border-brand-accent/30'
                          }`}
                      >
                        <MessageSquare size={14} />
                        Reply
                      </button>

                      <Link
                        to={`/vents/${vent.id}`}
                        className="min-h-[36px] px-3 rounded-full border border-white/10 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:border-white/20 transition-all"
                      >
                        <Reply size={14} />
                        Thread
                      </Link>
                    </div>

                    {/* Reply preview */}
                    {visibleComments.length > 0 && (
                      <div className="mt-4 space-y-3">
                        {visibleComments.map((comment) => (
                          <div
                            key={comment.id}
                            className="rounded-2xl bg-brand-black/50 border border-white/5 p-3"
                          >
                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-600 mb-1">
                              {comment.isAnonymous
                                ? 'Anonymous Creative'
                                : 'Creative Member'}{' '}
                              • {formatTimeAgo(comment.createdAt)}
                            </p>

                            <p className="text-xs text-gray-300 leading-relaxed">
                              {comment.content}
                            </p>
                          </div>
                        ))}

                        {ventComments.length > 2 && (
                          <Link
                            to={`/vents/${vent.id}`}
                            className="inline-flex text-[10px] font-black uppercase tracking-widest text-brand-accent hover:text-white transition-all"
                          >
                            View all {ventComments.length} replies
                          </Link>
                        )}
                      </div>
                    )}

                    {/* Reply composer */}
                    {isCommentBoxOpen && (
                      <div className="mt-4 bg-brand-black/50 border border-white/10 rounded-3xl p-4 space-y-3">
                        <textarea
                          value={draft}
                          onChange={(event) =>
                            handleCommentChange(vent.id, event.target.value)
                          }
                          rows={3}
                          placeholder="Add a reply..."
                          className="w-full bg-transparent border-none p-0 text-sm font-medium text-white placeholder:text-gray-600 focus:outline-none resize-none leading-relaxed"
                        />

                        <div className="grid grid-cols-2 gap-2">
                          <button
                            type="button"
                            onClick={() =>
                              setCommentModeForVent(vent.id, 'self')
                            }
                            className={`min-h-[40px] rounded-full border flex items-center justify-center gap-2 transition-all text-[9px] font-black uppercase tracking-widest ${mode === 'self'
                                ? 'bg-brand-accent border-brand-accent text-brand-black'
                                : 'border-white/20 text-gray-500 hover:text-white'
                              }`}
                          >
                            <User size={14} />
                            As me
                          </button>

                          <button
                            type="button"
                            onClick={() =>
                              setCommentModeForVent(vent.id, 'anon')
                            }
                            className={`min-h-[40px] rounded-full border flex items-center justify-center gap-2 transition-all text-[9px] font-black uppercase tracking-widest ${mode === 'anon'
                                ? 'bg-brand-accent border-brand-accent text-brand-black'
                                : 'border-white/20 text-gray-500 hover:text-white'
                              }`}
                          >
                            <EyeOff size={14} />
                            Anon
                          </button>
                        </div>

                        <button
                          type="button"
                          disabled={
                            !canComment || Boolean(isPostingComment[vent.id])
                          }
                          onClick={() => handlePostComment(vent.id)}
                          className="w-full min-h-[44px] bg-white text-brand-black rounded-full font-black uppercase text-[10px] tracking-[0.2em] disabled:opacity-20 flex items-center justify-center gap-2 hover:bg-brand-accent transition-all"
                        >
                          {isPostingComment[vent.id] ? (
                            <>
                              <Loader2 size={14} className="animate-spin" />
                              Posting
                            </>
                          ) : (
                            <>
                              Reply <Send size={14} />
                            </>
                          )}
                        </button>

                        {commentErrors[vent.id] && (
                          <div className="p-3 bg-brand-critique/10 border border-brand-critique/30 rounded-2xl">
                            <p className="text-[9px] uppercase font-black tracking-widest text-brand-critique leading-relaxed">
                              {commentErrors[vent.id]}
                            </p>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </motion.article>
            );
          })}
        </section>
      </div>
    </div>
  );
}