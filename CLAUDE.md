# The Creative Review — Project Memory / Build Handoff

Last updated: April 30, 2026

Use this file as the working memory for continuing **The Creative Review** in ChatGPT, Claude, Cursor, Google AI Studio, or any coding assistant.

---

## 1. Project Identity

**The Creative Review** is an invite-only, 18+ creative critique community web app for photographers, models, MUAs, retouchers, designers, stylists, and other visual creatives.

**Tagline:** Real Feedback. Level Up.

The app should feel:

- Raw
- Honest
- Elevated
- Cinematic
- Mobile-first
- Community-driven
- Serious but still culturally sharp
- Not like Instagram
- Like a creative arena where people come to sharpen their work

This is currently a **Vite + React + TypeScript + Supabase beta prototype**. The goal right now is **private beta stability**, not production overbuilding.

A later production migration to **Next.js** is planned, but advanced production features should wait until after beta validation.

---

## 2. Current Stack

- Vite
- React
- TypeScript
- Supabase Auth
- Supabase Database
- Supabase Storage
- Tailwind CSS
- lucide-react
- motion/react
- Vercel deployment

---

## 3. Brand / UI Direction

The Creative Review brand direction is locked.

### Logo System

Use the **Aperture Kit logo concept** combined with the **Frame Kit font direction**.

Logo idea:

- Aperture circle
- Flame inside
- Eye inside flame
- Subtle frame corners

Meaning:

- Flame = Hot Seat
- Eye = critique culture
- Frame = photography roots
- Dark UI = serious creative space

### Colors

```js
brand: {
  black: '#0B0B0B',
  surface: '#1A1A1A',
  white: '#F5F5F5',
  accent: '#FF3B3B',
  gray: '#8A8A8A',
}
```

The current app also uses `brand-critique` heavily as an accent/error alias.

### Typography

- Headings/buttons/labels: **Bebas Neue**
- Body/UI: **Inter**

### UI Rules

- Dark-first
- No light mode for now
- Red only for key actions, alerts, and Hot Seat moments
- Image-first design
- Subtle framed cards/images/buttons
- Mobile-first
- Cinematic and polished
- Use current `cr-*` and `brand-*` Tailwind classes only
- Do **not** mix in older `crtr-*` tokens/classes

Avoid undefined old classes like:

- `bg-crtr-black`
- `border-crtr-border`
- `rounded-card`
- `shadow-card`
- `shadow-glow`

---

## 4. Copy / Tone Guide

The app should sound:

- Honest
- Confident
- Slightly raw
- Funny when appropriate
- Serious about the work
- Respectful of the person
- Direct but not cruel
- Community-first

Avoid:

- Sounding too corporate
- Sounding like Instagram
- Over-explaining
- Generic social network language
- Fake hype
- Cruelty disguised as honesty

### Use These Phrases

- Real Feedback. Level Up.
- This isn’t Instagram.
- Give real. Get real.
- Respect the person. Review the work.
- Step Into The Corner.
- Enter The Hot Seat.
- Ready When You Are.
- Drop A Review.
- Browse Feed.
- Monthly Challenge.
- The Corner.
- Corner thread.

### Replace These

Replace:

- Vent Room
- Vent Session
- Back to vents
- vent thread

With:

- The Corner
- Corner post
- Back to The Corner
- Corner thread

Replace:

- Weekly Challenge

With:

- Monthly Challenge

Replace:

- Beta Empty State

With:

- Ready When You Are

---

## 5. Confirmed Current Routes / Pages

Current app includes or should include:

- Landing
- InviteCode
- Signup
- Login
- Consent
- StarterUpload
- Dashboard
- ReviewFeed
- SubmitReview
- PhotoDetail
- Profile
- VentRoom / VentDetail as The Corner
- Activity / Notifications
- HotSeat
- TipsArchive
- ChallengeSuggestion
- ChallengeAdmin
- AnalyticsAdmin
- CultureOnboarding
- Supporter
- RequestInvite, if latest patches are present

Important routing notes:

- Protected routes wrap logged-in pages.
- Public-only routes exist for landing/invite/signup/login.
- Dashboard redirects users to `/onboarding` if `profiles.has_completed_onboarding` is false.
- ChallengeAdmin checks `profiles.is_admin`.
- Internal `/vents`, `VentRoom.tsx`, `VentDetail.tsx`, and `vents` table can stay for beta.
- User-facing copy should say **The Corner**.

---

## 6. Supabase Tables / Database Memory

