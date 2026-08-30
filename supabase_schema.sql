-- =====================================================================
-- The Creative Review — inferred Supabase schema
--
-- Reverse-engineered from src/ (no migrations existed in the repo).
-- DO NOT apply directly to a live database without human review — see
-- the "NOT CONFIDENT" notes inline and in the final report. Columns
-- typed as `text` may in some cases be better as enums/check
-- constraints; kept as text/boolean to match how the JS client treats
-- them (no server-side enum enforcement visible in app code).
-- =====================================================================

-- Needed for gen_random_uuid()
create extension if not exists pgcrypto;

-- =====================================================================
-- profiles
-- One row per auth.users id. Referenced everywhere as the FK target
-- for user_id columns. is_admin gates AnalyticsAdmin/ChallengeAdmin/
-- Dashboard admin links. avatar_url is public storage URL (avatars
-- bucket, path `${user.id}/avatar.<ext>`).
-- =====================================================================
create table if not exists public.profiles (
    id uuid primary key references auth.users (id) on delete cascade,
    display_name text,
    username text,
    instagram_handle text,
    website text,
    role text,
    custom_title text,
    city text,
    experience_level text,
    bio text,
    avatar_url text,
    is_admin boolean not null default false,
    has_completed_consent boolean not null default false,
    has_completed_starter_upload boolean not null default false,
    has_completed_onboarding boolean not null default false,
    created_at timestamptz not null default now()
);

comment on column public.profiles.is_admin is 'Gates AnalyticsAdmin.tsx, ChallengeAdmin.tsx, and admin links on Dashboard.tsx';

-- =====================================================================
-- invite_codes
-- Looked up by code (unique, case-normalized to lowercase in app) and
-- consumed via an RPC `claim_invite_code(invite_code_text, user_id_value)`
-- (not visible in src/, presumably a Postgres function / not modeled here).
-- =====================================================================
create table if not exists public.invite_codes (
    id uuid primary key default gen_random_uuid(),
    code text not null unique,
    is_used boolean not null default false,
    used_by uuid references public.profiles (id) on delete set null,
    created_at timestamptz not null default now()
);

-- =====================================================================
-- invite_requests
-- Public, unauthenticated insert-only form (RequestInvite.tsx runs
-- before login). Unique email implied by insertError.code === '23505'
-- handling in RequestInvite.tsx.
-- =====================================================================
create table if not exists public.invite_requests (
    id uuid primary key default gen_random_uuid(),
    name text not null,
    email text not null unique,
    instagram_handle text,
    role text not null,
    reason text,
    status text not null default 'pending',
    created_at timestamptz not null default now()
);

-- =====================================================================
-- user_consents
-- Upserted on (user_id, consent_version) — see Consent.tsx onConflict.
-- =====================================================================
create table if not exists public.user_consents (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    confirmed_18_plus boolean not null default false,
    confirmed_ownership boolean not null default false,
    accepted_honest_critique boolean not null default false,
    agreed_no_theft boolean not null default false,
    agreed_nsfw_labeling boolean not null default false,
    agreed_no_harassment boolean not null default false,
    consent_version text not null default 'v1',
    created_at timestamptz not null default now(),
    unique (user_id, consent_version)
);

-- =====================================================================
-- photo_sets
-- Created first in SubmitReview.tsx, then photos are inserted with
-- photo_set_id pointing back at it; cover_photo_url/review_count are
-- updated after upload / after critiques.
-- =====================================================================
create table if not exists public.photo_sets (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    challenge_id uuid references public.challenge_suggestions (id) on delete set null,
    title text,
    caption text,
    content_rating text not null default 'Safe',
    honesty_level text,
    feedback_categories text[] not null default '{}',
    allow_anonymous boolean not null default true,
    photo_count int not null default 1,
    review_count int not null default 0,
    cover_photo_url text,
    is_hidden boolean not null default false,
    created_at timestamptz not null default now()
);
-- NOTE: challenge_suggestions is defined below; forward reference
-- resolved by table creation order further down (see ALTER at bottom).

