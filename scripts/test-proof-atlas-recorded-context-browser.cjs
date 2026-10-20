/* Browser coverage of existing project/AI judgments in bounded occurrence windows. */
'use strict';
const fs=require('fs'),vm=require('vm'),z=require('zlib'),assert=require('assert/strict'),{chromium}=require('playwright');
const O=require('../public/js/proof-atlas-occurrence-types'),A=require('../public/js/proof-atlas-library-data'),P=require('../public/js/proof-atlas-packed-routes'),W=require('../public/js/proof-atlas-occurrence-window'),host={};
for(const f of ['library-manifest','occurrence-types-manifest','goedel-sample-manifest'])vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+f+'.js','utf8'),{window:host});
const {library,types}=require('../public/js/proof-atlas-ai-sample').register(host.PROOF_ATLAS_LIBRARY,host.PROOF_ATLAS_OCCURRENCE_TYPES,null,host.PROOF_ATLAS_AI_SAMPLE);
const origin=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8833',dir=process.env.ATLAS_SCREENSHOTS||'/tmp/atlas-recorded-context-browser';
const raw=f=>z.gunzipSync(fs.readFileSync('.'+f)),load=f=>JSON.parse(raw(f));
const rows=types.records.map(d=>{const record=library.editions.find(e=>e.id===d.edition).declarations.find(r=>r.name===d.name),source=load(record.indexFile),evidence=load(d.file),entries=[...O.indexObservations(evidence,source).lookup.values()].filter(q=>q.status==='checked');return{d,record,source,evidence,entries};});
(async()=>{
 fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.ATLAS_CHROMIUM_PATH}),page=await browser.newPage({viewport:{width:1700,height:1100}}),errors=[];
 await page.addInitScript(()=>{localStorage.setItem('analytics-consent','no');localStorage.setItem('theme','light');});page.on('pageerror',e=>errors.push(e.message));
 const snapshot=()=>page.evaluate(()=>window.ProofAtlasOccurrenceView?.getSnapshot()),typeSnapshot=()=>page.evaluate(()=>ProofAtlasOccurrenceView.getTypeSnapshot());
 const url=r=>origin+'/projects/proof-atlas/library/?view=occurrence&edition='+r.d.edition+'&proof='+encodeURIComponent(r.record.name);
 async function open(r){await page.goto(url(r));await page.waitForFunction(n=>window.ProofAtlasOccurrenceView?.getSnapshot()?.source.name===n,r.record.name);}
 async function typing(){await page.locator('[data-load-recorded-types]').click();await page.waitForFunction(()=>ProofAtlasOccurrenceView.getNativeState().loaded);assert.equal(await page.evaluate(()=>ProofAtlasOccurrenceView.getNativeState().error),null);}
 async function choose(r,index){
  const q=r.entries[index],details=page.locator('[data-native-positions]');if(!await details.evaluate(e=>e.open))await details.locator(':scope > summary').click();
  await page.locator('[data-native-filter]').fill('Position '+(index+1)+' e'+q.node+' depth '+q.route.slots.length);
  const pick=page.locator('[data-native-query="'+index+'"]');for(let n=0;!await pick.count()&&n<40;n++)await page.getByRole('button',{name:'Next positions',exact:true}).click();await pick.click();
  await page.waitForFunction(route=>JSON.stringify(ProofAtlasOccurrenceView.getSnapshot()?.route)===JSON.stringify(route),P.encode(q.route.root,q.route.slots));
 }
 async function show(){await page.locator('[data-show-recorded-type]').click();await page.waitForFunction(()=>ProofAtlasOccurrenceView.getTypeScene());}
 let selections=0,listedPositions=0,observationJumps=0,sourceJumps=0,typeJumps=0,accessibilityAudits=0;
 const checked=[];
 try{
  for(const r of rows){
   await open(r);const before=await snapshot(),beforeURL=page.url();assert.equal(before.typing,'not-queried');await typing();const after=await snapshot();assert.deepEqual(after.route,before.route);assert.deepEqual(after.source,before.source);assert.equal(page.url(),beforeURL);
   const inventory=await page.evaluate(()=>ProofAtlasOccurrenceView.getNativeState().inventory);assert.equal(inventory.typedOccurrences,r.entries.length);assert.equal(inventory.sharedTypeTables,1);
   await page.locator('[data-native-positions] > summary').click();
   const listed=await page.evaluate(()=>{const filter=document.querySelector('[data-native-filter]');filter.value='';filter.dispatchEvent(new Event('input',{bubbles:true}));const result=[];while(true){const current=[...document.querySelectorAll('[data-native-query]')];if(current.length>20)throw Error('Unbounded position list');result.push(...current.map(b=>Number(b.dataset.nativeQuery)));const next=[...document.querySelector('[data-native-positions]').querySelectorAll('button')].find(b=>b.textContent==='Next positions');if(next.disabled)break;next.click();}return result;});
   assert.deepEqual(listed,r.entries.map((_,i)=>i));listedPositions+=listed.length;
   const indices=new Set([0,r.entries.length-1]);for(const kind of ['application-trace-observation','lambda-introduction-observation']){const i=r.entries.findIndex(q=>q.typingOrigin?.kind===kind);if(i>=0)indices.add(i);}
   for(const index of indices){
    const q=r.entries[index];await choose(r,index);const selected=await snapshot(),address=page.url();assert.equal(selected.node,q.node);assert.equal(selected.native.role,q.role);assert.equal(selected.native.typeTableRoot,q.typeRoot);assert.equal(selected.native.evidenceSha256,r.d.sha256);assert.equal(selected.native.contextLength,q.context.length);assert(!('typeGraphSha256' in selected.native));selections++;
    await show();assert.deepEqual(await snapshot(),selected);assert.equal(page.url(),address);const scene=await page.evaluate(()=>ProofAtlasOccurrenceView.getTypeScene());assert.equal(scene.root.node,q.typeRoot);assert(scene.nodes.length<=13);assert.equal(BigInt(scene.stats.retained)+BigInt(scene.stats.hidden),BigInt(r.evidence.typeGraph.expanded[q.typeRoot]));
    if(q.typingOrigin){assert.equal(selected.native.recording.kind,q.typingOrigin.kind);assert.equal(await page.locator('[data-recording-query]').count(),1);await page.locator('[data-recording-query]').click();const parent=await snapshot();assert.deepEqual(parent.route,P.encode(q.typingOrigin.query.route.root,q.typingOrigin.query.route.slots));assert.equal(parent.native.recording.kind,'primary-query');assert.equal(await typeSnapshot(),null);observationJumps++;}
    else assert.equal(selected.native.recording.kind,'primary-query');
   }
   const rep=W.representatives(r.source);let unknown;for(let id=0;id<r.source.kind.length;id++){const route=rep.route(id),bytes=P.parse(route),slots=Array.from({length:route.depth},(_,i)=>(bytes[i>>2]>>((i%4)*2))&3);if(!r.entries.some(q=>q.route.root===route.root&&JSON.stringify(q.route.slots)===JSON.stringify(slots))){unknown={id,route};break;}}
   await page.getByLabel('Stored source node number').fill(String(unknown.id));await page.getByRole('button',{name:'Go to node',exact:true}).click();await page.waitForFunction(id=>ProofAtlasOccurrenceView.getSnapshot()?.node===id,unknown.id);assert.equal((await snapshot()).typing,'not-queried');assert.equal(await typeSnapshot(),null);assert.equal(await page.locator('[data-show-recorded-type]').count(),0);
   checked.push({name:r.record.name,edition:r.d.edition,typedOccurrences:r.entries.length,selections:indices.size});
  }
  const epos=rows.find(r=>r.record.name==='JacobiCore.E_pos');await open(epos);await typing();const shared=[];
  for(const [i,q]of epos.entries.entries())if(q.node===17&&q.route.root===1){await choose(epos,i);const s=await snapshot();shared.push(s);assert.equal(s.native.role,q.role);assert.equal(s.native.contextLength,q.context.length);}
  assert.equal(shared.length,2);assert.equal(shared[0].node,shared[1].node);assert.notEqual(shared[0].native.role,shared[1].native.role);assert.notDeepEqual(shared[0].binding.route,shared[1].binding.route);assert.notEqual(shared[0].native.typeTableRoot,shared[1].native.typeTableRoot);
  const riccati=rows.find(r=>r.record.name==='JacobiData.slope_bound_abs');await open(riccati);await typing();await choose(riccati,0);
  // Pagination bounds the DOM without withholding any indexed position.
  await page.locator('[data-native-positions] > summary').click();await page.locator('[data-native-filter]').fill('');assert.equal(await page.locator('[data-native-query]').count(),20);const nextPage=page.getByRole('button',{name:'Next positions',exact:true});await nextPage.focus();await page.keyboard.press('Enter');assert.equal(await page.locator('[data-native-query]').first().getAttribute('data-native-query'),'20');assert(await nextPage.evaluate(b=>b===document.activeElement));await page.getByRole('button',{name:'Previous positions',exact:true}).click();assert.equal(await page.locator('[data-native-query]').first().getAttribute('data-native-query'),'0');
  await page.locator('[data-native-filter]').fill('no-such-record');assert.equal(await page.locator('[data-native-query]').count(),0);assert.match(await page.locator('[data-native-page]').innerText(),/No matching/);await page.locator('[data-native-filter]').fill('');
  // Computed type-local binders and original Γ slots remain separate.
  for(const wanted of ['original-source-context','computed-native-type']){
   let found=false;
   for(let i=0;i<riccati.entries.length&&!found;i++){
    const q=riccati.entries[i],g={...riccati.evidence.typeGraph,roots:[q.typeRoot]},rep=W.representatives(g);
    for(const id of A.reachable(g,q.typeRoot).filter(id=>g.kind[id]===0)){
     const route=rep.route(id),resolved=P.resolve(g,route),namespace=resolved.binding?'computed-native-type':'original-source-context';if(namespace!==wanted)continue;
     await choose(riccati,i);await show();const before=await snapshot(),address=page.url();await page.getByLabel('Computed type node number').fill(String(id));await page.getByRole('button',{name:'Go to type node',exact:true}).click();assert.equal((await typeSnapshot()).node,id);assert.deepEqual(await snapshot(),before);assert.equal(page.url(),address);
     const binding=await page.evaluate(()=>ProofAtlasOccurrenceView.getTypeScene().nodes[0].binding);assert.equal(binding.namespace,wanted);await page.locator('.pow-type-inspector [data-type-binding]').click();
     if(wanted==='original-source-context'){assert.deepEqual((await snapshot()).route,binding.route);assert.equal(await typeSnapshot(),null);sourceJumps++;}else{assert.deepEqual((await typeSnapshot()).typeRoute,binding.route);assert.deepEqual(await snapshot(),before);assert.equal(page.url(),address);typeJumps++;}found=true;break;
    }
   }assert(found,wanted);
  }
  const proofIndex=riccati.entries.findIndex(q=>q.role==='proof'&&q.context.length>=6&&q.typeText.includes('≤'));assert(proofIndex>=0);await choose(riccati,proofIndex);
  const visible=await page.evaluate(()=>ProofAtlasOccurrenceView.getScene().nodes),other=visible.find(n=>n.id!==visible[0].id&&riccati.entries.some(q=>JSON.stringify(P.encode(q.route.root,q.route.slots))===JSON.stringify(n.route)));
  assert(other,'visible source child with a distinct exact type record');const beforeClickURL=page.url();await page.locator('[data-occurrence-node='+JSON.stringify(other.id)+']').click();const clicked=await snapshot(),expected=riccati.entries.find(q=>JSON.stringify(P.encode(q.route.root,q.route.slots))===JSON.stringify(other.route));assert.equal(clicked.node,expected.node);assert.equal(clicked.native.typeTableRoot,expected.typeRoot);assert.equal(clicked.native.role,expected.role);assert.equal(page.url(),beforeClickURL);
  await choose(riccati,proofIndex);await show();await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  for(const width of [1700,390])for(const theme of ['light','dark']){
   await page.setViewportSize({width,height:1100});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
   const violations=await page.evaluate(async()=>(await axe.run({include:[['main']]},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));assert.deepEqual(violations,[]);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3));await page.locator('.pow-type-region').scrollIntoViewIfNeeded();await page.screenshot({path:dir+'/riccati-'+width+'-'+theme+'.png'});accessibilityAudits++;
  }
  await page.setViewportSize({width:1700,height:1100});
  // The separate byte transport is optional for source geometry; it can be retried for typing.
  await page.route('**/proof-atlas-library-bytes.js*',r=>r.fulfill({status:404,body:''}));await open(riccati);const noTransport=await snapshot();assert.equal(noTransport.typing,'not-queried');assert.match(await page.locator('.pow-native-record').innerText(),/unavailable/i);await page.unroute('**/proof-atlas-library-bytes.js*');await typing();assert.deepEqual((await snapshot()).route,noTransport.route);assert.equal(await page.evaluate(()=>ProofAtlasOccurrenceView.getNativeState().matched),true);
  // Corrupt evidence cannot attach; the original source remains navigable and a retry works.
  await page.route('**'+riccati.d.file,r=>r.fulfill({status:200,body:z.gzipSync(Buffer.from('{}'))}));await open(riccati);const unchanged=await snapshot();await page.locator('[data-load-recorded-types]').click();await page.waitForFunction(()=>ProofAtlasOccurrenceView.getNativeState().error);assert.deepEqual(await snapshot(),unchanged);await page.unroute('**'+riccati.d.file);await page.getByRole('button',{name:'Retry recorded types',exact:true}).click();await page.waitForFunction(()=>ProofAtlasOccurrenceView.getNativeState().loaded);assert.equal(await page.evaluate(()=>ProofAtlasOccurrenceView.getNativeState().matched),true);
  // A delayed native load must attach to the current selection, not restore its old position.
  let release,requested;const pending=new Promise(r=>requested=r);await page.route('**'+riccati.d.file,async r=>{requested();await new Promise(resolve=>release=resolve);await r.continue();});await open(riccati);await page.locator('[data-load-recorded-types]').click();await pending;await page.locator('.pow-inspector [data-occurrence-port="0"]').click();const changed=await snapshot(),changedURL=page.url();release();await page.waitForFunction(()=>ProofAtlasOccurrenceView.getNativeState().loaded);assert.deepEqual((await snapshot()).route,changed.route);assert.equal(page.url(),changedURL);await page.unroute('**'+riccati.d.file);
  // An absent optional record does not fetch the synthetic native inventory.
  let syntheticRequests=0;page.on('request',r=>{if(r.url().includes('/deep-typing/'))syntheticRequests++;});await open(riccati);await page.evaluate(()=>window.PROOF_ATLAS_OCCURRENCE_TYPES.records=[]);const unsupported=await snapshot();await typing();assert.equal(await page.evaluate(()=>ProofAtlasOccurrenceView.getNativeState().matched),false);assert.deepEqual(await snapshot(),unsupported);assert.equal(syntheticRequests,0);
  assert.deepEqual(errors,[]);assert.equal(checked.length,25);assert(observationJumps>0&&sourceJumps>0&&typeJumps>0);
  const report={status:'PASS',declarations:checked.length,publisherAttributedAI:20,selectedJudgments:selections,listedPositions,recordingQueryJumps:observationJumps,originalContextJumps:sourceJumps,typeBinderJumps:typeJumps,accessibilityAudits,boundedPositionDOM:20,allIndexedPositionsListedExactlyOnce:listedPositions===2303,sourceNodeClickSelectsExactRecord:true,sharedNodeHasDistinctValueAndProofUses:true,unrecordedPositionsRemainUnknown:true,typeNavigationPreservesSourceURL:true,corruptEvidenceRejected:true,delayedEvidenceKeepsCurrentSelection:true,missingEvidenceDoesNotFetchSyntheticControls:true,newNativeJudgments:0,rows:checked};fs.writeFileSync(dir+'/recorded-context-browser.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }catch(error){fs.writeFileSync(dir+'/failure.json',JSON.stringify({error:error.stack,errors,url:page.url(),snapshot:await snapshot().catch(()=>null),body:(await page.locator('body').innerText()).slice(-18000)},null,2));await page.screenshot({path:dir+'/failure.png'});throw error;}finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1);});
