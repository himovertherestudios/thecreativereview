import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import {
    ArrowLeft,
    BookOpen,
    Filter,
    Heart,
    Loader2,
    Send,
    Sparkles,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type TipCategory = 'All' | 'Shooting' | 'Posing' | 'Retouching' | 'Business';

type Tip = {
    id: string;
    content: string;
    category: string | null;
    is_anonymous: boolean;
    is_approved: boolean;
    source: string | null;
    submitted_by: string | null;
    upvotes_count: number | null;
    created_at: string;
};

const BETA_TIP_LAUNCH_DATE = new Date('2026-04-27T00:00:00');

const CATEGORIES: TipCategory[] = [
    'All',
    'Shooting',
    'Posing',
    'Retouching',
    'Business',
];

const SUBMIT_CATEGORIES: Exclude<TipCategory, 'All'>[] = [
    'Shooting',
    'Posing',
    'Retouching',
    'Business',
];

function getCurrentTipDayIndex(totalTips: number) {
    if (totalTips <= 0) return 0;

    const now = new Date();
    const todayMidnight = new Date(now.getFullYear(), now.getMonth(), now.getDate());

    const launchMidnight = new Date(
        BETA_TIP_LAUNCH_DATE.getFullYear(),
        BETA_TIP_LAUNCH_DATE.getMonth(),
        BETA_TIP_LAUNCH_DATE.getDate()
    );

    const msPerDay = 1000 * 60 * 60 * 24;
    const dayDifference = Math.floor(
        (todayMidnight.getTime() - launchMidnight.getTime()) / msPerDay
    );

    return Math.max(0, Math.min(dayDifference, totalTips - 1));
}

function getOrdinalSuffix(day: number) {
    if (day > 3 && day < 21) return 'th';

    switch (day % 10) {
        case 1:
            return 'st';
        case 2:
            return 'nd';
        case 3:
            return 'rd';
        default:
            return 'th';
    }
}

function formatTipDate(index: number) {
    const date = new Date(BETA_TIP_LAUNCH_DATE);
    date.setDate(BETA_TIP_LAUNCH_DATE.getDate() + index);

    const month = date.toLocaleString('en-US', { month: 'long' });
    const day = date.getDate();

    return `${month} ${day}${getOrdinalSuffix(day)}`;
}

export default function TipsArchive() {
    const [tips, setTips] = useState<Tip[]>([]);
    const [likedTipIds, setLikedTipIds] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<TipCategory>('All');
    const [isLoading, setIsLoading] = useState(true);
    const [pageError, setPageError] = useState('');

    const [newTip, setNewTip] = useState('');
    const [newTipCategory, setNewTipCategory] =
        useState<Exclude<TipCategory, 'All'>>('Shooting');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [isSubmittingTip, setIsSubmittingTip] = useState(false);
    const [submitMessage, setSubmitMessage] = useState('');

    const loadTips = async () => {
        setIsLoading(true);
        setPageError('');

        const { data, error } = await supabase
            .from('tips')
            .select(
                'id, content, category, is_anonymous, is_approved, source, submitted_by, upvotes_count, created_at'
            )
            .eq('is_approved', true)
            .order('created_at', { ascending: true })
            .limit(100);

        if (error) {
            setPageError(error.message);
            setTips([]);
            setIsLoading(false);
            return;
        }

        setTips((data || []) as Tip[]);
        setIsLoading(false);
    };

    const loadLikedTips = async () => {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setLikedTipIds([]);
            return;
        }

        const { data, error } = await supabase
            .from('tip_upvotes')
            .select('tip_id')
            .eq('user_id', user.id);

        if (error) {
            console.warn('Could not load liked tips:', error.message);
            setLikedTipIds([]);
            return;
        }

        setLikedTipIds((data || []).map((item) => item.tip_id));
    };

    useEffect(() => {
        loadTips();
        loadLikedTips();
    }, []);

    const currentDayIndex = getCurrentTipDayIndex(tips.length);

    const unlockedTips = useMemo(() => {
        return tips.filter((_, index) => index <= currentDayIndex);
    }, [tips, currentDayIndex]);

    const filteredTips = useMemo(() => {
        if (selectedCategory === 'All') return unlockedTips;

        return unlockedTips.filter((tip) => tip.category === selectedCategory);
    }, [unlockedTips, selectedCategory]);

    const handleSubmitTip = async () => {
        const cleanTip = newTip.trim();

        if (!cleanTip) {
            setSubmitMessage('Add a tip before submitting.');
            return;
        }

        if (cleanTip.length < 12) {
            setSubmitMessage('Make the tip a little more helpful before submitting.');
            return;
        }

        setIsSubmittingTip(true);
        setSubmitMessage('');

        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) throw userError;

            if (!user) {
                throw new Error('You must be logged in to submit a tip.');
            }

            const { error } = await supabase.from('tips').insert({
                content: cleanTip,
                category: newTipCategory,
                is_anonymous: isAnonymous,
                is_approved: false,
                source: 'user',
                submitted_by: user.id,
                upvotes_count: 0,
            });

            if (error) throw error;

            setNewTip('');
            setNewTipCategory('Shooting');
            setIsAnonymous(false);
            setSubmitMessage('Tip submitted. It will appear after approval.');
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Something went wrong submitting your tip.';

            setSubmitMessage(message);
        } finally {
            setIsSubmittingTip(false);
        }
    };

    const handleToggleLike = async (tip: Tip) => {
        const {
            data: { user },
        } = await supabase.auth.getUser();

        if (!user) {
            setPageError('You must be logged in to like a tip.');
            return;
        }

        const alreadyLiked = likedTipIds.includes(tip.id);

        setLikedTipIds((current) =>
            alreadyLiked ? current.filter((id) => id !== tip.id) : [...current, tip.id]
        );

        setTips((currentTips) =>
            currentTips.map((item) => {
                if (item.id !== tip.id) return item;

                const currentCount = item.upvotes_count || 0;

                return {
                    ...item,
                    upvotes_count: alreadyLiked
                        ? Math.max(0, currentCount - 1)
                        : currentCount + 1,
                };
            })
        );

        if (alreadyLiked) {
            const { error } = await supabase
                .from('tip_upvotes')
                .delete()
                .eq('tip_id', tip.id)
                .eq('user_id', user.id);

            if (error) {
                console.warn('Could not unlike tip:', error.message);
                await loadTips();
                await loadLikedTips();
            }

            return;
        }

        const { error: upvoteError } = await supabase.from('tip_upvotes').insert({
            tip_id: tip.id,
            user_id: user.id,
        });

        if (upvoteError) {
            console.warn('Could not like tip:', upvoteError.message);
            await loadTips();
            await loadLikedTips();
            return;
        }

        const { error: countError } = await supabase
            .from('tips')
            .update({
                upvotes_count: (tip.upvotes_count || 0) + 1,
            })
            .eq('id', tip.id);

        if (countError) {
            console.warn('Could not update tip count:', countError.message);
        }
    };

    return (
        <div className="pb-10 space-y-6">
            <div className="sticky top-16 md:top-0 z-30 -mx-4 px-4 py-4 bg-brand-black/95 backdrop-blur-xl border-b border-white/10">
                <div className="max-w-5xl mx-auto flex items-center justify-between gap-3">
                    <Link
                        to="/dashboard"
                        className="min-h-[44px] flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
                    >
                        <ArrowLeft size={18} />
                        Dashboard
                    </Link>

                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent">
                        Tips + community gems
                    </p>
                </div>
            </div>

            <section className="rounded-3xl border border-white/10 bg-brand-gray p-5 md:p-7 relative overflow-hidden">
                <div className="absolute -top-20 -right-20 w-48 h-48 rounded-full bg-brand-accent/10 blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-56 h-56 rounded-full bg-brand-critique/10 blur-3xl" />

                <div className="relative z-10">
                    <div className="flex items-center gap-2 text-brand-accent mb-3">
                        <BookOpen size={18} />
                        <p className="text-[10px] font-black uppercase tracking-[0.3em]">
                            Tips Archive
                        </p>
                    </div>

                    <h1 className="text-4xl md:text-5xl font-black tracking-tighter uppercase leading-none">
                        Tips Archive
                    </h1>

                    <p className="text-sm md:text-base text-gray-400 font-medium leading-relaxed mt-3 max-w-2xl">
                        AI and admin tips keep the dashboard active while the beta fills up.
                        Beta users can submit tips, like them, and help surface the strongest gems.
                    </p>
                </div>
            </section>

            <section className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 space-y-4">
                <div>
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent mb-2">
                        Submit A Tip
                    </p>
                    <p className="text-sm text-gray-400 leading-relaxed">
                        Drop a useful shooting, posing, retouching, or business tip for the community.
                        Approved tips will show in the archive.
                    </p>
                </div>

                <textarea
                    value={newTip}
                    onChange={(event) => setNewTip(event.target.value)}
                    placeholder="Example: Before asking for critique, name the exact thing you want feedback on — lighting, pose, edit, crop, or story."
                    rows={4}
                    className="w-full rounded-2xl bg-brand-black border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-brand-accent resize-none"
                />

                <div className="grid grid-cols-1 md:grid-cols-[1fr_auto] gap-3">
                    <select
                        value={newTipCategory}
                        onChange={(event) =>
                            setNewTipCategory(event.target.value as Exclude<TipCategory, 'All'>)
                        }
                        className="min-h-[46px] rounded-2xl bg-brand-black border border-white/10 px-4 text-sm text-white outline-none focus:border-brand-accent"
                    >
                        {SUBMIT_CATEGORIES.map((category) => (
                            <option key={category} value={category}>
                                {category}
                            </option>
                        ))}
                    </select>

                    <button
                        type="button"
                        onClick={() => setIsAnonymous((current) => !current)}
                        className={`min-h-[46px] px-4 rounded-2xl border text-[10px] font-black uppercase tracking-widest transition-all ${isAnonymous
                                ? 'bg-brand-accent border-brand-accent text-brand-black'
                                : 'bg-brand-black border-white/10 text-gray-400 hover:text-white'
                            }`}
                    >
                        {isAnonymous ? 'Anonymous On' : 'Post With Name'}
                    </button>
                </div>

                <button
                    type="button"
                    onClick={handleSubmitTip}
                    disabled={isSubmittingTip}
                    className="min-h-[50px] w-full rounded-2xl bg-brand-accent text-brand-black text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-all disabled:opacity-60"
                >
                    {isSubmittingTip ? (
                        <>
                            <Loader2 size={15} className="animate-spin" />
                            Submitting
                        </>
                    ) : (
                        <>
                            <Send size={15} />
                            Submit Tip
                        </>
                    )}
                </button>

                {submitMessage && (
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent leading-relaxed">
                        {submitMessage}
                    </p>
                )}
            </section>

            <section className="space-y-3">
                <div className="flex items-center gap-2 text-gray-600 px-1">
                    <Filter size={14} />
                    <p className="text-[10px] font-black uppercase tracking-widest">
                        Filter by category
                    </p>
                </div>

                <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
                    {CATEGORIES.map((category) => {
                        const isActive = selectedCategory === category;

                        return (
                            <button
                                key={category}
                                type="button"
                                onClick={() => setSelectedCategory(category)}
                                className={`min-h-[40px] px-4 rounded-full border flex items-center justify-center text-[9px] font-black uppercase tracking-widest whitespace-nowrap transition-all ${isActive
                                        ? 'bg-brand-accent border-brand-accent text-brand-black'
                                        : 'border-white/10 bg-brand-gray text-gray-500 hover:text-white hover:border-white/20'
                                    }`}
                            >
                                {category}
                            </button>
                        );
                    })}
                </div>
            </section>

            {isLoading && (
                <div className="min-h-[220px] bg-brand-gray border border-white/10 rounded-3xl flex items-center justify-center">
                    <div className="flex items-center gap-3 text-gray-500">
                        <Loader2 size={18} className="animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            Loading tips...
                        </span>
                    </div>
                </div>
            )}

            {pageError && !isLoading && (
                <div className="rounded-3xl border border-brand-critique/30 bg-brand-critique/10 p-5">
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-critique leading-relaxed">
                        {pageError}
                    </p>
                </div>
            )}

            {!isLoading && !pageError && filteredTips.length === 0 && (
                <div className="min-h-[220px] rounded-3xl border border-white/10 bg-white/[0.03] p-6 flex flex-col items-center justify-center text-center">
                    <Sparkles size={26} className="text-brand-accent mb-4" />

                    <p className="text-xl font-black uppercase tracking-tight text-white mb-2">
                        No Tips Here Yet
                    </p>

                    <p className="text-sm text-gray-400 max-w-sm">
                        This category will fill in as more daily tips unlock during beta.
                    </p>
                </div>
            )}

            {!isLoading && !pageError && filteredTips.length > 0 && (
                <section className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {filteredTips.map((tip) => {
                        const originalIndex = tips.findIndex((item) => item.id === tip.id);
                        const displayDate = formatTipDate(originalIndex);
                        const isLiked = likedTipIds.includes(tip.id);

                        return (
                            <motion.article
                                key={tip.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="rounded-3xl border border-white/10 bg-brand-gray p-5 relative overflow-hidden"
                            >
                                <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-brand-accent/10 blur-3xl" />

                                <div className="relative z-10 space-y-4">
                                    <div className="flex items-center justify-between gap-3">
                                        <span className="px-3 py-2 rounded-full bg-brand-black border border-white/10 text-[9px] font-black uppercase tracking-widest text-brand-accent">
                                            {tip.category || 'Shooting'}
                                        </span>

                                        <span className="text-[9px] font-black uppercase tracking-widest text-gray-500">
                                            {tip.source === 'user' ? 'Community Tip' : displayDate}
                                        </span>
                                    </div>

                                    <p className="text-lg md:text-xl font-black uppercase tracking-tight leading-tight text-white">
                                        {tip.content}
                                    </p>

                                    <div className="flex items-center justify-between gap-3">
                                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                                            {tip.source === 'user' ? 'Submitted by beta community' : displayDate}
                                        </p>

                                        <button
                                            type="button"
                                            onClick={() => handleToggleLike(tip)}
                                            className={`min-h-[38px] px-3 rounded-full border flex items-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${isLiked
                                                    ? 'bg-brand-accent border-brand-accent text-brand-black'
                                                    : 'bg-brand-black border-white/10 text-gray-400 hover:text-white'
                                                }`}
                                        >
                                            <Heart size={14} className={isLiked ? 'fill-current' : ''} />
                                            {tip.upvotes_count || 0}
                                        </button>
                                    </div>
                                </div>
                            </motion.article>
                        );
                    })}
                </section>
            )}

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed text-gray-500">
                    More tips unlocked daily. Community tips appear after approval.
                </p>
            </div>
        </div>
    );
}