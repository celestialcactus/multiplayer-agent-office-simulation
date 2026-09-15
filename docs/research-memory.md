# Research in conversational memory

Completed research now participates in each agent's encounter and meeting context. Context assembly selects up to three recent shareable outputs authored by the agent and up to three recently received research references, deduplicated by output ID (maximum six notes). Notes retain the generated text, uncertainty, author, source titles/URLs, and originating exchange. Source excerpts are not duplicated into every conversation.

Other agents do not automatically receive an author's outputs. Conversation replies select valid research output IDs when using notes. Only actual participants receive the spoken summary plus its source/provenance metadata; they do not receive the author's entire research text. Referenced notes are available to later speakers in the same meeting and retained in the recipients' idea records for subsequent exchanges. Plain-text replies remain accepted, but do not gain automatic research attribution.

Private outputs are excluded. Unresolved searches and demo plans have explicit labels. Context comes from existing saved output/idea records, so eligible previous research is picked up without a new model call. Legacy outputs are only eligible while their non-private source idea is still present. All memory is bounded and session-scoped, not a permanent archive. Model use of context is not guaranteed; preserving a source reference does not validate the generated claim.

Validation: fifteen tests passed, including author recall, participant-only delivery, source/author preservation, private-output exclusion, invalid reference rejection, and mocked live prompt assembly. No new model calls were needed for these tests.

## Runtime status

This is still a local Node.js coordinator managing five logical agents, with one inference job per office at a time. It calls Bedrock Nova Lite in us-east-1. Session checkpoints are local files. AgentCore Runtime, DynamoDB, and the hosted frontend are prepared deployment targets, not currently deployed services. No AgentCore Memory resource exists for this app.
