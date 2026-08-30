import { supabase } from './supabase';

export type TipDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'everybody';
export type TipContentType = 'tip' | 'challenge' | 'conversation' | 'exercise';
export type TipCtaType = 'none' | 'upload' | 'challenge' | 'corner' | 'profile' | 'external';
export type TipView = 'all' | 'saved' | 'featured' | 'challenges';
export type TipSort = 'recommended' | 'az' | 'day';

export type TipSubject = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
};

export type TipSubjectWithCount = TipSubject & { count: number };

export type TipCard = {
  id: string;
  title: string;
  lessonPreview: string;
  category: string | null;
  difficulty: TipDifficulty;
  contentType: TipContentType;
  dayNumber: number | null;
  isFeatured: boolean;
  imageUrl: string | null;
  subjects: { slug: string; name: string }[];
};

export type TipDetail = TipCard & {
  content: string;
  lesson: string | null;
  takeaway: string | null;
  tryThis: string | null;
  ctaLabel: string | null;
  ctaType: TipCtaType;
  ctaTarget: string | null;
  challengeId: string | null;
  cornerPostId: string | null;
};

export type TipProgress = {
  id: string;
  tipId: string;
  saved: boolean;
  viewedAt: string | null;
  completedAt: string | null;
};

export type TipFilters = {
  subjectSlug?: string | null;
  view?: TipView;
  difficulty?: TipDifficulty | null;
  search?: string;
  sort?: TipSort;
  page?: number;
  pageSize?: number;
};

