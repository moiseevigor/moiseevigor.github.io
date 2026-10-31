'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict'),{chromium}=require('playwright');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/projection-substitution/',origin=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8877',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),hash=f=>sha(fs.readFileSync(f));
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.ATLAS_CHROMIUM_PATH}),context=await browser.newContext({viewport:{width:1500,height:1100},reducedMotion:'reduce'}),p=await context.newPage(),errors=[];
 const report={format:'ProofAtlasProjectionFusionProduction/1',status:'RUNNING',sourceOverride:false,audits:[],files:{}};
 p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>{localStorage.setItem('analytics-consent','no');localStorage.setItem('theme','light');});
 try{
  await p.goto(origin+'/projects/proof-atlas/program/');assert.equal(await p.locator('a[href="/projects/proof-atlas/manual/binder-blocks/#projection-substitution"]').count(),1);
  const program=await(await p.request.get(origin+'/projects/proof-atlas/program/')).body();assert(program.equals(fs.readFileSync('_site_production/projects/proof-atlas/program/index.html')));report.programHtmlSha256=sha(program);
  await p.locator('a[href="/projects/proof-atlas/manual/binder-blocks/#projection-substitution"]').click();await p.waitForURL('**/manual/binder-blocks/#projection-substitution');
  const section=p.locator('#projection-substitution');await section.waitFor();await p.waitForFunction(()=>document.querySelectorAll('#projection-substitution .katex').length>=10);await p.evaluate(()=>document.fonts.ready);
  assert.equal(await section.locator('.katex-error').count(),0);assert((await section.innerText()).includes('49,312'));assert((await section.innerText()).includes('condition above cannot be omitted'));
  const manual=await(await p.request.get(origin+'/projects/proof-atlas/manual/binder-blocks/')).body();assert(manual.equals(fs.readFileSync('_site_production/projects/proof-atlas/manual/binder-blocks/index.html')));report.manualHtmlSha256=sha(manual);
  await p.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  for(const width of[1500,390])for(const theme of['light','dark']){
   await p.setViewportSize({width,height:1100});await p.evaluate(theme=>{document.documentElement.dataset.theme=theme;},theme);await section.scrollIntoViewIfNeeded();
   const violations=await section.evaluate(async element=>(await axe.run(element,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));assert.deepEqual(violations,[]);
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3));
   const equation=section.locator('.pm-equation');await equation.focus();assert(await equation.evaluate(e=>e===document.activeElement));
   const overflow=await equation.evaluate(e=>e.scrollWidth>e.clientWidth+1);if(overflow){await p.keyboard.press('ArrowRight');await p.waitForFunction(()=>document.querySelector('#projection-substitution .pm-equation').scrollLeft>0);}
   const file='fusion-'+width+'-'+theme+'.png';await section.screenshot({path:base+file});report.audits.push({width,theme,violations:0,keyboardEquation:true,equationOverflow:overflow,file,sha256:hash(base+file)});
  }
  // Existing interactive reader remains usable: real data load, field selection,
  // remaining-body boundary and exact binder jump, then return and release.
  await p.setViewportSize({width:1500,height:1100});const q=s=>p.locator('[data-corpus-boundaries] '+s);
  await p.locator('[data-corpus-boundaries]>summary').click();await q('[data-cb-load]').click();
  await p.waitForFunction(()=>{const s=window.ProofAtlasCorpusBoundaries?.state();return s&&!s.loading&&s.selection&&s.bindingBoundary?.status==='ready';});
  await q('[data-cb-tail]').click();await p.waitForFunction(()=>{const s=ProofAtlasCorpusBoundaries.state();return !s.loading&&s.selection?.route.slots.length>0&&s.bindingBoundary?.status==='ready'&&s.bindingBoundary.targets.length>0;});
  const before=await p.evaluate(()=>ProofAtlasCorpusBoundaries.state()),target=before.bindingBoundary.targets[0];await q('[data-rb-target]').first().click();
  await p.waitForFunction(address=>{const s=ProofAtlasCorpusBoundaries.state();return !s.loading&&s.bindingBoundary?.status==='ready'&&JSON.stringify(s.selection)===JSON.stringify(address);},target.address);
  await q('[data-rb-return]').click();await p.waitForFunction(address=>{const s=ProofAtlasCorpusBoundaries.state();return !s.loading&&s.bindingBoundary?.status==='ready'&&JSON.stringify(s.selection)===JSON.stringify(address);},before.selection);
  await q('[data-cb-release]').click();assert.equal(await p.evaluate(()=>ProofAtlasCorpusBoundaries.state().cache),null);report.readerNavigation=true;
  for(const file of['docs/proof-atlas-research-program.md','research/proof-atlas/binder-block-exchange/index.html','public/js/proof-atlas-corpus-boundary-pages.js','public/js/proof-atlas-region-binding-pages.js','research/proof-atlas/corpus-definition-boundaries/view.js','research/proof-atlas/region-binding-ports/view.js','research/proof-atlas/region-binding-ports/view.css']){
   report.files[file]=hash(file);if(!file.startsWith('docs/')&&!file.endsWith('index.html'))assert(fs.readFileSync(file).equals(fs.readFileSync('_site_production/'+file)),file);
  }
  for(const name of['README.md','Fusion.lean','Controls.lean','verify.py','check.cjs','check-production.cjs','native.json.gz','verification.json.gz','model.json.gz']){
   const file=base+name,response=await p.request.get(origin+'/'+file);assert.equal(response.status(),200);const bytes=await response.body();assert(bytes.equals(fs.readFileSync(file)),file);assert(bytes.equals(fs.readFileSync('_site_production/'+file)),file);report.files[file]=sha(bytes);
  }
  assert.deepEqual(errors,[]);report.status='PASS';report.checkerSha256=hash(__filename);fs.writeFileSync(base+'production.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n'),{mtime:0}));console.log(JSON.stringify({status:'PASS',audits:4,readerNavigation:true,sourceOverride:false,manualHtmlSha256:report.manualHtmlSha256}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
