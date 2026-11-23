#!/usr/bin/env bash
# Tests for skills/add-ugos-project/scripts/register-ugos-project.sh
#
# Run: bash skills/add-ugos-project/tests/test-register-ugos-project.sh
#
# Fake SSH runs the helper's file checks and symlink operations in a
# temporary tree. The stat response and helper upload are stubbed.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
SCRIPT="$SCRIPT_DIR/../scripts/register-ugos-project.sh"
WORK=$(mktemp -d)
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
  SSH="$WORK/ssh-stub" "$SCRIPT" "$@" >"$stdout_path" 2>"$stderr_path" || rc=$?
  STDOUT=$(cat "$stdout_path")
  STDERR=$(cat "$stderr_path")
  RC=$rc
}

remote="$WORK/remote files"
mkdir -p "$remote/repo/container/litellm" "$remote/repo/container/foo" "$remote/volume1/docker"
touch "$remote/repo/docker-compose.yaml" "$remote/repo/.env" \
  "$remote/repo/container/litellm/docker-compose.yaml" "$remote/repo/container/foo/docker-compose.yaml"

cat > "$WORK/ssh-stub" <<'STUB'
#!/usr/bin/env bash
set -eu
remote="$(dirname "$0")/remote files"
shift # host; remaining arguments are bash -s -- path [target]
stdin=$(cat)
case "$stdin" in
  *"readlink -f"*) echo "/repo" ;;
  *"test -"*|*"ln -s --"*)
    shift 3 # bash -s --
    paths=()
    for path in "$@"; do paths+=("$remote$path"); done
    bash -s -- "${paths[@]}" <<< "$stdin"
    ;;
  *"stat -c '%s'"*) echo "4386" ;;
  *'cat > "$TARGET"'*) : ;; # discard the helper upload
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

run_script BadName container/foo
[ "$RC" -ne 0 ] && pass_test "rejects uppercase project name" || fail_test "uppercase should fail"

run_script valid-name /absolute/path
[ "$RC" -ne 0 ] && pass_test "rejects absolute in-repo dir" || fail_test "absolute should fail"

run_script valid-name ../escape
[ "$RC" -ne 0 ] && pass_test "rejects in-repo dir containing '..'" || fail_test "'..' should fail"

run_script valid-name 'a;rm -rf /'
[ "$RC" -ne 0 ] && pass_test "rejects in-repo dir with shell metacharacters" || fail_test "metachars should fail"

# === happy-path JSON contract test ===================================

echo "[2] happy path JSON contract"

run_script nanoclaw-litellm container/litellm

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
assert d["compose_size_baseline"] == 4386
assert isinstance(d["compose_size_baseline"], int)
assert d["env_symlink"] == "created"
'; then
  fail_test "happy path JSON contract"
  echo "    stdout: $STDOUT"
else
  pass_test "happy path emits valid JSON with all required keys"
fi

# === in-repo dir = "." skips .env symlink ============================

echo "[3] repo-root project skips .env symlink"

run_script nanoclaw .
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
run_script foo container/foo
if [[ "$RC" == 1 && "$STDERR" == *"points at 'wrong-target'"* ]]; then
  pass_test "symlink target mismatch aborts registration"
else
  fail_test "expected symlink mismatch diagnostic (rc=$RC)"
fi

# === ugos_insert_command stays as valid JSON ==========================

echo "[5] ugos_insert_command escapes correctly in JSON"

run_script nanoclaw-litellm container/litellm
if ! echo "$STDOUT" | python3 -c '
import json, sys
d = json.load(sys.stdin)
cmd = d["ugos_insert_command"]
assert "sudo python3" in cmd, cmd
assert "nanoclaw-litellm" in cmd, cmd
'; then
  fail_test "ugos_insert_command JSON-escape integrity"
  echo "    stdout: $STDOUT"
else
  pass_test "ugos_insert_command escapes correctly inside JSON"
fi

echo "[6] missing Compose file and directory at Compose path"
compose="$remote/repo/container/foo/docker-compose.yaml"
rm "$compose"
for kind in missing directory; do
  if [[ "$kind" == directory ]]; then mkdir "$compose"; fi
  run_script archive container/foo
  if [[ "$RC" == 1 && "$STDERR" == *"compose file not found"* && ! -L "$remote/volume1/docker/archive" ]]; then
    pass_test "rejects $kind Compose file before creating project link"
  else
    fail_test "expected $kind Compose file to abort before project link (rc=$RC)"
  fi
done

echo "[7] missing .env through the project link"
rm "$remote/repo/.env"
run_script archive container/litellm
if [[ "$RC" == 1 && -L "$remote/volume1/docker/archive" &&
      "$STDERR" == *"does not resolve to a readable file"* && "$STDERR" != *"capturing baseline"* && -z "$STDOUT" ]]; then
  pass_test "missing .env stops registration after linking and before the byte count"
else
  fail_test "expected missing .env to abort before registration (rc=$RC)"
fi

# === summary =========================================================

echo
echo "Tests: $PASS passed, $FAIL failed"
exit "$FAIL"
