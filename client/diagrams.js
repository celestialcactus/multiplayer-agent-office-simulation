import DOMPurify from 'dompurify';
let renderer;let serial=0;const cache=new Map();
export async function renderDiagrams(root,artifacts){
 const targets=Array.from(root.querySelectorAll('[data-diagram]'));
 if(!targets.length)return;
 renderer ||= import('mermaid').then(({default:m})=>{m.initialize({startOnLoad:false,securityLevel:'strict',htmlLabels:false,maxTextSize:12000,maxEdges:100,theme:'neutral',flowchart:{htmlLabels:false},sequence:{useMaxWidth:true},suppressErrorRendering:true});return m});
 const mermaid=await renderer;
 for(const target of targets){
  const a=artifacts.find(a=>a.id===target.dataset.diagram);const source=a?.content?.match(/```mermaid\s*\n([\s\S]*?)```/i)?.[1];
  if(!source){target.textContent='Diagram source is available below.';continue}
  if(source.length>12000||/^\s*---/m.test(source)||/%%\s*\{|\b(?:click|href|image)\b|https?:|<\/?[a-z]/i.test(source)){target.textContent='This diagram uses unsupported interactive or external content. Review the source below.';continue}
  try{
   let svg=cache.get(source);if(!svg){const result=await mermaid.render('office-diagram-'+(++serial),source);svg=DOMPurify.sanitize(result.svg,{USE_PROFILES:{svg:true,svgFilters:true},FORBID_TAGS:['foreignObject','image','a','script'],FORBID_ATTR:['href','xlink:href'],ALLOW_DATA_ATTR:false});cache.set(source,svg);if(cache.size>20)cache.delete(cache.keys().next().value)}
   if(target.isConnected)target.innerHTML=svg;
  }catch{if(target.isConnected)target.textContent='The diagram could not be rendered. Its editable source is shown below.';}
 }
}
