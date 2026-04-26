import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import {
    ArrowLeft,
    CheckCircle2,
    Circle,
    Crown,
    Loader2,
    AlertCircle,
    ShieldAlert,
    Star,
    XCircle,
    RefreshCw,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type ChallengeSuggestion = {
    id: string;
    user_id: string | null;
    title: string;
    description: string;
    is_anonymous: boolean;
    is_approved: boolean;
    is_selected: boolean;
    created_at: string;
};

type AdminStatus = 'loading' | 'allowed' | 'blocked';

export default function ChallengeAdmin() {
    const [adminStatus, setAdminStatus] = useState<AdminStatus>('loading');
    const [suggestions, setSuggestions] = useState<ChallengeSuggestion[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [isUpdatingId, setIsUpdatingId] = useState<string | null>(null);
    const [errorMessage, setErrorMessage] = useState('');

    const loadAdminStatus = async () => {
        setAdminStatus('loading');

        const {
            data: { user },
            error: userError,
        } = await supabase.auth.getUser();

        if (userError || !user) {
            setAdminStatus('blocked');
            return;
        }

        const { data, error } = await supabase
            .from('profiles')
            .select('is_admin')
            .eq('id', user.id)
            .maybeSingle();

        if (error || !data?.is_admin) {
            setAdminStatus('blocked');
            return;
        }

        setAdminStatus('allowed');
    };

    const loadSuggestions = async () => {
        setIsLoading(true);
        setErrorMessage('');

        const { data, error } = await supabase
            .from('challenge_suggestions')
            .select(
                'id, user_id, title, description, is_anonymous, is_approved, is_selected, created_at'
            )
            .order('created_at', { ascending: false });

        if (error) {
            setErrorMessage(error.message);
            setSuggestions([]);
            setIsLoading(false);
            return;
        }

        setSuggestions((data || []) as ChallengeSuggestion[]);
        setIsLoading(false);
    };

    const refresh = async () => {
        await loadAdminStatus();
        await loadSuggestions();
    };

    useEffect(() => {
        refresh();
    }, []);

    const toggleApproved = async (suggestion: ChallengeSuggestion) => {
        setIsUpdatingId(suggestion.id);
        setErrorMessage('');

        const nextApprovedValue = !suggestion.is_approved;

        const { error } = await supabase
            .from('challenge_suggestions')
            .update({
                is_approved: nextApprovedValue,
                is_selected: nextApprovedValue ? suggestion.is_selected : false,
            })
            .eq('id', suggestion.id);

        if (error) {
            setErrorMessage(error.message);
            setIsUpdatingId(null);
            return;
        }

        await loadSuggestions();
        setIsUpdatingId(null);
    };

    const selectChallenge = async (suggestion: ChallengeSuggestion) => {
        setIsUpdatingId(suggestion.id);
        setErrorMessage('');

        const unselectAll = await supabase
            .from('challenge_suggestions')
            .update({ is_selected: false })
            .neq('id', suggestion.id);

        if (unselectAll.error) {
            setErrorMessage(unselectAll.error.message);
            setIsUpdatingId(null);
            return;
        }

        const selectCurrent = await supabase
            .from('challenge_suggestions')
            .update({
                is_approved: true,
                is_selected: true,
            })
            .eq('id', suggestion.id);

        if (selectCurrent.error) {
            setErrorMessage(selectCurrent.error.message);
            setIsUpdatingId(null);
            return;
        }

        await loadSuggestions();
        setIsUpdatingId(null);
    };

    if (adminStatus === 'loading') {
        return (
            <div className="min-h-[50vh] flex items-center justify-center">
                <div className="flex items-center gap-3 text-gray-500">
                    <Loader2 size={18} className="animate-spin" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        Checking admin access...
                    </span>
                </div>
            </div>
        );
    }

    if (adminStatus === 'blocked') {
        return (
            <div className="max-w-2xl mx-auto space-y-6 pb-10">
                <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                >
                    <ArrowLeft size={14} />
                    Back to dashboard
                </Link>

                <div className="rounded-3xl border border-brand-critique/30 bg-brand-critique/10 p-6 text-center">
                    <ShieldAlert size={34} className="text-brand-critique mx-auto mb-4" />

                    <h1 className="text-2xl font-black uppercase tracking-tight mb-3">
                        Admin Only
                    </h1>

                    <p className="text-sm text-gray-400 leading-relaxed">
                        You do not have access to manage weekly challenges.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="max-w-5xl mx-auto space-y-6 pb-10">
            <div className="flex items-center justify-between gap-4">
                <Link
                    to="/dashboard"
                    className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
                >
                    <ArrowLeft size={14} />
                    Back to dashboard
                </Link>

                <button
                    type="button"
                    onClick={refresh}
                    className="min-h-[42px] px-4 rounded-2xl bg-brand-gray border border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-white hover:border-brand-accent/40 transition-all flex items-center gap-2"
                >
                    <RefreshCw size={14} />
                    Refresh
                </button>
            </div>

            <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl border border-white/10 bg-brand-gray p-5 md:p-8"
            >
                <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-brand-accent/10 blur-3xl" />

                <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-brand-accent text-brand-black flex items-center justify-center mb-5">
                        <Crown size={22} />
                    </div>

                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent mb-3">
                        Admin Manager
                    </p>

                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-4">
                        Weekly Challenges
                    </h1>

                    <p className="text-sm md:text-base text-gray-400 leading-relaxed max-w-2xl">
                        Approve member-submitted challenge ideas and choose which one appears on the dashboard.
                    </p>
                </div>
            </motion.section>

            {errorMessage && (
                <div className="rounded-2xl border border-brand-critique/30 bg-brand-critique/10 p-4 flex items-start gap-3">
                    <AlertCircle size={18} className="text-brand-critique flex-shrink-0 mt-0.5" />

                    <p className="text-[10px] uppercase font-black tracking-widest text-brand-critique leading-relaxed">
                        {errorMessage}
                    </p>
                </div>
            )}

            {isLoading ? (
                <div className="rounded-3xl border border-white/10 bg-brand-gray p-8 flex items-center justify-center">
                    <div className="flex items-center gap-3 text-gray-500">
                        <Loader2 size={18} className="animate-spin" />
                        <span className="text-[10px] font-black uppercase tracking-widest">
                            Loading suggestions...
                        </span>
                    </div>
                </div>
            ) : suggestions.length === 0 ? (
                <div className="rounded-3xl border border-white/10 bg-brand-gray p-8 text-center">
                    <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                        No challenge suggestions yet.
                    </p>
                </div>
            ) : (
                <div className="grid gap-4">
                    {suggestions.map((suggestion) => {
                        const isUpdating = isUpdatingId === suggestion.id;

                        return (
                            <motion.article
                                key={suggestion.id}
                                initial={{ opacity: 0, y: 8 }}
                                animate={{ opacity: 1, y: 0 }}
                                className={`rounded-3xl border p-5 md:p-6 bg-brand-gray transition-all ${suggestion.is_selected
                                        ? 'border-brand-accent/70 shadow-2xl shadow-brand-accent/10'
                                        : 'border-white/10'
                                    }`}
                            >
                                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-5">
                                    <div className="min-w-0 flex-1">
                                        <div className="flex flex-wrap items-center gap-2 mb-3">
                                            {suggestion.is_selected && (
                                                <span className="px-2 py-1 rounded-full bg-brand-accent text-brand-black text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                                    <Star size={11} />
                                                    Active
                                                </span>
                                            )}

                                            {suggestion.is_approved ? (
                                                <span className="px-2 py-1 rounded-full bg-green-500/10 text-green-300 border border-green-500/30 text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                                    <CheckCircle2 size={11} />
                                                    Approved
                                                </span>
                                            ) : (
                                                <span className="px-2 py-1 rounded-full bg-white/5 text-gray-500 border border-white/10 text-[8px] font-black uppercase tracking-widest flex items-center gap-1">
                                                    <Circle size={11} />
                                                    Pending
                                                </span>
                                            )}

                                            {suggestion.is_anonymous && (
                                                <span className="px-2 py-1 rounded-full bg-white/5 text-gray-500 border border-white/10 text-[8px] font-black uppercase tracking-widest">
                                                    Anonymous
                                                </span>
                                            )}
                                        </div>

                                        <h2 className="text-2xl md:text-3xl font-black uppercase tracking-tight leading-none mb-3">
                                            {suggestion.title}
                                        </h2>

                                        <p className="text-sm text-gray-400 leading-relaxed">
                                            {suggestion.description}
                                        </p>

                                        <p className="text-[9px] font-black uppercase tracking-widest text-gray-700 mt-4">
                                            Submitted {new Date(suggestion.created_at).toLocaleDateString()}
                                        </p>
                                    </div>

                                    <div className="grid gap-2 md:w-[220px]">
                                        <button
                                            type="button"
                                            disabled={isUpdating}
                                            onClick={() => toggleApproved(suggestion)}
                                            className={`min-h-[44px] px-4 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 transition-all disabled:opacity-50 ${suggestion.is_approved
                                                    ? 'bg-brand-black border border-white/10 text-gray-400 hover:text-white'
                                                    : 'bg-white text-brand-black hover:bg-brand-accent'
                                                }`}
                                        >
                                            {isUpdating ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : suggestion.is_approved ? (
                                                <>
                                                    <XCircle size={14} />
                                                    Unapprove
                                                </>
                                            ) : (
                                                <>
                                                    <CheckCircle2 size={14} />
                                                    Approve
                                                </>
                                            )}
                                        </button>

                                        <button
                                            type="button"
                                            disabled={isUpdating}
                                            onClick={() => selectChallenge(suggestion)}
                                            className="min-h-[44px] px-4 rounded-2xl bg-brand-accent text-brand-black text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-all disabled:opacity-50"
                                        >
                                            {isUpdating ? (
                                                <Loader2 size={14} className="animate-spin" />
                                            ) : (
                                                <>
                                                    <Star size={14} />
                                                    Set Active
                                                </>
                                            )}
                                        </button>
                                    </div>
                                </div>
                            </motion.article>
                        );
                    })}
                </div>
            )}
        </div>
    );
}