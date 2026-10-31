'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),cp=require('child_process'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/region-input-adapters/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),digest=f=>sha(fs.readFileSync(f)),raw=f=>z.gunzipSync(fs.readFileSync(f)),read=n=>JSON.parse(raw(base+n+'.json.gz'));
function unchanged(files){for(const[file,hash]of Object.entries(files))assert.equal(digest(file),hash,file);}
cp.execFileSync(process.execPath,[base+'pack-functions.cjs','--check'],{stdio:'pipe'});cp.execFileSync(process.execPath,[base+'figure.cjs','--check'],{stdio:'pipe'});
const verification=read('verification'),model=read('model-check'),pages=read('pages-check'),figure=read('figure'),presentation=read('presentation'),browser=read('browser-check'),compatibility=read('compatibility');
for(const r of[verification,model,pages,figure,presentation,browser,compatibility])assert.equal(r.status,'PASS');
unchanged(verification.producerFiles);unchanged(model.files);unchanged(pages.files);unchanged(browser.files);unchanged(compatibility.screenshots);
assert.equal(sha(raw(base+'native.json.gz')),verification.nativeSha256);
for(const[file,hash]of Object.entries(verification.parents))assert.equal(sha(raw(file)),hash,file);
assert.equal(verification.passed,30);assert.equal(verification.candidates,30);assert.equal(verification.adapterInputs,9);
assert.equal(model.accepted,30);assert.equal(model.formerlyRejected,3);assert.equal(model.unchangedFunctions,27);assert.equal(model.adapters,9);assert.equal(model.refusals,81);
assert.equal(pages.components,300);assert.equal(pages.rowComparisons,281756);assert.equal(pages.bindingPortals,555);assert.equal(pages.refusals,120);assert(pages.peakCachedRows<=64&&pages.peakIndexPages<=2);
assert.equal(browser.cases,30);assert.equal(browser.componentRoots,300);assert.equal(browser.adapterDomains,9);assert.equal(browser.adapterEndpoints,18);assert.equal(browser.sourceConnections,9);assert.equal(browser.directRejectionsRetained,3);assert.equal(browser.figureLinks,10);assert.equal(browser.wholeArchiveAttempts,0);
assert(browser.staleAdapterRefused&&browser.failureRetry&&browser.pendingRuleRetired);assert.equal(browser.linkRefusals,3);
assert.equal(figure.producerSha256,digest(base+'figure.cjs'));assert.equal(figure.nativeSha256,verification.nativeSha256);assert.equal(figure.svgSha256,digest(base+'adapter-wires.svg'));
assert.equal(presentation.svgSha256,figure.svgSha256);assert.equal(presentation.checkerSha256,digest(base+'render.cjs'));assert.equal(browser.checkerSha256,digest(base+'check-browser.cjs'));assert.equal(compatibility.checkerSha256,digest(base+'check-compatibility.cjs'));
for(const r of[presentation,browser])for(const a of r.audits){assert.equal(a.violations,0);assert.equal(digest(base+a.file),a.sha256);}
for(const item of Object.values(compatibility.reports)){
 assert.equal(digest(item.file),item.sha256);const report=JSON.parse(raw(item.file));assert.equal(report.status,'PASS');const files=report.files||report.builtFiles||{};
 if(Array.isArray(files))for(const row of files)assert.equal(digest(row.file),row.sha256,row.file);else unchanged(files);
}
assert.equal(Object.keys(compatibility.reports).length,11);
const assets={},folder='public/data/proof-atlas/region-adapter-function-pages/';
for(const name of fs.readdirSync(folder).sort()){
 assert(/^[a-f0-9]{64}\.(?:page|index|manifest)\.gz$/.test(name));const file=folder+name;
 assert.equal(sha(raw(file)),name.slice(0,64));assert(fs.readFileSync(file).equals(fs.readFileSync('_site_production/'+file)));assets[file]=digest(file);
}
assert.equal(Object.keys(assets).length,4531);
for(const[file,hash]of Object.entries(browser.files))assert.equal(digest('_site_production/'+file),hash,file);
assert.equal(browser.htmlSha256,digest('_site_production/projects/proof-atlas/manual/paged-network/index.html'));
const files=Object.fromEntries(fs.readdirSync(base).filter(n=>n!=='evidence.json.gz'&&!n.startsWith('failure')&&/\.(?:lean|py|cjs|md|svg|png|json\.gz)$/.test(n)).sort().map(n=>[base+n,digest(base+n)]));
const report={format:'ProofAtlasRegionInputAdapterEvidence/1',status:'PASS',files,assets,candidates:30,formerlyRejected:3,unchangedFunctions:27,adapterInputs:9,
 sourceHtml:{'research/proof-atlas/network-streaming/index.html':digest('research/proof-atlas/network-streaming/index.html'),'docs/proof-atlas-research-program.md':digest('docs/proof-atlas-research-program.md')},
 scope:'Finite conditional proof-input composition: pinned native typing/recovery, complete independent reconstruction, paged rows/scopes, exact source/computed production selections and current compatibility. Additional adapters are assumptions; no general existence, semantic compression, evaluator refinement, comprehension or deployment claim.'};
if(process.argv.includes('--check'))assert.deepEqual(read('evidence'),report);else{assert(process.argv.includes('--publish'),'Use --publish or --check explicitly');fs.writeFileSync(base+'evidence.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n'),{mtime:0}));}
console.log(JSON.stringify({status:'PASS',candidates:30,adapters:9,assets:Object.keys(assets).length,files:Object.keys(files).length}));
