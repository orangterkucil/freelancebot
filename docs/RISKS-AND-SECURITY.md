# Risks & Security

FreelanceBot moves money. We'd rather be honest about what that means than
promise a frictionless fairy tale. This document explains what the system does,
what it does **not** guarantee, and the risks you take on when you use it. If
you're evaluating FreelanceBot, read this first.

> **Nothing here is financial, legal, or investment advice.** FreelanceBot does
> not offer yield, returns, or any guaranteed financial outcome. It is software
> for escrowing a payment between two parties.

## Status: testnet

FreelanceBot is currently deployed on **Arc testnet** (chain `5042002`). Arc
itself is not yet on mainnet. That means:

- The USDC used here is **testnet USDC with no monetary value** — it comes from a
  faucet and cannot be redeemed for real dollars.
- Everything is experimental and subject to change. Do not treat it as a
  production financial service.

## Smart-contract risk

- The escrow contract is **not audited by a third party.** We have written it
  carefully (checks-effects-interactions, OpenZeppelin `SafeERC20`/`Ownable`,
  custom errors, a capped fee), but unaudited code can contain bugs.
- Once an order is **funded, its terms are immutable** — amount, deadline, and
  counterparty cannot be changed. This protects the freelancer, but it also
  means a mistake made before funding is locked in.
- The contract owner **cannot withdraw or move escrowed funds.** There is no
  admin drain path. The owner can only rotate the agent address and the fee
  (capped at 1%).
- Funds are custodied by the **contract**, not by us. That removes us as a point
  of failure — and also means there is no support desk that can reverse an
  on-chain transaction.

## AI verification: what it does and doesn't do

The AI agent's job is to judge whether a submitted deliverable plausibly matches
the brief. Be clear-eyed about its limits:

- The agent primarily checks **deterministic facts** (is the deliverable URL
  reachable? was it submitted before the deadline?) plus a **plausibility
  judgment** from an LLM. It does **not** deeply inspect file contents today — it
  sees the deliverable's URL, not necessarily its full contents.
- The `verified` decision is **computed on the server** from the deterministic
  checks and the model's structured output — it is **not** a value the model can
  assert directly. A prompt injection that tries to output `verified: true`
  cannot flip the result.
- Inputs are sanitized against common injection patterns, and URL checks are
  **SSRF-guarded** (no `localhost`/private-range hosts, http(s) only).
- **Autonomous release is opt-in and off by default.** By default a human (the
  client) reviews the deliverable and clicks release. Fully autonomous release
  (the agent releasing on a passing verdict) is enabled only when the operator
  explicitly turns it on — because verification is not yet strong enough to trust
  with money unattended. Treat auto-release as experimental.
  The reasoning behind this is documented in
  [DESIGN-DECISIONS.md](./DESIGN-DECISIONS.md): no LLM defense is provably
  complete, so rather than only hardening the prompt we removed the agent's
  authority to move funds — even a fully successful injection gains nothing.

## What FreelanceBot does **not** guarantee

- It does **not** guarantee the delivered work is good, correct, or complete —
  only that basic checks passed. Review the deliverable yourself before releasing
  when you can.
- It does **not** guarantee a dispute-free outcome. The current safety nets are a
  refund after the deadline + grace period and (by design) a human in the loop.
- It does **not** guarantee uptime, and it is **not** insured.

## Protecting yourself (opsec)

FreelanceBot never asks for your seed phrase, private key, or password, and
neither should anyone claiming to represent it.

- **Never share** your seed phrase, private key, or wallet password — with
  anyone, ever, for any reason.
- **Enable 2FA** on your GitHub, wallet, and any connected accounts.
- **Verify the URL** before connecting a wallet. Bookmark the real app; don't
  follow links from DMs.
- Treat unsolicited "support", "airdrops", or "you've been selected" messages as
  scams. Real teams don't DM first.
- If something promises **guaranteed returns**, it's a scam. FreelanceBot offers
  none.

### Further reading

- Circle — [USDC overview & risk disclosures](https://www.circle.com/usdc)
- Coinbase — [How to keep your crypto secure](https://www.coinbase.com/learn/crypto-basics/how-to-secure-crypto)
- Coinbase — [Avoiding crypto scams](https://help.coinbase.com/en/wallet/security/avoiding-crypto-scams)
- FTC — [What to know about cryptocurrency and scams](https://consumer.ftc.gov/articles/what-know-about-cryptocurrency-scams)

## Responsible disclosure

Found a security issue? Please report it privately via a GitHub issue marked
"security" (or the repository's contact) rather than disclosing it publicly, so
it can be fixed before it's exploited. There is no bug bounty yet.

---

*This is a testnet project built for the Encode "Build on Arc" hackathon. Use it
to learn and experiment — not to custody value you can't afford to lose.*
