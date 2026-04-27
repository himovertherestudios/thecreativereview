import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { Flame, ArrowRight, ShieldOff } from 'lucide-react';
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type CardProps = {
  children: React.ReactNode;
  className?: string;
};

type PhotoBackground = {
  id: string;
  image_url: string;
  watermarked_url: string | null;
};

type HotSeatItem = {
  id: string;
  imageUrl: string;
  caption: string;
  contentRating: string;
  creatorRole: string;
  reviewCount: number;
};

type DailyTip = {
  id: string;
  content: string;
  category: string | null;
  is_anonymous: boolean;
  created_at: string;
};

type MonthlyChallenge = {
  id: string;
  title: string;
  description: string;
  is_anonymous: boolean;
  created_at: string;
};

type SupabaseProfile = {
  role: string | null;
};

type SupabaseHotSeatRow = {
  id: string;
  image_url: string | null;
  watermarked_url: string | null;
  caption: string | null;
  content_rating: string | null;
  review_count: number | null;
  created_at: string;
  profiles: SupabaseProfile | SupabaseProfile[] | null;
};

const FALLBACK_TIP_BG =
  'https://images.unsplash.com/photo-1516035069371-29a1b244cc32?auto=format&fit=crop&w=1200&q=80';

const FALLBACK_CHALLENGE_BG =
  'https://images.unsplash.com/photo-1500530855697-b586d89ba3ee?auto=format&fit=crop&w=1200&q=80';

const FALLBACK_VENT_BG =
  'https://images.unsplash.com/photo-1493246507139-91e8fad9978e?auto=format&fit=crop&w=1200&q=80';

const FALLBACK_TIP =
  'Before you ask for critique, ask yourself what you actually want feedback on — lighting, posing, editing, styling, or emotion.';

const FALLBACK_CHALLENGE_TITLE = 'No Colors';

const FALLBACK_CHALLENGE_DESCRIPTION =
  'Submit one black-and-white edit only. Make the mood, contrast, and story do the work.';

const FALLBACK_ACTIVITY_IMAGE =
  'https://picsum.photos/seed/creative-review-fallback/800/1000';

function isFullUrl(value: string | null | undefined) {
  if (!value) return false;

  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('blob:') ||
    value.startsWith('data:')
  );
}

