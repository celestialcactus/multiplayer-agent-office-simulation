import {renderMarkdown} from './markdown.js';

const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function reportPages(state,markdown){
 const player=state.agents.find(a=>a.id==='player')||state.agents[0];
 const agents=[player,...state.agents.filter(a=>a.id!==player.id)];
 return agents.map(agent=>{
  const personal=agent.id===player.id;
  const notes=state.outputs.filter(o=>o.agentId===agent.id);
  const sections=notes.map((o,index)=>`### Research note ${index+1}\n\n${o.superseded?'**Historical note — superseded by later context.**\n\n':''}${o.text}\n\nContributors: ${(o.contributors||[]).map(id=>state.agents.find(a=>a.id===id)?.name||id).join(', ')}\n\n${(o.sources||[]).map(s=>`- ${s.title}: ${s.url}`).join('\n')}`);
  const open=state.ideas.filter(i=>!i.superseded&&i.knownBy.includes('player')&&i.knownBy.includes(agent.id)&&i.status!=='researched');
  return {name:agent.name,personal,role:agent.role,markdown:[
   personal?markdown.split('\n## Research outputs')[0]:'',
   ...(personal&&state.deliverables?.length?['## Generated collateral — unexecuted and unverified',...state.deliverables.map(d=>`### ${d.title} · revision ${d.version}${d.superseded?' — historical draft':''}\n\n${d.content}`)]:[]),
   ...(personal&&state.contributions?.length?['## Collaboration decisions',...state.contributions.map(c=>`- ${state.agents.find(a=>a.id===c.fromAgentId)?.name||c.fromAgentId}: ${c.status} — ${c.decisionReason}`)]:[]),
   '## Research learnings',...sections,...(!notes.length?['No research notes were completed by this agent during this workday.']:[]),
   '## Open ideas',open.length?open.map(i=>'- '+i.text).join('\n'):'No open ideas recorded.'
  ].filter(Boolean).join('\n\n')};
 });
}

export function showPagedReport(dialog,state,report,mode){
 const pages=reportPages(state,report.markdown);let index=0;
 dialog.classList.add('agent-report-dialog');
 dialog.setAttribute('aria-label','Agent workday reports');
 dialog.addEventListener('close',()=>{dialog.classList.remove('agent-report-dialog');dialog.removeAttribute('aria-label');},{once:true});
 function render(focus=false){
  const page=pages[index];
  dialog.innerHTML=`<div class="dialog-head"><h2>Workday reports</h2><button class="close" aria-label="Close report">×</button></div>
   <div class="report-navigation"><label for="report-agent">Agent report</label><select id="report-agent">${pages.map((p,i)=>`<option value="${i}" ${i===index?'selected':''}>${esc(p.name)}${p.personal?' · Your agent':''}</option>`).join('')}</select>
   <nav aria-label="Report pages"><button class="btn" id="report-prev" ${index===0?'disabled':''}>← Previous</button><span role="status">${index+1} of ${pages.length}</span><button class="btn" id="report-next" ${index===pages.length-1?'disabled':''}>Next →</button></nav></div>
   <section class="agent-report-content" tabindex="0" aria-label="${esc(page.name)} report"><h3>${esc(page.name)}${page.personal?' · Your agent':''}</h3><p class="field-note">${esc(page.role)} · ${mode==='demo'?'Scripted demonstration':'Findings require your review'}</p><div class="report-body">${renderMarkdown(page.markdown)}</div></section>
   <button class="btn primary full" id="download">Download all agent reports</button>`;
  dialog.querySelector('.close').onclick=()=>dialog.close();
  const change=n=>{index=n;render(true);};
  dialog.querySelector('#report-agent').onchange=e=>change(Number(e.target.value));
  dialog.querySelector('#report-prev').onclick=()=>change(index-1);
  dialog.querySelector('#report-next').onclick=()=>change(index+1);
  dialog.querySelector('#download').onclick=()=>{const url=URL.createObjectURL(new Blob([report.markdown],{type:'text/markdown'}));const a=document.createElement('a');a.href=url;a.download='agent-office-report.md';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);};
  if(focus)dialog.querySelector('.agent-report-content').focus({preventScroll:true});
 }
 render();dialog.showModal();dialog.querySelector('.agent-report-content').scrollTop=0;
}
