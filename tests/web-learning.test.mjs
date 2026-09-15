import test from 'node:test';
import assert from 'node:assert/strict';
import {normalizeResults} from '../server/web-search.mjs';
import {newOffice,shareContext,completeJob} from '../domain/office.mjs';
import {Inference} from '../server/inference.mjs';
const profile={name:'Owner',role:'Product lead',persona:'Evidence focused',interests:'Accessible onboarding',intent:'Reduce keyboard-only signup abandonment without removing identity checks',privateNotes:'PRIVATE-CANARY'};
test('web index preserves source provenance and distinguishes empty results from failure',()=>{
 const result=normalizeResults({content:[{type:'text',text:JSON.stringify({results:[{title:'Forms',url:'https://www.w3.org/WAI/tutorials/forms/',text:'Use labels',publishedDate:'2026-01-01'},{title:'Duplicate',url:'https://www.w3.org/WAI/tutorials/forms/',text:'duplicate'},{title:'unsafe',url:'javascript:alert(1)',text:'x'},{title:null,url:null,text:'uncited fact'}]})}]});
 assert.equal(result.length,1);assert.equal(result[0].provider,'aws-web-index');assert.equal(result[0].publishedDate,'2026-01-01');assert(result[0].retrievedAt);assert.deepEqual(normalizeResults({structuredContent:{results:[]}}),[]);assert.throws(()=>normalizeResults({isError:true}),/failed/);assert.throws(()=>normalizeResults({structuredContent:{unexpected:true}}),/invalid/);
});
test('intent and conversation memory respect participant boundaries across checkpoints',()=>{
 const s=newOffice(profile);assert(s.ideas[0].text.includes(profile.intent));assert(!JSON.stringify(shareContext(s,'credit')).includes(profile.intent));
 const job={id:'talk',kind:'encounter',generation:0,participants:['player','designer']};s.job=job;completeJob(s,job,{turns:[{agentId:'player',text:profile.intent,researchIds:[]},{agentId:'designer',text:'Test keyboard focus order.',researchIds:[]}]});
 const copy=structuredClone(s);assert.equal(shareContext(copy,'designer').recentExchanges.length,1);assert.equal(shareContext(copy,'credit').recentExchanges.length,0);assert(!JSON.stringify(shareContext(copy,'designer')).includes(profile.privateNotes));
});
test('research synthesis receives prior learning, intent, and new evidence without private notes',async()=>{
 const s=newOffice(profile,{mode:'bedrock'}),idea=s.ideas[0];s.outputs.push({id:'earlier',agentId:'player',ideaId:idea.id,scope:'shareable',mode:'bedrock',text:'Earlier hypothesis: test focus order.',sources:[],contributors:['player']});
 const prompts=[],answers=[JSON.stringify({ideaId:idea.id}),'accessible forms keyboard focus W3C','Evidence: Labels support navigation [1]. What changed: test labels alongside focus order. Implication: preserve identity checks. Next test: compare completion rates.'];
 answers.push(answers.at(-1));const i=new Inference({mode:'bedrock',modelId:'mock',client:{send:async c=>{prompts.push(JSON.parse(c.input.messages[0].content[0].text));return {output:{message:{content:[{text:answers.shift()}]}}}}},researcher:async()=>[{id:1,title:'Forms',url:'https://www.w3.org/WAI/tutorials/forms/',excerpt:'Labels support navigation.'}]});
 await i.execute(s,{kind:'research',participants:['player'],candidates:[idea.id]},async()=>{});
 assert.equal(prompts[2].memory.intent,profile.intent);assert.equal(prompts[2].memory.research[0].outputId,'earlier');assert(!JSON.stringify(prompts.slice(1)).includes(profile.privateNotes));assert(prompts[2].sources.length);
});
