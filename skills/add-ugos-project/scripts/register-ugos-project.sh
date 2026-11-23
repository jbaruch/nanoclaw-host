#!/usr/bin/env bash
# register-ugos-project.sh — Plumb symlinks and stage the UGOS Pro DB
# INSERT for a Docker Compose project whose compose file lives in the
# nanoclaw repo on the NAS.
#
# Contract (see also rules/ugos-compose-projects.md):
#   Before invoking this helper, follow Step 1 of the add-ugos-project skill.
#   Verify the reviewed consumer revision and explicit NAS runtime authority
#   for this project. For the Mini-era NanoClaw orchestrator, stop before
#   running this helper, registering a row or using Start on an existing row.
#   A checkout or storage path alone grants no authority. Separately
#   authorized NAS storage and archive sidecars use their own Compose dirs.
#   Inputs:
#     $1  <project-name>   lowercase-kebab basename UGOS Pro displays
#                          (also the Docker compose project name).
#                          Becomes /volume1/docker/<project-name>.
#     $2  <in-repo-dir>    relative path under ~/nanoclaw on the NAS
#                          holding docker-compose.yaml. Use `.` only for
#                          the explicitly authorized legacy NAS orchestrator.
#                          Must not be absolute and must not contain `..`.
#   Environment overrides:
#     SSH            ssh-compatible binary (default: ssh) — tests override
#                    with a stub so the suite runs without a NAS.
#     NAS_HOST       SSH alias (default: nas)
#     NAS_REPO_DIR   repo path on the NAS (default: ~/nanoclaw)
#   Output:
#     stdout — JSON summary { project, in_repo_dir, dir_symlink,
#              dir_symlink_target, env_symlink, compose_path,
#              compose_path_via_symlink, compose_size_baseline (int),
#              ugos_db, ugos_insert_helper, ugos_insert_command,
#              next_step }. Built via python3 json.dumps so any field
#              value (including quoted shell strings in ugos_insert_command)
#              is escaped correctly.
#     stderr — progress messages and the operator-facing sudo command.
#     exit   — 0 on success; non-zero with diagnostic on stderr on
#              any failure (symlink mismatch, missing compose file,
#              .env chain failing the regular-file, readability or identity
#              check, etc.).
#   Idempotency:
#     Re-running with identical inputs reuses matching symlinks and stages
#     the reviewed insert-ugos-project.py in a fresh private directory.
#     The printed sudo command verifies and executes the same bytes.
#     Mismatched symlink targets
#     abort with a diagnostic; the operator removes the stale link
#     and re-runs.

set -euo pipefail

SSH="${SSH:-ssh}"
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

