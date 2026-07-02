# Changelog

All notable changes to FreelanceBot are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
See [VERSIONING.md](./VERSIONING.md) for the release process.

## [Unreleased]

_Anything not yet shipped goes here. Empty between releases._

---

## [v0.11.5] — 2026-07-02

Demo reel usability + polish overhaul — smoother, faster, seekable, extension-friendly.

### Changed
- **Scene reveal delays compressed 60–70%** — scene 2 deductions fire at 0.7/1.0/1.3/1.6s instead of 1.7/2.3/2.9/3.5s. Counter animation ticks at 0.8/1.1/1.4/1.7s. Scene 3 nodes/verdict now show inside 3 seconds instead of 5+. Kills the "waiting" feeling the reel had between reveals.
- **Scene durations shortened** — scene 1 (7s), 2 (12s), 3 (10s), 6 (8s), 7 (10s) since content reveals faster now. Total runtime **2:07** (down from 2:30).
- **Transitions upgraded** — scenes now fade in with scale (1.035 → 1) + blur (10px → 0) rack-focus over 500–750ms cubic-bezier. Adds cinematic depth without being busy.
- **Font sizes right-sized** — scene 2/3/6 h1 96px → 68px, verdict 72px → 52px, tutorial h1 80px → 52px. Fixes overflow on 900px viewports and looks better proportioned.

### Added
- **Seekable progress bar** — click anywhere on the timeline to jump to that timestamp. Bar has tick marks at each scene boundary.
- **Arrow key seek** — `←` / `→` jump to prev/next scene start. `Shift + ← / →` scrub ±5 seconds.
- **`?tts=off` URL param** — disables the built-in Web Speech synthesis so a Chrome extension (ElevenLabs Reader, Speechify, NaturalReader) can do the voiceover instead. Prevents double-audio.
- **`voiceover-script.md`** — new file at repo root with all TTS narration cleanly formatted per scene, ready to paste into ElevenLabs / Speechify / NaturalReader for pro voice quality. Includes cue timings, char counts, and 3 recording workflows (pre-generated MP3, editor sync, live).

### Why
User feedback in v0.11.3–v0.11.4 testing:
1. "Text kepotong" — overflow fixed by reducing font sizes + centering justify-content.
2. "Ga bisa skip video ke detik berapa" — added seek bar + keyboard shortcuts.
3. "Suaranya terlalu AI" — added `?tts=off` + voiceover-script.md for extension-based human voice.
4. "Nunggu antar slide 1–5 detik" — compressed all reveal delays.
5. "Transisi ga smooth, ga aesthetic" — replaced flat opacity fade with scale + blur cinematic transitions.

---

## [v0.11.4] — 2026-07-02

Demo reel polish — clean recording state, click-to-start gate, wider viewport fill.

### Changed
- **REC dot + SCENE label removed by default** — no more debug chrome overlaid on the recording. Controls bar still available on hover / H key toggle.
- **Click-to-start gate** — landing screen with big "Click to start" button. Solves two problems: unlocks browser TTS (which requires user gesture) and auto-triggers `requestFullscreen()` so recording captures the whole viewport without browser chrome.
- **Wider stage** — scene padding reduced from `3vh 5vw` to `2vh 3vw`; tutorial browser mockup widened from 92% (max 1500px) to 96% (max 1720px). Fills the frame far more aggressively when recording at 1920×1080.
- **Scene transitions** — fade from 700ms → 250ms. Less dead time between scenes.
- **TTS priming** — silent warm-up utterance forces Chrome to load voices before the first spoken line, eliminating the "first scene has no voice" bug some browsers hit.

### Voice quality notice
Browser TTS remains robotic. For a production-quality voiceover, use one of:
1. **Record your own voice** with QuickTime microphone while the reel plays muted
2. **ElevenLabs / Play.ht** — paste the TTS strings from the `SCENES` array, generate MP3, dub over the muted recording

---

## [v0.11.3] — 2026-07-02

Cinematic auto-playing demo reel at `/demo-reel.html` — 2:30 runtime, browser TTS voiceover, no MP4 required at the source.

### Added
- **`public/demo-reel.html`** — single-file cinematic demo reel, ~3000 lines. Seven scenes: logo intro (8s) → problem counter (20s) → solution flow (18s) → client tutorial 6-step (40s) → freelancer tutorial 6-step (40s) → tech credentials (12s) → closing CTAs (12s). Total 2:30. Auto-plays through with:
  - Web Speech API TTS narration synced per scene
  - Web Audio API SFX (whoosh, ding, cash tick)
  - Canvas particle background with connecting lines
  - SVG grain + scanline overlay for cinematic feel
  - Animated cursor with click ripples inside tutorial mockups
  - Narrator bubble that updates per step
  - Progressive step counter chips
  - Kinetic typography with blur→sharp entrances
  - Controls: pause, restart, hide-UI, progress bar
  - Keyboard shortcuts: space, r, h, f (fullscreen)