### `profiles`

Used for user profile data.

Important fields:

- `id`
- `display_name`
- `username`
- `instagram_handle`
- `role`
- `city`
- `bio`
- `website`
- `avatar_url`
- `email`
- `is_admin`
- `has_completed_onboarding`

Notes:

- `email` was added/backfilled from `auth.users`.
- `is_admin` protects ChallengeAdmin.
- `has_completed_onboarding` controls culture onboarding redirect.

### `photos`

Used for individual uploaded images. With true photo sets, each image in a set is still a `photos` row.

Important fields:

- `id`
- `user_id`
- `image_url`
- `storage_path`
- `watermarked_url`
- `watermarked_storage_path`
- `caption`
- `title`
- `content_rating`
- `honesty_level`
- `feedback_categories`
- `allow_anonymous`
- `review_count`
- `created_at`
- `is_starter_upload`
- `is_hidden`
- `photo_set_id`
- `sort_order`

Notes:

- `content_rating` can include Safe, Suggestive, Explicit.
- Explicit content should show as NSFW and blur until revealed.
- `review_count` updates after critique submission.
- `photo_set_id` links images to `photo_sets`.
- `sort_order = 0` is the cover image for a set.

### `photo_sets`

Added for true photo sets.

Important fields:

- `id`
- `user_id`
- `title`
- `caption`
- `content_rating`
- `honesty_level`
- `feedback_categories`
- `allow_anonymous`
- `cover_photo_url`
- `photo_count`
- `review_count`
- `is_hidden`
- `created_at`

Structure:

- `photo_sets` = parent post
- `photos` = images inside the set
- Each image has `photo_set_id`
- Each image has `sort_order`
- First image / `sort_order = 0` is the cover image

Beta critique behavior:

- Critiques still attach to the opened/cover photo via `critiques.photo_id`.
- When a photo set is critiqued, update both `photos.review_count` and `photo_sets.review_count`.
- Later production version may add `critiques.photo_set_id` for true set-level critiques.

### `critiques`

Used for critique responses.

Important fields:

- `id`
- `photo_id`
- `reviewer_id`
- `is_anonymous`
- `what_works`
- `what_needs_work`
- `quick_fix`
- `portfolio_ready`
- `rating`
- `created_at`

Notes:

- Critiques persist in Supabase.
- Critique submission updates review count.
- Critique submission creates notifications.

### `vents`

Internal table for **The Corner**.

Important fields:

- `id`
- `user_id`
- `content`
- `is_anonymous`
- `upvotes`
- `comment_count`
- `created_at`
- `post_type`
- `is_hidden`

`post_type` supports:

- `vent`
- `ask`

User-facing name is **The Corner**.

### `vent_comments`

Used for comments on Corner posts.

### `vent_replies`

Used for replies to Corner comments.

### `vent_upvotes`

Used to track upvotes on Corner posts.

Notes:

- Upvotes insert/delete in `vent_upvotes`.
- `vents.upvotes` is directly updated.
- Upvote workflow was tested and working.

### `tips`

Used for Tip of the Day / Tips Archive.

Important fields include:

- `id`
- `content`
- `category`
- `is_anonymous`
- `is_approved`
- `created_at`

### `challenge_suggestions`

Used for Monthly Challenge suggestions and admin selection.

Important fields:

- `id`
- `title`
- `description`
- `user_id`
- `is_approved`
- `is_selected`
- `created_at`

Notes:

- Users submit challenge suggestions.
- Admin can approve/unapprove.
- Admin can select one active monthly challenge.
- Dashboard should say Monthly Challenge, not Weekly Challenge.

### `reports`

Used for content reporting.

Targets:

- Photos
- Critiques
- Corner posts
- Corner comments
- Corner replies

### `notifications`

Used for Activity page.

Current implementation expects:

- `id`
- `user_id`
- `trigger_user_id`
- `type`
- `entity_type`
- `entity_id`
- `message`
- `metadata`
- `created_at`
- `is_read`

Tracks:

- Critiques received
- Replies
- Upvotes
- Corner activity

Future notification types:

- Follows
- Tags
- Hot Seat placements
- Trending status
- Challenge submissions
- Badge unlocks

### `app_events`

Used by AnalyticsAdmin.

### `invite_requests`

Added/planned for invite request page.

Important fields:

- `id`
- `name`
- `email`
- `instagram_handle`
- `role`
- `reason`
- `status`
- `created_at`

---

