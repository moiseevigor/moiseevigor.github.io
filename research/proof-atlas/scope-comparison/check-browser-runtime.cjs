/* Served production assets and both real gate adapters, without source overrides. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),{chromium}=require('playwright');
process.chdir(path.resolve(__dirname,'../../..'));
const origin=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8866',folder=process.argv[2],sha=b=>crypto.createHash('sha256').update(b).digest('hex');assert(folder);fs.mkdirSync(folder,{recursive:true});
const files=['public/js/proof-atlas-scope-comparison.js','public/js/proof-atlas-application-ports.js','public/js/proof-atlas-paged-type-operations.js','public/js/proof-atlas-application-port-view.js','public/js/proof-atlas-input-type-bridge-view.js','public/js/proof-atlas-library.js','public/js/proof-atlas-paged-library.js'];
(async()=>{
 const browser=await chromium.launch({headless:true,executablePath:process.env.ATLAS_CHROMIUM_PATH}),page=await browser.newPage({viewport:{width:1400,height:1000}}),errors=[];
 page.on('pageerror',error=>errors.push(error.message));await page.addInitScript(()=>localStorage.setItem('analytics-consent','no'));
 const report={format:'ProofAtlasScopeRuntimeBrowser/1',status:'RUNNING',sourceOverrides:false,files:{},adapters:null};
 try{
  for(const file of files){const response=await page.request.get(origin+'/'+file);assert.equal(response.status(),200);assert.equal(sha(await response.body()),sha(fs.readFileSync(file)),file);report.files[file]=sha(fs.readFileSync(file));}
  await page.goto(origin+'/projects/proof-atlas/manual/paged-network/',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>window.ProofAtlasScopeComparison&&window.ProofAtlasApplicationPorts&&window.ProofAtlasPagedTypeOperations);
  assert(await page.locator('script[src="/public/js/proof-atlas-scope-comparison.js?v=1"]').count());
  const illustration=JSON.parse(fs.readFileSync('research/proof-atlas/scope-comparison/scope-sharing.json'));
  report.adapters=await page.evaluate(async d=>{
   const W=ProofAtlasScopeComparison,M=ProofAtlasApplicationPorts,O=ProofAtlasPagedTypeOperations,g={kind:[...d.source.kind,...d.target.kind],payloads:[...d.source.payloads,...d.target.payloads],children:[...d.source.children,...d.target.children.map(cs=>cs.map(id=>id+d.source.kind.length))]},left=d.sourceRoot,right=d.targetRoot+d.source.kind.length;
   const complete=W.compare,paged=W.comparePaged;let completeCalls=0,pagedCalls=0;
   W.compare=(...args)=>{completeCalls++;return complete(...args);};W.comparePaged=(...args)=>{pagedCalls++;return paged(...args);};
   try{
    const a=M.validateWeakening(g,left,right,1),b=await O.equalShifted(async id=>[g.kind[id],g.children[id],g.payloads[id]],g.kind.length,left,right,1);
    const budget=await O.equalShifted(async id=>[g.kind[id],g.children[id],g.payloads[id]],g.kind.length,left,right,1,{pairLimit:1});
    return{complete:a,paged:b,reducedBudget:budget,completeCalls,pagedCalls,typing:'not-asserted'};
   }finally{W.compare=complete;W.comparePaged=paged;}
  },illustration);
  assert.equal(report.adapters.completeCalls,1);assert.equal(report.adapters.pagedCalls,2);assert.deepEqual(report.adapters.complete,report.adapters.paged);assert.equal(report.adapters.complete.status,'same');assert.equal(report.adapters.reducedBudget.status,'unavailable');
  await page.goto(origin+'/projects/proof-atlas/manual/equality-transport/',{waitUntil:'domcontentloaded'});
  assert((await page.locator('body').innerText()).includes('Uniform context extension shifts external variable references'));
  assert(await page.locator('script[src="/public/js/proof-atlas-application-port-view.js?v=5"]').count());
  await page.goto(origin+'/projects/proof-atlas/library/',{waitUntil:'domcontentloaded'});
  assert(await page.locator('script[src="/public/js/proof-atlas-library.js?v=104"]').count());
  assert.deepEqual(errors,[]);report.status='PASS';report.publicDeployment=false;report.scope='Real built assets and complete/paged gate wiring; illustration is syntax data. Native-reader selections and accessibility are checked in the separate bridge browser report.';
  report.checkerSha256=sha(fs.readFileSync(__filename));fs.writeFileSync(path.join(folder,'browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }finally{await browser.close();}
})().catch(error=>{console.error(error.stack);process.exit(1);});
