/* Reading/navigation only; never changes formal selections or evidence contents. */
(function(){
 'use strict';
 const hash=()=>{try{return decodeURIComponent(location.hash.slice(1));}catch{return '';}};
 function forward(){const target=document.getElementById(hash());if(target?.matches('[data-evidence-anchor]'))location.replace(target.href);}
 forward();window.addEventListener('hashchange',forward);
 const root=document.getElementById('atlas-evidence-records');if(!root)return;
 const input=document.getElementById('atlas-evidence-search'),status=document.getElementById('atlas-evidence-status'),entries=[...root.querySelectorAll('.atlas-evidence-entry')],groups=[...root.querySelectorAll('[data-evidence-group]')],buttons=[...document.querySelectorAll('[data-evidence-filter]')];
 const texts=new Map(entries.map(n=>[n,n.textContent.toLocaleLowerCase()]));let layer='all';
 function filter(){const words=input.value.toLocaleLowerCase().trim().split(/\s+/).filter(Boolean);let count=0;
  for(const entry of entries){const group=entry.closest('[data-evidence-group]').dataset.evidenceGroup,match=(layer==='all'||layer===group)&&words.every(w=>texts.get(entry).includes(w));entry.hidden=!match;if(words.length)entry.open=match;else entry.open=!!hash()&&entry.contains(document.getElementById(hash()));if(match)count++;}
  for(const group of groups)group.hidden=![...group.querySelectorAll('.atlas-evidence-entry')].some(e=>!e.hidden);
  for(const b of buttons)b.setAttribute('aria-pressed',String(b.dataset.evidenceFilter===layer));
  status.textContent=count+' of '+entries.length+' evidence entries'+(count?'':' · Try another term or select all layers.');
 }
 function reveal(){const target=document.getElementById(hash());if(!target||!root.contains(target))return;layer='all';input.value='';filter();for(let p=target.parentElement;p&&p!==root;p=p.parentElement){if(p.tagName==='DETAILS')p.open=true;p.hidden=false;}requestAnimationFrame(()=>target.scrollIntoView({block:'start'}));}
 for(const b of buttons)b.addEventListener('click',()=>{layer=b.dataset.evidenceFilter;filter();});input.addEventListener('input',filter);window.addEventListener('hashchange',reveal);filter();reveal();window.addEventListener('load',()=>{if(!input.value)reveal();},{once:true});
})();
