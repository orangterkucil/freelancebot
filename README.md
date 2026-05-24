# FreelanceBot

> Autonomous AI payment agent for global freelancers, built on Arc.
> Clients fund USDC escrow, AI agent verifies deliverables, payment releases in sub-second.

**Submission for:** [The Stablecoins Commerce Stack Challenge](https://challenges.ignyte.ae/) — Track 4 (Agentic Economy)
**Tech sponsors:** Circle, Arc
**Deadline:** July 13, 2026

---

## The bottleneck

A freelancer in Jakarta accepts a $300 job from a US client. Today she loses $50–85 to platform fees, FX spreads, and SWIFT charges, and waits 10–18 days for the money to land. FreelanceBot replaces that pipeline with USDC on Arc and an AI agent that handles verification and payout — net $297 in under an hour.

## Architecture

See [`../02_architecture_diagram.mermaid`](../02_architecture_diagram.mermaid) for the full diagram. Short version:

```
Client → Next.js UI → Vercel API routes → AI agent (Groq) → Escrow contract on Arc → Freelancer
                              │                                      │
                              └─ Supabase (orders, messages)        └─ USDC settlement, sub-second finality
```

## Tech stack

| Layer | Tool |
|---|---|
| Frontend | Next.js 14 (App Router), TypeScript, Tailwind |
| Backend | Vercel Serverless Functions |
| AI agent | Groq (Llama 3.3 70B) |
| Database | Supabase |
| Smart contract | Solidity 0.8.24 on Arc testnet, deployed via Hardhat |
| Wallet UX | Circle Wallets (embedded, non-crypto-native onboarding) |
| Settlement | USDC on Arc |

## Local setup

### Prerequisites

- Node.js 20+
- A Supabase project (free tier)
- A Groq API key
- An Arc testnet wallet with testnet USDC

### Install

```bash
git clone https://github.com/orangterkucil/freelancebot.git
cd freelancebot
npm install
```

### Configure environment

```bash
cp .env.example .env.local
# then open .env.local and fill in your real values
```

Required environment variables are documented in `.env.example`.

### Run dev server

```bash
npm run dev
# open http://localhost:3000
```

### Smart contracts (week 2 onward)

```bash
cd contracts
npm install --no-save @nomicfoundation/hardhat-toolbox hardhat dotenv
npx hardhat compile
npx hardhat run scripts/deploy.js --network arcTestnet
```

## Project layout

```
freelancebot/
├── src/
│   ├── app/
│   │   ├── page.tsx              # Landing
│   │   ├── client/page.tsx       # Client funding flow (week 5)
│   │   ├── freelancer/page.tsx   # Freelancer dashboard (week 5)
│   │   └── api/
│   │       ├── agent/route.ts    # AI agent endpoint (week 3)
│   │       └── verify/route.ts   # Deliverable verifier (week 3)
│   ├── components/               # UI components (week 5)
│   └── lib/
│       ├── supabase.ts           # Supabase client wrappers
│       ├── groq.ts               # Groq client
│       └── contracts.ts          # On-chain bindings (week 2)
├── contracts/
│   ├── FreelanceEscrow.sol       # Milestone escrow (week 2)
│   ├── hardhat.config.js
│   └── scripts/deploy.js
├── supabase/
│   └── schema.sql                # Orders + messages tables
├── public/
├── .env.example
├── next.config.js
├── tailwind.config.ts
└── tsconfig.json
```

## Deployment

Vercel is configured to deploy on push to `main`. Set the same env vars from `.env.example` in Vercel dashboard → Project → Settings → Environment Variables.

## API surface (week 3)

All routes live under `src/app/api/`.

| Method | Path | Purpose |
|---|---|---|
| `POST` | `/api/orders` | Create a draft order |
| `GET`  | `/api/orders?email=<email>` | List orders for a user (client or freelancer) |
| `GET`  | `/api/orders/[id]` | Fetch one order + its message thread |
| `PATCH`| `/api/orders/[id]` | Update `onchain_id` or `status` after on-chain action |
| `POST` | `/api/agent` | Append a user message, get an agent reply |
| `POST` | `/api/verify` | Submit a deliverable URL; agent returns a verification verdict |

### Verify verdict shape

```json
{
  "verified": true,
  "confidence": "high",
  "reasoning": "URL is reachable, contents appear to match the brief...",
  "checks": {
    "urlReachable": true,
    "deadlineMet": true,
    "briefAlignment": "matches"
  }
}
```

The agent is conservative — it returns `verified: false` on any uncertainty, leaving
the final release to the client.

## Roadmap

- [x] Week 1 — Setup, accounts, scaffold, architecture diagram
- [x] Week 2 — Smart contract escrow + 18-test suite
- [x] Week 3 — AI agent + verifier API + order lifecycle
- [ ] Week 4 — Wire frontend to API + contract bindings (ethers)
- [ ] Week 5 — Frontend MVP (client + freelancer pages, Circle Wallets embedded)
- [ ] Week 6 — End-to-end demo, deploy contract to Arc testnet
- [ ] Week 7 — Polish, video, README
- [ ] Week 8 — Submit to Ignyte

## License

MIT