-- =====================================================================
-- photos
-- Core content table. storage_path / watermarked_storage_path track
-- the `photos` storage bucket object path (`${user.id}/...`).
-- content_rating in {Safe, Suggestive, Explicit}; honesty_level in
-- {Be Gentle, Be Honest, Cook Me Respectfully}. is_hidden used for
-- moderation (queries do `.or('is_hidden.is.null,is_hidden.eq.false')`).
-- =====================================================================
create table if not exists public.photos (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    photo_set_id uuid references public.photo_sets (id) on delete cascade,
    challenge_id uuid references public.challenge_suggestions (id) on delete set null,
    sort_order int not null default 0,
    image_url text,
    storage_path text,
    watermarked_url text,
    watermarked_storage_path text,
    caption text,
    content_rating text not null default 'Safe',
    honesty_level text,
    feedback_categories text[] not null default '{}',
    allow_anonymous boolean not null default true,
    review_count int not null default 0,
    is_starter_upload boolean not null default false,
    is_approved boolean not null default true,
    is_hidden boolean not null default false,
    created_at timestamptz not null default now()
);

-- =====================================================================
-- critiques
-- One critique per (reviewer, photo) conceptually, though no unique
-- constraint is enforced in app code (a reviewer could critique the
-- same photo more than once) — NOT CONFIDENT this shouldn't be unique.
-- =====================================================================
create table if not exists public.critiques (
    id uuid primary key default gen_random_uuid(),
    photo_id uuid not null references public.photos (id) on delete cascade,
    reviewer_id uuid references public.profiles (id) on delete set null,
    is_anonymous boolean not null default false,
    what_works text not null,
    what_needs_work text not null,
    quick_fix text default '',
    portfolio_ready text not null default 'Almost',
    rating int not null default 4,
    created_at timestamptz not null default now()
);

-- =====================================================================
-- vents ("The Corner")
-- post_type in {vent, ask}. upvotes/comment_count are denormalized
-- counters maintained by the client after insert/delete on
-- vent_upvotes / vent_comments.
-- =====================================================================
create table if not exists public.vents (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles (id) on delete set null,
    content text not null,
    is_anonymous boolean not null default true,
    post_type text not null default 'vent',
    upvotes int not null default 0,
    comment_count int not null default 0,
    is_hidden boolean not null default false,
    created_at timestamptz not null default now()
);

create table if not exists public.vent_comments (
    id uuid primary key default gen_random_uuid(),
    vent_id uuid not null references public.vents (id) on delete cascade,
    user_id uuid references public.profiles (id) on delete set null,
    content text not null,
    is_anonymous boolean not null default true,
    created_at timestamptz not null default now()
);

create table if not exists public.vent_replies (
    id uuid primary key default gen_random_uuid(),
    comment_id uuid not null references public.vent_comments (id) on delete cascade,
    user_id uuid references public.profiles (id) on delete set null,
    content text not null,
    is_anonymous boolean not null default true,
    created_at timestamptz not null default now()
);

-- Unique per (vent_id, user_id): VentRoom/VentDetail check for an
-- existing row before insert and delete it to "un-upvote".
create table if not exists public.vent_upvotes (
    id uuid primary key default gen_random_uuid(),
    vent_id uuid not null references public.vents (id) on delete cascade,
    user_id uuid not null references public.profiles (id) on delete cascade,
    created_at timestamptz not null default now(),
    unique (vent_id, user_id)
);

-- =====================================================================
-- tips
-- source in {'user', 'ai'/'admin' (anything not 'user' treated as
-- non-community)}. submitted_by set for user-submitted tips only.
-- =====================================================================
create table if not exists public.tips (
    id uuid primary key default gen_random_uuid(),
    content text not null,
    category text,
    is_anonymous boolean not null default false,
    is_approved boolean not null default false,
    source text not null default 'admin',
    submitted_by uuid references public.profiles (id) on delete set null,
    upvotes_count int not null default 0,
    created_at timestamptz not null default now()
);

-- Unique per (tip_id, user_id): TipsArchive checks/deletes existing
-- rows to toggle a like.
create table if not exists public.tip_upvotes (
    id uuid primary key default gen_random_uuid(),
    tip_id uuid not null references public.tips (id) on delete cascade,
    user_id uuid not null references public.profiles (id) on delete cascade,
    created_at timestamptz not null default now(),
    unique (tip_id, user_id)
);

