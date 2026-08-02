---
alwaysApply: true
---

# OS Package Floating

## Approved exception to `coding-policy: dependency-management`

The `apt-get install` package lists in `jbaruch/nanoclaw`'s three container images carry no version specifiers. This file is the authority-of-record for those installs under the OS-Package Runtime Carve-Out, introduced in `jbaruch/coding-policy` 0.3.130.

## Covered images and package sets

- `container/Dockerfile` (agent) — chromium, fonts-liberation, fonts-noto-color-emoji, libgbm1, libnss3, libatk-bridge2.0-0, libgtk-3-0, libx11-xcb1, libxcomposite1, libxdamage1, libxrandr2, libasound2, libpangocairo-1.0-0, libcups2, libdrm2, libxshmfence1, curl, git, poppler-utils, python3, sqlite3, gh
- `Dockerfile.orchestrator` — ca-certificates, curl, docker.io, g++, gh, make, python3, sqlite3
- `container/audible-backup/Dockerfile` (sidecar) — ffmpeg

The authoritative machine-readable copy is `COVERED_IMAGES` in `jbaruch/nanoclaw` `scripts/deploy.sh` step 3b-quater; this list is the human-readable mirror.

## Why these float

- Debian's archive serves only the current version of a package, so a literal `pkg=<version>` pin stops resolving at the next security update and fails every build of the image
- The consumed surface is a command-line or shared-library contract — `ffmpeg -i`, chromium's binary, `libnss3.so` — not a versioned API
- The distro release bounds the versions: each base image is pinned, so "current in trixie" is a bounded range, not open-ended

## Base pinning is the bound, not an aside

- `container/Dockerfile` and `Dockerfile.orchestrator` pin `node:26-trixie-slim` by digest, tracked by `.github/dependabot.yml`'s `docker` ecosystem
- `container/audible-backup/Dockerfile` pins `python:3.14-slim` by minor tag, tracked by the same ecosystem on its own directory
- A base moved to a floating `:latest` voids this carve-out for that image — floating both ends is unbounded

## Rebuild cadence stands in for the pin

- `./scripts/deploy.sh` rebuilds all three images on every deploy: agent at step 2a, orchestrator at 2b, sidecars at 2a-bis
- CI additionally builds the audible-backup image on every pull request
- Each rebuild runs `apt-get update` against the current archive, so the packages track the distro's security state continuously

## Verify on every deploy

`scripts/deploy.sh` step 3b-quater MUST fail the deploy when:

- A covered image's `FROM` carries no tag, or carries the floating `:latest`
- An `apt-get install` in a covered image names a package outside that image's recorded set
- A covered Dockerfile cannot be read or contains no recognisable install — a moved or renamed target fails loudly, never passes vacuously

Adding a package to any covered image is therefore a reviewed edit to `COVERED_IMAGES`, not a silent one-line growth of the exemption.

## Scope

- OS packages in the three named images only. `pip` and `npm` installs in the same files still pin — `audible-cli` in the sidecar, `agent-browser` / `@anthropic-ai/claude-code` / `tessl` in the agent and orchestrator images
- Related: [[sync-cli-floating]] covers a different exemption in the same Dockerfile

## Surface sync

When a covered image's package set or base changes, update in lock-step: this rule's Covered-images list, `COVERED_IMAGES` in `jbaruch/nanoclaw` `scripts/deploy.sh`, the Dockerfile comment beside the install, and `jbaruch/nanoclaw`'s CHANGELOG. See `coding-policy: context-artifacts` Surface Sync.
