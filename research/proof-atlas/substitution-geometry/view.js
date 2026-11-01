(function(){
 'use strict';
 const host=document.querySelector('[data-substitution-reader]');if(!host)return;
 const S=window.ProofAtlasSubstitutionGeometry,A=window.ProofAtlasLibraryData,G=window.ProofAtlasGeometry,M=window.PROOF_ATLAS_SUBSTITUTION_GEOMETRY;
 const find=s=>host.querySelector(s),status=find('[data-status]'),panes=find('[data-panes]'),relation=find('[data-relation]');
 const el=(tag,text,cls)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;if(cls)n.className=cls;return n;};
 const button=(text,action)=>{const b=el('button',text);b.type='button';b.addEventListener('click',action);return b;};
 let store,current=null,shown=null,controller=null,serial=0;
 function compact(p){return p.length?p.join('.'):'root';}
 function clear(){panes.replaceChildren();relation.textContent='';shown=null;find('[data-origin]').replaceChildren();find('[data-images]').replaceChildren();}
 function label(row){const[k,,p]=row,name=A.kinds[k],id=p.idNameParts?.map(x=>x.str??'#'+x.num).join('.')||p.id;switch(k){case 0:return'variable #'+p.index;case 1:return'free '+id;case 2:return'?'+id;case 3:return'Sort';case 4:return p.name;case 6:case 7:case 8:return name+' '+(p.binderName||p.declName||'_');case 9:return String(p.value??p.natVal??p.strVal??JSON.stringify(p));case 11:return(p.typeName||p.structName||'projection')+'.'+p.idx;default:return name;}}
 function writeURL(selection){const p=new URLSearchParams({q:current.query.index,input:current.inputSha256,part:selection.part,path:compact(selection.path||[])});if(selection.part==='image'){p.set('image',selection.image);if(selection.insertion)p.set('use',compact(selection.insertion.path));}history.replaceState(null,'','?'+p+'#reader');}
 function bindingText(v){const b=v.binding;if(!b)return null;if(b.kind==='local')return'↶ bound by '+b.constructor+' '+b.name+' at '+compact(b.address.path);if(b.kind==='substitution-input')return'↦ replacement '+(b.image+1)+' (source order)';if(b.kind==='target-context')return'↶ target-context reference #'+b.relativeIndex+'; original binder unavailable';return b.kind+': '+b.id+'; no syntax binder link';}
 function originalContext(){const target=find('[data-origin]'),o=current.query.owner;target.replaceChildren();
  const title=o.originalOwner?.source?.name||o.name||o.kind;target.append(el('p',title+' · '+(o.part||o.kind),'pm-caption'));
  const details=el('details'),summary=el('summary','Exact addresses and evidence');details.append(summary,el('p','Selected syntax is addressed by input hash, query, component and field path. A pooled row is shared storage. Enclosing proof context is recorded separately.'));
  const pre=el('pre',JSON.stringify({inputSha256:current.inputSha256,query:current.query.index,owner:o,native:current.native},null,2));details.append(pre);
  const a=el('a','Download this query and its provenance (gzip)');a.href=current.asset.file;details.append(a);
  const source=o.originalOwner?.source;
  if(source){const p=el('p'),a=el('a','Open the enclosing compiled proof');a.href='/projects/proof-atlas/library/?'+new URLSearchParams({edition:source.edition,proof:source.name,view:'occurrence',loading:'paged'});p.append(a);details.append(p,el('p','This is enclosing context. The normalized source/template value has no asserted descendant route in the original proof.'));
   if(o.originalOwner.originalContext?.length){const list=el('ol');for(const frame of o.originalOwner.originalContext){const li=el('li'),a=el('a','Original context binder · 1:'+compact(frame.slots));a.href='/projects/proof-atlas/library/?'+new URLSearchParams({edition:source.edition,proof:source.name,view:'occurrence',loading:'paged',route:'1:'+frame.slots.join('.')})+'#expr-'+frame.node;li.append(a);list.append(li);}details.append(list);}
  }target.append(details);
 }
 function renderImages(){const t=find('[data-images]');t.replaceChildren();const count=current.transport.images.length;
  if(!count){t.append(el('p','No replacements. This query copies the selected syntax.','pm-caption'));return;}
  const label=el('label','Replacement in source order '),select=el('select');select.setAttribute('aria-label','Replacement in source order');
  for(let i=0;i<count;i++){const option=el('option','Replacement '+(i+1));option.value=i;select.append(option);}if(shown?.link.image)select.value=shown.link.image.image;
  const inspect=button('Inspect replacement',()=>navigate({part:'image',image:Number(select.value),path:[]}));label.append(select);t.append(label,inspect,el('span','A replacement alone does not choose one of its uses.','pm-caption'));
 }
 function draw(scene,selection){
  shown=scene;panes.replaceChildren();const fragment=scene.link.image?.path.length>0,texts={source:scene.link.insertion?'Source use boundary':'Source',image:fragment?'Replacement fragment':'Replacement',result:fragment?'Result fragment':'Result'};
  const l=scene.link;relation.textContent=l.insertion?'Replace reference at '+compact(l.insertion.path)+' with replacement '+(l.insertion.image+1)+'. Shift external image indices by '+l.insertion.shift+'; image-local binders stay fixed.':l.relation==='unanchored-image'?'Replacement selected without a source use. Source and result highlights are cleared.':l.relation==='preserved-local-reference'?'This variable belongs to a local binder. Substitution preserves it.':l.relation==='residual-context-reference'?'Reference beyond the supplied map. Its index decreases by the number of replacements.':'Same constructor and payload. Ordered fields may contain further replacements.';
  for(const part of['source','image','result']){
   const p=scene.panes[part],panel=el('section',undefined,'sg-pane');panel.dataset.part=part;panel.append(el('h3',texts[part]));
   if(!p){panel.append(el('p',part==='image'?'Select a substituted reference to inspect its replacement.':'No use selected.','pm-caption'));panes.append(panel);continue;}
   const head=el('div',undefined,'sg-path');head.append(el('code',compact(p.address.path)));head.append(button('Up',()=>navigate({part,path:p.address.path.slice(0,-1),image:p.image,insertion:l.insertion})));head.lastChild.disabled=!p.address.path.length;panel.append(head);
   const frames=p.vertices[0].binders,context=el('div',undefined,'sg-context');context.append(el('span','Local binders below this component root: '+frames.length+(frames.length>4?' (nearest four shown)':'')));
   for(const frame of frames.slice(-4)){const a=frame.address;context.append(button('↶ '+frame.constructor+' '+frame.name+' at '+compact(a.path),()=>navigate({part:a.component,path:a.path,image:a.image,insertion:l.insertion})));}panel.append(context);
   const tree=el('div',undefined,'sg-tree');for(const [i,v]of p.vertices.entries()){
    const item=el('div',undefined,i?'sg-branch':'sg-root');if(i)item.append(el('span',v.field,'sg-field'));
    const b=button('',()=>navigate({part,path:v.address.path,image:p.image,insertion:l.insertion}));b.dataset.path=compact(v.address.path);b.dataset.row=v.id;
    b.append(el('span',G.vocabulary[A.kinds[v.row[0]]].glyph,'sg-glyph'),el('span',label(v.row),'sg-node-label'));b.title=label(v.row);b.setAttribute('aria-label',texts[part]+' '+(v.field?v.field+' ':'')+label(v.row)+' at '+compact(v.address.path));
    b.append(el('small','row '+v.id+' · '+v.row[3]+' occurrences'));item.append(b);
    const text=bindingText(v);if(text){const note=el('div',undefined,'sg-binding');if(v.binding.kind==='local'){const a=v.binding.address;note.append(button(text,()=>navigate({part:a.component,path:a.path,image:a.image,insertion:l.insertion})));}else if(v.binding.kind==='substitution-input')note.append(button(text,()=>navigate({part:'source',path:v.address.path})));else note.append(el('span',text));item.append(note);}
    tree.append(item);
   }panel.append(tree,el('p',p.visible+' visible + '+p.hidden+' hidden = '+p.expanded+' occurrences','sg-count'));
   const details=el('details'),sum=el('summary','Constructor payload and address');details.append(sum,el('pre',JSON.stringify({address:p.address,kind:A.kinds[p.vertices[0].row[0]],payload:p.vertices[0].row[2]},null,2)));panel.append(details);panes.append(panel);
  }
  renderImages();originalContext();find('[data-preset]').value=M.presets.some(p=>p.index===current.query.index)?String(current.query.index):'';find('[data-shifted]').disabled=!l.insertion||l.insertion.shift===0||scene.panes.image.vertices[0].row[4]===0;
  writeURL(selection);status.textContent='Query '+current.query.index+' · '+scene.visibleVertices+' visible vertices. '+scene.typing+'.';
 }
 async function run(action){const token=++serial;controller?.abort();controller=new AbortController();const signal=controller.signal;clear();status.textContent='Processing selected occurrence…';find('[data-shifted]').disabled=true;
  try{await action(signal,token);}catch(e){if(token!==serial||signal.aborted)return;clear();status.textContent='Selection unavailable: '+e.message;}
 }
 async function navigate(selection){if(!current)return;return run(async(signal,token)=>{const scene=await S.scene(store,current,selection,{signal});if(token===serial)draw(scene,selection);});}
 async function load(index,initial,expected){return run(async(signal,token)=>{current=null;const q=await store.query(index,signal);if(expected&&q.inputSha256!==expected)throw Error('The saved input hash differs from this query.');current=q;find('[data-query]').value=index;let selection=initial;
   if(!selection){const p=await S.firstExternal(store,current,{signal});selection={part:'source',path:p||[]};}
   const scene=await S.scene(store,current,selection,{signal});if(token===serial)draw(scene,selection);
  });}
 find('[data-load]').addEventListener('click',()=>load(Number(find('[data-query]').value)));
 find('[data-preset]').addEventListener('change',e=>load(Number(e.target.value)));
 find('[data-root]').addEventListener('click',()=>navigate({part:'source',path:[]}));
 find('[data-external]').addEventListener('click',()=>{if(!current)return;run(async(signal,token)=>{const p=await S.firstExternal(store,current,{signal});if(p===null)throw Error('No supplied external reference occurs in this source.');const selection={part:'source',path:p},scene=await S.scene(store,current,selection,{signal});if(token===serial)draw(scene,selection);});});
 find('[data-shifted]').addEventListener('click',()=>{const insertion=shown?.link.insertion;if(!insertion)return;run(async(signal,token)=>{const p=await S.firstExternal(store,current,{part:'image',image:insertion.image,signal});if(p===null)throw Error('This image has no external bound reference to shift.');const selection={part:'image',image:insertion.image,path:p,insertion},scene=await S.scene(store,current,selection,{signal});if(token===serial)draw(scene,selection);});});
 find('[data-release]').addEventListener('click',()=>{serial++;controller?.abort();store?.dispose();current=null;clear();status.textContent='Reader released. Reload the page to open it again.';host.querySelectorAll('button,select,input').forEach(n=>n.disabled=true);});
 (async()=>{try{store=await S.open(M);for(const p of M.presets){const o=el('option',p.label);o.value=p.index;find('[data-preset]').append(o);}const params=new URLSearchParams(location.search),parse=s=>!s||s==='root'?[]:s.split('.').map(Number),initial=params.has('part')?{part:params.get('part'),path:parse(params.get('path')),image:Number(params.get('image')),insertion:params.has('use')?{path:parse(params.get('use')),image:Number(params.get('image'))}:null}:null;await load(params.has('q')?Number(params.get('q')):M.presets[0].index,initial,params.get('input'));window.ProofAtlasSubstitutionReader={snapshot:()=>shown,query:()=>current,stats:()=>store.stats()};}catch(e){clear();status.textContent='Reader unavailable: '+e.message;}})();
})();
