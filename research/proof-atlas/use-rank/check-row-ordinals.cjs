'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),zlib=require('node:zlib');
const {index}=require('../../../public/js/proof-atlas-row-occurrences');
const {inventory}=require('../../../scripts/proof-atlas-judgment-fixtures.cjs');
const item=inventory().find(i=>i.record.name==='lean_workbook_plus_19617');
const d=JSON.parse(zlib.gunzipSync(fs.readFileSync('.'+item.record.indexFile)));
let verified=0;
for(const [root,start] of d.roots.entries()){
 const routes=new Map();
 function visit(row,slots){
  if(d.kind[row]===5){
   if(!routes.has(row))routes.set(row,[]);
   routes.get(row).push({root,slots});
  }
  d.children[row].forEach((child,j)=>visit(child,slots.concat(j)));
 }
 visit(start,[]);
 for(const [row,list] of routes){
  const selector=index(d,row,list[0]);
  assert.equal(selector.total,BigInt(list.length));
  list.forEach((route,i)=>{
   const n=BigInt(i+1);
   assert.deepEqual(selector.select(n),route);
   assert.equal(index(d,row,route).rank,n);
   verified++;
  });
 }
}
// A shared binary tree has an independent exact binary encoding of its path.
const graph={roots:[64],children:[[]]};
for(let i=1;i<=64;i++)graph.children.push([i-1,i-1]);
const n=(1n<<60n)+19n;
const route={root:0,slots:[...(n-1n).toString(2).padStart(64,'0')].map(Number)};
const selector=index(graph,0,route);
assert.equal(selector.total,1n<<64n);assert.equal(selector.rank,n);
assert.deepEqual(selector.select(n),route);assert.throws(()=>selector.select(0n),RangeError);
assert.throws(()=>selector.select(selector.total+1n),RangeError);
console.log(verified+' compiled application routes and a 2^64-occurrence control passed');
