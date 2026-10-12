/* Scoped Lean reference. Fields are version-pinned; family flows are authored summaries. */
(function () {
  'use strict';
  const $=id=>document.getElementById(id), root=$('pa-grammar');
  if(!root)return;
  const G=window.PROOF_ATLAS_GRAMMAR,R=window.PROOF_ATLAS_SYNTAX_REFERENCE;
  if(!G||!R){$('pa-g-description').textContent='The reference could not load. Reload this page or follow the Lean manual below.';return;}
  const entries=[...G.kinds.map(k=>({...k,id:'expr-'+k.kind,layer:'expr',explanation:k.explanation})),...R.entries];
  const layerById=new Map(R.layers.map(x=>[x.id,x])), byId=new Map(entries.map(x=>[x.id,x]));
  const counts=window.PROOF_ATLAS_DATA?.stats?.kindCounts||{};
  const choices=$('pa-grammar-choices'),svg=$('pa-grammar-svg');
  let activeLayer='expr',current='expr-app',query='';
  const dom=(tag,cls,text)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;};
  const NS='http://www.w3.org/2000/svg';
  function el(tag,attrs,text){const e=document.createElementNS(NS,tag);for(const [k,v] of Object.entries(attrs||{}))e.setAttribute(k,String(v));if(text!==undefined)e.textContent=text;return e;}
  function lines(text,max=26){const out=[];let row='';for(const word of text.split(' ')){if(row.length+word.length+1>max&&row){out.push(row);row=word;}else row+=(row?' ':'')+word;}if(row)out.push(row);return out;}
  function textAt(x,y,label,cls,max=26){const t=el('text',{x,y,'text-anchor':'middle',class:cls});for(const [i,s]of lines(label,max).entries())t.appendChild(el('tspan',{x,dy:i?19:0},s));svg.appendChild(t);}
  function draw(e){
    svg.replaceChildren();svg.appendChild(el('title',{},e.title));
    const fieldMode=e.fields.length>0||['expr','level','syntax'].includes(e.layer);
    const fields=e.fields, compact=svg.clientWidth<620, width=compact?420:700;
    const rows=compact?fields.length:Math.ceil(fields.length/2);
    const height=fieldMode?Math.max(190,90+rows*85):(compact?355:210);
    svg.setAttribute('viewBox','0 0 '+width+' '+height);
    svg.setAttribute('aria-label',e.title+(fieldMode?': '+fields.map(f=>f.name+' : '+f.type+' ('+f.link+')').join('; '):': '+e.flow.join(' → ')));
    if(fieldMode){
      svg.appendChild(el('rect',{x:width/2-115,y:12,width:230,height:52,rx:6,class:'pa-diagram-root'}));
      textAt(width/2,44,e.kind||e.title,'pa-diagram-root-text');
      if(!fields.length){textAt(width/2,124,'No structural children or payload fields','pa-diagram-note',44);return;}
      fields.forEach((f,i)=>{
        const left=i%2===0,x=compact?60:(left?22:398),y=98+(compact?i:Math.floor(i/2))*85;
        const group=el('g',{'data-field':f.name,class:'pa-diagram-field'});
        const end=left?302:398;
        group.appendChild(el('path',{d:compact?'M35 38 H'+(width/2-115)+' M35 38 V'+(y+28)+' H60':'M350 64 V'+(y+28)+' H'+end,class:'pa-diagram-edge pa-link-'+f.link,fill:'none'}));
        group.appendChild(el('rect',{x,y,width:280,height:65,rx:5,class:'pa-diagram-port pa-link-'+f.link}));
        const name=el('text',{x:x+140,y:y+24,'text-anchor':'middle',class:'pa-diagram-field-name'},f.name);
        const type=el('text',{x:x+140,y:y+47,'text-anchor':'middle',class:'pa-diagram-field-type'},f.type);
        group.append(name,type);svg.appendChild(group);
      });
      const selected=$('pa-g-ports').querySelector('[aria-pressed="true"]');
      if(selected)for(const n of svg.querySelectorAll('[data-field]'))n.classList.toggle('is-dim',n.dataset.field!==selected.dataset.field);
    }else{
      e.flow.forEach((label,i)=>{
        const x=compact?110:18+i*234, y=compact?12+i*103:44;
        if(i<2)svg.appendChild(el('path',{d:compact?'M210 '+(y+90)+' V'+(y+100)+' l-5 -6 m5 6 l5 -6':'M'+(x+200)+' 94 H'+(x+228)+' l-7 -5 m7 5 l-7 5',class:'pa-diagram-flow',fill:'none'}));
        svg.appendChild(el('rect',{x,y,width:200,height:compact?90:101,rx:6,class:i===1?'pa-diagram-root':'pa-diagram-port'}));
        textAt(x+100,y+34,label,i===1?'pa-diagram-root-text':'pa-diagram-field-name',21);
      });
      textAt(width/2,compact?334:190,'Conceptual path · exact expansion depends on context','pa-diagram-note',56);
    }
  }
  function matching(){const q=query.toLowerCase().trim();return entries.filter(e=>(q||e.layer===activeLayer)&&(!q||[e.title,e.kind,e.explanation,e.example,e.reading,...e.fields.map(f=>f.name+' '+f.type)].join(' ').toLowerCase().includes(q)));}
  function renderChoices(){
    const list=matching();
    $('pa-reference-count').textContent=list.length+' '+(query?'matches across all layers':'entries');
    const oldIds=Array.from(choices.querySelectorAll('button')).map(b=>b.dataset.id);
    if(oldIds.join('|')===list.map(e=>e.id).join('|')){for(const b of choices.querySelectorAll('button'))b.setAttribute('aria-pressed',b.dataset.id===current?'true':'false');return;}
    choices.replaceChildren();
    $('pa-reference-count').textContent=list.length+' '+(query?'matches across all layers':'entries');
    if(!list.length){choices.appendChild(dom('p','pa-reference-empty','No matches. Try a constructor name or clear the search.'));return;}
    list.forEach((e,i)=>{
      const b=dom('button','pa-grammar-choice');b.type='button';b.dataset.id=e.id;
      if(e.layer==='expr')b.dataset.tag=e.kind;
      b.setAttribute('aria-pressed',e.id===current?'true':'false');b.setAttribute('aria-controls','pa-reference-detail');
      b.append(dom('span','pa-g-num',String(i+1).padStart(2,'0')),dom('span','pa-g-tag',e.kind||e.title),dom('small',null,e.layer==='expr'?e.title:layerById.get(e.layer).title));
      b.addEventListener('click',()=>select(e.id));choices.appendChild(b);
    });
  }
  function select(id,updateUrl=true){
    const e=byId.get(id);if(!e)return;
    current=id;activeLayer=e.layer;
    for(const b of $('pa-reference-layers').children)b.setAttribute('aria-pressed',b.dataset.layer===activeLayer?'true':'false');
    const layer=layerById.get(e.layer);
    $('pa-reference-scope').textContent=layer.coverage+' · '+layer.scope;
    $('pa-g-group').textContent=layer.title+' / '+(['expr','level','syntax'].includes(e.layer)?'Constructor reference':'Authored explanation');
    $('pa-g-name').textContent=(e.kind?e.kind+' — ':'')+e.title;
    $('pa-g-description').textContent=e.explanation;
    $('pa-g-example').textContent=e.example;
    $('pa-reference-code-title').textContent=e.rawExample?'Constructor shape (illustrative)':'Conceptual path';
    $('pa-reference-form').textContent=e.rawExample||e.flow.join('\n  → ')||'Selected field summary; no canonical source expansion.';
    $('pa-g-reading').textContent=e.reading;
    $('pa-reference-status').textContent=e.layer==='expr'?(counts[e.kind]?counts[e.kind].toLocaleString('en-US')+' occurrences in the released crossing benchmark.':'Not observed in the released crossing benchmark.'):'Reference explanation · not extracted from the crossing certificate.';
    $('pa-reference-limit').textContent=e.layer==='expr'?e.caution:layer.scope;
    $('pa-reference-fields-title').textContent=e.layer==='elab'?'Selected fields / related data (not exhaustive)':e.fields.length?'Structural fields · select one to locate it':'Reading the connections';
    $('pa-reference-legend').textContent=e.fields.length?'Solid: Expr / Level / Syntax children. Dashed: payload, scope, environment or context links. Types and labels distinguish the child languages.':'Authored transformation diagram; not a captured elaboration or tactic trace.';
    const ports=$('pa-g-ports');ports.replaceChildren();
    for(const f of e.fields){const b=dom('button','pa-reference-field');b.type='button';b.dataset.field=f.name;b.setAttribute('aria-pressed','false');b.append(dom('strong',null,f.name+' : '+f.type),dom('span','pa-field-link',f.link),dom('span','pa-field-note',f.note));b.addEventListener('click',()=>{
      const on=b.getAttribute('aria-pressed')!=='true';
      for(const btn of ports.children)btn.setAttribute('aria-pressed',on&&btn===b?'true':'false');
      for(const n of svg.querySelectorAll('[data-field]'))n.classList.toggle('is-dim',on&&n.dataset.field!==f.name);
    });ports.appendChild(b);}
    if(!e.fields.length)ports.appendChild(dom('p',null,e.flow.length?'Arrows show interpretation or processing order, not logical implication. The resulting term must still be checked.':'This constructor is atomic. It has no recursive children.'));
    $('pa-reference-source').href=e.source;$('pa-reference-source').textContent=e.layer==='expr'||['level','syntax','elab'].includes(e.layer)?'Lean 4.33.1 source ↗':'Lean language manual ↗';
    $('pa-reference-link').href='#'+id;
    const index=entries.indexOf(e);$('pa-reference-prev').disabled=index===0;$('pa-reference-next').disabled=index===entries.length-1;
    draw(e);renderChoices();
    if(updateUrl)history.replaceState(null,'','#'+id);
  }
  for(const l of R.layers){const b=dom('button','pa-reference-layer');b.type='button';b.dataset.layer=l.id;b.setAttribute('aria-pressed','false');b.append(dom('strong',null,l.title),dom('span',null,l.coverage));b.addEventListener('click',()=>{query='';$('pa-reference-search').value='';select(entries.find(e=>e.layer===l.id).id);});$('pa-reference-layers').appendChild(b);}
  $('pa-reference-search').addEventListener('input',event=>{query=event.target.value;renderChoices();});
  for(const [id,delta]of [['pa-reference-prev',-1],['pa-reference-next',1]])$(id).addEventListener('click',()=>{query='';$('pa-reference-search').value='';select(entries[entries.findIndex(e=>e.id===current)+delta]?.id);});
  window.addEventListener('hashchange',()=>{const id=location.hash.slice(1);if(byId.has(id)){query='';$('pa-reference-search').value='';select(id,false);}});
  new ResizeObserver(()=>{const e=byId.get(current);if(e)draw(e);}).observe(svg.parentElement);
  select(byId.has(location.hash.slice(1))?location.hash.slice(1):'expr-app',false);
})();
