"""Insert a row into UGOS Pro's docker_info_log.db `compose` table.

Run with the verified operator command printed by register-ugos-project.sh.
Reads the compose file as bytes, decodes UTF-8, and stores both the
decoded text in the `content` column and the byte count in the
diagnostic output so the operator can match it against the byte count
the orchestrator captures pre-restart.
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

with open(compose_path, "rb") as fh:
    content_bytes = fh.read()
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
