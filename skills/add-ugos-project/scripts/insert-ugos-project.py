"""Insert a row into UGOS Pro's docker_info_log.db `compose` table.

Run with the verified operator command printed by register-ugos-project.sh.
The staging user opens the snapshot on stdin. The registered Compose path
is row metadata. Only the verified bytes from stdin supply its content.
"""
import hashlib
import os
import sqlite3
import stat
import sys

UGOS_DB = "/volume1/@appstore/com.ugreen.docker/db/docker_info_log.db"

project_name, compose_path, size, digest = sys.argv[1:]
info = os.fstat(0)
if (
    info.st_uid != int(os.environ["SUDO_UID"])
    or not stat.S_ISREG(info.st_mode)
    or stat.S_IMODE(info.st_mode) != 0o600
):
    sys.exit("expected a private regular Compose snapshot owned by the invoking user")
expected_size = int(size)
content_bytes = os.read(0, expected_size + 1)
if len(content_bytes) != expected_size or hashlib.sha256(content_bytes).hexdigest() != digest:
    sys.exit("Compose snapshot differs from the reviewed blob")
content = content_bytes.decode("utf-8")

conn = sqlite3.connect(UGOS_DB)
try:
    cur = conn.execute(
        "SELECT 1 FROM compose WHERE name = ?", (project_name,),
    )
    if cur.fetchone() is not None:
        sys.exit(
            f"row already present for project '{project_name}' "
            "— refusing duplicate INSERT"
        )
    conn.execute(
        "INSERT INTO compose "
        "(created_at, updated_at, name, state, path, content, app_id, container_num) "
        "VALUES (datetime('now'), datetime('now'), ?, 1, ?, ?, '', 0)",
        (project_name, compose_path, content),
    )
    conn.commit()
finally:
    conn.close()

print(
    f"inserted row: name={project_name}, path={compose_path}, "
    f"content_bytes={len(content_bytes)}"
)
