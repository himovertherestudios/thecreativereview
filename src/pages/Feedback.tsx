import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
    ArrowLeft,
    MessageCircle,
    Send,
    Loader2,
    AlertCircle,
    CheckCircle2,
    Bug,
    Sparkles,
    Heart,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { trackEvent } from '../lib/analytics';

type FeedbackType = 'bug' | 'idea' | 'praise';
type SubmitStatus = 'idle' | 'loading' | 'success' | 'error';

const FEEDBACK_TYPES: { value: FeedbackType; label: string; icon: React.ElementType }[] = [
    { value: 'bug', label: 'Bug', icon: Bug },
    { value: 'idea', label: 'Idea', icon: Sparkles },
    { value: 'praise', label: 'Praise', icon: Heart },
];

export default function Feedback() {
    const [type, setType] = useState<FeedbackType>('bug');
    const [message, setMessage] = useState('');
    const [status, setStatus] = useState<SubmitStatus>('idle');
    const [errorMessage, setErrorMessage] = useState('');

    const messageCount = message.trim().length;
    const canSubmit = messageCount >= 5 && messageCount <= 1000 && status !== 'loading';

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
                throw new Error('You need to be logged in to send feedback.');
            }

            const { error } = await supabase.from('app_feedback').insert({
                user_id: user.id,
                type,
                message: message.trim(),
            });

            if (error) {
                throw error;
            }

            await trackEvent('feedback_submitted', 'Feedback', {
                type,
                message_length: message.trim().length,
            });

            setMessage('');
            setType('bug');
            setStatus('success');
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Something went wrong sending your feedback.';

            setErrorMessage(message);
            setStatus('error');
        }
    };

    return (
        <div className="max-w-3xl mx-auto space-y-6 pb-10">
            <Link
                to="/profile"
                className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-500 hover:text-white transition-colors"
            >
                <ArrowLeft size={14} />
                Back to profile
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
                        <MessageCircle size={22} />
                    </div>

                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent mb-3">
                        Beta Feedback
                    </p>

                    <h1 className="text-4xl md:text-5xl font-black uppercase tracking-tighter leading-none mb-4">
                        Send Feedback
                    </h1>

                    <p className="text-sm md:text-base text-gray-400 leading-relaxed max-w-2xl">
                        Found something broken, got an idea, or just want to say something worked well?
                        This goes straight to the team.
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
                            Feedback sent. Thanks for helping us build this.
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
                    <label className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                        What kind of feedback is this?
                    </label>

                    <div className="grid grid-cols-3 gap-3">
                        {FEEDBACK_TYPES.map(({ value, label, icon: Icon }) => (
                            <button
                                key={value}
                                type="button"
                                onClick={() => setType(value)}
                                className={`min-h-[64px] rounded-2xl border flex flex-col items-center justify-center gap-1.5 text-[10px] font-black uppercase tracking-widest transition-all ${type === value
                                    ? 'bg-brand-accent text-brand-black border-brand-accent'
                                    : 'bg-brand-black border-white/10 text-gray-500 hover:text-white'
                                    }`}
                            >
                                <Icon size={16} />
                                {label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="space-y-2">
                    <label
                        htmlFor="feedback-message"
                        className="text-[10px] font-black uppercase tracking-widest text-gray-500"
                    >
                        Tell us more
                    </label>

                    <textarea
                        id="feedback-message"
                        value={message}
                        onChange={(event) => setMessage(event.target.value)}
                        placeholder="Be as specific as you can. What happened, what you expected, or what you're thinking."
                        maxLength={1000}
                        rows={7}
                        className="w-full rounded-2xl bg-brand-black border border-white/10 p-4 text-sm font-medium text-white placeholder:text-gray-700 focus:outline-none focus:border-brand-accent/50 resize-none leading-relaxed"
                    />

                    <div className="flex justify-between text-[9px] font-black uppercase tracking-widest text-gray-700">
                        <span>Minimum 5 characters</span>
                        <span>{messageCount}/1000</span>
                    </div>
                </div>

                <button
                    type="submit"
                    disabled={!canSubmit}
                    className="w-full min-h-[54px] rounded-2xl bg-white text-brand-black text-[10px] font-black uppercase tracking-[0.25em] flex items-center justify-center gap-2 hover:bg-brand-accent transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                >
                    {status === 'loading' ? (
                        <>
                            <Loader2 size={16} className="animate-spin" />
                            Sending...
                        </>
                    ) : (
                        <>
                            Send Feedback
                            <Send size={15} />
                        </>
                    )}
                </button>
            </motion.form>
        </div>
    );
}
