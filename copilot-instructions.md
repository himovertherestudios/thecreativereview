# The Creative Review — Repository Instructions for GitHub Copilot

Read `creative-review-copilot-handoff.md` before planning or changing this project.

## Product

- The Creative Review is an invite-only, 18+ creative critique community founded by Kevin Russell.
- The tagline is **Real Feedback. Level Up.**
- The core beta loop is `signup → consent/profile → upload → critique → return/apply feedback`.
- User-facing community discussion is called **The Corner**. Do not use “Vent Room.”
- Use **Monthly Challenge**, not “Weekly Challenge.”
- The voice is direct, familiar, specific, culturally aware, and practical. Avoid generic startup or motivational copy.
- Protect consent, privacy, NSFW controls, reporting, moderation, and account deletion as core requirements.
- Do not add popularity mechanics, leaderboards, heavy gamification, AI critique, or other deferred features without explicit approval.

## Architecture

- Preserve the existing Vite + React + TypeScript + Tailwind + Supabase architecture.
- Keep the Vercel web deployment path and later Capacitor packaging direction.
- Do not rewrite this application in Next.js before the store launch.
- Reuse current components, tokens, utilities, data-access patterns, and route conventions.

## Working method

- Inspect before editing. Verify the branch, `git status`, relevant code, migrations, and actual Supabase state.
- Treat the current repository and connected Supabase project as implementation truth. Report conflicts with planning documents instead of silently resolving them.
- Preserve unrelated user changes and working behavior.
- Make the smallest reviewable change that satisfies the task.
- Do not make destructive schema or data changes without explicit approval and a rollback plan.
- Use migrations for schema changes and evaluate RLS for every database task.
- Never disable RLS as a workaround.
- Never expose or print credentials. Service-role keys must never enter browser code.
- Supabase is the runtime content source. Notion under Kevin's 1006 dashboard is the editorial workflow unless current project code documents a different sync contract.
- Do not bulk overwrite, reseed, renumber, or delete tip content without approval and a parity/rollback check.
- Run the repository's existing lint, type-check, test, and build commands after changes.
- Include accessibility, responsive/mobile behavior, loading, empty, error, and retry states where relevant.

## Reporting

For every implementation task, report:

- What changed and why
- Files and migrations changed
- Database/RLS/storage impact
- Commands and tests run with results
- Manual steps Kevin must perform
- Remaining risks or limitations

When the requested behavior or repository state is ambiguous, stop and ask for the smallest decision needed. Do not invent product requirements.