-- =====================================================================
-- challenge_suggestions ("Monthly Challenge")
-- is_approved gates visibility on ChallengeDetail/Dashboard;
-- is_selected marks the single active challenge (ChallengeAdmin
-- unselects all others before selecting one — app-level invariant,
-- not DB-enforced).
-- =====================================================================
create table if not exists public.challenge_suggestions (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles (id) on delete set null,
    title text not null,
    description text not null,
    is_anonymous boolean not null default false,
    is_approved boolean not null default false,
    is_selected boolean not null default false,
    created_at timestamptz not null default now()
);

-- Now that challenge_suggestions exists, attach the FKs from photos /
-- photo_sets that were declared above referencing it.
alter table public.photo_sets
    drop constraint if exists photo_sets_challenge_id_fkey,
    add constraint photo_sets_challenge_id_fkey
        foreign key (challenge_id) references public.challenge_suggestions (id) on delete set null;

alter table public.photos
    drop constraint if exists photos_challenge_id_fkey,
    add constraint photos_challenge_id_fkey
        foreign key (challenge_id) references public.challenge_suggestions (id) on delete set null;

-- =====================================================================
-- notifications ("Activity")
-- Written by src/lib/notifications.ts (createNotification), always
-- inserted server-side-equivalent via client but only for the
-- recipient user_id (never self-notifies). Read/mark-read only by
-- the owning user.
-- =====================================================================
create table if not exists public.notifications (
    id uuid primary key default gen_random_uuid(),
    user_id uuid not null references public.profiles (id) on delete cascade,
    trigger_user_id uuid references public.profiles (id) on delete set null,
    type text not null,
    entity_type text,
    entity_id text,
    message text not null,
    metadata jsonb not null default '{}'::jsonb,
    is_read boolean not null default false,
    created_at timestamptz not null default now()
);

-- =====================================================================
-- reports (moderation)
-- Inserted by src/lib/reports.ts (createReport) for logged-in users
-- only; reporter_id = auth.uid(). No UI reads it back (moderation
-- presumably reviewed directly in Supabase or a future admin page) —
-- treat as admin-only read.
-- =====================================================================
create table if not exists public.reports (
    id uuid primary key default gen_random_uuid(),
    reporter_id uuid not null references public.profiles (id) on delete cascade,
    content_type text not null, -- photo | critique | vent | vent_comment | vent_reply
    content_id text not null,
    reason text not null,
    details text default '',
    status text not null default 'open',
    created_at timestamptz not null default now()
);

-- =====================================================================
-- app_events (analytics)
-- Written by src/lib/analytics.ts (trackEvent) for logged-in users
-- only. Read only by AnalyticsAdmin.tsx (admin-gated).
-- =====================================================================
create table if not exists public.app_events (
    id uuid primary key default gen_random_uuid(),
    user_id uuid references public.profiles (id) on delete set null,
    event_name text not null,
    page text,
    metadata jsonb not null default '{}'::jsonb,
    created_at timestamptz not null default now()
);

-- =====================================================================
-- Helpful indexes (not strictly inferred from app code, but implied
-- by the query patterns above — e.g. filtering/order by created_at,
-- user_id, vent_id, photo_id, etc.)
-- =====================================================================
create index if not exists idx_photos_user_id on public.photos (user_id);
create index if not exists idx_photos_photo_set_id on public.photos (photo_set_id);
create index if not exists idx_photos_created_at on public.photos (created_at desc);
create index if not exists idx_critiques_photo_id on public.critiques (photo_id);
create index if not exists idx_critiques_reviewer_id on public.critiques (reviewer_id);
create index if not exists idx_vents_created_at on public.vents (created_at desc);
create index if not exists idx_vent_comments_vent_id on public.vent_comments (vent_id);
create index if not exists idx_vent_replies_comment_id on public.vent_replies (comment_id);
create index if not exists idx_notifications_user_id on public.notifications (user_id, created_at desc);
create index if not exists idx_app_events_user_id on public.app_events (user_id, created_at desc);
create index if not exists idx_tips_is_approved on public.tips (is_approved);

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles enable row level security;
alter table public.invite_codes enable row level security;
alter table public.invite_requests enable row level security;
alter table public.user_consents enable row level security;
alter table public.photo_sets enable row level security;
alter table public.photos enable row level security;
alter table public.critiques enable row level security;
alter table public.vents enable row level security;
alter table public.vent_comments enable row level security;
alter table public.vent_replies enable row level security;
alter table public.vent_upvotes enable row level security;
alter table public.tips enable row level security;
alter table public.tip_upvotes enable row level security;
alter table public.challenge_suggestions enable row level security;
alter table public.notifications enable row level security;
alter table public.reports enable row level security;
alter table public.app_events enable row level security;

