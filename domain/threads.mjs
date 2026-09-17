import {randomUUID} from 'node:crypto';
import {createProject,steer} from './project.mjs';
export function ensureThreads(s){
 if(!s.project)return;
 if(!s.threads){s.project.id='main';s.project.title='Starting exploration';s.threads=[s.project];s.activeThreadId='main';s.sharedContext={revision:1,text:'',history:[],promotions:[]};for(const list of [s.ideas,s.outputs,s.events,s.meetings])for(const item of list)item.threadId='main';}
 s.project=s.threads.find(t=>t.id===s.activeThreadId)||s.threads[0];s.activeThreadId=s.project.id;s.contextSchema=1;
}
export function thread(s,id){const t=s.threads.find(t=>t.id===id);if(!t)throw new Error('This thread does not belong to this office.');return t;}
export function inThread(s,item){return !s.threads||(item.threadId||'main')===s.activeThreadId;}
function resetJob(s){for(const t of s.threads)for(const a of t.actions||[])if(a.status==='running')a.status='ready';s.generation++;s.job=null;s.busy=false;for(const m of s.meetings)if(['active','discussed'].includes(m.status))m.status='done';}
export function threadCommand(s,c){
 ensureThreads(s);
 if(c.type==='createThread'){
  if(s.threads.length>=6)throw new Error('This pilot supports six threads per office.');
  if(typeof c.title!=='string'||!c.title.trim()||c.title.length>70||typeof c.objective!=='string'||!c.objective.trim()||c.objective.length>1800)throw new Error('Supply a title (70 characters) and objective (1800 characters).');
  const t=createProject({interests:c.objective.trim()});t.id=randomUUID();t.title=c.title.trim();s.threads.push(t);return;
 }
 if(c.type==='focusThread'){const t=thread(s,c.threadId);resetJob(s);s.activeThreadId=t.id;s.project=t;return;}
 if(c.type==='message'){
  const target=thread(s,c.threadId||s.activeThreadId);if(c.questionId&&!target.questions.some(q=>q.id===c.questionId&&q.status==='open'))throw new Error('That question is no longer open in this thread.');
  const previous=s.project;s.project=target;try{steer(s,c.text);for(const t of s.threads)for(const a of t.actions||[])if(a.status==='running')a.status='ready';if(c.questionId)target.inputs.at(-1).questionId=c.questionId;}finally{s.project=previous;}return;
 }
 if(c.type==='updateContext'){
  if(typeof c.text!=='string'||c.text.length>3000)throw new Error('Shared context must be at most 3000 characters.');
  if(c.expectedRevision!==s.sharedContext.revision)throw new Error('Shared context changed. Reopen it before saving.');
  s.sharedContext.history.push({revision:s.sharedContext.revision,text:s.sharedContext.text});s.sharedContext.history=s.sharedContext.history.slice(-5);s.sharedContext.text=c.text.trim();s.sharedContext.revision++;
 }else if(c.type==='promoteFinding'){
  const output=s.outputs.find(o=>o.id===c.outputId&&o.threadId===c.threadId&&!o.superseded&&o.scope!=='private'&&(o.agentId==='player'||s.ideas.some(i=>i.id===o.ideaId&&i.knownBy.includes('player'))));
  if(!output)throw new Error('Choose a current finding visible in this thread.');
  if(s.sharedContext.promotions.some(p=>p.outputId===output.id))return;
  if(s.sharedContext.promotions.length>=8)throw new Error('This pilot supports eight shared findings.');
  s.sharedContext.promotions.push({outputId:output.id,threadId:output.threadId,authorId:output.agentId,text:output.text,sources:output.sources,approvedBy:'user',kind:'research finding; not a user fact'});s.sharedContext.revision++;
 }else throw new Error('Unknown thread command.');
 resetJob(s);for(const t of s.threads){t.dirty=true;t.revision++;if(t.artifact)t.artifact.stale=true;}
}
export function selectPendingThread(s){ensureThreads(s);if(s.job)return;const next=s.threads?.find(t=>t.pending);if(next){s.project=next;s.activeThreadId=next.id;}}
