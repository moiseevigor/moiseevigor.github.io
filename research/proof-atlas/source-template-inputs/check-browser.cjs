'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict'),cp=require('child_process'),{chromium}=require('playwright');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/source-template-inputs/',origin=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8877',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),figure=JSON.parse(z.gunzipSync(fs.readFileSync(base+'figure.json.gz')));
cp.execFileSync(process.execPath,[base+'figure.cjs','--check'],{stdio:'pipe'});
async function main(){
 const browser=await chromium.launch({headless:true,executablePath:process.env.ATLAS_CHROMIUM_PATH}),page=await browser.newPage({viewport:{width:1500,height:1000}}),errors=[],report={format:'ProofAtlasSourceTemplateBrowser/1',status:'RUNNING',sourceLinks:0,audits:[],files:{}};
 page.on('pageerror',e=>errors.push(e.stack||e.message));await page.addInitScript(()=>{localStorage.setItem('analytics-consent','no');localStorage.setItem('theme','light');});
 try{
  for(const[i,link]of figure.links.entries()){
   await page.goto(origin+'/'+base+'source-lambdas.svg');await page.locator('a').nth(i).focus();await page.keyboard.press('Enter');
   await page.waitForFunction(expected=>{const s=window.ProofAtlasNetworkStreamView?.getSelection();return s?.namespace==='source-expression'&&s.indexSha256===expected.indexSha256&&s.node===expected.node&&JSON.stringify(s.route)===JSON.stringify(expected.route);},{indexSha256:link.sourceOwner.indexSha256,...link.source});
   const selected=await page.evaluate(()=>ProofAtlasNetworkStreamView.getSelection());assert.equal(selected.name,link.sourceOwner.name);assert.equal(selected.sourceSha256,link.sourceOwner.sourceSha256);report.sourceLinks++;
  }
  await page.goto(origin+'/projects/proof-atlas/manual/paged-network/#source-lambdas');await page.waitForFunction(()=>window.ProofAtlasNetworkStreamView&&document.querySelector('#source-lambdas .katex'));await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  const section=page.locator('#source-lambdas');assert((await section.innerText()).includes('All thirty fixed region/policy candidates'));assert((await section.innerText()).includes('not yet in the interactive function selector'));
  for(const width of[1500,390])for(const theme of['light','dark']){
   await page.setViewportSize({width,height:1000});await page.evaluate(theme=>document.documentElement.dataset.theme=theme,theme);await section.scrollIntoViewIfNeeded();
   const violations=await section.evaluate(async element=>(await axe.run(element,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));assert.deepEqual(violations,[]);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3));const scroll=section.locator('.pm-table-scroll');await scroll.focus();assert(await scroll.evaluate(e=>e===document.activeElement));
   if(width===390)assert(await scroll.evaluate(e=>e.scrollWidth>e.clientWidth));
   const file='manual-'+width+'-'+theme+'.png';await section.screenshot({path:base+file});report.audits.push({width,theme,file,sha256:sha(fs.readFileSync(base+file)),violations:0,horizontalFigureScroll:width===390});
  }
  await page.setViewportSize({width:1140,height:880});await page.emulateMedia({colorScheme:'light'});await page.goto(origin+'/'+base+'source-lambdas.svg');
  const labels=await page.locator('text').allTextContents();assert(labels.includes('a : ℝ · source |T₁(J,p)|'));assert(labels.includes('b : ℝ · source |T₂(J,p)|'));assert(!labels.some(label=>label.includes('= original')));
  const cardText=await page.locator('a').evaluateAll(anchors=>anchors.flatMap(a=>{const box=a.querySelector('rect').getBBox();return [...a.querySelectorAll('text')].map(t=>{const b=t.getBBox();return {text:t.textContent,inside:b.x>=box.x&&b.x+b.width<=box.x+box.width&&b.y>=box.y&&b.y+b.height<=box.y+box.height};});}));assert(cardText.every(row=>row.inside),'Card text leaves its original box');
  const textBounds=await page.locator('text').evaluateAll(nodes=>nodes.map(n=>{const b=n.getBBox();return{x:b.x,y:b.y,width:b.width,height:b.height,text:n.textContent};}));assert(textBounds.every(b=>b.x>=0&&b.y>=0&&b.x+b.width<=1140&&b.y+b.height<=880),'Figure text clipped');
  for(const theme of['light','dark']){await page.emulateMedia({colorScheme:theme});const file='lambdas-'+theme+'.png';await page.screenshot({path:base+file});report.audits.push({theme,file,sha256:sha(fs.readFileSync(base+file)),svgTextInsideViewBox:true});}
  for(const file of[base+'source-lambdas.svg',base+'native.json.gz',base+'figure.json.gz']){
   const response=await page.request.get(origin+'/'+file);assert.equal(response.status(),200);const bytes=await response.body();assert(bytes.equals(fs.readFileSync(file)));assert(bytes.equals(fs.readFileSync('_site_production/'+file)));report.files[file]=sha(bytes);
  }
  const html=await page.request.get(origin+'/projects/proof-atlas/manual/paged-network/');assert.equal(html.status(),200);const bytes=await html.body();assert(bytes.equals(fs.readFileSync('_site_production/projects/proof-atlas/manual/paged-network/index.html')));report.htmlSha256=sha(bytes);
  assert.deepEqual(errors,[]);assert.equal(report.sourceLinks,10);report.status='PASS';report.checkerSha256=sha(fs.readFileSync(__filename));report.scope='Actual built diagram and manual, ten keyboard source links, qualified original occurrence selection, native/evidence asset identity, four theme/viewport audits and unclipped SVG text. Computed fields are recorded in the source-template native namespace, not offered as a new interactive reader policy. No comprehension measurement.';
  fs.writeFileSync(base+'browser-check.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n'),{mtime:0}));console.log(JSON.stringify({...report,files:undefined,audits:report.audits.length}));
 }catch(e){fs.writeFileSync(base+'failure.json',JSON.stringify({error:e.stack,errors,report,url:page.url()},null,2));await page.screenshot({path:base+'failure.png'}).catch(()=>{});throw e;}
 finally{await browser.close();}
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
