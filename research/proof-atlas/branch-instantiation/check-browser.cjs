'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), z = require('zlib');
const assert = require('assert/strict'), crypto = require('crypto'), {chromium} = require('playwright');
process.chdir(path.resolve(__dirname, '../../..'));
const A = require('../../../public/js/proof-atlas-library-data'), M = require('../../../public/js/proof-atlas-method-interfaces');
const I = require('../../../public/js/proof-atlas-branch-instantiation');
const C = require('../../../public/js/proof-atlas-branch-conclusion'), W = require('../../../public/js/proof-atlas-method-flow');
const h = {}, base = 'research/proof-atlas/branch-instantiation/', origin = process.env.ATLAS_ORIGIN || 'http://127.0.0.1:8866';
const folder = process.argv[2]; assert(folder, 'screenshot directory required'); fs.mkdirSync(folder, {recursive: true});
for (const n of ['method-interfaces', 'method-interfaces-ai', 'method-streaming', 'method-origins', 'method-indices', 'method-parameters', 'method-mutual'])
  vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/' + n + '-manifest.js', 'utf8'), {window: h});
const primary = [...h.PROOF_ATLAS_METHOD_INTERFACES.records, ...h.PROOF_ATLAS_METHOD_REPLAY.records];
const manual = [...primary.filter(d => d.edition === 'branch-method-controls'),
  ...['PROOF_ATLAS_METHOD_ORIGINS', 'PROOF_ATLAS_METHOD_INDICES', 'PROOF_ATLAS_METHOD_PARAMETERS', 'PROOF_ATLAS_METHOD_MUTUAL'].flatMap(k => h[k].records.map(f => f.nativeDescriptor))];
