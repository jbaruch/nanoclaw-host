#!/usr/bin/env bash
# Tests for skills/add-ugos-project/scripts/register-ugos-project.sh
#
# Run: bash skills/add-ugos-project/tests/test-register-ugos-project.sh
#
# Each test runs the script with the `SSH=` env override pointing at a
# fake ssh stub that records calls and returns canned responses. No NAS
# access required. Tests assert outcomes (exit code + JSON shape +
# stderr diagnostics) rather than implementation steps.

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
  local _ssh="${1:-}"
  shift
  local stdout_path="$WORK/stdout"
  local stderr_path="$WORK/stderr"
  local rc=0
  if [ -n "$_ssh" ]; then
    SSH="$_ssh" "$SCRIPT" "$@" >"$stdout_path" 2>"$stderr_path" || rc=$?
  else
    "$SCRIPT" "$@" >"$stdout_path" 2>"$stderr_path" || rc=$?
  fi
  STDOUT=$(cat "$stdout_path")
  STDERR=$(cat "$stderr_path")
  RC=$rc
}

make_ssh_stub_happy() {
  # Returns a path to a fake ssh that responds correctly to every command
  # the script issues during a happy-path run.
  local stub="$WORK/ssh-happy"
  cat > "$stub" <<'STUB'
#!/usr/bin/env bash
# Fake ssh stub. Args: <host> <command-tokens...>
# Reads stdin when the script uses `bash -s --`.
host="$1"
shift
stdin=$(cat)
case "$stdin" in
  *"readlink -f"*)
    echo "/home/jbaruch/nanoclaw"
    ;;
  *"test -f -- "*)
    : # success
    ;;
  *"ln -s --"*)
    : # success (no existing symlink)
    ;;
  *"test -r -- "*)
    : # success
    ;;
  *"stat -c '%s'"*)
    echo "4386"
    ;;
  *'cat > "$TARGET"'*)
    : # success — discard the helper script body
    ;;
  *)
    echo "stub: unrecognised stdin" >&2
    exit 99
    ;;
esac
STUB
  chmod +x "$stub"
  echo "$stub"
}

make_ssh_stub_mismatch() {
  # Stub that reports an existing dir-symlink with the wrong target.
  local stub="$WORK/ssh-mismatch"
  cat > "$stub" <<'STUB'
#!/usr/bin/env bash
shift
stdin=$(cat)
case "$stdin" in
  *"readlink -f"*) echo "/home/jbaruch/nanoclaw" ;;
  *"test -f -- "*) : ;;
  *"ln -s --"*)
    echo "existing symlink at /volume1/docker/foo points at '/wrong/path', expected '/home/jbaruch/nanoclaw/container/foo'" >&2
    exit 1
    ;;
  *) exit 0 ;;
esac
STUB
  chmod +x "$stub"
  echo "$stub"
}

# === arg-validation tests (no ssh needed) ============================

echo "[1] arg validation"

run_script "" ""
[ "$RC" -ne 0 ] && pass_test "rejects no args" || fail_test "no args should fail"

run_script "" foo
[ "$RC" -ne 0 ] && pass_test "rejects single arg" || fail_test "single arg should fail"

run_script "" BadName container/foo
[ "$RC" -ne 0 ] && pass_test "rejects uppercase project name" || fail_test "uppercase should fail"

run_script "" valid-name /absolute/path
[ "$RC" -ne 0 ] && pass_test "rejects absolute in-repo dir" || fail_test "absolute should fail"

run_script "" valid-name ../escape
[ "$RC" -ne 0 ] && pass_test "rejects in-repo dir containing '..'" || fail_test "'..' should fail"

run_script "" valid-name 'a;rm -rf /'
[ "$RC" -ne 0 ] && pass_test "rejects in-repo dir with shell metacharacters" || fail_test "metachars should fail"

# === happy-path JSON contract test ===================================

echo "[2] happy path JSON contract"

SSH_HAPPY=$(make_ssh_stub_happy)
run_script "$SSH_HAPPY" nanoclaw-litellm container/litellm

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

run_script "$SSH_HAPPY" nanoclaw .
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

SSH_MISMATCH=$(make_ssh_stub_mismatch)
run_script "$SSH_MISMATCH" foo container/foo
[ "$RC" -ne 0 ] && pass_test "symlink mismatch surfaces non-zero exit" \
  || fail_test "symlink mismatch should fail (rc=$RC)"

# === ugos_insert_command stays as valid JSON ==========================

echo "[5] ugos_insert_command escapes correctly in JSON"

run_script "$SSH_HAPPY" nanoclaw-litellm container/litellm
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

# === summary =========================================================

echo
echo "Tests: $PASS passed, $FAIL failed"
exit "$FAIL"
