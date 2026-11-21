// Compare every eligible local producer/consumer pair with its ordinal interval.
'use strict';
const fs=require('node:fs'), z=require('node:zlib'), assert=require('node:assert/strict');
const {createHash}=require('node:crypto');
const atlas=require('../../../public/js/proof-atlas-library-data');
const {inventory}=require('../../../scripts/proof-atlas-judgment-fixtures.cjs');
const {open}=require('./model.cjs');
const scan=require('./riccati-local-inputs.cjs');
const records=inventory(),results=[];
for(const {source} of require('./port-results.json')){
  const {record}=records.find(r=>r.edition===source.edition && r.record.indexSha256===source.indexSha256);
  const bytes=z.gunzipSync(fs.readFileSync('.'+record.indexFile));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),source.indexSha256);
  const data=atlas.validateIndex(JSON.parse(bytes),record);
  const {localSteps,finalBody}=scan(data),nodes=[...localSteps,finalBody];
  for(const [i,step] of localSteps.entries()){
    const binder={root:1,slots:step.value.route.slots.slice(0,-1)};
    const ordinals=open(data,binder);
    for(const later of nodes.slice(i+1)){
      const interval=ordinals.interval(later.value.route);
      const edges=later.uses.filter(e=>e.producer===i);
      assert.equal(edges.length,Number(interval.count>0n));
      if(edges.length){
        assert.equal(edges[0].count,String(interval.count));
        assert.deepEqual(edges[0].use.route,ordinals.select(interval.first).route);
      }
    }
  }
  results.push({source,steps:localSteps.map(s=>s.name),localEdges:localSteps.map(s=>s.uses),finalBody});
}
console.log(JSON.stringify(results,null,2));