function getPublicPhotoUrl(value: string | null | undefined) {
  if (!value) return '';

  if (isFullUrl(value)) return value;

  const cleanPath = value
    .trim()
    .replace(/^\/+/, '')
    .replace(/^photos\//, '')
    .replace(/^public\//, '');

  if (!cleanPath) return '';

  const { data } = supabase.storage.from('photos').getPublicUrl(cleanPath);

  return data.publicUrl || '';
}

function getProfileRole(profileData: SupabaseHotSeatRow['profiles']) {
  if (!profileData) return 'Creative';

  if (Array.isArray(profileData)) {
    return profileData[0]?.role || 'Creative';
  }

  return profileData.role || 'Creative';
}

function Card({ children, className = '' }: CardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-brand-gray border border-white/10 rounded-3xl p-5 md:p-6 flex flex-col min-h-[320px] ${className}`}
    >
      <div className="flex-1">{children}</div>
    </motion.section>
  );
}

function SwipeCard({ children }: CardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="snap-start shrink-0 w-[86vw] max-w-[380px] bg-brand-gray border border-white/10 rounded-3xl p-4 flex flex-col min-h-[420px] shadow-2xl shadow-black/20"
    >
      <div className="flex-1 min-h-0">{children}</div>
    </motion.section>
  );
}

function BetaEmptyState({
  icon: Icon,
  title,
  body,
  action,
}: {
  icon: React.ElementType;
  title: string;
  body: string;
  action?: React.ReactNode;
}) {
  return (
    <div className="h-full min-h-[220px] rounded-3xl border border-white/10 bg-white/[0.03] p-5 flex flex-col items-center justify-center text-center relative overflow-hidden">
      <div className="absolute -top-16 -right-16 w-36 h-36 rounded-full bg-brand-accent/10 blur-3xl" />
      <div className="absolute -bottom-16 -left-16 w-36 h-36 rounded-full bg-brand-critique/10 blur-3xl" />

      <div className="relative z-10 w-12 h-12 rounded-2xl bg-brand-accent/10 border border-brand-accent/20 flex items-center justify-center mb-4">
        <Icon size={24} className="text-brand-accent" />
      </div>

      <p className="relative z-10 text-[10px] font-black uppercase tracking-[0.25em] text-gray-500 mb-2">
        Beta Empty State
      </p>

      <h4 className="relative z-10 text-xl font-black uppercase tracking-tight text-white mb-3">
        {title}
      </h4>

      <p className="relative z-10 text-sm text-gray-400 leading-relaxed max-w-xs">
        {body}
      </p>

      {action && <div className="relative z-10 mt-5">{action}</div>}
    </div>
  );
}

function BackgroundFeatureCard({
  eyebrow,
  title,
  body,
  button,
  backgroundUrl,
  fallbackUrl,
}: {
  eyebrow: string;
  title: string;
  body?: string;
  button?: React.ReactNode;
  backgroundUrl: string;
  fallbackUrl: string;
}) {
  const [currentBackground, setCurrentBackground] = useState(backgroundUrl);

  useEffect(() => {
    setCurrentBackground(backgroundUrl || fallbackUrl);
  }, [backgroundUrl, fallbackUrl]);

  return (
    <div
      className="relative h-full min-h-[280px] overflow-hidden rounded-3xl border border-white/10 bg-brand-black bg-cover bg-center"
      style={{ backgroundImage: `url(${currentBackground})` }}
    >
      <img
        src={currentBackground}
        alt=""
        className="hidden"
        onError={() => setCurrentBackground(fallbackUrl)}
      />

      <div className="absolute inset-0 bg-gradient-to-t from-black via-black/70 to-black/20" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(255,255,255,0.12),transparent_35%)]" />

      <div className="relative z-10 h-full flex flex-col justify-between p-5">
        <div>
          <p className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-accent mb-3">
            {eyebrow}
          </p>

          <h3 className="text-2xl md:text-3xl font-black uppercase leading-none tracking-tight text-white drop-shadow">
            {title}
          </h3>

          {body && (
            <p className="text-sm text-gray-300 font-medium leading-relaxed mt-4 max-w-md">
              {body}
            </p>
          )}
        </div>

        {button && <div className="mt-6">{button}</div>}
      </div>
    </div>
  );
}

function getRatingLabel(contentRating: string) {
  if (contentRating === 'Explicit') return 'NSFW';
  return contentRating;
}

function getPhotoByOffset(photos: PhotoBackground[], offset: number) {
  if (photos.length === 0) return null;

  const today = new Date();
  const seed =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();

  return photos[(seed + offset) % photos.length];
}

const BETA_TIP_LAUNCH_DATE = new Date('2026-04-27T00:00:00');

function getBetaTipDayIndex(totalTips: number) {
  if (totalTips <= 0) return 0;

  const now = new Date();
  const todayMidnight = new Date(
    now.getFullYear(),
    now.getMonth(),
    now.getDate()
  );

  const launchMidnight = new Date(
    BETA_TIP_LAUNCH_DATE.getFullYear(),
    BETA_TIP_LAUNCH_DATE.getMonth(),
    BETA_TIP_LAUNCH_DATE.getDate()
  );

  const msPerDay = 1000 * 60 * 60 * 24;
  const dayDifference = Math.floor(
    (todayMidnight.getTime() - launchMidnight.getTime()) / msPerDay
  );

  return Math.max(0, Math.min(dayDifference, totalTips - 1));
}

function pickDailyTip(tips: DailyTip[]) {
  if (tips.length === 0) return null;

  const dayIndex = getBetaTipDayIndex(tips.length);

  return tips[dayIndex];
}

export default function Dashboard() {
  const [hotSeat, setHotSeat] = useState<HotSeatItem | null>(null);
  const [hotSeatLoading, setHotSeatLoading] = useState(true);
  const [tipBg, setTipBg] = useState(FALLBACK_TIP_BG);
  const [challengeBg, setChallengeBg] = useState(FALLBACK_CHALLENGE_BG);
  const [ventBg, setVentBg] = useState(FALLBACK_VENT_BG);
  const [dailyTip, setDailyTip] = useState(FALLBACK_TIP);
  const [dailyTipCategory, setDailyTipCategory] = useState('Shooting');
  const [monthlyChallenge, setMonthlyChallenge] =
    useState<MonthlyChallenge | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);

  const loadHotSeat = async () => {
    setHotSeatLoading(true);

    const { data, error } = await supabase
      .from('photos')
      .select(
        `
        id,
        image_url,
        watermarked_url,
        caption,
        content_rating,
        review_count,
        created_at,
        profiles (
          role
        )
      `
      )
      .or('is_hidden.is.null,is_hidden.eq.false')
      .order('review_count', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (error || !data) {
      if (error) console.error('Error loading Hot Seat:', error.message);

      setHotSeat(null);
      setHotSeatLoading(false);
      return;
    }

    const photo = data as unknown as SupabaseHotSeatRow;

    const liveImageUrl = getPublicPhotoUrl(
      photo.watermarked_url || photo.image_url
    );

    setHotSeat({
      id: photo.id,
      imageUrl: liveImageUrl || FALLBACK_ACTIVITY_IMAGE,
      caption: photo.caption || 'Untitled critique post',
      contentRating: photo.content_rating || 'Safe',
      creatorRole: getProfileRole(photo.profiles),
      reviewCount: photo.review_count || 0,
    });

    setHotSeatLoading(false);
  };

  useEffect(() => {
    const checkAdminStatus = async () => {
      const {
        data: { user },
        error: userError,
      } = await supabase.auth.getUser();

      if (userError || !user) {
        setIsAdmin(false);
        return;
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('is_admin')
        .eq('id', user.id)
        .maybeSingle();

      if (error || !data?.is_admin) {
        setIsAdmin(false);
        return;
      }

      setIsAdmin(true);
    };

    checkAdminStatus();
  }, []);

  useEffect(() => {
    loadHotSeat();

    const loadBackgrounds = async () => {
      const { data, error } = await supabase
        .from('photos')
        .select('id, image_url, watermarked_url')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error || !data || data.length === 0) {
        setTipBg(FALLBACK_TIP_BG);
        setChallengeBg(FALLBACK_CHALLENGE_BG);
        setVentBg(FALLBACK_VENT_BG);
        return;
      }

      const validPhotos = (data as PhotoBackground[]).filter(
        (photo) => photo.watermarked_url || photo.image_url
      );

      const tipPhoto = getPhotoByOffset(validPhotos, 0);
      const challengePhoto = getPhotoByOffset(validPhotos, 7);
      const ventPhoto = getPhotoByOffset(validPhotos, 14);

      const tipUrl = getPublicPhotoUrl(
        tipPhoto?.watermarked_url || tipPhoto?.image_url
      );

      const challengeUrl = getPublicPhotoUrl(
        challengePhoto?.watermarked_url || challengePhoto?.image_url
      );

      const ventUrl = getPublicPhotoUrl(
        ventPhoto?.watermarked_url || ventPhoto?.image_url
      );

      setTipBg(tipUrl || FALLBACK_TIP_BG);
      setChallengeBg(challengeUrl || FALLBACK_CHALLENGE_BG);
      setVentBg(ventUrl || FALLBACK_VENT_BG);
    };

    loadBackgrounds();
  }, []);

  useEffect(() => {
    const loadDailyTip = async () => {
      const { data, error } = await supabase
        .from('tips')
        .select('id, content, category, is_anonymous, created_at')
        .eq('is_approved', true)
        .order('created_at', { ascending: true })
        .limit(100);

      if (error || !data || data.length === 0) {
        setDailyTip(FALLBACK_TIP);
        setDailyTipCategory('Shooting');
        return;
      }

      const selectedTip = pickDailyTip(data as DailyTip[]);

      setDailyTip(selectedTip?.content || FALLBACK_TIP);
      setDailyTipCategory(selectedTip?.category || 'Shooting');
    };

    loadDailyTip();
  }, []);

  useEffect(() => {
    const loadMonthlyChallenge = async () => {
      const { data, error } = await supabase
        .from('challenge_suggestions')
        .select('id, title, description, is_anonymous, created_at')
        .eq('is_approved', true)
        .eq('is_selected', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        setMonthlyChallenge(null);
        return;
      }

      setMonthlyChallenge(data as MonthlyChallenge);
    };

    loadMonthlyChallenge();
  }, []);

  const tipCard = (
    <BackgroundFeatureCard
      eyebrow={`Daily Tips • ${dailyTipCategory}`}
      title={dailyTip}
      body="More tips unlocked daily. Explore previous tips in the archive."
      backgroundUrl={tipBg}
      fallbackUrl={FALLBACK_TIP_BG}
      button={
        <Link
          to="/tips"
          className="min-h-[46px] px-4 py-3 bg-brand-accent text-brand-black rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-all"
        >
          View tips archive <ArrowRight size={14} />
        </Link>
      }
    />
  );

  const challengeTitle =
    monthlyChallenge?.title || FALLBACK_CHALLENGE_TITLE;

  const challengeDescription =
    monthlyChallenge?.description || FALLBACK_CHALLENGE_DESCRIPTION;

  const challengeCard = (
    <BackgroundFeatureCard
      eyebrow="Monthly Challenge"
      title={challengeTitle}
      body={challengeDescription}
      backgroundUrl={challengeBg}
      fallbackUrl={FALLBACK_CHALLENGE_BG}
      button={
        <div className="grid gap-3">
          <Link
            to="/submit"
            className="min-h-[46px] px-4 py-3 bg-white text-brand-black rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-accent transition-all"
          >
            Take the challenge <ArrowRight size={14} />
          </Link>

          <Link
            to="/challenge-suggestion"
            className="min-h-[42px] px-4 py-3 bg-brand-black/60 border border-white/10 text-gray-300 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:text-white hover:border-brand-accent/40 transition-all"
          >
            Suggest one
          </Link>
        </div>
      }
    />
  );

  const ventCard = (
    <BackgroundFeatureCard
      eyebrow="Vent Session"
      title="Can we stop asking models to “do something” without giving any direction?"
      backgroundUrl={ventBg}
      fallbackUrl={FALLBACK_VENT_BG}
      button={
        <Link
          to="/vents"
          className="min-h-[46px] px-4 py-3 bg-brand-accent text-brand-black rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-all"
        >
          Get it off your chest <ArrowRight size={14} />
        </Link>
      }
    />
  );

  const hotSeatCard = (
    <div className="flex flex-col h-full">
      {hotSeatLoading ? (
        <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-gray-400 flex items-center justify-center text-center">
          Loading the Most Discussed...
        </div>
      ) : !hotSeat ? (
        <BetaEmptyState
          icon={Flame}
          title="No Most Discussed Yet"
          body="Once members start uploading review requests and getting critiques, the most discussed photo will show up here."
          action={
            <Link
              to="/submit"
              className="min-h-[42px] px-4 py-3 bg-brand-accent text-brand-black rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-all"
            >
              Submit first <ArrowRight size={14} />
            </Link>
          }
        />
      ) : (
        <>
          <Link
            to={`/photo/${hotSeat.id}`}
            className="relative aspect-[4/5] rounded-2xl overflow-hidden mb-4 group cursor-pointer block bg-brand-black"
          >
            {hotSeat.contentRating === 'Explicit' && (
              <div className="absolute inset-0 z-10 flex flex-col items-center justify-center bg-black/55 backdrop-blur-[24px] text-center p-5">
                <ShieldOff size={32} className="text-brand-critique mb-3" />

                <p className="text-[10px] font-black uppercase tracking-widest text-white">
                  NSFW Post
                </p>

                <p className="text-[10px] text-gray-400 mt-2">
                  Open to review with respect.
                </p>
              </div>
            )}

            <img
              src={hotSeat.imageUrl}
              alt="Most discussed review"
              className={`w-full h-full object-cover transition-transform group-hover:scale-105 ${hotSeat.contentRating === 'Explicit'
                  ? 'blur-2xl scale-105'
                  : ''
                }`}
              draggable={false}
              onContextMenu={(event) => event.preventDefault()}
              onError={(event) => {
                event.currentTarget.src = FALLBACK_ACTIVITY_IMAGE;
              }}
            />

            <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/10 to-transparent" />

            <div className="absolute top-4 left-4">
              <span className="px-2 py-1 rounded-full text-[8px] font-black uppercase tracking-widest bg-brand-accent/20 text-brand-accent border border-brand-accent/30">
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

              <p className="text-[10px] text-gray-400 mt-2">
                {hotSeat.reviewCount} critique
                {hotSeat.reviewCount === 1 ? '' : 's'}
              </p>
            </div>
          </Link>

          <Link
            to={`/photo/${hotSeat.id}`}
            className="w-full min-h-[48px] py-3 bg-white text-brand-black rounded-2xl text-[10px] font-black uppercase tracking-widest text-center hover:bg-brand-accent transition-colors flex items-center justify-center gap-2"
          >
            Drop a Review <ArrowRight size={14} />
          </Link>
        </>
      )}
    </div>
  );

  return (
    <div className="-mt-3 md:-mt-5 space-y-4 md:space-y-5 pb-6 overflow-x-hidden">
      <div className="md:hidden space-y-4">
        <div className="-mx-4 px-4 overflow-x-auto snap-x snap-mandatory flex gap-4 pb-5 scroll-smooth overscroll-x-contain no-scrollbar touch-pan-x">
          <SwipeCard>{tipCard}</SwipeCard>

          <SwipeCard>{challengeCard}</SwipeCard>

          <SwipeCard>{ventCard}</SwipeCard>

          <SwipeCard>{hotSeatCard}</SwipeCard>
        </div>
      </div>

      <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
        <Card>{tipCard}</Card>

        <Card>{challengeCard}</Card>

        <Card>{ventCard}</Card>

        <Card className="md:col-span-3">{hotSeatCard}</Card>
      </div>

      <div className="flex flex-col sm:flex-row items-center justify-center gap-3 pt-4">
        <Link
          to="/feed"
          className="min-h-[48px] px-6 py-3 rounded-2xl bg-brand-gray border border-white/10 flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-gray-400 hover:text-white hover:border-white/20 transition-all"
        >
          View full feed <ArrowRight size={14} />
        </Link>

        {isAdmin && (
          <Link
            to="/challenge-admin"
            className="min-h-[48px] px-6 py-3 rounded-2xl bg-brand-accent text-brand-black border border-brand-accent flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] hover:bg-white transition-all"
          >
            Manage challenges <ArrowRight size={14} />
          </Link>
        )}
      </div>
    </div>
  );
}