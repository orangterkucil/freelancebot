# FreelanceBot Demo Reel — Voiceover Script

Total runtime: **2:30**. Seven scenes. Paste each block into ElevenLabs / Speechify / your extension of choice, generate MP3, sync in editing.

**Recommended voice**: **Adam** (ElevenLabs, deep confident male) or **Rachel** (ElevenLabs, natural female). Both sound near-human. Free tier: 10,000 chars/month — this whole script uses ~800.

---

## Scene 1 — Logo intro (8s)
> **Cue**: 0:00 – 0:08

FreelanceBot. Payouts on Arc.

---

## Scene 2 — Problem (20s)
> **Cue**: 0:08 – 0:28

A three-hundred-dollar job. Two weeks later, only two-twenty arrives. Eighty dollars lost to fees. Fourteen days of waiting.

---

## Scene 3 — Solution (18s)
> **Cue**: 0:28 – 0:46

FreelanceBot fixes it. USDC on Arc. Verified by an AI agent. Released in under one second.

---

## Scene 4 — Client tutorial (40s)
> **Cue**: 0:46 – 1:26

As a client — six steps. Sign in. Post a job. Pick your freelancer from the applicants. Fund the escrow with one MetaMask signature. Watch the AI agent verify the deliverable. Approve and release. Sub-second settlement on Arc.

---

## Scene 5 — Freelancer tutorial (40s)
> **Cue**: 1:26 – 2:06

As a freelancer — six steps. Browse the marketplace. Filter by your skill. Apply with a quick pitch. Deliver your work. The agent verifies it live. Get paid two-hundred-ninety-seven USDC in point-eight seconds. No SWIFT. No two-week hold.

---

## Scene 6 — Under the hood (12s)
> **Cue**: 2:06 – 2:18

Smart contract source-verified on Arc. AI agent hardened against the OWASP LLM Top Ten. Open source under MIT. Fork it. Deploy it. Own it.

---

## Scene 7 — Closing (12s)
> **Cue**: 2:18 – 2:30

FreelanceBot. Autonomous payouts on Arc. Try the live demo now.

---

# Extension Setup (Chrome)

## Option 1 — ElevenLabs Reader (BEST quality, recommended)

1. Install: https://chromewebstore.google.com/detail/elevenlabs-reader/eddgfjnfemdbcnmimifpblegkfoaddom
2. Sign in with any email → free tier
3. In extension settings: pick voice **Adam** or **Rachel**
4. Open `demo-reel.html?tts=off` in Chrome (the `?tts=off` disables browser TTS so it doesn't double up)
5. Copy each scene text above → paste into extension → generate → download MP3
6. Repeat for all 7 scenes → get 7 MP3 files

## Option 2 — Speechify (fastest setup, decent quality)

1. Install: https://chromewebstore.google.com/detail/speechify-audio-reader/ljflmlehinmoeknoonhibbcfdbkynden
2. Sign in
3. Open `demo-reel.html?tts=off`
4. Highlight text on page → click Speechify icon → it reads with natural voice
5. Or paste each scene text → generate audio file

## Option 3 — NaturalReader (free, no signup)

1. Install: https://chromewebstore.google.com/detail/naturalreader-text-to-spe/momlpjpjcfmoemhephnjaakgdcaoklof
2. Open `demo-reel.html?tts=off`
3. Highlight text → click icon → reads

---

# Recording Workflow

## Simplest — one take with pre-generated voice
1. Pre-generate all 7 MP3s using ElevenLabs (Option 1 above)
2. Combine MP3s in Audacity (free) into single `voiceover.mp3` in scene order
3. Open `demo-reel.html?tts=off` in Chrome → F11 fullscreen
4. Start QuickTime screen recording (macOS)
5. Start playing `voiceover.mp3` in a background tab or QuickTime audio player
6. Immediately click "Start" on the reel
7. Stop recording when reel finishes
8. Result: MP4 with cinematic reel + human-quality AI voice

## Cleanest — separate audio track, sync in editor
1. Screen record reel silent (no audio)
2. Open in DaVinci Resolve Free (or CapCut) → import both video + voiceover MP3
3. Sync MP3 to scene transitions
4. Export MP4 1080p

## Extension-live — least reliable
1. Open `demo-reel.html?tts=off` in Chrome
2. In another tab: paste all scene text into ElevenLabs Reader
3. Start QuickTime with "audio: computer input" so it captures both
4. Play extension audio + click Start on reel simultaneously
5. Sync is manual so timing may drift — trim in editor after

---

# Character Counts (for free-tier budgeting)

| Scene | Chars | Notes |
|---|---|---|
| 1 | 30 | 3 words |
| 2 | 133 | punchy |
| 3 | 91 | short |
| 4 | 274 | most words |
| 5 | 258 | most words |
| 6 | 133 | credentials |
| 7 | 66 | close |
| **Total** | **985** | fits in any free tier |

ElevenLabs free = 10,000 chars/month. This reel uses <10% of monthly quota.
