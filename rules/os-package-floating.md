---
alwaysApply: true
---

# OS Package Floating

## Approved exception to `coding-policy: dependency-management`

The `apt-get install` package lists in `jbaruch/nanoclaw`'s three container images carry no version specifiers. This file is the authority-of-record for those installs under the OS-Package Runtime Carve-Out, introduced in `jbaruch/coding-policy` 0.3.131.

## Covered images and package sets

- `container/Dockerfile` (agent) — chromium, fonts-liberation, fonts-noto-color-emoji, libgbm1, libnss3, libatk-bridge2.0-0, libgtk-3-0, libx11-xcb1, libxcomposite1, libxdamage1, libxrandr2, libasound2, libpangocairo-1.0-0, libcups2, libdrm2, libxshmfence1, curl, git, jq, poppler-utils, python3, sqlite3, gh
- `Dockerfile.orchestrator` — ca-certificates, curl, docker.io, g++, gh, make, python3, sqlite3
- `container/audible-backup/Dockerfile` (sidecar) — ffmpeg

The authoritative machine-readable copy is `COVERED_IMAGES` in `jbaruch/nanoclaw` `scripts/deploy.sh` step 3b-quater; this list is the human-readable mirror.

## Why these float

- Debian's archive serves only the current version of a package, so a literal `pkg=<version>` pin stops resolving at the next security update and fails every build of the image
- The consumed surface is a command-line invocation or a distro-managed ABI, not a semver-governed source API

## Bounds and deploy-time enforcement

- Each covered image's base MUST stay pinned to a specific tag or digest: agent and orchestrator pin `node:26-trixie-slim` by digest, the sidecar pins `python:3.14-slim` by minor tag
- `.github/dependabot.yml`'s `docker` ecosystem tracks all three
- A base moved to a floating `:latest` voids this carve-out for that image
- Each covered image MUST be rebuilt on every deploy: agent at `deploy.sh` step 2a, orchestrator at 2b, sidecars at 2a-bis
- CI additionally builds the audible-backup image on every pull request
- Each rebuild runs `apt-get update` against the current archive

`scripts/deploy.sh` step 3b-quater MUST fail the deploy when:

- A covered image's `FROM` carries no tag, or carries the floating `:latest`
- An `apt-get install` in a covered image names a package outside that image's recorded set
- A covered Dockerfile cannot be read, or contains no recognisable install — a moved or renamed target fails loudly, never passes vacuously

Adding a package to a covered image is a reviewed edit to `COVERED_IMAGES`, never a one-line addition to the Dockerfile alone.

## Scope

- OS packages in the three named images only. `pip` and `npm` installs in the same files still pin — `audible-cli` in the sidecar, `agent-browser` / `@anthropic-ai/claude-code` / `tessl` in the agent and orchestrator images
- Packages already present in a base image, and transitive dependencies apt resolves, are out of scope
- Related: [[sync-cli-floating]] covers a different exemption in the same Dockerfile

## Surface sync

When a covered image's package set or base changes, update in lock-step: this rule's Covered-images list, `COVERED_IMAGES` in `jbaruch/nanoclaw` `scripts/deploy.sh`, the Dockerfile comment beside the install, and `jbaruch/nanoclaw`'s CHANGELOG. See `coding-policy: context-artifacts` Surface Sync.
