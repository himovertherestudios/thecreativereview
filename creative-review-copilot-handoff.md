# The Creative Review — GitHub Copilot Handoff

**Prepared for:** Kevin Russell  
**Prepared:** September 3, 2026  
**Status:** Active beta and launch preparation

## 1. Purpose of this handoff

This document gives GitHub Copilot the product context, technical direction, brand rules, known working areas, content workflow, and safety constraints needed to continue The Creative Review responsibly.

Treat this as orientation, not proof of the repository's exact current state. Before changing code or data, inspect the checked-out branch, live Supabase project, existing migrations, environment-variable names, and current build output. When this document and the implementation disagree, report the mismatch before deciding which should change.

## 2. Product identity

**Product:** The Creative Review  
**Tagline:** Real Feedback. Level Up.  
**Founder:** Kevin Russell  
**Stage:** Invite-only, 18+ beta

The Creative Review is a mobile-first critique and creative-development community for photographers, models, makeup artists, retouchers, stylists, creative directors, and other visual creatives. Its purpose is to help people improve through honest, useful critique, practical education, and real creative conversation.

This is deliberately not another social feed optimized around empty likes. The main value loop is:

1. A user signs up or receives beta access.
2. The user completes consent, culture onboarding, and their profile.
3. The user uploads work for review.
4. Other creatives give specific, constructive critique.
5. The user applies the feedback and returns with stronger work.
6. The user can also learn through tips, challenges, The Corner, and later the curriculum.

## 3. Audience and experience principles

- The community is invite-only during beta.
- The product is for adults age 18 and older.
- Some creative work may be artistic nude or otherwise NSFW, so consent, content controls, reporting, and privacy are product requirements—not optional polish.
- The experience should feel honest, grown, culturally aware, direct, and supportive.
- Feedback should be specific enough to help someone make a better creative decision.
- Mobile usability is the priority, while desktop must remain functional.
- Do not turn the app into a popularity contest. Avoid shipping leaderboards, public status systems, or shallow engagement mechanics without Kevin's explicit approval.

## 4. Locked language and brand rules

### Approved terms

- Product name: **The Creative Review**
- Tagline: **Real Feedback. Level Up.**
- Community conversation area: **The Corner**
- Recurring challenge language: **Monthly Challenge**

### Do not reintroduce

- “Vent Room” in user-facing copy
- “Weekly Challenge” when the feature is the Monthly Challenge
- Generic startup language that makes the product sound like every other creative platform
- Overly corporate, robotic, or motivational-poster copy

### Voice

Kevin's voice is direct, familiar, practical, and conversational—like a knowledgeable creative friend telling you what will actually help. It can have personality and edge, but it should remain clear and useful. Avoid filler such as “unlock your potential,” “elevate your journey,” or “passionate creative.”

### Confirmed visual direction

- Dark, cinematic, mobile-first interface
- Main background: `#0B0B0B`
- Card and form background: `#1A1A1A`
- Borders and dividers: `#313131`
- Main accent and CTA: `#FF3B3B`
- Main text/headings: `#F9F9F9`
- Supporting text: `#9CA3AF`
- Secondary labels: `#6B7280`
- Dark text on red buttons: `#0B0B0B`
- Red is an accent for calls to action, important labels, and key icons; do not flood the interface with it.

Reuse the repository's existing design tokens, components, utility classes, typography, logo assets, and spacing patterns. Do not create a competing design system.

## 5. Intended technical architecture

The established delivery direction is:

- Vite
- React
- TypeScript
- Tailwind CSS
- Supabase Auth, Postgres, Storage, and Row Level Security
- `lucide-react` icons
- `motion/react` where animation already exists or is justified
- GitHub for source control
- Vercel for the web beta
- Capacitor later for iOS and Android packaging

**Do not rewrite the app in Next.js before the store launch.** Stabilize the existing Vite application, validate the beta, deploy through GitHub to Vercel, then package the proven app with Capacitor.

Do not change frameworks, routing strategy, state-management approach, or database architecture merely because another approach is fashionable. First understand why the current implementation exists and what is already working.

## 6. Known product areas

The project has included the following routes or feature areas. Exact route names and completion status must be verified in the repository:

- Authentication and protected routes
- Invite-code or invite-request flow
- Adult consent and culture onboarding
- Dashboard
- Review feed
- Submit Review / photo upload
- Photo detail and critique thread
- User profiles and avatars
- Anonymous critique options
- NSFW blur or visibility controls
- Reporting and moderation support
- The Corner
- Activity and notifications
- Daily tips and the Tip Library
- Monthly Challenge and challenge administration
- Hot Seat
- Analytics/admin areas
- Supporter area
- PWA or home-screen installation guidance
- Request Invite flow

Historical project work indicates that authentication, profiles, uploads, feed/detail critique flows, NSFW treatment, reporting, dashboard, The Corner, notifications, tips, Monthly Challenge, Hot Seat, onboarding, PWA support, Request Invite, and local builds have all received implementation work. Do not assume every item is production-ready. Verify the actual branch and test the real flow.

## 7. Beta core loop and launch priorities

The beta must prove this loop before the project expands:

`signup → consent/profile → upload → critique → return/apply feedback`

The supporting loop is:

`The Corner → tips → Monthly Challenge → stronger work and better critique`

Prioritize defects and friction that block these loops. Also verify:

- Privacy and terms access
- Reporting and moderation flow
- Account deletion
- Storage permissions and signed/private asset behavior
- RLS protection for every user-owned or sensitive table
- Error, loading, empty, and retry states
- Mobile layouts and touch targets
- Invite and onboarding completion states
- NSFW defaults and user controls
- Notification correctness

Features previously deferred until the core beta is proven include a public directory, leaderboards, multi-image critiques, AI critique, heavy gamification, and nonessential logo polish. Do not add them without a new approved task.

## 8. Tips and editorial content system

The product includes daily automatic tips and a browsable Tip Library organized by subject. Editorial work has covered areas including:

- Lighting
- Posing and direction
- Composition
- Cameras and shooting
- Color theory and color grading
- Retouching
- Creative direction
- Working with people
- Business and pricing
- Marketing and social media
- Portfolio and branding
- Creativity and inspiration

The editorial goal is to replace repetitive, generic advice with specific, field-tested guidance informed by strong photography, art, creative-direction, marketing, and business resources. The copy should still sound like Kevin—not like copied textbook language.

The project uses both Supabase and a Notion workflow under Kevin's 1006 dashboard. Treat Supabase as the runtime data source and Notion as an editorial/review workspace unless the repository or documented sync process explicitly says otherwise.

Before editing tip data:

1. Inspect the schema, seed files, scripts, database functions, and any sync tooling.
2. Compare current Supabase records with the current Notion editorial source.
3. Identify stable IDs, slugs, day numbers, categories, status fields, and publication rules.
4. Report duplicates, gaps, stale categories, or conflicting versions.
5. Do not bulk overwrite, reseed, or renumber published content without Kevin's approval and a rollback plan.

## 9. Curriculum initiative

A video-first, self-paced Creative Review curriculum is being developed from the stronger educational tips. The current planning direction is four phases and twelve courses, with lesson scripts and a Notion workflow.

This is a parallel content initiative, not permission to build a heavy LMS into the beta. Integrate a Learn section only through an explicitly approved task and only after considering the stability of the critique loop. Avoid badges, rankings, and complex course infrastructure until users prove they need them.

## 10. Current launch and marketing context

Launch preparation has included:

- A MailerLite beta waitlist and automated welcome email
- Beta tester selection and tracking
- A launch-day content package
- Instagram profile, posts, stories, highlights, and Canva assets
- A ManyChat flow that Kevin has tested successfully
- Facebook/Instagram campaign planning
- An App Store roadmap beginning after beta launch

These initiatives provide product context but do not authorize Copilot to modify external services. Code tasks should remain scoped to the repository and explicitly connected services.

## 11. Source-of-truth order

Use this order when facts conflict:

1. The current checked-out repository and its version history
2. The connected live Supabase project's actual schema, migrations, functions, policies, and data
3. Explicit current instructions from Kevin
4. The current Notion editorial databases and approved content
5. This handoff and other planning documents
6. Old screenshots, prior prompts, and legacy copy

Do not silently choose between conflicting sources. Explain the conflict and recommend the safest resolution.

## 12. Non-negotiable engineering guardrails

