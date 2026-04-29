import React, { useEffect, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'motion/react';
import {
    AlertCircle,
    Bell,
    Camera,
    CheckCheck,
    Flame,
    Loader2,
    MessageSquare,
    Sparkles,
    ThumbsUp,
    User,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type NotificationRow = {
    id: string;
    user_id: string;
    trigger_user_id: string | null;
    type: string;
    entity_type: string | null;
    entity_id: string | null;
    message: string;
    metadata: Record<string, unknown> | null;
    is_read: boolean;
    created_at: string;
};

type ProfileRow = {
    id: string;
    display_name: string | null;
    username: string | null;
    avatar_url: string | null;
    role: string | null;
};

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
    });
}

function getActivityIcon(type: string) {
    if (type.includes('critique')) return Camera;
    if (type.includes('comment') || type.includes('reply')) return MessageSquare;
    if (type.includes('upvote')) return ThumbsUp;
    if (type.includes('hot_seat')) return Flame;
    if (type.includes('challenge')) return Sparkles;

    return Bell;
}

function getActivityLink(notification: NotificationRow) {
    if (!notification.entity_id) return '/dashboard';

    if (notification.entity_type === 'photo') {
        return `/photo/${notification.entity_id}`;
    }

    if (notification.entity_type === 'corner_post') {
        return `/vents/${notification.entity_id}`;
    }

    if (notification.entity_type === 'hot_seat') {
        return '/hot-seat';
    }

    if (notification.entity_type === 'challenge') {
        return '/dashboard';
    }

    return '/dashboard';
}

