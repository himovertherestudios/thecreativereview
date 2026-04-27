import React, { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';
import {
  Instagram,
  MapPin,
  Briefcase,
  Grid,
  History,
  ArrowRight,
  Camera,
  ExternalLink,
  Globe,
  Loader2,
  Upload,
  Save,
  X,
  ImageOff,
} from 'lucide-react';
import { Link, useParams } from 'react-router-dom';
import { FAKE_USER } from '../data';
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

type ProfilePhoto = {
  id: string;
  image_url: string;
  watermarked_url: string | null;
  caption: string | null;
  content_rating: string | null;
  review_count: number | null;
  created_at: string;
};

type ProfileStats = {
  framesUploaded: number;
  reviewsReceived: number;
  reviewsGiven: number;
};

type EditProfileForm = {
  display_name: string;
  username: string;
  instagram_handle: string;
  role: string;
  city: string;
  bio: string;
  website: string;
};

function getRatingLabel(contentRating: string | null) {
  if (contentRating === 'Explicit') return 'NSFW';
  if (!contentRating) return 'Safe';
  return contentRating;
}

function getFallbackAvatar(seed: string | null | undefined) {
  return `https://picsum.photos/seed/${seed || 'creative-review-user'}/200/200`;
}

function getFallbackPhoto(seed: string | null | undefined) {
  return `https://picsum.photos/seed/${seed || 'creative-review-photo'}/800/1000`;
}

function addCacheBuster(url: string) {
  if (!url) return url;
  const separator = url.includes('?') ? '&' : '?';
  return `${url}${separator}v=${Date.now()}`;
}

function normalizeWebsite(url: string) {
  const cleanUrl = url.trim();

  if (!cleanUrl) return '';

  if (cleanUrl.startsWith('http://') || cleanUrl.startsWith('https://')) {
    return cleanUrl;
  }

  return `https://${cleanUrl}`;
}

export default function Profile() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { userId } = useParams();
  const [currentUserId, setCurrentUserId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState<ProfileTab>('frames');
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [profilePhotos, setProfilePhotos] = useState<ProfilePhoto[]>([]);
  const [stats, setStats] = useState<ProfileStats>({
    framesUploaded: 0,
    reviewsReceived: 0,
    reviewsGiven: 0,
  });

  const [isLoadingProfile, setIsLoadingProfile] = useState(true);
  const [isSavingProfile, setIsSavingProfile] = useState(false);
  const [isUploadingAvatar, setIsUploadingAvatar] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);

  const [avatarMessage, setAvatarMessage] = useState('');
  const [profileMessage, setProfileMessage] = useState('');

  const [editForm, setEditForm] = useState<EditProfileForm>({
    display_name: '',
    username: '',
    instagram_handle: '',
    role: '',
    city: '',
    bio: '',
    website: '',
  });

  const displayName = profile?.display_name || FAKE_USER.displayName;
  const username =
    profile?.instagram_handle || profile?.username || FAKE_USER.username || '';
  const avatarUrl =
    profile?.avatar_url || FAKE_USER.avatarUrl || getFallbackAvatar(profile?.id);
  const role = profile?.role || FAKE_USER.role || 'Creative';
  const city = profile?.city || FAKE_USER.city || 'No location added';
  const bio =
    profile?.bio ||
    FAKE_USER.bio ||
    'No bio yet. Add a short intro so other creatives know who you are.';
  const website = profile?.website || FAKE_USER.website || '';
  const cleanUsername = username.replace('@', '').trim();
  const instagramUrl = cleanUsername
    ? `https://www.instagram.com/${cleanUsername}`
    : '';
  const viewedProfileId = userId || currentUserId;
  const isOwnProfile = Boolean(currentUserId && viewedProfileId === currentUserId);

  const critiqueItems = profilePhotos.slice(0, 3).map((photo, index) => ({
    id: `critique-${photo.id}`,
    photoId: photo.id,
    text:
      index === 0
        ? 'Recent critique activity will show here as the beta gets more feedback.'
        : index === 1
          ? 'Your review history will feel more alive once members start engaging.'
          : 'This section is ready for real critique history as beta activity grows.',
    imageUrl: photo.watermarked_url || photo.image_url || getFallbackPhoto(photo.id),
    caption: photo.caption || 'Creative Review photo',
  }));

  const syncEditForm = (currentProfile: UserProfile | null) => {
    setEditForm({
      display_name: currentProfile?.display_name || '',
      username: currentProfile?.username || '',
      instagram_handle: currentProfile?.instagram_handle || '',
      role: currentProfile?.role || '',
      city: currentProfile?.city || '',
      bio: currentProfile?.bio || '',
      website: currentProfile?.website || '',
    });
  };

  const loadProfile = async () => {
    setIsLoadingProfile(true);
    setAvatarMessage('');
    setProfileMessage('');

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        setCurrentUserId(null);
        setProfile(null);
        setProfilePhotos([]);
        setStats({
          framesUploaded: 0,
          reviewsReceived: 0,
          reviewsGiven: 0,
        });
        return;
      }

      setCurrentUserId(user.id);

      const targetProfileId = userId || user.id;

      const { data: profileData, error: profileError } = await supabase
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
        .eq('id', targetProfileId)
        .maybeSingle();

      if (profileError) throw profileError;

      const currentProfile = profileData as UserProfile | null;

      setProfile(currentProfile);
      syncEditForm(currentProfile);

      const { data: photosData, error: photosError } = await supabase
        .from('photos')
        .select(
          `
          id,
          image_url,
          watermarked_url,
          caption,
          content_rating,
          review_count,
          created_at
        `
        )
        .eq('user_id', targetProfileId)
        .order('created_at', { ascending: false });

      if (photosError) throw photosError;

      const photos = (photosData || []) as ProfilePhoto[];

      setProfilePhotos(photos);

      const { count: reviewsGivenCount, error: reviewsGivenError } = await supabase
        .from('critiques')
        .select('id', { count: 'exact', head: true })
        .eq('reviewer_id', targetProfileId);

      if (reviewsGivenError) {
        console.warn('Reviews given count error:', reviewsGivenError);
      }

      const reviewsReceived = photos.reduce((total, photo) => {
        return total + (photo.review_count || 0);
      }, 0);

      setStats({
        framesUploaded: photos.length,
        reviewsReceived,
        reviewsGiven: reviewsGivenCount || 0,
      });
    } catch (error) {
      console.error('Profile load error:', error);
      setProfile(null);
      setProfilePhotos([]);
      setStats({
        framesUploaded: 0,
        reviewsReceived: 0,
        reviewsGiven: 0,
      });
    } finally {
      setIsLoadingProfile(false);
    }
  };

  useEffect(() => {
    loadProfile();
  }, [userId]);

  const handleEditFormChange = (
    field: keyof EditProfileForm,
    value: string
  ) => {
    setEditForm((current) => ({
      ...current,
      [field]: value,
    }));
  };

  const handleSaveProfile = async () => {
    setIsSavingProfile(true);
    setProfileMessage('');

    try {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError) throw userError;

      if (!user) {
        throw new Error('You must be logged in to update your profile.');
      }

      const updates = {
        display_name: editForm.display_name.trim() || null,
        username: editForm.username.trim().replace('@', '') || null,
        instagram_handle:
          editForm.instagram_handle.trim().replace('@', '') || null,
        role: editForm.role.trim() || null,
        city: editForm.city.trim() || null,
        bio: editForm.bio.trim() || null,
        website: normalizeWebsite(editForm.website) || null,
      };

      const { error: updateError } = await supabase
        .from('profiles')
        .update(updates)
        .eq('id', user.id);

      if (updateError) throw updateError;

      setProfile((current) =>
        current
          ? {
            ...current,
            ...updates,
          }
          : {
            id: user.id,
            avatar_url: null,
            ...updates,
          }
      );

      setProfileMessage('Profile updated.');
      setIsEditingProfile(false);
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : 'Something went wrong updating your profile.';

      setProfileMessage(message);
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleAvatarUpload = async (
    event: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = event.target.files?.[0];

    if (!file) return;

    setIsUploadingAvatar(true);
    setAvatarMessage('');
    setProfileMessage('');

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
    <div className="space-y-6 pb-20">
      <section className="bg-brand-black border border-white/10 rounded-3xl p-5 md:p-6">
        <div className="flex flex-col md:flex-row items-center md:items-start gap-4 md:gap-6 text-center md:text-left">
          <div className="relative w-24 h-24 md:w-32 md:h-32 rounded-full border-2 border-white/20 overflow-hidden flex-shrink-0 bg-brand-gray shadow-lg">
            <div className="absolute bottom-0 left-1/2 -translate-x-1/2 px-2 py-1 bg-black/70 backdrop-blur-md text-[8px] uppercase tracking-widest font-black text-white rounded-full border border-white/10">
              {role}
            </div> <img
              src={avatarUrl}
              alt={displayName}
              className="w-full h-full object-cover"
              draggable={false}
              onError={(event) => {
                event.currentTarget.src = getFallbackAvatar(profile?.id);
              }}
            />

            {isUploadingAvatar && (
              <div className="absolute inset-0 bg-black/70 flex items-center justify-center">
                <Loader2 size={20} className="animate-spin text-white" />
              </div>
            )}
          </div>

          <div className="flex-1 w-full">
            <div className="grid grid-cols-3 gap-2 md:gap-4 text-center mt-4">
              <div>
                <p className="text-xl md:text-3xl font-black text-white">
                  {stats.framesUploaded}
                </p>
                <p className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">
                  Frames
                </p>
              </div>

              <div>
                <p className="text-xl md:text-3xl font-black text-white">
                  {stats.reviewsReceived}
                </p>
                <p className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">
                  Received
                </p>
              </div>

              <div>
                <p className="text-xl md:text-3xl font-black text-white">
                  {stats.reviewsGiven}
                </p>
                <p className="text-[9px] md:text-[11px] font-black uppercase tracking-[0.2em] text-gray-500">
                  Given
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-6 space-y-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-black tracking-tight text-white">
              {isLoadingProfile ? 'Loading...' : displayName}
            </h1>

            <div className="flex flex-wrap items-center gap-2 mt-2">
              <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-brand-accent">
                <Briefcase size={13} />
                {role}
              </span>

              {city && (
                <span className="inline-flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <MapPin size={13} />
                  {city}
                </span>
              )}
            </div>
          </div>

          <p className="text-sm text-gray-300 leading-relaxed max-w-xl mx-auto md:mx-0">
            {bio}
          </p>

          <div className="flex flex-wrap items-center gap-3">
            {cleanUsername && (
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
            )}

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

          {(avatarMessage || profileMessage) && (
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent">
              {avatarMessage || profileMessage}
            </p>
          )}

          {isOwnProfile && (
            <div className="grid grid-cols-1 gap-3 pt-2">
              <button
                type="button"
                onClick={() => {
                  setIsEditingProfile((current) => !current);
                  syncEditForm(profile);
                  setProfileMessage('');
                  setAvatarMessage('');
                }}
                className="min-h-[46px] rounded-xl bg-brand-accent text-brand-black font-black uppercase text-[10px] tracking-widest flex items-center justify-center shadow-md hover:scale-[1.02] transition-all"
              >
                Edit Profile
              </button>
            </div>
          )}
        </div>
      </section>

      {isOwnProfile && isEditingProfile && (
        <motion.section
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-brand-gray border border-white/10 rounded-3xl p-5 md:p-6 space-y-5"
        >
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent mb-1">
                Edit Profile
              </p>
              <h2 className="text-xl md:text-2xl font-black uppercase tracking-tight">
                Update Your Info
              </h2>
            </div>

            <button
              type="button"
              onClick={() => setIsEditingProfile(false)}
              className="min-h-[40px] min-w-[40px] rounded-full bg-brand-black border border-white/10 flex items-center justify-center hover:bg-white/10"
              aria-label="Close edit profile"
            >
              <X size={17} />
            </button>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 p-4 rounded-2xl bg-brand-black border border-white/10">
            <div className="w-20 h-20 rounded-full overflow-hidden bg-brand-gray border border-white/10 flex-shrink-0">
              <img
                src={avatarUrl}
                alt={displayName}
                className="w-full h-full object-cover"
                draggable={false}
                onError={(event) => {
                  event.currentTarget.src = getFallbackAvatar(profile?.id);
                }}
              />
            </div>

            <div className="flex-1 text-center sm:text-left">
              <p className="text-xs font-black uppercase tracking-widest text-white mb-1">
                Profile Picture
              </p>
              <p className="text-xs text-gray-500 font-bold mb-3">
                Max 5MB. Square images work best.
              </p>

              <label className="inline-flex min-h-[42px] px-4 rounded-2xl bg-brand-accent text-brand-black font-black uppercase text-[10px] tracking-widest items-center justify-center gap-2 cursor-pointer">
                {isUploadingAvatar ? (
                  <>
                    <Loader2 size={15} className="animate-spin" />
                    Uploading
                  </>
                ) : (
                  <>
                    <Upload size={15} />
                    Change Photo
                  </>
                )}

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                  disabled={isUploadingAvatar}
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Display Name
              </span>
              <input
                value={editForm.display_name}
                onChange={(event) =>
                  handleEditFormChange('display_name', event.target.value)
                }
                placeholder="Kevin Russell"
                className="w-full min-h-[46px] rounded-2xl bg-brand-black border border-white/10 px-4 text-sm text-white outline-none focus:border-brand-accent"
              />
            </label>

            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Username
              </span>
              <input
                value={editForm.username}
                onChange={(event) =>
                  handleEditFormChange('username', event.target.value)
                }
                placeholder="himoverthere"
                className="w-full min-h-[46px] rounded-2xl bg-brand-black border border-white/10 px-4 text-sm text-white outline-none focus:border-brand-accent"
              />
            </label>

            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Instagram Handle
              </span>
              <input
                value={editForm.instagram_handle}
                onChange={(event) =>
                  handleEditFormChange('instagram_handle', event.target.value)
                }
                placeholder="himoverthere"
                className="w-full min-h-[46px] rounded-2xl bg-brand-black border border-white/10 px-4 text-sm text-white outline-none focus:border-brand-accent"
              />
            </label>

            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Role
              </span>
              <select
                value={editForm.role}
                onChange={(event) =>
                  handleEditFormChange('role', event.target.value)
                }
                className="w-full min-h-[46px] rounded-2xl bg-brand-black border border-white/10 px-4 text-sm text-white outline-none focus:border-brand-accent"
              >
                <option value="">Choose role</option>
                <option value="Photographer">Photographer</option>
                <option value="Model">Model</option>
                <option value="MUA">MUA</option>
                <option value="Retoucher">Retoucher</option>
                <option value="Designer">Designer</option>
                <option value="Creative Director">Creative Director</option>
                <option value="Other">Other</option>
              </select>
            </label>

            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                City
              </span>
              <input
                value={editForm.city}
                onChange={(event) =>
                  handleEditFormChange('city', event.target.value)
                }
                placeholder="Chicago"
                className="w-full min-h-[46px] rounded-2xl bg-brand-black border border-white/10 px-4 text-sm text-white outline-none focus:border-brand-accent"
              />
            </label>

            <label className="space-y-2">
              <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                Website
              </span>
              <input
                value={editForm.website}
                onChange={(event) =>
                  handleEditFormChange('website', event.target.value)
                }
                placeholder="https://yourwebsite.com"
                className="w-full min-h-[46px] rounded-2xl bg-brand-black border border-white/10 px-4 text-sm text-white outline-none focus:border-brand-accent"
              />
            </label>
          </div>

          <label className="space-y-2 block">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
              Bio
            </span>
            <textarea
              value={editForm.bio}
              onChange={(event) =>
                handleEditFormChange('bio', event.target.value)
              }
              placeholder="Tell the community who you are and what kind of work you create."
              rows={4}
              className="w-full rounded-2xl bg-brand-black border border-white/10 px-4 py-3 text-sm text-white outline-none focus:border-brand-accent resize-none"
            />
          </label>

          {profileMessage && (
            <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent">
              {profileMessage}
            </p>
          )}

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button
              type="button"
              onClick={handleSaveProfile}
              disabled={isSavingProfile}
              className="min-h-[52px] bg-brand-accent text-brand-black rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 disabled:opacity-60"
            >
              {isSavingProfile ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  Saving
                </>
              ) : (
                <>
                  <Save size={16} />
                  Save Profile
                </>
              )}
            </button>

            <button
              type="button"
              onClick={() => {
                syncEditForm(profile);
                setIsEditingProfile(false);
              }}
              className="min-h-[52px] bg-brand-black border border-white/10 text-gray-300 rounded-2xl font-black uppercase text-xs tracking-widest flex items-center justify-center gap-2 hover:text-white"
            >
              Cancel
            </button>
          </div>
        </motion.section>
      )}

      <section className="border-b border-white/10">
        <div className="grid grid-cols-2">
          <button
            type="button"
            onClick={() => setActiveTab('frames')}
            className={`min-h-[54px] flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'frames'
              ? 'border-brand-accent text-brand-accent'
              : 'border-transparent text-gray-500 hover:text-white'
              }`}
          >
            <Grid size={15} />
            Frames
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('critiques')}
            className={`min-h-[54px] flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest border-b-2 transition-all ${activeTab === 'critiques'
              ? 'border-brand-accent text-brand-accent'
              : 'border-transparent text-gray-500 hover:text-white'
              }`}
          >
            <History size={15} />
            Critiques
          </button>
        </div>
      </section>

      {activeTab === 'frames' ? (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid grid-cols-3 gap-1 md:gap-3"
        >
          {isLoadingProfile ? (
            <div className="col-span-3 bg-brand-gray border border-white/10 rounded-3xl p-8 text-center">
              <Loader2
                size={22}
                className="animate-spin text-brand-accent mx-auto mb-3"
              />
              <p className="text-xs font-black uppercase tracking-widest text-gray-500">
                Loading frames
              </p>
            </div>
          ) : profilePhotos.length > 0 ? (
            profilePhotos.map((photo) => {
              const isExplicit = photo.content_rating === 'Explicit';
              const imageUrl =
                photo.watermarked_url ||
                photo.image_url ||
                getFallbackPhoto(photo.id);

              return (
                <Link
                  key={photo.id}
                  to={`/photo/${photo.id}`}
                  className="aspect-square overflow-hidden relative group cursor-pointer border border-white/5 bg-brand-gray block"
                >
                  <img
                    src={imageUrl}
                    alt={photo.caption || 'Creative Review photo'}
                    className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${isExplicit ? 'blur-md scale-110' : ''
                      }`}
                    draggable={false}
                    onContextMenu={(event) => event.preventDefault()}
                    onError={(event) => {
                      event.currentTarget.src = getFallbackPhoto(photo.id);
                    }}
                  />

                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />

                  <div className="absolute bottom-2 left-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                    <p className="text-[8px] font-black text-brand-accent uppercase">
                      {photo.review_count || 0} reviews
                    </p>

                    <p className="text-[9px] font-bold uppercase line-clamp-1">
                      {getRatingLabel(photo.content_rating)}
                    </p>
                  </div>
                </Link>
              );
            })
          ) : (
            <div className="col-span-3 bg-brand-gray border border-white/10 rounded-3xl p-8 text-center">
              <div className="w-14 h-14 rounded-2xl bg-brand-black border border-white/10 flex items-center justify-center mx-auto mb-4">
                <ImageOff size={22} className="text-brand-accent" />
              </div>

              <p className="text-sm font-black uppercase tracking-widest text-white mb-2">
                No frames yet
              </p>

              <p className="text-xs text-gray-500 font-bold max-w-sm mx-auto mb-5">
                Upload your first image so the community can start giving honest
                critique.
              </p>

              <Link
                to="/submit"
                className="inline-flex min-h-[44px] px-5 bg-brand-accent text-brand-black rounded-2xl font-black uppercase text-[10px] tracking-widest items-center justify-center gap-2"
              >
                <Camera size={15} />
                Submit A Frame
              </Link>
            </div>
          )}
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          {critiqueItems.length > 0 ? (
            critiqueItems.map((critique, index) => (
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
                    onError={(event) => {
                      event.currentTarget.src = getFallbackPhoto(
                        critique.photoId
                      );
                    }}
                  />
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-[10px] font-black uppercase tracking-widest text-gray-500 mb-1">
                    Critique Activity #{index + 1}
                  </p>

                  <p className="text-sm text-gray-300 leading-relaxed line-clamp-2">
                    {critique.text}
                  </p>

                  <p className="text-[10px] font-black uppercase tracking-widest text-brand-accent mt-2 flex items-center gap-1">
                    View image <ArrowRight size={12} />
                  </p>
                </div>
              </Link>
            ))
          ) : (
            <div className="bg-brand-gray border border-white/10 rounded-3xl p-8 text-center">
              <p className="text-sm font-black uppercase tracking-widest text-white mb-2">
                No critique history yet
              </p>

              <p className="text-xs text-gray-500 font-bold max-w-sm mx-auto mb-5">
                Once you start giving or receiving critiques, this section will
                fill up.
              </p>

              <Link
                to="/feed"
                className="inline-flex min-h-[44px] px-5 bg-brand-accent text-brand-black rounded-2xl font-black uppercase text-[10px] tracking-widest items-center justify-center gap-2"
              >
                Browse Feed
                <ArrowRight size={15} />
              </Link>
            </div>
          )}
        </motion.div>
      )}
    </div>
  );
}