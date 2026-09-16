# Changelog

## Action-level escalation — 2026-09-16

- Optional information no longer parks an idea. Research and discussion continue on a concrete next action.
- Human questions carry a rationale and name only the dependent action; unrelated steering preserves unresolved questions.
- Action history tracks execution, completion, blocked dependencies, and deferred repeated attempts.
- Work-plan UI shows rationale and provisional assumptions without repeating the question in a second panel.
- Build plan, acceptance checks, and future code-tool boundaries: [action escalation](docs/action-escalation.md).

## Nonblocking steering and alternate work — 2026-09-16

- Questions no longer freeze the office clock, encounters, meetings, or research.
- Primary work awaiting human context is parked; other ideas and an independent exploration task remain available.
- Unanswered questions survive automatic synthesis; user replies steer subsequent work. Manual pause remains available.
- Replaced the global human-context gate with nonblocking question extraction; drafting retains an independent next action.
- 38 regression tests passed. Hosted validation used five model calls: primary task parked, alternate work available, clock advanced, coworker exchange completed with question still open, and manual pause worked.

## Workday waiting status � 2026-09-16

- Clock and office header explicitly show when autonomous work is waiting for human context or reviewing a reply.
- Waiting notice explains that research and coworker exchanges are on hold, and how to continue; speed controls are disabled during the hold.
- Diagnosed the hosted run at 09:02 with one model call as a human-context gate, not an avatar regression.

## Restore original animal style � 2026-09-16

- Restored original box-built heads, ears, faces, and standing tails pending a new art reference.
- Kept seated poses and chair clearance, with seated tails rebuilt from boxes to match.

## Faceted coworkers and chair clearance � 2026-09-16

- Flat-shaded low-poly animal heads, tapered fox/cat ears, faceted muzzles and segmented tails.
- Seated legs and side-curled tails at desks and meetings; meeting participants face the table.
- Open chair backs leave clearance for tails. Geometry regression checks cover all six animals against seats, backs, and supports.
- Local browser visual check and production build passed; frontend-only AWS update, with no inference changes.

## Animal customization and lighter onboarding — 2026-09-16

- Optional, skippable animal, wardrobe, and personality segments with one final project prompt.
- Fox, rabbit, cat, dog, otter, and frog voxel avatars; four outfits, three hats plus no hat, and outfit colors.
- Draggable avatar preview and session-persisted appearance; animal choice is cosmetic.
- Removed setup facts/constraints/questions and forced initial confirmation. Agents gather needed context during work.
- 36 regression tests and local browser/workday checks pass. See [onboarding details](docs/onboarding.md).

## Unreleased — Steerable workday

- Natural-language agent conversation with clarification, redirection, evidence questions, and output requests interpreted by inference.
- Initial brief confirmation and pauses for missing human context; conversation remains available while manually paused.
- Versioned living experiment brief, participant-scoped synthesis, task narration, and correction invalidation.
- Optional setup facts, constraints, and unknowns; updated API smoke flow and steering regression coverage.

Deployed September 16, 2026. All 32 regression tests pass; hosted steering smoke passed with four Bedrock calls. Conversation quality limitations are recorded in [slice details](docs/steerable-workday.md). Optional temporary AWS builds avoid reliance on local Docker Desktop. The Version 1 tag remains unchanged.

## Version 1 — 2026-09-15

Package version `1.0.0`; Git tag `prototype-v1-baseline`.

- Playable voxel office with one player agent and four specialist coworkers.
- Agent creation, working-style cues, intent, and private personal context.
- Chance encounters, scheduled meetings, research, session memory, and attributed exchanges.
- AWS hosting: CloudFront/S3, Lambda, AgentCore Runtime, Bedrock, DynamoDB, and managed web search.
- Call-budget notifications and run completion, avatar color fixes, and rendered Markdown reports.
- Deployment scripts, architecture notes, validation evidence, and 22 regression tests.

This is the first versioned pilot baseline. Cross-user multiplayer, cross-session memory, and arbitrary development tools are deferred. Research can still contain unsupported inferences despite citation checks and a review pass. Local secrets, invites, session data, generated infrastructure bundles, and build output are excluded from Git.
