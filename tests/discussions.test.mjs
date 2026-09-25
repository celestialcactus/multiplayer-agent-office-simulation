import test from 'node:test';
import assert from 'node:assert/strict';
import {newOffice,applyCommand,completeJob,snapshot,shareContext} from '../domain/office.mjs';
import {discussionPlan} from '../domain/discussions.mjs';
import {Inference} from '../server/inference.mjs';
import {Coordinator} from '../server/coordinator.mjs';
import {MemoryRepository} from '../server/repository.mjs';
const profile={name:'Owner',role:'Developer',persona:'Pragmatic',interests:'Accessible onboarding'};
function exchange(s,participants=['player','designer'],agenda='',communicate=true){const job={id:crypto.randomUUID(),kind:'encounter',threadId:s.activeThreadId,generation:s.generation,participants,agenda};job.discussionPlan=discussionPlan(s,job);s.job=job;completeJob(s,job,{turns:participants.map(agentId=>({agentId,text:'Investigate onboarding accessibility.',researchIds:[]})),discussionCommunication:communicate});return s.events.at(-1);}
const queue=(s,d,text='Screen-reader navigation')=>applyCommand(s,{type:'queueDiscussionFollowup',discussionId:d.id,text,commandId:crypto.randomUUID()});
test('followup queues without modifying immutable exchange or cancelling work; next matching exchange discusses it',()=>{
 const s=newOffice(profile);const e=exchange(s);const d=s.discussions[0],before=structuredClone(e);s.job={id:'existing'};queue(s,d);assert.deepEqual(e,before);assert.equal(s.job.id,'existing');assert.equal(d.followups[0].status,'queued');
 exchange(s,['player','credit']);assert.equal(d.followups[0].status,'queued');
 exchange(s,['designer','player']);assert.equal(d.followups[0].status,'discussed');assert(d.followups[0].discussedEventId);assert(snapshot(s).capabilities.includes('discussions-v1'));
});
test('NPC-only steering requires real owner handoffs to all participants before a matching reunion',()=>{
 const s=newOffice(profile);exchange(s,['designer','backend']);const d=s.discussions[0];queue(s,d,'PRIVATE-PENDING-AGENDA');assert(!JSON.stringify(shareContext(s,'designer')).includes('PRIVATE-PENDING-AGENDA'));
 exchange(s,['designer','backend']);assert.equal(d.followups[0].status,'queued');
 exchange(s,['player','designer'],'',false);assert.deepEqual(d.followups[0].deliveredTo,[]);
 exchange(s,['player','designer']);assert.deepEqual(d.followups[0].deliveredTo,['designer']);exchange(s,['designer','backend']);assert.equal(d.followups[0].status,'queued');
 exchange(s,['player','backend']);exchange(s,['backend','designer']);assert.equal(d.followups[0].status,'discussed');assert.equal(d.followups[0].deliveryEvents.length,2);
});
test('followup scope isolates thread and agenda, stale discussions reject, pending becomes unaddressed on finish',()=>{
 const s=newOffice(profile);exchange(s,['player','designer'],'Accessibility');const d=s.discussions[0];queue(s,d);
 assert.equal(discussionPlan(s,{threadId:'other',participants:d.participants,agenda:'Accessibility'}).followups.length,0);
 exchange(s,['player','designer'],'Performance');assert.equal(d.followups[0].status,'queued');
 assert.throws(()=>queue(s,{id:'not-in-session'}),/no longer available/);
 applyCommand(s,{type:'finish',commandId:crypto.randomUUID()});assert.equal(d.followups[0].status,'unaddressed');
});
test('exact exchange retention is bounded and evicted events do not get substituted',()=>{
 const s=newOffice(profile);const first=exchange(s);for(let i=0;i<110;i++)exchange(s);assert(!s.events.some(e=>e.id===first.id));assert(!s.discussions[0].exchanges.some(e=>e.id===first.id));assert.equal(s.discussions[0].exchanges.length,3);
 assert(Buffer.byteLength(JSON.stringify(s.discussions))<=40000);
});
test('owner agenda is actually articulated without new inference calls; pending is excluded from earlier NPC prompt',async()=>{
 const s=newOffice(profile);exchange(s,['designer','backend']);queue(s,s.discussions[0],'Check keyboard navigation');const job={threadId:'main',kind:'encounter',participants:['designer','player']};job.discussionPlan=discussionPlan(s,job);let calls=0;const prompts=[];
 const inf=new Inference({mode:'bedrock',modelId:'test',client:{send:async c=>{prompts.push(c.input);return {output:{message:{content:[{text:JSON.stringify({text:'Explore an example.',researchIds:[]})}]}}};}}});
 const result=await inf.execute(s,job,async()=>calls++);assert.equal(calls,2);assert(!JSON.stringify(prompts[0]).includes('Check keyboard navigation'));assert(result.turns[1].text.includes('my owner asks: Check keyboard navigation'));assert(result.discussionCommunication);
});

test('matching owner followup speaks first so coworker can respond in the same exchange',async()=>{
 const s=newOffice(profile);exchange(s,['designer','player']);queue(s,s.discussions[0],'Discuss keyboard navigation');const job={threadId:'main',kind:'encounter',participants:['designer','player']};job.discussionPlan=discussionPlan(s,job);let calls=0;const prompts=[];
 const inf=new Inference({mode:'bedrock',modelId:'test',client:{send:async c=>{prompts.push(JSON.parse(c.input.messages[0].content[0].text));return {output:{message:{content:[{text:JSON.stringify({text:'Explore an example.',researchIds:[]})}]}}};}}});
 const result=await inf.execute(s,job,async()=>calls++);assert.equal(calls,2);assert.equal(result.turns[0].agentId,'player');assert.equal(result.turns[1].agentId,'designer');assert(prompts[1].conversation[0].text.includes('Discuss keyboard navigation'));assert.deepEqual(prompts[1].discussionAgenda,[]);
});

test('enqueue checks complete serialized byte size atomically',()=>{
 const s=newOffice(profile);exchange(s);const d=s.discussions[0];d.summary='x'.repeat(39000-Buffer.byteLength(JSON.stringify(s.discussions)));const before=JSON.stringify(s.discussions);assert(Buffer.byteLength(before)<40000);
 assert.throws(()=>queue(s,d,'界'.repeat(800)),/context limit/);assert.equal(JSON.stringify(s.discussions),before);
});

test('checkpoint recovery preserves queued followups and duplicate command does not enqueue or checkpoint twice',async()=>{
 const repository=new MemoryRepository();let writes=0;const save=repository.save.bind(repository);repository.save=async s=>{writes++;await save(s)};const options={repository,startTimer:false,inference:{mode:'demo'}};
 const first=new Coordinator(options),id='discussion-recovery';await first.create(profile,id);const s=first.sessions.get(id);exchange(s);const command={type:'queueDiscussionFollowup',discussionId:s.discussions[0].id,text:'Compare examples',commandId:'followup-once'};await first.command(id,command);const before=writes;
 const recovered=new Coordinator(options);let view=await recovered.read(id);assert.equal(view.discussions[0].followups.length,1);assert.equal(view.discussions[0].followups[0].status,'queued');await recovered.command(id,command);assert.equal(writes,before);view=await recovered.read(id);assert.equal(view.discussions[0].followups.length,1);
 await recovered.command(id,{type:'finish',commandId:'finish'});const ended=new Coordinator(options);view=await ended.read(id);assert.equal(view.discussions[0].followups[0].status,'unaddressed');assert.equal(view.status,'complete');
});
