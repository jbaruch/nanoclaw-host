"""Run the printed handoff in the fake NAS tree as the staging user."""

import hashlib
import json
import os
from pathlib import Path
import shlex
import sqlite3
import stat
import subprocess
import sys

work, source = map(Path, sys.argv[1:])
remote = work / "remote files"
summary = json.loads((work / "stdout").read_text())
previous = json.loads((work / "sidecar.json").read_text())
helper = Path(summary["ugos_insert_helper"])
stage = helper.parent
assert stage != Path(previous["ugos_insert_helper"]).parent
local_stage = remote / stage.relative_to("/")
local_helper = local_stage / helper.name
snapshot = local_stage / "compose.yaml"
for path, mode in [
    (local_stage, stat.S_IFDIR | 0o700),
    (local_helper, stat.S_IFREG | 0o600),
    (snapshot, stat.S_IFREG | 0o600),
]:
    info = path.lstat()
    assert (info.st_uid, info.st_mode) == (os.getuid(), mode)
assert local_helper.read_bytes() == source.read_bytes()

ssh = shlex.split(summary["ugos_insert_command"])
assert ssh[:-1] == ["ssh", "-t", "--", "nas"]
command = shlex.split(ssh[-1])
project = summary["project"]
compose = f"/volume1/docker/{project}/docker-compose.yaml"
reviewed = subprocess.check_output(["git", "show", "HEAD^:container/litellm/docker-compose.yaml"])
assert snapshot.read_bytes() == reviewed
assert command[:4] == ["sudo", "python3", "-I", "-c"]
assert command[5:] == [
    str(stage), hashlib.sha256(source.read_bytes()).hexdigest(), str(source.stat().st_size),
    project, compose, str(len(reviewed)), hashlib.sha256(reviewed).hexdigest(),
    "<", str(stage / snapshot.name), "&&", "rm", "--", str(helper), str(stage / snapshot.name),
    "&&", "rmdir", "--", str(stage),
]

database = work / "ugos-fixture.db"
with sqlite3.connect(database) as db:
    db.execute("CREATE TABLE compose(created_at, updated_at, name, state, path, content, app_id, container_num)")

# Preserve shell redirection and cleanup. Stand in for sudo as the current user,
# redirecting only the UGOS database and refusing a premature SQLite open.
bootstrap = """
import os, sqlite3, sys
verify = sys.argv[1]
sys.argv = ["-c", *sys.argv[2:]]
# Replace the snapshot after shell redirection to exercise the held descriptor.
if os.environ["ALLOW_DB"] == "1":
    snapshot = os.path.join(sys.argv[1], "compose.yaml")
    os.unlink(snapshot)
    with open(snapshot, "xb") as replacement:
        replacement.write(b"later bytes")
connect = sqlite3.connect
def fixture_connection(path):
    assert os.environ["ALLOW_DB"] == "1" and path == os.environ["UGOS_DB"]
    return connect(os.environ["FIXTURE_DB"])
sqlite3.connect = fixture_connection
exec(verify)
"""
uid = str(os.getuid())


def run_handoff(message=None, *, invoking_uid=uid, allow_db=False, handoff=summary):
    staged_dir = Path(handoff["ugos_insert_helper"]).parent
    mapped_dir = remote / staged_dir.relative_to("/")
    command = shlex.split(handoff["ugos_insert_command"])[-1]
    sudo_stub = 'sudo() { shift 3; "$PYTHON" -I -c "$BOOTSTRAP" "$@"; }\n'
    operator = sudo_stub + command.replace(str(staged_dir), shlex.quote(str(mapped_dir)))
    result = subprocess.run(
        ["sh", "-c", operator], env={
            **os.environ, "SUDO_UID": invoking_uid, "PYTHON": sys.executable,
            "BOOTSTRAP": bootstrap, "UGOS_DB": summary["ugos_db"],
            "FIXTURE_DB": str(database), "ALLOW_DB": str(int(allow_db)),
        }, capture_output=True, text=True,
    )
    if message is None:
        assert result.returncode == 0, result.stderr
    else:
        assert result.returncode and message in result.stderr, result.stderr


run_handoff("stage owner", invoking_uid=str(os.getuid() + 1))
local_stage.chmod(0o755)
run_handoff("stage owner or permissions")
local_stage.chmod(0o700)
local_helper.chmod(0o644)
run_handoff("private regular helper")
local_helper.unlink()
local_helper.mkdir()
run_handoff("private regular helper")
local_helper.rmdir()
local_helper.write_text("ordinary fixture text\n")
local_helper.chmod(0o600)
run_handoff("helper digest mismatch")
local_helper.write_bytes(source.read_bytes())

snapshot.chmod(0o644)
run_handoff("private regular Compose snapshot")
snapshot.chmod(0o600)
snapshot.unlink()
os.mkfifo(snapshot, 0o600)
fifo = os.open(snapshot, os.O_RDWR | os.O_NONBLOCK)
run_handoff("private regular Compose snapshot")
os.close(fifo)
snapshot.unlink()
snapshot.touch(mode=0o600)
for invalid in [b"X" * len(reviewed), reviewed[:-1], reviewed + b"X"]:
    snapshot.write_bytes(invalid)
    run_handoff("Compose snapshot differs")
with sqlite3.connect(database) as db:
    assert db.execute("SELECT count(*) FROM compose").fetchone() == (0,)
snapshot.write_bytes(reviewed)

# The registered path now points elsewhere. Its old contents are in the
# staged descriptor alone when the approved command runs.
project_link = remote / Path(compose).parent.relative_to("/")
project_link.unlink()
project_link.symlink_to(remote / "repo/container/foo")
assert (project_link / "docker-compose.yaml").read_bytes() != reviewed
run_handoff(allow_db=True)
assert not local_stage.exists()

# The earlier handoff has its own valid stage for the same project.
run_handoff("refusing duplicate INSERT", allow_db=True, handoff=previous)
with sqlite3.connect(database) as db:
    assert db.execute("SELECT name, state, path, content FROM compose").fetchall() == [
        (project, 1, compose, reviewed.decode("utf-8"))
    ]
