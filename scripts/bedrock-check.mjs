import {STSClient,GetCallerIdentityCommand} from '@aws-sdk/client-sts';
import {BedrockClient,ListFoundationModelsCommand,ListInferenceProfilesCommand} from '@aws-sdk/client-bedrock';
import {BedrockRuntimeClient,ConverseCommand} from '@aws-sdk/client-bedrock-runtime';
import {pathToFileURL} from 'node:url';

export async function checkBedrock({invoke=false,list=false}={}){
  const region=process.env.AWS_REGION||process.env.AWS_DEFAULT_REGION;
  if(!region)throw new Error('Set AWS_REGION to the region you want to use.');
  const config={region,maxAttempts:1};
  let identity;
  try{identity=await new STSClient(config).send(new GetCallerIdentityCommand({}),{abortSignal:AbortSignal.timeout(15000)})}
  catch(e){if(e.name==='CredentialsProviderError')throw new Error('No AWS account credentials are available. Sign in to an AWS account profile and set AWS_PROFILE. A Builder profile is not sufficient.');throw new Error(`AWS account verification failed (${e.name}). Check your sign-in and region.`)}
  console.log(JSON.stringify({account:identity.Account,region,profile:process.env.AWS_PROFILE||'default credential chain',credentials:'verified'}));
  if(list){
    const client=new BedrockClient(config);
    const [models,profiles]=await Promise.allSettled([client.send(new ListFoundationModelsCommand({byOutputModality:'TEXT'})),client.send(new ListInferenceProfilesCommand({}))]);
    console.log(JSON.stringify({models:models.status==='fulfilled'?models.value.modelSummaries.filter(m=>m.modelLifecycle?.status==='ACTIVE').map(m=>({id:m.modelId,name:m.modelName,arn:m.modelArn})):[],inferenceProfiles:profiles.status==='fulfilled'?profiles.value.inferenceProfileSummaries.map(p=>({id:p.inferenceProfileId,name:p.inferenceProfileName,arn:p.inferenceProfileArn})):[],note:'Catalog visibility does not prove invocation permission or Converse compatibility. The inference-profile list is the first page.'},null,2));
  }
  const modelId=process.env.BEDROCK_MODEL_ID;
  if(!modelId){if(list)return;throw new Error('Set BEDROCK_MODEL_ID after choosing a Converse-compatible model. Use npm run bedrock:models to inspect the account catalog.');}
  if(invoke){
    const r=await new BedrockRuntimeClient(config).send(new ConverseCommand({modelId,system:[{text:'This is a connectivity check. Reply with one short greeting.'}],messages:[{role:'user',content:[{text:'Hello.'}]}],inferenceConfig:{maxTokens:32}}),{abortSignal:AbortSignal.timeout(45000)});
    if(!r.output?.message?.content?.some(c=>c.text?.trim()))throw new Error('The model returned no text.');
    console.log(JSON.stringify({modelId,inference:'verified',inputTokens:r.usage?.inputTokens,outputTokens:r.usage?.outputTokens}));
  }else console.log(JSON.stringify({modelId,inference:'not tested; use npm run bedrock:probe for one small billable call'}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  checkBedrock({invoke:process.argv.includes('--invoke'),list:process.argv.includes('--list')}).catch(e=>{console.error(e.message);process.exitCode=1});
}
