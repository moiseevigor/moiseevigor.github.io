/* Verify the actual build and all linked evidence after browser checks. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/region-native-types/',origin=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8877',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=f=>JSON.parse(z.gunzipSync(fs.readFileSync(f)));
async function main(){
 const report={format:'ProofAtlasRegionTypeProduction/1',status:'PASS',sourceOverride:false,files:{}},model=read(base+'model.json.gz'),pack=read(base+'packets.json.gz'),consumer=read(base+'consumer.json.gz'),browser=read(base+'browser.json.gz'),compat=read(base+'compatibility.json.gz');
 for(const record of[model,pack,consumer,browser,compat])assert.equal(record.status,'PASS');assert.equal(browser.sourceOverride,false);assert.equal(model.queries,150);assert.equal(pack.queries,150);assert.equal(consumer.queries,150);assert.equal(browser.queries,150);assert.equal(browser.originalBinderJumps,22);assert.equal(browser.wholeArchiveRequests,0);assert.equal(browser.audits.length,4);assert(browser.audits.every(a=>a.violations===0));assert.equal(Object.keys(compat.reports).length,7);
 const fingerprint={...model.files,...pack.files,...consumer.files,...browser.files};for(const[f,h]of Object.entries(fingerprint))assert.equal(sha(fs.readFileSync(f)),h,f);
 assert.equal(sha(fs.readFileSync(base+'pack.cjs')),pack.producerSha256);assert.equal(sha(fs.readFileSync(base+'model.json.gz')),pack.modelSha256);assert.equal(sha(fs.readFileSync(base+'check-browser.cjs')),browser.checkerSha256);assert.equal(sha(fs.readFileSync(base+'check-compatibility.cjs')),compat.checkerSha256);
 for(const entry of[...Object.values(compat.reports),compat.pageConsumer]){
  assert.equal(sha(fs.readFileSync(entry.file)),entry.sha256);assert.equal(sha(fs.readFileSync(entry.originalChecker)),entry.originalCheckerSha256);assert.equal(entry.outputPathsOnly,true);
  const prior=read(entry.file);assert.equal(prior.status,'PASS');for(const item of Object.values(entry.images||{}))assert.equal(sha(fs.readFileSync(item.file)),item.sha256);
 }
 for(const audit of browser.audits)assert.equal(sha(fs.readFileSync(base+audit.file)),audit.sha256);
 // These are post-build technical reports/images only. Application assets and
 // generated HTML must already match the real Jekyll output; never replace them.
 const technical=fs.readdirSync(base).filter(f=>/\.(cjs|gz|png|md)$/.test(f)&&f!=='production.json.gz');
 for(const name of technical){const file=base+name;assert(!/^failure\./.test(name),'Remove failed scratch output before publication');fs.copyFileSync(file,'_site_production/'+file);}
 for(const file of [...new Set([...Object.keys(pack.files),...Object.keys(browser.files).filter(f=>!f.startsWith('docs/')&&!f.endsWith('index.html')),...technical.map(name=>base+name),'research/proof-atlas/region-context-projection/README.md'])]){
  const raw=fs.readFileSync(file);assert(raw.equals(fs.readFileSync('_site_production/'+file)),file);const response=await fetch(origin+'/'+file);assert.equal(response.status,200,file);assert(raw.equals(Buffer.from(await response.arrayBuffer())),file);report.files[file]=sha(raw);
 }
 for(const[route,file,expected]of [['/projects/proof-atlas/manual/binder-blocks/','_site_production/projects/proof-atlas/manual/binder-blocks/index.html',browser.productionHtmlSha256],['/projects/proof-atlas/program/','_site_production/projects/proof-atlas/program/index.html',browser.programHtmlSha256]]){
  const raw=fs.readFileSync(file);assert.equal(sha(raw),expected);const response=await fetch(origin+route);assert.equal(response.status,200);assert(raw.equals(Buffer.from(await response.arrayBuffer())));report.files[file]=expected;
 }
 report.queries=150;report.browserSuites=8;report.checkerSha256=sha(fs.readFileSync(__filename));const bytes=Buffer.from(JSON.stringify(report,null,2)+'\n');fs.writeFileSync(base+'production.json.gz',z.gzipSync(bytes,{mtime:0}));fs.copyFileSync(base+'production.json.gz','_site_production/'+base+'production.json.gz');console.log(JSON.stringify({status:'PASS',queries:150,browserSuites:8,verifiedFiles:Object.keys(report.files).length,sourceOverride:false}));
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
