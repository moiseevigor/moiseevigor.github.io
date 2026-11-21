// Rank and select paths to a compiled row within one expression root.
(function(host){
 'use strict';
 function index(data,target,route){
  const root=data.roots[route.root],counts=new Array(root-target+1);
  counts[0]=1n;
  const count=row=>row<target?0n:counts[row-target];
  for(let row=target+1;row<=root;row++)
   counts[row-target]=data.children[row].reduce((sum,child)=>sum+count(child),0n);
  let rank=1n,node=root;
  for(const slot of route.slots){
   const children=data.children[node];
   for(let i=0;i<slot;i++)rank+=count(children[i]);
   node=children[slot];
  }
  if(node!==target)throw Error('Selected route does not reach this expression');
  const total=count(root);
  function select(ordinal){
   if(typeof ordinal!=='bigint'||ordinal<1n||ordinal>total)throw RangeError('Occurrence outside this root');
   let row=root;
   const slots=[];
   while(row!==target){
    const children=data.children[row];
    const slot=children.findIndex(child=>{
     const size=count(child);
     if(ordinal<=size)return true;
     ordinal-=size;return false;
    });
    if(slot<0)throw Error('Incomplete occurrence interval');
    slots.push(slot);row=children[slot];
   }
   return {root:route.root,slots};
  }
  return {rank,total,select};
 }
 function control(data,target,route,onSelect){
  const panel=document.createElement('details'),summary=document.createElement('summary');
  summary.textContent='Find occurrences of this application';panel.append(summary);
  panel.ontoggle=()=>{
   if(!panel.open||panel.children.length>1)return;
   const table=index(data,target,route),info=document.createElement('p');
   const rootName=data.declaration.rootPaths[route.root];
   info.textContent='Occurrence '+table.rank+' of '+table.total+' in '+rootName+'.';
   panel.append(info);
   if(table.total===1n)return;
   const form=document.createElement('form'),label=document.createElement('label');
   const input=document.createElement('input'),submit=document.createElement('button');
   label.textContent='Occurrence number ';input.value=String(table.rank);input.inputMode='numeric';
   input.required=true;input.pattern='[1-9][0-9]*';input.size=8;
   input.maxLength=String(table.total).length;label.append(input);submit.textContent='Go to occurrence';
   form.append(label,' ',submit);panel.append(form);
   input.oninput=()=>input.setCustomValidity('');
   form.onsubmit=e=>{
    e.preventDefault();if(!input.reportValidity())return;
    const n=BigInt(input.value);
    if(n>table.total){input.setCustomValidity('Enter a number up to '+table.total+'.');input.reportValidity();return;}
    onSelect(table.select(n));
   };
  };
  return panel;
 }
 const api={index,control};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;
 else host.ProofAtlasRowOccurrences=api;
})(typeof window==='undefined'?globalThis:window);
