import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {confirmBrief} from './confirm-brief.mjs';
const deployment=JSON.parse(await readFile('.local/deployment.json','utf8'));
const secrets=JSON.parse(await readFile('.local/deployment-secrets.json','utf8'));
const base=deployment.PlayUrl;let cookie;
async function request(path,{method='GET',body,auth=true,origin=base}={}){
 const r=await fetch(base+'/api/'+path,{method,headers:{Origin:origin,...(body?{'Content-Type':'application/json'}:{}),...(cookie&&auth?{Cookie:cookie}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(65000)});
 const raw=await r.text();let json;try{json=JSON.parse(raw)}catch{throw new Error(`Non-JSON response from ${path}: HTTP ${r.status}`)}
 return {r,json};
}
const command=(type,extra={})=>request('session/commands',{method:'POST',body:{type,commandId:crypto.randomUUID(),...extra}});
try{
 const config=await request('config');assert.equal(config.r.status,200);assert.equal(config.json.mode,'bedrock');assert.equal(config.json.inviteRequired,true);console.log('Hosted configuration is live and invite-gated.');
 const denied=await request('sessions',{method:'POST',body:{invite:'invalid'}});assert.equal(denied.r.status,403);
 const created=await request('sessions',{method:'POST',body:{name:'Hosted validation',role:'Product researcher',persona:'Curious and evidence focused',interests:'Improve user onboarding with clearer first-use instructions',privateNotes:'HOSTED-PRIVATE-CANARY',color:'#b9f47a',invite:secrets.invite}});
 cookie=created.r.headers.get('set-cookie')?.split(';')[0];assert.equal(created.r.status,201,JSON.stringify(created.json));assert(cookie);assert.equal(created.json.agents.length,5);assert(!JSON.stringify(created.json).includes('HOSTED-PRIVATE-CANARY'));console.log('AgentCore created a five-agent office.');
 assert.equal((await request('session',{auth:false})).r.status,401);
 const forged=await request('session/commands',{method:'POST',origin:'https://invalid.example',body:{type:'pause',commandId:'forged'}});assert.equal(forged.r.status,403);
 assert.equal((await command('meeting',{participants:['designer'],delay:0})).r.status,200);
 await confirmBrief(async()=>(await request('session')).json,command);
 let s;for(let i=0;i<90;i++){
  const current=await request('session');assert.equal(current.r.status,200,JSON.stringify(current.json));s=current.json;
  if(s.events.some(e=>e.kind==='Meeting'&&e.turns?.length)&&s.outputs.length)break;
  if(s.calls>=18)throw new Error('Hosted smoke reached its 18-call test cutoff.');
  if(i%10===0)console.log(`Checking office: ${s.calls} reserved calls, ${s.outputs.length} research outputs.`);
  await new Promise(r=>setTimeout(r,2000));
 }
 assert(s.events.some(e=>e.kind==='Meeting'&&e.turns?.length),'Expected completed live meeting');assert(s.outputs.length>0,'Expected research output');
 await command('pause');const paused=(await request('session')).json;await new Promise(r=>setTimeout(r,2300));const refreshed=(await request('session')).json;assert.equal(refreshed.status,'paused');assert.equal(refreshed.minute,paused.minute);
 assert.equal((await command('finish')).json.status,'complete');const report=await request('session/report');assert.equal(report.r.status,200);assert(report.json.markdown.includes('Live Bedrock'));assert(!report.json.markdown.includes('HOSTED-PRIVATE-CANARY'));await writeFile('.local/hosted-smoke-report.md',report.json.markdown);
 const evidence={url:base,verifiedAt:new Date().toISOString(),checks:['invite rejection','create office','unauthorized rejection','origin rejection','live meeting','research output','refresh continuity','pause','finish','report'],calls:s.calls,researchOutputs:s.outputs.length,sourcedOutputs:s.outputs.filter(o=>o.sources.length).length};await writeFile('.local/hosted-smoke-result.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));
}finally{
 if(cookie){const deleted=await request('session',{method:'DELETE'});console.log(`Test office cleanup: HTTP ${deleted.r.status}`)}
}
