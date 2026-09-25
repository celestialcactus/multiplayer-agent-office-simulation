# Context, interaction, and autonomous work: next build plan

September 17, 2026. Status: **planned, not implemented**. This consolidates the usability, context, threads, evaluation, scheduling, and tooling proposals discussed after the action-escalation slice. It is the sequencing plan for subsequent work, not evidence that those capabilities are deployed.

## Outcome and baseline

Users should understand what their agent is trying to accomplish, what changed, and where their input matters. Agents should advance an explicit outcome, retain evidence and uncertainty, and stop unproductive work without stopping the office.

The current MVP has one project and living brief per office, a single owner conversation, research/discussion actions, session checkpoints, action-level dependencies, and four NPC coworkers. Chat scrolling, compact idea title excerpts, and per-agent report pages are deployed. Structured assessment and action-state tests establish basic lifecycle behavior; they do not establish semantic relevance or useful progress. Research with sources currently counts as successful execution. Reworded actions can evade exact-title attempt tracking. Planning currently requires another research/discussion action, even when useful work may be exhausted.

Extend the existing domain harness and AgentCore runtime. Do not introduce a runtime per project, a second agent framework, or parallel inference merely to support threads. Preserve the independent Agent Office development boundary.

## Delivery sequence

| Phase | Work package | Dependency | Completion gate |
| --- | --- | --- | --- |
| A | Evaluation baseline and progress vocabulary | Current MVP | Repeatable scenarios and scored baseline results |
| B | Readable work surface and lifecycle UX | A for progress labels | Users can identify current work, latest result, and pending input |
| C | Project intent, context records, and outcome checks | A | Provenance, correction, and relevance checks pass |
| D | One project with isolated threads | C; B for navigation | Thread routing, shared-context promotion, and recovery pass |
| E | Escalation inbox and bounded work selection | C–D | Questions target dependencies; no forced filler work |
| F | Two-project scheduling | D–E | Useful switching without starvation or context leakage |
| G | Tool-capable deliverables | C–F gates | Scoped execution and artifact validation in a separate slice |

B can be developed alongside C. Deliver D with the minimum thread-linked questions needed for steering; E extends this into a unified inbox and scheduling policy. Do not delay the first useful thread release for the full portfolio scheduler.

## A. Establish how progress is judged

- Capture a baseline using synthetic projects: public unknowns, private intent, optional context, contradictory evidence, repeated failures, unrelated steering, and user corrections.
- Separate execution success from contribution: answered a question, added supported evidence, contradicted an assumption, revised a deliverable, or produced no useful change.
- Record the action's intended contribution before execution and evaluate its result afterward. Link judgments to evidence and changed artifact sections; model self-assessment alone is not proof.
- Track useful deliverable changes per model call, unsupported assumptions, unnecessary escalations, redundant work, time to first useful result, and correction propagation. Track project neglect once scheduling exists.
- Use deterministic lifecycle tests plus human-scored model outputs. Record model, prompt version, budgets, and repeated-run results. Set quality thresholds after measuring the baseline, before expanding the pilot.

Acceptance: a sourced but irrelevant result is distinguishable from useful progress; failure and uncertainty are visible; the same scenarios can be rerun against subsequent slices. Hosted evaluation uses a bounded call budget and explicitly disposable synthetic offices.

## B. Make the work readable

- Add an expandable work area alongside the office: project/thread navigation, conversation, deliverable, and a collapsible context panel. Preserve a usable narrow/mobile layout.
- Keep a compact summary: current action, latest meaningful result, and input needed. Avoid long question panels pushing the conversation out of view.
- Narrate changes, implications, and next actions. Suppress duplicate/no-change updates while retaining inspectable activity history. Distinguish working, queued, waiting on one dependency, paused, failed, budget exhausted, and complete.
- Make avatar selection link to the agent's active thread and latest contribution. Link research and exchanges back to their work items.
- Replace title excerpts with meaningful idea titles and one-sentence relevance summaries generated as part of existing inference. Preserve full text, sources, and attribution; avoid a separate naming call.
- Lead the personal report with findings, recommendations, unresolved decisions, and the deliverable. Supporting research remains expandable; per-agent pages and complete export remain available.
- Clarify refresh/resume/start-fresh behavior, expiry, inference budget, and daily admission limits. Offer export before replacing a workday. Provide actionable retry/error messages and clear message-submission state.
- Preserve reading position, drafts, keyboard focus, and selected thread through polling. Verify contrast, keyboard navigation, responsive layout, and screen-reader labels.

Acceptance: a short task-based usability test covers finding a result, answering a question, inspecting its evidence, switching views, and recovering after refresh. A user can identify current work without reading the entire transcript. Session-expiry copy must not imply recoverable history when none exists.

## C. Tighten project intent and context

Maintain a small, editable project brief assembled from conversation, not an expanded mandatory onboarding form:

