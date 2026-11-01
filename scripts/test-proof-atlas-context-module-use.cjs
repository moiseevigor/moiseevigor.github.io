'use strict';
const fs=require('fs'),vm=require('vm'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
const A=require('../public/js/proof-atlas-library-data'),C=require('../public/js/proof-atlas-context-modules'),S=require('../public/js/proof-atlas-source-context-modules'),U=require('../public/js/proof-atlas-context-module-use');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),copy=x=>JSON.parse(JSON.stringify(x)),files={},w={};
for(const name of['context-modules-manifest.js','context-types-manifest.js','goedel-sample-manifest.js','reduced-replay-manifest.js']){const file='public/data/proof-atlas/'+name;files[file]=sha(fs.readFileSync(file));vm.runInNewContext(fs.readFileSync(file,'utf8'),{window:w});}
const inv=copy(w),records=[...inv.PROOF_ATLAS_CONTEXT_MODULES.edition.declarations,...inv.PROOF_ATLAS_CONTEXT_TYPES.edition.declarations,...inv.PROOF_ATLAS_AI_SAMPLE.edition.declarations];
function decode(d,file=d.file,digest=d.sha256){const bytes=z.gunzipSync(fs.readFileSync('.'+file));assert.equal(sha(bytes),digest,file);files[file.slice(1)]=sha(fs.readFileSync('.'+file));return JSON.parse(bytes);}
function input(record,source,entry,origin){return{record,entry,origin,kinds:entry.recipe.map(h=>A.kinds[source.kind[h.node]]),payloads:entry.recipe.map(h=>source.payloads[h.node])};}
const {reconstruct}=require('./proof-atlas-context-module-audit.cjs'),fingerprint=require('./proof-atlas-expression-digest.cjs');
const report={format:'ProofAtlasContextModuleUseAudit/1',status:'RUNNING',packages:[],representations:0,sourceHeaders:0,argumentPorts:0,internalDefinitions:0,pages:0,computedWrappers:0,nativeWrapperTargets:0,usesWithDifferentBinders:0,recordedConversions:0,derivedUses:0,maxContextEntries:0,refusals:0,sourceIndices:new Set(),files};let fullExample,reducedExample,letExample;
function audit(model,source,entry,slots){
 assert(Object.isFrozen(model)&&Object.isFrozen(model.ports));assert.equal(model.ports.length,slots.length);assert.equal(model.argumentCount+model.definitionCount,slots.length);
 let prefix=[],argument=0;const pages=[];
 for(let offset=0;offset<model.ports.length;offset+=4){const p=U.page(model,{offset});assert(p.ports.length<=4);pages.push(...p.ports);report.pages++;}assert.deepEqual(pages,model.ports);
 for(const [position,port]of model.ports.entries()){
  const slot=slots[position],header=entry.recipe[slot],kind=A.kinds[source.kind[header.node]],isLet=kind==='letE';assert.equal(port.recipeSlot,slot);assert.equal(port.sourceSlot,entry.discardedPrefix+slot);let depth=0,id=source.roots[header.sourceRoute.root];for(const field of header.sourceRoute.slots){const k=source.kind[id];if((k===6||k===7)&&field===1||k===8&&field===2)depth++;id=source.children[id][field];}assert.equal(port.sourceSlot,depth,'Absolute original context slot');assert.equal(port.sourceBinder.node,A.walk(source,port.sourceBinder.route));assert.deepEqual(port.sourceBinder.route,header.sourceRoute);
  assert.equal(port.sourceDomain.node,A.walk(source,port.sourceDomain.route));assert.equal(port.sourceDomain.node,source.children[header.node][0]);assert.equal(port.name,source.payloads[header.node].binderName||source.payloads[header.node].declName||'_');
  for(const part of['term','type']){const target=port.computedBinders[part];assert.deepEqual(target.route,{root:part==='term'?0:1,slots:prefix});assert.equal(target.constructor,isLet?'letE':part==='term'?'lam':'forallE');}
  if(isLet){assert.equal(port.argument,null);assert.equal(port.kind,'definition');assert.equal(port.sourceValue.node,A.walk(source,port.sourceValue.route));assert.equal(port.sourceValue.node,source.children[header.node][1]);assert.equal(port.computedBinders.term.nondep,false);report.internalDefinitions++;}
  else{assert.equal(port.kind,'argument');assert.equal(port.argument,argument++);assert.equal(port.sourceValue,null);report.argumentPorts++;}
  prefix.push(isLet?2:1);report.sourceHeaders++;report.computedWrappers++;
 }
 assert.equal(argument,model.argumentCount);assert.deepEqual(model.bodySlots,prefix);assert.equal(model.source.node,A.walk(source,model.source.route));assert.equal(model.module.evidenceSha256,model.ports[0]?.computedBinders.term.evidenceSha256||model.module.evidenceSha256);
 if(model.conversion.nativeApplicationQuery)report.recordedConversions++;else report.derivedUses++;
 report.maxContextEntries=Math.max(report.maxContextEntries,model.ports.length);report.sourceIndices.add(model.source.indexSha256);report.representations++;
}
for(const d of inv.PROOF_ATLAS_CONTEXT_TYPES.records){
 const pkg=decode(d),record=records.find(r=>r.name===d.name),source=A.validateIndex(decode(record,record.indexFile,record.indexSha256),record);let count=0;
 for(const entry of pkg.entries){const canonical=entry.selectedTargetTransport?.canonicalRoute?pkg.entries.find(e=>JSON.stringify(e.state.route)===JSON.stringify(entry.selectedTargetTransport.canonicalRoute)):entry;assert(canonical);const prepared=S.graph(source,record,canonical,d);for(const h of entry.recipe)prepared.data.payloads[h.node];prepared.seal();const before=prepared.state(),model=U.fromSource({entry,prepared},record);assert.deepEqual(prepared.state(),before,'Application metadata fetched new source rows after sealing');audit(model,source,entry,entry.recipe.map((_,j)=>j));fullExample??=input(record,source,entry,prepared.origin);if(entry.recipe.length&&model.conversion.nativeApplicationQuery===false)fullExample=input(record,source,entry,prepared.origin);count++;}
 report.packages.push({name:record.name,mode:'full-recorded-context',evidenceSha256:d.sha256,representations:count});
}
function reduced(pkg,d,record,source){const canonical=new Map(),firstBindings=new Map();let count=0,referenceId=null,reference=null;
 for(const entry of pkg.entries){const use=entry.reducedContext;if(use.module.status==='first-checked-module')canonical.set(use.module.id,entry);const first=canonical.get(use.module.id);assert(first);C.validateUse(source,record,first.reducedContext.module,entry);const origin=C.origin(record,first.reducedContext.module,d,'term'),i=input(record,source,entry,origin),model=U.create(i);audit(model,source,entry,use.slots);
  if(referenceId!==use.module.id){const m=first.reducedContext.module;if(m.moduleGraph)reference={...m.moduleGraph,roots:[m.moduleTermRoot,m.moduleTypeRoot]};else{const rebuilt=reconstruct(source,first,first.reducedContext.slots,{maxNodes:131072});reference={...rebuilt.graph,roots:[rebuilt.term,rebuilt.type]};assert.deepEqual(fingerprint.roots(reference,reference.roots),[m.nativeTermShapeSha256,m.nativeExpectedTypeShapeSha256]);}referenceId=use.module.id;}
  for(const port of model.ports)for(const part of['term','type']){const target=port.computedBinders[part],node=A.walk(reference,target.route);assert.equal(A.kinds[reference.kind[node]],target.constructor);const payload=reference.payloads[node];assert.equal(payload.binderName||payload.declName||'_',port.name);if(port.kind==='definition')assert.equal(payload.nondep,false);report.nativeWrapperTargets++;}
  const bindings=model.ports.map(p=>p.sourceBinder);if(!firstBindings.has(use.module.id))firstBindings.set(use.module.id,bindings);else if(JSON.stringify(firstBindings.get(use.module.id))!==JSON.stringify(bindings))report.usesWithDifferentBinders++;
  const contexts=entry.recipe.map((h,j)=>({payload:i.payloads[j],constructor:i.kinds[j]}));assert.deepEqual(U.fromMaterialized({entry,interface:{contexts}},record,origin),model);assert.deepEqual(U.fromSource({entry,prepared:{origin,context:{model:{contexts}}}},record),model);
  reducedExample??=i;if(model.definitionCount)letExample=i;count++;
 }
 report.packages.push({name:record.name,mode:d.format==='ProofAtlasReplayContextModuleDescriptor/1'?'public-packet-reduced-context':'own-reduced-context',evidenceSha256:d.sha256,representations:count});
}
for(const d of inv.PROOF_ATLAS_CONTEXT_MODULES.records){const pkg=decode(d),record=records.find(r=>r.name===d.name),source=A.validateIndex(decode(record,record.indexFile,record.indexSha256),record);reduced(pkg,d,record,source);}
const rd=inv.PROOF_ATLAS_REDUCED_REPLAY,pkg=decode(rd),record=records.find(r=>r.name===rd.source.name),source=A.validateIndex(decode(record,record.indexFile,record.indexSha256),record);
const evidence={format:'ProofAtlasReplayContextModuleDescriptor/1',...pkg.source,sha256:rd.sha256,producerRuntimeSha256:pkg.producer.runtimeSha256,queryInventorySha256:pkg.queryInventorySha256,nativeOutputSha256:pkg.nativeOutputSha256,baselineProofSha256:pkg.baselineProofSha256,environmentSha256:sha(Buffer.from(JSON.stringify(pkg.environment))),environment:pkg.environment,sourceContextEvidence:{...pkg.sourceContextEvidence,status:'earlier-input-record-not-reverified-in-replay'}};
assert.equal(pkg.entries.length,149);reduced(pkg,evidence,record,source);
function refuse(original,edit){const i=copy(original);edit(i);assert.throws(()=>U.create(i));report.refusals++;}
assert(fullExample&&reducedExample&&letExample);
refuse(fullExample,i=>i.origin.source.indexSha256='f'.repeat(64));
refuse(fullExample,i=>i.entry.kernelClosedTermTyping='not-recorded');
refuse(fullExample,i=>i.origin.argumentCount++);
refuse(fullExample,i=>i.entry.discardedPrefix++);
refuse(fullExample,i=>i.payloads.pop());
refuse(fullExample,i=>i.entry.recipe[0].sourceRoute.root=1-i.entry.state.route.root);
refuse(fullExample,i=>i.entry.state.route.slots[i.entry.recipe[0].sourceRoute.slots.length]=0);
refuse(fullExample,i=>i.entry.selectedTargetTransport={status:'kernel-compared-at-selected-target'});
refuse(reducedExample,i=>i.entry.reducedContext.appliedClosureTyping='not-recorded');
refuse(reducedExample,i=>i.origin.moduleId++);
refuse(letExample,i=>{const j=i.entry.reducedContext.slots.findIndex(j=>i.entry.recipe[j].value!==null);i.origin.letSlots[j]=false;});
refuse(letExample,i=>i.entry.reducedContext.slots.reverse());
refuse(letExample,i=>i.origin.letSlots.pop());
for(const options of[{offset:-1},{offset:9999},{limit:5},{limit:0}]){assert.throws(()=>U.page(U.create(letExample),options));report.refusals++;}
assert.equal(U.create(fullExample).conversion.nativeApplicationQuery,false);
for(const file of['public/js/proof-atlas-context-module-use.js','public/js/proof-atlas-context-module-view.js','public/js/proof-atlas-source-context-module-view.js','scripts/test-proof-atlas-context-module-use.cjs','scripts/proof-atlas-context-module-audit.cjs','scripts/proof-atlas-expression-digest.cjs','docs/proof-atlas-research-program.md','research/proof-atlas/network-streaming/index.html','research/proof-atlas/context-modules/README.md','research/proof-atlas/context-modules/module-use.md','.github/workflows/proof-atlas-browser.yml','projects/proof-atlas/library/index.html','_includes/proof-atlas-reading-tools.html','public/js/proof-atlas-sync.js'])files[file]=sha(fs.readFileSync(file));
report.sourceIndices=[...report.sourceIndices].sort();report.status='PASS';report.scope='Finite mapping of authenticated existing full/reduced context observations to ordered closure-application ports, exact original source headers and computed wrappers. Includes all 149 frozen routes in one publisher-attributed AI proof. Full/reduced views overlap and are not independent mathematical proofs. Native observations are reused, not freshly replayed; no arbitrary argument replacement, new descendant typing, semantic compression or comprehension measurement.';
const output='research/proof-atlas/context-modules/module-use-check.json.gz',checking=process.argv.includes('--check')||process.argv.includes('--evidence');
if(checking)assert.deepEqual(JSON.parse(z.gunzipSync(fs.readFileSync(output))),report);else fs.writeFileSync(output,z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n'),{mtime:0}));
if(process.argv.includes('--evidence')){
 const base='research/proof-atlas/context-modules/',browser=JSON.parse(z.gunzipSync(fs.readFileSync(base+'module-use-browser.json.gz'))),compatibility=JSON.parse(z.gunzipSync(fs.readFileSync(base+'module-use-compatibility.json.gz')));
 assert.equal(browser.status,'PASS');assert.equal(browser.checkerSha256,sha(fs.readFileSync('scripts/test-proof-atlas-context-module-use-browser.cjs')));assert.equal(browser.sourceJumps,9);assert.equal(browser.wrapperJumps,6);assert(browser.retiredPageControl&&browser.retiredSourceControl&&browser.failedCodeRetainsSourceAndRetries&&browser.manualEquation);
 for(const[file,digest]of Object.entries(browser.files))assert.equal(sha(fs.readFileSync(file)),digest,file);
 assert.equal(browser.audits.length,4);for(const audit of browser.audits){assert.equal(audit.violations,0);assert.equal(sha(fs.readFileSync(base+audit.file)),audit.sha256);}
 assert.equal(compatibility.status,'PASS');assert.deepEqual(compatibility.reports.map(r=>r.script),['context-modules','source-context-modules','projected-context','replay-context','context-body-focus','context-accounting','proof-steps'].map(n=>'scripts/test-proof-atlas-'+n+'-browser.cjs'));
 for(const row of compatibility.reports){assert.equal(row.exitCode,0);assert.equal(row.result.status,'PASS');assert.equal(sha(fs.readFileSync(row.script)),row.checkerSha256);}
}
console.log(JSON.stringify({...report,files:undefined,packages:report.packages.length,sourceIndices:report.sourceIndices.length}));