- Begin every unfamiliar task by inspecting the relevant implementation.
- Preserve working features and the current visual language.
- Check `git status` and the active branch before editing.
- Do not overwrite unrelated user changes.
- Never commit secrets, service-role keys, access tokens, or production credentials.
- Never expose a Supabase service-role key in browser code.
- Do not print secret values during diagnostics. Refer to environment-variable names only.
- Use migrations for schema changes. Do not perform undocumented destructive SQL.
- Review RLS implications for every database change.
- Do not disable RLS to make a feature work.
- Do not delete tables, columns, buckets, policies, functions, or user data without explicit approval, a dependency audit, and a rollback plan.
- Preserve stable IDs and existing content relationships.
- Prefer small, reviewable changes over a sweeping rewrite.
- Reuse established components and patterns before creating new abstractions.
- Keep accessibility, responsive behavior, loading states, errors, and empty states in scope.
- Run the repository's existing lint, type-check, test, and build commands after changes.
- If no tests exist for a changed high-risk flow, propose the smallest useful coverage.
- Explain files changed, database impact, verification performed, risks, and any manual follow-up.

## 13. Required first task for Copilot

Do not begin by implementing a feature. First perform a read-only current-state audit.

### Audit goals

1. Read this handoff and the repository's README, package files, configuration, migrations, and existing instruction files.
2. Inspect the route structure, feature modules, shared components, hooks, Supabase client code, and environment-variable usage.
3. Inspect the connected Supabase schema, RLS policies, storage buckets/policies, database functions, and migration history if access is available.
4. Run the documented install, lint, type-check, test, and build commands without “fixing” failures yet.
5. Map implemented, partial, mocked, dead, and missing features.
6. Check the repository for stale “Vent Room” and “Weekly Challenge” language.
7. Trace the beta core loop end to end.
8. Compare code and database assumptions and list every mismatch.
9. Identify security, privacy, moderation, accessibility, mobile, and launch blockers.
10. Produce a prioritized audit report and stop for Kevin's approval before making material changes.

### Required audit output

Create or return a report with:

- Executive summary
- Current stack and architecture
- Build/test results with exact commands
- Route and feature inventory
- Core-loop trace
- Supabase schema/RLS/storage findings
- Content and Notion/Supabase sync findings
- Security and privacy risks
- Mobile/PWA findings
- App Store readiness gaps
- Confirmed stale terminology
- Quick wins
- Blockers grouped as critical, high, medium, and low
- Recommended next three tasks
- Questions that require Kevin's decision
- Explicit statement that no application code or production data was changed during the audit

## 14. Ready-to-paste first prompt for Copilot

Paste the following into Copilot after placing this document in the repository:

> Read `creative-review-copilot-handoff.md` and all repository instruction files completely. Your first assignment is a read-only audit of the current Creative Review repository and its connected Supabase project. Do not implement features, modify production data, change the database schema, install new dependencies, rewrite architecture, or clean up code yet. Verify the active branch and working tree, inspect the implementation and migrations, run the existing safe checks, trace the beta core loop, and compare the real code/database state against the handoff. Return the required audit report, identify conflicts and risks, recommend the next three tasks, and stop for my approval.

## 15. How future work should be requested

Give Copilot one bounded task at a time. A good task includes:

- The user-visible outcome
- The affected flow or screen
- What must remain unchanged
- Acceptance criteria
- Whether Supabase or Notion changes are authorized
- Required tests
- A stop condition if the implementation differs from the assumption

Example:

> Fix the Activity screen so an authenticated user can see and mark their own notifications as read. Preserve the current design system and navigation. Do not change unrelated tables or notification-generation logic. First inspect the existing component, query, schema, and RLS policies. Then give me a brief implementation plan. After approval, make the smallest change, add or update relevant tests, run lint/type-check/build, and report exactly what changed.

## 16. Definition of done for implementation tasks

A task is not complete until Copilot reports:

- The requested behavior works
- Existing nearby behavior remains intact
- Relevant permission and RLS behavior was checked
- Loading, empty, error, and mobile states were considered
- Tests/checks and their results
- Files and migrations changed
- Any manual setup or external-service step Kevin still has to perform
- Remaining limitations or risks

