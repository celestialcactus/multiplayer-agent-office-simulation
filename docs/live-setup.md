# Connect real agent inference

The office already has a Bedrock Converse adapter. This workflow connects it locally before deploying the AgentCore infrastructure. It creates no AWS infrastructure.

## 1. Authenticate to an AWS account

Use your AWS account's approved sign-in method. For IAM Identity Center, configure an SSO profile and sign in. AWS CLI also supports browser-based `aws login` for supported account identities. A Builder profile alone is not an account credential profile. Do not put access keys in source files or chat.

Official instructions: [AWS CLI authentication](https://docs.aws.amazon.com/en_en/cli/latest/userguide/cli-chap-authentication.html), [browser-based local development login](https://docs.aws.amazon.com/en_en/cli/latest/userguide/cli-configure-sign-in.html).

## 2. Select the account, region, and model

```powershell
$env:AWS_PROFILE = 'your-authenticated-profile'
$env:AWS_REGION = 'your-region'
npm run bedrock:models
$env:BEDROCK_MODEL_ID = 'your-converse-compatible-model-or-inference-profile-id'
npm run bedrock:check
```

The check verifies account credentials using STS. Listing models is not proof of model invocation access or Converse compatibility. Some third-party models require Marketplace permissions or provider-specific prerequisites. [Bedrock model access](https://docs.aws.amazon.com/bedrock/latest/userguide/model-access.html).

## 3. Verify one real call

```powershell
npm run bedrock:probe
```

This makes one small billable Converse request and prints token usage if available. It sends only a generic greeting, not any saved agent context.

## 4. Start the live office

```powershell
npm run live
```

Default live URL: **http://127.0.0.1:5189**. Demo remains on port 5188. The live launcher checks credentials and model configuration before starting; it does not silently fall back to demo. Live checkpoints use `.local/sessions-bedrock/`, separate from scripted sessions. Browser cookies are shared across localhost ports, so switching between demo/live may require creating a fresh office; no demo context is loaded into live sessions.

Create a fresh agent with a non-sensitive research problem. Joining a workday enables billable inference, with the existing 60-call workday cap. The runtime sends separate contexts for each coworker. Research uses private notes only in a priority-selection call, then passes a validated shareable idea to search and synthesis. Encounters and meetings receive no private notes.

For the first validation, observe one encounter, schedule a meeting, inspect whether subsequent research uses the exchanged idea, and review the sources in the report. Model claims still require review. Hosting the coordinator in AgentCore is the next step after this local live path works.

## Current status

Configuration checks and the live launcher are implemented. The credential check correctly reports missing account credentials on this machine. No live inference probe or AWS deployment has run.
