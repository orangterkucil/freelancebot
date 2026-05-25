# FreelanceBot — Submission Narrative (One-Pager)

**Submission for:** The Stablecoins Commerce Stack Challenge
**Track:** 4 — Best Agentic Economy Experience on Arc
**Builder:** tarjo (solo, Indonesia)
**Live demo:** https://freelancebot-alpha.vercel.app
**GitHub:** https://github.com/orangterkucil/freelancebot
**Deployed contract (Arc Testnet, source verified):** [`0xA8CA04560603951b0f0e803039B059432F673ae4`](https://testnet.arcscan.app/address/0xA8CA04560603951b0f0e803039B059432F673ae4)

---

## Problem

The global freelance economy is a $500B+ annual flow, with 75M+ workers in Asia-Pacific alone — most of them on the wrong side of a payment system designed for an earlier era. A freelance designer in Jakarta who lands a $300 logo job from a US client loses $50–85 to platform fees, FX spread, and SWIFT charges, then waits 10–18 days for the money to clear. Across the underbanked global workforce, that's an estimated $10–20B per year of pure friction.

## Solution

FreelanceBot replaces the entire Upwork-plus-PayPal-plus-SWIFT pipeline with three things stacked on Circle's developer rails:

1. **A milestone escrow smart contract on Arc**, deployed and source-verified.
2. **An AI agent (Groq Llama 3.3)** that handles chat with both parties and verifies deliverables (URL reachability, deadline, brief alignment, structured JSON verdict). It recommends release; the client (or a permissioned agent address) executes.
3. **USDC settlement on Arc** — sub-second finality, USDC-denominated gas so the freelancer never needs to think about a second currency.

End-to-end, the freelancer gets ~$297 of a $300 job in under 60 minutes, versus ~$220 in 14 days under the status quo. That's **+22% income and 400× faster cashflow**, repeated for every gig.

## Why Track 4 (Agentic Economy)

The track explicitly asks for "autonomous economic experiences where AI agents can research, negotiate, and execute transactions on behalf of users." FreelanceBot puts an agent in the loop at the highest-friction point of freelance work — verification and payout — and uses LLM judgment plus mechanical checks to drive the on-chain release decision. The agent is not theatre; the contract architecture explicitly accepts agent-initiated release (`approveAndRelease` is callable by client OR by the permissioned agent address).

## Market

| Layer | Size |
|---|---|
| Global freelance economy 2026 | ~$500B annual flow |
| Asia-Pacific freelancers | 75M+ (Payoneer 2025) |
| Indonesia freelancers alone | 17M+ (BPS 2024) |
| Cross-border freelance payment flow | $200B+ annual |
| Fee leakage from that flow | $10–20B per year |

The wedge is freelance payouts. The plumbing generalizes to: TKI remittances, creator-economy payouts, SME export receivables. Same pipes, different label.

## Stack (Circle + Arc)

| Layer | Product |
|---|---|
| Settlement currency | **USDC** |
| L1 | **Arc Testnet** (Chain 5042002, sub-second finality, USDC-denominated gas) |
| Embedded wallet UX (planned wk 6) | **Circle Wallets** |
| Treasury routing for platform fee | **Circle Gateway** (planned wk 6) |
| LLM | Groq Llama 3.3 70B (free tier) |
| Frontend / backend | Next.js 14 + Vercel + Supabase |

`circle_product_feedback.md` in the repo contains detailed Circle DX feedback as required by the rubric.

## What's actually built (today)

- ✅ Live web app at https://freelancebot-alpha.vercel.app
- ✅ Smart contract `FreelanceEscrow` deployed + verified on Arc Testnet
- ✅ Full order lifecycle in UI: client creates → funds → freelancer submits → agent verifies → client approves → release
- ✅ AI agent (chat + structured verification verdicts)
- ✅ 18-case Solidity unit test suite (happy path, edge cases, admin, end-to-end)
- ✅ Open-source repo with full README, architecture, API surface, deploy instructions

## Why this submission can place #1 in Track 4

We are not betting on novelty (Sablier, Request, Bitwage, Deel Crypto exist). We are betting on a stack of small, judge-aligned advantages that compound:

1. **First-mover on Arc.** Arc mainnet beta is 2026; most hackathon submissions target Polygon or Base. Arc team will favor demos that exercise their stack.
2. **Agentic, not just rails.** Track 4 is designed around AI agents. Most freelance-payment competitors are pure payment rails. We add the agent layer.
3. **Non-crypto-native UX direction.** Email-based identity today, Circle Wallets next. Most competitors require a wallet extension on day one.
4. **Authentic emerging-market POV.** Built solo by an Indonesian builder, demo corridor is Jakarta ↔ NYC, narrative grounded in real freelancer economics.
5. **Clean Circle product showcase.** USDC + Arc deployed and verified today; Wallets + Gateway integration in roadmap; honest Circle Product Feedback section reflecting real builder experience.

Any one of these in isolation is not enough. Stacked together, this is a credible #1 contender.

## Risks we're honest about

- **Builder is near-beginner.** This was mitigated by aggressive AI coding assistance and leaning on Circle/Arc's documented patterns. The deployed contract is verified — anyone can audit.
- **On-chain frontend wiring is partial.** The UI today calls a `PATCH /api/orders/[id]` simulator for fund/release; the contract is deployed and tested independently. Week 7 work is wiring ethers.js into the action buttons.
- **No real auth.** Email-based identity in localStorage for the MVP. Circle Wallets integration replaces this in week 6.

## Submission package

| Required | Status |
|---|---|
| Title + short description | This document, top |
| Track declared | Track 4 (Agentic Economy) |
| Email associated with Circle Developer Account | `orangterkucil@gmail.com` |
| Circle products used | USDC, Arc, (Wallets + Gateway planned) |
| Functional MVP | https://freelancebot-alpha.vercel.app |
| Architecture diagram | In `README.md` and `02_architecture_diagram.mermaid` |
| Video demonstration | Script in `video_demo_script.md`, recording in week 7 |
| GitHub repo + docs | https://github.com/orangterkucil/freelancebot |
| Demo Application URL | https://freelancebot-alpha.vercel.app |
| Circle Product Feedback | `circle_product_feedback.md` |

---

## One line for the judges

**FreelanceBot replaces 14 days and 18% of friction with one transaction on Arc, mediated by an AI agent that does the boring work — built solo from Indonesia, on free-tier everything, in a week.**
