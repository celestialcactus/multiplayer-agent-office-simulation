# One project, separate conversations

September 17, 2026. Implementation slice from the [context and autonomy plan](context-and-autonomy-plan.md).

## Delivered behavior

- Up to six named threads per office. Each has its own objective, inputs, messages, brief, artifact history, questions, actions, and knowledge of participating coworkers.
- A thread selector changes the viewed conversation, brief, activity, and ideas. It does not issue a scheduling command. Explicit **Work on this thread** changes execution focus. New messages and new threads receive a bounded guidance turn; the agent then works on the most recently serviced thread. This is not multi-project prioritization or fair autonomous scheduling.
- Shared project context is owner-edited, revision-checked text. Editing it invalidates in-flight work and marks all thread artifacts for reconsideration. Shared context starts empty; the original onboarding description is the first thread's objective, not implicitly copied into every sibling.
- Owner-visible research findings can be explicitly promoted into shared context. Promotion preserves source thread, author, evidence, and uncertainty. It does not copy the source conversation or establish the finding as a user fact. Superseded or no-longer-retained evidence is excluded from inference context.
- Open questions link to their originating thread and accept a targeted reply. The existing one-active-question-per-thread policy remains. Optional questions do not halt the office.
- An expandable work panel offers more reading space. Message drafts are retained while switching threads within the page; the selected thread is restored on refresh. Draft text is not persisted across refresh.
- Reports include every thread's living brief. Existing per-agent report pages and full Markdown export remain.

## Context and execution boundaries

`domain/threads.mjs` owns migration, reference validation, focus, context updates, and sharing commands. The existing `s.project` field aliases the currently executing thread for compatibility with the domain harness. JSON checkpoints reconstruct that alias on load. Snapshot capabilities advertise `threads-v1`; older runtime sessions do not show unsupported thread controls.

Research memory, ideas, exchanges, candidate selection, and correction retirement are filtered by thread ID. Guidance receives the selected thread plus shared context. Sharing a finding is an explicit owner action; private notes and unshared sibling transcripts are not injected. Untagged legacy records belong to the migrated `main` thread only. Jobs carry their thread identity and retain generation-based invalidation; a focus or context change cannot commit a stale result to a different thread.

Existing ownership cookies, command deduplication, snapshot checkpoints, expiry, pause behavior, and the 60-call office budget remain. All threads share that budget. Inference is sequential. A paused workday can still respond to user steering, as before, without advancing the office simulation.

## Validation

59 regression tests pass, including ten new tests for migration/JSON recovery, isolated steering, filtered research and exchanges, explicit sharing and supersession, context revision conflicts, foreign IDs, stale jobs, inference payload boundaries, thread limits, and linked deliverables. Syntax checks and production build pass. Browser verification covered creating and selecting threads, separate conversation content, shared-context editing, and expanded layout. The existing large Three.js bundle warning remains.

Hosted validation is pending deployment; do not interpret local tests as a live-model quality result. The bounded `scripts/threads-smoke.mjs` scenario checks live independent briefs, targeted steering, shared revisions, focus, pause, restoration, and export, then deletes its synthetic office.

## Limits and next work

This delivers the foundational one-project thread slice, not all phases of the comprehensive plan. Human-scored progress evaluation, meaningful generated idea titles, no-useful-work stopping states, semantic duplicate detection, fine-grained context records/correction propagation, persistent report history, multi-project scheduling, tool execution, and automatic thread creation remain future work. Context isolation tests check what is supplied and mutated; they do not prove that a model will never hallucinate or make an irrelevant inference.

Shared context is one editable block with bounded history, not yet an individually sourced fact/decision ledger. Corrections still retire the affected thread's evidence broadly. Work selection does not guarantee attention to every thread; the UI names the active thread and provides explicit focus. Additional shared findings are capped at eight. Context retains the office's existing eight-hour/session boundary.

Existing AgentCore microVMs can retain the earlier runtime. Start a fresh office to use thread controls after the runtime rollout. The migration supports checkpoints loaded by the new runtime without deleting their earlier conversation.
