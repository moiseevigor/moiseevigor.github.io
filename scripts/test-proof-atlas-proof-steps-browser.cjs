/* Actual article, compiled-line, canvas and standalone-library proof-step journeys. */
'use strict';
const {chromium}=require('playwright'),assert=require('assert/strict'),fs=require('fs'),path=require('path'),vm=require('vm');
const w={};vm.runInNewContext(fs.readFileSync(path.join(__dirname,'../public/data/proof-atlas/article-proof-steps.js'),'utf8'),{window:w});const I=w.PROOF_ATLAS_PROOF_STEPS;
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.ATLAS_CHROMIUM_PATH?{executablePath:process.env.ATLAS_CHROMIUM_PATH}:{})}),origin=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8833',dir=process.env.ATLAS_SCREENSHOTS||'/tmp/proof-atlas-proof-steps';fs.mkdirSync(dir,{recursive:true});
 const p=await browser.newPage({viewport:{width:1800,height:1050}}),errors=[];p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>{localStorage.setItem('analytics-consent','no');localStorage.setItem('theme','light');});
 const settled=()=>p.waitForFunction(()=>['indexed','context','step-context','unmapped'].includes(document.querySelector('#pa-sync-panel').dataset.match));
 const snapshot=()=>p.evaluate(()=>ProofAtlasSync.getSnapshot());
 try{
  await p.goto(origin+'/projects/proof-atlas/article/');await p.waitForFunction(()=>document.querySelector('#step-first-crossing')?.dataset.syncAnchor);assert(await p.locator('#pa-sync-panel').isHidden());assert.equal(await p.locator('.pa-paper .katex').count(),916);
  for(const step of I.passages){await p.locator('#'+step.id).focus();await p.keyboard.press('Enter');await settled();const s=await snapshot();assert.equal(s.article,step.id);if(step.status==='unmapped'){assert.equal(s.match,'unmapped');assert.equal(s.compiled,null);}else{assert.equal(s.match,'indexed');assert.equal(s.compiled.name,step.defaultDeclaration);assert.equal(s.compiled.path,step.defaultPath);assert(await p.locator('#'+step.id).evaluate(n=>n.classList.contains('pa-sync-selected')));}}
  // The argument view uses real compiled theorem bodies and completed calls.
  await p.evaluate(()=>ProofAtlasSync.selectArticle('step-riccati-amgm'));await settled();
  assert(await p.locator('#pa-riccati-geometry').isVisible());assert.equal(await p.locator('[data-argument-node]').count(),9);assert.equal(await p.locator('[data-argument-edge]').count(),6);
  const argument=require('../public/js/proof-atlas-riccati-geometry').model(I);
  for(const node of argument.nodes){await p.locator('[data-argument-node="'+node.id+'"]').click();await p.waitForFunction(n=>ProofAtlasSync.getSnapshot().compiled?.name===n.declaration&&ProofAtlasSync.getSnapshot().article===n.step,node);assert.equal((await snapshot()).compiled.path,node.anchor.path);}
  for(const edge of argument.edges){await p.locator('[data-argument-call="'+edge.from+'-'+edge.to+'"]').click();await p.waitForFunction(a=>ProofAtlasSync.getSnapshot().compiled?.path===a.path&&ProofAtlasSync.getSnapshot().article===a.step,edge.anchor);assert.equal((await snapshot()).match,'indexed');}
  await p.locator('[data-argument-unsupported]').click();await p.waitForFunction(()=>ProofAtlasSync.getSnapshot().match==='unmapped');assert.equal((await snapshot()).compiled,null);
  const names=[...new Set(I.anchors.map(a=>a.declaration))];
  for(const name of names){
   for(const anchor of I.anchors.filter(a=>a.declaration===name)){
    // Select its article use before the path so shared helper occurrences resolve in context.
    await p.evaluate(a=>ProofAtlasSync.selectArticle(a.step,a.declaration),anchor);await settled();
    await p.evaluate(async a=>{const api=ProofAtlasLibrary,m=ProofAtlasSync.routeFromPath(api.getData(),a.path);await api.selectOccurrence(m.node,true,false,m.route);},anchor);
    await p.waitForFunction(a=>ProofAtlasSync.getSnapshot().compiled?.path===a.path&&ProofAtlasSync.getSnapshot().article===a.step,anchor);const s=await snapshot();assert.equal(s.match,'indexed');
   }
  }
  // Actual compiled-line and canvas clicks inside each new argument family.
  let lemmaClickJourneys=0;
  for(const id of ['step-identities-beta','step-identities-alpha-derivative','step-riccati-cancellation','step-riccati-amgm']){
   await p.evaluate(id=>ProofAtlasSync.selectArticle(id),id);await settled();
   const child=await p.evaluate(()=>{const d=ProofAtlasLibrary.getData(),s=ProofAtlasLibrary.getSnapshot();return d.children[s.selected][0];});
   await p.locator('#pl-rows button[data-occurrence="'+child+'"]').click();
   await p.waitForFunction(id=>ProofAtlasSync.getSnapshot().article===id&&ProofAtlasSync.getSnapshot().match==='step-context',id);
   const point=await p.evaluate(()=>{const d=ProofAtlasLibrary.getData(),s=ProofAtlasLibrary.getSnapshot();return d.children[s.selected].map(i=>ProofAtlasLibrary.getPoint(i)).find(Boolean);});assert(point,'Indexed lemma step needs a visible graph child');
   await p.locator('#pl-canvas').click({position:{x:point.x,y:point.y}});await p.waitForFunction(i=>ProofAtlasLibrary.getSnapshot().selected===i,point.id);assert.equal((await snapshot()).article,id);lemmaClickJourneys++;
  }
  // Clicking the Riccati-pair call from the mixed-derivative proof changes the
  // article highlight to the pair, rather than retaining the whole z argument.
  await p.evaluate(()=>ProofAtlasSync.selectArticle('step-riccati-cancellation'));await settled();
  const pair=I.anchors.find(a=>a.declaration==='JacobiData.hasDerivAt_z'&&a.callee==='JacobiData.a_deriv_form');
  await p.evaluate(async a=>{const api=ProofAtlasLibrary,m=ProofAtlasSync.routeFromPath(api.getData(),a.path);await api.selectOccurrence(m.node,true,false,m.route);},pair);await p.waitForFunction(()=>ProofAtlasSync.getSnapshot().article==='step-riccati-pair');
  await p.evaluate(()=>ProofAtlasSync.selectArticle('step-cells-gap'));await settled();const before=await snapshot();
  const child=await p.evaluate(()=>{const d=ProofAtlasLibrary.getData(),s=ProofAtlasLibrary.getSnapshot();return d.children[s.selected].find(i=>d.children[i].length>0)||d.children[s.selected][0];});
  await p.locator('#pl-rows button[data-occurrence="'+child+'"]').click();await p.waitForFunction(()=>ProofAtlasSync.getSnapshot().match==='step-context');assert.equal((await snapshot()).article,'step-cells-gap');assert((await p.locator('#pa-sync-status').textContent()).includes('Within indexed proof step'));
  // A real canvas child keeps the gap branch, rather than the enclosing theorem.
  const point=await p.evaluate(()=>{const d=ProofAtlasLibrary.getData(),s=ProofAtlasLibrary.getSnapshot();return d.children[s.selected].map(i=>ProofAtlasLibrary.getPoint(i)).find(Boolean);});assert(point,'Gap branch must contain a visible graph child');{await p.locator('#pl-canvas').click({position:{x:point.x,y:point.y}});await p.waitForFunction(i=>ProofAtlasLibrary.getSnapshot().selected===i,point.id);assert.equal((await snapshot()).article,'step-cells-gap');}
  await p.evaluate(()=>ProofAtlasSync.selectArticle('step-first-lift'));await settled();await p.evaluate(()=>ProofAtlasLibrary.selectOccurrence(ProofAtlasLibrary.getSnapshot().selected,true,false));
  // Explicit path selection (direct numeric jumps use a representative path).
  await p.evaluate(async()=>{const s=ProofAtlasLibrary.getSnapshot();await ProofAtlasLibrary.selectOccurrence(s.selected,true,false,s.route);});await p.waitForFunction(()=>!document.getElementById('pa-sync-step-choices').hidden);assert(await p.locator('#pa-sync-step-choices button').count()>=2);
  await p.getByRole('button',{name:'3.2 proof · transfer to the phase lift',exact:true}).click();await p.waitForFunction(()=>!document.getElementById('pa-riccati-geometry').hidden);assert.equal((await snapshot()).article,'step-riccati-lift');
  await p.getByRole('button',{name:'4.1 proof · oriented phase lifts on both brackets',exact:true}).click();assert.equal((await snapshot()).article,'step-cells-lift');assert(await p.locator('#pa-riccati-geometry').isHidden());
  await p.evaluate(()=>ProofAtlasSync.selectArticle('step-cells-exhaustion'));await settled();const saved=(await snapshot()).compiled.path,url=p.url();await p.goto(url);await p.waitForFunction(path=>ProofAtlasSync.getSnapshot().compiled?.path===path,saved);assert.equal((await snapshot()).article,'step-cells-exhaustion');
  await p.evaluate(()=>ProofAtlasSync.selectArticle('step-riccati-amgm'));await settled();await p.locator('#pa-riccati-geometry').scrollIntoViewIfNeeded();await p.screenshot({path:path.join(dir,'riccati-argument.png')});
  await p.locator('#step-cells-exhaustion').evaluate(n=>n.scrollIntoView({block:'center'}));await p.screenshot({path:path.join(dir,'cell-exhaustion.png')});
  await p.addScriptTag({path:require.resolve('axe-core/axe.min.js')});let audits=0;for(const width of [1800,390]){await p.setViewportSize({width,height:1050});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3));for(const theme of ['light','dark']){await p.evaluate(t=>document.documentElement.dataset.theme=t,theme);await p.waitForTimeout(250);const violations=await p.evaluate(async()=> (await axe.run(document.querySelector('#pa-sync-panel'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>v.id));assert.deepEqual(violations,[]);audits++;}}
  await p.goto(origin+'/projects/proof-atlas/library/?proof=JacobiFull.cell_roots');await p.waitForFunction(()=>ProofAtlasLibrary.getSnapshot()?.name==='JacobiFull.cell_roots');const gap=I.anchors.find(a=>a.declaration==='JacobiFull.cell_roots'&&a.callee==='JacobiFull.J2_neg_gap');await p.evaluate(async a=>{const api=ProofAtlasLibrary,m=ProofAtlasProofStepIndex.create(PROOF_ATLAS_PROOF_STEPS,PROOF_ATLAS_PROOF_STEPS.articleSha256).route(api.getData(),a.path,ProofAtlasLibraryData);await api.selectOccurrence(m.node,true,false,m.route);},gap);await p.locator('[data-proof-step-link="step-cells-gap"]').click();await p.waitForFunction(()=>ProofAtlasSync.getSnapshot().article==='step-cells-gap'&&ProofAtlasSync.getSnapshot().match==='indexed');
  const stale=await browser.newPage();await stale.route('**/article-proof-steps.js*',async route=>{const response=await route.fetch(),text=await response.text(),key='window.PROOF_ATLAS_PROOF_STEPS=',data=JSON.parse(text.split(key)[1].trim().replace(/;$/,''));data.anchors.find(a=>a.callee==='JacobiFull.J2_neg_gap').node++;await route.fulfill({response,body:key+JSON.stringify(data)+';'});});await stale.goto(origin+'/projects/proof-atlas/article/');await stale.waitForFunction(()=>window.ProofAtlasSync);await stale.evaluate(()=>ProofAtlasSync.selectArticle('step-cells-gap'));assert.equal(await stale.locator('#pa-sync-panel').getAttribute('data-match'),'unmapped');assert(await stale.locator('#pa-sync-proof').isHidden());assert((await stale.locator('#pa-sync-status').textContent()).includes('mismatch'));await stale.close();
  const unrelated=await browser.newPage();await unrelated.goto(origin+'/projects/proof-atlas/article/?view=proof&proof=CrossingData.crossing#step-cells-gap');await unrelated.waitForFunction(()=>document.getElementById('pa-sync-panel').dataset.match==='unmapped');assert(await unrelated.locator('#pa-sync-proof').isHidden());assert((await unrelated.locator('#pa-sync-status').textContent()).includes('no indexed counterpart'));await unrelated.close();
  assert.equal(errors.length,0,errors.join('; '));console.log(JSON.stringify({status:'PASS',articleSteps:I.passages.length,paths:I.anchors.length,preciseProofStepClicks:true,lemmaClickJourneys,riccatiArgumentNodes:9,riccatiCallEdges:6,descendantsKeepStep:true,sharedHelperChoices:true,savedPath:true,standaloneLibraryLink:true,explicitUnmapped:I.passages.filter(p=>p.status==='unmapped').length,formulas:916,argumentAndReaderAccessibilityAudits:audits}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1);});
