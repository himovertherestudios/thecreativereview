import React, { useEffect, useMemo, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
    Activity,
    AlertCircle,
    BarChart3,
    Camera,
    Eye,
    Flame,
    Loader2,
    MessageSquare,
    Users,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type AppEvent = {
    id: string;
    user_id: string | null;
    event_name: string;
    page: string | null;
    metadata: Record<string, any> | null;
    created_at: string;
};

type ProfileRow = {
    id: string;
    display_name: string | null;
    username: string | null;
    is_admin: boolean | null;
};

type StatCardProps = {
    label: string;
    value: number | string;
    icon: React.ElementType;
};


function StatCard({ label, value, icon: Icon }: StatCardProps) {
    return (
        <div className="rounded-3xl border border-white/10 bg-brand-gray p-5">
            <div className="w-11 h-11 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center mb-4">
                <Icon size={21} className="text-brand-accent" />
            </div>

            <p className="text-[10px] font-black uppercase tracking-[0.22em] text-gray-500">
                {label}
            </p>

            <h3 className="text-3xl font-black tracking-tighter mt-2">{value}</h3>
        </div>
    );
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

    return date.toLocaleDateString();
}

function cleanEventName(name: string) {
    return name.replaceAll('_', ' ');
}

export default function AnalyticsAdmin() {
    const [isCheckingAdmin, setIsCheckingAdmin] = useState(true);
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const [errorMessage, setErrorMessage] = useState('');

    const [profiles, setProfiles] = useState<ProfileRow[]>([]);
    const [events, setEvents] = useState<AppEvent[]>([]);
    const [totalPhotos, setTotalPhotos] = useState(0);
    const [totalCritiques, setTotalCritiques] = useState(0);
    const [totalVents, setTotalVents] = useState(0);

    const profileMap = useMemo(() => {
        const map: Record<string, ProfileRow> = {};

        profiles.forEach((profile) => {
            map[profile.id] = profile;
        });

        return map;
    }, [profiles]);

    const totalEvents = events.length;
    const totalUsers = profiles.length;

    const dailyActiveUsers = useMemo(() => {
        const today = new Date().toDateString();

        const uniqueUsers = new Set(
            events
                .filter((event) => new Date(event.created_at).toDateString() === today)
                .map((event) => event.user_id)
                .filter(Boolean)
        );

        return uniqueUsers.size;
    }, [events]);

    const topActiveUsers = useMemo(() => {
        const counts: Record<string, number> = {};

        events.forEach((event) => {
            if (!event.user_id) return;
            counts[event.user_id] = (counts[event.user_id] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([userId, count]) => ({
                userId,
                count,
                profile: profileMap[userId],
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [events, profileMap]);

    const mostViewedPhotos = useMemo(() => {
        const counts: Record<string, number> = {};

        events.forEach((event) => {
            if (event.event_name !== 'photo_viewed') return;

            const photoId = event.metadata?.photo_id;
            if (!photoId) return;

            counts[photoId] = (counts[photoId] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([photoId, count]) => ({ photoId, count }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }, [events]);

    const eventBreakdown = useMemo(() => {
        const counts: Record<string, number> = {};

        events.forEach((event) => {
            counts[event.event_name] = (counts[event.event_name] || 0) + 1;
        });

        return Object.entries(counts)
            .map(([eventName, count]) => ({ eventName, count }))
            .sort((a, b) => b.count - a.count);
    }, [events]);

    const topEvent = eventBreakdown[0];

    const getProfileName = (userId: string | null) => {
        if (!userId) return 'Unknown user';

        const profile = profileMap[userId];

        return (
            profile?.display_name ||
            profile?.username ||
            `User ${userId.slice(0, 6)}`
        );
    };

    const loadAnalytics = async () => {
        setIsLoading(true);
        setErrorMessage('');

        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) throw userError;
            if (!user) throw new Error('You must be logged in.');

            const { data: adminProfile, error: adminError } = await supabase
                .from('profiles')
                .select('id, is_admin')
                .eq('id', user.id)
                .maybeSingle();

            if (adminError) throw adminError;

            const allowed = Boolean(adminProfile?.is_admin);

            setIsAdmin(allowed);
            setIsCheckingAdmin(false);

            if (!allowed) {
                setIsLoading(false);
                return;
            }

            const [
                profilesResult,
                eventsResult,
                photosCountResult,
                critiquesCountResult,
                ventsCountResult,
            ] = await Promise.all([
                supabase
                    .from('profiles')
                    .select('id, display_name, username, is_admin')
                    .order('created_at', { ascending: false }),

                supabase
                    .from('app_events')
                    .select('id, user_id, event_name, page, metadata, created_at')
                    .order('created_at', { ascending: false })
                    .limit(500),

                supabase
                    .from('photos')
                    .select('id', { count: 'exact', head: true }),

                supabase
                    .from('critiques')
                    .select('id', { count: 'exact', head: true }),

                supabase
                    .from('vents')
                    .select('id', { count: 'exact', head: true }),
            ]);

            if (profilesResult.error) throw profilesResult.error;
            if (eventsResult.error) throw eventsResult.error;
            if (photosCountResult.error) throw photosCountResult.error;
            if (critiquesCountResult.error) throw critiquesCountResult.error;
            if (ventsCountResult.error) throw ventsCountResult.error;

            setProfiles((profilesResult.data || []) as ProfileRow[]);
            setEvents((eventsResult.data || []) as AppEvent[]);
            setTotalPhotos(photosCountResult.count || 0);
            setTotalCritiques(critiquesCountResult.count || 0);
            setTotalVents(ventsCountResult.count || 0);
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Something went wrong loading analytics.';

            setErrorMessage(message);
        } finally {
            setIsCheckingAdmin(false);
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadAnalytics();
    }, []);

    if (isCheckingAdmin) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 size={28} className="animate-spin text-brand-accent" />
            </div>
        );
    }

    if (!isAdmin) {
        return <Navigate to="/dashboard" replace />;
    }

    return (
        <div className="space-y-8 pb-16">
            <header className="space-y-3">
                <p className="text-brand-accent text-xs font-black uppercase tracking-[0.25em]">
                    Admin Analytics
                </p>

                <h1 className="text-3xl md:text-5xl font-black tracking-tighter uppercase">
                    Product Pulse
                </h1>

                <p className="text-sm text-gray-400 font-medium max-w-2xl leading-relaxed">
                    Track what beta testers are actually doing inside The Creative Review.
                    Keep this simple for now: usage, activity, engagement, and live events.
                </p>

                <button
                    type="button"
                    onClick={loadAnalytics}
                    className="min-h-[42px] px-5 py-3 rounded-2xl bg-white/5 border border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-300 hover:text-white hover:border-white/20 transition-all"
                >
                    Refresh Analytics
                </button>
            </header>

            {errorMessage && (
                <div className="p-4 bg-brand-critique/10 border border-brand-critique/30 rounded-2xl flex gap-3">
                    <AlertCircle size={18} className="text-brand-critique" />
                    <p className="text-[10px] uppercase font-black tracking-widest text-brand-critique">
                        {errorMessage}
                    </p>
                </div>
            )}

            {isLoading ? (
                <div className="min-h-[300px] rounded-3xl border border-white/10 bg-brand-gray flex items-center justify-center">
                    <div className="flex items-center gap-3 text-gray-500">
                        <Loader2 size={20} className="animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            Loading analytics...
                        </span>
                    </div>
                </div>
            ) : (
                <>
                    <section className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
                        <StatCard label="Total Users" value={totalUsers} icon={Users} />
                        <StatCard label="Photos" value={totalPhotos} icon={Camera} />
                        <StatCard
                            label="Critiques"
                            value={totalCritiques}
                            icon={MessageSquare}
                        />
                        <StatCard label="Vents" value={totalVents} icon={Flame} />
                        <StatCard label="Tracked Events" value={totalEvents} icon={Activity} />
                        <StatCard label="Daily Active Users" value={dailyActiveUsers} icon={Eye} />
                    </section>

                    {topEvent && (
                        <section className="p-4 rounded-2xl bg-brand-accent/10 border border-brand-accent/20">
                            <p className="text-[10px] uppercase font-black tracking-widest text-brand-accent">
                                Most Used Feature
                            </p>

                            <h3 className="text-lg font-black mt-1 uppercase">
                                {cleanEventName(topEvent.eventName)}
                            </h3>

                            <p className="text-xs text-gray-400 mt-1">
                                {topEvent.count} actions
                            </p>
                        </section>
                    )}
                    <section className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                        <div className="rounded-3xl border border-white/10 bg-brand-gray p-5 space-y-4">
                            <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <Users size={16} className="text-brand-accent" />
                                Most Active Members
                            </h2>

                            {topActiveUsers.length === 0 ? (
                                <p className="text-xs text-gray-500">No user activity yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {topActiveUsers.map((item, index) => (
                                        <div
                                            key={item.userId}
                                            className="flex items-center justify-between gap-3 rounded-2xl bg-brand-black/50 border border-white/5 p-3"
                                        >
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-wider">
                                                    #{index + 1} {getProfileName(item.userId)}
                                                </p>
                                                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest">
                                                    @{item.profile?.username || 'member'}
                                                </p>
                                            </div>

                                            <p className="text-brand-accent text-sm font-black">
                                                {item.count}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>

                        <div className="rounded-3xl border border-white/10 bg-brand-gray p-5 space-y-4">
                            <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                                <BarChart3 size={16} className="text-brand-accent" />
                                Event Breakdown
                            </h2>

                            {eventBreakdown.length === 0 ? (
                                <p className="text-xs text-gray-500">No events tracked yet.</p>
                            ) : (
                                <div className="space-y-3">
                                    {eventBreakdown.map((item) => (
                                        <div
                                            key={item.eventName}
                                            className="flex items-center justify-between gap-3 rounded-2xl bg-brand-black/50 border border-white/5 p-3"
                                        >
                                            <p className="text-xs font-black uppercase tracking-wider">
                                                {cleanEventName(item.eventName)}
                                            </p>

                                            <p className="text-brand-accent text-sm font-black">
                                                {item.count}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </section>

                    <section className="rounded-3xl border border-white/10 bg-brand-gray p-5 space-y-4">
                        <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <Eye size={16} className="text-brand-accent" />
                            Most Viewed Photos
                        </h2>

                        {mostViewedPhotos.length === 0 ? (
                            <p className="text-xs text-gray-500">No photo views tracked yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {mostViewedPhotos.map((item, index) => (
                                    <Link
                                        key={item.photoId}
                                        to={`/photo/${item.photoId}`}
                                        className="flex items-center justify-between gap-3 rounded-2xl bg-brand-black/50 border border-white/5 p-3 hover:border-brand-accent/30 transition-all"
                                    >
                                        <p className="text-xs font-black uppercase tracking-wider">
                                            #{index + 1} Photo {item.photoId.slice(0, 8)}
                                        </p>

                                        <p className="text-brand-accent text-sm font-black">
                                            {item.count} views
                                        </p>
                                    </Link>
                                ))}
                            </div>
                        )}
                    </section>

                    <section className="rounded-3xl border border-white/10 bg-brand-gray p-5 space-y-4">
                        <h2 className="text-sm font-black uppercase tracking-widest flex items-center gap-2">
                            <Activity size={16} className="text-brand-accent" />
                            Live Event Feed
                        </h2>

                        {events.length === 0 ? (
                            <p className="text-xs text-gray-500">No events yet.</p>
                        ) : (
                            <div className="space-y-3">
                                {events.slice(0, 25).map((event) => (
                                    <div
                                        key={event.id}
                                        className="rounded-2xl bg-brand-black/50 border border-white/5 p-3"
                                    >
                                        <div className="flex items-start justify-between gap-3">
                                            <div>
                                                <p className="text-xs font-black uppercase tracking-wider">
                                                    {getProfileName(event.user_id)}{' '}
                                                    <span className="text-brand-accent">
                                                        {cleanEventName(event.event_name)}
                                                    </span>
                                                </p>

                                                <p className="text-[10px] text-gray-600 font-bold uppercase tracking-widest mt-1">
                                                    {event.page || 'Unknown page'} •{' '}
                                                    {formatTimeAgo(event.created_at)}
                                                </p>
                                            </div>
                                        </div>

                                        {event.metadata && Object.keys(event.metadata).length > 0 && (
                                            <pre className="mt-3 max-h-28 overflow-auto rounded-xl bg-black/40 p-3 text-[10px] text-gray-500 whitespace-pre-wrap">
                                                {JSON.stringify(event.metadata, null, 2)}
                                            </pre>
                                        )}
                                    </div>
                                ))}
                            </div>
                        )}
                    </section>
                </>
            )}
        </div>
    );
}