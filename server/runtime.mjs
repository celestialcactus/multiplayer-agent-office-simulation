import http from 'node:http';
import { Coordinator } from './coordinator.mjs';
import { DynamoRepository } from './repository.mjs';
// Runtime is invoked only by the IAM-authenticated backend. One microVM per office.
const coordinator=new Coordinator({repository:new DynamoRepository()});let boundId;
http.createServer(async(req,res)=>{
 const send=(status,data)=>{res.writeHead(status,{'Content-Type':'application/json'});res.end(JSON.stringify(data))};
 if(req.url==='/ping'&&req.method==='GET')return send(200,{status:coordinator.busy()?'HealthyBusy':'Healthy'});
 if(req.url!=='/invocations'||req.method!=='POST')return send(404,{error:'Not found'});
 try{let raw='';for await(const c of req){raw+=c;if(raw.length>16000)throw new Error('Request too large')}const p=JSON.parse(raw);if(!/^[a-f0-9]{64}$/.test(p.sessionId))throw new Error('Invalid office session.');if(boundId&&boundId!==p.sessionId)throw new Error('Office session mismatch.');boundId=p.sessionId;
 let result;switch(p.action){case 'create':result=await coordinator.create(p.profile,p.sessionId);break;case 'read':result=await coordinator.read(p.sessionId);break;case 'command':result=await coordinator.command(p.sessionId,p.command);break;case 'report':result=await coordinator.report(p.sessionId);break;case 'delete':result=await coordinator.remove(p.sessionId);break;default:throw new Error('Unknown action')};send(200,result)
 }catch(e){console.error(JSON.stringify({event:"runtime_request_failure",name:e.name}));send(200,{error:/session|Choose|meeting|day|coworker|budget|Resume|configuration|supply/.test(e.message)?e.message:'The office could not process this request.'})}
}).listen(8080,'0.0.0.0',()=>console.log('Office runtime listening on 8080'));