-- Small helper: is the current user an admin?
create or replace function public.is_admin()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select coalesce((select is_admin from public.profiles where id = auth.uid()), false);
$$;

-- ---------------------------------------------------------------
-- profiles: public read (feed/profile pages read other users'
-- profiles); owner-only write. is_admin is included in the row but
-- app code never lets a client update its own is_admin — enforce
-- that server-side by excluding is_admin from the owner update
-- policy's writable columns is not directly expressible via RLS
-- alone; recommend a trigger/column-level grant to fully lock this
-- down (see final report notes).
-- ---------------------------------------------------------------
create policy "profiles_select_all" on public.profiles
    for select using (true);

create policy "profiles_insert_own" on public.profiles
    for insert with check (auth.uid() = id);

create policy "profiles_update_own" on public.profiles
    for update using (auth.uid() = id) with check (auth.uid() = id);

-- ---------------------------------------------------------------
-- invite_codes: never selected broadly by app (single row looked up
-- by code, pre-auth signup flow). Restrict to admin read; the
-- claim path uses an RPC (security definer), not a direct client
-- update, so no client-facing update/insert policy is added.
-- ---------------------------------------------------------------
create policy "invite_codes_select_unused_lookup" on public.invite_codes
    for select using (is_used = false);

create policy "invite_codes_admin_all" on public.invite_codes
    for all using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------
-- invite_requests: public insert (pre-auth form), admin-only read.
-- ---------------------------------------------------------------
create policy "invite_requests_insert_public" on public.invite_requests
    for insert with check (true);

create policy "invite_requests_admin_read" on public.invite_requests
    for select using (public.is_admin());

create policy "invite_requests_admin_write" on public.invite_requests
    for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------
-- user_consents: owner-only read/write.
-- ---------------------------------------------------------------
create policy "user_consents_owner_select" on public.user_consents
    for select using (auth.uid() = user_id);

create policy "user_consents_owner_upsert" on public.user_consents
    for insert with check (auth.uid() = user_id);

create policy "user_consents_owner_update" on public.user_consents
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- photo_sets / photos: public feed content — anyone authenticated
-- can read non-hidden rows; owner (or admin) can write/hide.
-- NOT CONFIDENT whether feed should be readable by anon (logged-out)
-- users — every route that reads photos is behind ProtectedRoute in
-- App.tsx, so this is restricted to authenticated users only.
-- ---------------------------------------------------------------
create policy "photo_sets_select_authenticated" on public.photo_sets
    for select using (auth.role() = 'authenticated' and (is_hidden = false or user_id = auth.uid() or public.is_admin()));

create policy "photo_sets_insert_own" on public.photo_sets
    for insert with check (auth.uid() = user_id);

create policy "photo_sets_update_own_or_admin" on public.photo_sets
    for update using (auth.uid() = user_id or public.is_admin())
    with check (auth.uid() = user_id or public.is_admin());

create policy "photos_select_authenticated" on public.photos
    for select using (auth.role() = 'authenticated' and (is_hidden = false or user_id = auth.uid() or public.is_admin()));

create policy "photos_insert_own" on public.photos
    for insert with check (auth.uid() = user_id);

