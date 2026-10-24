/* Actual reader integration: exact unit ports/joins/types and bounded paged loading. */
'use strict';
const fs = require('fs'), vm = require('vm'), z = require('zlib'), assert = require('assert/strict'), {chromium} = require('playwright');
const T = require('../public/js/proof-atlas-deep-context'), F = require('../public/js/proof-atlas-local-definition-frame');
const producer = require('../research/proof-atlas/construction-pages/captions.cjs'), h = {};
for (const n of ['library-manifest','occurrence-types-manifest','goedel-sample-manifest','let-result-pools-manifest']) vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/' + n + '.js','utf8'),{window:h});
const {library,types} = require('../public/js/proof-atlas-ai-sample').register(h.PROOF_ATLAS_LIBRARY,h.PROOF_ATLAS_OCCURRENCE_TYPES,null,h.PROOF_ATLAS_AI_SAMPLE);
const raw = f => z.gunzipSync(fs.readFileSync('.' + f),{maxOutputLength:67108864}), origin = process.env.ATLAS_ORIGIN || 'http://127.0.0.1:8833', folder = process.env.ATLAS_SCREENSHOTS || '/tmp/atlas-local-definitions-browser';
fs.mkdirSync(folder,{recursive:true});
let browser, paged = true;
const out = {status:'RUNNING',pagedFrames:0,completeFrames:0,sourcePortSelections:0,sourceSnapshots:0,joinSelections:0,typeViews:0,sameSourceOriginPairs:0,sharingModes:0,continuationChunks:0,continuedUnits:0,modeTransitions:0,accessibilityAudits:0,failureControls:0,staleControls:0,retiredEvents:0,keyboardSelections:0,completeArchiveRequestsInPagedMode:0,peakSourceNodes:0,peakSelectedTypeNodes:0};
(async () => {
  const cases = [];
  for (const d of types.records) {
    const record = library.editions.find(e => e.id === d.edition).declarations.find(r => r.name === d.name), b = raw(record.indexFile); let pkg = await T.recorded(b,raw(d.file),d,record);
    const ld = h.PROOF_ATLAS_LET_REDUCTIONS.records.find(x => x.name === d.name && x.edition === d.edition && x.indexSha256 === d.indexSha256); if (ld) pkg = T.mergeRecorded(pkg,await T.recordedLets(b,raw(ld.file),ld,record));
    const c = pkg.case(record.name), model = F.open(c,producer.open(c,e => raw(e.evidenceFile)),d.edition), starts = c.entries.filter(e => T.construction(e,c.data)?.rule === 'let-binding'); if (starts.length) cases.push({d,record,c,model,starts});
  }
  browser = await chromium.launch({headless:true,...(process.env.ATLAS_CHROMIUM_PATH ? {executablePath:process.env.ATLAS_CHROMIUM_PATH} : {})});
  const page = await browser.newPage({viewport:{width:1700,height:1100}}), errors = [], forbidden = [];
  page.on('pageerror',e => errors.push(e.stack)); await page.addInitScript(() => {if (/^https?:$/.test(location.protocol)) {localStorage.setItem('analytics-consent','no'); localStorage.setItem('theme','light');}});
  page.on('request',r => {const p = new URL(r.url()).pathname; if (paged && p.startsWith('/public/data/proof-atlas/') && p.endsWith('.gz') && !['source-pages','type-pages','type-query-pages','construction-pages'].some(d => p.startsWith('/public/data/proof-atlas/' + d + '/'))) forbidden.push(p);});
  const url = (x,entry,mode='paged',budget=8) => origin + '/projects/proof-atlas/library/?view=occurrence&diagram=construction&group=definitions&members=' + budget + '&edition=' + encodeURIComponent(x.d.edition) + '&proof=' + encodeURIComponent(x.record.name) + (mode === 'paged' ? '&loading=paged' : '') + '#occurrence=' + x.record.indexSha256 + '.' + entry.route.root + '.' + entry.route.depth + '.' + entry.route.slots;
  const ready = () => page.waitForFunction(() => window.ProofAtlasOccurrenceView?.getDefinitionState().ready && ProofAtlasOccurrenceView.getConstructionScene()?.format === 'ProofAtlasLocalDefinitionFramePrototype/1',{},{timeout:60000});
  async function go(x,entry,mode='paged',budget=8) {paged = mode === 'paged'; await page.goto(url(x,entry,mode,budget)); await ready();}
  async function compare(x,entry,budget=8) {const expected = await x.model.create(entry.route,{maxUnits:budget}); assert.deepEqual(await page.evaluate(() => ProofAtlasOccurrenceView.getConstructionScene()),expected); assert(await page.locator('[data-local-definition-view]').isVisible()); return expected;}
  async function selectSource(frame,index,id) {
    await page.locator('[data-definition-port="' + index + '-' + id + '"]').evaluate(b => b.click());
    const u = frame.units[index], value = u.ports[id] || u[id]; assert.deepEqual(await page.evaluate(() => ProofAtlasOccurrenceView.getDefinitionSelection()),{kind:'port',unit:index,id,value}); out.sourcePortSelections++;
    const p = value.sourceAnchor || value.sourceBinder || value;
    await page.waitForFunction(r => {const s = ProofAtlasOccurrenceView.getSnapshot(); return s && s.route.root === r.root && s.route.depth === r.depth && s.route.slots === r.slots;},p.route);
    const actual = await page.evaluate(() => ProofAtlasOccurrenceView.getSnapshot()); assert.equal(actual.node,p.node); assert.equal(actual.scopeDepth,p.contextLength); out.sourceSnapshots++;
  }
  async function type(x,frame,index,id) {
    const field = {valueType:'value',bodyType:'body',conclusionType:'conclusion'}[id], expected = await x.model.typeFor(frame,{unit:index,field});
    await page.locator('[data-definition-type="' + index + '-' + id + '"]').evaluate(b => b.click());
    await page.waitForFunction(hash => ProofAtlasOccurrenceView.getTypeSnapshot()?.typeComponentSha256 === hash,expected.typeComponentSha256);
    assert.deepEqual(await page.evaluate(() => ProofAtlasOccurrenceView.getTypeScene()),T.typeScene(expected,x.c.data));
    assert.equal((await page.evaluate(() => ProofAtlasOccurrenceView.getSnapshot())).native.recording.field,field); if (paged) {const r = await page.evaluate(() => ProofAtlasOccurrenceView.getResidency()); assert(r.type.cachedNodes <= 512); out.peakSelectedTypeNodes = Math.max(out.peakSelectedTypeNodes,r.type.cachedNodes);} out.typeViews++;
  }
  for (const x of cases) {
    await go(x,x.starts[0]);
    for (const entry of x.starts) {
      await page.evaluate(route => ProofAtlasOccurrenceView.focus(route),entry.route); await ready(); const frame = await compare(x,entry); out.pagedFrames++;
      for (const [i,u] of frame.units.entries()) for (const id of ['declared','value','binding','body','root']) await selectSource(frame,i,id);
      for (const [i,j] of frame.joins.entries()) {await page.locator('[data-definition-join="' + i + '"]').evaluate(b => b.click()); assert.deepEqual(await page.evaluate(() => ProofAtlasOccurrenceView.getDefinitionSelection()),{kind:'join',index:i,value:j}); assert.deepEqual(await page.locator('[data-definition-unit][data-highlight=true]').evaluateAll(nodes => nodes.map(n => Number(n.dataset.definitionUnit))),[i,i+1]); out.joinSelections++;}
      const r = await page.evaluate(() => ProofAtlasOccurrenceView.getResidency()); assert(r.source.cachedNodes <= 4096 && r.construction.recordPages <= 8 && r.construction.indexPages <= 4); out.peakSourceNodes = Math.max(out.peakSourceNodes,r.source.cachedNodes); assert((await page.evaluate(() => ProofAtlasOccurrenceView.getDefinitionState())).model.peakTypeNodes <= 64);
    }
    // At least one real type component per profile; Riccati below checks every unit's components.
    await go(x,x.starts[0]); const f = await compare(x,x.starts[0]); await type(x,f,0,'valueType');
  }
  const riccati = cases.filter(x => x.record.name === 'JacobiData.slope_bound_abs'); assert.equal(riccati.length,2);
  for (const x of riccati) {
    const entry = x.starts.find(e => e.contextLength === 6); assert(entry);
    for (const mode of ['complete','paged']) {
      await go(x,entry,mode); const frame = await compare(x,entry); if (mode === 'complete') out.completeFrames++;
      for (const [i,u] of frame.units.entries()) for (const id of ['valueType','bodyType','conclusionType']) await type(x,frame,i,id);
      assert.equal(frame.units.length,6);
      // Parent body and child's conclusion are the same source with different native identities.
      await type(x,frame,0,'bodyType'); const parent = await page.evaluate(() => ProofAtlasOccurrenceView.getTypeSnapshot()); await type(x,frame,1,'conclusionType'); const child = await page.evaluate(() => ProofAtlasOccurrenceView.getTypeSnapshot()); assert.deepEqual(parent.sourceRoute,child.sourceRoute); assert.notEqual(parent.typeComponentSha256,child.typeComponentSha256); out.sameSourceOriginPairs++;
      const before = await page.evaluate(() => ProofAtlasOccurrenceView.getConstructionScene()); for (const share of [false,true]) {await page.locator('[data-definition-sharing]').setChecked(share); assert.deepEqual(await page.evaluate(() => ProofAtlasOccurrenceView.getConstructionScene()),before); assert.equal(await page.evaluate(() => ProofAtlasOccurrenceView.getDefinitionSelection()),null); out.sharingModes++;}
    }
  }
  const long = cases.find(x => x.record.name === 'lean_workbook_plus_54159'), first = long.starts.find(e => e.route.depth === 5); assert(first); await go(long,first,'paged',8);
  let total = 0, chunks = 0, currentEntry = first;
  while (true) {const f = await compare(long,currentEntry); total += f.units.length; chunks++; if (f.continuation.status !== 'member-budget') break; const next = long.c.get(f.continuation.route); assert(next); await page.getByRole('button',{name:'Continue definitions',exact:true}).click(); await ready(); await page.waitForFunction(r => ProofAtlasOccurrenceView.getConstructionScene().root.route.depth === r.depth,next.route); currentEntry = next;}
  assert.equal(total,30); assert.equal(chunks,4); out.continuationChunks = chunks; out.continuedUnits = total;
  const x = riccati.find(x => x.d.edition === 'published-15'), entry = x.starts.find(e => e.contextLength === 6); await go(x,entry);
  await page.locator('[data-definition-join="0"]').focus(); await page.keyboard.press('Enter'); assert.equal((await page.evaluate(() => ProofAtlasOccurrenceView.getDefinitionSelection())).kind,'join'); out.keyboardSelections++;
  for (const width of [1700,390]) for (const theme of ['light','dark']) {await page.setViewportSize({width,height:1100}); await page.evaluate(t => document.documentElement.dataset.theme = t,theme); await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')}); const a = await page.evaluate(() => axe.run({include:[['main']]},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})); assert.deepEqual(a.violations.map(v => ({id:v.id,targets:v.nodes.map(n => n.target)})),[]); assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 3)); out.accessibilityAudits++; await page.screenshot({path:folder + '/definitions-' + width + '-' + theme + '.png',fullPage:true});}
  await page.setViewportSize({width:1700,height:1100});
  // Missing optional data/code cannot leave a stale unit or disable original source navigation.
  for (const pattern of ['**/proof-atlas-cursor-local-definitions.js*','**/proof-atlas-local-definition-view.js*','**/*.caption.gz']) {
    await page.goto('about:blank'); await page.route(pattern,r => r.abort()); await page.goto(url(x,entry)); await page.waitForFunction(() => window.ProofAtlasOccurrenceView?.getConstructionState().error); assert.equal(await page.locator('[data-local-definition-view]').count(),0); assert(await page.locator('[data-occurrence-node]').count() > 0); await page.unroute(pattern); await page.getByRole('button',{name:'Retry local definitions',exact:true}).click(); await ready(); await compare(x,entry); out.failureControls++;
  }
  // A genuine non-let position remains explicitly unsupported.
  await page.evaluate(() => ProofAtlasOccurrenceView.focus({format:'ProofAtlasPackedRoute/1',root:1,depth:0,slots:''})); await page.waitForFunction(() => ProofAtlasOccurrenceView.getConstructionState().error); assert.equal(await page.locator('[data-local-definition-view]').count(),0); assert(await page.locator('[data-occurrence-node]').count() > 0); out.failureControls++;
  // A delayed computation cannot restore a view after switching to source mode.
  await page.goto('about:blank'); let release,hit; const gate = new Promise(r => release=r), started = new Promise(r => hit=r); await page.route('**/proof-atlas-cursor-local-definitions.js*',async r => {hit(); await gate; await r.continue().catch(() => {});}); await page.goto(url(x,entry),{waitUntil:'domcontentloaded'}); await started; await page.getByRole('button',{name:'Source occurrences',exact:true}).click(); release(); await page.unroute('**/proof-atlas-cursor-local-definitions.js*'); await page.waitForFunction(() => window.ProofAtlasCursorLocalDefinitions && !ProofAtlasOccurrenceView.getConstructionState().enabled); assert.equal(await page.locator('[data-local-definition-view]').count(),0); out.staleControls++;
  await go(x,entry); await page.evaluate(() => {window.retiredDefinitionPort = document.querySelector('[data-definition-port="0-value"]');}); await page.getByRole('button',{name:'Source occurrences',exact:true}).click(); await page.waitForFunction(() => !ProofAtlasOccurrenceView.getConstructionState().enabled); const before = await page.evaluate(() => ProofAtlasOccurrenceView.getSnapshot()); await page.evaluate(() => retiredDefinitionPort.click()); assert.deepEqual(await page.evaluate(() => ProofAtlasOccurrenceView.getSnapshot()),before); out.retiredEvents++;
  // An obsolete type result cannot replace a more recent exact source/type origin.
  await go(x,entry); const selectedFrame = await compare(x,entry); let typeRelease,typeHit,held=false; const typeGate = new Promise(r => typeRelease=r), typeStarted = new Promise(r => typeHit=r);
  await page.route('**/type-pages/**/*.observation.gz',async r => {if (!held) {held=true;typeHit();await typeGate;} await r.continue().catch(() => {});});
  await page.locator('[data-definition-type="0-valueType"]').evaluate(b => b.click()); await typeStarted;
  const nextOrigin = await x.model.typeFor(selectedFrame,{unit:1,field:'conclusion'}); await page.locator('[data-definition-port="1-root"]').evaluate(b => b.click());
  await page.waitForFunction(hash => ProofAtlasOccurrenceView.getSnapshot()?.native?.typeComponentSha256 === hash,nextOrigin.typeComponentSha256); typeRelease(); await page.unroute('**/type-pages/**/*.observation.gz');
  await page.waitForTimeout(100); assert.equal(await page.evaluate(() => ProofAtlasOccurrenceView.getTypeScene()),null); assert.equal((await page.evaluate(() => ProofAtlasOccurrenceView.getSnapshot())).native.typeComponentSha256,nextOrigin.typeComponentSha256); out.staleControls++;
  // Existing source/context modes and both loading paths remain available in one document.
  for (const mode of ['complete','paged']) {paged = mode === 'paged'; await page.evaluate(async target => {history.replaceState({},'',target); await ProofAtlasOccurrenceWindowView.mount(document.getElementById('pl-library'),PROOF_ATLAS_LIBRARY);},url(x,entry,mode)); await ready(); await compare(x,entry); out.modeTransitions++;}
  await page.evaluate(() => ProofAtlasOccurrenceView.dispose()); const retired = await page.evaluate(() => ProofAtlasOccurrenceView.getResidency()); assert.equal(retired.source.cachedNodes,0); assert.equal(retired.construction.recordPages,0); assert.equal(retired.construction.activeTypeTables,0); out.failureControls++;
  assert.deepEqual(errors,[]); assert.deepEqual(forbidden,[]); assert.equal(out.pagedFrames,60); assert.equal(out.completeFrames,2); out.completeArchiveRequestsInPagedMode = forbidden.length;
  out.status = 'PASS'; out.scope = 'Normal production reader files: finite paged/complete local-definition correspondence, actual source/type selections, exact joins and bounded continuation, optional failures, mode/selection retirement and accessibility. No new native judgments, full proof coverage or measured comprehension result.';
  fs.writeFileSync(folder + '/local-definitions-browser.json',JSON.stringify(out,null,2) + '\n'); await browser.close(); console.log(JSON.stringify(out));
})().catch(async e => {out.status='FAIL';out.error=e.stack;fs.writeFileSync(folder + '/local-definitions-browser.json',JSON.stringify(out,null,2) + '\n'); if (browser) await browser.close(); console.error(e.stack); process.exit(1);});