type SubjectJoinRow = { tip_subjects: { slug: string; name: string } | null };

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapSubjects(raw: any): { slug: string; name: string }[] {
  if (!raw) return [];

  return (raw as SubjectJoinRow[])
    .map((row) => row.tip_subjects)
    .filter((s): s is { slug: string; name: string } => Boolean(s));
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTipCard(row: any): TipCard {
  return {
    id: row.id,
    title: row.title || row.content || 'Untitled lesson',
    lessonPreview: row.content || '',
    category: row.category,
    difficulty: (row.difficulty || 'everybody') as TipDifficulty,
    contentType: (row.content_type || 'tip') as TipContentType,
    dayNumber: row.day_number,
    isFeatured: Boolean(row.is_featured),
    imageUrl: row.image_url,
    subjects: mapSubjects(row.tip_subject_map),
  };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function mapTipDetail(row: any): TipDetail {
  return {
    ...mapTipCard(row),
    content: row.content,
    lesson: row.lesson,
    takeaway: row.takeaway,
    tryThis: row.try_this,
    ctaLabel: row.cta_label,
    ctaType: (row.cta_type || 'none') as TipCtaType,
    ctaTarget: row.cta_target,
    challengeId: row.challenge_id,
    cornerPostId: row.corner_post_id,
  };
}

const CARD_SELECT_BASE =
  'id, title, content, category, difficulty, content_type, day_number, is_featured, image_url';

const DETAIL_SELECT =
  'id, title, content, lesson, takeaway, try_this, category, difficulty, content_type, day_number, ' +
  'is_featured, image_url, cta_label, cta_type, cta_target, challenge_id, corner_post_id, ' +
  'tip_subject_map ( tip_subjects ( slug, name ) )';

export async function fetchTipSubjects(): Promise<TipSubject[]> {
  const { data, error } = await supabase
    .from('tip_subjects')
    .select('id, slug, name, description, sort_order')
    .eq('is_active', true)
    .order('sort_order', { ascending: true });

  if (error) throw error;

  return (data || []).map((row) => ({
    id: row.id,
    slug: row.slug,
    name: row.name,
    description: row.description,
    sortOrder: row.sort_order,
  }));
}

// Subject -> approved/active tip counts. One lightweight query over the
// join table rather than 12 separate count queries.
export async function fetchTipSubjectCounts(): Promise<Record<string, number>> {
  const { data, error } = await supabase
    .from('tip_subject_map')
    .select('subject_id, tips!inner(is_approved,is_active)')
    .eq('tips.is_approved', true)
    .eq('tips.is_active', true);

  if (error) throw error;

  const counts: Record<string, number> = {};

  for (const row of data || []) {
    counts[row.subject_id] = (counts[row.subject_id] || 0) + 1;
  }

  return counts;
}

const DEFAULT_PAGE_SIZE = 24;

export async function fetchTips(
  filters: TipFilters,
  subjectIdBySlug?: Record<string, string>
): Promise<{ items: TipCard[]; total: number }> {
  const {
    subjectSlug,
    view = 'all',
    difficulty,
    search,
    sort = 'recommended',
    page = 1,
    pageSize = DEFAULT_PAGE_SIZE,
  } = filters;

  let query = supabase
    .from('tips')
    .select(
      subjectSlug
        ? `${CARD_SELECT_BASE}, tip_subject_map!inner ( subject_id, tip_subjects ( slug, name ) )`
        : `${CARD_SELECT_BASE}, tip_subject_map ( tip_subjects ( slug, name ) )`,
      { count: 'exact' }
    )
    .eq('is_active', true);

  if (subjectSlug && subjectIdBySlug?.[subjectSlug]) {
    query = query.eq('tip_subject_map.subject_id', subjectIdBySlug[subjectSlug]);
  }

  if (view === 'featured') {
    query = query.eq('is_featured', true);
  } else if (view === 'challenges') {
    query = query.eq('content_type', 'challenge');
  }

  if (difficulty) {
    query = query.eq('difficulty', difficulty);
  }

  if (search && search.trim().length > 0) {
    query = query.textSearch('search_text', search.trim(), {
      type: 'websearch',
      config: 'english',
    });
  }

  if (sort === 'az') {
    query = query.order('title', { ascending: true, nullsFirst: false });
  } else if (sort === 'day') {
    query = query.order('day_number', { ascending: true, nullsFirst: false });
  } else {
    query = query
      .order('is_featured', { ascending: false })
      .order('upvotes_count', { ascending: false })
      .order('created_at', { ascending: false });
  }

  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;
  query = query.range(from, to);

  const { data, error, count } = await query;

  if (error) throw error;

  return {
    items: (data || []).map(mapTipCard),
    total: count || 0,
  };
}

export async function fetchTipsByIds(ids: string[]): Promise<TipCard[]> {
  if (ids.length === 0) return [];

  const { data, error } = await supabase
    .from('tips')
    .select(`${CARD_SELECT_BASE}, tip_subject_map ( tip_subjects ( slug, name ) )`)
    .in('id', ids)
    .eq('is_active', true);

  if (error) throw error;

  return (data || []).map(mapTipCard);
}

export async function fetchTipById(id: string): Promise<TipDetail | null> {
  const { data, error } = await supabase
    .from('tips')
    .select(DETAIL_SELECT)
    .eq('id', id)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapTipDetail(data);
}

function mapProgressRow(row: {
  id: string;
  tip_id: string;
  saved: boolean;
  viewed_at: string | null;
  completed_at: string | null;
}): TipProgress {
  return {
    id: row.id,
    tipId: row.tip_id,
    saved: row.saved,
    viewedAt: row.viewed_at,
    completedAt: row.completed_at,
  };
}

export async function fetchTipProgress(
  userId: string,
  tipId: string
): Promise<TipProgress | null> {
  const { data, error } = await supabase
    .from('tip_progress')
    .select('id, tip_id, saved, viewed_at, completed_at')
    .eq('user_id', userId)
    .eq('tip_id', tipId)
    .maybeSingle();

  if (error) throw error;
  if (!data) return null;

  return mapProgressRow(data);
}

export async function fetchAllTipProgress(userId: string): Promise<TipProgress[]> {
  const { data, error } = await supabase
    .from('tip_progress')
    .select('id, tip_id, saved, viewed_at, completed_at')
    .eq('user_id', userId);

  if (error) throw error;

  return (data || []).map(mapProgressRow);
}

export async function fetchSavedTipIds(userId: string): Promise<string[]> {
  const { data, error } = await supabase
    .from('tip_progress')
    .select('tip_id')
    .eq('user_id', userId)
    .eq('saved', true);

  if (error) throw error;

  return (data || []).map((row) => row.tip_id);
}

// Upserts on the (user_id, tip_id) unique index. Never clobbers fields the
// caller doesn't pass — reads the existing row first so e.g. saving a tip
// doesn't wipe out an existing completed_at.
export async function recordTipView(userId: string, tipId: string): Promise<void> {
  const existing = await fetchTipProgress(userId, tipId);

  const { error } = await supabase.from('tip_progress').upsert(
    {
      user_id: userId,
      tip_id: tipId,
      viewed_at: new Date().toISOString(),
      saved: existing?.saved ?? false,
      completed_at: existing?.completedAt ?? null,
    },
    { onConflict: 'user_id,tip_id' }
  );

  if (error) throw error;
}

export async function setTipSaved(
  userId: string,
  tipId: string,
  saved: boolean
): Promise<void> {
  const existing = await fetchTipProgress(userId, tipId);

  const { error } = await supabase.from('tip_progress').upsert(
    {
      user_id: userId,
      tip_id: tipId,
      saved,
      viewed_at: existing?.viewedAt ?? new Date().toISOString(),
      completed_at: existing?.completedAt ?? null,
    },
    { onConflict: 'user_id,tip_id' }
  );

  if (error) throw error;
}

export async function setTipCompleted(
  userId: string,
  tipId: string,
  completed: boolean
): Promise<void> {
  const existing = await fetchTipProgress(userId, tipId);

  const { error } = await supabase.from('tip_progress').upsert(
    {
      user_id: userId,
      tip_id: tipId,
      completed_at: completed ? new Date().toISOString() : null,
      saved: existing?.saved ?? false,
      viewed_at: existing?.viewedAt ?? new Date().toISOString(),
    },
    { onConflict: 'user_id,tip_id' }
  );

  if (error) throw error;
}
