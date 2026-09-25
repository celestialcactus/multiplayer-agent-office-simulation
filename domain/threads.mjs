import {randomUUID} from 'node:crypto';
import {createProject,steer} from './project.mjs';
export function ensureThreads(s){
 if(!s.project)return;
 if(!s.threads){s.project.id='main';s.project.title='Starting exploration';s.threads=[s.project];s.activeThreadId='main';s.sharedContext={revision:1,text:'',history:[],promotions:[]};for(const list of [s.ideas,s.outputs,s.events,s.meetings])for(const item of list)item.threadId='main';}
 s.project=s.threads.find(t=>t.id===s.activeThreadId)||s.threads[0];s.activeThreadId=s.project.id;s.contextSchema=1;
}
export function thread(s,id){const t=s.threads.find(t=>t.id===id);if(!t)throw new Error('This thread does not belong to this office.');return t;}
export function inThread(s,item){return !s.threads||(item.threadId||'main')===s.activeThreadId;}
function resetJob(s){for(const t of s.threads)for(const a of t.actions||[])if(a.status==='running')a.status='ready';const request=(s.artifactRequests||[]).find(r=>r.id===s.job?.requestId);if(request?.status==='processing')request.status='queued';s.generation++;s.job=null;s.busy=false;for(const m of s.meetings)if(['active','discussed'].includes(m.status))m.status='done';}
const size=value=>Buffer.byteLength(JSON.stringify(value),'utf8');
const largeForkMessage='Larger forks are out of scope for this workday. They will need larger sessions and persistence. Start a new thread instead; no context has been partially copied.';
function markBranches(t){for(const m of t.messages){m.forkAvailable=!!t.branchSnapshots?.some(b=>b.messageId===m.id);if(m.forkAvailable)delete m.forkUnavailableReason;else m.forkUnavailableReason??='history';}}
function pruneBranches(s){
 const entries=s.threads.flatMap(t=>(t.branchSnapshots||[]).map(b=>({t,b}))).sort((a,b)=>a.b.sequence-b.b.sequence);
 while(entries.length&&(size(entries.map(x=>x.b))>120000||size(s)>550000)){
  const {t,b}=entries.shift();t.branchSnapshots=t.branchSnapshots.filter(x=>x!==b);
 }
 for(const t of s.threads)markBranches(t);
}
// Capture at a message commit, never on a read: reconstructing old context from
// today's state would silently include evidence learned after the branch point.
export function captureThreadBranch(s,id=s.activeThreadId){
 const t=thread(s,id),message=t.messages.at(-1);if(!message)return;
 t.branchSnapshots??=[];if(t.branchSnapshots.some(b=>b.messageId===message.id))return;
 const project=structuredClone(t);delete project.branchSnapshots;delete project.markdown;
 for(const m of project.messages){delete m.forkAvailable;delete m.forkUnavailableReason;}
 const data={project};for(const key of ['ideas','outputs','events','contributions','deliverables','awareness'])data[key]=structuredClone((s[key]||[]).filter(x=>(x.threadId||'main')===id));
 // Bound total retained history independently of transcript limits.
 const sequence=1+Math.max(0,...s.threads.flatMap(t=>(t.branchSnapshots||[]).map(b=>b.sequence||0)));
 if(size(data)<=48000)t.branchSnapshots.push({messageId:message.id,sequence,data});else message.forkUnavailableReason='size';
 t.branchSnapshots=t.branchSnapshots.slice(-4);
 pruneBranches(s);
}
function forkThread(s,c){
 if(s.threads.length>=6)throw new Error('This pilot supports six threads per office.');
 const parent=thread(s,c.parentThreadId),branch=parent.branchSnapshots?.find(b=>b.messageId===c.messageId);
 if(!branch)throw new Error(parent.messages.find(m=>m.id===c.messageId)?.forkUnavailableReason==='size'?largeForkMessage:'Exact context for this branch point is no longer available. Choose a recent message.');
 if(c.title!==undefined&&(typeof c.title!=='string'||!c.title.trim()||c.title.length>70))throw new Error('Supply a title of up to 70 characters.');
 const data=structuredClone(branch.data),t=data.project,ids=new Map(),newId=randomUUID();
 // Remap every branch-local entity so later parent changes cannot supersede or
 // satisfy child evidence/actions by accidentally sharing identifiers.
 for(const item of [...t.inputs,...t.messages,...(t.actions||[]),...(t.questions||[]),...data.ideas,...data.outputs,...data.events,...data.contributions,...data.deliverables])if(item.id&&!ids.has(item.id))ids.set(item.id,randomUUID());
 const remap=value=>{if(Array.isArray(value))return value.map(remap);if(value&&typeof value==='object')return Object.fromEntries(Object.entries(value).map(([key,v])=>[key,key==='threadId'?newId:remap(v)]));return typeof value==='string'&&ids.has(value)?ids.get(value):value;};
 const clone=remap(t);Object.assign(clone,{id:newId,title:c.title?.trim()||('Fork: '+parent.title).slice(0,70),parentThreadId:parent.id,forkMessageId:c.messageId,forkRevision:t.revision,branchSnapshots:[],pending:false,dirty:false});
 for(const message of clone.messages)message.forkAvailable=false;
 for(const action of clone.actions||[])if(action.status==='running')action.status='ready';
 const candidate=structuredClone(s);candidate.project=candidate.threads.find(t=>t.id===candidate.activeThreadId);candidate.threads.push(clone);
 for(const key of ['ideas','outputs','events','contributions','deliverables','awareness'])for(const original of data[key]){
  const item=remap(original);item.threadId=newId;item.inheritedFrom={threadId:parent.id,id:original.id,messageId:c.messageId};(candidate[key]??=[]).push(item);
 }
 pruneBranches(candidate);
 if(size(candidate)>550000)throw new Error(largeForkMessage);
 // Preflight size before mutating the live session; preserve canonical aliases.
 s.threads.push(clone);for(const key of ['ideas','outputs','events','contributions','deliverables','awareness'])s[key]=candidate[key];
 for(const t of s.threads){t.branchSnapshots=candidate.threads.find(x=>x.id===t.id).branchSnapshots;markBranches(t);}
 // The branch retains the point-in-time draft and awaits its own steering; no
 // inherited execution requests or implicit project-wide context promotion.
 return clone;
}
export function threadCommand(s,c){
 ensureThreads(s);
 if(c.type==='forkThread')return forkThread(s,c);
 if(c.type==='createThread'){
  if(s.threads.length>=6)throw new Error('This pilot supports six threads per office.');
  if(typeof c.title!=='string'||!c.title.trim()||c.title.length>70||typeof c.objective!=='string'||!c.objective.trim()||c.objective.length>1800)throw new Error('Supply a title (70 characters) and objective (1800 characters).');
  const t=createProject({interests:c.objective.trim()});t.id=randomUUID();t.title=c.title.trim();s.threads.push(t);return;
 }
 if(c.type==='focusThread'){const t=thread(s,c.threadId);resetJob(s);s.activeThreadId=t.id;s.project=t;return;}
 if(c.type==='message'){
  const target=thread(s,c.threadId||s.activeThreadId);if(c.questionId&&!target.questions.some(q=>q.id===c.questionId&&q.status==='open'))throw new Error('That question is no longer open in this thread.');
  const previous=s.project;s.project=target;try{steer(s,c.text);for(const a of target.actions||[])if(a.status==='running')a.status='ready';if(c.questionId)target.inputs.at(-1).questionId=c.questionId;captureThreadBranch(s,target.id);}finally{s.project=previous;}return;
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
