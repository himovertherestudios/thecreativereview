import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
    ArrowLeft,
    CheckCircle,
    Loader2,
    Mail,
    Instagram,
    User,
    Sparkles,
    AlertCircle,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type InviteRole =
    | 'Photographer'
    | 'Model'
    | 'Makeup Artist'
    | 'Retoucher'
    | 'Designer'
    | 'Stylist'
    | 'Other';

export default function RequestInvite() {
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [instagramHandle, setInstagramHandle] = useState('');
    const [role, setRole] = useState<InviteRole>('Photographer');
    const [reason, setReason] = useState('');
    const [loading, setLoading] = useState(false);
    const [submitted, setSubmitted] = useState(false);
    const [error, setError] = useState('');

    const cleanInstagramHandle = instagramHandle
        .trim()
        .replace('@', '')
        .toLowerCase();

    const handleSubmit = async (event: React.FormEvent) => {
        event.preventDefault();
        setError('');

        if (!name.trim()) {
            setError('Add your name so we know who is requesting access.');
            return;
        }

        if (!email.trim()) {
            setError('Add your email so we can send your invite code.');
            return;
        }

        setLoading(true);

        const { error: insertError } = await supabase.from('invite_requests').insert({
            name: name.trim(),
            email: email.trim().toLowerCase(),
            instagram_handle: cleanInstagramHandle || null,
            role,
            reason: reason.trim() || null,
            status: 'pending',
        });

        setLoading(false);

        if (insertError) {
            if (insertError.code === '23505') {
                setError('You already requested an invite with this email. You’re on the list.');
                return;
            }

            setError(insertError.message || 'Something went wrong. Try again.');
            return;
        }

        setSubmitted(true);
    };

    if (submitted) {
        return (
            <div className="min-h-screen bg-brand-black text-brand-white px-5 py-6 flex items-center justify-center">
                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="w-full max-w-md cr-card p-6 text-center"
                >
                    <div className="mx-auto mb-5 h-16 w-16 rounded-full bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center">
                        <CheckCircle className="h-8 w-8 text-brand-accent" />
                    </div>

                    <p className="cr-label mb-2">Request received</p>

                    <h1 className="cr-title text-4xl mb-3">
                        You’re On The List
                    </h1>

                    <p className="text-sm text-brand-gray leading-relaxed mb-6">
                        Thanks for requesting access to The Creative Review. If you’re a good fit
                        for this beta round, we’ll send an invite code to your email.
                    </p>

                    <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-left mb-6">
                        <p className="text-xs uppercase tracking-[0.25em] text-brand-gray font-black mb-2">
                            Beta reminder
                        </p>
                        <p className="text-sm text-brand-white/80 leading-relaxed">
                            This isn’t Instagram. The Creative Review is built for honest feedback,
                            real critique, and helping creatives level up.
                        </p>
                    </div>

                    <Link to="/" className="cr-button-primary w-full">
                        Back To Home
                    </Link>
                </motion.div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-brand-black text-brand-white px-5 py-6">
            <div className="mx-auto w-full max-w-md">
                <Link
                    to="/"
                    className="inline-flex items-center gap-2 text-sm text-brand-gray hover:text-brand-white mb-6"
                >
                    <ArrowLeft className="h-4 w-4" />
                    Back
                </Link>

                <motion.div
                    initial={{ opacity: 0, y: 18 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="cr-card p-6"
                >
                    <div className="mb-6">
                        <div className="mb-4 h-14 w-14 rounded-2xl bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center">
                            <Sparkles className="h-7 w-7 text-brand-accent" />
                        </div>

                        <p className="cr-label mb-2">Private beta access</p>

                        <h1 className="cr-title text-4xl mb-3">
                            Request An Invite
                        </h1>

                        <p className="text-sm text-brand-gray leading-relaxed">
                            The Creative Review is invite-only while we shape the culture.
                            Tell us who you are and why you want in.
                        </p>
                    </div>

                    {error && (
                        <div className="mb-5 rounded-2xl border border-brand-accent/30 bg-brand-accent/10 p-4 flex gap-3">
                            <AlertCircle className="h-5 w-5 text-brand-accent shrink-0 mt-0.5" />
                            <p className="text-sm text-brand-white/90">{error}</p>
                        </div>
                    )}

                    <form onSubmit={handleSubmit} className="space-y-4">
                        <label className="block">
                            <span className="cr-label mb-2 block">Name</span>
                            <div className="relative">
                                <User className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-gray" />
                                <input
                                    value={name}
                                    onChange={(event) => setName(event.target.value)}
                                    className="cr-input pl-11"
                                    placeholder="Your name"
                                />
                            </div>
                        </label>

                        <label className="block">
                            <span className="cr-label mb-2 block">Email</span>
                            <div className="relative">
                                <Mail className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-gray" />
                                <input
                                    type="email"
                                    value={email}
                                    onChange={(event) => setEmail(event.target.value)}
                                    className="cr-input pl-11"
                                    placeholder="you@email.com"
                                />
                            </div>
                        </label>

                        <label className="block">
                            <span className="cr-label mb-2 block">Instagram</span>
                            <div className="relative">
                                <Instagram className="absolute left-4 top-1/2 -translate-y-1/2 h-4 w-4 text-brand-gray" />
                                <input
                                    value={instagramHandle}
                                    onChange={(event) => setInstagramHandle(event.target.value)}
                                    className="cr-input pl-11"
                                    placeholder="@yourhandle"
                                />
                            </div>
                        </label>

                        <label className="block">
                            <span className="cr-label mb-2 block">Creative Role</span>
                            <select
                                value={role}
                                onChange={(event) => setRole(event.target.value as InviteRole)}
                                className="cr-input"
                            >
                                <option value="Photographer">Photographer</option>
                                <option value="Model">Model</option>
                                <option value="Makeup Artist">Makeup Artist / MUA</option>
                                <option value="Retoucher">Retoucher</option>
                                <option value="Designer">Designer</option>
                                <option value="Stylist">Stylist</option>
                                <option value="Other">Other</option>
                            </select>
                        </label>

                        <label className="block">
                            <span className="cr-label mb-2 block">Why do you want in?</span>
                            <textarea
                                value={reason}
                                onChange={(event) => setReason(event.target.value)}
                                className="cr-textarea min-h-[120px]"
                                placeholder="Tell us what kind of work you make, what feedback you want, or how you’d help shape the beta."
                            />
                        </label>

                        <button
                            type="submit"
                            disabled={loading}
                            className="cr-button-primary w-full disabled:opacity-60 disabled:cursor-not-allowed"
                        >
                            {loading ? (
                                <span className="inline-flex items-center justify-center gap-2">
                                    <Loader2 className="h-4 w-4 animate-spin" />
                                    Sending Request
                                </span>
                            ) : (
                                'Request Invite Code'
                            )}
                        </button>
                    </form>

                    <p className="mt-5 text-xs text-brand-gray leading-relaxed text-center">
                        Already have a code?{' '}
                        <Link to="/invite" className="text-brand-white underline underline-offset-4">
                            Enter it here.
                        </Link>
                    </p>
                </motion.div>
            </div>
        </div>
    );
}