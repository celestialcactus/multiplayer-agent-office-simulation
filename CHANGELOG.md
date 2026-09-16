# Changelog

## Unreleased — Steerable workday

- Natural-language agent conversation with clarification, redirection, evidence questions, and output requests interpreted by inference.
- Initial brief confirmation and pauses for missing human context; conversation remains available while manually paused.
- Versioned living experiment brief, participant-scoped synthesis, task narration, and correction invalidation.
- Optional setup facts, constraints, and unknowns; updated API smoke flow and steering regression coverage.

Local validation complete; AWS deployment and live quality validation pending. The Version 1 tag remains unchanged. See [slice details](docs/steerable-workday.md).

## Version 1 — 2026-09-15

Package version `1.0.0`; Git tag `prototype-v1-baseline`.

- Playable voxel office with one player agent and four specialist coworkers.
- Agent creation, working-style cues, intent, and private personal context.
- Chance encounters, scheduled meetings, research, session memory, and attributed exchanges.
- AWS hosting: CloudFront/S3, Lambda, AgentCore Runtime, Bedrock, DynamoDB, and managed web search.
- Call-budget notifications and run completion, avatar color fixes, and rendered Markdown reports.
- Deployment scripts, architecture notes, validation evidence, and 22 regression tests.

This is the first versioned pilot baseline. Cross-user multiplayer, cross-session memory, and arbitrary development tools are deferred. Research can still contain unsupported inferences despite citation checks and a review pass. Local secrets, invites, session data, generated infrastructure bundles, and build output are excluded from Git.
