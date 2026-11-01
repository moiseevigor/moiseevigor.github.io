/* Independent local certificate gate. It checks the theorem's hypotheses,
 * not the producer's traversal order or how the ranges were calculated. */
'use strict';
const assert=require('assert/strict'),A=require('../../../public/js/proof-atlas-library-data');
const natural=x=>Number.isSafeInteger(x)&&x>=0;
function check(left,leftRoot,right,rightRoot,shift,certificate){
 assert(natural(shift));assert.equal(certificate.format,'ProofAtlasScopeCertificate/1');
 const rows=certificate.rows;assert(Array.isArray(rows)&&rows.length>0&&rows.length<=262144);
 assert(natural(certificate.root)&&certificate.root<rows.length);
 const root=rows[certificate.root];assert.equal(root.left,leftRoot);assert.equal(root.right,rightRoot);
 assert.equal(root.minimum,0);assert.equal(root.maximum,0);
 const reached=new Set(),todo=[certificate.root],pairs=new Set();
 while(todo.length){const index=todo.pop();if(reached.has(index))continue;reached.add(index);
  const row=rows[index],{left:i,right:j,minimum:lo,maximum:hi}=row;
  assert(natural(i)&&i<left.kind.length&&natural(j)&&j<right.kind.length);
  assert(natural(lo)&&natural(hi)&&lo<=hi);
  const tag=i+':'+j;assert(!pairs.has(tag));pairs.add(tag);
  const kind=left.kind[i];assert.equal(kind,right.kind[j]);assert(natural(kind)&&kind<12);
  if(kind===0){const a=left.payloads[i].index,b=right.payloads[j].index;assert(natural(a)&&natural(b));
   // Direct evaluation at both endpoints is independent of the producer's
   // split between shifted/external and unshifted/local cases.
   for(const depth of [lo,hi]){const lifted=a+(a>=depth?shift:0);assert(natural(lifted));assert.equal(lifted,b);}
  }else assert.equal(A.payloadKey(kind,left.payloads[i]),A.payloadKey(kind,right.payloads[j]));
  const arity=(A.fields[A.kinds[kind]]||[]).length;
  assert.equal(left.children[i].length,arity);assert.equal(right.children[j].length,arity);assert.equal(row.children.length,arity);
  row.children.forEach((childIndex,slot)=>{assert(natural(childIndex)&&childIndex<index);
   const child=rows[childIndex];assert.equal(child.left,left.children[i][slot]);assert.equal(child.right,right.children[j][slot]);
   assert(child.left<i&&child.right<j);
   const step=((kind===6||kind===7)&&slot===1||kind===8&&slot===2)?1:0;
   assert(child.minimum<=lo+step);assert(hi+step<=child.maximum);todo.push(childIndex);
  });
 }
 assert.equal(reached.size,rows.length);
 return{status:'PASS',rows:rows.length};
}
module.exports={check};
