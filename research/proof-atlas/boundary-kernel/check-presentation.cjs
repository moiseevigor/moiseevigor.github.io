/* Production-page link, download and responsive checks; no source overrides. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto'),zlib=require('zlib'),{chromium}=require('playwright');
const repo=path.resolve(__dirname,'../../..');process.chdir(repo);
const origin=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8866',output=process.argv[2];assert(output,'temporary output report filename required');
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.ATLAS_CHROMIUM_PATH}),p=await browser.newPage(),errors=[],report={format:'ProofAtlasBoundaryPresentation/1',status:'RUNNING',sourceOverrides:false,layouts:[],downloads:{}};
 p.on('pageerror',e=>errors.push(e.message));
 try{
  await p.addInitScript(()=>{localStorage.setItem('analytics-consent','no');localStorage.setItem('theme','light');});
  const response=await p.goto(origin+'/projects/proof-atlas/program/',{waitUntil:'networkidle'});assert.equal(response.status(),200);report.programHtmlSha256=hash(await response.body());report.staticReferenceRefreshAfterBuild=true;
  const link=p.getByRole('link',{name:'Lean-checked reference model',exact:true});assert.equal(await link.count(),1);assert.equal(await link.getAttribute('href'),'/research/proof-atlas/boundary-kernel/README.md');await link.focus();assert(await link.evaluate(n=>document.activeElement===n));
  for(const width of[1500,390])for(const theme of['light','dark']){await p.setViewportSize({width,height:1000});await p.evaluate(t=>document.documentElement.dataset.theme=t,theme);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3));report.layouts.push({width,theme,noDocumentOverflow:true});}
  const files=['README.md','Boundary.lean','verify.py','export-cases.cjs','kernel-check.json.gz'];
  for(const f of files){const relative='research/proof-atlas/boundary-kernel/'+f,r=await p.request.get(origin+'/'+relative);assert.equal(r.status(),200,relative);const bytes=await r.body();assert(bytes.equals(fs.readFileSync(relative)),relative+' served bytes differ');report.downloads[relative]=hash(bytes);}
  const evidence=JSON.parse(zlib.gunzipSync(fs.readFileSync('research/proof-atlas/boundary-kernel/kernel-check.json.gz')));assert.equal(evidence.generalTheorems,23);assert.equal(evidence.finiteProjectionCertificates,111);assert.equal(evidence.negativeControls.length,8);assert.equal(evidence.resourceLimitedCases.length,1);
  for(const[file,sha]of Object.entries(evidence.producerHashes)){assert.equal(hash(fs.readFileSync(file)),sha,file+' changed');if(file.startsWith('public/')){const r=await p.request.get(origin+'/'+file);assert.equal(r.status(),200);assert.equal(hash(await r.body()),sha,file+' production differs');}}
  assert.deepEqual(errors,[]);report.status='PRODUCTION_PAGE_AND_DOWNLOADS_PASS_NOT_PUBLISHED';report.kernelEvidenceSha256=hash(fs.readFileSync('research/proof-atlas/boundary-kernel/kernel-check.json.gz'));report.presentationProducerHashes=Object.fromEntries(['docs/proof-atlas-research-program.md','research/proof-atlas/boundary-kernel/README.md','research/proof-atlas/boundary-kernel/check-presentation.cjs'].map(f=>[f,hash(fs.readFileSync(f))]));fs.writeFileSync(output,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1);});
