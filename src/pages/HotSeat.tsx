import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import {
    ArrowRight,
    Flame,
    Loader2,
    ShieldOff,
    AlertCircle,
    Camera,
} from 'lucide-react';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';

type SupabaseProfile = {
    role: string | null;
};

type SupabaseHotSeatRow = {
    id: string;
    image_url: string | null;
    watermarked_url: string | null;
    caption: string | null;
    content_rating: string | null;
    review_count: number | null;
    created_at: string;
    profiles: SupabaseProfile | SupabaseProfile[] | null;
};

type HotSeatItem = {
    id: string;
    imageUrl: string;
    caption: string;
    contentRating: string;
    creatorRole: string;
    reviewCount: number;
};

const FALLBACK_ACTIVITY_IMAGE =
    'https://picsum.photos/seed/creative-review-hot-seat/900/1200';

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

function getProfileRole(profileData: SupabaseHotSeatRow['profiles']) {
    if (!profileData) return 'Creative';

    if (Array.isArray(profileData)) {
        return profileData[0]?.role || 'Creative';
    }

    return profileData.role || 'Creative';
}

function getRatingLabel(contentRating: string) {
    if (contentRating === 'Explicit') return 'NSFW';
    return contentRating;
}

function getHotSeatCountdown() {
    const now = new Date();
    const tomorrow = new Date(now);

    tomorrow.setDate(now.getDate() + 1);
    tomorrow.setHours(0, 0, 0, 0);

    const diffMs = tomorrow.getTime() - now.getTime();

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs / (1000 * 60)) % 60);

    return `${hours}h ${minutes}m`;
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
        <div className="min-h-[320px] rounded-3xl border border-white/10 bg-white/[0.03] p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
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

