# Design Decisions

Why FreelanceBot is built the way it is. Each entry records the decision, the
reasoning behind it, and the honest trade-off — so the answer stays the same
whoever asks.

---

## 1. A human approves the release. The agent never moves money by default.

**Decision.** The AI agent verifies a deliverable autonomously and publishes a
verdict. It does **not** release the escrow. Only the client's wallet signature
moves USDC. Fully autonomous release exists in the codebase (`AGENT_AUTO_RELEASE`)
and is **off by default**.

### Why

**1. No LLM defense is provably complete.**
FreelanceBot does sanitize inputs, derive the `verified` flag on the server
rather than accepting it from the model, coerce outputs to a strict enum, and
guard URL checks against SSRF. Those are real mitigations — but prompt injection
remains an open research problem. Nobody has a defense that is proven airtight.
Designing as if ours is would be betting the user's money on an assumption the
industry cannot yet support.

**2. So we removed the authority instead of only hardening the prompt.**
This is the actual security property:

> Even if **every** other defense fails — an attacker gets the model to assert
> that a junk deliverable is perfect — they still gain nothing, because the agent
> has no capability to pay them.

That eliminates an entire attack class rather than patching one instance of it.
It is the OWASP LLM Top-10 **LLM08: Excessive Agency** mitigation: reduce what the
agent is permitted to do, instead of relying on convincing it to behave.

**3. On-chain payments are irreversible, so the blast radius is permanent.**

| | LLM mistake in a chatbot | LLM mistake with release authority |
|---|---|---|
| Result | A wrong answer | USDC permanently transferred |
| Recoverable? | Yes — ask again | **No.** No chargeback, no reversal, no support desk |

Precisely *because* the money is real and the transfer cannot be undone, the
decision is too consequential to delegate to a language model today. Requiring
human confirmation for irreversible actions is not a novelty — it is how serious
financial systems have always worked (dual control / four-eyes).

### What this costs us

It weakens the simplest version of the pitch: we cannot claim "the agent pays out
end to end, no human involved." That claim would be more impressive in a
one-liner, and it is the claim we deliberately gave up.

What we keep is the part that actually matters to a user: the slow step
(verification, historically days of back-and-forth) is fully automated and
finishes in seconds. The remaining human action is a single click on a decision
the user *wants* to control — approving payment for their own money.

### How to answer the common questions

**"So it isn't really autonomous?"**
> It's autonomous where it's safe. Verification — the part that used to take days
> — is fully automated and takes seconds. It is deliberately not autonomous at the
> part that's dangerous: only the client's signature moves funds.

**"What if someone prompt-injects the agent?"**
> They can't get paid by it. Not because our prompt is unbreakable, but because
> the agent has no authority to release funds. We removed the attack class rather
> than patching it. The verdict is also computed server-side, so injected text
> can't assert `verified: true` either.

**"Could you make it fully autonomous?"**
> Yes — the code path exists and ships behind an operator flag. It's off by
> default because verification isn't yet strong enough to trust unattended with
> real money. We'd rather turn it on when it's earned than default it on and hope.

**"Then what stops a client from ghosting and locking the freelancer's money?"**
> The escrow contract has a review-timeout path (`claimDelivered`): once the
> review window after delivery elapses, the delivery can be finalised to the
> freelancer. That autonomy is safe because it's a deterministic on-chain
> deadline, not a judgment call — prompt injection cannot influence a timestamp.
> (Wiring this into the app is on the roadmap; the contract function is written.)

### Status

- Implemented: `src/app/api/verify/route.ts` (auto-release gated behind
  `AGENT_AUTO_RELEASE`, off by default), `src/components/OrderActions.tsx`
  ("AI-verified · you keep the keys" panel before the release action).
- Related: [RISKS-AND-SECURITY.md](./RISKS-AND-SECURITY.md).

---

## 2. Public views never expose raw identity.

**Decision.** Public API responses (marketplace, activity feed, ratings) carry a
privacy-safe label — an X/GitHub handle if the user set one, otherwise a masked
email like `a••••e@gmail.com` — plus a rating summary. The raw email is used
server-side to compute those and is never returned.

**Why.** Reputation only works if you can see *who* you're dealing with, but a
freelance marketplace's user list is exactly the kind of data that gets scraped
and abused. The label carries enough signal to be accountable (a real, verified,
rateable account) without publishing a contact graph anyone can enumerate.

Identity is still real: accounts are verified by magic-link email or a connected
wallet. Anonymity here is presentational, not structural — you can't create
throwaway reputation, you just can't harvest other people's addresses.

**Trade-off.** A poster is slightly less "personal" on the public page than a full
name would be. Given the scraping risk, that's a good trade.

**Status.** `enrichPublicOrder` / `scrubOrderForPublic` in `src/lib/orders.ts`;
public rating responses scrubbed in `src/app/api/ratings/route.ts`.

---

## 3. Order terms lock the moment the escrow is funded.

**Decision.** Amount, deadline, and counterparty can be edited while an order is
a draft, and become immutable once funded.

**Why.** The freelancer accepts a job on specific terms. If the client could
lower the amount or pull the deadline in after funding, "escrow" would offer the
freelancer no protection at all. The contract enforces this, not just the UI.

**Trade-off.** A mistake made before funding is locked in — so the app shows the
reason explicitly ("terms are locked once funded") rather than hiding the edit
control and leaving the user confused.
