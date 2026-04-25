import React, { useState } from 'react';
import { motion } from 'motion/react';
import {
  Instagram,
  MapPin,
  Briefcase,
  Award,
  Star,
  Settings,
  ShieldCheck,
  Grid,
  MessageSquare,
  History,
  ArrowRight,
  Camera,
  ExternalLink,
  Globe,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { FAKE_USER, RECENT_REVIEWS } from '../data';

type ProfileTab = 'frames' | 'critiques';

function getRatingLabel(contentRating: string) {
  if (contentRating === 'Explicit') return 'NSFW';
  return contentRating;
}

export default function Profile() {
  const [activeTab, setActiveTab] = useState<ProfileTab>('frames');

  const instagramUrl = `https://www.instagram.com/${FAKE_USER.username}`;

  const critiqueItems = RECENT_REVIEWS.slice(0, 3).map((request, index) => ({
    id: `critique-${index + 1}`,
    photoId: request.id,
    text:
      index === 0
        ? 'That lighting critique was actually useful. Shadows had a purpose.'
        : index === 1
          ? 'Strong concept, but the crop is fighting the pose.'
          : 'This one is portfolio ready after one cleaner color pass.',
    imageUrl: request.imageUrl,
    caption: request.caption,
  }));

  return (
    <div className="space-y-8 pb-20">
      {/* Profile Identity Card */}
      <section className="bg-brand-gray border border-white/10 rounded-3xl overflow-hidden">
        <div className="h-24 md:h-36 bg-gradient-to-br from-brand-accent/20 via-brand-gray to-brand-black relative">
          <div className="absolute inset-0 bg-gradient-to-t from-brand-black/80 to-transparent" />

          <button
            type="button"
            className="absolute top-4 right-4 min-h-[44px] min-w-[44px] bg-black/40 backdrop-blur-md rounded-full border border-white/10 hover:bg-white/10 transition-all flex items-center justify-center"
            aria-label="Profile settings"
          >
            <Settings size={20} />
          </button>
        </div>

        <div className="p-5 md:p-8 -mt-10 relative z-10">
          <div className="flex items-start gap-4">
            <div className="w-20 h-20 md:w-24 md:h-24 rounded-3xl border-4 border-brand-black bg-brand-gray overflow-hidden flex-shrink-0">
              <img
                src={FAKE_USER.avatarUrl}
                alt={FAKE_USER.displayName}
                className="w-full h-full object-cover"
                draggable={false}
              />
            </div>

            <div className="flex-1 min-w-0 space-y-3 pt-2">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl md:text-4xl font-black tracking-tighter uppercase">
                    {FAKE_USER.displayName}
                  </h1>

                  {FAKE_USER.isSupporter && (
                    <div className="min-h-[24px] px-3 py-1 bg-brand-accent text-brand-black text-[8px] font-black rounded-full uppercase tracking-widest flex items-center gap-1">
                      <Star size={10} fill="black" /> Supporter
                    </div>
                  )}
                </div>

                <div className="flex flex-wrap items-center gap-3">
                  <a
                    href={instagramUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-accent hover:text-white transition-colors"
                  >
                    <Instagram size={13} />
                    @{FAKE_USER.username}
                    <ExternalLink size={11} />
                  </a>

                  {FAKE_USER.website && (
                    <a
                      href={FAKE_USER.website}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-brand-accent transition-colors"
                    >
                      <Globe size={13} />
                      Website
                      <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>

              <p className="text-sm text-gray-400 font-medium leading-relaxed max-w-2xl">
                {FAKE_USER.bio}
              </p>
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-5">
            <span className="min-h-[34px] px-3 py-2 rounded-full bg-brand-black border border-white/10 text-[10px] font-black uppercase tracking-widest text-brand-accent flex items-center gap-2">
              <Briefcase size={13} /> {FAKE_USER.role}
            </span>

            <span className="min-h-[34px] px-3 py-2 rounded-full bg-brand-black border border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <MapPin size={13} /> {FAKE_USER.city}
            </span>

            <span className="min-h-[34px] px-3 py-2 rounded-full bg-brand-black border border-white/10 text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2">
              <Award size={13} /> {FAKE_USER.experienceLevel}
            </span>
          </div>
        </div>
      </section>

      {/* Stats Carousel on Mobile / Row on Desktop */}
      <section className="flex gap-3 overflow-x-auto md:grid md:grid-cols-3 md:overflow-visible no-scrollbar -mx-4 px-4 md:mx-0 md:px-0">
        <div className="min-w-[58%] md:min-w-0 bg-brand-gray border border-white/10 rounded-2xl p-5 text-center">
          <p className="text-3xl font-black text-brand-accent mb-1">82</p>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
            Reviews Given
          </p>
        </div>

        <div className="min-w-[58%] md:min-w-0 bg-brand-gray border border-white/10 rounded-2xl p-5 text-center">
          <p className="text-3xl font-black text-white mb-1">24</p>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
            Reviews Received
          </p>
        </div>

        <div className="min-w-[58%] md:min-w-0 bg-brand-gray border border-white/10 rounded-2xl p-5 text-center">
          <p className="text-3xl font-black text-brand-critique mb-1">4.8</p>
          <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">
            Growth Factor
          </p>
        </div>
      </section>

      {/* Membership Status */}
      <section className="bg-brand-accent/10 border border-brand-accent/20 rounded-3xl p-5 md:p-6 space-y-4">
        <div className="flex items-center gap-3 text-brand-accent">
          <ShieldCheck size={22} />

          <h4 className="text-xs font-black uppercase tracking-widest">
            Creative Member
          </h4>
        </div>

        <p className="text-[10px] font-bold text-gray-400 uppercase leading-relaxed tracking-wider">
          Proud and productive member since March 2024. Never banned. Always
          honest.
        </p>
      </section>

      {/* Work Tabs */}
      <section className="space-y-5">
        <div className="grid grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => setActiveTab('frames')}
            className={`min-h-[52px] rounded-2xl border flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'frames'
              ? 'bg-brand-accent border-brand-accent text-brand-black'
              : 'bg-brand-gray border-white/10 text-gray-500 hover:text-white'
              }`}
          >
            <Grid size={15} /> Frames
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('critiques')}
            className={`min-h-[52px] rounded-2xl border flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'critiques'
              ? 'bg-brand-accent border-brand-accent text-brand-black'
              : 'bg-brand-gray border-white/10 text-gray-500 hover:text-white'
              }`}
          >
            <History size={15} /> Critiques
          </button>
        </div>

        {activeTab === 'frames' ? (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="grid grid-cols-2 md:grid-cols-3 gap-3 md:gap-4"
          >
            {RECENT_REVIEWS.map((request) => {
              const isExplicit = request.contentRating === 'Explicit';

              return (
                <Link
                  key={request.id}
                  to={`/photo/${request.id}`}
                  className="aspect-[3/4] rounded-2xl overflow-hidden relative group cursor-pointer border border-white/5 bg-brand-gray block"
                >
                  <img
                    src={request.imageUrl}
                    alt={request.caption}
                    className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${isExplicit ? 'blur-md scale-110' : ''
                      }`}
                    draggable={false}
                    onContextMenu={(event) => event.preventDefault()}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/10 to-transparent" />

                  <div className="absolute top-3 left-3">
                    <span className="px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest bg-black/60 border border-white/10 text-white/70">
                      {getRatingLabel(request.contentRating)}
                    </span>
                  </div>

                  <div className="absolute bottom-3 left-3 right-3">
                    <p className="text-[9px] font-black text-brand-accent uppercase mb-1">
                      {request.reviewCount} reviews
                    </p>

                    <p className="text-xs font-bold uppercase line-clamp-2">
                      {request.caption}
                    </p>
                  </div>
                </Link>
              );
            })}
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {critiqueItems.map((critique, index) => (
              <Link
                key={critique.id}
                to={`/photo/${critique.photoId}`}
                className="bg-brand-gray border border-white/10 rounded-2xl p-4 flex items-start gap-3 hover:border-brand-accent/40 transition-all"
              >
                <div className="w-14 h-14 rounded-2xl overflow-hidden bg-brand-black flex-shrink-0">
                  <img
                    src={critique.imageUrl}
                    alt={critique.caption}
                    className="w-full h-full object-cover"
                    draggable={false}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
                    Critique #{index + 1}
                  </p>

                  <p className="text-sm text-gray-300 leading-relaxed line-clamp-2">
                    {critique.text}
                  </p>

                  <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent mt-2 flex items-center gap-1">
                    View image <ArrowRight size={12} />
                  </p>
                </div>
              </Link>
            ))}
          </motion.div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <Link
          to="/submit"
          className="min-h-[54px] bg-brand-accent text-brand-black rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2"
        >
          <Camera size={16} /> Submit New Frame
        </Link>

        <Link
          to="/feed"
          className="min-h-[54px] bg-brand-gray border border-white/10 text-gray-300 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:text-white"
        >
          Browse Feed <ArrowRight size={16} />
        </Link>
      </section>
    </div>
  );
}