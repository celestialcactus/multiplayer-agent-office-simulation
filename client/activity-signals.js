// Presentation uses committed work and speech only; it never invokes inference.
export function activitySignals(state){
 if(!state)return [];
 const signals=[];
 const work=state.work;
 if(work&&state.status==='running'){
  const agentId=work.participants?.[0];
  if(agentId){
   const labels={guidance:'Connecting findings',research:'Researching a question',artifact:'Preparing a deliverable',meeting:'In a focused discussion',encounter:'Exchanging ideas'};
   signals.push({id:'work:'+work.threadId+':'+work.kind,agentId,kind:'work',threadId:work.threadId,label:labels[work.kind]||'Working',detail:state.threads?.find(t=>t.id===work.threadId)?.title||'Current work'});
  }
 }
 const exchange=[...(state.events||[])].reverse().find(e=>e.turns?.length&&!e.superseded);
 if(exchange&&(!Number.isFinite(state.minute)||state.minute-(exchange.minute||0)<=30)){
  const speaker=exchange.turns.find(t=>t.agentId!==signals[0]?.agentId)||exchange.turns[0];
  if(speaker&&speaker.agentId!==signals[0]?.agentId)signals.push({id:exchange.id,agentId:speaker.agentId,kind:'exchange',eventId:exchange.id,threadId:exchange.threadId,label:'Recent exchange',detail:speaker.text||exchange.title});
 }
 return signals.slice(0,2);
}
