# Versioning

FreelanceBot follows [Semantic Versioning 2.0.0](https://semver.org/).

Given a version `MAJOR.MINOR.PATCH`, we increment:

- **MAJOR** when we make incompatible API/contract/UI-flow changes
- **MINOR** when we add functionality in a backward-compatible manner
- **PATCH** when we make backward-compatible bug fixes

## Pre-1.0 (current phase)

Until MVP 2 ships (multi-chain + multi-language + back office + embedded wallet), we are in the `0.x.y` range.

- `0.MINOR.0` — significant feature additions during the hackathon → community-product transition
- `0.x.PATCH` — bug fixes that don't change public surface

We will cut `1.0.0` when:
- ≥ 3 EVM chains are configurable (Arc, Base, Polygon at minimum)
- UI is translated into at least 3 non-English languages
- Back office / admin panel ships
- At least one embedded-wallet option is wired (Privy / Circle Wallets)
- `docker-compose.yml` boots a complete self-hosted instance from a fresh checkout

## Tag format

Tags are SemVer-prefixed with `v`: `v0.1.0`, `v0.6.0`, `v1.0.0`, etc.

## What goes in a release

Every tagged release ships with:
1. A git tag (`v<MAJOR>.<MINOR>.<PATCH>`)
2. A matching `CHANGELOG.md` entry under `## [v<version>] — YYYY-MM-DD`
3. A GitHub Release with the changelog excerpt as body
4. Optionally, release assets (e.g. compiled video demo, signed contract artifacts)

## Tagging workflow

We use the `release` npm scripts (added in `package.json`) to make tagging foolproof.

### Bump a minor version (most common during 0.x phase)

```bash
npm run release:minor
# bumps package.json version, commits "chore(release): vX.Y.0",
# creates annotated tag vX.Y.0, pushes commit + tag
```

### Patch (bug fix only)

```bash
npm run release:patch
```

### Major (breaking change)

```bash
npm run release:major
```

After the tag is pushed, create a GitHub Release from it (via the web UI or `gh release create`) using the matching CHANGELOG section as the body.

## Conventional Commits (encouraged, not strictly enforced yet)

To make changelog generation eventually automatable, prefer commit messages of the form:

```
<type>(<scope>): <subject>

[optional body]

[optional footer(s)]
```

Where `<type>` is one of:
- `feat:` new feature → MINOR bump candidate
- `fix:` bug fix → PATCH bump candidate
- `docs:` docs only → no version bump
- `refactor:` neither feature nor fix → no version bump
- `chore:` tooling/release/dependency → no version bump
- `test:` tests only → no version bump
- `perf:` performance improvement → PATCH bump candidate

Breaking changes are signaled by `!` after type/scope or a `BREAKING CHANGE:` footer.

## Example release sequence

```bash
# 1. Make sure main is clean and CI is green
git status
git pull

# 2. Edit CHANGELOG.md — move items from [Unreleased] to a new [vX.Y.Z] section
$EDITOR CHANGELOG.md
git add CHANGELOG.md
git commit -m "docs(changelog): release notes for vX.Y.Z"

# 3. Bump + tag + push
npm run release:minor      # or :patch / :major

# 4. Create the GitHub Release
gh release create vX.Y.Z --notes-from-tag
```
