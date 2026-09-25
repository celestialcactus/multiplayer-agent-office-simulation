# ADR 0004: Clickable office signals and session discussion follow-ups

- Date: September 25, 2026
- Status: Implemented locally; hosted validation pending
- Builds on: [ADR 0003](0003-overview-first-interactive-office.md), [collaboration ADR](0001-agent-collaboration-and-artifacts.md)

## Decision

Make the expanded office an observable, interactive workspace. In addition to the overview-first layout and daily summary in ADR 0003, show brief activity and exchange bubbles near avatars. Activity bubbles describe actual scheduled work; exchange bubbles point to the exact recorded interaction. Use existing agent-authored speech or committed narration where available, with factual labels as fallback. These are observable explanations, not hidden chain-of-thought. Do not spend extra inference calls on presentation.

Limit visible bubbles to avoid overlap; keep the underlying activity accessible after a bubble disappears. Clicking an exchange opens participants, the recorded turns, attribution, and related work. Clicking a work indicator opens its associated work thread. Labels and keyboard-accessible buttons supplement the 3D environment. Inspection does not alter agent knowledge or execution priority.

Completed exchanges are immutable history. A session-scoped discussion groups related exchanges by work thread and participants. The owner can add a bounded follow-up agenda through their proxy agent. Display queued, discussed, or unaddressed-at-day-end state. A follow-up must not retroactively change an exchange or instantly broadcast private context to every coworker. Match the original thread and discussion participants when incorporating an agenda, preserve the owner as its source, and do not treat it as permission for new tools or external action.

For a discussion involving only NPCs, inspection alone gives the owner agent no knowledge. Steering must explicitly communicate the owner's requested agenda through an owner-involved encounter before it can influence later NPC discussion. If that routing cannot be fulfilled within this workday, leave the follow-up pending and report it as unaddressed. Never silently mark a message handled because the agents happened to meet on another topic.

## Memory and scope

Retain bounded exchange records and pending agendas inside the current workday checkpoint and eight-hour expiry. Reuse the existing session, model budget, and sequential runtime. Do not create a working thread for every encounter or consume additional thread slots for inspection. Prompt context includes only relevant discussion material, not the office-wide transcript. Preserve original evidence identities; circulation is not verification.

Long-term memory, account persistence, human multiplayer, and a shared permanent memory corpus are deferred. Future memory promotion should select useful findings/decisions with provenance and uncertainty rather than indiscriminately copying all conversations. Larger forks remain out of scope for the workday. No new infrastructure is needed for this slice.

## Evaluation gates

1. Expanded office retains environment visibility and thread-specific steering; overview starts with focused conversation collapsed.
2. A bubble opens its exact exchange, while a work bubble identifies an actual task. No fabricated activity or additional model calls.
3. A follow-up survives checkpoint recovery, affects only the matching later discussion, is processed at most once, and remains unaddressed if the workday ends first.
4. Invalid/cross-session discussion IDs, unrelated participants, and private context cannot cross boundaries. Queuing input does not interrupt unrelated work.
5. Retained discussions and agendas are globally bounded; read/render operations do not cause idle checkpoint writes.
6. Daily summary is a read-only conversation entry, works at budget exhaustion, links existing deliverables, and does not consume a work-thread slot.
7. Validate desktop/narrow layouts, bubble access, draft preservation, full-height keyboard/pointer resizing, and safe rendering. Separate scripted mechanical evidence from live model quality.

## Rollback and rollout

Baseline implementation is tagged `prototype-v1-swarm-workspace` (`0dd6349`), with ADR 0003 recorded at `82e6642`. Implement and validate locally before the user tests the frontend. Commit and push source on `codex/steerable-workday`; record hosted deployment separately. Keep older session rendering compatible and expose new commands only when the runtime advertises support.
