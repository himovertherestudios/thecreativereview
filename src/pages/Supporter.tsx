import React from 'react';
import { motion } from 'motion/react';
import {
  ShieldCheck,
  Star,
  Zap,
  Save,
  Lock,
  Layout,
  HelpCircle,
  ArrowRight,
  Flame,
  HeartHandshake,
  BadgeCheck,
  Sparkles,
} from 'lucide-react';

type PlanFeatureProps = {
  icon: React.ElementType;
  text: string;
};

function PlanFeature({ icon: Icon, text }: PlanFeatureProps) {
  return (
    <li className="flex items-start gap-3">
      <div className="mt-1 text-brand-accent flex-shrink-0">
        <Icon size={15} />
      </div>

      <span className="text-[11px] font-black uppercase tracking-widest text-gray-300 leading-snug">
        {text}
      </span>
    </li>
  );
}

export default function Supporter() {
  return (
    <div className="max-w-4xl mx-auto space-y-8 md:space-y-12 pb-10">
      <header className="text-center space-y-5">
        <div className="flex justify-center">
          <div className="w-16 h-16 rounded-3xl bg-brand-accent/10 border border-brand-accent/30 flex items-center justify-center text-brand-accent">
            <HeartHandshake size={32} />
          </div>
        </div>

        <div>
          <p className="text-brand-accent text-[10px] font-black uppercase tracking-[0.3em] mb-3">
            Voluntary Support
          </p>

          <h1 className="text-4xl md:text-7xl font-black tracking-tighter uppercase leading-none">
            Keep the Review Alive
          </h1>
        </div>

        <p className="text-gray-400 max-w-xl mx-auto font-medium text-sm md:text-base leading-relaxed">
          The Creative Review is free to join. Supporting is optional. If this
          space helps you grow, laugh, learn, or get better work, you can help
          keep the lights on.
        </p>
      </header>

      <section className="bg-brand-gray border border-white/10 rounded-3xl p-5 md:p-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center text-brand-accent flex-shrink-0">
            <ShieldCheck size={20} />
          </div>

          <div>
            <h2 className="text-sm font-black uppercase tracking-widest mb-2">
              The Promise
            </h2>

            <p className="text-sm text-gray-400 leading-relaxed">
              Supporters do not buy better treatment. They help fund a cleaner,
              stronger community. Free members still belong here.
            </p>
          </div>
        </div>
      </section>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8">
        {/* Free Plan */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand-gray border border-white/5 rounded-3xl p-6 md:p-8 flex flex-col relative overflow-hidden group"
        >
          <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
            <Flame size={120} />
          </div>

          <div className="mb-8 relative z-10">
            <h2 className="text-[10px] font-black text-gray-500 uppercase tracking-[0.3em] mb-2">
              Free Tier
            </h2>

            <h3 className="text-3xl font-black tracking-tighter uppercase">
              Creative Member
            </h3>

            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-3 leading-relaxed">
              For members who want feedback, community, and honest creative
              growth.
            </p>
          </div>

          <ul className="space-y-4 mb-10 flex-1 relative z-10">
            <PlanFeature icon={Layout} text="Access to the review feed" />
            <PlanFeature icon={HelpCircle} text="Submit frames for critique" />
            <PlanFeature icon={Zap} text="Post and comment in The Corner" />
            <PlanFeature icon={Star} text="Use anonymous critique options" />
            <PlanFeature icon={BadgeCheck} text="Build your creative profile" />
          </ul>

          <div className="pt-6 border-t border-white/5 relative z-10">
            <div className="text-lg font-black tracking-tighter uppercase mb-4">
              $0 / Forever
            </div>

            <button
              type="button"
              disabled
              className="w-full min-h-[52px] border border-white/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-gray-500"
            >
              Current Plan
            </button>
          </div>
        </motion.section>

        {/* Supporter Plan */}
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.05 }}
          className="bg-brand-gray border-2 border-brand-accent rounded-3xl p-6 md:p-8 flex flex-col relative overflow-hidden group shadow-2xl shadow-brand-accent/10"
        >
          <div className="absolute top-0 right-0 bg-brand-accent text-brand-black px-4 py-2 text-[8px] font-black uppercase tracking-widest rounded-bl-xl z-10">
            Optional
          </div>

          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity text-brand-accent">
            <Star size={120} fill="currentColor" />
          </div>

          <div className="mb-8 relative z-10">
            <h2 className="text-[10px] font-black text-brand-accent uppercase tracking-[0.3em] mb-2">
              Supporter Tier
            </h2>

            <h3 className="text-3xl font-black tracking-tighter uppercase">
              Creative Supporter
            </h3>

            <p className="text-xs text-gray-500 font-bold uppercase tracking-widest mt-3 leading-relaxed">
              For members who want to help fund the platform and get a little
              extra shine.
            </p>
          </div>

          <ul className="space-y-4 mb-10 flex-1 relative z-10">
            <PlanFeature icon={ShieldCheck} text="Supporter profile badge" />
            <PlanFeature icon={HelpCircle} text="Higher review request limits" />
            <PlanFeature icon={Zap} text="Priority placement experiments" />
            <PlanFeature icon={Save} text="Save favorite critiques later" />
            <PlanFeature icon={Lock} text="Private prompts and beta features" />
            <PlanFeature icon={Sparkles} text="Early access to new tools" />
          </ul>

          <div className="pt-6 border-t border-brand-accent/20 relative z-10">
            <div className="flex items-end justify-between gap-3 mb-4">
              <div>
                <p className="text-lg font-black tracking-tighter uppercase">
                  $12 / Month
                </p>

                <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mt-1">
                  Placeholder price for prototype
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={() =>
                alert(
                  'Prototype only: this will connect to Stripe in the production build.'
                )
              }
              className="w-full min-h-[54px] bg-brand-accent text-brand-black rounded-2xl text-[10px] font-black uppercase tracking-widest hover:scale-[1.01] active:scale-[0.99] transition-all shadow-lg shadow-brand-accent/20 flex items-center justify-center gap-2"
            >
              Keep the Lights On <ArrowRight size={15} />
            </button>
          </div>
        </motion.section>
      </div>

      <section className="bg-brand-black border border-white/10 rounded-3xl p-5 md:p-6 text-center">
        <p className="text-[10px] font-black uppercase tracking-[0.3em] text-gray-600 leading-relaxed">
          Stripe, supporter roles, and billing logic come later in the Next.js
          production build.
        </p>
      </section>
    </div>
  );
}