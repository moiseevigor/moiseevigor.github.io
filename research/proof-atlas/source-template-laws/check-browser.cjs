'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict'),{chromium}=require('playwright');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/source-template-laws/',origin=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8877',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const report={format:'ProofAtlasSourceRecoveryBrowser/1',status:'RUNNING',files:{},audits:[]};
const paths=['/projects/proof-atlas/manual/paged-network/','/projects/proof-atlas/program/','/projects/proof-atlas/evidence/'];
async function main(){
 const browser=await chromium.launch({headless:true,executablePath:process.env.ATLAS_CHROMIUM_PATH});
 try{
  const page=await browser.newPage({viewport:{width:1500,height:1100}}),errors=[];
  page.on('pageerror',e=>errors.push(e.stack));
  await page.addInitScript(()=>{localStorage.setItem('analytics-consent','no');localStorage.setItem('theme','light');});
  for(const url of paths){const response=await page.request.get(origin+url);assert.equal(response.status(),200);const file='_site_production'+url+'index.html',bytes=await response.body();assert(bytes.equals(fs.readFileSync(file)),file);report.files[file]=sha(bytes);}
  await page.goto(origin+paths[0]+'#source-recovery-law');
  await page.waitForFunction(()=>document.querySelector('#source-recovery-law .pm-math .katex'));
  assert.equal(await page.locator('#source-recovery-law .katex-error').count(),0);
  assert.equal(await page.locator('#source-recovery-law .pm-math .katex').count(),1);
  assert(await page.locator('#source-recovery-law').evaluate(el=>el.getBoundingClientRect().top>=document.querySelector('.site-nav').getBoundingClientRect().bottom),'Anchor heading is covered by fixed navigation');
  for(const href of await page.locator('#source-recovery-law a').evaluateAll(ns=>ns.map(n=>n.getAttribute('href')))){
   const response=await page.request.get(origin+href);assert.equal(response.status(),200);assert((await response.body()).equals(fs.readFileSync(href.slice(1))),href);
  }
  await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  for(const width of[1500,390])for(const theme of['light','dark']){
   await page.setViewportSize({width,height:1100});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3));
   const bad=await page.evaluate(async()=>(await axe.run(document.querySelector('#source-lambdas'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>n.target)})));
   assert.deepEqual(bad,[]);const file='recovery-'+width+'-'+theme+'.png';await page.locator('#source-recovery-law').screenshot({path:base+file});
   report.audits.push({width,theme,violations:0,file,sha256:sha(fs.readFileSync(base+file))});
  }
  await page.goto(origin+paths[2]+'#source-template-recovery');
  await page.waitForFunction(()=>document.getElementById('source-template-recovery')?.closest('details')?.open);
  await page.locator('#atlas-evidence-search').fill('Captured source templates');
  assert.equal(await page.locator('.atlas-evidence-entry:visible').count(),1);assert.equal(await page.locator('[data-evidence-order="102"]').getAttribute('open'),'');report.evidenceSearch=true;
  const host={};vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/source-template-function-pages-manifest.js','utf8'),{window:host});
  const profile=host.PROOF_ATLAS_SOURCE_TEMPLATE_FUNCTION_PAGES.profiles.find(p=>p.source.name==='JacobiData.slope_bound_abs'),d=profile.cases.find(c=>c.id==='all-boundary-positions');
  const manifest=JSON.parse(z.gunzipSync(fs.readFileSync('.'+d.file))),template=manifest.templates.find(t=>t.bindingKey==='atlasRegionInput.11'),component=manifest.components.find(c=>c.component===template.originalComponent);
  const query=new URLSearchParams({source:profile.source.indexSha256,edition:profile.source.edition,proof:profile.source.name,call:String(profile.members[0]),policy:d.id,rule:'source-specializing',nativeCase:d.nativeCaseSha256,bindingKey:'atlasRegionInput.11',field:'value'});
  await page.goto(origin+paths[0]+'?'+query+'#ns-lab');
  await page.waitForFunction(()=>{const s=window.ProofAtlasNetworkStreamView?.getRegionFunctionState();return s?.status==='ready'&&!s.loading&&s.selection;});
  const before=await page.evaluate(()=>ProofAtlasNetworkStreamView.getRegionFunctionState());assert.equal(before.bindingKey,'atlasRegionInput.11');assert.equal(before.selection.nativeCaseSha256,d.nativeCaseSha256);
  await page.locator('[data-region-function-bindings] > summary').click();const row=page.locator('[data-region-function-key="atlasRegionInput.11"]');await row.getByText('Source-lambda correspondence',{exact:true}).click();await row.getByRole('button',{name:'Complete original lambda',exact:true}).click();
  await page.waitForFunction(()=>{const s=ProofAtlasNetworkStreamView.getRegionFunctionState();return !s.loading&&s.selection?.component.startsWith('template.');});
  const selected=await page.evaluate(()=>ProofAtlasNetworkStreamView.getRegionFunctionState());assert.equal(selected.selection.component,component.component);assert.equal(selected.selection.node,component.root);assert.equal(selected.selection.nativeCaseSha256,d.nativeCaseSha256);assert.equal(selected.bindingKey,'atlasRegionInput.11');report.originalLambdaSelection=selected.selection;
  assert.deepEqual(errors,[]);report.status='PASS';report.checkerSha256=sha(fs.readFileSync(__filename));
  report.scope='Actual production mathematical rendering, current-byte links, four responsive/theme accessibility checks, evidence search and one exact recorded Riccati source-lambda selection. Finite UI checks; no new native typing, general accessibility or comprehension result.';
  fs.writeFileSync(base+'browser-check.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n'),{mtime:0}));console.log(JSON.stringify(report));
 }finally{await browser.close();}
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