- **Recording workflow** — user opens `demo-reel.html` in Chrome → F11 fullscreen → click canvas once to unlock audio → hit Play → QuickTime (Mac) or OBS (cross-platform) records the playback → export MP4 → upload YouTube unlisted → paste link in Ignyte submission.
- Voice-quality upgrade path: extract TTS strings, run through ElevenLabs/Play.ht for studio voice, dub over the muted recording in DaVinci Resolve.

### Why
Manual screen recording with voiceover is a full-day production job for a solo hackathon submitter. This reel is a one-hour route to a professional-looking submission video with zero voice acting required. If browser TTS quality is insufficient, the same reel doubles as a visual bed for AI-voice dubbing.

### Companion skill
The pattern is also shipped as an installable skill (`demo-reel-builder.skill`) so future Claude sessions can produce the same kind of reel for any project by reading its README + package.json and customizing scenes.

---

## [v0.11.2] — 2026-07-02

Real demo asset in the README — no more TODO placeholders.

### Added
- `public/marketplace-flow.gif` (833 KB, 1568×761, 8 frames) — captured live from `freelancebot-alpha.vercel.app` showing landing → click Marketplace → filter by Development → open job → apply form. Recorded via the Claude in Chrome MCP `gif_creator` tool with click indicators + progress bar overlays.
- README `## Demo` section now embeds the GIF at the top with a caption, replacing the previous "TODO for tarjo" placeholder block and the empty screenshot table. Removes the "how to take screenshots yourself" instructions block.

### Changed
- Roadmap: Week 7 checkbox ticked (frontend on-chain wiring, polish, marketplace, ratings, settings, docs, OWASP hardening — v0.7 through v0.11.2 all shipped in this window). Week 8 rewrites to "Record video, submit to Ignyte" — the only two things left.

### Why
Judges landing on the GitHub repo now see a real animation of the app working before they read a single word of prose. Previous README had a placeholder that screamed "unfinished". This closes that gap without cost.

---

## [v0.11.1] — 2026-06-30

AI security hardening — OWASP LLM Top 10 mitigations on the agent.

### Hardened
- **LLM01 Prompt Injection** — `SYSTEM_PROMPT` rewritten with explicit, named hard constraints. The agent is told to treat all user content (brief, deliverable URL, chat) as untrusted data, not commands. A new `sanitizeForLLM()` server-side filter strips control characters, neutralizes role-impersonation markers (`system:`, `assistant:`, etc), and redacts common jailbreak phrases (`ignore previous instructions`, `you are now in admin mode`, `disregard prior instructions`) before any user content is forwarded to the model.
- **LLM02 Insecure Output Handling** — `verifyDeliverable` no longer trusts a `verified: true` claim from the LLM. The boolean is now **server-derived** from the LLM's structured `alignment` and `confidence` fields, all of which are strictly enum-coerced. A `matches + high` claim from the LLM is automatically downgraded to `medium` because the model only sees the URL string, not the actual contents.
- **LLM06 Sensitive Info Disclosure** — system prompt explicitly forbids revealing private keys, seed phrases, mnemonics, or API tokens, even if the user claims to be the platform admin.
- **LLM08 Excessive Agency** — system prompt declares the agent ADVISORY-only and lists the contract admin functions (`setAgent`, `setAgentFee`) it must never call. (Backend has no path to those functions anyway; this is belt-and-suspenders.)
- **LLM09 Overreliance** — verdicts always include a confidence level; reasoning is bounded to 1000 chars; UI keeps surfacing "Hold for review" on anything below `matches + high`.
- **SSRF guard** — `isUrlReachable` now refuses `localhost`, `127.x`, `10.x`, `172.16-31.x`, `192.168.x`, link-local IPv6 (`fe80:`, `::1`), `.local`, `.internal`, and non-HTTP(S) schemes (no `file://`, `javascript:`, `data:`). A malicious freelancer cannot use the verifier to probe internal infra.

### Added
- `/docs#agent` gains a "Security model (OWASP LLM Top 10)" subsection enumerating exactly which classes of attack are mitigated and how. Visible to anyone who reads the docs — useful as a credibility signal for hackathon judges.

### Why this matters for the demo
Hackathon judges (especially Circle / Arc folks) will probe the agent. Now the answer to "what stops me from prompt-injecting the verifier into releasing without delivering?" is mechanical and concrete: the server doesn't take the LLM's word for `verified`; the boolean is computed from typed enum fields, and even those are downgraded when the model couldn't actually inspect the contents.

---

## [v0.11.0] — 2026-06-30

Marketplace credibility layer (ratings + social shill links), basic Settings page, full Docs/whitepaper page, plus polish: min order = 0, landing CTAs cleaned up, "GitHub repo" / "PRD" wording fixed, version pill moved to footer, sidebar Resources pinned to bottom-left.

