'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),assert=require('assert/strict'),crypto=require('crypto'),{chromium}=require('playwright');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/scoped-dag-rewrite/',origin=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8877',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),hash=f=>sha(fs.readFileSync(f)),read=f=>JSON.parse(z.gunzipSync(fs.readFileSync(f)));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.ATLAS_CHROMIUM_PATH}),context=await browser.newContext({viewport:{width:1500,height:1100}}),p=await context.newPage(),errors=[];
 const report={format:'ProofAtlasScopedDagProduction/1',status:'RUNNING',sourceOverride:false,files:{},audits:[]};
 p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>{localStorage.setItem('analytics-consent','no');localStorage.setItem('theme','light');});
 try{
  await p.goto(origin+'/projects/proof-atlas/program/');const paragraph=p.locator('p').filter({has:p.locator('a[href="/'+base+'README.md"]')});assert.equal(await paragraph.count(),1);assert((await paragraph.innerText()).includes('107,044-row authored value program'));
  await p.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  for(const width of[1500,390])for(const theme of['light','dark']){
   await p.setViewportSize({width,height:1100});await p.evaluate(async theme=>{document.documentElement.dataset.theme=theme;await Promise.all(document.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));},theme);
   const violations=await paragraph.evaluate(async element=>(await axe.run(element,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id));assert.deepEqual(violations,[]);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3));
   const link=paragraph.locator('a');await link.focus();assert(await link.evaluate(e=>e===document.activeElement));
   const file='program-'+width+'-'+theme+'.png';await paragraph.screenshot({path:base+file});report.audits.push({width,theme,violations:0,keyboard:true,file,sha256:hash(base+file)});
  }
  for(const name of['README.md','Pruning.lean','NodeRewrite.lean','Stress.lean','Controls.lean','Corpus.lean','verify.py','verify-controls.py','verify-corpus.py','check.cjs','controls.json.gz','stress.json.gz','corpus.json.gz','model-check.json.gz']){
   const file=base+name,response=await p.request.get(origin+'/'+file);assert.equal(response.status(),200);const bytes=await response.body();assert(bytes.equals(fs.readFileSync(file)),file);assert(bytes.equals(fs.readFileSync('_site_production/'+file)),file);report.files[file]=sha(bytes);
  }
  const response=await p.request.get(origin+'/projects/proof-atlas/program/'),html=await response.body();assert(html.equals(fs.readFileSync('_site_production/projects/proof-atlas/program/index.html')));report.programHtmlSha256=sha(html);report.files['docs/proof-atlas-research-program.md']=hash('docs/proof-atlas-research-program.md');
  // Original reader assertions rerun on this actual production build.
  // Output paths are redirected; frozen predecessor reports stay unchanged.
  const previous=base+'compatibility.json.gz',compat=read(previous),manual=fs.readFileSync('_site_production/projects/proof-atlas/manual/binder-blocks/index.html'),manualResponse=await p.request.get(origin+'/projects/proof-atlas/manual/binder-blocks/');assert((await manualResponse.body()).equals(manual));
  report.readerEvidence={file:previous,sha256:hash(previous),manualHtmlSha256:sha(manual),suites:{}};
  for(const[name,item]of Object.entries(compat.reports)){
   assert.equal(hash(item.file),item.sha256);assert.equal(hash(item.originalChecker),item.originalCheckerSha256);const r=read(item.file);assert.equal(r.status,'PASS');assert.equal(r.productionHtmlSha256,sha(manual));
   for(const[file,h]of Object.entries(r.files)){assert.equal(hash(file),h);assert.equal(hash('_site_production/'+file),h);}
   report.readerEvidence.suites[name]={file:item.file,sha256:item.sha256,files:r.files};
  }
  assert.deepEqual(errors,[]);report.checkerSha256=hash(__filename);report.status='PASS';fs.writeFileSync(base+'production-check.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n')));console.log(JSON.stringify({status:'PASS',audits:4,readerSuites:Object.keys(report.readerEvidence.suites),programHtmlSha256:report.programHtmlSha256}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
