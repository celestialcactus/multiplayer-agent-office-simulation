# Collaboration and focused workspace implementation

September 25, 2026. Implements the next slices defined by [ADR 0001](adr/0001-agent-collaboration-and-artifacts.md) and [ADR 0002](adr/0002-overview-and-focused-thread-workspace.md). This document distinguishes local implementation evidence from hosted deployment and model-quality claims.

## Interaction contract

The overview starts a new conversation; the focused composer replies only to its selected thread. Selecting a conversation is a local viewing action. It does not interrupt inference or command a change in work priority. Drafts, reading position, and unread indicators belong to individual threads. Personal activity and office activity are separate views of attributable events.

Input to a sibling thread queues work without cancelling the current inference. A correction to the thread currently being processed still invalidates its stale result. Work remains sequential within the existing office call budget. Explicit work-focus commands retain their deliberate interruption behavior.

Forks use captured message-boundary state rather than reconstructing history from the latest context. Their provenance identifies the parent and branch message. Legacy or evicted branch points cannot be forked. Captures are bounded globally and omitted from client snapshots; ordinary reads do not create or persist captures. Fork admission checks storage before changing the live office.

Larger forks are explicitly **out of scope for this workday**, pending longer sessions and persistence. There is no partial-copy fallback. Retention allows four exact branch points per thread, 48KB per capture and 120KB across the office. Forks preflight the complete state against 550KB, leaving headroom below the existing 700KB repository limit. Older points may be evicted. These limits do not expand the six-thread pilot cap.

## Collaboration and deliverables

Coworkers learn an objective from what is actually said in an exchange, with the originating event retained. They do not receive the owner's entire brief or later private inputs automatically. A sourced finding with relevant terms can prompt one proactive handoff after its author learns the owner's objective. This initial relevance policy is a conservative lexical heuristic, not a semantic matching model or proof of useful collaboration.

Suggestions become attributed contributions. The owner agent explicitly accepts or rejects them during synthesis, preserving the reason and original evidence references. Acceptance does not verify a claim. Meeting agendas scope discussion; due meetings and artifact requests can target a thread other than the one currently doing work.

Users can enable written briefs, architecture diagrams, and code drafts during setup or in settings, then request collateral from a thread's Deliverables tab. Requests use the existing inference budget and wait for needed context synthesis. Generated artifacts include accepted contributions and applicable evidence, remain labeled unverified, and are available in the final report and as downloads. Code is never executed or deployed. Artifact creation is user-triggered in this increment; autonomous artifact selection is not implemented.

Private role/personality preferences shape the agent's behavior alongside its current thread context. The interpreted objective is visible in Settings. Project-wide context remains explicitly editable; a first-thread objective is not silently copied into unrelated conversations.

Diagram rendering lazy-loads Mermaid with strict security and SVG labels, rejects interactive/external directives, and sanitizes the SVG. Source remains visible when rendering fails. See [Mermaid security configuration](https://mermaid.js.org/config/schema-docs/config-properties-securitylevel.html).

## Verification and rollout

The pre-change baseline passed 66 tests before implementation. Integration verification is recorded below after changes settle. Local scripted examples validate mechanics; they do not establish that multiple live agents improve output quality.

- The integrated regression suite passes 88 tests, including scoped steering/recovery, fork isolation and admission limits, contribution decisions, meeting/artifact routing, inert generation, owner report collateral, work-state indicators, and unchanged idle-checkpoint behavior.
- JavaScript syntax checks and the production build pass. Vite reports large chunks; Mermaid is lazy-loaded for diagram viewing. No production dependency audit findings were reported during installation.
- Local browser checks verify new-thread creation, retained drafts when switching, exact-message forks, session restoration after server restart, rendered diagram labels, generated code marked unexecuted/untested, and collateral in the owner-first report. At 390×844, Overview and Conversation each occupy the full width and the view switch preserves selection. The desktop viewport was restored after testing. The synthetic office reached its configured budget and displayed the end-of-run notice.
- No AWS resources or hosted runtime were changed; no live-model comparative evaluation was run.

No account persistence, human multiplayer, generated-code execution, developer sandbox, or infrastructure provisioning is included. A source push is not an AWS deployment. Existing runtime sessions must advertise supported features so the frontend does not offer commands their runtime cannot execute.

Settings/details currently use accessible modal dialogs rather than persistent resizable drawers. The overview has drag and keyboard width controls; the office thumbnail can move, resize, expand, hide, and restore. Browser-local draft/read/layout state does not write server checkpoints. General fair scheduling across all threads remains future work: pending input, meetings, and artifact requests schedule their target; viewing a thread does not reprioritize it.

Rollback source remains `prototype-v1-pre-swarm-workspace` at `0001cd8`, including the checkpoint cost correction. Follow the [rollback procedure](adr/README.md#recovery-procedure) before applying older code to newer session records.

## Remaining evaluation

Use matched user problems and equal model-call budgets to compare the owner alone against specialist collaboration. Review whether an accepted contribution changes a specific decision, adds traceable evidence, exposes a contradiction, or improves a deliverable. Count duplicate claims and extra calls as costs; do not treat more dialogue as proof of improvement. Live comparative evaluation and hosted validation must be recorded separately from deterministic tests.
