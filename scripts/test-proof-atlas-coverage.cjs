/* Whole-manuscript coverage, conditional statements, Greek source anchors and non-formalized controls. */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.ATLAS_CHROMIUM_PATH?{executablePath:process.env.ATLAS_CHROMIUM_PATH}:{})});
 const base=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8833',dir=process.env.ATLAS_SCREENSHOTS||'/tmp/proof-atlas-coverage';fs.mkdirSync(dir,{recursive:true});
 const p=await browser.newPage({viewport:{width:1680,height:1050}}),errors=[];p.on('pageerror',e=>errors.push(e.message));
 await p.addInitScript(()=>{localStorage.setItem('theme','light');localStorage.setItem('analytics-consent','no');});
 try{
  await p.goto(base+'/projects/proof-atlas/article/?view=lean#thm:first');
  await p.waitForFunction(()=>document.body.dataset.paReadingMode==='compare');
  for(const file of ['article-coverage-audit.json','article-coverage-map.json','article-coverage-lean-check.log']){
   const response=await p.request.get(base+'/research/proof-atlas/'+file);assert.equal(response.status(),200,'Published coverage evidence missing: '+file);
   const body=await response.text();assert(body.includes(file.endsWith('.log')?'JacobiFull.exact_first_time':'researchRevision'),'Coverage evidence returned incorrect content: '+file);
  }
  assert.equal(await p.locator('[data-coverage-statement]').count(),9);
  assert.equal(await p.locator('[data-coverage-status="partial"]').count(),5);assert.equal(await p.locator('[data-coverage-status="not-formalized"]').count(),4);
  const first=p.locator('[data-coverage-statement="first"]'),cells=p.locator('[data-coverage-statement="cells"]');
  assert((await first.textContent()).includes('Continuity and phase extrema'));assert((await first.textContent()).includes('finite tangencies'));
  const header=first.locator('[data-lean-name="JacobiFull.exact_first_time"]');assert((await header.textContent()).includes('hfin'));assert((await header.textContent()).includes('Finite'));
  await header.locator('.pa-lean-line').first().click();
  assert(new URL(p.url()).hash.includes('lean-first-JacobiFull.exact_first_time'),'New declarations must target their real statement source, not a nonexistent crossing graph node');
  assert(await p.locator('#thm\\:first').evaluate(n=>n.classList.contains('pa-linked-active')));
  await p.screenshot({path:path.join(dir,'theorem-3-4-coverage.png')});
  await p.getByRole('link',{name:'Theorem 4.1 · Conjugate times in every cell',exact:true}).click();
  await p.waitForFunction(()=>document.getElementById('thm:cells').classList.contains('pa-paper-highlight'));
  assert((await cells.textContent()).includes('hL'));assert((await cells.textContent()).includes('hR'));
  assert((await cells.textContent()).includes('quartic'));assert((await cells.textContent()).includes('n = m + 1'));
  await cells.locator('[data-lean-name="JacobiFull.two_per_cell_of_ne"] .pa-lean-line').first().focus();
  assert(await p.locator('#thm\\:cells').evaluate(n=>n.classList.contains('pa-linked-active')));
  const third=cells.locator('.pa-more-statement').filter({has:p.locator('.pa-lean-statement[data-lean-name="JacobiFull.eL_eq_eR_iff"]')});
  await third.locator('summary').click();assert(await third.locator('.pa-lean-line').first().isVisible());
  await p.screenshot({path:path.join(dir,'theorem-4-1-coverage.png')});
  const greek=p.locator('.pa-more-statement').filter({has:p.locator('.pa-lean-statement[data-lean-name="JacobiData.hasDerivAt_β1_div_c"]')});await greek.locator('summary').click();await greek.locator('.pa-lean-line').first().click();
  assert(await p.evaluate(()=>document.activeElement.id==='lean-identities-JacobiData.hasDerivAt_β1_div_c'),'Greek declaration fragment was not restored');
  for(const id of ['coincident','floquet','late-folds','separatrix']){
   const panel=p.locator('[data-coverage-statement="'+id+'"]');assert.equal(await panel.locator('.pa-lean-statement').count(),0);
   assert((await panel.textContent()).includes('Not formalized'));
  }
  const names=await p.evaluate(()=>PROOF_ATLAS_ARTICLE_COVERAGE.statements.map(s=>s.htmlAnchor));
  for(const id of names){
   await p.goto(base+'/projects/proof-atlas/article/?view=lean#'+id);await p.waitForFunction(()=>document.body.dataset.paReadingMode==='compare');
   assert(await p.evaluate(id=>!!document.getElementById(id),id));
  }
  assert.equal(await p.locator('.pa-paper .katex').count(),916);assert.equal(await p.locator('.katex-error').count(),0);
  for(const width of [1280,768,390]){await p.setViewportSize({width,height:900});assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3),'Coverage layout overflow '+width);}
  await p.getByRole('button',{name:'Article',exact:true}).click();assert.equal(await p.locator('.pa-row-lean:visible').count(),0);
  assert.deepEqual(errors,[]);
  const negative=await browser.newPage();await negative.addInitScript(()=>Object.defineProperty(window,'PROOF_ATLAS_ARTICLE_COVERAGE',{configurable:true,set(d){d.articleSha256='invalid';Object.defineProperty(window,'PROOF_ATLAS_ARTICLE_COVERAGE',{configurable:true,writable:true,value:d});}}));
  await negative.goto(base+'/projects/proof-atlas/article/?view=lean');await negative.waitForFunction(()=>document.getElementById('pa-reading-status').textContent.includes('do not match'));assert.equal(await negative.locator('.pa-lean-line').count(),0);await negative.close();
  console.log(JSON.stringify({status:'PASS',numberedStatements:9,theorem34:true,theorem41:true,conditionalHypothesesVisible:true,unformalizedStatements:4,greekAnchors:true,staleCoverage:'rejected',formulas:916,responsive:true}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1);});
