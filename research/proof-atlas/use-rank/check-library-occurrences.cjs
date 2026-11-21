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
   // One shared variable row occurs in an equality operand; another returns a let body.
   for(const [proof,slots,node,description,receiver,receiverSlots] of [
    ['lean_workbook_plus_62755','1.1.2.2.0.0.0.0.1.1.0.0.1',104,'Left side of equality',1626,'1.1.2.2.0.0.0.0.1.1.0'],
    ['lean_workbook_plus_54159','1.1.1.1.2',7,'body of',6474,'1.1.1.1']
   ]){
    await page.goto('http://localhost/projects/proof-atlas/library/?edition='+aiEdition.id+'&proof='+proof+'&route=1:'+slots+'#expr-'+node);
    const row=page.locator('#pl-expression p').filter({hasText:'Use of '}).filter({hasText:description});
    const destination=row.getByRole('link').nth(1);
    const u=new URL(await destination.evaluate(a=>a.href));
    assert.equal(u.searchParams.get('route'),'1:'+receiverSlots);
    assert.equal(u.hash,'#expr-'+receiver);
    if(receiver===1626){
     const opposite=new URL(await row.getByRole('link',{name:'Open right side'}).evaluate(a=>a.href));
     assert.equal(opposite.searchParams.get('route'),'1:'+receiverSlots+'.1');
    }
    await destination.click();
    await page.locator('#pl-expression h3').filter({hasText:' · e'+receiver}).waitFor();
   }
   // Both sides share row 1968. Clicking each must retain its distinct source occurrence.
   const eqProof=aiEdition.declarations.find(r=>r.name==='lean_workbook_20418');
   const eqData=JSON.parse(require('node:zlib').gunzipSync(fs.readFileSync('.'+eqProof.indexFile)));
   const eqRoute=atlas.routes(eqData).route(2002);
   for(const [side,suffix] of [['Left',[0,1]],['Right',[1]]]){
    const path=eqRoute.slots.concat(suffix);
    assert.equal(atlas.walk(eqData,{root:eqRoute.root,slots:path}),1968);
    await page.goto('http://localhost/projects/proof-atlas/library/?edition='+aiEdition.id+'&proof='+eqProof.name+'&route='+eqRoute.root+':'+eqRoute.slots.join('.')+'#expr-2002');
    await page.locator('#pl-expression').getByRole('link',{name:new RegExp('^'+side+' side · ')}).click();
    await page.locator('#pl-expression h3').filter({hasText:' · e1968'}).waitFor();
    assert.equal(new URL(page.url()).searchParams.get('route'),eqRoute.root+':'+path.join('.'));
   }
   const trans=atlas.routes(eqData).route(14700);
   const chainUrl='http://localhost/projects/proof-atlas/library/?edition='+aiEdition.id+'&proof='+eqProof.name+'&route='+trans.root+':'+trans.slots.join('.')+'#expr-14700';
   const expected=[14516,14549,14549,14655,14699];
   for(const [index,node] of expected.entries()){
    await page.goto(chainUrl);
    const panel=page.getByRole('region',{name:'Equality chain'});
    const link=panel.getByRole('link').nth(index);
    const slots=trans.slots.concat(Array(4-index).fill(0),1);
    assert.equal(atlas.walk(eqData,{root:trans.root,slots}),node);
    await link.click();
    await page.locator('#pl-expression h3').filter({hasText:' · e'+node}).waitFor();
    assert.equal(new URL(page.url()).searchParams.get('route'),trans.root+':'+slots.join('.'));
   }
   for(const [proofName,row,expected,boundary] of [
    ['lean_workbook_plus_15068',16553,[16369,16379,16389,16399,16409,16419,16429,16543,16545],false],
    ['lean_workbook_20418',86121,[86074,86079,86120],true]
   ]){
    const record=aiEdition.declarations.find(r=>r.name===proofName);
    const data=JSON.parse(require('node:zlib').gunzipSync(fs.readFileSync('.'+record.indexFile)));
    const at=atlas.routes(data).route(row);
    await page.goto('http://localhost/projects/proof-atlas/library/?edition='+aiEdition.id+'&proof='+proofName+'&route='+at.root+':'+at.slots.join('.')+'#expr-'+row);
    const trace=page.getByRole('region',{name:'Equality chain'}).locator(':scope > details');
    await trace.locator(':scope > summary').click();
    const links=trace.getByRole('link',{name:/^Proof /});
    assert.equal(await links.count(),expected.length);
    assert.equal((await trace.innerText()).includes('Different compiled start'),boundary);
    if(boundary){
     const reason=trace.locator('p').filter({hasText:'Different compiled start'});
     await reason.getByRole('link',{name:'Kernel replay record'}).waitFor();
     assert.match(await reason.innerText(),/definitionally equal/);
     for(const [index,node] of [85996,86092,85974,86082].entries()){
      const link=reason.getByRole('link').nth(index);
      const u=new URL(await link.evaluate(a=>a.href)),path=u.searchParams.get('route').split(':');
      assert.equal(atlas.walk(data,{root:Number(path[0]),slots:path[1].split('.').map(Number)}),node);
      assert.equal(u.hash,'#expr-'+node);
     }
    }
    for(const [i,node] of expected.entries()){
     const url=new URL(await links.nth(i).evaluate(a=>a.href));
     const route=url.searchParams.get('route').split(':');
     assert.equal(atlas.walk(data,{root:Number(route[0]),slots:route[1].split('.').map(Number)}),node);
     assert.equal(url.hash,'#expr-'+node);
    }
    await links.last().click();
    await page.locator('#pl-expression h3').filter({hasText:' · e'+expected.at(-1)}).waitFor();
   }
   const certificates=JSON.parse(fs.readFileSync('public/data/proof-atlas/chain-endpoint-conversions.json'));
   const evidenceUrl='**/public/data/proof-atlas/chain-endpoint-conversions.json';
   for(const entry of certificates.entries){
    const record=aiEdition.declarations.find(r=>r.indexSha256===entry.indexSha256);
    const g=JSON.parse(require('node:zlib').gunzipSync(fs.readFileSync('.'+record.indexFile)));
    const slots=entry.call.route.slots;
    const location='http://localhost/projects/proof-atlas/library/?edition='+aiEdition.id+'&proof='+entry.name+'&route=1:'+slots.join('.')+'#expr-'+entry.call.node;
    await page.goto(location);
    const region=page.getByRole('region',{name:'Equality chain'});
    await region.locator(':scope > details > summary').click();
    await region.getByText('Inspect the two joined equalities',{exact:true}).click();
    const items=region.locator('details details ol li');
    assert.equal(await items.count(),2);
    // The nested start is argument 2 of a six-argument Eq.trans.
    const nested=entry.nested.route.slots.slice(0,-5);
    for(const [i,fields] of [[1,2,4],[2,3,5]].entries()){
     const hrefs=await items.nth(i).getByRole('link').evaluateAll(ns=>ns.map(n=>n.href));
     for(const [j,arg] of fields.entries()){
      const suffix=nested.concat(Array(5-arg).fill(0),1),href=new URL(hrefs[j]);
      assert.equal(href.searchParams.get('route'),'1:'+suffix.join('.'));
      assert.equal(href.hash,'#expr-'+atlas.walk(g,{root:1,slots:suffix}));
     }
    }
    if(entry===certificates.entries[0]){
     await page.route(evidenceUrl,r=>r.fulfill({contentType:'application/json',body:'{}'}));
     const rejected=page.waitForResponse(r=>r.url().endsWith('chain-endpoint-conversions.json'));
     await page.reload();await rejected;
     await region.locator(':scope > details > summary').click();
     assert.equal(await region.getByText('Inspect the two joined equalities',{exact:true}).count(),0);
     assert.equal(await region.getByText('Enclosing term',{exact:true}).count(),1);
     await page.unroute(evidenceUrl);
    }
   }
   const nestedEq=atlas.routes(eqData).route(14452);
   for(const [side,prefix,node] of [['Left',[0,1],330],['Right',[1],6]]){
    await page.goto('http://localhost/projects/proof-atlas/library/?edition='+aiEdition.id+'&proof='+eqProof.name+'&route='+nestedEq.root+':'+nestedEq.slots.join('.')+'#expr-14452');
    const detail=page.locator('#pl-expression p').filter({hasText:'First difference in constructor data'});
    await detail.getByRole('link',{name:new RegExp('^'+side+' · ')}).click();
    const path=nestedEq.slots.concat(prefix,0,0,0);
    assert.equal(atlas.walk(eqData,{root:nestedEq.root,slots:path}),node);
    await page.locator('#pl-expression h3').filter({hasText:' · e'+node}).waitFor();
    assert.equal(new URL(page.url()).searchParams.get('route'),nestedEq.root+':'+path.join('.'));
    assert.equal(new URL(page.url()).hash,'#expr-'+node);
   }
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
    const recursor=roles.getByRole('link',{name:'Eq.ndrec · argument 5 / 10',exact:true}).locator('..');
    await recursor.getByText('Explore proof branches',{exact:true}).click();
    const caseSummary=recursor.getByText('Case inputs and selected uses',{exact:true});
    await caseSummary.click();
    const cases=caseSummary.locator('..');
    await cases.getByRole('link',{name:'a = 0 ∨ a = 1 / 2',exact:true}).waitFor();
    const descriptor=window.PROOF_ATLAS_AI_SAMPLE.eliminations.find(d=>d.name===record.name);
    const evidence=JSON.parse(require('node:zlib').gunzipSync(fs.readFileSync('.'+descriptor.file)));
    for(const [ctor,hypothesis] of [['Or.inl','a = 0'],['Or.inr','a = 1 / 2']]){
     const method=cases.getByRole('link',{name:ctor,exact:true});
     const target=new URL(await method.evaluate(a=>a.href));
     const frame=evidence.entries.find(e=>e.route.root===1 && '1:'+e.route.slots.join('.')===target.searchParams.get('route')).lambdaJudgment;
     const expected=frame.domain,branch=method.locator('..');
     assert((await branch.innerText()).includes('1 selected use'));
     const binderLink=branch.getByRole('link',{name:'1 reference to this input',exact:true});
     assert.equal(await binderLink.evaluate(a=>a.href),target.href);
     await branch.getByText('Follow this input',{exact:true}).click();
     const witness=new URL(await branch.getByRole('link',{name:'Use 1',exact:true}).evaluate(a=>a.href));
     const term=JSON.parse(require('node:zlib').gunzipSync(fs.readFileSync('.'+record.indexFile)));
     const binderRoute={root:1,slots:target.searchParams.get('route').slice(2).split('.').map(Number)};
     const expectedUse=require('./model.cjs').open(term,binderRoute).select(1n);
     assert.equal(witness.searchParams.get('route'),'1:'+expectedUse.route.slots.join('.'));
     assert.equal(witness.hash,'#expr-'+expectedUse.node);
     const receiver=require('../../../public/js/proof-atlas-omitted-references').applicationAtUse(term,expectedUse);
     const linkToCall=new URL(await branch.getByRole('link',{name:receiver.label,exact:true}).evaluate(a=>a.href));
     assert.equal(linkToCall.searchParams.get('route'),'1:'+receiver.call.route.slots.join('.'));
     const dest=require('../../../public/js/proof-atlas-omitted-references').resultDestination(term,receiver.call).call;
     if(ctor==='Or.inl'){
      assert.equal(receiver.label,'Eq.symm');assert.equal(dest?.label,'Eq.ndrec');assert.equal(dest.slot,6);
      await branch.getByText('Arguments of Eq.ndrec',{exact:true}).click();
      const positions=branch.locator('ol > li');
      assert.equal(await positions.count(),10);
      await branch.getByRole('link',{name:'7 references to the motive input',exact:true}).waitFor();
      const motiveDetails=branch.getByText('Where the motive input occurs',{exact:true});
      await motiveDetails.click();
      const regions=motiveDetails.locator('..').locator('ul > li');
      await regions.first().waitFor();
      assert.equal(await regions.count(),5);
      const motive=require('../../../public/js/proof-atlas-application-ports').sourceInput(term,dest.call,3);
      const independent=require('./model.cjs').open(term,motive.route);
      for(let j=0;j<5;j++){
       const row=regions.nth(j),domain=row.getByRole('link').first();
       const u=new URL(await domain.evaluate(a=>a.href));
       const slots=motive.route.slots.concat(1,Array(j).fill(1),j<4?[0]:[]);
       assert.equal(u.searchParams.get('route'),'1:'+slots.join('.'));
       const n=independent.interval({root:1,slots}).count;
       assert.equal(n,BigInt([1,2,1,1,2][j]));assert((await row.innerText()).includes(' · '+n+(n===1n?' use':' uses')));
       if(j<4){
        const actual=require('../../../public/js/proof-atlas-application-ports').sourceInput(term,dest.call,7+j);
        const arg=new URL(await row.getByRole('link',{name:'Supplied argument '+(7+j)}).evaluate(a=>a.href));
        assert.equal(arg.searchParams.get('route'),'1:'+actual.route.slots.join('.'));assert.equal(arg.hash,'#expr-'+actual.node);
       }
      }
      for(const [k,label] of ['α','a','motive','m','b','h',null,null,null,null].entries()){
       const title=label?label+' · argument '+(k+1):'Result applied to argument '+(k+1);
       const u=new URL(await positions.nth(k).getByRole('link',{name:title,exact:true}).evaluate(a=>a.href));
       const actual=require('../../../public/js/proof-atlas-application-ports').sourceInput(term,dest.call,k+1);
       assert.equal(u.hash,'#expr-'+actual.node);assert.equal(u.searchParams.get('route'),'1:'+actual.route.slots.join('.'));
      }
     }
     const u=new URL(await branch.getByRole('link',{name:hypothesis,exact:true}).evaluate(a=>a.href));
     assert.equal(u.searchParams.get('route'),'1:'+expected.route.slots.join('.'));
     assert.equal(u.hash,'#expr-'+expected.node);
    }
    const recorded=recursor.getByText('Recorded result at this call',{exact:true});
    await recorded.click();
    const native=recorded.locator('..');
    assert((await native.locator('pre').textContent()).includes('a = 0 ∧ b = 0 ∧ c = 0'));
    await native.getByText('The lambda in this result has no reference to its bound variable.').waitFor();
    const checkedCall=await native.getByRole('link',{name:'Inspect the checked call'}).evaluate(a=>a.href);
    assert.equal(checkedCall,await recursor.getByRole('link',{name:/Or.casesOn · subtree/}).evaluate(a=>a.href));
    await recursor.getByRole('button',{name:'Show declared parameters'}).click();
    await recursor.getByText('inl · explicit',{exact:true}).click();
    const handler=recursor.getByText(/^Or.casesOn · signature binder e27/).locator('..');
    await handler.getByText('Earlier arguments in this parameter type',{exact:true}).click();
    const callAddr=new URL(await recursor.getByRole('link',{name:/Or.casesOn · subtree/}).evaluate(a=>a.href));
    const call={node:Number(callAddr.hash.slice(6)),route:{root:1,slots:callAddr.searchParams.get('route').slice(2).split('.').map(Number)}};
    const term=JSON.parse(require('node:zlib').gunzipSync(fs.readFileSync('.'+record.indexFile)));
    for(const [j,name] of ['a','b','motive'].entries()){
     const u=new URL(await handler.getByRole('link',{name:name+' · argument '+(j+1),exact:true}).evaluate(a=>a.href));
     const expected=require('../../../public/js/proof-atlas-application-ports').sourceInput(term,call,j+1);
     assert.equal(u.searchParams.get('route'),'1:'+expected.route.slots.join('.'));assert.equal(u.hash,'#expr-'+expected.node);
    }
    const result=recursor.getByText('Declared result before substitution',{exact:true});
    await result.click();
    const resultView=result.locator('..');
    assert.equal(await resultView.locator('code').textContent(),'motive t');
    assert.equal(await resultView.getByRole('link').count(),2);
    for(const [slot,name] of [[3,'motive'],[4,'t']]){
     const u=new URL(await resultView.getByRole('link',{name:name+' · argument '+slot,exact:true}).evaluate(a=>a.href));
     const expected=require('../../../public/js/proof-atlas-application-ports').sourceInput(term,call,slot);
     assert.equal(u.searchParams.get('route'),'1:'+expected.route.slots.join('.'));assert.equal(u.hash,'#expr-'+expected.node);
    }
    await recursor.getByText('Explore proof branches',{exact:true}).click();
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
   for(const [g,edition,name,id] of [[body,'published-15',riccati.name,2358],[body,'published-15',riccati.name,3219],[eqData,aiEdition.id,eqProof.name,2024]]){
    const at=atlas.routes(g).route(id);
    await page.goto('http://localhost/projects/proof-atlas/library/?edition='+edition+'&proof='+name+'&route='+at.root+':'+at.slots.join('.')+'#expr-'+id);
    const panel=page.getByRole('region',{name:'Equality under a function'});
    await panel.waitFor();
    const rule=panel.locator('p').first();
    const hrefs=await rule.getByRole('link').evaluateAll(ns=>ns.map(n=>n.href));
    const source=require('../../../public/js/proof-atlas-application-ports').sourceInput;
    const verify=(href,input)=>{
     const url=new URL(href);
     assert.equal(url.hash,'#expr-'+input.node);
     assert.equal(url.searchParams.get('route'),input.route.root+':'+input.route.slots.join('.'));
    };
    assert.equal(hrefs.length,6);
    [3,4,5,3,5,4].forEach((slot,index)=>verify(hrefs[index],source(g,{node:id,route:at},slot)));
    const premise=panel.getByRole('link',{name:/^Proof of a = b/});
    verify(await premise.evaluate(a=>a.href),source(g,{node:id,route:at},6));
    const fn=source(g,{node:id,route:at},5);
    if(g.kind[fn.node]===6){
     const use=panel.getByRole('link',{name:'First parameter use'});
     const url=new URL(await use.evaluate(a=>a.href)),slots=url.searchParams.get('route').split(':')[1].split('.').map(Number);
     assert.deepEqual(atlas.binding(g,{root:at.root,slots}),fn);
     if(edition==='published-15'){
      const formula=panel.locator('p').filter({hasText:'Function context'});
      assert.equal(await formula.innerText(),id===2358?'Function context: x ↦ (s2 ≤ (x / s1))':
       'Function context: x ↦ ((s1 · √(x)) ≤ s2)');
      verify(await formula.getByRole('link',{name:'x',exact:true}).evaluate(a=>a.href),
       {node:atlas.walk(g,{root:at.root,slots}),route:{root:at.root,slots}});
      const call=panel.getByRole('link',{name:id===2358?'HDiv.hDiv':'Real.sqrt',exact:true});
      const receiver=require('../../../public/js/proof-atlas-omitted-references').applicationAtUse(g,
       {node:atlas.walk(g,{root:at.root,slots}),route:{root:at.root,slots}});
      verify(await call.evaluate(a=>a.href),receiver.call);
     }
     await use.click();await page.waitForURL(url.href);
    }
   }
   const published=window.PROOF_ATLAS_LIBRARY.editions.find(e=>e.id==='published-15');
   const crossing=published.declarations.find(r=>r.name==='CrossingData.exists_branch');
   const crossingData=JSON.parse(require('node:zlib').gunzipSync(fs.readFileSync('.'+crossing.indexFile)));
   for(const [node,expected] of [[3956,'Function context: x ↦ @Membership.mem(s4, s5, s6, @Set.Icc(s1, s2, x, s3), s7)'],[3035,'Function context: x ↦ x']]){
    const at=atlas.routes(crossingData).route(node);
    await page.goto('http://localhost/projects/proof-atlas/library/?edition=published-15&proof='+crossing.name+'&route='+at.root+':'+at.slots.join('.')+'#expr-'+node);
    if(node===3956){
     const congr=page.getByRole('region',{name:'Equality under a function'});
     const trail=congr.locator('p').filter({hasText:'From the parameter outward'});
     await trail.waitFor();
     assert.deepEqual(await trail.getByRole('link').allTextContents(),['Set.Icc','Membership.mem']);
     assert.deepEqual(await trail.getByRole('link').evaluateAll(ns=>ns.map(n=>new URL(n.href).hash)),['#expr-3949','#expr-3951']);
     await congr.getByText('Show compiled arguments',{exact:true}).click();
    }
    await page.getByRole('region',{name:'Equality under a function'}).getByText(expected,{exact:false}).waitFor();
   }
   const quantified=published.declarations.find(r=>r.name==='JacobiFull.c_strictAntiOn');
   const quant=JSON.parse(require('node:zlib').gunzipSync(fs.readFileSync('.'+quantified.indexFile)));
   const quantAt=atlas.routes(quant).route(465);
   await page.goto('http://localhost/projects/proof-atlas/library/?edition=published-15&proof='+quantified.name+'&route='+quantAt.root+':'+quantAt.slots.join('.')+'#expr-465');
   const summary=page.getByText('Trace parameter through binders',{exact:true});
   await summary.click();
   const traceBinder=summary.locator('..');
   const readAnchor=async link=>{
    const u=new URL(await link.evaluate(a=>a.href)),[root,path]=u.searchParams.get('route').split(':');
    const at={node:Number(u.hash.slice(6)),route:{root:Number(root),slots:path.split('.').map(Number)}};
    assert.equal(atlas.walk(quant,at.route),at.node);
    return at;
   };
   for(const [field,slot] of [['Open domain',0],['Open body',1]]){
    const sibling=traceBinder.getByRole('link',{name:field,exact:true});
    const at=await readAnchor(sibling);
    const binder=await readAnchor(sibling.locator('..').getByRole('link').first());
    assert.deepEqual(at.route.slots,binder.route.slots.concat(slot));
   }
   const occurrence=await readAnchor(traceBinder.getByRole('link',{name:'Parameter occurrence'}));
   assert.deepEqual(atlas.binding(quant,occurrence.route),await readAnchor(traceBinder.getByRole('link',{name:'Original parameter binder'})));
   const unsupported=published.declarations.find(r=>r.name==='JacobiFull.signed_β1_neg_odd');
   const raw=JSON.parse(require('node:zlib').gunzipSync(fs.readFileSync('.'+unsupported.indexFile)));
   const unsupportedAt=atlas.routes(raw).route(892);
   await page.goto('http://localhost/projects/proof-atlas/library/?edition=published-15&proof='+unsupported.name+'&route='+unsupportedAt.root+':'+unsupportedAt.slots.join('.')+'#expr-892');
   await page.getByText('The operator context is unavailable for this path.',{exact:false}).waitFor();
   const periodic=published.declarations.find(r=>r.name==='JacobiPeriodic.exists_unique_f1_zero');
   const periodicData=JSON.parse(require('node:zlib').gunzipSync(fs.readFileSync('.'+periodic.indexFile)));
   for(const [row,formula] of [[6570,'(s1(x) = s2)'],[2514,'(x(s1) = s2)']]){
    const at=atlas.routes(periodicData).route(row);
    await page.goto('http://localhost/projects/proof-atlas/library/?edition=published-15&proof='+periodic.name+'&route='+at.root+':'+at.slots.join('.')+'#expr-'+row);
    const panel=page.getByRole('region',{name:'Equality under a function'});
    await panel.getByText('Function context: x ↦ '+formula,{exact:true}).waitFor();
    const parse=async link=>{
     const u=new URL(await link.evaluate(a=>a.href)),[root,slots]=u.searchParams.get('route').split(':');
     return {node:Number(u.hash.slice(6)),route:{root:Number(root),slots:slots.split('.').map(Number)}};
    };
    const head=await parse(panel.getByRole('link',{name:'Function occurrence',exact:true}));
    const owner=await parse(panel.getByRole('link',{name:/^Binder of /}));
    assert.equal(atlas.walk(periodicData,head.route),head.node);
    assert.deepEqual(owner,atlas.binding(periodicData,head.route));
    const param=await parse(panel.getByRole('link',{name:'First parameter use'}));
    assert.equal(JSON.stringify(param.route)===JSON.stringify(head.route),row===2514);
    const call=await parse(panel.getByRole('link',{name:'Open application',exact:true}));
    assert.deepEqual(head.route.slots,call.route.slots.concat(0));
    assert.equal(atlas.walk(periodicData,call.route),call.node);
   }
   const repeated=published.declarations.find(r=>r.name==='JacobiCore.Sol.eq_of_eq_at');
   const graph=JSON.parse(require('node:zlib').gunzipSync(fs.readFileSync('.'+repeated.indexFile)));
   const repeatAt={node:1462,route:atlas.routes(graph).route(1462)};
   const fnArg=require('../../../public/js/proof-atlas-application-ports').sourceInput(graph,repeatAt,5);
   const paths=[];
   function walkFn(node,slots){
    if(graph.kind[node]===0 && atlas.binding(graph,{root:fnArg.route.root,slots}).route.slots.join('.')===fnArg.route.slots.join('.'))
     paths.push(slots);
    graph.children[node].forEach((c,i)=>walkFn(c,slots.concat(i)));
   }
   walkFn(graph.children[fnArg.node][1],fnArg.route.slots.concat(1));
   assert.equal(paths.length,6);
   await page.goto('http://localhost/projects/proof-atlas/library/?edition=published-15&proof='+repeated.name+'&route='+repeatAt.route.root+':'+repeatAt.route.slots.join('.')+'#expr-1462');
   const selector=page.getByRole('region',{name:'Equality under a function'});
   const input=selector.getByLabel('Parameter use number');
   await input.fill('7');await selector.getByRole('button',{name:'Find use'}).click();
   assert.equal(await input.evaluate(i=>i.checkValidity()),false);
   for(const [index,slots] of paths.entries()){
    await input.fill(String(index+1));await selector.getByRole('button',{name:'Find use'}).click();
    const href=new URL(await selector.getByRole('link',{name:'Open use '+(index+1),exact:true}).evaluate(a=>a.href));
    assert.equal(href.searchParams.get('route'),fnArg.route.root+':'+slots.join('.'));
    assert.equal(href.hash,'#expr-'+atlas.walk(graph,{root:fnArg.route.root,slots}));
   }
   const range=published.declarations.find(d=>d.name==='CrossingData.branch_range');
   const rangeData=JSON.parse(require('node:zlib').gunzipSync(fs.readFileSync('.'+range.indexFile)));
   const rangeNode=atlas.walk(rangeData,{root:1,slots:[1]});
   await page.goto('http://localhost/projects/proof-atlas/library/?edition=published-15&proof='+range.name+'&route=1:1#expr-'+rangeNode);
   await page.getByText('Where this input is used',{exact:true}).click();
   const branchRow=page.getByRole('link',{name:'CrossingData.branch · argument 2 / 3',exact:true}).locator('..');
   await branchRow.getByText('Explore proof branches',{exact:true}).click();
   await branchRow.getByRole('button',{name:'Show declared parameters'}).click();
   await branchRow.getByText('a · explicit',{exact:true}).click();
   await branchRow.getByText(/^And · signature binder e2/).waitFor();
   assert((await branchRow.innerText()).includes('Signature SHA-256 '));
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
