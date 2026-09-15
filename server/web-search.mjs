import {SignatureV4} from '@smithy/signature-v4';
import {HttpRequest} from '@smithy/protocol-http';
import {defaultProvider} from '@aws-sdk/credential-provider-node';
import {Sha256} from '@aws-crypto/sha256-js';

export function normalizeResults(result){
 if(result.isError)throw new Error('Web search failed. Try again later.');
 const data=result.structuredContent||JSON.parse(result.content?.find(c=>c.type==='text')?.text||'{}');
 if(!Array.isArray(data.results))throw new Error('Web search returned an invalid response.');
 const seen=new Set();return data.results.filter(r=>{
  try{const u=new URL(r.url);if(!['https:','http:'].includes(u.protocol)||u.username||u.password||!r.text||!r.title||seen.has(u.href))return false;seen.add(u.href);return true}catch{return false}
 }).slice(0,5).map((r,i)=>({id:i+1,title:String(r.title).slice(0,250),url:r.url,excerpt:String(r.text).slice(0,3500),publishedDate:r.publishedDate||null,retrievedAt:new Date().toISOString(),provider:'aws-web-index'}));
}
export class WebSearch{
 constructor({endpoint=process.env.WEB_SEARCH_URL,fetcher=fetch}={}){this.endpoint=endpoint;this.fetcher=fetcher;this.signer=new SignatureV4({credentials:defaultProvider(),region:process.env.AWS_REGION||'us-east-1',service:'bedrock-agentcore',sha256:Sha256})}
 async rpc(method,params){
  if(!this.endpoint)throw new Error('Web search is not configured.');
  const u=new URL(this.endpoint),body=JSON.stringify({jsonrpc:'2.0',id:crypto.randomUUID(),method,params});
  const signed=await this.signer.sign(new HttpRequest({protocol:u.protocol,hostname:u.hostname,path:u.pathname,method:'POST',headers:{host:u.host,'content-type':'application/json',accept:'application/json, text/event-stream','mcp-protocol-version':'2025-03-26',...(this.session?{'mcp-session-id':this.session}:{})},body}));
  const r=await this.fetcher(u,{method:'POST',headers:signed.headers,body,redirect:'error',signal:AbortSignal.timeout(25000)});
  if(!r.ok)throw new Error(`Web search unavailable (HTTP ${r.status}).`);
  if(r.headers.get('mcp-session-id'))this.session=r.headers.get('mcp-session-id');
  let size=0;const chunks=[];for await(const c of r.body){size+=c.length;if(size>150000)throw new Error('Web search response exceeded the limit.');chunks.push(c)}
  const raw=Buffer.concat(chunks).toString();let value;
  if(r.headers.get('content-type')?.includes('text/event-stream')){value=raw.split(/\r?\n/).filter(l=>l.startsWith('data:')).map(l=>JSON.parse(l.slice(5))).find(v=>v.id)}else value=JSON.parse(raw);
  if(!value||value.error)throw new Error('Web search gateway rejected the request.');return value.result;
 }
 async search(query){
  if(typeof query!=='string'||query.length<2||query.length>200)throw new Error('Invalid web search query.');
  if(!this.tool){await this.rpc('initialize',{protocolVersion:'2025-03-26',capabilities:{},clientInfo:{name:'agent-office',version:'0.2.0'}});const listed=await this.rpc('tools/list',{});const tool=listed.tools?.find(t=>/web.?search/i.test(t.name)&&t.inputSchema?.properties?.query);if(!tool)throw new Error('Web search tool was not found.');this.tool=tool.name}
  return normalizeResults(await this.rpc('tools/call',{name:this.tool,arguments:{query,maxResults:5}}));
 }
}
const client=new WebSearch();
export const webResearch=query=>client.search(query);
