const esc=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function findExchange(state,eventId){return state.events?.find(e=>e.id===eventId&&e.turns?.length)||(state.discussions||[]).flatMap(d=>d.exchanges||[]).find(e=>e.id===eventId);}
export function followupLabel(discussion,followup){
 if(followup.status==='discussed')return 'Discussed in a later exchange';
 if(followup.status==='unaddressed')return 'Unaddressed when the workday ended';
 if(!discussion.participants.includes('player')&&discussion.participants.some(id=>!(followup.deliveredTo||[]).includes(id)))return 'Queued · your agent still needs to relay this';
 return 'Queued · awaiting the next matching discussion';
}
export function createExchangeInspector({getState,command,modal,openThread,openDiscussion,getContainer=()=>document.querySelector('#modal'),isOpen=el=>el.open,onNavigate}){
 let timer;
 return function show(eventId){
  clearInterval(timer);onNavigate?.(eventId);
  const state=getState(),event=findExchange(state,eventId);
  const activity=state.events?.find(e=>e.id===eventId);
  if(!event&&activity){
   const output=state.outputs?.find(o=>o.id===activity.outputId);
   modal(`<section class="exchange-inspector"><div class="eyebrow">${esc(activity.kind)}</div><h2>${esc(activity.title)}</h2><p>${esc(activity.text)}</p>${output?.sources?.length?`<h3>Sources</h3>${output.sources.filter(s=>/^https?:\/\//i.test(s.url)).map(s=>`<p><a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title)}</a></p>`).join('')}`:''}<button class="btn" id="activity-thread">Open related work thread</button></section>`);
   getContainer().querySelector('#activity-thread').onclick=()=>{getContainer().close?.();openThread(activity.threadId);};return;
  }
  if(!event){modal('<h2>Exchange no longer retained</h2><p>This workday keeps bounded discussion history. The exact exchange is no longer available; no other conversation has been substituted.</p>');return;}
  const discussion=(state.discussions||[]).find(d=>d.threadId===event.threadId&&(d.id===event.discussionId||d.exchanges?.some(e=>e.id===event.id)));
  const name=id=>state.agents.find(a=>a.id===id)?.name||id;
  const sourceLinks=notes=>[...new Map((notes||[]).flatMap(n=>n.sources||[]).filter(s=>/^https?:\/\//i.test(s.url)).map(s=>[s.url,s])).values()].map(s=>`<a href="${esc(s.url)}" target="_blank" rel="noopener noreferrer">${esc(s.title||s.url)}</a>`).join(' · ');
  const history=discussion?.exchanges||[event];
  const canQueue=discussion&&state.capabilities?.includes('discussions-v1')&&['running','paused'].includes(state.status)&&state.calls<state.callLimit;
  const route=discussion?.participants.includes('player')?'Your agent will bring this agenda to the next matching discussion.':'Your agent must first relay this agenda to these coworkers in actual encounters. It can then shape their next matching discussion.';
  modal(`<section class="exchange-inspector" data-inspected-exchange="${esc(event.id)}"><div class="eyebrow">RECORDED OFFICE EXCHANGE</div><h2>${esc(event.title||'Office discussion')}</h2><p>${esc((event.participants||[...new Set(event.turns.map(t=>t.agentId))]).map(name).join(' · '))} · ${Math.floor(event.minute||0)} minutes into the day</p>${event.agenda?`<p><strong>Agenda:</strong> ${esc(event.agenda)}</p>`:''}<p class="field-note">This is the recorded exchange, not a new live chat. Inspection does not share its contents with your agent.</p><div>${event.turns.map(t=>`<article class="exchange-turn"><strong>${esc(name(t.agentId))}${t.kind==='owner-agenda'?' · owner agenda':''}</strong><p>${esc(t.text)}</p><div class="field-note">${sourceLinks(t.researchNotes)}</div></article>`).join('')}</div><div class="discussion-history" aria-label="Recent exchanges in this discussion">${history.length>1?history.map((e,i)=>`<button class="btn ${e.id===event.id?'active':''}" data-history-event="${esc(e.id)}">Exchange ${i+1}${e.id===event.id?' · selected':''}</button>`).join(''):''}</div>${openDiscussion?'<button class="btn primary" id="exchange-focus">Open discussion in chat</button>':''}<button class="btn" id="exchange-thread">Open related work thread</button><h3>Follow-up agenda</h3><p class="route-note">${esc(route)} This stays within this workday and does not interrupt current work or guarantee another meeting.</p><div id="discussion-followups" aria-live="polite"></div>${canQueue?'<form id="discussion-followup-form"><label for="discussion-followup">What should your agent bring to a later discussion?</label><textarea id="discussion-followup" maxlength="800" placeholder="For example: Next time, compare screen-reader navigation as well."></textarea><button class="btn primary full" type="submit">Queue through your agent</button><p class="field-note">Your agenda will be communicated to the discussion participants.</p><p id="discussion-feedback" role="status"></p></form>':`<p class="field-note">${discussion?'The workday is read-only or its call budget is exhausted.':'Follow-ups are available for exchanges recorded by the updated runtime. This historical exchange is read-only.'}</p>`}</section>`);
  const dialog=getContainer();
  if(openDiscussion)dialog.querySelector('#exchange-focus').onclick=()=>{dialog.close?.();openDiscussion(event.id)};
  dialog.querySelector('#exchange-thread').onclick=()=>{dialog.close?.();openThread(event.threadId);};
  dialog.querySelectorAll('[data-history-event]').forEach(button=>button.onclick=()=>show(button.dataset.historyEvent));
  let lastStatus='';
  const refresh=()=>{
   if(!isOpen(dialog)||!dialog.querySelector(`[data-inspected-exchange]`)){clearInterval(timer);return;}
   const current=(getState().discussions||[]).find(d=>d.id===discussion?.id)||discussion;
   const rows=(current?.followups||[]).map(f=>`<article class="followup-item"><strong>${esc(followupLabel(current,f))}</strong><p>${esc(f.text)}</p>${f.discussedEventId?`<button class="btn" data-followup-result="${esc(f.discussedEventId)}">Inspect resulting exchange</button>`:''}</article>`).join('')||'<p class="field-note">No follow-up agendas yet.</p>';
   if(rows!==lastStatus){lastStatus=rows;dialog.querySelector('#discussion-followups').innerHTML=rows;dialog.querySelectorAll('[data-followup-result]').forEach(b=>b.onclick=()=>show(b.dataset.followupResult));}
   if(!['running','paused'].includes(getState().status)||getState().calls>=getState().callLimit){const form=dialog.querySelector('#discussion-followup-form');if(form){for(const el of form.querySelectorAll('button,textarea'))el.disabled=true;dialog.querySelector('#discussion-feedback').textContent='This workday has ended. Pending agendas are listed above.';}}
  };
  refresh();timer=setInterval(refresh,1500);dialog.addEventListener('close',()=>clearInterval(timer),{once:true});
  const form=dialog.querySelector('#discussion-followup-form');
  if(form)form.onsubmit=async e=>{
   e.preventDefault();const field=form.querySelector('textarea'),text=field.value.trim();if(!text)return;const button=form.querySelector('button');button.disabled=true;
   try{const result=await command('queueDiscussionFollowup',{discussionId:discussion.id,text});if(result){field.value='';dialog.querySelector('#discussion-feedback').textContent='Agenda queued through your agent.';refresh();}}
   finally{button.disabled=!['running','paused'].includes(getState().status)||getState().calls>=getState().callLimit;}
  };
 };
}
