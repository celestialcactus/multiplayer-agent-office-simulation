# First live Bedrock validation

September 11, 2026: the `agent-office` local login profile authenticated successfully in `us-east-1`. The model `us.amazon.nova-lite-v1:0` returned a small Converse greeting (14 input / 10 output tokens reported).

A subsequent synthetic test made five actual model calls: two coworker turns, private priority selection, query generation, and source-based synthesis. The exchange created an attributed idea used by the research step. These were billable Bedrock requests. No AgentCore runtime or other application infrastructure was deployed.

The research result was not satisfactory: a retrieved VxWorks page was cited in an onboarding discussion without adequate relevance. A conservative query-to-title filter was added to exclude such unmatched pages. This filter is lexical, not semantic verification, and may miss useful sources. Broader retrieval and claim grounding remain validation work; do not equate successful inference with a useful research result.

Live preview: `http://127.0.0.1:5189`. Its coordinator and storage remain local; model inference runs in Bedrock. The demo on 5188 remains separate. The live server uses its own HMR port to avoid conflict with the demo.

To restart, set `AWS_PROFILE=agent-office`, `AWS_REGION=us-east-1`, and `BEDROCK_MODEL_ID=us.amazon.nova-lite-v1:0`, then run `npm run live`. Login credentials are temporary and may require another `aws login --profile agent-office` when they expire.
