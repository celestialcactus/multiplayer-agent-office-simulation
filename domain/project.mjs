import {applyAssessment} from './actions.mjs';
import {randomUUID} from 'node:crypto';

export function createProject(profile){
 return {workPolicy:'action-escalation-v1',actions:[],questions:[],revision:1,knownBy:['player'],inputs:[{id:'initial',text:profile.interests,intent:profile.intent||'',constraints:profile.constraints||'',facts:profile.facts||'',unknowns:profile.unknowns||''}],messages:[],pending:true,waiting:false,question:'',nextStep:'Reviewing your problem and intended outcome.',brief:null,artifact:null,artifactHistory:[],dirty:false,lastSynthesisCount:0};
}
export function projectContext(s,id){
 const p=s.project;if(!p||!p.knownBy.includes(id))return null;
 return {threadId:p.id,threadTitle:p.title,sharedContext:s.sharedContext?{revision:s.sharedContext.revision,text:s.sharedContext.text,promotions:s.sharedContext.promotions.filter(x=>!x.superseded&&!!s.outputs.find(o=>o.id===x.outputId&&!o.superseded))}:null,revision:p.revision,inputs:p.inputs,brief:p.brief,nextStep:p.nextStep,question:p.question,questions:p.questions?.filter(q=>q.status==='open'),actions:p.actions?.slice(-8),assessment:p.assessment,artifact:p.artifact?{proposal:p.artifact.proposal,test:p.artifact.test,successCriteria:p.artifact.successCriteria}:null};
}
export function steer(s,text){
 if(typeof text!=='string'||!text.trim()||text.length>2000)throw new Error('Please write a message of 1–2000 characters.');
 if(s.calls>=s.callLimit)throw new Error('Model call limit reached. End the day to collect your report.');
 const p=s.project??=createProject(s.agents[0]);if(p.inputs.length>=40)throw new Error('This pilot supports 39 messages per workday. Start a fresh office to continue.');
 p.revision++;const id=randomUUID();p.inputs.push({id,text:text.trim()});p.messages.push({id,role:'user',text:text.trim(),revision:p.revision});
 p.pending=true;p.nextStep='Updating my understanding from your message.';p.dirty=false;
 for(const action of p.actions||[])if(action.status==='running')action.status='ready';
 s.generation++;s.job=null;s.busy=false;s.agents.forEach(a=>a.activity='Reviewing context');
 for(const m of s.meetings.filter(m=>['active','discussed'].includes(m.status)))m.status='done';
 // Mark the draft stale until the message has been interpreted.
 if(p.artifact)p.artifact.stale=true;
}
function string(v,max,required=false){if(typeof v!=='string'||v.length>max||(required&&!v.trim()))throw new Error('Invalid project response.');return v.trim()}
function list(v,max=8){if(!Array.isArray(v)||v.length>max)throw new Error('Invalid project response.');return v.map(x=>string(x,400,true))}
export function validateGuidance(raw,validEvidenceIds){
 const v=JSON.parse(raw.replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''));
 if(typeof v.needsInput!=='boolean'||typeof v.contextChanged!=='boolean')throw new Error('Invalid project response.');
 const r={contextChanged:v.contextChanged,reply:string(v.reply,1600,true),needsInput:v.needsInput,question:string(v.question,500),nextStep:string(v.nextStep,500,true),brief:{summary:string(v.brief?.summary,1200,true),objective:string(v.brief?.objective,800),constraints:list(v.brief?.constraints),facts:list(v.brief?.facts),hypotheses:list(v.brief?.hypotheses),unknowns:list(v.brief?.unknowns)},artifact:{proposal:string(v.artifact?.proposal,1400),test:string(v.artifact?.test,1400),successCriteria:string(v.artifact?.successCriteria,800),evidenceIds:list(v.artifact?.evidenceIds,10)}};
 if(r.needsInput&&!r.question)throw new Error('Invalid project question.');
 if(r.artifact.evidenceIds.some(id=>!validEvidenceIds.includes(id)))throw new Error('Invalid project evidence reference.');return r;
}
export function applyGuidance(s,result){
 const p=s.project;if(result.contextChanged){for(const o of s.outputs.filter(o=>!s.threads||(o.threadId||'main')===p.id))o.superseded=true;for(const i of s.ideas.filter(i=>(!s.threads||(i.threadId||'main')===p.id)&&(i.originEvent||i.knownBy.includes('player'))))i.superseded=true;for(const e of s.events.filter(e=>e.turns&&(!s.threads||(e.threadId||'main')===p.id)))e.superseded=true;for(const shared of s.sharedContext?.promotions||[])if(s.outputs.find(o=>o.id===shared.outputId)?.superseded)shared.superseded=true;result.artifact.evidenceIds=[]}
 const fromUser=p.pending;
 const assessment=result.assessment||{action:result.nextStep,kind:'research',reason:'Continue useful work while preserving uncertainty.',question:result.needsInput?result.question:'',questionKind:result.needsInput?'clarification':'none',blockedAction:'',resolvesQuestion:fromUser&&!result.needsInput,assumptions:[]};
 const action=applyAssessment(p,assessment,{fromUser,scopeChanged:result.contextChanged&&assessment.resolvesQuestion&&fromUser});
 p.pending=false;p.dirty=false;p.brief=result.brief;
 if(fromUser||p.messages.at(-1)?.text!==result.reply)p.messages.push({id:randomUUID(),role:'assistant',text:result.reply,revision:p.revision});p.messages=p.messages.slice(-80);
 if(p.artifact)p.artifactHistory.push(p.artifact);p.artifactHistory=p.artifactHistory.slice(-5);
 p.artifact={...result.artifact,version:(p.artifact?.version||0)+1,projectRevision:p.revision,stale:false};
 p.lastSynthesisCount=s.outputs.length+s.events.filter(e=>e.turns&&(!s.threads||(e.threadId||'main')===p.id)).length;
 // One executable step on the SAME idea; questions never exclude the whole project.
 for(const legacy of s.ideas.filter(i=>(i.projectExploration||i.projectSeed)&&(!s.threads||(i.threadId||'main')===p.id)))legacy.superseded=true;
 const taskText=p.brief.summary+'\nDesired outcome: '+p.brief.objective+'\nAction: '+action.title+'\nAssumptions: '+assessment.assumptions.join('; ');
 let idea=s.ideas.find(i=>i.projectTask&&(!s.threads||(i.threadId||'main')===p.id));
 if(!idea){idea={id:randomUUID(),threadId:p.id,projectTask:true,contributors:['player'],originEvent:null};s.ideas.push(idea);}
 if(idea.actionId!==action.id){idea.attempts=0;idea.status='queued';}
 Object.assign(idea,{text:taskText,actionId:action.id,knownBy:[...p.knownBy],superseded:false});
 if(['completed','deferred'].includes(action.status))idea.status=action.status==='completed'?'researched':'deferred';
 s.agents.forEach(a=>{if(a.id==='player'||a.activity==='Reviewing context'||a.activity==='Waiting for you')a.activity='Deep work'});
}
export function experimentMarkdown(s){
 const p=s.project;if(!p)return '';const b=p.brief,a=p.artifact;
 const bullets=xs=>xs?.length?xs.map(x=>'- '+x).join('\n'):'Not established yet.';
 const evidence=s.outputs.filter(o=>!o.superseded&&a?.evidenceIds.includes(o.id));
 return [`# Living experiment brief`,a?`Draft ${a.version} · context revision ${a.projectRevision}${a.stale?' · New context or findings awaiting synthesis':''}`:'Preparing the first draft.',`## Problem`,b?.summary||p.inputs[0].text,`## Desired outcome`,b?.objective||p.inputs[0].intent||'Needs your input.',`## User-provided context (agent interpretation)`,bullets(b?.facts),`## Constraints`,bullets(b?.constraints),`## Hypotheses — not established facts`,bullets(b?.hypotheses),`## Evidence`,...evidence.map(o=>`${o.text}\n\n${o.sources.map(x=>`- ${x.title}: ${x.url}`).join('\n')}`),...(!evidence.length?['No current research evidence has been selected.']:[]),`## Proposed experiment`,a?.proposal||'Not proposed yet.',`## Test`,a?.test||'Not proposed yet.',`## Success criteria`,a?.successCriteria||'Needs agreement.',`## Unknowns`,bullets(b?.unknowns),`## Next step`,p.nextStep,`## Action status`,...(p.actions||[]).slice(-6).map(x=>'- '+x.title+' ['+x.status+']'+(x.reason?' — '+x.reason:'')), ...(p.waiting?['## Open question for you -- work continues',p.question]:[])].join('\n\n');
}
