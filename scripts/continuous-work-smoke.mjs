import {readFile,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {PlayUrl:base}=JSON.parse(await readFile('.local/deployment.json'));
const {invite}=JSON.parse(await readFile('.local/deployment-secrets.json'));let cookie;
async function request(path,body,method=body?'POST':'GET'){
 const r=await fetch(base+'/api/'+path,{method,headers:{Origin:base,...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(65000)});
 if(!cookie)cookie=r.headers.get('set-cookie')?.split(';')[0];const data=await r.json();assert(r.ok,`HTTP ${r.status}: ${JSON.stringify(data)}`);return data;
}
const command=(type,extra={})=>request('session/commands',{type,commandId:crypto.randomUUID(),...extra});
try{
 await request('sessions',{invite,name:'Continuous work validation',role:'Product lead',persona:'Evidence focused',interests:'Compare accessible customer onboarding approaches without assuming internal customer facts.'});
 await command('pause');await command('message',{text:'Our launch owner has not chosen a customer segment. Ask me which segment before selecting participants; keep that decision unresolved. Meanwhile compare public accessibility approaches and exchange ideas with coworkers without choosing our segment.'});
 let s;for(let i=0;i<45;i++){s=await request('session');if(!s.project.pending)break;await new Promise(r=>setTimeout(r,2000));}
 assert(!s.project.pending);assert(s.project.waiting,'Expected an unresolved human question: '+JSON.stringify({question:s.project.question,reply:s.project.messages.at(-1)?.text,nextStep:s.project.nextStep}));assert(s.project.actions.some(a=>a.status==='blocked'));assert(s.project.actions.some(a=>a.status==='ready'));assert(!s.ideas.some(i=>i.status==='awaiting context'));const minute=s.minute;const calls=s.calls;
 await command('speed',{speed:12});await command('resume');await command('coffee');
 for(let i=0;i<60;i++){s=await request('session');assert(s.calls<20,'Live validation budget cutoff');if(s.events.some(e=>e.kind==='Encounter'))break;await new Promise(r=>setTimeout(r,2000));}
 assert(s.minute>minute,'Clock should advance');assert(s.calls>calls,'Inference should continue');assert(s.events.some(e=>e.kind==='Encounter'),'Expected a completed coworker exchange');assert(s.project.waiting,'Human question must remain open');
 await command('pause');const paused=await request('session');await new Promise(r=>setTimeout(r,2500));assert.equal((await request('session')).minute,paused.minute);
 const result={passed:true,verifiedAt:new Date().toISOString(),calls:s.calls,minute:s.minute,checks:['only dependent action blocked','same-idea action available','clock advances','live coworker exchange completes','question remains open','manual pause works']};await writeFile('.local/continuous-work-smoke-result.json',JSON.stringify(result,null,2));console.log(JSON.stringify(result));
}finally{if(cookie){await request('session',undefined,'DELETE');console.log('Synthetic validation office deleted.');}}