const live = primary.filter(d => d.edition !== 'branch-method-controls'), fixture = h.PROOF_ATLAS_STREAM_FIXTURE;
const read = f => JSON.parse(z.gunzipSync(fs.readFileSync('.' + f))), plain = x => JSON.parse(JSON.stringify(x));
const sha = x => crypto.createHash('sha256').update(x).digest('hex');
let browser, auditPage, auditReport;
(async () => {
  browser = await chromium.launch({headless: true, ...(process.env.ATLAS_CHROMIUM_PATH ? {executablePath: process.env.ATLAS_CHROMIUM_PATH} : {})});
  const p = await browser.newPage({viewport: {width: 1500, height: 1100}}), errors = [], blocked = [];
  auditPage = p;
  p.on('pageerror', e => errors.push(e.message));
  await p.addInitScript(() => {if (location.protocol.startsWith('http')) {localStorage.setItem('analytics-consent', 'no'); localStorage.setItem('theme', 'light');}});
  const forbidden = new Set([...live, fixture.nativeDescriptor].flatMap(d => [d.file, d.record.indexFile]));
  await p.route('**/*', async r => {const file = new URL(r.request().url()).pathname;
    if (forbidden.has(file)) {blocked.push(file); await r.fulfill({status: 503, body: 'Complete source/native archive forbidden'});} else await r.continue();
  });
  const out = {status: 'RUNNING', frames: 0, manualFrames: 0, pagedFrames: 0, stressFrames: 0,
    instantiationChecks: 0, genericDomainJumps: 0, substitutionPages: 0, sourceArgumentJumps: 0, instantiationFailureControls: 0, completeFrames: 0, signatureClicks: 0, fieldClicks: 0, binderClicks: 0, counterpartClicks: 0, argumentPages: 0,
    indexPages: 0, sourceSelectionPreserved: 0, wireRouteChecks: 0, keyboardChecks: 0,
    staleControls: 0, optionalFailureControls: 0, accessibilityAudits: 0, wholeArchiveAttempts: 0};
  auditReport = out;
  let mode = 'manual', scope = '#pm-method-example-view';
  const scene = () => p.evaluate(m => m === 'manual' ? ProofAtlasMethodExamples.getFlowScene() : m === 'paged' ? ProofAtlasLibrary.getPagedMethodFlowScene() : m === 'complete' ? ProofAtlasLibrary.getMethodFlowScene(0) : ProofAtlasStreamExample.getFlowScene(), mode);
  const signature = async () => JSON.parse(await p.locator(scope + ' .pl-method-wires > section details pre').textContent());
  async function original() {
    return p.evaluate(m => m === 'manual' ? ProofAtlasMethodExamples.getSourceSelection() : (m === 'paged' || m === 'complete') ? ProofAtlasLibrary.getSnapshot() : ProofAtlasStreamExample.getSelection(), mode);
  }
  async function openManual(name) {
    mode = 'manual'; scope = '#pm-method-example-view'; await p.goto(origin + '/projects/proof-atlas/manual/#method-interface-lab');
    await p.locator('#method-interface-lab').evaluate(n => n.open = true); await p.locator('#pm-method-example').selectOption(name);
    await p.locator('#pm-method-load').click(); await p.waitForFunction(name => window.ProofAtlasMethodExamples?.getScene()?.source.name === name, name);
  }
  async function conclusion() {
    await p.locator(scope + ' [data-method-wires]').click();
    await p.waitForFunction(m => m === 'manual' ? ProofAtlasMethodExamples.getFlowScene() : m === 'paged' ? ProofAtlasLibrary.getPagedMethodFlowScene() : m === 'complete' ? ProofAtlasLibrary.getMethodFlowScene(0) : ProofAtlasStreamExample.getFlowScene(), mode);
    await p.locator(scope + ' [data-branch-conclusion]').click();
    await p.waitForFunction(m => (m === 'manual' ? ProofAtlasMethodExamples.getFlowScene() : m === 'paged' ? ProofAtlasLibrary.getPagedMethodFlowScene() : m === 'complete' ? ProofAtlasLibrary.getMethodFlowScene(0) : ProofAtlasStreamExample.getFlowScene())?.format === 'ProofAtlasBranchConclusionScene/1', mode);
  }
  async function layout() {
    const result = await p.evaluate(({scope, mode}) => {
      const s = mode === 'manual' ? ProofAtlasMethodExamples.getFlowScene() : mode === 'paged' ? ProofAtlasLibrary.getPagedMethodFlowScene() : mode === 'complete' ? ProofAtlasLibrary.getMethodFlowScene(0) : ProofAtlasStreamExample.getFlowScene();
      const root = document.querySelector(scope + ' .pl-method-wires'), overlaps = [], clipped = [];
      for (const b of root.querySelectorAll('.pl-wire-cards button')) if (b.scrollHeight > b.clientHeight + 1) clipped.push(b.dataset.wireNode);
      for (const path of root.querySelectorAll('svg path[data-wire-kind]')) for (let j = 4; j < path.getTotalLength() - 4; j += 2) {
        const at = path.getPointAtLength(j);
        if (s.nodes.some(n => at.x > n.x + 1 && at.x < n.x + n.width - 1 && at.y > n.y + 1 && at.y < n.y + n.height - 1)) {overlaps.push(path.dataset.wireKind); break;}
      }
      return {overlaps, clipped};
    }, {scope, mode}); assert.deepEqual(result, {overlaps: [], clipped: []}); out.wireRouteChecks++;
  }
  async function inspectNode(flow, node) {
    await p.locator(scope + ' [data-wire-node="' + node.id + '"]').click();
    let value = C.inspect(flow, node.address), visible = await signature();
    assert.deepEqual(visible.address, node.address); assert.deepEqual(visible.payload, value.payload); assert.deepEqual(visible.binding, value.binding);
    assert.equal(visible.typing, 'signature-syntax-only'); out.signatureClicks++;
    if (value.fields.length) {
      const field = value.fields.at(-1); await p.locator(scope).getByRole('button', {name: 'Field ' + field.field, exact: true}).click();
      visible = await signature(); value = C.inspect(flow, field.address); assert.deepEqual(visible.address, field.address); assert.deepEqual(visible.binding, value.binding); out.fieldClicks++;
    }
    if (value.binding) {
      if (value.binding.computedInput !== undefined) {
        const ordinal = value.binding.computedInput;
        await p.locator(scope + ' [data-signature-counterpart="' + ordinal + '"]').click();
        assert.equal((await scene()).options.focus.kind, 'input-domain');
        assert.equal(await p.locator(scope + ' [data-method-input="' + ordinal + '"]').getAttribute('aria-pressed'), 'true'); out.counterpartClicks++;
        await p.locator(scope + ' [data-branch-conclusion]').click();
      } else {
        await p.locator(scope).getByRole('button', {name: 'Signature binder κ' + (value.binding.ordinal + 1), exact: true}).click();
        assert.deepEqual((await signature()).address, value.binding.address); out.binderClicks++;
      }
    }
  }
  async function check(flow) {
    const before = await original(); await conclusion(); assert.deepEqual(await scene(), plain(C.create(flow))); await layout();
    for (let firstIndex = 0; firstIndex < Math.max(1, C.create(flow).stats.representedResultIndices); firstIndex += 4) {
      if (firstIndex) {await p.locator(scope).getByRole('button', {name: 'Next result indices', exact: true}).click(); out.indexPages++;}
      const expected = C.create(flow, {firstIndex}); assert.deepEqual(await scene(), plain(expected));
      for (const node of expected.nodes.filter(n => n.kind === 'kernel-signature')) {
        await inspectNode(flow, node);
        // Returning from a computed-input selection resets the index window.
        if ((await scene()).options.firstIndex !== firstIndex) {
          while ((await scene()).options.firstIndex < firstIndex) await p.locator(scope).getByRole('button', {name: 'Next result indices', exact: true}).click();
        }
      }
      await layout();
    }
    const ctor = C.create(flow).nodes.find(n => n.id === 'signature:constructor');
    await p.locator(scope + ' [data-wire-node="signature:constructor"]').click();
    const app = C.inspect(flow, ctor.address).application;
    if (app.totalArguments > 4) {
      await p.locator(scope).getByRole('button', {name: 'Next signature arguments', exact: true}).click();
      const arguments_ = await p.locator(scope + ' [data-signature-select]').evaluateAll(ns => ns.filter(n => n.textContent.startsWith('Argument ')).map(n => JSON.parse(n.dataset.signatureSelect)));
      assert.deepEqual(arguments_, C.inspect(flow, ctor.address, {firstArgument: 4}).application.arguments.map(a => plain(a.address))); out.argumentPages++;
    }
    assert.deepEqual(await original(), before);
    await p.locator(scope + ' [data-verify-instantiation]').click();
    await p.locator(scope + ' [data-instantiation-result]').waitFor({state: 'attached'});
    const receipt = JSON.parse(await p.locator(scope + ' [data-instantiation-result] pre').textContent()), expectedReceipt = await I.compare(flow);
    assert.deepEqual({...receipt, state: null}, {...expectedReceipt, state: null});
    assert(receipt.state.peakMemo <= I.limits.memo && receipt.state.peakFrontier <= I.limits.frontier && receipt.state.pairs <= I.limits.work);
    assert.equal(await p.locator(scope + ' .pl-instantiation-chain li').count(), 3);
    if (receipt.bindings.length > 4) {
      await p.locator(scope).getByRole('button', {name: 'Next substituted arguments', exact: true}).click();
      const shown = await p.locator(scope + ' [data-instantiation-argument]').evaluateAll(ns => ns.map(n => JSON.parse(n.dataset.instantiationArgument)));
      assert.deepEqual(shown, receipt.bindings.slice(4,8).map(b => b.argument)); out.substitutionPages++;
    }
    await p.locator(scope + ' [data-instantiation-signature]').click();
    assert.deepEqual((await signature()).address, {...receipt.signature, component:'recursor-branch-conclusion'}); out.genericDomainJumps++;
    await p.locator(scope + ' [data-verify-instantiation]').click();
    await p.locator(scope + ' [data-instantiation-result]').waitFor({state:'attached'});
    assert.deepEqual(await original(), before); out.instantiationChecks++; out.sourceSelectionPreserved++; out.frames++;
  }
  for (const d of manual) {
    console.log('manual', d.name);
    await openManual(d.name); const raw = read(d.file), provider = M.open(raw, A.validateIndex(read(d.record.indexFile), d.record), d.record, d);
    for (const [j, q] of raw.entries.entries()) {
      await p.locator('#pm-method-query').selectOption(String(j));
      for (const b of q.branches) {await p.locator('#pm-method-minor').selectOption(String(b.minor)); await check(provider.flow(q.parent.route, b.minor)); out.manualFrames++;}
    }
  }
  for (const d of live) {
    console.log('paged', d.name);
    mode = 'paged'; scope = '#pl-paged-method-interface'; const raw = read(d.file), provider = M.open(raw, A.validateIndex(read(d.record.indexFile), d.record), d.record, d), q0 = raw.entries[0];
    await p.goto(origin + '/projects/proof-atlas/library/?loading=paged&edition=' + d.edition + '&proof=' + encodeURIComponent(d.name) + '&route=' + encodeURIComponent(q0.parent.route.root + ':' + q0.parent.route.slots.join('.')));
    await p.waitForFunction(at => JSON.stringify(window.ProofAtlasLibrary?.getSnapshot()?.route) === JSON.stringify(at) && ProofAtlasLibrary.getJudgmentScene(), q0.parent.route);
    for (const q of raw.entries) {
      await p.evaluate(async at => ProofAtlasLibrary.selectOccurrence(at.node, true, true, at.route), q.parent);
      await p.waitForFunction(at => JSON.stringify(ProofAtlasLibrary.getSnapshot()?.route) === JSON.stringify(at) && ProofAtlasLibrary.getJudgmentScene(), q.parent.route);
      await p.locator('[data-paged-method]').click(); await p.waitForFunction(() => !!ProofAtlasLibrary.getPagedMethodScene());
      for (const b of q.branches) {await p.locator('#pl-paged-method-section select').nth(1).selectOption(String(b.minor)); await check(provider.flow(q.parent.route, b.minor)); out.pagedFrames++;}
    }
  }
  mode = 'stress'; scope = '#pm-stream-view'; await p.goto(origin + '/projects/proof-atlas/manual/#method-streaming-lab');
  await p.locator('#method-streaming-lab').evaluate(n => n.open = true); await p.locator('#pm-stream-load').click(); await p.waitForFunction(() => !!ProofAtlasStreamExample.getScene());
  const stress = read(fixture.nativeDescriptor.file), provider = M.open(stress, A.validateIndex(read(fixture.record.indexFile), fixture.record), fixture.record, fixture.nativeDescriptor);
  for (const q of stress.entries) for (const b of q.branches) {await p.locator('#pm-stream-case').selectOption(String(b.minor)); await check(provider.flow(q.parent.route, b.minor)); out.stressFrames++;}

  // The complete-data reader mounts the same component through elimination.
  // Complete source/native archives are intentional only in this separate path.
  await p.unroute('**/*');
  const rd = live.find(d => d.name === 'JacobiData.slope_bound_abs'), rawComplete = read(rd.file), rq = rawComplete.entries[0];
  const fullProvider = M.open(rawComplete, A.validateIndex(read(rd.record.indexFile), rd.record), rd.record, rd);
  mode = 'complete'; scope = '[data-case-minor="0"]';
  await p.goto(origin + '/projects/proof-atlas/library/?proof=' + rd.name + '&geometry=scoped&route=' + encodeURIComponent(rq.parent.route.root + ':' + rq.parent.route.slots.join('.')));
  await p.waitForFunction(at => JSON.stringify(window.ProofAtlasLibrary?.getSnapshot()?.route) === JSON.stringify(at), rq.parent.route);
  await p.getByRole('button', {name: 'Show case elimination', exact: true}).click();
  await p.waitForFunction(() => !!ProofAtlasLibrary.getEliminationRule());
  await p.locator('[data-computed-method="0"]').click();
  await p.waitForFunction(() => !!ProofAtlasLibrary.getMethodScene(0));
  await check(fullProvider.flow(rq.parent.route, 0)); out.completeFrames++;
  const sourceJump = JSON.parse(await p.locator(scope + ' [data-instantiation-argument]').first().getAttribute('data-instantiation-argument'));
  await p.locator(scope + ' [data-instantiation-argument]').first().click();
  await p.waitForFunction(at => JSON.stringify(ProofAtlasLibrary.getSnapshot()?.route) === JSON.stringify(at), sourceJump.route); out.sourceArgumentJumps++;

  await openManual('AtlasIndexControls.grid'); await p.locator('#pm-method-minor').selectOption('1'); await conclusion();
  await p.locator(scope + ' [data-wire-node="signature:index:0"]').focus(); await p.keyboard.press('Enter');
  assert.equal((await signature()).address.namespace, 'kernel-signature'); out.keyboardChecks++;
  await p.locator(scope + ' [data-wire-node="signature:motive"]').click();
  const oldField = await p.locator(scope + ' [data-signature-select]').first().elementHandle();
  await p.locator(scope).getByRole('button', {name: 'Next result indices', exact: true}).click(); const current = await signature();
  await oldField.evaluate(n => n.click()); assert.deepEqual(await signature(), current); out.staleControls++;
  await p.locator(scope).getByRole('button', {name: 'Previous result indices', exact: true}).click();
  await p.locator(scope + ' [data-verify-instantiation]').click();
  await p.locator(scope + ' [data-instantiation-result]').waitFor({state: 'attached'});
  await p.addScriptTag({path: require.resolve('axe-core/axe.min.js')});
  for (const width of [1500, 390]) for (const theme of ['light', 'dark']) {
    await p.setViewportSize({width, height: 1100}); await p.evaluate(t => document.documentElement.dataset.theme = t, theme);
    const bad = await p.evaluate(async scope => (await axe.run(document.querySelector(scope), {runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa']}})).violations.map(v => ({id: v.id, nodes: v.nodes.map(n => n.target)})), scope);
    assert.deepEqual(bad, []); assert(await p.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 3)); await layout();
    const term = p.locator(scope + ' .pl-instantiation-chain li').nth(1).locator('pre');
    if(await term.evaluate(n => n.scrollHeight > n.clientHeight + 1)){await term.focus(); await p.keyboard.press('ArrowDown'); await p.waitForFunction(scope => document.querySelector(scope + ' .pl-instantiation-chain li:nth-child(2) pre').scrollTop > 0, scope);}
    await p.locator(scope + ' .pl-wire-viewport').evaluate(n => {n.scrollLeft = n.scrollTop = 0;});
    await p.locator(scope + ' .pl-instantiation-chain').screenshot({path: path.join(folder, 'branch-instantiation-' + width + '-' + theme + '.png')}); out.accessibilityAudits++;
  }
  // Missing and late optional code cannot replace a valid method or a new branch.
  await p.goto('about:blank'); await p.route('**/proof-atlas-branch-conclusion.js*', r => r.abort());
  await openManual('AtlasMethodControls.dependent'); await p.locator(scope + ' [data-method-wires]').click();
  const beforeFailure = await scene(); await p.locator(scope + ' [data-branch-conclusion]').click();
  await p.locator(scope).getByText(/Branch conclusion unavailable:/).waitFor(); assert.deepEqual(await scene(), beforeFailure);
  await p.unroute('**/proof-atlas-branch-conclusion.js*'); await p.locator(scope + ' [data-branch-conclusion]').click();
  await p.waitForFunction(() => ProofAtlasMethodExamples.getFlowScene()?.format === 'ProofAtlasBranchConclusionScene/1'); out.optionalFailureControls++;
  await p.goto('about:blank'); let hit, release; const started = new Promise(r => hit = r), gate = new Promise(r => release = r);
  await p.route('**/proof-atlas-branch-conclusion.js*', async r => {hit(); await gate; await r.continue().catch(() => {});});
  await openManual('AtlasMethodControls.dependent'); await p.locator(scope + ' [data-method-wires]').click();
  await p.locator(scope + ' [data-branch-conclusion]').click(); await started;
  await p.locator('#pm-method-example').selectOption('AtlasMethodControls.conjunction');
  await p.waitForFunction(() => ProofAtlasMethodExamples.getScene()?.source.name === 'AtlasMethodControls.conjunction'); release();
  await p.waitForFunction(() => !!window.ProofAtlasBranchConclusion); assert.equal(await scene(), null); out.staleControls++;
  await p.unroute('**/proof-atlas-branch-conclusion.js*');
  await p.goto('about:blank'); await p.route('**/proof-atlas-branch-instantiation.js*', r => r.abort());
  await openManual('AtlasMethodControls.dependent'); await conclusion();
  const unmodified = await scene(); await p.locator(scope + ' [data-verify-instantiation]').click();
  await p.locator(scope).getByText(/Signature substitution unavailable:/).waitFor(); assert.deepEqual(await scene(), unmodified);
  await p.unroute('**/proof-atlas-branch-instantiation.js*'); await p.locator(scope + ' [data-verify-instantiation]').click();
  await p.locator(scope + ' [data-instantiation-result]').waitFor({state: 'attached'}); out.instantiationFailureControls++;
  await p.goto('about:blank'); let begin, finish;
  const began = new Promise(r => begin = r), held = new Promise(r => finish = r);
  await p.route('**/proof-atlas-branch-instantiation.js*', async r => {begin(); await held; await r.continue().catch(() => {});});
  await openManual('AtlasMethodControls.dependent'); await conclusion();
  await p.locator(scope + ' [data-verify-instantiation]').click(); await began;
  await p.locator('#pm-method-example').selectOption('AtlasMethodControls.conjunction');
  await p.waitForFunction(() => ProofAtlasMethodExamples.getScene()?.source.name === 'AtlasMethodControls.conjunction'); finish();
  await p.waitForFunction(() => !!window.ProofAtlasBranchInstantiation);
  assert.equal(await p.locator(scope + ' [data-instantiation-result]').count(), 0); assert.equal(await scene(), null); out.staleControls++;
  await p.unroute('**/proof-atlas-branch-instantiation.js*');
  assert.deepEqual(errors, []); assert.deepEqual(blocked, []); assert.equal(out.instantiationChecks, 66); assert.equal(out.genericDomainJumps, 66); assert.equal(out.sourceArgumentJumps, 1); assert.equal(out.instantiationFailureControls, 1); assert.equal(out.frames, 66); assert.equal(out.completeFrames, 1); assert.equal(out.accessibilityAudits, 4);
  const files = ['public/js/proof-atlas-branch-conclusion.js', 'public/js/proof-atlas-branch-instantiation.js', 'public/js/proof-atlas-method-flow.js',
    'public/js/proof-atlas-method-interfaces.js', 'public/css/proof-atlas-theme.css',
    'projects/proof-atlas/manual/index.html', base + 'check-browser.cjs'];
  out.files = Object.fromEntries(files.map(f => [f, sha(fs.readFileSync(f))]));
  for (const file of files.filter(f => f.startsWith('public/'))) {
    assert.equal(sha(fs.readFileSync('_site_production/' + file)), out.files[file]);
    const r = await p.request.get(origin + '/' + file); assert(r.ok()); assert.equal(sha(await r.body()), out.files[file]);
  }
  const html = await p.request.get(origin + '/projects/proof-atlas/manual/');
  assert.equal(sha(await html.body()), sha(fs.readFileSync('_site_production/projects/proof-atlas/manual/index.html')));
  out.manualHtmlSha256 = sha(await html.body());
  out.status = 'PASS'; out.scope = 'Literal substitution checks and existing complete/paged/manual/stress method views, exact signature fields and binders, input-position navigation, separate source selection, bounded index/argument pages, stale/optional failure controls and four accessibility audits. No new native judgment or comprehension measurement.';
  fs.writeFileSync(base + 'browser-check.json.gz', z.gzipSync(JSON.stringify(out, null, 2) + '\n'));
  console.log(JSON.stringify(out)); await browser.close();
})().catch(async error => {console.error(error.stack); if(auditPage) fs.writeFileSync(path.join(folder,'failure.json'), JSON.stringify({error:error.stack,report:auditReport,url:auditPage.url(),text:await auditPage.locator('body').innerText().catch(()=>null)},null,2)); await browser?.close(); process.exitCode = 1;});