## 7. Supabase Storage

Known buckets:

- `photos`
- `avatars`

Photo URL cleaning should strip:

- leading slashes
- `photos/`
- `public/`

This avoids broken public URLs.

---

## 8. Completed Core Beta Features

- Vite prototype running locally
- Supabase connected
- Supabase Auth working
- Profile creation working
- Email added to `profiles`
- Consent flow working
- Invite-only signup working
- One-time-use invite codes working
- Login page working
- Protected routes for logged-in pages
- Public-only routing for landing/invite/signup/login
- Persistent login/session redirect
- Upload flow working
- Starter upload working
- Submit review/photo upload working
- Photos upload to Supabase Storage
- Photos save to Supabase `photos` table
- Review feed loads real Supabase uploads
- Review feed beta empty-state polish completed
- Photo detail loads real photo/profile data
- Critiques save to Supabase
- Review count updates after critique submission
- Anonymous critique option
- Self critique option
- NSFW blur/reveal behavior
- Reporting works for photos and critiques
- Reports helper supports multiple content types
- Dashboard mobile swipe layout
- Desktop dashboard grid
- Mobile hero/header removed
- Header navigation updates
- Logo routes to dashboard
- Profile image routes to profile
- Tailwind UI kit foundation added
- Temporary Tailwind logo lockup added
- Local `npm run build` passed after latest launch polish

---

## 9. Completed Profile Features

- Profile page exists
- Public profile route exists: `/profile/:userId`
- Mobile-centered profile layout
- Edit profile feature
- Avatar upload via `avatars` storage
- `profiles.avatar_url` updates correctly
- Bio field
- Website field
- City field
- Instagram handle field
- Accurate profile counts for:
  - Frames uploaded
  - Reviews received
  - Reviews given
- Fake critique activity removed from Profile
- `FAKE_USER` still appears only as fallback display data and should later be replaced with neutral fallback copy

---

## 10. The Corner Status

The old user-facing “Vent Room” has been rebranded to **The Corner**.

Completed:

- Dashboard card updated to The Corner
- CTA: Step Into The Corner
- Desktop/mobile nav labels changed to Corner
- Existing route remains `/vents`
- Existing files remain `VentRoom.tsx` and `VentDetail.tsx`
- Existing table remains `vents`
- `vents.post_type` column added
- Post types: `vent` and `ask`
- Main Corner feed has Vent/Ask toggle
- New posts insert `post_type`
- Feed maps and displays `post_type`
- Vent/Ask badges appear
- VentDetail maps and displays post type
- Upvotes/comments/replies tested successfully
- Reporting works for Corner posts/comments/replies
- Notifications created for Corner activity

User-facing copy should not say:

- Vent Room
- Vent Session
- Back to vents
- vent thread

Use:

- The Corner
- Corner post
- Back to The Corner
- Corner thread

---

## 11. Hot Seat Status

Completed Phase 1 and Phase 2 for beta:

- Dashboard Hot Seat card upgraded
- Dedicated `/hot-seat` page exists
- Dashboard links to `/hot-seat`
- Hot Seat badge
- Daily Feature badge
- Reset countdown timer
- “Today’s Most Discussed” copy
- Rating badge
- Role badge
- Review count badge
- Full-image card styling
- NSFW Hot Seat overlay
- “Enter The Hot Seat” CTA
- `/hot-seat` displays:
  - Current featured image
  - Caption
  - Countdown
  - Rating
  - Role
  - Review count
  - Hot Seat/Daily Feature badges
  - Empty state
  - Error state
  - Loading state
  - CTA to Drop A Review
  - CTA to Browse Feed

No new database tables were added yet.

Later Hot Seat phases:

- Notifications when someone makes Hot Seat
- Hot Seat Survivor badge
- Top critique highlights
- True daily rotation/history table

---

## 12. Activity / Notifications Status

Completed:

- Activity page inspired by Instagram
- Grouped sections:
  - Highlights
  - Today
  - Yesterday
  - Earlier
- Mark-as-read support working
- Tracks:
  - Critiques received
  - Replies
  - Upvotes
  - Corner activity

---

## 13. Culture Onboarding Status

Completed MVP:

- Added `profiles.has_completed_onboarding`
- Added `src/pages/CultureOnboarding.tsx`
- Added protected `/onboarding` route
- Dashboard redirects unfinished users to onboarding
- Completing onboarding updates `has_completed_onboarding` true
- Completing onboarding sends user to `/dashboard`