-- review_count is updated by any authenticated user submitting a
-- critique (PhotoDetail.tsx updates someone else's photo's
-- review_count). Model this as: owner or admin can update anything;
-- any authenticated user may bump review_count only — RLS can't
-- restrict to a single column directly, so this policy is
-- deliberately permissive for authenticated users and should be
-- tightened with a trigger/RPC in production. NOT CONFIDENT — see
-- report.
create policy "photos_update_own_admin_or_review_count" on public.photos
    for update using (
        auth.uid() = user_id
        or public.is_admin()
        or auth.role() = 'authenticated'
    )
    with check (
        auth.uid() = user_id
        or public.is_admin()
        or auth.role() = 'authenticated'
    );

-- ---------------------------------------------------------------
-- critiques: readable by any authenticated user (shown publicly on
-- PhotoDetail); insert by the reviewer only.
-- ---------------------------------------------------------------
create policy "critiques_select_authenticated" on public.critiques
    for select using (auth.role() = 'authenticated');

create policy "critiques_insert_own" on public.critiques
    for insert with check (auth.uid() = reviewer_id);

-- ---------------------------------------------------------------
-- vents / vent_comments / vent_replies: public-to-authenticated
-- read of non-hidden vents; owner-only insert; owner-or-admin update
-- (vents.upvotes/comment_count updated by any authenticated user via
-- the upvote/comment flows, same caveat as photos.review_count).
-- ---------------------------------------------------------------
create policy "vents_select_authenticated" on public.vents
    for select using (auth.role() = 'authenticated' and (is_hidden = false or public.is_admin()));

create policy "vents_insert_own" on public.vents
    for insert with check (auth.uid() = user_id);

create policy "vents_update_own_admin_or_counters" on public.vents
    for update using (
        auth.uid() = user_id
        or public.is_admin()
        or auth.role() = 'authenticated'
    )
    with check (
        auth.uid() = user_id
        or public.is_admin()
        or auth.role() = 'authenticated'
    );

create policy "vent_comments_select_authenticated" on public.vent_comments
    for select using (auth.role() = 'authenticated');

create policy "vent_comments_insert_own" on public.vent_comments
    for insert with check (auth.uid() = user_id);

create policy "vent_replies_select_authenticated" on public.vent_replies
    for select using (auth.role() = 'authenticated');

