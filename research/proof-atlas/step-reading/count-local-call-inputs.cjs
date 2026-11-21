// Count application-valued argument positions, independently of native role availability.
'use strict';
const assert=require('node:assert/strict');
const {inventory,raw}=require('../recorded-union.cjs');
const {createHash}=require('node:crypto');
const atlas=require('../../../public/js/proof-atlas-library-data');
const {measure}=require('./call-destinations.cjs');
const {spine}=require('../../../public/js/proof-atlas-elimination');
const results=[];
for(const item of inventory().filter(i=>i.edition==='goedel-sample-4331')){
  const bytes=raw(item.record.indexFile);
  assert.equal(createHash('sha256').update(bytes).digest('hex'),item.record.indexSha256);
  const g=atlas.validateIndex(JSON.parse(bytes),item.record);
  let positions=0,expanded=0n,local=0,expandedLocal=0n,maxLocalWidth=0;
  const destinations=measure(g,g.roots[1],new Set(),(node,weight)=>{
    for(const arg of spine(g,node).args){
      if(atlas.kinds[g.kind[arg]]!=='app')continue;
      positions++;expanded+=weight;
      const call=spine(g,arg);
      if(atlas.kinds[g.kind[call.head]]!=='bvar')continue;
      local++;expandedLocal+=weight;
      maxLocalWidth=Math.max(maxLocalWidth,call.args.length);
    }
  });
  assert.equal(expanded,destinations.counts.argument||0n);
  results.push({proof:item.record.name,indexSha256:item.record.indexSha256,positions,expanded:String(expanded),
    local,expandedLocal:String(expandedLocal),maxLocalWidth});
}
console.log(JSON.stringify(results,null,2));
