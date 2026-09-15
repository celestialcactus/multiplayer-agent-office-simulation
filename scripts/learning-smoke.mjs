import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {PlayUrl:base}=JSON.parse(await readFile('.local/deployment.json'));
const {invite}=JSON.parse(await readFile('.local/deployment-secrets.json'));let cookie;
async function request(path,body,method=body?'POST':'GET'){
 const r=await fetch(base+'/api/'+path,{method,headers:{Origin:base,...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(65000)});
 const data=await r.json();if(!cookie)cookie=r.headers.get('set-cookie')?.split(';')[0];assert(r.ok,JSON.stringify(data));return data;
}
const command=(type,extra={})=>request('session/commands',{type,commandId:crypto.randomUUID(),...extra});
async function until(predicate){for(let n=0;n<90;n++){const s=await request('session');if(predicate(s))return s;if(s.calls>=24)throw new Error('Learning test reached 24-call cutoff.');if(n%10===0)console.log(`Learning test: ${s.calls} calls, ${s.outputs.length} notes`);await new Promise(r=>setTimeout(r,2000))}throw new Error('Learning test timed out.')}
try{
 await request('sessions',{invite,name:'Learning validation',role:'Product lead',persona:'Specific, evidence focused, willing to revise assumptions',interests:'Improve keyboard-only signup accessibility using W3C guidance on form labels and focus order.',intent:'Reduce keyboard-only signup abandonment while retaining identity checks. Choose a measurable first experiment.',privateNotes:'LEARNING-PRIVATE-CANARY'});
 let s=await until(s=>s.outputs.some(o=>o.sources.some(src=>src.provider==='aws-web-index')));const note=s.outputs.find(o=>o.sources.some(src=>src.provider==='aws-web-index'));
 console.log(`Sourced research produced by ${note.agentId}, with ${note.sources.length} sources.`);
 await command('meeting',{participants:[note.agentId==='player'?'designer':note.agentId],delay:0});
 s=await until(s=>s.events.some(e=>e.kind==='Meeting'&&e.turns?.length));
 const meeting=s.events.find(e=>e.kind==='Meeting'&&e.turns?.length);const reused=meeting.turns.some(t=>t.researchIds?.includes(note.id));
 await command('pause');const refreshed=await request('session');assert(refreshed.outputs.some(o=>o.id===note.id));assert(!JSON.stringify(refreshed).includes('LEARNING-PRIVATE-CANARY'));
 await command('finish');const report=await request('session/report');assert(report.markdown.includes(note.sources[0].url));
 const result={verifiedAt:new Date().toISOString(),url:base,calls:s.calls,sourcedOutputs:s.outputs.filter(o=>o.sources.length).length,researchReferencedInMeeting:reused,research:note.text,sources:note.sources.map(({title,url})=>({title,url})),meeting:meeting.turns.map(({agentId,text,researchIds})=>({agentId,text,researchIds}))};
 await writeFile('.local/learning-smoke-result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));assert(reused,'The meeting did not cite the prior research; inspect recorded output before claiming reuse.');
}finally{if(cookie){await request('session',undefined,'DELETE');console.log('Synthetic office deleted.')}}
