import React, { useState } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  User,
  Mail,
  Lock,
  AtSign,
  MapPin,
  Briefcase,
  Check,
  ArrowRight,
  Globe,
  Loader2,
  AlertCircle,
  Ticket,
} from 'lucide-react';
import { CreativeRole, ExperienceLevel } from '../types';
import { signUpWithProfile } from '../lib/auth';

const CREATIVE_ROLES: CreativeRole[] = [
  'Photographer',
  'Model',
  'Makeup Artist',
  'Other',
];

const EXPERIENCE_LEVELS: ExperienceLevel[] = [
  'Beginner',
  'Intermediate',
  'Advanced',
  'Professional',
  'Industry Veteran',
];

export default function Signup() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const inviteCodeFromUrl = searchParams.get('code') || '';

  const [form, setForm] = useState({
    displayName: '',
    instagram: '',
    website: '',
    email: '',
    password: '',
    city: '',
    customRoleTitle: '',
    inviteCode: inviteCodeFromUrl,
  });

  const [role, setRole] = useState<CreativeRole | ''>('');
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel | ''>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [authError, setAuthError] = useState('');

  const requiresCustomRole = role === 'Other';

  const canContinue =
    form.displayName.trim().length > 1 &&
    form.instagram.trim().length > 1 &&
    form.email.trim().length > 3 &&
    form.password.trim().length >= 6 &&
    form.city.trim().length > 1 &&
    form.inviteCode.trim().length > 1 &&
    Boolean(role) &&
    Boolean(experienceLevel) &&
    (!requiresCustomRole || form.customRoleTitle.trim().length > 1) &&
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

  const handleContinue = async () => {
    if (!canContinue || !role || !experienceLevel) return;

    setIsSubmitting(true);
    setAuthError('');

    try {
      await signUpWithProfile({
        email: form.email,
        password: form.password,
        displayName: form.displayName,
        instagramHandle: form.instagram,
        website: form.website,
        role,
        customTitle: form.customRoleTitle,
        city: form.city,
        experienceLevel,
        inviteCode: form.inviteCode,
      });

      navigate('/consent');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong while creating your account.';

      setAuthError(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-black px-4 py-6 md:p-6 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand-gray border border-white/10 rounded-3xl p-5 sm:p-8 md:p-12 shadow-2xl"
        >
          <div className="mb-8 md:mb-10">
            <p className="text-brand-accent text-xs font-black uppercase tracking-[0.25em] mb-3">
              Beta Profile
            </p>

            <h2 className="text-3xl md:text-4xl font-black mb-3 tracking-tighter uppercase">
              Create Your Profile
            </h2>

            <p className="text-gray-400 font-medium text-sm md:text-base leading-relaxed">
              Welcome to the inner circle. Tell us who you are before the
              community starts reviewing your work.
            </p>
          </div>

          <form
            className="space-y-7"
            onSubmit={(event) => {
              event.preventDefault();
              handleContinue();
            }}
          >
            {/* Basic Info */}
            <section className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-5 md:gap-6">
                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                    Beta Invite Code
                  </label>

                  <div className="relative">
                    <Ticket
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                      size={18}
                    />

                    <input
                      type="text"
                      value={form.inviteCode}
                      onChange={(e) =>
                        handleInputChange('inviteCode', e.target.value.trim().toLowerCase())
                      }
                      className="w-full min-h-[56px] bg-brand-black border border-brand-accent/30 rounded-2xl p-4 pl-12 text-sm font-bold focus:border-brand-accent outline-none transition-all"
                      placeholder="beta-001"
                    />
                  </div>

                  <p className="text-[10px] text-gray-600 ml-1 uppercase font-bold tracking-widest">
                    Required for private beta access. Each code can only be used once.
                  </p>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                    Display Name
                  </label>

                  <div className="relative">
                    <User
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                      size={18}
                    />

                    <input
                      type="text"
                      value={form.displayName}
                      onChange={(e) =>
                        handleInputChange('displayName', e.target.value)
                      }
                      className="w-full min-h-[56px] bg-brand-black border border-white/10 rounded-2xl p-4 pl-12 text-sm font-bold focus:border-brand-accent outline-none transition-all"
                      placeholder="JANE DOE"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                    Instagram Handle
                  </label>

                  <div className="relative">
                    <AtSign
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                      size={18}
                    />

                    <input
                      type="text"
                      value={form.instagram}
                      onChange={(e) =>
                        handleInputChange(
                          'instagram',
                          e.target.value.replace('@', '')
                        )
                      }
                      className="w-full min-h-[56px] bg-brand-black border border-white/10 rounded-2xl p-4 pl-12 text-sm font-bold focus:border-brand-accent outline-none transition-all"
                      placeholder="JANEDOE_CREATIVE"
                    />
                  </div>
                </div>

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
                      placeholder="AT LEAST 6 CHARACTERS"
                    />
                  </div>

                  <p className="text-[10px] text-gray-600 ml-1 uppercase font-bold tracking-widest">
                    This now creates a real Supabase Auth user.
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                    Website / Portfolio
                  </label>

                  <div className="relative">
                    <Globe
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                      size={18}
                    />

                    <input
                      type="text"
                      value={form.website}
                      onChange={(e) =>
                        handleInputChange('website', e.target.value)
                      }
                      className="w-full min-h-[56px] bg-brand-black border border-white/10 rounded-2xl p-4 pl-12 text-sm font-bold focus:border-brand-accent outline-none transition-all"
                      placeholder="HTTPS://YOURWEBSITE.COM"
                    />
                  </div>

                  <p className="text-[10px] text-gray-600 ml-1 uppercase font-bold tracking-widest">
                    Optional. This will show on your profile.
                  </p>
                </div>

                <div className="space-y-2 md:col-span-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                    City
                  </label>

                  <div className="relative">
                    <MapPin
                      className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                      size={18}
                    />

                    <input
                      type="text"
                      value={form.city}
                      onChange={(e) => handleInputChange('city', e.target.value)}
                      className="w-full min-h-[56px] bg-brand-black border border-white/10 rounded-2xl p-4 pl-12 text-sm font-bold focus:border-brand-accent outline-none transition-all"
                      placeholder="CHICAGO, IL"
                    />
                  </div>
                </div>
              </div>
            </section>

            {/* Role Picker */}
            <section className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                Primary Creative Role
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {CREATIVE_ROLES.map((creativeRole) => {
                  const isSelected = role === creativeRole;

                  return (
                    <button
                      key={creativeRole}
                      type="button"
                      onClick={() => setRole(creativeRole)}
                      className={`w-full min-h-[64px] rounded-2xl border p-4 text-left transition-all flex items-center justify-between ${isSelected
                        ? 'bg-brand-accent border-brand-accent text-brand-black'
                        : 'bg-brand-black border-white/10 text-white hover:border-brand-accent'
                        }`}
                    >
                      <div className="flex items-center gap-3">
                        <Briefcase
                          size={18}
                          className={
                            isSelected ? 'text-brand-black' : 'text-gray-500'
                          }
                        />

                        <span className="text-xs font-black uppercase tracking-widest">
                          {creativeRole}
                        </span>
                      </div>

                      <span
                        className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 ${isSelected
                          ? 'bg-brand-black/10 border-brand-black text-brand-black'
                          : 'border-white/20'
                          }`}
                      >
                        {isSelected && <Check size={13} strokeWidth={4} />}
                      </span>
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Custom Role */}
            {requiresCustomRole && (
              <motion.section
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="space-y-2"
              >
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                  Creative Title
                </label>

                <input
                  type="text"
                  value={form.customRoleTitle}
                  onChange={(e) =>
                    handleInputChange('customRoleTitle', e.target.value)
                  }
                  className="w-full min-h-[56px] bg-brand-black border border-white/10 rounded-2xl p-4 text-sm font-bold focus:border-brand-accent outline-none transition-all uppercase"
                  placeholder="E.G. STYLIST, SET DESIGNER, RETOUCHER"
                />

                <p className="text-[10px] text-gray-600 ml-1 uppercase font-bold tracking-widest">
                  Required because you selected Other.
                </p>
              </motion.section>
            )}

            {/* Experience Picker */}
            <section className="space-y-3">
              <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1 block">
                Experience Level
              </label>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-5 gap-3">
                {EXPERIENCE_LEVELS.map((level) => {
                  const isSelected = experienceLevel === level;

                  return (
                    <button
                      key={level}
                      type="button"
                      onClick={() => setExperienceLevel(level)}
                      className={`min-h-[56px] py-4 md:py-3 px-4 border rounded-2xl text-[10px] font-black uppercase tracking-tighter transition-all flex items-center justify-between md:justify-center gap-2 ${isSelected
                        ? 'bg-brand-accent border-brand-accent text-brand-black'
                        : 'bg-brand-black border-white/10 text-gray-400 hover:border-brand-accent hover:text-brand-accent'
                        }`}
                    >
                      <span>{level}</span>

                      {isSelected && (
                        <Check size={14} strokeWidth={4} className="md:hidden" />
                      )}
                    </button>
                  );
                })}
              </div>
            </section>

            {/* Error Message */}
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

            {/* Watermark Note */}
            <div className="p-4 bg-brand-black/60 border border-white/10 rounded-2xl">
              <p className="text-[10px] uppercase font-bold tracking-widest text-gray-400 leading-relaxed">
                Your Instagram will show as @{form.instagram || 'yourhandle'}.
                Later we’ll use your display name or Instagram handle for
                protected preview watermarks.
              </p>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={!canContinue}
              className="w-full min-h-[58px] py-5 bg-brand-accent text-brand-black rounded-2xl font-black uppercase text-xs md:text-sm tracking-widest hover:scale-[1.01] active:scale-[0.99] transition-all disabled:opacity-20 flex items-center justify-center gap-3"
            >
              {isSubmitting ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Creating Account
                </>
              ) : (
                <>
                  Next: The Ground Rules <ArrowRight size={18} />
                </>
              )}
            </button>

            {!canContinue && !isSubmitting && (
              <p className="text-center text-[10px] text-gray-500 uppercase tracking-widest leading-relaxed">
                Fill out all required fields, including your beta invite code, to continue.
              </p>
            )}
          </form>
        </motion.div>
      </div>
    </div>
  );
}