function groupLabel(dateString: string) {
    const date = new Date(dateString);
    const now = new Date();

    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const startOfDate = new Date(date.getFullYear(), date.getMonth(), date.getDate());

    const diffDays = Math.floor(
        (startOfToday.getTime() - startOfDate.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';

    return 'Earlier';
}

function EmptyActivityState() {
    return (
        <div className="rounded-3xl border border-white/10 bg-brand-gray p-8 text-center">
            <div className="mx-auto mb-5 flex h-14 w-14 items-center justify-center rounded-3xl border border-brand-accent/25 bg-brand-accent/10 text-brand-accent">
                <Bell size={26} />
            </div>

            <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent">
                No Activity Yet
            </p>

            <h2 className="mb-3 text-2xl font-black uppercase tracking-tight">
                The room is quiet.
            </h2>

            <p className="mx-auto max-w-sm text-sm font-medium leading-relaxed text-gray-400">
                Once members critique your work, reply in The Corner, upvote posts, or
                interact with your uploads, it will show up here.
            </p>

            <Link
                to="/feed"
                className="mt-6 inline-flex min-h-[48px] items-center justify-center rounded-2xl bg-brand-accent px-6 text-[10px] font-black uppercase tracking-widest text-brand-black transition hover:scale-[1.01] active:scale-[0.99]"
            >
                Go to Feed
            </Link>
        </div>
    );
}

export default function Activity() {
    const [notifications, setNotifications] = useState<NotificationRow[]>([]);
    const [profilesById, setProfilesById] = useState<Record<string, ProfileRow>>({});
    const [isLoading, setIsLoading] = useState(true);
    const [isMarkingRead, setIsMarkingRead] = useState(false);
    const [error, setError] = useState('');

    const unreadCount = useMemo(() => {
        return notifications.filter((notification) => !notification.is_read).length;
    }, [notifications]);

    const groupedNotifications = useMemo(() => {
        return notifications.reduce<Record<string, NotificationRow[]>>(
            (groups, notification) => {
                const label = groupLabel(notification.created_at);

                if (!groups[label]) {
                    groups[label] = [];
                }

                groups[label].push(notification);
                return groups;
            },
            {}
        );
    }, [notifications]);

    const loadActivity = async () => {
        setIsLoading(true);
        setError('');

        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) throw userError;
            if (!user) throw new Error('You must be logged in to view activity.');

            const { data, error: notificationsError } = await supabase
                .from('notifications')
                .select(
                    `
          id,
          user_id,
          trigger_user_id,
          type,
          entity_type,
          entity_id,
          message,
          metadata,
          is_read,
          created_at
        `
                )
                .eq('user_id', user.id)
                .order('created_at', { ascending: false })
                .limit(60);

            if (notificationsError) throw notificationsError;

            const rows = (data || []) as NotificationRow[];
            setNotifications(rows);

            const triggerUserIds = Array.from(
                new Set(
                    rows
                        .map((notification) => notification.trigger_user_id)
                        .filter(Boolean) as string[]
                )
            );

            if (triggerUserIds.length > 0) {
                const { data: profilesData, error: profilesError } = await supabase
                    .from('profiles')
                    .select('id, display_name, username, avatar_url, role')
                    .in('id', triggerUserIds);

                if (profilesError) throw profilesError;

                const profileMap = ((profilesData || []) as ProfileRow[]).reduce<
                    Record<string, ProfileRow>
                >((map, profile) => {
                    map[profile.id] = profile;
                    return map;
                }, {});

                setProfilesById(profileMap);
            } else {
                setProfilesById({});
            }
        } catch (activityError) {
            const message =
                activityError instanceof Error
                    ? activityError.message
                    : 'Something went wrong while loading activity.';

            setError(message);
        } finally {
            setIsLoading(false);
        }
    };

    const markAllAsRead = async () => {
        if (unreadCount === 0 || isMarkingRead) return;

        setIsMarkingRead(true);

        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) throw userError;
            if (!user) throw new Error('You must be logged in.');

            const { error: updateError } = await supabase
                .from('notifications')
                .update({ is_read: true })
                .eq('user_id', user.id)
                .eq('is_read', false);

            if (updateError) throw updateError;

            setNotifications((current) =>
                current.map((notification) => ({
                    ...notification,
                    is_read: true,
                }))
            );
        } catch (markReadError) {
            const message =
                markReadError instanceof Error
                    ? markReadError.message
                    : 'Something went wrong while marking activity as read.';

            setError(message);
        } finally {
            setIsMarkingRead(false);
        }
    };

    useEffect(() => {
        loadActivity();
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-center">
                    <Loader2 size={24} className="animate-spin text-brand-accent" />
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
                        Loading Activity
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto max-w-3xl space-y-6 pb-10">
            <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                <div>
                    <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent">
                        Recent Activity
                    </p>

                    <h1 className="text-4xl font-black uppercase tracking-tighter md:text-6xl">
                        Activity
                    </h1>

                    <p className="mt-3 max-w-md text-sm font-medium leading-relaxed text-gray-400">
                        Your critiques, replies, upvotes, Hot Seat moments, and community
                        updates live here.
                    </p>
                </div>

                <button
                    type="button"
                    onClick={markAllAsRead}
                    disabled={unreadCount === 0 || isMarkingRead}
                    className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-2xl border border-white/10 px-4 text-[10px] font-black uppercase tracking-widest text-gray-300 transition hover:border-brand-accent/40 hover:text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                    {isMarkingRead ? (
                        <Loader2 size={15} className="animate-spin" />
                    ) : (
                        <CheckCheck size={15} />
                    )}
                    Mark Read
                </button>
            </header>

            {error && (
                <div className="flex items-start gap-3 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                    <AlertCircle size={18} className="mt-0.5 flex-shrink-0" />
                    <p>{error}</p>
                </div>
            )}

            {notifications.length === 0 ? (
                <EmptyActivityState />
            ) : (
                <div className="space-y-8">
                    {['Today', 'Yesterday', 'Earlier'].map((section) => {
                        const sectionNotifications = groupedNotifications[section] || [];

                        if (sectionNotifications.length === 0) return null;

                        return (
                            <section key={section} className="space-y-3">
                                <h2 className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-500">
                                    {section}
                                </h2>

                                <div className="space-y-3">
                                    {sectionNotifications.map((notification, index) => {
                                        const Icon = getActivityIcon(notification.type);
                                        const profile = notification.trigger_user_id
                                            ? profilesById[notification.trigger_user_id]
                                            : null;

                                        const profileName =
                                            profile?.display_name ||
                                            profile?.username ||
                                            'Creative Member';

                                        const avatarUrl =
                                            profile?.avatar_url ||
                                            `https://picsum.photos/seed/activity-${notification.id}/100/100`;

                                        return (
                                            <motion.div
                                                key={notification.id}
                                                initial={{ opacity: 0, y: 8 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: index * 0.03 }}
                                            >
                                                <Link
                                                    to={getActivityLink(notification)}
                                                    className={`group flex gap-4 rounded-3xl border p-4 transition hover:border-brand-accent/40 hover:bg-white/[0.03] ${notification.is_read
                                                            ? 'border-white/5 bg-brand-gray/70'
                                                            : 'border-brand-accent/30 bg-brand-accent/5'
                                                        }`}
                                                >
                                                    <div className="relative flex-shrink-0">
                                                        <div className="h-12 w-12 overflow-hidden rounded-2xl border border-white/10 bg-brand-black">
                                                            {notification.trigger_user_id ? (
                                                                <img
                                                                    src={avatarUrl}
                                                                    alt={profileName}
                                                                    className="h-full w-full object-cover"
                                                                    draggable={false}
                                                                />
                                                            ) : (
                                                                <div className="flex h-full w-full items-center justify-center text-brand-accent">
                                                                    <User size={20} />
                                                                </div>
                                                            )}
                                                        </div>

                                                        <div className="absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full border border-brand-black bg-brand-accent text-brand-black">
                                                            <Icon size={13} />
                                                        </div>
                                                    </div>

                                                    <div className="min-w-0 flex-1">
                                                        <div className="mb-1 flex items-center justify-between gap-3">
                                                            <p className="truncate text-sm font-black text-white">
                                                                {profileName}
                                                            </p>

                                                            {!notification.is_read && (
                                                                <span className="h-2 w-2 flex-shrink-0 rounded-full bg-brand-accent" />
                                                            )}
                                                        </div>

                                                        <p className="text-sm font-medium leading-relaxed text-gray-300 group-hover:text-white">
                                                            {notification.message}
                                                        </p>

                                                        <p className="mt-2 text-[10px] font-black uppercase tracking-widest text-gray-600">
                                                            {formatTimeAgo(notification.created_at)}
                                                        </p>
                                                    </div>
                                                </Link>
                                            </motion.div>
                                        );
                                    })}
                                </div>
                            </section>
                        );
                    })}
                </div>
            )}
        </div>
    );
}