import test from 'node:test';import assert from 'node:assert/strict';
import {newOffice,applyCommand,tick,completeJob,shareContext,snapshot,report} from '../domain/office.mjs';
import {applyGuidance,validateGuidance} from '../domain/project.mjs';
import {guidance} from '../server/guidance.mjs';
import {Coordinator} from '../server/coordinator.mjs';import {MemoryRepository} from '../server/repository.mjs';import {Inference} from '../server/inference.mjs';
const profile={name:'Owner',role:'Product lead',persona:'Pragmatic',interests:'Employee onboarding',intent:'Improve completion',privateNotes:'PRIVATE-CANARY'};
function reply(extra={}){return {contextChanged:false,reply:'I understand the change.',needsInput:false,question:'',nextStep:'Test customer signup accessibility.',brief:{summary:'Customer onboarding',objective:'Improve completion',facts:['Customer signup is the scope.'],constraints:['Keep identity checks.'],hypotheses:['Clear labels may help.'],unknowns:[]},artifact:{proposal:'Compare a signup prototype.',test:'Observe keyboard-only completion.',successCriteria:'Agree on a completion target.',evidenceIds:[]},...extra}}
test('initial confirmation and human knowledge gaps freeze time without starting research',()=>{
 const s=newOffice(profile,{now:0});const j=tick(s,1000);assert.equal(j.kind,'guidance');completeJob(s,j,reply({needsInput:true,question:'Who is the audience?'}));const minute=s.minute;assert.equal(tick(s,10000),null);assert.equal(s.minute,minute);assert.equal(s.project.waiting,true);
 applyCommand(s,{type:'message',commandId:'m',text:'Customers, not employees.'},10001);assert.equal(tick(s,11000).kind,'guidance');
});
test('corrections invalidate in-flight results and retire stale memory on interpretation',()=>{
 const s=newOffice(profile,{now:0});s.project.pending=false;
 const old={id:'old',kind:'research',participants:['player'],generation:0};s.job=old;s.busy=true;
 s.outputs.push({id:'wrong',agentId:'player',ideaId:s.ideas[0].id,scope:'shareable',text:'Employee training improves retention.',sources:[],contributors:['player']});
 applyCommand(s,{type:'message',commandId:'m',text:'Customers, not employees. Preserve identity checks.'},1000);
 completeJob(s,old,{ideaId:s.ideas[0].id,text:'STALE RESULT',sources:[]});assert(!s.outputs.some(o=>o.text==='STALE RESULT'));
 const j=tick(s,2000);completeJob(s,j,reply({contextChanged:true}));
 const context=shareContext(s,'player');assert.equal(context.interests,'Customer onboarding');assert(!context.research.some(o=>o.outputId==='wrong'));assert(!context.ideas.some(i=>i.text==='Employee onboarding'));assert(s.outputs[0].superseded);
 assert.equal(shareContext(s,'credit').project,null);assert(!JSON.stringify(context).includes('PRIVATE-CANARY'));
});
test('evidence questions retain findings and valid provenance while unknown references fail',()=>{
 const s=newOffice(profile);s.outputs.push({id:'evidence',text:'Finding',sources:[],agentId:'player'});applyCommand(s,{type:'message',commandId:'q',text:'What evidence supports that?'});
 applyGuidance(s,reply({artifact:{proposal:'Test it',test:'Compare',successCriteria:'Agree',evidenceIds:['evidence']}}));assert(!s.outputs[0].superseded);
 assert.throws(()=>validateGuidance(JSON.stringify(reply({artifact:{proposal:'x',test:'x',successCriteria:'x',evidenceIds:['invented']}})),['evidence']),/reference/);
});
test('message retries are idempotent, oversized inputs fail, and completed sessions cannot steer',()=>{
 const s=newOffice(profile),c={type:'message',commandId:'same',text:'Focus accessibility.'};applyCommand(s,c);applyCommand(s,c);assert.equal(s.project.inputs.length,2);assert.equal(s.project.revision,2);
 assert.throws(()=>applyCommand(s,{...c,commandId:'large',text:'x'.repeat(2001)}),/2000/);applyCommand(s,{type:'finish',commandId:'finish'});assert.throws(()=>applyCommand(s,{...c,commandId:'later'}),/complete/);
});
test('paused conversation responds without unpausing and survives checkpoint reload',async()=>{
 const repo=new MemoryRepository(),c=new Coordinator({repository:repo,inference:new Inference({mode:'demo'}),startTimer:false});const id='a'.repeat(64);await c.create(profile,id);await c.command(id,{type:'pause',commandId:'pause'});await c.command(id,{type:'message',commandId:'message',text:'Customer onboarding, not employee training.'});await c.step(id);
 const s=await c.read(id);assert.equal(s.status,'paused');assert.equal(s.project.messages.at(-1).role,'assistant');assert(s.project.markdown.includes('Customer onboarding'));
 const fresh=new Coordinator({repository:repo,inference:new Inference({mode:'demo'}),startTimer:false});const loaded=await fresh.read(id);assert.equal(loaded.project.revision,2);assert.equal(loaded.project.markdown,s.project.markdown);
});
test('a correction clears buffered pre-pause work before resuming',async()=>{
 const repo=new MemoryRepository(),c=new Coordinator({repository:repo,startTimer:false}),id='b'.repeat(64);await c.create(profile,id);c.pending.set(id,{job:{generation:0},result:{text:'stale'}});
 await c.command(id,{type:'message',commandId:'new',text:'Use customer onboarding.'});assert.equal(c.pending.has(id),false);
});
test('living artifact versions remain available and final report includes the current brief',()=>{
 const s=newOffice(profile);applyGuidance(s,reply());applyGuidance(s,reply({nextStep:'Ask the user for a threshold.'}));assert.equal(s.project.artifact.version,2);assert.equal(s.project.artifactHistory.length,1);assert(snapshot(s).project.markdown.includes('Draft 2'));assert(report(s).markdown.includes('Living experiment brief'));
});
test('synthesis cannot consume unshared NPC findings or private encounters',async()=>{
 const s=newOffice(profile);s.project.knownBy.push('designer');
 s.outputs.push({id:'secret',agentId:'designer',text:'UNSHARED-CANARY',sources:[],scope:'shareable'});
 s.events.push({id:'private',turns:[{agentId:'designer',text:'UNSHARED-CANARY'},{agentId:'backend',text:'Private exchange'}]});
 let data;await guidance({mode:'bedrock',think:async(_,d)=>{data=d;return JSON.stringify(reply())}},s,{},async()=>{});
 assert(!JSON.stringify(data).includes('UNSHARED-CANARY'));
 const job={id:'npc',kind:'research',participants:['designer'],generation:0};s.job=job;s.project.dirty=false;
 completeJob(s,job,{ideaId:s.ideas.find(i=>i.knownBy.includes('designer')).id,text:'New private finding',sources:[]});assert.equal(s.project.dirty,false);
});
test('an unanswered question still permits disconnect auto-pause',()=>{
 const s=newOffice(profile,{now:0});s.project.pending=false;s.project.waiting=true;tick(s,121000);assert.equal(s.status,'paused');assert.equal(s.minute,0);
});
test('routine synthesis never reapplies an earlier correction',async()=>{
 const s=newOffice(profile);s.project.pending=false;s.project.messages.push({role:'user',text:'Customer onboarding, not employee onboarding.'});
 const r=await guidance({mode:'bedrock',think:async()=>JSON.stringify(reply({contextChanged:true}))},s,{},async()=>{});assert.equal(r.contextChanged,false);
});
test('a human-decision gate overrides a drafting response that incorrectly continues',async()=>{
 const s=newOffice(profile);applyCommand(s,{type:'message',commandId:'human',text:'Ask me which customer segment before choosing participants.'});let calls=0;
 const r=await guidance({mode:'bedrock',think:async()=>++calls===1?JSON.stringify({needsInput:true,question:'Which customer segment can we recruit?'}):JSON.stringify(reply())},s,{},async()=>{});
 assert.equal(r.needsInput,true);assert.equal(r.question,'Which customer segment can we recruit?');assert(r.reply.includes(r.question));assert.equal(calls,2);
});
