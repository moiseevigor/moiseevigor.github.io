/* Original source lines, centered default, aligned responsive comparison, and real graph navigation. */
'use strict';
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),vm=require('node:vm'),crypto=require('node:crypto');
const context={window:{}};vm.createContext(context);
for(const file of ['crossing-declarations.js','crossing-article-index.js','crossing-article-lines.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'../public/data/proof-atlas',file),'utf8'),context);
const data=context.window.PROOF_ATLAS_ARTICLE_LINES,index=context.window.PROOF_ATLAS_ARTICLE_INDEX,decl=context.window.PROOF_ATLAS_DECLARATIONS;
assert.equal(data.articleSha256,index.source.sha256);assert.equal(data.declarations.length,10);
const normalize=s=>s.trim().replace(/\s+/g,' ');
for(const d of data.declarations){
 const original=decl.nodes.find(n=>n.name===d.name);assert(original);
 assert.equal(d.lines[0].number,original.line);
 d.lines.forEach((line,i)=>assert.equal(line.number,original.line+i));
 assert.equal(normalize(d.lines.map(l=>l.text).join(' ')),normalize(original.kind+' '+original.statement));
 assert.equal(crypto.createHash('sha256').update(d.lines.map(l=>l.text).join('\n')).digest('hex'),d.sha256);
}
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.ATLAS_CHROMIUM_PATH?{executablePath:process.env.ATLAS_CHROMIUM_PATH}:{})});
 const base=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8833',dir=process.env.ATLAS_SCREENSHOTS||'/tmp/proof-atlas-columns';fs.mkdirSync(dir,{recursive:true});
 const page=await browser.newPage({viewport:{width:1680,height:1050}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));
 await page.addInitScript(()=>{localStorage.setItem('theme','light');localStorage.setItem('analytics-consent','no');});
 const geometry=()=>page.evaluate(()=>{
  const box=s=>{const b=document.querySelector(s).getBoundingClientRect();return{x:b.x,y:b.y,width:b.width,height:b.height,right:b.right};};
  return{width:innerWidth,paper:box('.pa-paper'),prose:box('.pa-aligned-row .pa-row-prose'),lean:box('.pa-aligned-row .pa-row-lean'),graph:box('.pa-aligned-row .pa-row-connections')};
 });
 const centered=async()=>assert(await page.locator('.pa-paper').evaluate(e=>Math.abs(e.getBoundingClientRect().left+e.getBoundingClientRect().width/2-innerWidth/2)<2),'Article is not centered');
 const noOverflow=async()=>assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3),'Document overflow');
 try{
  await page.goto(base+'/projects/proof-atlas/article/#passage-phase-equation');
  await page.waitForFunction(()=>document.body.dataset.paReadingMode==='article');await centered();
  assert.equal(await page.locator('[data-pa-reading="article"]').getAttribute('aria-pressed'),'true');
  assert.equal(await page.locator('.pa-lean-line').count(),0,'Comparison data should load only on demand');
  await page.getByRole('button',{name:'Article + Lean',exact:true}).click();
  await page.waitForFunction(()=>document.body.dataset.paReadingMode==='compare');
  await page.waitForFunction(()=>document.querySelectorAll('.pa-row-connections svg a').length===10);
  assert.equal(new URL(page.url()).searchParams.get('view'),'lean');
  assert.equal(await page.locator('.pa-lean-line').count(),19);assert.equal(await page.locator('.pa-lean-passage').count(),6);
  assert.equal(await page.locator('.pa-paper .katex').count(),916,'Mode switch altered formulas');
  for(const d of data.declarations){
   const actual=await page.locator('.pa-lean-statement').filter({has:page.getByRole('heading',{name:d.name,exact:true})}).locator('.pa-lean-line').evaluateAll(a=>a.map(n=>({number:Number(n.dataset.sourceLine),text:n.querySelector('code').textContent})));
   assert.deepEqual(actual,JSON.parse(JSON.stringify(d.lines)));
  }
  assert((await page.locator('[data-lean-passage="passage-analytic-scope"]').textContent()).includes('No corresponding Lean proof'));
  let g=await geometry();assert(g.prose.right<g.graph.x&&g.graph.right<g.lean.x,'Wide graph lane does not fit between article and Lean');
  await page.locator('[data-lean-name="CrossingData.branch"] .pa-lean-line').hover();
  assert(await page.locator('#passage-phase-equation').evaluate(n=>n.classList.contains('pa-linked-active')),'Source line hover does not identify corresponding prose');
  await page.locator('[data-lean-name="CrossingData.psiP"] .pa-lean-line').focus();
  assert(await page.locator('.pa-row-connections a[data-lean-name="CrossingData.psiP"]').evaluate(n=>n.classList.contains('pa-linked-active')),'Keyboard focus does not identify graph connection');
  await page.locator('.pa-row-connections a[data-lean-name="CrossingData.psiP"]').focus();
  assert(await page.evaluate(async()=>{await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));return document.activeElement?.dataset.leanName==='CrossingData.psiP';}),'Graph keyboard focus was lost during correspondence highlighting');
  await page.evaluate(()=>document.getElementById('passage-phase-equation').scrollIntoView({block:'center'}));
  await page.screenshot({path:path.join(dir,'columns-wide.png')});
  assert(await page.evaluate(()=>[...document.querySelectorAll('.pa-row-connections svg a')].every(a=>{
   const d=[...a.closest('.pa-aligned-row').querySelectorAll('.pa-lean-statement')].find(n=>n.dataset.leanName===a.dataset.leanName),r=a.querySelector('rect').getBoundingClientRect(),s=d.getBoundingClientRect();return Math.abs((r.top+r.bottom)/2-(s.top+s.bottom)/2)<3;
  })),'Graph nodes are not aligned with their statement lines');
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  for(const theme of ['light','dark']){
   await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
   const audit=await page.evaluate(()=>axe.run(document.querySelector('.d-article'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
   fs.writeFileSync(path.join(dir,'columns-axe-'+theme+'.json'),JSON.stringify(audit,null,2));assert.deepEqual(audit.violations.map(v=>v.id),[],'Comparison accessibility '+theme);
  }
  for(const width of [1280,1024,768,390]){
   await page.setViewportSize({width,height:950});await noOverflow();g=await geometry();
   assert.equal(g.graph.width,0,'Graph should hide when three columns do not fit');
   if(width>=1000)assert(g.prose.right<g.lean.x,'Two columns not ordered article then Lean');else assert(g.lean.y>g.prose.y+g.prose.height-2,'Narrow Lean excerpt should follow its article block');
  }
  await page.evaluate(()=>document.getElementById('passage-phase-equation').scrollIntoView({block:'start'}));await page.screenshot({path:path.join(dir,'columns-mobile.png')});
  await page.setViewportSize({width:1280,height:950});
  await page.evaluate(()=>document.getElementById('passage-arcs').closest('p').scrollIntoView({block:'center'}));
  const articleTop=await page.locator('#passage-arcs').evaluate(n=>n.closest('p').getBoundingClientRect().top);
  await page.getByRole('button',{name:'Article',exact:true}).click();
  await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
  assert(Math.abs(await page.locator('#passage-arcs').evaluate(n=>n.closest('p').getBoundingClientRect().top)-articleTop)<3,'Reading position changed when returning to centered prose');
  await centered();await noOverflow();
  assert.equal(new URL(page.url()).searchParams.get('view'),null);assert.equal(await page.locator('.pa-row-lean:visible').count(),0);
  await page.reload();await page.waitForFunction(()=>document.body.dataset.paReadingMode==='article');assert.equal(await page.locator('.pa-lean-line').count(),0,'Comparison leaked into default reading');
  await page.setViewportSize({width:1680,height:1050});await page.goto(base+'/projects/proof-atlas/article/?view=lean#passage-counting');
  await page.waitForFunction(()=>document.body.dataset.paReadingMode==='compare');
  await page.locator('[data-lean-name="CrossingData.crossing"] [data-source-line="233"]').click();
  await page.waitForURL('**/projects/proof-atlas/app/#decl-crossing');
  await page.waitForFunction(()=>ProofAtlasAPI.getSnapshot().mode==='map'&&ProofAtlasAPI.getSnapshot().namedSelected==='crossing');
  assert.equal(await page.locator('#pa-reader-content').getAttribute('data-article-passage'),'counting');
  assert.deepEqual(errors,[]);
  const rejected=await browser.newPage();
  await rejected.addInitScript(()=>Object.defineProperty(window,'PROOF_ATLAS_ARTICLE_LINES',{configurable:true,set(d){d.articleSha256='invalid';Object.defineProperty(window,'PROOF_ATLAS_ARTICLE_LINES',{value:d,writable:true,configurable:true});}}));
  await rejected.goto(base+'/projects/proof-atlas/article/?view=lean');
  await rejected.waitForFunction(()=>document.getElementById('pa-reading-status').textContent.includes('do not match'));
  assert.equal(await rejected.locator('.pa-lean-line').count(),0,'Stale correspondence data must not produce code links');
  await rejected.getByRole('button',{name:'Article',exact:true}).click();assert.equal(await rejected.evaluate(()=>document.body.dataset.paReadingMode),'article');await rejected.close();
  console.log(JSON.stringify({status:'PASS',centeredDefault:true,originalSourceLines:19,declarations:10,passages:6,twoColumns:true,wideMiddleGraph:true,keyboardCorrespondence:true,realGraphNavigation:true,responsive:true,axeViolations:0,staleData:'rejected'}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1);});
