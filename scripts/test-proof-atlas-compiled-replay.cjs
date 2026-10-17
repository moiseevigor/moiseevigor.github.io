/* Audit native attestations, source identities and compiled controls; not a JS kernel. */
'use strict';
const fs=require('fs'),vm=require('vm'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
const A=require('../public/js/proof-atlas-library-data'),w={};
for(const f of ['compiled-replay-manifest.js','goedel-sample-manifest.js'])vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+f,'utf8'),{window:w});
const m=w.PROOF_ATLAS_COMPILED_REPLAY,source=w.PROOF_ATLAS_AI_SAMPLE;
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const nativeText=x=>JSON.stringify(canonical(x));
const fields=['kind','children','payloads','expanded','neededScope','roots'];

function table(g){
 assert.equal(g.serialization,'ExprDAG/1');
 const n=g.kind.length;
 assert(n>0&&n<=131072);
 for(const f of fields.filter(f=>f!=='roots'))assert.equal(g[f].length,n);
 for(let i=0;i<n;i++){
  const kind=A.kinds[g.kind[i]],cs=g.children[i];assert(kind);
  assert.equal(cs.length,(A.fields[kind]||[]).length);
  assert(cs.every(c=>Number.isInteger(c)&&c>=0&&c<i));
  assert.equal(BigInt(g.expanded[i]),1n+cs.reduce((v,c)=>v+BigInt(g.expanded[c]),0n));
  const scope=kind==='bvar'?g.payloads[i].index+1:Math.max(0,...cs.map((c,j)=>g.neededScope[c]-((['lam','forallE'].includes(kind)&&j===1||kind==='letE'&&j===2)?1:0)));
  assert.equal(g.neededScope[i],scope);
  if(kind==='sort')A.compileLevels([g.payloads[i].level]);
  if(kind==='const'&&g.payloads[i].levels.length)A.compileLevels(g.payloads[i].levels);
 }
 assert(g.roots.length>0&&g.roots.every(r=>Number.isInteger(r)&&r>=0&&r<n));
 const reached=new Set(g.roots);
 for(let i=n-1;i>=0;i--)if(reached.has(i))for(const c of g.children[i])reached.add(c);
 assert.equal(reached.size,n,'Unreachable compiled node');
}

