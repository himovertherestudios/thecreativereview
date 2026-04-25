import React from 'react';
import { motion } from 'motion/react';
import {
  Flame,
  MessageSquare,
  TrendingUp,
  HelpCircle,
  ArrowRight,
  Zap,
  ShieldOff,
} from 'lucide-react';
import { RECENT_REVIEWS } from '../data';
import { Link } from 'react-router-dom';

type CardProps = {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
};

function Card({ title, icon: Icon, children, className = '' }: CardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-brand-gray border border-white/10 rounded-3xl p-5 md:p-6 flex flex-col ${className}`}
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-black tracking-widest text-gray-400 uppercase flex items-center gap-2">
          <Icon size={15} className="text-brand-accent" />
          {title}
        </h3>
      </div>

      <div className="flex-1">{children}</div>
    </motion.section>
  );
}

function SwipeCard({ title, icon: Icon, children }: CardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="min-w-[88vw] max-w-[88vw] snap-center bg-brand-gray border border-white/10 rounded-3xl p-5 flex flex-col min-h-[430px]"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-black tracking-widest text-gray-400 uppercase flex items-center gap-2">
          <Icon size={15} className="text-brand-accent" />
          {title}
        </h3>
      </div>

      <div className="flex-1">{children}</div>
    </motion.section>
  );
}

function getRatingLabel(contentRating: string) {
  if (contentRating === 'Explicit') return 'NSFW';
  return contentRating;
}

export default function Dashboard() {
  const hotSeat = RECENT_REVIEWS[0];
  const recentRequests = RECENT_REVIEWS.slice(1, 4);

  const tipCard = (
    <div className="flex flex-col gap-5">
      <div>
        <p className="text-xl md:text-2xl font-black leading-tight mb-3 tracking-tight uppercase">
          Don&apos;t fix the color if the composition is dead.
        </p>

        <p className="text-sm text-gray-400 font-medium leading-relaxed">
          Too many creatives spend hours polishing a frame that should have been
          cut. Kill your darlings early.
        </p>
      </div>
    </div>
  );

  const ventCard = (
    <div className="h-full flex flex-col justify-between gap-5">
      <p className="text-lg font-black leading-tight tracking-tight uppercase">
        Can we stop asking models to “do something” without giving any
        direction?
      </p>

      <Link
        to="/vents"
        className="min-h-[46px] px-4 py-3 bg-brand-black border border-white/10 rounded-2xl text-[10px] font-black text-brand-accent uppercase tracking-widest flex items-center justify-center gap-2 hover:border-brand-accent transition-all"
      >
        Join the chaos <ArrowRight size={14} />
      </Link>
    </div>
  );

  const hotSeatCard = (
    <div className="flex flex-col h-full">
      <Link
        to={`/photo/${hotSeat.id}`}
        className="relative aspect-[4/5] rounded-2xl overflow-hidden mb-4 group cursor-pointer block bg-brand-black"
      >
        {hotSeat.contentRating === 'Explicit' && (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/55 backdrop-blur-[24px] text-center p-5">
            <ShieldOff size={32} className="text-brand-critique mb-3" />

            <p className="text-[10px] font-black uppercase tracking-widest text-white">
              NSFW Hot Seat
            </p>

            <p className="text-[10px] text-gray-400 mt-2">
              Open to review with respect.
            </p>
          </div>
        )}

        <img
          src={hotSeat.imageUrl}
          alt="Hot seat review"
          className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${hotSeat.contentRating === 'Explicit' ? 'blur-2xl scale-105' : ''
            }`}
          draggable={false}
          onContextMenu={(event) => event.preventDefault()}
        />

        <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

        <div className="absolute top-4 left-4">
          <span className="px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest bg-brand-accent/20 text-brand-accent border border-brand-accent/30">
            Most Discussed
          </span>
        </div>

        <div className="absolute bottom-4 left-4 right-4">
          <p className="text-[10px] font-black text-brand-accent uppercase mb-1 tracking-widest">
            {getRatingLabel(hotSeat.contentRating)} • {hotSeat.creatorRole}
          </p>

          <p className="text-sm font-bold uppercase line-clamp-2">
            {hotSeat.caption}
          </p>
        </div>
      </Link>

      <Link
        to={`/photo/${hotSeat.id}`}
        className="w-full min-h-[48px] py-3 bg-white text-brand-black rounded-2xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-brand-accent transition-colors flex items-center justify-center gap-2"
      >
        Drop a Review <ArrowRight size={14} />
      </Link>
    </div>
  );

  const challengeCard = (
    <div className="h-full flex items-center">
      <div className="w-full text-center py-8 px-4 bg-brand-accent/5 rounded-2xl border border-brand-accent/10">
        <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent mb-2">
          Weekly Prompt
        </p>

        <h4 className="text-3xl font-black tracking-tight mb-2">NO COLORS</h4>

        <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest leading-relaxed">
          Submit one black-and-white edit only. Make the mood do the work.
        </p>
      </div>
    </div>
  );

  const recentActivityCard = (
    <div className="space-y-3">
      {recentRequests.map((request) => (
        <Link
          key={request.id}
          to={`/photo/${request.id}`}
          className="min-h-[64px] flex items-center gap-3 p-3 rounded-2xl bg-brand-black/50 border border-white/5 hover:border-brand-accent/40 transition-all group"
        >
          <div className="w-12 h-12 rounded-xl overflow-hidden flex-shrink-0 bg-brand-black">
            <img
              src={request.imageUrl}
              alt={request.caption}
              className={`w-full h-full object-cover ${request.contentRating === 'Explicit' ? 'blur-md scale-110' : ''
                }`}
              draggable={false}
              onContextMenu={(event) => event.preventDefault()}
            />
          </div>

          <div className="flex-1 min-w-0">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">
              {getRatingLabel(request.contentRating)} • {request.creatorRole}
            </p>

            <p className="text-xs font-bold truncate uppercase">
              {request.caption}
            </p>
          </div>

          <ArrowRight
            size={16}
            className="text-gray-600 group-hover:text-brand-accent flex-shrink-0"
          />
        </Link>
      ))}
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 pb-6">
      {/* Mobile Swipe Dashboard */}
      <div className="md:hidden space-y-4">


        <div className="-mx-4 px-4 overflow-x-auto snap-x snap-mandatory flex gap-4 pb-4 scrollbar-hide">
          <SwipeCard title="Tip of the Day" icon={Zap}>
            {tipCard}
          </SwipeCard>

          <SwipeCard title="Vent of the Day" icon={MessageSquare}>
            {ventCard}
          </SwipeCard>

          <SwipeCard title="Frame on the Hot Seat" icon={Flame}>
            {hotSeatCard}
          </SwipeCard>

          <SwipeCard title="Challenge of the Week" icon={TrendingUp}>
            {challengeCard}
          </SwipeCard>

          <SwipeCard title="Recent Review Requests" icon={HelpCircle}>
            {recentActivityCard}
          </SwipeCard>
        </div>

        <div className="flex justify-center gap-2">
          {[1, 2, 3, 4, 5].map((dot) => (
            <span
              key={dot}
              className="w-2 h-2 rounded-full bg-white/20"
              aria-hidden="true"
            />
          ))}
        </div>
      </div>

      {/* Desktop / Tablet Grid Dashboard */}
      <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
        <Card title="Tip of the Day" icon={Zap} className="md:col-span-2">
          {tipCard}
        </Card>

        <Card title="Vent of the Day" icon={MessageSquare}>
          {ventCard}
        </Card>

        <Card title="Frame on the Hot Seat" icon={Flame} className="md:row-span-2">
          {hotSeatCard}
        </Card>

        <Card title="Challenge of the Week" icon={TrendingUp}>
          {challengeCard}
        </Card>

        <Card title="Recent Review Requests" icon={HelpCircle}>
          {recentActivityCard}
        </Card>
      </div>

      <div className="flex justify-center pt-4">
        <Link
          to="/feed"
          className="min-h-[48px] px-6 py-3 rounded-2xl bg-brand-gray border border-white/10 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 hover:text-white hover:border-white/20 transition-all"
        >
          View full feed <ArrowRight size={14} />
        </Link>
      </div>
    </div>
  );
}