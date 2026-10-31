'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/source-template-laws/',files={};
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function pin(file,expected){const actual=sha(fs.readFileSync(file));if(expected)assert.equal(actual,expected,file);files[file]=actual;return actual;}
function read(name){const file=base+name+'.json.gz';pin(file);return JSON.parse(z.gunzipSync(fs.readFileSync(file)));}
const input=read('instances'),model=read('model-check'),native=read('native'),verification=read('verification');
for(const report of[model,native,verification])assert.equal(report.status,'PASS');
for(const reportFiles of[model.files,verification.producerFiles])for(const[file,digest]of Object.entries(reportFiles))pin(file,digest);
assert.equal(verification.nativeSha256,sha(z.gunzipSync(fs.readFileSync(base+'native.json.gz'))));
assert.equal(input.instances.length,8);assert.equal(verification.instances,8);assert.equal(model.instances.length,8);assert.equal(native.instances.length,8);assert.equal(model.refusals,11);
const names=['scoped_mono','plug_scoped','plug_compose','closed_compose','recovery','template_scoped','same_template_same_source','two_stage_recovery','plug_count','recovery_count','open_cut_refused','open_image_breaks_scope','capture_17','capture_18','distinct_specializations'].map(n=>'ProofAtlas.SourceRecovery.'+n);
for(let i=0;i<8;i++)for(const n of['recovered','recovered_count','closed_images'])names.push('Instance'+i+'.'+n);
assert.deepEqual(Object.keys(verification.axioms).sort(),names.sort());
for(const axioms of Object.values(verification.axioms))assert(axioms.every(a=>a==='propext'));
for(const n of['capture_17','capture_18','distinct_specializations'])assert.deepEqual(verification.axioms['ProofAtlas.SourceRecovery.'+n],[]);
assert.deepEqual(verification.certificateRefusals.map(r=>r.mutation),['wrong-recovery-image','changed-binder-annotation','wrong-source-root']);
const policy=verification.resourcePolicy;
assert.equal(policy.kind,'installed-core-only/1');assert.equal(policy.networkAllowed,false);assert.equal(policy.dependencyRestorationAllowed,false);
assert.equal(verification.resources.length,4);
for(const r of[...verification.resources,...verification.certificateRefusals.map(r=>r.resources)]){
 assert.equal(r.stopReason,null);assert(r.maxProcessGroupRssBytes<=policy.maximumProcessGroupRssBytes);assert(r.maxScratchBytes<=policy.maximumScratchBytes);assert(r.seconds<=policy.timeoutSeconds+5);
}
assert(verification.resources.every(r=>r.exitCode===0));assert(verification.certificateRefusals.every(r=>r.leanCertificateAccepted===false&&r.resources.exitCode!==0));
for(const key of['originalProofScriptsRead','dependencyCacheRestored','generatedInstanceSourcesPublished','representedMathematicsRetyped'])assert.equal(verification[key],false);
let rows=0,certificates=0;
const cases=input.instances.map((instance,index)=>{
 const result=native.instances[index],g=instance.graph,c=instance.counts;assert.equal(result.index,index);
 for(const field of['contextOpening','memoRecovery','nativeReplaceFVars'])assert.equal(result[field],'PASS');
 for(const field of['kind','children','payloads','expanded','neededScope'])assert.deepEqual(result.rows[field],g[field]);
 assert.deepEqual(result.rows.roots,Array.from({length:g.kind.length},(_,i)=>i));
 for(const[field,key]of[['sourceOccurrences','source'],['templateOccurrences','template'],['weightedOccurrences','weighted']])assert.equal(result[field],c[key]);
 assert.equal(result.recoveryStates,c.templateDAGRows);assert.equal(c.source,c.weighted);assert.equal(c.storedRows,g.kind.length);assert.equal(c.certificateRows,instance.records.length);
 assert.equal(model.instances[index].rows,g.kind.length);assert.equal(model.instances[index].proofNodes,instance.records.length);
 rows+=g.kind.length;certificates+=instance.records.length;
 return{owner:instance.owner,bindingKey:instance.bindingKey,counts:c};
});
assert.equal(rows,1557);assert.equal(rows,verification.rowRoundtrips);assert.equal(certificates,427);
assert.equal(cases.filter(c=>c.owner.kind==='recorded-corpus-template').length,3);
assert.equal(cases.filter(c=>c.owner.kind==='authored-native-control').length,4);
assert.deepEqual([...new Set(input.instances.at(-1).graph.kind)].sort((a,b)=>a-b),Array.from({length:12},(_,i)=>i));
assert.equal(cases.at(-1).owner.mathematicalTyping,false);
const first=input.instances[0],images=first.selectedGroups.map(i=>first.groups[i]);assert.equal(images.length,2);
assert.deepEqual(images.map(i=>first.graph.expanded[i.source]),['13','13']);
function occurrencesOf(g,target){const counts=[];for(let n=0;n<g.kind.length;n++)counts.push(n===target?1n:g.children[n].reduce((sum,c)=>sum+counts[c],0n));return counts[g.roots[1]];}
assert.deepEqual(images.map(i=>occurrencesOf(first.graph,i.target)),[1n,1n]);
assert.equal(81n-2n+13n+13n,BigInt(first.counts.source));assert.equal(first.counts.template,'81');
const browser=read('browser-check');assert.equal(browser.status,'PASS');pin(base+'check-browser.cjs',browser.checkerSha256);
for(const[file,hash]of Object.entries(browser.files))pin(file,hash);
assert.equal(browser.audits.length,4);for(const audit of browser.audits){assert.equal(audit.violations,0);pin(base+audit.file,audit.sha256);}
assert(browser.evidenceSearch);assert.equal(browser.originalLambdaSelection.nativeCaseSha256,first.owner.nativeCaseSha256);
for(const name of['README.md','evidence.cjs'])pin(base+name);
for(const file of['research/proof-atlas/network-streaming/index.html','docs/proof-atlas-research-program.md','docs/proof-atlas-evidence.md'])pin(file);
const evidence={format:'ProofAtlasSourceRecoveryEvidence/1',status:'PASS',files,cases,
 observations:{generalStructuralLaws:12,typedControlDeclarations:3,instanceDeclarations:24,rowRoundtrips:rows,certificateNodes:certificates,modelRefusals:model.refusals,leanCertificateRefusals:3,firstRiccati:{source:'105',template:'81',captureOccurrences:['1','1'],imageOccurrences:['13','13']}},
 scope:'Current-byte binding of general Lean.Expr laws, frozen finite certificates, native constructor comparisons and documentation. This checks saved verification evidence; it is not a new compiler run, proof of executor/codec refinement, mathematical typing preservation or comprehension measurement.'};
if(process.argv.includes('--write'))fs.writeFileSync(base+'evidence.json.gz',z.gzipSync(Buffer.from(JSON.stringify(evidence,null,2)+'\n'),{mtime:0}));else assert.deepEqual(JSON.parse(z.gunzipSync(fs.readFileSync(base+'evidence.json.gz'))),evidence);
console.log(JSON.stringify({status:evidence.status,...evidence.observations}));
