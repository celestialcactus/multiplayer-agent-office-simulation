# Interactive office and discussion follow-ups

September 25, 2026. Local implementation of ADRs 0003 and 0004; no AWS deployment in this slice.

## Delivered

- Overview opens with focused conversation collapsed. A persistent full-height divider resizes the selected conversation alongside the overview or expanded office.
- Expanded office retains the selected thread and its steering composer. Coworker inspection lives inside the office. Updates and Ideas filter the overview; thread tabs retain Conversation and Deliverables.
- At most two avatar bubbles describe actual work or recent recorded speech. Work opens its thread; speech opens that exact exchange. Older activity stays accessible in the overview. No inference is spent on indicators.
- Exchange inspection retains recorded turns, attribution, and recent discussion history. A user can queue an agenda through their agent for a later matching discussion. Queuing does not halt the day or promise another encounter.
- NPC-only agendas must first be communicated through owner-involved encounters. Discussion matching uses the work thread, sorted participants, and normalized agenda. Only actual communicated exchanges advance delivery state. Failed or unrelated work cannot consume a follow-up.
- One read-only Workday summary opens in the main conversation pane after completion, including budget completion. It assembles committed owner work first, contributions, deliverable links, questions, and unfinished work. It consumes no thread slot or model call.

## Bounds and compatibility

Discussion state expires with the existing eight-hour session. Retention is capped at 24 topics, three exchanges per topic, and 40 KB overall. Follow-ups are capped at six per topic, 20 overall, and 16 KB including metadata. Admission checks reject an oversized addition atomically. End-of-day pending agendas become unaddressed. No new infrastructure or permanent memory corpus was added.

Older snapshots render without discussions. The follow-up command is offered only with the discussions-v1 capability. Recorded fork history cannot queue agendas into its parent discussion. Existing private persona, thread scope, model budget, checkpoint cost controls, and generation-only tool boundaries remain in force.

## Evaluation

- 103 automated tests passed, including discussion routing, participant/context boundaries, checkpoint recovery, command deduplication, atomic byte limits, day-end state, deterministic summary, and exact event lookup.
- JavaScript syntax checks and Vite production build passed. The build retains large-chunk warnings from the 3D/diagram dependencies.
- Scripted local browser checks verified overview-first navigation, expanded office plus composer, exact bubble-to-exchange inspection, queue confirmation, read-only summary at 60/60 calls, independent scrolling, and a retained chat draft while resizing.
- Desktop and 390 x 844 narrow layouts were inspected. A discovered implicit grid row left unused space under expanded office mode; explicit grid placement fixed it. The narrow layout retains visible office and chat without horizontal overflow.

These tests use scripted demo inference. They do not establish live collaboration quality, semantic agenda resolution, or hosted runtime behavior. Actual touch-device interaction and comparative live-agent evaluation remain follow-up gates. A queued agenda is not a resolved question. Conversation retention is bounded, not a permanent audit archive.

## User evaluation and rollout

Test locally at port 5190: expand Office, select an exchange bubble, queue a follow-up, steer the selected thread, restore the overview, resize the divider, and inspect Workday summary after finishing. Existing completed offices remain read-only; start a fresh office to test new follow-ups.

Source branch: codex/steerable-workday. Rollback baseline: prototype-v1-swarm-workspace (0dd6349), with the prior decision checkpoint at 82e6642. Deploy and record hosted validation only after the local frontend iteration is accepted.

### Navigation follow-up

Unchanged navigation and overview markup now retain their DOM elements across polling, preserving focus and reducing interrupted clicks. Activity links distinguish Read exchange from Open work thread. Browser checks confirmed thread cards open the focused pane, navigation focus survives several poll cycles, and Read exchange opens the recorded turns. Syntax and production build checks passed.
