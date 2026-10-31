'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict'),{chromium}=require('playwright');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/region-input-adapters/',origin=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8877',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=f=>JSON.parse(z.gunzipSync(fs.readFileSync(f)));
const native=read(base+'native.json.gz'),figure=read(base+'figure.json.gz'),host={};
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/region-adapter-function-pages-manifest.js','utf8'),{window:host});const catalogue=JSON.parse(JSON.stringify(host.PROOF_ATLAS_REGION_ADAPTER_FUNCTION_PAGES));
const report={format:'ProofAtlasRegionInputAdapterBrowser/1',status:'RUNNING',profiles:0,cases:0,componentRoots:0,adapterDomains:0,adapterEndpoints:0,sourceConnections:0,directRejectionsRetained:0,figureLinks:0,audits:[],files:{}};
function url(p,policy='all-boundary-positions',rule='adapters'){
 return origin+'/projects/proof-atlas/manual/paged-network/?'+new URLSearchParams({source:p.source.indexSha256,edition:p.source.edition,proof:p.source.name,call:String(p.members.at(-1)),policy,rule})+'#ns-lab';
}
async function main(){
 const b=await chromium.launch({headless:true,executablePath:process.env.ATLAS_CHROMIUM_PATH}),page=await b.newPage({viewport:{width:1500,height:1100}}),errors=[],forbidden=[];
 const blocked=new Set(native.profiles.flatMap(p=>[p.record.indexFile,p.originalNativeOwner?.file]).filter(Boolean));
 await page.route('**/*',r=>{const file=new URL(r.request().url()).pathname;if(blocked.has(file)||file.endsWith('/region-input-adapters/native.json.gz')){forbidden.push(file);return r.abort();}return r.continue();});
 page.on('pageerror',e=>errors.push(e.stack||e.message));await page.addInitScript(()=>{localStorage.setItem('theme','light');localStorage.setItem('analytics-consent','no');});
 const panel=()=>page.locator('[data-region-function-reader]'),state=()=>page.evaluate(()=>ProofAtlasNetworkStreamView.getRegionFunctionState()),source=()=>page.evaluate(()=>ProofAtlasNetworkStreamView.getSelection());
 async function ready(id,component='function.reduced',rule='adapters'){
  await page.waitForFunction(({id,component,rule})=>{const s=window.ProofAtlasNetworkStreamView?.getRegionFunctionState();return s&&!s.loading&&s.rule===rule&&s.case===id&&(s.status==='kernel-rejected'||s.selection?.component===component);},{id,component,rule});
 }
 async function at(slots){await page.waitForFunction(slots=>{const s=window.ProofAtlasNetworkStreamView?.getRegionFunctionState();return s&&!s.loading&&s.selection?.component==='function.original'&&JSON.stringify(s.selection.route.slots)===JSON.stringify(slots);},slots);}
 try{
  for(const p of native.profiles){
   await page.goto(url(p));await ready('all-boundary-positions');
   const profile=catalogue.profiles.find(r=>r.source.indexSha256===p.source.indexSha256);
   for(const c of p.native.cases){
    await panel().locator('[data-region-function-case]').selectOption(c.policy);await ready(c.policy);
    const d=profile.cases.find(r=>r.id===c.policy),m=read('.'+d.file),before=await source();
    for(const component of m.components){
     await panel().locator('[data-region-function-component]').selectOption(component.component);await ready(c.policy,component.component);
     const s=await state();assert.equal(s.selection.node,component.root);assert.equal(s.selection.nativeCaseSha256,d.nativeCaseSha256);assert.deepEqual(await source(),before);report.componentRoots++;
    }
    await panel().locator('[data-region-function-bindings]').evaluate(n=>n.open=true);
    for(const a of c.adapters){
     const binding=m.bindings[a.binding],domain=[...binding.slots,0],sourceBefore=await source();
     assert.equal(binding.kind,'adapter');assert.equal(binding.source,undefined);
     await panel().getByRole('button',{name:'Inspect domain '+a.binding,exact:true}).click();await at(domain);report.adapterDomains++;
     for(const [label,slot]of[['Produced type',0],['Required type',1]]){
      await panel().getByRole('button',{name:label+' for adapter '+a.binding,exact:true}).click();const slots=[...domain,slot];await at(slots);
      let expected=c.graph.roots[0];for(const slot of slots)expected=c.graph.children[expected][slot];assert.equal((await state()).selection.node,expected);assert.deepEqual(await source(),sourceBefore);report.adapterEndpoints++;
     }
     const selected=(await state()).selection;
     await panel().getByRole('button',{name:'Select source input for adapter '+a.binding,exact:true}).click();
     await page.waitForFunction(({node,route})=>{const s=ProofAtlasNetworkStreamView.getSelection();return s?.namespace==='source-expression'&&s.node===node&&JSON.stringify(s.route)===JSON.stringify(route);},a.sourcePort.input);
     assert.deepEqual((await state()).selection,selected);report.sourceConnections++;
    }
    const s=await state();assert(s.lease.cachedRows<=64&&s.lease.indexPages<=2&&s.lease.pendingOperations<=1);report.cases++;
   }
   // The direct rule remains a separate view, including its negative results.
   await panel().locator('[data-region-function-rule]').selectOption('direct');await ready('all-boundary-positions','function.reduced','direct');
   const baseline=p.baseline.find(c=>c.policy==='all-boundary-positions');
   assert.equal((await state()).status,baseline.status==='KERNEL_REJECTED'?'kernel-rejected':'ready');
   if(baseline.status==='KERNEL_REJECTED'){assert.equal((await state()).selection,null);assert.equal(await panel().locator('[data-type-neighborhood]').count(),0);report.directRejectionsRetained++;}
   assert.equal(await panel().getByRole('button',{name:/type for adapter/}).count(),0);
   await panel().locator('[data-region-function-rule]').selectOption('adapters');await ready('all-boundary-positions');report.profiles++;
  }
  for(const link of figure.links){
   await page.goto(origin+link.href);await page.waitForFunction(address=>{const s=window.ProofAtlasNetworkStreamView?.getRegionFunctionState();return s&&!s.loading&&JSON.stringify(s.selection)===JSON.stringify(address);},link.selected);
   const selected=await source();assert.equal(selected.node,link.source.node);assert.deepEqual(selected.route,link.source.route);assert.equal(selected.indexSha256,link.sourceOwner.indexSha256);report.figureLinks++;
  }
  const p=native.profiles[0],d=catalogue.profiles[0].cases[0];
  await page.goto(url(p));await ready(d.id);
  await panel().locator('[data-region-function-bindings]').evaluate(n=>n.open=true);
  await page.evaluate(()=>window.oldAdapterButton=document.querySelector('[data-region-function-reader] [data-region-function-binding="17"] button'));
  await panel().locator('[data-region-function-rule]').selectOption('direct');await ready(d.id,'function.reduced','direct');const before=await state();await page.evaluate(()=>oldAdapterButton.click());assert.deepEqual(await state(),before);report.staleAdapterRefused=true;
  await page.route('**'+d.file,r=>r.fulfill({status:200,body:z.gzipSync(Buffer.from('{}'))}));await panel().locator('[data-region-function-rule]').selectOption('adapters');
  await page.waitForFunction(()=>document.querySelector('[data-region-function-status]').textContent.startsWith('Region function unavailable:'));assert.equal((await state()).selection,null);assert(await page.locator('[data-ns-node]').count());
  await page.unroute('**'+d.file);await panel().getByRole('button',{name:'Retry region function',exact:true}).click();await ready(d.id);report.failureRetry=true;
  let entered,resume;const arrival=new Promise(r=>entered=r),gate=new Promise(r=>resume=r),delayed=catalogue.profiles[0].cases[1];
  await page.route('**'+delayed.file,async r=>{entered();await gate;await r.continue().catch(()=>{});});await panel().locator('[data-region-function-case]').selectOption(delayed.id);await arrival;
  await panel().locator('[data-region-function-rule]').selectOption('direct');await ready('all-boundary-positions','function.reduced','direct');resume();await page.unroute('**'+delayed.file);assert.equal((await state()).rule,'direct');assert.equal((await state()).selection,null);report.pendingRuleRetired=true;
  for(const [key,value]of[['rule','foreign'],['nativeCase','0'.repeat(64)],['binding','511']]){
   const target=new URL(origin+figure.links[0].href);target.searchParams.set(key,value);await page.goto(target.href);
   await page.waitForFunction(()=>ProofAtlasNetworkStreamView?.getSelection()?.namespace==='source-expression'&&((document.querySelector('[data-ns-status]')?.textContent.includes('linked computed-function record is unavailable'))||document.querySelector('[data-region-function-status]')?.textContent.includes('unavailable in this record')));
   assert.equal((await state())?.selection??null,null);report.linkRefusals=(report.linkRefusals||0)+1;
  }
  await page.goto(origin+figure.links.find(l=>l.field==='domain'&&l.binding===17).href);await at(figure.links.find(l=>l.field==='domain'&&l.binding===17).selected.route.slots);
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  for(const width of[1500,390])for(const theme of['light','dark']){
   await page.setViewportSize({width,height:1100});await page.evaluate(async t=>{document.documentElement.dataset.theme=t;await Promise.all(document.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));},theme);
   const violations=await page.evaluate(async()=>(await axe.run(document.querySelector('#ns-lab'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));assert.deepEqual(violations,[]);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3));
   const file='adapter-reader-'+width+'-'+theme+'.png';await panel().screenshot({path:base+file});report.audits.push({width,theme,file,sha256:sha(fs.readFileSync(base+file)),violations:0});
  }
  for(const file of['public/js/proof-atlas-region-function-pages.js','public/js/proof-atlas-region-function-pages-view.js','public/js/proof-atlas-network-stream-view.js','public/data/proof-atlas/region-adapter-function-pages-manifest.js',base+'adapter-wires.svg']){
   const response=await page.request.get(origin+'/'+file);assert.equal(response.status(),200);const bytes=await response.body();assert(bytes.equals(fs.readFileSync(file)));assert(bytes.equals(fs.readFileSync('_site_production/'+file)));report.files[file]=sha(bytes);
  }
  const response=await page.request.get(origin+'/projects/proof-atlas/manual/paged-network/'),html=await response.body();assert.equal(response.status(),200);assert(html.equals(fs.readFileSync('_site_production/projects/proof-atlas/manual/paged-network/index.html')));report.htmlSha256=sha(html);
  assert.deepEqual(errors,[]);assert.deepEqual(forbidden,[]);assert.equal(report.profiles,10);assert.equal(report.cases,30);assert.equal(report.componentRoots,300);assert.equal(report.adapterDomains,9);assert.equal(report.adapterEndpoints,18);assert.equal(report.sourceConnections,9);assert.equal(report.directRejectionsRetained,3);assert.equal(report.figureLinks,10);
  report.checkerSha256=sha(fs.readFileSync(__filename));report.wholeArchiveAttempts=0;report.status='PASS';report.scope='Actual production reader: thirty conditional interfaces, 300 roots, nine explicit adapter domains, eighteen produced/required endpoints, source connections, preserved direct rejections, exact figure links, rule-switch/refusal/retry/lifecycle and four layout/theme audits. No kernel replay, general adapter existence or comprehension measurement.';
  fs.writeFileSync(base+'browser-check.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n'),{mtime:0}));console.log(JSON.stringify({...report,files:undefined}));
 }catch(e){fs.writeFileSync(base+'failure.json',JSON.stringify({error:e.stack,errors,forbidden,report,state:await state().catch(()=>null),text:await page.locator('#ns-lab').innerText().catch(()=>null)},null,2));await page.screenshot({path:base+'failure.png'}).catch(()=>{});throw e;}
 finally{await b.close();}
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
