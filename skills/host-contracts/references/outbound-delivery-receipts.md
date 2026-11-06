# Native send results and shared delivery capacity

## Current runtime

Runtime `jbaruch/nanoclaw` owns message transport and its native result.
`src/ipc-handlers/messages.ts` returns the successful `Message sent.` or
`Message sent and pinned.` result only after the ordinary channel send completes.
Its Telegram no-ID path returns an error and writes no phantom bot row.
`src/channels/telegram.ts` owns chunking and rendering. Use the actual result
from this invocation; source tests, visible URLs and a caller's receipt fields
are not a successful send.

On a successful result, the workflow owner may record ordinary delivery progress
and perform its declared subsequent bookkeeping. Morning-brief's delivered
marker may record its selected bundle after that successful send; the approved
email-surface workflow may use that selection for reversible post-brief filing.
The owner declares its marker schema, writer, readers and selection binding.
A marker records workflow progress, not an independently verified native receipt.

Failed, missing, partial or uncertain results require inspection. Never turn a
local marker, absent history or a new request ID into permission to resend an
uncertain message. Successful delivery proves no owner answer, read receipt or
approval of another effect; existing callback and effect-specific approval
contracts still apply.

## Retired receipt tracking

Core removed the unused generic receipt framework in commit
`df47c29afea03d89f09d0583354c7bfbba3c15bc`. It supplies no
`get_outbound_delivery_receipts` tool, outbound-receipt IPC reader, origin carrier,
receipt store/query service or `OUTBOUND_RECEIPTS_ENABLED` activation flag.
Consumers must not require or recreate that retired framework to do ordinary
send-result bookkeeping.

Migration `src/state-migrations/callback-005-outbound-deliveries.ts` remains in
its contiguous private callback migration chain. Preserve those tables through
`src/callback-store.ts`; consumers never open, migrate, reset or repurpose the
private database. The current shared backup owner
`src/conference-followup-ledger.ts` projects `outbound: null` and normalizes an
older outbound projection to null. This retirement changes no active conference,
Task, Tessie or Construction gate and restores no active callback choices.

## Shared protected capacity

`src/protected-delivery-capacity.ts` owns transaction-local admission for active
conference, Task, Tessie and Construction effects. It measures the complete
candidate projection from `src/conference-followup-ledger.ts` on the same SQLite
handle and reserves the active domains' possible native-ACK growth before a new
intent commits. The complete archive limit is 32 MiB. No outbound-receipt row
quota or receipt-tracking admission remains in the send path.

A capacity refusal rolls back only new undispatched work. Preserve existing
uncertainty, consumed slots and acknowledgments. Do not prune, evict, reset or
invent records to fit; use the active domain's reviewed owner upgrade or restore
contract. An admitted native acknowledgment does not create a new effect intent.
