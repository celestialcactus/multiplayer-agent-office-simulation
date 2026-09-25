import test from 'node:test';
import assert from 'node:assert/strict';
import {Coordinator} from '../server/coordinator.mjs';
import {MemoryRepository} from '../server/repository.mjs';
import {reportPages} from '../client/report-view.js';

test('owner report opens with generated collateral and contribution decisions without attributing them to coworkers',()=>{
 const state={agents:[{id:'player',name:'Owner',role:'Developer'},{id:'designer',name:'Designer',role:'Design'}],outputs:[],ideas:[],deliverables:[{title:'Architecture',version:1,content:'DIAGRAM_CONTENT'}],contributions:[{fromAgentId:'designer',status:'rejected',decisionReason:'Not relevant to the agreed goal.'}]};
 const pages=reportPages(state,'# Workday\n## Research outputs\nHistorical notes');
 assert(pages[0].personal);assert(pages[0].markdown.includes('DIAGRAM_CONTENT'));assert(pages[0].markdown.includes('rejected'));assert(!pages[1].markdown.includes('DIAGRAM_CONTENT'));
});

test('queued sibling steering survives checkpoint recovery without cancelling a reserved inference',async()=>{
 const repository=new MemoryRepository();
 let release,started;
 const ready=new Promise(resolve=>{started=resolve});
 const blocked=new Promise(resolve=>{release=resolve});
 const inference={mode:'demo',execute:async(s,job,reserve)=>{
  await reserve();started(job);await blocked;return {error:'Synthetic attempt failure'};
 }};
 const coordinator=new Coordinator({repository,inference,clock:()=>1000,startTimer:false});
 const id='workspace-integration-office';
 await coordinator.create({name:'Owner',role:'Designer',persona:'Practical',interests:'ALPHA: investigate keyboard onboarding'},id);
 const running=coordinator.step(id),job=await ready;
 const created=await coordinator.command(id,{type:'createThread',commandId:'new-thread',title:'Pricing',objective:'BETA: investigate annual pricing'});
 const sibling=created.threads.find(t=>t.id!==job.threadId);
 await coordinator.command(id,{type:'message',commandId:'sibling-message',threadId:sibling.id,text:'Use monthly public examples first.'});
 const stored=await repository.load(id);
 assert.equal(stored.job.id,job.id,'unrelated steering must retain the in-flight job');
 assert.equal(stored.generation,job.generation);
 assert.equal(stored.calls,1,'already reserved calls remain counted');
 assert(stored.threads.find(t=>t.id===sibling.id).pending);
 assert(!JSON.stringify(stored.threads.find(t=>t.id===job.threadId).inputs).includes('monthly'));
 release();await running;
 const restored=new Coordinator({repository,inference:{mode:'demo'},clock:()=>1000,startTimer:false});
 const view=await restored.read(id);
 assert.equal(view.calls,1);
 assert(view.threads.find(t=>t.id===sibling.id).pending);
 assert(view.threads.find(t=>t.id===sibling.id).inputs.some(i=>i.text.includes('monthly')));
 assert(!view.threads.find(t=>t.id===sibling.id).messages.some(m=>m.text.includes('could not update')));
 coordinator.close();restored.close();
});
