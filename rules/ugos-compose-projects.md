---
alwaysApply: true
---

# UGOS Compose Projects

## Required Read

- Before creating symlinks for, registering, changing or operating a repo-owned UGOS Compose project, read `skills/host-contracts/references/ugos-compose-projects.md` in full.
- Its full text and named sections bind as rule content. Missing or unreadable content stops the affected action until the plugin is repaired.
- Read explicitly when triggered; never `@`-import the reference.

## Boundary

- Verify the approved consumer, exact reviewed revision and explicit NAS runtime authority for the project before creating symlinks, registering it or using Start. This covers legacy NAS deployments and separately authorized storage or archive sidecars. Never register or start the Mini-era NanoClaw orchestrator on the NAS. Keep its NAS rollback copy stopped.
- Use repo-owned Compose files and deploy.sh. The UGOS UI is Start/Stop only; never use its Edit/Create flow or paste literal environment values.
