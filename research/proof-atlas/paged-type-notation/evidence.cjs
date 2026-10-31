'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),cp=require('child_process'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/paged-type-notation/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),digest=f=>sha(fs.readFileSync(f)),raw=f=>z.gunzipSync(fs.readFileSync(f)),read=n=>JSON.parse(raw(base+n+'.json.gz'));
function unchanged(files){for(const[file,hash]of Object.entries(files))assert.equal(digest(file),hash,file);}
for(const script of['bindings.cjs','examples.cjs'])cp.execFileSync(process.execPath,[base+script,'--check'],{stdio:'pipe'});
const environment=read('environment'),bindings=read('bindings'),model=read('model-check'),examples=read('examples'),browser=read('browser-check'),compatibility=read('compatibility');
for(const report of[environment,bindings,model,examples,browser,compatibility])assert.equal(report.status,'PASS');
assert.equal(environment.producerSha256,digest(base+'verify.py'));assert(environment.coreReplayBytesMatch);
assert.equal(environment.coreSignatures,20);assert.equal(environment.coreDataFiles,7451);
assert.equal(environment.nativeSha256,sha(raw('research/proof-atlas/type-notation/native.json.gz')));
assert.equal(environment.mathlibArtifactsRestored,false);assert.equal(environment.originalPrivateSourcesRead,false);
assert.equal(bindings.producerSha256,digest(base+'bindings.cjs'));assert.equal(bindings.registries,3);assert.equal(bindings.sourceAppearances,20);
assert.equal(bindings.manifestSha256,digest('public/data/proof-atlas/paged-notation-bindings.js'));
assert.equal(bindings.catalogueSha256,digest('public/data/proof-atlas/type-notation-catalog.js'));
for(const[file,hash]of Object.entries(bindings.parents))assert.equal(sha(raw(file)),hash,file);
for(const[file,hash]of Object.entries(bindings.sourceFiles))assert.equal(sha(raw('.'+file)),hash,file);
unchanged(model.files);unchanged(browser.files);unchanged(compatibility.screenshots);
for(const[key,value]of Object.entries({legacyPackets:150,legacyCuts:11324,regionCases:57,componentRoots:570,fieldDomains:383,adapterEndpoints:18,refinements:82,regionRefinements:272,binderTargets:25348,refusals:14}))assert.equal(model[key],value,key);
assert(model.peakRows<=8192&&model.peakBytes<=4194304&&model.peakObjects<=192);
assert.equal(examples.producerSha256,digest(base+'examples.cjs'));assert.equal(examples.examples.length,5);
assert.equal(examples.fragmentSha256,digest('_includes/proof-atlas-readable-fields.html'));
assert.equal(browser.checkerSha256,digest(base+'check-browser.cjs'));
assert.equal(browser.factDomains,5);assert(browser.symbolSelections>=20&&browser.sourceSelectionsPreserved===browser.symbolSelections);
assert.equal(browser.symbolFocusPreserved,browser.symbolSelections);
assert.equal(browser.inPlaceOpenings,1);assert(browser.outsideSymbols>0);
assert.equal(browser.adapterEndpoints,2);assert.equal(browser.authoredDomains,1);assert.equal(browser.failureRetries,3);
for(const key of['originalBinderTarget','retainedPortSelected','exactHeadSelected','staleAtomRefused','pendingRetirement','clippedLabelMarked','manualEquationRendered'])assert.equal(browser[key],true,key);
assert.equal(browser.wholeArchiveAttempts,0);assert(browser.largePacket.tableRows>90000&&browser.largePacket.cachedRows<browser.largePacket.tableRows);
assert.deepEqual(browser.typedInstanceControls.map(c=>c.result),['9','5']);
assert.equal(browser.audits.length,4);
for(const audit of browser.audits){assert.equal(audit.violations,0);assert.equal(digest(base+audit.file),audit.sha256);assert.equal(audit.typography.font,audit.typography.formulaFont);assert.equal(audit.typography.style,'italic');assert(audit.typography.width<32&&audit.typography.height>=44);}
assert.equal(compatibility.checkerSha256,digest(base+'check-compatibility.cjs'));
assert.equal(Object.keys(compatibility.reports).length,14);
for(const item of Object.values(compatibility.reports)){
 assert.equal(digest(item.file),item.sha256);const report=JSON.parse(raw(item.file));assert.equal(report.status,'PASS');
 const files=report.files||report.builtFiles||{};
 if(Array.isArray(files))for(const row of files)assert.equal(digest(row.file),row.sha256,row.file);else unchanged(files);
}
for(const[file,hash]of Object.entries(browser.files))assert.equal(digest('_site_production/'+file),hash,file);
assert.equal(browser.htmlSha256,digest('_site_production/projects/proof-atlas/manual/paged-network/index.html'));
const files=Object.fromEntries(fs.readdirSync(base).filter(n=>n!=='evidence.json.gz'&&!n.startsWith('failure')&&/\.(?:py|cjs|md|png|json\.gz)$/.test(n)).sort().map(n=>[base+n,digest(base+n)]));
const sourceInputs=Object.fromEntries(['docs/proof-atlas-research-program.md','research/proof-atlas/network-streaming/index.html','research/proof-atlas/binder-block-exchange/index.html','_includes/proof-atlas-readable-fields.html'].map(f=>[f,digest(f)]));
const report={format:'ProofAtlasPagedNotationEvidence/1',status:'PASS',files,sourceInputs,legacyCuts:11324,regionCuts:971,recordedVariants:57,localOpenings:354,
 scope:'Existing recoverable notation through bounded region pages: exact complete-table comparisons, source/computed scope and symbol selection, production lifecycle/failure/layout checks and fourteen compatibility reports. Twenty core signatures replayed freshly; extra signatures reuse matching recorded constant-data identities. No new region typing, general evaluator/codec refinement, semantic compression, reader-study or deployment claim.'};
if(process.argv.includes('--check'))assert.deepEqual(read('evidence'),report);
else{assert(process.argv.includes('--publish'),'Use --publish or --check explicitly');fs.writeFileSync(base+'evidence.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n'),{mtime:0}));}
console.log(JSON.stringify({status:'PASS',files:Object.keys(files).length,legacyCuts:11324,regionCuts:971,compatibilityReports:14}));
