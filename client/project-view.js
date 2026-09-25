import {renderMarkdown} from './markdown.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function conversationView(state,draft){
 const p=state.project;
 if(!p)return '<p>Start a fresh office to use the working brief and agent conversation.</p>';
 const disabled=state.status==='complete'||state.calls>=state.callLimit;
 return '<div class="agent-thread" role="region" tabindex="0" aria-label="Conversation with your agent">'+
 (p.messages.length?p.messages.map(m=>'<article class="chat-message '+m.role+'"><strong>'+esc(m.role==='user'?'You':state.agents[0].name)+'</strong><div>'+renderMarkdown(m.text)+'</div>'+((m.forkAvailable&&state.capabilities?.includes('forks-v1')&&!disabled)?'<button class="btn ghost fork-action" data-fork-message="'+esc(m.id)+'" title="Create a branch through this message">↳ Fork here</button>':m.forkUnavailableReason==='size'?'<p class="field-note">Larger forks are out of scope for this workday. They will need larger sessions and persistence.</p>':'')+'</article>').join(''):'<p class="empty">Your agent is reviewing the starting brief. You can add context now.</p>')+
 (p.pending?'<p class="field-note" role="status">Your agent is updating its understanding…</p>':'')+
 '</div><button class="btn chat-latest" id="chat-latest" hidden>Jump to latest ↓</button>'+
 '<form id="agent-message-form"><label for="agent-message">Reply to '+esc(p.title||'this thread')+'</label><textarea id="agent-message" maxlength="2000" required '+(disabled?'disabled':'')+' placeholder="Add context, correct an assumption, ask a question, or change what we should work on.">'+esc(draft)+'</textarea><p class="field-note">Messages apply to this conversation and its coworker exchanges. Project context in Settings applies across threads.</p><button class="btn primary full" '+(disabled?'disabled':'')+'>Send message</button></form>';
}
export function briefView(state){
 const p=state.project;if(!p)return '<p>Start a fresh office to use a living brief.</p>';
 return artifactView(state)+'<p class="field-note">One evolving draft. Tell your agent what to revise in the conversation.</p><div class="report-body living-brief">'+renderMarkdown(p.markdown)+'</div><button class="btn full" id="download-brief">Download current brief</button>';
}

export function workStatusView(state){
 const p=state.project;if(!p)return '';
 const a=p.actions?.find(a=>a.id===p.currentActionId),q=p.questions?.findLast(q=>q.status==='open');
 const held=(p.actions||[]).filter(a=>a.status==='blocked'&&a.questionId===q?.id);
 const label=state.status==='complete'?'Latest work':state.status==='paused'?'Current plan · paused':p.pending?'Updating the plan':a?.status==='running'?'Working on':a?.status==='deferred'?'Changing approach':'Next action';
 return '<section class="work-narration" aria-label="Work plan"><strong>'+label+'</strong><p>'+esc(a?.title||p.nextStep)+'</p>'+(a?.reason?'<p class="field-note">'+esc(a.reason)+'</p>':'')+(a?.assumptions?.length?'<details><summary>Working assumptions</summary><ul>'+a.assumptions.map(x=>'<li>'+esc(x)+'</li>').join('')+'</ul></details>':'')+(q?'<div class="context-question"><strong>'+(held.length?(q.kind==='permission'?'Permission needed for one action':'Your input unlocks one action'):'A question, when convenient')+'</strong><p>'+esc(q.text)+'</p><p class="field-note">'+esc(q.reason)+'</p>'+(held.length?'<p><b>On hold:</b> '+held.map(a=>esc(a.title)).join('; ')+'</p>':'')+'<p class="field-note">Work on the idea can continue. Reply in Your agent to steer it.</p></div>':'')+'</section>';
}

export function ideaTitle(idea){
 const text=String(idea.title||idea.text||'Untitled idea').replace(/\s+/g,' ').trim();
 const opening=text.split(/[.!?](?:\s|$)|;/)[0];
 const words=opening.split(' ');let title=words.slice(0,10).join(' ');
 if(title.length>78)title=title.slice(0,78).replace(/\s+\S*$/,'');
 return title+(title.length<opening.length?'…':'');
}

export function artifactView(s){
 if(!s.capabilities?.includes('artifacts-v1'))return '';
 const kinds=s.agents[0].artifactCapabilities||['research','brief'];
 const jobs=(s.artifactRequests||[]).filter(a=>a.threadId===s.project.id);
 const artifacts=(s.deliverables||[]).filter(a=>a.threadId===s.project.id);
 return `<section class="artifact-shelf"><h3>Create a deliverable</h3><p class="field-note">Your agent owns the final draft. All outputs need your review; code is unexecuted and untested.</p><div class="thread-actions">${['brief','diagram','code'].map(kind=>`<button class="btn" data-generate="${kind}" ${!kinds.includes(kind)||s.status==='complete'||s.calls>=s.callLimit||jobs.some(j=>j.kind===kind&&['queued','processing'].includes(j.status))?'disabled':''}>${{brief:'Written brief',diagram:'Architecture diagram',code:'Code draft'}[kind]}</button>`).join('')}</div>${jobs.filter(j=>j.status!=='completed').map(j=>`<p role="status">${esc(j.kind)} · ${esc(j.status)} ${esc(j.error||'')}</p>`).join('')}${artifacts.map(a=>`<details class="artifact-card" open><summary>${esc(a.title)} · v${esc(a.version||1)}</summary><p class="field-note">Generated by your agent · Unverified${a.kind==='code'?' · Not executed or tested':''}</p>${a.kind==='diagram'?`<div class="diagram-render" data-diagram="${esc(a.id)}" role="img" aria-label="${esc(a.title)}">Rendering diagram…</div>`:''}<div class="report-body">${renderMarkdown(a.content)}</div><button class="btn" data-download-artifact="${esc(a.id)}">Download draft</button></details>`).join('')}</section>`;
}
