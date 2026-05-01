import React, { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
    ArrowLeft,
    ArrowRight,
    Camera,
    Loader2,
    Sparkles,
    Trophy,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type Challenge = {
    id: string;
    title: string;
    description: string;
    is_anonymous: boolean;
    created_at: string;
};

export default function ChallengeDetail() {
    const { challengeId } = useParams();
    const navigate = useNavigate();

    const [challenge, setChallenge] = useState<Challenge | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [pageError, setPageError] = useState('');

    useEffect(() => {
        const loadChallenge = async () => {
            if (!challengeId) {
                setPageError('Challenge not found.');
                setIsLoading(false);
                return;
            }

            setIsLoading(true);
            setPageError('');

            const { data, error } = await supabase
                .from('challenge_suggestions')
                .select('id, title, description, is_anonymous, created_at')
                .eq('id', challengeId)
                .eq('is_approved', true)
                .maybeSingle();

            if (error) {
                setPageError(error.message);
                setChallenge(null);
                setIsLoading(false);
                return;
            }

            if (!data) {
                setPageError('This challenge is not available yet.');
                setChallenge(null);
                setIsLoading(false);
                return;
            }

            setChallenge(data as Challenge);
            setIsLoading(false);
        };

        loadChallenge();
    }, [challengeId]);

    if (isLoading) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <div className="flex items-center gap-3 text-gray-500">
                    <Loader2 size={20} className="animate-spin text-brand-accent" />
                    <span className="text-[10px] font-black uppercase tracking-widest">
                        Loading challenge
                    </span>
                </div>
            </div>
        );
    }

    if (pageError || !challenge) {
        return (
            <div className="space-y-6 pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-12">
                <button
                    type="button"
                    onClick={() => navigate(-1)}
                    className="min-h-[44px] flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
                >
                    <ArrowLeft size={18} />
                    Back
                </button>

                <div className="rounded-3xl border border-brand-critique/30 bg-brand-critique/10 p-6">
                    <p className="text-[10px] font-black uppercase tracking-widest text-brand-critique leading-relaxed">
                        {pageError || 'Challenge not found.'}
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="space-y-6 pb-[calc(7rem+env(safe-area-inset-bottom))] md:pb-12">
            <button
                type="button"
                onClick={() => navigate(-1)}
                className="min-h-[44px] flex items-center gap-2 text-gray-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
            >
                <ArrowLeft size={18} />
                Back
            </button>

            <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="rounded-[2rem] border border-white/10 bg-brand-gray overflow-hidden relative"
            >
                <div className="absolute -top-24 -right-24 w-64 h-64 rounded-full bg-brand-accent/20 blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-brand-critique/10 blur-3xl" />

                <div className="relative z-10 p-6 md:p-8 space-y-6">
                    <div className="inline-flex items-center gap-2 rounded-full bg-brand-black border border-white/10 px-4 py-2">
                        <Trophy size={14} className="text-brand-accent" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-brand-accent">
                            Monthly Challenge
                        </span>
                    </div>

                    <div className="space-y-3">
                        <h1 className="text-4xl md:text-6xl font-black uppercase tracking-tighter leading-none">
                            {challenge.title}
                        </h1>

                        <p className="text-base md:text-lg text-gray-300 font-medium leading-relaxed max-w-2xl">
                            {challenge.description}
                        </p>
                    </div>

                    <div className="grid gap-3 md:grid-cols-3">
                        <div className="rounded-3xl bg-brand-black/60 border border-white/10 p-4">
                            <Camera size={18} className="text-brand-accent mb-3" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-white mb-2">
                                Submit Your Frame
                            </p>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Upload a single image or a full set that answers this challenge.
                            </p>
                        </div>

                        <div className="rounded-3xl bg-brand-black/60 border border-white/10 p-4">
                            <Sparkles size={18} className="text-brand-accent mb-3" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-white mb-2">
                                Get Real Feedback
                            </p>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                Your submission will still go through the normal critique flow.
                            </p>
                        </div>

                        <div className="rounded-3xl bg-brand-black/60 border border-white/10 p-4">
                            <Trophy size={18} className="text-brand-accent mb-3" />
                            <p className="text-[10px] font-black uppercase tracking-widest text-white mb-2">
                                Challenge Tagged
                            </p>
                            <p className="text-xs text-gray-500 leading-relaxed">
                                This upload will be connected to the challenge for later sorting.
                            </p>
                        </div>
                    </div>

                    <Link
                        to={`/submit?challengeId=${challenge.id}`}
                        className="min-h-[52px] w-full md:w-auto inline-flex items-center justify-center gap-2 px-6 rounded-2xl bg-brand-accent text-brand-black text-[10px] font-black uppercase tracking-widest hover:bg-white transition-all"
                    >
                        Submit To This Challenge
                        <ArrowRight size={16} />
                    </Link>
                </div>
            </motion.section>
        </div>
    );
}