### Added
- **Ratings system** — `ratings` table (1–5 stars + optional comment) with unique constraint per (order, rater, ratee). Three new components: `RatingStars` (display), `UserBadge` (inline trust pill with avg + count), `RatingForm` (post-release submission). New API: `POST /api/ratings`, `GET /api/ratings?order_id=N|email=X|email=X&summary=1`. Guards: only parties of released orders can rate the counterparty; one rating per direction. UserBadge appears next to client/freelancer emails on `/orders/[id]` meta strip.
- **`client_links` on orders** — JSONB column for `{ x, github, website, linkedin }`. New "credibility" section in `CreateOrderForm` (collapsible, pre-fills from Settings defaults). Displayed as social chips on `/jobs/[id]` next to "Posted by".
- **Settings page (`/settings`)** — Basic, intentionally non-fatal config:
  - Profile defaults (X / GitHub / website / LinkedIn) — auto-fill on order posting
  - Theme picker (Light + Dark/System placeholders pending v0.12.0)
  - Language selector (EN / Chinese / Spanish / Hindi / Arabic) — preference stored; full UI i18n lands MVP 2
  - Email notifications — opt-in toggles for new application / status change / agent verdict (wiring lands next milestone)
  - Privacy & security notes — explicit "we never ask for keys" disclosure
  - Signed-in sessions sign-out controls
  - About + Links sidebar
- **Docs / whitepaper page (`/docs`)** — Single-page, comprehensive product documentation:
  - 11-section table of contents (sticky on desktop)
  - Sections: Overview · Problem · Solution · Lifecycle · Marketplace · Trust · Agent · Contract · Privacy · Roadmap · FAQ
  - Custom typography theme via `.prose-doc` styles
  - Inline `Steps`, `Callout`, `Q` (FAQ) micro-components
- **Sidebar Resources moved to bottom-left** — pinned to bottom of AppShell sidebar so it doesn't crowd the nav.

### Changed
- **Min order amount: 0** — allow $0 USDC orders (microtasks / pro-bono). API + form validation updated.
- **Landing CTAs cleaned up** — removed "Star the repo" (dev-jargon, not useful for end users). Primary hero CTA: "Open live demo"; secondary: "Read the docs". Final CTA: "Try live demo" + "Read the docs".
- **"PRD" nav link → "Docs"** — points to the new `/docs` page instead of the GitHub-hosted PRD.md. PRD.md is still linked from Settings → Links and from the Docs Roadmap section.
- **"GitHub repo" / "GitHub repository" → "GitHub"** everywhere (AppShell sidebar, AppHeader, Settings, footer). Removes dev-jargon.
- **Version pill removed from headers** — moved into landing page footer as a small inline mention. Headers are visually cleaner.
- **Landing nav expanded** — added Marketplace + Docs links to the nav pill.

### Schema migration required

Re-apply `supabase/schema.sql` in your Supabase SQL Editor. It's idempotent and safe over existing data. Adds:
- `orders.client_links jsonb default '{}'`
- New `ratings` table with indexes + unique constraint
- RLS enabled on ratings (policies in MVP 2)

### Security notes (the "guard" doctrine)
- Mutating routes continue to require `actor_email` and verify party membership.
- Rating routes additionally require the order to be `released` and the ratee to be the counterparty.
- Settings page lives entirely in browser localStorage — no secrets, no API keys, no contract config.
- Explicit security disclosure rendered in Settings: "We never ask for API keys, private keys, or wallet seed phrases."

---

## [v0.10.1] — 2026-06-30

Restore the white-blue logo mark across all headers.

### Added
- Logo image (`/logo-mark.svg`) now displays in:
  - Landing hero header (44×44 with wordmark + "PAYOUTS · ON ARC" tagline)
  - App shell sidebar header (32×32)
  - AppHeader used by EmailGate sign-in screen (40×40)
- Logo SVG repainted with a cyan→blue→indigo gradient fill and bright white "F" + white pulse dot. Matches the new energetic palette while keeping the original white-on-blue identity.

### Changed
- Version pill bumped to `v0.10.1` in headers.

---

## [v0.10.0] — 2026-06-30

Full UI revert to bright, energetic light theme (putih + biru + multi-accent gradients). README priority flip: "use the demo" first, "self-host" later.

### Visual
- **Light theme everywhere** — landing, app pages, components. Replaces the dark luxe Orbis aesthetic introduced in v0.7.0–v0.8.0. White surfaces, slate-900 text, brand-blue accent.
- **Energetic palette** — multi-color radial gradient backgrounds on Hero + CTA (sky, indigo, pink, cyan tints). Stat cards use color-coded gradient backgrounds (sky / amber / emerald / indigo / rose) matching their meaning.
- **`.btn-gradient` utility** for primary CTAs — cyan→blue→indigo gradient with glowing shadow + scale on hover. Used on landing CTA, post-job, accept-application, browse-marketplace buttons.
- **Liquid-glass remapped to light** — soft white card with sky-200 ring + subtle shadow instead of dark backdrop blur. `:where(.liquid-glass)` selector keeps Tailwind positioning utilities winning.
- **`bg-warm`** alternate background for sections that want warm pastels (amber + pink + cyan tints) instead of cool sky+indigo.

