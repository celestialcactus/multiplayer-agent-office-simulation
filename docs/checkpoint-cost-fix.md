# Checkpoint write-cost incident and correction

September 22, 2026.

## Finding

The coordinator saved the entire session on each one-second timer tick, including paused and completed sessions. DynamoDB stores that snapshot in transactional chunks, so accumulated research and duplicated project/thread representations amplified write units. The model-call cap did not cap checkpoint writes.

The account's September 1–22 estimated DynamoDB usage showed 44,140,730 write request units ($27.58795625), 22,994.5 read units ($0.0028743125), and zero storage charges. These are account-wide usage-type totals, not resource-level cost attribution. One completed pilot office at 60 calls had reached checkpoint version 16,128 at inspection. The implementation defect is confirmed; exact attribution of every billed write is not.

## Change

- Completed offices return before the timer mutates or checkpoints state. They do not renew leases in the background.
- Idle paused offices do not write snapshots. While resident, they keep ownership using a small META-only conditional lease update, at most once per ten seconds.
- Active offices save clock-only progress at most every 30 seconds. Incidental clock, presence, and scheduler counters do not trigger full saves themselves.
- User commands, job starts, result commits, and model-call reservations remain immediately durable. Duplicate command IDs return without another write.
- Lease renewal checks the stored owner and version. Ownership failures evict the cached worker rather than permitting unfenced progress.

The UI clock still ticks each second. An abrupt crash can lose up to 30 seconds of clock-only progress; accepted commands, results, and reserved model calls retain their immediate checkpoint behavior. Full snapshots remain transactional. This is a targeted volume correction, not a new storage architecture or a promise of zero DynamoDB costs.

## Verification and rollout

66 regression tests pass. New tests cover paused/completed idle writes, periodic active saves, duplicate commands, durable disconnect pause, reservation/result durability, throttled META heartbeats, and ownership-loss eviction. A 90-second clock-only simulation performs three periodic saves rather than 90.

Hosted verification is pending deployment. `scripts/checkpoint-cost-smoke.mjs` creates a disposable office, checks stable snapshot versions during paused/completed observation windows, confirms lease renewal only while paused, and checks report access before cleanup.

Existing microVMs retain old code. Updating the deployed runtime alone does not stop their write loops. Retire the affected completed runtime after deployment, retain its DynamoDB checkpoint, allow its old lease to expire, and verify the replacement can read its report without increasing snapshot versions.

Follow-up: measure cost trends after billing data catches up; consider compact or incremental state persistence and explicit budget alerts as separate changes. No billing refund, credit, or alert configuration is claimed by this fix.
