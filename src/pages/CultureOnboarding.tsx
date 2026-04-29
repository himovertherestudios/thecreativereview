import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router-dom';
import {
    ArrowRight,
    Camera,
    CheckCircle2,
    Flame,
    MessageSquare,
    ShieldCheck,
    Sparkles,
    Users,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type OnboardingStep = {
    eyebrow: string;
    title: string;
    body: string;
    icon: React.ElementType;
};

const STEPS: OnboardingStep[] = [
    {
        eyebrow: 'Welcome to The Creative Review',
        title: 'This isn’t Instagram.',
        body: 'This is not about likes, fake support, or posting just to be seen. This is a private creative room built for honest feedback, growth, and better work.',
        icon: Camera,
    },
    {
        eyebrow: 'The Culture',
        title: 'Give real. Get real.',
        body: 'The more useful feedback you give, the more useful feedback you’ll receive. Be honest, but do not be lazy, cruel, or vague.',
        icon: MessageSquare,
    },
    {
        eyebrow: 'The Standard',
        title: 'Respect the work and the person.',
        body: 'Critique the image, the idea, the lighting, the posing, the edit, or the execution. Do not attack the person behind it.',
        icon: ShieldCheck,
    },
    {
        eyebrow: 'Your Role',
        title: 'Choose your lane, then grow past it.',
        body: 'Photographers, models, makeup artists, retouchers, designers, and visual artists all see work differently. That difference is the power of the room.',
        icon: Users,
    },
    {
        eyebrow: 'Beta Culture Lock-In',
        title: 'Help shape what this becomes.',
        body: 'You are early. Test the app, upload work, leave critiques, use The Corner, and tell us what feels broken, confusing, or powerful.',
        icon: Flame,
    },
];

export default function CultureOnboarding() {
    const navigate = useNavigate();
    const [activeStep, setActiveStep] = useState(0);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState('');

    const currentStep = STEPS[activeStep];
    const Icon = currentStep.icon;
    const isLastStep = activeStep === STEPS.length - 1;

    const goNext = async () => {
        setError('');

        if (!isLastStep) {
            setActiveStep((current) => current + 1);
            return;
        }

        setIsSaving(true);

        try {
            const {
                data: { user },
                error: userError,
            } = await supabase.auth.getUser();

            if (userError) throw userError;
            if (!user) throw new Error('You must be logged in to continue.');

            const { error: updateError } = await supabase
                .from('profiles')
                .update({ has_completed_onboarding: true })
                .eq('id', user.id);

            if (updateError) throw updateError;

            navigate('/dashboard');
        } catch (saveError) {
            const message =
                saveError instanceof Error
                    ? saveError.message
                    : 'Something went wrong while saving onboarding.';

            setError(message);
        } finally {
            setIsSaving(false);
        }
    };

    const goBack = () => {
        if (activeStep === 0) return;
        setError('');
        setActiveStep((current) => current - 1);
    };

    return (
        <div className="min-h-[calc(100vh-120px)] flex items-center justify-center px-4 py-8">
            <div className="w-full max-w-2xl">
                <div className="mb-6 flex items-center justify-between">
                    <div>
                        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent">
                            Culture Onboarding
                        </p>
                        <p className="mt-2 text-xs font-bold uppercase tracking-widest text-gray-500">
                            Step {activeStep + 1} of {STEPS.length}
                        </p>
                    </div>

                    <div className="flex items-center gap-2">
                        {STEPS.map((step, index) => (
                            <button
                                key={step.title}
                                type="button"
                                onClick={() => setActiveStep(index)}
                                className={`h-2.5 rounded-full transition-all ${index === activeStep
                                        ? 'w-8 bg-brand-accent'
                                        : index < activeStep
                                            ? 'w-2.5 bg-white'
                                            : 'w-2.5 bg-white/20'
                                    }`}
                                aria-label={`Go to onboarding step ${index + 1}`}
                            />
                        ))}
                    </div>
                </div>

                <div className="relative overflow-hidden rounded-[2rem] border border-white/10 bg-brand-gray p-6 shadow-2xl shadow-black/30 md:p-8">
                    <div className="absolute -top-24 -right-24 h-60 w-60 rounded-full bg-brand-accent/10 blur-3xl" />
                    <div className="absolute -bottom-24 -left-24 h-60 w-60 rounded-full bg-brand-critique/10 blur-3xl" />

                    <AnimatePresence mode="wait">
                        <motion.div
                            key={activeStep}
                            initial={{ opacity: 0, y: 18 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -18 }}
                            transition={{ duration: 0.22 }}
                            className="relative z-10"
                        >
                            <div className="mb-8 flex h-16 w-16 items-center justify-center rounded-3xl border border-brand-accent/25 bg-brand-accent/10 text-brand-accent">
                                <Icon size={30} />
                            </div>

                            <p className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent">
                                {currentStep.eyebrow}
                            </p>

                            <h1 className="max-w-xl text-4xl font-black uppercase leading-none tracking-tighter text-white md:text-6xl">
                                {currentStep.title}
                            </h1>

                            <p className="mt-6 max-w-xl text-base font-medium leading-relaxed text-gray-300 md:text-lg">
                                {currentStep.body}
                            </p>

                            {activeStep === 1 && (
                                <div className="mt-8 grid gap-3 md:grid-cols-3">
                                    {['Specific', 'Useful', 'Respectful'].map((word) => (
                                        <div
                                            key={word}
                                            className="rounded-2xl border border-white/10 bg-white/[0.03] p-4"
                                        >
                                            <CheckCircle2
                                                size={18}
                                                className="mb-3 text-brand-accent"
                                            />
                                            <p className="text-[10px] font-black uppercase tracking-widest text-white">
                                                {word}
                                            </p>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {activeStep === 4 && (
                                <div className="mt-8 rounded-3xl border border-brand-accent/20 bg-brand-accent/10 p-5">
                                    <div className="mb-3 flex items-center gap-2 text-brand-accent">
                                        <Sparkles size={18} />
                                        <p className="text-[10px] font-black uppercase tracking-widest">
                                            Beta Reminder
                                        </p>
                                    </div>

                                    <p className="text-sm font-medium leading-relaxed text-gray-300">
                                        The goal is not perfection yet. The goal is honest testing,
                                        better feedback, and building a creative space that actually
                                        helps people improve.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </AnimatePresence>

                    {error && (
                        <div className="relative z-10 mt-6 rounded-2xl border border-red-500/20 bg-red-500/10 p-4 text-sm text-red-200">
                            {error}
                        </div>
                    )}

                    <div className="relative z-10 mt-10 flex items-center justify-between gap-3">
                        <button
                            type="button"
                            onClick={goBack}
                            disabled={activeStep === 0 || isSaving}
                            className="min-h-[48px] rounded-2xl border border-white/10 px-5 text-[10px] font-black uppercase tracking-widest text-gray-400 transition hover:border-white/20 hover:text-white disabled:cursor-not-allowed disabled:opacity-30"
                        >
                            Back
                        </button>

                        <button
                            type="button"
                            onClick={goNext}
                            disabled={isSaving}
                            className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-2xl bg-brand-accent px-6 text-[10px] font-black uppercase tracking-widest text-brand-black transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                        >
                            {isSaving
                                ? 'Saving...'
                                : isLastStep
                                    ? 'Enter The Room'
                                    : 'Next'}
                            <ArrowRight size={15} />
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}