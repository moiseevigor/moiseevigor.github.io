'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/source-template-pages/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=f=>JSON.parse(z.gunzipSync(fs.readFileSync(f))),files={},screenshots={};
function pin(file,expected){const digest=sha(fs.readFileSync(file));if(expected)assert.equal(digest,expected,file);files[file]=digest;return digest;}
function checkReport(file){const report=read(file);assert.equal(report.status,'PASS',file);pin(file);for(const[f,hash]of Object.entries(report.files||{}))pin(f,hash);return report;}
const model=checkReport(base+'model-check.json.gz'),browser=checkReport(base+'browser-check.json.gz');assert.equal(browser.checkerSha256,pin(base+'check-browser.cjs'));
assert.equal(model.cases,30);assert.equal(model.components,424);assert.equal(model.sourcePorts,339);assert.equal(model.variablePortTargets,207);assert.equal(model.fixedPorts,132);assert.equal(browser.sourcePorts,113);assert.equal(browser.sourceResults,31);assert.equal(browser.sourceRecoveryFields,92);
assert(browser.stableKeyDeepLink&&browser.staleBindingRefused&&browser.staleConstructorRefused&&browser.unmappedCleared&&browser.unmappedTypeCleared&&browser.unknownKeyRefused&&browser.keyboardPagingPreserved);
for(const item of browser.audits){assert.equal(item.violations,0);const file=base+item.file;screenshots[file]=pin(file,item.sha256);}
assert.equal(browser.audits.length,4);const html='_site_production/projects/proof-atlas/manual/paged-network/index.html';assert.equal(sha(fs.readFileSync(html)),browser.htmlSha256);
for(const name of['compatibility-models','compatibility-browsers']){const report=checkReport(base+name+'.json.gz');assert.equal(report.checkerSha256,pin(base+'check-compatibility.cjs'));for(const item of Object.values(report.reports)){assert.equal(pin(item.file),item.sha256);checkReport(item.file);}for(const[file,digest]of Object.entries(report.screenshots))screenshots[file]=pin(file,digest);}
const environment=checkReport(base+'notation-environment.json.gz');assert.equal(environment.producerSha256,pin(base+'registry.cjs'));assert.equal(environment.constantDataFiles,26070);assert.equal(environment.nativeInventorySha256,sha(z.gunzipSync(fs.readFileSync('research/proof-atlas/source-template-inputs/native.json.gz'))));
pin(base+'constant-data.json.gz');pin(base+'README.md');pin(base+'verify.cjs');pin('research/proof-atlas/network-streaming/index.html');pin('docs/proof-atlas-research-program.md');
for(const file of Object.keys(browser.files))assert(fs.readFileSync('_site_production/'+file).equals(fs.readFileSync(file)),'Production asset drift: '+file);
const host={},assets=new Map(),assetBase='/public/data/proof-atlas/region-function-pages/';
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/source-template-function-pages-manifest.js','utf8'),{window:host});
function asset(ref,extension){
 assert.equal(ref.file,assetBase+ref.sha256+'.'+extension+'.gz');assert(/^[a-f0-9]{64}$/.test(ref.sha256));
 if(assets.has(ref.file)){const prior=assets.get(ref.file);assert.equal(prior.bytes,ref.bytes);return prior.value;}
 const file=ref.file.slice(1),bytes=fs.readFileSync(file);assert(bytes.equals(fs.readFileSync('_site_production/'+file)),file);pin(file);
 const raw=z.gunzipSync(bytes,{maxOutputLength:extension==='page'?1048576:extension==='index'?16384:262144});assert.equal(raw.length,ref.bytes);assert.equal(sha(raw),ref.sha256);
 const value=JSON.parse(raw);assets.set(ref.file,{bytes:raw.length,value});return value;
}
function index(ref){const value=asset(ref,'index');for(const child of value.children){const extension=value.level?'index':'page',file=assetBase+child.sha256+'.'+extension+'.gz';if(extension==='index')index({...child,file});else asset({...child,file},extension);}}
for(const profile of host.PROOF_ATLAS_SOURCE_TEMPLATE_FUNCTION_PAGES.profiles)for(const d of profile.cases){const m=asset(d,'manifest');index({file:assetBase+m.indexRoot+'.index.gz',sha256:m.indexRoot,bytes:m.indexSizes[m.indexRoot]});}
assert.equal(assets.size,4534);
const evidence={format:'ProofAtlasSourceTemplatePageEvidence/1',status:'PASS',nativeInventorySha256:environment.nativeInventorySha256,productionHtmlSha256:browser.htmlSha256,files,screenshots,
 observations:{recordedCandidates:30,componentRoots:model.components,allPolicySourcePorts:model.sourcePorts,allPositionSourcePorts:browser.sourcePorts,allPositionResults:browser.sourceResults,derivedPositions:model.derivedDefinitions,templates:model.templates,declarationPermutations:model.permutations,notationScenes:model.notationScenes,refusals:model.refusals,pageRows:model.peakRows,indexPages:model.peakIndices,browserThemeLayouts:browser.audits.length,productionAssets:assets.size},
 scope:'Links frozen native observations to the executed reader/model/browser checks and actual production bytes. Recorded environment equality is not a fresh kernel replay. Finite interface navigation and delivery evidence; no general soundness theorem, semantic compression or human-comprehension measurement.'};
if(process.argv.includes('--write'))fs.writeFileSync(base+'evidence.json.gz',z.gzipSync(Buffer.from(JSON.stringify(evidence,null,2)+'\n'),{mtime:0}));else assert.deepEqual(read(base+'evidence.json.gz'),evidence);console.log(JSON.stringify({status:'PASS',files:Object.keys(files).length,screenshots:Object.keys(screenshots).length,observations:evidence.observations}));
