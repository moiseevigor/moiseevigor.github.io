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
      if(!example.callId){
        const clauses=await page.evaluate(()=>flows[active.source.indexSha256]);
        await page.locator('#statement-flow > summary').click();
        for(const [k,c] of clauses.entries()){
          await page.locator('#clause').selectOption(String(k));
          const coverage=page.locator('#flow .coverage');
          assert((await coverage.textContent()).includes(c.coverage.total==='0'?'no lexical uses':c.coverage.covered+' of '+c.coverage.total+' uses'));
          const outside=c.coverage.firstOutside, gap=coverage.locator('a');
          assert.equal(await gap.count(),outside?1:0);
          if(outside){
            const url=new URL(await gap.getAttribute('href'));
            assert.equal(url.searchParams.get('route'),outside.route.root+':'+outside.route.slots.join('.'));
            assert.equal(url.hash,'#expr-'+outside.node);
          }
          const branches=page.locator('#flow .outside-branches');
          assert.equal(await branches.count(),c.coverage.branches.regions?1:0);
          if(c.coverage.branches.regions){
            await branches.locator(':scope > summary').click();
            const rows=branches.locator(':scope > ol > li');assert.equal(await rows.count(),c.coverage.branches.largest.length);
            for(const [j,b] of c.coverage.branches.largest.entries()){
              assert.equal(await rows.nth(j).locator('code').textContent(),b.path);
              const partition=rows.nth(j).locator('.branch-groups');
              if(b.frontier.length>1){
                await partition.locator('summary').click();
                const links=partition.locator('a');
                assert.equal(await links.count(),b.frontier.length);
                for(const [k,part] of b.frontier.entries()){
                  assert.equal(await links.nth(k).textContent(),part.fields);
                  assert.equal(await partition.locator('meter').nth(k).evaluate(m=>m.value),Number(BigInt(part.count)*1000000n/BigInt(b.count)));
                  const url=new URL(await links.nth(k).getAttribute('href'));
                  assert.equal(url.hash,'#expr-'+part.anchor.node);
                  assert.equal(url.searchParams.get('route'),part.anchor.route.root+':'+part.anchor.route.slots.join('.'));
                }
              }else assert.equal(await partition.count(),0);
              const focus=rows.nth(j).locator('.branch-focus a');
              const hits=[b.stop.anchor,...b.stop.children.map(c=>c.anchor)];
              const bars=rows.nth(j).locator('.branch-focus meter');
              assert.equal(await bars.count(),b.stop.children.length);
              for(const [k,c] of b.stop.children.entries()){
                assert.equal(await bars.nth(k).evaluate(m=>m.value),Number(BigInt(c.count)*1000000n/BigInt(b.count)));
              }
              assert.equal(await focus.count(),hits.length);
              for(const [k,hit] of hits.entries()){
                const u=new URL(await focus.nth(k).getAttribute('href'));
                assert.equal(u.hash,'#expr-'+hit.node);
                assert.equal(u.searchParams.get('route'),hit.route.root+':'+hit.route.slots.join('.'));
              }
              if(b.head){
                const head=rows.nth(j).getByRole('link',{name:b.head.label,exact:true}).first();
                const url=new URL(await head.getAttribute('href'));
                assert.equal(url.hash,'#expr-'+b.head.anchor.node);
                assert.equal(url.searchParams.get('route'),b.head.anchor.route.root+':'+b.head.anchor.route.slots.join('.'));
              }
              if(b.fields.length){
                await rows.nth(j).locator('details:not(.branch-groups) > summary').click();
                const links=rows.nth(j).locator('ul a');
                assert.equal(await links.count(),b.fields.length);
                for(const [k,f] of b.fields.entries()){
                  const url=new URL(await links.nth(k).getAttribute('href'));
                  assert.equal(url.hash,'#expr-'+f.anchor.node);
                  assert.equal(url.searchParams.get('route'),f.anchor.route.root+':'+f.anchor.route.slots.join('.'));
                  assert.equal(await links.nth(k).textContent(),f.field);
                }
              }
              for(const [k,hit] of [b.anchor,b.first].entries()){
                const url=new URL(await rows.nth(j).locator('a').nth(k).getAttribute('href'));
                assert.equal(url.searchParams.get('route'),hit.route.root+':'+hit.route.slots.join('.'));
                assert.equal(url.hash,'#expr-'+hit.node);
              }
            }
          }
          const edges=[...c.direct,...c.subsequent];
          const links=page.locator('#flow a[href^="#"]');
          assert.equal(await links.count(),edges.length);
          for(const [j,e] of edges.entries()){
            await links.nth(j).click();
            await page.waitForFunction(e=>active.callId===e.call && document.querySelector('.premise[data-selected]')?.dataset.slot===String(e.slot),e);
            await page.goBack();await page.waitForFunction(i=>active===examples[i],i);
          }
          const occurrences=page.locator('#flow > details:not(.outside-branches) a');
          assert.equal(await occurrences.count(),c.containing.length);
          for(const [j,hit] of c.containing.entries()){
            const url=new URL(await occurrences.nth(j).getAttribute('href'));
            assert.equal(url.hash,'#expr-'+hit.first.node);
            assert.equal(url.searchParams.get('route'),hit.first.route.root+':'+hit.first.route.slots.join('.'));
          }
        }
        await page.locator('#statement-flow > summary').click();
      }
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
          const detail=row.locator('details:not(.definition):not(.declared-domain)');
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
        if(p.binding){
          const actual=atlas.binding(data,p.input.route);
          const url=new URL(await row.locator(':scope > p').getByRole('link',{name:p.binding.name,exact:true}).last().getAttribute('href'));
          assert.equal(url.searchParams.get('route'),actual.route.root+':'+actual.route.slots.join('.'));
          assert.equal(url.hash,'#expr-'+actual.node);
          const detail=row.locator('.declared-domain');await detail.locator('summary').click();
          const domain={root:actual.route.root,slots:[...actual.route.slots,0]};
          const domainURL=new URL(await detail.locator('a').first().getAttribute('href'));
          assert.equal(domainURL.hash,'#expr-'+atlas.walk(data,domain));
          assert.equal(domainURL.searchParams.get('route'),domain.root+':'+domain.slots.join('.'));
          const statementLink=detail.getByRole('link',{name:'Matching theorem hypothesis or parameter type'});
          if(p.binding.statement){
            const url=new URL(await statementLink.getAttribute('href'));
            assert.equal(url.searchParams.get('route'),'0:'+domain.slots.join('.'));
            assert.equal(url.hash,'#expr-'+atlas.walk(data,{root:0,slots:domain.slots}));
          }else assert.equal(await statementLink.count(),0);
          for(const [k,r] of p.binding.references.entries()){
            const links=detail.locator('li').nth(k).locator('a'), bound=atlas.binding(data,r.use.route);
            for(const [j,hit] of [bound,r.use].entries()){
              const href=new URL(await links.nth(j).getAttribute('href'));
              assert.equal(href.hash,'#expr-'+atlas.walk(data,hit.route));
              assert.equal(href.searchParams.get('route'),hit.route.root+':'+hit.route.slots.join('.'));
            }
          }
        }
        if(p.resolution){
          const panel=row.locator('.definition');await panel.locator('summary').click();
          let use=p.input;
          for(const [i,h] of p.resolution.definitions.entries()){
            const binder=atlas.binding(data,use.route),route={root:binder.route.root,slots:[...binder.route.slots,1]};
            const value={node:atlas.walk(data,route),route};
            assert.equal(atlas.kinds[data.kind[binder.node]],'letE');
            const links=panel.locator('li').nth(i).locator('a');
            assert.equal(await links.nth(1).textContent(),'let '+data.payloads[binder.node].declName);
            for(const [j,hit] of [use,binder,value].entries()){
              const url=new URL(await links.nth(j).getAttribute('href'));
              assert.equal(url.searchParams.get('route'),hit.route.root+':'+hit.route.slots.join('.'));
              assert.equal(url.hash,'#expr-'+hit.node);
            }
            use=value;
          }
          assert.deepEqual(use,p.origin.anchor);
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
