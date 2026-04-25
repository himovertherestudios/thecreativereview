import React, { useEffect, useMemo, useState } from 'react';
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
  AtSign,
  Reply,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { FAKE_CREATORS, FAKE_VENTS } from '../data';
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
};

type SupabaseVentRow = {
  id: string;
  user_id: string | null;
  content: string;
  is_anonymous: boolean;
  upvotes: number;
  comment_count: number;
  created_at: string;
};

function mapSupabaseVentToLocalVent(vent: SupabaseVentRow): LocalVent {
  return {
    id: vent.id,
    userId: vent.user_id || 'anon',
    content: vent.content,
    isAnonymous: vent.is_anonymous,
    createdAt: vent.created_at,
    upvotes: vent.upvotes || 0,
  };
}

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

type CommentReply = {
  id: string;
  commentId: string;
  content: string;
  isAnonymous: boolean;
  createdAt: string;
};

type SupabaseVentReplyRow = {
  id: string;
  comment_id: string;
  user_id: string | null;
  content: string;
  is_anonymous: boolean;
  created_at: string;
};

function mapSupabaseReplyToCommentReply(
  reply: SupabaseVentReplyRow
): CommentReply {
  return {
    id: reply.id,
    commentId: reply.comment_id,
    content: reply.content,
    isAnonymous: reply.is_anonymous,
    createdAt: reply.created_at,
  };
}

const STARTER_COMMENTS: VentComment[] = [
  {
    id: 'vc1',
    ventId: 'v1',
    content:
      'That “I’ll know it when I see it” line needs to come with a consultation fee. @arivers_clicks called this.',
    isAnonymous: false,
    createdAt: '2024-03-22T10:00:00Z',
  },
  {
    id: 'vc1b',
    ventId: 'v1',
    content:
      'Moodboards are not decorations. They are the map. Follow the map.',
    isAnonymous: true,
    createdAt: '2024-03-22T10:05:00Z',
  },
  {
    id: 'vc1c',
    ventId: 'v1',
    content:
      'This is why I started charging for pre-production calls. The confusion has a price now.',
    isAnonymous: false,
    createdAt: '2024-03-22T10:10:00Z',
  },
  {
    id: 'vc2',
    ventId: 'v2',
    content:
      'Credits cost zero dollars. People act like tagging the team is a tax bracket.',
    isAnonymous: true,
    createdAt: '2024-03-22T12:00:00Z',
  },
  {
    id: 'vc2b',
    ventId: 'v2',
    content:
      'The makeup artist, stylist, assistant, and model all helped make the image work. Tag the people.',
    isAnonymous: false,
    createdAt: '2024-03-22T12:05:00Z',
  },
];

const STARTER_REPLIES: CommentReply[] = [
  {
    id: 'reply-1',
    commentId: 'vc1',
    content: 'Facts. “I’ll know it when I see it” should trigger an invoice.',
    isAnonymous: true,
    createdAt: '2024-03-22T10:15:00Z',
  },
  {
    id: 'reply-2',
    commentId: 'vc2',
    content: '@mayavossmua would definitely say tag the whole team.',
    isAnonymous: false,
    createdAt: '2024-03-22T12:10:00Z',
  },
];

function getMentionQuery(text: string) {
  const match = text.match(/@([a-zA-Z0-9_]*)$/);
  return match ? match[1].toLowerCase() : null;
}

