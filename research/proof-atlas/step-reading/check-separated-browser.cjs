// Exercise the repository's library page with a test-only edition served by Playwright.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {gzipSync} = require('node:zlib');
const {chromium} = require('playwright');
const A = require('../../../public/js/proof-atlas-library-data');
const repo = path.resolve(__dirname,'../../..');
const graph = JSON.parse(fs.readFileSync(0,'utf8'));
const name = graph.name || 'separatedAssumptions';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const expanded = [];
for (const children of graph.children) expanded.push(1+children.reduce((n,c)=>n+expanded[c],0));
const declaration = {name,kind:'theorem',kernelCheck:'PASS',bodyAvailable:true,rootPaths:['root.type','root.value']};
const bytes = Buffer.from(JSON.stringify({...graph,declaration,serialization:'ExprDAG/1',dependencies:[],expanded:expanded.map(String)}));
const [typeOccurrences,proofOccurrences] = graph.roots.map(i=>expanded[i]);
const file = '/control.json.gz';
const record = {...declaration,module:'SeparatedAssumptions',uniqueNodes:expanded.length,typeOccurrences,proofOccurrences,
  occurrences:typeOccurrences+proofOccurrences,indexFile:file,file,indexSha256:hash(bytes),
  sourceSha256:hash(fs.readFileSync(path.join(__dirname,'SeparatedAssumptions.lean'))),axioms:[]};
const constructors = {};
for (const k of graph.kind) constructors[A.kinds[k]]=(constructors[A.kinds[k]]||0)+1;
const edition = {id:'browser-control',modules:{SeparatedAssumptions:{}},edges:[],declarations:[record],
  counts:{modules:1,declarations:1,theorems:1,bodies:1,uniqueNodes:expanded.length,constructors}};
const libraryPath='/projects/proof-atlas/library/';
const pageHtml=fs.readFileSync(path.join(repo,libraryPath,'index.html'),'utf8').split('---').slice(2).join('---')
  .replace('{% include proof-atlas-compiled-workspace.html %}',fs.readFileSync(path.join(repo,'_includes/proof-atlas-compiled-workspace.html'),'utf8'));
// Record visible glyph centers at draw time. Click through the real canvas hit tester.
async function enableCanvasProbe(page) {
  await page.addInitScript(() => {
    const proto=CanvasRenderingContext2D.prototype;
    const fillRect=proto.fillRect, fillText=proto.fillText;
    window.glyphCenters=[];
    proto.fillRect=function(x,y,w,h) {
      if (this.canvas.id==='pl-canvas' && x===0 && y===0) window.glyphCenters=[];
      return fillRect.call(this,x,y,w,h);
    };
    proto.fillText=function(text,x,y,...rest) {
      if (this.canvas.id==='pl-canvas' && this.font.startsWith('bold 12px'))
        window.glyphCenters.push({x,y:y-4});
      return fillText.call(this,text,x,y,...rest);
    };
  });
}

