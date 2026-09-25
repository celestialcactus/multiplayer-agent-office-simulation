# Architecture decision records

These records capture accepted design decisions. Acceptance does not mean implementation or hosted validation is complete.

| ADR | Decision | Status |
| --- | --- | --- |
| [0001](0001-agent-collaboration-and-artifacts.md) | Proactive agent collaboration and generation-only deliverables | Local implementation; hosted/quality validation pending |
| [0002](0002-overview-and-focused-thread-workspace.md) | Persistent activity overview beside a focused thread | Local implementation; hosted validation pending |

See [implementation evidence and remaining limits](../swarm-workspace.md). Acceptance gates remain the rollout criteria; local implementation does not imply every gate has been demonstrated in production.

The [build plan](../context-and-autonomy-plan.md) remains the work sequence. The ADRs refine its next collaboration and presentation slices. Delivered behavior is recorded in [threads MVP](../threads-mvp.md) and [checkpoint cost fix](../checkpoint-cost-fix.md).

## Pre-change rollback baseline

- Annotated tag: `prototype-v1-pre-swarm-workspace`.
- Commit: `0001cd882825de75dc910cc5cd29a0c995c24940`.
- Branch at capture: `codex/steerable-workday`.
- Capture date: September 25, 2026; source tree clean and remote branch matched before documentation edits.
- Includes isolated threads, report pagination, and the September 22 DynamoDB checkpoint cost correction.
- Recorded validation: 66 regression tests and hosted idle-write/recovery checks; this ADR task does not rerun those checks or redeploy the application.
- Last recorded runtime build image tag: `1790119702768` in the existing `agent-office-runtime` ECR repository. This is historical deployment evidence, not a guarantee that the image will be retained indefinitely.

The earlier `prototype-v1-baseline` tag remains unchanged. Prefer this newer rollback baseline when reversing the forthcoming workspace/swarm work so the checkpoint cost fix is retained.

### Recovery procedure

1. Fetch the tag from origin and create a separate checkout or a `codex/` recovery branch at it. Preserve current work; do not force-reset or force-push shared history.
2. Review any intervening session schema changes. Preserve/export affected sessions and establish compatibility before running older code against newer checkpoints.
3. Install locked dependencies and run the baseline's tests, syntax checks, and production build.
4. If an AWS rollback is required, use the documented deployment workflow to deploy the chosen source, or a verified retained image with its matching frontend/gateway. A Git checkout alone does not change AWS.
5. Verify runtime and frontend compatibility and bounded hosted behavior. Existing AgentCore sessions can retain their prior image; hand off or retire only identified sessions with checkpoint preservation. Do not delete user state to make a rollback appear successful.

Record the recovery commit, deployed image, validation, and any session handling in deployment documentation. Git stores source/history; it does not back up live DynamoDB data, credentials, or account configuration.
