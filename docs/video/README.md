# Video assets

Final demo video lives here OR on YouTube unlisted (preferred).

## Files

- `freelancebot-demo.mp4` — compressed final cut (target < 25 MB)
- `freelancebot-demo-90s.mp4` — short cut for social (< 10 MB)

These files are **not committed to git** (see `.gitignore` rule below). Distribute via:

1. YouTube unlisted (paste link in README + Ignyte submission)
2. GitHub Releases (use `gh release create v1.0-demo *.mp4`)

## Why not commit raw video?

Even a compressed video bloats the repo permanently — every clone downloads the
entire history. Use GitHub Releases for big binaries; git for source.

## When you have the file

1. Compress per instructions in `../../video_demo_script.md` (FFmpeg one-liner or HandBrake)
2. Upload to YouTube unlisted, copy the link
3. Replace the placeholder in the main README:
   ```md
   <!-- ![Demo](https://example.com) -->
   ```
   with:
   ```md
   [![Watch the demo](./docs/landing.png)](https://youtu.be/YOUR_ID)
   ```
4. Optionally also: `gh release create v1.0-demo path/to/freelancebot-demo.mp4 --title "Demo video v1" --notes "Submission video for the Stablecoins Commerce Stack Challenge."`