### Semantic tokens (light remap)
| Token   | Old value (dark)  | New value (light)        |
|---------|-------------------|--------------------------|
| `ink`    | `#010828`        | `#ffffff`                |
| `cream`  | `#EFF4FF`        | `#0f172a` (slate-900)    |
| `signal` | `#00D18C` (green) | `#0ea5e9` (brand blue)   |
| `glass`  | white tint        | dark-on-light tint       |

Token names kept so existing class usage works without rename — just remap.

### README priority flip
- **Lead with "Try the live demo"** — 9-step walkthrough using the hosted instance at `freelancebot-alpha.vercel.app`. No install, no clone required.
- **"For contributors and self-hosters" section** moved below the demo walkthrough. Install + run + compile + deploy steps are still there, just no longer the first thing visitors see.
- Reason: previously the README looked like a self-host template, implying "you need to redeploy this yourself." But the project IS the hosted demo. Demo-first communicates: "this works, click and try" — like a Stripe-style product README.

### Files touched (refactor pass)
- `tailwind.config.ts`, `src/app/globals.css`, `src/app/layout.tsx`
- `src/app/page.tsx` (landing)
- `src/app/client/page.tsx`, `src/app/freelancer/page.tsx`, `src/app/jobs/page.tsx`, `src/app/jobs/[id]/page.tsx`, `src/app/orders/[id]/page.tsx`, `src/app/freelancer/applications/page.tsx`
- `src/components/AppShell.tsx`, `src/components/AppHeader.tsx`, `src/components/EmailGate.tsx`, `src/components/WalletStatus.tsx`, `src/components/StatusBadge.tsx`, `src/components/OrderCard.tsx`, `src/components/CreateOrderForm.tsx`, `src/components/AgentChat.tsx`, `src/components/OrderActions.tsx`, `src/components/ApplicationsList.tsx`, `src/components/AttachmentsList.tsx`, `src/components/FileDropzone.tsx`, `src/components/LiveJobsPreview.tsx`
- `README.md`

### What is NOT changed
- All v0.9.0–v0.9.2 functionality (marketplace, applications, attachments, auth guards) stays intact.
- API surface, schema, contract — untouched.
- Anton + Condiment + JetBrains Mono fonts retained.
- Sidebar nav structure retained.

---

## [v0.9.2] — 2026-06-30

File attachments on orders (images, PDFs, docs) with privacy honoring the order's public/private flag.

### Added
- **`FileDropzone` component** — drag-and-drop or click-to-upload widget. Uploads directly from the browser to Supabase Storage (bucket `attachments`), no server hop. Constraints: ≤ 8 MB per file, ≤ 6 files per order, image / PDF / doc / spreadsheet / text / csv / zip MIME types only. Shows live progress, lets the user remove uploaded files before submitting.
- **`AttachmentsList` component** — read-only display. Images render as a thumbnail grid, other files render as a download list with type icon + size. Honors privacy: if the order is private and the viewer is not a party, shows a lock notice instead of the file list.
- **`CreateOrderForm` attachment field** — new section between Brief and Amount/Deadline. Hint text changes based on Public vs Private mode so the client knows who'll see them.
- **Attachment count badge** on `/jobs` cards (paperclip icon + count).
- **Attachments panel on `/orders/[id]`** — shown in a liquid-glass card under the meta strip.
- **Attachments section on `/jobs/[id]`** — shown above the "Posted by" footer.

### Changed
- `orders.attachments` is now a `jsonb` column on the `orders` table (default `'[]'`). Stored as an array of `{ filename, url, size_bytes, content_type, uploaded_by, created_at }` objects.
- `POST /api/orders` accepts an `attachments` array.
- `createOrder` (`lib/orders.ts`) accepts the array, defaults to `[]`.

### Storage
- New Supabase Storage bucket `attachments` (public). Migration script in `supabase/schema.sql` is idempotent:
  - inserts the bucket if missing,
  - adds `attachments_public_read` policy if missing,
  - adds `attachments_public_write` policy if missing.
- Privacy is currently enforced at the application layer (UI hides files for non-parties on private orders). Per-file signed URLs + per-user paths land alongside real auth in MVP 2.

### Re-apply schema migration

Run `supabase/schema.sql` again in your Supabase SQL editor. Idempotent — safe over existing data. Required for v0.9.2 because of the new `attachments` column and storage bucket setup.

---

## [v0.9.1] — 2026-06-30

Applications UI + API auth guards. Only the parties of an order can act on it.

### Added
- **`ApplicationsList` component** on `/orders/[id]` for client viewing a public order. Shows all applicants with pitch + counter-bid, accept/reject buttons. Accepting auto-assigns the freelancer and flips the order private (escrow flow resumes).
- **`/freelancer/applications` page** — freelancer sees all their applications grouped by status (pending / accepted / rejected). Stats row + links back to each job.
- **`assertActorIsParty(orderId, email)`** helper in `lib/orders.ts` that resolves an order + the caller's role on it (client / freelancer / null). Single source of truth for API guards.
- **`readActorEmail()`** helper in `lib/api.ts` reads the appropriate signed-in email from localStorage and is passed automatically by all mutating client-side calls.

