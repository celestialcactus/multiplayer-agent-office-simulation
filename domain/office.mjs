import {ensureDiscussions,queueDiscussionFollowup,discussionPlan,recordDiscussion,finishDiscussions} from './discussions.mjs';
import {ensureCollaboration,validateCapabilities,collaborationContext,recordExchange,proactiveExchange,artifactCommand,commitArtifact} from './collaboration.mjs';
import {ensureThreads,inThread,threadCommand,selectPendingThread,captureThreadBranch} from './threads.mjs';
import {finishAction} from './actions.mjs';
import {appearance} from './appearance.mjs';
import {createProject,projectContext,steer,applyGuidance,experimentMarkdown} from './project.mjs';
import {workingStyle} from './personality.mjs';
import { randomUUID } from 'node:crypto';
export const NPCS=[
 {id:'designer',name:'Maya',role:'Designer',color:'#f3ba77',persona:'Empathetic and visual. Ask who is affected and test assumptions with small prototypes.',interest:'Reduce onboarding friction through user interviews and first-use journey mapping.'},
 {id:'credit',name:'Ellis',role:'Credit analyst',color:'#ad9ef2',persona:'Measured and evidence driven. Look for hidden assumptions, incentives, uncertainty, and downside.',interest:'Explain credit decisions transparently and distinguish useful signals from biased proxies.'},
 {id:'frontend',name:'Jules',role:'Frontend developer',color:'#70c6e4',persona:'Practical and inclusive. Connect usability to accessibility, performance, and testable interaction.',interest:'Make complex forms accessible and reduce confusing errors without hiding important information.'},
 {id:'backend',name:'Theo',role:'Backend developer',color:'#ef94ac',persona:'Systems thinker. Trace data provenance, reliability, boundaries, and failure modes.',interest:'Design trustworthy event histories and resilient services that preserve the origin of information.'}
];
export function validateProfile(p){
 if(!p||typeof p!=='object')throw new Error('Agent configuration is required.');
 const out={};for(const [key,max,required] of [['name',40,true],['role',100,true],['persona',300,true],['interests',1800,true],['privateNotes',1200,false],['intent',800,false],['constraints',1000,false],['facts',1400,false],['unknowns',1000,false]]){if(p[key]!==undefined&&typeof p[key]!=='string')throw new Error(`Invalid ${key}.`);out[key]=(p[key]||'').trim();if(out[key].length>max||(required&&!out[key]))throw new Error(`Please supply ${key} (up to ${max} characters).`)}
 out.artifactCapabilities=validateCapabilities(p.artifactCapabilities);Object.assign(out,appearance(p));return out;
}
export function newOffice(profile,{id=randomUUID(),mode='demo',now=Date.now(),callLimit=60}={}){
 const p=validateProfile(profile);const agents=[{id:'player',...p},...structuredClone(NPCS)].map(a=>({...a,activity:'Deep work',stalls:0,taskId:null}));
 const s={id,mode,createdAt:now,expiresAt:now+8*60*60*1000,status:'running',minute:0,speed:4,lastTick:now,lastSeen:now,lastActivity:0,nextEncounter:16,revision:0,generation:0,agents,ideas:[],events:[],outputs:[],meetings:[],commands:[],calls:0,callLimit,job:null,busy:false,researchCursor:0,project:createProject(p)};
 agents.forEach(a=>s.ideas.push({id:randomUUID(),text:(a.interests||a.interest)+(a.intent?'\nDesired outcome and constraints: '+a.intent:''),knownBy:[a.id],contributors:[a.id],projectSeed:a.id==='player',originEvent:null,status:'queued',attempts:0}));event(s,'Arrival','The office is open',`${p.name} joins Maya, Ellis, Jules, and Theo. ${mode==='demo'?'Scripted demo: exchanges and research examples are not live inference.':'Live inference enabled. Research uses configured public sources; each finding needs review.'}`);ensureThreads(s);ensureCollaboration(s);ensureDiscussions(s);return s;
}
export function event(s,kind,title,text,extra={}){const e={id:randomUUID(),minute:s.minute,threadId:s.activeThreadId,kind,title,text,...extra};s.events.push(e);s.events=s.events.slice(-100);return e}
export function researchMemory(s,agentId){
 const own=s.outputs.filter(o=>!o.superseded&&inThread(s,o)&&o.agentId===agentId&&(o.scope==='shareable'||(!o.scope&&s.ideas.some(i=>i.id===o.ideaId&&i.scope!=='private')))).slice(-3).map(o=>({outputId:o.id,authorId:o.agentId,summary:o.text,kind:o.mode==='demo'?'demo plan':o.sources.length?'research note; claims need review':'unresolved research',originEvent:o.originEvent,contributors:o.contributors,sources:o.sources.map(({id,title,url})=>({id,title,url}))}));
 const received=s.ideas.filter(i=>!i.superseded&&inThread(s,i)&&i.knownBy.includes(agentId)&&i.scope!=='private').flatMap(i=>i.researchNotes||[]).slice(-3);
 const notes=new Map();for(const note of [...received,...own])notes.set(note.outputId,note);return [...notes.values()].slice(-6);
}
export function shareContext(s,agentId){const a=s.agents.find(a=>a.id===agentId);return {...collaborationContext(s,agentId),name:a.name,role:a.role,persona:a.persona,workingStyle:workingStyle(a.privateNotes||''),interests:(agentId==='player'?s.project?.brief?.summary:undefined)||(agentId==='player'?s.project?.inputs[0]?.text:a.interest),intent:(agentId==='player'?(s.project?.brief?.objective||s.project?.inputs[0]?.intent):undefined)||'',project:projectContext(s,agentId),recentExchanges:s.events.filter(e=>!e.superseded&&inThread(s,e)&&(!s.project||!e.projectRevision||e.projectRevision===s.project.revision)&&e.turns?.some(t=>t.agentId===agentId)).slice(-3).map(e=>({id:e.id,kind:e.kind,turns:e.turns.map(t=>({agentId:t.agentId,text:t.text}))})),research:researchMemory(s,agentId),ideas:s.ideas.filter(i=>!i.superseded&&inThread(s,i)&&i.knownBy.includes(agentId)&&i.scope!=='private').slice(-8).map(i=>({id:i.id,text:i.text,contributors:i.contributors}))}}
export function snapshot(s){ensureThreads(s);const copy=structuredClone(s);delete copy.id;delete copy.commands;delete copy.job;delete copy.lastSeen;delete copy.lastTick;delete copy.generation;if(copy.project)copy.project.markdown=experimentMarkdown(s);for(const t of copy.threads||[])t.markdown=experimentMarkdown({...s,project:t});copy.capabilities=['threads-v1','forks-v1','collaboration-v1','artifacts-v1','discussions-v1'];copy.work=s.job?{kind:s.job.kind,threadId:s.job.threadId,participants:s.job.participants}:null;delete copy.project?.branchSnapshots;for(const t of copy.threads||[])delete t.branchSnapshots;copy.agents.forEach(a=>{delete a.privateNotes});return copy}
export function applyCommand(s,c,now=Date.now()){
 if(!c||typeof c.commandId!=='string'||c.commandId.length>80||!c.commandId)throw new Error('A command ID is required.');if(s.commands.includes(c.commandId))return;
 if(s.expiresAt<=now)throw new Error('This office session has expired.');if(s.status==='complete')throw new Error('The workday is complete.');
 ensureThreads(s);
 switch(c.type){
 case 'forkThread':case 'createThread':case 'focusThread':case 'updateContext':case 'promoteFinding':threadCommand(s,c);break;
 case 'message':threadCommand(s,c);event(s,'Narration','Direction queued for this thread','Your message will update this thread’s working brief. Work in other threads can continue.',{threadId:c.threadId||s.activeThreadId,participants:['player'],agentId:'player'});break;
 case 'queueDiscussionFollowup':queueDiscussionFollowup(s,c);break;
 case 'setCapabilities':case 'generateArtifact':artifactCommand(s,c);break;
 case 'pause':s.status='paused';break;
 case 'resume':if(s.calls>=s.callLimit)throw new Error('Model call limit reached. End the day to collect your report.');s.status='running';s.lastTick=now;break;
 case 'speed':if(![1,4,12].includes(c.speed))throw new Error('Choose 1×, 4×, or 12×.');s.speed=c.speed;break;
 case 'coffee':if(s.status!=='running')throw new Error('Resume the day first.');s.nextEncounter=Math.min(s.nextEncounter,s.minute);break;
 case 'meeting':{
   if(s.status!=='running')throw new Error('Resume the day first.');
   if(c.agenda!==undefined&&(typeof c.agenda!=='string'||c.agenda.length>800))throw new Error('Meeting agenda must be at most 800 characters.');const target=s.threads.find(t=>t.id===(c.threadId||s.activeThreadId));if(!target)throw new Error('Choose a thread in this office.');
   const participants=['player',...new Set(c.participants||[])];if(participants.length<2||participants.length>5||participants.some(id=>!s.agents.some(a=>a.id===id))||!['designer','credit','frontend','backend'].includes(participants[1]))throw new Error('Choose valid coworkers.');
   if(![0,15,30,60].includes(c.delay))throw new Error('Choose a valid meeting time.');const start=s.minute+c.delay,end=start+30;
   if(end>480)throw new Error('There is not enough time left today.');if(s.meetings.length>=10)throw new Error('This day already has ten meetings.');
   if(s.meetings.some(m=>m.status!=='cancelled'&&m.status!=='done'&&start<m.end&&end>m.start&&participants.some(p=>m.participants.includes(p))))throw new Error('A participant already has a meeting then.');
   s.meetings.push({id:randomUUID(),participants,threadId:target.id,agenda:(c.agenda||'').trim(),start,end,status:'scheduled'});event(s,'Schedule','A meeting is on the calendar',`A 30-minute exchange with ${participants.slice(1).map(id=>s.agents.find(a=>a.id===id).name).join(', ')}.`);break;
 }
 case 'cancelMeeting':{const m=s.meetings.find(m=>m.id===c.meetingId&&m.status==='scheduled');if(!m)throw new Error('Only upcoming meetings can be cancelled.');m.status='cancelled';break;}
 case 'finish':s.status='complete';finishDiscussions(s);for(const r of s.artifactRequests||[])if(['queued','processing'].includes(r.status)){r.status='failed';r.error='The workday ended before generation completed.';}s.generation++;s.busy=false;s.job=null;s.agents.forEach(a=>a.activity='Day complete');event(s,'Report','The workday is complete','Completed findings and unfinished questions are ready in your report.');break;
 default:throw new Error('Unknown office command.');}
 s.commands.push(c.commandId);s.commands=s.commands.slice(-200);s.lastSeen=now;
}
export function tick(s,now=Date.now(),random=Math.random){
 ensureCollaboration(s);selectPendingThread(s);
 if(s.expiresAt<=now){s.status='expired';s.generation++;s.job=null;s.busy=false;return null}
 if(s.status==='running'&&s.calls>=s.callLimit){
  s.lastTick=now;
  if(!s.budgetNotified){s.budgetNotified=true;event(s,'Budget','Model call limit reached',`All ${s.callLimit} model calls have been used. Finishing any in-flight work; the report will then be ready.`)}
  if(!s.job){s.endReason='budget';applyCommand(s,{type:'finish',commandId:randomUUID()},now)}
  return null;
 }
 if(s.project?.pending&&!s.job&&s.calls<s.callLimit&&['running','paused'].includes(s.status)){const job={id:randomUUID(),kind:'guidance',participants:['player'],generation:s.generation,startedAt:now,threadId:s.activeThreadId,projectRevision:s.project.revision};s.job=job;s.busy=true;s.lastTick=now;return structuredClone(job)}
 if(s.status!=='running'){s.lastTick=now;return null}
 if(now-s.lastSeen>120000){s.status='paused';s.lastTick=now;event(s,'Pause','Paused while you are away','The office keeps its context. Resume when you return.');return null}
 s.minute=Math.min(480,s.minute+Math.min(5,(now-s.lastTick)/1000)*s.speed/2);s.lastTick=now;
 if(s.minute>=480){applyCommand(s,{type:'finish',commandId:randomUUID()},now);return null}
 for(const m of s.meetings.filter(m=>m.status==='discussed'&&s.minute>=m.end)){m.status='done';m.participants.forEach(id=>s.agents.find(a=>a.id===id).activity='Deep work')}
 if(s.job||s.calls>=s.callLimit)return null;
 const meeting=s.meetings.find(m=>m.status==='scheduled'&&m.start<=s.minute);if(meeting){s.project=s.threads.find(t=>t.id===meeting.threadId);s.activeThreadId=s.project.id;}
 const request=s.artifactRequests.find(r=>r.status==='queued');
 let job;if(request){s.project=s.threads.find(t=>t.id===request.threadId);s.activeThreadId=s.project.id;if(s.project.dirty||s.project.pending)job={kind:'guidance',participants:['player'],projectRevision:s.project.revision};else{request.status='processing';job={kind:'artifact',participants:['player'],requestId:request.id,artifactKind:request.kind};}}
 else if(s.project?.dirty&&s.calls<s.callLimit){job={kind:'guidance',participants:['player'],projectRevision:s.project.revision}}
 else if(meeting){meeting.status='active';meeting.participants.forEach(id=>s.agents.find(a=>a.id===id).activity='Meeting');job={kind:'meeting',participants:meeting.participants,meetingId:meeting.id,agenda:meeting.agenda}}
 else if(s.meetings.some(m=>m.status==='discussed'&&m.end>s.minute))return null;
 else if(s.project?.actions?.some(a=>a.id===s.project.currentActionId&&a.kind==='discussion'&&a.status==='ready')&&s.minute-s.lastActivity>=10){const action=s.project.actions.find(a=>a.id===s.project.currentActionId);job={kind:'encounter',participants:['player',NPCS[Math.floor(random()*NPCS.length)].id],actionId:action.id};job.participants.forEach(id=>s.agents.find(a=>a.id===id).activity='Encounter');s.nextEncounter=s.minute+35}
 else if(s.minute-s.lastActivity>=10&&(job=proactiveExchange(s))){job.participants.forEach(id=>s.agents.find(a=>a.id===id).activity='Encounter');}
 else if(s.minute>=s.nextEncounter){const p=s.events.filter(e=>e.kind==='Encounter').length%3===2?NPCS[Math.floor(random()*NPCS.length)].id:'player';const candidates=s.agents.filter(a=>a.id!==p);const q=candidates[Math.floor(random()*candidates.length)].id;job={kind:'encounter',participants:[p,q]};job.participants.forEach(id=>s.agents.find(a=>a.id===id).activity='Encounter');s.nextEncounter=s.minute+30+random()*25}
 else if(s.minute-s.lastActivity>=10){const a=s.agents[s.researchCursor++%s.agents.length];if(a.id==='player'&&!a.artifactCapabilities.includes('research')){s.lastActivity=s.minute;return null;}const ideas=s.ideas.filter(i=>!i.superseded&&inThread(s,i)&&i.knownBy.includes(a.id)&&i.status!=='deferred'&&(!i.actionId||s.project?.actions?.some(action=>action.id===i.actionId&&action.kind==='research'&&action.status==='ready'))&&i.status!=='researched'&&i.attempts<2);if(!ideas.length){a.activity='Break';s.lastActivity=s.minute;return null}job={kind:'research',participants:[a.id],candidates:ideas.sort((a,b)=>Number(a.actionId===s.project?.currentActionId)-Number(b.actionId===s.project?.currentActionId)).slice(-6).map(i=>i.id)};a.activity='Deep work'}
 if(!job)return null;if(job.kind==='research'){const planned=s.ideas.find(i=>job.candidates.includes(i.id)&&i.actionId===s.project?.currentActionId);if(planned){job.candidates=[planned.id];job.actionId=planned.actionId;}}job={...job,threadId:s.activeThreadId,projectRevision:s.project?.revision,id:randomUUID(),generation:s.generation,startedAt:now};if(['encounter','meeting'].includes(job.kind))job.discussionPlan=discussionPlan(s,job);s.job=job;s.busy=true;const action=s.project?.actions?.find(a=>a.id===job.actionId);if(action)action.status='running';s.lastActivity=s.minute;event(s,'Narration',job.kind==='guidance'?'Updating the experiment brief':job.kind==='research'?'Investigating an open question':'Comparing perspectives',job.kind==='research'?'I’m choosing evidence that could change the next decision.':job.kind==='guidance'?'I’m connecting the latest findings to the current brief and next action.':'I’m looking for a useful connection, disagreement, or missing context.',{participants:job.participants,agentId:job.participants.length===1?job.participants[0]:undefined});return structuredClone(job);
}
export function completeJob(s,job,result){
 if((job.threadId&&job.threadId!==s.activeThreadId)||!s.job||s.job.id!==job.id||s.generation!==job.generation||!['running','paused'].includes(s.status))return;
 const previousMessage=s.project?.messages.at(-1)?.id;
 if(job.kind==='research'&&result.ideaId)job.actionId=s.ideas.find(i=>i.id===result.ideaId)?.actionId;finishAction(s,job,result);
 if(result.error){if(job.kind==='artifact')commitArtifact(s,job,result);if(job.kind==='guidance'){s.project.pending=false;s.project.dirty=false;s.project.waiting=true;s.project.question='I could not update the brief. Please send a message to retry; your context is saved.';s.project.messages.push({id:randomUUID(),role:'assistant',text:s.project.question,revision:s.project.revision})}event(s,'Attention','Work paused on this attempt',result.error,{participants:job.participants,agentId:job.participants.length===1?job.participants[0]:undefined});job.participants.forEach(id=>{const a=s.agents.find(a=>a.id===id);a.stalls++;a.activity='Break'});if(job.kind==='research'){const i=s.ideas.find(i=>i.id===(result.ideaId||job.candidates[0]));if(i)i.attempts++}if(job.meetingId)s.meetings.find(m=>m.id===job.meetingId).status='done';}
 else if(job.kind==='artifact'){commitArtifact(s,job,result);event(s,'Artifact','A generated draft is ready',`${job.artifactKind} draft — unexecuted and unverified.`,{deliverableId:s.deliverables.at(-1)?.id,participants:['player'],agentId:'player'});}
 else if(job.kind==='guidance'){applyGuidance(s,result);event(s,'Narration',result.needsInput?'I need your context':'The working brief has changed',result.needsInput?result.question:result.nextStep,{participants:['player'],agentId:'player'});}
 else if(job.kind==='research'){
   const idea=s.ideas.find(i=>i.id===result.ideaId);if(!idea||!inThread(s,idea)||!job.candidates.includes(idea.id)||!idea.knownBy.includes(job.participants[0]))throw new Error('Invalid research provenance.');idea.attempts++;idea.status=result.sources.length?'researched':'needs sources';
   const output={id:randomUUID(),threadId:s.activeThreadId,projectRevision:s.project?.revision,agentId:job.participants[0],ideaId:idea.id,originEvent:idea.originEvent,contributors:[...idea.contributors],text:result.text,sources:result.sources,mode:s.mode,scope:idea.scope==='private'?'private':'shareable'};s.outputs.push(output);s.outputs=s.outputs.slice(-30);event(s,'Research',`${s.agents.find(a=>a.id===output.agentId).name} explored an idea`,result.text,{outputId:output.id,agentId:output.agentId,participants:job.participants});job.participants.forEach(id=>s.agents.find(a=>a.id===id).activity=result.sources.length?'Deep work':'Break');
 }else{
   const e=event(s,job.kind==='meeting'?'Meeting':'Encounter',job.kind==='meeting'?'A longer exchange':'An idea over coffee','',{turns:result.turns,projectRevision:s.project?.revision,participants:job.participants,agenda:job.agenda||''});
   if(s.project&&job.participants.some(id=>s.project.knownBy.includes(id))){s.project.knownBy=[...new Set([...s.project.knownBy,...job.participants])];const task=s.ideas.find(i=>i.projectTask&&inThread(s,i));if(task)task.knownBy=['player']}
   for(const t of result.turns){
     if(!job.participants.includes(t.agentId))throw new Error('Invalid conversation participant.');
     const available=researchMemory(s,t.agentId);
     const researchNotes=available.filter(n=>(t.researchIds||[]).includes(n.outputId)).map(n=>({...structuredClone(n),summary:t.text,sharedBy:t.agentId,sharedEvent:e.id}));
     s.ideas.push({id:randomUUID(),threadId:s.activeThreadId,text:t.text,knownBy:[...job.participants],contributors:[...new Set([t.agentId,...job.participants])],originEvent:e.id,researchNotes,status:'queued',attempts:0,scope:'shared'});
   }s.ideas=s.ideas.slice(-60);recordExchange(s,job,e);recordDiscussion(s,job,e,result);
   if(job.meetingId)s.meetings.find(m=>m.id===job.meetingId).status='discussed';else job.participants.forEach(id=>s.agents.find(a=>a.id===id).activity='Deep work');
 }
 if(s.project&&!result.error&&!['guidance','artifact'].includes(job.kind)&&job.participants.includes('player')){s.project.dirty=true;if(s.project.artifact)s.project.artifact.stale=true;}
 s.job=null;s.busy=false;if(s.project?.messages.at(-1)?.id!==previousMessage)captureThreadBranch(s);
}
export function report(s){return {markdown:[`# ${s.agents[0].name}'s office report`,s.mode==='demo'?'SCRIPTED DEMONSTRATION — not live AI research.':'Live Bedrock session — findings require human review.',`\n${s.outputs.length} research notes · ${s.events.filter(e=>e.turns).length} exchanges · ${s.calls} inference steps`,...(s.threads||[s.project]).map(t=>'\n## Thread: '+(t.title||'Starting exploration')+'\n'+experimentMarkdown({...s,project:t})),`\n## Research outputs (historical notes may be superseded)`,...s.outputs.map(o=>`\n### ${s.agents.find(a=>a.id===o.agentId).name}\n${o.superseded?'Superseded by later user context.\n\n':''}${o.text}\n\nContributors: ${o.contributors.map(id=>s.agents.find(a=>a.id===id)?.name||id).join(', ')}\nOrigin exchange: ${o.originEvent||'Initial interest'}\n${o.sources.map(src=>`- ${src.title}: ${src.url}`).join('\n')}`),`\n## Generated collateral — unexecuted and unverified`,...(s.deliverables||[]).map(d=>`\n### ${d.title} (revision ${d.version})${d.superseded?' — superseded':''}\n${d.content}\n\nAccepted contribution IDs: ${d.contributionIds.join(', ')||'None'}`),`\n## Collaboration decisions`,...(s.contributions||[]).map(c=>`- ${c.fromAgentId}: ${c.status} — ${c.decisionReason} (exchange ${c.originEvent})`),`\n## Open ideas`,...s.ideas.filter(i=>!i.superseded&&i.knownBy.includes('player')&&i.status!=='researched').slice(-12).map(i=>`- ${i.text}`),`\n## Limits`,`This report is session-scoped. Attribution records contributions, not intellectual-property ownership. ${s.mode==='demo'?'Use live inference to evaluate actual idea quality.':'Research uses retrieved public-source snippets, not a complete review of every page. Findings and inferred connections require human review.'}`].join('\n')};}
