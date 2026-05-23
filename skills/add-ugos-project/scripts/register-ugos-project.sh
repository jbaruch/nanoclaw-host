#!/usr/bin/env bash
# register-ugos-project.sh — Plumb symlinks and prepare the UGOS Pro DB
# INSERT for a Docker Compose project whose compose file lives in the
# nanoclaw repo on the NAS.
#
# Contract (see also rules/ugos-compose-projects.md):
#   Inputs:
#     $1  <project-name>   lowercase-kebab basename UGOS Pro displays
#                          (also the Docker compose project name).
#                          Becomes /volume1/docker/<project-name>.
#     $2  <in-repo-dir>    path relative to ~/nanoclaw on the NAS
#                          holding docker-compose.yaml. Use `.` for the
#                          orchestrator (compose at the repo root).
#   Environment overrides:
#     NAS_HOST       SSH alias (default: nas)
#     NAS_REPO_DIR   repo path on the NAS (default: ~/nanoclaw)
#   Output:
#     stdout — JSON summary { project, in_repo_dir, dir_symlink,
#              env_symlink, compose_path, compose_size_baseline,
#              ugos_insert_command }
#     stderr — progress messages and the operator-facing sudo command.
#     exit   — 0 on success; non-zero with diagnostic on stderr on
#              any failure (symlink mismatch, missing compose file,
#              unreadable .env chain, etc.).
#   Idempotency:
#     Re-running with the same inputs reports the existing symlinks
#     and re-prints the INSERT command. Re-running with mismatched
#     symlink targets aborts; the operator removes the stale link and
#     re-runs.

set -euo pipefail

NAS_HOST="${NAS_HOST:-nas}"
NAS_REPO_DIR="${NAS_REPO_DIR:-~/nanoclaw}"
UGOS_DB="/volume1/@appstore/com.ugreen.docker/db/docker_info_log.db"
COMPOSE_BASENAME="docker-compose.yaml"

die() {
  echo "register-ugos-project: $*" >&2
  exit 1
}

log() {
  echo "register-ugos-project: $*" >&2
}

