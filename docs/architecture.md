# Agent Office: playable MVP and AWS design

September 11, 2026. The original proposal below is retained as design history. Its Fargate topology and design-only phase are superseded by the current decision here. See [implementation status](implementation.md) and [deployment instructions](deployment.md) for the actual MVP.

## Current implementation decision

CloudFront → S3 frontend / Lambda API → AgentCore Runtime → Bedrock Converse and temporary DynamoDB checkpoints. One deployed runtime serves isolated sessions; each player's office session contains five logical agents with separately assembled contexts. No separate model or deployment is created for an avatar.

The local version uses the same coordinator with file checkpoints. It has a Three.js voxel office and a labeled scripted demo mode. The hosted version uses invite admission and opaque Secure/HttpOnly cookies; full Cognito accounts are deferred. The user authorized implementation and deployment. AWS resources and live inference are deployed; see the current integration evidence in deployment.md.

The client currently polls bounded snapshots. Incremental event reads and expected-version client commands below are future contracts. Command IDs are implemented for retry deduplication. DynamoDB stores transactional versioned snapshot chunks rather than individual semantic records in this first slice. Cross-session and shared human multiplayer memory remain out of scope.

## Checkpoint write policy

See the [September 22 cost correction](checkpoint-cost-fix.md). Meaningful work is checkpointed immediately; clock-only progress is saved every 30 seconds. Paused offices use small owner/version-fenced lease heartbeats, and completed offices have no timer-driven writes.

## Action-level work loop

The [action-escalation slice](action-escalation.md) adds a structured assessment before project synthesis. Its executable capability allowlist is research or coworker discussion. The domain ledger tracks ready/running/completed/deferred actions separately from blocked dependent actions and human questions. Unknowns do not exclude a project from scheduling. A user reply can resolve the dependency; source evidence alone cannot decide internal intent or grant tool permission.

## Planned next evolution

The [September 25 ADRs](adr/README.md) define the next backend collaboration/artifact slice and frontend overview/focused-thread workspace. These are accepted designs awaiting implementation; the ADR index records the pre-change rollback baseline.

The [context and autonomy build plan](context-and-autonomy-plan.md) defines proposed project/thread boundaries and work scheduling within the existing runtime. Its schema, context promotion, migration, and rollout sections are future work, not current capabilities.

## Original architecture proposal (historical)

Companion to [the game concept](concept.md).

## Confirmed scope

Build a playable voxel office reached through a browser URL. One player configures an avatar, persona, identity, and interests, then joins four NPC coworkers: designer, credit analyst, frontend developer, and backend developer. Random coffee/snack encounters, scheduled meetings, and autonomous research form the activity loop. Meetings can run on accelerated time for testing.

Preserve context throughout the current session. Cross-session memory and shared multiplayer lobby memory are deferred. Selective sharing, intellectual property, and attribution are product questions to explore, not a requirement to build a comprehensive permissions system now.

## Proposed application boundary

Create a separate office application. The existing `common-ground` application is the Mind Virus simulation and should remain an independent product. Its lessons about asynchronous inference and separate simulation clocks are relevant, but its resident state and local Ollama dependency are not a ready-made hosted office backend.

## Proposed AWS topology

Browser → HTTPS application endpoint → Application Load Balancer → ECS Fargate application service → temporary DynamoDB session records.

For the first release, the container can serve the built frontend, session API, and bounded background agent scheduler. Keep the five agents as separate contexts within the service, rather than deploying five services per player. A server-side model adapter and research adapter supply actual inference and sources. The browser receives rendered game state and owner-visible results, never provider credentials.

