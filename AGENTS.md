# Agent Office development instructions

- Treat this directory as the Agent Office project root. Read README.md and docs/architecture.md before making architectural changes; read docs/concept.md for product intent.
- Current phase: MVP implementation, authorized by the user September 11, 2026. Use AgentCore Runtime with Bedrock inference; keep cloud deployment status and live validation explicit.
- Keep application code, dependencies, tests, configuration, and infrastructure within this directory. Do not modify the Fireteams or common-ground applications as a side effect of office development.
- Do not import sibling-project internals or read their runtime state as office context. Any future reusable library needs an explicit interface and deliberate adoption.
- Maintain session isolation and per-agent context boundaries. Cross-session memory and human multiplayer lobby memory are outside the current MVP.
- Keep provider credentials server-side. Preserve provenance for exchanged ideas and research sources.
- Share transferable findings in ../docs/agent-office-learnings.md. Distinguish proposals from tested results; exclude personal context, credentials, raw conversations, and private research material.
- Keep authoritative office design here. Parent idea notes are discovery links, not competing copies of the specification.
- Record test evidence and limitations accurately. A diagram, local visual prototype, or deployment template is not a working hosted agent system.
