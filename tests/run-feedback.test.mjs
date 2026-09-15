import test from 'node:test';import assert from 'node:assert/strict';
import {newOffice,tick,completeJob,shareContext,applyCommand} from '../domain/office.mjs';
const p={name:'Test',role:'Builder',persona:'Curious',interests:'Simplify onboarding',privateNotes:'A rebel who challenges conventions, pragmatic and strategic, seeking evidence and tangible prototypes. PERSONAL-SECRET'};
test('exhaustion freezes time, emits one notice, preserves final result, and completes',()=>{
 const s=newOffice(p,{now:0,callLimit:1});const job={id:'last',kind:'encounter',participants:['player','designer'],generation:0};s.job=job;s.busy=true;s.calls=1;
 tick(s,1000);tick(s,2000);assert.equal(s.minute,0);assert.equal(s.events.filter(e=>e.kind==='Budget').length,1);assert.equal(s.status,'running');
 completeJob(s,job,{turns:[{agentId:'player',text:'Build a prototype.'}]});tick(s,3000);assert.equal(s.status,'complete');assert.equal(s.endReason,'budget');assert(s.ideas.some(i=>i.text==='Build a prototype.'));assert.throws(()=>applyCommand(s,{type:'resume',commandId:'resume'},4000),/complete/);
});
test('old exhausted sessions finish and paused exhaustion cannot resume',()=>{
 const s=newOffice(p,{now:0,callLimit:1});s.calls=1;tick(s,1000);assert.equal(s.status,'complete');
 const paused=newOffice(p,{now:0,callLimit:1});paused.calls=1;paused.status='paused';assert.throws(()=>applyCommand(paused,{type:'resume',commandId:'resume'},1000),/limit/);applyCommand(paused,{type:'finish',commandId:'finish'},1000);assert.equal(paused.status,'complete');
});
test('personal description yields behavior cues without sharing private content',()=>{
 const s=newOffice(p),c=shareContext(s,'player');assert.equal(c.workingStyle.length,4);assert(c.workingStyle.some(x=>x.includes('Challenge')));assert(c.workingStyle.some(x=>x.includes('prototype')));assert(!JSON.stringify(c).includes('PERSONAL-SECRET'));assert.equal(shareContext(s,'designer').workingStyle.length,0);
});
