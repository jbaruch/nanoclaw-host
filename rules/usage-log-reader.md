---
alwaysApply: false
applyTo: "src/usage-log.ts, src/usage-retention.ts, src/subscription-limits.ts, docs/usage-log-schema.md, skills/daily-spend-rollup/** — when writing, expiring or reading the runtime usage log"
---

# Usage Log Reader

## Owner and Source

- The NanoClaw credential proxy is the sole writer of `logs/usage.jsonl`.
- The schema of record is `jbaruch/nanoclaw` `docs/usage-log-schema.md` and `src/usage-log.ts` (`UsageRecord`, `SubscriptionUsageRecord`, `appendUsageRecord`).
- This log contains historical observations under coding-policy's Append-Only Runtime Telemetry contract. Its only actions are informational reports and notices.

## Records

- Token rows have no `kind` and carry `ts`, attribution, counters and `cost_micro`. Absence of `schema_version` denotes legacy token schema 0. The current writer stamps new token rows with schema 1.
- Subscription rows carry schema 1, `kind: "subscription"`, `observed_at`, `http_status` and at least one recorded utilization window.
- The subscription limits host reader and the Admin spend and subscription readers consume their documented record kinds and versions. See Admin's `skills/daily-spend-rollup/references/usage-log.md` for its token schema 2 reader-first rollout.
- The main Admin mount `/workspace/proxy-logs/usage.jsonl` is read-only. Unsupported kinds and versions supply no invented observation.

## Expiration

- The owner may expire complete recognized records strictly older than 90 days and recognized records lacking a date. Token schemas 0 and 1 use `ts`. Subscription schema 1 uses `observed_at`.
- Preserve records at the cutoff, unknown versions and partial frames. Preserve the bytes and order of all retained records.