[[ $# -eq 2 ]] || die "usage: $0 <project-name> <in-repo-dir>"
PROJECT_NAME="$1"
IN_REPO_DIR="$2"

[[ "$PROJECT_NAME" =~ ^[a-z][a-z0-9-]*$ ]] \
  || die "project name must be lowercase kebab-case (got '$PROJECT_NAME')"

log "resolving repo path on $NAS_HOST"
NAS_REPO_ABS=$(ssh "$NAS_HOST" "readlink -f $NAS_REPO_DIR")
[[ -n "$NAS_REPO_ABS" ]] || die "could not resolve $NAS_REPO_DIR on $NAS_HOST"

if [[ "$IN_REPO_DIR" == "." ]]; then
  IN_REPO_ABS="$NAS_REPO_ABS"
else
  IN_REPO_ABS="$NAS_REPO_ABS/$IN_REPO_DIR"
fi

COMPOSE_ABS="$IN_REPO_ABS/$COMPOSE_BASENAME"
DIR_LINK="/volume1/docker/$PROJECT_NAME"
ENV_LINK="$IN_REPO_ABS/.env"
COMPOSE_AT_LINK="$DIR_LINK/$COMPOSE_BASENAME"

log "verifying compose file at $COMPOSE_ABS"
ssh "$NAS_HOST" "test -f '$COMPOSE_ABS'" \
  || die "compose file not found at $COMPOSE_ABS on $NAS_HOST"

log "ensuring dir symlink $DIR_LINK -> $IN_REPO_ABS"
ssh "$NAS_HOST" bash -s -- "$DIR_LINK" "$IN_REPO_ABS" <<'REMOTE_DIR'
set -euo pipefail
LINK="$1"
TARGET="$2"
if [ -L "$LINK" ]; then
  current=$(readlink "$LINK")
  if [ "$current" != "$TARGET" ]; then
    echo "existing symlink at $LINK points at '$current', expected '$TARGET'" >&2
    exit 1
  fi
elif [ -e "$LINK" ]; then
  echo "$LINK exists and is not a symlink — refusing to overwrite" >&2
  exit 1
else
  ln -s "$TARGET" "$LINK"
fi
REMOTE_DIR

if [[ "$IN_REPO_ABS" == "$NAS_REPO_ABS" ]]; then
  log "in-repo dir is the repo root; .env already present, skipping .env symlink"
  ENV_SYMLINK_STATE="not_needed"
else
  log "ensuring .env symlink $ENV_LINK -> ../../.env"
  ssh "$NAS_HOST" bash -s -- "$ENV_LINK" <<'REMOTE_ENV'
set -euo pipefail
LINK="$1"
if [ -L "$LINK" ]; then
  current=$(readlink "$LINK")
  if [ "$current" != "../../.env" ]; then
    echo "existing .env symlink at $LINK points at '$current', expected '../../.env'" >&2
    exit 1
  fi
elif [ -e "$LINK" ]; then
  echo "$LINK exists and is not a symlink — refusing to overwrite" >&2
  exit 1
else
  ln -s "../../.env" "$LINK"
fi
REMOTE_ENV
  ENV_SYMLINK_STATE="created"
fi

log "verifying .env resolves through the symlink chain"
ssh "$NAS_HOST" "test -r '$DIR_LINK/.env'" \
  || die "$DIR_LINK/.env does not resolve to a readable file (check the symlink chain)"

log "capturing baseline compose-file size"
COMPOSE_SIZE=$(ssh "$NAS_HOST" "stat -c '%s' '$COMPOSE_ABS'")

PY_TMP="/tmp/register-ugos-${PROJECT_NAME}.py"
log "writing INSERT helper to $NAS_HOST:$PY_TMP"
ssh "$NAS_HOST" "cat > '$PY_TMP'" <<'PY_SCRIPT'
"""Insert a row into UGOS Pro's docker_info_log.db `compose` table.

Run via `sudo python3 /tmp/register-ugos-<name>.py <project> <compose_path>`.
The script reads the compose file's current bytes and stores them in the
`content` column. UGOS Pro renders the Projects UI from this row.
"""
import os
import sqlite3
import sys

UGOS_DB = "/volume1/@appstore/com.ugreen.docker/db/docker_info_log.db"

if len(sys.argv) != 3:
    sys.exit(f"usage: {sys.argv[0]} <project-name> <compose-path>")

project_name = sys.argv[1]
compose_path = sys.argv[2]

if not os.path.isfile(compose_path):
    sys.exit(f"compose file not found at {compose_path}")

with open(compose_path) as fh:
    content = fh.read()

conn = sqlite3.connect(UGOS_DB)
try:
    cur = conn.execute(
        "SELECT 1 FROM compose WHERE name = ?",
        (project_name,),
    )
    if cur.fetchone() is not None:
        sys.exit(f"row already present for project '{project_name}' — refusing duplicate INSERT")
    conn.execute(
        "INSERT INTO compose "
        "(created_at, updated_at, name, state, path, content, app_id, container_num) "
        "VALUES (datetime('now'), datetime('now'), ?, 1, ?, ?, '', 0)",
        (project_name, compose_path, content),
    )
    conn.commit()
finally:
    conn.close()

print(f"inserted row: name={project_name}, path={compose_path}, content_bytes={len(content)}")
PY_SCRIPT

INSERT_CMD="ssh -t $NAS_HOST \"sudo python3 '$PY_TMP' '$PROJECT_NAME' '$COMPOSE_AT_LINK'\""

{
  echo
  echo "=== Run this on the NAS to register the project in UGOS Pro ==="
  echo "$INSERT_CMD"
  echo "=================================================================="
  echo
} >&2

cat <<JSON
{
  "project": "$PROJECT_NAME",
  "in_repo_dir": "$IN_REPO_DIR",
  "dir_symlink": "$DIR_LINK",
  "dir_symlink_target": "$IN_REPO_ABS",
  "env_symlink": "$ENV_SYMLINK_STATE",
  "compose_path": "$COMPOSE_ABS",
  "compose_path_via_symlink": "$COMPOSE_AT_LINK",
  "compose_size_baseline": $COMPOSE_SIZE,
  "ugos_db": "$UGOS_DB",
  "ugos_insert_helper": "$PY_TMP",
  "ugos_insert_command": "$INSERT_CMD",
  "next_step": "Run the printed sudo command, then Start the project from UGOS Pro UI"
}
JSON
