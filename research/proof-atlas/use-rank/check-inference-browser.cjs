'use strict';
const {chromium}=require('playwright');
const assert=require('node:assert/strict');
const {pathToFileURL}=require('node:url');
const path=require('node:path');
const fs=require('node:fs'),z=require('node:zlib');
const atlas=require('../../../public/js/proof-atlas-library-data');
const {inventory}=require('../../../scripts/proof-atlas-judgment-fixtures.cjs');
const {open}=require('./model.cjs');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.ATLAS_CHROMIUM_PATH});
 try {
  const page=await browser.newPage();
  const errors=[];
  page.on('pageerror',error=>errors.push(error.message));
  for(const width of [320,1280]) {
    await page.setViewportSize({width,height:800});
    await page.goto(pathToFileURL(path.join(__dirname,'inferences.html')).href);
    assert(await page.locator('#denominator').isVisible());
    for(const [i,example] of (await page.evaluate(()=>examples)).entries()){
      const {record}=inventory().find(x=>x.record.indexSha256===example.source.indexSha256);
      const data=atlas.validateIndex(JSON.parse(z.gunzipSync(fs.readFileSync('.'+record.indexFile))),record);
      const model=open(data,example.binder.route);
      await page.locator('#proof').selectOption(String(i));
      assert.equal(await page.locator('#denominator').isVisible(),example.source.name==='lean_workbook_plus_15068');
      await page.locator('#details > summary').click();
      for(const p of example.ports){
        const row=page.locator('.premise').filter({has:page.getByRole('link',{name:p.text,exact:true})});
        const anchor=new URL(await row.locator('a').first().getAttribute('href'));
        assert.equal(anchor.searchParams.get('route'),p.input.route.root+':'+p.input.route.slots.join('.'));
        assert.equal(anchor.hash,'#expr-'+p.input.node);
        if(p.slot){
          const detail=row.locator('details');
          await detail.locator('summary').click();
          const edges=detail.locator('li');
          assert.equal(await edges.count(),p.dependencies.length);
          for(const [k,w] of p.dependencies.entries()){
            const edge=edges.nth(k), target=example.ports[w.slot].input;
            const href=new URL(await edge.locator('a').getAttribute('href'));
            assert.equal(href.searchParams.get('route'),target.route.root+':'+target.route.slots.join('.'));
            assert.equal(href.hash,'#expr-'+target.node);
            assert.equal(await edge.locator('code').textContent(),w.root+'.'+w.slots.join('.')+' · row '+w.node);
          }
        }
        if(!Number(p.count))continue;
        await page.getByRole('button',{name:'Inspect input '+p.slot,exact:true}).click();
        await page.locator('#ordinal').fill(p.count);
        await page.getByRole('button',{name:'Locate',exact:true}).click();
        const selected=new URL(await page.locator('#occurrence').getAttribute('href'));
        assert.equal(selected.searchParams.get('proof'),example.source.name);
        const address=selected.searchParams.get('route').split(':');
        assert.equal(Number(address[0]),p.input.route.root);
        const interval=model.interval(p.input.route);
        const last=model.select(interval.first+interval.count-1n);
        assert.deepEqual(address[1].split('.').map(Number),last.route.slots);
        assert.equal(selected.hash,'#expr-'+last.node);
        await page.locator('#ordinal').fill(String(Number(p.count)+1));
        assert.equal(await page.locator('#ordinal').evaluate(e=>e.checkValidity()),false);
      }
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
    }
  }
  assert.deepEqual(errors,[]);
  console.log('Pass: four proof switches, 33 inputs, positive upper endpoints and invalid ordinals at both widths.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
