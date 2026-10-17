'use strict';
const fs=require('fs'),vm=require('vm'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict'),{chromium}=require('playwright');
const w={};
for(const f of ['compiled-replay-manifest.js','goedel-sample-manifest.js','library-manifest.js'])vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+f,'utf8'),{window:w});
const manifest=w.PROOF_ATLAS_COMPILED_REPLAY,records=w.PROOF_ATLAS_AI_SAMPLE.edition.declarations;
const small=records.find(r=>r.name==='lean_workbook_49456'),large=records.find(r=>r.name==='lean_workbook_plus_6206');
const origin=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8833',dir=process.env.ATLAS_SCREENSHOTS||'/tmp/atlas-compiled-replay-browser';
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 fs.mkdirSync(dir,{recursive:true});
 const browser=await chromium.launch({headless:true,executablePath:process.env.ATLAS_CHROMIUM_PATH});
 const page=await browser.newPage({viewport:{width:1700,height:1100}}),errors=[],requests=[];
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>requests.push(new URL(r.url()).pathname));
 await page.addInitScript(()=>{localStorage.setItem('analytics-consent','no');localStorage.setItem('theme','light');});
 const ready=name=>page.waitForFunction(name=>window.ProofAtlasLibrary?.getSnapshot()?.name===name&&!document.getElementById('pl-library').matches('[aria-busy=true]'),name);
 const url=(paged,name=small.name,edition='goedel-sample-4331')=>origin+'/projects/proof-atlas/library/?'+(paged?'loading=paged&':'')+'edition='+edition+'&proof='+name;
 const links=()=>page.locator('[data-compiled-replay-index]');
 let modes=0,corruptions=0;
 try{
  for(const paged of [false,true]){
   for(const record of [small,large]){
    await page.goto(url(paged,record.name));await ready(record.name);
    assert.equal(await links().count(),1);assert.equal(await links().getAttribute('href'),manifest.package.file);
    assert.equal(await links().getAttribute('data-compiled-replay-index'),record.indexSha256);
    const root=JSON.parse(z.gunzipSync(fs.readFileSync('.'+record.indexFile))).roots[0];await page.evaluate(async root=>ProofAtlasLibrary.selectOccurrence(root,true,true,{root:0,slots:[]}),root);
    assert.equal(await links().getAttribute('data-compiled-replay-index'),record.indexSha256);
    assert.equal(requests.filter(p=>p===manifest.package.file).length,0,'Replay evidence was fetched eagerly');
    modes++;
   }
   await page.goto(url(paged));await ready(small.name);
   // Even a syntactically valid record for a different packet cannot attach.
   for(const mutation of ['wrong-index','wrong-edition','nonarray-records','wrong-url','oversized-package']){
    await page.evaluate(async({name,mutation})=>{
     window.__replayOriginal=structuredClone(PROOF_ATLAS_COMPILED_REPLAY);
     if(mutation==='wrong-index')PROOF_ATLAS_COMPILED_REPLAY.records.find(r=>r.name===name).indexSha256='0'.repeat(64);
     if(mutation==='wrong-edition')PROOF_ATLAS_COMPILED_REPLAY.edition='other';
     if(mutation==='nonarray-records')PROOF_ATLAS_COMPILED_REPLAY.records={};
     if(mutation==='wrong-url')PROOF_ATLAS_COMPILED_REPLAY.package.file='https://example.com/wrong';
     if(mutation==='oversized-package')PROOF_ATLAS_COMPILED_REPLAY.package.decodedBytes=1048577;
     await ProofAtlasLibrary.selectDeclaration(name);
    },{name:small.name,mutation});
    await ready(small.name);assert.equal(await links().count(),0,mutation);
    await page.evaluate(async name=>{window.PROOF_ATLAS_COMPILED_REPLAY=__replayOriginal;await ProofAtlasLibrary.selectDeclaration(name);},small.name);
    await ready(small.name);assert.equal(await links().count(),1);corruptions++;
   }
   const own=w.PROOF_ATLAS_LIBRARY.editions[0];
   await page.goto(url(paged,'SBracket.mk.inj',own.id));await ready('SBracket.mk.inj');
   assert.equal(await links().count(),0,'Unsupported edition retained an AI replay link');
   await page.route('**/compiled-replay-manifest.js*',r=>r.abort());
   await page.goto(url(paged));await ready(small.name);assert.equal(await links().count(),0);
   assert((await page.evaluate(()=>ProofAtlasLibrary.getSnapshot())).name===small.name);
   await page.unroute('**/compiled-replay-manifest.js*');
  }
  const response=await page.request.get(origin+manifest.package.file);assert(response.ok());
  const raw=z.gunzipSync(await response.body());assert.equal(raw.length,manifest.package.decodedBytes);assert.equal(sha(raw),manifest.package.sha256);
  const native=JSON.parse(raw);assert.equal(native.rows.length,20);assert(native.rows.some(r=>r.indexSha256===small.indexSha256));
  assert.deepEqual(errors,[]);
  const report={status:'PASS',readerCases:modes,wrongMetadataHidden:corruptions,noEagerReplayFetch:true,downloadMatchesFrozenDigest:true,uncoveredEditionHasNoLink:true,optionalManifestFailurePreservesProof:true,scope:'Evidence links are qualified by complete packet identity, not the selected descendant. Metadata consistency and native replay are separate checks.'};
  fs.writeFileSync(dir+'/replay-browser-report.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1);});
