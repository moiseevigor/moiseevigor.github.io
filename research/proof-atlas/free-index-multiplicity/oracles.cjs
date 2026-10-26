'use strict';
// Independent occurrence enumeration. Internal binder depth decides which
// variables are free relative to the requested region. No memoized histograms.
function brute(data,node,limit=4096){
 const todo=[[node,0]],counts=new Map();let visits=0;
 while(todo.length){if(++visits>limit)return null;const[n,depth]=todo.pop(),kind=data.kind[n];if(kind===0&&data.payloads[n].index>=depth){const i=data.payloads[n].index-depth;counts.set(i,(counts.get(i)||0n)+1n);}
  data.children[n].forEach((c,s)=>todo.push([c,depth+Number((kind===6||kind===7)&&s===1||kind===8&&s===2)]));
 }return counts;
}
module.exports={brute};