async function clickDrawnOccurrence(page,slots,context=false) {
  const path=await page.evaluate(slots=>window.ProofAtlasLibraryData.path(window.ProofAtlasLibrary.getData(),{root:1,slots}),slots);
  const canvas=page.locator('#pl-canvas');
  await canvas.scrollIntoViewIfNeeded();
  const positions=await page.evaluate(()=>window.glyphCenters.slice());
  for (const position of positions) {
    await canvas.hover({position});
    const title=await canvas.getAttribute('title');
    if (context ? title==='Context binder · '+path : title?.includes(' · '+path+' · ')) {
      await canvas.click({position});
      await page.waitForFunction(expected=>JSON.stringify(window.ProofAtlasLibrary.getSnapshot()?.route)===expected,
        JSON.stringify({root:1,slots}));
      return;
    }
  }
  throw Error('No selectable canvas glyph at '+path);
}
async function main() {
  const browser=await chromium.launch({executablePath:process.env.ATLAS_CHROMIUM_PATH});
  try {
    const page=await browser.newPage();
    await enableCanvasProbe(page);
    const errors=[];
    page.on('pageerror',err=>errors.push(err.message));
    await page.route('**/*',route=>{
      const url=new URL(route.request().url());
      const p=url.pathname;
      if (url.origin!=='http://localhost') return route.abort();
      if (p===libraryPath) return route.fulfill({contentType:'text/html; charset=utf-8',body:pageHtml});
      if (p===file) return route.fulfill({body:gzipSync(bytes)});
      if (p==='/public/data/proof-atlas/library-manifest.js' && page.url().includes('browser-control')) return route.fulfill({
        contentType:'application/javascript',body:'window.PROOF_ATLAS_LIBRARY='+JSON.stringify({editions:[edition]})});
      if (p.startsWith('/public/') && fs.existsSync(path.join(repo,p))) return route.fulfill({path:path.join(repo,p)});
      return route.fulfill({status:404});
    });
    const body='http://localhost'+libraryPath+'?edition=browser-control&proof='+name+'&route=1%3A#expr-'+graph.roots[1];
    if(name==='distinctPremises'){
      const url=new URL(body);
      url.searchParams.set('geometry','scoped');url.searchParams.set('fold','applications');
      const call=[1,1,1];
      url.searchParams.set('route','1:'+call.join('.'));url.hash='';
      for(const [index,binderName] of ['first','second'].entries()){
        await page.goto(url.href);
        const panel=page.locator('#pl-application-headers details').first();
        await panel.locator('summary').click();
        const row=panel.locator('ol > li').nth(2+index);
        assert.equal(await row.getByRole('button',{name:/^Defining value/}).count(),0);
        const binderSlots=Array(index+1).fill(1);
        const use=call.concat(index===0?[0,1]:[1]);
        assert.deepEqual(A.binding(graph,{root:1,slots:use}).route.slots,binderSlots);
        assert.deepEqual(A.binding(graph,{root:1,slots:binderSlots.concat(0)}).route.slots,[]);
        await row.getByRole('button',{name:'Binder · '+binderName,exact:true}).click();
        const selected=await page.evaluate(()=>window.ProofAtlasLibrary.getSnapshot());
        assert.deepEqual(selected.route,{root:1,slots:binderSlots});
        assert.equal(graph.payloads[selected.selected].binderName,binderName);
      }
      assert.deepEqual(errors,[]);
      console.log('Both P premises opened their separate introducing binders.');
      return;
    }
    for (const width of [1280,390]) {
      await page.setViewportSize({width,height:850});
      for (const branch of [[1,0,1],[1,1]]) for (const premise of [[1,0,1],[1,1]]) {
        await page.goto(body);
        const fields=page.locator('#pl-expression .pl-actions').first();
        for (const slot of branch.concat(premise)) {
          await fields.locator('button').nth(slot).click();
        }
        const snapshot=()=>page.evaluate(()=>window.ProofAtlasLibrary.getSnapshot());
        const ref=await snapshot();
        assert.deepEqual(ref.route,{root:1,slots:branch.concat(premise)});
        const owner=A.binding(graph,ref.route);
        const jump=fields.getByRole('button',{name:/^Enclosing binder/});
        if (width===390) await jump.click();
        else {await jump.focus(); await page.keyboard.press('Enter');}
        const selected=await snapshot();
        assert.deepEqual(selected.route,{root:1,slots:branch});
        assert.equal(selected.selected,owner.node);
        assert.equal(new URL(page.url()).searchParams.get('route'),'1:'+branch.join('.'));
        await page.reload();
        await page.waitForFunction(()=>window.ProofAtlasLibrary?.getSnapshot());
        assert.deepEqual((await snapshot()).route,selected.route);
      }
      for (const branch of [[1,0,1],[1,1]]) for (const premise of [[1,0,1],[1,1]]) {
        const url=new URL(body);
        url.searchParams.set('geometry','scoped');
        url.searchParams.set('fold','binders,applications');
        await page.goto(url.href);
        await page.waitForFunction(()=>window.ProofAtlasLibrary?.getScene()?.nodes?.some(n=>n.abstraction==='application-spine') && window.glyphCenters.length);
        await clickDrawnOccurrence(page,branch);
        await clickDrawnOccurrence(page,branch.concat(premise));
        await clickDrawnOccurrence(page,branch,true);
        assert.equal(new URL(page.url()).searchParams.get('route'),'1:'+branch.join('.'));
      }
    }
    // Open the original corpus packet at the checked multiplication call.
    const published=new URL('https://moiseevigor.github.io/projects/proof-atlas/library/?edition=goedel-sample-4331&proof=lean_workbook_20418&route=1%3A1.1.1.1.1.1.1.2.1.1.1.1.1.1.1.1.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.0.1.1.0.1.1#expr-57669');
    const example=new URL(libraryPath+published.search+published.hash,'http://localhost');
    example.searchParams.set('geometry','scoped');
    example.searchParams.set('fold','applications');
    const callSlots=published.searchParams.get('route').split(':')[1].split('.').map(Number);
    for (const slot of [10,11]) {
      await page.goto(example.href);
      const call=page.locator('#pl-application-headers details').first();
      await call.locator('summary').click();
      const rows=call.locator('ol > li');
      assert.equal(await rows.count(),11);
      assert.equal(await rows.nth(10).locator('[data-shared-argument]').innerText(),'Same compiled term as argument 10 · e42907');
      const port=rows.nth(slot-1).locator('[data-application-argument]');
      console.log('Argument',slot,'recorded role:',await port.getAttribute('data-argument-role'));
      await port.click();
      const selected=await page.evaluate(()=>window.ProofAtlasLibrary.getSnapshot());
      assert.equal(selected.selected,42907);
      assert.deepEqual(selected.route,{root:1,slots:callSlots.concat(slot===10?[0,1]:[1])});
    }
    for (const slot of [1,6,10,11]) {
      await page.goto(example.href);
      const range=page.locator('#pl-window-range');
      await page.getByText('Arguments 7–11 of 11',{exact:true}).waitFor();
      assert.equal(await page.locator('#pl-window-outside').innerText(),'Other slots: roles unavailable');
      if (slot<=6) await page.locator('#pl-earlier-arguments').click();
      if (slot===1) await page.locator('#pl-earlier-arguments').click();
      if (slot===11) {
        await page.locator('#pl-earlier-arguments').click();
        await page.locator('#pl-later-arguments').click();
      }
      const expectedRange=slot===1?'1–5':slot===6?'2–6':'7–11';
      assert.equal(await range.innerText(),'Arguments '+expectedRange+' of 11');
      const route=callSlots.concat(Array(11-slot).fill(0),1);
      await clickDrawnOccurrence(page,route);
      const selected=await page.evaluate(()=>window.ProofAtlasLibrary.getSnapshot());
      assert.deepEqual(selected.route,{root:1,slots:route});
      if(slot>=10) assert.equal(selected.selected,42907);
    }
    const wide=new URL(example.href);
    wide.searchParams.set('edition','published-15');
    wide.searchParams.set('proof','SBracket.mk.inj');
    const wideRoute=Array(57).fill(1);
    wide.searchParams.set('route','1:'+wideRoute.join('.'));
    wide.hash='';
    await page.goto(wide.href);
    await page.getByText('Arguments 55–59 of 59',{exact:true}).waitFor();
    const union=require('../recorded-union.cjs');
    const {measure}=require('./ai-inference-traces.cjs');
    const wideItem=union.inventory().find(i=>i.edition==='published-15' && i.record.name==='SBracket.mk.inj');
    let proofSlots,proofStatements;
    await measure(wideItem,null,(inputs,n)=>{
      const last=inputs.find(input=>input.position===n);
      if(n===59 && JSON.stringify(last.route)===JSON.stringify(wideRoute.concat(1))){
        proofStatements=inputs.filter(input=>input.role==='proof').sort((a,b)=>a.position-b.position);
        proofSlots=proofStatements.map(input=>input.position);
      }
    });
    assert.equal(proofSlots.length,44);
    const choices=await page.locator('#pl-window-choice option').evaluateAll(nodes=>nodes.map(n=>[Number(n.value),n.textContent]));
    assert.equal(choices.length,12);
    for(const [offset,label] of choices){
      const count=proofSlots.filter(i=>i>offset && i<=offset+5).length;
      assert.equal(label,(offset+1)+'–'+(offset+5)+' · '+count+' checked proof '+(count===1?'input':'inputs'));
    }
    assert.equal(await page.locator('#pl-window-outside').innerText(),'39 checked proof inputs outside view');
    await page.getByLabel('Jump to slots').selectOption('0');
    await page.getByText('Arguments 1–5 of 59',{exact:true}).waitFor();
    assert.equal(await page.locator('#pl-window-outside').innerText(),'43 checked proof inputs outside view');
    await clickDrawnOccurrence(page,wideRoute.concat(Array(55).fill(0),1));
    await page.goto(wide.href);
    const wideDetails=page.locator('#pl-application-headers details').first();
    await wideDetails.locator('summary').click();
    const search=wideDetails.getByLabel('Find a checked proposition');
    assert.deepEqual(await wideDetails.locator('.pl-argument-statement').allTextContents(),proofStatements.map(p=>p.statement));
    await search.fill('absent-test-string');
    assert.equal(await wideDetails.locator('li:visible').count(),0);
    await search.fill('');
    assert.equal(await wideDetails.locator('li:visible').count(),59);
    await search.fill('0 < K✝');
    const positivity=wideDetails.locator('li:visible').filter({has:page.getByText('0 < K✝',{exact:true})});
    await positivity.locator('[data-application-argument]').click();
    const picked=await page.evaluate(()=>window.ProofAtlasLibrary.getSnapshot());
    assert.deepEqual(picked.route.slots,wideRoute.concat(Array(55).fill(0),1));
    const rewrite=new URL(wide.href), rewriteRoute=[1,1,1,1,1,1,2,2,2,2,2,2];
    rewrite.searchParams.set('proof','JacobiData.slope_bound_abs');
    rewrite.searchParams.set('route','1:'+rewriteRoute.join('.'));
    await page.goto(rewrite.href);
    const rewriteList=page.locator('#pl-application-headers details').first();
    await rewriteList.locator('summary').click();
    await rewriteList.getByLabel('Find a checked proposition').fill('2 * √(J.z p * (1 - J.z p) * J.Dz p) ≤ |J.T1 p + J.T2 p| / |J.d p * J.s p|');
    assert.equal(await rewriteList.locator('li:visible').count(),2);
    await rewriteList.getByLabel('Whole statement').check();
    const unique=rewriteList.locator('li:visible');
    assert.equal(await unique.count(),1);
    await unique.locator('[data-application-argument]').click();
    assert.deepEqual((await page.evaluate(()=>window.ProofAtlasLibrary.getSnapshot())).route,{root:1,slots:rewriteRoute.concat(1)});
    const transportRoute=[1,1,1,1,1,1,2,2,2,2,2,2,1,1,1,1,1,1,1,1,1,0,1,1,1,1];
    rewrite.searchParams.set('route','1:'+transportRoute.join('.'));
    rewrite.hash='expr-3221';
    await page.goto(rewrite.href);
    const transport=page.locator('#pl-application-headers details').first();
    await transport.locator('summary').click();
    const fourth=transport.locator('ol > li').nth(3);
    await fourth.getByRole('button',{name:/^Defining value/}).click();
    const producer=await page.evaluate(()=>window.ProofAtlasLibrary.getSnapshot());
    assert.equal(producer.selected,1227);
    assert.deepEqual(producer.route,{root:1,slots:[1,1,1,1,1,1,2,2,2,2,1]});
    assert.deepEqual(errors,[]);
    console.log('Four inspector paths and four folded canvas paths passed at both widths.');
  } finally {await browser.close();}
}
main().catch(err=>{console.error(err);process.exitCode=1;});
