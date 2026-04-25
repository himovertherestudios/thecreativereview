import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
    ArrowLeft,
    Mail,
    Lock,
    LogIn,
    Loader2,
    AlertCircle,
    Flame,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Login() {
    const navigate = useNavigate();

    const [form, setForm] = useState({
        email: '',
        password: '',
    });

    const [isSubmitting, setIsSubmitting] = useState(false);
    const [authError, setAuthError] = useState('');

    const canLogin =
        form.email.trim().length > 3 &&
        form.password.trim().length >= 6 &&
        !isSubmitting;

    const handleInputChange = (field: keyof typeof form, value: string) => {
        setForm((current) => ({
            ...current,
            [field]: value,
        }));

        if (authError) {
            setAuthError('');
        }
    };

    const handleLogin = async () => {
        if (!canLogin) return;

        setIsSubmitting(true);
        setAuthError('');

        try {
            const { error } = await supabase.auth.signInWithPassword({
                email: form.email.trim(),
                password: form.password,
            });

            if (error) {
                throw error;
            }

            navigate('/dashboard');
        } catch (error) {
            const message =
                error instanceof Error
                    ? error.message
                    : 'Something went wrong while logging in.';

            setAuthError(message);
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="min-h-screen bg-brand-black px-4 py-6 md:p-6 flex items-center justify-center">
            <div className="max-w-md w-full">
                <button
                    onClick={() => navigate('/')}
                    className="mb-8 min-h-[44px] flex items-center gap-2 text-gray-500 hover:text-white transition-colors uppercase text-xs font-bold tracking-widest"
                >
                    <ArrowLeft size={16} /> Back to landing
                </button>

                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-brand-gray border border-white/10 rounded-3xl p-6 sm:p-8 shadow-2xl"
                >
                    <div className="flex justify-center mb-6">
                        <div className="w-16 h-16 rounded-3xl bg-brand-accent flex items-center justify-center shadow-xl shadow-brand-accent/20">
                            <Flame size={32} className="text-brand-black" />
                        </div>
                    </div>

                    <div className="text-center mb-8">
                        <p className="text-brand-accent text-xs font-black uppercase tracking-[0.25em] mb-3">
                            Welcome Back
                        </p>

                        <h1 className="text-3xl md:text-4xl font-black uppercase tracking-tighter">
                            Log In
                        </h1>

                        <p className="text-gray-400 text-sm font-medium mt-3 leading-relaxed">
                            Get back inside The Creative Review and keep the critiques moving.
                        </p>
                    </div>

                    <form
                        className="space-y-5"
                        onSubmit={(event) => {
                            event.preventDefault();
                            handleLogin();
                        }}
                    >
                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                                Email
                            </label>

                            <div className="relative">
                                <Mail
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                                    size={18}
                                />

                                <input
                                    type="email"
                                    value={form.email}
                                    onChange={(e) => handleInputChange('email', e.target.value)}
                                    className="w-full min-h-[56px] bg-brand-black border border-white/10 rounded-2xl p-4 pl-12 text-sm font-bold focus:border-brand-accent outline-none transition-all"
                                    placeholder="JANE@EXAMPLE.COM"
                                    autoComplete="email"
                                />
                            </div>
                        </div>

                        <div className="space-y-2">
                            <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                                Password
                            </label>

                            <div className="relative">
                                <Lock
                                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                                    size={18}
                                />

                                <input
                                    type="password"
                                    value={form.password}
                                    onChange={(e) =>
                                        handleInputChange('password', e.target.value)
                                    }
                                    className="w-full min-h-[56px] bg-brand-black border border-white/10 rounded-2xl p-4 pl-12 text-sm font-bold focus:border-brand-accent outline-none transition-all"
                                    placeholder="YOUR PASSWORD"
                                    autoComplete="current-password"
                                />
                            </div>
                        </div>

                        {authError && (
                            <div className="p-4 bg-brand-critique/10 border border-brand-critique/30 rounded-2xl flex items-start gap-3">
                                <AlertCircle
                                    size={18}
                                    className="text-brand-critique flex-shrink-0 mt-0.5"
                                />

                                <p className="text-[10px] font-black uppercase tracking-widest text-brand-critique leading-relaxed">
                                    {authError}
                                </p>
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={!canLogin}
                            className="w-full min-h-[58px] py-5 bg-brand-accent text-brand-black rounded-2xl font-black uppercase text-xs md:text-sm tracking-widest hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-20 flex items-center justify-center gap-3"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 size={18} className="animate-spin" />
                                    Logging In
                                </>
                            ) : (
                                <>
                                    Log In <LogIn size={18} />
                                </>
                            )}
                        </button>

                        <button
                            type="button"
                            onClick={() => navigate('/invite')}
                            className="w-full min-h-[48px] py-4 text-gray-500 hover:text-white text-xs font-black uppercase tracking-widest transition-colors"
                        >
                            Need access? Use or request an invite code
                        </button>
                    </form>
                </motion.div>
            </div>
        </div>
    );
}