import { randomUUID } from 'node:crypto';
import { newOffice,applyCommand,tick,completeJob,snapshot,report,event } from '../domain/office.mjs';
import { Inference } from './inference.mjs';
import { FileRepository } from './repository.mjs';
export class Coordinator{
 constructor({repository=new FileRepository(),inference=new Inference(),clock=Date.now,startTimer=true}={}){this.repository=repository;this.inference=inference;this.clock=clock;this.sessions=new Map();this.locks=new Map();this.pending=new Map();if(startTimer){this.timer=setInterval(()=>this.stepAll(),1000);this.timer.unref()}}
 async lock(id,fn){const previous=this.locks.get(id)||Promise.resolve();const next=previous.catch(()=>{}).then(fn);this.locks.set(id,next);try{return await next}finally{if(this.locks.get(id)===next)this.locks.delete(id)}}
 async getState(id){let s=this.sessions.get(id);if(!s){s=await this.repository.load(id);if(!s)return null;if(s.job){s.job=null;s.busy=false;s.generation++;s.agents.forEach(a=>a.activity='Break');event(s,'Recovery','The office has reconnected','An interrupted inference attempt was discarded. Its reserved call still counts toward the budget.')}s.lastTick=this.clock();this.sessions.set(id,s)}if(s.expiresAt<=this.clock()||s.status==='expired'){this.sessions.delete(id);await this.repository.delete(id);return null}return s}
 async create(p,id=randomUUID()){return this.lock(id,async()=>{const existing=await this.getState(id);if(existing)return snapshot(existing);if(this.sessions.size>=10)throw new Error('The pilot is full. Please try later.');const s=newOffice(p,{id,mode:this.inference.mode,now:this.clock(),callLimit:Number(process.env.CALL_LIMIT||60)});await this.repository.save(s);this.sessions.set(id,s);return snapshot(s)})}
 async read(id){return this.lock(id,async()=>{const s=await this.getState(id);if(!s)throw new Error('No active office session.');s.lastSeen=this.clock();return snapshot(s)})}
 async command(id,c){return this.lock(id,async()=>{const s=await this.getState(id);if(!s)throw new Error('No active office session.');const generation=s.generation;applyCommand(s,c,this.clock());if(s.generation!==generation)this.pending.delete(id);s.revision++;await this.repository.save(s);return snapshot(s)})}
 async remove(id){return this.lock(id,async()=>{const s=await this.getState(id);if(s){s.status='expired';s.generation++}this.sessions.delete(id);this.pending.delete(id);await this.repository.delete(id);return {ok:true}})}
 async report(id){return this.lock(id,async()=>{const s=await this.getState(id);if(!s)throw new Error('No active office session.');if(s.status!=='complete')throw new Error('Finish the day to collect its report.');return report(s)})}
 async stepAll(){await Promise.allSettled([...this.sessions.keys()].map(id=>this.step(id)))}
 async step(id){let work;await this.lock(id,async()=>{const s=await this.getState(id);if(!s)return;const buffered=this.pending.get(id);if(buffered&&s.status==='running'){completeJob(s,buffered.job,buffered.result);this.pending.delete(id)}const job=tick(s,this.clock());s.revision++;await this.repository.save(s);if(job)work={job,state:structuredClone(s)}}).catch(e=>{console.error(JSON.stringify({event:"checkpoint_failure",name:e.name}));const s=this.sessions.get(id);if(s){s.status='paused';s.generation++;s.busy=false;s.job=null}this.sessions.delete(id)});
   if(!work)return;const {job,state}=work;
   const reserve=()=>this.lock(id,async()=>{const s=this.sessions.get(id);if(!s||s.generation!==job.generation||s.status==='complete'||s.status==='expired'||s.expiresAt<=this.clock())throw new Error('The workday ended before this step.');if(s.calls>=s.callLimit)throw new Error('The workday inference budget is used. End the day to review completed work.');s.calls++;await this.repository.save(s)});
   let result;try{result=await this.inference.execute(state,job,reserve)}catch(e){console.error(JSON.stringify({event:"inference_failure",name:e.name}));result={error:/budget|ended|Research planning/.test(e.message)?e.message:'This inference or research attempt failed. The agent will take a break and try another task.'}}
   await this.lock(id,async()=>{const s=this.sessions.get(id);if(!s||s.generation!==job.generation)return;if(s.status==='paused'&&job.kind!=='guidance')this.pending.set(id,{job,result});else completeJob(s,job,result);s.revision++;await this.repository.save(s)}).catch(()=>this.sessions.delete(id));
 }
 busy(){return [...this.sessions.values()].some(s=>s.status==='running'||s.busy)}
 close(){clearInterval(this.timer)}
}
