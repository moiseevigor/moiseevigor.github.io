/* Literal type operations through row reads; no normalization or kernel judgments. */
(function(host){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,M=node?require('./proof-atlas-application-ports'):host.ProofAtlasApplicationPorts;
 const demand=(ok,m)=>{if(!ok)throw Error('Paged type operations: '+m);},binds=(k,s)=>(k===6||k===7)&&s===1||k===8&&s===2;
 const limits=Object.freeze({states:262144,frontier:524289,path:512,arguments:64});
 function setup(read,n,options){
  const limit=options.pairLimit??limits.states;demand(typeof read==='function'&&Number.isInteger(n)&&n>0&&n<=65536&&Number.isInteger(limit)&&limit>=1&&limit<=limits.states,'reader/work bounds');
  const live=()=>{if(options.signal?.aborted)throw options.signal.reason||Error('Type operation cancelled');},row=async id=>{live();demand(Number.isInteger(id)&&id>=0&&id<n,'type node');const value=await read(id,{signal:options.signal});live();return value;};
  return{limit,live,row};
 }
 async function typeStructure(read,n,a,b,options={}){
  const {limit,live,row}=setup(read,n,options);demand([a,b].every(i=>Number.isInteger(i)&&i>=0&&i<n),'comparison roots');
  const work=[{i:a,j:b,parent:null,slot:null,depth:0,binders:0}],seen=new Set();let pairs=0;
  const result=status=>({status,pairs,pairLimit:limit});
  while(work.length){
   live();const frame=work.pop(),{i,j}=frame;if(i===j)continue;const key=i+':'+j;if(seen.has(key))continue;
   if(pairs===limit)return{...result('unavailable'),reason:'structural-comparison-budget'};seen.add(key);pairs++;
   const left=await row(i),right=await row(j),lp=A.payloadKey(left[0],left[2]),rp=A.payloadKey(right[0],right[2]),reason=left[0]!==right[0]?'constructor':lp!==rp?'payload':left[1].length!==right[1].length?'arity':null;
   if(reason){
    if(frame.depth>limits.path)return{...result('different'),witness:{status:'unavailable',reason:'selection-path-bound',pathLength:frame.depth,pathLimit:limits.path}};
    const slots=[],fields=[];for(let at=frame;at.parent;at=at.parent){slots.push(at.slot);fields.push(at.field);}slots.reverse();fields.reverse();
    const endpoint=(id,tuple,payload)=>({node:id,kind:A.kinds[tuple[0]],payloadPreview:payload.slice(0,1024),payloadTruncated:payload.length>1024});
    return{...result('different'),witness:{format:'ProofAtlasTypeDifference/1',status:'located',reason,slots,fields,formalBinders:frame.binders,left:endpoint(i,left,lp),right:endpoint(j,right,rp)}};
   }
   for(let s=left[1].length-1;s>=0;s--)work.push({i:left[1][s],j:right[1][s],parent:frame,slot:s,field:A.fields[A.kinds[left[0]]][s],depth:frame.depth+1,binders:frame.binders+(binds(left[0],s)?1:0)});
   demand(work.length<=limits.frontier,'comparison frontier bound');
  }return result('same');
 }
 async function equalShifted(read,n,a,b,shift=0,options={}){
  const {limit,live,row}=setup(read,n,options);demand([a,b].every(i=>Number.isInteger(i)&&i>=0&&i<n)&&Number.isInteger(shift)&&shift>=0&&shift<=512,'weakening roots/shift');
  const work=[[a,b,0]],seen=new Set();let pairs=0;
  const result=status=>({status,pairs,pairLimit:limit});
  while(work.length){
   live();const [i,j,depth]=work.pop(),tag=i+':'+j+':'+depth;if(seen.has(tag))continue;
   if(pairs===limit)return{...result('unavailable'),reason:'weakening-comparison-budget'};seen.add(tag);pairs++;
   const left=await row(i),right=await row(j);if(left[0]!==right[0]||left[1].length!==right[1].length)return result('different');
   if(left[0]===0){const index=left[2].index;if(index+(index>=depth?shift:0)!==right[2].index)return result('different');}
   else if(A.payloadKey(left[0],left[2])!==A.payloadKey(right[0],right[2]))return result('different');
   for(const [s,c]of left[1].entries())work.push([c,right[1][s],depth+(binds(left[0],s)?1:0)]);
   demand(work.length<=limits.frontier,'weakening frontier bound');
  }return result('same');
 }
 async function dependencies(read,n,root,previous,options={}){
  const {limit,live,row}=setup(read,n,options);demand(Number.isInteger(previous)&&previous>=0&&previous<=limits.arguments&&Number.isInteger(root)&&root>=0&&root<n,'formal dependency roots/arity');
  const work=[[root,0]],seen=new Set(),refs=new Set();let states=0;
  while(work.length){
   live();const [id,depth]=work.pop(),tag=id+':'+depth;if(seen.has(tag))continue;
   if(states===limit)return{status:'unavailable',reason:'formal-reference-budget',states,stateLimit:limit};seen.add(tag);states++;
   const tuple=await row(id);if(tuple[0]===0){const index=tuple[2].index-depth;if(index>=0&&index<previous)refs.add(previous-index);}
   for(const [s,c]of tuple[1].entries())work.push([c,depth+(binds(tuple[0],s)?1:0)]);
   demand(work.length<=limits.frontier,'formal-reference frontier bound');
  }return{status:'available',dependencies:[...refs].sort((a,b)=>a-b),states,stateLimit:limit};
 }
 async function formal(read,n,root,argument,slot,options={}){
  const {live,row}=setup(read,n,options);demand(Number.isInteger(slot)&&slot>=1&&slot<=limits.arguments,'formal slot');let id=root;
  for(let i=1;i<=slot;i++){
   live();const tuple=await row(id);
   if(tuple[0]!==7){demand(argument.formal?.available===false&&typeof argument.formal.reason==='string'&&argument.formal.reason.length>0,'explicit formal-prefix boundary');return null;}
   if(i===slot){
    const f=argument.formal,domain=tuple[1][0],slots=[...Array(slot-1).fill(1),0],found=await dependencies(read,n,domain,slot-1,options);
    if(found.status!=='available')return found;
    const deps=found.dependencies;demand(f?.available===true&&f.functionPort===0&&f.previousArguments===slot-1&&f.binderInfo===tuple[2].binderInfo&&f.binderName===tuple[2].binderName&&M.same(f.domainRoute,{root:'inputType',slots})&&M.same(f.dependencies,deps)&&f.kernelInstantiatedDomain==='PASS','formal-domain/source-slot bridge');
    return{node:domain,slots,dependencies:deps};
   }id=tuple[1][1];
  }throw Error('Paged type operations: formal slot');
 }
 const api={limits,typeStructure,equalShifted,dependencies,formal};if(node)module.exports=api;else host.ProofAtlasPagedTypeOperations=api;
})(typeof window==='undefined'?globalThis:window);
