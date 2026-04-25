import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Gavel,
  Check,
  AlertTriangle,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

type Rule = {
  id: string;
  title: string;
  text: string;
};

const RULES: Rule[] = [
  {
    id: 'age',
    title: '18+ Only',
    text: 'I confirm I am 18 or older. Keep it grown.',
  },
  {
    id: 'ownership',
    title: 'Own It or Have Permission',
    text: "I confirm I own or have legal permission to upload everything I post. Don't be a thief.",
  },
  {
    id: 'critique',
    title: 'Honest Feedback Comes With the Territory',
    text: "I understand my work may receive honest, sometimes spicy critique. I won't take it personally.",
  },
  {
    id: 'theft',
    title: 'No Stealing Creative Work',
    text: "I agree not to steal, screenshot, repost, or reuse another creator's work without explicit permission.",
  },
  {
    id: 'nsfw',
    title: 'Label NSFW Correctly',
    text: 'I agree to properly label all NSFW/explicit content. We have eyes.',
  },
  {
    id: 'harassment',
    title: 'Critique the Work, Not the Human',
    text: 'I agree not to harass, body shame, dox, threaten, or exploit other users. Respect the craft, respect the person.',
  },
];

export default function Consent() {
  const navigate = useNavigate();

  const [agreed, setAgreed] = useState<Record<string, boolean>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveError, setSaveError] = useState('');

  const toggle = (id: string) => {
    setAgreed((current) => ({
      ...current,
      [id]: !current[id],
    }));

    if (saveError) {
      setSaveError('');
    }
  };

  const agreedCount = RULES.filter((rule) => agreed[rule.id]).length;
  const allAgreed = RULES.every((rule) => agreed[rule.id]);

  const handleAgree = async () => {
    if (!allAgreed || isSaving) return;

    setIsSaving(true);
    setSaveError('');

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) {
        throw userError;
      }

      if (!user) {
        throw new Error('No logged-in user found. Please create your account again.');
      }

      const { error: consentError } = await supabase
        .from('user_consents')
        .upsert(
          {
            user_id: user.id,
            confirmed_18_plus: true,
            confirmed_ownership: true,
            accepted_honest_critique: true,
            agreed_no_theft: true,
            agreed_nsfw_labeling: true,
            agreed_no_harassment: true,
            consent_version: 'v1',
          },
          {
            onConflict: 'user_id,consent_version',
          }
        );

      if (consentError) {
        throw consentError;
      }

      const { error: profileError } = await supabase
        .from('profiles')
        .update({
          has_completed_consent: true,
        })
        .eq('id', user.id);

      if (profileError) {
        throw profileError;
      }

      navigate('/starter-upload');
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong while saving your consent.';

      setSaveError(message);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-black px-4 py-6 md:p-6 flex items-center justify-center">
      <div className="max-w-2xl w-full">
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="bg-brand-gray border-2 border-brand-critique/30 rounded-3xl p-5 sm:p-8 md:p-12 relative overflow-hidden"
        >
          <div className="absolute top-0 left-0 w-full h-2 bg-brand-critique/50" />

          <div className="mb-8 md:mb-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-11 h-11 rounded-2xl bg-brand-critique/20 flex items-center justify-center text-brand-critique flex-shrink-0">
                <Gavel size={22} />
              </div>

              <div>
                <p className="text-brand-critique text-[10px] font-black uppercase tracking-[0.25em] mb-1">
                  Ground Rules
                </p>

                <h2 className="text-3xl md:text-4xl font-black tracking-tighter uppercase">
                  The Compact
                </h2>
              </div>
            </div>

            <p className="text-gray-400 font-medium text-sm md:text-base leading-relaxed">
              This community runs on trust, consent, and useful critique. Read
              carefully. Break the culture, lose the invite.
            </p>
          </div>

          <div className="mb-5">
            <div className="flex items-center justify-between text-[10px] font-black uppercase tracking-widest text-gray-500 mb-2">
              <span>Required agreements</span>
              <span>
                {agreedCount}/{RULES.length}
              </span>
            </div>

            <div className="h-2 rounded-full bg-brand-black overflow-hidden">
              <div
                className="h-full bg-brand-critique transition-all duration-300"
                style={{ width: `${(agreedCount / RULES.length) * 100}%` }}
              />
            </div>
          </div>

          <div className="space-y-3 mb-8 md:mb-10">
            {RULES.map((rule) => {
              const isChecked = Boolean(agreed[rule.id]);

              return (
                <button
                  key={rule.id}
                  type="button"
                  onClick={() => toggle(rule.id)}
                  className={`w-full min-h-[76px] flex items-start gap-4 p-4 rounded-2xl border-2 transition-all text-left ${isChecked
                      ? 'bg-brand-critique/10 border-brand-critique'
                      : 'bg-brand-black border-white/5 hover:border-white/20'
                    }`}
                >
                  <span
                    className={`mt-1 w-7 h-7 rounded-lg flex items-center justify-center transition-all flex-shrink-0 ${isChecked
                        ? 'bg-brand-critique text-brand-black'
                        : 'border-2 border-white/20 text-transparent'
                      }`}
                  >
                    <Check size={16} strokeWidth={4} />
                  </span>

                  <span className="block">
                    <span
                      className={`block text-[11px] font-black uppercase tracking-widest mb-1 ${isChecked ? 'text-brand-critique' : 'text-gray-500'
                        }`}
                    >
                      {rule.title}
                    </span>

                    <span
                      className={`block text-sm font-bold leading-snug ${isChecked ? 'text-white' : 'text-gray-400'
                        }`}
                    >
                      {rule.text}
                    </span>
                  </span>
                </button>
              );
            })}
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-start gap-3 p-4 bg-brand-critique/5 rounded-2xl border border-brand-critique/20">
              <AlertTriangle
                className="text-brand-critique flex-shrink-0 mt-0.5"
                size={20}
              />

              <p className="text-[10px] font-black uppercase text-brand-critique tracking-wider leading-relaxed">
                By clicking below, your agreement will be saved to your account.
                Formal terms come later.
              </p>
            </div>

            {saveError && (
              <div className="p-4 bg-brand-critique/10 border border-brand-critique/30 rounded-2xl">
                <p className="text-[10px] font-black uppercase text-brand-critique tracking-widest leading-relaxed">
                  {saveError}
                </p>
              </div>
            )}

            <button
              type="button"
              disabled={!allAgreed || isSaving}
              onClick={handleAgree}
              className="w-full min-h-[58px] py-5 bg-brand-critique text-white rounded-2xl font-black uppercase text-xs md:text-sm tracking-widest hover:brightness-110 active:scale-[0.98] transition-all disabled:opacity-30 disabled:grayscale flex items-center justify-center gap-3"
            >
              {isSaving ? (
                <>
                  <Loader2 size={18} className="animate-spin" />
                  Saving Consent
                </>
              ) : (
                <>
                  I Agree — Let Me In <ArrowRight size={18} />
                </>
              )}
            </button>

            {!allAgreed && (
              <p className="text-center text-[10px] text-gray-500 uppercase tracking-widest leading-relaxed">
                Check all agreements to continue.
              </p>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
}