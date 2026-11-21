// All available theorem bodies in each declared edition, excluding development fixtures.
'use strict';
const fs=require('node:fs'), vm=require('node:vm'), z=require('node:zlib');
const assert=require('node:assert/strict'), {createHash}=require('node:crypto');
const atlas=require('../../../public/js/proof-atlas-library-data');
const {freeIndexMasks,allOccurrenceTargets,measure,checkExpanded}=require('./check-shared-application-contexts.cjs');
// Count occurrences in source field order, including duplicate child slots.
function applicationCounts(data,classes) {
  const root=data.roots[1], paths=Array(root+1).fill(0n);
  paths[root]=1n;
  let total=0n, applications=0n, shared=0n, contextSensitive=0n;
  for(let row=root;row>=0;row--){
    const count=paths[row];
    if(!count)continue;
    total+=count;
    if(data.kind[row]===5){
      applications+=count;
      assert.equal(classes.has(row),count>1n);
      if(count>1n)shared+=count;
      if(classes.get(row))contextSensitive+=count;
    }
    for(const child of data.children[row])paths[child]+=count;
  }
  assert.equal(String(total),data.expanded[root]);
  return {applications,shared,contextSensitive};
}

// Reverse the computation: sum marked descendants, without using root-to-row path counts.
function checkSubtreeTotal(data,classes,expected) {
  const root=data.roots[1], totals=[];
  for(let row=0;row<=root;row++){
    let count=classes.get(row)?1n:0n;
    for(const child of data.children[row])count+=totals[child];
    totals.push(count);
  }
  assert.equal(totals[root],expected.contextSensitive);
}

function checkExpandedCounts(data,classes,expected) {
  const counts={applications:0n,shared:0n,contextSensitive:0n};
  const stack=[data.roots[1]];
  while(stack.length){
    const row=stack.pop();
    if(data.kind[row]===5){
      counts.applications++;
      if(classes.has(row))counts.shared++;
      if(classes.get(row))counts.contextSensitive++;
    }
    stack.push(...data.children[row]);
  }
  assert.deepEqual(counts,expected);
}
const fixtures=new Set(require('./port-results.json').map(p=>p.source.indexSha256));
const window={};
for(const name of ['library','goedel-sample','recursion-examples']){
  vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+name+'-manifest.js','utf8'),{window});
}
const editions=[...window.PROOF_ATLAS_LIBRARY.editions,window.PROOF_ATLAS_AI_SAMPLE.edition,window.PROOF_ATLAS_RECURSION_EXAMPLES.edition];
for(const edition of editions){
  const totals={edition:edition.id,theorems:0,unavailable:0,fixtures:0,tested:0,expandedChecks:0,
    withChangedTargets:0,repeated:0,changed:0,bodyOccurrences:'0'};
  const visits={applications:0n,shared:0n,contextSensitive:0n};
  let largestContributor;
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
    const occurrences=applicationCounts(data,classes);
    checkSubtreeTotal(data,classes,occurrences);
    if(!largestContributor || occurrences.contextSensitive>BigInt(largestContributor.contextSensitive))
      largestContributor={name:r.name,indexSha256:r.indexSha256,applications:String(occurrences.applications),
        contextSensitive:String(occurrences.contextSensitive)};
    for(const field of Object.keys(visits))visits[field]+=occurrences[field];
    if(n<=2000n){
      checkExpandedCounts(data,classes,occurrences);
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
  const occurrenceCounts=Object.fromEntries(Object.entries(visits).map(([key,n])=>[key,String(n)]));
  console.log(JSON.stringify({...totals,occurrenceCounts,largestContributor,declarationResultsSha256:digest.digest('hex')}));
}