Fargate supports Application Load Balancers for HTTP/HTTPS services. Configure a certificate and domain for the player-facing HTTPS URL, container health checks, and task ingress only through the load balancer. [AWS service load balancing](https://docs.aws.amazon.com/AmazonECS/latest/developerguide/service-load-balancing.html).

Use ECR for the container image, Secrets Manager for provider secrets, and CloudWatch for operational logs. Keep logs to identifiers, timings, errors, and usage rather than full persona or conversation payloads. Infrastructure should be reproducible through an infrastructure-as-code stack. Region, domain, provider/model, deployment account, and initial spending limits remain deployment inputs.

Start with a small service and bounded session admission. Multiple replicas require conditional session leases before background execution: only the current lease holder may advance a session, and state commits must check its lease generation and state version. Expired leases allow another worker to recover. External inference can still be duplicated after an ambiguous failure; do not claim exactly-once model billing.

## Session lifecycle and persistence

Proposed defaults for review: one workday per session, an eight-hour hard expiry, and a short disconnect grace period before pausing autonomous work. Accelerated test days can finish sooner. Explicitly ending a day produces a downloadable report; starting another day creates fresh context.

Use an opaque, high-entropy session credential in a Secure, HttpOnly, SameSite cookie. Authorize every state read and command against that session, validate mutation origins, and rate-limit creation and expensive actions. A URL or session ID alone must not grant access. Invite-only admission is a reasonable first hosted pilot; full user accounts can follow.

Save authoritative state after each committed activity or reasoning result. Browser refresh reconnects to the same unexpired session. The server owns the clock, meeting schedule, and work progression; a browser animation frame does not trigger inference. Polling incremental events is sufficient for the first version; streaming can come later.

Suggested records, partitioned by session:

| Record | Contents |
| --- | --- |
| Session | Owner credential hash, status, simulation time, expiry, version, worker lease, inference budget |
| Agent | Avatar, persona, role, allowed tools, interests, current activity, private working summary |
| Idea | Text, origin agent, source event or source URL, contributors, priority, progress, sharing scope |
| Meeting | Participants, simulated start and duration, status, discussion summary |
| Event | Sequence, activity, participants, audience, idea references, reasoning result status |
| Research output | Findings, source links, uncertainty, contributing ideas, completion or failure status |

Keep records separate and bound their size; do not grow an entire workday transcript inside one database item. Assemble model context from the agent's configuration, current task, bounded recent history, memory summary, and ideas it has actually received. Preserve source references when summarizing.

Apply expiry checks in application reads, writes, and worker claims. DynamoDB TTL is asynchronous cleanup and can take days; it is not an immediate access-revocation or exact deletion mechanism. Ended/expired sessions must become unavailable immediately at the application boundary. [AWS TTL behavior](https://docs.aws.amazon.com/us_en/amazondynamodb/latest/developerguide/TTL.html).

This is temporary persistence for continuity within one session, not a cross-session memory feature. Define backup and log retention consistently before making deletion promises.

## Activity execution

Use explicit states: deep work, walking, encounter, meeting, break, paused, and day complete. Schedule reasoning only at meaningful boundaries. Keep movement smooth while inference runs; expose pending or failed work honestly.

An encounter exchanges a short selected concept. A meeting has a bounded number of longer turns. Deep work chooses an idea, performs source-backed research, and records findings or a failed attempt. Repeated lack of new findings can trigger a break or reprioritization. Cap requests and tool calls per activity and per day, and cancel or reject stale results after a task change or session expiry.

NPCs should have distinct seeded professional interests so cross-disciplinary connections can emerge. Clearly distinguish seeded demonstration content from live research. A playable visual demo alone does not validate autonomous knowledge exchange.

## Sharing and attribution: provisional design

Separate three concepts from the start: an agent's private working context, concepts deliberately shared with participants, and office-wide information. Do not automatically copy the owner's entire profile into every coworker's prompt. A minimal user-selected private/shareable field on supplied context provides a practical starting point while the broader philosophy stays open.

Selectivity cannot be enforced solely by asking a model to keep a secret. For a field marked private, an outbound exchange should use a separate context assembly that excludes it and any private-derived notes. Only delivered exchanges update recipient memory. Conversation text cannot expand an agent's tool permissions or sharing scope.

Attach origin-agent and source-event references to exchanged ideas; track contributors as others develop them. An end-of-day report can explain which conversations influenced which outputs. This is provenance, not an adjudication of intellectual-property ownership.

Open product questions: default sharing scope, participant-only versus office-wide meeting notes, whether owners approve individual disclosures, and how much attribution appears in the interface. Provider processing and service-operator access are separate from privacy between agents.

## Delivery gates

The current deliverable is architecture and software design. Game implementation and deployment follow later.

1. Playable local slice: avatar/persona setup, voxel office, five visible agents, activity controls, accelerated meetings, and end-of-day report.
2. Real agent loop: separately assembled contexts, bounded inference, sourced research, exchanged ideas affecting subsequent priorities, and honest failures.
3. Session reliability: refresh preserves the workday; simultaneous commands cannot double-advance it; restart recovery respects leases; ended sessions reject access; independent player sessions cannot see one another.
4. Hosted pilot: reproducible AWS stack, HTTPS endpoint, private provider secrets, admission and usage limits, expiry cleanup, health checks, and a successful browser-to-agent-to-report smoke test.

Do not call the MVP complete until a user can open the hosted URL and complete the loop. Record any remaining deployment or provider configuration blockers explicitly.

## Software components

Proposed stack: TypeScript frontend and backend, a browser 3D renderer for the voxel scene, a Node.js HTTP service, and replaceable model, research, and storage adapters. Choose exact libraries and versions during implementation. A voxel aesthetic requires block-shaped geometry and an office scene; it does not require a general voxel terrain engine.

| Component | Responsibility | Boundary |
| --- | --- | --- |
| Office client | Avatar editor, setup fields, scene, meeting controls, activity feed, report | Interpolates server state; never owns agent decisions |
| Session API | Cookie authorization, validation, admission, commands, event reads | Returns only the owner's permitted view |
| Simulation engine | Clock, movement targets, activities, scheduling, transitions | Deterministic logic; no network or model calls |
| Session coordinator | Lease ownership, command ordering, async job dispatch, result application | Sole writer for a session's simulation state |
| Context assembler | Per-agent memory selection, summaries, sharing filters | No global all-agent prompt |
| Agent executor | Typed decisions, exchanges, research planning, bounded tools | Treats conversation and retrieved text as data |
| Research adapter | Search/retrieval results with source identifiers | No development, shell, or external messaging tools in MVP |
| Session repository | Versioned state, event append, job state, expiry | In-memory adapter for tests; DynamoDB for hosted continuity |
| Report builder | Completed outputs, unresolved ideas, source and contribution trails | Derives reports from committed results |

Suggested code layout: `client/`, `server/api/`, `server/coordinator/`, `domain/`, `agents/`, `adapters/`, `infra/`, and `tests/`. Share validated command/event contracts between client and server; keep provider and AWS SDK types out of the simulation domain.

## HTTP contract

All routes below are proposed under the same HTTPS origin as the frontend. Session credentials are cookie-based, not carried in query strings. Responses use structured errors and never include raw provider error payloads.

| Route | Behavior |
| --- | --- |
| `POST /api/sessions` | Validate configuration, create player and NPC state, issue session cookie |
| `GET /api/session` | Return current authorized snapshot, version, clock, budget, and last event sequence |
| `POST /api/session/commands` | Accept a validated command with command ID and expected state version; return acceptance/status |
| `GET /api/session/events?after=<sequence>` | Return a bounded, ordered event page; request a fresh snapshot if the cursor is no longer retained |
| `GET /api/session/report` | Return completed report or explicit not-ready state |
| `DELETE /api/session` | Revoke the session, stop new work, and initiate record cleanup |
| `GET /healthz` | Minimal service health response without user data |

Commands: start day, pause, resume, set simulation speed, schedule meeting, cancel meeting, and finish day. Meetings validate participants, time range, and overlapping commitments. Finishing a day freezes new work and builds a report from committed outputs; it differs from deleting a session, which revokes access.

Duplicate command IDs return their prior outcome. Version conflicts request a refreshed snapshot. Bound request lengths, idea counts, event page sizes, active sessions, inference concurrency, and per-session budgets in configuration.

## State and async result contracts

Each inference job carries `sessionId`, `agentId`, `jobId`, `activityId`, `contextVersion`, `leaseGeneration`, `deadline`, and a bounded request budget. Save queued/running/completed/failed status separately from animation state. Typed outputs contain a decision or exchange, referenced idea IDs, and source IDs where relevant.

Before committing a result, verify that the session is active, the activity still accepts the result, the referenced sources and ideas exist, and the writer owns the current lease. A result for an abandoned activity is recorded as discarded and cannot silently change a new task. Unrelated scene movement should not invalidate reasoning; use a context/activity version separate from the overall state version.

A committed state transition and its event records must be atomic through the repository adapter. For DynamoDB, keep each transition bounded so it can use a transaction. Save events under monotonically ordered session sequences. The UI applies each sequence once and can always reconcile against a snapshot.

Model timeouts get bounded retries only where safe; an ambiguous remote completion can consume budget even when no usable result arrives. Exhausted budgets stop reasoning while preserving the office view and report access. Stalled research uses observable progress markers—new supported findings, resolved questions, or a completed output—rather than an agent's assertion that it is productive.

## Time model

Separate wall time, simulation time, and inference completion. Meetings use simulation minutes; accelerated mode compresses movement and scheduled intervals but does not promise faster model inference. At a meeting boundary, participants enter a visible waiting/discussing state while a bounded exchange completes. Prevent the same agent from performing deep work and meeting inference simultaneously.

Pausing stops simulation advancement and new job dispatch. In-flight results can be buffered and revalidated when resuming. A disconnected browser does not instantly destroy context; after the grace period the session pauses, and hard expiry still applies. A service restart reconstructs the session from committed state, recovers leases, and marks uncertain in-flight calls for bounded recovery.

## Context flow example

The owner supplies a shareable problem about onboarding friction and a private personal note. During a coffee encounter, the outbound context contains the shareable problem and permitted prior exchanges, excluding the personal note and private-derived material. The designer suggests testing the first-use journey. That delivered exchange creates an attributed idea in the player's memory. Deep work can prioritize researching onboarding patterns and link its findings back to that exchange.

The designer does not automatically receive the player's other interests or later research. A new session does not inherit any of these ideas. This example defines the intended information boundary while leaving richer user-facing disclosure controls open.

## Infrastructure implementation plan

Define a separate application stack containing the load balancer, TLS listener, ECS service/task, ECR repository, DynamoDB table with TTL, log group with bounded retention, and narrowly scoped runtime/execution roles. Reference an existing secret rather than embedding secret values in templates. Make the domain/certificate, region, model configuration, and capacity explicit parameters.

Private Fargate tasks require an outbound path for the model/research providers; choose and price that path before deployment. Static assets can later move behind a CDN without changing session contracts. Avoid adding a queue service or separate agent workers until workload measurements justify splitting the initial coordinator.

Deploy through image build → tests → infrastructure change review → stack application → health check → hosted session smoke test. This is a proposed workflow, not a deployed endpoint. Deployment sizing and spending estimates require an expected number of simultaneous sessions and the selected inference provider.

## Verification plan

- Domain tests: scheduling conflicts, clock acceleration, pause/resume, stalled-work transitions, day completion.
- Context tests: private fields and private-derived notes absent from outbound prompts; only actual recipients learn exchanged ideas; provenance survives summarization.
- Repository/coordinator tests: duplicate commands, concurrent writers, lease loss, atomic transition/event writes, stale results, expired sessions, and crash recovery.
- API tests: session isolation, cookie requirements, mutation-origin checks, limits, bounded event replay, and report readiness.
- Provider contract tests: malformed outputs, invalid references, timeout, research failures, and budget exhaustion; use fixtures for routine tests and a small configured live test for integration.
- Playability acceptance: configure an avatar, enter the office, observe a brief encounter, schedule an accelerated meeting, see exchanged ideas affect research, refresh without losing the day, and receive a report with traceable sources and contributions.

## Decisions still needed before implementation/deployment

The design assumes one private NPC office per player, same-origin hosting, temporary server-side persistence, and bounded research-only tools. Exact rendering libraries, inference provider/model, search provider, initial admission method, session expiry defaults, cloud region, domain, and concurrency/spending limits remain open. No cross-session memory, shared human multiplayer state, or IP ownership policy is implied by this design.
