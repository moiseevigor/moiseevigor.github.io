'use strict';
const assert=require('node:assert/strict'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const {chromium}=require('playwright');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.ATLAS_CHROMIUM_PATH});
 try{
  const page=await browser.newPage();
  for(const width of [320,1280]){
   await page.setViewportSize({width,height:760});
   await page.goto(pathToFileURL(path.join(__dirname,'inferences.html')).href);
   const examples=await page.evaluate(()=>examples);
   const finals=await page.evaluate(()=>finalApplications);
   for(const [hash,f] of Object.entries(finals)){
    const spine=require('./spine-transfer.json').find(s=>s.source.indexSha256===hash);
    assert.deepEqual(f.anchor,spine.finalBody.value);
    const calls=examples.filter(x=>x.source.indexSha256===hash), first=calls[0];
    await page.evaluate(h=>location.hash=h,hash+'-'+first.callId+'/final');
    await page.waitForFunction(h=>active.source.indexSha256===h,hash);
    const panel=page.locator('#final-application');
    await page.waitForFunction(()=>document.querySelector('#final-application').open);
    await panel.locator('details').evaluate(d=>d.open=true);
    assert.equal(await panel.locator('[data-final-slot]').count(),f.args.length);
    if(f.cases?.checked){
     const cases=f.cases;
     assert.deepEqual(cases.branches.map(b=>b.constructor),['Or.inl','Or.inr']);
     assert.equal(cases.major,4);
     const major=panel.locator('[data-final-slot="4"]');
     const verify=async (a,t)=>{
      const url=new URL(await a.getAttribute('href'));
      assert.equal(url.hash,'#expr-'+t.node);
      assert.equal(url.searchParams.get('route'),t.route.root+':'+t.route.slots.join('.'));
     };
     await verify(major.getByRole('link',{name:'Defining proof'}),cases.origin.value);
     const bounds=[];
     for(const branch of cases.branches){
      const row=panel.locator('.case-branches [data-final-slot="'+branch.slot+'"]');
      assert.equal(await row.locator('h3').textContent(),branch.constructor);
      await verify(row.getByRole('link',{name:'Assumption',exact:true}),branch.domains[0]);
      await verify(row.getByRole('link',{name:'Branch body',exact:true}),branch.body);
      await verify(row.getByRole('link',{name:branch.head.label,exact:true}),branch.head);
      bounds.push(await row.boundingBox());
     }
     if(width===320)assert(bounds[1].y>=bounds[0].y+bounds[0].height-1);
     else assert(bounds[1].x>=bounds[0].x+bounds[0].width-1);
    }else assert.equal(await panel.locator('.case-branches').count(),0);
    for(const arg of f.args){
     const row=panel.locator('[data-final-slot="'+arg.slot+'"]');
     const url=new URL(await row.locator('p a').getAttribute('href'));
     assert.equal(url.searchParams.get('proof'),first.source.name);
     assert.equal(url.searchParams.get('route'),arg.anchor.route.root+':'+arg.anchor.route.slots.join('.'));
     assert.equal(url.hash,'#expr-'+arg.anchor.node);
     const expected=calls.filter(c=>c.call.route.root===arg.anchor.route.root &&
       c.call.route.slots.slice(0,arg.anchor.route.slots.length).join('.')===arg.anchor.route.slots.join('.'));
     assert.deepEqual(arg.calls.map(c=>c.id),expected.map(c=>c.callId));
     for(const [k,local] of (arg.viaLocal||[]).entries()){
      const urls=await row.locator('.via-local').nth(k).locator(':scope > a').evaluateAll(ns=>ns.map(n=>n.href));
      assert.equal(urls.length,3);
      for(const [j,t] of [local.binder,local.use,local.value].entries()){
       const u=new URL(urls[j]);assert.equal(u.hash,'#expr-'+t.node);
       assert.equal(u.searchParams.get('route'),t.route.root+':'+t.route.slots.join('.'));
      }
      for(const nested of local.calls){
       const c=calls.find(c=>c.callId===nested.id);
       assert.deepEqual(c.call.route.slots.slice(0,local.value.route.slots.length),local.value.route.slots);
      }
     }
     for(const call of [...arg.calls,...(arg.viaLocal||[]).flatMap(l=>l.calls)]){
      const target=calls.find(c=>c.callId===call.id);

      await panel.evaluate(d=>d.open=true);
      await row.getByRole('link',{name:'Inspect '+call.rule+' · call '+call.id,exact:true}).click();
      await page.waitForFunction(id=>active.callId===id && document.activeElement.id==='intro',call.id);
      assert.equal(await panel.evaluate(d=>d.open),false);
      await panel.evaluate(d=>d.open=true);
      await row.getByRole('link',{name:'Inspect '+call.rule+' · call '+call.id,exact:true}).click();
      assert.equal(await panel.evaluate(d=>d.open),false);
     }
     await panel.evaluate(d=>d.open=true);
    }
    assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+1));
   }
  }
  console.log('All six final applications and every nested call link passed at two widths');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
