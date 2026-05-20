---
alwaysApply: true
---

# Staging Diff Protocol

## The protocol

Before making ANY judgment about staging content:

1. **Diff** the staging version against the current plugin version
2. **Read** every change
3. **Reason** about what the changes do: improvements? new features? bug fixes? different approaches to the same problem?
4. **Merge** improvements into the plugin version when staging is better in some aspects and plugin is better in others
5. **Only then** decide: promote as-is, merge and promote, or request changes

## The diff command

```bash
ssh -n "$NAS_HOST" "cat <staging-path>" | diff - <local-tile-path>
```

## What "stale" means

"Stale" means the diff is empty — literally zero changes. Everything else requires reasoning. A file with the same name may have significant improvements that the plugin version doesn't have. Never declare content "already promoted" based on the filename or timestamp.
