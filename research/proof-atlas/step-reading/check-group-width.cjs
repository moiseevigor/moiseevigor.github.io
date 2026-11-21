// Exercise the grouped construction reader against the compiled Riccati AM–GM call.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {chromium} = require('playwright');
const packed = require('../../../public/js/proof-atlas-packed-routes');
const evidence = require('./article-call-traces.json');
const call = evidence.results.find(r => r.node === 1227 && r.declaration === 'JacobiData.slope_bound_abs');
const argument = call.inputs.at(-1);
const root = packed.encode(1,argument.route.slots.slice(0,-1));
const target = packed.encode(1,argument.route.slots);
const digest = require('./se2-call-widths.json').proofs.find(p => p.name === call.declaration).indexSha256;
const url = 'http://localhost/projects/proof-atlas/library/?view=occurrence&group=applications&diagram=construction&levels=4&edition='+
  evidence.edition+'&proof='+call.declaration+'#occurrence='+[digest,root.root,root.depth,root.slots].join('.');
const html = fs.readFileSync('projects/proof-atlas/library/index.html','utf8').replace(/^---[\s\S]*?---\n/,'')
  .replace('{% include proof-atlas-compiled-workspace.html %}',fs.readFileSync('_includes/proof-atlas-compiled-workspace.html','utf8'));
(async()=>{
  const browser = await chromium.launch({executablePath:process.env.ATLAS_CHROMIUM_PATH});
  try {
    for (const width of [360,1280]) {
      const page = await browser.newPage({viewport:{width,height:900}});
      await page.route('http://localhost/**',route=>{
        const pathname = new URL(route.request().url()).pathname;
        if (pathname === '/projects/proof-atlas/library/') return route.fulfill({contentType:'text/html; charset=utf-8',body:html});
        return pathname.startsWith('/public/') ? route.fulfill({path:path.resolve('.'+pathname)}) : route.fulfill({status:404,body:''});
      });
      await page.goto(url);
      const group = page.locator('[data-application-group="g0"]');
      const ports = group.locator(':scope > [data-construction-field]');
      const toggle = page.getByLabel('Show all retained arguments');
      await group.waitFor();
      assert.equal(await ports.count(),4);
      const checkRoute = async (position, route) => {
        await ports.nth(position).click();
        const actual = await page.evaluate(()=>window.ProofAtlasOccurrenceView.getSnapshot().route);
        assert.deepEqual(actual,route);
      };
      assert.match(await ports.first().innerText(),/Earlier application/);
      await checkRoute(0,packed.append(root,[0,0,0]));
      for (const [i,input] of call.inputs.slice(-3).entries()) {
        assert.match(await ports.nth(i+1).innerText(),new RegExp("^Argument "+input.slot+" "));
        await checkRoute(i+1,packed.encode(input.route.root,input.route.slots));
      }
      const stages = group.locator('details[data-construction-stages]');
      await stages.locator('summary').click();
      await stages.locator('[data-construction-member]').first().waitFor();
      assert.deepEqual((await stages.locator('[data-construction-member]').allTextContents()).map(s=>s.split(' · ')[0]),['Stage 2','Stage 3','Stage 4']);
      const selected = () => page.waitForFunction(expected=>{
        const s = window.ProofAtlasOccurrenceView.getSnapshot();
        return s.node === expected.node && s.route.root === expected.route.root &&
          s.route.depth === expected.route.depth && s.route.slots === expected.route.slots;
      },{node:argument.node,route:target});
      await selected();
      await toggle.check();
      assert.equal(await ports.count(),5);
      await selected();
      assert.equal(new URL(page.url()).searchParams.get('arguments'),'all');
      await checkRoute(0,packed.append(root,[0,0,0,0]));
      for (const [i,input] of call.inputs.entries()) {
        assert.match(await ports.nth(i+1).innerText(),new RegExp("^Argument "+input.slot+" "));
        await checkRoute(i+1,packed.encode(input.route.root,input.route.slots));
      }
      await selected();
      await toggle.uncheck();
      assert.equal(await ports.count(),4);
      await selected();
      assert.equal(new URL(page.url()).searchParams.has('arguments'),false);
      await toggle.check();
      await page.getByLabel('Diagram levels',{exact:true}).selectOption('2');
      await group.getByText('Showing arguments 2–4 of 4.',{exact:true}).waitFor();
      for (const [i,input] of call.inputs.slice(-3).entries()) {
        assert.match(await ports.nth(i+1).innerText(),new RegExp("^Argument "+input.slot+" "));
        await checkRoute(i+1,packed.encode(input.route.root,input.route.slots));
      }
      await page.close();
    }
    console.log('Verified compact/full Riccati argument routes at 360 and 1280 pixels.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
