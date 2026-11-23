#!/usr/bin/env bash
# Tests for skills/add-ugos-project/scripts/register-ugos-project.sh
#
# Run: bash skills/add-ugos-project/tests/test-register-ugos-project.sh
#
# Fake SSH runs the helper's file checks and symlink operations in a
# temporary tree, including the private upload and reviewed Compose snapshot.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$SCRIPT_DIR/../scripts/register-ugos-project.sh"
WORK=$(mktemp -d "${TMPDIR:-/tmp}/ugos-test.XXXXXXXX")
trap 'rm -rf "$WORK"' EXIT

PASS=0
FAIL=0

fail_test() {
  echo "  FAIL: $1"
  FAIL=$((FAIL + 1))
}

pass_test() {
  echo "  PASS: $1"
  PASS=$((PASS + 1))
}

run_script() {
  local stdout_path="$WORK/stdout"
  local stderr_path="$WORK/stderr"
  local rc=0
  : > "$WORK/calls"
  SSH="$WORK/ssh-stub" "$SCRIPT" "$@" >"$stdout_path" 2>"$stderr_path" || rc=$?
  STDOUT=$(cat "$stdout_path")
  STDERR=$(cat "$stderr_path")
  RC=$rc
}

remote="$WORK/remote files"
mkdir -p "$remote/repo/container/litellm" "$remote/repo/container/foo" "$remote/volume1/docker" "$remote/tmp"
touch "$remote/repo/.env"
mkdir -p "$remote/repo/container/foo/deeper"
printf 'services: {}\r\n# café\r\n' > "$remote/repo/container/litellm/docker-compose.yaml"
for dir in . container/foo container/foo/deeper; do
  echo 'services: {}' > "$remote/repo/$dir/docker-compose.yaml"
done
cp -R "$remote/repo" "$WORK/consumer"
cd "$WORK/consumer"
export GIT_CONFIG_GLOBAL=/dev/null GIT_CONFIG_NOSYSTEM=1
git init -q
git add -- '*docker-compose.yaml'
git -c user.name=Fixture -c user.email=fixture@example.invalid commit -qm reviewed
reviewed=$(git rev-parse HEAD)
echo 'services: {later: {}}' > container/litellm/docker-compose.yaml
git add container/litellm/docker-compose.yaml
git -c user.name=Fixture -c user.email=fixture@example.invalid commit -qm later
later=$(git rev-parse HEAD)

cat > "$WORK/ssh-stub" <<'STUB'
#!/usr/bin/env bash
set -eu
remote="$(dirname "$0")/remote files"
shift # host
if [[ "$*" == *"mktemp -d /tmp/"* ]]; then
  echo upload >> "$(dirname "$0")/calls"
  cd "$remote"
  command="$*"
  command=${command//\/volume1\//volume1/}
  bash -c "${command//\/tmp\//tmp/}" | sed 's|^tmp/|/tmp/|'
  exit "${PIPESTATUS[0]}"
fi
stdin=$(cat)
case "$stdin" in
  *"readlink -f"*) echo "/repo" ;;
  *"test -"*|*"ln -s --"*)
    shift 3 # bash -s --
    paths=()
    for path in "$@"; do paths+=("$remote$path"); done
    bash -s -- "${paths[@]}" <<< "$stdin"
    ;;
  *) echo "stub: unrecognised stdin" >&2; exit 99 ;;
esac
STUB
chmod +x "$WORK/ssh-stub"

# === arg-validation tests (no ssh needed) ============================

echo "[1] arg validation"

run_script
[ "$RC" -ne 0 ] && pass_test "rejects no args" || fail_test "no args should fail"

run_script foo
[ "$RC" -ne 0 ] && pass_test "rejects single arg" || fail_test "single arg should fail"

run_script BadName container/foo "$reviewed"
[ "$RC" -ne 0 ] && pass_test "rejects uppercase project name" || fail_test "uppercase should fail"

run_script valid-name /absolute/path "$reviewed"
[ "$RC" -ne 0 ] && pass_test "rejects absolute in-repo dir" || fail_test "absolute should fail"

run_script valid-name ../escape "$reviewed"
[ "$RC" -ne 0 ] && pass_test "rejects in-repo dir containing '..'" || fail_test "'..' should fail"

run_script valid-name 'a;rm -rf /' "$reviewed"
[ "$RC" -ne 0 ] && pass_test "rejects in-repo dir with shell metacharacters" || fail_test "metachars should fail"

for revision in "" HEAD "${reviewed:0:8}" "$(git rev-parse HEAD^{tree})"; do
  run_script archive container/foo "$revision"
  [[ "$RC" != 0 && -z "$STDOUT" && ! -L "$remote/volume1/docker/archive" ]] \
    && pass_test "requires full commit ID" || fail_test "accepted invalid commit"
done
run_script archive container/untracked "$reviewed"
[[ "$RC" != 0 && "$STDERR" == *"expected a tracked regular file"* ]] \
  && pass_test "requires exact tracked Compose path" || fail_test "accepted missing path"

# === happy-path JSON contract test ===================================

echo "[2] happy path JSON contract"

run_script nanoclaw-litellm container/litellm "$reviewed"

if [ "$RC" -ne 0 ]; then
  fail_test "happy path exit code (rc=$RC)"
  echo "    stderr: $STDERR"
