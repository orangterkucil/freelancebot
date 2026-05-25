# FreelanceBot — Video Demo Script

> Target length: **3:30 – 4:00 minutes**. Submission rubric asks for "video demonstration succinctly outlining core functions and effective use of Circle's Developer tools." Aim for that — not a polished marketing reel.

> Style: screen-record with face-cam in corner is optional. **Voiceover in English** (judges include international Circle/Arc team). Pace: slightly faster than normal speech, but clear.

> Tools: OBS Studio (free, record screen + mic + webcam) → CapCut or DaVinci Resolve Free (cut + add captions).

---

## Storyboard at a glance

| Section | Duration | What's on screen |
|---|---|---|
| 1. Hook + problem | 0:00 – 0:30 | Talking head OR landing page hero |
| 2. Solution one-liner | 0:30 – 0:45 | Landing page full view |
| 3. Live demo: client flow | 0:45 – 1:45 | Client dashboard, create + fund order |
| 4. Live demo: freelancer flow | 1:45 – 2:30 | Freelancer dashboard, submit + agent verify |
| 5. Live demo: release | 2:30 – 2:50 | Client side, approve & release |
| 6. Under the hood | 2:50 – 3:30 | arcscan contract page, GitHub repo |
| 7. Close | 3:30 – 3:50 | Differentiators + CTA |

---

## Section 1 — Hook + problem (0:00 – 0:30)

**On screen:** Either your talking head, or scroll through landing page hero.

**Voiceover:**
> "A freelance designer in Jakarta accepts a three-hundred-dollar logo job from a US client. Today, by the time the money lands in her bank account, two weeks have passed and the payment is down to two-twenty after PayPal fees, FX spread, and SWIFT charges. Multiply that by every freelancer in emerging markets and it's a twenty-billion-dollar annual tax on global digital work."
>
> "I'm tarjo, a builder from Indonesia. I built FreelanceBot for the Stablecoins Commerce Stack Challenge to fix exactly this — with USDC on Arc and an AI agent that handles the boring parts of getting paid."

---

## Section 2 — Solution one-liner (0:30 – 0:45)

**On screen:** Landing page at `freelancebot-alpha.vercel.app`, full view. Hover/highlight the deployed contract address in the footer briefly.

**Voiceover:**
> "FreelanceBot is an AI payment agent. Clients fund USDC escrow on Arc, the agent verifies the deliverable, and payment releases in under a second. No PayPal fees, no SWIFT wait, no Upwork hold."
>
> "Smart contract is already deployed and verified on Arc Testnet — link in the description."

---

## Section 3 — Live demo: client flow (0:45 – 1:45)

**On screen:** Click "I'm a client →". Sign in with `client@demo.com`.

**Voiceover (as you click):**
> "Let me walk through the full flow. I'm the client — say I'm hiring a freelance designer."

Click "+ New order". Fill the form on camera:
- Freelancer email: `freelancer@demo.com`
- Brief: `Brand logo + 3 variations, deliver via Figma link`
- Amount: `300`
- Deadline: 7 days from today

**Voiceover:**
> "I describe the job, set the amount in USDC, pick a deadline."

Click **Create order**. Then click into the order.

**Voiceover:**
> "Now I fund the escrow. In the production version this calls our deployed contract on Arc directly — `createAndFund` pulls the USDC from my wallet into escrow. For this demo I'll simulate it with one click."

Click **"Fund 300 USDC (simulated)"**. Status flips to Funded.

**Voiceover:**
> "Done. Funds are locked in escrow. The freelancer can now see the job."

---

## Section 4 — Live demo: freelancer flow + agent verify (1:45 – 2:30)

**On screen:** Open new tab → `/freelancer`. Sign in as `freelancer@demo.com`. Open order #X.

**Voiceover:**
> "Switching to the freelancer side. Same order, different view. I do the work, then submit the deliverable."

Paste a real GitHub or Figma URL in the deliverable field. Click **Submit deliverable**.

**Voiceover:**
> "The moment I submit, the AI agent — Groq Llama 3.3, running serverless — does three things. One: checks the URL is actually reachable. Two: checks the deadline hasn't passed. Three: uses an LLM judgment call to decide whether the contents plausibly match the original brief."

