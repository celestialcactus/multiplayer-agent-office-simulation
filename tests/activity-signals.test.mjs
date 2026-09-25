import test from 'node:test';
import assert from 'node:assert/strict';
import {activitySignals} from '../client/activity-signals.js';

test('office signals point to actual work and the exact last exchange, without mutating state',()=>{
 const s={status:'running',work:{threadId:'a',kind:'research',participants:['player']},threads:[{id:'a',title:'Accessibility'}],events:[{id:'talk-1',threadId:'b',turns:[{agentId:'designer',text:'Test keyboard navigation.'}]}]};
 const before=JSON.stringify(s),signals=activitySignals(s);
 assert.equal(signals[0].threadId,'a');assert.equal(signals[1].eventId,'talk-1');assert.equal(signals[1].threadId,'b');assert.equal(JSON.stringify(s),before);
});
test('paused/ended office never displays a thinking indicator and superseded exchanges stay hidden',()=>{
 const s={status:'paused',work:{kind:'research',threadId:'a',participants:['player']},events:[{id:'old',superseded:true,turns:[{agentId:'designer',text:'Obsolete'}]}]};
 assert.deepEqual(activitySignals(s),[]);s.status='complete';assert.deepEqual(activitySignals(s),[]);
});
