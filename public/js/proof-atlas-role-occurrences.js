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
 // Count uses of one lambda input in a literal constant application slot.
 // A partial application inherits the match state of its outermost call.
 function constantArgumentIndex(data,binder,role){
  const memo=new Map(),spines=new Map(),limit=65536;
  const body=data.children[binder.node][1];
  const containsHead=new Uint8Array(body+1);
  for(let row=0;row<=body;row++){
   containsHead[row]=Number((data.kind[row]===4 && data.payloads[row].name===role.name) ||
    data.children[row].some(child=>containsHead[child]));
  }
  function spine(node){
   if(spines.has(node))return spines.get(node);
   let head=node,arity=0;
   while(data.kind[head]===5){head=data.children[head][0];arity++;}
   const result={arity,name:data.kind[head]===4?data.payloads[head].name:null};
   if(spines.size>=limit)throw RangeError('Application spine limit');
   spines.set(node,result);return result;
  }
  // mode = 0 for a new call, 1 for a matching spine, 2 for a nonmatching one.
  // A matching leaf is recognized only on the actual argument edge.
  function children(node,index,mode){
   const kind=data.kind[node];
   if(kind===5){
    const s=spine(node);
    const match=mode===1 || (mode===0 && s.arity===role.arity && s.name===role.name);
    const [fn,arg]=data.children[node];
    return [[fn,index,match?1:2,false],[arg,index,0,match && s.arity===role.slot]];
   }
   return data.children[node].map((child,i)=>{
    const binds=((kind===6||kind===7)&&i===1)||(kind===8&&i===2);
    return [child,index+Number(binds),0,false];
   });
  }
  function count(node,index,mode,argument){
   if(data.neededScope[node]<=index)return 0n;
   if(data.kind[node]===0)return BigInt(argument && data.payloads[node].index===index);
   if(!containsHead[node])return 0n;
   const key=node+':'+index+':'+mode;
   if(memo.has(key))return memo.get(key);
   const total=children(node,index,mode).reduce((sum,c)=>sum+count(...c),0n);
   if(memo.size>=limit)throw RangeError('Role count state limit');
   memo.set(key,total);return total;
  }
  const total=count(body,0,0,false);
  function occurrence(ordinal){
   if(typeof ordinal!=='bigint'||ordinal<1n||ordinal>total)throw RangeError('Invalid occurrence number');
   let state=[body,0,0,false];
   const slots=binder.route.slots.concat(1);
   while(data.kind[state[0]]!==0){
    const branches=children(...state);
    const i=branches.findIndex(c=>{
     const n=count(...c);
     if(ordinal<=n)return true;
     ordinal-=n;return false;
    });
    if(i<0)throw Error('Incomplete role index');
    slots.push(i);state=branches[i];
   }
   return {node:state[0],route:{root:binder.route.root,slots}};
  }
  return {total,occurrence,states:memo.size,spines:spines.size};
 }
 const api={addOffset,select,constantArgumentIndex};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else host.ProofAtlasRoleOccurrences=api;
})(typeof window==='undefined'?globalThis:window);
