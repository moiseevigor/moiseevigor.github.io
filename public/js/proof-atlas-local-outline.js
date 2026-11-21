(function(host){
 'use strict';
 const common=typeof module!=='undefined' && module.exports;
 const A=common?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
 const arithmetic=common?require('./proof-atlas-arithmetic'):host.ProofAtlasArithmetic;
 const refs=common?require('./proof-atlas-recursive-inputs'):host.ProofAtlasRecursiveInputs;
 function outline(data){
  if(data.roots[1]==null)return null;
  let node=data.roots[1],slots=[];
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
 function inputs(data,outline,i,field='value'){
  const target=outline.steps[i]?.[field]||outline.end,edges=[];
  for(let j=0;j<i;j++){
   const source=outline.steps[j],r=refs.countReferences(data,target.node,i-1-j,
    {maxStates:8192,maxWork:16384,firstIfPresent:true,useSupport:true});
   if(r.status!=='counted'){edges.push({source,unavailable:true});continue;}
   if(!r.witness)continue;
   const use={node:r.witness.node,route:{root:1,slots:target.route.slots.concat(r.witness.slots)}};
   const b=A.binding(data,use.route);
   if(b?.node!==source.binder.node || String(b.route.slots)!==String(source.binder.route.slots))
    throw Error('Local dependency scope mismatch');
   edges.push({source,use,count:r.occurrences});
  }
  return edges;
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
  if(at.route.slots.length)return;
  const model=outline(data);if(!model)return;
  const el=(tag,text)=>{const n=document.createElement(tag);if(text)n.textContent=text;return n;};
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
     body.append(group);
    }
   };
   container.append(diagram);
  }
  container.append(panel);
 }
 if(common)module.exports={outline,inputs,layers};else host.ProofAtlasLocalOutline={mount};
})(typeof window==='undefined'?globalThis:window);