Five onboarding steps:

1. This isn’t Instagram
2. Give real. Get real.
3. Respect the work/person
4. Choose your lane
5. Beta culture lock-in

---

## 14. Tip of the Day Status

Completed:

- `tips` table used
- Dashboard Tip of the Day card exists
- Tips Archive page exists
- Approved tips load from Supabase
- Tip fallback behavior exists
- Tip card can use approved uploaded photo background
- Tips include/use `category` field

---

## 15. Monthly Challenge Status

Completed:

- Challenge suggestion system exists
- ChallengeSuggestion page exists
- ChallengeAdmin manager exists
- Admin can approve/unapprove suggestions
- Admin can set one selected/active challenge
- Dashboard Monthly Challenge card dynamically pulls selected approved challenge from Supabase
- Weekly/Monthly wording cleanup completed in latest working version

Copy should say:

- Monthly Challenge
- monthly challenges

Not:

- Weekly Challenge
- Challenge of the Week

---

## 16. Admin / Analytics Status

Completed:

- Admin-only dashboard shortcut exists
- `ChallengeAdmin` checks `profiles.is_admin`
- `AnalyticsAdmin` page exists
- `app_events` table used
- Uploads and key actions can track analytics events

---

## 17. PWA / App-Like Status

Completed in latest working version:

- PWA manifest exists: `public/manifest.webmanifest`
- Service worker exists: `public/sw.js`
- `src/main.tsx` registers service worker only in production
- Dashboard includes Add to Home Screen / install instructions
- PWA icons exist and are correct sizes:
  - `public/icons/icon-192.png`
  - `public/icons/icon-512.png`
- `index.html` PWA tags completed:
  - Manifest link added
  - Theme color meta tag added
  - Apple mobile web app tags added
  - Apple touch icon added

Important: a later uploaded stale zip did not include these tags, so verify the actual local folder.

---

## 18. Request Invite Feature

Added/planned in latest working version:

- New page: `src/pages/RequestInvite.tsx`
- Route: `/request-invite`
- Form collects:
  - Name
  - Email
  - Instagram handle
  - Creative role
  - Reason they want access
- Supabase table: `invite_requests`
- Login page patched with two access options:
  - “I Have A Code” → `/invite`
  - “Request Invite” → `/request-invite`
- Invite page should include a “Request An Invite” link for users without a code

Important: a later uploaded stale zip did not include this page/route, so verify the actual local folder.

---

## 19. True Photo Sets — Completed in Latest Working Version

True photo sets are now working across the core app.

### SubmitReview.tsx

Completed:

- Supports selecting multiple images
- Max 10 images for beta
- Creates one `photo_sets` parent row
- Uploads every image to Supabase Storage under the `photos` bucket
- Creates one `photos` row per uploaded image
- Links every image using `photo_set_id`
- Adds `sort_order`
- First image becomes cover image
- Updates `photo_sets.cover_photo_url`
- Upload tracking uses `photo_set_uploaded`
- Browser test confirmed true photo set upload works
- Build passed after patch

### ReviewFeed.tsx

Completed:

- Selects `photo_set_id`, `sort_order`, and joined `photo_sets` data
- Shows single photos normally
- Shows photo sets as one card where `sort_order = 0`
- Prevents every image in a set from appearing as separate feed posts
- Shows Photo Set / image count badge
- Shows Single Frame badge for normal uploads
- Photo set cards are swipeable carousel cards like Instagram
- Single-photo posts still display normally
- NSFW blur/reveal still works
- Browser test confirmed feed photo set display and carousel work

Later polish item:

- Make ReviewFeed carousel dots update live based on currently visible/swiped image.
- Current dots are beta-simple/static.

### PhotoDetail.tsx

Completed:

- Loads all images connected by `photo_set_id`
- Shows Photo Set badge with current image position/count
- Displays full photo set thumbnail grid under main image
- Users can tap thumbnails to switch main displayed image
- Single-image uploads still show Single Frame badge
- NSFW blur/reveal applies to photo set preview/detail images
- Critiques still attach to opened/cover photo for beta safety
- When a critique is submitted on a photo set, `photo_sets.review_count` is also updated
- Browser test confirmed detail-page photo set display/switching works

### Profile.tsx

Completed:

- Profile grid shows single photos normally
- Profile grid shows photo sets as one tile using only cover image where `sort_order = 0`
- Extra images from a photo set no longer appear as separate profile grid tiles
- Profile grid shows a small photo set/image-count badge on photo set tiles
- Single image tiles still show normally
- NSFW blur behavior remains
- User confirmed patch works and can be checked off

