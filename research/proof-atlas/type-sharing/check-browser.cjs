/* Served production UI, native controls, no application/data substitutions. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),z=require('zlib');
const assert=require('assert/strict'),crypto=require('crypto'),{chromium}=require('playwright');
process.chdir(path.resolve(__dirname,'../../..'));
const origin=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8877',folder=process.argv[2];
assert(folder);fs.mkdirSync(folder,{recursive:true});
const h={};vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/formal-support-controls-manifest.js','utf8'),{window:h});
const records=JSON.parse(JSON.stringify(h.PROOF_ATLAS_FORMAL_SUPPORT_CONTROLS.records));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const files=['public/js/proof-atlas-type-sharing.js','public/js/proof-atlas-type-sharing-view.js',
  'public/css/proof-atlas-type-sharing.css','public/js/proof-atlas-application-type-pages.js',
  'public/js/proof-atlas-application-port-view.js','public/js/proof-atlas-application-port-manual.js',
  'public/js/proof-atlas-input-type-bridge-view.js','public/css/proof-atlas-input-type-bridge.css',
  'public/js/proof-atlas-application-ports.js'];
(async()=>{
  const browser=await chromium.launch({headless:true,executablePath:process.env.ATLAS_CHROMIUM_PATH});
  const page=await browser.newPage({viewport:{width:1500,height:1100}}),errors=[],archives=[];
  const forbidden=new Set(records.flatMap(d=>[d.owner.file,d.record.indexFile]));
  const report={format:'ProofAtlasTypeSharingBrowser/1',status:'RUNNING',sourceOverrides:false,
    dataOverrides:false,typeRoots:0,useSelections:0,relativeSelections:0,binderSelections:0,
    focusSelections:0,axeAudits:0,libraryTypeRoots:0,libraryComputedSourcePreserved:0,libraryBinderJumps:0,files:{},profiles:[]};
  page.on('pageerror',e=>errors.push(e.message));
  page.on('request',r=>{if(forbidden.has(new URL(r.url()).pathname))archives.push(r.url());});
  await page.addInitScript(()=>{localStorage.setItem('analytics-consent','no');localStorage.setItem('theme','light');});
  const panel=()=>page.locator('#pm-application-lab'),sharing=()=>panel().locator('.atlas-type-sharing');
  async function selected(address){
    await page.waitForFunction(a=>JSON.stringify(ProofAtlasApplicationManual.getSelection())===JSON.stringify(a)
      &&[...document.querySelectorAll('pre[aria-label="Application expression and provenance"]')].some(p=>p.textContent.startsWith(JSON.stringify(a,null,2))),address);
  }
  async function press(button){await button.focus();await page.keyboard.press('Enter');}
  async function structure(stage){
    const pick=panel().locator('[data-type-bridge="0:1"] [data-type-select="'+stage+'"]');
    const address=JSON.parse(await pick.getAttribute('data-type-address'));await press(pick);await selected(address);
    await press(panel().locator('[data-type-shape-open]'));
    await page.waitForFunction(()=>ProofAtlasApplicationManual.getTypeSharingScene()?.format==='ProofAtlasTypeSharingScene/1');
    return page.evaluate(()=>ProofAtlasApplicationManual.getTypeSharingScene());
  }
  try{
    for(const file of files){const r=await page.request.get(origin+'/'+file);assert.equal(r.status(),200,file);
      assert.equal(sha(await r.body()),sha(fs.readFileSync(file)),file+' served bytes');report.files[file]=sha(fs.readFileSync(file));}
    await page.goto(origin+'/projects/proof-atlas/manual/equality-transport/',{waitUntil:'domcontentloaded'});
    await page.waitForFunction(()=>window.ProofAtlasApplicationManual&&window.PROOF_ATLAS_FORMAL_SUPPORT_CONTROLS);
    await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
    for(const d of records){
      await panel().locator('[data-app-profile]').selectOption({label:d.record.name+' · 1 recorded applications'});
      await press(panel().locator('[data-app-load]'));
      await page.waitForFunction(hash=>ProofAtlasApplicationManual.getScene()?.source.indexSha256===hash,d.source.indexSha256);
      await press(panel().locator('[data-app-port="1"]').getByRole('button',{name:'Compare input types',exact:true}));
      const roots=[];
      for(const stage of ['original','lifted','expected']){
        const view=await structure(stage);report.typeRoots++;
        assert.equal(view.owner.evidenceSha256,d.owner.sha256);
        const component={original:'producerType',lifted:'producerTypeInConsumer',expected:'inputType'}[stage];
        assert.equal(view.owner.component,component);
        assert.equal(view.display.stats.represented,view.base.stats.represented);
        roots.push({stage,baseObjects:view.base.stats.nodes,displayObjects:view.display.stats.nodes});
      }
      let view=await structure('original');
      if(d.source.name.endsWith('dependentLet')){
        const model=JSON.parse(fs.readFileSync(process.env.ATLAS_TYPE_SHARING_MODEL||'/private/tmp/atlas-type-sharing-model.json','utf8'));
        const mixed=model.nativeProfiles.find(p=>p.name===d.source.name).mixedOriginalAndLocalBinder;
        await sharing().getByLabel('Repeated shape in this cut').selectOption(String(mixed.row));
        await page.waitForFunction(row=>ProofAtlasApplicationManual.getTypeSharingScene()?.family?.row===row,mixed.row);
        view=await page.evaluate(()=>ProofAtlasApplicationManual.getTypeSharingScene());
        assert.deepEqual(view.family.ports,[1]);
        for(const [i,use]of view.family.uses.entries()){
          await press(sharing().locator('[data-type-shape-instance="'+i+'"]'));await selected(use.address);report.useSelections++;
          const binding=use.assignments[0];await press(sharing().locator('[data-type-shape-binding="1"]'));
          await selected(binding.address);report.binderSelections++;
          const symbol=sharing().locator('[data-type-shape-relative="true"]').first();
          await press(symbol);await selected(use.address);report.relativeSelections++;
          assert.equal(await sharing().locator('[data-type-shape-instance="'+i+'"]').getAttribute('aria-pressed'),'true');
        }
      }
      if(d.source.name.endsWith('sharedLocal')){
        assert.equal(view.display.stats.nodes,5);assert.equal(view.family.shape.stats.nodes,23);
        assert.deepEqual(view.family.uses.map(u=>u.contextLength),[1,2]);
        const use=view.family.uses[1];await press(sharing().locator('[data-type-shape-instance="1"]'));
        await selected(use.address);report.useSelections++;
        await press(sharing().locator('[data-type-shape-relative="true"]').first());await selected(use.address);report.relativeSelections++;
        await press(sharing().getByRole('button',{name:'Focus this occurrence',exact:true}));
        await selected(use.address);await page.waitForFunction(slots=>JSON.stringify(ProofAtlasApplicationManual.getTypeSharingScene()?.base.root.slots)===JSON.stringify(slots),use.address.route.slots);report.focusSelections++;
        await press(sharing().getByRole('button',{name:'Component root',exact:true}));
        await page.waitForFunction(()=>ProofAtlasApplicationManual.getTypeSharingScene()?.base.root.slots.length===0);report.focusSelections++;
      }
      for(const width of [1500,390])for(const theme of ['light','dark']){
        await page.setViewportSize({width,height:1100});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
        assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'page overflow');
        const result=await sharing().evaluate(async n=>axe.run(n,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
        assert.deepEqual(result.violations,[]);report.axeAudits++;
        if((width===1500&&theme==='light')||(width===390&&theme==='dark'))
          await sharing().screenshot({path:path.join(folder,d.source.name.split('.').at(-1)+'-'+width+'-'+theme+'.png')});
      }
      report.profiles.push({name:d.source.name,roots,state:await page.evaluate(()=>ProofAtlasApplicationManual.getState())});
      await press(panel().locator('[data-app-release]'));assert.equal(await page.evaluate(()=>ProofAtlasApplicationManual.getTypeSharingScene()),null);
    }
    // The same view in the real Riccati proof explorer, using the deterministic
    // corpus sample rather than a separately invented theorem-specific diagram.
    const corpus=JSON.parse(fs.readFileSync(process.env.ATLAS_TYPE_SHARING_CORPUS||'/private/tmp/atlas-type-sharing-corpus.json','utf8'));
    const sample=corpus.nativeProfiles.find(d=>d.name==='JacobiData.slope_bound_abs');
    vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/application-ports-manifest.js','utf8'),{window:h});
    const riccati=h.PROOF_ATLAS_APPLICATION_PORTS.records.find(d=>d.source.name===sample.name);
    const [callId,slot]=sample.input.split(':').map(Number),call=riccati.calls.find(c=>c.index===callId);
    const route=call.anchor.route.root+':'+call.anchor.route.slots.join('.');
    await page.setViewportSize({width:1500,height:1100});
    await page.goto(origin+'/projects/proof-atlas/library/?loading=paged&edition='+riccati.source.edition+'&proof='+encodeURIComponent(sample.name)+'&route='+encodeURIComponent(route));
    await page.waitForFunction(x=>ProofAtlasLibrary?.getSnapshot()?.indexSha256===x,riccati.source.indexSha256);
    await press(page.locator('[data-application-toggle]'));
    await page.waitForFunction(i=>ProofAtlasLibrary.getApplicationScene()?.call.node===i,call.anchor.node);
    const library=page.locator('#pl-paged-application-section');
    for(let first=0;first<Math.floor((slot-1)/4)*4;first+=4){await press(library.getByRole('button',{name:'Next arguments',exact:true}));await page.waitForFunction(f=>ProofAtlasLibrary.getApplicationScene()?.firstArgument===f,first+4);}
    await press(library.locator('[data-app-port="'+slot+'"]').getByRole('button',{name:'Compare input types',exact:true}));
    const before=await page.evaluate(()=>ProofAtlasLibrary.getSnapshot());
    async function librarySelected(address){await page.waitForFunction(a=>JSON.stringify(ProofAtlasApplicationPortView.getSelection())===JSON.stringify(a)&&[...document.querySelectorAll('pre[aria-label="Application expression and provenance"]')].some(p=>p.textContent.startsWith(JSON.stringify(a,null,2))),address);}
    let real;
    for(const stage of ['original','lifted','expected']){
      const button=library.locator('[data-type-bridge="'+sample.input+'"] [data-type-select="'+stage+'"]');
      const address=JSON.parse(await button.getAttribute('data-type-address'));await press(button);await librarySelected(address);
      await press(library.locator('[data-type-shape-open]'));
      await page.waitForFunction(()=>ProofAtlasApplicationPortView.getTypeSharingScene()?.format==='ProofAtlasTypeSharingScene/1');
      real=await page.evaluate(()=>ProofAtlasApplicationPortView.getTypeSharingScene());
      assert.equal(real.owner.evidenceSha256,sample.owner);assert.equal(real.owner.input,sample.input);
      const expected=sample.roots.find(r=>r.component===address.component);
      assert.equal(real.display.stats.nodes,expected.displayObjects);report.libraryTypeRoots++;
    }
    assert.equal(real.family.status,'available');const use=real.family.uses[0];
    await press(library.locator('[data-type-shape-instance="0"]'));await librarySelected(use.address);
    await press(library.locator('[data-type-shape-relative="true"]').first());await librarySelected(use.address);
    const after=await page.evaluate(()=>ProofAtlasLibrary.getSnapshot());
    assert.deepEqual(after.route,before.route);assert.equal(after.indexSha256,before.indexSha256);report.libraryComputedSourcePreserved++;
    const realView=library.locator('.atlas-type-sharing');await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
    for(const width of [1500,390])for(const theme of ['light','dark']){
      await page.setViewportSize({width,height:1100});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
      assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth),'Riccati page overflow');
      const result=await realView.evaluate(async n=>axe.run(n,{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));assert.deepEqual(result.violations,[]);report.axeAudits++;
      if(width===1500&&theme==='light')await realView.screenshot({path:path.join(folder,'riccati-type.png')});
    }
    report.riccati={input:sample.input,owner:sample.owner,component:real.owner.component,
      baseObjects:real.base.stats.nodes,displayObjects:real.display.stats.nodes,definitionObjects:real.family.shape.stats.nodes};
    const binder=realView.locator('[data-type-shape-binding]').first();
    const target=JSON.parse(await binder.getAttribute('data-type-shape-address'));assert.equal(target.namespace,'source-expression');
    await press(binder);await page.waitForFunction(a=>{
      const state=ProofAtlasLibrary.getSnapshot();return state.selected===a.node&&state.indexSha256===a.indexSha256&&JSON.stringify(state.route)===JSON.stringify(a.route);
    },target);report.libraryBinderJumps++;
    assert.equal(report.typeRoots,9);assert.equal(report.libraryTypeRoots,3);assert.equal(report.libraryComputedSourcePreserved,1);
    assert.equal(report.libraryBinderJumps,1);assert.equal(report.axeAudits,16);assert.deepEqual(errors,[]);assert.deepEqual(archives,[]);
    report.status='PASS';report.wholeArchiveRequests=0;report.publicDeployment=false;
    report.scope='Built inspector, three authored kernel-typed profiles and the largest-original-type argument of the real Riccati sample. Keyboard selections and exact addresses, four viewport/theme combinations. No comprehension study.';
    report.files['research/proof-atlas/type-sharing/check-browser.cjs']=sha(fs.readFileSync(__filename));
    fs.writeFileSync(path.join(folder,'browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,files:undefined,profiles:report.profiles.map(p=>({name:p.name,roots:p.roots}))}));
  }catch(error){await page.screenshot({path:path.join(folder,'failure.png')}).catch(()=>{});throw error;}
  finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1);});
