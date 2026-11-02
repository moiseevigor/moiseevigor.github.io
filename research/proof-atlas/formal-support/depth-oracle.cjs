/* Independent occurrence/depth traversal, matching the preceding scan rule.
 * Used only as a finite oracle and to reproduce its work-budget failure. */
'use strict';
function dependencies(g,root,previous,limit=262144){
 const work=[[root,0]],seen=new Set(),refs=new Set();
 while(work.length){const [id,depth]=work.pop(),tag=id+':'+depth;if(seen.has(tag))continue;
  if(seen.size===limit)throw Error('depth-oracle work bound');seen.add(tag);
  const kind=g.kind[id];if(kind===0){const index=g.payloads[id].index-depth;if(index>=0&&index<previous)refs.add(previous-index);}
  g.children[id].forEach((child,slot)=>work.push([child,depth+(((kind===6||kind===7)&&slot===1||kind===8&&slot===2)?1:0)]));
 }return{dependencies:[...refs].sort((a,b)=>a-b),states:seen.size};
}
module.exports={dependencies};