### Security (the "guard" requirement)
Every mutating API route now enforces that the caller is a party to the order. Spoof risk is acknowledged — real auth (Supabase Auth magic link / Circle Wallets) lands in MVP 2 and is documented in `PRD.md`.

- `POST /api/agent` — caller must be the order's client or freelancer. The `role` field is what the user claims; the server verifies it matches the actor's actual role.
- `POST /api/verify` — caller must be the order's FREELANCER (only the freelancer can submit a deliverable).
- `PATCH /api/orders/[id]` — caller must be a party (client or freelancer).
- `GET /api/orders/[id]?actor_email=...` — anyone can read order metadata, but the chat thread is only returned to parties.
- `PATCH /api/applications/[id]` —
  - `accepted` / `rejected` — only the order's client can decide.
  - `withdrawn` — only the applicant freelancer can withdraw their own.

### Changed
- `lib/api.ts` `sendChat`, `verifyDeliverable`, `patchOrder`, `getOrder`, `decideApplication` now accept an optional `actorEmail` override and fall back to `readActorEmail()` based on the inferred role.
- All call sites updated to pass actor_email implicitly via localStorage.

### Why this matters
Before v0.9.1, anyone who knew an order ID could (a) impersonate the client or freelancer in chat, (b) flip status (mark released), (c) accept/reject applications on someone else's job. Now those routes return 403 unless you're a verified party.

---

## [v0.9.0] — 2026-06-12

Public marketplace + applications. Anyone can browse open jobs and apply.

### Added
- **Public marketplace page `/jobs`** — anyone (no sign-in) can browse open jobs, filter by field (Design / Dev / Writing / Video / Marketing / Research / Other), budget range, free-text search. Grid of liquid-glass cards with field emoji, title, brief preview, budget, deadline.
- **Job detail page `/jobs/[id]`** — full brief + meta + apply form (email, optional pitch, optional counter-bid). Closed jobs show "no longer open" state pointing back to feed.
- **Live jobs preview on landing** — new `LiveJobsPreview` section between FLOW and CTA showing the 6 newest public jobs. Non-logged-in visitors see real activity immediately. Skeleton loading state and graceful empty state ("Be the first to post").
- **`POST /api/applications`** — freelancer applies to a job (email + pitch + bid_amount_usdc).
- **`GET /api/applications?order_id=X`** — list applicants for a job (client view).
- **`GET /api/applications?email=X`** — list a freelancer's applications.
- **`PATCH /api/applications/[id]`** — accept / reject / withdraw. Accepting assigns freelancer to the order and flips `is_public` to false.
- **`GET /api/jobs`** — public feed with field/min/max/q/limit query params.
- **CreateOrderForm overhaul** — toggle between **Public marketplace** (lists on /jobs, accepts applications) and **Direct (private)** (goes straight to a specific freelancer email, current MVP behaviour). Field-category chip selector. Title field for the public listing. Different submit copy + footer hint per mode.

### Changed
- `orders` Supabase schema gains `field text default 'other'`, `is_public boolean default false`, `title text`. Indexes on `(is_public, field)` and `(status)`. Idempotent migration safe to re-run.
- New `applications` table — `order_id`, `freelancer_email`, `pitch`, `bid_amount_usdc`, `status (pending|accepted|rejected|withdrawn)`. Indexed by order and freelancer.
- `lib/orders.ts` exports `FIELDS` constant + `Field` type. Adds `listOpenJobs`, `setOrderFreelancer`, plus full applications CRUD.
- `lib/api.ts` browser client gains `listJobs`, `applyToJob`, `listApplicationsForOrder`, `listMyApplications`, `decideApplication`.
- `POST /api/orders` accepts `title`, `field`, `is_public` in body.

### Marketplace flow (end-to-end)
1. Client visits `/client` → "+ New order" → toggle Public, pick category, add title + brief + budget → "Post to marketplace".
2. Order appears on `/jobs` feed and on landing's "Live jobs" section.
3. Freelancer browses `/jobs`, filters by field, opens `/jobs/[id]`.
4. Freelancer fills apply form → application created in DB.
5. Client sees applications under their order (UI for accept/reject lands in v0.9.1).
6. On accept: order's `freelancer_email` is set, `is_public` flips false → escrow flow proceeds as before (fund → deliver → release).

### Schema migration

If you forked an earlier version, re-run `supabase/schema.sql` in your Supabase
SQL editor. The file is idempotent — safe to apply on top of existing data.

---

## [v0.8.0] — 2026-06-12

Dark luxe extends to all app pages. Real dashboard shell with sidebar nav, filters, search, and proper empty states.

