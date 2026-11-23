"""Exercise the printed command in the fake NAS tree with the fixture user's uid."""

import json
import os
from pathlib import Path
import shlex
import sqlite3
import stat
import subprocess
import sys
from unittest.mock import patch

work, source = map(Path, sys.argv[1:])
remote = work / "remote files"
summary = json.loads((work / "stdout").read_text())
previous = json.loads((work / "sidecar.json").read_text())
helper = Path(summary["ugos_insert_helper"])
stage = helper.parent
assert stage != Path(previous["ugos_insert_helper"]).parent
local_helper = remote / helper.relative_to("/")
local_stage = local_helper.parent
for path, mode in [(local_stage, stat.S_IFDIR | 0o700), (local_helper, stat.S_IFREG | 0o600)]:
    info = path.lstat()
    assert (info.st_uid, info.st_mode) == (os.getuid(), mode)
assert local_helper.read_bytes() == source.read_bytes()

ssh = shlex.split(summary["ugos_insert_command"])
assert ssh[:-1] == ["ssh", "-t", "--", "nas"]
command = shlex.split(ssh[-1])
cleanup = command.index("&&")
assert command[cleanup:] == ["&&", "rm", "--", str(helper), "&&", "rmdir", "--", str(stage)]
assert command[:4] == ["sudo", "python3", "-I", "-c"]
verify, stage_arg, digest, size, project, compose = command[4:cleanup]
assert stage_arg == str(stage)
assert (project, compose) == (summary["project"], summary["compose_path_via_symlink"])

# Map the two NAS paths into the fixture. Run the actual verifier unprivileged.
compose_file = remote / Path(compose).relative_to("/")
args = [str(local_stage), digest, size, project, str(compose_file)]
uid = str(os.getuid())


def rejected(message, invoking_uid=uid):
    result = subprocess.run(
        [sys.executable, "-I", "-c", verify, *args],
        env={**os.environ, "SUDO_UID": invoking_uid}, capture_output=True, text=True,
    )
    assert result.returncode and message in result.stderr, result.stderr


rejected("stage owner", str(os.getuid() + 1))
local_stage.chmod(0o755)
rejected("stage owner or permissions")
local_stage.chmod(0o700)
local_helper.chmod(0o644)
rejected("private regular helper")
local_helper.unlink()
local_helper.mkdir()
rejected("private regular helper")
local_helper.rmdir()
local_helper.write_text("ordinary fixture text\n")
local_helper.chmod(0o600)
rejected("digest mismatch")
local_helper.write_bytes(source.read_bytes())

# Only redirect the DB connection. Exercise the reviewed INSERT and verify the row.
database = work / "ugos-fixture.db"
connect = sqlite3.connect
with connect(database) as db:
    db.execute("CREATE TABLE compose(created_at, updated_at, name, state, path, content, app_id, container_num)")
compose_file.write_text("services: {}\n")


def fixture_connection(path):
    assert path == summary["ugos_db"]
    return connect(database)


with patch.object(sys, "argv", ["-c", *args]), patch.dict(os.environ, SUDO_UID=uid), \
        patch.object(sqlite3, "connect", fixture_connection):
    exec(verify, {"__name__": "__main__"})

with connect(database) as db:
    assert db.execute("SELECT name, state, path, content FROM compose").fetchall() == [
        (project, 1, str(compose_file), compose_file.read_text())
    ]
