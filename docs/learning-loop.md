# Web search and contextual learning

Implemented September 11, 2026. AgentCore Gateway exposes the AWS-managed `web-search` connector through IAM-authenticated MCP. The existing Nova Lite conversation model remains in place. The runtime discovers the tool schema and makes one bounded search per research attempt, retrieving at most five attributed snippets. No third-party search key or separate index is provisioned. Local live mode retains the encyclopedia adapter unless `WEB_SEARCH_URL` is configured; the hosted runtime receives that URL from CloudFormation.

## Learning sequence

1. The user supplies a problem and optional desired outcome, constraints, and success criteria. The initial shareable idea preserves that intent. NPCs learn it through encounters, not through unrestricted access to the user's profile.
2. Before selecting research, an agent receives up to six research memories, its last three participated exchanges, and its known ideas. Private context can influence priority selection; only a validated idea ID crosses into search planning.
3. Search planning targets an unresolved gap or counterexample in the known problem, taking prior learning into account.
4. Synthesis produces Evidence, What changed, Implication, and Next test. It distinguishes retrieved evidence from earlier hypotheses and connects the finding to the intended outcome.
5. A separate budgeted model call reviews the draft for unsupported internal-product diagnoses, causal claims, invented metrics, and misleading citations. Source-reference validation still runs after review. This reduces a demonstrated failure mode; it is not a proof of factual correctness.
6. Saved notes enter the author's conversational memory. Later exchanges can cite them and pass attributed notes to participants. Conversation prompts ask agents to address earlier speakers and explain a concrete implication or tension rather than repeat generic suggestions. Meeting closing turns are prompted to identify agreement, uncertainty, and a next action.

Source links appear with research events, cited exchanges, shared ideas, and in the report. URLs are validated and rendered as escaped HTTP(S) links. Raw search snippets are bounded session evidence, not an accumulated external index. Empty results produce an unresolved note; retrieval failures produce an Attention event and a break, never a scripted fallback.

## Limits and evaluation

Each successful research step normally uses four model calls (triage, query, synthesis, review) and one web search. The existing 60-call office budget bounds progress; review spends some of that budget in exchange for quality. Conversation repair can add one call per failed response. Web search and gateway requests are separately billable. Memory remains bounded to the current office session.

The first live search test returned W3C sources, and a hosted meeting cited the saved research. Inspection caught an unsupported claim that the hypothetical product violated accessibility guidance; the evidence-review step was added because a source-bearing response is not necessarily grounded. `scripts/learning-smoke.mjs` records a synthetic end-to-end workday, including actual research and meeting text for review, in ignored `.local/learning-smoke-result.json`.

Next experiments: compare reviewed synthesis with the earlier prompt on the same problem set; score unsupported claims, relevance to intent, useful cross-discipline connections, repeated suggestions, and whether suggested experiments could change a decision. Consider structured belief/decision records only if bounded narrative notes lose important distinctions. Consider task-specific meeting agendas and a human correction action before adding more autonomous workers.

## Latest hosted result

At 20:23 UTC, the final hosted test passed with seven model calls, one note backed by five web-index sources, and explicit research-reference reuse in the later meeting. Refresh retained the note, the report included its source URL, and the synthetic office was deleted. The refreshed frontend returned the new intent field. Nineteen tests and syntax/build checks pass.

Qualitative review remains mixed: the note separated a proposed experiment and acknowledged unknown abandonment impact, and the meeting connected keyboard accessibility to screen-reader testing. However, even the review pass retained an unsupported statement that the hypothetical signup form previously failed W3C guidance; a speaker also attributed a new suggestion to the research note. These are known grounding/attribution limitations, not validated facts. Passing reference-ID checks proves provenance plumbing, not entailment. Prompt-only review is insufficient to guarantee claim accuracy. A useful next iteration is structured fact/hypothesis/unknown records with per-claim evidence checks, evaluated on fixed scenarios before broader rollout.

References: [AWS Web Search Tool](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/gateway-target-connector-web-search-tool.html), [Gateway IAM and connector setup](https://aws.amazon.com/blogs/machine-learning/introducing-web-search-on-amazon-bedrock-agentcore/).
