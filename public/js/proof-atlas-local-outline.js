(function(host){
 'use strict';
 const common=typeof module!=='undefined' && module.exports;
 const A=common?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
 const arithmetic=common?require('./proof-atlas-arithmetic'):host.ProofAtlasArithmetic;
 const refs=common?require('./proof-atlas-recursive-inputs'):host.ProofAtlasRecursiveInputs;
 function outline(data,at){
  if(data.roots[1]==null)return null;
  if(at?.route.slots.length && (at.route.root!==1 || data.kind[at.node]!==8))return null;
  let node=at?.route.slots.length?at.node:data.roots[1],slots=at?.route.slots.slice()||[];
  while(data.kind[node]===6 && slots.length<128){node=data.children[node][1];slots.push(1);}
  if(data.kind[node]!==8)return null;
  const steps=[];
  const site=(node,slots)=>({node,route:{root:1,slots}});
  while(data.kind[node]===8 && steps.length<16){
   const [type,value,body]=data.children[node];
   steps.push({name:data.payloads[node].declName||'_',binder:site(node,slots),
    type:site(type,slots.concat(0)),value:site(value,slots.concat(1))});
   node=body;slots=slots.concat(2);
  }
  return {steps,end:site(node,slots),limited:data.kind[node]===8};
 }
 function nestedStarts(data){
  const root=data.roots[1],entries=[],singles=[],seen=new Set([root]),queue=[{node:root,parent:null,leading:true}],limit=16384;
  let truncated=false;
  for(let i=0;i<queue.length;i++){
   const at=queue[i],node=at.node;
   if(!at.leading && data.kind[node]===8 &&
      !(at.parent && data.kind[at.parent.node]===8 && at.slot===2)){
    const slots=[];
    for(let p=at;p.parent;p=p.parent)slots.push(p.slot);
    slots.reverse();
    const candidates=data.kind[data.children[node][2]]===8?entries:singles;
     if(candidates.length<6)candidates.push({node,route:{root:1,slots}});
     else truncated=true;
    if(entries.length===6){truncated=true;break;}
   }
   for(const [slot,child] of data.children[node].entries()){
    if(seen.has(child))continue;
    if(seen.size===limit){truncated=true;continue;}
    seen.add(child);queue.push({node:child,parent:at,slot,leading:at.leading && data.kind[node]===6 && slot===1});
   }
  }
  return {entries:entries.concat(singles).slice(0,6),truncated:truncated||entries.length+singles.length>6};
 }
 function reference(data,target,index,binder){
  const r=refs.countReferences(data,target.node,index,{maxStates:8192,maxWork:16384,firstIfPresent:true,useSupport:true});
  if(r.status!=='counted')return {unavailable:true};
  if(!r.witness)return null;
  const use={node:r.witness.node,route:{root:1,slots:target.route.slots.concat(r.witness.slots)}};
  const b=A.binding(data,use.route);
  if(b?.node!==binder.node || String(b.route.slots)!==String(binder.route.slots))throw Error('Dependency scope mismatch');
  return {use,count:r.occurrences};
 }
 function inputs(data,outline,i,field='value'){
  const target=outline.steps[i]?.[field]||outline.end,edges=[];
  for(let j=0;j<i;j++){
   const source=outline.steps[j],edge=reference(data,target,i-1-j,source.binder);
   if(edge)edges.push({source,...edge});
  }
  return edges;
 }
 function hypothesisUse(data,model,step,hypothesis){
  const target=step?.value||model.end,binder=hypothesis.proofBinder;
  const start=binder.route.slots.length,slots=target.route.slots;
  if(!binder.route.slots.every((v,i)=>slots[i]===v) || slots[start]!==1)return null;
  let node=data.children[binder.node][1],index=0;
  for(const slot of slots.slice(start+1)){
   const kind=data.kind[node];
   if(((kind===6||kind===7)&&slot===1)||(kind===8&&slot===2))index++;
   node=data.children[node][slot];
  }
  return reference(data,target,index,binder);
 }
 function layers(data,model){
  const rows=[],levels=new Map();
  for(let i=0;i<=model.steps.length;i++){
   const step=model.steps[i],edges=[];
   for(const field of step?['type','value']:['body']){
    for(const e of inputs(data,model,i,field)){
     if(e.unavailable)return null;
     edges.push({...e,field});
    }
   }
   const level=edges.reduce((n,e)=>Math.max(n,levels.get(e.source)+1),0);
   if(step)levels.set(step,level);
   (rows[level]??=[]).push({step,edges});
  }
  return rows;
 }
 function mount(container,data,at,link){
  if(data.roots[1]==null)return;
  const model=outline(data,at);
  const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
  const leading=new Set(model?.steps.map(s=>s.binder.node)||[]);
  if(!at.route.slots.length && data.kind.some((kind,node)=>kind===8 && !leading.has(node))){
   const browse=el('details'),list=el('ul');browse.dataset.nestedLocals='';
   browse.append(el('summary','Find nested local definitions'),list);
   browse.ontoggle=()=>{
    if(!browse.open||list.childElementCount)return;
    const {entries,truncated}=nestedStarts(data);
    for(const entry of entries){
     const m=outline(data,entry),item=el('li');
     item.append(link(m.steps.map(s=>s.name).join(', '),entry));list.append(item);
    }
    if(truncated||!entries.length)list.append(el('li',truncated?'Search limit reached.':'No nested local definition found in the visited rows.'));
   };
   container.append(browse);
  }
  if(!model)return;
  const panel=el('details'),list=el('ol');panel.dataset.localOutline='';
  panel.append(el('summary','Local definitions in the proof ('+model.steps.length+(model.limited?'+':'')+')'),list);
  panel.ontoggle=()=>{
   if(!panel.open || list.childElementCount)return;
   for(let i=0;i<=model.steps.length;i++){
    const step=model.steps[i],row=el('li');
    if(step){
     const t=arithmetic.formula(data,step.type,6);
     row.append(link(step.name,step.binder),' : ',link(t?arithmetic.caption(t):'e'+step.type.node,step.type),' · ',link('Definition',step.value));
    }else row.append(link(model.limited?'Remaining definitions and body':'Remaining proof body',model.end));
    if(i){
     const detail=el('details'),uses=el('ul');uses.className='pl-reference-tree';
     detail.append(el('summary','References to earlier definitions'),uses);row.append(detail);
     detail.ontoggle=()=>{
      if(!detail.open || uses.childElementCount)return;
      const edges=inputs(data,model,i);
      if(!edges.length)uses.append(el('li','No earlier definition referenced here.'));
      for(const edge of edges){
       const item=el('li');item.append(link(edge.source.name,edge.source.binder),' · ');
       if(edge.unavailable)item.append('Count unavailable within the traversal limit');
       else item.append(link('First reference',edge.use),' · '+edge.count+' total');
       uses.append(item);
      }
     };
    }
    list.append(row);
   }
  };
  if(model.steps.length>=2 && model.steps.length<=8){
   const diagram=el('details'),body=el('div');diagram.dataset.localLayers='';
   diagram.append(el('summary','Local results by dependency'),body);
   diagram.ontoggle=()=>{
    if(!diagram.open || body.childNodes.length)return;
    const rows=layers(data,model);
    if(!rows){body.textContent='Some dependencies exceed the traversal limit. Open the individual definitions for available references.';return;}
    body.append(el('p','References between the displayed local results run from earlier rows to later rows. Links on incoming references open their first occurrence.'));
    const hypotheses=arithmetic.statement(data,{node:data.roots[0],route:{root:0,slots:[]}}).binders.filter(b=>{
     if(!b.proofBinder)return false;
     const path=model.steps[0].binder.route.slots,base=b.proofBinder.route.slots;
     if(!base.every((v,i)=>path[i]===v)||path[base.length]!==1)return false;
     const domain=arithmetic.formula(data,b.domain);
     return domain?.relation||domain?.logical;
    });
    for(const [i,row] of rows.entries()){
     const group=el('section'),cards=el('div');cards.className='pl-local-layer';
     group.append(el('h5','Dependency level '+i),cards);
     for(const {step,edges} of row){
      const card=el('div');card.className='pl-local-result';
      card.append(link(step?step.name:'Remaining proof body',step?step.value:model.end));
      if(step){
       const t=arithmetic.formula(data,step.type,3);
       card.append(el('br'),link(t?arithmetic.caption(t):'Type · e'+step.type.node,step.type));
      }
      if(edges.length){
       const uses=el('ul');
       for(const e of edges){
        const item=el('li');item.append(link(e.source.name+' → '+e.field+' · '+e.count,e.use));uses.append(item);
       }
       card.append(uses);
      }
      cards.append(card);
     }
     if(hypotheses.length){
      const sources=el('details'),sourceList=el('ul');sources.dataset.levelHypotheses='';
      sources.append(el('summary','Trace a statement hypothesis at this level'),sourceList);group.append(sources);
      sources.ontoggle=()=>{
       if(!sources.open || sourceList.childElementCount)return;
       for(const h of hypotheses){
        const entry=el('li'),inspect=el('details'),uses=el('ul');
        inspect.append(el('summary',h.name+' · '+arithmetic.caption(arithmetic.formula(data,h.domain))),uses);
        entry.append(inspect);sourceList.append(entry);
        inspect.ontoggle=()=>{
         if(!inspect.open || uses.childElementCount)return;
         for(const {step} of row){
          const edge=hypothesisUse(data,model,step,h),item=el('li'),name=step?.name||'Remaining proof body';
          if(edge?.unavailable)item.textContent=name+' · count unavailable';
          else if(edge)item.append(link(name+' · '+edge.count+' direct reference'+(edge.count==='1'?'':'s'),edge.use));
          else item.textContent=name+' · 0 direct references';
          uses.append(item);
         }
        };
       }
      };
     }
     body.append(group);
    }
   };
   container.append(diagram);
  }
  container.append(panel);
 }
 if(common)module.exports={outline,inputs,layers,hypothesisUse,nestedStarts};else host.ProofAtlasLocalOutline={mount};
})(typeof window==='undefined'?globalThis:window);
