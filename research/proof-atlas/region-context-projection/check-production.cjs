'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict'),{chromium}=require('playwright');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/region-context-projection/',origin=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8877',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),hash=f=>sha(fs.readFileSync(f));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.ATLAS_CHROMIUM_PATH}),context=await browser.newContext(),p=await context.newPage(),errors=[],report={format:'ProofAtlasRegionContextProduction/1',status:'RUNNING',sourceOverride:false,files:{}};
 p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>{localStorage.setItem('analytics-consent','no');localStorage.setItem('theme','light');});
 try{
  await p.goto(origin+'/projects/proof-atlas/program/');const link=p.locator('a[href="/projects/proof-atlas/manual/binder-blocks/#lexical-context-projection"]');assert.equal(await link.count(),1);assert((await p.locator('body').innerText()).includes('924 selected regions'));
  const program=await(await p.request.get(origin+'/projects/proof-atlas/program/')).body();assert(program.equals(fs.readFileSync('_site_production/projects/proof-atlas/program/index.html')));report.programHtmlSha256=sha(program);report.files['docs/proof-atlas-research-program.md']=hash('docs/proof-atlas-research-program.md');
  await link.click();await p.waitForURL('**/manual/binder-blocks/#lexical-context-projection');await p.locator('#lexical-context-projection').waitFor();assert((await p.locator('#lexical-context-projection').innerText()).includes('twelve entries to two'));assert.equal(await p.locator('a[href="/'+base+'README.md"]').count(),1);
  const manual=await(await p.request.get(origin+'/projects/proof-atlas/manual/binder-blocks/')).body();assert(manual.equals(fs.readFileSync('_site_production/projects/proof-atlas/manual/binder-blocks/index.html')));report.manualHtmlSha256=sha(manual);report.files['research/proof-atlas/binder-block-exchange/index.html']=hash('research/proof-atlas/binder-block-exchange/index.html');
  for(const name of['README.md','model.cjs','check.cjs','check-browser.cjs','check-compatibility.cjs','check-production.cjs','model.json.gz','browser.json.gz','compatibility.json.gz']){
   const f=base+name,response=await p.request.get(origin+'/'+f);assert.equal(response.status(),200);const bytes=await response.body();assert(bytes.equals(fs.readFileSync(f)),f);assert(bytes.equals(fs.readFileSync('_site_production/'+f)),f);report.files[f]=sha(bytes);
  }
  assert.deepEqual(errors,[]);report.status='PASS';report.checkerSha256=hash(__filename);fs.writeFileSync(base+'production.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n'),{mtime:0}));console.log(JSON.stringify({status:'PASS',sourceOverride:false,manualHtmlSha256:report.manualHtmlSha256,programHtmlSha256:report.programHtmlSha256}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
