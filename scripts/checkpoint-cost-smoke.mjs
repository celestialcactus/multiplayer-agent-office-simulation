import {readFile,writeFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import assert from 'node:assert/strict';
import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient,GetCommand} from '@aws-sdk/lib-dynamodb';
const {PlayUrl:base,SessionTable:TableName}=JSON.parse(await readFile('.local/deployment.json'));
const {invite}=JSON.parse(await readFile('.local/deployment-secrets.json'));
const db=DynamoDBDocumentClient.from(new DynamoDBClient({}));let cookie,id;
async function request(path,body,method=body?'POST':'GET'){
 const r=await fetch(base+'/api/'+path,{method,headers:{Origin:base,...(cookie?{Cookie:cookie}:{}),...(body?{'Content-Type':'application/json'}:{})},body:body?JSON.stringify(body):undefined,signal:AbortSignal.timeout(65000)});
 if(!cookie){cookie=r.headers.get('set-cookie')?.split(';')[0];if(cookie)id=createHash('sha256').update(cookie.slice('office='.length)).digest('hex');}
 const data=await r.json();assert(r.ok,`HTTP ${r.status}: ${JSON.stringify(data)}`);return data;
}
const command=(type)=>request('session/commands',{type,commandId:crypto.randomUUID()});
const meta=async()=>(await db.send(new GetCommand({TableName,Key:{pk:'OFFICE#'+id,sk:'META'},ConsistentRead:true}))).Item;
async function observe(seconds){for(let i=0;i<seconds;i+=2){await request('session');await new Promise(r=>setTimeout(r,2000));}}
try{
 await request('sessions',{invite,name:'Checkpoint cost test',role:'Tester',persona:'Pragmatic',interests:'Compare public approaches to accessible onboarding.'});await command('pause');let s;
 for(let i=0;i<45;i++){s=await request('session');assert(s.calls<10);if(!s.busy&&!s.project.pending)break;await new Promise(r=>setTimeout(r,2000));}
 assert(!s.busy&&!s.project.pending);const pausedBefore=await meta();await observe(24);const pausedAfter=await meta();assert.equal(pausedAfter.version,pausedBefore.version,'Paused office rewrote its snapshot');assert(pausedAfter.leaseUntil>pausedBefore.leaseUntil,'Paused office lost lease renewal');
 await command('finish');const completeBefore=await meta();await observe(16);const completeAfter=await meta();assert.equal(completeAfter.version,completeBefore.version,'Completed office rewrote its snapshot');assert.equal(completeAfter.leaseUntil,completeBefore.leaseUntil,'Completed office kept renewing its lease');
 const report=await request('session/report');assert(report.markdown.length);const evidence={passed:true,verifiedAt:new Date().toISOString(),calls:s.calls,pausedObservationSeconds:24,pausedSnapshotWrites:0,pausedLeaseRenewed:true,completeObservationSeconds:16,completeSnapshotWrites:0,completeLeaseWrites:0,reportAvailable:true};await writeFile('.local/checkpoint-cost-evidence.json',JSON.stringify(evidence,null,2));console.log(JSON.stringify(evidence));
}finally{if(cookie){await request('session',undefined,'DELETE');console.log('Synthetic checkpoint test deleted.');}}
