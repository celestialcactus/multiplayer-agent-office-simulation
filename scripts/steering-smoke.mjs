import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {PlayUrl:base}=JSON.parse(await readFile('.local/deployment.json'));
const {invite}=JSON.parse(await readFile('.local/deployment-secrets.json'));let cookie;
async function request(path,body,method=body?'POST':'GET'){
 const r=await fetch(base+'/api/'+path,{method,headers:{Origin:base,...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(65000)});
 if(!cookie)cookie=r.headers.get('set-cookie')?.split(';')[0];const data=await r.json();assert(r.ok,`HTTP ${r.status}: ${JSON.stringify(data)}`);return data;
}
const command=(type,extra={})=>request('session/commands',{type,commandId:crypto.randomUUID(),...extra});
async function ready(){for(let n=0;n<60;n++){const s=await request('session');if(!s.project.pending)return s;assert(s.calls<18,'Smoke test call cutoff reached.');await new Promise(r=>setTimeout(r,2000))}throw new Error('Guidance timed out.');}
try{
 await request('sessions',{invite,name:'Steering validation',role:'Product lead',persona:'Pragmatic and evidence focused',species:'otter',outfit:'polo',hat:'cap',color:'#70c6e4',interests:'Improve employee onboarding.',intent:'Develop a small prototype experiment.',privateNotes:'STEERING-PRIVATE-CANARY'});
 let s=await ready();assert(s.project.brief);assert.equal(s.agents[0].species,'otter');assert.equal(s.agents[0].outfit,'polo');assert.equal(s.agents[0].hat,'cap');console.log('Initial project review received.');
 await command('pause');
 await command('message',{text:'Correction: customer onboarding, not employee onboarding. Focus on keyboard accessibility before performance. Our internal launch owner has not decided which customer segment we can recruit. Ask me for that decision before choosing participants; do not guess or research our internal decision.'});
 s=await ready();assert(s.project.waiting,'Expected a human-context question');assert(/customer/i.test(s.project.brief.summary));assert(s.project.question);const calls=s.calls;const minute=s.minute;
 await command('resume');await new Promise(r=>setTimeout(r,6500));s=await request('session');assert(s.minute>minute,'Workday must advance with an open question');assert(s.project.waiting,'Human decision must stay unresolved');console.log('Workday advanced while the human question stayed open.');
 await command('pause');await command('message',{text:'The launch owner has chosen first-time small-business customers. We can recruit five consenting participants for a keyboard-only prototype exercise. Keep identity checks. Draft a one-page experiment brief now, label assumptions, and leave quantitative success thresholds for later human agreement. No further decision is needed to draft.'});
 s=await ready();assert.equal(s.status,'paused');assert(!s.project.waiting,'Expected draft after supplied context');assert(/small.business/i.test(JSON.stringify(s.project.brief)));assert(s.project.markdown.includes('Living experiment brief'));assert(!JSON.stringify(s).includes('STEERING-PRIVATE-CANARY'));const version=s.project.artifact.version;
 await command('message',{text:'What evidence supports the proposal? Be explicit about what has not been researched. Preserve the current problem and constraints; this is an evidence question, not a change in scope.'});
 s=await ready();assert(s.project.artifact.version>version);assert(/customer/i.test(s.project.brief.summary));
 await command('finish');const report=await request('session/report');assert(report.markdown.includes('Living experiment brief'));
 const result={verifiedAt:new Date().toISOString(),url:base,calls:s.calls,checks:['initial project review','scope correction','human-context question','clock advances with an open question','paused conversation','context supplied','living draft','evidence question','report'],brief:s.project.markdown,conversation:s.project.messages};await writeFile('.local/steering-smoke-result.json',JSON.stringify(result,null,2));console.log(JSON.stringify({passed:true,calls:s.calls,draft:s.project.artifact.version,checks:result.checks}));
}finally{if(cookie){await request('session',undefined,'DELETE');console.log('Synthetic steering office deleted.');}}
