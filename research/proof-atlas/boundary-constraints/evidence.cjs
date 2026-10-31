'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict'),cp=require('child_process');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/boundary-constraints/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),digest=f=>sha(fs.readFileSync(f)),read=n=>JSON.parse(z.gunzipSync(fs.readFileSync(base+n+'.json.gz')));
cp.execFileSync(process.execPath,[base+'check.cjs','--check'],{stdio:'pipe'});cp.execFileSync(process.execPath,[base+'figure.cjs','--check'],{stdio:'pipe'});
const native=read('verification'),model=read('model-check'),controls=read('control-verification'),figure=read('figure'),browser=read('browser-check'),compatibility=read('network-browser');
for(const report of[native,model,controls,figure,browser,compatibility])assert.equal(report.status,'PASS');
assert.equal(native.candidates,30);assert.equal(native.passed,29);assert.equal(native.kernelRejected,1);assert.equal(native.unsupported,0);
assert.equal(native.build.runtimeSha256,controls.runtimeSha256);assert.equal(native.build.leanExecutableSha256,controls.leanExecutableSha256);
assert.equal(model.unchangedFunctions,27);assert.equal(model.newlyAccepted,2);assert.equal(model.acceptedDerivedInputs,5);assert.equal(model.partialDerivedInputs,3);assert.equal(model.refusals,30);
assert.equal(controls.accepted,2);assert.equal(controls.refusals,7);assert.equal(figure.links.length,6);assert.equal(figure.computed.length,2);
assert.equal(figure.edges.filter(e=>e.relation==='computed-value-use').length,6);assert.equal(figure.edges.filter(e=>e.relation==='recorded-result-type').length,2);
assert.equal(figure.producerSha256,digest(base+'figure.cjs'));assert.equal(figure.svgSha256,digest(base+'boundary-equations.svg'));assert.equal(browser.checkerSha256,digest(base+'check-browser.cjs'));assert.equal(browser.sourceLinks,6);
for(const a of browser.audits){if(a.violations!==undefined)assert.equal(a.violations,0);assert.equal(digest(base+a.file),a.sha256);}
for(const[f,h]of Object.entries(browser.files)){assert.equal(digest(f),h);assert.equal(digest('_site_production/'+f),h);}
assert.equal(browser.htmlSha256,digest('_site_production/projects/proof-atlas/manual/paged-network/index.html'));
const built=compatibility.files||compatibility.builtFiles||{};if(Array.isArray(built))for(const r of built)assert.equal(digest(r.file),r.sha256);else for(const[f,h]of Object.entries(built))assert.equal(digest(f),h);
assert.equal(compatibility.checkerSha256,digest('scripts/test-proof-atlas-network-streaming-browser.cjs'));assert.equal(compatibility.nativeCalls,162);assert.equal(compatibility.nativeWires,101);assert.equal(compatibility.wholeArchiveAttempts,0);assert.equal(compatibility.axeAudits,4);assert.equal(compatibility.html.sourceSha256,digest('research/proof-atlas/network-streaming/index.html'));
const networkRun=read('network-run');assert.equal(networkRun.status,'PASS');assert.equal(networkRun.checkerSha256,digest(base+'check-network.cjs'));assert.equal(networkRun.reportSha256,digest(base+'network-browser.json.gz'));assert.equal(networkRun.originalCheckerSha256,compatibility.checkerSha256);
const files=Object.fromEntries(fs.readdirSync(base).filter(n=>n!=='evidence.json.gz'&&!n.startsWith('failure')&&/\.(?:lean|py|cjs|md|svg|png|json\.gz)$/.test(n)).sort().map(n=>[base+n,digest(base+n)]));
const sourceInputs=Object.fromEntries(['docs/proof-atlas-research-program.md','research/proof-atlas/network-streaming/index.html'].map(f=>[f,digest(f)]));
const report={format:'ProofAtlasBoundaryConstraintEvidence/1',status:'PASS',files,sourceInputs,candidates:30,accepted:29,unchangedFunctions:27,newlyAccepted:2,acceptedDerivedPositions:5,partialDerivedPositions:3,
 scope:'Finite source-specializing input equations, complete independent constructor reconstruction, original source/value and result recovery, authored refusals and source-linked visual rule. Earlier direct and adapter policies are unchanged. Higher-order inference, arbitrary graph interfaces, general preservation, comprehension and deployment remain unproved.'};
if(process.argv.includes('--check'))assert.deepEqual(read('evidence'),report);else{assert(process.argv.includes('--publish'),'Use --check or --publish');fs.writeFileSync(base+'evidence.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n'),{mtime:0}));}
console.log(JSON.stringify({status:'PASS',files:Object.keys(files).length,candidates:30,accepted:29,newlyAccepted:2}));
