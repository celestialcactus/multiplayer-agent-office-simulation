import {randomUUID} from 'node:crypto';

export const CAPABILITIES=['research','brief','diagram','code'];
export function validateCapabilities(value=['research','brief']){
 if(!Array.isArray(value)||value.length>4||value.some(x=>!CAPABILITIES.includes(x)))throw new Error('Choose valid generation capabilities.');
 return [...new Set(value)];
}
export function ensureCollaboration(s){
 s.awareness??=[];s.contributions??=[];s.deliverables??=[];s.artifactRequests??=[];
 s.agents[0].artifactCapabilities??=['research','brief'];
}
export function collaborationContext(s,id){
 return {awareness:(s.awareness||[]).filter(x=>x.agentId===id&&x.threadId===s.activeThreadId).slice(-8),contributions:(s.contributions||[]).filter(x=>!x.superseded&&x.threadId===s.activeThreadId&&(x.toAgentId===id||x.fromAgentId===id)).slice(-12)};
}
export function recordExchange(s,job,e){
 ensureCollaboration(s);
 for(const from of job.participants)for(const to of job.participants){
  if(from===to)continue;
    const spoken=(e.turns||[]).find(t=>t.agentId===from);if(!spoken)continue;
  const objective=spoken.text.slice(0,600);
  const prior=s.awareness.find(a=>a.agentId===to&&a.subjectAgentId===from&&a.threadId===s.activeThreadId);
  const known={agentId:to,subjectAgentId:from,threadId:s.activeThreadId,objective,originEvent:e.id,minute:s.minute};
  if(prior)Object.assign(prior,known);else s.awareness.push(known);
 }
 s.awareness=s.awareness.slice(-60);while(s.awareness.length>1&&Buffer.byteLength(JSON.stringify(s.awareness))>24000)s.awareness.shift();
 for(const turn of e.turns||[]){
  if(turn.agentId==='player'||!job.participants.includes('player'))continue;
  const sourceOutputIds=[...new Set(turn.researchIds||[])].filter(id=>s.outputs.some(o=>o.id===id&&o.threadId===s.activeThreadId&&!o.superseded&&o.scope!=='private'));
  // Repetition never creates new evidence or a second contribution for the same source.
  if(s.contributions.some(c=>c.threadId===s.activeThreadId&&c.fromAgentId===turn.agentId&&(c.text===turn.text.slice(0,1200)||(sourceOutputIds.length&&sourceOutputIds.every(id=>c.sourceOutputIds.includes(id))))))continue;
  s.contributions.push({id:randomUUID(),threadId:s.activeThreadId,fromAgentId:turn.agentId,toAgentId:'player',text:turn.text.slice(0,1200),sourceOutputIds,originEvent:e.id,status:'offered',decisionReason:'Awaiting the owner agent’s review.',kind:sourceOutputIds.length?'research-informed suggestion':'hypothesis'});
 }
 s.contributions=s.contributions.slice(-40);while(s.contributions.length>1&&Buffer.byteLength(JSON.stringify(s.contributions))>40000)s.contributions.shift();
}
export function proactiveExchange(s){
 // One handoff per new authored finding, only to someone whose work was learned in an exchange.
 const words=text=>new Set((text.toLowerCase().match(/[a-z]{5,}/g)||[]).filter(w=>!['about','would','could','their','which','research','should','through'].includes(w)));
 for(const output of [...s.outputs].reverse()){
  if(output.threadId!==s.activeThreadId||output.agentId==='player'||output.superseded||output.scope==='private'||!output.sources.length||output.handoffScheduled)continue;
  const known=s.awareness.find(a=>a.agentId===output.agentId&&a.subjectAgentId==='player'&&a.threadId===s.activeThreadId);
  if(!known)continue;
  const terms=words(known.objective||'');if(![...words(output.text)].some(w=>terms.has(w)))continue;
  output.handoffScheduled=true;
  return {kind:'encounter',participants:[output.agentId,'player'],initiativeOutputId:output.id,agenda:'Offer the new finding relevant to the owner’s known objective, explain the connection and limits, and invite a challenge.'};
 }
 return null;
}
export function artifactCommand(s,c){
 ensureCollaboration(s);
 if(c.type==='setCapabilities'){s.agents[0].artifactCapabilities=validateCapabilities(c.artifactCapabilities);for(const r of s.artifactRequests)if(r.status==='queued'&&!s.agents[0].artifactCapabilities.includes(r.kind)){r.status='failed';r.error='This capability was disabled before generation.';}return;}
 const target=s.threads.find(t=>t.id===(c.threadId||s.activeThreadId));if(!target)throw new Error('Choose a thread in this office.');
 if(!['brief','diagram','code'].includes(c.kind)||!s.agents[0].artifactCapabilities.includes(c.kind))throw new Error('Enable this generation capability first.');
 if(s.calls>=s.callLimit)throw new Error('The model call budget is exhausted.');
 if(s.artifactRequests.length>=12)throw new Error('This pilot supports twelve artifact requests per office.');
 if(s.artifactRequests.some(r=>r.threadId===target.id&&r.kind===c.kind&&['queued','processing'].includes(r.status)))throw new Error('This artifact is already queued.');
 s.artifactRequests.push({id:randomUUID(),threadId:target.id,kind:c.kind,status:'queued'});
}
export function commitArtifact(s,job,result){
 const request=s.artifactRequests.find(r=>r.id===job.requestId);if(!request)return;
 if(result.error){request.status='failed';request.error=result.error;return;}
 if(typeof result.content!=='string'||!result.content.trim()||result.content.length>14000)throw new Error('Invalid generated artifact.');
 const previous=s.deliverables.filter(d=>d.threadId===job.threadId&&d.kind===job.artifactKind);
 const item={id:randomUUID(),threadId:job.threadId,kind:job.artifactKind,title:`${s.project.title}: ${job.artifactKind} draft`,content:result.content,version:Math.max(0,...previous.map(d=>d.version))+1,agentId:'player',execution:'not-executed',validation:'unverified',contributionIds:s.contributions.filter(c=>c.threadId===job.threadId&&c.status==='accepted'&&!c.superseded).map(c=>c.id),contextRevision:s.project.revision};
 s.deliverables.push(item);s.deliverables=s.deliverables.slice(-8);while(s.deliverables.length>1&&Buffer.byteLength(JSON.stringify(s.deliverables))>60000)s.deliverables.shift();request.status='completed';request.deliverableId=item.id;
 s.project.messages.push({id:randomUUID(),role:'assistant',text:`Prepared ${item.kind} draft ${item.version}. It is generated collateral, not executed or verified.`,revision:s.project.revision,deliverableId:item.id});
}
