import {randomUUID} from 'node:crypto';

export function createProject(profile){
 return {revision:1,knownBy:['player'],inputs:[{id:'initial',text:profile.interests,intent:profile.intent||'',constraints:profile.constraints||'',facts:profile.facts||'',unknowns:profile.unknowns||''}],messages:[],pending:true,waiting:false,question:'',nextStep:'Reviewing your problem and intended outcome.',brief:null,artifact:null,artifactHistory:[],dirty:false,lastSynthesisCount:0};
}
export function projectContext(s,id){
 const p=s.project;if(!p||!p.knownBy.includes(id))return null;
 return {revision:p.revision,inputs:p.inputs,brief:p.brief,nextStep:p.nextStep,question:p.question,artifact:p.artifact?{proposal:p.artifact.proposal,test:p.artifact.test,successCriteria:p.artifact.successCriteria}:null};
}
export function steer(s,text){
 if(typeof text!=='string'||!text.trim()||text.length>2000)throw new Error('Please write a message of 1–2000 characters.');
 if(s.calls>=s.callLimit)throw new Error('Model call limit reached. End the day to collect your report.');
 const p=s.project??=createProject(s.agents[0]);if(p.inputs.length>=40)throw new Error('This pilot supports 39 messages per workday. Start a fresh office to continue.');
 p.revision++;const id=randomUUID();p.inputs.push({id,text:text.trim()});p.messages.push({id,role:'user',text:text.trim(),revision:p.revision});
 p.pending=true;p.waiting=false;p.question='';p.nextStep='Updating my understanding from your message.';p.dirty=false;
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
 const p=s.project;if(result.contextChanged){for(const o of s.outputs)o.superseded=true;for(const i of s.ideas.filter(i=>i.originEvent||i.knownBy.includes('player')))i.superseded=true;for(const e of s.events.filter(e=>e.turns))e.superseded=true;result.artifact.evidenceIds=[]}
 p.pending=false;p.dirty=false;p.waiting=result.needsInput;p.question=result.question;p.nextStep=result.nextStep;p.brief=result.brief;
 p.messages.push({id:randomUUID(),role:'assistant',text:result.reply,revision:p.revision});p.messages=p.messages.slice(-80);
 if(p.artifact)p.artifactHistory.push(p.artifact);p.artifactHistory=p.artifactHistory.slice(-5);
 p.artifact={...result.artifact,version:(p.artifact?.version||0)+1,projectRevision:p.revision,stale:false};
 p.lastSynthesisCount=s.outputs.length+s.events.filter(e=>e.turns).length;
 const idea=s.ideas.find(i=>i.projectTask);if(idea){idea.text=p.brief.summary+'\nDesired outcome: '+p.brief.objective+'\nNext step: '+p.nextStep;idea.status='queued';idea.attempts=0;idea.superseded=false;idea.knownBy=[...p.knownBy]}else s.ideas.push({id:randomUUID(),text:p.brief.summary+'\nDesired outcome: '+p.brief.objective+'\nNext step: '+p.nextStep,projectTask:true,knownBy:[...p.knownBy],contributors:['player'],status:'queued',attempts:0,originEvent:null});
 s.agents[0].activity=p.waiting?'Waiting for you':'Deep work';
}
export function experimentMarkdown(s){
 const p=s.project;if(!p)return '';const b=p.brief,a=p.artifact;
 const bullets=xs=>xs?.length?xs.map(x=>'- '+x).join('\n'):'Not established yet.';
 const evidence=s.outputs.filter(o=>!o.superseded&&a?.evidenceIds.includes(o.id));
 return [`# Living experiment brief`,a?`Draft ${a.version} · context revision ${a.projectRevision}${a.stale?' · New context or findings awaiting synthesis':''}`:'Preparing the first draft.',`## Problem`,b?.summary||p.inputs[0].text,`## Desired outcome`,b?.objective||p.inputs[0].intent||'Needs your input.',`## User-provided context (agent interpretation)`,bullets(b?.facts),`## Constraints`,bullets(b?.constraints),`## Hypotheses — not established facts`,bullets(b?.hypotheses),`## Evidence`,...evidence.map(o=>`${o.text}\n\n${o.sources.map(x=>`- ${x.title}: ${x.url}`).join('\n')}`),...(!evidence.length?['No current research evidence has been selected.']:[]),`## Proposed experiment`,a?.proposal||'Not proposed yet.',`## Test`,a?.test||'Not proposed yet.',`## Success criteria`,a?.successCriteria||'Needs agreement.',`## Unknowns`,bullets(b?.unknowns),`## Next step`,p.waiting?p.question:p.nextStep].join('\n\n');
}
