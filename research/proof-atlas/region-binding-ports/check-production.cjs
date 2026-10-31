'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict'),{chromium}=require('playwright');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/region-binding-ports/',origin=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8877',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),hash=f=>sha(fs.readFileSync(f));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.ATLAS_CHROMIUM_PATH}),context=await browser.newContext(),p=await context.newPage(),errors=[],report={format:'ProofAtlasRegionBindingProduction/1',status:'RUNNING',sourceOverride:false,files:{}};
 p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>{localStorage.setItem('analytics-consent','no');localStorage.setItem('theme','light');});
 try{
  await p.goto(origin+'/projects/proof-atlas/program/');assert.equal(await p.locator('a[href="/'+base+'README.md"]').count(),1);const text=await p.locator('body').innerText();assert(text.includes('439,780')&&text.includes('759,794'));
  const program=await(await p.request.get(origin+'/projects/proof-atlas/program/')).body();assert(program.equals(fs.readFileSync('_site_production/projects/proof-atlas/program/index.html')));report.programHtmlSha256=sha(program);report.files['docs/proof-atlas-research-program.md']=hash('docs/proof-atlas-research-program.md');
  await p.goto(origin+'/projects/proof-atlas/manual/binder-blocks/#compiled-definition-boundaries');assert.equal(await p.locator('a[href="/'+base+'README.md"]').count(),1);assert.equal(await p.locator('[data-cb-region-boundary]').count(),1);
  const manual=await(await p.request.get(origin+'/projects/proof-atlas/manual/binder-blocks/')).body();assert(manual.equals(fs.readFileSync('_site_production/projects/proof-atlas/manual/binder-blocks/index.html')));report.manualHtmlSha256=sha(manual);report.files['research/proof-atlas/binder-block-exchange/index.html']=hash('research/proof-atlas/binder-block-exchange/index.html');
  for(const name of['README.md','model.cjs','pack.cjs','check.cjs','check-browser.cjs','check-compatibility.cjs','producer-check.json.gz','model-check.json.gz','browser-check.json.gz','compatibility.json.gz']){
   const file=base+name,response=await p.request.get(origin+'/'+file);assert.equal(response.status(),200);const bytes=await response.body();assert(bytes.equals(fs.readFileSync(file)),file);assert(bytes.equals(fs.readFileSync('_site_production/'+file)),file);report.files[file]=sha(bytes);
  }
  assert.deepEqual(errors,[]);report.status='PASS';report.checkerSha256=hash(__filename);fs.writeFileSync(base+'production-check.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n')));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
