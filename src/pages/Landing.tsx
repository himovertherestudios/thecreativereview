import React, { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import {
  Flame,
  ArrowRight,
  ShieldCheck,
  LogIn,
  Mail,
  Loader2,
  Download,
  X,
} from 'lucide-react';
import { supabase } from '../lib/supabase';

export default function Landing() {
  const navigate = useNavigate();
  const [checkingSession, setCheckingSession] = React.useState(true);
  const [showInstallModal, setShowInstallModal] = React.useState(false);

  useEffect(() => {
    const checkSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.user) {
        navigate('/dashboard', { replace: true });
        return;
      }

      setCheckingSession(false);
    };

    checkSession();
  }, [navigate]);

  const handleRequestInvite = () => {
    const subject = encodeURIComponent('Creative Review Beta Code Request');
    const body = encodeURIComponent(
      `Name:\n\nCreative Role:\n\nInstagram/Portfolio:\n\nWhy do you want to join the beta?\n\n`
    );

    window.location.href = `mailto:himovertherebooking@gmail.com?subject=${subject}&body=${body}`;
  };

  if (checkingSession) {
    return (
      <div className="min-h-screen bg-brand-black flex items-center justify-center">
        <div className="flex items-center gap-3 text-gray-500">
          <Loader2 size={20} className="animate-spin" />
          <p className="text-[10px] font-black uppercase tracking-widest">
            Checking session...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen relative overflow-hidden flex flex-col items-center justify-center bg-brand-black p-6">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-brand-accent/5 rounded-full blur-[120px] pointer-events-none" />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="max-w-4xl w-full text-center relative z-10"
      >
        <div className="flex justify-center mb-8">
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="w-20 h-20 rounded-3xl bg-brand-accent flex items-center justify-center shadow-2xl shadow-brand-accent/20"
          >
            <Flame size={40} className="text-brand-black" />
          </motion.div>
        </div>

        <h1 className="text-6xl md:text-9xl font-black mb-4 leading-[0.8] tracking-tighter">
          THE CREATIVE <br /> <span className="text-brand-accent">REVIEW</span>
        </h1>

        <p className="text-xl md:text-2xl font-bold uppercase tracking-[0.2em] mb-12 text-gray-400">
          No fake likes. <span className="text-white">Just real critique.</span>
        </p>

        <div className="max-w-2xl mx-auto mb-16 px-4">
          <p className="text-lg md:text-xl text-gray-300 leading-relaxed font-medium">
            An invite-only collective where photographers, models, MUAs, and creators get real about their work. No algorithms, no influencers, just raw growth.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-4 justify-center">
          <button
            type="button"
            onClick={() => navigate('/login')}
            className="px-10 py-5 bg-brand-accent text-brand-black rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-white transition-all flex items-center justify-center gap-2"
          >
            Log In <LogIn size={18} />
          </button>

          <button
            type="button"
            onClick={() => navigate('/invite')}
            className="px-10 py-5 bg-white text-brand-black rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-brand-accent transition-all flex items-center justify-center gap-2"
          >
            I Have a Code <ArrowRight size={18} />
          </button>

          <button
            type="button"
            onClick={handleRequestInvite}
            className="px-10 py-5 bg-transparent border-2 border-white/20 text-white rounded-2xl font-black uppercase text-sm tracking-widest hover:border-brand-accent hover:text-brand-accent transition-all flex items-center justify-center gap-2"
          >
            Request an Invite <Mail size={18} />
          </button>

          <button
            type="button"
            onClick={() => setShowInstallModal(true)}
            className="px-10 py-5 bg-transparent border-2 border-brand-accent/50 text-brand-accent rounded-2xl font-black uppercase text-sm tracking-widest hover:bg-brand-accent hover:text-brand-black transition-all flex items-center justify-center gap-2"
          >
            Add App <Download size={18} />
          </button>
        </div>

        <div className="mt-16 flex items-center justify-center gap-3 text-xs font-bold uppercase tracking-widest text-gray-500">
          <ShieldCheck size={16} /> 18+ SECURE COMMUNITY • PRIVATE BETA
        </div>
      </motion.div>

      <div className="absolute bottom-10 left-10 md:block hidden animate-pulse">
        <span className="text-[10px] uppercase font-bold tracking-[0.5em] text-white/20 vertical-rl transform rotate-180">
          RAW FEEDBACK ONLY
        </span>
      </div>

      <div className="absolute top-10 right-10 md:block hidden animate-bounce">
        <span className="text-[10px] uppercase font-bold tracking-[0.5em] text-brand-accent/20 vertical-rl">
          ESTABLISHED IN CHAOS
        </span>
      </div>

      {showInstallModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 px-4 backdrop-blur-sm">
          <motion.div
            initial={{ opacity: 0, scale: 0.92, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
            className="relative w-full max-w-sm rounded-[2rem] border border-white/10 bg-brand-black p-6 shadow-2xl"
          >
            <button
              type="button"
              onClick={() => setShowInstallModal(false)}
              className="absolute right-4 top-4 rounded-full border border-white/10 bg-white/5 p-2 text-white/70 hover:text-white transition-colors"
              aria-label="Close install instructions"
            >
              <X size={18} />
            </button>

            <div className="mb-5 pr-10">
              <p className="mb-2 text-[10px] font-black uppercase tracking-[0.3em] text-brand-accent">
                Install The Creative Review
              </p>

              <h2 className="text-3xl font-black uppercase tracking-tight text-white">
                Add It To Your Home Screen
              </h2>
            </div>

            <div className="space-y-4 text-sm leading-relaxed text-white/70">
              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="mb-1 font-black uppercase tracking-widest text-white">
                  iPhone / Safari
                </p>
                <p>
                  Tap the <span className="font-bold text-white">Share</span> icon, then choose{' '}
                  <span className="font-bold text-white">Add to Home Screen</span>.
                </p>
              </div>

              <div className="rounded-2xl border border-white/10 bg-white/5 p-4">
                <p className="mb-1 font-black uppercase tracking-widest text-white">
                  Android / Chrome
                </p>
                <p>
                  Tap the <span className="font-bold text-white">menu</span> button, then choose{' '}
                  <span className="font-bold text-white">Install App</span> or{' '}
                  <span className="font-bold text-white">Add to Home Screen</span>.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowInstallModal(false)}
              className="mt-6 w-full rounded-2xl bg-brand-accent px-5 py-4 text-sm font-black uppercase tracking-widest text-brand-black hover:bg-white transition-all"
            >
              Got It
            </button>
          </motion.div>
        </div>
      )}
    </div>
  );
}