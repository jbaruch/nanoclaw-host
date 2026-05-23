---
alwaysApply: true
---

# UGOS Compose Projects

Operational contract for Docker Compose projects on UGOS Pro (NASync) where the compose file is source-of-truth in the repo and UGOS Pro's Projects UI is the operator's Start/Stop surface.

## Topology

- Compose file lives in the repo under `container/<project>/docker-compose.yaml`; the orchestrator's compose lives at the repo root
- Directory symlink at `/volume1/docker/<project>/` resolves to the in-repo dir — UGOS Pro discovers compose files via this path
- `.env` symlink at `<repo>/container/<project>/.env` → `../../.env`
- Linux resolves the relative target against the symlink's own parent — the chain `/volume1/docker/<project>/.env` → `<repo>/container/<project>/.env` → `~/nanoclaw/.env` resolves through both layers
- Docker derives the compose project name from the symlinked directory basename
- Compose YAML carries `${VAR}` placeholders only; docker compose interpolates from the symlinked `.env` at spawn time

## Registration is a DB INSERT

- UGOS Pro renders the Projects UI from `/volume1/@appstore/com.ugreen.docker/db/docker_info_log.db`, table `compose`
- The DB is `root:root 644` — INSERT requires sudo, runs interactively from a TTY (`ssh -t nas`)
- The row's `path` column points at the symlinked compose file (e.g. `/volume1/docker/<project>/docker-compose.yaml`); UGOS UI Start/Stop drives docker compose against that path
- Registering via UGOS Pro's "Create Project" UI flow instead of a direct INSERT rewrites the compose file at the symlinked path and leaks env values into the tracked repo file — forbidden
- See `Skill(skill: "add-ugos-project")` for the walkthrough and `skills/add-ugos-project/scripts/register-ugos-project.sh` for the INSERT-statement contract

## UI is Start/Stop only

- Operator action via UGOS Pro UI on a symlinked project is limited to Start and Stop
- Never invoke UGOS Pro's "Edit" UI on a symlinked project — UGOS dumps UI-entered env into the compose file's `environment:` block and the dir symlink lands those literals in the tracked repo file
- Never paste literal env values into UGOS Pro's project env UI — same failure mode; secrets stay in `~/nanoclaw/.env` (gitignored), reached through the `.env` symlink chain
- Compose edits flow through repo PR review and `./scripts/deploy.sh` only

## Surface sync

When adding, removing, or renaming a UGOS Pro compose project, update each in lock-step:

- The DB row's `name`, `path`, and `content` (or DELETE for removal)
- The directory symlink at `/volume1/docker/<project>/`
- The `.env` symlink inside the project's compose dir
- Any `deploy.sh` agent-kill / orphan-cleanup grep predicates that match `^<project>` or `^nanoclaw-`
- The consuming repo's CHANGELOG
- See `coding-policy: context-artifacts` Surface Sync for the broader pattern