function validate(data){
 assert.equal(data.format,'ProofAtlasCompiledPacketReplay/1');
 assert.equal(data.edition,source.edition.id);assert.equal(data.leanVersion,'4.33.1');
 assert.deepEqual(data.environment,JSON.parse(JSON.stringify(source.provenance.environment)));
 assert.deepEqual(data.imports,['Mathlib','Aesop']);
 assert.equal(data.originalProofModulesImported,false);assert.equal(data.originalProofProjectsOrDependenciesBuilt,false);
 const expectedFiles=['ExportLibrary.lean','LevelTransportControls.lean','build_recursion_examples.py','evaluate_goedel.py','compiled-replay/Replay.lean','compiled-replay/Controls.lean','compiled-replay/verify.py'].map(f=>'research/proof-atlas/'+f);
 assert.deepEqual(Object.keys(data.producerFiles).sort(),expectedFiles.sort());
 for(const [f,h]of Object.entries(data.producerFiles))assert.equal(sha(fs.readFileSync(f)),h,f);
 const exporter=fs.readFileSync('research/proof-atlas/ExportLibrary.lean','utf8').replace('import SE2Conjugate','import Mathlib\nimport Aesop');
 const levels=fs.readFileSync('research/proof-atlas/LevelTransportControls.lean','utf8').split('def compactGraph')[0].replace(' AtlasOccurrenceTypes','');
 const runtime=exporter+'\n'+levels+'\nend AtlasLevelTransport\nset_option maxRecDepth 8192\nset_option maxHeartbeats 10000000\n'+fs.readFileSync('research/proof-atlas/compiled-replay/Replay.lean','utf8')+'\n'+fs.readFileSync('research/proof-atlas/compiled-replay/Controls.lean','utf8');
 assert.equal(sha(runtime),data.producer.runtimeSourceSha256);
 assert.equal(sha(fs.readFileSync('research/proof-atlas/compiled-replay/verify.py')),data.producer.driverSha256);
 assert.equal(sha(data.rows.map(r=>nativeText(r)+'\n').join('')),data.producer.nativeOutputSha256);
 assert.equal(sha(nativeText(data.controls)),data.producer.controlsSha256);
 assert.equal(data.rows.length,20);assert.equal(source.edition.declarations.length,20);
 assert.equal(new Set(data.rows.map(r=>r.name)).size,20);
 let nodes=0,metadata=0;
 for(const row of data.rows){
  const record=source.edition.declarations.find(r=>r.name===row.name);assert(record);
  assert.equal(row.indexSha256,record.indexSha256);assert.equal(row.storedNodes,record.uniqueNodes);
  assert.deepEqual(row.roundtripFields,fields);
  for(const flag of ['kernelExpectedType','kernelProof','kernelExpectedTypeConversion'])assert.equal(row[flag],'PASS');
  for(const flag of ['originalTheoremAbsentFromEnvironment','originalModuleAbsentFromEnvironment','wrongProofRejectedByKernel','illTypedBinderRejectedByKernel'])assert.equal(row[flag],true);
  assert.deepEqual([...row.axioms].sort(),[...record.axioms].sort());assert(!row.axioms.includes('sorryAx'));
  const raw=z.gunzipSync(fs.readFileSync('.'+record.indexFile));assert.equal(sha(raw),row.indexSha256);
  const g=JSON.parse(raw);A.validateIndex(g,record);table(g);nodes+=g.kind.length;
  assert.equal(g.kind.filter(k=>k===4).length,row.knownBaselineConstantNodes);
  for(let i=0;i<g.kind.length;i++)if(g.kind[i]===10)for(const entry of g.payloads[i].metadata){assert.equal(entry.value.kind,'ofBool');metadata++;}
 }
 assert.deepEqual(data.coverage,{packets:20,storedNodes:nodes,metadataEntries:metadata,metadataValueKinds:['ofBool']});
 const controls=data.controls;assert.equal(controls.format,'ProofAtlasPacketReplayControls/1');
 assert.equal(controls.structural.length,20);const kinds=new Set(),visibility=new Set(),letFlags=new Set(),booleans=new Set();
 for(const c of controls.structural){assert.equal(c.exactStructuralRoundtrip,true);assert.equal(c.kernelChecked,false);table(c.packet);for(let i=0;i<c.packet.kind.length;i++){const k=c.packet.kind[i],p=c.packet.payloads[i];kinds.add(k);if(k===6||k===7)visibility.add(p.binderInfo);if(k===8)letFlags.add(p.nondep);if(k===10)for(const e of p.metadata)booleans.add(e.value.repr);}}
 assert.deepEqual([...kinds].sort((a,b)=>a-b),Array.from({length:12},(_,i)=>i));
 assert.deepEqual([...visibility].sort(),['default','implicit','instImplicit','strictImplicit']);
 assert.deepEqual([...letFlags].sort(),[false,true]);assert.equal(booleans.size,2);
 assert.equal(controls.native.length,4);
 for(const c of controls.native){table(c.packet);assert(c.packet.roots.every(r=>c.packet.neededScope[r]===0));for(const flag of ['kernelExpectedType','kernelTerm','kernelExpectedTypeConversion'])assert.equal(c[flag],'PASS');}
 assert.equal(controls.decoderRejected.length,10);assert.equal(new Set(controls.decoderRejected).size,10);
 assert.equal(controls.kernelRejected.length,3);assert.equal(new Set(controls.kernelRejected).size,3);
 return {nodes,metadata};
}

assert.equal(m.format,'ProofAtlasCompiledReplayManifest/1');assert.equal(m.edition,source.edition.id);
assert.equal(m.records.length,20);assert.equal(new Set(m.records.map(r=>r.name)).size,20);
for(const r of m.records)assert.equal(r.indexSha256,source.edition.declarations.find(d=>d.name===r.name)?.indexSha256);
assert.equal(m.package.file,'/public/data/proof-atlas/compiled-replay/'+m.package.sha256+'.json.gz');
const raw=z.gunzipSync(fs.readFileSync('.'+m.package.file));assert(raw.length<=1048576);
assert.equal(sha(raw),m.package.sha256);assert.equal(raw.length,m.package.decodedBytes);
const data=JSON.parse(raw),counts=validate(data);
let negatives=0;
for(const mutate of [d=>d.rows[0].indexSha256='0'.repeat(64),d=>d.rows.pop(),d=>d.rows[0].kernelProof='FAIL',d=>d.rows[0].originalModuleAbsentFromEnvironment=false,d=>d.rows[0].axioms.push('sorryAx'),d=>d.imports.push('ProofAtlasAI.Original'),d=>d.environment.dependencyRevisions.mathlib='0'.repeat(40),d=>d.controls.structural[0].kernelChecked=true,d=>d.controls.native[0].kernelExpectedTypeConversion='FAIL']){
 const changed=structuredClone(data);mutate(changed);changed.producer.nativeOutputSha256=sha(changed.rows.map(r=>nativeText(r)+'\n').join(''));changed.producer.controlsSha256=sha(nativeText(changed.controls));assert.throws(()=>validate(changed));negatives++;
}
console.log(JSON.stringify({status:'PASS',packets:data.rows.length,storedNodes:counts.nodes,metadataEntries:counts.metadata,constructorKinds:12,structuralControls:20,ownNativeControls:4,decoderRejections:10,kernelRejections:3,wrongProofChecks:20,modifiedAttestationsRejected:negatives,scope:'Public compiled replay attestations and structural audit only. Fresh Lean replay is a separate command; this script is not a kernel.'}));
