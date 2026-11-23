---
name: add-ugos-project
description: Register a repo-owned Compose project for UGOS Pro Start/Stop when the consumer is explicitly authorized to run it on the NAS. Covers legacy deployments and authorized NAS storage or archive sidecars. Excludes the Mini-era NanoClaw orchestrator.
---

# Add UGOS Project

Process steps in order. Do not skip ahead.

Before registering a project, read the [UGOS Compose contract](../host-contracts/references/ugos-compose-projects.md).

Out of scope: editing an existing UGOS Pro project's env via UI (forbidden — see `rules/ugos-compose-projects.md`), and scaffolding the compose file itself (write the YAML in the repo first, land it through PR review, then run this skill).

## Step 1 — Verify the deployment target and project

Check the consumer's reviewed revision and authorized runtime before creating symlinks or a registration row. If the project is the Mini-era NanoClaw orchestrator, stop here, even if an old checkout or UGOS row exists. Never register it or click **Start** on the NAS. Proceed only for an explicitly authorized NAS project, including a legacy consumer or a storage or archive sidecar. A NAS storage path alone grants no registration authority.

Confirm with the operator:

- `<project-name>` — lowercase-kebab basename UGOS Pro will display and Docker will use as the compose project name (e.g. `nanoclaw-litellm`)
- `<in-repo-dir>` — path relative to the NAS checkout holding `docker-compose.yaml`. Use `.` for the root orchestrator only on an explicitly authorized legacy deployment.

The compose file MUST already be merged on `main` in `jbaruch/nanoclaw` before proceeding — UGOS Pro's INSERT in Step 3 reads the file's current bytes and stores them in the registration row.

Proceed immediately to Step 2.

## Step 2 — Plumb the symlinks

After Step 1, run from a local clone of `jbaruch/nanoclaw-host`. Direct callers must complete the same preflight before invoking the helper.

```bash
skills/add-ugos-project/scripts/register-ugos-project.sh <project-name> <in-repo-dir>
```

See `skills/add-ugos-project/scripts/register-ugos-project.sh` — argument contract, idempotency behaviour, and stdout JSON shape are in the top-of-file docstring.

The script creates `/volume1/docker/<project-name>` (directory symlink) and `<in-repo-dir>/.env` (relative `.env` symlink; skipped when the in-repo dir is the repo root). It then emits the sudo INSERT command on stderr and a JSON summary on stdout.

If the script exits non-zero, halt and surface stderr — do not run Step 3.

Proceed immediately to Step 3.

## Step 3 — INSERT the UGOS Pro DB row

The script printed an `ssh -t` command in its stderr block ending in `sudo python3 /tmp/register-ugos-<project>.py …`. Copy and run it from the operator's terminal — `sudo` prompts interactively, which is why the script cannot run it itself.

The helper aborts if a row already exists for the same project name; remove the stale row via `sudo sqlite3 /volume1/@appstore/com.ugreen.docker/db/docker_info_log.db "DELETE FROM compose WHERE name = '<project-name>';"` and re-run only if the operator confirms the prior registration is dead.

Proceed immediately to Step 4.

## Step 4 — Start the project from UGOS Pro UI

Open UGOS Pro → Docker → Projects. The new project appears with `state = 1` (stopped-but-registered). Click **Start**.

The container comes up against the in-repo compose file with `${VAR}` placeholders interpolated from `~/nanoclaw/.env` through the `.env` symlink chain. If the container exits with an env-related error, a missing non-secret variable belongs in `~/nanoclaw/.env`; a missing credential belongs in the OneCLI vault, never `.env` (`rules/host-conventions.md` Credentials live in the vault). Never paste literals into UGOS Pro's project env UI to "fix" either (see `rules/ugos-compose-projects.md`).

Proceed immediately to Step 5.

## Step 5 — Verify Stop+Start preserves the compose file

This is the regression check that catches the failure mode `rules/ugos-compose-projects.md` exists to prevent: UGOS Pro's "Create Project" UI flow rewrites the compose file on first start; the symlinked-project INSERT path does NOT. Verify the chosen path was the INSERT path:

1. Record the byte count from the script's `compose_size_baseline` JSON field (Step 2 captured it)
2. In UGOS Pro UI, Stop then Start the project
3. Re-record: `ssh nas "stat -c '%s' /volume1/docker/<project-name>/docker-compose.yaml"`
4. The two byte counts MUST match exactly

A size delta means UGOS Pro rewrote the file through the dir symlink. Back out the changes (`ssh nas "cd ~/nanoclaw && git checkout -- <in-repo-dir>/docker-compose.yaml"`), audit the DB row's `path` column (`sudo sqlite3 .../docker_info_log.db "SELECT path FROM compose WHERE name = '<project-name>'"`) — it must point at the `/volume1/docker/<project-name>/…` symlinked path, not at the in-repo absolute path. Fix the row and re-run from Step 4.

If the byte counts match, the project is registered correctly. Finish here.
