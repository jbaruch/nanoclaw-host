# OS Package Floating

## Approved exception to `coding-policy: dependency-management`

The following `jbaruch/nanoclaw` images may install the listed distro packages without version specifiers. This file is the authority-of-record for those installs under the OS-Package Runtime Carve-Out, introduced in `jbaruch/coding-policy` 0.3.131.

## Covered images and package sets

- `container/Dockerfile` (agent) — chromium, fonts-liberation, fonts-noto-color-emoji, libgbm1, libnss3, libatk-bridge2.0-0, libgtk-3-0, libx11-xcb1, libxcomposite1, libxdamage1, libxrandr2, libasound2, libpangocairo-1.0-0, libcups2, libdrm2, libxshmfence1, curl, git, jq, poppler-utils, python3, python3-venv, sqlite3, gh
- `Dockerfile.orchestrator` — ca-certificates, curl, docker.io, g++, gh, make, python3, sqlite3
- `container/audible-backup/Dockerfile` (sidecar) — ffmpeg

On a legacy checkout the inventory also includes the dedicated browser.

- `container/visible-browser/Dockerfile` (dedicated Chromium) — ca-certificates, chromium, curl, fonts-liberation, fonts-noto-color-emoji, novnc, openbox, websockify, x11-utils, x11vnc, xvfb

The consumer records its allowed sets in `COVERED_IMAGES` in `scripts/checks/os_package_pins.py`. If a checkout records a narrower set, that limit still binds. Host approval of `x11-utils` alone does not add it to a legacy checkout. The Mini retires only the fourth Dockerfile. Chromium in the agent inventory stays covered. The prebuilt nginx relay is digest-pinned in `docker-compose.yml` and receives no package exception.

## Why these float

- Debian's archive serves only the current version of a package, so a literal `pkg=<version>` pin stops resolving at the next security update and fails every build of the image
- The consumed surface is a command-line invocation or a distro-managed ABI, not a semver-governed source API

## Bounds and enforcement

- Pin the agent and orchestrator Node bases to `node:26-trixie-slim` by digest. Keep the audible-backup base at `python:3.14-slim`. A floating `:latest` voids the carve-out.
- Track each covered directory in the Docker ecosystem of `.github/dependabot.yml`. Rebuild covered images on every full `deploy.sh` run (agent at 2a, sidecars at 2a-bis, orchestrator at 2b). CI builds audible-backup on every pull request.
- While the dedicated Chromium Dockerfile is covered, keep its base aligned with the agent digest by test, track its directory, rebuild it at 2b, and build and smoke-test it on every PR.
- At Mini cutover retain Docker tracking for all three remaining directories and track the relay digest in the Docker Compose ecosystem. Apply the [browser CI requirements](browser-profile-storage.md#browser-ci) on each PR.
- Each rebuild runs `apt-get update` against the current archive

`scripts/checks/os_package_pins.py`, run by the `jbaruch/nanoclaw` test suite on every pull request, MUST fail when:

- A covered image's `FROM` carries no tag, or carries the floating `:latest`
- An `apt-get install` in a covered image names a package outside that image's recorded set
- A covered Dockerfile is missing, unreadable or lacks a parseable `FROM` or an actual `apt-get install` command in an active `RUN` instruction. Ignore comments when checking for instructions and installed packages. Never infer retirement from file absence

Adding a package to a covered image is a reviewed edit to `COVERED_IMAGES`, never a one-line addition to the Dockerfile alone.

## Scope

- OS packages in the covered inventory for that checkout only. `pip` and `npm` installs in the same files still pin — `audible-cli` in the sidecar, `agent-browser` / `@anthropic-ai/claude-code` / `tessl` in the agent and orchestrator images
- Packages already present in a base image, and transitive dependencies apt resolves, are out of scope
- Related: [Sync CLI Floating](sync-cli-floating.md) covers a different exemption in the same Dockerfile

## Surface sync

1. Publish the versioned Host inventory and verify that the consumer has installed it before changing the consumer checker or relying on a new allowance. The existing checkout keeps its current inventory and gates until its reviewed change lands.
2. For the reviewed Mini cutover, remove the dedicated Chromium Dockerfile and its checker entry together. Update the matching pins, Dependabot list, `scripts/os-package-floating-gate.test.ts`, browser CI and consumer changelog in the same PR. In the consumer gate tests, require rejection of a missing or unparseable covered Dockerfile, a valid pinned `FROM` with only a commented-out install, and an out-of-inventory package. Every legacy checkout that still builds dedicated Chromium retains all four entries and its smoke test.
3. For other package or base changes, update this Host inventory first. Update the consumer checker, Dockerfile install comment, pins, tests and consumer changelog together in one reviewed PR. Each deployed package must appear in both the installed authority and the consumer's recorded set.
