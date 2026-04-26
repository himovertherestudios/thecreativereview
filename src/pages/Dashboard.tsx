import React, { useEffect, useState } from 'react';
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
import { Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';

type CardProps = {
  title: string;
  icon: React.ElementType;
  children: React.ReactNode;
  className?: string;
};

type PhotoBackground = {
  id: string;
  image_url: string;
  watermarked_url: string | null;
};

type RecentActivityItem = {
  id: string;
  title: string;
  imageUrl: string;
  createdAt: string;
  reviewCount: number;
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
  is_anonymous: boolean;
  created_at: string;
};

type WeeklyChallenge = {
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

function Card({ title, icon: Icon, children, className = '' }: CardProps) {
  return (
    <motion.section
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-brand-gray border border-white/10 rounded-3xl p-5 md:p-6 flex flex-col min-h-[320px] ${className}`}
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
      className="snap-start shrink-0 w-[86vw] max-w-[380px] bg-brand-gray border border-white/10 rounded-3xl p-4 flex flex-col min-h-[420px] shadow-2xl shadow-black/20"
    >
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-[10px] font-black tracking-widest text-gray-400 uppercase flex items-center gap-2">
          <Icon size={15} className="text-brand-accent" />
          {title}
        </h3>
      </div>

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

function pickDailyPhoto(photos: PhotoBackground[]) {
  if (photos.length === 0) return null;

  const today = new Date();
  const seed =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();

  return photos[seed % photos.length];
}

function pickDailyTip(tips: DailyTip[]) {
  if (tips.length === 0) return null;

  const today = new Date();
  const seed =
    today.getFullYear() * 10000 +
    (today.getMonth() + 1) * 100 +
    today.getDate();

  return tips[seed % tips.length];
}

function pickRandomPhoto(photos: PhotoBackground[]) {
  if (photos.length === 0) return null;
  return photos[Math.floor(Math.random() * photos.length)];
}

export default function Dashboard() {
  const [hotSeat, setHotSeat] = useState<HotSeatItem | null>(null);
  const [hotSeatLoading, setHotSeatLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState<RecentActivityItem[]>(
    []
  );
  const [recentActivityLoading, setRecentActivityLoading] = useState(true);
  const [tipBg, setTipBg] = useState(FALLBACK_TIP_BG);
  const [ventBg, setVentBg] = useState(FALLBACK_VENT_BG);
  const [dailyTip, setDailyTip] = useState(FALLBACK_TIP);
  const [weeklyChallenge, setWeeklyChallenge] =
    useState<WeeklyChallenge | null>(null);
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
      if (error) {
        console.error('Error loading Hot Seat:', error.message);
      }

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

  const loadRecentActivity = async () => {
    setRecentActivityLoading(true);

    const { data, error } = await supabase
      .from('photos')
      .select('id, caption, image_url, watermarked_url, created_at, review_count')
      .or('is_hidden.is.null,is_hidden.eq.false')
      .order('created_at', { ascending: false })
      .limit(5);

    if (error) {
      console.error('Error loading recent activity:', error.message);
      setRecentActivity([]);
      setRecentActivityLoading(false);
      return;
    }

    const mappedActivity: RecentActivityItem[] =
      data?.map((photo) => {
        const liveImageUrl = getPublicPhotoUrl(
          photo.watermarked_url || photo.image_url
        );

        return {
          id: photo.id,
          title: photo.caption || 'Untitled Review Request',
          imageUrl: liveImageUrl || FALLBACK_ACTIVITY_IMAGE,
          createdAt: photo.created_at,
          reviewCount: photo.review_count || 0,
        };
      }) || [];

    setRecentActivity(mappedActivity);
    setRecentActivityLoading(false);
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
    loadRecentActivity();

    const loadRandomBackgrounds = async () => {
      const { data, error } = await supabase
        .from('photos')
        .select('id, image_url, watermarked_url')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(50);

      if (error || !data || data.length === 0) {
        setTipBg(FALLBACK_TIP_BG);
        setVentBg(FALLBACK_VENT_BG);
        return;
      }

      const photos = data as PhotoBackground[];

      const validPhotos = photos.filter(
        (photo) => photo.watermarked_url || photo.image_url
      );

      const dailyPhoto = pickDailyPhoto(validPhotos);
      const randomPhoto = pickRandomPhoto(validPhotos);

      const dailyUrl = getPublicPhotoUrl(
        dailyPhoto?.watermarked_url || dailyPhoto?.image_url
      );

      const randomUrl = getPublicPhotoUrl(
        randomPhoto?.watermarked_url || randomPhoto?.image_url
      );

      setTipBg(dailyUrl || FALLBACK_TIP_BG);
      setVentBg(randomUrl || FALLBACK_VENT_BG);
    };

    loadRandomBackgrounds();
  }, []);

  useEffect(() => {
    const loadDailyTip = async () => {
      const { data, error } = await supabase
        .from('tips')
        .select('id, content, is_anonymous, created_at')
        .eq('is_approved', true)
        .order('created_at', { ascending: false })
        .limit(100);

      if (error || !data || data.length === 0) {
        setDailyTip(FALLBACK_TIP);
        return;
      }

      const selectedTip = pickDailyTip(data as DailyTip[]);

      setDailyTip(selectedTip?.content || FALLBACK_TIP);
    };

    loadDailyTip();
  }, []);

  useEffect(() => {
    const loadWeeklyChallenge = async () => {
      const { data, error } = await supabase
        .from('challenge_suggestions')
        .select('id, title, description, is_anonymous, created_at')
        .eq('is_approved', true)
        .eq('is_selected', true)
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();

      if (error || !data) {
        setWeeklyChallenge(null);
        return;
      }

      setWeeklyChallenge(data as WeeklyChallenge);
    };

    loadWeeklyChallenge();
  }, []);

  const tipCard = (
    <BackgroundFeatureCard
      eyebrow="Tip of the Day"
      title={dailyTip}
      body="A daily creative note pulled from approved community submissions."
      backgroundUrl={tipBg}
      fallbackUrl={FALLBACK_TIP_BG}
    />
  );

  const ventCard = (
    <BackgroundFeatureCard
      eyebrow="Vent Room"
      title="Can we stop asking models to “do something” without giving any direction?"
      backgroundUrl={ventBg}
      fallbackUrl={FALLBACK_VENT_BG}
      button={
        <Link
          to="/vents"
          className="min-h-[46px] px-4 py-3 bg-brand-accent text-brand-black rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-white transition-all"
        >
          Join the chaos <ArrowRight size={14} />
        </Link>
      }
    />
  );

  const hotSeatCard = (
    <div className="flex flex-col h-full">
      {hotSeatLoading ? (
        <div className="flex-1 rounded-2xl border border-white/10 bg-white/5 p-5 text-sm text-gray-400 flex items-center justify-center text-center">
          Loading the Hot Seat...
        </div>
      ) : !hotSeat ? (
        <BetaEmptyState
          icon={Flame}
          title="No Hot Seat Yet"
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

  const challengeTitle = weeklyChallenge?.title || FALLBACK_CHALLENGE_TITLE;

  const challengeDescription =
    weeklyChallenge?.description || FALLBACK_CHALLENGE_DESCRIPTION;

  const challengeCard = (
    <div className="h-full flex flex-col justify-between rounded-3xl border border-brand-accent/20 bg-gradient-to-br from-brand-accent/15 via-brand-gray to-brand-black p-5 overflow-hidden relative">
      <div className="absolute -top-16 -right-16 w-40 h-40 rounded-full bg-brand-accent/10 blur-3xl" />
      <div className="absolute -bottom-20 -left-20 w-44 h-44 rounded-full bg-brand-critique/10 blur-3xl" />

      <div className="relative z-10">
        <p className="text-[10px] font-black uppercase tracking-[0.25em] text-brand-accent mb-3">
          Weekly Prompt
        </p>

        <h4 className="text-4xl font-black tracking-tighter uppercase leading-none mb-4">
          {challengeTitle}
        </h4>

        <p className="text-sm font-medium text-gray-300 leading-relaxed">
          {challengeDescription}
        </p>
      </div>

      <div className="relative z-10 mt-6 grid gap-3">
        <Link
          to="/submit"
          className="min-h-[46px] px-4 py-3 bg-white text-brand-black rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-accent transition-all"
        >
          Take the challenge <ArrowRight size={14} />
        </Link>

        <Link
          to="/challenge-suggestion"
          className="min-h-[42px] px-4 py-3 bg-brand-black/60 border border-white/10 text-gray-400 rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:text-white hover:border-brand-accent/40 transition-all"
        >
          Suggest one
        </Link>
      </div>
    </div>
  );

  const recentActivityCard = (
    <div className="space-y-3">
      {recentActivityLoading ? (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 text-sm text-gray-400">
          Loading recent activity...
        </div>
      ) : recentActivity.length === 0 ? (
        <BetaEmptyState
          icon={HelpCircle}
          title="No Activity Yet"
          body="Recent uploads and critique requests will appear here once beta members start posting."
          action={
            <Link
              to="/submit"
              className="min-h-[42px] px-4 py-3 bg-white text-brand-black rounded-2xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 hover:bg-brand-accent transition-all"
            >
              Start the feed <ArrowRight size={14} />
            </Link>
          }
        />
      ) : (
        recentActivity.map((item) => (
          <Link
            key={item.id}
            to={`/photo/${item.id}`}
            className="min-h-[64px] flex items-center gap-3 p-3 rounded-2xl bg-brand-black/50 border border-white/5 hover:border-brand-accent/40 transition-all group"
          >
            <div className="w-12 aspect-[4/5] rounded-xl overflow-hidden flex-shrink-0 bg-brand-black">
              <img
                src={item.imageUrl}
                alt={item.title}
                className="w-full h-full object-cover"
                draggable={false}
                onContextMenu={(event) => event.preventDefault()}
                onError={(event) => {
                  event.currentTarget.src = FALLBACK_ACTIVITY_IMAGE;
                }}
              />
            </div>

            <div className="flex-1 min-w-0">
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest leading-none mb-1">
                {item.reviewCount} critique
                {item.reviewCount === 1 ? '' : 's'}
              </p>

              <p className="text-xs font-bold truncate uppercase">
                {item.title}
              </p>
            </div>

            <ArrowRight
              size={16}
              className="text-gray-600 group-hover:text-brand-accent flex-shrink-0"
            />
          </Link>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6 md:space-y-8 pb-6">
      <div className="md:hidden space-y-4">
        <div className="-mx-4 px-4 overflow-x-auto snap-x snap-mandatory flex gap-4 pb-5 scroll-smooth overscroll-x-contain no-scrollbar touch-pan-x">
          <SwipeCard title="Tip of the Day" icon={Zap}>
            {tipCard}
          </SwipeCard>

          <SwipeCard title="Vent Room" icon={MessageSquare}>
            {ventCard}
          </SwipeCard>

          <SwipeCard title="Hot Seat" icon={Flame}>
            {hotSeatCard}
          </SwipeCard>

          <SwipeCard title="Challenge" icon={TrendingUp}>
            {challengeCard}
          </SwipeCard>

          <SwipeCard title="Recent Activity" icon={HelpCircle}>
            {recentActivityCard}
          </SwipeCard>
        </div>
      </div>

      <div className="hidden md:grid grid-cols-1 md:grid-cols-3 gap-5 md:gap-6">
        <Card title="Tip of the Day" icon={Zap} className="md:col-span-2">
          {tipCard}
        </Card>

        <Card title="Vent Room" icon={MessageSquare}>
          {ventCard}
        </Card>

        <Card title="Hot Seat" icon={Flame} className="md:row-span-2">
          {hotSeatCard}
        </Card>

        <Card title="Challenge of the Week" icon={TrendingUp}>
          {challengeCard}
        </Card>

        <Card title="Recent Activity" icon={HelpCircle}>
          {recentActivityCard}
        </Card>
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