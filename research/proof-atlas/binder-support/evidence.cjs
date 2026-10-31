'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),assert=require('assert/strict'),crypto=require('crypto'),vm=require('vm');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/binder-support/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),hash=f=>sha(fs.readFileSync(f)),read=f=>JSON.parse(z.gunzipSync(fs.readFileSync(f)));
const laws=read(base+'native-laws.json.gz'),model=read(base+'model-check.json.gz'),consumer=read(base+'consumer-check.json.gz'),browser=read(base+'browser-check.json.gz'),compat=read(base+'compatibility.json.gz');
const fingerprints=files=>{for(const[f,h]of Object.entries(files))assert.equal(hash(f),h,f);};
for(const r of[laws,model,consumer,browser,compat])assert.equal(r.status,'PASS');
fingerprints(laws.producerFiles);assert.equal(sha(Buffer.from(JSON.stringify(laws.observation))),laws.outputSha256);assert.equal(laws.resources.exitCode,0);assert.equal(laws.resources.stopReason,null);assert.equal(laws.observation.laws.length,2);for(const l of laws.observation.laws){assert.equal(l.kernelTyping,'PASS');assert.deepEqual(l.axioms,['propext','Quot.sound']);}
fingerprints(model.files);fingerprints(consumer.files);fingerprints(browser.files);
for(const[key,n]of Object.entries({accepted:29,rejected:2,exchangeSteps:100,rewiredSteps:50,oracleFields:469,refusals:9}))assert.equal(model[key],n,key);
assert.equal(model.oracleOccurrences,'159410130');assert.equal(sha(z.gunzipSync(fs.readFileSync(base+'constructions.json.gz'))),model.constructionsSha256);
assert.equal(consumer.cases,11);assert.equal(consumer.fields,338);assert.equal(consumer.refusals,83);
for(const[key,n]of Object.entries({cases:11,frames:248,relations:586,targetLinks:44,wholeArchiveAttempts:0}))assert.equal(browser[key],n,key);
for(const key of['staleControls','failureRetry','pendingSwitch','keyboard','release'])assert.equal(browser[key],true,key);
assert.equal(browser.sourceOverride,false);assert.equal(hash(base+'check-browser.cjs'),browser.checkerSha256);assert.equal(browser.audits.length,4);
for(const a of browser.audits){assert.equal(a.violations,0);assert.equal(hash(base+a.file),a.sha256);}
assert.equal(hash(base+'check-compatibility.cjs'),compat.checkerSha256);assert.deepEqual(Object.keys(compat.reports),['authored','exchange','corpus']);
for(const[name,item]of Object.entries(compat.reports)){
 assert.equal(item.outputPathsOnly,true);assert.equal(hash(item.originalChecker),item.originalCheckerSha256);assert.equal(hash(item.file),item.sha256);
 const r=read(item.file);assert.equal(r.status,'PASS');assert.equal(r.checkerSha256,item.originalCheckerSha256);assert.equal(r.productionHtmlSha256,browser.productionHtmlSha256);fingerprints(r.files);
 if(name==='corpus'){assert.equal(r.cases,11);assert.equal(r.componentRoots,88);assert.equal(r.spineSelections,248);assert.equal(r.sourceLinks.length,2);assert.equal(r.wholeArchiveAttempts,0);}else assert.equal(r.controls,name==='authored'?12:8);
 for(const a of r.audits){const f=item.images[a.file];assert(f);assert.equal(hash(f.file),f.sha256);assert.equal(f.sha256,a.sha256);}
}
for(const f of Object.keys(browser.files))assert(fs.readFileSync(f).equals(fs.readFileSync('_site_production/'+f)),f);
assert.equal(hash('_site_production/projects/proof-atlas/manual/binder-blocks/index.html'),browser.productionHtmlSha256);
const host={};vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/binder-support-manifest.js','utf8'),{window:host});
const descriptors=JSON.parse(JSON.stringify(host.PROOF_ATLAS_BINDER_SUPPORT.cases)),assets=[];
for(const d of descriptors){const bytes=fs.readFileSync('.'+d.file),raw=z.gunzipSync(bytes);assert.equal(raw.length,d.bytes);assert.equal(sha(raw),d.sha256);assert(raw.length<=131072);assert(bytes.equals(fs.readFileSync('_site_production'+d.file)));const r=JSON.parse(raw);assert.equal(r.nativeCaseSha256,d.nativeCaseSha256);assert.equal(r.nativeInventorySha256,d.nativeInventorySha256);assets.push({file:d.file,sha256:sha(bytes),bytes:bytes.length,decodedBytes:raw.length});}
assert.equal(assets.length,11);assert.equal(assets.reduce((n,a)=>n+a.decodedBytes,0),117464);
const files=Object.fromEntries(['docs/proof-atlas-research-program.md','research/proof-atlas/binder-block-exchange/index.html',...fs.readdirSync(base).filter(n=>/\.(cjs|md|js|css|lean|py|png|gz)$/.test(n)&&n!=='evidence.json.gz'&&!n.startsWith('failure')).map(n=>base+n)].map(f=>[f,hash(f)]));
const report={format:'ProofAtlasBinderSupportAggregate/1',status:'PASS',laws:{kernelChecked:2,axioms:['propext','Quot.sound'],scope:'Named-reference tree substitution algebra; not Lean.Expr correctness'},model:{accepted:29,rejected:2,exchangeSteps:100,rewiredSteps:50,oracleFields:469,oracleOccurrences:model.oracleOccurrences,sharingControl:model.controls},consumer:{cases:11,fields:338,refusals:83},production:{frames:248,relations:586,referencePages:browser.referencePages,targetLinks:44,audits:4,htmlSha256:browser.productionHtmlSha256,wholeArchiveAttempts:0},assets,files,applicationFiles:browser.files,scope:'Exact original-binder reference coefficients for literal type/value/body fields; finite substitution accounting on 100 existing native exchanges and bounded reference navigation. Existing Expr typing judgments are inherited without new Expr queries. Two general named-reference counting laws have fresh core-only native checks. No premise-necessity, general verified Expr compiler, arbitrary graph-region interface, semantic compression, comprehension, merge or deployment claim.'};
const output=Buffer.from(JSON.stringify(report,null,2)+'\n');if(process.argv.includes('--check'))assert(z.gunzipSync(fs.readFileSync(base+'evidence.json.gz')).equals(output));else fs.writeFileSync(base+'evidence.json.gz',z.gzipSync(output));
console.log(JSON.stringify({status:'PASS',model:report.model,consumer:report.consumer,production:report.production,assets:assets.length}));
