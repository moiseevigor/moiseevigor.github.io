'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto'),{chromium}=require('playwright');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/dependent-region-inputs/',origin=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8877',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const read=file=>JSON.parse(z.gunzipSync(fs.readFileSync(file))),native=read(base+'native.json.gz'),model=read(base+'model-check.json.gz'),figure=read(base+'figure.json.gz'),host={};
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/dependent-region-function-pages-manifest.js','utf8'),{window:host});
const catalogue=JSON.parse(JSON.stringify(host.PROOF_ATLAS_DEPENDENT_REGION_FUNCTION_PAGES));
const report={format:'ProofAtlasDependentRegionBrowser/1',status:'RUNNING',sourcePorts:0,accepted:0,rejected:0,componentRoots:0,domainReferences:0,binderJumps:0,figureLinks:0,countedProbeWindows:0,audits:[],files:{}};
function url(profile,call,input=null,policy='proof-arguments'){
 const params=new URLSearchParams({source:profile.source.indexSha256,edition:profile.source.edition,proof:profile.source.name,call:String(call),policy});
 if(input!==null)params.set('input',String(input));
 return origin+'/projects/proof-atlas/manual/paged-network/?'+params+'#ns-lab';
}
async function main(){
 const browser=await chromium.launch({headless:true,executablePath:process.env.ATLAS_CHROMIUM_PATH}),page=await browser.newPage({viewport:{width:1500,height:1100}}),errors=[],forbidden=[];
 const blocked=new Set(native.profiles.flatMap(p=>[p.record.indexFile,p.originalNativeOwner.file]));
 page.on('pageerror',e=>errors.push(e.stack||e.message));
 await page.route('**/*',route=>{const file=new URL(route.request().url()).pathname;if(blocked.has(file)||file.endsWith('/dependent-region-inputs/native.json.gz')){forbidden.push(file);return route.abort();}return route.continue();});
 await page.addInitScript(()=>{localStorage.setItem('analytics-consent','no');localStorage.setItem('theme','light');});
 const panel=()=>page.locator('[data-region-function-reader]'),state=()=>page.evaluate(()=>ProofAtlasNetworkStreamView.getRegionFunctionState()),selection=()=>page.evaluate(()=>ProofAtlasNetworkStreamView.getSelection());
 async function ready(id,component='function.reduced'){
  await page.waitForFunction(({id,component})=>{const s=window.ProofAtlasNetworkStreamView?.getRegionFunctionState();return s&&!s.loading&&s.case===id&&(s.status==='kernel-rejected'||s.selection?.component===component);},{id,component});
 }
 async function choose(id){await panel().locator('[data-region-function-case]').selectOption(id);await ready(id);}
 async function component(id,name){await panel().locator('[data-region-function-component]').selectOption(name);await ready(id,name);}
 async function pathTo(slots,prefix=[]){
  for(const[i,slot]of slots.entries()){await panel().locator('[data-type-neighborhood-select="field"]').nth(slot).click();await page.waitForFunction(expected=>{const s=ProofAtlasNetworkStreamView.getRegionFunctionState();return!s.loading&&JSON.stringify(s.selection?.route.slots)===JSON.stringify(expected);},[...prefix,...slots.slice(0,i+1)]);}
 }
 try{
  for(const[pi,profile]of native.profiles.entries()){
   await page.goto(url(profile,profile.members.at(-1)));await ready('proof-arguments');
   await panel().getByRole('button',{name:'Load recorded region calls',exact:true}).click();
   await page.waitForFunction(ids=>!ProofAtlasNetworkStreamView.isBusy()&&JSON.stringify(ProofAtlasNetworkStreamView.getScene().nodes.map(n=>n.id).sort())===JSON.stringify([...ids].sort()),profile.members);
   for(const call of profile.records){
    await page.locator('[data-ns-node="'+call.index+'"]').click();
    for(const port of call.ports){
     await page.locator('[data-ns-ports]').getByRole('button',{name:'Inspect port '+port.id,exact:true}).click();
     await page.waitForFunction(({id,slot,node,route})=>{const api=ProofAtlasNetworkStreamView,s=api.getSelection();return api.getDetail()?.call===id&&api.getDetail()?.slot===slot&&s?.node===node&&JSON.stringify(s.route)===JSON.stringify(route);},{id:call.index,slot:port.slot,node:port.input.node,route:port.input.route});
     const detail=await page.evaluate(()=>ProofAtlasNetworkStreamView.getDetail()),s=await page.evaluate(()=>ProofAtlasNetworkStreamView.getState().selectedPort);
     assert.equal(detail.typeStatus,'recorded-native');assert.equal(detail.node.typeBridge.checks.kernelPortTypeConversion,'PASS');
     assert.equal(s.completeRecordedTypeGraphArraysAllocated,0);assert(s.typeCachedNodes<=320&&s.sourceCachedNodes<=1280);
     if(call.ports.some(p=>p.hops.length)){assert(s.completeGraphArraysAllocated>0&&s.bindingProbeRows>0);report.countedProbeWindows++;}
     report.sourcePorts++;
    }
   }
   for(const[ci,c]of profile.native.cases.entries()){
    await choose(c.policy);
    if(c.status==='KERNEL_REJECTED'){assert.equal((await state()).selection,null);assert.equal(await panel().locator('[data-type-neighborhood]').count(),0);report.rejected++;continue;}
    const descriptor=catalogue.profiles[pi].cases[ci],manifest=read('.'+descriptor.file),before=await selection();
    for(const part of manifest.components){await component(c.policy,part.component);assert.equal((await state()).selection.node,part.root);assert.equal((await state()).selection.nativeCaseSha256,descriptor.nativeCaseSha256);assert.deepEqual(await selection(),before);report.componentRoots++;}
    await panel().locator('[data-region-function-bindings]').evaluate(n=>n.open=true);
    const row=model.casesWithDependencies.find(r=>r.source.indexSha256===profile.source.indexSha256&&r.policy===c.policy);
    for(const edge of row.dependencies){
     const binding=manifest.bindings[edge.binding],prefix=[...binding.slots,0];
     assert.deepEqual(edge.selected.route.slots.slice(0,prefix.length),prefix);
     await panel().getByRole('button',{name:'Inspect domain '+edge.binding,exact:true}).click();
     await page.waitForFunction(slots=>{const s=ProofAtlasNetworkStreamView.getRegionFunctionState();return!s.loading&&JSON.stringify(s.selection?.route.slots)===JSON.stringify(slots);},prefix);
     await pathTo(edge.selected.route.slots.slice(prefix.length),prefix);assert.deepEqual((await state()).selection,edge.selected);
     const selected=panel().locator('[data-type-neighborhood-node="selected"] [data-type-neighborhood-binding="computed-local-binder"]');
     assert.deepEqual(JSON.parse(await selected.getAttribute('data-type-neighborhood-address')),edge.binder);report.domainReferences++;
     await selected.focus();await page.keyboard.press('Enter');
     await page.waitForFunction(address=>{const s=ProofAtlasNetworkStreamView.getRegionFunctionState();return!s.loading&&JSON.stringify(s.selection)===JSON.stringify(address);},edge.binder);
     assert.deepEqual(await selection(),before);report.binderJumps++;
    }
    const s=await state();assert(s.lease.cachedRows<=64&&s.lease.indexPages<=2);report.accepted++;
   }
   // Fold the exact finite inventory; source folding and the selected native
   // function remain separate records with their own checks.
   await choose('proof-arguments');await page.locator('[data-ns-region-fold]').click();
   await page.waitForFunction(()=>!ProofAtlasNetworkStreamView.isBusy()&&ProofAtlasNetworkStreamView.isRegionFolded());
   assert.equal((await state()).case,'proof-arguments');report.foldedControls=(report.foldedControls||0)+1;
  }
  for(const link of figure.links){
   const profile=native.profiles.find(p=>p.source.indexSha256===link.source.indexSha256),candidate=profile.native.cases.find(c=>c.policy==='all-boundary-positions');
   const descriptor=catalogue.profiles.find(p=>p.source.indexSha256===link.source.indexSha256).cases.find(c=>c.id===candidate.policy),manifest=read('.'+descriptor.file),binding=manifest.bindings[link.binding];
   const slots=[...binding.slots,...(link.field==='binder'?[]:[link.field==='domain'?0:1]),...link.tail];
   let expected=candidate.graph.roots[0];for(const slot of slots)expected=candidate.graph.children[expected][slot];
   await page.goto(origin+link.href);
   await page.waitForFunction(({caseHash,node,slots})=>{const s=window.ProofAtlasNetworkStreamView?.getRegionFunctionState();return s&&!s.loading&&s.selection?.nativeCaseSha256===caseHash&&s.selection.node===node&&JSON.stringify(s.selection.route.slots)===JSON.stringify(slots);},{caseHash:link.nativeCaseSha256,node:expected,slots});
   const s=await state();
   assert.equal(s.selection.node,expected);assert.deepEqual(s.selection.route.slots,slots);
   const original=await selection();assert.equal(original.node,binding.source.node);assert.deepEqual(original.route,binding.source.route);
   if(link.relation){assert.deepEqual(s.selection,link.relation.selected);assert.deepEqual(JSON.parse(await panel().locator('[data-type-neighborhood-node="selected"] [data-type-neighborhood-binding]').getAttribute('data-type-neighborhood-address')),link.relation.binder);}
   report.figureLinks++;
  }
  const example=native.profiles[1],descriptor=catalogue.profiles[1].cases.find(c=>c.id==='all-boundary-positions');
  await page.goto(url(example,1,3,'all-boundary-positions'));await ready(descriptor.id);
  await page.evaluate(()=>window.oldDependentField=document.querySelector('[data-region-function-reader] [data-type-neighborhood-select="field"]'));
  await choose('proof-arguments');const before=await state(),sourceBefore=await selection();await page.evaluate(()=>oldDependentField.click());assert.deepEqual(await state(),before);assert.deepEqual(await selection(),sourceBefore);report.staleControlRefused=true;
  await page.route('**'+descriptor.file,r=>r.fulfill({status:200,body:z.gzipSync(Buffer.from('{}'))}));await panel().locator('[data-region-function-case]').selectOption(descriptor.id);
  await page.waitForFunction(()=>document.querySelector('[data-region-function-status]').textContent.startsWith('Region function unavailable:'));assert.equal((await state()).selection,null);assert(await page.locator('[data-ns-node]').count());
  await page.unroute('**'+descriptor.file);await panel().getByRole('button',{name:'Retry region function',exact:true}).click();await ready(descriptor.id);report.failureRetry=true;
  let entered,resume;const arrival=new Promise(r=>entered=r),gate=new Promise(r=>resume=r),delayed=catalogue.profiles[1].cases.find(c=>c.id==='proof-and-function-inputs');
  await page.route('**'+delayed.file,async route=>{entered();await gate;await route.continue().catch(()=>{});});await panel().locator('[data-region-function-case]').selectOption(delayed.id);await arrival;
  await page.locator('[data-ns-release]').click();resume();assert.equal(await state(),null);await page.unroute('**'+delayed.file);report.pendingRetirement=true;
  for(const change of [{nativeCase:'0'.repeat(64)},{binding:'999'},{binding:'1',within:'3'},{binding:'500'},{field:'foreign'}]){
   const target=new URL(url(example,1,3,'all-boundary-positions'));for(const[k,v]of Object.entries(change))target.searchParams.set(k,v);await page.goto(target.href);
   await page.waitForFunction(()=>ProofAtlasNetworkStreamView.getSelection()?.namespace==='source-expression'&&(document.querySelector('[data-ns-status]')?.textContent.includes('linked computed-function record is unavailable')||document.querySelector('[data-ns-status]')?.textContent.includes('outside its bounds')||document.querySelector('[data-ns-status]')?.textContent.includes('computed binding field is unavailable')||document.querySelector('[data-region-function-status]')?.textContent.includes('unavailable in this record')));
   assert.equal((await state())?.selection??null,null);report.linkRefusals=(report.linkRefusals||0)+1;
  }
  for(const change of [{source:'0'.repeat(64)},{edition:'foreign'},{proof:'foreign'},{call:'999'},{input:'65'},{input:'8'}]){
   const target=new URL(url(example,1,3));for(const[k,v]of Object.entries(change))target.searchParams.set(k,v);await page.goto(target.href);
   await page.waitForFunction(()=>window.ProofAtlasNetworkStreamView&&document.querySelector('[data-ns-status]')?.textContent.startsWith('Source link unavailable:'));
   assert.equal(await selection(),null);assert.equal((await state())?.selection??null,null);report.sourceLinkRefusals=(report.sourceLinkRefusals||0)+1;
  }
  await page.goto(origin+figure.links.find(l=>l.relation).href);
  await page.waitForFunction(address=>{const s=window.ProofAtlasNetworkStreamView?.getRegionFunctionState();return s&&!s.loading&&JSON.stringify(s.selection)===JSON.stringify(address);},figure.links.find(l=>l.relation).relation.selected);
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  for(const width of[1500,390])for(const theme of['light','dark']){
   await page.setViewportSize({width,height:1100});await page.evaluate(async t=>{document.documentElement.dataset.theme=t;await Promise.all(document.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));},theme);
   const violations=await page.evaluate(async()=>(await axe.run(document.querySelector('#ns-lab'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));assert.deepEqual(violations,[]);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3));
   const file='dependent-reader-'+width+'-'+theme+'.png';await panel().screenshot({path:base+file});report.audits.push({width,theme,file,sha256:sha(fs.readFileSync(base+file)),violations:0});
  }
  for(const file of['public/js/proof-atlas-application-ports.js','public/js/proof-atlas-application-type-pages.js','public/js/proof-atlas-application-paged-provider.js','public/js/proof-atlas-region-function-pages.js','public/js/proof-atlas-region-function-pages-view.js','public/js/proof-atlas-network-stream-view.js','public/data/proof-atlas/dependent-region-controls-manifest.js','public/data/proof-atlas/dependent-region-function-pages-manifest.js']){
   const response=await page.request.get(origin+'/'+file);assert.equal(response.status(),200);const bytes=await response.body();assert(bytes.equals(fs.readFileSync(file)));assert(bytes.equals(fs.readFileSync('_site_production/'+file)));report.files[file]=sha(bytes);
  }
  assert.deepEqual(errors,[]);assert.deepEqual(forbidden,[]);assert.equal(report.sourcePorts,32);assert.equal(report.accepted,11);assert.equal(report.rejected,1);assert.equal(report.componentRoots,110);assert.equal(report.domainReferences,27);assert.equal(report.binderJumps,27);assert.equal(report.figureLinks,10);
  const html=await page.request.get(origin+'/projects/proof-atlas/manual/paged-network/');assert.equal(html.status(),200);const htmlBytes=await html.body();assert(htmlBytes.equals(fs.readFileSync('_site_production/projects/proof-atlas/manual/paged-network/index.html')));
  report.htmlSha256=sha(htmlBytes);report.checkerSha256=sha(fs.readFileSync(__filename));report.wholeArchiveAttempts=0;report.status='PASS';
  report.scope='Actual production controls: all native input ports, accepted component roots, computed-domain binder references, finite region folds, exact source/computed deep links, rejection/refusal/retry/retirement, keyboard and four responsive/theme layouts. Complete binding-probe metadata is separately counted. No fresh kernel replay or comprehension claim.';
  fs.writeFileSync(base+'browser-check.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n')));console.log(JSON.stringify({...report,files:undefined}));
 }catch(error){fs.writeFileSync(base+'failure.json',JSON.stringify({error:error.stack,errors,forbidden,report,state:await state().catch(()=>null),text:await page.locator('#ns-lab').innerText().catch(()=>null)},null,2));await page.screenshot({path:base+'failure.png'}).catch(()=>{});throw error;}
 finally{await browser.close();}
}
main().catch(error=>{console.error(error.stack);process.exitCode=1;});