create policy "vent_replies_insert_own" on public.vent_replies
    for insert with check (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- vent_upvotes / tip_upvotes: owner reads own upvotes (to know what
-- they've liked); owner inserts/deletes own rows only.
-- ---------------------------------------------------------------
create policy "vent_upvotes_select_own" on public.vent_upvotes
    for select using (auth.uid() = user_id);

create policy "vent_upvotes_insert_own" on public.vent_upvotes
    for insert with check (auth.uid() = user_id);

create policy "vent_upvotes_delete_own" on public.vent_upvotes
    for delete using (auth.uid() = user_id);

create policy "tip_upvotes_select_own" on public.tip_upvotes
    for select using (auth.uid() = user_id);

create policy "tip_upvotes_insert_own" on public.tip_upvotes
    for insert with check (auth.uid() = user_id);

create policy "tip_upvotes_delete_own" on public.tip_upvotes
    for delete using (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- tips: approved tips are readable by any authenticated user;
-- unapproved tips readable by their submitter or admin. Insert by
-- authenticated user only (always is_approved:false on submit, so
-- consider tightening the insert check to force is_approved = false
-- — added below). Update (approve / upvotes_count) admin or the
-- upvote-count bump path — same "any authenticated user can bump a
-- counter" caveat as above.
-- ---------------------------------------------------------------
create policy "tips_select_approved_or_own_or_admin" on public.tips
    for select using (
        is_approved = true
        or submitted_by = auth.uid()
        or public.is_admin()
    );

create policy "tips_insert_own" on public.tips
    for insert with check (auth.uid() = submitted_by and is_approved = false);

create policy "tips_update_admin_or_counter" on public.tips
    for update using (public.is_admin() or auth.role() = 'authenticated')
    with check (public.is_admin() or auth.role() = 'authenticated');

-- ---------------------------------------------------------------
-- challenge_suggestions: approved (or selected) challenges readable
-- by any authenticated user; ChallengeAdmin reads ALL suggestions
-- (admin-only) and is the only place that updates is_approved /
-- is_selected. Insert by the submitting authenticated user.
-- ---------------------------------------------------------------
create policy "challenge_suggestions_select_approved_or_admin" on public.challenge_suggestions
    for select using (
        is_approved = true
        or user_id = auth.uid()
        or public.is_admin()
    );

create policy "challenge_suggestions_insert_own" on public.challenge_suggestions
    for insert with check (auth.uid() = user_id);

create policy "challenge_suggestions_admin_update" on public.challenge_suggestions
    for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------
-- notifications: strictly owner-only (recipient) read/update. Insert
-- happens client-side from any authenticated user notifying someone
-- else (createNotification inserts with user_id = the recipient, not
-- auth.uid()) — so the insert check must allow inserting on behalf
-- of another user, restricted to not self-notifying.
-- ---------------------------------------------------------------
create policy "notifications_select_own" on public.notifications
    for select using (auth.uid() = user_id);

create policy "notifications_insert_authenticated" on public.notifications
    for insert with check (
        auth.role() = 'authenticated'
        and trigger_user_id = auth.uid()
        and user_id <> auth.uid()
    );

create policy "notifications_update_own" on public.notifications
    for update using (auth.uid() = user_id) with check (auth.uid() = user_id);

-- ---------------------------------------------------------------
-- reports: insert-only by the reporting authenticated user; no
-- client read path exists in the app, so restrict all reads to
-- admins (moderation queue).
-- ---------------------------------------------------------------
create policy "reports_insert_own" on public.reports
    for insert with check (auth.uid() = reporter_id);

create policy "reports_admin_select" on public.reports
    for select using (public.is_admin());

create policy "reports_admin_update" on public.reports
    for update using (public.is_admin()) with check (public.is_admin());

-- ---------------------------------------------------------------
-- app_events: insert-only by the authenticated user for themselves;
-- read restricted to admins (AnalyticsAdmin.tsx).
-- ---------------------------------------------------------------
create policy "app_events_insert_own" on public.app_events
    for insert with check (auth.uid() = user_id);

create policy "app_events_admin_select" on public.app_events
    for select using (public.is_admin());

-- =====================================================================
-- Storage: avatars bucket
-- Public read (avatar images are shown to all users on profiles,
-- vent posts, notifications, activity feed). Upload path is
-- `${auth.uid()}/avatar.<ext>` (Profile.tsx handleAvatarUpload), so
-- write access is restricted to the folder matching the user's own
-- id, matching Supabase Storage's standard "first path segment =
-- auth.uid()" convention.
--
-- NOTE: run this against storage.objects; requires the `avatars`
-- bucket to already exist (create via dashboard or
-- `insert into storage.buckets (id, name, public) values
-- ('avatars', 'avatars', true)` if not already present).
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('avatars', 'avatars', true)
on conflict (id) do nothing;

create policy "avatars_public_read" on storage.objects
    for select using (bucket_id = 'avatars');

create policy "avatars_owner_insert" on storage.objects
    for insert with check (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy "avatars_owner_update" on storage.objects
    for update using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
    )
    with check (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy "avatars_owner_delete" on storage.objects
    for delete using (
        bucket_id = 'avatars'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

-- =====================================================================
-- Storage: photos bucket
-- Used for photo/photo-set uploads (StarterUpload.tsx, SubmitReview.tsx)
-- and read publicly via getPublicUrl() throughout the feed/detail pages.
-- Upload paths are `${user.id}/...` (StarterUpload) and
-- `${user.id}/${photoSetId}/...` (SubmitReview) — both namespaced by
-- the uploading user's id as the first path segment.
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('photos', 'photos', true)
on conflict (id) do nothing;

create policy "photos_bucket_public_read" on storage.objects
    for select using (bucket_id = 'photos');

create policy "photos_bucket_owner_insert" on storage.objects
    for insert with check (
        bucket_id = 'photos'
        and (storage.foldername(name))[1] = auth.uid()::text
    );

create policy "photos_bucket_owner_delete" on storage.objects
    for delete using (
        bucket_id = 'photos'
        and (storage.foldername(name))[1] = auth.uid()::text
    );
