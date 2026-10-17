/* Audit every served declaration packet; exercise complete proof UI and article links. */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const A=require('../public/js/proof-atlas-library-data.js');
const sharedBinder={roots:[2,3],kind:[4,0,6,6],children:[[],[],[0,1],[0,1]],payloads:[{name:'Nat'},{index:0},{binderName:'x'},{binderName:'y'}],declaration:{rootPaths:['root.type','root.value']}};
assert.equal(A.binder(sharedBinder,{root:0,slots:[1]}),2);assert.equal(A.binder(sharedBinder,{root:1,slots:[1]}),3);
assert.deepEqual(A.binding(sharedBinder,{root:1,slots:[1]}).route,{root:1,slots:[]});
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.ATLAS_CHROMIUM_PATH?{executablePath:process.env.ATLAS_CHROMIUM_PATH}:{})});
 const base=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8833',dir=process.env.ATLAS_SCREENSHOTS||'/tmp/proof-atlas-library-browser';fs.mkdirSync(dir,{recursive:true});
 const p=await browser.newPage({viewport:{width:1680,height:1050}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{localStorage.setItem('theme','light');localStorage.setItem('analytics-consent','no');});
 try{
  await p.goto(base+'/projects/proof-atlas/library/?proof=JacobiFull.exact_first_time');await p.waitForFunction(()=>ProofAtlasLibrary.getSnapshot()?.name==='JacobiFull.exact_first_time'&&!document.getElementById('pl-library').matches('[aria-busy=true]'));
  assert((await p.locator('#pl-rows').textContent()).includes('left_exact_time'),'Compiled theorem body missing its referenced proof');assert(await p.locator('#pl-source pre').count()===1);
  const all=await p.evaluate(async()=>{
   const result=[];
   for(const e of PROOF_ATLAS_LIBRARY.editions){
    let nodes=0,occurrences=0n;
    for(const r of e.declarations){const opened=await ProofAtlasLibraryData.open(r);nodes+=opened.data.kind.length;occurrences+=BigInt(r.occurrences);if(opened.data.roots.length!==r.rootPaths.length)throw Error('Root path inventory mismatch');}
    result.push({edition:e.id,declarations:e.declarations.length,nodes,occurrences:occurrences.toString()});
   }
   return result;
  });
  assert.equal(all.length,6);assert.equal(all[5].edition,'closed-context-controls');assert.equal(all[5].declarations,12);assert.equal(all.reduce((n,e)=>n+e.declarations,0),2234);assert.equal(all[4].edition,'source-reference-controls');assert.equal(all[4].declarations,19);assert.equal(all[3].edition,'goedel-sample-4331');assert.equal(all[3].declarations,20);assert.equal(all[2].edition,'recursion-controls');assert.equal(all[2].declarations,85);assert.equal(all[0].declarations,739);assert.equal(all[1].declarations,1359);console.log('Every served packet verified: '+JSON.stringify(all));
  const records=await p.evaluate(()=>{const e=PROOF_ATLAS_LIBRARY.editions[0],groups=new Map();e.declarations.forEach(r=>{if(!groups.has(r.module)&&r.bodyAvailable)groups.set(r.module,r.name);});return[...groups.values(),e.declarations.find(r=>r.kind==='recursor').name,e.declarations.find(r=>!r.sourceRange&&r.bodyAvailable).name,'CrossingData.crossing','JacobiData.hasDerivAt_a','JacobiCore.abs_Φ\'_le'];});
  for(const name of records){await p.evaluate(name=>ProofAtlasLibrary.selectDeclaration(name),name);const d=await p.evaluate(()=>ProofAtlasLibrary.getData());assert(d.kind.length>0);const snap=await p.evaluate(()=>ProofAtlasLibrary.getSnapshot());assert.equal(snap.name,name);assert(await p.locator('#pl-rows button').count()>0);assert((await p.locator('#pl-expression').textContent()).includes('root.'));}
  await p.evaluate(()=>ProofAtlasLibrary.selectDeclaration('CrossingData.crossing'));
  assert.equal((await p.evaluate(()=>ProofAtlasLibrary.getSnapshot())).occurrences,'7288','Focused benchmark and complete library differ');
  const a=await p.locator('#pl-expression .pl-actions button').first();await a.click();const selected=await p.evaluate(()=>ProofAtlasLibrary.getSnapshot());assert(selected.path.endsWith('.domain')||selected.path.endsWith('.fn'));
  await p.getByRole('button',{name:'Parent',exact:true}).click();assert((await p.evaluate(()=>ProofAtlasLibrary.getSnapshot())).path==='root.value');
  await p.getByRole('button',{name:'All declaration links',exact:true}).click();assert((await p.locator('#pl-graph-note').textContent()).includes('739 / 739'));
  await p.getByRole('button',{name:'Term structure',exact:true}).click();
  const point=await p.evaluate(()=>ProofAtlasLibrary.getPoint(ProofAtlasLibrary.getSnapshot().selected));assert(point&&Number.isFinite(point.x)&&Number.isFinite(point.y));
  await p.screenshot({path:path.join(dir,'complete-crossing-proof.png')});
  await p.locator('#pl-edition').selectOption('working-26');await p.waitForFunction(()=>ProofAtlasLibrary.getSnapshot()?.edition==='working-26'&&!document.getElementById('pl-library').matches('[aria-busy=true]'));
  await p.evaluate(()=>ProofAtlasLibrary.selectDeclaration('JacobiConcrete.AmplitudeChart.midpoint_polynomial'));
  const largest=await p.evaluate(()=>ProofAtlasLibrary.getSnapshot());assert.equal(largest.occurrences,'462477126');assert.equal(largest.uniqueNodes,121568);assert(largest.rendered<=800);
  await p.screenshot({path:path.join(dir,'shared-large-proof.png')});
  for(const width of [1280,768,390]){await p.setViewportSize({width,height:950});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3),'Library overflow '+width);}
  await p.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  for(const theme of ['light','dark']){await p.evaluate(t=>document.documentElement.dataset.theme=t,theme);const audit=await p.evaluate(()=>axe.run(document.getElementById('pl-library'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));fs.writeFileSync(path.join(dir,'library-axe-'+theme+'.json'),JSON.stringify(audit,null,2));assert.deepEqual(audit.violations.map(v=>v.id),[],'Library accessibility '+theme);}
  await p.setViewportSize({width:1680,height:1050});await p.goto(base+'/projects/proof-atlas/article/?view=lean#proof-thm-first');await p.waitForFunction(()=>document.body.dataset.paReadingMode==='compare'&&document.querySelectorAll('.pa-compiled-term').length===5);
  assert.equal(await p.locator('[data-article-proof]').count(),6);assert.equal(await p.locator('.pa-compiled-term').count(),5);assert((await p.locator('[data-article-proof="proof-thm-floquet"]').textContent()).includes('No Lean proof exists'));
  for(const proof of ['proof-lem-identities','proof-lem-riccati','proof-lem-crossing','proof-thm-first','proof-thm-cells']){const pane=p.locator('[data-article-proof="'+proof+'"]');assert(await pane.locator('.pa-proof-line').count()>1);assert(await pane.locator('[data-term-node]').count()>0);const href=await pane.locator('.pa-proof-open').getAttribute('href');assert(href.includes('/library/?edition=published-15&proof='));}
  const theorem=p.locator('[data-article-proof="proof-thm-first"]');await theorem.locator('select').selectOption('JacobiFull.exact_first_time');await p.waitForFunction(()=>document.querySelector('[data-article-proof="proof-thm-first"] .pa-source-proof').dataset.leanName==='JacobiFull.exact_first_time'&&document.querySelector('[data-article-proof="proof-thm-first"] .pa-compiled-term'));
  await p.locator('#proof-thm-first').evaluate(n=>n.scrollIntoView({block:'start'}));await p.screenshot({path:path.join(dir,'article-and-complete-proof.png')});
  await p.locator('.pa-row-connections a[data-lean-name="JacobiFull.exact_first_time"]').last().click();await p.waitForURL('**/library/**');await p.waitForFunction(()=>ProofAtlasLibrary.getSnapshot()?.name==='JacobiFull.exact_first_time');
  const bad=await browser.newPage();await bad.route('**/library/published-15/*.gz',r=>r.fulfill({status:200,contentType:'application/octet-stream',body:Buffer.from([31,139,8,0,0])}));await bad.goto(base+'/projects/proof-atlas/library/?proof=CrossingData.crossing');await bad.waitForFunction(()=>!document.getElementById('pl-library').matches('[aria-busy=true]'));assert.equal(await bad.locator('#pl-source pre').count(),0,'Corrupt proof packet must fail closed');await bad.close();
  const textDownload=await p.goto(base+'/projects/proof-atlas/library/?proof=CrossingData.crossing');await p.waitForFunction(()=>ProofAtlasLibrary.getSnapshot()?.name==='CrossingData.crossing');
  const download=await Promise.all([p.waitForEvent('download'),p.getByRole('button',{name:'Download complete decoded term'}).click()]);const downloaded=fs.readFileSync(await download[0].path(),'utf8');assert(downloaded.includes('Root: e'));assert(downloaded.includes('CrossingData.exists_branch'));assert(downloaded.includes('bound variable ['));
  assert.equal((await p.request.get(base+'/public/research/proof-atlas/formal/working-26/complete-project.zip')).status(),404);
  assert(await p.evaluate(()=>PROOF_ATLAS_LIBRARY.editions.every(e=>!e.sourceArchive&&!e.sourceProject&&e.declarations.every(r=>!r.sourceUrl))), 'Private sources in public manifest');
  assert.deepEqual(errors,[]);const report={status:'PASS',allServedPackets:all,representativeTermsAndGraphs:records.length,articleProofBlocks:6,completeLeanProofLanes:5,unformalizedProofs:1,largestProof:largest,publication:'compiled terms only',decodedTermDownload:true,corruptPacket:'rejected',axeViolations:0,responsive:true};fs.writeFileSync(path.join(dir,'browser-checks.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1);});