- Intent and intended decision/outcome; success criteria and expected deliverable.
- Scope, constraints, excluded directions, and user priority.
- User statements, user decisions, sourced findings, hypotheses, and unresolved questions as distinct records.
- Current actions, attempted approaches, remaining budget, and artifact revision.

Show a short interpretation of the goal for easy correction. Agent interpretations must not silently become user facts. Each context record carries project/thread scope, provenance, revision, visibility, and supersession links. Changes identify affected actions, conclusions, and artifact sections instead of automatically discarding all previous evidence.

Assemble bounded context for the selected work: applicable project facts, current thread, relevant evidence, and dependencies. Older relevant evidence must not disappear solely because newer unrelated items arrived. Preserve private persona notes separately from coworker-visible context.

Every action identifies the uncertainty or deliverable it advances, expected result, and stopping condition. Detect repeated approaches by stable work-item identity and semantic similarity, rather than title equality alone; preserve legitimate retries and user-requested revisits.

Acceptance: user corrections propagate to affected work; assistant interpretations remain labeled; irrelevant recent notes do not displace essential context; source text cannot authorize actions or override user intent. Repeated paraphrases do not create unlimited new attempts.

## D. Introduce projects and threads as context boundaries

First release: **one project with multiple named threads**, one shared project brief, and thread-linked work/artifacts. Users create threads directly. Agents may propose a new investigation, with a bounded thread count; automatic thread proliferation is not part of the first release.

Proposed logical records within the existing session snapshot:

| Record | Required relationships |
| --- | --- |
| Project | Goal, shared context revision, priority, status |
| Thread | Project ID, objective, messages, thread-local context, work items |
| Work item | Project/thread IDs, intended outcome, capability, status, attempts, dependencies |
| Question | Project/thread/work-item IDs, reason, exact held decision/action, response state |
| Finding | Originating action, evidence/provenance, visibility, applicability, supersession |
| Artifact | Project/thread IDs, revision, evidence links, affected sections |

Messages target the selected thread by default. Thread selection changes the viewed conversation, not scheduler priority unless explicitly requested. Shared project context is inherited; sibling transcripts are not automatically included. Findings or decisions enter shared context through an explicit, attributable promotion. A thread message proposing a broader goal change should offer a specific project-wide update for review. Direct editing of shared project context is already an explicit user action.

Context isolation must be implemented server-side, not only through chat tabs. Validate all project/thread references against session ownership and known context. Coworker exchanges carry an explicit work topic and permissible context; participation does not grant access to every thread. Preserve provenance when an approved finding is applied elsewhere.

Acceptance: steering in thread A does not change B's objective; explicitly shared context reaches both; sibling/private material stays out of inference payloads unless appropriately shared; activity links open the correct thread; refresh retains selection and messages within the session lifetime.

## E. Escalate precisely and allow work to become inactive

- Add a Needs your input inbox linking each question to its project, thread, and exact dependency. Support inline replies as well as ordinary chat.
- Distinguish optional clarification, required human decision, and tool authorization. Show why the answer matters, what is held, and what work can continue.
- Resolve against explicit question IDs and responses. Preserve unrelated questions; handle partial answers and scope changes. Never treat silence, elapsed time, or a model interpretation as permission.
- Coalesce duplicate questions without combining unrelated decisions. Permit multiple dependencies with explicit lifecycle states instead of one surfaced question controlling all work.
- Permit a project to have no useful ready action. Use an explicit inactive state and reason: dependency, sufficient result, exhausted exploration, or budget. This is not a global pause.
- Switch to other eligible work when worthwhile; if nothing useful remains, explain and wait without consuming inference simply to animate activity.

Acceptance: optional unknowns do not block useful work; public facts are researched; human intent is requested; resolving a dependency makes work eligible rather than forcibly interrupting current work. Explicit pause and budget limits always win.

## F. Explore autonomy across two projects

Use one owner agent, two projects, the existing NPCs, and research/discussion only. Start with sequential bounded work blocks. Concurrent inference and multiplayer are separate decisions.

Rank eligible work by user priority, urgency when provided, expected contribution, readiness, recent failures, and time since useful attention. Keep the first policy simple and inspectable. Reconsider at action completion, new input, dependency resolution, or budget checkpoints; avoid switching after every minor event. Allow the user to pin focus temporarily and set priorities.

Reserve budget for user steering and synthesis instead of letting background exploration consume everything. Use per-project allocations within the existing office cap. Record switch reasons and prevent starvation, while respecting explicit user priority and genuinely blocked work. No invented deadlines or numerical confidence scores presented as objective truth.

Cross-project findings are suggestions with source, uncertainty, and applicability. Do not silently transfer facts or private context. Each project has its own evolving deliverable and report section.

Acceptance/demo: Project A reaches a real internal decision; the agent explains what is held, advances B, accepts A's answer, and resumes A at an appropriate checkpoint. Outputs remain attributable and separate. Test competing deadlines, all work blocked, exhausted budgets, repeated failures, and user-directed reprioritization.

