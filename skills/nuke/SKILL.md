---
name: nuke
description: Kill a running agent container on the deployment host by Telegram group JID. The orchestrator respawns a fresh container on the next message. Does NOT delete registration or group folder. Use when a container is stuck, stale, or needs a fresh start.
---

# Nuke Container

Kills the running container for a group. Fresh container spawns on the next message.

## Usage

```bash
./scripts/nuke-container.sh <chat-jid>
```

The script:
1. Looks up the group folder from the database by JID
2. Converts the folder name to the container naming convention (underscores → hyphens)
3. Finds and kills the matching container on the deployment host

## What nuke does NOT do

- Does NOT delete the group registration from the database
- Does NOT delete the group folder or its contents
- Does NOT unregister the group

If no container is running, the script exits cleanly.

## Finding the JID

If the user provides a group name, run this read-only query in the deployment checkout verified under [Host Agent Conventions](../../rules/host-conventions.md).

```bash
sqlite3 -readonly store/messages.db 'SELECT jid, name FROM registered_groups;'
```
