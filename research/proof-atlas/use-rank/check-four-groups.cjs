// Enumerate all positive subtree partitions with at most four members.
// Unary positive paths do not change the objective and can be contracted.
'use strict';
const fs=require('node:fs'),z=require('node:zlib'),assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const atlas=require('../../../public/js/proof-atlas-library-data');
const {context}=require('../../../public/js/proof-atlas-occurrence-types');
const {inventory}=require('../../../scripts/proof-atlas-judgment-fixtures.cjs');
const {evaluate}=require('../free-index-multiplicity/model.cjs');
const html=fs.readFileSync(__dirname+'/inferences.html','utf8');
const flow=JSON.parse(html.match(/^const flows=(.*);$/m)[1]);
const report=[];
for(const [hash,clauses] of Object.entries(flow)){
  const {record}=inventory().find(x=>x.record.indexSha256===hash);
  const bytes=z.gunzipSync(fs.readFileSync('.'+record.indexFile));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),hash);
  const data=atlas.validateIndex(JSON.parse(bytes),record),massCache=new Map();
  function mass(node,index){
    const key=node+':'+index;
    if(!massCache.has(key)){
      const oracle=evaluate(data,[{node,index}]);assert.equal(oracle.status,'complete');
      massCache.set(key,BigInt(oracle.rows[0].count));
    }
    return massCache.get(key);
  }
  function children(p){
    let {node,index}=p;
    while(data.children[node].length){
      const fields=atlas.fields[atlas.kinds[data.kind[node]]];
      const positive=data.children[node].map((child,i)=>{
        const depth=index+Number(fields[i]==='body');
        return {node:child,index:depth,count:mass(child,depth)};
      }).filter(c=>c.count>0n);
      if(positive.length!==1)return positive;
      ({node,index}=positive[0]);
    }
    return [];
  }
  const rows=[];
  for(const clause of clauses){
    const binder=clause.domain.route.slots.slice(0,-1);
    const depth=route=>context(data,route).binders.reverse().findIndex(b=>b.route.root===1 && JSON.stringify(b.route.slots)===JSON.stringify(binder));
    for(const b of clause.coverage.branches.largest){
      const parts=b.frontier;
      assert(parts.length>=1 && parts.length<=4);
      let sum=0n,actual=0n;
      for(const [i,p] of parts.entries()){
        const r=p.anchor.route;
        assert(r.root===b.anchor.route.root && b.anchor.route.slots.every((v,k)=>r.slots[k]===v));
        assert.equal(atlas.walk(data,r),p.anchor.node);
        assert.equal(p.fields,atlas.path(data,r).slice(atlas.path(data,b.anchor.route).length+1));
        for(const q of parts.slice(0,i)){
          const s=q.anchor.route.slots;
          assert(s.some((v,k)=>k<r.slots.length && r.slots[k]!==v));
        }
        const index=depth(r);assert(index>=0);
        const n=mass(p.anchor.node,index);
        assert(n>0n);assert.equal(String(n),p.count);
        sum+=n;if(n>actual)actual=n;
      }
      assert.equal(String(sum),b.count);
      let optimum=sum,visited=0;
      function visit(group){
        visited++;
        const largest=group.reduce((m,p)=>m>p.count?m:p.count,0n);
        if(largest<optimum)optimum=largest;
        if(group.length===4)return;
        for(const [i,p] of group.entries()){
          if(p.count===1n)continue;
          const split=children(p);
          assert(split.length>=2);
          if(group.length-1+split.length<=4)visit([...group.slice(0,i),...split,...group.slice(i+1)]);
        }
      }
      visit([{node:b.anchor.node,index:depth(b.anchor.route),count:sum}]);
      assert.equal(optimum,actual);
      rows.push({binder:clause.name,root:b.anchor,uses:b.count,groups:parts.map(p=>p.count),optimalMaximum:String(optimum),visited});
    }
  }
  report.push({name:record.name,hash,rows});
}
console.log(JSON.stringify(report,null,2));
