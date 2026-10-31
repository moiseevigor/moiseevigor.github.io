'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),cp=require('child_process'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/dependent-region-inputs/',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const digest=file=>sha(fs.readFileSync(file)),raw=file=>z.gunzipSync(fs.readFileSync(file)),read=name=>JSON.parse(raw(base+name+'.json.gz'));
function unchanged(files){for(const[file,hash]of Object.entries(files))assert.equal(digest(file),hash,file);}
cp.execFileSync(process.execPath,[base+'pack-functions.cjs','--check'],{stdio:'pipe'});
cp.execFileSync(process.execPath,[base+'figure.cjs','--check'],{stdio:'pipe'});
const verification=read('verification'),model=read('model-check'),publication=read('publication'),figure=read('figure'),presentation=read('presentation'),browser=read('browser-check'),compatibility=read('compatibility');
for(const report of[verification,model,publication,figure,presentation,browser,compatibility])assert.equal(report.status,'PASS');
unchanged(verification.producerFiles);unchanged(model.files);unchanged(browser.files);unchanged(compatibility.screenshots);
assert.equal(sha(raw(base+'native.json.gz')),verification.nativeSha256);
assert.equal(sha(raw(base+'ports.json.gz')),verification.refinedPortsSha256);
assert.equal(sha(raw(base+'legacy-ports.json.gz')),verification.legacyPortsSha256);
assert.equal(sha(raw(base+'core-data.json.gz')),verification.coreDataInventorySha256);
assert.equal(publication.producerSha256,digest(base+'publish.cjs'));
assert.equal(publication.manifestSha256,digest('public/data/proof-atlas/dependent-region-controls-manifest.js'));
for(const[file,hash]of Object.entries(publication.frozenInventories))assert.equal(digest('public/data/proof-atlas/'+file),hash,file);
assert.equal(figure.svgSha256,digest(base+'dependent-domain.svg'));assert.equal(presentation.svgSha256,figure.svgSha256);
assert.equal(figure.producerSha256,digest(base+'figure.cjs'));assert.equal(presentation.checkerSha256,digest(base+'render.cjs'));
assert.equal(browser.checkerSha256,digest(base+'check-browser.cjs'));assert.equal(compatibility.checkerSha256,digest(base+'check-compatibility.cjs'));
assert.equal(browser.htmlSha256,digest('_site_production/projects/proof-atlas/manual/paged-network/index.html'));
for(const report of[presentation,browser])for(const audit of report.audits){assert.equal(audit.violations,0);assert.equal(digest(base+audit.file),audit.sha256);}
for(const item of Object.values(compatibility.reports)){
  assert.equal(digest(item.file),item.sha256);const report=JSON.parse(raw(item.file));assert.equal(report.status,'PASS');
  const files=report.files||report.builtFiles||{};
  if(Array.isArray(files))for(const row of files)assert.equal(digest(row.file),row.sha256,row.file);
  else unchanged(files);
}
assert.equal(model.accepted,11);assert.equal(browser.accepted,11);assert.equal(model.rejected,1);assert.equal(browser.rejected,1);
assert.equal(model.ports,32);assert.equal(browser.sourcePorts,32);assert.equal(browser.componentRoots,110);
assert.equal(model.computedBinderPortals,27);assert.equal(browser.domainReferences,27);assert.equal(browser.binderJumps,27);
assert.equal(browser.figureLinks,10);assert.equal(browser.wholeArchiveAttempts,0);assert.equal(browser.foldedControls,4);
assert.equal(browser.linkRefusals,5);assert.equal(browser.sourceLinkRefusals,6);
assert(browser.staleControlRefused&&browser.failureRetry&&browser.pendingRetirement);
assert.equal(model.legacyRefusals,5);assert.equal(model.preservedLegacyTypeTables,27);
assert.equal(model.rejectedLambdaExpansions,5);assert.equal(model.rawComparisonTrueWithoutTyping,5);
const assets={};
for(const[url,record]of Object.entries(publication.assets)){
  const file='.'+url;assert.equal(digest(file),record.gzipSha256,file);assert.equal(sha(raw(file)),record.sha256,file);
  assert(fs.readFileSync(file).equals(fs.readFileSync('_site_production'+url)),file);assets[url]=record.gzipSha256;
}
const folder='public/data/proof-atlas/dependent-region-function-pages/';
for(const name of fs.readdirSync(folder).sort()){
  assert(/^[a-f0-9]{64}\.(?:page|index|manifest)\.gz$/.test(name));const file=folder+name;
  assert.equal(sha(raw(file)),name.slice(0,64));assert(fs.readFileSync(file).equals(fs.readFileSync('_site_production/'+file)));assets['/'+file]=digest(file);
}
for(const[file,hash]of Object.entries(browser.files))assert.equal(digest('_site_production/'+file),hash,file);
assert.equal(digest('_site_production/'+base+'dependent-domain.svg'),figure.svgSha256);
const files=Object.fromEntries(fs.readdirSync(base).filter(name=>name!=='evidence.json.gz'&&!name.startsWith('failure')&&/\.(?:lean|py|cjs|md|svg|png|json\.gz)$/.test(name)).sort().map(name=>[base+name,digest(base+name)]));
const report={format:'ProofAtlasDependentRegionEvidence/1',status:'PASS',files,assets,profiles:4,candidates:12,accepted:11,rejected:1,sourcePorts:32,computedDomainReferences:27,
  sourceHtml:{'research/proof-atlas/network-streaming/index.html':digest('research/proof-atlas/network-streaming/index.html'),'docs/proof-atlas-research-program.md':digest('docs/proof-atlas-research-program.md')},
  scope:'Finite authored dependent-domain calibration: pinned native checks, independent function/zeta reconstruction, exact source/computed production links, bounded delivery, current compatibility and byte identities. No general implementation refinement, arbitrary region typing, broader AI corpus, comprehension measurement or deployment.'};
if(process.argv.includes('--check'))assert.deepEqual(read('evidence'),report);
else{assert(process.argv.includes('--publish'),'Use --publish or --check explicitly.');fs.writeFileSync(base+'evidence.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n'),{mtime:0}));}
console.log(JSON.stringify({status:'PASS',profiles:4,candidates:12,accepted:11,rejected:1,assets:Object.keys(assets).length,files:Object.keys(files).length}));
