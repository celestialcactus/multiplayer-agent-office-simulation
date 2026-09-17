import test from 'node:test';
import assert from 'node:assert/strict';
import {newOffice,applyCommand,tick,completeJob,shareContext,snapshot,report} from '../domain/office.mjs';
import {ensureThreads} from '../domain/threads.mjs';
import {applyGuidance} from '../domain/project.mjs';
import {guidance} from '../server/guidance.mjs';
import {Coordinator} from '../server/coordinator.mjs';
const profile={name:'Owner',role:'Designer',persona:'Pragmatic',interests:'ALPHA_ONLY: accessible onboarding',privateNotes:'PRIVATE_PERSONA'};
const make=()=>newOffice(profile,{now:1000});
let count=0;const cmd=(s,type,extra={})=>applyCommand(s,{type,commandId:'cmd'+(++count),...extra},1000);
function second(s){cmd(s,'createThread',{title:'Pricing',objective:'BETA_ONLY: compare pricing models'});return s.threads.at(-1);}
const result=(changed=false)=>({contextChanged:changed,reply:'A bounded next step.',needsInput:false,question:'',nextStep:'Compare public examples',brief:{summary:'Current objective',objective:'Useful comparison',constraints:[],facts:[],hypotheses:[],unknowns:[]},artifact:{proposal:'Compare',test:'Review evidence',successCriteria:'Two supported alternatives',evidenceIds:[]}});
test('legacy migration is idempotent and JSON checkpoints restore the active thread alias',()=>{
 const s=make();delete s.threads;delete s.activeThreadId;delete s.sharedContext;delete s.project.id;
 ensureThreads(s);ensureThreads(s);assert.equal(s.threads.length,1);assert.equal(s.ideas[0].threadId,'main');
 const b=second(s);cmd(s,'focusThread',{threadId:b.id});const restored=JSON.parse(JSON.stringify(s));ensureThreads(restored);
 assert.equal(restored.project,restored.threads[1]);assert.equal(snapshot(restored).threads.length,2);
});
test('thread creation does not change active work; targeted steering does not change sibling context',()=>{
 const s=make(),a=s.project,b=second(s);assert.equal(s.project,a);
 cmd(s,'message',{threadId:b.id,text:'BETA_CORRECTION: yearly pricing only'});
 assert.equal(a.inputs.length,1);assert.equal(b.inputs.length,2);assert.equal(s.project,a);
 cmd(s,'focusThread',{threadId:b.id});const context=JSON.stringify(shareContext(s,'player'));
 assert(context.includes('BETA_ONLY'));assert(context.includes('BETA_CORRECTION'));assert(!context.includes('ALPHA_ONLY'));assert(!context.includes('PRIVATE_PERSONA'));
});
test('sibling research, exchanges and ideas cannot enter active context or candidates',()=>{
 const s=make();s.project.pending=false;
 s.outputs.push({id:'alpha-note',threadId:'main',agentId:'player',scope:'shareable',text:'ALPHA_SECRET',sources:[],contributors:['player']});
 s.events.push({id:'alpha-talk',threadId:'main',turns:[{agentId:'player',text:'ALPHA_TALK'}]});
 const b=second(s);cmd(s,'focusThread',{threadId:b.id});b.pending=false;
 const context=JSON.stringify(shareContext(s,'player'));assert(!context.includes('ALPHA_'));
 s.minute=11;s.nextEncounter=100;const job=tick(s,1000);assert.equal(job,null);
});
test('explicit promotion shares attributed findings but not their source conversation',()=>{
 const s=make();s.outputs.push({id:'evidence',threadId:'main',agentId:'player',scope:'shareable',text:'Supported comparison',sources:[{id:1,title:'Source',url:'https://example.com'}],contributors:['player']});
 const b=second(s);cmd(s,'promoteFinding',{threadId:'main',outputId:'evidence'});cmd(s,'focusThread',{threadId:b.id});
 const context=shareContext(s,'player');assert.equal(context.project.sharedContext.promotions[0].authorId,'player');assert.equal(context.research.length,0);assert(!JSON.stringify(context).includes('ALPHA_ONLY'));
 cmd(s,'focusThread',{threadId:'main'});applyGuidance(s,result(true));cmd(s,'focusThread',{threadId:b.id});assert.equal(shareContext(s,'player').project.sharedContext.promotions.length,0);
});
test('context updates are revision-checked and mark all artifacts stale',()=>{
 const s=make(),b=second(s);s.project.artifact={};b.artifact={};
 cmd(s,'updateContext',{text:'Shared goal: improve comprehension',expectedRevision:1});
 assert.equal(s.sharedContext.revision,2);assert(s.threads.every(t=>t.artifact.stale));
 assert.throws(()=>cmd(s,'updateContext',{text:'stale overwrite',expectedRevision:1}),/changed/);
});
test('cross-thread IDs, hidden promotions and mismatched question replies are rejected',()=>{
 const s=make();second(s);
 assert.throws(()=>cmd(s,'message',{threadId:'other-office',text:'Hi'}),/belong/);
 assert.throws(()=>cmd(s,'message',{threadId:'main',questionId:'unrelated',text:'Yes'}),/no longer open/);
 s.outputs.push({id:'private',threadId:'main',scope:'private',agentId:'player'});
 assert.throws(()=>cmd(s,'promoteFinding',{threadId:'main',outputId:'private'}),/current finding/);
});
test('a thread correction retires only its evidence; old job results cannot cross a focus switch',()=>{
 const s=make();const job=tick(s,1000);const b=second(s);cmd(s,'focusThread',{threadId:b.id});
 completeJob(s,job,result());assert.equal(b.messages.length,0);
 s.outputs.push({id:'a',threadId:'main'},{id:'b',threadId:b.id});applyGuidance(s,result(true));
 assert(!s.outputs[0].superseded);assert(s.outputs[1].superseded);
});
test('guidance receives current-thread messages and shared context, not sibling transcript',async()=>{
 const s=make(),b=second(s);cmd(s,'focusThread',{threadId:b.id});const payloads=[];
 const inference={mode:'bedrock',think:async(system,data)=>{payloads.push(data);return JSON.stringify(system.startsWith('Choose')?{action:'Compare pricing models',kind:'research',reason:'Advance pricing decision',assumptions:[],question:'',questionKind:'none',blockedAction:'',resolvesQuestion:false}:result());}};
 await guidance(inference,s,{},async()=>{});const serialized=JSON.stringify(payloads);assert(serialized.includes('BETA_ONLY'));assert(!serialized.includes('ALPHA_ONLY'));
});
test('thread limit is bounded and snapshots expose separate deliverables',()=>{
 const s=make();for(let i=0;i<5;i++)second(s);assert.throws(()=>second(s),/six threads/);
 const view=snapshot(s);assert.equal(view.threads.length,6);assert(view.threads.every(t=>typeof t.markdown==='string'));assert(report(s).markdown.includes('Thread: Pricing'));
});
test('JSON checkpoint recovery resets the canonical active thread action',async()=>{
 const s=make();const b=second(s);cmd(s,'focusThread',{threadId:b.id});
 b.actions=[{id:'running',status:'running'}];s.job={actionId:'running'};s.busy=true;
 const coordinator=new Coordinator({startTimer:false,clock:()=>1000,inference:{mode:'demo'},repository:{load:async()=>JSON.parse(JSON.stringify(s))}});
 const recovered=await coordinator.getState(s.id);assert.equal(recovered.project,recovered.threads[1]);assert.equal(recovered.project.actions[0].status,'ready');assert.equal(recovered.job,null);
});
