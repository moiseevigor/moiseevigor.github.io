// Exercise the complete library entry page with the checked-in workspace include.
'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {chromium}=require('playwright'),{inventory}=require('../../../scripts/proof-atlas-judgment-fixtures.cjs');
const atlas=require('../../../public/js/proof-atlas-library-data');
const {index}=require('../../../public/js/proof-atlas-row-occurrences');
const sample=require('./shared-application-contexts.json').find(s=>s.middleWitness);
const record=inventory().find(i=>i.record.indexSha256===sample.source.indexSha256).record;
const data=JSON.parse(require('node:zlib').gunzipSync(fs.readFileSync('.'+record.indexFile)));
const w=sample.middleWitness;
const table=index(data,w.row,{root:1,slots:w.first});
assert.equal(table.total,113n);
const html=fs.readFileSync('projects/proof-atlas/library/index.html','utf8').replace(/^---[\s\S]*?---\n/,'')
 .replace('{% include proof-atlas-compiled-workspace.html %}',fs.readFileSync('_includes/proof-atlas-compiled-workspace.html','utf8'));
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.ATLAS_CHROMIUM_PATH});
 try{
  for(const width of [320,1280]){
   const page=await browser.newPage({viewport:{width,height:800}});
   page.on('pageerror',error=>console.error(error.message));
   await page.route('http://localhost/**',async route=>{
    const u=new URL(route.request().url());
    if(u.pathname==='/projects/proof-atlas/library/')return route.fulfill({contentType:'text/html; charset=utf-8',body:html});
    if(!u.pathname.startsWith('/public/'))return route.fulfill({status:404,body:''});
    const file=path.resolve('.'+u.pathname);
    return route.fulfill({path:file});
   });
   const base='http://localhost/projects/proof-atlas/library/?edition='+sample.source.edition+'&proof='+record.name;
   await page.goto(base+'&route=1:'+w.first.join('.')+'#expr-'+w.row);
   const choose=page.locator('#pl-expression details').filter({has:page.getByText('Find occurrences of this application',{exact:true})});
   await choose.locator('summary').click();
   await choose.getByLabel('Occurrence number').waitFor();
   assert.match(await choose.innerText(),/Occurrence 1 of 113/);
   await choose.getByLabel('Occurrence number').fill('114');
   await choose.getByRole('button',{name:'Go to occurrence'}).click();
   assert.equal(await choose.locator('input').evaluate(i=>i.checkValidity()),false);
   await choose.getByLabel('Occurrence number').fill('57');
   await choose.getByRole('button',{name:'Go to occurrence'}).click();
   const picked=table.select(57n),variable={root:1,slots:picked.slots.concat(w.relative)};
   await page.waitForFunction(r=>new URL(location).searchParams.get('route')===r,'1:'+picked.slots.join('.'));
   await choose.locator('summary').click();
   await choose.getByLabel('Occurrence number').waitFor();
   assert.match(await choose.innerText(),/Occurrence 57 of 113/);
   await page.locator('#pl-expression').getByRole('button',{name:/^arg ·/}).click();
   const binder=atlas.binding(data,variable);
   await page.locator('#pl-expression').getByRole('button',{name:new RegExp('^Enclosing binder #'+binder.node+' ')}).click();
   await page.waitForFunction(r=>new URL(location).searchParams.get('route')===r,'1:'+binder.route.slots.join('.'));
   assert.equal(new URL(page.url()).hash,'#expr-'+binder.node);
   const window={};
   for(const manifest of ['library-manifest','type-notation-catalog'])
    require('node:vm').runInNewContext(fs.readFileSync('public/data/proof-atlas/'+manifest+'.js','utf8'),{window});
   const example=window.PROOF_ATLAS_LIBRARY.editions.find(e=>e.id==='published-15').declarations.find(r=>r.name==='JacobiData.a_deriv_form._simp_1_5');
   const compiled=JSON.parse(require('node:zlib').gunzipSync(fs.readFileSync('.'+example.indexFile)));
   const groups=require('../../../public/js/proof-atlas-omitted-references').inspect(compiled,window.PROOF_ATLAS_TYPE_NOTATION);
   await page.goto('http://localhost/projects/proof-atlas/library/?edition=published-15&proof='+example.name+'&route=0:#expr-'+compiled.roots[0]);
   const panel=page.locator('#pl-omitted-references');
   await panel.locator('summary').click();
   await panel.locator('section').first().waitFor();
   assert.equal(await panel.locator('section').count(),groups.length);
   let traced=0;
   for(const [j,g] of groups.entries()){
    const section=panel.locator('section').nth(j);
    for(let n=1n;n<=g.total;n++){
     if(g.total>1n){
      await section.getByLabel('Reference').fill(String(n));await section.getByRole('button',{name:'Trace'}).click();
     }
     const expected=g.select(n),links=section.locator('[aria-live] a');
     for(const [k,t] of [expected.use,expected.binder].entries()){
      const url=new URL(await links.nth(k).evaluate(a=>a.href));
      assert.equal(url.hash,'#expr-'+t.node);
      assert.equal(url.searchParams.get('route'),'0:'+t.route.slots.join('.'));
     }
     traced++;
    }
   }
   assert.equal(traced,24);
   await panel.locator('section [aria-live] a').last().click();
   const lastGroup=groups.at(-1),destination=lastGroup.select(lastGroup.total).binder;
   await page.waitForFunction(id=>document.querySelector('#pl-expression h3')?.textContent.endsWith(' · e'+id),destination.node);
   assert.equal(new URL(page.url()).searchParams.get('route'),'0:'+destination.route.slots.join('.'));
   assert.equal(new URL(page.url()).searchParams.get('proof'),example.name);
   const riccati=window.PROOF_ATLAS_LIBRARY.editions.find(e=>e.id==='published-15').declarations.find(r=>r.name==='JacobiData.slope_bound_abs');
   const body=JSON.parse(require('node:zlib').gunzipSync(fs.readFileSync('.'+riccati.indexFile)));
   await page.goto('http://localhost/projects/proof-atlas/library/?edition=published-15&proof='+riccati.name+'&route=1:#expr-'+body.roots[1]);
   await panel.locator('summary').click();
   const regions=require('../../../public/js/proof-atlas-omitted-references').inspect(body,window.PROOF_ATLAS_TYPE_NOTATION,1);
   assert.equal(regions.length,2);
   for(const [i,g] of regions.entries()){
    assert.equal(g.kind,'collapsed');
    const section=panel.locator('section').nth(i);
    await section.getByLabel('Reference').fill(String(g.total));
    await section.getByRole('button',{name:'Trace'}).click();
    const {use,binder}=g.select(g.total),links=section.locator('[aria-live] a');
    for(const [j,hit] of [use,binder].entries()){
     const u=new URL(await links.nth(j).evaluate(a=>a.href));
     assert.equal(u.searchParams.get('route'),'1:'+hit.route.slots.join('.'));
     assert.equal(u.hash,'#expr-'+hit.node);
    }
   }
   const largeRegion=panel.locator('section').last(),scope=largeRegion.locator(':scope > details');
   await scope.locator('summary').click();
   const hd=regions.at(-1).inputs().find(item=>body.payloads[item.binder.node].binderName==='hd');
   assert.equal(hd.count,3n);
   const filter=scope.locator('select');await filter.selectOption(String(hd.index));
   for(const [i,head] of ['mul_pos','JacobiData.T1_T2_same_sign','abs_of_pos'].entries()){
    await largeRegion.getByLabel('Reference',{exact:true}).fill(String(i+1));
    await largeRegion.getByRole('button',{name:'Trace',exact:true}).click();
    const selected=regions.at(-1).select(BigInt(i+1),true,hd.index);
    const expected=require('./use-consumer.cjs')(body,selected.use,{route:{root:1,slots:[]}});
    const callUrl=new URL(await largeRegion.getByRole('link',{name:'Open application',exact:true}).evaluate(a=>a.href));
    assert.equal(expected.head.label,head);
    assert.equal(callUrl.searchParams.get('route'),'1:'+expected.call.route.slots.join('.'));
    if(i===1){
     const peers=largeRegion.locator('details').filter({has:page.getByText(/^Other variable arguments/)});
     await peers.locator('summary').click();
     const labels=await peers.locator('li a:first-child').allTextContents();
     assert.deepEqual(labels,['J','p','hab','hz1','hs']);
    }
   }
   await largeRegion.getByLabel('Reference',{exact:true}).fill('3');
   await largeRegion.getByRole('button',{name:'Trace',exact:true}).click();
   const hdUse=regions.at(-1).select(3n,true,hd.index);
   assert.equal(new URL(await largeRegion.locator('[aria-live] a').first().evaluate(a=>a.href)).searchParams.get('route'),'1:'+hdUse.use.route.slots.join('.'));
   await filter.selectOption('all');await largeRegion.getByLabel('Reference',{exact:true}).fill(String(regions.at(-1).total));
   await largeRegion.getByRole('button',{name:'Trace',exact:true}).click();
   const last=regions.at(-1),use=last.select(last.total).use;
   await panel.locator('section').last().locator('[aria-live] a').first().click();
   await page.waitForFunction(id=>document.querySelector('#pl-expression h3')?.textContent.endsWith(' · e'+id),use.node);
   assert.equal(new URL(page.url()).searchParams.get('route'),'1:'+use.route.slots.join('.'));
   await page.close();
  }
  console.log('Occurrence switching and all 24 omitted references passed at 320 and 1280 pixels.');
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exitCode=1;});
