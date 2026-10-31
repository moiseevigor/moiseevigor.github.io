/* Independent complete-graph lexical closure and occurrence oracle. */
'use strict';
const assert=require('assert/strict'),binds=(k,s)=>(k===6||k===7)&&s===1||k===8&&s===2;
function walk(g,root,slots){let node=root,scope=[];slots.forEach((slot,depth)=>{assert(slot<g.children[node].length);if(binds(g.kind[node],slot))scope.push({node,path:slots.slice(0,depth)});node=g.children[node][slot];});return{node,scope};}
function reference(g,root,slots,counter){
 const {node,scope}=walk(g,root,slots),depth=scope.length,direct=counter.at(node).free.map(r=>depth-1-r.index).sort((a,b)=>a-b),kept=new Set(direct),edges=[];
 // Fixed-point reachability, separate from the consumer's descending pass.
 let changed=true;while(changed){changed=false;for(const slot of [...kept]){const h=scope[slot].node;for(const field of g.kind[h]===8?[0,1]:[0])for(const r of counter.at(g.children[h][field]).free){const target=slot-1-r.index;assert(target>=0&&target<slot);if(!kept.has(target)){kept.add(target);changed=true;}}}}
 for(const slot of kept){const h=scope[slot].node;for(const field of g.kind[h]===8?[0,1]:[0])for(const r of counter.at(g.children[h][field]).free)edges.push({via:slot,target:slot-1-r.index,role:field===0?'binderType':'letValue',count:r.count,origin:[...scope[slot].path,field]});}
 return{node,scope,direct,kept:[...kept].sort((a,b)=>a-b),edges};
}
function candidates(g,root){const todo=[{node:root,slots:[]}],seen=new Set(),out=[[]];for(let i=0;i<todo.length&&out.length<10;i++){const r=todo[i];if(seen.has(r.node))continue;seen.add(r.node);if(g.neededScope[r.node]>0)out.push(r.slots);if(r.slots.length<512)g.children[r.node].forEach((node,s)=>todo.push({node,slots:[...r.slots,s]}));}return out;}

function bodyRegion(g,root,tail,counter){
 const todo=[tail],seen=new Set();for(let i=0;i<todo.length&&i<4096;i++){
  const slots=todo[i],at=walk(g,root,slots),key=at.node+':'+at.scope.map(s=>s.node).join(',');if(seen.has(key))continue;seen.add(key);
  if(g.neededScope[at.node]>0&&BigInt(g.expanded[at.node])>=8n){const r=reference(g,root,slots,counter);if(r.kept.length<r.scope.length&&counter.at(at.node).free.some(f=>r.kept.length-1-r.kept.indexOf(r.scope.length-1-f.index)!==f.index))return slots;}
  if(slots.length<512)g.children[at.node].forEach((_,slot)=>todo.push([...slots,slot]));
 }return tail;
}
module.exports={walk,reference,candidates,bodyRegion,binds};
