/* Real source/type selection, Γ jumps, deep type navigation and failed/stale records. */
'use strict';
const fs=require('fs'),vm=require('vm'),z=require('zlib'),assert=require('assert/strict'),{chromium}=require('playwright');
const P=require('../public/js/proof-atlas-packed-routes'),host={};vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/deep-typing-manifest.js','utf8'),{window:host});
const descriptor=host.PROOF_ATLAS_DEEP_TYPING,e=JSON.parse(z.gunzipSync(fs.readFileSync('.'+descriptor.file))),cases=[...e.nativeResult.cases,e.originalPublicReplay.record];
const origin=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8833',dir=process.env.ATLAS_SCREENSHOTS||'/tmp/atlas-deep-context-browser';
(async()=>{
 fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.ATLAS_CHROMIUM_PATH}),page=await browser.newPage({viewport:{width:1700,height:1100}}),errors=[];
 await page.addInitScript(()=>{localStorage.setItem('analytics-consent','no');localStorage.setItem('theme','light');});page.on('pageerror',e=>errors.push(e.message));
 const snap=()=>page.evaluate(()=>window.ProofAtlasOccurrenceView?.getSnapshot()),typeSnap=()=>page.evaluate(()=>ProofAtlasOccurrenceView.getTypeSnapshot());
 const control=name=>origin+'/projects/proof-atlas/library/?view=occurrence&control=checked-context&case='+encodeURIComponent(name);
 async function load(name){await page.goto(control(name));await page.waitForFunction(n=>window.ProofAtlasOccurrenceView?.getSnapshot()?.source.name===n,name);}
 async function choose(index){await page.locator('[data-native-positions] > summary').click();await page.locator('[data-native-query="'+index+'"]').click();await page.waitForFunction(()=>ProofAtlasOccurrenceView.getSnapshot()?.typing==='checked-native-record');}
 async function show(){await page.getByRole('button',{name:'Show recorded type',exact:true}).click();await page.waitForFunction(()=>ProofAtlasOccurrenceView.getTypeScene()?.namespace==='computed-native-type');}
 let selections=0,internalJumps=0,sourceJumps=0,deepTypeJumps=0,accessibilityAudits=0;
 try{
  for(const c of cases){
   await load(c.name);
   for(let i=0;i<c.queries.length;i++){
    const q=c.queries[i];await choose(i);const selected=await snap(),url=page.url();assert.equal(selected.node,q.node);assert.equal(selected.native.role,q.role);assert.equal(selected.scopeDepth,q.binderDepths.length);assert.deepEqual(selected.route,P.encode(q.root,q.slots));selections++;
    await show();assert.deepEqual(await snap(),selected);assert.equal(page.url(),url);
    const scene=await page.evaluate(()=>ProofAtlasOccurrenceView.getTypeScene());assert(scene.nodes.every(n=>n.namespace==='computed-native-type'&&n.typeStatus==='type-syntax-only'));assert.equal(scene.stats.represented,q.typeGraph.expanded[q.typeGraph.roots[0]]);
    const variable=q.typeGraph.kind.indexOf(0);
    if(variable>=0){
     await page.getByLabel('Computed type node number').fill(String(variable));await page.getByRole('button',{name:'Go to type node',exact:true}).click();const t=await typeSnap();assert.equal(t.node,variable);assert.deepEqual(await snap(),selected);assert.equal(page.url(),url);if(t.typeRoute.depth>512)deepTypeJumps++;
     const binding=await page.evaluate(()=>ProofAtlasOccurrenceView.getTypeScene().nodes[0].binding);
     if(binding.namespace==='computed-native-type'){
      await page.locator('.pow-type-inspector [data-type-binding]').click();assert.deepEqual((await typeSnap()).typeRoute,binding.route);assert.deepEqual(await snap(),selected);assert.equal(page.url(),url);internalJumps++;
     }else{
      await page.locator('.pow-type-inspector [data-type-binding]').click();await page.waitForFunction(r=>JSON.stringify(ProofAtlasOccurrenceView.getSnapshot()?.route)===JSON.stringify(r),binding.route);assert.equal((await snap()).node,binding.node);assert.equal(await typeSnap(),null);sourceJumps++;await choose(i);await show();
     }
    }
    await page.getByRole('button',{name:'Hide recorded type',exact:true}).click();assert.equal(await typeSnap(),null);
   }
  }
  await load('shadowed-shared-variable');await choose(1);const outer=await snap();await choose(2);const inner=await snap();assert.equal(outer.node,inner.node);assert.equal(outer.native.typeGraphSha256,inner.native.typeGraphSha256);assert.notDeepEqual(outer.binding.route,inner.binding.route);assert.notEqual(outer.native.contextLength,inner.native.contextLength);
  await load('let-value-before-binder');await choose(1);const value=await snap();await choose(2);const body=await snap();assert.equal(value.node,body.node);assert.equal(value.native.contextLength+1,body.native.contextLength);assert.notDeepEqual(value.binding.route,body.binding.route);
  await load('dependent-domain');await choose(2);await show();await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  for(const width of [1700,390])for(const theme of ['light','dark']){
   await page.setViewportSize({width,height:1100});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const problems=await page.evaluate(async()=>(await axe.run({include:[['main']]},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));assert.deepEqual(problems,[]);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3));await page.locator('.pow-type-region').scrollIntoViewIfNeeded();await page.screenshot({path:dir+'/dependent-'+width+'-'+theme+'.png'});accessibilityAudits++;
  }
  await page.setViewportSize({width:1700,height:1100});await load('deep-shadowed-context');await choose(0);await show();await page.locator('.pow-native-record').scrollIntoViewIfNeeded();await page.screenshot({path:dir+'/ten-thousand-binders.png'});
  // Real source packets keep their original producer metadata and load records only on request.
  await page.goto(origin+'/projects/proof-atlas/library/?view=occurrence&control=deep-syntax');await page.waitForFunction(()=>window.ProofAtlasOccurrenceView?.getSnapshot());assert.equal((await snap()).typing,'not-queried');
  await page.getByLabel('Stored source node number').fill('3');await page.getByRole('button',{name:'Go to node',exact:true}).click();await page.waitForFunction(()=>ProofAtlasOccurrenceView.getSnapshot()?.node===3);const deepBefore=await snap();
  await page.locator('[data-load-recorded-types]').click();await page.waitForFunction(()=>ProofAtlasOccurrenceView.getSnapshot()?.typing==='checked-native-record');const deepAfter=await snap();assert.deepEqual(deepAfter.route,deepBefore.route);assert.equal(deepAfter.native.role,'value');assert.equal(deepAfter.route.depth,10001);assert.equal(deepAfter.source.indexSha256,e.originalPublicReplay.inputPacketSha256);await show();
  // An unrecorded child does not inherit a type from its enclosing native query.
  await page.getByRole('button',{name:'Original root',exact:true}).click();await page.locator('.pow-inspector [data-occurrence-port="1"]').click();await page.locator('.pow-inspector [data-occurrence-port="0"]').click();assert.equal((await snap()).typing,'not-queried');assert.equal(await typeSnap(),null);
  // Missing renderer: preserve the source selection and the native record, then retry.
  await page.route('**/proof-atlas-compact-type-view.js*',r=>r.fulfill({status:404,body:''}));await load('dependent-domain');await choose(2);const before=await snap();await page.getByRole('button',{name:'Show recorded type',exact:true}).click();await page.waitForFunction(()=>document.querySelector('.pow-native-record')?.textContent.includes('diagram unavailable'));assert.deepEqual(await snap(),before);assert.equal(await typeSnap(),null);await page.unroute('**/proof-atlas-compact-type-view.js*');await show();
  // A delayed renderer cannot reopen a diagram after the source selection was cleared.
  let release,requested;const pending=new Promise(r=>requested=r);await page.route('**/proof-atlas-compact-type-view.js*',async r=>{requested();await new Promise(resolve=>release=resolve);await r.continue();});await load('dependent-domain');await choose(2);await page.getByRole('button',{name:'Show recorded type',exact:true}).click();await pending;
  await page.evaluate(()=>{const u=new URL(location.href),p=u.hash.split('=');u.hash=p[0]+'='+'0'.repeat(64)+p[1].slice(64);location.hash=u.hash;});await page.waitForFunction(()=>ProofAtlasOccurrenceView.getSnapshot()===null);release();await page.waitForResponse(r=>r.url().includes('proof-atlas-compact-type-view.js'));assert.equal(await snap(),null);assert.equal(await typeSnap(),null);await page.unroute('**/proof-atlas-compact-type-view.js*');
  // Corrupt records cannot change the original selected source; a clean retry can attach them.
  const corrupt=structuredClone(e);corrupt.nativeResult.cases[0].queries[0].role='value';await page.route('**/deep-typing/*.json.gz',r=>r.fulfill({status:200,body:z.gzipSync(Buffer.from(JSON.stringify(corrupt)))}));
  await page.goto(origin+'/projects/proof-atlas/library/?view=occurrence&control=deep-syntax');await page.waitForFunction(()=>window.ProofAtlasOccurrenceView?.getSnapshot());const original=await snap();await page.locator('[data-load-recorded-types]').click();await page.waitForFunction(()=>document.querySelector('.pow-native-record')?.dataset.nativeState==='error');assert.deepEqual(await snap(),original);await page.unroute('**/deep-typing/*.json.gz');await page.getByRole('button',{name:'Retry recorded types',exact:true}).click();await page.waitForFunction(()=>ProofAtlasOccurrenceView.getSnapshot()?.typing==='checked-native-record');
  // Late native data are cached, but cannot restore a cleared source selection.
  let releaseData,requestedData;const pendingData=new Promise(r=>requestedData=r);await page.route('**/deep-typing/*.json.gz',async r=>{requestedData();await new Promise(resolve=>releaseData=resolve);await r.continue();});
  await page.goto(origin+'/projects/proof-atlas/library/?view=occurrence&control=deep-syntax');await page.waitForFunction(()=>window.ProofAtlasOccurrenceView?.getSnapshot());await page.locator('[data-load-recorded-types]').click();await pendingData;
  await page.evaluate(()=>{const u=new URL(location.href),p=u.hash.split('=');u.hash=p[0]+'='+'0'.repeat(64)+p[1].slice(64);location.hash=u.hash;});await page.waitForFunction(()=>ProofAtlasOccurrenceView.getSnapshot()===null);releaseData();await page.waitForFunction(()=>ProofAtlasOccurrenceView.getNativeState().loaded);assert.equal(await snap(),null);assert.equal(await typeSnap(),null);await page.unroute('**/deep-typing/*.json.gz');
  await page.goto(origin+'/projects/proof-atlas/library/?view=occurrence&edition=published-15&proof=JacobiCore.E_pos');await page.waitForFunction(()=>window.ProofAtlasOccurrenceView?.getSnapshot()?.source.name==='JacobiCore.E_pos');const real=await snap();await page.locator('[data-load-recorded-types]').click();await page.waitForFunction(()=>ProofAtlasOccurrenceView.getNativeState().loaded);const realAfter=await snap();assert.deepEqual(realAfter.route,real.route);assert.deepEqual(realAfter.source,real.source);assert.equal(realAfter.typing,'checked-native-record');const project={};vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/occurrence-types-manifest.js','utf8'),{window:project});const own=project.PROOF_ATLAS_OCCURRENCE_TYPES.records.find(d=>d.name==='JacobiCore.E_pos');assert.equal(realAfter.native.evidenceSha256,own.sha256);assert.notEqual(realAfter.native.evidenceSha256,descriptor.sha256);assert.equal(realAfter.native.recording.kind,'primary-query');assert.equal(await page.locator('[data-show-recorded-type]').count(),1);
  assert.deepEqual(errors,[]);assert(sourceJumps>0&&internalJumps>0&&deepTypeJumps>0);
  const report={status:'PASS',cases:cases.length,selectedNativeJudgments:selections,internalTypeBinderJumps:internalJumps,originalContextJumps:sourceJumps,deepTypeJumps,accessibilityAudits,sharedNodesKeepDistinctContexts:true,letValueUsesPriorContext:true,sourceURLStableDuringTypeNavigation:true,originalPublicProducerClaimPreserved:true,unrecordedChildrenRemainUnknown:true,missingRendererKeepsRecordAndSource:true,staleRendererCannotRestoreSelection:true,lateDataCannotRestoreSelection:true,realProjectRetainsOwnNativeTypingProfile:true,corruptEvidenceCannotAttach:true,retryAfterCorruption:true,browserKernelRerun:false};fs.writeFileSync(dir+'/deep-context-browser.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }catch(error){fs.writeFileSync(dir+'/failure.json',JSON.stringify({error:error.stack,errors,url:page.url(),snapshot:await snap().catch(()=>null),body:(await page.locator('body').innerText()).slice(-18000)},null,2));await page.screenshot({path:dir+'/failure.png'});throw error;}finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1)});
