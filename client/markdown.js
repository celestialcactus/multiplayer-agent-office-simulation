import {marked} from 'marked';
import DOMPurify from 'dompurify';

export function renderMarkdown(text){
 const html=DOMPurify.sanitize(marked.parse(String(text||''),{gfm:true,async:false}),{
  ALLOWED_TAGS:['h1','h2','h3','h4','h5','h6','p','br','hr','strong','em','del','ul','ol','li','blockquote','pre','code','table','thead','tbody','tr','th','td','a'],
  ALLOWED_ATTR:['href','title','start'],ALLOW_DATA_ATTR:false,ALLOW_ARIA_ATTR:false
 });
 const template=document.createElement('template');template.innerHTML=html;
 for(const link of template.content.querySelectorAll('a')){
  const href=link.getAttribute('href')||'';
  if(!/^https?:\/\//i.test(href)){link.removeAttribute('href');continue}
  link.target='_blank';link.rel='noopener noreferrer';
 }
 return template.innerHTML;
}
