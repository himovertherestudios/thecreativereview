import React, { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
    ChevronLeft,
    EyeOff,
    User,
    Send,
    AlertTriangle,
    ThumbsUp,
    MessageSquare,
    AtSign,
    Reply,
    Loader2,
    AlertCircle,
    Sparkles,
} from 'lucide-react';
import { FAKE_CREATORS, FAKE_VENTS } from '../data';
import { supabase } from '../lib/supabase';

type VentPostMode = 'self' | 'anon';

type Vent = {
    id: string;
    userId: string | null;
    content: string;
    isAnonymous: boolean;
    createdAt: string;
    upvotes: number;
    commentCount?: number;
};

type VentComment = {
    id: string;
    ventId: string;
    content: string;
    isAnonymous: boolean;
    createdAt: string;
};

type CommentReply = {
    id: string;
    commentId: string;
    content: string;
    isAnonymous: boolean;
    createdAt: string;
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

type SupabaseVentReplyRow = {
    id: string;
    comment_id: string;
    user_id: string | null;
    content: string;
    is_anonymous: boolean;
    created_at: string;
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
            'That “I’ll know it when I see it” line needs to come with a consultation fee. @arivers_clicks called this last week.',
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
            'Credits cost zero dollars. @mayavossmua said it best — tag the team.',
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
        content: 'Exactly. The confusion has to stop being free labor.',
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

function mapSupabaseVentToVent(vent: SupabaseVentRow): Vent {
    return {
        id: vent.id,
        userId: vent.user_id,
        content: vent.content,
        isAnonymous: vent.is_anonymous,
        createdAt: vent.created_at,
        upvotes: vent.upvotes || 0,
        commentCount: vent.comment_count || 0,
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

function mapSupabaseReplyToCommentReply(reply: SupabaseVentReplyRow): CommentReply {
    return {
        id: reply.id,
        commentId: reply.comment_id,
        content: reply.content,
        isAnonymous: reply.is_anonymous,
        createdAt: reply.created_at,
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

function IdentityAvatar({ isAnonymous }: { isAnonymous: boolean }) {
    return (
        <div className="w-full h-full flex items-center justify-center bg-brand-accent/10">
            {isAnonymous ? (
                <EyeOff size={15} className="text-brand-accent" />
            ) : (
                <User size={15} className="text-brand-accent" />
            )}
        </div>
    );
}

export default function VentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const fallbackVent = useMemo(() => {
        const foundVent = FAKE_VENTS.find((item) => item.id === id) || FAKE_VENTS[0];

        return {
            id: foundVent.id,
            userId: foundVent.userId,
            content: foundVent.content,
            isAnonymous: foundVent.isAnonymous,
            createdAt: foundVent.createdAt,
            upvotes: foundVent.upvotes,
            commentCount: 0,
        };
    }, [id]);

    const [realVent, setRealVent] = useState<Vent | null>(null);
    const [isLoadingVent, setIsLoadingVent] = useState(true);
    const [pageError, setPageError] = useState('');

    const vent = realVent || fallbackVent;
    const isRealSupabaseVent = Boolean(realVent);

    const [commentText, setCommentText] = useState('');
    const [commentMode, setCommentMode] = useState<VentPostMode>('anon');
    const [comments, setComments] = useState<VentComment[]>([]);
    const [isPostingComment, setIsPostingComment] = useState(false);
    const [commentError, setCommentError] = useState('');

    const [hasUpvoted, setHasUpvoted] = useState(false);
    const [isUpvoting, setIsUpvoting] = useState(false);
    const [upvoteError, setUpvoteError] = useState('');

    const [activeReplyCommentId, setActiveReplyCommentId] = useState<string | null>(
        null
    );
    const [replyDrafts, setReplyDrafts] = useState<Record<string, string>>({});
    const [replyModes, setReplyModes] = useState<Record<string, VentPostMode>>({});
    const [replies, setReplies] = useState<CommentReply[]>(STARTER_REPLIES);
    const [isPostingReply, setIsPostingReply] = useState<Record<string, boolean>>(
        {}
    );
    const [replyErrors, setReplyErrors] = useState<Record<string, string>>({});

    const mentionQuery = getMentionQuery(commentText);

    const mentionSuggestions = useMemo(() => {
        if (mentionQuery === null) return [];

        return FAKE_CREATORS.filter((creator) =>
            creator.username.toLowerCase().includes(mentionQuery)
        ).slice(0, 4);
    }, [mentionQuery]);

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

    const canComment = commentText.trim().length >= 2 && !isPostingComment;
    const upvoteCount = vent.upvotes;

    const loadVentThread = async () => {
        if (!id) return;

        setIsLoadingVent(true);
        setPageError('');
        setCommentError('');

        try {
            const { data: ventData, error: ventError } = await supabase
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
                .eq('id', id)
                .maybeSingle();

            if (ventError) {
                throw ventError;
            }

            if (!ventData) {
                setRealVent(null);
                setComments(STARTER_COMMENTS.filter((comment) => comment.ventId === id));
                setReplies(STARTER_REPLIES);
                return;
            }

            const mappedVent = mapSupabaseVentToVent(
                ventData as unknown as SupabaseVentRow
            );

            setRealVent(mappedVent);

            const {
                data: { user },
            } = await supabase.auth.getUser();

            if (user) {
                const { data: existingUpvote, error: upvoteLookupError } = await supabase
                    .from('vent_upvotes')
                    .select('id')
                    .eq('vent_id', id)
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (upvoteLookupError) {
                    throw upvoteLookupError;
                }

                setHasUpvoted(Boolean(existingUpvote));
            } else {
                setHasUpvoted(false);
            }

            const { data: commentData, error: commentsError } = await supabase
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
                .eq('vent_id', id)
                .order('created_at', { ascending: false });

            if (commentsError) {
                throw commentsError;
            }

            const mappedComments = (commentData || []).map((comment) =>
                mapSupabaseCommentToVentComment(
                    comment as unknown as SupabaseVentCommentRow
                )
            );

            setComments(mappedComments);

            const commentIds = mappedComments.map((comment) => comment.id);

            if (commentIds.length === 0) {
                setReplies([]);
                return;
            }

            const { data: replyData, error: repliesError } = await supabase
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
                .in('comment_id', commentIds)
                .order('created_at', { ascending: true });

            if (repliesError) {
                throw repliesError;
            }

            const mappedReplies = (replyData || []).map((reply) =>
                mapSupabaseReplyToCommentReply(
                    reply as unknown as SupabaseVentReplyRow
                )
            );

            setReplies(mappedReplies);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Something went wrong loading this vent thread.';

            setPageError(message);

            setRealVent(null);
            setComments(STARTER_COMMENTS.filter((comment) => comment.ventId === id));
            setReplies(STARTER_REPLIES);
        } finally {
            setIsLoadingVent(false);
        }
    };

    useEffect(() => {
        loadVentThread();
    }, [id]);

    const handleCommentChange = (value: string) => {
        setCommentText(value);

        if (commentError) {
            setCommentError('');
        }
    };

    const insertMention = (username: string) => {
        setCommentText((current) =>
            current.replace(/@([a-zA-Z0-9_]*)$/, `@${username} `)
        );
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

    const handlePostComment = async () => {
        if (!canComment) return;

        setIsPostingComment(true);
        setCommentError('');

        try {
            if (!isRealSupabaseVent) {
                const newComment: VentComment = {
                    id: `comment-${Date.now()}`,
                    ventId: vent.id,
                    content: commentText.trim(),
                    isAnonymous: commentMode === 'anon',
                    createdAt: new Date().toISOString(),
                };

                setComments((current) => [newComment, ...current]);
                setCommentText('');
                setCommentMode('anon');
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
                throw new Error('You must be logged in to comment.');
            }

            const { data, error } = await supabase
                .from('vent_comments')
                .insert({
                    vent_id: vent.id,
                    user_id: user.id,
                    content: commentText.trim(),
                    is_anonymous: commentMode === 'anon',
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
            setCommentText('');
            setCommentMode('anon');
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Something went wrong while posting your comment.';

            setCommentError(message);
        } finally {
            setIsPostingComment(false);
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

        if (replyErrors[commentId]) {
            setReplyErrors((current) => ({
                ...current,
                [commentId]: '',
            }));
        }
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
            if (!isRealSupabaseVent) {
                const newReply: CommentReply = {
                    id: `reply-${commentId}-${Date.now()}`,
                    commentId,
                    content: draft.trim(),
                    isAnonymous: getReplyMode(commentId) === 'anon',
                    createdAt: new Date().toISOString(),
                };

                setReplies((current) => [newReply, ...current]);

                setReplyDrafts((current) => ({
                    ...current,
                    [commentId]: '',
                }));

                setReplyModeForComment(commentId, 'anon');
                setActiveReplyCommentId(null);
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

            setReplies((current) => [...current, newReply]);

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

    const handleToggleUpvote = async () => {
        if (isUpvoting) return;

        setIsUpvoting(true);
        setUpvoteError('');

        try {
            if (!isRealSupabaseVent) {
                setHasUpvoted((current) => !current);
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

            const currentUpvotes = realVent?.upvotes ?? vent.upvotes ?? 0;

            if (hasUpvoted) {
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

                setHasUpvoted(false);

                setRealVent(
                    mapSupabaseVentToVent(updatedVent as unknown as SupabaseVentRow)
                );
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

                setHasUpvoted(true);

                setRealVent(
                    mapSupabaseVentToVent(updatedVent as unknown as SupabaseVentRow)
                );
            }
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Something went wrong while updating your upvote.';

            setUpvoteError(message);
        } finally {
            setIsUpvoting(false);
        }
    };

    if (isLoadingVent) {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <div className="flex items-center gap-3 text-gray-500">
                    <Loader2 size={20} className="animate-spin" />

                    <p className="text-[10px] font-black uppercase tracking-widest">
                        Loading thread...
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="pb-10">
            <div className="max-w-2xl mx-auto space-y-5">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="min-h-[44px] flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
                >
                    <ChevronLeft size={18} /> Back to vents
                </button>

                {pageError && (
                    <div className="p-4 bg-brand-critique/10 border border-brand-critique/30 rounded-2xl flex items-start gap-3">
                        <AlertCircle
                            size={18}
                            className="text-brand-critique flex-shrink-0 mt-0.5"
                        />

                        <p className="text-[10px] uppercase font-black tracking-widest text-brand-critique leading-relaxed">
                            Thread error: {pageError}. Showing fallback thread.
                        </p>
                    </div>
                )}

                {/* Main Thread */}
                <section className="bg-brand-gray border border-white/10 rounded-3xl overflow-hidden">
                    <div className="p-4 md:p-5">
                        <div className="flex gap-3">
                            <div className="flex flex-col items-center flex-shrink-0">
                                <div className="w-11 h-11 rounded-full bg-brand-black border border-white/10 overflow-hidden">
                                    <IdentityAvatar isAnonymous={vent.isAnonymous} />
                                </div>

                                {comments.length > 0 && (
                                    <div className="w-px flex-1 bg-white/10 mt-3" />
                                )}
                            </div>

                            <div className="flex-1 min-w-0 space-y-4">
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
                                        disabled={isUpvoting}
                                        onClick={handleToggleUpvote}
                                        className={`min-h-[36px] px-3 rounded-full border flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${hasUpvoted
                                                ? 'bg-brand-accent/15 border-brand-accent/40 text-brand-accent'
                                                : 'border-white/10 text-gray-500 hover:text-white hover:border-white/20'
                                            }`}
                                    >
                                        {isUpvoting ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <ThumbsUp size={14} />
                                        )}
                                        {upvoteCount}
                                    </button>
                                </div>

                                <p className="text-[17px] md:text-xl text-white font-semibold leading-relaxed whitespace-pre-wrap">
                                    {vent.content}
                                </p>

                                {upvoteError && (
                                    <div className="p-3 bg-brand-critique/10 border border-brand-critique/30 rounded-2xl">
                                        <p className="text-[9px] uppercase font-black tracking-widest text-brand-critique leading-relaxed">
                                            {upvoteError}
                                        </p>
                                    </div>
                                )}

                                <div className="flex items-center gap-2 flex-wrap">
                                    <button
                                        type="button"
                                        disabled={isUpvoting}
                                        onClick={handleToggleUpvote}
                                        className={`min-h-[36px] px-3 rounded-full border flex items-center gap-2 text-[9px] font-black uppercase tracking-widest transition-all disabled:opacity-50 ${hasUpvoted
                                                ? 'bg-brand-accent/15 border-brand-accent/40 text-brand-accent'
                                                : 'border-white/10 text-gray-500 hover:text-white hover:border-white/20'
                                            }`}
                                    >
                                        {isUpvoting ? (
                                            <Loader2 size={14} className="animate-spin" />
                                        ) : (
                                            <ThumbsUp size={14} />
                                        )}
                                        Upvote
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            const textarea = document.getElementById('thread-comment-box');
                                            textarea?.focus();
                                        }}
                                        className="min-h-[36px] px-3 rounded-full border border-white/10 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-brand-accent hover:border-brand-accent/30 transition-all"
                                    >
                                        <MessageSquare size={14} />
                                        Comment
                                    </button>
                                </div>

                                <div className="flex items-start gap-3 p-4 bg-brand-black/60 rounded-2xl border border-brand-critique/20">
                                    <AlertTriangle
                                        size={17}
                                        className="text-brand-critique flex-shrink-0 mt-0.5"
                                    />

                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 leading-relaxed">
                                        Keep it funny, useful, and clean. No names, no doxxing, no
                                        screenshots, no personal attacks.
                                    </p>
                                </div>
                            </div>
                        </div>
                    </div>
                </section>

                {/* Comment Composer */}
                <section className="bg-brand-gray border border-white/10 rounded-3xl p-4 md:p-5">
                    <div className="flex gap-3">
                        <div className="w-10 h-10 rounded-full border border-brand-accent/30 overflow-hidden flex-shrink-0">
                            <IdentityAvatar isAnonymous={commentMode === 'anon'} />
                        </div>

                        <div className="flex-1 min-w-0 space-y-4">
                            <div className="flex items-center gap-2 text-gray-600">
                                <MessageSquare size={14} />

                                <p className="text-[10px] font-black uppercase tracking-widest">
                                    Add to the thread
                                </p>
                            </div>

                            <div className="relative space-y-3">
                                <textarea
                                    id="thread-comment-box"
                                    value={commentText}
                                    onChange={(event) => handleCommentChange(event.target.value)}
                                    rows={4}
                                    placeholder="Add a comment, joke, cosign, or useful perspective..."
                                    className="w-full bg-transparent border-none p-0 text-sm font-medium text-white placeholder:text-gray-600 focus:outline-none resize-none leading-relaxed"
                                />

                                {mentionSuggestions.length > 0 && (
                                    <div className="absolute left-0 right-0 top-full z-30 mt-2 bg-brand-black border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
                                        <div className="px-4 py-3 border-b border-white/10 flex items-center gap-2">
                                            <AtSign size={14} className="text-brand-accent" />

                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                                                Tag a member
                                            </p>
                                        </div>

                                        <div className="p-2 space-y-1">
                                            {mentionSuggestions.map((creator) => (
                                                <button
                                                    key={creator.id}
                                                    type="button"
                                                    onClick={() => insertMention(creator.username)}
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

                            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 pt-3 border-t border-white/10">
                                <div className="grid grid-cols-2 gap-2 sm:flex">
                                    <button
                                        type="button"
                                        onClick={() => setCommentMode('self')}
                                        className={`min-h-[40px] px-4 rounded-full border flex items-center justify-center gap-2 transition-all text-[9px] font-black uppercase tracking-widest ${commentMode === 'self'
                                                ? 'bg-brand-accent border-brand-accent text-brand-black'
                                                : 'border-white/20 text-gray-500 hover:text-white'
                                            }`}
                                    >
                                        <User size={14} />
                                        As me
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => setCommentMode('anon')}
                                        className={`min-h-[40px] px-4 rounded-full border flex items-center justify-center gap-2 transition-all text-[9px] font-black uppercase tracking-widest ${commentMode === 'anon'
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
                                    disabled={!canComment}
                                    onClick={handlePostComment}
                                    className="min-h-[42px] px-5 bg-white text-brand-black rounded-full font-black uppercase text-[10px] tracking-[0.2em] disabled:opacity-20 flex items-center justify-center gap-2 hover:bg-brand-accent transition-all"
                                >
                                    {isPostingComment ? (
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
                            </div>

                            {commentError && (
                                <div className="p-3 bg-brand-critique/10 border border-brand-critique/30 rounded-2xl">
                                    <p className="text-[9px] uppercase font-black tracking-widest text-brand-critique leading-relaxed">
                                        {commentError}
                                    </p>
                                </div>
                            )}

                            <p className="text-[9px] text-gray-700 font-black uppercase tracking-widest">
                                Tip: type @ to mention a member. Prototype mentions use fake
                                members for now.
                            </p>
                        </div>
                    </div>
                </section>

                {/* Comments */}
                <section className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2 text-gray-600">
                            <Sparkles size={14} />

                            <p className="text-[10px] font-black uppercase tracking-widest">
                                {comments.length} comments
                            </p>
                        </div>

                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent">
                            Full thread
                        </p>
                    </div>

                    {comments.length === 0 ? (
                        <div className="bg-brand-gray border border-white/10 rounded-3xl p-6 text-center">
                            <p className="text-sm text-gray-500 font-bold uppercase tracking-widest">
                                No comments yet. Start the chaos.
                            </p>
                        </div>
                    ) : (
                        <div className="bg-brand-gray border border-white/10 rounded-3xl overflow-hidden">
                            {comments.map((comment, index) => {
                                const commentReplies = replies.filter(
                                    (replyItem) => replyItem.commentId === comment.id
                                );
                                const isReplyOpen = activeReplyCommentId === comment.id;
                                const replyText = replyDrafts[comment.id] || '';
                                const replyMode = getReplyMode(comment.id);
                                const isThisReplyPosting = Boolean(isPostingReply[comment.id]);
                                const canReply =
                                    replyText.trim().length >= 2 && !isThisReplyPosting;

                                return (
                                    <motion.article
                                        key={comment.id}
                                        initial={{ opacity: 0, y: 8 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        className={`p-4 md:p-5 hover:bg-white/[0.025] transition-all ${index !== comments.length - 1
                                                ? 'border-b border-white/10'
                                                : ''
                                            }`}
                                    >
                                        <div className="flex gap-3">
                                            <div className="flex flex-col items-center flex-shrink-0">
                                                <div className="w-9 h-9 rounded-full bg-brand-black border border-white/10 overflow-hidden">
                                                    <IdentityAvatar isAnonymous={comment.isAnonymous} />
                                                </div>

                                                {(commentReplies.length > 0 || isReplyOpen) && (
                                                    <div className="w-px flex-1 bg-white/10 mt-3" />
                                                )}
                                            </div>

                                            <div className="flex-1 min-w-0 space-y-3">
                                                <div className="flex flex-wrap items-center gap-2">
                                                    <p className="text-xs font-black uppercase tracking-tight">
                                                        {comment.isAnonymous
                                                            ? 'Anonymous Creative'
                                                            : 'Creative Member'}
                                                    </p>

                                                    <span className="text-gray-700 text-xs">•</span>

                                                    <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                                                        {formatTimeAgo(comment.createdAt)}
                                                    </p>
                                                </div>

                                                <p className="text-sm md:text-base text-gray-300 leading-relaxed whitespace-pre-wrap">
                                                    {renderTextWithMentions(comment.content)}
                                                </p>

                                                <div className="flex items-center gap-2 flex-wrap">
                                                    <button
                                                        type="button"
                                                        onClick={() =>
                                                            setActiveReplyCommentId((current) =>
                                                                current === comment.id ? null : comment.id
                                                            )
                                                        }
                                                        className={`min-h-[34px] px-3 rounded-full border text-[9px] font-black uppercase tracking-widest flex items-center gap-2 transition-all ${isReplyOpen
                                                                ? 'bg-white/10 border-white/20 text-white'
                                                                : 'border-white/10 text-gray-500 hover:text-brand-accent hover:border-brand-accent/30'
                                                            }`}
                                                    >
                                                        <Reply size={13} />
                                                        Reply
                                                    </button>

                                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-700">
                                                        {commentReplies.length} replies
                                                    </p>
                                                </div>

                                                {commentReplies.length > 0 && (
                                                    <div className="space-y-3">
                                                        {commentReplies.map((replyItem) => (
                                                            <div
                                                                key={replyItem.id}
                                                                className="bg-brand-black/50 border border-white/5 rounded-2xl p-3 space-y-2"
                                                            >
                                                                <div className="flex items-center gap-2">
                                                                    <div className="w-6 h-6 rounded-full bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center">
                                                                        {replyItem.isAnonymous ? (
                                                                            <EyeOff
                                                                                size={12}
                                                                                className="text-brand-accent"
                                                                            />
                                                                        ) : (
                                                                            <User
                                                                                size={12}
                                                                                className="text-brand-accent"
                                                                            />
                                                                        )}
                                                                    </div>

                                                                    <p className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                                                                        {replyItem.isAnonymous
                                                                            ? 'Anonymous Creative'
                                                                            : 'Creative Member'}{' '}
                                                                        • {formatTimeAgo(replyItem.createdAt)}
                                                                    </p>
                                                                </div>

                                                                <p className="text-xs md:text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                                                    {renderTextWithMentions(replyItem.content)}
                                                                </p>
                                                            </div>
                                                        ))}
                                                    </div>
                                                )}

                                                {isReplyOpen && (
                                                    <div className="bg-brand-black/50 border border-white/10 rounded-3xl p-4 space-y-3">
                                                        <div className="relative">
                                                            <textarea
                                                                value={replyText}
                                                                onChange={(event) =>
                                                                    handleReplyChange(comment.id, event.target.value)
                                                                }
                                                                rows={3}
                                                                placeholder="Reply to this comment..."
                                                                className="w-full bg-transparent border-none p-0 text-sm font-medium text-white placeholder:text-gray-600 focus:outline-none resize-none leading-relaxed"
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
                                                                className={`min-h-[40px] rounded-full border flex items-center justify-center gap-2 transition-all text-[9px] font-black uppercase tracking-widest ${replyMode === 'self'
                                                                        ? 'bg-brand-accent border-brand-accent text-brand-black'
                                                                        : 'border-white/20 text-gray-500 hover:text-white'
                                                                    }`}
                                                            >
                                                                <User size={13} />
                                                                As me
                                                            </button>

                                                            <button
                                                                type="button"
                                                                onClick={() =>
                                                                    setReplyModeForComment(comment.id, 'anon')
                                                                }
                                                                className={`min-h-[40px] rounded-full border flex items-center justify-center gap-2 transition-all text-[9px] font-black uppercase tracking-widest ${replyMode === 'anon'
                                                                        ? 'bg-brand-accent border-brand-accent text-brand-black'
                                                                        : 'border-white/20 text-gray-500 hover:text-white'
                                                                    }`}
                                                            >
                                                                <EyeOff size={13} />
                                                                Anon
                                                            </button>
                                                        </div>

                                                        {replyErrors[comment.id] && (
                                                            <div className="p-3 bg-brand-critique/10 border border-brand-critique/30 rounded-2xl">
                                                                <p className="text-[9px] uppercase font-black tracking-widest text-brand-critique leading-relaxed">
                                                                    {replyErrors[comment.id]}
                                                                </p>
                                                            </div>
                                                        )}

                                                        <button
                                                            type="button"
                                                            disabled={!canReply}
                                                            onClick={() => handlePostReply(comment.id)}
                                                            className="w-full min-h-[42px] bg-white text-brand-black rounded-full font-black uppercase text-[10px] tracking-[0.2em] disabled:opacity-20 flex items-center justify-center gap-2 hover:bg-brand-accent transition-all"
                                                        >
                                                            {isThisReplyPosting ? (
                                                                <>
                                                                    <Loader2 size={13} className="animate-spin" />
                                                                    Posting
                                                                </>
                                                            ) : (
                                                                <>
                                                                    Reply <Send size={13} />
                                                                </>
                                                            )}
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        </div>
                                    </motion.article>
                                );
                            })}
                        </div>
                    )}
                </section>
            </div>
        </div>
    );
}