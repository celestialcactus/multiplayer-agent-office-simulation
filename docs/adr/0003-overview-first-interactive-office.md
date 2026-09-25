# ADR 0003: Overview-first navigation and an interactive office

- Date: September 25, 2026
- Status: Accepted direction; implementation planned
- Refines: [ADR 0002](0002-overview-and-focused-thread-workspace.md)
- Current implementation checkpoint: `0dd6349`, tagged `prototype-v1-swarm-workspace`

## Context

Review of the local workspace revealed that expanding the office obscures conversation and steering. The overview divider is discoverable only near its heading, and separate Activity, Ideas, and Coworkers tabs repeat information across several surfaces. The user wants the overview to be the initial workspace, with focused conversations opened deliberately, and the daily report to appear as a conversation rather than a separate popup.

## Decisions

### Overview first, focus on demand

Start in the conversation/activity overview with the focused conversation collapsed. This supersedes ADR 0002's initial side-by-side focused conversation. Opening a conversation or submitting a new thread opens the focused pane. Provide a clear collapse/back action that returns space to the overview without discarding the selection, draft, or reading position. Background activity never opens a thread automatically.

Make the boundary between overview and focused conversation draggable along its full height, with a generous pointer target, visible hover/focus affordance, keyboard resizing, and sensible minimum widths. Resizing is presentation state, not an agent command. Narrow screens continue to use full-width view switching rather than cramped columns.

### The expanded office stays interactive

Keep the 3D environment visible alongside a conversation/steering surface and observable office exchanges. Use a docked, resizable conversation region in expanded office mode; on narrow screens use a collapsible region that retains a visible portion of the environment. Exact proportions can be tuned during implementation.

Reuse the selected thread and its composer, rather than creating another independent chat or global context. Always identify the steering destination. Switching between office and overview modes preserves drafts, history, selection, and work state. Viewing a coworker or their activity does not grant the owner's agent access to their private context and does not create direct NPC control.

Move coworker profiles and their activity inspection into the office surface, reachable from an office roster and, where practical, avatar selection. Keep workday controls accessible without forcing users to leave their conversation. In-world activity indicators are deferred.

### Consolidate repeated information

Use a single stream of updates and exchanges, with the existing personal/office scope controls. Represent emerging ideas as titled, attributable entries in that stream; expanding an entry reveals the idea, evidence, status, and related thread. Filtering for ideas is preferable to maintaining another duplicate top-level feed.

Remove the redundant per-thread Activity, Ideas, and Coworkers tabs once their content is reachable through the consolidated stream and office inspection. Keep conversation and thread-specific deliverables. Multiple views reference the same underlying event or idea; they must not duplicate evidence or silently promote knowledge into shared context.

### A dedicated workday summary thread

At the end of the workday, create one clearly labeled system-owned **Workday summary** entry in the conversation list. Selecting it displays the daily summary in the normal main conversation pane. It summarizes the owner's work first, then useful coworker contributions, completed deliverables with source-thread links, outstanding questions, and unfinished work with reasons.

Deliverables remain owned by their original threads. The summary links to them rather than relocating them or merging their inference context. Make this a read-only report entry initially, with export available and an explicit ended-workday state. It must not consume one of the six working-thread slots, start another inference loop, or accept messages that cannot be acted on after the workday ends.

Summary generation must work when the call budget is exhausted: assemble a deterministic summary from committed records, with no mandatory extra model call. Reserve optional model-written synthesis for a later explicit budget decision. Publish the entry idempotently on normal finish or budget completion, and reconstruct it for older completed sessions as a read projection without writes on every read. This replaces the report popup as the primary report experience; retain export and compatibility until the replacement is verified.

## Implementation sequence and acceptance

1. Change initial layout and full-height resizing; verify mouse, touch, keyboard, minimum widths, and preserved drafts/scroll during polling.
2. Integrate conversation and office activity into expanded office mode; verify steering targets the same selected thread and the environment remains visible.
3. Move coworker inspection and consolidate idea/activity views; verify no information or provenance is lost, and event identities remain stable across views.
4. Add the workday summary entry; verify owner-first content, source-thread deliverable links, exports, older completed-session compatibility, and no duplicate entries after refresh.
5. Validate completion at the call limit, context isolation, session recovery, responsive behavior, and unchanged idle checkpoint costs. Record local and hosted evidence separately.

## Boundaries and rollback

This record documents the next adjustment; it does not implement it or deploy to AWS. Current source remains preserved at `prototype-v1-swarm-workspace` (`0dd6349`), after the collaboration/workspace implementation and before these layout changes. The older `prototype-v1-pre-swarm-workspace` baseline remains unchanged. Follow the [rollback procedure](README.md#recovery-procedure), including schema compatibility checks, before redeploying older code.

Human multiplayer, longer workdays, persistent accounts, larger forks, generated-code execution, and in-world activity indicators remain out of scope. Summary inspection must not contaminate future thread context or trigger unbudgeted work.
