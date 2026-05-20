---
alwaysApply: true
---

# No Error Suppression

## Forbidden constructs

- `|| true`
- `2>/dev/null`
- Empty `catch {}`
- Any other form of silent error swallowing

## Required behavior

- If a script step fails, the script MUST exit non-zero
- The failure MUST surface on stderr with enough context to diagnose
- Logs MUST retain the failing command's exit code and its error output

## Scope

- Shell scripts in `scripts/`
- TypeScript and Python utilities the host agent invokes
- IPC handlers and outer-boundary process contracts that fall under `coding-policy: error-handling`'s carve-out still need the literal `outer-boundary-process-contract` grep token + comment
