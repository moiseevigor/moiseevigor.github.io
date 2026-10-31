'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),assert=require('assert/strict'),crypto=require('crypto'),{chromium}=require('playwright');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/expr-reference-laws/',origin=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8877',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.ATLAS_CHROMIUM_PATH}),context=await browser.newContext({viewport:{width:1500,height:1100}}),p=await context.newPage(),errors=[],report={format:'ProofAtlasExprReferenceProduction/1',status:'RUNNING',sourceOverride:false,audits:[],files:{},links:[]};
 p.on('pageerror',e=>errors.push(e.message));await p.addInitScript(()=>{localStorage.setItem('analytics-consent','no');localStorage.setItem('theme','light');});
 try{
  const url=origin+'/projects/proof-atlas/manual/binder-blocks/#expr-reference-laws';await p.goto(url);await p.waitForFunction(()=>document.querySelectorAll('#expr-reference-laws .katex').length>=4);
  assert.equal(await p.locator('#expr-reference-laws .katex-error').count(),0);assert((await p.locator('#expr-reference-laws').innerText()).includes('sixteen kernel-checked structural laws'));
  for(const file of['Reference.lean','README.md','native-check.json.gz','model-check.json.gz','view.css']){const response=await p.request.get(origin+'/'+base+file);assert.equal(response.status(),200);const bytes=await response.body();assert(bytes.equals(fs.readFileSync(base+file)),file);report.files[base+file]=sha(bytes);}
  for(const a of await p.locator('#expr-reference-laws a').all()){const href=await a.getAttribute('href'),response=await p.request.get(new URL(href,origin).href);assert.equal(response.status(),200);report.links.push(href);}
  await p.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  for(const width of[1500,390])for(const theme of['light','dark']){
   await p.setViewportSize({width,height:1100});await p.evaluate(async theme=>{document.documentElement.dataset.theme=theme;await Promise.all(document.getAnimations().filter(a=>a.effect.getTiming().iterations!==Infinity).map(a=>a.finished.catch(()=>{})));},theme);
   const violations=await p.evaluate(async()=>(await axe.run(document.querySelector('#expr-reference-laws'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));assert.deepEqual(violations,[]);
   assert(await p.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3));
   const metrics=await p.evaluate(()=>{const n=document.querySelector('#expr-reference-laws .pm-equation'),r=n.getBoundingClientRect();return{left:r.left,right:r.right,client:n.clientWidth,content:n.scrollWidth};});assert(metrics.left>=0&&metrics.right<=width+1);
   if(metrics.content>metrics.client){const scroll=await p.evaluate(()=>{const n=document.querySelector('#expr-reference-laws .pm-equation');n.scrollLeft=n.scrollWidth;return n.scrollLeft;});assert(scroll>0);await p.evaluate(()=>document.querySelector('#expr-reference-laws .pm-equation').scrollLeft=0);await p.locator('#expr-reference-laws .pm-equation').focus();await p.keyboard.press('ArrowRight');await p.waitForFunction(()=>document.querySelector('#expr-reference-laws .pm-equation').scrollLeft>0);}
   const file='scope-laws-'+width+'-'+theme+'.png';await p.locator('#expr-reference-laws').screenshot({path:base+file});report.audits.push({width,theme,violations:0,metrics,file,sha256:sha(fs.readFileSync(base+file))});
  }
  await p.goto(origin+'/projects/proof-atlas/program/');const link=p.locator('a[href="/projects/proof-atlas/manual/binder-blocks/#expr-reference-laws"]');assert.equal(await link.count(),1);await link.click();await p.waitForURL('**/manual/binder-blocks/#expr-reference-laws');assert.equal(await p.locator('#expr-reference-laws').count(),1);report.programLink=true;
  const bytes=await(await p.request.get(url.split('#')[0])).body();assert(bytes.equals(fs.readFileSync('_site_production/projects/proof-atlas/manual/binder-blocks/index.html')));report.productionHtmlSha256=sha(bytes);
  for(const file of['docs/proof-atlas-research-program.md','research/proof-atlas/binder-block-exchange/index.html'])report.files[file]=sha(fs.readFileSync(file));
  report.checkerSha256=sha(fs.readFileSync(__filename));assert.deepEqual(errors,[]);report.status='PASS';fs.writeFileSync(base+'production-check.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n')));console.log(JSON.stringify(report));
 }catch(e){fs.writeFileSync(base+'production-failure.json',JSON.stringify({error:e.stack,report,errors},null,2));await p.screenshot({path:base+'production-failure.png'}).catch(()=>{});throw e;}finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
