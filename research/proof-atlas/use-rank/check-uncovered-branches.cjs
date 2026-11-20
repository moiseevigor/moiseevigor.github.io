// Build candidate roots from siblings of recorded call paths, independently of
// the reader's exclusion trie. Count each candidate by free-index multiplicity.
'use strict';
const fs=require('node:fs'),z=require('node:zlib'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const atlas=require('../../../public/js/proof-atlas-library-data');
const {context}=require('../../../public/js/proof-atlas-occurrence-types');
const {inventory}=require('../../../scripts/proof-atlas-judgment-fixtures.cjs');
const {evaluate}=require('../free-index-multiplicity/model.cjs');
const html=fs.readFileSync(__dirname+'/inferences.html','utf8');
const flows=JSON.parse(html.match(/^const flows=(.*);$/m)[1]);
const calls=JSON.parse(html.match(/^const examples=(.*);$/m)[1]);
const prefix=(a,b)=>a.length<=b.length && a.every((v,i)=>v===b[i]);
function comparePaths(a,b){
  for(let i=0;i<Math.min(a.length,b.length);i++)if(a[i]!==b[i])return a[i]-b[i];
  return a.length-b.length;
}
const report=[];
for(const [hash,clauses] of Object.entries(flows)){
  const {record}=inventory().find(x=>x.record.indexSha256===hash);
  const bytes=z.gunzipSync(fs.readFileSync('.'+record.indexFile));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),hash);
  const data=atlas.validateIndex(JSON.parse(bytes),record);
  const roots=calls.filter(c=>c.source.indexSha256===hash).map(c=>c.call.route.slots);
  const rows=[];
  for(const c of clauses){
    const binder=c.domain.route.slots.slice(0,-1),body=binder.concat(1);
    const candidates=new Map();
    function add(slots){
      if(!roots.some(r=>prefix(r,slots)||prefix(slots,r)))candidates.set(slots.join('.'),slots);
    }
    add(body);
    for(const r of roots.filter(r=>prefix(body,r))){
      for(let i=body.length;i<r.length;i++){
        const path=r.slice(0,i),node=atlas.walk(data,{root:1,slots:path});
        data.children[node].forEach((_,field)=>{if(field!==r[i])add(path.concat(field));});
      }
    }
    const regions=[...candidates.values()].map(slots=>{
      const route={root:1,slots},node=atlas.walk(data,route);
      const index=context(data,route).binders.reverse().findIndex(b=>comparePaths(binder,b.route.slots)===0);
      assert(index>=0);return {route,node,index};
    });
    const key=q=>q.node+':'+q.index;
    const queries=[...new Map(regions.map(r=>[key(r),{node:r.node,index:r.index}])).values()];
    const oracle=evaluate(data,queries);assert.equal(oracle.status,'complete');
    const counts=new Map(oracle.rows.map(q=>[key(q),BigInt(q.count)]));
    const positive=regions.filter(r=>counts.get(key(r))>0n);
    positive.sort((a,b)=>{const x=counts.get(key(a)),y=counts.get(key(b));
      return x===y?comparePaths(a.route.slots,b.route.slots):x>y?-1:1;});
    const uncovered=positive.reduce((n,r)=>n+counts.get(key(r)),0n);
    assert.equal(uncovered,BigInt(c.coverage.total)-BigInt(c.coverage.covered));
    const output=c.coverage.branches;assert.equal(output.regions,positive.length);
    assert.equal(output.largest.length,Math.min(3,positive.length));
    for(const [i,b] of output.largest.entries()){
      const r=positive[i];assert.deepEqual(b.anchor,{node:r.node,route:r.route});
      assert.equal(b.count,String(counts.get(key(r))));
      assert(prefix(r.route.slots,b.first.route.slots));
      assert.equal(atlas.walk(data,b.first.route),b.first.node);
      assert.deepEqual(atlas.binding(data,b.first.route).route,{root:1,slots:binder});
    }
    rows.push({binder:c.name,uncovered:String(uncovered),regions:positive.length,
      displayed:output.largest.length,topThree:String(positive.slice(0,3).reduce((n,r)=>n+counts.get(key(r)),0n))});
  }
  report.push({name:record.name,hash,rows});
}
console.log(JSON.stringify(report,null,2));
