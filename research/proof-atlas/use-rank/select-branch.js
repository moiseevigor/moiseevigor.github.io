// Each selected field has a contiguous interval in depth-first source order.
function selectBranch(table,ordinal) {
  if(typeof ordinal!=='bigint'||ordinal<1n||ordinal>BigInt(table.total))throw RangeError('Use number outside range');
  const slots=[...table.prefix],steps=[];
  let id=0, first=1n;
  while(true) {
    const [node,kind,name,edges]=table.rows[id];
    if(!edges.length)return {node,slots,steps};
    let chosen=false;
    for(const [slot,next,count] of edges) {
      const last=first+BigInt(count)-1n;
      if(ordinal<=last) {
        steps.push({node,kind,name,slot,first,last});slots.push(slot);id=next;chosen=true;break;
      }
      first=last+1n;
    }
    if(!chosen)throw Error('Incomplete branch interval');
  }
}
if(typeof module!=='undefined'&&module.exports)module.exports=selectBranch;
