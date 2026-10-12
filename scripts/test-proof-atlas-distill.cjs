/* Real canvas clicks, selected passage changes, exact web targets and full article rendering. */
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const check=(ok,msg)=>{if(!ok)throw Error(msg);};
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.ATLAS_CHROMIUM_PATH?{executablePath:process.env.ATLAS_CHROMIUM_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1680,height:1050}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8833',dir=process.env.ATLAS_SCREENSHOTS||'/tmp/proof-atlas-distill';fs.mkdirSync(dir,{recursive:true});
 await page.addInitScript(()=>{localStorage.setItem('theme','light');localStorage.setItem('analytics-consent','no');});
 try{
  await page.goto(base+'/projects/proof-atlas/app/#expr-203');
  check(await page.locator('.pa-reader-tabs button').first().getAttribute('data-pa-reader-tab')==='article','Article is not the first tab');
  check(await page.locator('[data-pa-reader-tab="article"]').getAttribute('aria-selected')==='true','Article is not the default tab');
  check(await page.locator('#pa-reader-content').getAttribute('data-article-passage')==='counting','Initial theorem passage failed');
  const click=async i=>{
   await page.mouse.move(20,20);
   const point=await page.evaluate(i=>ProofAtlasAPI.getScreenPosition('expr',i),i);check(point,'Graph occurrence is not drawn '+i);
   await page.mouse.click(point.x,point.y);
   await page.waitForFunction(i=>ProofAtlasAPI.getSnapshot().selected===i,i);
  };
  await click(5830);
  check(await page.locator('#pa-reader-content').getAttribute('data-article-passage')==='phase-equation','Screenshot node 5830 still falls back to whole theorem');
  check((await page.locator('#pa-reader-content').textContent()).includes('Node #5830'),'Reader selection context is stale');
  await page.screenshot({path:path.join(dir,'graph-5830-article.png')});
  await click(7259);
  check(await page.locator('#pa-reader-content').getAttribute('data-article-passage')==='arcs','Canvas click did not change article passage to uniqueness argument');
  await click(7275);
  check((await page.locator('#pa-reader-content').textContent()).includes('Context from enclosing occurrence'),'Closest declaration context missing');
  await click(1852);
  const href=await page.getByRole('link',{name:'Read this section in the article ↗',exact:true}).getAttribute('href');
  check(href==='/projects/proof-atlas/article/#passage-phase-equation','Graph link does not target exact web passage');
  await page.getByRole('link',{name:'Read this section in the article ↗',exact:true}).click();
  await page.waitForURL('**/projects/proof-atlas/article/#passage-phase-equation');
  await page.waitForFunction(()=>document.querySelectorAll('.pa-paper .katex').length>=916);
  await page.waitForFunction(()=>document.querySelector('.pa-paper-highlight'));
  check(await page.locator('.katex-error').count()===0,'Article contains unrendered formulas');
  check(await page.locator('.d-article').count()===1,'Distill layout not used');
  check(await page.locator('.pa-paper img').count()===4,'Original figures missing');
  check(await page.locator('.pa-paper table').count()===3,'Original formalization tables missing');
  check((await page.locator('.pa-paper').textContent()).includes('Lemma 3.3'),'Original theorem numbering lost');
  check(await page.locator('#refs .csl-entry').count()===12,'References missing');
  check(await page.locator('.pa-paper img').evaluateAll(a=>a.every(i=>i.complete&&i.naturalWidth>0)),'Figure load failed');
  for(const id of ['passage-phase-equation','passage-counting','passage-bracket','passage-monotonicity','passage-arcs','passage-analytic-scope']){
   await page.goto(base+'/projects/proof-atlas/article/#'+id);
   await page.waitForFunction(id=>{const target=document.getElementById(id),mark=document.querySelector('.pa-paper-highlight');return target&&mark&&mark===target;},id);
  }
  await page.goto(base+'/projects/proof-atlas/article/#passage-counting');
  await page.waitForFunction(()=>document.querySelector('.pa-paper-highlight'));
  await page.screenshot({path:path.join(dir,'distill-crossing-desktop.png')});
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  for(const theme of ['light','dark']){
   await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
   const audit=await page.evaluate(()=>axe.run(document.querySelector('.pa-paper'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
   fs.writeFileSync(path.join(dir,'distill-axe-'+theme+'.json'),JSON.stringify(audit,null,2));
   check(!audit.violations.length,'Distill accessibility '+theme+': '+audit.violations.map(v=>v.id).join(', '));
  }
  for(const width of [390,768,1280]){
   await page.setViewportSize({width,height:900});
   check(await page.evaluate(()=>document.documentElement.scrollWidth<=document.documentElement.clientWidth+3),'Manuscript overflow '+width);
  }
  await page.setViewportSize({width:390,height:900});await page.goto(base+'/projects/proof-atlas/article/#passage-phase-equation');
  await page.waitForFunction(()=>document.querySelector('.pa-paper-highlight'));await page.screenshot({path:path.join(dir,'distill-crossing-mobile.png')});
  check(!errors.length,'Browser errors '+errors.join('; '));
  console.log(JSON.stringify({status:'PASS',realCanvasClicks:true,screenshotNode5830:true,articleFirstDefault:true,exactTargets:6,renderedFormulas:916,figures:4,tables:3,references:12,responsive:true,accessibility:true}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1);});
