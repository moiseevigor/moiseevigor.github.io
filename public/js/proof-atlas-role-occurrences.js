// Preorder offsets refer to occurrences in the expanded proof body, including shared rows.
(function(host){
 'use strict';
 function addOffset(bytes,gap){
  if(!Number.isSafeInteger(gap)||gap<0)throw RangeError('Invalid occurrence offset');
  while(gap>=128){bytes.push(128+gap%128);gap=Math.floor(gap/128);}
  bytes.push(gap);
 }
 function select(data,group,ordinal){
  if(!Number.isSafeInteger(ordinal)||ordinal<1||ordinal>group.count)throw RangeError('Invalid occurrence number');
  const bytes=atob(group.offsets);
  let offset=0,value=0,factor=1,found=0;
  for(let i=0;i<bytes.length;i++){
   const byte=bytes.charCodeAt(i);
   value+=(byte%128)*factor;
   if(byte>=128){factor*=128;continue;}
   offset+=value;value=0;factor=1;
   if(!Number.isSafeInteger(offset))throw RangeError('Invalid stored offset');
   if(++found===ordinal)break;
  }
  if(found!==ordinal)throw Error('Incomplete occurrence list');
  let node=data.roots[1];
  const slots=[];
  while(offset>0){
   offset--;
   const slot=data.children[node].findIndex(child=>{
    const size=Number(data.expanded[child]);
    if(!Number.isSafeInteger(size))throw RangeError('Subtree exceeds offset precision');
    if(offset<size)return true;
    offset-=size;return false;
   });
   if(slot<0)throw Error('Occurrence outside proof');
   slots.push(slot);node=data.children[node][slot];
  }
  return {node,route:{root:1,slots}};
 }
 const api={addOffset,select};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else host.ProofAtlasRoleOccurrences=api;
})(typeof window==='undefined'?globalThis:window);
