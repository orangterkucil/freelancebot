# Changelog

All notable changes to FreelanceBot are documented here.

Format based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/);
versioning follows [Semantic Versioning](https://semver.org/spec/v2.0.0.html).
See [VERSIONING.md](./VERSIONING.md) for the release process.

## [Unreleased]

_Anything not yet shipped goes here. Empty between releases._

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
