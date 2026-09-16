import {createHash,randomUUID} from 'node:crypto';
const text=(v,max=500)=>{if(typeof v!=='string'||v.length>max)throw new Error('Invalid action assessment.');return v.trim()};
export function validateAssessment(raw){
 const v=JSON.parse(raw.replace(/^```(?:json)?\s*/,'').replace(/\s*```$/,''));
 if(!['research','discussion'].includes(v.kind)||!['none','clarification','decision','permission'].includes(v.questionKind)||typeof v.resolvesQuestion!=='boolean'||!Array.isArray(v.assumptions)||v.assumptions.length>4)throw new Error('Invalid action assessment.');
 const r={action:text(v.action),kind:v.kind,reason:text(v.reason),question:text(v.question),questionKind:v.questionKind,blockedAction:text(v.blockedAction),resolvesQuestion:v.resolvesQuestion,assumptions:v.assumptions.map(x=>text(x,250))};
 // A research question is not a human escalation when the model explicitly says none.
 if(r.questionKind==='none'&&!r.blockedAction){if(['research','discussion'].includes(r.action.toLowerCase())&&r.question)r.action=(r.kind==='research'?'Investigate: ':'Discuss: ')+r.question;r.question='';}
 if(/^(?:wait|await)\b/i.test(r.action)||(/^ask\b/i.test(r.action)&&!/(?:coworker|colleague|Maya|Ellis|Jules|Theo)/i.test(r.action)))throw new Error('Next action must progress work, not ask or await the human question.');
 if(!r.action||!r.reason||(r.questionKind==='none'&&(r.question||r.blockedAction))||(r.questionKind!=='none'&&!r.question)||(['decision','permission'].includes(r.questionKind)&&!r.blockedAction)||(r.blockedAction&&r.blockedAction.toLowerCase()===r.action.toLowerCase()))throw new Error('Invalid action dependency.');
 return r;
}
const key=(title,kind,revision)=>createHash('sha256').update(`${revision}:${kind}:${title.toLowerCase().replace(/\s+/g,' ').trim()}`).digest('hex').slice(0,16);
export function applyAssessment(p,assessment,{fromUser=false,scopeChanged=false}={}){
 p.actions??=[];p.questions??=[];
 if(scopeChanged){for(const q of p.questions.filter(q=>q.status==='open'))q.status='superseded';for(const a of p.actions.filter(a=>['ready','running','blocked'].includes(a.status)))a.status='superseded';}
 let question=p.questions.findLast(q=>q.status==='open');
 if(fromUser&&assessment.resolvesQuestion&&question){question.status='resolved';for(const a of p.actions.filter(a=>a.questionId===question.id&&a.status==='blocked'))a.status='ready';question=null;}
 if(assessment.question){
  if(!question){question={id:randomUUID(),text:assessment.question,kind:assessment.questionKind,reason:assessment.reason,status:'open',revision:p.revision};p.questions.push(question);}
  // Keep the existing question stable until explicitly answered or superseded.
  if(assessment.blockedAction){const id=key(assessment.blockedAction,'dependent',p.revision);if(!p.actions.some(a=>a.id===id))p.actions.push({id,title:assessment.blockedAction,kind:'dependent',status:'blocked',questionId:question.id,reason:assessment.reason,revision:p.revision});}
 }
 const id=key(assessment.action,assessment.kind,p.revision);let action=p.actions.find(a=>a.id===id);
 if(!action){action={id,title:assessment.action,kind:assessment.kind,status:'ready',attempts:0,reason:assessment.reason,assumptions:assessment.assumptions,revision:p.revision};p.actions.push(action);}
 p.currentActionId=id;p.assessment=assessment;p.waiting=Boolean(question);p.question=question?.text||'';p.nextStep=action.title;
 // Retain open dependencies preferentially within the session-sized ledger.
 p.actions=[...p.actions.filter(a=>a.status!=='blocked').slice(-16),...p.actions.filter(a=>a.status==='blocked').slice(-8)];
 p.questions=[...p.questions.filter(q=>q.status!=='open').slice(-8),...p.questions.filter(q=>q.status==='open').slice(-4)];
 return action;
}
export function finishAction(s,job,result){
 const a=s.project?.actions?.find(a=>a.id===job.actionId);if(!a)return;
 a.attempts=(a.attempts||0)+1;
 const successful=!result.error&&(job.kind!=='research'||result.sources?.length>0);
 a.status=successful?'completed':a.attempts>=2?'deferred':'ready';
 if(a.status==='deferred'&&s.project)s.project.dirty=true;
 a.outcome=successful?'Completed; findings are available for synthesis.':a.status==='deferred'?'Two attempts yielded no usable evidence. Choose another approach.':'No usable result yet; reconsider the approach before retrying.';
}
