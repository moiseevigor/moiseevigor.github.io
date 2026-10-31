(function(host){
'use strict';
const make=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
function draw(container,data,component,slots,onSelect,isCurrent){
 container.replaceChildren();delete container.dataset.bsBinder;delete container.dataset.bsRelation;
 if(!data){container.append(make('p','Reference counts unavailable. Kernel evidence and constructor navigation remain separate.'));return;}
 const key=component==='source.term'?'sourceProjection':component==='interface.term'?'normalProjection':null;
 if(!key)return;
 const p=data[key];
 let frame=p.frames.find(f=>JSON.stringify(f.path)===JSON.stringify(slots)),mode=null;
 if(!frame){for(const f of p.frames)for(const [slot,field]of [[0,'domain'],[1,'value']])if((slot===0||f.kind==='letE')&&JSON.stringify([...f.path,slot])===JSON.stringify(slots)){frame=f;mode=field;}}
 const tail=JSON.stringify(p.tailPath)===JSON.stringify(slots);
 if(!frame&&!tail){container.append(make('p','Select a binder or the remaining body to inspect its references. Descendant reference counts are not indexed here.'));return;}
 let page=0,relation=mode|| (frame?.value?'value':'domain');
 function button(text,action){const b=make('button',text);b.type='button';b.onclick=()=>{if(isCurrent())action();};return b;}
 function render(){
  container.replaceChildren();
  const title=frame?frame.name+' · original binder '+frame.binder:'Remaining body';
  container.append(make('h4','References · '+title));
  container.append(make('p','Counts are occurrences in compiled syntax, including implicit arguments. They do not measure premise necessity. Buttons open the exact binder or containing field; they do not choose one of its repeated uses.'));
  const controls=make('div');controls.className='pm-controls';
  if(frame){for(const [id,label]of [['domain','In type'],...(frame.value?[['value','In defining value']]:[]),['uses','Used by']]){const b=button(label,()=>{relation=id;page=0;render();});b.setAttribute('aria-pressed',String(id===relation));b.dataset.bsMode=id;controls.append(b);}}
  let entries=[],field;
  if(relation==='uses'&&frame){
   for(const f of p.frames)for(const [id,slot,label]of [['domain',0,'type'],['value',1,'value']])for(const r of f[id]?.references||[])if(r.binder===frame.binder)entries.push({label:f.name+' · '+label,count:r.count,path:[...f.path,slot]});
   for(const r of p.tail.references)if(r.binder===frame.binder)entries.push({label:'Remaining body',count:r.count,path:p.tailPath});
  }else{
   field=tail?p.tail:frame[relation];
   entries=field.references.map(r=>{const f=p.frames.find(f=>f.binder===r.binder);return{label:f.name+' · original binder '+f.binder,count:r.count,path:f.path};});
  }
  container.append(controls);
  const destination=tail?'Remaining body':frame.name+' · '+(relation==='domain'?'type':'defining value');
  const focus=make('p',relation==='uses'?title+' → containing fields':'Enclosing binders → '+destination);focus.className='bs-focus';container.append(focus);
  if(field)container.append(make('p',field.occurrences+' expression occurrences · '+field.localReferences+' references to binders internal to this field'));
  const list=make('ul');list.className='bs-links';
  for(const [offset,e]of entries.slice(page*4,page*4+4).entries()){
   const li=make('li'),b=button(e.label,()=>onSelect(component,e.path));b.dataset.bsRef=String(page*4+offset);
   const count=make('span',e.count+' '+(e.count==='1'?'occurrence':'occurrences')+' →');count.className='bs-count';
   if(relation==='uses')li.append(make('span',frame.name),count,b);else li.append(b,count,make('span',destination));list.append(li);
  }
  container.append(list);
  if(!entries.length)container.append(make('p',relation==='uses'?'No references in the indexed primary-spine fields or remaining body.':'No references to enclosing primary-spine binders.'));
  if(entries.length>4){const pager=make('div');pager.className='pm-controls';const prev=button('Previous references',()=>{page--;render();}),next=button('Next references',()=>{page++;render();});prev.disabled=page===0;next.disabled=(page+1)*4>=entries.length;next.dataset.bsNext='';pager.append(prev,make('span',(page*4+1)+'–'+Math.min(entries.length,(page+1)*4)+' of '+entries.length),next);container.append(pager);}
  container.dataset.bsBinder=frame?String(frame.binder):'tail';container.dataset.bsRelation=relation;
 }
 render();
}
host.ProofAtlasBinderSupportView={draw};
})(window);
