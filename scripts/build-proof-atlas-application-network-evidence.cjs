/* Reuse immutable native evidence; separately attest the new topology, cut laws and browser. */
'use strict';
const fs=require('fs'),vm=require('vm'),crypto=require('crypto'),z=require('zlib'),assert=require('assert/strict'),{execFileSync}=require('child_process');
const base='research/proof-atlas/application-network/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=f=>JSON.parse(fs.readFileSync(f));
const original='research/proof-atlas/application-ports/application-ports-evidence.json',previous=read(original),derivation=read(base+'derivation.json'),unit=read(base+'audit.json'),browser=read(base+'browser-audit.json');
for(const r of [previous,derivation,unit,browser])assert.equal(r.status,'PASS');
for(const item of previous.files)assert.equal(sha(fs.readFileSync(item.file)),item.sha256,'immutable prior evidence source changed: '+item.file);
assert.equal(sha(fs.readFileSync(original)),derivation.nativeEvidenceSha256);
assert.equal(sha(fs.readFileSync(base+'build.cjs')),derivation.producerSha256);
for(const d of unit.files)assert.equal(sha(fs.readFileSync(d.file)),d.sha256);
assert.equal(sha(fs.readFileSync('scripts/test-proof-atlas-application-network-browser.cjs')),browser.checkerSha256);
for(const [file,hash]of Object.entries(browser.builtFiles))assert.equal(sha(fs.readFileSync(file)),hash,'browser source changed: '+file);
assert.equal(sha(fs.readFileSync(browser.html.source)),browser.html.sourceSha256);
assert.equal(browser.html.normalization,'Only four shared CSS build-time query versions');
const html=fs.readFileSync('_site_production/projects/proof-atlas/manual/application-network/index.html','utf8').replace(/(href="\/public\/css\/(?:site|distill|syntax|theme)\.css\?v=)\d+(")/g,'$1BUILD_TIME$2');
assert.equal(sha(Buffer.from(html)),browser.html.normalizedSha256);
// Reconstruct every derived edge and type bridge from the authenticated native records.
const reconstructed=JSON.parse(execFileSync(process.execPath,[base+'build.cjs','--check'],{encoding:'utf8'}));assert.deepEqual(reconstructed,derivation);
assert.equal(derivation.connections,101);assert.equal(derivation.bindingConnections,7);assert.equal(derivation.sharedResults,1);
assert.equal(unit.ports,787);assert.equal(unit.collapseRoundtrips,476);assert.equal(unit.typedPortSelections,787);assert.equal(unit.staleRefusals,1);
assert.equal(browser.callSelections,162);assert.equal(browser.wireSelections,101);assert.equal(browser.bindingSelections,7);assert.equal(browser.axeAudits,4);assert.equal(browser.downloadChecks,2);assert.equal(browser.wholeArchiveAttempts,0);assert.equal(browser.staleRefusals,1);assert.equal(browser.nativeHashRefusals,1);assert.equal(browser.topologyHashRefusals,1);
const h={};vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/application-network-manifest.js','utf8'),{window:h});const inventory=h.PROOF_ATLAS_APPLICATION_NETWORK;
assert.equal(inventory.format,'ProofAtlasApplicationNetworkInventory/1');assert.equal(inventory.nativeEvidenceSha256,sha(fs.readFileSync(original)));
const topologyFiles=inventory.records.map(d=>{const bytes=z.gunzipSync(fs.readFileSync('.'+d.topology.file));assert.equal(sha(bytes),d.topology.sha256);assert.equal(bytes.length,d.topology.bytes);return d.topology.file.slice(1);});
assert.equal(z.gunzipSync(fs.readFileSync('public/data/proof-atlas/application-network-audit.json.gz')).toString(),fs.readFileSync(base+'audit.json','utf8'));
const files=[...new Set([__filename.replace(process.cwd()+'/',''),'scripts/test-proof-atlas-application-network.cjs','scripts/test-proof-atlas-application-network-browser.cjs',...unit.files.map(d=>d.file),...Object.keys(browser.builtFiles),...topologyFiles,original,base+'README.md',base+'index.html',base+'audit.json',base+'browser-audit.json',base+'derivation.json','public/data/proof-atlas/application-network-audit.json.gz'])].sort();
const out={format:'ProofAtlasApplicationNetworkEvidence/1',status:'PASS',publication:'Local research experiment. No blog, PR, push or public deployment.',scope:'Exact occurrence composition over the earlier finite application inventory. Native observations are reused by immutable hash, not re-executed. No semantic necessity, whole-proof completeness, arbitrary-corpus topology scaling or human-comprehension claim.',native:{file:original,sha256:sha(fs.readFileSync(original)),unchangedSourceAssets:previous.files.length,leanVersion:'4.33.1',newKernelRuns:0},derivation,unit,browser,files:files.map(file=>({file,sha256:sha(fs.readFileSync(file))}))};
const bytes=JSON.stringify(out,null,2)+'\n';for(const file of [base+'application-network-evidence.json','public/data/proof-atlas/application-network-evidence.json.gz']){const payload=file.endsWith('.gz')?z.gzipSync(Buffer.from(bytes)):Buffer.from(bytes);if(process.argv.includes('--check'))assert(fs.readFileSync(file).equals(payload),'network evidence stale');else fs.writeFileSync(file,payload);}
console.log(JSON.stringify({status:'PASS',calls:unit.calls,ports:unit.ports,connections:unit.connections,cuts:unit.cuts,collapseRoundtrips:unit.collapseRoundtrips,browserCalls:browser.callSelections,browserWires:browser.wireSelections,evidenceSha256:sha(Buffer.from(bytes))}));
