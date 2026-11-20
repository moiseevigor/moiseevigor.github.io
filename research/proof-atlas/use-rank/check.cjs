'use strict';
const fs=require('node:fs'), z=require('node:zlib'), assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const {inventory}=require('../../../scripts/proof-atlas-judgment-fixtures.cjs');
const atlas=require('../../../public/js/proof-atlas-library-data'), ordinal=require('./model.cjs');
let binders=0,selections=0,empty=0,enumerated=0,maximum=0n;
const refusals=[], maxima={};
for (const {edition,record} of inventory()) {
  const bytes=z.gunzipSync(fs.readFileSync('.'+record.indexFile));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),record.indexSha256);
  const data=atlas.validateIndex(JSON.parse(bytes),record);
  let node=data.roots[1], slots=[];
  while (data.kind[node]===6) {
    const binder={root:1,slots};
    let query;
    try {query=ordinal.open(data,binder);} catch(error) {
      if (error.message !== 'Ordinal count unavailable: coefficient-cell-bound') throw error;
      refusals.push({edition,name:record.name,binder,reason:error.message});
      slots=[...slots,1]; node=data.children[node][1]; continue;
    }
    binders++;
    assert.throws(()=>query.select(0n),RangeError);
    assert.throws(()=>query.select(query.total+1n),RangeError);
    maximum=query.total>maximum?query.total:maximum;
    if (!maxima[edition] || BigInt(maxima[edition].total)<query.total) {
      const mid=(query.total+1n)/2n;
      maxima[edition]={name:record.name,packet:record.indexSha256,binder,total:String(query.total),
        middle:query.total ? {ordinal:String(mid),use:query.select(mid)} : null};
    }
    if (!query.total) empty++;
    else {
      for (const rank of new Set([1n,(query.total+1n)/2n,query.total])) {
        const use=query.select(rank);
        assert.equal(query.rank(use.route),rank);
        assert.deepEqual(atlas.binding(data,use.route),{node,route:binder});
        selections++;
      }
    }
    const body=data.children[node][1];
    if (BigInt(data.expanded[body])<=4000n) {
      const path=[...slots,1]; let seen=0n;
      function walk(row) {
        if (data.kind[row]===0) {
          const route={root:1,slots:[...path]};
          if (atlas.binding(data,route).node===node &&
            JSON.stringify(atlas.binding(data,route).route)===JSON.stringify(binder)) {
            assert.deepEqual(query.select(++seen),{node:row,route}); enumerated++;
          } else assert.throws(()=>query.rank(route));
        }
        data.children[row].forEach((child,i)=>{path.push(i);walk(child);path.pop();});
      }
      walk(body); assert.equal(query.total,seen);
    }
    slots=[...slots,1];node=body;
  }
}
// Independent binary expansion oracle on a syntax-only sharing control.
const d={kind:[0],children:[[]],neededScope:[1],payloads:[{index:0}],roots:[]};
for(let i=1;i<=240;i++) {d.kind.push(5);d.children.push([i-1,i-1]);d.neededScope.push(1);d.payloads.push({});}
d.kind.push(3,6);d.children.push([],[241,240]);d.neededScope.push(0,0);
d.payloads.push({level:{kind:'zero'}},{binderName:'x',binderInfo:'default'});d.roots=[242];
const q=ordinal.open(d,{root:0,slots:[]});
assert.equal(q.total,1n<<240n);
for(const n of [1n,2n,(1n<<127n)+17n,q.total/2n,q.total]) {
  const route={root:0,slots:[1,...(n-1n).toString(2).padStart(240,'0').split('').map(Number)]};
  assert.deepEqual(q.select(n),{node:0,route});assert.equal(q.rank(route),n);
}
console.log(JSON.stringify({binders,selections,empty,enumerated,refusals,maxima,largestRecordedTotal:String(maximum),sharingControlDepth:240,controlStates:q.states}));
