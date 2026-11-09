# OS Package Floating

## Approved exception to `coding-policy: dependency-management`

The `apt-get install` package lists in `jbaruch/nanoclaw`'s four container images carry no version specifiers. This file is the authority-of-record for those installs under the OS-Package Runtime Carve-Out, introduced in `jbaruch/coding-policy` 0.3.131.

## Covered images and package sets

- `container/Dockerfile` (agent) — chromium, fonts-liberation, fonts-noto-color-emoji, libgbm1, libnss3, libatk-bridge2.0-0, libgtk-3-0, libx11-xcb1, libxcomposite1, libxdamage1, libxrandr2, libasound2, libpangocairo-1.0-0, libcups2, libdrm2, libxshmfence1, curl, git, jq, poppler-utils, python3, python3-venv, sqlite3, gh
- `Dockerfile.orchestrator` — ca-certificates, curl, docker.io, g++, gh, make, python3, sqlite3
- `container/audible-backup/Dockerfile` (sidecar) — ffmpeg
- `container/visible-browser/Dockerfile` (persistent browser) — ca-certificates, chromium, curl, fonts-liberation, fonts-noto-color-emoji, novnc, openbox, websockify, x11-utils, x11vnc, xvfb

The authoritative machine-readable copy is `COVERED_IMAGES` in `jbaruch/nanoclaw` `scripts/checks/os_package_pins.py`; this list is the human-readable mirror.

## Why these float

- Debian's archive serves only the current version of a package, so a literal `pkg=<version>` pin stops resolving at the next security update and fails every build of the image
- The consumed surface is a command-line invocation or a distro-managed ABI, not a semver-governed source API

## Bounds and enforcement

- Each covered image's base MUST stay pinned to a specific tag or digest: agent, orchestrator and visible browser pin `node:26-trixie-slim` by digest, the sidecar pins `python:3.14-slim` by minor tag
- `.github/dependabot.yml`'s `docker` ecosystem tracks all four image directories; a deterministic test also keeps the visible-browser base aligned with the agent's pin
- A base moved to a floating `:latest` voids this carve-out for that image
- Each covered image MUST be rebuilt on every deploy: agent at `deploy.sh` step 2a, orchestrator and visible browser at 2b, build-script sidecars at 2a-bis
- CI additionally builds the audible-backup and visible-browser images on every pull request; the browser canary verifies sandbox startup, private CDP access and profile persistence
- Each rebuild runs `apt-get update` against the current archive

`scripts/checks/os_package_pins.py`, run by the `jbaruch/nanoclaw` test suite on every pull request, MUST fail when:

- A covered image's `FROM` carries no tag, or carries the floating `:latest`
- An `apt-get install` in a covered image names a package outside that image's recorded set
- A covered Dockerfile cannot be read, or contains no recognisable install — a moved or renamed target fails loudly, never passes vacuously

Adding a package to a covered image is a reviewed edit to `COVERED_IMAGES`, never a one-line addition to the Dockerfile alone.

## Scope

- OS packages in the four named images only. `pip` and `npm` installs in the same files still pin — `audible-cli` in the sidecar, `agent-browser` / `@anthropic-ai/claude-code` / `tessl` in the agent and orchestrator images
- Packages already present in a base image, and transitive dependencies apt resolves, are out of scope
- Related: [[sync-cli-floating]] covers a different exemption in the same Dockerfile

## Surface sync

When a covered image's package set or base changes, update in lock-step: this rule's Covered-images list, `COVERED_IMAGES` in `jbaruch/nanoclaw` `scripts/checks/os_package_pins.py`, the Dockerfile comment beside the install, and `jbaruch/nanoclaw`'s CHANGELOG. See `coding-policy: context-artifacts` Surface Sync.

- For a cross-repository package addition, publish this approved inventory first.
- Update all named consumer surfaces together in one reviewed PR.
- Until that PR lands, the consumer's narrower recorded set remains authoritative for its images.
- Install the published authority before deploying the consumer addition.
- Every deployed package must appear in both the installed authority and the consumer's recorded set.
