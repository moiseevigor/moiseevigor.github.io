/* Served production inspector; authored compiled controls, no runtime/data overrides. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto'),{chromium}=require('playwright');
process.chdir(path.resolve(__dirname,'../../..'));
const h={},M=require('../../../public/js/proof-atlas-application-ports'),A=require('../../../public/js/proof-atlas-library-data'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/formal-support-controls-manifest.js','utf8'),{window:h});const ds=JSON.parse(JSON.stringify(h.PROOF_ATLAS_FORMAL_SUPPORT_CONTROLS.records)),origin=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8877',folder=process.argv[2];assert(folder);fs.mkdirSync(folder,{recursive:true});
const files=['public/js/proof-atlas-application-ports.js','public/js/proof-atlas-paged-type-operations.js','public/js/proof-atlas-application-port-view.js','public/js/proof-atlas-application-port-manual.js','public/data/proof-atlas/formal-support-controls-manifest.js'];
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.ATLAS_CHROMIUM_PATH}),page=await browser.newPage({viewport:{width:1500,height:1100}}),errors=[],archives=[],forbidden=new Set(ds.flatMap(d=>[d.owner.file,d.record.indexFile]));
 const report={format:'ProofAtlasFormalSupportBrowser/1',status:'RUNNING',sourceOverrides:false,dataOverrides:false,windows:0,typeRootSelections:0,bindingSelections:0,axeAudits:0,profiles:[],files:{}};
 page.on('pageerror',e=>errors.push(e.message));page.on('request',r=>{if(forbidden.has(new URL(r.url()).pathname))archives.push(r.url());});await page.addInitScript(()=>{localStorage.setItem('analytics-consent','no');localStorage.setItem('theme','light');});
 try{
  for(const file of files){const r=await page.request.get(origin+'/'+file);assert.equal(r.status(),200);assert.equal(sha(await r.body()),sha(fs.readFileSync(file)),file);report.files[file]=sha(fs.readFileSync(file));}
  await page.goto(origin+'/projects/proof-atlas/manual/equality-transport/',{waitUntil:'domcontentloaded'});await page.waitForFunction(()=>window.ProofAtlasApplicationManual&&window.PROOF_ATLAS_FORMAL_SUPPORT_CONTROLS);await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  const panel=()=>page.locator('#pm-application-lab'),pane=()=>panel().locator('[data-type-neighborhood]');
  async function selected(address){await page.waitForFunction(a=>JSON.stringify(ProofAtlasApplicationManual.getSelection())===JSON.stringify(a)&&[...document.querySelectorAll('pre[aria-label="Application expression and provenance"]')].some(p=>p.textContent.startsWith(JSON.stringify(a,null,2))),address);}
  async function choose(button){const address=JSON.parse(await button.getAttribute('data-type-address')||await button.getAttribute('data-type-neighborhood-address')||await button.getAttribute('data-app-address'));await button.focus();await page.keyboard.press('Enter');await selected(address);return address;}
  for(const d of ds){
   const row=JSON.parse(z.gunzipSync(fs.readFileSync('.'+d.owner.file))),data=JSON.parse(z.gunzipSync(fs.readFileSync('.'+d.record.indexFile))),expected=M.create(row,row.entries,data,d,d.calls[0]);
   await panel().locator('[data-app-profile]').selectOption({label:d.record.name+' · 1 recorded applications'});await panel().locator('[data-app-load]').click();await page.waitForFunction(hash=>ProofAtlasApplicationManual.getScene()?.source.indexSha256===hash,d.source.indexSha256);const actual=await page.evaluate(()=>ProofAtlasApplicationManual.getScene());assert.deepEqual(actual,expected);report.windows++;
   for(const node of actual.nodes.filter(n=>n.typeBridge)){
    await panel().locator('[data-app-port="'+node.slot+'"]').getByRole('button',{name:'Compare input types',exact:true}).click();
    const box=panel().locator('[data-type-bridge="'+node.typeBridge.identity.input+'"]');assert.equal(await box.count(),1);
    for(const stage of node.typeBridge.stages){const at=await choose(box.locator('[data-type-select="'+stage.id+'"]'));assert.deepEqual(at,stage.address);const provenance=await panel().locator('pre[aria-label="Application expression and provenance"]').innerText(),relation=stage.id==='original'?'original-producer-context':stage.id==='lifted'?'producer-type-in-consumer-context':'consumer-context';assert(provenance.includes('Context: Γ'+stage.contextLength+' · '+relation));report.typeRootSelections++;}
   }
   if(d.source.name.endsWith('dependentLet')){
    const node=actual.nodes.find(n=>n.slot===1);await panel().locator('[data-app-port="1"]').getByRole('button',{name:'Compare input types',exact:true}).click();const box=panel().locator('[data-type-bridge="0:1"]');
    for(const [slots,relation]of [[[1,1,1],'original-context-binder'],[[1,1,2,0,1],'computed-local-binder']]){
     await choose(box.locator('[data-type-select="original"]'));for(const slot of slots)await choose(pane().locator('[data-type-neighborhood-select="field"]').nth(slot));
     const target=await choose(pane().locator('[data-type-neighborhood-binding="'+relation+'"]'));
     if(relation==='original-context-binder'){assert.equal(target.namespace,'source-expression');assert.deepEqual(target.route,{root:1,slots:[]});assert.equal(target.node,A.walk(data,target.route));}
     else{assert.equal(target.namespace,'application-ports');assert.equal(target.component,'producerType');assert.deepEqual(target.route,{root:'producerType',slots:[]});assert.equal(target.evidenceSha256,d.owner.sha256);}report.bindingSelections++;
    }
   }
   await panel().locator('[data-app-port="1"]').getByRole('button',{name:'Compare input types',exact:true}).click();const box=panel().locator('[data-type-bridge="0:1"]');
   for(const width of [1500,390])for(const theme of ['light','dark']){await page.setViewportSize({width,height:1100});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'page overflow');const result=await box.evaluate(async n=>axe.run(n,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));assert.deepEqual(result.violations,[]);report.axeAudits++;if((width===1500&&theme==='light')||(width===390&&theme==='dark')){await box.scrollIntoViewIfNeeded();await page.screenshot({path:path.join(folder,d.record.name.split('.').at(-1)+'-'+width+'-'+theme+'.png')});}}
   report.profiles.push({name:d.source.name,owner:d.owner.sha256,state:await page.evaluate(()=>ProofAtlasApplicationManual.getState())});await panel().locator('[data-app-release]').click();assert.equal(await page.evaluate(()=>ProofAtlasApplicationManual.getScene()),null);
  }
  assert.equal(report.windows,3);assert.equal(report.typeRootSelections,27);assert.equal(report.bindingSelections,2);assert.equal(report.axeAudits,12);assert.deepEqual(errors,[]);assert.deepEqual(archives,[]);report.wholeArchiveRequests=0;report.status='PASS';report.publicDeployment=false;report.scope='Built inspector with three authored kernel-typed controls. Exact type roots and two lexical-binder navigation paths; no AI provenance, semantic compression or measured comprehension.';report.files['research/proof-atlas/formal-support/check-browser.cjs']=sha(fs.readFileSync(__filename));fs.writeFileSync(path.join(folder,'browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,profiles:report.profiles.map(p=>({name:p.name,owner:p.owner})),files:undefined}));
 }catch(e){await page.screenshot({path:path.join(folder,'failure.png')}).catch(()=>{});throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1)});