elif ! echo "$STDOUT" | python3 -c '
import json, sys
d = json.load(sys.stdin)
required = {
    "project", "in_repo_dir", "dir_symlink", "dir_symlink_target",
    "env_symlink", "compose_path", "compose_path_via_symlink",
    "compose_size_baseline", "ugos_db", "ugos_insert_helper",
    "ugos_insert_command", "next_step",
}
missing = required - d.keys()
assert not missing, f"missing keys: {missing}"
assert d["project"] == "nanoclaw-litellm"
assert d["in_repo_dir"] == "container/litellm"
assert d["dir_symlink"] == "/volume1/docker/nanoclaw-litellm"
assert d["compose_size_baseline"] == len("services: {}\r\n# café\r\n".encode())
assert isinstance(d["compose_size_baseline"], int)
assert d["env_symlink"] == "created"
'; then
  fail_test "happy path JSON contract"
  echo "    stdout: $STDOUT"
else
  cp "$WORK/stdout" "$WORK/sidecar.json"
  pass_test "happy path emits valid JSON with all required keys"
fi

# === in-repo dir = "." skips .env symlink ============================

echo "[3] repo-root project skips .env symlink"

run_script nanoclaw . "$reviewed"
if [ "$RC" -ne 0 ]; then
  fail_test "repo-root path exit code (rc=$RC)"
elif ! echo "$STDOUT" | python3 -c '
import json, sys
d = json.load(sys.stdin)
got = d["env_symlink"]
assert got == "not_needed", f"got {got}"
'; then
  fail_test "repo-root path env_symlink field"
  echo "    stdout: $STDOUT"
else
  pass_test "repo-root path reports env_symlink=not_needed"
fi

# === symlink mismatch surfaces non-zero exit =========================

echo "[4] symlink target mismatch aborts"

ln -s wrong-target "$remote/volume1/docker/foo"
run_script foo container/foo "$reviewed"
if [[ "$RC" == 1 && "$STDERR" == *"points at 'wrong-target'"* ]]; then
  pass_test "symlink target mismatch aborts registration"
else
  fail_test "expected symlink mismatch diagnostic (rc=$RC)"
fi

echo "[5] private upload and verified operator handoff"
run_script nanoclaw-litellm container/litellm "$reviewed"
if python3 -I "$SCRIPT_DIR/check-handoff.py" "$WORK" "$SCRIPT_DIR/../scripts/insert-ugos-project.py"; then
  pass_test "verified helper registers the fixture and refuses invalid stages"
else
  fail_test "operator handoff verification"
fi

echo "[6] missing Compose file and directory at Compose path"
compose="$remote/repo/container/foo/docker-compose.yaml"
rm "$compose"
for kind in missing directory; do
  if [[ "$kind" == directory ]]; then mkdir "$compose"; fi
  run_script archive container/foo "$reviewed"
  if [[ "$RC" == 1 && "$STDERR" == *"compose file not found"* && ! -L "$remote/volume1/docker/archive" ]]; then
    pass_test "rejects $kind Compose file before creating project link"
  else
    fail_test "expected $kind Compose file to abort before project link (rc=$RC)"
  fi
done

echo "[7] resolved .env type, identity and readability"
check_env_rejection() {
  if [[ "$RC" == 1 && "$STDERR" == *"readable regular repo .env"* &&
        ! -s "$WORK/calls" && -z "$STDOUT" ]]; then
    pass_test "$1 stops before staging"
  else
    fail_test "expected $1 to abort before staging (rc=$RC)"
  fi
}

env_file="$remote/repo/.env"
rm "$env_file"
run_script archive container/litellm "$reviewed"
check_env_rejection "missing .env"
mkdir "$env_file"
run_script archive container/litellm "$reviewed"
check_env_rejection "directory at .env"
rmdir "$env_file"

approved="$remote/approved env"
touch "$approved"
ln -s "$approved" "$env_file"
if [[ $(id -u) != 0 ]]; then
  chmod 000 "$approved"
  run_script archive container/litellm "$reviewed"
  check_env_rejection "unreadable .env"
  chmod 600 "$approved"
fi
run_script archive container/litellm "$reviewed"
if [[ "$RC" == 0 && -L "$remote/volume1/docker/archive" && -L "$remote/repo/container/litellm/.env" ]]; then
  pass_test "retry accepts the approved regular file through both existing links"
else
  fail_test "expected restored .env chain to succeed"
fi

touch "$remote/repo/container/foo/deeper/docker-compose.yaml" "$remote/repo/container/.env"
run_script deep container/foo/deeper "$reviewed"
check_env_rejection "regular .env distinct from the repo .env"

echo "[8] unprivileged snapshot must match the reviewed revision"
stages_before=$(ls "$remote/tmp")
check_stage_rejection() {
  if [[ "$RC" != 0 && "$STDERR" == *"could not stage Compose matching the reviewed blob"* &&
        -z "$STDOUT" && "$STDERR" != *"ssh -t"* && $(ls "$remote/tmp") == "$stages_before" ]]; then
    pass_test "$1 stops before the operator command and cleans up"
  else
    fail_test "$1 staging refusal (rc=$RC)"
  fi
}
run_script archive container/litellm "$later"
check_stage_rejection "wrong-revision Compose"
if [[ $(id -u) != 0 ]]; then
  chmod 000 "$remote/repo/container/litellm/docker-compose.yaml"
  run_script archive container/litellm "$reviewed"
  check_stage_rejection "unreadable Compose"
  chmod 600 "$remote/repo/container/litellm/docker-compose.yaml"
fi

# === summary =========================================================

echo
echo "Tests: $PASS passed, $FAIL failed"
exit "$FAIL"
