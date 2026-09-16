# Action-level escalation: MVP build plan

## Outcome

An unknown does not park an idea. Agents continue researching, comparing alternatives, or discussing the same problem when useful progress is possible. An escalation identifies a specific dependent action, explains why the answer matters, and names the work that can continue. Questions and blocked actions are separate session records.

## Build sequence

1. Add a validated action assessment: next action, research/discussion capability, explicit assumptions, optional question, reason, and specific dependent action. A missing tool permission is recorded separately from missing knowledge; no new external-write capability is enabled.
2. Replace blanket primary-task parking with an action ledger and question lifecycle. Preserve unresolved questions across synthesis and unrelated messages. Resolve only from a user response; retire obsolete records when the user changes scope. Keep a bounded history and deterministic IDs for repeated actions.
3. Connect selected actions to real research/encounter jobs. Track ready, running, completed, deferred, and blocked states. Do not reset exhausted research attempts on every synthesis. After two unsuccessful attempts, defer that action and reconsider alternatives rather than repeating the same search.
4. Show what is happening, why, what is assumed, and exactly what awaits an answer. Keep plain-language steering and one living deliverable. Do not narrate the same question on every synthesis.
5. Test optional information, true dependencies, unrelated replies, resolutions, repeated failures, paused work, session recovery, privacy, and malformed plans. Run a bounded hosted Bedrock scenario and verify the deployed UI.

## Architecture and boundaries

Extend the existing domain scheduler and AgentCore runtime. The model proposes an action and escalation; code validates capability, lifecycle, budgets, and evidence references. Inference remains serialized per office. Research and discussion are the only executable action kinds in this slice; the brief is updated during synthesis. Pending permission is not executable authorization.

Use project context only where the agent already knows the project. Retain provenance of research and exchanges. Questions may remain visible while work on the same idea advances. Explicit pause, daily call budget, and disconnect auto-pause keep their existing behavior.

Existing AgentCore microVMs retain old code. Validate fresh offices after deployment and recover a specific older session only from its checkpoint with safe ownership handoff; do not silently discard active offices.

## Later: code deliverables

An AWS development environment or Kiro integration is deferred. Before enabling it, add a capability adapter with scoped workspace access, execution time/cost limits, durable artifact references, test results, and explicit authorization for external writes. Keep permission requests distinct from clarification questions. No development service, Kiro integration, or arbitrary code execution is provisioned by this slice.

## Acceptance evidence

Implemented in `domain/actions.mjs`, `server/action-assessment.mjs`, and the existing coordinator/project loop. A short structured assessment precedes drafting; each assessment has one schema-repair retry with the precise validation error and prior response, both charged to the same workday budget. The executable next action is attached to a research idea or a planned coworker exchange. The UI shows rationale, assumptions, optional questions, and exact held actions.

49 regression tests pass, including action dependencies, unrelated steering, user-only resolution, repeated failures, discussion execution, permission boundaries, escaping, and interrupted actions. Production build and syntax checks pass. Local browser verification completed. Live Bedrock assessment checks passed for optional missing information, a specific human dependency, unrelated steering, and explicit resolution. The first hosted smoke exposed an assessment schema error; a targeted live Bedrock check verified the correction. The full hosted rerun is currently blocked by the pilot daily admission limit; no end-to-end hosted pass is claimed yet.

MVP limits: one active human question is surfaced at a time, with bounded history. The model chooses the semantic next action; the harness checks structure and execution state, not the truth of its judgment. Exact repeated action titles retain attempt counts; semantically equivalent rewordings still require evaluation. There is no arbitrary tool execution, permission-grant API, or simultaneous per-office inference in this slice.
