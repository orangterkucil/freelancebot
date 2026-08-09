<p align="center">
  <img src="./public/logo.svg" alt="FreelanceBot" width="320" />
</p>

<p align="center">
  <strong>An AI agent with its own wallet, settling freelance jobs in USDC on Arc.</strong><br/>
  Clients fund USDC escrow · the agent audits the delivered work · settlement lands in under a second.<br/>
  <em>1% fee, capped in the contract · no platform holds your money.</em>
</p>

<p align="center">
  <a href="https://freelancebot.site"><img alt="Live demo" src="https://img.shields.io/badge/live%20demo-online-22c55e?style=flat-square" /></a>
  <a href="https://testnet.arcscan.app/address/0xA8CA04560603951b0f0e803039B059432F673ae4"><img alt="Contract verified" src="https://img.shields.io/badge/contract-verified%20on%20Arc-0369a1?style=flat-square" /></a>
  <a href="https://github.com/orangterkucil/freelancebot/blob/main/LICENSE"><img alt="License: MIT" src="https://img.shields.io/badge/license-MIT-blue?style=flat-square" /></a>
  <img alt="Version" src="https://img.shields.io/badge/version-v0.13.0-informational?style=flat-square" />
</p>

<p align="center">
  <img alt="Tests" src="https://img.shields.io/badge/tests-25%2F25%20passing-brightgreen?style=flat-square" />
  <img alt="OWASP" src="https://img.shields.io/badge/OWASP%20LLM-hardened-blueviolet?style=flat-square" />
  <img alt="i18n" src="https://img.shields.io/badge/i18n-6%20languages-orange?style=flat-square" />
  <img alt="Stack" src="https://img.shields.io/badge/stack-Next.js%20·%20Solidity%20·%20Groq%20·%20Supabase-0f172a?style=flat-square" />
</p>

---

## What it does

A client posts a job and funds it in USDC into an on-chain escrow. The freelancer delivers. An AI agent
audits the work — it fetches the deliverable server-side, hashes it, and for images opens the actual file
with a vision model — then writes a verdict that separates what it *verified* from what is only its
*opinion*. On release, USDC settles to the freelancer with sub-second finality, minus a 1% fee.

The agent is a transacting party, not a chat widget. It holds its own wallet and is a permissioned party
in the escrow contract, so it can execute the release itself. That capability ships behind an operator
switch rather than on by default — an LLM whose input includes a job brief written by a stranger should
not be the sole authority over a transfer. The reasoning is in
[`docs/DESIGN-DECISIONS.md`](docs/DESIGN-DECISIONS.md).

A $300 job that historically netted ~$220 after two weeks of platform fees, FX spread and bank charges
nets **$297**, and the on-chain leg takes under a second.

## Features

- 🏦 **USDC escrow on Arc** — client deposits, the contract holds, the freelancer receives. One currency
  end to end: Arc's gas is USDC-denominated, so a freelancer never learns that "gas" exists.
- 🤖 **An agent with a wallet** — its own address on Arc, permissioned in the contract, able to execute
  `approveAndRelease` itself when autonomous settlement is enabled.
- 🔍 **Brief review before posting** — tells the client whether the deliverable is objectively verifiable,
  so an uncheckable brief is caught at posting time instead of becoming a dispute.
- 🏅 **Applicant ranking** — scores applicants against the brief with a written reason for each.
- 👁️ **Vision-backed delivery audit** — fetches the file server-side, validates content type, SHA-256
  hashes it, and runs a vision model over image deliverables. The verdict states which checks actually ran.
- 💸 **1% fee, capped in the contract** — `MAX_FEE_BPS = 100`. The owner can lower it and cannot raise it;
  the rate is locked onto each order when funded, so you are charged what you agreed to.
- ⭐ **Two-sided ratings + market history** — reputation that travels across orders, and a public feed of
  funded/released/refunded activity.
