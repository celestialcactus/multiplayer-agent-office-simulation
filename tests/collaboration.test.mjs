import test from 'node:test';
import assert from 'node:assert/strict';
import {newOffice,applyCommand,completeJob,tick,shareContext,report} from '../domain/office.mjs';
import {proactiveExchange,commitArtifact} from '../domain/collaboration.mjs';
import {applyGuidance} from '../domain/project.mjs';
import {Inference} from '../server/inference.mjs';
import {guidance} from '../server/guidance.mjs';
const profile={name:'Owner',role:'Developer',persona:'Pragmatic',interests:'Customer onboarding accessibility',privateNotes:'PRIVATE-CANARY',artifactCapabilities:['research','brief','diagram','code']};
const command=(s,type,rest={})=>applyCommand(s,{commandId:crypto.randomUUID(),type,...rest});
function exchange(s,turns){const job={id:crypto.randomUUID(),threadId:s.activeThreadId,kind:'encounter',participants:['player','designer'],generation:s.generation};s.job=job;completeJob(s,job,{turns});}
test('coworker learns only the exchanged objective, not later owner input or private preferences',()=>{
 const s=newOffice(profile);exchange(s,[{agentId:'player',text:'I am studying onboarding accessibility.',sharedObjective:'Onboarding accessibility',researchIds:[]},{agentId:'designer',text:'Try keyboard navigation.',researchIds:[]}]);
 command(s,'message',{text:'PRIVATE-NEW-TASK-CANARY'});
 const context=shareContext(s,'designer');assert.equal(context.project.objective,'I am studying onboarding accessibility.');assert(!JSON.stringify(context).includes('PRIVATE-CANARY'));assert(!JSON.stringify(context).includes('PRIVATE-NEW-TASK-CANARY'));assert.equal(shareContext(s,'credit').project,null);
});
test('relevant sourced finding prompts one attributable handoff only after learning a colleague objective',()=>{
 const s=newOffice(profile);const output={id:'source',threadId:'main',agentId:'designer',text:'Onboarding accessibility benefits from keyboard review.',scope:'shareable',sources:[{id:1,title:'Example',url:'https://example.com'}]};s.outputs.push(output);
 assert.equal(proactiveExchange(s),null);
 exchange(s,[{agentId:'player',text:'Investigating onboarding.',sharedObjective:'Onboarding accessibility',researchIds:[]}]);
 const job=proactiveExchange(s);assert.equal(job.initiativeOutputId,'source');assert.deepEqual(job.participants,['designer','player']);assert.equal(proactiveExchange(s),null);
});
test('offered contributions preserve provenance, deduplicate repeated sharing, and receive explicit owner decisions',async()=>{
 const s=newOffice(profile);const turns=[{agentId:'designer',text:'Test keyboard onboarding before optimizing load time.',researchIds:[]}];exchange(s,turns);exchange(s,turns);assert.equal(s.contributions.length,1);const item=s.contributions[0];assert.equal(item.status,'offered');assert(item.originEvent);
 const result=await new Inference({mode:'demo'}).execute(s,{kind:'guidance'},async()=>{});result.contributionDecisions=[{id:item.id,status:'rejected',reason:'The current task concerns a different user journey.'}];applyGuidance(s,result);assert.equal(item.status,'rejected');assert.equal(item.decisionReason,'The current task concerns a different user journey.');
});
test('capability allowlist and meeting agenda are validated; queued artifacts execute on their own thread',()=>{
 const s=newOffice(profile);s.project.pending=false;command(s,'createThread',{title:'API',objective:'Draft a reliable API interface'});const target=s.threads.at(-1);target.pending=false;
 command(s,'generateArtifact',{threadId:target.id,kind:'code'});const job=tick(s);assert.equal(job.kind,'artifact');assert.equal(job.threadId,target.id);assert.equal(s.artifactRequests[0].status,'processing');
 completeJob(s,job,{content:'```js\nexport const draft = true;\n```'});assert.equal(s.deliverables[0].execution,'not-executed');assert.equal(s.deliverables[0].threadId,target.id);assert.equal(s.artifactRequests[0].status,'completed');assert(report(s).markdown.includes('export const draft'));
 assert.throws(()=>command(s,'setCapabilities',{artifactCapabilities:['deploy']}),/valid/);
 command(s,'meeting',{participants:['designer'],delay:0,threadId:'main',agenda:'Review accessibility tradeoffs'});assert.equal(s.meetings[0].agenda,'Review accessibility tradeoffs');assert.equal(s.meetings[0].threadId,'main');
 assert.throws(()=>command(s,'meeting',{participants:['designer'],delay:0,agenda:'x'.repeat(801)}),/agenda/);
});
test('generation has only accepted contributions and never invokes a research or execution tool',async()=>{
 const s=newOffice(profile);s.contributions=[{id:'accepted',threadId:'main',status:'accepted',text:'Use a bounded queue.'},{id:'rejected',threadId:'main',status:'rejected',text:'REJECTED-CANARY'}];let prompt;let calls=0;
 const inference=new Inference({mode:'bedrock',modelId:'mock',researcher:()=>{throw new Error('No tool may run');},client:{send:async c=>{prompt=c.input;return {output:{message:{content:[{text:'```js\n// Unexecuted draft\n```'}]}}};}}});
 const result=await inference.execute(s,{kind:'artifact',threadId:'main',artifactKind:'code'},async()=>calls++);assert.equal(calls,1);assert(!JSON.stringify(prompt).includes('REJECTED-CANARY'));assert(prompt.system[0].text.includes('NO tools'));assert(result.content.includes('Unexecuted'));
});
test('artifact retention bounds bytes and versions continue after trimming',()=>{
 const s=newOffice(profile);for(let i=0;i<12;i++){const request={id:String(i),threadId:'main',kind:'code',status:'processing'};s.artifactRequests.push(request);commitArtifact(s,{requestId:request.id,threadId:'main',artifactKind:'code'},{content:'x'.repeat(12000)});}
 assert(s.deliverables.length<=8);assert(Buffer.byteLength(JSON.stringify(s.deliverables))<=60000);assert.equal(s.deliverables.at(-1).version,12);
});
test('owner review retries missing decisions and preserves an explicit rejection',async()=>{
 const s=newOffice(profile);exchange(s,[{agentId:'designer',text:'Assume all users prefer animation.',researchIds:[]}]);const item=s.contributions[0];
 const draft=await new Inference({mode:'demo'}).execute(s,{kind:'guidance'},async()=>{});delete draft.contributionDecisions;
 const assessment={action:'Compare accessibility evidence',kind:'research',reason:'Investigate a useful uncertainty.',question:'',questionKind:'none',blockedAction:'',resolvesQuestion:false,assumptions:[]};let calls=0;
 const result=await guidance({mode:'bedrock',think:async()=>JSON.stringify(++calls===1?assessment:calls===2?draft:{...draft,contributionDecisions:[{id:item.id,status:'rejected',reason:'Preference is unsupported; investigate instead.'}]})},s,{},async()=>{});
 assert.equal(calls,3);applyGuidance(s,result);assert.equal(item.status,'rejected');
});
test('due meetings select their thread and pending artifact generation first synthesizes new findings',()=>{
 const s=newOffice(profile);s.project.pending=false;command(s,'createThread',{title:'Meeting topic',objective:'Review accessibility'});const other=s.threads.at(-1);other.pending=false;
 command(s,'meeting',{threadId:other.id,participants:['designer'],delay:0,agenda:'Challenge the assumptions'});let job=tick(s);assert.equal(job.threadId,other.id);assert.equal(job.agenda,'Challenge the assumptions');
 completeJob(s,job,{turns:[]});s.meetings[0].status='done';other.dirty=true;command(s,'generateArtifact',{threadId:other.id,kind:'brief'});job=tick(s);assert.equal(job.kind,'guidance');assert.equal(s.artifactRequests[0].status,'queued');
});
