/* Exercise real article/graph/term selections, precise occurrence routes and missing coverage. */
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),zlib=require('node:zlib'),crypto=require('node:crypto');
const {chromium}=require('playwright'),A=require('../public/js/proof-atlas-library-data.js');
const w={};for(const f of ['library-manifest','crossing-article-index','crossing-structure','crossing-terms']){
 const file=path.join(__dirname,'../public/data/proof-atlas',f+'.js');if(fs.existsSync(file))vm.runInNewContext(fs.readFileSync(file,'utf8'),{window:w});
}
const index=w.PROOF_ATLAS_ARTICLE_INDEX,record=w.PROOF_ATLAS_LIBRARY.editions[0].declarations.find(d=>d.name==='CrossingData.crossing');
const bytes=zlib.gunzipSync(fs.readFileSync(path.join(__dirname,'..',record.file)));
assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),record.indexSha256);
const data=A.validateIndex(JSON.parse(bytes),record);
function route(p){const root=data.declaration.rootPaths.findIndex(r=>p===r||p.startsWith(r+'.'));let node=data.roots[root];const slots=[];for(const f of p.slice(data.declaration.rootPaths[root].length).split('.').filter(Boolean)){const slot=A.fields[A.kinds[data.kind[node]]].indexOf(f);assert(slot>=0);slots.push(slot);node=data.children[node][slot];}return{node,route:{root,slots}};}
const decoder=require('../public/js/proof-atlas-term-reader.js').create(w.PROOF_ATLAS_DATA,w.PROOF_ATLAS_TERMS);
function assertPayload(expected,actual){if(expected&&typeof expected==='object'){if(Array.isArray(expected))assert.equal(actual.length,expected.length);for(const key of Object.keys(expected))assertPayload(expected[key],actual[key]);}else assert.equal(actual,expected);}
for(const anchor of index.anchors){assert.equal(decoder.path(anchor.occurrence),anchor.path);const mapped=route(anchor.path);assert.equal(A.kinds[data.kind[mapped.node]],decoder.kind(anchor.occurrence));assertPayload(decoder.payload(anchor.occurrence),data.payloads[mapped.node]);assert.equal(A.path(data,mapped.route),anchor.path);assert.equal(A.walk(data,mapped.route),mapped.node);}
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.ATLAS_CHROMIUM_PATH?{executablePath:process.env.ATLAS_CHROMIUM_PATH}:{})});
 const origin=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8833',shots=process.env.ATLAS_SCREENSHOTS||'/tmp/proof-atlas-sync';fs.mkdirSync(shots,{recursive:true});
 const page=await browser.newPage({viewport:{width:1800,height:1100}}),errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{localStorage.setItem('analytics-consent','no');localStorage.setItem('theme','light');});
 const snap=()=>page.evaluate(()=>window.ProofAtlasSync.getSnapshot());
 const settled=()=>page.waitForFunction(()=>['indexed','context','unmapped'].includes(document.querySelector('#pa-sync-panel').dataset.match));
 try{
  await page.goto(origin+'/projects/proof-atlas/article/',{waitUntil:'networkidle'});
  await page.waitForFunction(()=>document.querySelector('#passage-phase-equation').dataset.syncAnchor);
  assert(await page.locator('#pa-sync-panel').isHidden());assert.equal(await page.locator('.pa-paper .katex').count(),916);
  assert.equal(await page.evaluate(()=>window.PROOF_ATLAS_LIBRARY),undefined,'Full inventory should load only on demand');
  assert.equal(await page.evaluate(()=>window.ProofAtlasLibrary),undefined,'Compiled graph engine should not load during article reading');
  await page.locator('#passage-phase-equation').click();await settled();let s=await snap();
  assert.equal(await page.locator('.pa-reading-options button[aria-pressed=true]').count(),1);
  assert.equal(s.article,'passage-phase-equation');assert.equal(s.compiled.name,'CrossingData.crossing');assert.equal(s.match,'indexed');
  assert.equal(s.compiled.path,index.anchors.find(a=>a.passage==='phase-equation'&&a.path.startsWith('root.value')).path);
  const fields=await page.evaluate(()=>{const d=ProofAtlasLibrary.getData(),s=ProofAtlasLibrary.getSnapshot();return ProofAtlasLibraryData.children(d,s.selected);});
  const selectedLine=page.locator('#pl-rows button[aria-pressed="true"]');assert(await selectedLine.textContent());
  const child=fields.find(i=>data.children[i].length)||fields[0];await page.locator('#pl-rows button[data-occurrence="'+child+'"]').click();await page.waitForFunction(i=>ProofAtlasLibrary.getSnapshot().selected===i,child);await settled();s=await snap();
  assert.equal(s.compiled.root,child);assert.equal(s.article,'passage-phase-equation');assert.equal(s.match,index.anchors.some(a=>a.path===s.compiled.path)?'indexed':'context');
  assert.equal(await page.locator('#pl-rows button[aria-pressed="true"]').getAttribute('data-occurrence'),String(child));
  // Actual canvas hit, not an API-only selection.
  const next=await page.evaluate(()=>{const d=ProofAtlasLibrary.getData(),s=ProofAtlasLibrary.getSnapshot();const id=ProofAtlasLibraryData.children(d,s.selected).find(i=>ProofAtlasLibrary.getPoint(i));return id===undefined?null:ProofAtlasLibrary.getPoint(id);});assert(next,'Expected a visible graph child');
  await page.locator('#pl-canvas').click({position:{x:next.x,y:next.y}});
  await page.waitForFunction(i=>ProofAtlasLibrary.getSnapshot().selected===i,next.id);await settled();
  assert.equal(await page.locator('#pl-rows button[aria-pressed="true"]').getAttribute('data-occurrence'),String(next.id));
  assert(await page.locator('#passage-phase-equation').evaluate(n=>n.classList.contains('pa-sync-selected')));
  await page.locator('#thm\\:first').focus();await page.keyboard.press('Enter');await settled();s=await snap();assert.equal(s.compiled.name,'JacobiFull.exact_first_time');assert.equal(s.article,'thm:first');assert.equal(s.match,'context');
  await page.locator('#pa-sync-declaration').selectOption('JacobiFull.first_time_complete');await page.waitForFunction(()=>ProofAtlasLibrary.getSnapshot().name==='JacobiFull.first_time_complete');await settled();
  await page.locator('#proof-thm-cells').click({position:{x:8,y:12}});await settled();s=await snap();assert.equal(s.article,'proof-thm-cells');assert(s.compiled.name.startsWith('JacobiFull.'));
  await page.locator('#thm\\:floquet').click({position:{x:8,y:12}});await settled();s=await snap();assert.equal(s.match,'unmapped');assert(await page.locator('#pa-sync-proof').isHidden());assert((await page.locator('#pa-sync-status').textContent()).includes('Not formalized'));
  // Rapid changes must leave the most recent unformalized selection visible.
  await page.evaluate(()=>{ProofAtlasSync.selectArticle('thm:first');ProofAtlasSync.selectArticle('thm:floquet');});await settled();assert.equal((await snap()).article,'thm:floquet');assert(await page.locator('#pa-sync-proof').isHidden());
  await page.locator('#passage-counting').focus();await page.keyboard.press('Enter');await settled();s=await snap();assert.equal(s.compiled.path,'root.value');
  // All 84 old occurrence anchors are bridged to the DAG by their full path.
  for(const anchor of index.anchors){await page.evaluate(async a=>{const api=ProofAtlasLibrary,m=ProofAtlasSync.routeFromPath(api.getData(),a.path);await api.selectOccurrence(m.node,true,false,m.route);},anchor);await page.waitForFunction(id=>ProofAtlasSync.getSnapshot().article===id,index.passages.find(p=>p.id===anchor.passage).htmlAnchor);s=await snap();assert.equal(s.compiled.path,anchor.path);assert.equal(s.match,'indexed');}
  const shared=page.url(),saved=(await snap()).compiled.path;await page.goto(shared);await page.waitForFunction(p=>ProofAtlasSync.getSnapshot().compiled?.path===p,saved);assert.equal((await snap()).match,'indexed');
  await page.evaluate(()=>ProofAtlasSync.selectArticle('passage-counting'));await settled();
  await page.screenshot({path:path.join(shots,'reader-wide.png')});
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  let audits=0;for(const width of [1800,1280,390]){
   await page.setViewportSize({width,height:1000});assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3),'Horizontal overflow '+width);
   for(const theme of ['light','dark']){await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await page.waitForTimeout(250);const result=await page.evaluate(async()=> (await axe.run(document.querySelector('.d-article'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));assert.deepEqual(result,[],'Synchronized accessibility '+width+' '+theme);audits++;}
  }
  await page.screenshot({path:path.join(shots,'reader-mobile.png')});
  await page.getByRole('button',{name:'Article',exact:true}).click();assert(await page.locator('#pa-sync-panel').isHidden());assert.equal(await page.locator('.pa-paper .katex').count(),916);
  assert.equal(errors.length,0,errors.join('; '));
  // A stale article index must never produce a plausible highlight.
  const stale=await browser.newPage();await stale.route('**/crossing-article-index.js*',async r=>{const response=await r.fetch();await r.fulfill({response,body:(await response.text()).replace(index.source.sha256,'0'.repeat(64))});});await stale.goto(origin+'/projects/proof-atlas/article/');await stale.waitForFunction(()=>document.querySelector('[data-pa-sync]').disabled);assert(await stale.locator('#pa-sync-panel').isHidden());await stale.close();
  console.log(JSON.stringify({status:'PASS',exactPathBridges:index.anchors.length,directions:['article to graph and Lean','Lean line to graph and article','canvas node to Lean and article'],unformalizedClears:true,latestSelectionWins:true,staleIndexRejected:true,mathPreserved:916,accessibilityAudits:audits,screenshots:shots}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1);});
