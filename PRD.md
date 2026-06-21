# FreelanceBot — Product Requirements Document

**Document status:** Draft v0.1 (post-hackathon, pre-MVP 2)
**Last updated:** 2026-06-12
**Owner:** tarjo ([@orangterkucil](https://github.com/orangterkucil))
**Repo:** https://github.com/orangterkucil/freelancebot
**License:** MIT (open source)

---

## 1. Vision

**FreelanceBot is open-source payment plumbing for the global underbanked workforce.**

Every freelancer in Jakarta, Manila, Lagos, São Paulo, and a thousand cities in between loses 8–20% of every gig to platforms, FX, and SWIFT — and waits 10–20 days for the rest to arrive. The technology to fix this (stablecoin settlement, EVM-grade contracts, AI agents) exists today; the integrated, opinionated, *deployable* product that combines them for non-crypto users doesn't.

We are building that product as open source so anyone can:

- **Run their own instance** (a co-op of freelancers, a local guild, a payments NGO)
- **Fork the contracts** to add region-specific rules (Sharia-compliant variants, KYC overlays, local fee splits)
- **Translate the agent** into their language so it serves their users in their voice
- **Contribute integrations** to local off-ramps (Tokocrypto, Indodax, Coins.ph, Yellow Card, Bitso) so freelancers can cash out where they live

This is not a startup. There is no fundraising path planned. The hosted reference instance (today's `freelancebot-alpha.vercel.app`) exists to demonstrate the product; the canonical product is the repo.

## 2. Target users

### Primary

- **Freelancers in emerging markets** receiving cross-border payments — designers, developers, writers, video editors, translators, virtual assistants — typically billing $100–$2,000 per gig.

### Secondary

- **Clients in OECD countries** hiring those freelancers, who today use Upwork / Fiverr / Wise / PayPal and resent every fee.
- **Local co-ops and freelancer guilds** in emerging markets who want to host an instance for their members.
- **Web3-curious payment platforms** looking for a reference implementation to learn from.

### Non-users (explicit)

- High-value B2B settlement (use specialized treasury rails, not a freelancer-focused tool)
- Crypto-native users who already self-custody and just want a contract — they can use the contract directly, the agent layer is overhead for them

## 3. MVP 1 — What's shipped (current state, end of hackathon)

### Scope

Single hosted instance at `freelancebot-alpha.vercel.app` demonstrating the full lifecycle for one corridor (USDC on Arc, one demo wallet acting as both client and freelancer).

### Features delivered

| Capability | Status |
|---|---|
| Landing page with visible deployed contract address | ✅ |
| Client dashboard — create + fund orders | ✅ |
| Freelancer dashboard — list orders | ✅ |
| Order detail — chat + role-aware actions | ✅ |
| AI agent chat (Groq Llama 3.3) with multi-language reply | ✅ |
| Deliverable verifier (URL reachability + deadline + LLM brief alignment) | ✅ |
| Smart contract escrow on Arc Testnet, source-verified | ✅ (`0xA8CA…3ae4`) |
| 18-case unit test suite for the contract | ✅ |
| Lazy DB clients + structured logger + retry/backoff helpers | ✅ |
| Wallet connect + on-chain fund/release (MetaMask + ethers) | ✅ |
| Email-based identity (localStorage) | ✅ (placeholder; MVP 2 replaces) |
| Open-source repo with README, badges, demo placeholders | ✅ |
| Architecture + API docs | ✅ |
| Circle Product Feedback (submission requirement) | ✅ |
| Video demo script + compression instructions | ✅ |
| GitHub Codespaces devcontainer | ✅ |

### MVP 1 success criteria

- Anyone with a GitHub account can fork, clone, follow the README, and deploy a working instance to Vercel in under 30 minutes.
- A judge can read the README, click the live demo, hit the verified contract on arcscan, and understand the full lifecycle within 5 minutes.
- The contract is verifiable on-chain by any third party.

### Known MVP 1 limitations

- **Identity is fake.** localStorage email = "auth." No real signup/verification. Anyone can claim to be anyone.
- **Single chain.** Arc Testnet only. No mainnet, no multi-chain, no cross-chain.
- **Single corridor.** No fiat off-ramp. Freelancer has to manually withdraw USDC to local exchange.
- **No back office.** Fees are hard-coded in the contract at deploy time. No admin UI to change them.
- **No dispute resolution.** If client and freelancer disagree, there's only the contract's grace-period refund.
- **English UI.** Agent replies in user's language, but the static UI is English-only.
- **No notifications.** User has to refresh the dashboard to see status changes.
- **Web only.** No PWA install, no mobile app.

These are not bugs — they are explicitly out of scope for MVP 1 (which is a hackathon demo). MVP 2 addresses them in priority order.

## 4. MVP 2 — Goals and scope

### One-line goal

**Make FreelanceBot deployable by a non-engineer co-op and usable by a freelancer who has never owned crypto.**

### Pillars

#### 4.1 Real identity & wallet abstraction

- Replace localStorage "email" with passwordless email magic links (Supabase Auth or similar).
- Add **embedded wallet** option (Circle Wallets when available; Privy / Magic / Web3Auth as fallback) so a freelancer can sign up with an email and have a wallet provisioned server-side. No browser extension, no seed phrase shown.
- Existing MetaMask path stays for crypto-native users.

#### 4.2 Multi-language UI (i18n)

- `next-intl` for static UI translation.
- Initial languages: **English, Indonesian, Tagalog, Vietnamese, Hindi, Portuguese (BR), Spanish (LatAm)**.
- Community translation workflow — string files in `locales/` checked into git, anyone can PR.
- Agent already replies in the user's language; this extends to nav, buttons, modals.

#### 4.3 Mobile-first PWA

- Service worker for offline shell.
- Add-to-home-screen manifest.
- Touch-optimized order detail and chat (current layout is desktop-biased).

#### 4.4 Multi-chain ready

- Refactor contract bindings behind an interface. Today: hardcoded Arc. After: user picks chain at instance-deploy time (config), or per-order (advanced).
- First three supported chains: Arc, Base, Polygon. All EVM, all USDC-native.
- Cross-chain via CCTP for "client pays in Base USDC, freelancer receives Arc USDC" flow.

#### 4.5 Multi-LLM provider

- Today: Groq only.
- After: provider abstraction supporting Groq, OpenAI, Anthropic, and **Ollama (self-hosted)** — so a privacy-conscious co-op can run the whole stack on their own infra with no third-party LLM call.
- Default still Groq (free tier, fast).

#### 4.6 Back office / admin panel

- New role: **operator** (instance admin).
- Operator UI to:
  - View all orders + filter by status / corridor
  - Configure platform fee (basis points) per chain
  - Configure platform fee recipient address
  - Configure refund grace period
  - Configure supported chains
  - View payment history + downloadable CSV
  - Soft-resolve disputes (mark order resolved, with note; doesn't touch on-chain)
- Built with **next-admin** or **Refine**.
- **Monetization happens here** — operator decides if they take a fee, how much, and where it goes. The contract supports it; the back office controls it.

#### 4.7 Notifications

- Email (Resend or Postmark) on every status transition.
- Optional Telegram bot per user (most emerging market users have Telegram).
- Optional Discord webhook for co-op moderators.

#### 4.8 Local off-ramp integrations

Not building the integrations themselves — building the **registry**. A JSON file per region listing recommended exchanges with deep links:

```json
{
  "ID": {
    "exchanges": [
      { "name": "Tokocrypto", "deepLink": "https://tokocrypto.com/deposit?asset=USDC", "notes": "lowest fee in 2026 per community survey" },
      { "name": "Indodax", "deepLink": "..." }
    ]
  },
  "PH": {...},
  "VN": {...},
  "NG": {...},
  "BR": {...}
}
```

Freelancer sees "Cash out → local exchanges in your country" with one-tap deep links.

#### 4.9 Reputation primitive (on-chain credential)

- Each completed order issues a minimal soulbound NFT or signed attestation to the freelancer's wallet: `{ orderId, amount, clientHash, completedAt }`.
- Aggregated reputation = N orders × total USDC handled. Visible on profile.
- Stays minimal — not building a Yelp-for-freelancers. Just a verifiable receipt.

#### 4.10 Self-host docs

- `docker-compose.yml` for the full stack (Next.js + Supabase + Ollama optional).
- 15-minute "deploy your own FreelanceBot" tutorial.
- Operator handbook (governance, fee setting, dispute handling, security checklist).

### Explicitly NOT in MVP 2

- Mobile native (React Native / Swift / Kotlin) — PWA covers 80% of need at 20% of cost.
- Built-in fiat on-ramp — too much KYC/regulatory complexity. Operator wires this themselves region by region.
- Built-in arbitration / DAO governance — soft dispute resolution only. Heavier dispute models are future research.
- Auto-generated freelance contracts — out of scope, point users to existing tools.
- AI-generated bid / proposal writing — different product category.

## 5. Stack recommendation for MVP 2

### TL;DR

Keep what works, abstract what's coupled, add what's missing.

### Per-layer

| Layer | MVP 1 | MVP 2 | Rationale |
|---|---|---|---|
| Web framework | Next.js 14 App Router | **Next.js 15+** (when stable) | Already shipping; large community; PWA-friendly |
| Hosting (reference instance) | Vercel | Vercel **+ `docker-compose.yml`** | Reference instance stays on Vercel; community can self-host via Docker |
| Database | Supabase (hosted) | Supabase (hosted OR **self-hosted via `supabase/supabase`** for community) | Postgres + RLS + Realtime + Auth in one box. Open source. |
| Auth | localStorage email (fake) | **Supabase Auth (magic link)** + embedded wallet (Privy / Circle Wallets) | Real but still passwordless. Wallet auto-provisioned. |
| AI agent | Groq only | **Provider abstraction**: Groq (default), OpenAI, Anthropic, **Ollama (self-host)** | Operator chooses. Privacy-conscious co-ops can run Ollama. |
| Blockchain client | ethers v6 | **viem** (50KB vs ethers 200KB) — refactor for bundle weight | Significant bundle reduction. Better TypeScript. |
| Chains | Arc Testnet only | Arc + Base + Polygon (mainnet ready) — chain selected at instance config | Operator picks which chains to expose. Cross-chain via CCTP. |
| Wallet | MetaMask only | MetaMask + **Privy / Web3Auth / WalletConnect** + **Circle Wallets** | One-click sign-in for non-crypto users. |
| i18n | None | **next-intl** with community-translated JSON in `locales/` | Standard Next.js i18n. Community PRs translations. |
| Admin / back office | None | **next-admin** or **Refine** on top of Supabase | Drop-in admin UI for operators. |
| Notifications | None | **Resend** (email) + Telegram bot SDK + Discord webhook | Multi-channel, opt-in. |
| Logging | Custom `logger.ts` | Keep custom logger + **Axiom or Better Stack** sink for hosted instance | Lightweight; structured JSON ready for any aggregator. |
| Smart contract | Solidity 0.8.24, Hardhat 2 | Same + **Foundry test suite** added | Hardhat for deploy / scripting; Foundry for fast fuzz + invariant tests. |
| Bundler footprint goal | n/a | **< 200 KB JS gzipped** for landing, **< 400 KB** for app pages | Mobile-first means tight budgets. |
| Mobile delivery | n/a | **PWA only** (Workbox service worker) | Skip native. PWA installs to home screen on iOS 16+ and Android. |

### Stack rationale (why these specific picks)

- **viem over ethers** — for a globally distributed, mobile-first audience, bundle size matters more than DX familiarity. The ethers migration cost is one focused PR. viem also has better TypeScript ergonomics and tree-shakes properly.
- **Supabase keeps winning** because it's Postgres (operators understand it), RLS (fine-grained access without writing API code for every table), open-source (community can self-host), and has Auth + Realtime + Storage in one package.
- **Ollama as a first-class option** — open source projects targeting emerging markets often face a hidden cost: every LLM call costs USD that gets harder to sustain. Letting an operator point at a local Ollama instance is the "no recurring cost" lever.
- **Privy / Web3Auth / Circle Wallets** — pick whichever has the strongest emerging-market presence at MVP 2 build time. Circle Wallets is the long-term answer (issuer-native), but launching with Privy/Web3Auth gives broader chain coverage right away.
- **PWA, not native** — building/maintaining 2 native apps would 3× the work and slow community contribution to a crawl. PWA on a decent Android phone is functionally identical for our use case.
- **Foundry alongside Hardhat** — Hardhat is great for deploy scripts and Node-ecosystem interop. Foundry runs property-based tests 10× faster and finds bugs Hardhat misses. Use both.

## 6. Roadmap

### Phase 0 — MVP 1 polish (1–2 weeks)

- Record + upload demo video (YouTube unlisted + GitHub Release backup)
- Take landing + order screenshots, embed in README
- Animated GIF demo (Kap)
- Final bug bash on hosted reference instance
- Hackathon submission

### Phase 1 — MVP 2 foundation (4–6 weeks)

- Refactor ethers → viem
- Supabase Auth integration + magic links
- next-intl scaffolding + English + Indonesian baseline translations
- PWA manifest + service worker
- Email notifications (Resend)
- Refresh README + add CONTRIBUTING.md, CODE_OF_CONDUCT.md, ISSUE_TEMPLATE
- Set up GitHub Discussions for community Q&A

### Phase 2 — MVP 2 ship (4–6 weeks)

- Privy embedded wallet path
- LLM provider abstraction (Groq + Ollama at minimum)
- Multi-chain selector (Arc + Base + Polygon)
- Back office (next-admin) + first dispute resolution flow
- Telegram bot for notifications
- Off-ramp registry JSON + UI
- Reputation primitive
- `docker-compose.yml` + self-host docs
- Operator handbook

### Phase 3 — Growth (ongoing)

- Community translation drive (10+ languages)
- Region champion program — recruit a maintainer per region (ID, PH, VN, NG, BR) to keep off-ramp registry fresh
- Quarterly "operator showcase" — feature self-hosted instances on a community page
- Contract audits via Code4rena / Sherlock when contract surface changes

## 7. Success metrics (open-source-flavored)

| Metric | MVP 2 launch target (6 months out) |
|---|---|
| GitHub stars | 1,000+ |
| Active contributors (committed code in last 90 days) | 10+ |
| Independently deployed instances (self-reported via opt-in ping) | 25+ |
| Translations submitted | 5+ languages |
| Off-ramp registry entries | 15+ countries |
| Combined demo + tutorial video views | 5,000+ |
| Discord / Telegram community size | 200+ |

These are NOT user counts. The hosted reference instance does NOT optimize for sign-ups. Success = community health and adoption-as-a-codebase.

## 8. Open source governance

- **License:** MIT throughout (code, docs, translations).
- **Maintainers:** tarjo as BDFL for first 12 months, then transition to a 3-person maintainer council elected by contributors.
- **Decision process:** small changes via PR review; substantial changes via lightweight RFC (markdown file in `rfcs/` + 7-day comment window).
- **Code of conduct:** Contributor Covenant 2.1.
- **Security:** disclose responsibly via `security@freelancebot.dev` (set up at MVP 2 launch). Bug bounty considered after audit.
- **Funding:** GitHub Sponsors + Open Collective for infra costs (hosted reference instance + community Discord). No VC. No token launch — explicit non-goal.

## 9. Risks

| Risk | Likelihood | Impact | Mitigation |
|---|---|---|---|
| Arc mainnet delays slip past 2026 | Medium | High | MVP 2 supports Base + Polygon as fallback mainnet chains. Arc remains primary when it lands. |
| Regulatory action on stablecoin payments in target regions | Medium | High | Self-host model means we're a tools provider, not a money transmitter. Operators handle compliance per jurisdiction. Stay open about this in docs. |
| Contributor burnout (solo maintainer trap) | High (early) | Medium | Active recruiting of co-maintainers from Month 3. Generous "good first issue" labeling. Public roadmap so contributors know where they can plug in. |
| LLM cost spikes for hosted instance | Medium | Low | Hosted instance can degrade to Ollama-only. Operators of self-hosted are fully insulated. |
| Bad actors deploy a "scam fork" with the same UI | Low | Medium | Reference instance becomes the trusted brand. Encourage operators to publish their fork URL + their changelog so users can verify. |
| Circle changes USDC contract addresses or pulls Arc | Low | High | Contract address is config, not hardcoded. Stay close to Circle dev relations. |

## 10. Open questions

These need community input before MVP 2 ships:

1. **Default platform fee** for the reference instance — 0% (sustainability via sponsors only) or 0.5% (small, signals "real product")?
2. **Reputation primitive shape** — soulbound NFT, signed off-chain attestation, or both?
3. **Dispute model** — pure soft (operator resolves), Kleros-style arbitrator pool, or no dispute at all (caveat-emptor with on-chain refund)?
4. **Translation governance** — anyone can PR, or designated language captains review first?
5. **Reference instance domain** — keep `freelancebot-alpha.vercel.app`, or buy a real domain (`freelancebot.dev`?) for the launch?

---

## Appendix A — Glossary

- **Operator** — someone who runs a self-hosted instance of FreelanceBot
- **Co-op** — a community group of freelancers (formal or informal) who collectively use one operator's instance
- **Corridor** — a "from country → to country" payment route (e.g., USA→Indonesia)
- **Off-ramp** — converting crypto (USDC) to local fiat (IDR, PHP, NGN)
- **Agent** — the AI mediator (Groq Llama 3.3 today, multi-provider in MVP 2)
- **BDFL** — Benevolent Dictator For Life; common open-source governance pattern for early-stage projects

## Appendix B — How to contribute (preview)

When MVP 2 ships, the `CONTRIBUTING.md` will cover:
- Setting up your dev environment (Codespaces 1-click, Docker compose, or manual)
- Picking a `good first issue`
- Translation workflow
- Adding a new chain / off-ramp / LLM provider
- RFC process for substantial changes
- Local testnet setup
