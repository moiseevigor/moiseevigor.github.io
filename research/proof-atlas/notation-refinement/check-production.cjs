'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/notation-refinement/',origin=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8877',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=f=>JSON.parse(z.gunzipSync(fs.readFileSync(f)));
(async()=>{
 const model=read(base+'model.json.gz'),consumer=read(base+'consumer.json.gz'),native=read(base+'verification.json.gz'),browser=read(base+'browser.json.gz'),compat=read(base+'compatibility.json.gz'),laws=read('research/proof-atlas/cut-union/verification.json.gz');
 for(const r of[model,consumer,native,browser,compat,laws])assert.equal(r.status,'PASS');
 assert.equal(model.initialCuts,11353);assert.equal(model.refinements,82);assert.equal(model.bindingTargetsChecked,2120);assert.equal(model.commutingPairs,28);assert.equal(native.records,11599);assert.equal(native.joins,82);assert(native.referenceCoefficients>0);assert.equal(native.metadataControls,10);
 assert.equal(consumer.queries,150);assert.equal(consumer.expansions,82);assert.equal(browser.sourceOverride,false);assert.equal(browser.queries,150);assert.equal(browser.wholeArchiveRequests,0);assert.equal(browser.inPlaceOpenings,45);assert(browser.maxRefinedObjects>48&&browser.maxRefinedObjects<=192);assert.equal(browser.openingRequests,0);assert.equal(browser.audits.length,4);assert(browser.audits.every(a=>a.violations===0));assert.equal(Object.keys(compat.reports).length,8);
 for(const r of[model,consumer,browser])for(const[f,h]of Object.entries(r.files))assert.equal(sha(fs.readFileSync(f)),h,f);
 for(const r of[native,laws])for(const[f,h]of Object.entries(r.producerFiles))assert.equal(sha(fs.readFileSync(f)),h,f);
 assert.equal(sha(z.gunzipSync(fs.readFileSync(base+'native.json.gz'))),native.nativeSha256);
 for(const record of[browser,consumer,compat]){const checker=record===browser?'check-browser.cjs':record===consumer?'check-consumer.cjs':'check-compatibility.cjs';assert.equal(sha(fs.readFileSync(base+checker)),record.checkerSha256);assert.equal(sha(fs.readFileSync(record.originalChecker)),record.originalCheckerSha256);}
 for(const entry of[...Object.values(compat.reports),compat.pageConsumer,compat.consumer]){
  assert.equal(sha(fs.readFileSync(entry.file)),entry.sha256);assert.equal(sha(fs.readFileSync(entry.originalChecker)),entry.originalCheckerSha256);assert.equal(entry.outputPathsOnly,true);assert.equal(read(entry.file).status,'PASS');for(const image of Object.values(entry.images||{}))assert.equal(sha(fs.readFileSync(image.file)),image.sha256);
 }
 for(const audit of browser.audits)assert.equal(sha(fs.readFileSync(base+audit.file)),audit.sha256);
 const report={format:'ProofAtlasNotationRefinementProduction/1',status:'PASS',sourceOverride:false,browserSuites:9,queries:150,openings:45,files:{}};
 // Never overlay application JS/CSS/HTML. Newly generated technical reports and
 // their reproduction scripts are the only files synchronized after the build.
 const technical=fs.readdirSync(base).filter(f=>/\.(cjs|gz|png|md)$/.test(f)&&f!=='production.json.gz');for(const file of technical){assert(!/^failure\./.test(file));fs.copyFileSync(base+file,'_site_production/'+base+file);}
 const appFiles=[...new Set([...Object.keys(model.files),...Object.keys(consumer.files),...Object.keys(browser.files)].filter(f=>f.startsWith('public/')||/\.(js|css)$/.test(f)))];
 const published=[...new Set([...appFiles,...technical.map(f=>base+f),base+'Native.lean',base+'Metadata.lean',base+'verify.py'])];
 for(const file of published){const raw=fs.readFileSync(file);assert(raw.equals(fs.readFileSync('_site_production/'+file)),file);const response=await fetch(origin+'/'+file);assert.equal(response.status,200,file);assert(raw.equals(Buffer.from(await response.arrayBuffer())),file);report.files[file]=sha(raw);}
 for(const[route,file,hash]of[['/projects/proof-atlas/manual/binder-blocks/','_site_production/projects/proof-atlas/manual/binder-blocks/index.html',browser.productionHtmlSha256],['/projects/proof-atlas/program/','_site_production/projects/proof-atlas/program/index.html',browser.programHtmlSha256]]){
  const raw=fs.readFileSync(file);assert.equal(sha(raw),hash);const response=await fetch(origin+route);assert.equal(response.status,200);assert(raw.equals(Buffer.from(await response.arrayBuffer())));assert(raw.toString().includes('notation-refinement'));report.files[file]=hash;
 }
 const manual=await fetch(origin+'/projects/proof-atlas/manual/'),manualRaw=Buffer.from(await manual.arrayBuffer());assert.equal(manual.status,200);assert(manualRaw.equals(fs.readFileSync('_site_production/projects/proof-atlas/manual/index.html')));assert(manualRaw.toString().includes('opens it within the same view'));report.files['_site_production/projects/proof-atlas/manual/index.html']=sha(manualRaw);
 report.checkerSha256=sha(fs.readFileSync(__filename));fs.writeFileSync(base+'production.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n'),{mtime:0}));fs.copyFileSync(base+'production.json.gz','_site_production/'+base+'production.json.gz');console.log(JSON.stringify({status:'PASS',browserSuites:9,queries:150,openings:45,servedFiles:Object.keys(report.files).length,sourceOverride:false}));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
