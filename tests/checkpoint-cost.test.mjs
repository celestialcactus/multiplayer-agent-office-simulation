import test from 'node:test';
import assert from 'node:assert/strict';
import {Coordinator} from '../server/coordinator.mjs';
import {MemoryRepository,DynamoRepository} from '../server/repository.mjs';
const profile={name:'Cost test',role:'Tester',persona:'Practical',interests:'Compare public examples'};
function fixture(){
 let now=1000,writes=0,heartbeats=0;const repository=new MemoryRepository();
 const save=repository.save.bind(repository);repository.save=async s=>{writes++;await save(s)};
 repository.heartbeat=async()=>{heartbeats++};
 const coordinator=new Coordinator({repository,startTimer:false,clock:()=>now,inference:{mode:'demo',execute:async()=>{throw Error('Unexpected inference')}}});
 return {coordinator,repository,advance:()=>{now+=1000},writes:()=>writes,heartbeats:()=>heartbeats};
}
test('paused and completed offices never rewrite snapshots on idle timer ticks',async()=>{
 const f=fixture(),id='cost-regression-office';await f.coordinator.create(profile,id);
 const s=f.coordinator.sessions.get(id);s.project.pending=false;
 await f.coordinator.command(id,{type:'pause',commandId:'pause'});const pausedWrites=f.writes();
 for(let i=0;i<120;i++){f.advance();await f.coordinator.read(id);await f.coordinator.step(id)}
 assert.equal(f.writes(),pausedWrites);assert(f.heartbeats()>0);
 await f.coordinator.command(id,{type:'finish',commandId:'finish'});const finishedWrites=f.writes(),finishedHeartbeats=f.heartbeats();
 for(let i=0;i<120;i++){f.advance();await f.coordinator.read(id);await f.coordinator.step(id)}
 assert.equal(f.writes(),finishedWrites);assert.equal(f.heartbeats(),finishedHeartbeats);
});
test('clock-only running progress checkpoints at 30 seconds rather than every second',async()=>{
 const f=fixture(),id='clock-regression-office';await f.coordinator.create(profile,id);const s=f.coordinator.sessions.get(id);
 s.project.pending=false;s.nextEncounter=10000;s.lastActivity=10000;s.speed=1;const before=f.writes();
 for(let i=0;i<90;i++){f.advance();await f.coordinator.read(id);await f.coordinator.step(id)}
 assert.equal(f.writes()-before,3);assert.equal(s.minute,45);assert.equal((await f.repository.load(id)).minute,45);
});
test('duplicate commands do not create another checkpoint',async()=>{
 const f=fixture(),id='retry-regression-office';await f.coordinator.create(profile,id);
 const c={type:'pause',commandId:'same-command'};await f.coordinator.command(id,c);const before=f.writes();await f.coordinator.command(id,c);assert.equal(f.writes(),before);
});
test('disconnect pause is immediately durable even between periodic checkpoints',async()=>{
 const f=fixture(),id='disconnect-cost-office';await f.coordinator.create(profile,id);const s=f.coordinator.sessions.get(id);s.project.pending=false;s.nextEncounter=10000;s.lastActivity=10000;
 for(let i=0;i<121;i++){f.advance();await f.coordinator.step(id)}
 assert.equal(s.status,'paused');assert.equal((await f.repository.load(id)).status,'paused');
});
test('model call reservation is durable before inference and results are checkpointed',async()=>{
 const f=fixture(),id='reservation-cost-office';await f.coordinator.create(profile,id);
 f.coordinator.inference.execute=async(s,job,reserve)=>{await reserve();const stored=await f.repository.load(id);assert.equal(stored.calls,1);assert.equal(stored.job.id,job.id);return {error:'Synthetic test failure'};};
 await f.coordinator.step(id);const saved=await f.repository.load(id);assert.equal(saved.calls,1);assert.equal(saved.job,null);assert(saved.events.some(e=>e.kind==='Attention'));
});
test('Dynamo heartbeats update only fenced metadata, are throttled, and propagate ownership loss',async()=>{
 const repo=new DynamoRepository('test-table');const commands=[];repo.versions.set('session',4);repo.client={send:async c=>{commands.push(c.input)}};
 await repo.heartbeat('session');await repo.heartbeat('session');assert.equal(commands.length,1);
 assert.deepEqual(commands[0].Key,{pk:'OFFICE#session',sk:'META'});assert.equal(commands[0].UpdateExpression,'SET leaseUntil = :lease');assert(commands[0].ConditionExpression.includes('version = :version AND #owner = :owner'));assert.equal(commands[0].TransactItems,undefined);
 repo.leaseRenewed.set('session',0);repo.client.send=async()=>{throw Error('Lost ownership')};await assert.rejects(()=>repo.heartbeat('session'),/Lost ownership/);
});
test('failed heartbeat evicts the cached worker rather than continuing with stale ownership',async()=>{
 const f=fixture(),id='lease-loss-cost-office';await f.coordinator.create(profile,id);const s=f.coordinator.sessions.get(id);s.project.pending=false;s.status='paused';f.repository.heartbeat=async()=>{throw Error('Lost ownership')};
 await f.coordinator.step(id);assert.equal(f.coordinator.sessions.has(id),false);
});