function renderTextWithMentions(text: string) {
  const parts = text.split(/(@[a-zA-Z0-9_]+)/g);

  return parts.map((part, index) => {
    if (part.startsWith('@')) {
      return (
        <span key={`${part}-${index}`} className="text-brand-accent font-black">
          {part}
        </span>
      );
    }

    return <span key={`${part}-${index}`}>{part}</span>;
  });
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
  const [reportMessages, setReportMessages] = useState<Record<string, string>>({});

  const [comments, setComments] = useState<VentComment[]>(STARTER_COMMENTS);
  const [commentDrafts, setCommentDrafts] = useState<Record<string, string>>({});
  const [commentModes, setCommentModes] = useState<Record<string, VentPostMode>>(
    {}
  );

  const [isPostingComment, setIsPostingComment] = useState<Record<string, boolean>>({});
  const [commentErrors, setCommentErrors] = useState<Record<string, string>>({});

  const [replies, setReplies] = useState<CommentReply[]>(STARTER_REPLIES);
  const [activeReplyCommentId, setActiveReplyCommentId] = useState<string | null>(
    null
  );
  const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
  const [replyModes, setReplyModes] = useState<Record<string, VentPostMode>>({});
  const [isPostingReply, setIsPostingReply] = useState<Record<string, boolean>>({});
  const [replyErrors, setReplyErrors] = useState<Record<string, string>>({});

  const allVents =
    realVents.length > 0
      ? [...localVents, ...realVents]
      : [...localVents, ...FAKE_VENTS];

  const isUsingFallbackVents = realVents.length === 0 && !isLoadingVents;

  const canPost = ventText.trim().length >= 5;

  const activeReplyText = activeReplyCommentId
    ? replyDrafts[activeReplyCommentId] || ''
    : '';

  const replyMentionQuery = getMentionQuery(activeReplyText);

  const replyMentionSuggestions = useMemo(() => {
    if (replyMentionQuery === null) return [];

    return FAKE_CREATORS.filter((creator) =>
      creator.username.toLowerCase().includes(replyMentionQuery)
    ).slice(0, 4);
  }, [replyMentionQuery]);

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

  const handleReportContent = async (
    contentType: 'vent_comment' | 'vent_reply',
    contentId: string
  ) => {
    const reportKey = `${contentType}-${contentId}`;

    if (isReporting[reportKey]) return;

    const label = contentType === 'vent_comment' ? 'comment' : 'reply';

    const confirmed = window.confirm(
      `Report this ${label} for review? Use this for doxxing, harassment, threats, or content that breaks the community rules.`
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
        details: `Reported ${label} from the main Vent Room feed.`,
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
        created_at
      `
        )
        .eq('is_hidden', false)
        .order('created_at', { ascending: false })
        .limit(30);

      if (error) {
        throw error;
      }

      const mappedVents = (data || []).map((vent) =>
        mapSupabaseVentToLocalVent(vent as unknown as SupabaseVentRow)
      );

      setRealVents(mappedVents);
      const ventIdsForComments = mappedVents.map((vent) => vent.id);

      if (ventIdsForComments.length > 0) {
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
          .in('vent_id', ventIdsForComments)
          .order('created_at', { ascending: false });

        if (commentError) {
          throw commentError;
        }

        const mappedComments = (commentData || []).map((comment) =>
          mapSupabaseCommentToVentComment(
            comment as unknown as SupabaseVentCommentRow
          )
        );

        setComments((current) => {
          const starterCommentsOnly = current.filter((comment) =>
            comment.ventId.startsWith('v')
          );

          return [...mappedComments, ...starterCommentsOnly];
        });
        const commentIdsForReplies = mappedComments.map((comment) => comment.id);

        if (commentIdsForReplies.length > 0) {
          const { data: replyData, error: replyError } = await supabase
            .from('vent_replies')
            .select(
              `
      id,
      comment_id,
      user_id,
      content,
      is_anonymous,
      created_at
    `
            )
            .in('comment_id', commentIdsForReplies)
            .order('created_at', { ascending: false });

          if (replyError) {
            throw replyError;
          }

          const mappedReplies = (replyData || []).map((reply) =>
            mapSupabaseReplyToCommentReply(
              reply as unknown as SupabaseVentReplyRow
            )
          );

          setReplies((current) => {
            const starterRepliesOnly = current.filter((reply) =>
              reply.commentId.startsWith('vc')
            );

            return [...mappedReplies, ...starterRepliesOnly];
          });
        }
      }

      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user || mappedVents.length === 0) {
        setUpvoted({});
        return;
      }

      const ventIds = mappedVents.map((vent) => vent.id);

      const { data: upvoteData, error: upvoteError } = await supabase
        .from('vent_upvotes')
        .select('vent_id')
        .eq('user_id', user.id)
        .in('vent_id', ventIds);

      if (upvoteError) {
        throw upvoteError;
      }

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

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error('You must be logged in to post a vent.');
      }

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
        created_at
      `
        )
        .single();

      if (error) {
        throw error;
      }

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

  const updateVentCountInState = (ventId: string, nextUpvoteCount: number) => {
    setRealVents((current) =>
      current.map((vent) =>
        vent.id === ventId
          ? {
            ...vent,
            upvotes: nextUpvoteCount,
          }
          : vent
      )
    );

    setLocalVents((current) =>
      current.map((vent) =>
        vent.id === ventId
          ? {
            ...vent,
            upvotes: nextUpvoteCount,
          }
          : vent
      )
    );
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

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error('You must be logged in to upvote.');
      }

      const currentUpvotes = vent.upvotes || 0;

      if (hasAlreadyUpvoted) {
        const { error: deleteError } = await supabase
          .from('vent_upvotes')
          .delete()
          .eq('vent_id', vent.id)
          .eq('user_id', user.id);

        if (deleteError) {
          throw deleteError;
        }

        const nextUpvoteCount = Math.max(0, currentUpvotes - 1);

        const { data: updatedVent, error: updateError } = await supabase
          .from('vents')
          .update({
            upvotes: nextUpvoteCount,
          })
          .eq('id', vent.id)
          .select(
            `
          id,
          user_id,
          content,
          is_anonymous,
          upvotes,
          comment_count,
          created_at
        `
          )
          .single();

        if (updateError) {
          throw updateError;
        }

        const mappedVent = mapSupabaseVentToLocalVent(
          updatedVent as unknown as SupabaseVentRow
        );

        updateVentCountInState(vent.id, mappedVent.upvotes);

        setUpvoted((current) => ({
          ...current,
          [vent.id]: false,
        }));
      } else {
        const { error: insertError } = await supabase
          .from('vent_upvotes')
          .insert({
            vent_id: vent.id,
            user_id: user.id,
          });

        if (insertError) {
          throw insertError;
        }

        const nextUpvoteCount = currentUpvotes + 1;

        const { data: updatedVent, error: updateError } = await supabase
          .from('vents')
          .update({
            upvotes: nextUpvoteCount,
          })
          .eq('id', vent.id)
          .select(
            `
          id,
          user_id,
          content,
          is_anonymous,
          upvotes,
          comment_count,
          created_at
        `
          )
          .single();

        if (updateError) {
          throw updateError;
        }

        const mappedVent = mapSupabaseVentToLocalVent(
          updatedVent as unknown as SupabaseVentRow
        );

        updateVentCountInState(vent.id, mappedVent.upvotes);

        setUpvoted((current) => ({
          ...current,
          [vent.id]: true,
        }));
      }
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

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error('You must be logged in to comment.');
      }

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

      if (error) {
        throw error;
      }

      const newComment = mapSupabaseCommentToVentComment(
        data as unknown as SupabaseVentCommentRow
      );

      setComments((current) => [newComment, ...current]);

      const nextCommentCount =
        comments.filter((comment) => comment.ventId === ventId).length + 1;

      const { error: ventUpdateError } = await supabase
        .from('vents')
        .update({
          comment_count: nextCommentCount,
        })
        .eq('id', ventId);

      if (ventUpdateError) {
        throw ventUpdateError;
      }

      setCommentDrafts((current) => ({
        ...current,
        [ventId]: '',
      }));

      setCommentModeForVent(ventId, 'anon');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong while posting your comment.';

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

  const getReplyMode = (commentId: string): VentPostMode => {
    return replyModes[commentId] || 'anon';
  };

  const setReplyModeForComment = (commentId: string, mode: VentPostMode) => {
    setReplyModes((current) => ({
      ...current,
      [commentId]: mode,
    }));
  };

  const handleReplyChange = (commentId: string, value: string) => {
    setReplyDrafts((current) => ({
      ...current,
      [commentId]: value,
    }));
  };

  const insertReplyMention = (commentId: string, username: string) => {
    setReplyDrafts((current) => ({
      ...current,
      [commentId]: (current[commentId] || '').replace(
        /@([a-zA-Z0-9_]*)$/,
        `@${username} `
      ),
    }));
  };

  const handlePostReply = async (commentId: string) => {
    const draft = replyDrafts[commentId] || '';

    if (draft.trim().length < 2 || isPostingReply[commentId]) return;

    setIsPostingReply((current) => ({
      ...current,
      [commentId]: true,
    }));

    setReplyErrors((current) => ({
      ...current,
      [commentId]: '',
    }));

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error('You must be logged in to reply.');
      }

      const { data, error } = await supabase
        .from('vent_replies')
        .insert({
          comment_id: commentId,
          user_id: user.id,
          content: draft.trim(),
          is_anonymous: getReplyMode(commentId) === 'anon',
        })
        .select(
          `
        id,
        comment_id,
        user_id,
        content,
        is_anonymous,
        created_at
      `
        )
        .single();

      if (error) {
        throw error;
      }

      const newReply = mapSupabaseReplyToCommentReply(
        data as unknown as SupabaseVentReplyRow
      );

      setReplies((current) => [newReply, ...current]);

      setReplyDrafts((current) => ({
        ...current,
        [commentId]: '',
      }));

      setReplyModeForComment(commentId, 'anon');
      setActiveReplyCommentId(null);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong while posting your reply.';

      setReplyErrors((current) => ({
        ...current,
        [commentId]: message,
      }));
    } finally {
      setIsPostingReply((current) => ({
        ...current,
        [commentId]: false,
      }));
    }
  };

  return (
    <div className="space-y-6 pb-10">
      {/* Header */}
      <section className="bg-brand-gray border border-white/10 rounded-3xl p-5 md:p-8 space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-2xl bg-brand-accent/10 flex items-center justify-center text-brand-accent">
            <MessageSquare size={22} />
          </div>

          <div>
            <p className="text-brand-accent text-[10px] font-black uppercase tracking-[0.25em]">
              The Vent Room
            </p>

            <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">
              Let It Out
            </h1>
          </div>
        </div>

        <p className="text-sm md:text-base text-gray-400 font-medium leading-relaxed max-w-2xl">
          Say the creative thing you probably shouldn’t put on Instagram. Keep it
          funny, honest, and useful. No doxxing. No names. No personal attacks.
        </p>
      </section>

      {/* Vent of the Day */}
      <section className="bg-brand-gray border border-brand-accent/20 rounded-3xl p-5 md:p-6">
        <div className="flex items-center gap-2 mb-3">
          <Flame size={16} className="text-brand-accent" />

          <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent">
            Vent of the Day
          </p>
        </div>

        <p className="text-xl md:text-2xl font-black uppercase tracking-tight leading-tight">
          What’s something clients, photographers, models, or creatives do that
          makes your eye twitch?
        </p>
      </section>

      {/* Post Form */}
      <section className="bg-brand-gray border border-white/10 rounded-3xl p-5 md:p-6 space-y-5">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
            Drop your vent
          </label>

          <textarea
            value={ventText}
            onChange={(event) => {
              setVentText(event.target.value);
              if (ventError) setVentError('');
            }}
            rows={5}
            placeholder="Example: When someone asks for a full shoot, edits, BTS, and same-day delivery for exposure..."
            className="w-full bg-brand-black border border-white/10 rounded-2xl p-4 text-sm font-medium focus:border-brand-accent outline-none resize-none transition-all"
          />
        </div>

        <div className="flex items-start gap-3 p-4 bg-brand-black/60 rounded-2xl border border-brand-critique/20">
          <AlertTriangle
            size={18}
            className="text-brand-critique flex-shrink-0 mt-0.5"
          />

          <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 leading-relaxed">
            Don’t name-drop, dox, expose private messages, or attack somebody’s
            body. Vent about the behavior, not the person.
          </p>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setPostMode('self')}
            className={`min-h-[54px] rounded-2xl border flex items-center justify-center gap-2 transition-all text-[10px] font-black uppercase tracking-widest ${postMode === 'self'
              ? 'bg-brand-accent border-brand-accent text-brand-black'
              : 'border-white/20 text-gray-500 hover:text-white'
              }`}
          >
            <User size={16} />
            Post as me
          </button>

          <button
            type="button"
            onClick={() => setPostMode('anon')}
            className={`min-h-[54px] rounded-2xl border flex items-center justify-center gap-2 transition-all text-[10px] font-black uppercase tracking-widest ${postMode === 'anon'
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
          disabled={!canPost || isPostingVent}
          onClick={handlePostVent}
          className="w-full min-h-[56px] bg-brand-accent text-brand-black rounded-2xl font-black uppercase text-xs tracking-[0.2em] disabled:opacity-20 flex items-center justify-center gap-2"
        >
          {isPostingVent ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Posting Vent
            </>
          ) : (
            <>
              Post Vent <Send size={16} />
            </>
          )}
        </button>

        {ventError && (
          <div className="p-4 bg-brand-critique/10 border border-brand-critique/30 rounded-2xl flex items-start gap-3">
            <AlertCircle
              size={18}
              className="text-brand-critique flex-shrink-0 mt-0.5"
            />

            <p className="text-[10px] uppercase font-black tracking-widest text-brand-critique leading-relaxed">
              {ventError}
            </p>
          </div>
        )}

        {!canPost && (
          <p className="text-center text-[10px] text-gray-500 uppercase tracking-widest">
            Give us at least 5 characters of creative frustration.
          </p>
        )}
      </section>

      {/* Vents Feed */}
      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">
            Community vents
          </p>

          {isLoadingVents && (
            <div className="min-h-[120px] bg-brand-gray border border-white/10 rounded-3xl flex items-center justify-center">
              <div className="flex items-center gap-3 text-gray-500">
                <Loader2 size={18} className="animate-spin" />
                <span className="text-[10px] font-black uppercase tracking-widest">
                  Loading live vents...
                </span>
              </div>
            </div>
          )}

          {isUsingFallbackVents && !ventError && (
            <div className="p-4 bg-brand-accent/5 border border-brand-accent/10 rounded-2xl">
              <p className="text-[10px] uppercase font-black tracking-widest text-gray-500 leading-relaxed">
                No live Supabase vents found yet, so the prototype vents are showing.
                Once you post a real vent, live vents will appear here.
              </p>
            </div>
          )}

          <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">
            Thread previews
          </p>
        </div>

        {allVents.map((vent) => {
          const hasUpvoted = Boolean(upvoted[vent.id]);
          const upvoteCount = vent.upvotes;
          const isThisVentUpvoting = Boolean(isUpvoting[vent.id]);

          const ventComments = comments.filter(
            (comment) => comment.ventId === vent.id
          );
          const previewComments = ventComments.slice(0, 2);

          const draft = commentDrafts[vent.id] || '';
          const mode = getCommentMode(vent.id);
          const canComment = draft.trim().length >= 2;

          return (
            <motion.article
              key={vent.id}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              className="bg-brand-gray border border-white/10 rounded-3xl p-5 space-y-5"
            >
              <div className="space-y-4">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center flex-shrink-0">
                      {vent.isAnonymous ? (
                        <EyeOff size={16} className="text-brand-accent" />
                      ) : (
                        <User size={16} className="text-brand-accent" />
                      )}
                    </div>

                    <div className="min-w-0">
                      <p className="text-xs font-black uppercase tracking-widest truncate">
                        {vent.isAnonymous ? 'Anonymous Creative' : 'Creative Member'}
                      </p>

                      <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                        {formatTimeAgo(vent.createdAt)}
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    disabled={isThisVentUpvoting}
                    onClick={() => toggleUpvote(vent)}
                    className={`min-h-[40px] px-3 rounded-full border flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${hasUpvoted
                      ? 'bg-brand-accent border-brand-accent text-brand-black'
                      : 'border-white/10 text-gray-500 hover:text-white'
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
                    disabled={Boolean(isReporting[vent.id])}
                    onClick={() => handleReportVent(vent.id)}
                    className="min-h-[40px] px-3 rounded-full border border-white/10 text-gray-500 hover:text-brand-critique hover:border-brand-critique flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all disabled:opacity-50"
                  >
                    {isReporting[vent.id] ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Reporting
                      </>
                    ) : (
                      <>
                        <AlertTriangle size={14} />
                        Report
                      </>
                    )}
                  </button>

                </div>

                <p className="text-sm md:text-base text-gray-200 font-medium leading-relaxed">
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

              </div>

              {/* Comments Preview */}
              <div className="border-t border-white/10 pt-4 space-y-4">
                <div className="flex items-center justify-between">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    {ventComments.length} comments
                  </p>

                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-700">
                    Previewing 2 max
                  </p>
                </div>

                {previewComments.length > 0 && (
                  <div className="space-y-4">
                    {previewComments.map((comment) => {
                      const commentReplies = replies.filter(
                        (replyItem) => replyItem.commentId === comment.id
                      );
                      const previewReplies = commentReplies.slice(0, 1);
                      const isReplyOpen = activeReplyCommentId === comment.id;
                      const replyText = replyDrafts[comment.id] || '';
                      const replyMode = getReplyMode(comment.id);
                      const canReply = replyText.trim().length >= 2;

                      return (
                        <div
                          key={comment.id}
                          className="bg-brand-black/60 border border-white/5 rounded-2xl p-4 space-y-3"
                        >
                          <div className="flex items-center gap-2">
                            <div className="w-6 h-6 rounded-full bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center">
                              {comment.isAnonymous ? (
                                <EyeOff size={12} className="text-brand-accent" />
                              ) : (
                                <User size={12} className="text-brand-accent" />
                              )}
                            </div>

                            <div>
                              <p className="text-[10px] font-black uppercase tracking-widest text-gray-400">
                                {comment.isAnonymous
                                  ? 'Anonymous Creative'
                                  : 'Creative Member'}
                              </p>

                              <p className="text-[8px] font-bold uppercase tracking-widest text-gray-700">
                                {formatTimeAgo(comment.createdAt)}
                              </p>
                            </div>
                          </div>

                          <p className="text-xs md:text-sm text-gray-300 leading-relaxed">
                            {renderTextWithMentions(comment.content)}
                          </p>

                          <div className="flex items-center gap-3 flex-wrap">
                            <button
                              type="button"
                              onClick={() =>
                                setActiveReplyCommentId((current) =>
                                  current === comment.id ? null : comment.id
                                )
                              }
                              className="min-h-[34px] px-3 rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-white hover:border-brand-accent flex items-center gap-2 transition-all"
                            >
                              <Reply size={13} />
                              Reply
                            </button>

                            <button
                              type="button"
                              disabled={Boolean(isReporting[`vent_comment-${comment.id}`])}
                              onClick={() => handleReportContent('vent_comment', comment.id)}
                              className="min-h-[34px] px-3 rounded-full border border-white/10 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-brand-critique hover:border-brand-critique flex items-center gap-2 transition-all disabled:opacity-50"
                            >
                              {isReporting[`vent_comment-${comment.id}`] ? (
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

                            <p className="text-[9px] font-black uppercase tracking-widest text-gray-700">
                              {commentReplies.length} replies
                            </p>
                          </div>

                          {reportMessages[`vent_comment-${comment.id}`] && (
                            <div className="p-3 bg-brand-black/60 border border-white/10 rounded-2xl">
                              <p className="text-[9px] uppercase font-black tracking-widest text-gray-400 leading-relaxed">
                                {reportMessages[`vent_comment-${comment.id}`]}
                              </p>
                            </div>
                          )}

                          {previewReplies.length > 0 && (
                            <div className="ml-4 pl-4 border-l border-white/10 space-y-2">
                              {previewReplies.map((replyItem) => (
                                <div
                                  key={replyItem.id}
                                  className="bg-brand-gray/70 border border-white/5 rounded-2xl p-3 space-y-2"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-5 h-5 rounded-full bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center">
                                      {replyItem.isAnonymous ? (
                                        <EyeOff
                                          size={10}
                                          className="text-brand-accent"
                                        />
                                      ) : (
                                        <User
                                          size={10}
                                          className="text-brand-accent"
                                        />
                                      )}
                                    </div>

                                    <div>
                                      <p className="text-[8px] font-black uppercase tracking-widest text-gray-400">
                                        {replyItem.isAnonymous
                                          ? 'Anonymous Creative'
                                          : 'Creative Member'}
                                      </p>

                                      <p className="text-[7px] font-bold uppercase tracking-widest text-gray-700">
                                        {formatTimeAgo(replyItem.createdAt)}
                                      </p>
                                    </div>
                                  </div>

                                  <p className="text-xs text-gray-300 leading-relaxed">
                                    {renderTextWithMentions(replyItem.content)}
                                  </p>
                                  <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                      type="button"
                                      disabled={Boolean(isReporting[`vent_reply-${replyItem.id}`])}
                                      onClick={() => handleReportContent('vent_reply', replyItem.id)}
                                      className="min-h-[30px] px-3 rounded-full border border-white/10 text-[8px] font-black uppercase tracking-widest text-gray-500 hover:text-brand-critique hover:border-brand-critique flex items-center gap-2 transition-all disabled:opacity-50"
                                    >
                                      {isReporting[`vent_reply-${replyItem.id}`] ? (
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

                                  {reportMessages[`vent_reply-${replyItem.id}`] && (
                                    <div className="p-3 bg-brand-black/60 border border-white/10 rounded-2xl">
                                      <p className="text-[8px] uppercase font-black tracking-widest text-gray-400 leading-relaxed">
                                        {reportMessages[`vent_reply-${replyItem.id}`]}
                                      </p>
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          )}

                          {isReplyOpen && (
                            <div className="ml-4 pl-4 border-l border-brand-accent/30 space-y-3">
                              <div className="relative">
                                <textarea
                                  value={replyText}
                                  onChange={(event) =>
                                    handleReplyChange(comment.id, event.target.value)
                                  }
                                  rows={3}
                                  placeholder="Reply to this comment... type @ to tag"
                                  className="w-full bg-brand-black border border-white/10 rounded-2xl p-4 text-sm font-medium focus:border-brand-accent outline-none resize-none transition-all"
                                />

                                {activeReplyCommentId === comment.id &&
                                  replyMentionSuggestions.length > 0 && (
                                    <div className="absolute left-0 right-0 top-full z-30 mt-2 bg-brand-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                                      <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                                        <AtSign
                                          size={14}
                                          className="text-brand-accent"
                                        />

                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                          Tag a member
                                        </p>
                                      </div>

                                      <div className="p-2 space-y-1">
                                        {replyMentionSuggestions.map((creator) => (
                                          <button
                                            key={creator.id}
                                            type="button"
                                            onClick={() =>
                                              insertReplyMention(
                                                comment.id,
                                                creator.username
                                              )
                                            }
                                            className="w-full min-h-[54px] px-3 rounded-xl flex items-center gap-3 text-left hover:bg-white/5 transition-all"
                                          >
                                            <img
                                              src={creator.avatarUrl}
                                              alt={creator.displayName}
                                              className="w-9 h-9 rounded-full object-cover"
                                              draggable={false}
                                            />

                                            <div className="min-w-0">
                                              <p className="text-xs font-black uppercase tracking-widest truncate">
                                                {creator.displayName}
                                              </p>

                                              <p className="text-[10px] font-bold uppercase tracking-widest text-brand-accent truncate">
                                                @{creator.username}
                                              </p>
                                            </div>
                                          </button>
                                        ))}
                                      </div>
                                    </div>
                                  )}
                              </div>

                              <div className="grid grid-cols-2 gap-2">
                                <button
                                  type="button"
                                  onClick={() =>
                                    setReplyModeForComment(comment.id, 'self')
                                  }
                                  className={`min-h-[40px] rounded-2xl border flex items-center justify-center gap-2 transition-all text-[8px] font-black uppercase tracking-widest ${replyMode === 'self'
                                    ? 'bg-brand-accent border-brand-accent text-brand-black'
                                    : 'border-white/20 text-gray-500 hover:text-white'
                                    }`}
                                >
                                  <User size={12} />
                                  As me
                                </button>

                                <button
                                  type="button"
                                  onClick={() =>
                                    setReplyModeForComment(comment.id, 'anon')
                                  }
                                  className={`min-h-[40px] rounded-2xl border flex items-center justify-center gap-2 transition-all text-[8px] font-black uppercase tracking-widest ${replyMode === 'anon'
                                    ? 'bg-brand-accent border-brand-accent text-brand-black'
                                    : 'border-white/20 text-gray-500 hover:text-white'
                                    }`}
                                >
                                  <EyeOff size={12} />
                                  Anon
                                </button>
                              </div>

                              <button
                                type="button"
                                disabled={!canReply || Boolean(isPostingReply[comment.id])}
                                onClick={() => handlePostReply(comment.id)}
                                className="w-full min-h-[42px] bg-white text-brand-black rounded-2xl font-black uppercase text-[9px] tracking-[0.2em] disabled:opacity-20 flex items-center justify-center gap-2 hover:bg-brand-accent transition-all"
                              >
                                {isPostingReply[comment.id] ? (
                                  <>
                                    <Loader2 size={12} className="animate-spin" />
                                    Posting
                                  </>
                                ) : (
                                  <>
                                    Post Reply <Send size={12} />
                                  </>
                                )}
                              </button>

                              {replyErrors[comment.id] && (
                                <div className="p-3 bg-brand-critique/10 border border-brand-critique/30 rounded-2xl">
                                  <p className="text-[9px] uppercase font-black tracking-widest text-brand-critique leading-relaxed">
                                    {replyErrors[comment.id]}
                                  </p>
                                </div>
                              )}

                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}

                <Link
                  to={`/vents/${vent.id}`}
                  className="w-full min-h-[44px] rounded-2xl bg-brand-black border border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:border-brand-accent transition-all flex items-center justify-center gap-2"
                >
                  View full vent thread
                </Link>

                <div className="space-y-3">
                  <textarea
                    value={draft}
                    onChange={(event) =>
                      handleCommentChange(vent.id, event.target.value)
                    }
                    rows={3}
                    placeholder="Add a quick comment..."
                    className="w-full bg-brand-black border border-white/10 rounded-2xl p-4 text-sm font-medium focus:border-brand-accent outline-none resize-none transition-all"
                  />

                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() => setCommentModeForVent(vent.id, 'self')}
                      className={`min-h-[44px] rounded-2xl border flex items-center justify-center gap-2 transition-all text-[9px] font-black uppercase tracking-widest ${mode === 'self'
                        ? 'bg-brand-accent border-brand-accent text-brand-black'
                        : 'border-white/20 text-gray-500 hover:text-white'
                        }`}
                    >
                      <User size={14} />
                      As me
                    </button>

                    <button
                      type="button"
                      onClick={() => setCommentModeForVent(vent.id, 'anon')}
                      className={`min-h-[44px] rounded-2xl border flex items-center justify-center gap-2 transition-all text-[9px] font-black uppercase tracking-widest ${mode === 'anon'
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
                    disabled={!canComment || Boolean(isPostingComment[vent.id])}
                    onClick={() => handlePostComment(vent.id)}
                    className="w-full min-h-[46px] bg-white text-brand-black rounded-2xl font-black uppercase text-[10px] tracking-[0.2em] disabled:opacity-20 flex items-center justify-center gap-2 hover:bg-brand-accent transition-all"
                  >
                    {isPostingComment[vent.id] ? (
                      <>
                        <Loader2 size={14} className="animate-spin" />
                        Posting
                      </>
                    ) : (
                      <>
                        Comment <Send size={14} />
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
              </div>
            </motion.article>
          );
        })}
      </section>
    </div>
  );
}