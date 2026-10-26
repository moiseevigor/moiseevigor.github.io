'use strict';
const fs=require('fs'),vm=require('vm'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict'),{chromium}=require('playwright'),audit=require('./proof-atlas-local-cut-context-audit.cjs');
const origin=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8833',dir=process.env.ATLAS_SCREENSHOTS||'/tmp/atlas-local-cut-context-browser',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),w={};
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/local-cut-context-manifest.js','utf8'),{window:w});const descriptor=w.PROOF_ATLAS_LOCAL_CUT_CONTEXT,data=JSON.parse(z.gunzipSync(fs.readFileSync('.'+descriptor.file)));
(async()=>{
 fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.ATLAS_CHROMIUM_PATH}),page=await browser.newPage({viewport:{width:1440,height:1000}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{localStorage.setItem('analytics-consent','no');localStorage.setItem('theme','light');});
 try{
  const files=new Set(['public/data/proof-atlas/local-cut-context-manifest.js',descriptor.file.slice(1),...Object.keys(data.producer.sourceFiles),'research/proof-atlas/local-cut-context/README.md','research/proof-atlas/cut-refinement/README.md','scripts/proof-atlas-local-cut-context-audit.cjs','scripts/test-proof-atlas-local-cut-context.cjs','scripts/build-proof-atlas-local-cut-context.cjs','scripts/test-proof-atlas-local-cut-context-browser.cjs']);
  for(const file of files){const response=await page.request.get(origin+'/'+file);assert.equal(response.status(),200,file);assert.equal(sha(await response.body()),sha(fs.readFileSync(file)),file);}
  const response=await page.request.get(origin+descriptor.file),raw=z.gunzipSync(await response.body());assert.equal(sha(raw),descriptor.sha256);const checked=audit(JSON.parse(raw));
  let accessibilityAudits=0,keyboardFocusChecks=0,keyboardScrollChecks=0;
  for(const width of [1440,390])for(const theme of ['light','dark']){
   await page.setViewportSize({width,height:1000});await page.goto(origin+'/projects/proof-atlas/program/#locality-and-nested-composition');await page.waitForURL('**/evidence/#locality-and-nested-composition');await page.locator('#locality-and-nested-composition').waitFor();assert.equal(await page.locator('#locality-and-nested-composition').count(),1);
   assert.equal(await page.locator('a[href="/research/proof-atlas/local-cut-context/README.md"]').count(),1);await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
   // The shared navigation has a 120 ms color transition on theme changes.
   await page.waitForTimeout(250);
   await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});const violations=await page.evaluate(async()=>(await axe.run({include:[['.d-article'],['.site-nav']]},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));assert.deepEqual(violations,[]);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3));
   const regions=page.locator('.d-article pre[tabindex="0"], .d-article table[tabindex="0"]');assert.equal(await regions.count(),5);
   // Preserved scrollable rules now live in separate evidence entries. Open
   // each enclosing entry before checking its keyboard scrolling behavior.
   await regions.evaluateAll(nodes=>{for(const node of nodes)for(let parent=node.parentElement;parent;parent=parent.parentElement)if(parent.tagName==='DETAILS')parent.open=true;});
   for(let i=0;i<await regions.count();i++){const region=regions.nth(i);await region.focus();assert(await region.evaluate(e=>document.activeElement===e));keyboardFocusChecks++;if(await region.evaluate(e=>e.scrollWidth>e.clientWidth+2)){await region.evaluate(e=>e.scrollLeft=0);await region.press('ArrowRight');await page.waitForFunction(e=>e.scrollLeft>0,await region.elementHandle());keyboardScrollChecks++;}}
   await page.locator('#locality-and-nested-composition').scrollIntoViewIfNeeded();await page.screenshot({path:dir+'/locality-'+width+'-'+theme+'.png'});accessibilityAudits++;
  }
  assert.deepEqual(errors,[]);const report={status:'PASS',legacyProgramAnchorForwarded:true,methodAndCompiledFiles:files.size,allServedBytesMatch:true,compiledFixtureAudit:checked,accessibilityAudits,keyboardFocusChecks,keyboardScrollChecks};fs.writeFileSync(dir+'/local-cut-context-browser.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1)});
