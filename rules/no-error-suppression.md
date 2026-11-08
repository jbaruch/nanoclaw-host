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

## Private browser diagnostics

- Narrow exception for `agent-browser` output that may contain credentials or page content.
- Preconditions (all required):
  1. Terminal failures stay non-zero and surface on stderr; Social's existing partial-read contract retains its declared failure payload.
  2. Diagnostic output and existing task-error or `read_failures` carriers retain the operation and available process exit, allowlisted native code, bounded OS errno and known exception kind.
  3. Facts come from caller/process metadata or a validated native error form. Omit raw driver prose, URLs and arguments.
  4. Stderr or the aggregate failure message supplies a fixed repair instruction. Never infer an omitted cause.
  5. Entrypoint tests retain these facts and exclude private driver text.
- Every other command retains its exit code and safely redacted error output.

## Scope

- Shell scripts in `scripts/`
- TypeScript and Python utilities the host agent invokes
- IPC handlers and outer-boundary process contracts that fall under `coding-policy: error-handling`'s carve-out still need the literal `outer-boundary-process-contract` grep token + comment
