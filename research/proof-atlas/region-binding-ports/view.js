(function(host){
 'use strict';
 const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;},button=(label,action)=>{const b=el('button',label);b.type='button';b.onclick=action;return b;};
 function mount(container,{graph,support,scene,onTarget,isCurrent}){
  let projectionView=null,disposed=false,version=0,page=0,loading=true,stateStatus='loading',error=null,summary=null,targets=[],controller=new AbortController();
  container.setAttribute('aria-busy','true');
  const live=v=>!disposed&&v===version&&isCurrent(),status=el('p','Loading this region’s binder boundary…');status.setAttribute('role','status');container.replaceChildren(status);
  const clip=(s,n=96)=>s.length<=n?s:s.slice(0,n)+'…';
  const pretty=value=>value.length<=30?new Intl.NumberFormat('en').format(BigInt(value)):clip(value);
  const binderLabel=target=>({lam:'λ',forallE:'∀',letE:'let'}[target.kind]||target.kind)+' '+target.name;
  function figure(rows,v){
   const diagram=el('div');diagram.className='rb-figure';diagram.tabIndex=0;diagram.setAttribute('role','group');diagram.setAttribute('aria-label','Region and its enclosing binder ports');
   const region=el('div');region.className='rb-region-card';region.append(el('strong','Selected '+({app:'application',lam:'abstraction',forallE:'function type',letE:'local definition'}[scene.root.kind]||scene.root.kind)),el('small','Dashed bound-to wires'));diagram.append(region);
   const list=el('ul');list.className='rb-targets';for(const r of rows){
    const item=el('li'),b=button('',()=>{if(live(v))onTarget(r.target.locator,scene.locator);});b.dataset.rbTarget=String(r.index);
    const count=el('span','index '+r.index+' · '+pretty(r.count)+' occurrence'+(r.count==='1'?'':'s'));count.className='rb-port-count';b.append(el('strong',binderLabel(r.target)),count);item.append(b);list.append(item);
   }diagram.append(list);return diagram;
  }
  async function showPage(next){
   if(!isCurrent()||disposed)return;projectionView?.dispose();projectionView=null;controller.abort();controller=new AbortController();const v=++version;page=next;loading=true;container.setAttribute('aria-busy','true');stateStatus='loading';error=null;targets=[];for(const key of['rbNode','rbPage','rbPortCount'])delete container.dataset[key];const processing=el('p','Resolving the selected region’s exact enclosing binders…');processing.setAttribute('role','status');container.replaceChildren(processing);
   try{
    if(!summary)summary=await support.summary(scene.root.tableNode,scene.root.expanded,scene.root.neededScope,{signal:controller.signal});if(!live(v))return;
    const free=summary.free.slice(page*4,page*4+4),cut=await graph.inspect(scene.component,scene.locator.slots,{signal:controller.signal,referenceIndices:free.map(r=>r.index)});if(!live(v))return;
    if(JSON.stringify(cut.root.address)!==JSON.stringify(scene.root.address))throw Error('selected occurrence changed');
    targets=cut.referenceTargets.map((target,i)=>({...free[i],target}));
    container.replaceChildren(el('h4','Enclosing binders of this region'));
    const counts=el('dl');counts.className='rb-counts';for(const[label,value]of [['Expression occurrences',summary.occurrences],['References to enclosing binders',summary.externalReferences],['References bound inside',summary.localReferences]]){const cell=el('div');cell.append(el('dt',label),el('dd',pretty(value)));counts.append(cell);}container.append(counts);
    if(targets.length){
     container.append(figure(targets,v));
    }else container.append(el('p','This region has no de Bruijn references to enclosing binders. References bound inside the region remain in its internal structure.'));
    if(summary.portCount>4){const controls=el('div');controls.className='pm-controls';const prev=button('Previous binders',()=>{if(live(v))showPage(page-1);}),next=button('Next binders',()=>{if(live(v))showPage(page+1);});prev.disabled=page===0;next.disabled=(page+1)*4>=summary.portCount;prev.dataset.rbPrevious='';next.dataset.rbNext='';controls.append(prev,el('span',(page*4+1)+'–'+Math.min((page+1)*4,summary.portCount)+' of '+summary.portCount),next);container.append(controls);}
    container.append(el('p','Dashed wires are lexical references. Only nonzero references are shown. Counts include type/value fields and implicit arguments; they add no premise-necessity or descendant-typing judgment.'));
    if(host.ProofAtlasRegionContextView)projectionView=host.ProofAtlasRegionContextView.mount(container,{graph,support,scene,onTarget,isCurrent:()=>live(v)});
    const evidence=el('details');evidence.append(el('summary','Exact region and binder addresses'),el('pre',JSON.stringify({region:scene.root.address,coefficients:summary.owner,occurrences:summary.occurrences,localReferences:summary.localReferences,externalReferences:summary.externalReferences,ports:targets.map(r=>({index:r.index,count:r.count,target:r.target.address}))},null,2)));container.append(evidence);
    stateStatus='ready';container.dataset.rbNode=String(summary.node);container.dataset.rbPage=String(page);container.dataset.rbPortCount=String(summary.portCount);
   }catch(e){if(live(v)){stateStatus='unavailable';error=e.message;targets=[];container.replaceChildren(el('p','Binder boundary unavailable: '+e.message),button('Retry binder boundary',()=>{if(live(v)){summary=null;showPage(0);}}));}}
   finally{if(live(v)){loading=false;container.setAttribute('aria-busy','false');}}
  }
  const ready=support?showPage(0):Promise.resolve().then(()=>{if(!live(version))return;loading=false;container.setAttribute('aria-busy','false');stateStatus='unavailable';container.replaceChildren(el('p','Binder counts unavailable for this component owner. Constructor fields and recorded native evidence remain available.'));});
  return{ready,state:()=>({status:stateStatus,error,loading,page,portCount:summary?.portCount??null,selection:scene.root.address,targets:targets.map(r=>({index:r.index,count:r.count,address:r.target.address,locator:r.target.locator})),cache:support?.state()||null,projection:projectionView?.state()||null}),dispose:()=>{projectionView?.dispose();projectionView=null;disposed=true;stateStatus='disposed';loading=false;summary=null;targets=[];version++;controller.abort();container.setAttribute('aria-busy','false');container.replaceChildren();for(const key of['rbNode','rbPage','rbPortCount'])delete container.dataset[key];}};
 }
 host.ProofAtlasRegionBindingView={mount};
})(window);
