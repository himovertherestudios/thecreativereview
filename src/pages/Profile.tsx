import React, { useEffect, useRef, useState } from 'react';
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
  History,
  ArrowRight,
  Camera,
  ExternalLink,
  Globe,
  Loader2,
  Upload,
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { FAKE_USER, RECENT_REVIEWS } from '../data';
import { supabase } from '../lib/supabase';

type ProfileTab = 'frames' | 'critiques';

type UserProfile = {
  id: string;
  display_name: string | null;
  username: string | null;
  instagram_handle: string | null;
  role: string | null;
  city: string | null;
  bio: string | null;
  website: string | null;
  avatar_url: string | null;
};

function getRatingLabel(contentRating: string) {
  if (contentRating === 'Explicit') return 'NSFW';
  return contentRating;
}

function getFallbackAvatar(seed: string | null | undefined) {
  return `https://picsum.photos/seed/${seed || 'creative-review-user'}/200/200`;
}

function addCacheBuster(url: string) {
  if (!url) return url;

  const separator = url.includes('?') ? '&' : '?';

  return `${url}${separator}v=${Date.now()}`;
}

export default function Profile() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [activeTab, setActiveTab] = useState<ProfileTab>('frames');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [avatarMessage, setAvatarMessage] = useState('');

  const displayName = profile?.display_name || FAKE_USER.displayName;
  const username =
    profile?.instagram_handle || profile?.username || FAKE_USER.username;
  const avatarUrl =
    profile?.avatar_url || FAKE_USER.avatarUrl || getFallbackAvatar(profile?.id);
  const role = profile?.role || FAKE_USER.role;
  const city = profile?.city || FAKE_USER.city;
  const bio = profile?.bio || FAKE_USER.bio;
  const website = profile?.website || FAKE_USER.website;
  const cleanUsername = username.replace('@', '');
  const instagramUrl = `https://www.instagram.com/${cleanUsername}`;

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

  const loadProfile = async () => {
    setIsLoadingProfile(true);

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        setProfile(null);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select(
          `
          id,
          display_name,
          username,
          instagram_handle,
          role,
          city,
          bio,
          website,
          avatar_url
        `
        )
        .eq('id', user.id)
        .maybeSingle();

      if (error) throw error;

      setProfile(data as UserProfile | null);
    } catch (error) {
      console.error('Profile load error:', error);
      setProfile(null);
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, []);

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setIsUploadingAvatar(true);
    setAvatarMessage('');

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        throw new Error('You must be logged in to upload a profile picture.');
      }

      if (!file.type.startsWith('image/')) {
        throw new Error('Please upload an image file.');
      }

      const maxFileSize = 5 * 1024 * 1024;

      if (file.size > maxFileSize) {
        throw new Error('Please upload an image smaller than 5MB.');
      }

      const fileExt = file.name.split('.').pop()?.toLowerCase() || 'jpg';
      const safeFileExt = ['jpg', 'jpeg', 'png', 'webp'].includes(fileExt)
        ? fileExt
        : 'jpg';

      const filePath = `${user.id}/avatar.${safeFileExt}`;

      const { error: uploadError } = await supabase.storage
        .from('avatars')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: true,
        });

      if (uploadError) throw uploadError;

      const { data: publicUrlData } = supabase.storage
        .from('avatars')
        .getPublicUrl(filePath);

      const publicUrl = addCacheBuster(publicUrlData.publicUrl);

      const { error: updateError } = await supabase
        .from('profiles')
        .update({ avatar_url: publicUrl })
        .eq('id', user.id);

      if (updateError) throw updateError;

      window.dispatchEvent(new Event('creative-review-avatar-updated'));

      setProfile((current) =>
        current
          ? {
            ...current,
            avatar_url: publicUrl,
          }
          : {
            id: user.id,
            display_name: user.email || 'Creative Member',
            username: null,
            instagram_handle: null,
            role: null,
            city: null,
            bio: null,
            website: null,
            avatar_url: publicUrl,
          }
      );

      setAvatarMessage('Profile picture updated.');

      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong uploading your profile picture.';

      setAvatarMessage(message);
    } finally {
      setIsUploadingAvatar(false);
    }
  };

  return (
    <div className="space-y-8 pb-20">
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
            <label className="relative w-20 h-20 md:w-24 md:h-24 rounded-3xl border-4 border-brand-black bg-brand-gray overflow-hidden flex-shrink-0 cursor-pointer group block">
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
                draggable={false}
                onError={(event) => {
                  event.currentTarget.src = getFallbackAvatar(profile?.id);
                }}
              />

              <div className="absolute inset-0 bg-black/60 opacity-100 md:opacity-0 md:group-hover:opacity-100 transition-opacity flex items-center justify-center">
                {isUploadingAvatar ? (
                  <Loader2 size={20} className="animate-spin text-white" />
                ) : (
                  <Upload size={20} className="text-white" />
                )}
              </div>

              <input
                ref={fileInputRef}
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
                disabled={isUploadingAvatar}
              />
            </label>

            <div className="flex-1 min-w-0 space-y-3 pt-2">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <h1 className="text-2xl md:text-4xl font-black tracking-tighter uppercase">
                    {isLoadingProfile ? 'Loading...' : displayName}
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
                    @{cleanUsername}
                    <ExternalLink size={11} />
                  </a>

                  {website && (
                    <a
                      href={website}
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
                {bio}
              </p>

              {avatarMessage && (
                <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent">
                  {avatarMessage}
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 mt-5">
            <span className="min-h-[34px] px-3 py-2 rounded-full bg-brand-black border border-white/10 text-[10px] font-black uppercase tracking-widest text-brand-accent flex items-center gap-2">
              <Briefcase size={13} /> {role}
            </span>

            <span className="min-h-[34px] px-3 py-2 rounded-full bg-brand-black border border-white/10 text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
              <MapPin size={13} /> {city}
            </span>

            <span className="min-h-[34px] px-3 py-2 rounded-full bg-brand-black border border-white/10 text-[10px] font-black uppercase tracking-widest text-white flex items-center gap-2">
              <Award size={13} /> {FAKE_USER.experienceLevel}
            </span>
          </div>
        </div>
      </section>

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

      <section className="bg-brand-accent/10 border border-brand-accent/20 rounded-3xl p-5 md:p-6 space-y-4">
        <div className="flex items-center gap-3 text-brand-accent">
          <ShieldCheck size={22} />

          <h4 className="text-xs font-black uppercase tracking-widest">
            Creative Member
          </h4>
        </div>

        <p className="text-[10px] font-bold text-gray-400 uppercase leading-relaxed tracking-wider">
          Proud and productive member. Never banned. Always honest.
        </p>
      </section>

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
            className="grid grid-cols-3 gap-1 md:gap-3"
          >
            {RECENT_REVIEWS.map((request) => {
              const isExplicit = request.contentRating === 'Explicit';

              return (
                <Link
                  key={request.id}
                  to={`/photo/${request.id}`}
                  className="aspect-square overflow-hidden relative group cursor-pointer border border-white/5 bg-brand-gray block"
                >
                  <img
                    src={request.imageUrl}
                    alt={request.caption}
                    className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${isExplicit ? 'blur-md scale-110' : ''
                      }`}
                    draggable={false}
                    onContextMenu={(event) => event.preventDefault()}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[8px] font-black text-brand-accent uppercase">
                      {request.reviewCount} reviews
                    </p>

                    <p className="text-[9px] font-bold uppercase line-clamp-1">
                      {getRatingLabel(request.contentRating)}
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