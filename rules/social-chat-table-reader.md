---
alwaysApply: false
applyTo: "skills/social/scripts/social.py — when reading messages or registered_groups"
---

# Social Chat Table Reader

- `jbaruch/nanoclaw` owns `messages` and `registered_groups` in `/workspace/store/messages.db`; `src/db.ts:createSchema`, called by `initDatabase`, defines both, and `src/db-messages.ts` and `src/db-registered-groups.ts` write them.
- Inline upgrades add `messages.is_bot_message`, `reply_to_message_id`, `reply_to_message_content`, `telegram_message_id` (backfilled from `id` for inbound Telegram rows) and `registered_groups.is_main` (backfilled for folder `main`); these use coding-policy's Read-Only Legacy Runtime Tables exception.
- `src/state-migrations/state-029-messages-thread-id.ts` is the versioned schema of record for `messages.thread_id`.
- Main admin `social` reads through the native mount with `mode=ro`, requires `is_main=1` for the host-supplied chat and matches the host-supplied owner id.
- Required `registered_groups` columns are `jid`, `is_main` and `container_config` (JSON, `topics.social` is the thread id); required `messages` columns are `id`, `chat_jid`, `sender`, `content`, `timestamp` (ISO UTC text), `is_from_me`, `is_bot_message`, `thread_id` (text, `NULL` outside a topic or before migration 29), `telegram_message_id`, `reply_to_message_id` (joins `telegram_message_id`) and `reply_to_message_content` (nullable, truncated).
- The reader never initializes, migrates, backfills, writes or substitutes this database.
- Missing database, field, identity or topic, or a failed query, produces an actionable unavailable result, never empty evidence and never an approval.
