---
alwaysApply: false
applyTo: "src/memory-budget*, container/shared/memory-budget-*, skills/memory-diet/**, skills/memory-hygiene/**, tests/test_memory_*.py — when analyzing canonical memory budgets or running a memory diet"
---

# Memory Budget Policy

## Required Read

- Before producing, invoking or reading the shared analyzer, or running a memory diet, read `skills/host-contracts/references/memory-budget-policy.md` in full.
- Resolve it within this installed plugin.
- Its full text and named sections bind as rule content.
- Missing or unreadable content stops the affected action until the plugin is repaired.
- Read explicitly when triggered.
- Never `@`-import the reference.

## Ownership and Authorization

- The main agent edits its own MEMORY.md for a memory diet, only on an explicit main-group request.
- Moved incident text is kept verbatim in a reference file and linked from MEMORY.md.
- Exempt active-rule sections are never moved or edited by a diet.
- Metadata and lookup grant no memory-write authority.

## Provider and Rollout

- Only the host/image owns the canonical policy and parser.
- Consumers use the fixed immutable image target.
- Missing or unsupported artifacts mean unknown budget.
- Never substitute a separate exemption list or parser.
- Keep active-rule sections live and report their growth without turning exemptions into alarms or extraction targets.
