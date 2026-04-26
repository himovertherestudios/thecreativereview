import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
    ArrowLeft,
    Lightbulb,
    Send,
    Loader2,
    AlertCircle,
    CheckCircle2,
    EyeOff,
    User,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

export default function ChallengeSuggestion() {
    const [title, setTitle] = useState('');
    const [description, setDescription] = useState('');
    const [isAnonymous, setIsAnonymous] = useState(false);
    const [status, setStatus] = useState<SubmitStatus>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const titleCount = title.trim().length;
    const descriptionCount = description.trim().length;

    const canSubmit =
        titleCount >= 3 &&
        titleCount <= 80 &&
        descriptionCount >= 10 &&
        descriptionCount <= 500 &&
        status !== 'loading';

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();

        if (!canSubmit) return;

        setStatus('loading');
        setErrorMessage('');

        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) {
                throw userError;
            }

            if (!user) {
                throw new Error('You need to be logged in to submit a challenge idea.');
            }

            const { error } = await supabase.from('challenge_suggestions').insert({
                user_id: user.id,
                title: title.trim(),
                description: description.trim(),
                is_anonymous: isAnonymous,
                is_approved: false,
                is_selected: false,
            });

            if (error) {
                throw error;
            }

            setTitle('');
            setDescription('');
            setIsAnonymous(false);
            setStatus('success');
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Something went wrong submitting your challenge idea.';

            setErrorMessage(message);
            setStatus('error');
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-10">
            <Link
                to="/dashboard"
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
            >
                <ArrowLeft size={14} />
                Back to dashboard
            </Link>

            <motion.section
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-3xl border border-white/10 bg-brand-gray p-5 md:p-8"
            >
                <div className="absolute -top-20 -right-20 w-56 h-56 rounded-full bg-brand-accent/10 blur-3xl" />
                <div className="absolute -bottom-24 -left-24 w-64 h-64 rounded-full bg-brand-critique/10 blur-3xl" />

                <div className="relative z-10">
                    <div className="w-12 h-12 rounded-2xl bg-brand-accent text-brand-black flex items-center justify-center mb-5">
                        <Lightbulb size={22} />
                    </div>

                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent mb-3">
                        Challenge of the Week
                    </p>

                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-4">
                        Suggest a Challenge
                    </h1>

                    <p className="text-sm md:text-base text-gray-400 leading-relaxed max-w-2xl">
                        Drop a creative prompt the community can shoot, edit, pose, light, or critique around.
                        Keep it clear, useful, and easy enough for members to understand fast.
                    </p>
                </div>
            </motion.section>

            <motion.form
                onSubmit={handleSubmit}
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                className="bg-brand-gray border border-white/10 rounded-3xl p-5 md:p-6 space-y-5"
            >
                {status === 'success' && (
                    <div className="rounded-2xl border border-green-500/30 bg-green-500/10 p-4 flex items-start gap-3">
                        <CheckCircle2 size={18} className="text-green-400 flex-shrink-0 mt-0.5" />

                        <p className="text-[10px] uppercase font-black tracking-widest text-green-300 leading-relaxed">
                            Challenge idea submitted. It will show up after approval.
                        </p>
                    </div>
                )}

                {status === 'error' && (
                    <div className="rounded-2xl border border-brand-critique/30 bg-brand-critique/10 p-4 flex items-start gap-3">
                        <AlertCircle size={18} className="text-brand-critique flex-shrink-0 mt-0.5" />

                        <p className="text-[10px] uppercase font-black tracking-widest text-brand-critique leading-relaxed">
                            {errorMessage}
                        </p>
                    </div>
                )}

                <div className="space-y-2">
                    <label
                        htmlFor="challenge-title"
                        className="text-[10px] font-black uppercase tracking-widest text-gray-500"
                    >
                        Challenge Title
                    </label>

                    <input
                        id="challenge-title"
                        value={title}
                        onChange={(event) => setTitle(event.target.value)}
                        placeholder="Example: No Colors"
                        maxLength={80}
                        className="w-full min-h-[52px] rounded-2xl bg-brand-black border border-white/10 px-4 text-sm font-bold text-white placeholder:text-gray-700 focus:outline-none focus:border-brand-accent/50"
                    />

                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-gray-700">
                        <span>Make it short and punchy</span>
                        <span>{titleCount}/80</span>
                    </div>
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="challenge-description"
                        className="text-[10px] font-black uppercase tracking-widest text-gray-500"
                    >
                        Challenge Description
                    </label>

                    <textarea
                        id="challenge-description"
                        value={description}
                        onChange={(event) => setDescription(event.target.value)}
                        placeholder="Explain what members should submit and what they should focus on."
                        maxLength={500}
                        rows={7}
                        className="w-full rounded-2xl bg-brand-black border border-white/10 p-4 text-sm font-medium text-white placeholder:text-gray-700 focus:outline-none focus:border-brand-accent/50 resize-none leading-relaxed"
                    />

                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-gray-700">
                        <span>Minimum 10 characters</span>
                        <span>{descriptionCount}/500</span>
                    </div>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    <button
                        type="button"
                        onClick={() => setIsAnonymous(false)}
                        className={`min-h-[52px] rounded-2xl border px-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${!isAnonymous
                                ? 'bg-brand-accent text-brand-black border-brand-accent'
                                : 'bg-brand-black border-white/10 text-gray-500 hover:text-white'
                            }`}
                    >
                        <User size={15} />
                        Show Name
                    </button>

                    <button
                        type="button"
                        onClick={() => setIsAnonymous(true)}
                        className={`min-h-[52px] rounded-2xl border px-4 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${isAnonymous
                                ? 'bg-brand-accent text-brand-black border-brand-accent'
                                : 'bg-brand-black border-white/10 text-gray-500 hover:text-white'
                            }`}
                    >
                        <EyeOff size={15} />
                        Anonymous
                    </button>
                </div>

                <button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full min-h-[54px] rounded-2xl bg-white text-brand-black text-[10px] font-black uppercase tracking-[0.25em] flex items-center justify-center gap-2 hover:bg-brand-accent transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {status === 'loading' ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Submitting...
                        </>
                    ) : (
                        <>
                            Submit Challenge Idea
                            <Send size={15} />
                        </>
                    )}
                </button>
            </motion.form>
        </div>
    );
}