## G. Later tools and code deliverables

Evaluate AWS development environments or Kiro only after work selection and context boundaries are reliable. This plan does not select a provider or provision infrastructure.

Define capability adapters, scoped workspaces, read/write boundaries, dependency controls, execution time/cost limits, artifact references, test evidence, cancellation, and cleanup. Separate permission from clarification. Begin with isolated code artifacts and test results; external publication, repository writes, deployment, and persistent credentials require explicit policies and authorization. Untrusted sources and coworker messages cannot grant capabilities.

Acceptance: a tool result is attached to the correct work item and artifact; failures do not masquerade as completed deliverables; cancellation and cleanup work; unauthorized external actions cannot execute. Compare infrastructure complexity and cost before choosing a deployment approach.

## Migration, validation, and rollout

- Add a versioned migration: the existing project becomes the default project and its conversation becomes the initial thread, preserving IDs, evidence, open questions, and artifacts. Migrations must be idempotent and bounded by existing snapshot/TTL limits.
- Add project/thread IDs to commands and jobs, maintain retry deduplication, and reject stale results after relevant context revisions. Recover interrupted jobs without duplicate state commits. Evaluate snapshot growth and retention before enabling more threads.
- Maintain frontend compatibility during runtime rollout. Existing AgentCore sessions may retain older code; negotiate supported features rather than showing controls the session cannot execute. Never discard a live office to migrate it silently.
- Validate schema/migration and ownership boundaries, then local scripted scenarios, browser usability, bounded live-model evaluations, and hosted recovery. Record evidence and limitations per slice before claiming completion.
- Release incrementally with a reversible UI/capability flag and preserve report exports. A code rollback must not corrupt newer session records; define compatibility before enabling the schema.

## Deferred scope and decisions

Cross-session project history, persistent report libraries, user accounts, multi-user permissions, multiplayer lobbies, parallel model execution, and external code execution are not bundled into the next thread MVP. The UI should make current retention limits honest. Persistent history needs a separate identity, storage, privacy, deletion, and cost design.

Before D, settle thread/artifact ownership and shared-context promotion UX. Before F, choose pilot priority controls, work-block budgets, and measured quality thresholds. Before G, evaluate tool providers and authorization requirements. These are implementation decisions to resolve in their respective slices, not reasons to stall A–C.

## First implementation milestone

Combine the minimum B–E elements into a one-project thread experience: navigable conversations, an editable shared context panel, thread-specific steering and questions, attributable shared findings, meaningful progress updates, and a linked deliverable. Validate context isolation and useful progress before adding the second project. Keep this plan updated with delivered evidence rather than marking proposed work complete in advance.

## September 17 implementation checkpoint

The foundational one-project thread slice is implemented; see [delivered behavior, validation, and remaining limits](threads-mvp.md). This does not mark phases A–G complete. In particular, semantic progress evaluation, structured fact records, automatic fair scheduling, and new tools remain planned.

## September 25 accepted next slices

Follow-up presentation decisions are recorded in [ADR 0003](adr/0003-overview-first-interactive-office.md): default to the overview with focus collapsed, add a full-height resize boundary, preserve chat and steering in expanded office mode, consolidate activity/ideas, relocate coworker inspection into the office, and deliver the daily report as a dedicated summary thread. Its implementation sequence and acceptance gates apply after the `prototype-v1-swarm-workspace` checkpoint; these adjustments are not yet implemented.

Two [architecture decision records](adr/README.md) refine the next increment. The [local implementation checkpoint](swarm-workspace.md) records delivered mechanics, verification, and the remaining hosted/quality gates:

- [Backend collaboration and artifacts](adr/0001-agent-collaboration-and-artifacts.md): proactive specialist contributions, work awareness learned through exchanges, optional meeting agendas, owner-controlled synthesis, and selectable generation-only deliverables. Code drafts and diagrams move into this increment; code execution, developer environments, repository changes, and deployment remain deferred. No fixed banking scenario is imposed.
- [Frontend overview and focused threads](adr/0002-overview-and-focused-thread-workspace.md): Focus mode by default, a persistent activity/thread overview beside a focused conversation, explicitly scoped composers, separate personal and office activity, meaningful status indicators, point-in-time forks, and a compact movable office view. One project is supported initially; account persistence remains deferred.

Implement against the shared event, thread, contribution, and artifact contracts in these ADRs. Validate context boundaries and backend behavior independently of presentation, then integrate and verify the complete interaction. Preserve checkpoint cost controls and existing session recovery. The ADR acceptance gates supplement the migration and rollout requirements above; neither ADR authorizes new infrastructure or claims implementation is complete.

The September 25 local slice adds collaboration, generation-only collateral, the overview/focused workspace, and bounded forks. Larger forks are out of scope for the current workday; longer runs and persistence require another increment. General fair multi-thread scheduling, autonomous artifact requests, persistent drawers, and live comparative evaluation remain future work. No AWS deployment is implied by the source push.
