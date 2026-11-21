// Offline experiment: partition a failed binder query into bounded subtree queries.
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const A=require('../../../public/js/proof-atlas-library-data');
const {countReferences}=require('../../../public/js/proof-atlas-recursive-inputs');
const g=JSON.parse(fs.readFileSync(process.argv[2]));
const depth=Number(process.argv[3]),total=1n<<BigInt(depth);
const bodySlots=[1,1,0,1,1],body=A.walk(g,{root:0,slots:bodySlots});
const budget={maxStates:8192,maxDepth:512,maxWork:16384,useSupport:false};
const baseline=countReferences(g,body,0,budget);
const regions=[];
let attempted=0,buildVisits=0,unavailable=0;
function partition(node,index,path){
 if(++attempted>4096)throw Error('Partition limit exceeded');
 const result=countReferences(g,node,index,budget);
 buildVisits+=result.states;
 if(result.status==='counted'){
  const count=BigInt(result.occurrences);
  if(count)regions.push({node,index,path,count});
  return;
 }
 unavailable++;
 const kind=g.kind[node];
 assert(g.children[node].length>0);
 for(const [slot,child] of g.children[node].entries()){
  const enters=(kind===6||kind===7)&&slot===1 || kind===8&&slot===2;
  partition(child,index+Number(enters),path.concat(slot));
 }
}
partition(body,0,[]);
assert.equal(regions.reduce((n,r)=>n+r.count,0n),total);
let peakLookup=0;
function check(rank){
 let relative=rank;
 for(const region of regions){
  if(relative>region.count){relative-=region.count;continue;}
  const located=countReferences(g,region.node,region.index,{...budget,ordinal:relative});
  assert.equal(located.status,'counted');
  peakLookup=Math.max(peakLookup,located.states);
  const bits=(rank-1n).toString(2).padStart(depth,'0');
  const path=region.path.concat(located.witness.slots);
  assert.deepEqual(path,[...bits].flatMap(b=>b==='0'?[0,1]:[1]).concat(2));
  const route={root:0,slots:bodySlots.concat(path)};
  assert.equal(A.walk(g,route),located.witness.node);
  assert.deepEqual(A.binding(g,route).route.slots,bodySlots.slice(0,-1));
  const leaf=A.walk(g,{root:0,slots:route.slots.slice(0,-1)});
  const tag=g.children[leaf][1],literal=g.children[g.children[tag][0]][1];
  assert.equal(g.payloads[literal].value,String(rank-1n));
  return;
 }
 throw Error('Rank outside partition');
}
const ranks=new Set([1n,2n,total/2n,total/2n+1n,total-1n,total]);
let end=0n;
for(const region of regions){ranks.add(end+1n);end+=region.count;ranks.add(end);}
for(const rank of ranks)check(rank);
console.log({depth,distinctRows:g.kind.length,expanded:g.expanded[g.roots[0]],total:String(total),baseline:baseline.status,
 positiveRegions:regions.length,indexBytes:Buffer.byteLength(JSON.stringify(regions,(_,v)=>typeof v==='bigint'?String(v):v)),
 attempted,unavailable,buildVisits,verifiedRanks:ranks.size,peakLookup});
