# AWS deployment

Deployed September 11, 2026 to account `028853112855`, region `us-east-1`, using the `agent-office` AWS account profile. CloudFormation stacks: `agent-office-bootstrap` and `agent-office-mvp`. A Builder profile does not supply SDK credentials.

Public pilot: https://d88v6bepeim92.cloudfront.net. The invite remains in ignored `.local/deployment-secrets.json`. Never expose the private origin secret. Bedrock model: `us.amazon.nova-lite-v1:0` (US cross-region inference).

The hosted frontend and its JS/CSS assets return HTTP 200. A direct AgentCore probe created five logical agents, saved their office through the runtime IAM role, and deleted the synthetic office. The first hosted live test produced research but hit its test cutoff after a model returned an unknown research reference in a meeting. A bounded correction attempt now preserves reference validation and counts against the inference budget. See the current hosted smoke evidence below when available.

## Services

CloudFront serves private S3 assets and forwards `/api/*` to Lambda. The gateway verifies a creation invite and expiring cookie-backed authorization records, then invokes one AgentCore session per office. The runtime calls Bedrock and stores versioned DynamoDB checkpoint chunks. The Lambda URL is publicly addressable but requires a private origin header. Mutation requests also validate the viewer origin.

The runtime uses an ARM64 image and IAM authentication for Bedrock. Model/inference-profile resource ARNs are explicit deployment inputs. The browser holds no AWS credentials. The pilot uses invitations; Cognito accounts are a later addition.

## Run only when ready to create billable resources

```powershell
$env:AWS_PROFILE = 'your-account-profile'
$env:AWS_REGION = 'us-east-1'
$env:BEDROCK_MODEL_ID = 'your-converse-model-id'
$env:MODEL_RESOURCE_ARNS = 'required-model-or-profile-arn,other-required-arn'
npm test
npm run check
node infra/deploy.mjs
```

Verify model availability first. Cross-region inference can require both the inference-profile ARN and destination foundation-model ARNs. The deployment script requires Docker and SDK credentials; it does not require the AWS CLI.

The script creates bootstrap ECR/S3 resources, builds and pushes the image, bundles Lambda, validates/applies CloudFormation, and uploads the frontend. It prints the CloudFront URL. Generated invite/origin secrets remain in ignored `.local/deployment-secrets.json`; outputs are saved in ignored `.local/deployment.json`. Keep those files securely for subsequent updates.

For gateway-only changes, set `AWS_PROFILE` and `AWS_REGION`, then run `node infra/update-gateway.mjs`. This updates the Lambda package through CloudFormation while preserving other parameters and the runtime image. `node scripts/hosted-smoke.mjs` deliberately uses live inference and deletes its synthetic office afterward.

Initial limits: ten new offices per UTC day, sixty model calls per office, account-level Lambda concurrency, eight-hour expiry, and a two-minute disconnect grace period. These are usage limits, not a dollar cap. Costs include Bedrock tokens, active AgentCore compute/memory, DynamoDB checkpoint writes, API polling, and CDN traffic.

## Acceptance after deployment

### Hosted evidence — September 11, 2026, 20:04 UTC

`node scripts/hosted-smoke.mjs` passed against the CloudFront URL after the runtime update. Verified invite rejection, five-agent creation, unauthorized access rejection, cross-origin mutation rejection, live meeting turns, research workflow output, refresh continuity, pause, finish, and report. The test reserved eight inference calls and produced one unsourced open-question note (no usable encyclopedia source); it does not establish sourced research quality. Synthetic office deletion returned HTTP 200. The report and machine-readable result are in ignored `.local/hosted-smoke-report.md` and `.local/hosted-smoke-result.json`.

Sixteen unit/contract tests, syntax checks, and the production build pass. No browser interaction or visual QA was performed in this deployment run. Runtime crash recovery, ownership conflicts, and real-time eight-hour expiry remain untested in AWS. This is an invite pilot, not a general-public production service.

Open the HTTPS URL, enter the invite, confirm Bedrock live mode, create an agent, observe an exchange, and schedule an accelerated meeting. Confirm attributed ideas affect research, inspect sources, refresh and resume the session, and test expiry/deletion and independent-session isolation. Exercise runtime recovery and conditional write conflicts in AWS.

The local smoke script refuses live mode to avoid accidental model charges. Live smoke validation must be deliberate.

## Cleanup

End active offices and confirm runtime work has stopped. Review and delete the application stack when no longer needed; empty the frontend bucket first. Remove bootstrap artifacts/images and the bootstrap stack separately. Removing the frontend alone does not stop agent compute. No automatic destructive teardown is supplied.

## References

- [AgentCore sessions](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-sessions.html)
- [HTTP container contract](https://docs.aws.amazon.com/bedrock-agentcore/latest/devguide/runtime-http-protocol-contract.html)
- [CloudFormation runtime resource](https://docs.aws.amazon.com/AWSCloudFormation/latest/TemplateReference/aws-resource-bedrockagentcore-runtime.html)
- [Bedrock Converse](https://docs.aws.amazon.com/bedrock/latest/userguide/conversation-inference.html)

Deployment compatibility: this account cannot reserve five Lambda executions while preserving its minimum unreserved capacity. The template therefore uses account-level concurrency; daily session admission and per-office model budgets remain enforced.

## Web search and learning update

The stack now includes SearchGateway, SearchTarget (AWS managed web-search connector), and a scoped SearchRole. RuntimeRole can invoke this IAM-protected gateway, and WEB_SEARCH_URL is supplied to the runtime. See [learning-loop.md](learning-loop.md) for bounded memory, synthesis, evidence review, test evidence, and remaining quality limits. Nineteen contract tests pass.
## Optional cloud image build

Set `CLOUD_BUILD=1` when running `node infra/deploy.mjs` to build the ARM64 runtime in AWS CodeBuild instead of Docker Desktop. The same AWS profile, region, model ID, and model-resource ARN settings apply. `AWS_CLI_PATH` can select the installed AWS CLI executable.

This creates a uniquely named temporary CloudFormation stack with one ARM Small build project, an IAM role, and a log group. The role can read only the uploaded source archive, write the Agent Office ECR repository, and write its own build logs. Source packaging explicitly includes only Dockerfile, package manifests, and server/domain modules. It excludes local sessions, secrets, and unrelated projects. Build execution is limited to 15 minutes with a 5-minute queue timeout. Build compute is billable.

On normal completion or handled failure, the helper removes the temporary stack and source archive. Build logs and status are saved under ignored `.local/`; the resulting image remains in ECR for deployment. If the deploy process is forcibly terminated, inspect `agent-office-build-*` stacks and CodeBuild jobs for cleanup. This is a deployment fallback, not a new continuously running application service.
