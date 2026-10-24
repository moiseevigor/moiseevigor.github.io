/* Manual controls use the production scene algebra; no native judgment is inferred. */
(function(host){
 'use strict';
 const $=id=>document.getElementById(id);if(!$('geometric-manual'))return;
 const A=host.ProofAtlasLibraryData,G=host.ProofAtlasGeometry,E=host.ProofAtlasManualExamples,D=host.ProofAtlasConstructorDiagram;
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 function button(text,action){const b=el('button',text);b.type='button';b.addEventListener('click',action);return b;}
 if(!A||!G||!E||!D||!host.PROOF_ATLAS_GRAMMAR){$('pm-diagram').append(el('p','The structural example is unavailable. Reload to retry; the written manual remains available.','pm-error'));return;}
 for(const rule of host.PROOF_ATLAS_GRAMMAR.kinds){const card=el('article',undefined,'pm-constructor');card.id='manual-'+rule.kind;card.dataset.kind=rule.kind;card.append(el('h3',G.vocabulary[rule.kind].glyph+' '+rule.kind+' · '+rule.title));const diagram=el('div');diagram.innerHTML=D.html(rule);card.append(diagram,el('p',rule.explanation));const details=el('details');details.append(el('summary','Example and reading'),el('pre',rule.rawExample+'\n\n'+rule.example),el('p',rule.reading),el('p',rule.caution));card.append(details);$('pm-constructors').append(card);}
 $('pm-constructors').querySelector(':scope > p')?.remove();
 let input,scene,selected,route={root:0,slots:[]},zoom=1,size;
 const NS='http://www.w3.org/2000/svg';
 function svg(tag,attrs={}){const n=document.createElementNS(NS,tag);for(const [k,v]of Object.entries(attrs))n.setAttribute(k,v);return n;}
 function label(parent,x,y,value,cls){const n=svg('text',{x,y,class:cls||''});n.textContent=value;parent.append(n);}
 function short(n){const p=n.payload;return n.abstraction==='binder-telescope'?n.members.map(m=>m.payload.binderName||m.payload.declName||'_').join(', '):n.abstraction==='application-spine'?n.members.length+' applications':n.kind==='const'?p.name:n.kind==='bvar'?'index '+p.index:['lam','forallE','letE'].includes(n.kind)?p.binderName||p.declName||'_':n.kind==='sort'?'universe level':'original expression';}
 function pick(node){
  selected=node.id;
  for(const n of $('pm-diagram').querySelectorAll('[data-manual-node]'))n.setAttribute('aria-pressed',String(n.dataset.manualNode===selected));
  for(const p of $('pm-diagram').querySelectorAll('.pm-scope-edge'))p.classList.toggle('is-selected',p.dataset.from===selected);
  const out=$('pm-selection');out.replaceChildren(el('h3',node.glyph+' '+node.kind+(node.abstraction?' / '+node.abstraction:'')),el('p','Illustrative occurrence: '+node.id),el('p','Stored node e'+node.node+' · '+node.expanded+' expanded occurrences. Typing: not queried.'));
  const actions=el('div',undefined,'pm-controls');actions.append(button('Focus this subtree',()=>{route={root:node.route.root,slots:[...node.route.slots]};draw();}));
  const binding=scene.links.find(l=>l.from===node.id&&l.relation==='bound-to');
  if(binding){out.append(el('p','Bound to '+binding.target+(binding.boundary?' · outside this cut':'')+(binding.telescopeSlot?' · telescope slot '+binding.telescopeSlot:'')));actions.append(button('Follow original binder',()=>{route={root:binding.route.root,slots:[...binding.route.slots]};draw();}));}
  out.append(actions);
  const regions=node.regions||A.children(input.data,node.node).map((id,j)=>({node:id,field:G.vocabulary[node.kind].ports[j],route:{root:node.route.root,slots:[...node.route.slots,j]},expanded:input.data.expanded[id]}));
  if(regions.length){const ports=el('div',undefined,'pm-controls');for(const r of regions)ports.append(button(r.field+' · '+r.expanded+' occurrences',()=>{route={root:r.route.root,slots:[...r.route.slots]};draw();}));out.append(el('p','Exact region roots (including hidden regions):'),ports);}
  if(node.members){const list=el('ol');for(const m of node.members){const li=el('li');li.append(button(m.path,()=>{route={root:m.route.root,slots:[...m.route.slots]};$('pm-fold').checked=false;draw();}));list.append(li);}const details=el('details');details.append(el('summary','Retained original occurrences'),list);out.append(details);}
 }
 function scaled(){const s=$('pm-diagram').querySelector('svg');if(s&&size){s.setAttribute('width',size.width*zoom);s.setAttribute('height',size.height*zoom);$('pm-fit').textContent=Math.round(zoom*100)+'%';}}
 function draw(){
  try{
   scene=G.create(input.data,input.record,{route,maxNodes:18,maxDepth:Number($('pm-depth').value),foldBinders:$('pm-fold').checked,foldApplications:$('pm-fold').checked,maxApplicationChildren:3,maxLayerNodes:5});G.validate(scene,input.data,input.record);
   const positions=new Map(),rows=new Map();for(const n of scene.nodes){const row=rows.get(n.depth)||0;rows.set(n.depth,row+1);positions.set(n.id,{x:24+n.depth*240,y:30+row*152});}
   const external=new Map();for(const link of scene.links)if(link.relation==='bound-to'&&link.boundary)external.set(link.target,link);
   const depth=Math.max(...scene.nodes.map(n=>n.depth)),col=depth+1;let b=0;for(const [key]of external)positions.set(key,{x:24+col*240,y:30+b++*152});
   size={width:Math.max(650,((external.size?col:depth)+1)*240+20),height:Math.max(180,...[...positions.values()].map(p=>p.y+150))};
   const picture=svg('svg',{viewBox:'0 0 '+size.width+' '+size.height,role:'group','aria-label':'Occurrence cut; solid child fields and dashed scope references'}),defs=svg('defs'),marker=svg('marker',{id:'pm-scope-arrow',viewBox:'0 0 10 10',refX:9,refY:5,markerWidth:6,markerHeight:6,orient:'auto-start-reverse'});marker.append(svg('path',{d:'M 0 0 L 10 5 L 0 10 z',fill:'currentColor'}));defs.append(marker);picture.append(defs);
   for(const edge of scene.edges){const a=positions.get(edge.from),b=positions.get(edge.to);picture.append(svg('path',{d:'M '+(a.x+180)+' '+(a.y+38)+' C '+(a.x+210)+' '+(a.y+38)+' '+(b.x-30)+' '+(b.y+38)+' '+b.x+' '+(b.y+38),class:'pm-child-edge'}));label(picture,a.x+186,(a.y+b.y)/2+25,edge.field,'pm-edge-label');}
   for(const link of scene.links){if(link.relation!=='bound-to')continue;const a=positions.get(link.from),b=positions.get(link.displayTarget||link.target);if(!b)throw Error('Scope endpoint is absent');const p=svg('path',{d:'M '+(a.x+90)+' '+(a.y+84)+' C '+(a.x+90)+' '+(a.y+128)+' '+(b.x+90)+' '+(b.y+128)+' '+(b.x+90)+' '+(b.y+84),class:'pm-scope-edge','marker-end':'url(#pm-scope-arrow)'});p.dataset.from=link.from;p.dataset.target=link.target;picture.append(p);}
   for(const [key,link]of external){const p=positions.get(key),g=svg('g',{class:'pm-node pm-boundary',role:'button',tabindex:0,'aria-label':'External binder '+key});g.append(svg('rect',{x:p.x,y:p.y,width:180,height:84,rx:3}));label(g,p.x+12,p.y+25,'Γ · external binder');label(g,p.x+12,p.y+49,'original e'+link.node);label(g,p.x+12,p.y+70,'outside subtree count','pm-small');const follow=()=>{route={root:link.route.root,slots:[...link.route.slots]};draw();};g.addEventListener('click',follow);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();follow();}});picture.append(g);}
   for(const n of scene.nodes){const p=positions.get(n.id),g=svg('g',{class:'pm-node',role:'button',tabindex:0,'aria-label':n.kind+' '+n.id,'aria-pressed':'false'});g.dataset.manualNode=n.id;g.dataset.storedNode=n.node;g.append(svg('rect',{x:p.x,y:p.y,width:180,height:84,rx:3}));label(g,p.x+12,p.y+25,n.abstraction==='binder-telescope'?'T'+n.members.length+' · binders':n.abstraction==='application-spine'?'@'+n.members.length+' · application':n.glyph+' '+n.kind);label(g,p.x+12,p.y+48,short(n));label(g,p.x+12,p.y+69,'e'+n.node+' · '+(n.hidden.length>10?'hidden region':n.hidden+' hidden'),'pm-small');const choose=()=>pick(n);g.addEventListener('click',choose);g.addEventListener('keydown',e=>{if(e.key==='Enter'||e.key===' '){e.preventDefault();choose();}});picture.append(g);}
   $('pm-diagram').replaceChildren(picture);scaled();
   const retained=scene.stats.retainedOccurrences||String(scene.nodes.length);$('pm-accounting').textContent=retained+' retained + '+scene.stats.hidden+' hidden = '+scene.stats.represented+' occurrences · '+scene.nodes.length+' drawn vertices (limit 18)';pick(scene.nodes[0]);
  }catch(e){$('pm-diagram').replaceChildren(el('p','Structural example unavailable: '+e.message,'pm-error'));$('pm-accounting').textContent='No accounting result is claimed for this failed view.';$('pm-selection').replaceChildren();scene=null;}
 }
 function load(){input=E.example($('pm-example').value);route={root:0,slots:[]};$('pm-term').textContent=input.text;$('pm-note').textContent=input.note;draw();}
 $('pm-example').addEventListener('change',load);$('pm-depth').addEventListener('change',draw);$('pm-fold').addEventListener('change',draw);$('pm-reset').addEventListener('click',()=>{route={root:0,slots:[]};draw();});$('pm-plus').onclick=()=>{zoom=Math.min(2,zoom+.25);scaled();};$('pm-minus').onclick=()=>{zoom=Math.max(.5,zoom-.25);scaled();};$('pm-fit').onclick=()=>{zoom=1;scaled();};
 host.ProofAtlasManual={getScene:()=>scene,getSelection:()=>selected,getExample:()=>input.id};load();
})(window);
