'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),{chromium}=require('playwright');
process.chdir(path.resolve(__dirname,'../../..'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),origin=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8877',folder=process.env.ATLAS_SCREENSHOTS||path.join(require('os').tmpdir(),'atlas-certified-browser');
fs.mkdirSync(folder,{recursive:true});
async function main(){const browser=await chromium.launch({headless:true,executablePath:process.env.ATLAS_CHROMIUM_PATH});
 try{const page=await browser.newPage({viewport:{width:1500,height:1150}}),errors=[],audits=[];page.on('pageerror',e=>errors.push(String(e)));await page.addInitScript(()=>{localStorage.setItem('analytics-consent','no');localStorage.setItem('theme','light');});
  const url='/projects/proof-atlas/manual/paged-network/';await page.goto(origin+url+'#certified-substitution');
  await page.waitForFunction(()=>document.querySelector('[aria-label="Memoized substitution cache invariant"] .katex')&&document.querySelector('[aria-label="One variable row in two binder contexts"] .katex'));
  assert.equal(await page.locator('#contextual-module-use .katex-error').count(),0);assert.equal(await page.locator('[aria-label="Capture-avoiding scoped module instantiation"] .katex').count(),1);
  await page.evaluate(()=>document.fonts.ready);await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
  for(const width of[1500,390])for(const theme of['light','dark']){await page.setViewportSize({width,height:1150});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3));
   const violations=await page.evaluate(async()=>(await axe.run(document.querySelector('#contextual-module-use'),{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(x=>x.id));assert.deepEqual(violations,[]);
   const file='certified-cache-'+width+'-'+theme+'.png';await page.locator('#certified-substitution').screenshot({path:folder+'/'+file});audits.push({width,theme,violations:0,screenshotSha256:sha(fs.readFileSync(folder+'/'+file))});
  }
  const files={};for(const file of['research/proof-atlas/certified-substitution/README.md','research/proof-atlas/certified-substitution/Certified.lean','research/proof-atlas/certified-substitution/verification.json.gz','research/proof-atlas/certified-substitution/native.json.gz']){const r=await page.request.get(origin+'/'+file);assert.equal(r.status(),200);const b=await r.body();assert(b.equals(fs.readFileSync(file)));assert(b.equals(fs.readFileSync('_site_production/'+file)));files[file]=sha(b);}
  const html=await page.request.get(origin+url);assert((await html.body()).equals(fs.readFileSync('_site_production'+url+'index.html')));
  await page.goto(origin+'/projects/proof-atlas/evidence/#certified-substitution');await page.waitForFunction(()=>document.getElementById('certified-substitution')?.closest('details')?.open);assert(await page.locator('#certified-substitution').evaluate(e=>e.closest('details').textContent.includes('total postorder-row executor')));
  assert.deepEqual(errors,[]);const report={format:'ProofAtlasCertifiedSubstitutionBrowser/1',status:'PASS',audits,newEquationRendered:true,certifiedCacheEquations:2,manualSourceSha256:sha(fs.readFileSync('research/proof-atlas/network-streaming/index.html')),manualHtmlSha256:sha(await html.body()),files,evidenceAnchorOpens:true,checkerSha256:sha(fs.readFileSync(__filename)),screenshotsPublished:false,scope:'Built source-linked instantiation and certified-cache notation; four theme/responsive/accessibility checks, exact served technical records and evidence-anchor navigation. Native proofs and mathematical typing have separate evidence.'};fs.writeFileSync(folder+'/manual-browser.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{await browser.close();}}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
