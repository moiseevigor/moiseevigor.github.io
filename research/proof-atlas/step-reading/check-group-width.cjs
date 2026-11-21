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
        assert.match(await ports.nth(i+1).innerText(),new RegExp("^Argument "+input.slot+" · "+["x","y","hx","hy"][input.slot-1]+" · "));
        const statement=ports.nth(i+1).locator('[data-proof-input-statement]');
        assert.deepEqual(await statement.allTextContents(),input.role==='proof'?[input.type]:[]);
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
        assert.match(await ports.nth(i+1).innerText(),new RegExp("^Argument "+input.slot+" · "+["x","y","hx","hy"][input.slot-1]+" · "));
        const statement=ports.nth(i+1).locator('[data-proof-input-statement]');
        assert.deepEqual(await statement.allTextContents(),input.role==='proof'?[input.type]:[]);
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
        assert.match(await ports.nth(i+1).innerText(),new RegExp("^Argument "+input.slot+" · "+["x","y","hx","hy"][input.slot-1]+" · "));
        const statement=ports.nth(i+1).locator('[data-proof-input-statement]');
        assert.deepEqual(await statement.allTextContents(),input.role==='proof'?[input.type]:[]);
        await checkRoute(i+1,packed.encode(input.route.root,input.route.slots));
      }
      const disclosure=group.locator('[data-callee-uses="JacobiData.two_sqrt_mul_le_add"]');
      await disclosure.locator('summary').click();
      const hx=disclosure.locator('li').filter({has:page.getByRole('link',{name:'Parameter 3',exact:true})});
      const binderURL=new URL(await hx.getByRole('link',{name:'Parameter 3',exact:true}).getAttribute('href'),url);
      assert.equal(binderURL.hash,'#expr-1945');
      const use=hx.getByRole('link',{name:'First of 2 uses'});
      const useURL=new URL(await use.getAttribute('href'),url);
      await use.click();
      await page.waitForFunction(expected=>{
        const s=window.ProofAtlasLibrary?.getSnapshot();
        return s?.name==='JacobiData.two_sqrt_mul_le_add' && s.edition==='published-15' &&
          s.selected===expected.node && s.route.root+':'+s.route.slots.join('.')===expected.route;
      },{node:Number(useURL.hash.slice(6)),route:useURL.searchParams.get('route')});
      await page.goto(url);
      await page.route('**/callee-uses/*.json*',r=>r.fulfill({json:{edition:'published-15',records:[]}}));
      await disclosure.locator('summary').click();
      await disclosure.getByText('No parameter-use index for this compiled declaration.').waitFor();
      assert.equal(await disclosure.locator('a').count(),0);
      await page.unroute('**/callee-uses/*.json*');
      const signatureExample=new URL(url);
      signatureExample.searchParams.set('proof','JacobiCore.E_pos');
      signatureExample.hash='occurrence=42c5264d2680fe256ee4bfc588ed1ed3d648f38eeb56916d2e1ce02e11ae0c33.1.8.CUQ';
      await page.goto(signatureExample.href);
      const eps=group.locator('[data-callee-uses="JacobiCore.eps"]');
      await eps.locator('summary').click();
      const typeParameter=eps.getByRole('link',{name:'Declaration type, parameter 2',exact:true});
      assert.match(await typeParameter.locator('..').innerText(),/beyond the leading body parameters/);
      await typeParameter.click();
      await page.waitForFunction(()=>{
        const s=window.ProofAtlasLibrary?.getSnapshot();
        return s?.name==='JacobiCore.eps' && s.edition==='published-15' && s.selected===2 &&
          s.route.root===0 && s.route.slots.join('.')==='1';
      });
      signatureExample.hash='occurrence=42c5264d2680fe256ee4bfc588ed1ed3d648f38eeb56916d2e1ce02e11ae0c33.1.2.BQ';
      await page.goto(signatureExample.href);
      const monotone=group.locator('[data-callee-uses="JacobiCore.eps_strictMono"]');
      await monotone.locator('summary').click();
      for(const [i,role] of ['first point','second point','order premise'].entries()){
        const slot=i+2;
        const button=monotone.getByRole('button',{name:'Inspect caller argument '+slot+' type',exact:true});
        assert((await button.locator('..').innerText()).includes('Argument '+slot+' · '+role+' in StrictMono.'));
        await button.click();
        const expected=require('./residual-stages.json').find(s=>s.slot===slot);
        await page.waitForFunction(s=>{
          const t=window.ProofAtlasOccurrenceView.getTypeScene(),r=t?.origin.sourceRoute;
          return t?.root.node===s.actualTypeRoot && r.root===s.argument.root &&
            r.depth===s.argument.depth && r.slots===s.argument.slots;
        },expected);
      }
      await page.waitForFunction(()=>{
        const t=window.ProofAtlasOccurrenceView.getTypeScene();
        return t?.root.node===68 && t.origin.sourceRoute.root===1 && t.origin.sourceRoute.depth===3 &&
          t.origin.sourceRoute.slots==='FQ';
      });
      await monotone.getByRole('link',{name:'Declared result · StrictMono',exact:true}).click();
      await page.waitForFunction(()=>{
        const s=window.ProofAtlasLibrary?.getSnapshot();
        return s?.name==='JacobiCore.eps_strictMono' && s.edition==='published-15' && s.selected===11 &&
          s.route.root===0 && s.route.slots.join('.')==='1';
      });
      const paged=new URL(url);
      paged.searchParams.delete('group');paged.searchParams.set('loading','paged');
      const requested=[];
      page.on('request',request=>requested.push(new URL(request.url()).pathname));
      await page.goto(paged.href);
      for(const proof of call.inputs.filter(input=>input.role==='proof')){
        const caption=page.locator('[data-construction-field="arg"] [data-proof-input-statement]').filter({hasText:proof.type});
        await caption.waitFor();
        const origin=await caption.getAttribute('data-caption-origin');
        assert(origin);
        assert.equal(await page.locator('[data-recorded-caption][data-caption-origin="'+origin+'"]').textContent(),proof.type);
        await caption.click();
        await page.waitForFunction(r=>{
          const s=window.ProofAtlasOccurrenceView.getSnapshot();
          return s.route.root===r.root && s.route.depth===r.depth && s.route.slots===r.slots;
        },packed.encode(proof.route.root,proof.route.slots));
      }
      assert(!requested.some(path=>path.includes('/library/published-15/')&&path.endsWith('.json.gz')));
      const ai=new URL(url);
      ai.searchParams.set('edition','goedel-sample-4331');ai.searchParams.set('proof','lean_workbook_20418');
      ai.hash='occurrence=8892b0884f374abfa704f50ac89a3c31872a9d3f1aef369b1ae84e44891bde8d.1.18.VZVaAAA';
      await page.goto(ai.href);
      await group.getByRole('button',{name:/^Read proposition for argument /}).last().click();
      await page.waitForFunction(()=>{
        const type=window.ProofAtlasOccurrenceView.getTypeScene(),route=type?.origin.sourceRoute;
        return type?.root.node===256 && route.root===1 && route.depth===19 && route.slots==='VZVaABA';
      });
      ai.searchParams.delete('group');ai.searchParams.set('loading','paged');
      await page.goto(ai.href);
      await page.waitForFunction(()=>window.ProofAtlasOccurrenceView?.getCaptionState().status==='ready');
      const rootCard=page.locator('article').filter({has:page.locator('[data-construction-point="n0"]')});
      const longPort=rootCard.locator('[data-construction-field="arg"]');
      assert.equal(await longPort.count(),1);
      assert.equal(await longPort.locator('[data-proof-input-statement]').count(),0);
      await longPort.click();
      await page.waitForFunction(()=>{
        const s=window.ProofAtlasOccurrenceView.getSnapshot();
        return s.route.depth===19 && s.route.slots==='VZVaABA';
      });
      async function checkProofFocus(control,route,node){
        await control.click();
        await page.waitForFunction(({route,node})=>{
          const view=window.ProofAtlasOccurrenceView;
          const root=view?.getScene()?.root;
          return root?.node===node && root.route.root===route.root && root.route.depth===route.depth &&
            root.route.slots===route.slots && location.hash.endsWith('.'+route.depth+'.'+route.slots);
        },{route,node});
      }
      await checkProofFocus(rootCard.locator('[data-open-proof="arg"]'),{format:'ProofAtlasPackedRoute/1',root:1,depth:19,slots:'VZVaABA'},await page.evaluate(()=>window.ProofAtlasOccurrenceView.getSnapshot().node));
      await page.goto(url);
      await checkProofFocus(group.getByRole('button',{name:'Open proof for argument 4',exact:true}),target,argument.node);
      const large=new URL(url);
      large.searchParams.set('edition','goedel-sample-4331');
      large.searchParams.set('proof','lean_workbook_plus_6206');
      const largeArgument={format:'ProofAtlasPackedRoute/1',root:1,depth:11,slots:'VZUW'};
      const caller=packed.prefix(largeArgument,10);
      large.hash='occurrence=2e5bbcebb8129c823d4640a7c17f06b1a073c8a2df20889e65f4efc61f213bd6.1.10.'+caller.slots;
      await page.goto(large.href);
      await checkProofFocus(group.locator('[data-open-proof]').last(),largeArgument,90415);
      await page.goBack();
      await page.waitForFunction(expected=>window.ProofAtlasOccurrenceView?.getScene()?.root.route.slots===expected,caller.slots);
      assert.equal(new URL(page.url()).hash,large.hash);
      const pagedLarge=new URL(large);
      pagedLarge.searchParams.delete('group');
      pagedLarge.searchParams.set('loading','paged');
      const start=requested.length;
      await page.goto(pagedLarge.href);
      await page.waitForFunction(()=>window.ProofAtlasOccurrenceView?.getCaptionState().status==='ready');
      const callerAssets=new Set(requested.slice(start));
      await checkProofFocus(rootCard.locator('[data-open-proof="arg"]'),largeArgument,90415);
      await page.waitForFunction(()=>window.ProofAtlasOccurrenceView?.getCaptionState().status==='ready');
      const stats=await page.evaluate(()=>window.ProofAtlasOccurrenceView.getConstructionScene().stats);
      assert.equal(BigInt(stats.represented),11433349n);
      await rootCard.locator('[data-construction-field="body"]').click();
      const selectedBody=await page.evaluate(()=>window.ProofAtlasOccurrenceView.getSnapshot());
      assert.equal(selectedBody.node,90414);
      assert.deepEqual(selectedBody.route,packed.append(largeArgument,[1]));
      const assets=[...new Set(requested.slice(start).filter(file=>file.startsWith('/public/data/')))];
      assert(!assets.some(file=>file.startsWith('/public/data/proof-atlas/goedel-sample/') && file.endsWith('.json.gz')));
      const bytes=assets.reduce((sum,file)=>sum+fs.statSync(path.resolve('.'+file)).size,0);
      const newFiles=assets.filter(file=>!callerAssets.has(file));
      const addedBytes=newFiles.reduce((sum,file)=>sum+fs.statSync(path.resolve('.'+file)).size,0);
      console.log(JSON.stringify({width,retained:stats.retained,hidden:stats.hidden,distinctDataFiles:assets.length,bytes,newFiles:newFiles.length,addedBytes}));
      const positivity=new URL(url);
      positivity.searchParams.set('edition','goedel-sample-4331');
      positivity.searchParams.set('proof','lean_workbook_3485');
      const callSlots=[1,1,1,1,1,1],location=packed.encode(1,callSlots);
      positivity.hash='occurrence=bd496000a8da7ce06393d1cdd66b86c1a76aa6004c6eca19c36e083a3082948c.1.6.'+location.slots;
      await page.goto(positivity.href);
      for(const [index,mode,statement] of [[6,'instance implicit','PosMulStrictMono ℝ'],[7,'explicit','0 < a'],[8,'explicit','0 < b']]){
        const port=ports.filter({hasText:new RegExp('^Argument '+index+' ·')});
        assert((await port.textContent()).includes(' · '+mode+' · proof'));
        assert.equal(await port.locator('[data-proof-input-statement]').textContent(),statement);
        await port.click();
        const selected=await page.evaluate(()=>window.ProofAtlasOccurrenceView.getSnapshot().route);
        assert.deepEqual(selected,packed.encode(1,[...callSlots,...Array(8-index).fill(0),1]));
      }
      await page.close();
    }
    console.log('Verified complete and paged Riccati and AI premise selections at 360 and 1280 pixels.');
  } finally { await browser.close(); }
})().catch(error=>{console.error(error);process.exitCode=1;});
