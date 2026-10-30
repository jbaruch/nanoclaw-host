# Meeting chat context

Contract: meeting-chat-context-host-v1

## Provider and owners

The authority is the installed `jbaruch/nanoclaw-host` manifest declaring
`rules/meeting-chat-context.md`, its `meetingChatContextContract` marker and this
contained regular reference. Core owns `meeting_chat_context`, exposed through
`get_meeting_chat_context`; Admin meeting-dossier is its read-only consumer.
Core implementation details live in `docs/MEETING-CHAT-CONTEXT.md`; that source
document does not replace this installed provider identity.

Before any native member or message read, the Core owner verifies the installed
provider identity, declared rule, marker and reference. Missing, linked outside
the provider, malformed or incompatible authority yields an actionable hold.
No caller-selected provider/path/readiness flag can satisfy that check.

## Actual main and search inputs

The host dispatcher derives main from the actual IPC directory. Require one
unique registered Telegram main matching that source folder and a configured
owner. After I/O, revalidate owner, complete registrations, actual main and the
fixed trusted key-people bytes before returning private output. Lower-trust
chats cannot obtain peer content by supplying role, source, chat or path fields.

Wire schema 1 accepts only event_id, attendee_emails, previous_occurrence and
cursor, with its literal schema_version. Event ID, addresses and prior instant
are caller search inputs, never host-verified Calendar proof or authority.
The consumer preserves its separate native preparation event/revision evidence.
Resolve bounded evidence for a prior occurrence of the same meeting BEFORE
selection; a matching title alone is insufficient. Use a positively sourced
zoned prior instant within 30 days or a justified null for the last 24 hours.

## Selection and current identity

Read only the host's fixed `trusted/key-people.md` through bounded no-follow
regular single-link UTF-8 reads and stable named/held identity. Map exact
case-folded attendee emails in table rows to unique explicit Telegram handles.
Display names, quoted prose and guessed keywords are never identity evidence.
Conflicting mappings hold; missing mappings remain unknown.

Use only currently registered Telegram chats and their existing runtime-owned
message/native-reply metadata. Candidate user IDs come from those actual rows.
Reuse the configured Telegram channel's existing OneCLI actor and read-only
`getChatMember(chat_id,user_id)` API, requiring the exact returned user ID and
boolean is_bot. Current usernames describe a current observed snapshot, not a
historical username or independently verified real-world attendee identity.
A denied/non-admin/malformed/timed-out result stays unknown. No extra grants,
admin promotion, alternative account, key copy or display-name fallback.

Rank 30-day active human authors by the fraction of attendee handles among their
distinct native IDs. Unknown denominators remain null and cannot win; ties and
ambiguous or unresolved handles make coverage incomplete. Return all selected
chat messages since the prior occurrence or last 24 hours, without keyword
filtering. Independently include last 24-hour bot posts mentioning exact attendee
handle tokens and their transitive same-chat native reply closure. Host-sent
rows and current native bot metadata classify bots; the legacy bot flag alone
does not. Join replies by chat plus native Telegram message ID, not quoted text.

## Bounds and read-only behavior

Bound source discovery to 128 registered chats/50,000 recent rows, current member
reads to 128 unique IDs/four concurrent calls/40 seconds total/four seconds per
call, and selected/bot-scan content to 32 MiB. Do not hold SQLite transactions
over awaited native I/O. Recheck message metadata after native reads.

Return schema 1 untrusted source text, current identity/search-input provenance,
actual source/citation/native IDs, range, revision, paging and coverage. Each
page is at most 24 KiB/50 messages; omit an unreturnable whole message only with an
explicit global oversized gap, never clip it into apparently complete evidence.
Every page advances, finishes or yields actionable typed hold. Bind cursors to
query/time/revision and refuse changed source; the consumer follows at most
20 pages and reports unexamined remainder. Missing/denied/ambiguous identities,
ties, unresolved replies, unread or oversized context never prove absence.

Native operational source gaps preserve ordinary reminders with fixed
remediation. Infrastructure failures retain safe structured code diagnostics;
unexpected storage failures propagate, never become empty evidence. Output
uses the existing private script-result owner. No DB migration/state write,
credential access, provider write, message, schedule, approval or peer disclosure.

## Publication and runtime adoption

Publish this authority and confirm its registry version/moderation before the
compatible Core producer release. Install it normally for source gates; verify
actual installed provider bytes before native producer activation. Core must
merge before Admin consumer publication. A missing reader preserves ordinary
reminders and explicit unknown coverage. Root owns deployed producer/consumer
verification and genuine registered-main/real-recording acceptance. Source
release alone proves neither native adoption nor attendance correctness.
