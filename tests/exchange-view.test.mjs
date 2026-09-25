import test from 'node:test';
import assert from 'node:assert/strict';
import {findExchange,followupLabel} from '../client/exchanges.js';
test('exchange inspection selects the exact retained record and never substitutes another encounter',()=>{
 const a={id:'a',turns:[{text:'First'}]},b={id:'b',turns:[{text:'Second'}]};
 const state={events:[b],discussions:[{exchanges:[a]}]};
 assert.equal(findExchange(state,'a'),a);assert.equal(findExchange(state,'b'),b);assert.equal(findExchange(state,'missing'),undefined);
});
test('followup status distinguishes owner relay, matching discussion and unfinished work',()=>{
 const d={participants:['designer','backend']},f={status:'queued',deliveredTo:[]};
 assert.match(followupLabel(d,f),/relay/);f.deliveredTo=['designer','backend'];assert.match(followupLabel(d,f),/matching/);
 f.status='discussed';assert.match(followupLabel(d,f),/Discussed/);f.status='unaddressed';assert.match(followupLabel(d,f),/Unaddressed/);
});
