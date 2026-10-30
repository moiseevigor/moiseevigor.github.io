'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),vm=require('vm'),assert=require('assert/strict');
const {chromium}=require('playwright');process.chdir(path.resolve(__dirname,'../../..'));
const {profiles,read,sha}=require('../method-context/catalogue.cjs');
const A=require('../../../public/js/proof-atlas-library-data'),M=require('../../../public/js/proof-atlas-method-interfaces');
const I=require('../../../public/js/proof-atlas-branch-instantiation'),B=require('../../../public/js/proof-atlas-method-context'),N=require('../../../public/js/proof-atlas-method-conversion');
const base='research/proof-atlas/method-conversion-view/',origin=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8877';
const folder=process.argv[2];assert(folder);fs.mkdirSync(folder,{recursive:true});
const h={};vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/method-conversion-manifest.js','utf8'),{window:h});
const inventory=JSON.parse(JSON.stringify(h.PROOF_ATLAS_METHOD_PORT_KERNEL));
const report={status:'RUNNING',manualBridges:0,pagedBridges:0,endpointActions:0,sourceSelectionPreserved:0,
  unrecordedBodies:0,unrecordedInputs:0,failureRetries:0,staleControls:0,accessibility:[],screenshots:[]};
let browser,p,mode='manual',scope='#pm-method-example-view';const errors=[],forbidden=[];
(async()=>{
 browser=await chromium.launch({headless:true,...(process.env.ATLAS_CHROMIUM_PATH?{executablePath:process.env.ATLAS_CHROMIUM_PATH}:{})});
 p=await browser.newPage({viewport:{width:1500,height:1100}});p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{if(location.protocol.startsWith('http')){localStorage.setItem('analytics-consent','no');localStorage.setItem('theme','light');}});
 let blockArchives=false;
 const whole=new Set(profiles.filter(x=>x.d.edition!=='branch-method-controls').flatMap(x=>[x.d.file,x.d.record.indexFile]));
 await p.route('**/*',async r=>{const file=new URL(r.request().url()).pathname;if(blockArchives&&whole.has(file)){forbidden.push(file);await r.fulfill({status:503,body:'Whole archive forbidden'});}else await r.continue();});
 const panel=()=>p.locator(scope+' .pl-method-context');
 const snapshot=()=>p.evaluate(m=>m==='manual'?ProofAtlasMethodExamples.getSourceSelection():ProofAtlasLibrary.getSnapshot(),mode);
 async function manual(name,query=0,minor=1){
  mode='manual';scope='#pm-method-example-view';blockArchives=false;
  await p.goto(origin+'/projects/proof-atlas/manual/#method-interface-lab');
  await p.locator('#method-interface-lab').evaluate(n=>n.open=true);await p.locator('#pm-method-example').selectOption(name);
  await p.locator('#pm-method-load').click();await p.waitForFunction(n=>window.ProofAtlasMethodExamples?.getScene()?.source.name===n,name);
  await p.locator('#pm-method-query').selectOption(String(query));await p.locator('#pm-method-minor').selectOption(String(minor));
 }
 async function context(){
  await p.locator(scope+' [data-method-wires]').click();await p.locator(scope+' [data-branch-conclusion]').click();
  await p.locator(scope+' [data-verify-instantiation]').click();await p.locator(scope+' [data-instantiation-result]').waitFor({state:'attached'});
  await p.locator(scope+' [data-computed-context]').click();await panel().locator('[data-context-receipt]').waitFor({state:'attached'});
 }
 async function bridge(flow,d){
  const before=await snapshot(),parent=await I.compare(flow),r=B.compare(flow,parent),record=read(d.file,d.sha256),expected=N.validate(record,flow,parent,r,d);
  await panel().locator('[data-context-kernel-load]').click();await panel().locator('[data-context-kernel-state="checked"]').waitFor();
  const actual=JSON.parse(await panel().locator('[data-context-kernel-receipt] pre').textContent());assert.deepEqual(actual,expected);
  assert.equal((await panel().locator('.pl-context-pair').getAttribute('data-context-status')),'unavailable');
  for(const side of ['expected','computed']){
   await panel().locator('[data-context-kernel-endpoint="'+side+'"]').click();
   const shown=JSON.parse(await panel().locator('[data-context-selection] pre').textContent());assert.deepEqual(shown,B.inspect(r,side));report.endpointActions++;
  }
  assert.deepEqual(await snapshot(),before);report.sourceSelectionPreserved++;
 }
 for(const d of inventory.records){
  const original=profiles.find(x=>x.d.sha256===d.originalEvidenceSha256).d,raw=read(original.file),provider=M.open(raw,A.validateIndex(read(original.record.indexFile),original.record),original.record,original);
  for(const q of d.queries){const at=raw.entries.findIndex(x=>JSON.stringify(x.parent.route)===JSON.stringify(q.route));
   for(const minor of q.minors){await manual(d.name,at,minor);await context();await bridge(provider.flow(q.route,minor),d);report.manualBridges++;}
  }
  if(original.edition==='branch-method-controls')continue;
  for(const q of d.queries){
   mode='paged';scope='#pl-paged-method-interface';blockArchives=true;
   await p.goto(origin+'/projects/proof-atlas/library/?loading=paged&edition='+original.edition+'&proof='+encodeURIComponent(d.name)+'&route='+encodeURIComponent(q.route.root+':'+q.route.slots.join('.')));
   await p.waitForFunction(at=>JSON.stringify(window.ProofAtlasLibrary?.getSnapshot()?.route)===JSON.stringify(at)&&ProofAtlasLibrary.getJudgmentScene(),q.route);
   await p.locator('[data-paged-method]').click();await p.waitForFunction(()=>!!ProofAtlasLibrary.getPagedMethodScene());
   for(const minor of q.minors){await p.locator('#pl-paged-method-section select').nth(1).selectOption(String(minor));await context();await bridge(provider.flow(q.route,minor),d);report.pagedBridges++;}
  }
 }
 blockArchives=false;
 await manual('AtlasMethodControls.dependent',0,1);await context();
 await panel().locator('[data-context-kernel-load]').focus();await p.keyboard.press('Enter');await panel().locator('[data-context-kernel-state="checked"]').waitFor();
 await panel().locator('[data-context-kernel-endpoint="expected"]').focus();await p.keyboard.press('Enter');await panel().locator('[data-context-selection]').waitFor({state:'attached'});
 await p.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
 for(const width of [1500,390])for(const theme of ['light','dark']){
  await p.setViewportSize({width,height:1100});await p.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  const violations=await p.evaluate(async scope=>(await axe.run(document.querySelector(scope),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})),scope);
  assert.deepEqual(violations,[]);assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3));
  const screenshot='kernel-conversion-'+width+'-'+theme+'.png';await panel().screenshot({path:path.join(folder,screenshot)});
  report.accessibility.push({width,theme,violations:0});report.screenshots.push({file:screenshot,sha256:sha(fs.readFileSync(path.join(folder,screenshot)))});
 }
 await p.setViewportSize({width:1500,height:1100});
 // Missing records leave the existing local comparison usable.
 const riccati=profiles.find(x=>x.d.name==='JacobiData.slope_bound_abs').d;
 await manual(riccati.name,0,0);await context();await panel().locator('[data-context-kernel-load]').click();await panel().locator('[data-context-kernel-state="unavailable"]').waitFor();
 assert.match(await panel().locator('[data-context-kernel-state]').innerText(),/No kernel conversion record/);report.unrecordedBodies++;
 await panel().locator('[data-context-focus]').first().click();assert.match(await panel().locator('.pl-context-kernel').innerText(),/No separate kernel record for this input/);report.unrecordedInputs++;
 // Three independently missing optional resources must each recover on retry.
 const nativePath=inventory.records[0].file;
 for(const pattern of ['**/proof-atlas-method-conversion.js*','**/method-conversion-manifest.js*','**'+nativePath]){
  await p.goto('about:blank');await p.route(pattern,r=>r.abort());await manual('AtlasMethodControls.dependent',0,1);await context();
  await panel().locator('[data-context-kernel-load]').click();await panel().locator('[data-context-kernel-state="error"]').waitFor();
  assert.equal(await panel().locator('.pl-context-pair').getAttribute('data-context-status'),'unavailable');
  await p.unroute(pattern);await panel().locator('[data-context-kernel-load]').click();await panel().locator('[data-context-kernel-state="checked"]').waitFor();report.failureRetries++;
 }
 // A valid record from the other branch/proof cannot be shown as this pair.
 await manual('AtlasMethodControls.dependent',0,1);await context();
 await p.route('**'+nativePath,r=>r.fulfill({status:200,body:fs.readFileSync('.'+inventory.records[1].file)}));
 await panel().locator('[data-context-kernel-load]').click();await panel().locator('[data-context-kernel-state="error"]').waitFor();
 await p.unroute('**'+nativePath);await panel().locator('[data-context-kernel-load]').click();await panel().locator('[data-context-kernel-state="checked"]').waitFor();report.failureRetries++;
 // Delayed data, a detached load control and a detached endpoint control must
 // not change a new port/method. Keep the exact outstanding request until it ends.
 await manual('AtlasMethodControls.dependent',0,1);await context();
 let started,release,ended;const began=new Promise(r=>started=r),gate=new Promise(r=>release=r),end=new Promise(r=>ended=r);
 await p.route('**'+nativePath,async r=>{started();await gate;await r.continue().catch(()=>{});ended();});
 const oldLoad=await panel().locator('[data-context-kernel-load]').elementHandle();await oldLoad.click();await began;
 await panel().locator('[data-context-focus]').first().click();const current=await panel().innerText();
 await oldLoad.evaluate(n=>n.click());release();await end;await p.unroute('**'+nativePath);assert.equal(await panel().innerText(),current);report.staleControls++;
 await panel().locator('[data-context-body]').click();await panel().locator('[data-context-kernel-load]').click();await panel().locator('[data-context-kernel-state="checked"]').waitFor();
 const oldEndpoint=await panel().locator('[data-context-kernel-endpoint="computed"]').elementHandle();
 await p.locator('#pm-method-minor').selectOption('0');const fresh=await p.locator(scope).innerText();await oldEndpoint.evaluate(n=>n.click());assert.equal(await p.locator(scope).innerText(),fresh);report.staleControls++;
 // Delayed optional code also belongs to the retired action, not the new method.
 await p.goto('about:blank');let codeStarted,codeRelease,codeEnded;
 const codeBegan=new Promise(r=>codeStarted=r),codeGate=new Promise(r=>codeRelease=r),codeEnd=new Promise(r=>codeEnded=r);
 await p.route('**/proof-atlas-method-conversion.js*',async r=>{codeStarted();await codeGate;await r.continue().catch(()=>{});codeEnded();});
 await manual('AtlasMethodControls.dependent',0,1);await context();await panel().locator('[data-context-kernel-load]').click();await codeBegan;
 await p.locator('#pm-method-minor').selectOption('0');const afterCodeChange=await p.locator(scope).innerText();
 codeRelease();await codeEnd;await p.waitForFunction(()=>!!window.ProofAtlasMethodConversion);await p.unroute('**/proof-atlas-method-conversion.js*');
 assert.equal(await p.locator(scope).innerText(),afterCodeChange);report.staleControls++;
 assert.deepEqual(errors,[]);assert.deepEqual(forbidden,[]);
 assert.equal(report.manualBridges,6);assert.equal(report.pagedBridges,4);
 const files=['public/js/proof-atlas-method-context.js','public/js/proof-atlas-method-conversion.js','public/js/proof-atlas-method-flow.js','public/css/proof-atlas-theme.css','public/data/proof-atlas/method-conversion-manifest.js',...inventory.records.map(d=>d.file.slice(1))];
 report.builtFiles={};for(const file of files){const bytes=fs.readFileSync(file);assert(bytes.equals(fs.readFileSync('_site_production/'+file)));const response=await p.request.get(origin+'/'+file);assert(response.ok());assert.equal(sha(await response.body()),sha(bytes));report.builtFiles[file]=sha(bytes);}
 report.checkerSha256=sha(fs.readFileSync(base+'check-browser.cjs'));report.status='PASS';
 report.scope='Actual production-built manual and paged library, six native bridges and four paged peers; exact endpoint actions and preserved source selection, optional resource/hash failures, retired controls, keyboard and four accessibility audits. Recorded native conversion only; no browser Lean or comprehension measurement.';
 fs.writeFileSync(base+'browser-check.json.gz',z.gzipSync(JSON.stringify(report,null,2)+'\n'));console.log(JSON.stringify(report));await browser.close();
})().catch(async error=>{console.error(error.stack);if(p)fs.writeFileSync(path.join(folder,'failure.json'),JSON.stringify({error:error.stack,report,url:p.url(),text:await p.locator('body').innerText().catch(()=>null)},null,2));await browser?.close();process.exitCode=1;});
