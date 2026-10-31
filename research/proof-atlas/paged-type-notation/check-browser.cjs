'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto'),{chromium}=require('playwright');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/paged-type-notation/',origin=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8877',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=f=>JSON.parse(z.gunzipSync(fs.readFileSync(f))),copy=x=>JSON.parse(JSON.stringify(x));
const examples=read(base+'examples.json.gz').examples,native=read('research/proof-atlas/region-input-functions/native.json.gz'),adapters=read('research/proof-atlas/region-input-adapters/native.json.gz'),dependent=read('research/proof-atlas/dependent-region-inputs/native.json.gz'),core=read('research/proof-atlas/type-notation/native.json.gz');
const report={format:'ProofAtlasPagedNotationBrowser/1',status:'RUNNING',factDomains:0,symbolSelections:0,sourceSelectionsPreserved:0,inPlaceOpenings:0,outsideSymbols:0,adapterEndpoints:0,authoredDomains:0,audits:[],files:{}};
const profile=native.profiles[0],candidate=profile.native.cases.find(c=>c.policy==='proof-arguments');
async function bounded(promise,label){let timer;try{return await Promise.race([promise,new Promise((_,reject)=>timer=setTimeout(()=>reject(Error(label)),30000))]);}finally{clearTimeout(timer);}}
async function main(){
 const browser=await chromium.launch({headless:true,executablePath:process.env.ATLAS_CHROMIUM_PATH}),page=await browser.newPage({viewport:{width:1500,height:1100}}),errors=[],forbidden=[];
 const blocked=new Set([...native.profiles,...adapters.profiles,...dependent.profiles].flatMap(p=>[p.record.indexFile,p.originalNativeOwner?.file]).filter(Boolean));
 await page.route('**/*',r=>{const file=new URL(r.request().url()).pathname;if(blocked.has(file)||/\/(?:region-input-functions|region-input-adapters|dependent-region-inputs)\/native\.json\.gz$/.test(file)){forbidden.push(file);return r.abort();}return r.continue();});
 page.on('pageerror',e=>errors.push(e.stack||e.message));await page.addInitScript(()=>{localStorage.setItem('analytics-consent','no');localStorage.setItem('theme','light');});
 const panel=()=>page.locator('[data-region-function-reader]'),notation=()=>panel().locator('[data-region-function-notation]'),state=()=>page.evaluate(()=>ProofAtlasNetworkStreamView.getRegionFunctionState()),source=()=>page.evaluate(()=>ProofAtlasNetworkStreamView.getSelection());
 async function ready(owner=null){
  await page.waitForFunction(owner=>{const s=window.ProofAtlasNetworkStreamView?.getRegionFunctionState();return s&&!s.loading&&s.notation&&!s.notation.loading&&s.notation.owner&&(!owner||(s.notation.owner.nativeCaseSha256===owner.nativeCaseSha256&&s.notation.owner.component===owner.component&&JSON.stringify(s.notation.owner.slots)===JSON.stringify(owner.slots)));},owner);
  const s=await state();assert(s.notation.lease.cachedRows<=8192&&s.notation.lease.decodedRowBytes<=4194304);assert.equal(s.notation.lease.completeTableArraysAllocated,0);assert(s.lease.cachedRows<=64&&s.lease.indexPages<=2);
 }
 async function visit(href){const response=await page.goto(origin+href);if(!response)await page.reload();}
 async function reset(example){await panel().locator('[data-region-function-bindings]').evaluate(n=>n.open=true);await panel().getByRole('button',{name:'Inspect domain '+example.binding,exact:true}).click();await ready(example.owner);}
 function walk(g,slots,root=0){let n=g.roots[root];for(const s of slots)n=g.children[n][s];return n;}
 try{
  for(const example of examples){
   await visit(example.href);await ready(example.owner);const s=await state(),original=await source();
   assert.deepEqual(s.selection,example.computed);assert.deepEqual(s.notation.owner,example.owner);assert.deepEqual(s.notation.stats,example.stats);
   assert.equal(original.node,example.source.node);assert.deepEqual(original.route,example.source.route);assert.equal(original.indexSha256,example.sourceOwner.indexSha256);
   assert(await notation().locator('.tn-expression').isVisible());assert.equal(await panel().locator('[data-type-neighborhood]').isVisible(),false);
   if(example.binding<2)assert.equal((await notation().locator('.tn-expression').innerText()).replace(/\s/g,''),example.text);
   const picks=await notation().locator('.tn-expression [data-tn-pick]').evaluateAll(nodes=>nodes.slice(0,8).map(n=>JSON.parse(n.dataset.tnPick)));
   for(const slots of picks){
    await reset(example);const pick=notation().locator('.tn-expression [data-tn-pick="'+JSON.stringify(slots)+'"]').first();await pick.focus();await page.keyboard.press('Enter');
    await ready();const selected=(await state()).selection;assert.equal(selected.node,walk(candidate.graph,slots));assert.deepEqual(selected.route.slots,slots);assert.equal(selected.nativeCaseSha256,example.computed.nativeCaseSha256);assert.deepEqual(await source(),original);assert(await notation().locator('.tn-expression').evaluate(e=>e===document.activeElement));report.symbolSelections++;report.sourceSelectionsPreserved++;report.symbolFocusPreserved=(report.symbolFocusPreserved||0)+1;
   }
   await reset(example);report.factDomains++;
  }
  const expanding=examples[3];await visit(expanding.href);await ready(expanding.owner);const before=await state(),sourceBefore=await source();
  const target=JSON.parse(await notation().locator('[data-tn-expand]').first().getAttribute('data-tn-expand')),prefix=(a,b)=>a.length<=b.length&&a.every((s,i)=>s===b[i]);
  const outside=(await notation().locator('.tn-expression [data-tn-pick]').evaluateAll(nodes=>nodes.map(n=>({slots:JSON.parse(n.dataset.tnPick),text:n.textContent})))).filter(n=>!prefix(n.slots,target)&&!prefix(target,n.slots));
  await notation().locator('[data-tn-expand]').first().focus();await page.keyboard.press('Enter');
  await page.waitForFunction(previous=>{const s=ProofAtlasNetworkStreamView.getRegionFunctionState();return s.notation&&!s.notation.loading&&BigInt(s.notation.stats.retained)>BigInt(previous);},before.notation.stats.retained);
  const after=await state();assert.deepEqual(after.selection,before.selection);assert.deepEqual(after.notation.owner,before.notation.owner);assert.deepEqual(await source(),sourceBefore);assert(after.notation.stats.nodes<=192);
  for(const n of outside){assert.equal(await notation().locator('.tn-expression [data-tn-pick="'+JSON.stringify(n.slots)+'"]').first().textContent(),n.text);report.outsideSymbols++;}report.inPlaceOpenings++;
  // A displayed variable keeps its original source-binder target.
  await visit(examples[0].href);await ready(examples[0].owner);
  await notation().locator('.tn-expression').getByRole('button',{name:/^J · bvar/}).first().click();await ready();
  await panel().getByRole('button',{name:'Constructor fields',exact:true}).click();
  const binder=panel().locator('[data-type-neighborhood-binding="original-context-binder"]').first(),expected={namespace:'source-expression',name:profile.source.name,indexSha256:profile.source.indexSha256,sourceSha256:profile.source.sourceSha256,node:profile.commonContext[0].node,route:{root:1,slots:profile.commonContext[0].slots}};
  assert.deepEqual(JSON.parse(await binder.getAttribute('data-type-neighborhood-address')),expected);report.originalBinderTarget=true;
  // Root instance/type ports and the exact named head remain independently selectable.
  await visit(examples[0].href);await ready(examples[0].owner);const original=await source();
  const ports=await notation().locator('[data-tn-port]').all();assert(ports.length>0);const portSlots=JSON.parse(await ports[0].getAttribute('data-tn-pick'));await ports[0].click();await ready();assert.deepEqual((await state()).selection.route.slots,portSlots);assert.deepEqual(await source(),original);report.retainedPortSelected=true;
  await reset(examples[0]);const head=notation().locator('[data-tn-head]'),headSlots=JSON.parse(await head.getAttribute('data-tn-pick'));await head.click();await ready();assert.deepEqual((await state()).selection.route.slots,headSlots);assert.deepEqual(await source(),original);report.exactHeadSelected=true;
  await reset(examples[0]);await page.evaluate(()=>window.oldNotationAtom=document.querySelector('[data-region-function-notation] [data-tn-pick]'));
  await panel().getByRole('button',{name:'Constructor fields',exact:true}).click();const retired=await state();await page.evaluate(()=>oldNotationAtom.click());assert.deepEqual(await state(),retired);assert.deepEqual(await source(),original);report.staleAtomRefused=true;
  for(const mode of['catalogue','context','renderer']){
   await visit(examples[0].href);await ready(examples[0].owner);await panel().getByRole('button',{name:'Constructor fields',exact:true}).click();const selected=(await state()).selection,original=await source();
   await page.evaluate(mode=>{
    window.oldCatalogue=PROOF_ATLAS_TYPE_NOTATION;window.oldBindings=PROOF_ATLAS_PAGED_NOTATION_BINDINGS;window.oldNotationRenderer=ProofAtlasTypeNotationView;
    if(mode==='catalogue'){window.PROOF_ATLAS_TYPE_NOTATION=structuredClone(PROOF_ATLAS_TYPE_NOTATION);PROOF_ATLAS_TYPE_NOTATION.entries[0].glyph='foreign';}
    if(mode==='context'){window.PROOF_ATLAS_PAGED_NOTATION_BINDINGS=structuredClone(PROOF_ATLAS_PAGED_NOTATION_BINDINGS);PROOF_ATLAS_PAGED_NOTATION_BINDINGS.registries[0].sources[0].context[0].node++;}
    if(mode==='renderer')window.ProofAtlasTypeNotationView=undefined;
   },mode);
   await panel().getByRole('button',{name:'Read field notation',exact:true}).click();await page.waitForFunction(()=>document.querySelector('[data-region-function-notation-status]')?.textContent.startsWith('Notation unavailable:'));
   assert.equal((await state()).notation,null);assert.deepEqual((await state()).selection,selected);assert.deepEqual(await source(),original);assert(await panel().locator('[data-type-neighborhood]').isVisible());
   await page.evaluate(()=>{window.PROOF_ATLAS_TYPE_NOTATION=oldCatalogue;window.PROOF_ATLAS_PAGED_NOTATION_BINDINGS=oldBindings;window.ProofAtlasTypeNotationView=oldNotationRenderer;});
   await panel().getByRole('button',{name:'Read field notation',exact:true}).click();await ready(examples[0].owner);report.failureRetries=(report.failureRetries||0)+1;
  }
  // Cancel a real page request while switching back to constructor fields.
  await visit(expanding.href);await ready(expanding.owner);await panel().getByRole('button',{name:'Constructor fields',exact:true}).click();
  let entered,resume;const arrival=new Promise(r=>entered=r),gate=new Promise(r=>resume=r);let delayed=false;
  await page.route('**/region-function-pages/*.page.gz',async r=>{if(delayed)return r.continue();delayed=true;entered();await gate;await r.continue().catch(()=>{});});
  await panel().getByRole('button',{name:'Read field notation',exact:true}).click();await bounded(arrival,'No pending notation page request');await panel().getByRole('button',{name:'Constructor fields',exact:true}).click();resume();
  await page.waitForFunction(()=>{const s=ProofAtlasNetworkStreamView.getRegionFunctionState();return!s.notation&&!s.lease.activeOperation&&!s.lease.pendingOperations&&!s.lease.notation;});await page.unroute('**/region-function-pages/*.page.gz');report.pendingRetirement=true;
  // New adapter endpoints and an authored dependent domain use the same reader.
  const h={};for(const f of['region-adapter-function-pages-manifest','dependent-region-function-pages-manifest'])vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+f+'.js','utf8'),{window:h});
  const catalogs=copy(h);
  for(const[p,catalog,rule,binding,field]of[
   [adapters.profiles[0],catalogs.PROOF_ATLAS_REGION_ADAPTER_FUNCTION_PAGES,'adapters',17,'actual'],
   [adapters.profiles[0],catalogs.PROOF_ATLAS_REGION_ADAPTER_FUNCTION_PAGES,'adapters',17,'required'],
   [dependent.profiles[1],catalogs.PROOF_ATLAS_DEPENDENT_REGION_FUNCTION_PAGES,'direct',5,'domain']
  ]){
   const d=catalog.profiles.find(r=>r.source.indexSha256===p.source.indexSha256).cases.find(c=>c.id==='all-boundary-positions'),c=p.native.cases[0],m=read('.'+d.file),b=m.bindings[binding];
   const query=new URLSearchParams({source:p.source.indexSha256,edition:p.source.edition,proof:p.source.name,call:String(b.call),input:String(b.slot),policy:d.id,rule,nativeCase:d.nativeCaseSha256,binding:String(binding),field,presentation:'notation'});
   await visit('/projects/proof-atlas/manual/paged-network/?'+query+'#ns-lab');await ready();const s=await state();assert.equal(s.selection.nativeCaseSha256,d.nativeCaseSha256);assert.equal(s.notation.owner.nativeCaseSha256,d.nativeCaseSha256);assert.equal(s.notation.owner.typeRoot,0);assert.equal(s.notation.stats.represented,c.graph.expanded[s.selection.node]);if(rule==='adapters')report.adapterEndpoints++;else report.authoredDomains++;
  }
  const ai=adapters.profiles[1],aiQuery=new URLSearchParams({source:ai.source.indexSha256,edition:ai.source.edition,proof:ai.source.name,call:String(ai.members.at(-1)),policy:'all-boundary-positions',rule:'adapters',presentation:'notation'});
  await visit('/projects/proof-atlas/manual/paged-network/?'+aiQuery+'#ns-lab');await ready();await panel().locator('[data-region-function-component]').selectOption('source.results');await ready();
  const scale=await state();assert.equal(scale.notation.owner.component,'source.results');assert(scale.notation.lease.tableRows>90000&&scale.notation.lease.cachedRows<scale.notation.lease.tableRows);report.largePacket={tableRows:scale.notation.lease.tableRows,cachedRows:scale.notation.lease.cachedRows,decodedRowBytes:scale.notation.lease.decodedRowBytes,represented:scale.notation.stats.represented};
  const controlPage=await browser.newPage();
  try{
   await controlPage.setContent('<!doctype html><html lang="en"><head><title>Notation renderer controls</title></head><body><main><h1>Notation controls</h1><div id="control"></div></main></body></html>');
   for(const file of['public/js/proof-atlas-library-data.js','public/js/proof-atlas-type-notation.js','public/data/proof-atlas/type-notation-catalog.js','research/proof-atlas/type-notation/view.js'])await controlPage.addScriptTag({url:origin+'/'+file});
   const outcomes=[];
   for(const c of core.controls){
    await controlPage.evaluate(c=>{const root=document.querySelector('#control');root.replaceChildren();window.controlSelections=[];const scene=ProofAtlasTypeNotation.scene(c.graph,c.graph.roots[0],PROOF_ATLAS_TYPE_NOTATION,{address:(node,slots)=>({namespace:'typed-renderer-control',control:c.name,typeRoot:0,node,slots})});ProofAtlasTypeNotationView.draw(root,{scene,isCurrent:()=>true,onSelect:slots=>controlSelections.push(slots)});},c);
    assert.equal((await controlPage.locator('.tn-expression').innerText()).replace(/\s/g,''),'(7+2)');const instance=controlPage.locator('[data-tn-port="3"]');await instance.click();
    const slots=await controlPage.evaluate(()=>controlSelections.at(-1)),node=walk(c.graph,slots);outcomes.push({name:c.name,instance:c.graph.payloads[node].name,result:c.graph.payloads[c.graph.roots[2]].value});
   }
   assert.deepEqual(outcomes.map(r=>r.result),['9','5']);assert.notEqual(outcomes[0].instance,outcomes[1].instance);report.typedInstanceControls=outcomes;
   await controlPage.evaluate(()=>{const name='long'.repeat(40),g={serialization:'ExprDAG/1',roots:[0],kind:[4],children:[[]],payloads:[{name,nameParts:[{str:name}],levels:[]}],expanded:['1'],neededScope:[0]},scene=ProofAtlasTypeNotation.scene(g,0,PROOF_ATLAS_TYPE_NOTATION,{address:(node,slots)=>({namespace:'raw-clipped-label-control',typeRoot:0,node,slots})}),root=document.querySelector('#control');root.replaceChildren();ProofAtlasTypeNotationView.draw(root,{scene,isCurrent:()=>true,onSelect:()=>{}});});
   assert((await controlPage.locator('.tn-expression .tn-atom').textContent()).endsWith('…'));assert((await controlPage.locator('.tn-expression .tn-atom').getAttribute('aria-label')).includes('label clipped'));report.clippedLabelMarked=true;
  }finally{await controlPage.close();}
  await visit(examples[2].href);await ready(examples[2].owner);await page.waitForFunction(()=>document.querySelector('#readable-fields .katex'));report.manualEquationRendered=true;await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  for(const width of[1500,390])for(const theme of['light','dark']){
   await page.setViewportSize({width,height:1100});await page.evaluate(async theme=>{document.documentElement.dataset.theme=theme;await Promise.all(document.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));},theme);
   const typography=await notation().locator('.tn-variable').first().evaluate(e=>({font:getComputedStyle(e).fontFamily,formulaFont:getComputedStyle(e.closest('.tn-expression')).fontFamily,style:getComputedStyle(e).fontStyle,width:e.getBoundingClientRect().width,height:e.getBoundingClientRect().height}));assert.equal(typography.font,typography.formulaFont);assert.equal(typography.style,'italic');assert(typography.width<32&&typography.height>=44);
   const preview=page.locator('[data-ns-detail] > pre');await preview.focus();assert(await preview.evaluate(e=>e===document.activeElement));
   const violations=await page.evaluate(async()=>(await axe.run(document.querySelector('#ns-lab'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));assert.deepEqual(violations,[]);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3));
   const file='notation-'+width+'-'+theme+'.png';await panel().screenshot({path:base+file});report.audits.push({width,theme,file,sha256:sha(fs.readFileSync(base+file)),violations:0,typography});
  }
  for(const file of['public/js/proof-atlas-paged-notation.js','public/js/proof-atlas-region-function-pages.js','public/js/proof-atlas-region-function-pages-view.js','public/js/proof-atlas-network-stream-view.js','research/proof-atlas/type-notation/view.js','research/proof-atlas/type-notation/view.css','public/data/proof-atlas/paged-notation-bindings.js','public/data/proof-atlas/type-notation-catalog.js']){
   const response=await page.request.get(origin+'/'+file);assert.equal(response.status(),200);const bytes=await response.body();assert(bytes.equals(fs.readFileSync(file)));assert(bytes.equals(fs.readFileSync('_site_production/'+file)));report.files[file]=sha(bytes);
  }
  const html=await page.request.get(origin+'/projects/proof-atlas/manual/paged-network/');assert.equal(html.status(),200);const bytes=await html.body();assert(bytes.equals(fs.readFileSync('_site_production/projects/proof-atlas/manual/paged-network/index.html')));report.htmlSha256=sha(bytes);
  assert.deepEqual(errors,[]);assert.deepEqual(forbidden,[]);assert.equal(report.factDomains,5);assert.equal(report.adapterEndpoints,2);assert.equal(report.authoredDomains,1);assert.equal(report.failureRetries,3);assert(report.symbolSelections>=20&&report.outsideSymbols>0);
  report.checkerSha256=sha(fs.readFileSync(__filename));report.wholeArchiveAttempts=0;report.status='PASS';report.scope='Actual production field notation, exact source/derived selection, hidden ports and head, original binder, in-place keyboard opening, stale/failure/retry/retirement, two adapter endpoints, a dependent control and a large AI-source packet. Four layout/theme audits. No new typing or comprehension measurement.';
  fs.writeFileSync(base+'browser-check.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n'),{mtime:0}));console.log(JSON.stringify({...report,files:undefined}));
 }catch(e){fs.writeFileSync(base+'failure.json',JSON.stringify({error:e.stack,errors,forbidden,report,state:await state().catch(()=>null),text:await page.locator('#ns-lab').innerText().catch(()=>null)},null,2));await page.screenshot({path:base+'failure.png'}).catch(()=>{});throw e;}
 finally{await browser.close();}
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