[[ $# -eq 2 ]] || die "usage: $0 <project-name> <in-repo-dir> (verify revision and NAS authority per skill Step 1 first; '.' is for the explicitly authorized legacy NAS orchestrator only)"
PROJECT_NAME="$1"
IN_REPO_DIR="$2"

[[ "$PROJECT_NAME" =~ ^[a-z][a-z0-9-]*$ ]] \
  || die "project name must be lowercase kebab-case (got '$PROJECT_NAME')"

if [[ "$IN_REPO_DIR" != "." ]]; then
  [[ "$IN_REPO_DIR" != /* ]] \
    || die "in-repo dir must be relative to ~/nanoclaw, not absolute (got '$IN_REPO_DIR')"
  [[ "$IN_REPO_DIR" != *..* ]] \
    || die "in-repo dir must not contain '..' (got '$IN_REPO_DIR')"
  [[ "$IN_REPO_DIR" =~ ^[A-Za-z0-9._/-]+$ ]] \
    || die "in-repo dir may only contain [A-Za-z0-9._/-] (got '$IN_REPO_DIR')"
fi

log "resolving repo path on $NAS_HOST"
NAS_REPO_ABS=$("$SSH" "$NAS_HOST" bash -s -- "$NAS_REPO_DIR" <<'REMOTE'
set -euo pipefail
readlink -f -- "$1"
REMOTE
)
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
"$SSH" "$NAS_HOST" bash -s -- "$COMPOSE_ABS" <<'REMOTE' \
  || die "compose file not found at $COMPOSE_ABS on $NAS_HOST"
set -euo pipefail
test -f "$1"
REMOTE

log "ensuring dir symlink $DIR_LINK -> $IN_REPO_ABS"
"$SSH" "$NAS_HOST" bash -s -- "$DIR_LINK" "$IN_REPO_ABS" <<'REMOTE_DIR'
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
  ln -s -- "$TARGET" "$LINK"
fi
REMOTE_DIR

if [[ "$IN_REPO_ABS" == "$NAS_REPO_ABS" ]]; then
  log "in-repo dir is the repo root; .env already present, skipping .env symlink"
  ENV_SYMLINK_STATE="not_needed"
else
  log "ensuring .env symlink $ENV_LINK -> ../../.env"
  "$SSH" "$NAS_HOST" bash -s -- "$ENV_LINK" <<'REMOTE_ENV'
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
  ln -s -- "../../.env" "$LINK"
fi
REMOTE_ENV
  ENV_SYMLINK_STATE="created"
fi

log "verifying .env resolves through the symlink chain"
"$SSH" "$NAS_HOST" bash -s -- "$DIR_LINK/.env" "$NAS_REPO_ABS/.env" <<'REMOTE' \
  || die "$DIR_LINK/.env must resolve to the readable regular repo .env file (check the symlink chain)"
set -euo pipefail
test -f "$1" && test -r "$1" && test "$1" -ef "$2"
REMOTE

log "capturing baseline compose-file byte count"
COMPOSE_SIZE=$("$SSH" "$NAS_HOST" bash -s -- "$COMPOSE_ABS" <<'REMOTE'
set -euo pipefail
stat -c '%s' -- "$1"
REMOTE
)
[[ "$COMPOSE_SIZE" =~ ^[0-9]+$ ]] \
  || die "expected integer byte count, got '$COMPOSE_SIZE'"

INSERT_SOURCE="$(dirname "$0")/insert-ugos-project.py"
log "staging the reviewed INSERT helper on $NAS_HOST"
STAGE=$("$SSH" "$NAS_HOST" 'set -eu
umask 077
stage=$(mktemp -d /tmp/register-ugos.XXXXXXXXXX)
if cat > "$stage/insert.py"; then
  echo "$stage"
else
  rm -f -- "$stage/insert.py"
  rmdir -- "$stage"
  exit 1
fi' < "$INSERT_SOURCE")
[[ "$STAGE" =~ ^/tmp/register-ugos\.[A-Za-z0-9]{10}$ ]] || die "unexpected helper stage path"

PROJECT_NAME="$PROJECT_NAME" \
IN_REPO_DIR="$IN_REPO_DIR" \
DIR_LINK="$DIR_LINK" \
DIR_LINK_TARGET="$IN_REPO_ABS" \
ENV_SYMLINK_STATE="$ENV_SYMLINK_STATE" \
COMPOSE_ABS="$COMPOSE_ABS" \
COMPOSE_AT_LINK="$COMPOSE_AT_LINK" \
COMPOSE_SIZE="$COMPOSE_SIZE" \
UGOS_DB="$UGOS_DB" \
python3 - "$NAS_HOST" "$STAGE" "$INSERT_SOURCE" <<'PY'
import hashlib
import json
import os
from pathlib import Path
import shlex
import sys

host, stage, source = sys.argv[1:]
helper = stage + "/insert.py"
reviewed = Path(source).read_bytes()
# sudo supplies the invoking uid. Open within the pinned directory and run
# the verified bytes from memory so execution never reopens the staged path.
verify = """import hashlib, os, stat, sys
stage, digest, size, project, compose = sys.argv[1:]
owner = int(os.environ["SUDO_UID"])
directory = os.open(stage, os.O_RDONLY | os.O_DIRECTORY | os.O_NOFOLLOW)
info = os.fstat(directory)
if info.st_uid != owner or stat.S_IMODE(info.st_mode) != 0o700:
    sys.exit("unexpected stage owner or permissions")
fd = os.open("insert.py", os.O_RDONLY | os.O_NOFOLLOW | os.O_NONBLOCK, dir_fd=directory)
os.close(directory)
info = os.fstat(fd)
if not stat.S_ISREG(info.st_mode) or info.st_uid != owner or stat.S_IMODE(info.st_mode) != 0o600:
    sys.exit("expected a private regular helper owned by the invoking user")
with os.fdopen(fd, "rb") as staged:
    payload = staged.read(int(size) + 1)
if hashlib.sha256(payload).hexdigest() != digest:
    sys.exit("registration helper digest mismatch")
sys.argv = ["insert.py", project, compose]
exec(compile(payload, "insert.py", "exec"), {"__name__": "__main__"})
"""
remote = shlex.join([
    "sudo", "python3", "-I", "-c", verify, stage,
    hashlib.sha256(reviewed).hexdigest(), str(len(reviewed)),
    os.environ["PROJECT_NAME"], os.environ["COMPOSE_AT_LINK"],
])
# Cleanup runs as the staging user after a successful INSERT.
remote += " && " + shlex.join(["rm", "--", helper]) + " && " + shlex.join(["rmdir", "--", stage])
command = shlex.join(["ssh", "-t", "--", host, remote])
print("Run this command from the operator's terminal:", file=sys.stderr)
print(command, file=sys.stderr)

print(json.dumps({
    "project": os.environ["PROJECT_NAME"],
    "in_repo_dir": os.environ["IN_REPO_DIR"],
    "dir_symlink": os.environ["DIR_LINK"],
    "dir_symlink_target": os.environ["DIR_LINK_TARGET"],
    "env_symlink": os.environ["ENV_SYMLINK_STATE"],
    "compose_path": os.environ["COMPOSE_ABS"],
    "compose_path_via_symlink": os.environ["COMPOSE_AT_LINK"],
    "compose_size_baseline": int(os.environ["COMPOSE_SIZE"]),
    "ugos_db": os.environ["UGOS_DB"],
    "ugos_insert_helper": helper,
    "ugos_insert_command": command,
    "next_step": "Run the printed sudo command, then Start the project from UGOS Pro UI",
}, indent=2))
PY
