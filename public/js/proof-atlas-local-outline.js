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
 function inputs(data,outline,i){
  const target=outline.steps[i]?.value||outline.end,edges=[];
  for(let j=0;j<i;j++){
   const source=outline.steps[j],r=refs.countReferences(data,target.node,i-1-j,
    {maxStates:8192,maxWork:16384,firstIfPresent:true,useSupport:false});
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
  container.append(panel);
 }
 if(common)module.exports={outline,inputs};else host.ProofAtlasLocalOutline={mount};
})(typeof window==='undefined'?globalThis:window);
