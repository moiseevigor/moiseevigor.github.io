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
      await page.waitForFunction(i=>active===examples[i],i);
      assert.equal(await page.locator('#denominator').isVisible(),example.source.name==='lean_workbook_plus_15068' && example.callId===2);
      assert.equal(await page.locator('#trace').isVisible(),example.table.total!=='0');
      assert(await page.locator('#witness').isHidden());
      const rows=page.locator('#matrix tbody tr');
      const columns=[...example.ports.filter(p=>p.role==='proof'),{slot:example.ports.length,dependencies:example.resultDependencies,input:example.call}];
      assert.equal(await rows.count(),example.ports.length-1);
      for(const p of example.ports.slice(1)){
        for(const [k,c] of columns.entries()){
          const cell=rows.nth(p.slot-1).locator('td').nth(k);
          if(p.slot>=c.slot){assert.equal(await cell.getAttribute('aria-label'),'Outside scope');continue;}
          const w=c.dependencies.find(w=>w.slot===p.slot);
          if(!w){assert.equal(await cell.getAttribute('aria-label'),'Absent');continue;}
          await cell.locator('button').click();
          assert.equal(await page.locator('#matrix [aria-pressed=true]').count(),1);
          const readout=page.locator('#witness');
          assert.equal(await readout.locator('code').textContent(),w.root+'.'+w.slots.join('.')+' · row '+w.node);
          for(const [index,hit] of [p.input,c.input].entries()){
            const url=new URL(await readout.locator('a').nth(index).getAttribute('href'));
            assert.equal(url.searchParams.get('route'),hit.route.root+':'+hit.route.slots.join('.'));
            assert.equal(url.hash,'#expr-'+hit.node);
          }
        }
      }
      const consumers=page.locator('#consumers a');
      assert.equal(await consumers.count(),example.consumers.length);
      for(const [k,use] of example.consumers.entries()){
        await consumers.nth(k).click();
        const target=page.locator('.premise[data-selected]');
        await page.waitForFunction(x=>active.source.indexSha256===x.hash && active.callId===x.id &&
          document.activeElement?.dataset.slot===String(x.slot),{hash:example.source.indexSha256,id:use.callId,slot:use.slot});
        const sourceLink=new URL(await target.locator('a').first().getAttribute('href'));
        const input=await page.evaluate(slot=>active.ports[slot],use.slot);
        assert.equal(sourceLink.searchParams.get('route'),input.input.route.root+':'+input.input.route.slots.join('.'));
        assert.equal(sourceLink.hash,'#expr-'+input.input.node);
        assert.equal(await page.locator('#trace').isVisible(),input.count!=='0');
        await page.reload();
        assert.equal(await target.getAttribute('data-slot'),String(use.slot));
        await page.goBack();
        await page.waitForFunction(i=>active===examples[i],i);
      }
      await page.locator('#result-inputs summary').click();
      const resultLinks=page.locator('#result-inputs li');
      assert.equal(await resultLinks.count(),example.resultDependencies.length);
      for(const [k,witness] of example.resultDependencies.entries()){
        const href=new URL(await resultLinks.nth(k).locator('a').getAttribute('href'));
        const target=example.ports[witness.slot].input;
        assert.equal(href.searchParams.get('route'),target.route.root+':'+target.route.slots.join('.'));
        assert.equal(href.hash,'#expr-'+target.node);
      }
      await page.locator('#details > summary').click();
      for(const p of example.ports){
        const row=page.locator('.premise[data-slot="'+p.slot+'"]');
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
        if(p.origin){
          await row.locator('a[href^="#"]').click();
          await page.waitForFunction(x=>active.source.indexSha256===x.hash && active.callId===x.id,{hash:example.source.indexSha256,id:p.origin.callId});
          const result=new URL(await page.locator('#result a').getAttribute('href'));
          assert.equal(result.hash,'#expr-'+p.origin.anchor.node);
          assert.equal(result.searchParams.get('route'),p.origin.anchor.route.root+':'+p.origin.anchor.route.slots.join('.'));
          await page.goBack();
          await page.waitForFunction(i=>active===examples[i],i);
          await page.locator('#details > summary').click();
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
  console.log('Pass: all recorded applications, input links, matrix cells and positive upper endpoints at both widths.');
 } finally {await browser.close();}
})().catch(error=>{console.error(error);process.exitCode=1;});
