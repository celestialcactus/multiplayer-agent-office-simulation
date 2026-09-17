import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {PlayUrl:base}=JSON.parse(await readFile('.local/deployment.json'));
const {invite}=JSON.parse(await readFile('.local/deployment-secrets.json'));let cookie;
async function request(path,body,method=body?'POST':'GET'){
 const r=await fetch(base+'/api/'+path,{method,headers:{Origin:base,...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(65000)});
 if(!cookie)cookie=r.headers.get('set-cookie')?.split(';')[0];const data=await r.json();assert(r.ok,`HTTP ${r.status}: ${JSON.stringify(data)}`);return data;
}
const command=(type,extra={})=>request('session/commands',{type,commandId:crypto.randomUUID(),...extra});
async function ready(){for(let i=0;i<50;i++){const s=await request('session');assert(s.calls<20,'Hosted validation call cutoff');if(!s.busy&&!s.threads.some(t=>t.pending))return s;await new Promise(r=>setTimeout(r,2000));}throw Error('Guidance timed out');}
try{
 let s=await request('sessions',{invite,name:'Thread validation',role:'Product designer',persona:'Evidence focused and pragmatic',interests:'ALPHA_MARKER: compare keyboard accessibility patterns for customer onboarding. Do not discuss pricing.'});
 assert(s.capabilities.includes('threads-v1'));await command('pause');s=await ready();const a=s.threads[0],aMessages=a.messages.length;
 await command('createThread',{title:'Pricing investigation',objective:'BETA_MARKER: compare monthly versus annual subscription pricing. This is a separate investigation; do not assume onboarding requirements.'});s=await ready();const b=s.threads.find(t=>t.id!==a.id);assert(b.artifact);assert(!JSON.stringify(b).includes('ALPHA_MARKER'));assert.equal(s.threads[0].messages.length,aMessages);
 await command('message',{threadId:b.id,text:'Limit this pricing comparison to public examples of monthly plans. Do not change other conversations.'});s=await ready();assert.equal(s.threads[0].inputs.length,1);assert.equal(s.threads[0].messages.length,aMessages);assert.equal(s.threads.find(t=>t.id===b.id).inputs.length,2);
 await command('updateContext',{text:'Shared project constraint: evaluate public examples only; no external contact is authorized.',expectedRevision:s.sharedContext.revision});
 s=await command('focusThread',{threadId:a.id});assert.equal(s.activeThreadId,a.id);assert.equal(s.sharedContext.revision,2);assert(s.threads.every(t=>t.artifact.stale));assert.equal(s.status,'paused');
 const restored=await request('session');assert.equal(restored.threads.length,2);assert.equal(restored.activeThreadId,a.id);assert(restored.threads.every(t=>t.markdown));
 await command('finish');const report=await request('session/report');assert(report.markdown.includes('Thread: Pricing investigation'));assert(report.markdown.includes('Thread: Starting exploration'));
 const result={passed:true,verifiedAt:new Date().toISOString(),calls:s.calls,checks:['thread capability advertised','separate live briefs','targeted steering preserves sibling messages and inputs','shared context revision and stale artifacts','explicit focus','manual pause','read restores thread state','report includes both deliverables']};await writeFile('.local/threads-smoke-result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{if(cookie){await request('session',undefined,'DELETE');console.log('Synthetic thread-validation office deleted.');}}
