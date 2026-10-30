'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),assert=require('assert/strict'),{chromium}=require('playwright');
process.chdir(path.resolve(__dirname,'../../..'));
const {sha}=require('../method-context/catalogue.cjs'),base='research/proof-atlas/method-conversion-view/';
const origin=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8877';let browser;
(async()=>{
 browser=await chromium.launch({headless:true,...(process.env.ATLAS_CHROMIUM_PATH?{executablePath:process.env.ATLAS_CHROMIUM_PATH}:{})});
 const p=await browser.newPage({viewport:{width:1500,height:1100}});
 await p.addInitScript(()=>{localStorage.setItem('analytics-consent','no');localStorage.setItem('theme','light');});
 await p.goto(origin+'/projects/proof-atlas/manual/#method-interface-lab');await p.locator('#method-interface-lab').evaluate(n=>n.open=true);
 await p.locator('#pm-method-example').selectOption('AtlasMethodControls.dependent');await p.locator('#pm-method-load').click();
 await p.waitForFunction(()=>window.ProofAtlasMethodExamples?.getScene()?.source.name==='AtlasMethodControls.dependent');
 await p.locator('#pm-method-minor').selectOption('1');const root=p.locator('#pm-method-example-view');
 for(const action of ['method-wires','branch-conclusion','verify-instantiation','computed-context'])await root.locator('[data-'+action+']').click();
 const panel=root.locator('.pl-method-context');await panel.locator('[data-context-kernel-load]').click();await panel.locator('[data-context-kernel-state="checked"]').waitFor();
 const receipt=JSON.parse(await panel.locator('[data-context-kernel-receipt] pre').textContent());
 assert.equal(receipt.status,'recorded-kernel-conversion');assert.equal(receipt.betaAlpha.status,'unavailable');
 // Isolate the two existing DOM sections for a component figure. This changes
 // no application text, expression fields, controls, state or component CSS.
 await panel.evaluate(n=>{const pair=n.querySelector('.pl-context-pair'),kernel=n.querySelector('.pl-context-kernel'),crop=document.createElement('div');crop.dataset.kernelFigure='';pair.before(crop);crop.append(pair,kernel);});
 await p.addScriptTag({path:require.resolve('axe-core/axe.min.js')});const rows=[];
 for(const [width,theme,name] of [[1500,'light','desktop'],[390,'dark','phone-dark']]){
  await p.setViewportSize({width,height:1100});await p.evaluate(t=>document.documentElement.dataset.theme=t,theme);
  const violations=await p.evaluate(async()=> (await axe.run(document.querySelector('[data-kernel-figure]'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(x=>x.id));assert.deepEqual(violations,[]);
  const file=base+'kernel-link-'+name+'.png';
  await panel.locator('[data-kernel-figure]').screenshot({path:file,style:'.site-nav {visibility:hidden}'});
  rows.push({width,theme,file,sha256:sha(fs.readFileSync(file)),receiptSha256:sha(Buffer.from(JSON.stringify(receipt))),accessibilityViolations:0});
 }
 const report={status:'PASS',rows,source:receipt.source,context:receipt.context,native:receipt.native,
  checkerSha256:sha(fs.readFileSync(base+'capture.cjs')),
  scope:'Component figures of the actual selected type pair and native relation. Only the site navigation is hidden during capture; original DOM sections are grouped for the crop. Two additional accessibility checks. No comprehension result.'};
 fs.writeFileSync(base+'figure-check.json.gz',z.gzipSync(JSON.stringify(report,null,2)+'\n'));console.log(JSON.stringify(report));await browser.close();
})().catch(async e=>{console.error(e.stack);await browser?.close();process.exitCode=1;});
