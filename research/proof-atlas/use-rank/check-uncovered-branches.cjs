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
  const rows=[],sizes=new Map();
  function measure(root){
    if(sizes.has(root))return sizes.get(root);
    const visits=new Map([[root,1n]]);
    let expanded=0n;
    for(let n=root;n>=0;n--){
      const weight=visits.get(n);
      if(!weight)continue;
      expanded+=weight;
      for(const child of data.children[n])visits.set(child,(visits.get(child)||0n)+weight);
    }
    const size={expressions:String(expanded),sourceRows:visits.size};
    sizes.set(root,size);return size;
  }
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
      if(b.head){
        const head=b.head,route=head.anchor.route;
        assert.equal(atlas.walk(data,route),head.anchor.node);
        assert.deepEqual(route.slots,r.route.slots.concat(Array(head.arguments).fill(0)));
        assert.notEqual(data.kind[head.anchor.node],5);
      }
      const size=measure(r.node);
      assert.equal(b.expressions,size.expressions);
      assert.equal(b.sourceRows,size.sourceRows);
      assert.equal(b.fields.length,data.children[r.node].length);
      const refs=b.fields.map((f,j)=>{
        const expectedSlots=r.route.slots.concat(j);
        assert.deepEqual(f.anchor.route,{root:1,slots:expectedSlots});
        const node=atlas.walk(data,f.anchor.route);
        assert.equal(f.anchor.node,node);
        const label=atlas.fields[atlas.kinds[data.kind[r.node]]][j];
        assert.equal(f.field,label);
        assert.equal(f.expressions,measure(node).expressions);
        const scope=context(data,f.anchor.route).binders.reverse();
        return {node,index:scope.findIndex(b=>comparePaths(binder,b.route.slots)===0)};
      });
      const fieldCounts=evaluate(data,[...new Map(refs.map(q=>[key(q),q])).values()]);
      assert.equal(fieldCounts.status,'complete');
      const mass=new Map(fieldCounts.rows.map(q=>[key(q),q.count]));
      assert.deepEqual(b.fields.map(f=>f.uses),refs.map(q=>mass.get(key(q))));
      assert.equal(BigInt(b.expressions),b.fields.reduce((n,f)=>n+BigInt(f.expressions),1n));
      if(b.fields.length)assert.equal(BigInt(b.count),b.fields.reduce((n,f)=>n+BigInt(f.uses),0n));
      // Independent descent: count references in every field, descend only
      // when a single child contains them all. Batch checks at each depth.
      let current=r.node,index=r.index,steps=0;
      const slots=[...r.route.slots];
      while(true){
        const names=atlas.fields[atlas.kinds[data.kind[current]]]||[];
        const children=data.children[current].map((node,k)=>({node,index:index+Number(names[k]==='body')}));
        const calc=evaluate(data,[...new Map(children.map(q=>[key(q),q])).values()]);
        assert.equal(calc.status,'complete');
        const fieldMass=new Map(calc.rows.map(q=>[key(q),q.count]));
        const live=children.map((q,i)=>({i,q,count:fieldMass.get(key(q))})).filter(f=>BigInt(f.count)>0n);
        if(live.length!==1){
          assert.deepEqual(b.stop.anchor,{node:current,route:{root:1,slots}});
          assert.equal(b.stop.steps,steps);
          assert.equal(b.stop.expressions,measure(current).expressions);
          assert.deepEqual(b.stop.children,live.map(f=>({field:names[f.i],count:f.count,
            anchor:{node:f.q.node,route:{root:1,slots:slots.concat(f.i)}}})));
          if(!live.length)assert.deepEqual(atlas.binding(data,b.stop.anchor.route).route,{root:1,slots:binder});
          break;
        }
        assert.equal(live[0].count,b.count);
        slots.push(live[0].i);steps++;current=live[0].q.node;index=live[0].q.index;
      }
      assert.equal(b.count,String(counts.get(key(r))));
      assert(prefix(r.route.slots,b.first.route.slots));
      assert.equal(atlas.walk(data,b.first.route),b.first.node);
      assert.deepEqual(atlas.binding(data,b.first.route).route,{root:1,slots:binder});
    }
    rows.push({binder:c.name,uncovered:String(uncovered),regions:positive.length,
      displayed:output.largest.length,
      shapes:output.largest.map(b=>({root:b.anchor.route.root+':'+b.anchor.route.slots.join('.'),node:b.anchor.node,
        expressions:b.expressions,sourceRows:b.sourceRows,uses:b.count,function:b.head?.label??null,foldedFields:b.stop.steps,stopSize:b.stop.expressions,stopKind:b.stop.kind,split:b.stop.children.map(c=>[c.field,c.count]),
        fields:b.fields.map(f=>[f.field,f.expressions,f.uses])})),topThree:String(positive.slice(0,3).reduce((n,r)=>n+counts.get(key(r)),0n))});
  }
  report.push({name:record.name,hash,rows});
}
console.log(JSON.stringify(report,null,2));
