'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/type-notation/',origin=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8877',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=f=>JSON.parse(z.gunzipSync(fs.readFileSync(f)));
(async()=>{
 const model=read(base+'model.json.gz'),browser=read(base+'browser.json.gz'),compat=read(base+'compatibility.json.gz'),native=read(base+'verification.json.gz'),replay=read(base+'replay.json.gz'),extra=read(base+'extra-verification.json.gz'),catalog=read(base+'catalog.json.gz'),report={format:'ProofAtlasNotationProduction/1',status:'PASS',sourceOverride:false,files:{}};
 for(const record of[model,browser,compat,native,replay,extra,catalog])assert.equal(record.status,'PASS');
 assert.equal(browser.sourceOverride,false);assert.equal(browser.queries,150);assert.equal(browser.originalBinderJumps,22);assert.equal(browser.wholeArchiveRequests,0);assert(browser.notationRoots>=150);assert.equal(browser.audits.length,4);assert(browser.audits.every(a=>a.violations===0));assert.equal(model.nativeCuts,11324);assert.equal(catalog.entries,53);assert.equal(catalog.overlappingSignatures,10);assert.equal(extra.ownedRuntimeRetired,true);assert.equal(Object.keys(compat.reports).length,8);
 for(const record of[native,replay,extra])for(const[f,h]of Object.entries(record.producerFiles))assert.equal(sha(fs.readFileSync(f)),h,f);
 assert.equal(native.nativeSha256,replay.nativeSha256);assert.equal(sha(z.gunzipSync(fs.readFileSync(base+'native.json.gz'))),native.nativeSha256);assert.equal(sha(z.gunzipSync(fs.readFileSync(base+'extra-native.json.gz'))),extra.nativeSha256);
 for(const[f,h]of Object.entries({...model.files,...browser.files}))assert.equal(sha(fs.readFileSync(f)),h,f);
 assert.equal(sha(fs.readFileSync(base+'check-browser.cjs')),browser.checkerSha256);assert.equal(sha(fs.readFileSync(base+'check-compatibility.cjs')),compat.checkerSha256);assert.equal(sha(fs.readFileSync(base+'catalog.cjs')),catalog.producerSha256);
 for(const entry of[...Object.values(compat.reports),compat.pageConsumer,compat.consumer]){
  assert.equal(sha(fs.readFileSync(entry.file)),entry.sha256);assert.equal(sha(fs.readFileSync(entry.originalChecker)),entry.originalCheckerSha256);assert.equal(entry.outputPathsOnly,true);assert.equal(read(entry.file).status,'PASS');for(const image of Object.values(entry.images||{}))assert.equal(sha(fs.readFileSync(image.file)),image.sha256);
 }
 assert.equal(compat.consumer.configuration.catalogSha256,catalog.sha256);assert.equal(read(compat.consumer.file).queries,150);
 for(const audit of browser.audits)assert.equal(sha(fs.readFileSync(base+audit.file)),audit.sha256);
 // Only post-build technical evidence is synchronized. Application JS/CSS and
 // generated HTML must come from the actual Jekyll build and already match.
 const technical=fs.readdirSync(base).filter(f=>/\.(cjs|gz|png|md)$/.test(f)&&f!=='production.json.gz');for(const name of technical){assert(!/^failure\./.test(name));fs.copyFileSync(base+name,'_site_production/'+base+name);}
 const published=[...new Set([...Object.keys(model.files).filter(f=>f.startsWith('public/')),...Object.keys(browser.files).filter(f=>f.startsWith('public/')||/\.(js|css)$/.test(f)),...technical.map(f=>base+f),base+'Spines.lean',base+'Export.lean',base+'KernelCatalog.lean',base+'verify.py',base+'verify-extra.py'])];
 for(const file of published){const raw=fs.readFileSync(file);assert(raw.equals(fs.readFileSync('_site_production/'+file)),file);const response=await fetch(origin+'/'+file);assert.equal(response.status,200,file);assert(raw.equals(Buffer.from(await response.arrayBuffer())),file);report.files[file]=sha(raw);}
 for(const[route,file,expected]of [['/projects/proof-atlas/manual/binder-blocks/','_site_production/projects/proof-atlas/manual/binder-blocks/index.html',browser.productionHtmlSha256],['/projects/proof-atlas/program/','_site_production/projects/proof-atlas/program/index.html',browser.programHtmlSha256]]){
  const raw=fs.readFileSync(file);assert.equal(sha(raw),expected);const response=await fetch(origin+route);assert.equal(response.status,200);assert(raw.equals(Buffer.from(await response.arrayBuffer())));assert(raw.toString().includes('recoverable-type-notation'));report.files[file]=expected;
 }
 const manual=await fetch(origin+'/projects/proof-atlas/manual/');assert.equal(manual.status,200);const manualRaw=Buffer.from(await manual.arrayBuffer());assert(manualRaw.equals(fs.readFileSync('_site_production/projects/proof-atlas/manual/index.html')));assert(manualRaw.toString().includes('id="recoverable-type-notation"'));report.files['_site_production/projects/proof-atlas/manual/index.html']=sha(manualRaw);report.files['projects/proof-atlas/manual/index.html']=sha(fs.readFileSync('projects/proof-atlas/manual/index.html'));
 report.queries=150;report.browserSuites=9;report.checkerSha256=sha(fs.readFileSync(__filename));fs.writeFileSync(base+'production.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n'),{mtime:0}));fs.copyFileSync(base+'production.json.gz','_site_production/'+base+'production.json.gz');console.log(JSON.stringify({status:'PASS',queries:150,browserSuites:9,servedFiles:Object.keys(report.files).length,sourceOverride:false}));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
