---
alwaysApply: true
---

# Host Agent Conventions

Deployment mechanics for the NanoClaw host agent (Claude Code on Mac). Other host-tier rules cover collaboration, ownership, and infrastructure patterns — see this plugin's `README.md` rules table.

## Always deploy with deploy.sh

Deploy with `./scripts/deploy.sh` from the verified deployment checkout. Direct Compose is limited to the following rollback commands inside the verified Mini VM. Follow the corresponding section of the checked-out NanoClaw `docs/OPERATIONS.md` for the project, directory, Compose file and recovery checks.

- **Failed deploy.** If deploy.sh reports that it could not restore the previous images, use its recorded `previous_image`, `previous_agent` and `previous_compose`. Follow the runbook's SQLite recovery guard, then recreate only `nanoclaw` with that image pair and release's Compose file (saved file or recorded Git blob). Run the deploy readiness check against the previous pair.
- **Cutover.** Keep the writer holds and follow the runbook's reviewed SHA and directory identity checks. Once deploy has run, obtain the owner's authorization before restoring the directory. Only after the original directory is back in place, use the saved Compose file to recreate `nanoclaw visible-browser`. If that start is pending or failed, resolve any error and retry only that Compose command. Verify isolation, readiness and resumed jobs before lifting holds.

Both commands use `up -d --force-recreate --no-build --pull never --no-deps` with exactly the services named above. Neither authorizes a direct Compose deploy.

## Registry is the delivery artifact

Tessl registry plugins are what gets delivered to containers. Git is the source, not the delivery mechanism. Never skip publishing — always run the full promote pipeline.

## Scripts use common.sh

All scripts in `scripts/` source the consumer's checked-out `scripts/common.sh` for their deployment target and command helper. Verify the consumer, revision, authorized destination and project directory before using its interface. Keep host addresses, transports and project paths out of callers.

- Publish and install the versioned Host contract before adopting the Mini interface in `jbaruch/nanoclaw`. An existing checkout still authorized for the legacy deployment uses its own `NAS_HOST`, `NAS_PROJECT_DIR` and `nas()` until its reviewed cutover.
- On the adopted rack Mini, `DEPLOY_HOST` and `DEPLOY_PROJECT_DIR` identify the fixed Lima VM and its project checkout. Use the single `deploy_host()` helper from `scripts/common.sh`. It runs the command in the verified VM or enters that VM from the Mini. Reject a mismatched target without trying another host.
- After cutover, deployment, staging, probes and container operations for the NanoClaw runtime target only the Mini. Preserve NAS-backed storage and separately authorized NAS storage or archive sidecars. They grant no authority to deploy, restart or fall back to a NAS orchestrator. Apply the Mini interface to another consumer only after verifying its own checkout and deployment authority.

- Narrow exception for `jbaruch/nanoclaw` `scripts/check-env-credentials.py`.
- Applies only to this standalone credential-input validator
- Preconditions (all required):
  1. It reads candidate env and allowlist files as data; it never sources or executes them
  2. File paths come from explicit CLI arguments or from its resolved checkout location
  3. It performs no NAS, SSH, or other network operations
  4. Tests cover default paths, CLI overrides, input non-execution, and deploy failure gating
- Every other script in `scripts/` sources `scripts/common.sh`

## Credentials live in the vault

- Runtime credentials live in the OneCLI vault, never the deployment `.env` or a compose file
- The deployment checkout’s `.env` holds non-secret configuration
- `jbaruch/nanoclaw` `scripts/deploy.sh` refuses to deploy while `.env` holds a credential-shaped variable outside `scripts/env-credential-allowlist.json` (`scripts/check-env-credentials.py`)
- Narrow exception for the `ONECLI_API_KEY` bootstrap credential that reaches the vault.
- Applies only to host-side OneCLI control-plane authentication
- Preconditions (all required):
  1. It is the allowlist's sole permanent bootstrap entry
  2. The deployment `.env` is mode 600, excluded from git, and never mounted or forwarded into an agent container
  3. Host code reads the key without printing it or placing it in process arguments
- Narrow exception for a credential an open migration issue still moves out of `.env`.
- Applies while that issue is open
- Preconditions (all required):
  1. Its allowlist entry cites the issue as `owner/repo#N`
  2. The entry is removed when the issue closes
- Narrow exception for a credential no vault injection path can carry, such as a request-body OAuth refresh secret.
- Applies to a host script that must read the value itself
- Preconditions (all required):
  1. An open issue tracks moving it into the vault
  2. It lives in its own env file outside the project tree, mode 600, read only by that script
  3. The script never prints it
- Narrow exception for website sessions and saved website passwords in the dedicated private browser.
- Preconditions are binding: read `rules/browser-profile-storage.md` before enabling authenticated persistence.
- Narrow exception for native identity/ACME state of the private Tailscale noVNC viewer.
- Preconditions are binding: read `rules/browser-tailnet-viewer.md` before relying on it.
- Every other credential lives in the vault
