# ADR 0001: Proactive agent collaboration and generation-only deliverables

- Date: September 25, 2026
- Status: Accepted; implementation planned
- Related: [ADR 0002](0002-overview-and-focused-thread-workspace.md), [build plan](../context-and-autonomy-plan.md)

## Context

The current office supports research and exchanges but does not yet demonstrate sustained specialist collaboration producing substantial collateral. The next demo targets AI developers, with a banking technology office as background rather than a mandatory problem scenario. Users must be free to explore their own work. Human multiplayer, a deep development harness, and infrastructure execution are not required.

## Decision

Keep one human owner, their proxy agent, and specialist NPC coworkers. Give coworkers high initiative to pursue useful work, request help, challenge proposals, and offer contributions. The owner's agent has executive/editorial ownership of the final deliverable: it reconciles disagreement, checks support, and accepts or rejects contributions. Sharing a finding and accepting it into an artifact are different events.

Do not seed a mandatory shared banking scenario or force a standard solution. Specialist roles influence perspective; user goals define the work. Each agent maintains its own objectives, findings, uncertainties, and contribution backlog. Through actual encounters and meetings it learns what others are working on. It can retain relevant discoveries for a later exchange or proactively request a focused conversation when justified. Awareness of another agent's work is acquired and attributed, not omniscient access to sibling/private context.

Meetings accept optional agendas. An agenda scopes the discussion to a question, review, decision, or synthesis; an unstructured meeting can synchronize known work and surface connections. Preserve who shared what, the originating work/evidence, and which assumptions remain unresolved. Repeated circulation of a claim must not increase its evidential strength.

Offer optional creation/settings capabilities for research, architecture diagrams, technical briefs, and code drafts, with sensible defaults. Artifact production is generation and reporting only: no generated-code execution, repository writes, external publication, deployment, infrastructure changes, or new developer sandbox. Render generated artifacts as inert, sanitized content; label code unexecuted/untested. Proposals to deploy are text, not executable authorization.

## Context model

Assemble applicable context from private working preferences and role, optional session goals, project context, and thread/task history. Show an editable interpretation rather than requiring users to maintain a prescriptive shared-context form. Personal preferences may inform behavior without being copied into coworker-visible material. Retain source, scope, uncertainty, and revision for shared facts and findings; broader goal changes remain deliberate and attributable.

Account profiles and long-term memory are future inputs to this structure. Do not imply that current session-only context persists across workdays. Explicit scoped sharing remains necessary even when context assembly becomes more automatic.

## Execution and integration contract

- Extend the existing harness and session runtime; do not create a deployment per avatar or project.
- Keep inference sequential initially. Multiple visible threads do not imply concurrent model calls.
- Queue input for its target thread without unnecessarily cancelling useful work in another; corrections to in-flight work still invalidate affected stale results.
- Bound initiatives, contribution queues, meetings, and artifact revisions within the existing office budget. High autonomy must not become endless chatter or automatic meetings triggered by every exchange.
- Retain the checkpoint cost correction: no full-state writes for UI updates or idle timer ticks. Persist meaningful mutations; keep lease renewal separate.
- Expose attributable activity events and work states for the frontend: queued, processing, update available, input requested, completed, failed, and paused are distinguishable. Store artifact/contribution links rather than inventing activity for animation.

## Alternatives considered

- A fixed banking demo scenario: rejected because it can bias work away from user intent.
- Shared global transcripts for every agent: rejected because they erase context boundaries and make word-of-mouth diffusion meaningless.
- Immediate code execution or development environments: deferred; generation-only collateral is sufficient to evaluate this slice.
- Separate orchestration framework or concurrent runtime per agent: deferred until measured needs justify the cost and complexity.

## Acceptance gates

1. A coworker learns another's objective through an exchange, later discovers a relevant finding, and offers it with provenance; unrelated/private thread content stays excluded.
2. A focused meeting follows its agenda and yields an inspectable contribution, disagreement, or next action.
3. The owner agent revises a deliverable based on accepted contributions; rejected suggestions do not silently become conclusions.
4. Diagrams, briefs, and code drafts can be viewed/exported, with no execution or external writes and no extra permission implicit in generated text.
5. Synthetic evaluations distinguish useful collaboration from redundant sharing, unsupported agreement, and increased call usage. Compare deliverable quality with a single-agent baseline before claiming a swarm benefit.
6. Budgets, isolation, recovery, and idle-write regressions pass. Live checks use bounded synthetic sessions and explicit cleanup.

## Consequences

Requires work/awareness/contribution records and versioned artifacts beyond today's research-note model. High initiative adds scheduling pressure and must be evaluated, not assumed productive. Generation-only code cannot be represented as a verified implementation. Multi-project prioritization, account memory, human multiplayer, and external tools remain separate future decisions.
