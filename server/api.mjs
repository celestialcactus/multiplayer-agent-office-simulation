import { randomBytes,createHash } from 'node:crypto';
import { Coordinator } from './coordinator.mjs';
const coordinator=new Coordinator();
export async function readBody(req){let data='';for await(const chunk of req){data+=chunk;if(Buffer.byteLength(data)>14000)throw new Error('Request too large.')}return data?JSON.parse(data):{}}
export function json(res,code,body){res.writeHead(code,{'Content-Type':'application/json','Cache-Control':'no-store','X-Content-Type-Options':'nosniff'});res.end(JSON.stringify(body))}
export function cookieToken(cookie=''){return cookie.split(';').map(s=>s.trim()).find(s=>s.startsWith('office='))?.slice(7)||''}
export function sessionId(token){return createHash('sha256').update(token).digest('hex')}
const admissions=new Map();
export async function localApi(req,res){try{
 const url=new URL(req.url,'http://127.0.0.1');const path=url.pathname;const method=req.method;
 if(method!=='GET'){const origin=req.headers.origin;if(origin!==`http://${req.headers.host}`)return json(res,403,{error:'This action must come from the office page.'})}
 if(path==='/healthz')return json(res,200,{ok:true});
 if(path==='/api/config')return json(res,200,{mode:coordinator.inference.mode,inviteRequired:false});
 if(path==='/api/sessions'&&method==='POST'){
   const ip=req.socket.remoteAddress;const stamps=(admissions.get(ip)||[]).filter(t=>Date.now()-t<3600000);if(stamps.length>=20)return json(res,429,{error:'Too many new offices. Please try later.'});stamps.push(Date.now());admissions.set(ip,stamps);
   const p=await readBody(req),token=randomBytes(32).toString('hex');const s=await coordinator.create(p,sessionId(token));res.setHeader('Set-Cookie',`office=${token}; HttpOnly; SameSite=Strict; Path=/; Max-Age=28800`);return json(res,201,s)
 }
 const token=cookieToken(req.headers.cookie);if(!/^[a-f0-9]{64}$/.test(token))return json(res,401,{error:'No active office session.'});const id=sessionId(token);
 if(path==='/api/session'&&method==='GET')return json(res,200,await coordinator.read(id));
 if(path==='/api/session'&&method==='DELETE'){res.setHeader('Set-Cookie','office=; HttpOnly; SameSite=Strict; Path=/; Max-Age=0');return json(res,200,await coordinator.remove(id))}
 if(path==='/api/session/commands'&&method==='POST')return json(res,200,await coordinator.command(id,await readBody(req)));
 if(path==='/api/session/report'&&method==='GET')return json(res,200,await coordinator.report(id));
 return json(res,404,{error:'Unknown office endpoint.'});
 }catch(e){return json(res,/No active/.test(e.message)?401:400,{error:e instanceof SyntaxError?'Invalid request.':e.message})}}
