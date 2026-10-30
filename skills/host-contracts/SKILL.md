---
name: host-contracts
description: >
  Resolve required NanoClaw host contracts, load operation constraints and identify
  exception checks before host work. Use for "deploy NanoClaw", "publish a plugin",
  "update image packages", "extract an overlay", "restore browser login", "enroll the private browser viewer", "relink
  WhatsApp", "recover a task", "check memory budgets", "read meeting chat evidence" or "enable learning evidence"
  when a nanoclaw-host rule requires its full procedure. This skill reads the applicable policy;
  it does not deploy, operate services or grant approval.
user-invocable: false
---

# Host Contracts

Process steps in order. Do not skip ahead.

## Step 1 — Read the Applicable Contract

Read the full `skills/host-contracts/references/<rule-name>.md` cited by each
triggering `rules/<rule-name>.md` before the affected action. Resolve paths
within this installed plugin, or this repository when maintaining it. Each
reference retains the complete binding procedure and all exception conditions.
Load another reference only when its own trigger applies. Missing or unreadable
content stops the affected action until the plugin is repaired.

For browser persistence, `rules/browser-profile-storage.md` requires
`skills/host-contracts/references/browser-profile-storage.md` before using
the authenticated browser profile.

For private viewer enrollment or access, read the full reference required by
`rules/browser-tailnet-viewer.md`:

```text
skills/host-contracts/references/browser-tailnet-viewer.md
```

For main-only meeting chat evidence, read the complete reference required by
`rules/meeting-chat-context.md`:

```text
skills/host-contracts/references/meeting-chat-context.md
```

This read grants no runtime authority, approval or exemption. Resume the
original task under the loaded contracts. Finish here.
