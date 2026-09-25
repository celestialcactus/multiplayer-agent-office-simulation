import test from 'node:test';
import assert from 'node:assert/strict';
import {threadStatus} from '../client/workspace.js';

test('workspace distinguishes actual processing from queued work on another thread',()=>{
 const state={status:'running',work:{kind:'guidance',threadId:'one'},artifactRequests:[]};
 assert.equal(threadStatus(state,{id:'one',pending:true}).label,'Processing');
 assert.equal(threadStatus(state,{id:'two',pending:true}).label,'Queued');
 assert.equal(threadStatus(state,{id:'three'}).label,'Exploring');
});
test('workspace distinguishes an input request from completion and unread updates',()=>{
 const thread={id:'one',questions:[{status:'open'}]};
 assert.equal(threadStatus({status:'running'},thread).label,'Input requested');
 assert.equal(threadStatus({status:'paused'},thread).label,'Paused');
 assert.equal(threadStatus({status:'complete'},thread).label,'Day ended');
});
test('queued artifact generation is visible before model processing starts',()=>{
 const state={status:'running',artifactRequests:[{threadId:'one',status:'queued'}]};
 assert.equal(threadStatus(state,{id:'one'}).label,'Queued');
 assert.equal(threadStatus(state,{id:'two'}).label,'Exploring');
});
