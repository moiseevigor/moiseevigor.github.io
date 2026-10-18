/* Experimental occurrence addresses. Callers must hash-check the source packet. */
(function(host){
'use strict';
const isNode=typeof module!=='undefined'&&module.exports;
function encoded(bytes){if(isNode)return Buffer.from(bytes).toString('base64url');let text='';for(let i=0;i<bytes.length;i+=8192)text+=String.fromCharCode(...bytes.subarray(i,i+8192));return btoa(text).replaceAll('+','-').replaceAll('/','_').replace(/=+$/,'');}
function decoded(text){if(isNode)return new Uint8Array(Buffer.from(text,'base64url'));const value=atob(text.replaceAll('-','+').replaceAll('_','/')+'='.repeat((4-text.length%4)%4));return Uint8Array.from(value,c=>c.charCodeAt(0));}
const limits=Object.freeze({sourceNodes:262144,roots:32,depth:262144,packedBytes:65536});
const fields=[[],[],[],[],[],['fn','arg'],['domain','body'],['domain','body'],['type','value','body'],[],['expr'],['struct']];
const demand=(ok,message)=>{if(!ok)throw Error('Packed source route: '+message);};
const natural=n=>Number.isSafeInteger(n)&&n>=0;
function address(root,depth,bytes){return Object.freeze({format:'ProofAtlasPackedRoute/1',root,depth,slots:encoded(bytes)});}
function parse(value){
 demand(value&&Object.keys(value).sort().join(',')==='depth,format,root,slots'&&value.format==='ProofAtlasPackedRoute/1','format');
 demand(natural(value.root)&&value.root<limits.roots&&natural(value.depth)&&value.depth<=limits.depth,'root/depth bound');
 demand(typeof value.slots==='string'&&value.slots.length<=Math.ceil(limits.packedBytes*4/3)&&value.slots.length%4!==1&&/^[A-Za-z0-9_-]*$/.test(value.slots),'encoded bound/alphabet');
 const bytes=decoded(value.slots);
 demand(bytes.length===Math.ceil(value.depth/4)&&encoded(bytes)===value.slots,'canonical byte encoding');
 if(value.depth%4)demand(bytes.at(-1)>>>((value.depth%4)*2)===0,'nonzero unused slots');
 for(let i=0;i<value.depth;i++)demand(slot(bytes,i)<3,'invalid slot');
 return bytes;
}
function slot(bytes,i){return(bytes[i>>2]>>((i%4)*2))&3;}
function encode(root,slots){
 demand(natural(root)&&root<limits.roots&&Array.isArray(slots)&&slots.length<=limits.depth,'input bound');
 const bytes=new Uint8Array(Math.ceil(slots.length/4));
 slots.forEach((s,i)=>{demand(natural(s)&&s<3,'input slot');bytes[i>>2]|=s<<((i%4)*2);});
 return address(root,slots.length,bytes);
}
function encodeReversed(root,slots){
 demand(natural(root)&&root<limits.roots&&(Array.isArray(slots)||slots instanceof Uint8Array)&&slots.length<=limits.depth,'reverse input bound');
 const bytes=new Uint8Array(Math.ceil(slots.length/4));
 for(let i=0;i<slots.length;i++){const s=slots[slots.length-1-i];demand(natural(s)&&s<3,'reverse input slot');bytes[i>>2]|=s<<((i%4)*2);}
 return address(root,slots.length,bytes);
}
function prefix(value,depth){
 const bytes=parse(value);demand(natural(depth)&&depth<=value.depth,'prefix bound');
 const result=new Uint8Array(bytes.subarray(0,Math.ceil(depth/4)));
 if(depth%4)result[result.length-1]&=(1<<((depth%4)*2))-1;
 return address(value.root,depth,result);
}
function append(value,more){
 const old=parse(value);demand(Array.isArray(more)&&value.depth+more.length<=limits.depth,'append bound');
 const bytes=new Uint8Array(Math.ceil((value.depth+more.length)/4));bytes.set(old);
 more.forEach((s,j)=>{demand(natural(s)&&s<3,'append slot');const i=value.depth+j;bytes[i>>2]|=s<<((i%4)*2);});
 return address(value.root,value.depth+more.length,bytes);
}
function resolve(data,value){
 const bytes=parse(value),n=data?.kind?.length;
 demand(natural(n)&&n>0&&n<=limits.sourceNodes&&data.children?.length===n&&data.payloads?.length===n,'source table bound/shape');
 demand(Array.isArray(data.roots)&&data.roots.length>0&&data.roots.length<=limits.roots&&value.root<data.roots.length,'source root');
 let node=data.roots[value.root],scopeDepth=0,steps=0;
 function check(id){
  demand(natural(id)&&id<n,'source node');const kind=data.kind[id],cs=data.children[id];
  demand(natural(kind)&&kind<fields.length&&Array.isArray(cs)&&cs.length===fields[kind].length&&cs.every(c=>natural(c)&&c<id),'source constructor/ports/order');
  return kind;
 }
 for(let depth=0;depth<value.depth;depth++){
  const kind=check(node),s=slot(bytes,depth),next=data.children[node][s];
  demand(next!==undefined,'selected port');
  if((kind===6||kind===7)&&s===1||kind===8&&s===2)scopeDepth++;
  node=next;steps++;
 }
 const kind=check(node),result={node,scopeDepth,binding:null,sourceSteps:steps};
 if(kind!==0)return Object.freeze(result);
 const index=data.payloads[node]?.index;demand(natural(index),'bound variable index');
 if(index>=scopeDepth)return Object.freeze({...result,unboundIndex:index});
 const ordinal=scopeDepth-1-index;let encountered=0,current=data.roots[value.root];
 for(let depth=0;depth<value.depth;depth++){
  const k=data.kind[current],s=slot(bytes,depth);steps++;
  if((k===6||k===7)&&s===1||k===8&&s===2){
   if(encountered===ordinal)return Object.freeze({...result,sourceSteps:steps,binding:Object.freeze({node:current,route:prefix(value,depth)})});
   encountered++;
  }
  current=data.children[current][s];
 }
 throw Error('Packed source route: missing lexical target');
}
const api={encode,encodeReversed,parse,prefix,append,resolve,limits};
if(isNode)module.exports=api;else host.ProofAtlasPackedRoutes=api;
})(typeof window==='undefined'?globalThis:window);