---

## 20. Current Important Warning: Stale Zip Issue

A recent uploaded zip looked stale and did **not** include the latest patches.

The stale zip was missing:

- RequestInvite page
- `/request-invite` route
- `invite_requests` references
- `index.html` PWA/meta tags
- Monthly Challenge wording cleanup
- true photo set code
- ReviewFeed photo set badge/carousel
- PhotoDetail photo set thumbnail switching
- Profile photo set grouping

Before coding, verify the actual local project folder contains the latest work.

Run from project root:

```bash
grep -R "photo_sets" -n src/pages
grep -R "RequestInvite" -n src
grep -n "manifest.webmanifest" index.html
```

Expected:

- `photo_sets` should appear in SubmitReview, ReviewFeed, PhotoDetail, and Profile.
- `RequestInvite` should appear in `src/pages/RequestInvite.tsx` and `src/App.tsx`.
- `manifest.webmanifest` should appear in `index.html`.

If these return nothing, the folder is stale and missing recent work.

Do **not** continue coding from the stale folder.

---

## 21. Friday Beta Launch Checklist — Remaining

### Technical

- Confirm app runs locally
- Run `npm run build`
- Fix any red TypeScript/build errors
- Confirm `.env.local` is not committed
- Confirm `.env.save` is not committed
- Confirm `.gitignore` includes environment files
- Deploy to Vercel
- Confirm Vercel environment variables are set
- Test live deployment on desktop
- Test live deployment on mobile

### Cleanup Before Pushing / Sharing

Remove or avoid sharing:

- `.env.local`
- `.env.save`
- `.DS_Store`
- `__MACOSX`
- `public/icons/icon.psd`
- `.git`
- `node_modules`
- `dist`, unless intentionally including static build output

Run:

```bash
git status
```

Make sure these are not staged:

- `.env.local`
- `.env.save`

### Push

```bash
git add .
git commit -m "Prepare Creative Review beta launch"
git push origin main
```

If branch is not `main`, check with:

```bash
git branch
```

Then push using the correct branch name.

---

## 22. Fresh Beta Tester Walkthrough

Create a fresh tester account and test:

- Landing page
- Invite code screen
- Request invite page
- Signup
- Login
- Consent
- Culture onboarding
- Starter upload
- Dashboard
- Review feed
- Submit single photo
- Submit photo set
- Feed photo set carousel
- Photo detail
- Photo set thumbnail switching
- Submit critique
- Review count updates
- Report photo
- Report critique
- Profile page
- Profile photo set grid grouping
- Edit profile
- Avatar upload
- The Corner
- Post a Vent
- Post an Ask
- Upvote Corner post
- Comment on Corner post
- Reply in Corner thread
- Report Corner post/comment/reply
- Activity notifications
- Tip of the Day
- Tips Archive
- Monthly Challenge card
- Challenge suggestion
- Hot Seat page
- Logout
- Login again
- Refresh persistence

---

## 23. Admin Test

- Login as admin
- Confirm admin dashboard shortcut appears
- Open ChallengeAdmin
- Approve challenge suggestion
- Set active challenge
- Confirm dashboard updates
- Confirm regular user does not see admin shortcut
- Check invite_requests table if RequestInvite is active

---

## 24. Seed Content Before Inviting Testers

Add enough content so the app does not feel empty:

- 5–10 strong photo uploads
- At least 2 photo sets
- 3–5 critiques
- 3–5 Corner posts
- At least 1 Ask post
- At least 1 Vent post
- 3–5 approved tips
- 2–3 challenge suggestions
- 1 active monthly challenge

---

## 25. Tester Invite Prep

Prepare:

- Beta tester welcome message
- Invite code list
- App rules
- What-to-test checklist
- Bug report instructions
- Short onboarding explanation
- DM version
- Email version

Beta positioning:

The Creative Review is a private creative feedback app for photographers, models, MUAs, retouchers, and other visual creatives. It is built for honest critique, not likes. Testers should upload, review, post in The Corner, test the app on mobile, and report anything confusing, broken, or awkward.

---

## 26. Not Yet Implemented / Save For Later

Do not add these before beta unless explicitly requested:

- Critique style selector:
  - Soft
  - Direct
  - Brutal Honesty