export default function HotSeat() {
    const [hotSeat, setHotSeat] = useState<HotSeatItem | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [pageError, setPageError] = useState('');
    const [countdown, setCountdown] = useState(getHotSeatCountdown());

    const loadHotSeat = async () => {
        setIsLoading(true);
        setPageError('');

        try {
            const { data, error } = await supabase
                .from('photos')
                .select(
                    `
          id,
          image_url,
          watermarked_url,
          caption,
          content_rating,
          review_count,
          created_at,
          profiles (
            role
          )
        `
                )
                .or('is_hidden.is.null,is_hidden.eq.false')
                .order('review_count', { ascending: false })
                .order('created_at', { ascending: false })
                .limit(1)
                .maybeSingle();

            if (error) throw error;

            if (!data) {
                setHotSeat(null);
                return;
            }

            const photo = data as unknown as SupabaseHotSeatRow;

            const liveImageUrl = getPublicPhotoUrl(
                photo.watermarked_url || photo.image_url
            );

            setHotSeat({
                id: photo.id,
                imageUrl: liveImageUrl || FALLBACK_ACTIVITY_IMAGE,
                caption: photo.caption || 'Untitled critique post',
                contentRating: photo.content_rating || 'Safe',
                creatorRole: getProfileRole(photo.profiles),
                reviewCount: photo.review_count || 0,
            });
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Something went wrong loading the Hot Seat.';

            setPageError(message);
            setHotSeat(null);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        loadHotSeat();
    }, []);

    useEffect(() => {
        const timer = window.setInterval(() => {
            setCountdown(getHotSeatCountdown());
        }, 60000);

        return () => window.clearInterval(timer);
    }, []);

    if (isLoading) {
        return (
            <div className="min-h-[55vh] flex items-center justify-center">
                <div className="flex flex-col items-center gap-4 text-center text-gray-500">
                    <Loader2 size={24} className="animate-spin text-brand-accent" />

                    <p className="text-[10px] font-black uppercase tracking-[0.25em]">
                        Loading Hot Seat
                    </p>
                </div>
            </div>
        );
    }

    if (pageError) {
        return (
            <div className="pb-10">
                <BetaEmptyState
                    icon={AlertCircle}
                    eyebrow="Hot Seat Error"
                    title="Hot Seat Couldn’t Load"
                    body={pageError}
                    action={
                        <button
                            type="button"
                            onClick={loadHotSeat}
                            className="cr-button-primary"
                        >
                            Try Again
                        </button>
                    }
                />
            </div>
        );
    }

    if (!hotSeat) {
        return (
            <div className="pb-10">
                <BetaEmptyState
                    icon={Camera}
                    eyebrow="No Hot Seat Yet"
                    title="The Chair Is Empty"
                    body="Once members upload critique requests and the community starts reviewing them, the most discussed post will become the current Hot Seat."
                    action={
                        <Link to="/submit" className="cr-button-primary">
                            Submit First <ArrowRight size={14} />
                        </Link>
                    }
                />
            </div>
        );
    }

    return (
        <div className="pb-10 space-y-5">
            <section className="space-y-3">
                <div className="flex items-center gap-2 text-brand-accent">
                    <Flame size={18} className="fill-brand-accent" />

                    <p className="text-[10px] font-black uppercase tracking-[0.3em]">
                        Hot Seat
                    </p>
                </div>

                <div className="space-y-2">
                    <h1 className="text-4xl md:text-6xl font-black tracking-tighter uppercase leading-none">
                        Today’s pressure test.
                    </h1>

                    <p className="text-sm md:text-base text-gray-400 font-medium leading-relaxed max-w-2xl">
                        The most discussed critique post gets featured here. Drop a useful
                        review, ask a sharper question, or help the creative level up.
                    </p>
                </div>
            </section>

            <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl border border-brand-accent/20 bg-brand-black shadow-cr-red"
            >
                <div className="grid md:grid-cols-[minmax(0,1fr)_380px] min-h-[640px]">
                    <Link
                        to={`/photo/${hotSeat.id}`}
                        className="relative min-h-[520px] md:min-h-full overflow-hidden group"
                    >
                        <img
                            src={hotSeat.imageUrl}
                            alt="Hot Seat critique"
                            className={`w-full h-full object-cover transition-transform duration-500 group-hover:scale-105 ${hotSeat.contentRating === 'Explicit'
                                ? 'blur-2xl scale-105'
                                : ''
                                }`}
                            draggable={false}
                            onContextMenu={(event) => event.preventDefault()}
                            onError={(event) => {
                                event.currentTarget.src = FALLBACK_ACTIVITY_IMAGE;
                            }}
                        />

                        <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent" />

                        {hotSeat.contentRating === 'Explicit' && (
                            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/55 backdrop-blur-[24px] text-center p-5">
                                <ShieldOff size={36} className="text-brand-critique mb-3" />

                                <p className="text-[10px] font-black uppercase tracking-widest text-white">
                                    NSFW Hot Seat
                                </p>

                                <p className="text-[10px] text-gray-400 mt-2 max-w-xs">
                                    Open to review with respect.
                                </p>
                            </div>
                        )}

                        <div className="absolute top-4 left-4 z-20 flex flex-wrap gap-2">
                            <span className="cr-badge-red">
                                <Flame size={12} />
                                Hot Seat
                            </span>

                            <span className="cr-badge">Daily Feature</span>
                        </div>
                    </Link>

                    <aside className="p-5 md:p-6 bg-brand-gray border-t md:border-t-0 md:border-l border-white/10 flex flex-col justify-between">
                        <div className="space-y-5">
                            <div className="rounded-3xl border border-white/10 bg-brand-black/70 p-5">
                                <p className="text-[9px] font-black uppercase tracking-[0.25em] text-gray-500 mb-2">
                                    Resets In
                                </p>

                                <p className="text-3xl font-black uppercase tracking-tight text-white">
                                    {countdown}
                                </p>

                                <p className="text-xs text-gray-500 mt-2 leading-relaxed">
                                    The Hot Seat refreshes daily based on the most active critique
                                    energy in the beta.
                                </p>
                            </div>

                            <div className="flex flex-wrap gap-2">
                                <span className="cr-badge">
                                    {getRatingLabel(hotSeat.contentRating)}
                                </span>

                                <span className="cr-badge">{hotSeat.creatorRole}</span>

                                <span className="cr-badge-red">
                                    {hotSeat.reviewCount} critique
                                    {hotSeat.reviewCount === 1 ? '' : 's'}
                                </span>
                            </div>

                            <div>
                                <p className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-accent mb-3">
                                    Current Feature
                                </p>

                                <h2 className="text-3xl md:text-4xl font-black uppercase tracking-tight leading-none text-white">
                                    {hotSeat.caption}
                                </h2>

                                <p className="text-sm text-gray-400 leading-relaxed mt-4">
                                    This is where the community’s attention is right now. If you
                                    have something useful to add, this is the post to sharpen.
                                </p>
                            </div>
                        </div>

                        <div className="grid gap-3 mt-8">
                            <Link
                                to={`/photo/${hotSeat.id}`}
                                className="cr-button-primary"
                            >
                                Drop A Review <ArrowRight size={14} />
                            </Link>

                            <Link to="/feed" className="cr-button-secondary">
                                Browse Feed
                            </Link>
                        </div>
                    </aside>
                </div>
            </motion.section>
        </div>
    );
}