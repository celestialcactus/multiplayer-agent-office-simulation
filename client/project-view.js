import {renderMarkdown} from './markdown.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function conversationView(state,draft){
 const p=state.project;
 if(!p)return '<p>Start a fresh office to use the working brief and agent conversation.</p>';
 const disabled=state.status==='complete'||state.calls>=state.callLimit;
 return '<div class="agent-thread" aria-label="Conversation with your agent">'+
 (p.messages.length?p.messages.map(m=>'<article class="chat-message '+m.role+'"><strong>'+esc(m.role==='user'?'You':state.agents[0].name)+'</strong><div>'+renderMarkdown(m.text)+'</div></article>').join(''):'<p class="empty">Your agent is reviewing the starting brief. You can add context now.</p>')+
 (p.pending?'<p class="field-note" role="status">Your agent is updating its understanding…</p>':'')+
 '</div>'+(p.waiting?'<div class="context-question"><strong>Your context is needed</strong><p>'+esc(p.question)+'</p></div>':'')+
 '<form id="agent-message-form"><label for="agent-message">Talk to your agent</label><textarea id="agent-message" maxlength="2000" required '+(disabled?'disabled':'')+' placeholder="Add context, correct an assumption, ask a question, or change what we should work on.">'+esc(draft)+'</textarea><p class="field-note">Project context here can inform coworker exchanges and research. Keep personal information in your private profile notes.</p><button class="btn primary full" '+(disabled?'disabled':'')+'>Send message</button></form>';
}
export function briefView(state){
 const p=state.project;if(!p)return '<p>Start a fresh office to use a living brief.</p>';
 return '<p class="field-note">One evolving draft. Tell your agent what to revise in the conversation.</p><div class="report-body living-brief">'+renderMarkdown(p.markdown)+'</div><button class="btn full" id="download-brief">Download current brief</button>';
}
