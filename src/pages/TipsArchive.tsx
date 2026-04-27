import React, { useEffect, useMemo, useState } from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, BookOpen, Filter, Loader2, Sparkles } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type TipCategory = 'All' | 'Shooting' | 'Posing' | 'Retouching' | 'Business';

type Tip = {
    id: string;
    content: string;
    category: string | null;
    is_anonymous: boolean;
    is_approved: boolean;
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
    const [selectedCategory, setSelectedCategory] = useState<TipCategory>('All');
    const [isLoading, setIsLoading] = useState(true);
    const [pageError, setPageError] = useState('');

    useEffect(() => {
        const loadTips = async () => {
            setIsLoading(true);
            setPageError('');

            const { data, error } = await supabase
                .from('tips')
                .select('id, content, category, is_anonymous, is_approved, created_at')
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

        loadTips();
    }, []);

    const currentDayIndex = getCurrentTipDayIndex(tips.length);

    const unlockedTips = useMemo(() => {
        return tips.filter((_, index) => index <= currentDayIndex);
    }, [tips, currentDayIndex]);

    const filteredTips = useMemo(() => {
        if (selectedCategory === 'All') return unlockedTips;

        return unlockedTips.filter((tip) => tip.category === selectedCategory);
    }, [unlockedTips, selectedCategory]);

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
                        More tips unlocked daily
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
                        More tips unlocked daily. Revisit shooting, posing, retouching, and
                        photography business advice from the beta.
                    </p>
                </div>
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
                                            {displayDate}
                                        </span>
                                    </div>

                                    <p className="text-lg md:text-xl font-black uppercase tracking-tight leading-tight text-white">
                                        {tip.content}
                                    </p>

                                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-600">
                                        {displayDate}
                                    </p>
                                </div>
                            </motion.article>
                        );
                    })}
                </section>
            )}

            <div className="rounded-3xl border border-white/10 bg-white/[0.03] p-5 text-center">
                <p className="text-[10px] font-black uppercase tracking-widest leading-relaxed text-gray-500">
                    More tips unlocked daily
                </p>
            </div>
        </div>
    );
}