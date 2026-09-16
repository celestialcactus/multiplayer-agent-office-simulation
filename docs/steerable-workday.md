# Steerable workday

Implemented September 15 and deployed September 16, 2026 at https://d88v6bepeim92.cloudfront.net. The application topology is unchanged. A temporary ARM CodeBuild job built the runtime because local Docker Desktop was failing; the build stack and source archive were removed afterward.

## Interaction

Update September 16: [lighter onboarding](onboarding.md) replaces mandatory initial confirmation with conditional clarification, and removes the optional facts/constraints/questions setup fields. The original interaction description below records the first steering slice.

The user talks naturally in **Your agent**. There are no clarification/redirect/challenge command buttons. A budgeted Bedrock call interprets the message, revises the working brief, answers the user, and selects the next step. The initial review requests confirmation. Missing human intent or internal organizational facts should trigger one focused question and suspend autonomous work until the user responds. Chat continues while the workday is manually paused without resuming the clock.

The setup form optionally captures constraints, known facts, and open questions. Messages and these project fields can inform coworker exchanges and public research; raw personal profile notes remain excluded. This is not a comprehensive confidential-project permissions system.

## Memory and synthesis

Every accepted user message increments the context revision and invalidates unfinished work. A model-classified correction retires prior derived research and exchange memories from active prompts, retaining them in the audit trail. Evidence questions and formatting requests preserve existing findings. Routine synthesis cannot reapply a past correction. Already dispatched inference may still incur its reserved cost even when its result is discarded.

Synthesis runs after the player's research or an exchange involving the player. It receives the player's own research and research references actually delivered through conversations, plus participant-visible exchanges. An NPC knowing the project does not grant access to that NPC's unshared research. The model distinguishes user facts, hypotheses, evidence, constraints, and unknowns in one living experiment brief. Source IDs must reference supplied notes; schema failure permits one budgeted repair attempt.

The brief has version and context-revision labels, selected evidence, experiment, test, success criteria, and next step. The last five previous drafts remain in the session checkpoint; the UI shows and downloads the current draft. Narration presents task status, next steps, and questions, rather than internal reasoning traces.

## Validation and limits

- Automated coverage includes correction invalidation, retained evidence for questions, idempotent messages, paused replies, checkpoint recovery, buffered-result invalidation, draft versions, private context boundaries, and disconnect auto-pause.
- Local HTTP smoke passed a full scripted workday, including initial confirmation, meeting, encounter, research, report, and cleanup.
- Browser inspection verified initial confirmation, a correction while paused, rendered brief, and persisted conversation.
- Hosted Bedrock steering smoke passed using four calls: initial confirmation, employee-to-customer scope correction, a human-context question, no autonomous calls or clock progression while waiting, replies while paused, supplied context reflected in the draft, an evidence challenge, and report export. The synthetic office was deleted. CloudFront serves the new frontend asset.
- A second hosted test passed invite/auth/origin checks, live meeting, one sourced research output, refresh continuity, pause, finish, report, and cleanup using 13 calls.
- Live quality remains uneven: an assistant reply asked several questions despite the one-question instruction and repeated an already stated accessibility priority. The final brief preserved the customer segment and identity-check constraint, but still needs human review for specificity and research grounding. Passing workflow checks is not evidence that the conversation is pitch-ready. Valid references do not prove a claim is supported.
- A context-changing correction conservatively retires prior derived findings; selective relevance reassessment is deferred. All guidance/synthesis uses the existing call budget. The pilot supports 39 user messages per day, eight-hour sessions, one project, and one brief. No multiplayer or cross-session memory is added.

For a workplace demo, verify this live scenario: confirm a customer-onboarding problem; redirect to accessibility; add a non-public constraint; challenge an unsupported conclusion; supply a missing human decision; request an experiment brief. Confirm that current findings survive challenges, obsolete findings leave the active brief, waiting consumes no autonomous calls, and the final draft identifies assumptions and evidence honestly.


## Updated steering semantics (September 16)

Questions are nonblocking. The scheduler parks primary project work awaiting a human decision and continues with other ideas or a bounded independent exploration. The open question persists through automatic synthesis until a user response resolves it. This supersedes the earlier global waiting gate. Research and inference jobs remain serialized per office to preserve the existing budget and state model; parallel progress means alternating useful tasks while one idea awaits input, not simultaneous model calls. Manual pause and disconnect auto-pause still apply.


## Action-level escalation supersedes blanket parking

See [the implemented build plan](action-escalation.md). Questions no longer park primary ideas. A structured assessment names the ready research/discussion action and separately identifies any specific action dependent on an answer. The ledger preserves unresolved dependencies across unrelated steering and tracks attempts/completion. This supersedes the September 16 primary-task parking behavior above.