### Added
- **`AppShell` component** with persistent left sidebar nav (Client · Freelancer · Marketplace · Activity · Settings), sticky top header with logo + wallet pill, collapsible mobile drawer, and resource links section (GitHub, PRD, contract on arcscan).
- **Filter + search** on `/client` and `/freelancer` order lists. Filter by status (All / Draft / Funded / Delivered / Released / Refunded). Free-text search across brief, counterparty email, and order ID.
- **Stats row** on both dashboards: Total orders · Active · Released · Locked-in-escrow USDC (client) / Total earned USDC (freelancer).
- **Polished empty state** on `/client` with onboarding tip cards (Fund · Verify · Release) instead of a blank panel.
- **"Browse marketplace" CTA** on `/freelancer` linking to `/jobs` (v0.9.0 placeholder) so freelancers without active orders have a next step.

### Changed
- All app routes (`/client`, `/freelancer`, `/orders/[id]`) and shared components (`EmailGate`, `OrderCard`, `CreateOrderForm`, `AgentChat`, `OrderActions`, `StatusBadge`) refactored to **dark luxe theme** matching the landing — no more jarring light/dark transition at app boundary. Liquid-glass surfaces, signal-green primary action, JetBrains Mono labels, Anton uppercase headings.
- Body background in `layout.tsx` switched from `bg-slate-50` to `bg-ink text-cream` for consistent dark across all routes.
- `StatusBadge` colors swapped to dark-bg-friendly ring + tinted backgrounds (`bg-signal/15 text-signal ring-signal/40` etc).
- `OrderCard` now shows on-chain badge when `onchain_id` is set, with hover-state signal-green ring + animated arrow.
- `AgentChat` bubbles re-styled — viewer's messages in solid signal-green, agent messages in subtle signal-tinted glass, role labels in mono uppercase.

### Notes
- App routes intentionally match landing's dark luxe palette now. The previous app/landing split was confusing UX.
- Marketplace feed (`/jobs`) shown in sidebar with "v0.9" badge — that's where the public job browse + apply flow ships next.
- Theme toggle (light variant) deferred to a later release; defaults to dark for consistency with the brand.

---

## [v0.7.2] — 2026-06-12

Fix CTA layout collision + liquid-glass CSS specificity bug.

### Fixed
- **Section 4 CTA layout** — vertical social-icon stack was stretching horizontally and colliding with the action buttons on desktop. Root cause: `.liquid-glass` CSS class hard-set `position: relative` with higher specificity than Tailwind utilities, so the `absolute` Tailwind class on the social icons was being silently ignored and the element collapsed into normal flow at full container width. Rewrote the section as a CSS Grid with explicit columns (`auto_1fr`) — social icons live in their own column (no positioning hack required) and the heading + buttons live in the next column, right-aligned on desktop.
- **`.liquid-glass` specificity** — wrapped the selector in `:where()` so the rule has 0 specificity. Tailwind positioning utilities (`absolute`, `fixed`, etc.) now override the default `relative` cleanly without `!important` wars. The `::before` border-gradient still positions correctly because the default is still `relative`.

### Changed
- "Go beyond" cursive accent moved from `position: absolute` floating above the heading (which leaked off-screen at some viewport widths) into a normal-flow `<span>` directly above the heading. Reads cleaner and no longer escapes the section.
- Star/PRD CTA buttons now full-width-stack on mobile and inline-on-desktop, both with `justify-center` for consistent visual weight.

---

## [v0.7.1] — 2026-06-12

Fix Vercel build failure from v0.7.0.

### Fixed
- Added `lucide-react@^0.460.0` to `dependencies`. v0.7.0 introduced heavy use of `lucide-react` icons in the new landing (`Mail`, `Twitter`, `Github`, `ArrowRight`, `ChevronRight`, `Wallet`, `Sparkles`, `CircleCheckBig`), but the package was never declared as a direct dependency. Vercel's fresh `npm install` (no cached `node_modules`) failed module resolution. Earlier builds succeeded incidentally because the package was present in cached state.

---

## [v0.7.0] — 2026-06-12

Landing page full pivot to Orbis-style dark luxe.

### Added
- **New landing page (`src/app/page.tsx`)** — full Orbis-inspired redesign with four sections:
  1. **HERO** — uppercase Anton heading, "agentic payouts" Condiment cursive accent in signal-green, liquid-glass nav, CTA buttons, 4-stat strip.
  2. **ABOUT** — "Hello. I'm FreelanceBot" with "open source" cursive, orbital decoration with animated signal-green dot, 4 liquid-glass stat cards.
  3. **LIVE FLOW** — 3-card grid replacing the NFT collection grid concept: Client funds → Agent verifies → Freelancer paid, each with animated signal-green dot inside an orbit ring, liquid-glass KPI overlay bar with circular gradient chevron button.
  4. **CTA** — "Go beyond" cursive, "Join us / Fork the repo / Ship your own / Follow the signal" heading, vertical social icons.
