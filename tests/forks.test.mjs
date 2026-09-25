import test from 'node:test';
import assert from 'node:assert/strict';
import {newOffice,tick,completeJob,snapshot,applyCommand} from '../domain/office.mjs';
import {threadCommand,captureThreadBranch} from '../domain/threads.mjs';
const make=()=>newOffice({name:'Owner',role:'Designer',persona:'Pragmatic',interests:'Parent problem'},{now:1000});
const fork=(s,messageId)=>threadCommand(s,{type:'forkThread',parentThreadId:'main',messageId});
test('fork freezes parent messages, evidence, draft and provenance at the selected message',()=>{
 const s=make(),p=s.project;p.messages.push({id:'branch',role:'assistant',text:'Early response'});
 p.artifact={version:1,proposal:'Early draft',evidenceIds:['early']};
 s.outputs.push({id:'early',threadId:'main',text:'Early evidence',sources:[]});
 s.deliverables=[{id:'draft',threadId:'main',content:'Early code'}];
 captureThreadBranch(s);
 p.messages.push({id:'later',role:'assistant',text:'LATER_PRIVATE'});p.artifact.proposal='LATER_DRAFT';
 s.outputs[0].text='LATER_MUTATION';s.outputs.push({id:'later-note',threadId:'main',text:'LATER_EVIDENCE'});
 s.outputs.push({id:'sibling-note',threadId:'sibling',text:'SIBLING_SECRET'});
 const child=fork(s,'branch'),context=JSON.stringify(child);
 assert.equal(child.parentThreadId,'main');assert.equal(child.forkMessageId,'branch');assert.equal(child.messages.length,1);
 assert.equal(child.artifact.proposal,'Early draft');assert(!context.includes('LATER'));
 const evidence=s.outputs.filter(o=>o.threadId===child.id);assert.equal(evidence.length,1);
 assert.equal(evidence[0].text,'Early evidence');assert.notEqual(evidence[0].id,'early');assert.equal(child.artifact.evidenceIds[0],evidence[0].id);
 assert.deepEqual(evidence[0].inheritedFrom,{threadId:'main',id:'early',messageId:'branch'});
 assert.equal(s.deliverables.find(d=>d.threadId===child.id).content,'Early code');
 assert.equal(s.project,p);assert.equal(s.activeThreadId,'main');
});
test('uncaptured legacy messages are rejected and retained fork points are bounded',()=>{
 const s=make();s.project.messages.push({id:'legacy',role:'assistant',text:'Old'});
 assert.throws(()=>fork(s,'legacy'),/no longer available/);
 for(let n=0;n<6;n++){s.project.messages.push({id:'m'+n,role:'user',text:'Message '+n});captureThreadBranch(s);}
 assert.equal(s.project.branchSnapshots.length,4);assert.equal(s.project.messages.find(m=>m.id==='m0').forkAvailable,false);
 assert.equal(s.project.messages.find(m=>m.id==='m0').forkUnavailableReason,'history');
 assert.throws(()=>fork(s,'m0'),/no longer available/);assert.equal(fork(s,'m5').messages.length,7);
});
test('capturing a branch twice never replaces its historical context',()=>{
 const s=make();s.project.messages.push({id:'point',role:'assistant',text:'Before'});captureThreadBranch(s);
 s.project.brief={summary:'After'};captureThreadBranch(s);assert.equal(fork(s,'point').brief,null);
});
test('oversized branch data is not retained and unavailable points are honestly marked',()=>{
 const s=make();s.project.messages.push({id:'big',role:'assistant',text:'x'.repeat(50000)});captureThreadBranch(s);
 assert.equal(s.project.branchSnapshots.length,0);assert.equal(s.project.messages[0].forkAvailable,false);
 assert.equal(s.project.messages[0].forkUnavailableReason,'size');
 const before=JSON.stringify(s);assert.throws(()=>fork(s,'big'),/out of scope for this workday/);assert.equal(JSON.stringify(s),before);
});
test('targeted steering queues a sibling without cancelling ongoing work',()=>{
 const s=make(),job=tick(s,1000),generation=s.generation;
 threadCommand(s,{type:'createThread',title:'Sibling',objective:'Other problem'});const b=s.threads.at(-1);
 threadCommand(s,{type:'message',threadId:b.id,text:'Clarify this other problem'});
 assert.equal(s.job.id,job.id);assert.equal(s.generation,generation);assert.equal(s.project.id,'main');assert(b.pending);
});
test('retained branch data remains globally bounded across six active threads',()=>{
 const s=make();for(let n=0;n<5;n++)threadCommand(s,{type:'createThread',title:'Thread '+n,objective:'Explore '+n});
 for(const t of s.threads)for(let n=0;n<6;n++){
  t.messages.push({id:t.id+'-'+n,role:'assistant',text:'x'.repeat(7000)});captureThreadBranch(s,t.id);
 }
 const branches=s.threads.flatMap(t=>t.branchSnapshots||[]);
 assert(Buffer.byteLength(JSON.stringify(branches))<=120000);
 assert(Buffer.byteLength(JSON.stringify(s))<550000);
 for(const t of s.threads)for(const m of t.messages)assert.equal(m.forkAvailable,!!t.branchSnapshots?.some(b=>b.messageId===m.id));
});
test('oversized fork is rejected without partially modifying session state',()=>{
 const s=make();s.project.messages.push({id:'point',role:'assistant',text:'Before'});captureThreadBranch(s);
 s.largeUnrelatedState='x'.repeat(550000);const before=JSON.stringify(s);
 assert.throws(()=>fork(s,'point'),/out of scope for this workday/);assert.equal(JSON.stringify(s),before);
});
test('explicit work focus and shared context changes requeue interrupted artifact requests',()=>{
 for(const command of [{type:'focusThread',threadId:'main'},{type:'updateContext',text:'New shared context',expectedRevision:1}]){
  const s=make();s.artifactRequests=[{id:'request',status:'processing'}];s.job={id:'job',requestId:'request',threadId:'main'};s.busy=true;
  threadCommand(s,command);assert.equal(s.job,null);assert.equal(s.artifactRequests[0].status,'queued');
 }
});
test('fork command is registered and public snapshots omit historical internals',()=>{
 const s=make();s.project.messages.push({id:'point',role:'assistant',text:'Before'});captureThreadBranch(s);
 applyCommand(s,{type:'forkThread',parentThreadId:'main',messageId:'point',commandId:'fork'},1000);
 assert.equal(s.threads.length,2);const view=snapshot(s);
 assert.equal(view.project.branchSnapshots,undefined);assert(view.threads.every(t=>!t.branchSnapshots));
 assert.equal(view.threads[0].messages[0].forkAvailable,true);
});
