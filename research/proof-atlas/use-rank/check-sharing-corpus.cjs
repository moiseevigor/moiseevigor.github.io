// All available theorem bodies in each declared edition, excluding development fixtures.
'use strict';
const fs=require('node:fs'), vm=require('node:vm'), z=require('node:zlib');
const assert=require('node:assert/strict'), {createHash}=require('node:crypto');
const atlas=require('../../../public/js/proof-atlas-library-data');
const {freeIndexMasks,allOccurrenceTargets,measure,checkExpanded}=require('./check-shared-application-contexts.cjs');
const fixtures=new Set(require('./port-results.json').map(p=>p.source.indexSha256));
const window={};
for(const name of ['library','goedel-sample','recursion-examples']){
  vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+name+'-manifest.js','utf8'),{window});
}
const editions=[...window.PROOF_ATLAS_LIBRARY.editions,window.PROOF_ATLAS_AI_SAMPLE.edition,window.PROOF_ATLAS_RECURSION_EXAMPLES.edition];
for(const edition of editions){
  const totals={edition:edition.id,theorems:0,unavailable:0,fixtures:0,tested:0,expandedChecks:0,
    withChangedTargets:0,repeated:0,changed:0,bodyOccurrences:'0'};
  const digest=createHash('sha256');
  for(const r of edition.declarations){
    if(r.kind!=='theorem')continue;
    totals.theorems++;
    if(!r.bodyAvailable){totals.unavailable++;continue;}
    if(fixtures.has(r.indexSha256)){totals.fixtures++;continue;}
    const bytes=z.gunzipSync(fs.readFileSync('.'+r.indexFile));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),r.indexSha256);
    const data=atlas.validateIndex(JSON.parse(bytes),r);
    assert.deepEqual(Array.from(r.rootPaths),['root.type','root.value']);
    const n=BigInt(data.expanded[data.roots[1]]);
    assert.equal(String(n),r.proofOccurrences);
    const classes=allOccurrenceTargets(data,freeIndexMasks(data));
    if(n<=2000n){
      const result=measure(data);
      checkExpanded(data,result.counts,classes);
      totals.expandedChecks++;
    }
    const changed=[...classes.values()].filter(Boolean).length;
    digest.update(JSON.stringify([r.name,r.indexSha256,classes.size,changed])+'\n');
    totals.tested++;
    totals.withChangedTargets+=Number(changed>0);
    totals.repeated+=classes.size;
    totals.changed+=changed;
    totals.bodyOccurrences=String(BigInt(totals.bodyOccurrences)+n);
  }
  assert.equal(totals.theorems,totals.tested+totals.fixtures+totals.unavailable);
  console.log(JSON.stringify({...totals,declarationResultsSha256:digest.digest('hex')}));
}
