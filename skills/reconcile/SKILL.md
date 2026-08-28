---
name: reconcile
description: Verify that all tessl plugins are in sync between git source, tessl registry, and the NAS orchestrator. Reports drift, unpublished content, untracked files, and version mismatches. Use when plugin state seems wrong, container behavior looks stale, you suspect out-of-sync plugins, or need to check plugin health before a release. Run after promoting skills or after any manual plugin edits. The script keeps its historical name, `./scripts/reconcile-tiles.sh`.
---

# Reconcile Plugins

Process steps in order. Do not skip ahead.

Full reconciliation check across all three plugin locations: git source, the tessl registry, and the NAS orchestrator.

## Step 1 — Run the reconcile script

```bash
./scripts/reconcile-tiles.sh
```

The filename keeps the historical `tiles` spelling — it is the real script name, not prose. There is no `reconcile-plugins.sh`.

It checks three things:

1. **Registry vs git** — diffs every rule and skill file between the registry-installed plugins and the git source baked into the orchestrator image
2. **Untracked files** — stale files on the NAS that aren't in git (leftover from manual copies)
3. **Version alignment** — the local `.tessl-plugin/plugin.json` version against the version installed in the orchestrator

Exit `0` means all clean — finish here. Exit `1` means issues were found and printed to stdout; proceed immediately to Step 2.

## Step 2 — Apply the fix for each reported issue

| Label | Meaning | Fix |
|-------|---------|-----|
| DRIFT | Registry and git have different content | Publish the plugin to push git changes into the registry |
| GIT-ONLY | File in git but not in registry | Publish the plugin to register the missing file |
| REGISTRY-ONLY | File in registry but not in git | Investigate — may be stale; remove from registry if confirmed orphaned |
| MISMATCH | Version numbers don't match | Publish the plugin if git is ahead, or re-install if registry is ahead |
| Untracked | Files on NAS not in git | Delete the untracked files from the NAS |

Any fix whose remedy is "publish the plugin" goes through `Skill(skill: "release")`, never a direct push — see `rules/tile-content-pipeline.md`.

Proceed immediately to Step 3.

## Step 3 — Re-run until clean

```bash
./scripts/reconcile-tiles.sh
```

Repeat Steps 2 and 3 until the script exits `0`. Finish here.

## When to run

- After every promote cycle
- After manual plugin edits
- When container behavior seems stale or wrong
- Before creating a release or snapshot
