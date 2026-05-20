---
alwaysApply: true
---

# No Error Suppression

Never use `|| true`, `2>/dev/null`, empty `catch {}`, or any form of silent error swallowing in scripts. If something fails, it must fail visibly.
