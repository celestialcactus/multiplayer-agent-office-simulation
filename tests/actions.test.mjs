import test from 'node:test';
import assert from 'node:assert/strict';
import {applyAssessment,validateAssessment} from '../domain/actions.mjs';
import {newOffice,tick,completeJob,applyCommand,shareContext} from '../domain/office.mjs';
import {applyGuidance} from '../domain/project.mjs';
import {workStatusView} from '../client/project-view.js';
const profile={name:'Test',role:'Designer',persona:'Pragmatic',interests:'Compare team structures'};
const plan=(extra={})=>({action:'Compare public team structure patterns',kind:'research',reason:'We can compare trade-offs before selecting a structure.',assumptions:['Treat team size as an unresolved variable.'],question:'What is the team size?',questionKind:'clarification',blockedAction:'',resolvesQuestion:false,...extra});
const result=(assessment)=>({assessment,contextChanged:false,needsInput:!!assessment.question,question:assessment.question,nextStep:assessment.action,reply:'I will compare alternatives.',brief:{summary:profile.interests,objective:'Understand trade-offs',facts:[],constraints:[],hypotheses:[],unknowns:['Team size']},artifact:{proposal:'Compare options',test:'Review examples',successCriteria:'Not agreed',evidenceIds:[]}});
test('optional context retains same-idea research without blocked actions',()=>{
 const s=newOffice(profile,{now:0});completeJob(s,tick(s,1000),result(plan()));
 assert(s.project.waiting);assert(!s.project.actions.some(a=>a.status==='blocked'));
 const job=tick(s,6000);assert.equal(job.kind,'research');assert.equal(job.actionId,s.project.currentActionId);assert.equal(s.project.actions[0].status,'running');
 assert.equal(shareContext(s,'credit').project,null);
});
test('a real dependency blocks only the named action and survives unrelated steering',()=>{
 const s=newOffice(profile,{now:0});applyGuidance(s,result(plan({questionKind:'decision',blockedAction:'Select a permanent team structure'})));
 const id=s.project.questions[0].id;assert.equal(s.project.actions.filter(a=>a.status==='blocked').length,1);
 applyCommand(s,{type:'message',commandId:'a',text:'Focus on accessibility.'},1000);
 applyGuidance(s,{...result(plan({question:'',questionKind:'none',action:'Compare accessible collaboration practices'})),contextChanged:true});
 assert.equal(s.project.questions.find(q=>q.status==='open').id,id);assert(s.project.actions.some(a=>a.status==='blocked'));
 assert.equal(s.ideas.find(i=>i.projectTask).status,'queued');
});
test('only user input can resolve a dependency; automatic speculation cannot',()=>{
 const p={revision:1};applyAssessment(p,plan({questionKind:'decision',blockedAction:'Select a team structure'}));
 applyAssessment(p,plan({question:'',questionKind:'none',resolvesQuestion:true}));assert(p.waiting);
 applyAssessment(p,plan({question:'',questionKind:'none',resolvesQuestion:true}),{fromUser:true});assert(!p.waiting);assert.equal(p.questions[0].status,'resolved');assert(!p.actions.some(a=>a.status==='blocked'));
});
test('two unsuccessful attempts defer an action and synthesis does not reset it',()=>{
 const s=newOffice(profile,{now:0});completeJob(s,tick(s,1000),result(plan()));
 const job=tick(s,6000);completeJob(s,job,{ideaId:job.candidates[0],text:'No usable sources',sources:[]});
 applyGuidance(s,result(plan()));assert.equal(s.project.actions.find(a=>a.id===job.actionId).attempts,1);
 s.project.dirty=false;s.minute=30;s.lastActivity=10;s.nextEncounter=100;s.researchCursor=0;
 const retry=tick(s,11000);completeJob(s,retry,{ideaId:retry.candidates[0],text:'Still no usable sources',sources:[]});
 applyGuidance(s,result(plan()));assert.equal(s.project.actions.find(a=>a.id===job.actionId).status,'deferred');assert.equal(s.ideas.find(i=>i.projectTask).status,'deferred');
});
test('planned discussions execute through the office exchange mechanism',()=>{
 const s=newOffice(profile,{now:0});completeJob(s,tick(s,1000),result(plan({kind:'discussion',action:'Compare team coordination trade-offs with a coworker'})));
 const job=tick(s,6000);assert.equal(job.kind,'encounter');assert.equal(job.actionId,s.project.currentActionId);
 completeJob(s,job,{turns:job.participants.map(agentId=>({agentId,text:'Compare a concrete example.',researchIds:[]}))});assert.equal(s.project.actions.find(a=>a.id===job.actionId).status,'completed');
});
test('permission questions never create executable external actions',()=>{
 const p={revision:1};applyAssessment(p,plan({questionKind:'permission',question:'May I send the report?',blockedAction:'Send the report to the team'}));
 assert.equal(p.actions.find(a=>a.status==='blocked').kind,'dependent');
 assert.throws(()=>validateAssessment(JSON.stringify(plan({kind:'send_email'}))),/Invalid/);
 assert.throws(()=>validateAssessment(JSON.stringify(plan({questionKind:'decision',blockedAction:plan().action}))),/dependency/);
});
test('scope changes retire old dependencies and UI escapes question content',()=>{
 const s=newOffice(profile);applyGuidance(s,result(plan({question:'<script>bad()</script>',questionKind:'decision',blockedAction:'Pick a team'})));
 const html=workStatusView(s);assert(!html.includes('<script>'));assert(html.includes('On hold:'));assert(html.includes('Working assumptions'));
 applyAssessment(s.project,plan({question:'',questionKind:'none'}),{scopeChanged:true,fromUser:true});assert(!s.project.waiting);assert.equal(s.project.questions[0].status,'superseded');
});

test('steering releases an interrupted running action and discards its stale result',()=>{
 const s=newOffice(profile,{now:0});completeJob(s,tick(s,1000),result(plan()));const job=tick(s,6000);
 applyCommand(s,{type:'message',commandId:'redirect',text:'Prioritize collaboration costs.'},6001);
 assert.equal(s.project.actions.find(a=>a.id===job.actionId).status,'ready');
 completeJob(s,job,{ideaId:job.candidates[0],text:'Old result',sources:[]});assert.equal(s.outputs.length,0);
});

test('a research question classified as none is not escalated to the user',()=>{
 const r=validateAssessment(JSON.stringify(plan({action:'research',question:'Which onboarding patterns have public evidence?',questionKind:'none'})));
 assert.equal(r.question,'');assert(r.action.includes('onboarding patterns'));assert.equal(r.blockedAction,'');
});

test('asking or waiting for the owner cannot masquerade as an executable action',()=>{
 for(const action of ['Ask which customer segment to recruit','Wait for the owner response'])assert.throws(()=>validateAssessment(JSON.stringify(plan({action}))),/Next action/);
});

test('the announced action stays eligible when many newer shared ideas exist',()=>{
 const s=newOffice(profile,{now:0});completeJob(s,tick(s,1000),result(plan()));
 for(let i=0;i<12;i++)s.ideas.push({id:'shared'+i,text:'Another idea '+i,knownBy:['player'],status:'queued',attempts:0,contributors:['designer']});
 const job=tick(s,6000);assert.equal(job.actionId,s.project.currentActionId);assert.equal(job.candidates.length,1);
});
