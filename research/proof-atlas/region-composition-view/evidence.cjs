'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),vm=require('vm'),cp=require('child_process'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/region-composition-view/',nativeCommit='02c828c00c368987a9940a66cfa88635f76e8041',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const decoded=file=>JSON.parse(z.gunzipSync(fs.readFileSync(file)));
const nativeFiles=['native-check.json.gz','strict-comparison.json.gz'].map(n=>'research/proof-atlas/region-output-composition/'+n);
for(const f of nativeFiles)assert(fs.readFileSync(f).equals(cp.execFileSync('git',['show',nativeCommit+':'+f])),'pinned native record '+f);
const nativeRaw=z.gunzipSync(fs.readFileSync(nativeFiles[0])),native=JSON.parse(nativeRaw),strictRaw=z.gunzipSync(fs.readFileSync(nativeFiles[1])),strict=JSON.parse(strictRaw);
assert.equal(native.verification.status,'PASS');assert.equal(strict.status,'PASS');assert.equal(strict.kernelErrors,0);assert.equal(strict.nativeEvidenceSha256,sha(nativeRaw));
const h={};vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/output-compositions-manifest.js','utf8'),{window:h});
const inventory=JSON.parse(JSON.stringify(h.PROOF_ATLAS_OUTPUT_COMPOSITIONS)),assets=new Set();let cases=0,positions=0,maxRows=0,maxBytes=0;
function read(d){const f=d.file.slice(1),bytes=fs.readFileSync(f),raw=z.gunzipSync(bytes);assert.equal(sha(raw),d.sha256);assert.equal(raw.length,d.bytes);assert(bytes.equals(fs.readFileSync('_site_production/'+f)),'production asset '+f);assets.add(f);return JSON.parse(raw);}
for(const d of inventory.records){const index=read(d);assert.equal(index.nativeEvidenceSha256,sha(nativeRaw));assert.equal(index.strictComparisonSha256,sha(strictRaw));assert.equal(index.isIndependentBoundaryFunction,false);
 for(const c of index.cases){cases++;positions+=c.ports.length;for(const spec of Object.values(c.components)){const component=read(spec);maxRows=Math.max(maxRows,component.graph.kind.length);maxBytes=Math.max(maxBytes,spec.bytes);}}
}
assert.equal(inventory.records.length,3);assert.equal(cases,9);assert.equal(positions,54);assert.equal(assets.size,39);assert(maxRows<=4096&&maxBytes<=1048576);
const reports={};
for(const name of ['model-check','browser-check','output-model','output-browser','network-model','network-browser','context-browser']){
 const f=base+name+'.json.gz',bytes=fs.readFileSync(f),r=decoded(f);assert.equal(r.status,'PASS',name);
 const fingerprints=r.files||r.builtFiles||{};
 for(const [file,digest]of Array.isArray(fingerprints)?fingerprints.map(x=>[x.file,x.sha256]):Object.entries(fingerprints))assert.equal(sha(fs.readFileSync(file)),digest,'current checked file '+file);
 if(r.checkerSha256)assert.equal(sha(fs.readFileSync(name==='network-browser'?'scripts/test-proof-atlas-network-streaming-browser.cjs':base+'check-browser.cjs')),r.checkerSha256);
 reports[name]={sha256:sha(bytes),status:r.status};
}
const model=decoded(base+'model-check.json.gz'),browser=decoded(base+'browser-check.json.gz');
assert.equal(model.fieldCuts,133973);assert.equal(model.componentLoads,36);assert.equal(model.wholeArchiveAttempts,0);assert.equal(model.equalDepthContextsDistinct,true);
assert.equal(browser.sourceOverride,false);assert.equal(browser.cases,9);assert.equal(browser.components,36);assert.equal(browser.componentRoots,72);assert.equal(browser.ports,54);assert.equal(browser.sourceSelectionPreserved,36);assert.equal(browser.wholeArchiveAttempts,0);
for(const flag of ['keyboard','graphSelectionSynchronized','foldedModePreserved','individualViewRestored','isolatedOutsideSelection','parentViewAbort','optionalFailurePreservesIndividual','sourceOnlyUnavailable'])assert.equal(browser[flag],true,flag);
assert.equal(browser.audits.length,4);for(const a of browser.audits){assert.equal(a.violations,0);assert.equal(sha(fs.readFileSync(base+a.file)),a.sha256);}
const previous=decoded(base+'output-browser.json.gz');assert.equal(previous.outputs,18);assert.equal(previous.typeViews,36);assert.equal(previous.keyboard,true);
for(const a of previous.accessibility){assert.equal(a.violations,0);assert.equal(sha(fs.readFileSync(base+a.screenshot)),a.sha256);}
assert.equal(decoded(base+'context-browser.json.gz').live.axeAudits,4);
const files=[...nativeFiles,'docs/proof-atlas-research-program.md','research/proof-atlas/network-streaming/index.html',
 ...Object.keys(browser.files),...['README.md','build-data.cjs','check-model.cjs','check-browser.cjs','check-compatibility.cjs','evidence.cjs'].map(f=>base+f),...assets];
for(const file of Object.keys(browser.files))assert(fs.readFileSync(file).equals(fs.readFileSync('_site_production/'+file)),'built app '+file);
const html=fs.readFileSync('_site_production/projects/proof-atlas/manual/paged-network/index.html','utf8');
for(const marker of ['proof-atlas-output-composition.js?v=1','proof-atlas-output-composition-view.js?v=1','proof-atlas-region-output-view.js?v=2','proof-atlas-network-stream-view.js?v=17','Regroup outputs across scopes'])assert(html.includes(marker),marker);
const report={format:'ProofAtlasCompositionViewEvidence/1',status:'PASS',nativeOwnerCommit:nativeCommit,nativeKernelRerun:false,collections:3,cases:9,positionAppearances:54,distinctSourceOccurrences:17,
 productionBuild:{status:'PASS',htmlSha256:sha(Buffer.from(html)),assetCount:assets.size,sourceOverrides:false},reports,
 files:Object.fromEntries([...new Set(files)].map(f=>[f,sha(fs.readFileSync(f))])),
 limits:{componentGraphs:1,storedRows:4096,decodedComponentBytes:1048576,indexBytes:262144,scopeMetadataBytes:2097152,visibleVertices:4,maxObservedRows:maxRows,maxObservedComponentBytes:maxBytes},
 scope:'Finite navigation of recorded typed output regroupings, with exact original source paths. Native typing/conversion inherited from pinned Lean records. No independent boundary-input function, original-environment identity, human-comprehension measurement, blog change, merge or public deployment.'};
fs.writeFileSync(base+'evidence.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n')));
console.log(JSON.stringify({status:report.status,cases,positions,assets:assets.size,reports:Object.keys(reports)}));
