import { mkdir,readFile,writeFile,rename,unlink } from 'node:fs/promises';
import { resolve } from 'node:path';
import { randomUUID } from 'node:crypto';
import { DynamoDBClient } from '@aws-sdk/client-dynamodb';
import { DynamoDBDocumentClient,GetCommand,QueryCommand,TransactWriteCommand,UpdateCommand } from '@aws-sdk/lib-dynamodb';
export class FileRepository{
 constructor(dir=resolve(process.env.OFFICE_MODE==='bedrock'?'.local/sessions-bedrock':'.local/sessions')){this.dir=dir}
 path(id){if(!/^[a-zA-Z0-9-]{20,80}$/.test(id))throw new Error('Invalid session identifier.');return resolve(this.dir,id+'.json')}
 async load(id){try{return JSON.parse(await readFile(this.path(id),'utf8'))}catch(e){if(e.code==='ENOENT')return null;throw e}}
 async save(s){await mkdir(this.dir,{recursive:true});const p=this.path(s.id),temp=p+'.tmp';await writeFile(temp,JSON.stringify(s));await rename(temp,p)}
 async delete(id){await unlink(this.path(id)).catch(e=>{if(e.code!=='ENOENT')throw e})}
}
export class MemoryRepository{constructor(){this.states=new Map()}async load(id){return structuredClone(this.states.get(id)||null)}async save(s){this.states.set(s.id,structuredClone(s))}async delete(id){this.states.delete(id)}}
export class DynamoRepository{
 constructor(table=process.env.SESSION_TABLE){this.table=table;this.owner=randomUUID();this.client=DynamoDBDocumentClient.from(new DynamoDBClient({region:process.env.AWS_REGION,maxAttempts:2}));this.versions=new Map()}
 async load(id){
   const key={pk:`OFFICE#${id}`,sk:'META'};const r=await this.client.send(new GetCommand({TableName:this.table,Key:key,ConsistentRead:true}));if(!r.Item||r.Item.expiresAt<=Date.now())return null;
   await this.client.send(new UpdateCommand({TableName:this.table,Key:key,UpdateExpression:'SET #owner = :owner, leaseUntil = :lease',ConditionExpression:'(attribute_not_exists(leaseUntil) OR leaseUntil < :now OR #owner = :owner) AND version = :version',ExpressionAttributeNames:{'#owner':'owner'},ExpressionAttributeValues:{':owner':this.owner,':lease':Date.now()+30000,':now':Date.now(),':version':r.Item.version}}));
   const chunks=await this.client.send(new QueryCommand({TableName:this.table,KeyConditionExpression:'pk = :pk AND begins_with(sk, :prefix)',ExpressionAttributeValues:{':pk':key.pk,':prefix':'CHUNK#'},ConsistentRead:true}));
   this.versions.set(id,r.Item.version);return JSON.parse(chunks.Items.filter(c=>c.index<r.Item.chunks).sort((a,b)=>a.index-b.index).map(c=>c.data).join(''));
 }
 async save(s){
   const data=JSON.stringify(s);if(Buffer.byteLength(data)>700000)throw new Error('Session storage limit reached.');const chunks=data.match(/[\s\S]{1,24000}/g)||['{}'];const version=this.versions.get(s.id)||0;const pk=`OFFICE#${s.id}`,ttl=Math.floor(s.expiresAt/1000);
   const ConditionExpression=version?'version = :version AND #owner = :owner':'attribute_not_exists(pk)';
   await this.client.send(new TransactWriteCommand({TransactItems:[{Put:{TableName:this.table,Item:{pk,sk:'META',version:version+1,chunks:chunks.length,owner:this.owner,leaseUntil:Date.now()+30000,expiresAt:s.expiresAt,ttl},ConditionExpression,...(version?{ExpressionAttributeNames:{'#owner':'owner'},ExpressionAttributeValues:{':version':version,':owner':this.owner}}:{})}},...chunks.map((data,index)=>({Put:{TableName:this.table,Item:{pk,sk:`CHUNK#${String(index).padStart(3,'0')}`,index,data,ttl}}}))]}));this.versions.set(s.id,version+1);
 }
 async delete(id){const r=await this.client.send(new QueryCommand({TableName:this.table,KeyConditionExpression:'pk = :pk',ExpressionAttributeValues:{':pk':`OFFICE#${id}`},ProjectionExpression:'pk, sk'}));if(r.Items.length)await this.client.send(new TransactWriteCommand({TransactItems:r.Items.map(Key=>({Delete:{TableName:this.table,Key}}))}));this.versions.delete(id)}
}
