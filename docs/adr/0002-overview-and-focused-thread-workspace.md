# ADR 0002: Persistent overview and focused-thread workspace

- Date: September 25, 2026
- Status: Accepted; local implementation available; hosted validation pending
- Related: [ADR 0001](0001-agent-collaboration-and-artifacts.md), [build plan](../context-and-autonomy-plan.md)

## Context

The current office/sidebar layout is cluttered and makes concurrent awareness difficult. The user supplied ClickUp screenshots as interaction references: a persistent conversation overview remains visible beside an expanded thread, with independent composers. The reference is the interaction pattern, not its specific conversation content or a requirement to reproduce the product exactly.

## Decision

Subsequent review: [ADR 0003](0003-overview-first-interactive-office.md) supersedes the initial open focused pane and refines office interactivity, information placement, and daily reporting. The implementation described here remains the tagged checkpoint before that adjustment.

Use Focus mode by default, with a persistent overview beside a focused conversation. Support one real project now, with navigation designed to accommodate more later; do not show nonfunctional project creation controls.

### Workspace regions

- Narrow, collapsible left navigation: current project, a clear New thread action, thread titles/statuses, and expandable fork branches.
- Persistent activity overview: thread/exchange cards showing meaningful updates, participants, reply counts, and unread/work state. Provide Your agent and Office filters.
- Focused conversation: clicking a card opens that thread beside the overview, preserving its independent message history, composer, relevant context, and deliverables.
- Settings/details drawer: agent configuration, capability selections, context interpretation, collaborators, and artifacts as appropriate; keep these out of the main conversational flow.
- Office view: small movable/resizable preview in Focus mode, expandable into the main workspace and restorable. Constrain it within usable bounds, retain layout position, and provide hide/restore controls. Use a collapsible panel on narrow/mobile layouts.

Use resizable dividers/drawers, independent scroll areas, and accessible non-drag alternatives. Background updates must not replace the selected thread, scroll the reader away, or overwrite drafts. Keep the overview while expanding or switching a focused thread. On small screens, retain selection when navigating between the two views rather than forcing unusable columns.

### Composer and branching semantics

- Overview composer is explicitly labeled **Start a new thread**. Submitting creates a thread/card and opens it in the focused pane.
- Focused composer is explicitly labeled **Reply to [thread title]** and routes only to that thread.
- Preserve drafts separately when switching; starting another conversation preserves the prior one.
- A fork snapshots only the parent's thread context through the selected branch point, with provenance. It does not copy later parent messages, siblings, or unrelated office activity. Applicable project context remains separately scoped/inherited, not copied indiscriminately into the fork transcript. Artifact/evidence references must reflect what existed at the branch point.
- Selecting or reading a conversation does not command agent execution focus. New messages queue targeted work; distinguish viewing from explicit work-priority actions.

### Activity and status semantics

Your agent's stream shows its current work, findings, short reasoning summaries, questions, and deliverable changes. Office activity shows coworker work, exchanges, contribution requests, and meetings. Filter by agent/thread. A shared exchange can be referenced in both streams using one event identity; it is not duplicated knowledge or a second contribution.

An optional demo inspector exposes objectives, known information, and observed actions for debugging/demo purposes. Owner-visible inspection does not mean the owner's agent has access to all inspected information. Show concise reasoning summaries and observable activity, not raw hidden chain-of-thought.

| Indicator | Meaning |
| --- | --- |
| Spinner | Processing an actual work step |
| Queued label | Eligible/requested work waiting to execute |
| Blue dot | New update not yet read |
| Question badge | Specific human input requested |
| Checkmark | Stated task completion condition met |
| Pause/error state | Work paused or an attempt failed, with an actionable explanation |

Do not equate inference completion with task completion or a request for human input. Coworker-only updates do not mark unrelated threads unread. Office-preview updates link to the overview/relevant conversation. Opening one thread does not clear every thread's unread state. Status is conveyed with labels/accessibility text as well as color or animation.

## Alternatives considered

- One combined global chat: rejected because steering and provenance become ambiguous.
- Replacing the overview whenever a thread opens: rejected because it removes awareness of other work.
- Automatically switching to whichever agent posts: rejected because it interrupts focused reading and input.
- Equally prominent office, conversations, artifacts, and settings panels: rejected because it reproduces the current clutter. Prioritize conversation and progressively reveal detail.
- Multi-project or account persistence in this UI slice: deferred. Clearly communicate session retention limits; avoid promising saved profiles before the backend supports them.

## Parallel implementation and acceptance

Frontend and backend slices may proceed in parallel against the event/thread/artifact contract in ADR 0001. Preview fixtures must be labeled synthetic and must not imply implemented collaboration. This decision does not itself authorize provisioning new tools or infrastructure.

Acceptance: users can create a thread from the overview, reply to the selected thread, inspect another update without losing their draft, navigate a fork, identify queued versus active work, and return from expanded office mode. Confirm keyboard navigation, independent scroll/focus preservation during polling, responsive layouts, constrained dragging/resizing, and safe content rendering. Backend tests verify composer routing and fork inheritance; no live cross-thread contamination should be masked by UI-only separation. Preserve feature compatibility for older runtime sessions during staged rollout.

## Consequences

Implementation evidence is tracked in [the collaboration/workspace slice](../swarm-workspace.md). Settings/details remain modal dialogs in this increment; persistent resizable drawers are still planned. Larger forks are out of scope for the workday until longer sessions and persistence are supported; reject them clearly without copying partial context.

Requires new navigation and layout state, per-thread read markers, branch provenance, and a unified activity contract. Read/layout changes must not trigger costly session rewrites. User profile persistence and durable long-term history remain future work. Source rollback is anchored by the [pre-change baseline](README.md#pre-change-rollback-baseline); schema compatibility and AWS deployment must be assessed independently of reverting frontend files.
