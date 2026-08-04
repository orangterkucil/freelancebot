# FreelanceBot — Demo Video Recording Plan

> **Target: 3:00–3:30.** One take per section, cut later. The goal is **proof**, not polish:
> a judge must see the real app, a real MetaMask signature, and a real transaction on Arcscan.
>
> An animated reel cannot prove that. Use `/demos.html` only as a ~5-second intro sting if you want.

---

## 0. Prep — do this BEFORE you hit record

| # | Item | Why it matters |
|---|---|---|
| 1 | **Restore the Supabase project** (dashboard → Restore) | It auto-paused; the app is down until you do. Nothing works without this. |
| 2 | Two browser profiles: **Client** and **Freelancer** | The whole point is a cross-party payment. One profile each. |
| 3 | Two wallets, both funded with **Arc testnet USDC** | Client pays escrow + gas; freelancer needs an address to receive. |
| 4 | Pre-create one job so the marketplace isn't empty | An empty marketplace looks dead on camera. |
| 5 | Tabs open and ready: app, `testnet.arcscan.app`, GitHub repo | No fumbling for URLs mid-take. |
| 6 | Zoom to ~110%, hide bookmarks bar, silence notifications | Text must stay readable at 1080p after compression. |
| 7 | One **full dry run** without recording | You will hit one snag. Better now than in take 4. |

**Record with:** OBS Studio (screen + mic). **Edit with:** CapCut / DaVinci Resolve (free).
Speak slightly faster than normal, in English. Add captions — many judges watch muted.

---

## 1. Hook + the problem — 0:00–0:25

**Screen:** landing hero (`freelancebot-alpha.vercel.app`), slow scroll.

> "A designer in Jakarta finishes a $300 job for a client in New York. Two weeks later the money lands — minus PayPal fees, FX spread, and a SWIFT charge. That's the tax on global freelance work today: slow, opaque, expensive.
>
> FreelanceBot replaces it with a USDC escrow on Arc that an AI agent verifies — and settles in under a second."

**Do:** pause briefly on the "Built on Arc" badge and the live contract chip.

---

## 2. The marketplace + trust — 0:25–0:50

**Screen:** `/jobs`.

> "This is the open marketplace. Every job shows who posted it and their reputation — a portable trust score, without exposing anyone's identity. Below is live market activity: real escrows moving from funded, to delivered, to paid."

**Do:** hover a job card (poster + stars visible), then scroll to **Market activity**.
**Why it lands:** proves this is a working market, not one hardcoded demo order.

---

## 3. Client: post + fund the escrow — 0:50–1:40

**Screen:** Client profile.

> "As the client I post a job — brief, budget, deadline. A freelancer applies, and I see their trust score inline before I accept."

**Do:** post job → switch to freelancer tab → apply → back to client → **Accept**.

> "Now I fund the escrow. This is a real transaction on Arc: USDC is locked in the contract, and the payout address is the freelancer's own wallet — I can't reroute it, and neither can the platform."

**Do:** **Fund** → let **MetaMask open fully on camera** → confirm → show the tx hash appear.

> ⚠️ **Keep MetaMask fully in frame.** That popup is the single most convincing frame in the video.

---

## 4. Freelancer: deliver + AI verification — 1:40–2:25

**Screen:** Freelancer profile, same order.

> "As the freelancer I deliver the actual work — I can upload the files or photos directly, not just paste a link."

**Do:** **drag a real image file** into the upload box; let it finish.

> "When I submit, I sign an on-chain delivery, and the AI agent verifies it — checking the deliverable is reachable, that it met the deadline, and that it matches the brief. The verdict is computed on the server, so a prompt injected into the deliverable can't talk the agent into approving it."

**Do:** Submit → MetaMask signature → **let the agent verdict render**. Read it aloud.

---

## 5. Release + on-chain proof — 2:25–3:00

**Screen:** Client profile.

> "The agent verified it — but it does not move my money. That's deliberate. The agent is autonomous where it's safe: verification. The signature that releases funds is mine."

**Do:** show the **"AI-verified · you keep the keys"** panel → **Approve & release** → MetaMask → confirm.

> "Released. Sub-second finality on Arc, settled in USDC, one percent protocol fee — versus the five to twenty percent a legacy freelance and payment stack charges."

**Do:** ⭐ **Click the tx link → open Arcscan → show the USDC transfer to the freelancer's address.**

> ⚠️ **This is the money shot.** Do not skip it. Hold on Arcscan for 4–5 seconds.

**Then:** switch to the freelancer tab — released status + the rating prompt.

> "Both sides rate each other, and that reputation follows them to the next job."

---

## 6. Under the hood + close — 3:00–3:30

**Screen:** Arcscan contract page, then GitHub.

> "The escrow contract is live on Arc testnet and verified. The fee is capped in the contract itself, so it can never be raised on a user. It's open source, MIT licensed, and ships with an honest risks-and-security disclosure — because this moves money, and pretending otherwise would be dishonest.
>
> FreelanceBot. Get paid the moment you deliver."

**Do:** contract `0xA8CA…3ae4` on Arcscan → GitHub repo → end on the landing page.

---

## Mistakes that cost points

- ❌ Cutting away before a transaction confirms — judges assume it failed.
- ❌ MetaMask cropped out of frame — leaves "is this real?" unanswered.
- ❌ Never showing Arcscan — without it, everything could be a mockup.
- ❌ Reciting the script robotically — talk, don't read.
- ❌ Dead silence while a tx mines — narrate it ("this is settling on Arc now").
- ❌ Running past 4 minutes — judges watch dozens of these.

## If something breaks mid-recording

The app has a simulated path for demo orders that were never funded on-chain.
**Do not use it for the video** — an off-chain "release" moves no money and produces
no tx hash, and a sharp judge will notice. If a real transaction fails: stop, fix, re-record.
One honest take beats a polished fake.

---

## Compress before uploading

```bash
ffmpeg -i raw.mov \
  -c:v libx264 -crf 25 -preset slow \
  -c:a aac -b:a 96k -ac 1 \
  -vf "scale=1280:-2,fps=30" \
  -movflags +faststart \
  freelancebot-demo.mp4
```

- `-crf 25` — quality (lower = bigger + better; 18–28 is the useful range)
- `-preset slow` — encoder works harder = smaller file
- `scale=1280:-2` — downscale to 720p width, height auto
- `fps=30` — halve the bitrate need if you recorded 60fps
- `-b:a 96k -ac 1` — mono 96 kbps is plenty for voiceover
- `+faststart` — starts playing before it finishes downloading

A 3–4 minute 1080p60 recording typically lands at **15–25 MB**.

### Where to upload (priority order)

1. **YouTube unlisted** — paste the link in the submission form + README. Most judges prefer this: no download, plays in-page.
2. **GitHub Release asset** — `gh release create v1.0-demo freelancebot-demo.mp4 --notes "Hackathon demo video"` — permanent direct link, 2 GB max.
3. **Direct upload to the submission form** — only if it accepts files that large.

Never commit the video file to git; use Releases.

## 90-second social cut

Same recording, just trim: Section 2 (what it does) → client funds → agent verifies + release → Arcscan + close.
