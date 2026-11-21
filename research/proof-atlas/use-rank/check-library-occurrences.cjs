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
   for(const proof of require('./local-definition-uses.json').se2.filter(r=>r.sharedRows)){
    for(const shared of proof.shared){
     await page.goto('http://localhost/projects/proof-atlas/library/?edition=published-15&proof='+proof.name+'&route=1:'+shared.first.slots.join('.')+'#expr-'+shared.node);
     const summary=page.getByText('Find occurrences of this local definition',{exact:true});
     await summary.click();
     const picker=summary.locator('..');
     await picker.getByLabel('Occurrence number').fill(shared.locations);
     await picker.getByRole('button',{name:'Go to occurrence'}).click();
     await page.waitForFunction(r=>new URL(location).searchParams.get('route')===r,'1:'+shared.last.slots.join('.'));
     assert.equal(new URL(page.url()).hash,'#expr-'+shared.node);
    }
   }
   const window={};
   for(const manifest of ['library-manifest','type-notation-catalog'])
    require('node:vm').runInNewContext(fs.readFileSync('public/data/proof-atlas/'+manifest+'.js','utf8'),{window});
   require('node:vm').runInNewContext(fs.readFileSync('public/data/proof-atlas/goedel-sample-manifest.js','utf8'),{window});
   const aiEdition=window.PROOF_ATLAS_AI_SAMPLE.edition;
   const inputs=aiEdition.declarations.flatMap(record=>{
    const packet=JSON.parse(fs.readFileSync('public/data/proof-atlas/input-roles/'+record.indexSha256+'.json'));
    return packet.entries.map(entry=>({entry,record}));
   });
   const congr=inputs.find(x=>x.record.name==='lean_workbook_3485' && x.entry.depth===0);
   await page.goto('http://localhost/projects/proof-atlas/library/?edition='+aiEdition.id+'&proof='+congr.record.name+'&route=1:#expr-'+congr.entry.node);
   await page.getByText('Where this input is used',{exact:true}).click();
   const power=page.getByRole('link',{name:'HPow.hPow · argument 5 / 6',exact:true}).locator('..');
   await power.getByText('Explore proof branches',{exact:true}).click();
   const call=power.getByRole('link',{name:/Mathlib.Tactic.Ring.Common.add_congr · subtree/});
   const callUrl=new URL(await call.evaluate(a=>a.href));
   const compiledCall={node:Number(callUrl.hash.slice(6)),route:{root:1,slots:callUrl.searchParams.get('route').slice(2).split('.').map(Number)}};
   const congrData=JSON.parse(require('node:zlib').gunzipSync(fs.readFileSync('.'+congr.record.indexFile)));
   assert.deepEqual(await power.locator('meter').evaluateAll(ms=>ms.map(m=>m.value)),[1,1,371,46,2]);
   for(const slot of [4,6,8,9,10]){
    const source=require('../../../public/js/proof-atlas-application-ports').sourceInput(congrData,compiledCall,slot);
    const operand=power.getByRole('link',{name:'Argument '+slot+' of 10',exact:true});
    const u=new URL(await operand.evaluate(a=>a.href));
    assert.equal(u.hash,'#expr-'+source.node);assert.equal(u.searchParams.get('route'),'1:'+source.route.slots.join('.'));
   }
   for(const {entry,record} of [inputs.find(x=>x.entry.count===90194),inputs.find(x=>!x.entry.count)]){
    const prefix=Array(entry.depth).fill(1).join('.');
    const path='http://localhost/projects/proof-atlas/library/?edition='+aiEdition.id+'&proof='+record.name;
    await page.goto(path+'&route=1:'+prefix+'#expr-'+entry.node);
    const title=page.getByText('Where this input is used',{exact:true});
    await title.click();
    const roles=title.locator('..');
    if(!entry.count){
     await roles.getByText('This proof body has no reference to this input.').waitFor();
     assert.equal(await roles.getByRole('link').count(),0);
     continue;
    }
    const first=entry.groups[0];
    await roles.getByText(first.label,{exact:true}).waitFor();
    assert.equal(await roles.getByRole('link').count(),31);
    assert((await roles.innerText()).includes('78,671'));
    const firstRow=roles.locator('li').first();
    await firstRow.getByText('Choose a use',{exact:true}).click();
    const ordinal=firstRow.getByLabel('Use number');
    await ordinal.fill(String(first.count+1));
    assert.equal(await ordinal.evaluate(input=>input.checkValidity()),false);
    await ordinal.fill(String(first.count));
    const source=JSON.parse(require('node:zlib').gunzipSync(fs.readFileSync('.'+record.indexFile)));
    assert(first.role && !first.offsets);
    const roleIndex=require('../../../public/js/proof-atlas-role-occurrences').constantArgumentIndex(source,
     {node:entry.node,route:{root:1,slots:Array(entry.depth).fill(1)}},first.role);
    const last=roleIndex.occurrence(BigInt(first.count));
    const branchTitle=firstRow.getByText('Explore proof branches',{exact:true});
    await branchTitle.click();
    const branchPanel=branchTitle.locator('..'),meters=branchPanel.locator('meter');
    await meters.first().waitFor();
    const sizes=await meters.evaluateAll(ms=>ms.map(m=>m.value));
    assert(sizes.length>1);
    assert.equal(sizes.reduce((a,b)=>a+b,0),first.count);
    const rootLink=branchPanel.getByRole('link').first();
    const parentRoute=new URL(await rootLink.evaluate(a=>a.href)).searchParams.get('route').slice(2);
    const branchPrefix=parentRoute?parentRoute.split('.').map(Number):[];
    let start=1n;
    for(const [j,size] of sizes.entries()){
     const child=branchPanel.locator('li').nth(j).getByRole('link').first();
     const u=new URL(await child.evaluate(a=>a.href)),slots=u.searchParams.get('route').slice(2).split('.').map(Number);
     assert.deepEqual(slots.slice(0,-1),branchPrefix);
     assert.equal(u.hash,'#expr-'+atlas.walk(source,{root:1,slots}));
     for(const n of [start,start+BigInt(size)-1n])
      assert.deepEqual(roleIndex.occurrence(n).route.slots.slice(0,slots.length),slots);
     start+=BigInt(size);
    }
    await branchPanel.getByRole('button',{name:/^Explore /}).first().click();
    await branchPanel.getByRole('button',{name:'Previous branch'}).click();
    assert.deepEqual(await meters.evaluateAll(ms=>ms.map(m=>m.value)),sizes);
    await branchTitle.click();
    assert.notEqual(last.route.slots.join('.'),first.slots);
    await firstRow.getByRole('button',{name:'Open use',exact:true}).click();
    await page.waitForFunction(r=>new URL(location.href).searchParams.get('route')===r,'1:'+last.route.slots.join('.'));
    assert.equal(new URL(page.url()).hash,'#expr-'+last.node);
    await page.locator('#pl-expression').getByRole('button',{name:new RegExp('^Enclosing binder #'+entry.node+' ')}).click();
    await page.waitForFunction(r=>new URL(location.href).searchParams.get('route')===r,'1:'+prefix);
    await title.click();
    await roles.getByRole('link',{name:first.label,exact:true}).click();
    await page.waitForFunction(r=>new URL(location.href).searchParams.get('route')===r,'1:'+first.slots);
    await page.locator('#pl-expression').getByRole('button',{name:new RegExp('^Enclosing binder #'+entry.node+' ')}).click();
    await page.waitForFunction(r=>new URL(location.href).searchParams.get('route')===r,'1:'+prefix);
   }
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
   const published=window.PROOF_ATLAS_LIBRARY.editions.find(e=>e.id==='published-15');
   const injection=published.declarations.find(d=>d.name==='CrossingData.mk.inj');
   const caller=JSON.parse(require('node:zlib').gunzipSync(fs.readFileSync('.'+injection.indexFile)));
   await page.goto('http://localhost/projects/proof-atlas/library/?edition=published-15&proof='+injection.name+'&route=1:#expr-'+caller.roots[1]);
   await page.getByText('Where this input is used',{exact:true}).click();
   const equalityRow=page.getByRole('link',{name:'Eq · argument 2 / 3',exact:true}).locator('..');
   await equalityRow.getByText('Explore proof branches',{exact:true}).click();
   await equalityRow.getByRole('button',{name:'Show declared parameters'}).click();
   const formal=equalityRow.getByRole('link',{name:'P · implicit',exact:true});
   await formal.click();
   await page.waitForFunction(()=>new URL(location.href).searchParams.get('proof')==='CrossingData.mk.noConfusion');
   const formalUrl=new URL(page.url());
   assert.equal(formalUrl.searchParams.get('route'),'0:');assert.equal(formalUrl.hash,'#expr-175');
   await page.locator('#pl-expression h3').filter({hasText:'forallE P'}).waitFor();
   const bodyUrl='http://localhost/projects/proof-atlas/library/?edition=published-15&proof='+riccati.name+'&route=1:#expr-'+body.roots[1];
   await page.goto(bodyUrl);
   const receiverTitle=page.getByText('Where this input is used',{exact:true});
   await receiverTitle.click();
   await page.getByLabel('Proof input').selectOption({label:'5. hd · 3 uses'});
   await page.getByRole('button',{name:'Inspect input',exact:true}).click();
   await page.waitForFunction(()=>new URL(location.href).searchParams.get('route')==='1:1.1.1.1');
   await receiverTitle.click();
   const hdPanel=receiverTitle.locator('..');
   const signLink=hdPanel.getByRole('link',{name:/JacobiData.T1_T2_same_sign/});
   await signLink.waitFor();
   assert.equal(await hdPanel.getByRole('link').count(),3);
   const signRoute=new URL(await signLink.evaluate(a=>a.href)).searchParams.get('route');
   await signLink.click();
   await page.waitForFunction(r=>new URL(location.href).searchParams.get('route')===r,signRoute);
   assert.deepEqual(atlas.binding(body,{root:1,slots:signRoute.slice(2).split('.').map(Number)}).route.slots,[1,1,1,1]);
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
    const chain=largeRegion.locator('details').filter({has:page.getByText('Follow the result',{exact:true})});
    await chain.locator('summary').click();
    const rows=chain.locator('ol > li');
    await rows.first().waitFor();
    assert.equal(await rows.count(),[1,2,6][i]);
    assert.equal(await rows.last().textContent(),['Defines hds','Defines hsum','body of hsum'][i]);
    if(i<2){
     const fixture=require('./local-definition-uses.json').riccati.examples.find(e=>e.name===['hds','hsum'][i]);
     const url=new URL(await rows.last().getByRole('link').evaluate(a=>a.href));
     assert.equal(url.hash,'#expr-'+fixture.node);
     assert.equal(url.searchParams.get('route'),'1:'+fixture.slots.join('.'));
    }
    if(i===1){
     const step=rows.first();
     assert((await step.textContent()).includes('Argument 4 of 6 to Or.casesOn'));
     assert((await step.textContent()).includes('Checked case split on 0 < J.a p'));
     const casePkg=JSON.parse(require('node:zlib').gunzipSync(fs.readFileSync('public/data/proof-atlas/eliminations/published-15-JacobiData_slope_bound_abs.json.gz')));
     const judgment=casePkg.entries.find(e=>e.eliminationJudgment?.recursor==='Or.rec').eliminationJudgment;
     const major=judgment.arguments[judgment.majorSlot-1];
     assert.deepEqual(major.route,expected.call.route);
     for(const rule of judgment.rules){
      const arg=judgment.arguments[judgment.parameters+judgment.motives+rule.minor];
      assert((await step.textContent()).includes(arg.typeText));
      const u=new URL(await step.getByRole('link',{name:rule.constructor,exact:true}).evaluate(a=>a.href));
      assert.equal(u.searchParams.get('route'),'1:'+arg.route.slots.join('.'));assert.equal(u.hash,'#expr-'+arg.node);
     }
    }
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