- 🔐 **Contract source-verified on-chain** — [arcscan](https://testnet.arcscan.app/address/0xA8CA04560603951b0f0e803039B059432F673ae4),
  SafeERC20, custom errors, Ownable, 25 passing tests.
- 🛡️ **Security worked, not assumed** — server-derived `verified` flag, SSRF guards on every redirect hop,
  rate limits on every LLM route, auth that fails closed. See [`docs/RISKS-AND-SECURITY.md`](docs/RISKS-AND-SECURITY.md).
- 🌐 **Multi-language agent** — detects the user's language and replies in kind.

---

## Live links

| Resource | URL |
|---|---|
| **Live app** | https://freelancebot.site |
| **Demo reel** (8:50 — 17s intro, then an uncut recording of both sides) | https://freelancebot.site/demo-reel.html |
| **Raw recording** (8:22) | https://freelancebot.site/demo.mp4 |
| **Docs — how it works, fees, risks** | https://freelancebot.site/docs |
| **Who built it** | https://freelancebot.site/team.html |
| **GitHub repo** | https://github.com/orangterkucil/freelancebot |
| **Deployed contract** (Arc Testnet) | [`0xA8CA04560603951b0f0e803039B059432F673ae4`](https://testnet.arcscan.app/address/0xA8CA04560603951b0f0e803039B059432F673ae4) ✓ source verified |

---

## The bottleneck we attack

A freelancer in Jakarta accepts a $300 logo job from a US client. Today:

- Platform fee (Upwork/Fiverr): 5–10% → loses $15–30
- Withdrawal fee + FX spread: 3–5% → loses another $9–15
- SWIFT/PayPal flat fee: $25–50
- Time-to-cash: **10–18 days**
- **Net to freelancer: ~$220 after 2+ weeks**

With FreelanceBot on Arc:

- Smart contract escrow fee: < $0.10
- Arc finality: < 1 second
- USDC → IDR via local exchange: ~1% spread, < 1 hour
- **Net to freelancer: ~$297 in under 60 minutes**

That's **+22% more income** and **400× faster cashflow**, repeated for every gig.

## Architecture

```
Client (NYC)                                  Freelancer (Jakarta)
   │                                                 │
   │ 1. createAndFund(freelancer, amount, brief)     │
   ├──────────────► FreelanceEscrow (Arc) ◄──────────┤
   │                  (holds USDC)                   │
   │                       ▲                         │
   │                       │ 3. submitDelivery(url)  │
   │                       │                         │
   │                       │                         │
   │  5. approveAndRelease(orderId)                  │
   │      OR                                         │
   │      AI Agent calls release after verify        │
   │                                                 │
   ▼                                                 ▼
                       USDC settles
                       sub-second finality
                       fee predictable
                       (denominated in USDC, not gas token)
```

Off-chain, the AI agent (Groq Llama 3.3 70B) handles:
- **Chat** with both parties for clarification
- **Deliverable verification** — URL reachable, deadline match, brief alignment (structured JSON verdict)
- **Release recommendation** — by default it does *not* auto-release; it tells the client when the work is ready and the client releases. Autonomous release is opt-in and off by default (`AGENT_AUTO_RELEASE`).

## Tech stack

| Layer | Tool | Why |
|---|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind | Modern, type-safe, ships fast |
| Backend | Vercel Serverless Functions | Zero-ops scaling, same repo |
| Database | Supabase (Postgres + RLS) | Off-chain mirror of orders + chat |
| AI agent | Groq (Llama 3.3 70B) | Sub-second LLM inference, free tier |
| Smart contract | Solidity 0.8.24 on Arc testnet, deployed via Remix | Sub-second finality, USDC-native gas |
| Wallet UX | Wallet-agnostic via EIP-1193 (tested on Rabby + MetaMask); Circle Wallets planned | Onboarding for non-crypto users |
| Settlement | **USDC on Arc** | Predictable USD-denominated fees |

## Circle products used

| Product | Role |
|---|---|
| **USDC** | Settlement currency for all escrow operations |
| **Arc Testnet** | L1 deployment target; USDC-native gas, sub-second finality |
| **Circle Wallets** (planned) | Embedded wallets so non-crypto users onboard without a browser extension |
| **Circle Gateway** (planned) | Treasury routing for platform-fee splits |

See [`circle_product_feedback.md`](./circle_product_feedback.md) for our detailed feedback on Circle's developer experience.

## Repo layout

```
freelancebot/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing
│   │   ├── client/page.tsx       # Client dashboard (create + list orders)
│   │   ├── freelancer/page.tsx   # Freelancer dashboard (list orders)
│   │   ├── orders/[id]/page.tsx  # Order detail: chat + actions
│   │   └── api/
│   │       ├── agent/route.ts    # AI agent chat endpoint (Groq)
│   │       ├── verify/route.ts   # Deliverable verifier
│   │       └── orders/...        # Order CRUD
│   ├── components/
│   │   ├── EmailGate.tsx         # Simple email-based identity
│   │   ├── AgentChat.tsx         # Chat UI
│   │   ├── OrderActions.tsx      # Role-aware action panel
│   │   ├── CreateOrderForm.tsx
│   │   ├── OrderCard.tsx
│   │   └── StatusBadge.tsx
│   └── lib/
│       ├── agent.ts              # Agent core + verifyDeliverable
│       ├── orders.ts             # Supabase DB helpers
│       ├── api.ts                # Browser API client
│       ├── supabase.ts           # Lazy Supabase clients
│       ├── groq.ts               # Groq SDK wrapper
│       └── contracts.ts          # On-chain bindings
├── contracts/
│   ├── FreelanceEscrow.sol       # Milestone escrow (deployed + verified)
│   ├── MockUSDC.sol              # Test fixture
│   ├── test/FreelanceEscrow.test.js  # 18-case test suite
│   ├── scripts/deploy.js
│   ├── hardhat.config.js
│   └── README.md
├── supabase/
│   └── schema.sql                # orders + messages tables
├── .env.example                  # All required env vars (placeholders)
└── README.md
```

## API surface

All routes under `src/app/api/`.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/orders` | Create a draft order |
| `GET`  | `/api/orders?email=<email>` | List orders for a user |
| `GET`  | `/api/orders/[id]` | Fetch order + message thread |
| `PATCH`| `/api/orders/[id]` | Sync onchain_id / status after on-chain action |
| `POST` | `/api/agent` | Append a user message, get agent reply |
| `POST` | `/api/verify` | Submit deliverable, get verification verdict |

### Verify verdict shape

```json
{
  "verified": true,
  "confidence": "medium",
  "reasoning": "URL is reachable and appears to satisfy the brief. [server downgraded confidence: deliverable contents not directly inspected]",
  "checks": {
    "urlReachable": true,
    "deadlineMet": true,
    "briefAlignment": "matches"
  }
}
```

## Smart contract

`FreelanceEscrow.sol` deployed at [`0xA8CA04560603951b0f0e803039B059432F673ae4`](https://testnet.arcscan.app/address/0xA8CA04560603951b0f0e803039B059432F673ae4) on Arc Testnet, with source code verified on arcscan.

### Constructor parameters used

| Param | Value | Meaning |
|---|---|---|
| `_usdc` | `0x3600000000000000000000000000000000000000` | USDC on Arc Testnet |
| `_agent` | `0xe552FC0909f10E0e224F28f5BA773643B76ED58E` | Wallet authorised to release on behalf of client |
| `_agentFeeBps` | `100` | 1% platform fee |
| `_agentFeeRecipient` | `0xe552FC0909f10E0e224F28f5BA773643B76ED58E` | Where fee accrues |
| `_refundGracePeriod` | `604800` | 7 days after deadline before refund opens |

### Functions

- `createAndFund(freelancer, amount, brief, deadline) -> orderId` — client deposits USDC and opens an order
- `submitDelivery(orderId, deliverable)` — freelancer marks deliverable
- `approveAndRelease(orderId)` — client OR agent releases funds, deducting platform fee
- `refund(orderId)` — anyone can trigger after deadline + grace, returns funds to client

Full test suite: 18 cases in `contracts/test/FreelanceEscrow.test.js` covering happy path, edge cases, admin functions, and end-to-end Jakarta→NYC scenario.

## Try the live demo — no install required

**👉 https://freelancebot.site**

The demo is a hosted instance with a real source-verified contract on Arc Testnet. 90-second walkthrough:

1. **Open the demo** — click **"Open live demo"** from the landing page, or visit `/client` directly.
2. **Sign in as a client** — any email (no verification — demo mode). You land in the client dashboard.
3. **Post a job** — `+ New order` → pick **Public marketplace** → choose a category (Design / Dev / Writing / Video / Marketing / Research) → write a brief → set a USDC amount → post. Job goes live on the marketplace.
4. **Browse `/jobs`** — open in another tab. Your job appears, filterable by field and budget.
5. **Apply as freelancer** — click your job, fill a pitch + optional counter-bid, send the application.
6. **Accept** — back on the order as the client, see the applicant, click **Accept**. Order becomes private and escrow flow begins.
7. **Fund** — click **Fund USDC**. With any EIP-1193 wallet on Arc Testnet (Chain `5042002`) and USDC from [faucet.circle.com](https://faucet.circle.com), the escrow contract pulls the USDC on-chain. Otherwise the demo simulates.
8. **Deliver** — switch to freelancer view, submit a deliverable URL. The Groq Llama 3.3 70B agent checks reachability + deadline + brief alignment, returns a verdict.
9. **Release** — as client, click **Approve & release**. USDC settles to the freelancer in sub-second finality on Arc.

No clone, no install — open the link and try it.

---

<details>
<summary><strong>For contributors and self-hosters</strong> — running your own instance (click to expand)</summary>

<br />

Nothing below is needed to use FreelanceBot. It is here because the licence is MIT and a licence you
cannot act on is decoration: fork it, run it, change the fee, point it at your own contract.

#### Prerequisites
- Node.js 20+
- A Supabase project (free tier)
- A Groq API key (free tier)
- An Arc testnet wallet with testnet USDC ([faucet](https://faucet.circle.com))

#### Install + run

```bash
git clone https://github.com/orangterkucil/freelancebot.git
cd freelancebot
npm install
cp .env.example .env.local   # then fill in your values
npm run dev
# open http://localhost:3000
```

Apply the database schema once: copy `supabase/schema.sql` into your Supabase project's SQL Editor and run it. Idempotent.

#### Compile + test contracts

```bash
cd contracts
npm install
npm test       # 25 test cases
```

#### Deploy contract to Arc testnet

```bash
# from contracts/
npm run deploy:arc
# Copy printed address into NEXT_PUBLIC_ESCROW_ADDRESS in ../.env.local
```

Or use Remix in the browser — no local Node install required. See [`contracts/README.md`](./contracts/README.md).


</details>

## Project documents

- [**PRD.md**](./PRD.md) — Product Requirements Document covering MVP 1 (shipped) and MVP 2 (roadmap), stack recommendations, governance.
- [**CHANGELOG.md**](./CHANGELOG.md) — every release, with semantic version, date, and a Keep-a-Changelog-style entry.
- [**VERSIONING.md**](./VERSIONING.md) — SemVer scheme + how to cut a release (`npm run release:minor` etc).
- [**circle_product_feedback.md**](./circle_product_feedback.md) — honest Circle DX feedback (hackathon submission requirement).
- [**submission_narrative.md**](./submission_narrative.md) — one-page pitch.
- [**video_demo_script.md**](./video_demo_script.md) — 7-section storyboard + compression instructions.
- [**docs/RISKS-AND-SECURITY.md**](./docs/RISKS-AND-SECURITY.md) — honest risk & security disclosure (testnet status, unaudited-contract risk, AI-verification limits, opsec). Read this before trusting the system with anything.
- [**docs/DESIGN-DECISIONS.md**](./docs/DESIGN-DECISIONS.md) — why the architecture is the way it is: why a human approves the release (and why that's the *stronger* security position), why public views never expose raw identity, why terms lock on funding.

## License & attribution

Licensed under the [MIT License](./LICENSE) — you may use, copy, and modify this
code, but you **must preserve the `Copyright (c) 2026 orangterkucil` notice** and
may not present it as your own original work. See [**NOTICE**](./NOTICE) for
ownership, provenance, and attribution requirements.