Wait for the verdict bubble to appear.

**Voiceover (as verdict appears):**
> "Verdict comes back in a few seconds. The agent never auto-releases — that would be irresponsible for real money — but it tells the client clearly: ready to release, or hold for review, with full reasoning."

(Optionally show the chat panel below — agent has been responding to messages contextually in the conversation.)

**Voiceover:**
> "And throughout the order's life, both parties can chat with the agent for clarification. The agent sees the order context — brief, amount, deadline, status — so its answers are always grounded."

---

## Section 5 — Live demo: release (2:30 – 2:50)

**On screen:** Switch back to client tab. Reload order page. Click green **"Approve & release"** button.

**Voiceover:**
> "I'm the client again. The agent recommended release. I click approve."

Click. Status flips to Released.

**Voiceover:**
> "Released. In the on-chain version, this calls `approveAndRelease` on the contract. USDC settles to the freelancer's wallet at Arc finality — sub-second — minus a one-percent platform fee that routes through Circle Gateway."

---

## Section 6 — Under the hood (2:50 – 3:30)

**On screen:** Open `https://testnet.arcscan.app/address/0xA8CA04560603951b0f0e803039B059432F673ae4`. Show the green "Source code verified (exact match)" badge.

**Voiceover:**
> "Quick look at the on-chain side. The escrow contract is deployed on Arc Testnet, and arcscan auto-verified the source code. Anyone — judges, freelancers, clients — can read exactly what the contract does. No magic."

Scroll to the Read/Write contract tab. Highlight `createAndFund`, `submitDelivery`, `approveAndRelease`, `refund`.

**Voiceover:**
> "Four state-changing functions, all guarded. Custom errors for gas efficiency. SafeERC20 for token handling. Ownable for the agent address. Eighteen unit tests in the repo cover happy path, edge cases, and the full Jakarta-to-NYC lifecycle."

Switch to the GitHub repo at `github.com/orangterkucil/freelancebot`. Scroll the README briefly.

**Voiceover:**
> "Everything is open source. Live demo URL, contract address, GitHub link — all in the README. Built solo, in public, on free-tier everything."

---

## Section 7 — Close (3:30 – 3:50)

**On screen:** Back to landing page, or talking head.

**Voiceover:**
> "Why this submission, in three lines."
>
> "One — built on Arc, first-mover advantage on a stack that didn't exist last year."
>
> "Two — agentic, not just payment rails. The AI agent is the differentiator that fits Track 4."
>
> "Three — emerging-market POV. I'm building for the freelancers I know in Indonesia, not a US thought experiment."
>
> "Thanks for watching. Try it at `freelancebot-alpha.vercel.app`."

(Optional end card: project name, contract address, GitHub link.)

---

## Pre-record checklist

- [ ] Site is live and the latest build is deployed
- [ ] Two demo email accounts work (`client@demo.com` + `freelancer@demo.com`)
- [ ] Create a clean order beforehand for the recording — or do it on camera
- [ ] Have arcscan tab pre-loaded
- [ ] Have GitHub repo tab pre-loaded
- [ ] Mic gain tested (do a 10-second test record)
- [ ] Browser zoom at ~110% so text is readable on smaller screens
- [ ] Close unrelated tabs (especially anything with crypto wallets in the bookmark bar — looks messy)
- [ ] Quiet 30-minute window booked

## Editing notes

- Cut hard between sections — pauses kill momentum
- Add captions throughout — many judges watch muted
- Burn the live URL into the bottom-right corner from 0:45 onward as a sticky overlay
- End card holds for 2 full seconds so people can read it
- Export 1080p, MP4, under 100 MB (Ignyte upload limit safe)

---

## Quick-cut version (90 seconds, for social)

If you also want a Twitter/LinkedIn cut, take Sections 2 + 3 + 5 + 7 only:
- 0:00 — what it does (Section 2)
- 0:15 — client funds order
- 0:45 — agent verifies + client releases
- 1:15 — contract address on Arc + close

Same recording, just trim.
