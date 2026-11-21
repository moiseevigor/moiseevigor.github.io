'use strict';
const assert=require('node:assert/strict'),z=require('node:zlib');
const {compile,index}=require('./clause-route-language.cjs');
global.window={};require('../../../public/data/proof-atlas/clause-forks');
const addresses=[],languages=[],ancestry=[];
let verified=0;
for(const fork of window.PROOF_ATLAS_CLAUSE_FORKS)for(const group of fork.groups){
 const expected=[group,...group.additional||[]].map(g=>({use:g.use.path,target:g.target.path}));
 const graph=compile(group),reader=index(graph);
 assert.equal(reader.total,BigInt(expected.length));
 expected.forEach((e,i)=>{
  assert.deepEqual(reader.select(BigInt(i)),e);
  assert.equal(reader.rankOf(e.use),BigInt(i));
 });
 const offsets=expected.map(({use,target})=>[use,use.length-target.length]);
 assert.deepEqual(offsets.map(([use,up])=>({use,target:use.slice(0,use.length-up)})),expected);
 ancestry.push(offsets);
 verified+=expected.length;addresses.push(expected.map(({use,target})=>[use,target]));languages.push(graph);
}
// A shared binary subtree with one selected field per level, ending at argument 1.
const states=[[1],[ -1,1,0 ]],depth=64;
for(let level=0;level<depth;level++){
 const child=states.length-1;states.push([-1,0,child,1,child]);
}
const reader=index({root:states.length-1,states}),total=1n<<BigInt(depth);
assert.equal(reader.total,total);
for(const rank of [0n,1n,total/3n,total/2n,total-1n]){
 const target=rank.toString(2).padStart(depth,'0');
 assert.deepEqual(reader.select(rank),{use:target+'1',target});
 assert.equal(reader.rankOf(target+'1'),rank);
 assert.equal(reader.rankOf(target),null);
}
assert.throws(()=>reader.select(total),RangeError);
const sizes=x=>{const s=JSON.stringify(x);return {raw:Buffer.byteLength(s),gzip:z.gzipSync(s).length};};
console.log(JSON.stringify({verified,groups:languages.length,addressPairs:sizes(addresses),ancestryOffsets:sizes(ancestry),stateTables:sizes(languages),
 synthetic:{states:states.length,occurrences:String(total),ranksChecked:5}},null,2));