- Badge/ranking system
- Member directory/search
- AI warmup critique
- Challenge submissions
- Challenge leaderboard
- Challenge winners
- Production watermarking
- Payments/supporter roles
- Stripe integration
- Advanced admin dashboard
- Advanced moderation queue
- Next.js migration
- Live carousel dots for ReviewFeed photo sets
- True set-level critiques with `critiques.photo_set_id`

---

## 27. Long-Term Roadmap

### Phase 1 — Private Beta

Goal: prove people will upload, critique, engage, and come back.

Focus:

- Smooth onboarding
- Invite-only access
- Strong content seed
- Real critique behavior
- Mobile-first experience
- Bug reports
- Retention signals
- Community tone

Features:

- Uploads
- Photo sets
- Critiques
- Review feed
- Photo detail
- Profiles
- The Corner
- Tip of the Day
- Monthly Challenge
- Hot Seat
- Activity/Notifications
- Reporting
- Basic admin
- PWA install

### Phase 2 — Community Depth

Goal: make the app feel alive and sticky.

Features:

- Member directory
- Role filters
- Search
- Profile completion
- Available for collabs toggle
- Public profile preview
- Badges
- Ranking/leaderboard
- Helpful reviewer badges
- Hot Seat Survivor badge
- Challenge submissions
- Challenge leaderboard
- Challenge winners
- Improved notification types
- Mutual creative tagging/credits

### Phase 3 — Critique System Upgrades

Goal: make feedback more structured and valuable.

Features:

- Critique style selector
- AI warmup critique
- Portfolio readiness score
- Top critique highlights
- Saved critiques
- Critique templates
- Better category-based feedback
- Advanced honesty levels
- Reviewer quality scoring

### Phase 4 — Monetization

Goal: monetize after trust and engagement exist.

Potential monetization:

- Supporter roles
- Paid community tier
- Featured critiques
- Portfolio reviews
- Challenge sponsorships
- Creator recommendation affiliate links
- Amazon affiliate gear/supply recommendations
- Premium educational content
- Creative marketplace features

Do not rush monetization before user trust is strong.

### Phase 5 — Production Hardening / Next.js

Move to Next.js for:

- Server-side watermarking
- Private originals
- Compressed public copies
- Stronger image protection
- Stripe webhooks
- Advanced admin dashboard
- Moderation queues
- AI critique engine
- Better SEO/public landing pages
- Scalable routing
- Better image optimization

### Phase 6 — Media Expansion

Future features:

- Multi-image uploads / photo sets are already in beta version
- Short video critique
- Video posts in The Corner
- Audio notes
- Livestream critique sessions
- Challenge recap reels
- Community education library

### Phase 7 — Platform Scale

Potential scale features:

- City-based creative discovery
- Verified creators
- Brand/casting opportunities
- Portfolio marketplace
- Paid creative opportunities
- Studio/event listings
- Education marketplace
- Creator tools
- Client-proofing bridge
- Booking integration

---

## 28. Preferred Work Style

When continuing this project:

- Work step-by-step
- Be beginner-friendly
- Give full copy-and-paste code when needed
- Preserve working beta flows
- Avoid advanced production features before beta
- Do not rename internal `VentRoom`, `VentDetail`, `/vents`, or `vents` table before beta
- User-facing language should say The Corner
- Prioritize build stability and mobile-first testing

---

## 29. Startup Prompt For Claude / Cursor / ChatGPT

Use this prompt in a new coding assistant session:

```txt
I’m continuing the build of The Creative Review. Please read THE_CREATIVE_REVIEW_MEMORY.md first and treat it as the project memory/build list.

Important: before making changes, help me verify that I’m in the correct local project folder and not the stale zip copy. The correct folder should contain references to `photo_sets`, `RequestInvite`, and `manifest.webmanifest` in `index.html`.

This is a Vite + React + TypeScript + Supabase beta prototype. The immediate goal is beta launch stability, not production overbuilding.

Please work step-by-step, beginner-friendly, and give full copy-and-paste code when needed.
```

Verification commands:

```bash
pwd
ls
grep -R "photo_sets" -n src/pages
grep -R "RequestInvite" -n src
grep -n "manifest.webmanifest" index.html
npm run build
git status
```

Expected:

- `photo_sets` should appear in SubmitReview, ReviewFeed, PhotoDetail, and Profile.
- `RequestInvite` should appear in RequestInvite page and App route.
- `manifest.webmanifest` should appear in `index.html`.
- `npm run build` should pass.
- `.env.local` and `.env.save` should not be staged.
