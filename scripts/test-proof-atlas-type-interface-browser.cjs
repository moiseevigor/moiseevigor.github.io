/* Actual node selection, typed/source connections and exact recording-query jumps. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{chromium}=require('playwright');
const origin=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8833',dir=process.env.ATLAS_SCREENSHOTS||'/tmp/atlas-type-interface-browser';
(async()=>{
 fs.mkdirSync(dir,{recursive:true});const browser=await chromium.launch({headless:true,executablePath:process.env.ATLAS_CHROMIUM_PATH}),page=await browser.newPage({viewport:{width:1700,height:1100}}),errors=[];
 page.on('pageerror',e=>errors.push(e.message));await page.addInitScript(()=>{if(location.protocol.startsWith('http')){localStorage.setItem('analytics-consent','no');localStorage.setItem('theme','light');}});
 const cases=[{name:'value-use',parent:[1,1],parentPath:'root.value.body.value',node:17,route:[1,1,0,0,0,1],role:'value',scope:1,relation:'structural-type-agreement'},{name:'proof-use',parent:[1,2],parentPath:'root.value.body.body',node:17,route:[1,2,1],role:'proof',scope:2,relation:'structural-type-agreement'},{name:'source-parent',parent:[1],parentPath:'root.value.body',node:40,route:[1,1],role:'proof',scope:1,relation:'source-field'}];
 let selections=0,jumps=0,accessibilityAudits=0;
 const snapshot=()=>page.evaluate(()=>ProofAtlasLibrary.getSnapshot()),scene=()=>page.evaluate(()=>ProofAtlasLibrary.getJudgmentScene());
 async function selectCard(route){const item=await page.evaluate(r=>ProofAtlasLibrary.getJudgmentScene().nodes.find(n=>JSON.stringify(n.route)===JSON.stringify(r)),{root:1,slots:route});assert(item,'Displayed occurrence absent');const target=page.locator('[data-judgment-node='+JSON.stringify(item.id)+']');await target.focus();await target.click();return item;}
 try{
  for(const paged of [false,true])for(const c of cases)for(const querySide of c.relation==='source-field'?[null]:['expected','observed']){
   await page.goto(origin+'/projects/proof-atlas/library/?'+(paged?'loading=paged&':'')+'edition=published-15&proof=JacobiCore.E_pos&route=1%3A#expr-73');
   await page.waitForFunction(()=>window.ProofAtlasLibrary?.getSnapshot()?.selected===73);
   if(!paged)await page.getByRole('button',{name:'Show judgment geometry',exact:true}).click();
   await page.waitForFunction(()=>ProofAtlasLibrary.getJudgmentScene()?.root.node===73);
   await page.getByLabel('Rule premise expansion').selectOption('source-order');
   await page.getByLabel('Rule grouping').selectOption('none');
   await page.waitForFunction(()=>ProofAtlasLibrary.getJudgmentScene()?.root.node===73);
   const before=await snapshot(),url=page.url();
   const displayed=(await scene()).nodes.some(n=>JSON.stringify(n.route)===JSON.stringify({root:1,slots:c.parent}));
   if(displayed){await selectCard(c.parent);await page.locator('[data-judgment-focus]').click();}
   else{const ledger=page.locator('.pl-boundary-ledger');if(!await ledger.evaluate(e=>e.open))await ledger.locator('summary').click();await page.locator('[data-boundary-focus='+JSON.stringify(c.parentPath)+']').click();}
   await page.waitForFunction(r=>JSON.stringify(ProofAtlasLibrary.getJudgmentScene()?.root.route)===JSON.stringify(r),{root:1,slots:c.parent});
   if(!(await scene()).nodes.some(n=>JSON.stringify(n.route)===JSON.stringify({root:1,slots:c.route}))){
    assert.equal(c.name,'source-parent');const ledger=page.locator('.pl-boundary-ledger');if(!await ledger.evaluate(e=>e.open))await ledger.locator('summary').click();await page.locator('[data-boundary-expand="root.value.body.value"]').click();await page.waitForFunction(()=>ProofAtlasLibrary.getJudgmentScene()?.nodes.some(n=>n.node===40));
   }
   const n=await selectCard(c.route),panel=page.locator('[data-type-interface]');selections++;
   assert.equal(n.node,c.node);assert.equal(n.role,c.role);assert.equal(n.context.length,c.scope);
   assert.equal(await panel.getAttribute('data-type-interface'),n.id);assert.equal(await panel.getAttribute('data-interface-relation'),c.relation);
   assert((await panel.textContent()).includes('Γ'+c.scope));assert((await panel.textContent()).includes(n.typeText));
   assert.deepEqual(await snapshot(),before);assert.equal(page.url(),url);
   if(c.relation==='structural-type-agreement')assert((await panel.textContent()).includes('Structural match'));
   else{assert((await panel.textContent()).includes('Parent construction typing is unavailable'));assert.equal(await panel.locator('[data-type-interface-query]').count(),0);}
   if(!paged){await panel.scrollIntoViewIfNeeded();await panel.screenshot({path:path.join(dir,c.name+'-desktop.png')});}
   if(c.name==='value-use'&&querySide==='expected'){
    await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
    for(const width of [1700,390])for(const theme of ['light','dark']){
     await page.setViewportSize({width,height:1100});await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);await panel.scrollIntoViewIfNeeded();
     const violations=await page.evaluate(async()=>(await axe.run({include:[['main']]},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));
     assert.deepEqual(violations,[]);assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+3));
     if(!paged)await panel.screenshot({path:path.join(dir,'connection-'+width+'-'+theme+'.png')});accessibilityAudits++;
    }
    await page.setViewportSize({width:1700,height:1100});
   }
   if(c.relation==='structural-type-agreement'){
    const q=n.premiseInterface[querySide].query;await panel.locator('[data-type-interface-query='+JSON.stringify(querySide)+']').click();
    await page.waitForFunction(r=>JSON.stringify(ProofAtlasLibrary.getSnapshot()?.route)===JSON.stringify(r),q.route);assert.equal((await snapshot()).selected,q.node);jumps++;
   }
  }
  // Withhold the selected child's query while retaining the real parent record.
  await page.evaluate(async()=>{
   const r=PROOF_ATLAS_LIBRARY.editions.find(e=>e.id==='published-15').declarations.find(r=>r.name==='JacobiCore.E_pos'),d=PROOF_ATLAS_OCCURRENCE_TYPES.records.find(d=>d.edition==='published-15'&&d.name===r.name),A=ProofAtlasLibraryData,J=ProofAtlasJudgmentGeometry;
   const data=A.validateIndex(await A.compressed(r.indexFile,r.indexSha256),r),provider=await ProofAtlasOccurrenceTypes.open(d,data,r),route={root:1,slots:[1,1,0,0,0,1]};
   const parent=J.create(data,r,()=>provider,{judgmentRoute:{root:1,slots:[1,1]},maxNodes:1,maxDepth:0}),row=ProofAtlasBoundaryLedger.create(parent,data).rows.find(p=>JSON.stringify(p.route)===JSON.stringify(route));
   const request={node:row.node,path:row.path,route,role:row.role,reference:row.typeReference},resolve=at=>JSON.stringify(at)===JSON.stringify(route)?{...provider,get:()=>undefined}:provider,host=document.createElement('div');host.id='inherited-type-interface';document.querySelector('main').append(host);
   window.__inheritedTypeView=J.mount(host,{data,record:r,judgmentRoute:route,resolveTyping:resolve,onProofOccurrence:()=>{},prepareScene:options=>J.create(data,r,resolve,{...options,rootInterface:request})});
  });
  const inherited=page.locator('#inherited-type-interface [data-type-interface]');await inherited.waitFor();assert.equal(await inherited.getAttribute('data-interface-relation'),'retained-parent-observation');assert((await inherited.textContent()).includes('Record retained'));assert.equal(await inherited.locator('[data-type-interface-query="observed"]').count(),0);
  await inherited.screenshot({path:path.join(dir,'retained-observation.png')});await page.evaluate(()=>{window.__inheritedTypeView.dispose();document.querySelector('#inherited-type-interface').remove();});
  assert.deepEqual(errors,[]);const report={status:'PASS',completeAndPagedReaders:true,nodeSelections:selections,exactRecordSourceJumps:jumps,distinctSharedNodeContextsAndRoles:true,sourceFieldDoesNotAcquireTyping:true,inheritedObservationDistinguished:true,selectionAndURLPreservedUntilSourceJump:true,accessibilityAudits,scope:'Actual geometric selection and provenance navigation; no new kernel typing or measured comprehension result.'};fs.writeFileSync(path.join(dir,'type-interface-browser.json'),JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
 }catch(error){fs.writeFileSync(path.join(dir,'failure.json'),JSON.stringify({error:error.stack,errors,scene:await scene().catch(()=>null)},null,2));await page.screenshot({path:path.join(dir,'failure.png')});throw error;}finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1)});
