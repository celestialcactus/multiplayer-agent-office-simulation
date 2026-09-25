import {randomUUID} from 'node:crypto';

const key=(threadId,participants,agenda='')=>JSON.stringify([threadId,[...participants].sort(),agenda.trim().toLowerCase()]);
export function ensureDiscussions(s){s.discussions??=[];}
export function queueDiscussionFollowup(s,c){
 ensureDiscussions(s);const d=s.discussions.find(d=>d.id===c.discussionId);
 if(!d)throw new Error('This discussion is no longer available in this workday.');
 if(typeof c.text!=='string'||!c.text.trim()||c.text.length>800)throw new Error('Supply a follow-up of up to 800 characters.');
 if(s.calls>=s.callLimit)throw new Error('The model call budget is exhausted.');
 if(d.followups.length>=6||s.discussions.reduce((n,d)=>n+d.followups.length,0)>=20)throw new Error('This workday has reached its discussion follow-up limit.');
 const followup={id:randomUUID(),text:c.text.trim(),status:'queued',minute:s.minute,deliveredTo:[],deliveryEvents:[]};
 const candidate=s.discussions.map(item=>item===d?{...item,followups:[...item.followups,followup]}:item);
 if(Buffer.byteLength(JSON.stringify(candidate.flatMap(d=>d.followups)))>16000||Buffer.byteLength(JSON.stringify(candidate))>40000)throw new Error('This workday has reached its follow-up context limit.');
 d.followups.push(followup);
}
// Reading the owner's inspector is not delivery to an agent. Only actual owner
// speech at a subsequent exchange can relay a requested agenda.
export function discussionPlan(s,job){
 const threadId=job.threadId||s.activeThreadId;const owner=job.participants.includes('player');
 const matching=(s.discussions||[]).find(d=>d.key===key(threadId,job.participants,job.agenda||''));
 const followups=matching?.followups.filter(f=>f.status==='queued'&&(owner||matching.participants.every(id=>f.deliveredTo.includes(id))))||[];
 const relays=owner?(s.discussions||[]).filter(d=>d.threadId===threadId&&!d.participants.includes('player')).flatMap(d=>d.followups.filter(f=>f.status==='queued'&&d.participants.some(id=>job.participants.includes(id)&&!f.deliveredTo.includes(id))).map(f=>({discussionId:d.id,followupId:f.id,text:f.text,topic:d.title,participants:d.participants,recipients:d.participants.filter(id=>job.participants.includes(id)&&!f.deliveredTo.includes(id))}))):[];
 return {discussionId:matching?.id,followups:followups.slice(0,2).map(f=>({id:f.id,text:f.text})),relays:relays.slice(0,2)};
}
export function discussionOwnerSpeech(plan){
 return [...plan.followups.map(f=>`My owner asks us to revisit: ${f.text}`),...plan.relays.map(r=>`For your next discussion about ${r.topic} with ${r.participants.join(', ')}, my owner asks: ${r.text}`)].join('\n');
}
export function recordDiscussion(s,job,e,result){
 ensureDiscussions(s);const k=key(e.threadId,job.participants,job.agenda||'');let d=s.discussions.find(d=>d.key===k);
 if(!d){d={id:randomUUID(),key:k,threadId:e.threadId,participants:[...job.participants],agenda:job.agenda||'',title:(job.agenda||s.project?.title||'Office exchange').slice(0,100),exchanges:[],followups:[]};s.discussions.push(d);}
 e.discussionId=d.id;d.exchanges.push(structuredClone(e));d.exchanges=d.exchanges.slice(-3);d.summary=(e.turns||[]).map(t=>`${t.agentId}: ${t.text}`).join('\n').slice(0,1200);d.minute=s.minute;
 const plan=job.discussionPlan;
 if(plan&&result.discussionCommunication===true){
  for(const relay of plan.relays){const source=s.discussions.find(x=>x.id===relay.discussionId);const f=source?.followups.find(f=>f.id===relay.followupId&&f.status==='queued');if(f){f.deliveredTo=[...new Set([...f.deliveredTo,...relay.recipients])];f.deliveryEvents.push(e.id);}}
  if(plan.discussionId===d.id)for(const item of plan.followups){const f=d.followups.find(f=>f.id===item.id&&f.status==='queued');if(f){f.status='discussed';f.discussedEventId=e.id;f.discussedMinute=s.minute;}}
 }
 // A retained exchange is exact; eviction is explicit and never points to a
 // different conversation. Preserve pending steering even if transcript ages out.
 while(s.discussions.length>24){const index=s.discussions.findIndex(d=>!d.followups.some(f=>f.status==='queued'));if(index<0)break;s.discussions.splice(index,1);}
 while(Buffer.byteLength(JSON.stringify(s.discussions))>40000){const oldest=s.discussions.filter(d=>d.exchanges.length).sort((a,b)=>a.exchanges[0].minute-b.exchanges[0].minute)[0];if(oldest){oldest.exchanges.shift();continue;}const summary=s.discussions.find(d=>d.summary);if(summary){summary.summary='';continue;}const removable=s.discussions.findIndex(d=>!d.followups.some(f=>f.status==='queued'));if(removable<0)break;s.discussions.splice(removable,1);}
}
export function finishDiscussions(s){for(const d of s.discussions||[])for(const f of d.followups)if(f.status==='queued')f.status='unaddressed';}
