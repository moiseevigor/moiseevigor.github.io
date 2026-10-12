/* Real production-page regression for exact application navigation.
 * This tests structural references, not Lean typing or inferred proof steps. */
'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.ATLAS_CHROMIUM_PATH?{executablePath:process.env.ATLAS_CHROMIUM_PATH}:{})});
 const origin=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8833';
 const dir=process.env.ATLAS_SCREENSHOTS||'/tmp/proof-atlas-browser';fs.mkdirSync(dir,{recursive:true});
 const results=[];
 try{
  for(const [width,height] of [[1440,900],[1024,768],[390,844]]){
   const page=await browser.newPage({viewport:{width,height}}),errors=[];
   page.on('pageerror',e=>errors.push(e.message));
   await page.addInitScript(()=>{localStorage.setItem('theme','light');localStorage.setItem('analytics-consent','no');});
   await page.goto(origin+'/projects/proof-atlas/app/#expr-7273');
   await page.waitForFunction(()=>window.ProofAtlasApplicationNavigation?.valid);
   const bridge=page.locator('[data-application-bridge]');
   const selected=async()=>page.evaluate(()=>window.ProofAtlasAPI.getSnapshot().selected);
   const button=text=>bridge.getByRole('button',{name:text,exact:true});
   assert.equal(await selected(),7273,'Shared expression link must be restored before annotation');
   assert.equal(await page.evaluate(()=>window.ProofAtlasApplicationNavigation.count),2892);
   await button('Enclosing application #7259').click();
   assert.equal(await selected(),7259);
   assert.equal(await bridge.getByRole('button',{name:/^Argument \d+ →/}).count(),14);
   await button('Exact reference #7273').click();assert.equal(await selected(),7273);
   await button('Open named declaration unique_branch').click();
   await button('Application #7259 · 14 arguments').click();assert.equal(await selected(),7259);
   const arg=bridge.getByRole('button',{name:/^Argument 14 →/});
   const target=Number((await arg.textContent()).match(/#(\d+)/)[1]);
   await arg.click();assert.equal(await selected(),target);
   await page.locator('[data-pa-reader-tab="article"]').click();
   assert.equal(await bridge.count(),0,'Article correspondence must not contain application annotations');
   await page.evaluate(()=>window.ProofAtlasAPI.selectDeclaration('exists_branch'));
   await page.locator('[data-pa-reader-tab="explain"]').click();
   await button('Application #808 · 2 arguments').click();assert.equal(await selected(),808);
   assert.equal(await bridge.getByRole('button',{name:/^Argument \d+ →/}).count(),2);
   await page.evaluate(()=>window.ProofAtlasAPI.selectDeclaration('branch'));
   await page.waitForFunction(()=>document.querySelector('[data-application-bridge]')?.textContent.includes('8 / 42'));
   for(let i=0;i<5;i++)await button('Show more exact uses').click();
   assert((await bridge.textContent()).includes('42 / 42 exact uses shown'));
   assert((await bridge.textContent()).includes('1 in type · 41 in proof body'));
   assert.equal(await bridge.getByRole('button',{name:/^(Application|Reference) #/}).count(),42);
   assert.equal(await button('Show more exact uses').isVisible(),false);
   await page.evaluate(()=>window.ProofAtlasAPI.selectDeclaration('unique_branch'));
   await button('Application #7259 · 14 arguments').click();
   await page.locator('[data-pa-reader-tab="lean"]').click();
   assert.equal(await bridge.count(),1,'Full-term tab must retain exactly one bridge');
   const noOverflow=await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2);
   assert(noOverflow,'Document overflow at '+width);
   assert.deepEqual(errors,[],'JavaScript errors at '+width);
   await page.screenshot({path:path.join(dir,'application-navigation-'+width+'.png')});
   results.push({width,height,status:'PASS',errors,deepLink:7273,application:7259,arguments:14,definitionUses:42});
   await page.close();
  }
  const page=await browser.newPage();
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
   Object.defineProperty(window,'PROOF_ATLAS_TERMS',{configurable:true,set(value){
    value.payloads[7273].name='Invalid.fixture';
    Object.defineProperty(window,'PROOF_ATLAS_TERMS',{configurable:true,writable:true,value});
   }});
  });
  await page.goto(origin+'/projects/proof-atlas/app/#expr-7273');
  await page.waitForFunction(()=>window.ProofAtlasApplicationNavigation?.valid===false);
  assert.equal(await page.locator('[data-application-bridge] button').count(),0);
  assert((await page.locator('[data-application-bridge]').textContent()).includes('unavailable'));
  assert.deepEqual(errors,[]);
  results.push({negativeControl:'renamed Expr.const',status:'REJECTED',errors});
  fs.writeFileSync(path.join(dir,'application-navigation.json'),JSON.stringify(results,null,2));
  console.log(JSON.stringify(results,null,2));
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
