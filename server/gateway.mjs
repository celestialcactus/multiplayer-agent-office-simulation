import {createHash,randomBytes,timingSafeEqual} from 'node:crypto';
import {BedrockAgentCoreClient,InvokeAgentRuntimeCommand} from '@aws-sdk/client-bedrock-agentcore';
import {DynamoDBClient} from '@aws-sdk/client-dynamodb';
import {DynamoDBDocumentClient,GetCommand,PutCommand,DeleteCommand,UpdateCommand} from '@aws-sdk/lib-dynamodb';
import {validateProfile} from '../domain/office.mjs';
const db=DynamoDBDocumentClient.from(new DynamoDBClient({}));const runtime=new BedrockAgentCoreClient({maxAttempts:2});const table=process.env.SESSION_TABLE;
const hash=s=>createHash('sha256').update(s).digest('hex');
const equal=(a,b)=>typeof a==='string'&&typeof b==='string'&&a.length===b.length&&timingSafeEqual(Buffer.from(a),Buffer.from(b));
const response=(statusCode,body,cookies)=>({statusCode,headers:{'content-type':'application/json','cache-control':'no-store','x-content-type-options':'nosniff'},body:JSON.stringify(body),...(cookies?{cookies}:{} )});
export async function handler(event){
 try{
  const headers=event.headers||{};if(!equal(headers['x-office-origin'],process.env.ORIGIN_SECRET))return response(403,{error:'Use the office website.'});
  const method=event.requestContext.http.method,path=event.rawPath;
  if(method!=='GET'&&headers.origin!==`https://${headers['x-forwarded-host']}`)return response(403,{error:'This action must come from the office page.'});
  if(path==='/api/config')return response(200,{mode:'bedrock',inviteRequired:true});
  const text=event.isBase64Encoded?Buffer.from(event.body||'','base64').toString():event.body||'';if(Buffer.byteLength(text)>14000)return response(413,{error:'Request too large.'});
  const body=text?JSON.parse(text):{};let id,action,profile;
  const cookie=(event.cookies||[headers.cookie||'']).join(';').split(';').map(s=>s.trim()).find(s=>s.startsWith('office='))?.slice(7)||'';
  let setCookie;
  if(path==='/api/sessions'&&method==='POST'){
   if(!equal(hash(String(body.invite||'')),process.env.INVITE_HASH))return response(403,{error:'Enter a valid pilot invite code.'});profile=validateProfile(body);
   const day=new Date().toISOString().slice(0,10);
   try{await db.send(new UpdateCommand({TableName:table,Key:{pk:'ADMISSION',sk:day},UpdateExpression:'SET #ttl = :ttl ADD created :one',ExpressionAttributeNames:{'#ttl':'ttl'},ConditionExpression:'attribute_not_exists(created) OR created < :limit',ExpressionAttributeValues:{':ttl':Math.floor(Date.now()/1000)+172800,':one':1,':limit':Number(process.env.DAILY_SESSION_LIMIT||10)}}))}catch(e){if(e.name==='ConditionalCheckFailedException')return response(429,{error:'The pilot has reached today’s office limit.'});throw e}
   const token=randomBytes(32).toString('hex');id=hash(token);action='create';
   await db.send(new PutCommand({TableName:table,Item:{pk:`AUTH#${id}`,sk:'SESSION',expiresAt:Date.now()+28800000,ttl:Math.floor(Date.now()/1000)+28800},ConditionExpression:'attribute_not_exists(pk)'}));
   setCookie=[`office=${token}; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`];
  }else{
   if(!/^[a-f0-9]{64}$/.test(cookie))return response(401,{error:'No active office session.'});id=hash(cookie);
   const auth=await db.send(new GetCommand({TableName:table,Key:{pk:`AUTH#${id}`,sk:'SESSION'},ConsistentRead:true}));if(!auth.Item||auth.Item.expiresAt<=Date.now())return response(401,{error:'This office session has expired.'});
   if(path==='/api/session'&&method==='GET')action='read';else if(path==='/api/session'&&method==='DELETE')action='delete';else if(path==='/api/session/commands'&&method==='POST')action='command';else if(path==='/api/session/report'&&method==='GET')action='report';else return response(404,{error:'Unknown office endpoint.'});
  }
  const r=await runtime.send(new InvokeAgentRuntimeCommand({agentRuntimeArn:process.env.RUNTIME_ARN,runtimeSessionId:id,contentType:'application/json',accept:'application/json',payload:Buffer.from(JSON.stringify({sessionId:id,action,...(profile?{profile}:{}),...(action==='command'?{command:body}:{})}))}));
  const data=JSON.parse(await r.response.transformToString());if(data.error)return response(400,data,setCookie);
  if(action==='delete'){await db.send(new DeleteCommand({TableName:table,Key:{pk:`AUTH#${id}`,sk:'SESSION'}}));setCookie=['office=; Secure; HttpOnly; SameSite=Strict; Path=/; Max-Age=0']}
  return response(action==='create'?201:200,data,setCookie);
 }catch(e){console.error(JSON.stringify({event:'gateway_failure',name:e.name}));return response(503,{error:'The office could not connect. Please retry shortly.'})}
}
