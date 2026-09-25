# Agent Office

A playable voxel office where a user-configured agent works alongside four specialist NPCs, exchanges ideas, and researches priorities during a shared workday.

## Version 1

Package version: `1.0.0`. Git baseline: `prototype-v1-baseline`. See [release notes](CHANGELOG.md).

## Status

The playable MVP is deployed on AWS at https://d88v6bepeim92.cloudfront.net with invite access. The hosted version uses AgentCore Runtime, live Bedrock inference, and session-scoped DynamoDB checkpoints. Local development defaults to a clearly labeled scripted demo. See [deployment evidence](docs/deployment.md) for validation and remaining limits.

## Play

With Node.js 22+, run `npm ci` and `npm run dev` from this directory, then open **http://127.0.0.1:5188**. Create an avatar, enter a role and interests, and join work. Try coffee, schedule a meeting, switch to 12×, and finish the day to download its report. Drag to rotate the voxel office; scroll to zoom.

Refreshing preserves the current workday via an HttpOnly cookie and server checkpoints. The local server binds to loopback. Context expires after eight hours; new workdays start fresh.

Run `npm test`, `npm run check`, and `npm run build` for validation. With the demo server running, `node scripts/smoke.mjs` exercises a complete workday without making model calls.

Live mode requires an AWS account credential profile, `OFFICE_MODE=bedrock`, `AWS_REGION`, and a permitted `BEDROCK_MODEL_ID`. This enables billable Converse calls, capped at 60 per day by default. Hosted research uses the AWS web index; local live mode uses Wikipedia unless WEB_SEARCH_URL is configured. See [the learning loop](docs/learning-loop.md). The application does not auto-load `.env` files. See [deployment instructions](docs/deployment.md) and [implementation evidence](docs/implementation.md).

## Start here

- [Collaboration and focused workspace](docs/swarm-workspace.md): local implementation, generation-only deliverables, bounded forks, verification, and rollout limits.

- [Architecture decision records](docs/adr/README.md): accepted backend collaboration and frontend workspace slices, plus the rollback baseline.

- [Thread-based MVP](docs/threads-mvp.md): separate conversations and deliverables, explicit shared context, targeted replies, and validation.

- [Context, interaction, and autonomy build plan](docs/context-and-autonomy-plan.md): phased usability, project/thread isolation, progress evaluation, escalation, multi-project scheduling, and future tools.

- [Action-level escalation](docs/action-escalation.md): build plan, action tracking, selective human input, and future tool boundaries.

- [Skippable animal customization](docs/onboarding.md): simpler setup, voxel wardrobe, and validation.

- [Steerable workday](docs/steerable-workday.md): next MVP slice, behavior, validation, and deployment status.

- [Connect real agent inference](docs/live-setup.md): account/model checks and a separate live launcher on port 5189.

- [Product concept and MVP scope](docs/concept.md)
- [Architecture, software contracts, AWS plan, and verification](docs/architecture.md)
- [Development boundary](AGENTS.md)
- [Shared learnings for Intelligence Swarm](../docs/agent-office-learnings.md)

## Project boundary

This directory is the independent Git repository for Agent Office, published privately at https://github.com/celestialcactus/agent-office. Open this directory as its own project when working on the office to keep task context focused.

Office code, dependencies, tests, infrastructure, and detailed design belong here. The Fireteams pipeline and `common-ground` Mind Virus application remain independent. Share documented findings across projects; do not introduce runtime dependencies on their internal modules or data.

Keep executable paths and configuration relative to this project root. The shared-learnings link above is available in the original sibling workspace; it is not a dependency of standalone clones.
