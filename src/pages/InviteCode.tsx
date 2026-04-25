import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  ArrowLeft,
  Send,
  Instagram,
  Briefcase,
  Check,
  Globe,
  Mail,
  User,
  MapPin,
} from 'lucide-react';

type WaitlistRole =
  | 'Photographer'
  | 'Model'
  | 'Makeup Artist'
  | 'Creative Director'
  | 'Other';

const WAITLIST_ROLES: WaitlistRole[] = [
  'Photographer',
  'Model',
  'Makeup Artist',
  'Creative Director',
  'Other',
];

export default function InviteCode() {
  const navigate = useNavigate();

  const [code, setCode] = useState('');
  const [isRequesting, setIsRequesting] = useState(false);

  const [requestForm, setRequestForm] = useState({
    fullName: '',
    email: '',
    instagram: '',
    website: '',
    role: '' as WaitlistRole | '',
    customTitle: '',
    city: '',
    reason: '',
  });

  const requiresCustomTitle = requestForm.role === 'Other';

  const canRequestAccess =
    requestForm.fullName.trim().length > 1 &&
    requestForm.email.trim().length > 3 &&
    requestForm.instagram.trim().length > 1 &&
    requestForm.city.trim().length > 1 &&
    Boolean(requestForm.role) &&
    (!requiresCustomTitle || requestForm.customTitle.trim().length > 1);

  const handleSubmitCode = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const cleanedCode = code.trim();

    if (cleanedCode.length >= 4) {
      navigate('/signup');
    }
  };

  const handleRequestChange = (
    field: keyof typeof requestForm,
    value: string
  ) => {
    setRequestForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleRequestSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!canRequestAccess) return;

    // Prototype behavior for now:
    // Later this will save the invite request to Supabase.
    navigate('/signup');
  };

  return (
    <div className="min-h-screen bg-brand-black px-4 py-6 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <button
          onClick={() => navigate('/')}
          className="mb-8 md:mb-12 min-h-[44px] flex items-center gap-2 text-gray-500 hover:text-white transition-colors uppercase text-xs font-bold tracking-widest"
        >
          <ArrowLeft size={16} /> Back to reality
        </button>

        {!isRequesting ? (
          <motion.div
            key="invite-code-form"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="max-w-md mx-auto"
          >
            <h2 className="text-4xl font-black mb-2 tracking-tighter uppercase">
              Who Sent You?
            </h2>

            <p className="text-gray-400 mb-8 font-medium">
              Enter your unique invite code below to unlock the vault.
            </p>

            <form onSubmit={handleSubmitCode} className="space-y-6">
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value.toUpperCase())}
                placeholder="X-XXXX-XXX"
                className="w-full bg-brand-gray border-2 border-white/10 rounded-2xl p-6 text-2xl font-black tracking-[0.35em] md:tracking-[0.5em] text-center uppercase focus:border-brand-accent focus:ring-0 transition-all outline-none"
              />

              <button
                type="submit"
                disabled={code.trim().length < 4}
                className="w-full min-h-[56px] py-5 bg-brand-accent text-brand-black rounded-2xl font-black uppercase text-sm tracking-widest hover:scale-[1.02] active:scale-[0.98] transition-all disabled:opacity-50 disabled:grayscale"
              >
                Enter the Review
              </button>

              <button
                type="button"
                onClick={() => setIsRequesting(true)}
                className="w-full min-h-[48px] py-4 text-gray-500 hover:text-white text-xs font-black uppercase tracking-widest transition-colors"
              >
                Don&apos;t have a code? Request Access
              </button>
            </form>
          </motion.div>
        ) : (
          <motion.div
            key="invite-request-form"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
          >
            <h2 className="text-3xl md:text-4xl font-black mb-2 tracking-tighter uppercase">
              Join the Waitlist
            </h2>

            <p className="text-gray-400 mb-8 font-medium text-sm md:text-base leading-relaxed">
              We&apos;re selective about the room. Tell us who you are and why
              you belong in The Creative Review.
            </p>

            <form onSubmit={handleRequestSubmit} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="relative">
                  <User
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                    size={18}
                  />
                  <input
                    type="text"
                    value={requestForm.fullName}
                    onChange={(e) =>
                      handleRequestChange('fullName', e.target.value)
                    }
                    placeholder="FULL NAME"
                    className="w-full min-h-[56px] bg-brand-gray border border-white/10 rounded-2xl p-4 pl-12 text-sm font-bold uppercase outline-none focus:border-brand-accent transition-all"
                  />
                </div>

                <div className="relative">
                  <Mail
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                    size={18}
                  />
                  <input
                    type="email"
                    value={requestForm.email}
                    onChange={(e) =>
                      handleRequestChange('email', e.target.value)
                    }
                    placeholder="EMAIL"
                    className="w-full min-h-[56px] bg-brand-gray border border-white/10 rounded-2xl p-4 pl-12 text-sm font-bold uppercase outline-none focus:border-brand-accent transition-all"
                  />
                </div>

                <div className="relative">
                  <Instagram
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                    size={18}
                  />

                  <input
                    type="text"
                    value={requestForm.instagram}
                    onChange={(e) =>
                      handleRequestChange(
                        'instagram',
                        e.target.value.replace('@', '')
                      )
                    }
                    placeholder="INSTAGRAM HANDLE"
                    className="w-full min-h-[56px] bg-brand-gray border border-white/10 rounded-2xl p-4 pl-12 text-sm font-bold uppercase outline-none focus:border-brand-accent transition-all"
                  />
                </div>

                <div className="relative">
                  <Globe
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                    size={18}
                  />

                  <input
                    type="text"
                    value={requestForm.website}
                    onChange={(e) =>
                      handleRequestChange('website', e.target.value)
                    }
                    placeholder="WEBSITE / PORTFOLIO"
                    className="w-full min-h-[56px] bg-brand-gray border border-white/10 rounded-2xl p-4 pl-12 text-sm font-bold uppercase outline-none focus:border-brand-accent transition-all"
                  />
                </div>

                <div className="relative md:col-span-2">
                  <MapPin
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-500"
                    size={18}
                  />

                  <input
                    type="text"
                    value={requestForm.city}
                    onChange={(e) =>
                      handleRequestChange('city', e.target.value)
                    }
                    placeholder="CITY"
                    className="w-full min-h-[56px] bg-brand-gray border border-white/10 rounded-2xl p-4 pl-12 text-sm font-bold uppercase outline-none focus:border-brand-accent transition-all"
                  />
                </div>
              </div>

              {/* Tap-friendly role picker */}
              <section className="space-y-3">
                <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                  Primary Creative Role
                </label>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {WAITLIST_ROLES.map((role) => {
                    const isSelected = requestForm.role === role;

                    return (
                      <button
                        key={role}
                        type="button"
                        onClick={() => handleRequestChange('role', role)}
                        className={`w-full min-h-[60px] rounded-2xl border p-4 text-left transition-all flex items-center justify-between ${isSelected
                            ? 'bg-brand-accent border-brand-accent text-brand-black'
                            : 'bg-brand-gray border-white/10 text-white hover:border-brand-accent'
                          }`}
                      >
                        <div className="flex items-center gap-3">
                          <Briefcase
                            size={17}
                            className={
                              isSelected ? 'text-brand-black' : 'text-gray-500'
                            }
                          />

                          <span className="text-xs font-black uppercase tracking-widest">
                            {role}
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

              {requiresCustomTitle && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-2"
                >
                  <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">
                    Creative Title
                  </label>

                  <input
                    type="text"
                    value={requestForm.customTitle}
                    onChange={(e) =>
                      handleRequestChange('customTitle', e.target.value)
                    }
                    placeholder="E.G. RETOUCHER, STYLIST, SET DESIGNER"
                    className="w-full min-h-[56px] bg-brand-gray border border-white/10 rounded-2xl p-4 text-sm font-bold uppercase outline-none focus:border-brand-accent transition-all"
                  />
                </motion.div>
              )}

              <textarea
                value={requestForm.reason}
                onChange={(e) => handleRequestChange('reason', e.target.value)}
                placeholder="WHY DO YOU WANT TO JOIN THE REVIEW?"
                rows={4}
                className="w-full bg-brand-gray border border-white/10 rounded-2xl p-4 text-sm font-bold uppercase outline-none focus:border-brand-accent transition-all resize-none"
              />

              <button
                type="submit"
                disabled={!canRequestAccess}
                className="w-full min-h-[56px] py-5 bg-white text-brand-black rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-brand-accent transition-all disabled:opacity-20 flex items-center justify-center gap-2"
              >
                Send Request <Send size={18} />
              </button>

              {!canRequestAccess && (
                <p className="text-center text-[10px] text-gray-500 uppercase tracking-widest leading-relaxed">
                  Fill out name, email, Instagram, city, role, and title if
                  Other.
                </p>
              )}

              <button
                type="button"
                onClick={() => setIsRequesting(false)}
                className="w-full min-h-[48px] py-4 text-gray-500 hover:text-white text-xs font-black uppercase tracking-widest transition-colors"
              >
                Back to code entry
              </button>
            </form>
          </motion.div>
        )}
      </div>
    </div>
  );
}