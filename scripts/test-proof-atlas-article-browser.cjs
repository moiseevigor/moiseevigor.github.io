const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const check=(ok,msg)=>{if(!ok)throw Error(msg);};
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.ATLAS_CHROMIUM_PATH?{executablePath:process.env.ATLAS_CHROMIUM_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1680,height:1050}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8833',dir=process.env.ATLAS_SCREENSHOTS||'/tmp/proof-atlas-article';fs.mkdirSync(dir,{recursive:true});
 try{
  await page.addInitScript(()=>{localStorage.setItem('theme','light');localStorage.setItem('analytics-consent','no');});
  await page.goto(base+'/projects/proof-atlas/app/?reader=article#expr-1852');
  await page.locator('[data-pa-reader-tab="article"]').click();
  check(await page.locator('#pa-reader-content').getAttribute('data-article-passage')==='phase-equation','Selected equality did not map to its article passage');
  check((await page.locator('.pr-article-quote').textContent()).includes('write'),'Article source missing');
  await page.waitForFunction(()=>document.querySelector('.pr-article-quote .katex'));
  check(await page.locator('.katex-error').count()===0,'Article math failed to typeset');
  await page.screenshot({path:path.join(dir,'article-selected-1852.png')});
  await page.getByRole('button',{name:'Read subtree #1852',exact:true}).click();
  check(await page.evaluate(()=>ProofAtlasAPI.getSnapshot().selected)===1852,'Article-to-graph selection failed');
  await page.locator('#pa-search').fill('1856');await page.locator('#pa-find').click();
  check((await page.locator('#pa-reader-content').textContent()).includes('No separate article sentence'),'Context incorrectly presented as a direct sentence map');
  await page.locator('summary').filter({hasText:'Browse indexed article passages'}).click();
  await page.getByRole('button',{name:'The two arcs cover one period',exact:true}).click();
  await page.getByRole('button',{name:'Open exists_branch',exact:true}).click();
  check(await page.evaluate(()=>ProofAtlasAPI.getSnapshot().namedSelected)==='exists_branch','Reverse declaration link failed');
  check(await page.locator('#pa-reader-content').getAttribute('data-article-passage')==='arcs','Declaration-to-passage link failed');
  await page.goto(base+'/projects/proof-atlas/app/#article-analytic-scope');
  check((await page.locator('#pa-reader-content').textContent()).includes('No mapped Lean proof'),'Unsupported analytic claims presented as formalized');
  check(await page.getByRole('button',{name:/Read subtree/}).count()===0,'Analytic boundary incorrectly linked to a proof');
  await page.goto(base+'/projects/proof-atlas/app/#article-counting');
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  for(const theme of ['light','dark']){
   await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
   const audit=await page.evaluate(()=>axe.run(document.querySelector('#pa-reader'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
   fs.writeFileSync(path.join(dir,'article-axe-'+theme+'.json'),JSON.stringify(audit,null,2));
   check(!audit.violations.length,'Article accessibility '+theme+': '+audit.violations.map(v=>v.id).join(', '));
  }
  for(const width of [390,768,1280]){
   await page.setViewportSize({width,height:850});
   check(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+3),'Article mobile page overflow '+width);
   check(await page.locator('#pa-reader-content').evaluate(n=>n.scrollWidth<=n.clientWidth+3),'Article math overflow '+width);
  }
  await page.screenshot({path:path.join(dir,'article-counting-responsive.png')});
  check(!errors.length,'Browser errors '+errors.join('; '));
  console.log(JSON.stringify({status:'PASS',bidirectional:true,inheritedContext:true,scopeBoundary:true,typesetMath:true,accessibility:true,responsive:true}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1);});
