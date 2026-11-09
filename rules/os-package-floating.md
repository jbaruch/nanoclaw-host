---
alwaysApply: true
---

# OS Package Floating

## Required Read

- Before changing image packages, base images or deploy checks, or relying on the OS-package exception, read `skills/host-contracts/references/os-package-floating.md` in full.
- Its full text and named sections bind as rule content. Missing or unreadable content stops the affected action until the plugin is repaired.
- Read explicitly when triggered; never `@`-import the reference.

## Boundary

- Only the named images and approved package inventories qualify. Publish/install authority first; retain pinned bases, rebuilds and the CI inventory check.
