'use strict';
const assert = require('node:assert/strict'), path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright');
(async()=>{
  const browser = await chromium.launch({executablePath:process.env.ATLAS_CHROMIUM_PATH});
  try {
    const page = await browser.newPage(), live = await browser.newPage();
    const checked = new Set();
    for (const width of [320,1280]) {
      await page.setViewportSize({width,height:760});
      await page.goto(pathToFileURL(path.join(__dirname,'riccati.html')).href);
      await page.locator('#definitions summary').click();
      const sections = page.locator('#local-steps section');
      assert.deepEqual(await sections.locator('h3').allTextContents(),['hz','hD','hds','hprod','amgm','hsum']);
      assert.equal(await sections.locator('li').count(),11);
      assert(await sections.last().isVisible());
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
      const steps = await page.evaluate(()=>packet.localSteps);
      const flow=page.locator('#proof-flow'),final=await page.evaluate(()=>packet.finalBody);
      async function walk(source){
        assert.equal(await flow.locator('h3').innerText(),source.name||'Final proof expression');
        const anchors=await flow.locator('a').evaluateAll(ns=>ns.map(n=>n.href));
        const targets=[source.value,...source.uses.map(e=>e.use)];
        assert.equal(anchors.length,targets.length);
        for(const [index,t] of targets.entries()){
          const u=new URL(anchors[index]);
          assert.equal(u.searchParams.get('proof'),'JacobiData.slope_bound_abs');
          assert.equal(u.searchParams.get('edition'),'published-15');
          assert.equal(u.searchParams.get('route'),t.route.root+':'+t.route.slots.join('.'));
          assert.equal(u.hash,'#expr-'+t.node);
        }
        for(const e of source.uses){
          const producer=steps[e.producer];
          const row=flow.locator('li').filter({has:page.getByRole('button',{name:producer.name,exact:true})});
          assert((await row.innerText()).includes(e.count+(e.count==='1'?' reference':' references')));
          await row.getByRole('button').click();
          await walk(producer);
          await flow.getByRole('button',{name:'Back to '+(source.name||'final proof'),exact:true}).click();
          assert.equal(await flow.locator('h3').innerText(),source.name||'Final proof expression');
        }
      }
      await walk(final);
      for (const [i,s] of steps.entries()) {
        const targets=[s.type,s.value];
        for (const r of s.extra) {
          targets.push(r.binder,r.use);
          const prior=steps.slice(0,i).find(p=>p.value.route.slots.join('.')===r.binder.route.slots.concat(1).join('.'));
          if(prior)targets.push(prior.value);
        }
        const urls=await sections.nth(i).locator('a').evaluateAll(ns=>ns.map(n=>n.href));
        assert.equal(urls.length,targets.length);
        for (const [j,target] of targets.entries()) {
          const u=new URL(urls[j]),route=target.route.root+':'+target.route.slots.join('.');
          assert.equal(u.searchParams.get('route'),route);
          assert.equal(u.hash,'#expr-'+target.node);
          if(checked.has(u.href))continue;
          await live.goto(u.href,{waitUntil:'domcontentloaded'});
          await live.waitForFunction(e=>{
            const s=window.ProofAtlasLibrary?.getSnapshot();
            return s?.name==='JacobiData.slope_bound_abs' && s.edition==='published-15' && s.selected===e.node &&
              s.route.root+':'+s.route.slots.join('.')===e.route;
          },{node:target.node,route});
          checked.add(u.href);
        }
      }
    }
    console.log('Two viewport checks and '+checked.size+' distinct hosted routes passed');
  } finally {await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
