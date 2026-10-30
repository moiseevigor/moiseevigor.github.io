'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),cp=require('child_process'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const {sha,profiles}=require('../method-context/catalogue.cjs');
const base='research/proof-atlas/method-conversion-view/',predecessor='084440e69c75f409e6e91fa331cac2f2d0bd05e1';
const names=['model-check','browser-check','context-browser','flow-model','manual-model','flow-browser','mutual-browser','manual-browser','clarity-browser','figure-check'];
const reports=Object.fromEntries(names.map(name=>[name,JSON.parse(z.gunzipSync(fs.readFileSync(base+name+'.json.gz')))]));
for(const report of Object.values(reports)){
 assert.equal(report.status,'PASS');
 for(const file of ['files','builtFiles'])if(report[file])for(const [name,digest] of Array.isArray(report[file])?report[file].map(x=>[x.file,x.sha256]):Object.entries(report[file]))assert.equal(sha(fs.readFileSync(name)),digest,name);
}
const model=reports['model-check'],browser=reports['browser-check'],context=reports['context-browser'];
for(const [k,v] of Object.entries({profiles:23,frames:65,ports:171,pagedPorts:153,nativeBridges:6,pagedNativeBridges:4,unrecordedBodies:59,unrecordedInputs:106,primitiveReplays:219,boundRefusals:42,mutations:150,ownershipRefusals:201}))assert.equal(model[k],v,k);
for(const [k,v] of Object.entries({manualBridges:6,pagedBridges:4,endpointActions:20,sourceSelectionPreserved:10,unrecordedBodies:1,unrecordedInputs:1,failureRetries:4,staleControls:3}))assert.equal(browser[k],v,k);
assert.equal(browser.accessibility.length,4);assert(browser.accessibility.every(x=>x.violations===0));
assert.equal(context.frames,66);assert.equal(context.contextPortChecks,173);assert.equal(context.accessibilityAudits,4);
assert.equal(sha(fs.readFileSync('_site_production/projects/proof-atlas/manual/index.html')),context.manualHtmlSha256);
assert.equal(context.contextUnavailable,6);assert.equal(context.wholeArchiveAttempts,0);
assert.equal(reports['flow-model'].frames,36);assert.equal(reports['manual-model'].cuts,80);
assert.equal(reports['flow-browser'].pagedFrames,26);assert.equal(reports['flow-browser'].wholeForbiddenArchiveRequests,0);
assert.equal(reports['mutual-browser'].frames,11);assert.equal(reports['manual-browser'].accessibility,9);assert.equal(reports['manual-browser'].links,57);
assert.equal(reports['clarity-browser'].tasks.length,12);assert.equal(reports['clarity-browser'].accessibility.length,8);
for(const audit of reports['clarity-browser'].accessibility)assert.equal(audit.violations,0);
const figures=reports['figure-check'];assert.equal(figures.rows.length,2);for(const row of figures.rows){assert.equal(row.accessibilityViolations,0);assert.equal(sha(fs.readFileSync(row.file)),row.sha256);}assert.equal(sha(fs.readFileSync(base+'capture.cjs')),figures.checkerSha256);
const checkers={'flow-model':'scripts/test-proof-atlas-method-flow.cjs','flow-browser':'scripts/test-proof-atlas-method-flow-browser.cjs','mutual-browser':'scripts/test-proof-atlas-method-mutual-browser.cjs','manual-model':'scripts/test-proof-atlas-manual.cjs','manual-browser':'scripts/test-proof-atlas-manual-browser.cjs','clarity-browser':'scripts/test-proof-atlas-visual-clarity-browser.cjs'};
for(const [name,file] of Object.entries(checkers))if(reports[name].checkerSha256)assert.equal(sha(fs.readFileSync(file)),reports[name].checkerSha256);
assert.equal(sha(fs.readFileSync(base+'check-browser.cjs')),browser.checkerSha256);
const runtime=['public/js/proof-atlas-method-context.js','public/js/proof-atlas-method-conversion.js','public/js/proof-atlas-method-flow.js','public/js/proof-atlas-method-interfaces.js','public/js/proof-atlas-method-source-view.js','public/js/proof-atlas-elimination.js','public/js/proof-atlas-paged-library.js','public/js/proof-atlas-library.js','public/js/proof-atlas-sync.js','public/js/proof-atlas-stream-example.js','public/css/proof-atlas-theme.css','public/data/proof-atlas/method-conversion-manifest.js'];
for(const file of runtime)assert(fs.readFileSync(file).equals(fs.readFileSync('_site_production/'+file)),'unbuilt runtime '+file);
const frozen=['research/proof-atlas/method-conversion/native-check.json.gz','research/proof-atlas/method-conversion/evidence.json.gz','research/proof-atlas/method-context/model-check.json.gz','research/proof-atlas/method-context/primitive-input.json.gz','research/proof-atlas/method-context/browser-check.json.gz',...profiles.flatMap(({d})=>[d.file.slice(1),d.record.indexFile.slice(1)])];
const inputs=[...new Set(frozen)].map(file=>{const bytes=fs.readFileSync(file);assert(bytes.equals(cp.execFileSync('git',['show',predecessor+':'+file],{maxBuffer:67108864})),file);return{file,sha256:sha(bytes)};});
for(const screenshot of browser.screenshots)if(fs.existsSync(base+screenshot.file))assert.equal(sha(fs.readFileSync(base+screenshot.file)),screenshot.sha256);
const local=fs.readdirSync(base).filter(n=>n!=='evidence.json.gz').map(n=>base+n);
const files=[...new Set([...runtime,...local,...Object.values(checkers),'research/proof-atlas/method-context/check-browser.cjs','_includes/proof-atlas-reading-tools.html','_layouts/default.html','projects/proof-atlas/manual/index.html','projects/proof-atlas/library/index.html','docs/proof-atlas-research-program.md','docs/proof-atlas-evidence.md',...Object.keys(reports['model-check'].files)])].sort();
const result={format:'ProofAtlasMethodPortKernelViewEvidence/1',status:'PASS',predecessor,
 model:{...model,files:undefined,rows:undefined},browser:{...browser,builtFiles:undefined},
 context:{...context,files:undefined},inputs,files:files.map(file=>({file,sha256:sha(fs.readFileSync(file))})),
 reports:names.map(name=>({file:base+name+'.json.gz',sha256:sha(fs.readFileSync(base+name+'.json.gz'))})),
 scope:'An optional recorded kernel-conversion relation with exact endpoint/context binding; beta/alpha outcomes stay separate. Six inherited native pairs, four paged peers, bounded graph/byte matching, explicit unavailable states and new production browser checks. No new native run, semantic compression, human comprehension result, merge or deployment. Blog unchanged.'};
const bytes=Buffer.from(JSON.stringify(result,null,2)+'\n');
if(process.argv.includes('--check'))assert.deepEqual(z.gunzipSync(fs.readFileSync(base+'evidence.json.gz')),bytes);
else fs.writeFileSync(base+'evidence.json.gz',z.gzipSync(bytes));
console.log(JSON.stringify({status:'PASS',nativePairs:model.nativeBridges,pagedNativePairs:model.pagedNativeBridges,existingBrowserFrames:context.frames,sha256:sha(bytes)}));
