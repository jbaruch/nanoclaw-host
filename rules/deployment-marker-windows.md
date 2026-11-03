---
alwaysApply: false
applyTo: "scripts/deploy.sh, skills/heartbeat/scripts/heartbeat-checks.py — when writing or reading deployment window markers"
---

# Deployment Window Markers

## Logs

- `jbaruch/nanoclaw` `scripts/deploy.sh` appends one line per window to `data/host-logs/deploy-kills.log` (its force-kill interval) and `data/host-logs/tessl-update-window.log` (its plugin-update interval).
- Main agents read them read-only at `/workspace/host-logs/`.
- A line is `{"schema_version":1,"start":"<UTC ISO-8601 Z>","end":"<UTC ISO-8601 Z>"}`; legacy `<start>\t<end>` lines stay readable.
- deploy.sh runs as the agent identity, only appends, and creates new files at `0600` in a `0700` directory under `umask 077`.

## Readers

- Heartbeat readers never write, repair or migrate marker history.
- The admin heartbeat suppresses only exit-137 failures inside a kill window and registry-missing failures inside an update window.
- An unreadable file or malformed line is actionable unknown coverage, never a window or a healthy result.
- Markers grant no effect, approval, delivery or completion authority.
