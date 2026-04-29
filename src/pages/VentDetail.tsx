import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
    ChevronLeft,
    EyeOff,
    User,
    Send,
    ThumbsUp,
    MessageSquare,
    Reply,
    Loader2,
    AlertCircle,
    HelpCircle,
    Flame,
} from 'lucide-react';
import { supabase } from '../lib/supabase';
import { createNotification } from '../lib/notifications';


type VentPostMode = 'self' | 'anon';
type CornerPostType = 'vent' | 'ask';

type Vent = {
    id: string;
    userId: string | null;
    content: string;
    isAnonymous: boolean;
    createdAt: string;
    upvotes: number;
    commentCount?: number;
    postType: CornerPostType;
};

type VentComment = {
    id: string;
    ventId: string;
    userId: string | null;
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
    upvotes: number | null;
    comment_count: number | null;
    created_at: string;
    post_type: CornerPostType | null;
};

type SupabaseVentCommentRow = {
    id: string;
    vent_id: string;
    user_id: string | null;
    content: string;
    is_anonymous: boolean;
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

function mapSupabaseVentToVent(vent: SupabaseVentRow): Vent {
    return {
        id: vent.id,
        userId: vent.user_id,
        content: vent.content,
        isAnonymous: vent.is_anonymous,
        createdAt: vent.created_at,
        upvotes: vent.upvotes ?? 0,
        commentCount: vent.comment_count ?? 0,
        postType: vent.post_type ?? 'vent',
    };
}

function mapSupabaseCommentToVentComment(
    comment: SupabaseVentCommentRow
): VentComment {
    return {
        id: comment.id,
        ventId: comment.vent_id,
        userId: comment.user_id,
        content: comment.content,
        isAnonymous: comment.is_anonymous,
        createdAt: comment.created_at,
    };
}

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
        <div className="min-h-[280px] rounded-3xl border border-white/10 bg-white/[0.03] p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
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

export default function VentDetail() {
    const { id } = useParams();
    const navigate = useNavigate();

    const [vent, setVent] = useState<Vent | null>(null);
    const [isLoadingVent, setIsLoadingVent] = useState(true);
    const [pageError, setPageError] = useState('');

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
    const [replies, setReplies] = useState<CommentReply[]>([]);
    const [isPostingReply, setIsPostingReply] = useState<Record<string, boolean>>(
        {}
    );
    const [replyErrors, setReplyErrors] = useState<Record<string, string>>({});

    const canComment = Boolean(vent) && commentText.trim().length >= 2 && !isPostingComment;
    const upvoteCount = vent?.upvotes || 0;

    const loadVentThread = async () => {
        if (!id) {
            setPageError('This Corner thread link is missing an ID.');
            setIsLoadingVent(false);
            return;
        }

        setIsLoadingVent(true);
        setPageError('');
        setCommentError('');
        setUpvoteError('');
        setVent(null);
        setComments([]);
        setReplies([]);

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
                        created_at,
                        post_type
                    `
                )
                .eq('id', id)
                .eq('is_hidden', false)
                .maybeSingle();

            if (ventError) throw ventError;

            if (!ventData) {
                setVent(null);
                setPageError('This Corner thread is no longer available.');
                return;
            }

            const mappedVent = mapSupabaseVentToVent(
                ventData as unknown as SupabaseVentRow
            );

            setVent(mappedVent);

            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) throw userError;

            if (user) {
                const { data: existingUpvote, error: upvoteLookupError } = await supabase
                    .from('vent_upvotes')
                    .select('id')
                    .eq('vent_id', id)
                    .eq('user_id', user.id)
                    .maybeSingle();

                if (upvoteLookupError) throw upvoteLookupError;

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

            if (commentsError) throw commentsError;

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

            if (repliesError) throw repliesError;

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
                    : 'Something went wrong loading this Corner thread.';

            setPageError(message);
            setVent(null);
            setComments([]);
            setReplies([]);
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

    const handlePostComment = async () => {
        if (!canComment || !vent) return;

        setIsPostingComment(true);
        setCommentError('');

        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) throw userError;

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

            if (error) throw error;

            const newComment = mapSupabaseCommentToVentComment(
                data as unknown as SupabaseVentCommentRow
            );

            setComments((current) => [newComment, ...current]);

            await createNotification({
                userId: vent.userId,
                type: 'corner_comment_received',
                entityType: 'corner_post',
                entityId: vent.id,
                message:
                    vent.postType === 'ask'
                        ? 'Someone answered your question in The Corner.'
                        : 'Someone commented on your post in The Corner.',
                metadata: {
                    vent_id: vent.id,
                    comment_id: newComment.id,
                    post_type: vent.postType,
                    is_anonymous: commentMode === 'anon',
                },
            });

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
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) throw userError;

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

            if (error) throw error;

            const newReply = mapSupabaseReplyToCommentReply(
                data as unknown as SupabaseVentReplyRow
            );

            setReplies((current) => [...current, newReply]);

            const parentComment = comments.find((comment) => comment.id === commentId);

            await createNotification({
                userId: parentComment?.userId,
                type: 'corner_reply_received',
                entityType: 'corner_post',
                entityId: vent?.id,
                message: 'Someone replied to your comment in The Corner.',
                metadata: {
                    vent_id: vent?.id,
                    comment_id: commentId,
                    reply_id: newReply.id,
                    is_anonymous: getReplyMode(commentId) === 'anon',
                },
            });

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
        if (isUpvoting || !vent) return;

        setIsUpvoting(true);
        setUpvoteError('');

        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) throw userError;

            if (!user) {
                throw new Error('You must be logged in to upvote.');
            }

            const currentUpvotes = vent.upvotes || 0;
            const nextUpvoteCount = hasUpvoted
                ? Math.max(0, currentUpvotes - 1)
                : currentUpvotes + 1;

            if (hasUpvoted) {
                const { error: deleteError } = await supabase
                    .from('vent_upvotes')
                    .delete()
                    .eq('vent_id', vent.id)
                    .eq('user_id', user.id);

                if (deleteError) throw deleteError;
            } else {
                const { error: insertError } = await supabase
                    .from('vent_upvotes')
                    .insert({
                        vent_id: vent.id,
                        user_id: user.id,
                    });

                if (insertError) throw insertError;
            }

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
          created_at,
          post_type
          `
                )
                .single();

            if (updateError) throw updateError;

            if (!hasUpvoted) {
                await createNotification({
                    userId: vent.userId,
                    type: 'corner_upvoted',
                    entityType: 'corner_post',
                    entityId: vent.id,
                    message:
                        vent.postType === 'ask'
                            ? 'Someone upvoted your question in The Corner.'
                            : 'Someone upvoted your post in The Corner.',
                    metadata: {
                        vent_id: vent.id,
                        post_type: vent.postType,
                        next_upvote_count: nextUpvoteCount,
                    },
                });
            }

            setHasUpvoted(!hasUpvoted);
            setVent(mapSupabaseVentToVent(updatedVent as unknown as SupabaseVentRow));
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
                        Loading The Corner...
                    </p>
                </div>
            </div>
        );
    }

    if (!vent) {
        return (
            <div className="pb-10">
                <div className="max-w-2xl mx-auto space-y-5">
                    <button
                        type="button"
                        onClick={() => navigate(-1)}
                        className="min-h-[44px] flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
                    >
                        <ChevronLeft size={18} /> Back to The Corner
                    </button>

                    <BetaEmptyState
                        icon={AlertCircle}
                        eyebrow="Thread Unavailable"
                        title="This Corner Thread Is Not Available"
                        body={
                            pageError ||
                            'This post may have been deleted, hidden by moderation, or the link may be outdated.'
                        }
                        action={
                            <button
                                type="button"
                                onClick={loadVentThread}
                                className="min-h-[44px] px-5 py-3 bg-brand-accent text-brand-black rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-all"
                            >
                                Try Again
                            </button>
                        }
                    />
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
                    <ChevronLeft size={18} /> Back to The Corner
                </button>

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

                                        <div className="flex flex-wrap items-center gap-2 mt-2">
                                            <span
                                                className={`inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-[9px] font-black uppercase tracking-widest border ${vent.postType === 'ask'
                                                    ? 'bg-blue-500/10 text-blue-200 border-blue-400/20'
                                                    : 'bg-brand-accent/10 text-brand-accent border-brand-accent/20'
                                                    }`}
                                            >
                                                {vent.postType === 'ask' ? (
                                                    <HelpCircle size={11} />
                                                ) : (
                                                    <Flame size={11} />
                                                )}
                                                {vent.postType === 'ask' ? 'Ask' : 'Vent'}
                                            </span>

                                            <p className="text-[10px] font-black uppercase tracking-widest text-gray-700">
                                                {vent.isAnonymous ? 'Identity hidden' : 'Posted openly'}
                                            </p>
                                        </div>
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
                                        <ThumbsUp size={14} />
                                        Upvote
                                    </button>

                                    <button
                                        type="button"
                                        onClick={() => {
                                            const textarea =
                                                document.getElementById('thread-comment-box');
                                            textarea?.focus();
                                        }}
                                        className="min-h-[36px] px-3 rounded-full border border-white/10 flex items-center gap-2 text-[9px] font-black uppercase tracking-widest text-gray-500 hover:text-brand-accent hover:border-brand-accent/30 transition-all"
                                    >
                                        <MessageSquare size={14} />
                                        Comment
                                    </button>

                                </div>


                            </div>
                        </div>
                    </div>
                </section>


                <section className="space-y-3">
                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2 text-gray-600">
                            <MessageSquare size={14} />

                            <p className="text-[10px] font-black uppercase tracking-widest">
                                {comments.length} comments
                            </p>
                        </div>

                        <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent">
                            Full thread
                        </p>
                    </div>

                    {comments.length === 0 ? (
                        <BetaEmptyState
                            icon={MessageSquare}
                            eyebrow="No Comments Yet"
                            title="Start The Conversation"
                            body="Be the first to add a useful thought, cosign, joke, or creative perspective to this thread."
                            action={
                                <button
                                    type="button"
                                    onClick={() => {
                                        const textarea =
                                            document.getElementById('thread-comment-box');
                                        textarea?.focus();
                                    }}
                                    className="min-h-[44px] px-5 py-3 bg-brand-accent text-brand-black rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-all"
                                >
                                    Add First Comment
                                    <Send size={14} />
                                </button>
                            }
                        />
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
                                const canReply = replyText.trim().length >= 2 && !isThisReplyPosting;

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
                                                <div className="flex items-center justify-between gap-3">
                                                    <div className="flex flex-wrap items-center gap-2 min-w-0">
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
                                                                <div className="flex items-center justify-between gap-3">
                                                                    <div className="flex items-center gap-2 min-w-0">
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

                                                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 truncate">
                                                                            {replyItem.isAnonymous
                                                                                ? 'Anonymous Creative'
                                                                                : 'Creative Member'}{' '}
                                                                            • {formatTimeAgo(replyItem.createdAt)}
                                                                        </p>
                                                                    </div>


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
                                                        <textarea
                                                            value={replyText}
                                                            onChange={(event) =>
                                                                handleReplyChange(comment.id, event.target.value)
                                                            }
                                                            rows={3}
                                                            placeholder="Reply to this comment..."
                                                            className="w-full bg-transparent border-none p-0 text-sm font-medium text-white placeholder:text-gray-600 focus:outline-none resize-none leading-relaxed"
                                                        />

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

                            <textarea
                                id="thread-comment-box"
                                value={commentText}
                                onChange={(event) => handleCommentChange(event.target.value)}
                                rows={4}
                                placeholder="Add a comment, joke, cosign, or useful perspective..."
                                className="w-full bg-transparent border-none p-0 text-sm font-medium text-white placeholder:text-gray-600 focus:outline-none resize-none leading-relaxed"
                            />

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
                        </div>
                    </div>
                </section>

            </div>
        </div>
    );
}