- **`liquid-glass` CSS utility** in `globals.css` (Apple Vision Pro-ish backdrop blur with subtle inset border gradient).
- **`bg-space`, `bg-stars`, `texture-overlay`** CSS utilities — pure CSS stars + radial gradient nebula + SVG noise overlay. No CDN videos = saves ~35 MB on first load (critical for emerging-market 3G/4G).
- **Three Google Fonts** via `next/font/google`: **Anton** (display), **Condiment** (cursive accent), **JetBrains Mono** (body).
- Tailwind tokens: `ink` (#010828), `cream` (#EFF4FF), `signal` (#00D18C — money green, not the original highlighter #6FFF00), `glass`. Plus `font-display`, `font-script`, `max-w-landing` (1831px).
- Animations: `orbit` (28s rotation of decorative dot), `flow` (8s pulse for step cards).

### Changed
- `src/app/layout.tsx` — registers the three Google Fonts and exposes them as CSS variables on `<html>`. Body background stays `bg-slate-50` so app routes (`/client`, `/freelancer`, `/orders`) keep their light/clean fintech look — only `/` lives in the dark luxe world.
- `tailwind.config.ts` — new color tokens, font families bound to next/font CSS variables, `max-w-landing` and the two animations.

### Design rationale
- **Signal-green over highlighter-green** — psychological fit: money/trust products (Wise, Robinhood, Mercury) trend toward teal/emerald rather than radioactive lime.
- **No CloudFront videos** — original Orbis spec used four 6–15 MB MP4s. For a globally distributed open-source product targeting emerging markets, that bandwidth is prohibitive. CSS-only approximation keeps the visual energy at <200 KB initial paint.
- **App routes intentionally stay light** — payment UI trust signals (Stripe, Wise, Mercury) lean light. Dark stays in the marketing/storytelling layer.

---

## [v0.6.0] — 2026-06-12

On-chain wiring, product roadmap, and versioning system.

### Added
- **On-chain fund + release flow** in the UI. The "Fund USDC" and "Approve & release" buttons now call the deployed `FreelanceEscrow` contract on Arc Testnet via ethers + MetaMask, instead of just patching the DB. Approval tx + fund tx are signed by the user's wallet, the on-chain order id is parsed from the `OrderFunded` event and synced into Supabase. Transaction hash links to arcscan after confirmation.
- **`WalletStatus` header component** showing connected address + USDC balance, with auto-reconnect on page load and one-click MetaMask connection that auto-adds Arc Testnet if missing.
- **Multi-LLM-provider readiness (groundwork)** — agent system prompt now explicitly requests language-matched replies; pattern extracted for swap to OpenAI/Anthropic/Ollama in MVP 2.
- **`PRD.md`** — full product requirements doc covering MVP 1 (shipped) and MVP 2 (roadmap), stack recommendations, governance, success metrics, and 10 risks with mitigations.
- **`VERSIONING.md`** + this `CHANGELOG.md` + npm `release:major|minor|patch` scripts.
- **Video infra:** `video_demo_script.md` gained a compression section (HandBrake GUI + FFmpeg one-liner targeting < 25 MB); new `docs/video/` folder explains YouTube/Releases distribution and why raw video should not be committed.

### Changed
- `src/lib/contracts.ts` rewritten with proper ABIs, USDC helpers, `connectWallet()` with chain switch/add, and read/write provider factories.
- `OrderActions` falls back to the previous simulated-PATCH flow if `NEXT_PUBLIC_ESCROW_ADDRESS` is not configured, so forks without a deployed contract still demo cleanly.

### Notes
- Reference instance contract: [`0xA8CA04560603951b0f0e803039B059432F673ae4`](https://testnet.arcscan.app/address/0xA8CA04560603951b0f0e803039B059432F673ae4) (Arc Testnet, source verified).
- Bundle weight: ethers v6 still in use; `viem` migration is on the MVP 2 roadmap.

---

## [v0.5.0] — 2026-05-25

Submission polish. README rewrite, logo identity, structured logging, retry helpers, Codespaces support.

### Added
- **Visual identity:** `public/logo.svg` (full wordmark with animated agent-pulse), `public/logo-mark.svg` (favicon), `public/og-image.svg` (1200×630 Open Graph card).
- **Structured logger** (`src/lib/logger.ts`) — JSON in production, pretty in dev, `LOG_LEVEL` filter, zero dependencies.
- **Retry/backoff helper** (`src/lib/retry.ts`) — exponential backoff with full jitter, smart skip of non-retryable 4xx errors. Wired into Groq calls + browser fetch.
- **Multi-language agent system prompt** — auto-detects user language (ID/EN/Tagalog/Vietnamese/...) and replies in kind.
- **Open Graph + Twitter card meta** in `src/app/layout.tsx`, favicon set.
- **README rewrite** — centered banner with logo, shields.io badges (live, contract, license, stack), demo placeholders + GIF instructions, feature bullet list.
- **`docs/README.md`** — instructions for taking screenshots and recording a GIF demo.
- **`.devcontainer/devcontainer.json`** — GitHub Codespaces config (Node 20, auto npm install, port 3000 auto-forward, ESLint/Prettier/Tailwind/Solidity extensions).
- **`circle_product_feedback.md`** — honest builder feedback on Circle's developer experience (submission requirement).
- **`video_demo_script.md`** — 7-section storyboard with voiceover lines, pre-record checklist, editing notes.
- **`submission_narrative.md`** — one-page pitch for judges.

### Changed
- Landing page footer now links the deployed contract on arcscan with a "source verified" badge, plus the GitHub repo.

---

## [v0.4.1] — 2026-05-24

Smart role detection bugfix.

### Fixed
- When a single email is signed in as both client and freelancer (common in solo testing), the order detail page now picks the role whose turn it is based on order status (`funded` → freelancer; `delivered` → client; otherwise client). Previously the first matching role won and a solo tester was permanently stuck as `client`.

---

## [v0.4.0] — 2026-05-24

Frontend MVP. Full client + freelancer + order detail UI with agent chat and action panel.

### Added
- `src/lib/api.ts` — typed browser-side fetch helpers for all API routes.
- `src/components/EmailGate.tsx` — localStorage-backed identity for the MVP.
- `src/components/StatusBadge.tsx` — visual status pill (draft/funded/delivered/released/refunded).
- `src/components/OrderCard.tsx` — list row with brief, counterparty, amount, deadline.
- `src/components/CreateOrderForm.tsx` — client-side order creation.
- `src/components/AgentChat.tsx` — scrolling chat with role-aware bubble styling; polls messages.
- `src/components/OrderActions.tsx` — role + status aware action buttons (fund, submit deliverable, approve & release), simulated on-chain calls.
- `/client` page — email gate, order list, create form.
- `/freelancer` page — email gate, order list.
- `/orders/[id]` page — 2-column detail with chat + actions, auto-detect role.
- `.env.example` updated with real Arc Testnet values.

---

## [v0.3.1] — 2026-05-24

Fix the v0.3.0 deploy failure.

### Fixed
- Lazy-instantiate Supabase clients. Previously `src/lib/supabase.ts` created the browser client at module top level with `createClient(url, key)`, which crashed Vercel's "collect page data" phase when env vars weren't yet propagated.
- Added `export const dynamic = 'force-dynamic'` + `export const runtime = 'nodejs'` to all 4 API routes so Next.js skips prerender attempts.
- Bumped `groq-sdk` to ^0.15.0 for proper `response_format: { type: 'json_object' }` type support.

---

## [v0.3.0] — 2026-05-24

Backend AI agent, verifier, and orders API.

### Added
- `src/lib/agent.ts` — `chatTurn()` (conversational) and `verifyDeliverable()` (URL reachability + LLM brief alignment with structured JSON verdict) on Groq Llama 3.3 70B.
- `src/lib/orders.ts` — Supabase DB helpers for orders + messages tables.
- `POST /api/orders` — create order.
- `GET /api/orders?email=` — list orders for a client or freelancer.
- `GET /api/orders/[id]` — order + message thread.
- `PATCH /api/orders/[id]` — sync onchain_id / status after on-chain action.
- `POST /api/agent` — chat turn (persists user + agent messages).
- `POST /api/verify` — verify deliverable, log verdict, append to agent_notes.

---

## [v0.2.0] — 2026-05-24

Smart contract.

### Added
- `contracts/FreelanceEscrow.sol` — full milestone escrow contract with createAndFund, submitDelivery, approveAndRelease (callable by client OR agent), refund (after deadline + grace), and Ownable admin functions (setAgent, setAgentFee, setRefundGracePeriod).
- Custom errors instead of revert strings (gas-efficient).
- `SafeERC20` for USDC handling, `Ownable` (OpenZeppelin 5) for admin gating.
- `contracts/MockUSDC.sol` — 6-decimal ERC-20 test fixture.
- `contracts/test/FreelanceEscrow.test.js` — 18-case Hardhat test suite covering constructor validation, create-and-fund, delivery submission, release (by client AND agent), refund after grace, admin, and full end-to-end Jakarta→NYC happy path.
- `contracts/scripts/deploy.js` — env-driven deploy script with sensible defaults for Arc Testnet.
- `contracts/hardhat.config.js` — Arc Testnet network config.
- `contracts/README.md` — setup/compile/test/deploy guide.

### Deployed
- Contract live + source-verified at [`0xA8CA04560603951b0f0e803039B059432F673ae4`](https://testnet.arcscan.app/address/0xA8CA04560603951b0f0e803039B059432F673ae4) on Arc Testnet.

---

## [v0.1.0] — 2026-05-24

Initial scaffold.

### Added
- Next.js 14 (App Router) + TypeScript + Tailwind project scaffold.
- Landing page (`/`) with hero, two CTA cards, footer.
- Client and freelancer route stubs.
- API route stubs for `/api/agent` and `/api/verify`.
- Solidity escrow contract skeleton.
- Hardhat config + deploy script stub.
- Supabase schema (`supabase/schema.sql`) for `orders` + `messages` tables.
- `.env.example` template, `.gitignore`, MIT `LICENSE`.
- Architecture diagram (`02_architecture_diagram.mermaid`).
- Concept document (`01_konsep_freelancebot.md`).
- Setup checklist (`03_setup_checklist_minggu1.md`).
- Initial README.
