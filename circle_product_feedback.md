# Circle Product Feedback — FreelanceBot

> Submission requirement per the Stablecoins Commerce Stack Challenge rubric.
> This is honest builder feedback after shipping FreelanceBot on Arc Testnet with Circle's developer stack.

---

## Products we chose, and why

### USDC on Arc — the settlement layer

Arc was the right choice for FreelanceBot because Arc's USDC-denominated gas means **freelancers see exactly one currency in their wallet**. On a chain like Polygon or Base, even a USDC-native experience requires the user to also hold native gas tokens (POL, ETH) for transactions — which immediately breaks the "non-crypto-native" promise we make to emerging-market freelancers. With Arc, the freelancer in Jakarta doesn't have to know that "gas exists" — they just see USDC arrive when the client approves a deliverable.

Sub-second finality is the other reason Arc is the right pick for this use case. Cross-border payouts today take 10–18 days end-to-end. With Arc, the on-chain leg takes well under a second. That's not just an incremental improvement — it changes the freelancer's working capital math entirely.

### Circle Wallets (planned for week 6)

For the MVP we used MetaMask in the user's browser, but every emerging-market freelancer we talked to said the same thing: *"I'm not installing a browser extension to get paid."* Circle Wallets is the only product on the market that gives us a path to non-crypto-native UX (email-based, key custody handled) while still settling in real USDC on Arc. Implementing it is the top priority for our week-6 push.

### Circle Gateway (planned)

Once we charge a platform fee (currently 1% in the deployed contract via `_agentFeeBps`), routing those fees through Circle Gateway lets us hold platform treasury in yield-bearing form and split payouts to operations, growth and reserve buckets automatically. We haven't wired it yet, but the contract already separates `_agentFeeRecipient` from the freelancer payout in a single transaction, so Gateway slots in cleanly.

### Why we didn't use USYC or StableFX (yet)

Both are powerful, but both are **enterprise-gated** (per the challenge brief itself). As a solo builder from Indonesia, we don't currently meet the eligibility bar. We'd love to integrate USYC for idle escrow yield (e.g., a 7-day freelance project where the funds sit in escrow earning T-bill yield until release), and StableFX for the AED↔USDC↔IDR corridor that would close our remittance loop. If Circle ever opens these to verified hackathon projects without full KYB, we'd be the first in line.

---

## What worked well

**USDC contract addresses are well-documented.** The docs at `developers.circle.com/stablecoins/usdc-contract-addresses` had the Arc Testnet USDC address (`0x36000…0000`) clearly listed with the block-explorer link. Zero ambiguity. This sounds obvious but a lot of L1s/L2s bury this in Discord pins.

**Arc RPC + chain config docs are clean.** `docs.arc.io/arc/references/rpc-endpoints` gave us everything in one table — Chain ID `5042002`, primary RPC, alternate providers (Blockdaemon, dRPC, QuickNode), explorer, gas tracker, faucet. We were able to add Arc Testnet to MetaMask in 30 seconds.

**Circle Faucet UX is great.** `faucet.circle.com` worked first try. 20 USDC per address per 2 hours is more than enough for testnet iteration. The chain selector listed Arc Testnet right at the top.

**EVM compatibility is genuinely seamless.** We compiled a Solidity 0.8.24 contract using OpenZeppelin 5.x (SafeERC20, Ownable) in Remix, deployed it via Injected Provider MetaMask in two clicks, and arcscan auto-verified the source code. No special toolchain. No custom compiler. No "Arc-flavored" anything. That's exactly the right call for adoption.

**arcscan auto-verification is a winning detail.** Within a minute of deploy, our contract had a green "Source code verified (exact match)" badge. We didn't have to upload anything manually. For judges and end-users, this is huge for trust.

**Sub-second finality is real.** Our happy-path `createAndFund` transaction confirmed in ~0.6 seconds. For a UX where the freelancer needs to *see* funds clear before believing the system, this is the difference between "wow" and "wait, did it work?"

---

## What could be improved

**The Developer Console signup flow had a non-trivial failure mode for our region.** Initial signup attempts returned a generic `"An error occurred setting up your account"` with no actionable detail. Worked on a retry but the error message gave us nothing to debug. A specific reason (geo restriction? duplicate email? rate limit?) would save support cycles.

**There's no first-class "Arc dev quickstart" for a freelancer-style payment use case.** The Arc docs cover the protocol comprehensively, but a builder coming in cold has to assemble the pattern themselves: "How do I let a non-crypto user fund an escrow in USDC with a 1-click UX?" A worked-example repo (similar to Stripe's sample apps) that combines USDC + Wallets + Gateway in a single payment flow would shave hours off every new project.

**Enterprise gating for USYC / StableFX is a chicken-and-egg for early builders.** We understand the regulatory reality, but a "testnet-only sandbox" tier that any verified developer can enable (without full KYB) would let the community prototype yield-bearing escrow and FX-aware settlement patterns. Right now the docs hint at the power but the integration path is closed for anyone who isn't already an institution.

**Circle Wallets onboarding has a "two front doors" problem.** The Developer Console talks about Programmable Wallets; the Wallets docs talk about embedded wallets; the two surfaces use different vocabularies for similar primitives. A unified "Circle Wallets — pick your flow" decision tree at the top of the docs would help new builders pick the right integration without reading three product pages.

**Faucet rate limit could be more generous for hackathon participants.** 20 USDC every 2 hours is fine for normal testing, but during demo recording you sometimes need to reset state quickly (re-fund a fresh escrow, re-test refund path, etc.). A `?hackathon=stablecoins-commerce` query param that bumps the limit during the challenge window would have been a small but real quality-of-life win.

---

## Recommendations

1. **Ship a "freelancer payouts on Arc in 50 lines" sample app** as part of the Arc docs. The pattern is universal (escrow → deliverable → release) and it's exactly what most commerce teams want to build first.
2. **Open USYC / StableFX testnet-only access to any verified Circle Developer account.** Even rate-limited. The hackathon would have produced 10× more interesting submissions if everyone could touch these primitives.
3. **Add specific error reasons to Developer Console signup failures.** A single string in the error response makes the difference between "I can fix this" and "I'm emailing support and waiting 48 hours."
4. **Publish a recommended Arc + Circle Wallets reference stack** (Next.js + ethers + Circle Wallet SDK + something for off-chain mirror). Most builders are reinventing the same scaffold.
5. **Consider a "FreelanceBot-style" payment template in Circle's product gallery.** Cross-border payouts is the single highest-leverage Arc use case for emerging markets. Showing a worked example would attract exactly the right kind of builder.

---

## What we'd build next, given more time

- **Wire Circle Wallets so non-crypto users sign in with email** and the wallet is created server-side, custodied via Circle.
- **Use Gateway to split platform fees** across operations, growth and reserve buckets in a single tx.
- **Add a CCTP-based "pay in any USDC, settle on Arc" mode** so US clients holding Ethereum-USDC don't have to bridge manually.
- **Apply for USYC access** to offer freelancers a "park your earnings in T-bill yield until withdrawn" sweep account.
- **Apply for StableFX** to close the AED ↔ USDC ↔ IDR corridor with on-chain FX.

---

## TL;DR

Circle's stack — USDC, Arc, Wallets (planned), Gateway (planned) — is the most coherent commerce-grade payment stack in stablecoin land today. The protocol-level work (USDC-denominated gas on Arc, sub-second finality, auto-verified contracts) is excellent. The developer-experience layer (docs, sample apps, gated tooling) is where the most leverage remains. With another quarter of polish on the DX side, Arc + Circle is the obvious choice for any team building stablecoin-native commerce — especially for emerging markets.
