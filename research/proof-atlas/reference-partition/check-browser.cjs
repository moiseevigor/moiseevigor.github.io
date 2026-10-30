'use strict';
const fs = require('fs'), path = require('path'), z = require('zlib'), vm = require('vm');
const crypto = require('crypto'), assert = require('assert/strict'), {chromium} = require('playwright');
process.chdir(path.resolve(__dirname, '../../..'));
const {cases} = require('../mixed-interfaces/inputs.cjs');
const W = require('../../../public/js/proof-atlas-occurrence-window'), P = require('../../../public/js/proof-atlas-packed-routes');
const C = require('../../../public/js/proof-atlas-syntax-counts'), M = require('../free-index-multiplicity/model.cjs');
const origin = process.env.ATLAS_ORIGIN || 'http://127.0.0.1:8866', folder = process.argv[2];
assert(folder, 'screenshot directory required'); fs.mkdirSync(folder, {recursive: true});
const base = 'research/proof-atlas/reference-partition/', sha = x => crypto.createHash('sha256').update(x).digest('hex');
const key = r => r.root + ':' + r.depth + ':' + r.slots;
const within = (a, b) => a.root === b.root && a.depth <= b.depth && key(a) === key(P.prefix(b, a.depth));
const out = {status: 'RUNNING', sourceComparisons: 0, frameComparisons: 0, bodyNavigation: false,
  exactTransfer: false, optionalFailurePreservesTotals: false, delayedRelease: false,
  unknownCountHasNoSplit: false, completeMode: false, rawUseCompatibility: false, accessibilityAudits: 0, wholeArchiveAttempts: 0};
let browser;
(async () => {
  let x, large; for await (const item of cases()) {
    if (item.edition === 'published-15' && item.record.name === 'JacobiData.slope_bound_abs') x = item;
    if (item.edition === 'working-26' && item.record.name === 'JacobiConcrete.AmplitudeChart.midpoint_polynomial') large = item;
    if (x && large) break;
  }
  assert(x && large); const h = {}; vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/syntax-counts-manifest.js', 'utf8'), {window: h});
  const d = h.PROOF_ATLAS_SYNTAX_COUNTS.records.find(d => d.name === x.record.name && d.edition === x.edition);
  const counts = await C.open(d, x.record, {fetcher: async f => new Response(fs.readFileSync(f.slice(1)))});
  const candidates = x.c.entries.filter(e => [6, 8].includes(x.c.data.kind[e.node]) && e.route.root === 1);
  let entry;
  for (const e of candidates) {
    const scene = W.create(x.c.data, x.record, e.route, {maxNodes: 32, maxDepth: 6}), a = await counts.forPoint(scene.nodes[0], scene.source);
    if (a?.status !== 'complete' || a.count === '0') continue;
    if (scene.nodes.some(n => n.binding?.node === e.node && key(n.binding.route) === key(e.route))) {entry = e; break;}
  }
  assert(entry, 'Riccati proof binder with an exposed source use'); counts.dispose();
  browser = await chromium.launch({headless: true, ...(process.env.ATLAS_CHROMIUM_PATH ? {executablePath: process.env.ATLAS_CHROMIUM_PATH} : {})});
  const page = await browser.newPage({viewport: {width: 1500, height: 1050}}), errors = [], forbidden = []; let pagedRequests = true;
  await page.addInitScript(() => {if (location.protocol.startsWith('http')) {localStorage.setItem('analytics-consent', 'no'); localStorage.setItem('theme', 'light');}});
  page.on('pageerror', e => errors.push(e.message));
  page.on('request', r => {const p = new URL(r.url()).pathname;
    if (pagedRequests && p.startsWith('/public/data/proof-atlas/') && p.endsWith('.gz') &&
      !['source-pages', 'type-pages', 'type-query-pages', 'construction-pages', 'variable-use-pages', 'syntax-count-pages'].some(d => p.startsWith('/public/data/proof-atlas/' + d + '/'))) forbidden.push(p);
  });
  const urlFor = (x, route, group, complete = false) => origin + '/projects/proof-atlas/library/?view=occurrence' + (complete ? '' : '&loading=paged') + '&counts=syntax&levels=6&edition=' + x.edition + '&proof=' + x.record.name +
    (group ? '&diagram=construction&group=' + group + '&members=8' : '') + '#occurrence=' + W.token(x.record, route);
  const url = (route, group, complete = false) => urlFor(x, route, group, complete);
  async function ready() {await page.waitForFunction(() => {
    const s = window.ProofAtlasOccurrenceView?.getSyntaxCountState(); return s?.enabled && !s.loading && (s.annotations.length || s.error);
  });}
  async function compare(framed, x) {
    const state = await page.evaluate(() => ProofAtlasOccurrenceView.getSyntaxCountState());
    assert.equal(state.error, null); assert.equal(state.partitionError, null);
    assert.equal(state.partitions.length, state.annotations.length); assert(state.partitions.length);
    const scene = await page.evaluate(f => f ? ProofAtlasOccurrenceView.getConstructionScene() : ProofAtlasOccurrenceView.getScene(), framed);
    if (!framed) assert.deepEqual(scene, W.create(x.c.data, x.record, scene.root.route, {maxNodes: scene.budget, maxDepth: scene.depthLimit, maxLayerNodes: scene.layerLimit}));
    for (const p of state.partitions) {
      const bodyDepth = P.resolve(x.c.data, p.body.route).scopeDepth, frontier = [], queries = [];
      let exposed = 0n;
      if (!framed) for (const n of scene.nodes) if (n.kind === 'bvar' && within(p.body.route, n.route)) {
        const at = P.resolve(x.c.data, n.route);
        if (x.c.data.payloads[n.node].index === at.scopeDepth - bodyDepth) exposed++;
      }
      const regions = framed ? scene.sourcePartition.regions : scene.nodes.flatMap(n => n.ports.filter(f => !f.displayed));
      for (const f of regions) if (within(p.body.route, f.route)) {
        const at = P.resolve(x.c.data, f.route), q = {node: at.node, index: at.scopeDepth - bodyDepth}; frontier.push(q);
      }
      const root = {node: p.body.node, index: 0};
      queries.push(...new Map([root, ...frontier].map(q => [q.node + ':' + q.index, q])).values());
      const result = M.evaluate(x.c.data, queries); assert.equal(result.status, 'complete');
      const values = new Map(result.rows.map(r => [r.node + ':' + r.index, BigInt(r.count)]));
      assert.equal(p.exposed, String(exposed));
      assert.equal(p.folded, String(frontier.reduce((n, q) => n + values.get(q.node + ':' + q.index), 0n)));
      assert.equal(p.total, String(values.get(root.node + ':0')));
      assert.equal(p.typing, 'not-queried');
      framed ? out.frameComparisons++ : out.sourceComparisons++;
    }
    return state;
  }
  const initialResponse = await page.goto(url(entry.route)); await ready();
  const builtHTML = fs.readFileSync('_site_production/projects/proof-atlas/library/index.html');
  assert.equal(sha(await initialResponse.body()), sha(builtHTML), 'served production HTML');
  out.html = {sourceSha256: sha(fs.readFileSync('projects/proof-atlas/library/index.html')),
    normalizedSha256: sha(builtHTML.toString().replace(/(href="\/public\/css\/(?:site|distill|syntax|theme)\.css\?v=)\d+(")/g, '$1BUILD_TIME$2'))};
  await page.getByLabel(/^Source nodes/).selectOption('1'); await ready();
  const coarse = (await compare(false, x)).partitions.find(p => key(p.binder.route) === key(entry.route));
  assert.equal(coarse.exposed, '0');
  await page.getByLabel(/^Source nodes/).selectOption('32'); await ready();
  const fine = (await compare(false, x)).partitions.find(p => key(p.binder.route) === key(entry.route));
  const exampleURL = new URL(url(entry.route));
  out.riccati = {name: x.record.name, edition: x.edition, indexSha256: x.record.indexSha256,
    path: exampleURL.pathname + exampleURL.search + exampleURL.hash,
    binder: {node: entry.node, route: entry.route, payload: x.c.data.payloads[entry.node]},
    coarse: {exposed: coarse.exposed, folded: coarse.folded, total: coarse.total},
    fine: {exposed: fine.exposed, folded: fine.folded, total: fine.total}};
  assert(BigInt(fine.exposed) > 0n); assert.equal(fine.total, coarse.total);
  assert.equal(BigInt(fine.exposed) - BigInt(coarse.exposed), BigInt(coarse.folded) - BigInt(fine.folded)); out.exactTransfer = true;
  pagedRequests = false; await page.goto(url(entry.route, null, true)); await ready();
  await page.getByLabel(/^Source nodes/).selectOption('32'); await ready();
  const complete = (await compare(false, x)).partitions.find(p => key(p.binder.route) === key(entry.route));
  assert.deepEqual(complete, fine); out.completeMode = true;
  pagedRequests = true; await page.goto(url(entry.route)); await ready();
  await page.getByLabel(/^Source nodes/).selectOption('32'); await ready();
  for (const width of [1500, 390]) for (const theme of ['light', 'dark']) {
    await page.setViewportSize({width, height: 1050}); await page.evaluate(t => document.documentElement.dataset.theme = t, theme);
    await page.addScriptTag({path: require.resolve('axe-core/axe.min.js')});
    const violations = await page.evaluate(async () => (await axe.run(document.querySelector('.pow-shell'), {runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa']}})).violations);
    assert.deepEqual(violations.map(v => ({id: v.id, nodes: v.nodes.map(n => n.target)})), []);
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
    const label = page.locator('[data-reference-partition="complete"]').first(); await label.scrollIntoViewIfNeeded();
    const card = label.locator('xpath=ancestor::*[contains(concat(" ",normalize-space(@class)," ")," pow-card ")]').first();
    await card.evaluate(n => n.scrollTop = 0);
    const bounds = await card.evaluate(n => {
      const c = n.getBoundingClientRect(), a = n.querySelector('[data-occurrence-node]').getBoundingClientRect(),
        b = n.querySelector('[data-reference-partition]').getBoundingClientRect();
      return {header: a.top >= c.top && a.bottom <= c.bottom, split: b.top >= c.top && b.bottom <= c.bottom};
    });
    assert(bounds.header && bounds.split, 'constructor and reference split must fit together');
    await card.screenshot({path: path.join(folder, 'reference-split-' + width + '-' + theme + '.png')}); out.accessibilityAudits++;
  }
  await page.locator('[data-source-use-activate]').click();
  await page.waitForFunction(() => {const s = ProofAtlasOccurrenceView.getSourceVariableUseState(); return !s.loading && (s.enabled || s.error);});
  assert.equal((await page.evaluate(() => ProofAtlasOccurrenceView.getSourceVariableUseState())).error, null);
  const beforeToggle = await page.evaluate(() => ({scene: ProofAtlasOccurrenceView.getScene(), selected: ProofAtlasOccurrenceView.getSnapshot()}));
  await page.locator('[data-syntax-counts]').uncheck();
  assert((await page.evaluate(() => ProofAtlasOccurrenceView.getSourceVariableUseState())).enabled);
  assert.deepEqual(await page.evaluate(() => ({scene: ProofAtlasOccurrenceView.getScene(), selected: ProofAtlasOccurrenceView.getSnapshot()})), beforeToggle);
  await page.locator('[data-syntax-counts]').check(); await ready(); await compare(false, x);
  await page.locator('[data-source-use-activate]').click();
  assert.equal((await page.evaluate(() => ProofAtlasOccurrenceView.getSourceVariableUseState())).enabled, false);
  out.rawUseCompatibility = true;
  await page.locator('.pow-card').first().locator('[data-window-field="' + (x.c.data.kind[entry.node] === 8 ? 2 : 1) + '"]').click();
  await page.waitForFunction(r => {const s = ProofAtlasOccurrenceView.getScene()?.root.route;
    return s?.root === r.root && s.depth === r.depth && s.slots === r.slots;
  }, fine.body.route);
  await page.waitForFunction(() => !ProofAtlasOccurrenceView.getSyntaxCountState().loading);
  const afterBody = await page.evaluate(() => ProofAtlasOccurrenceView.getSyntaxCountState());
  assert(afterBody.partitions.every(p => key(p.binder.route) !== key(entry.route)), 'outside binder total must retire');
  out.bodyNavigation = true;
  for (const group of ['interfaces', 'definitions']) {
    const at = group === 'definitions' ? candidates.find(e => x.c.data.kind[e.node] === 8) : entry;
    await page.goto(url(at.route, group)); await ready(); await compare(true, x);
  }
  const largeRoot = P.encode(large.c.data.declaration.rootPaths.indexOf('root.value'), []);
  await page.goto(urlFor(large, largeRoot)); await ready(); await compare(false, large);
  const residency = await page.evaluate(() => ProofAtlasOccurrenceView.getResidency());
  assert(residency.source.cachedNodes <= residency.source.nodeLimit);
  const largeState = await page.evaluate(() => ProofAtlasOccurrenceView.getSyntaxCountState());
  assert(largeState.residency.residentPages <= 1);
  out.largeSource = {name: large.record.name, edition: large.edition, indexSha256: large.record.indexSha256,
    storedNodes: large.record.uniqueNodes, sourceCacheRows: residency.source.cachedNodes,
    sourceCacheLimit: residency.source.nodeLimit, countPageBytes: largeState.residency.residentPageBytes,
    representedOccurrences: (await page.evaluate(() => ProofAtlasOccurrenceView.getScene())).stats.represented};
  await page.goto('about:blank'); await page.route('**/proof-atlas-reference-partition.js*', r => r.abort());
  await page.goto(url(entry.route)); await ready();
  let state = await page.evaluate(() => ProofAtlasOccurrenceView.getSyntaxCountState());
  assert.equal(state.error, null); assert(state.partitionError); assert(state.annotations.length); assert.deepEqual(state.partitions, []);
  assert(await page.locator('[data-count-status="complete"]').count());
  assert.equal(await page.locator('[data-reference-partition="complete"]').count(), 0);
  await page.unroute('**/proof-atlas-reference-partition.js*'); await page.locator('[data-syntax-count-retry]').click(); await ready(); await compare(false, x); out.optionalFailurePreservesTotals = true;
  await page.goto('about:blank');
  let hit, release; const started = new Promise(r => hit = r), gate = new Promise(r => release = r);
  await page.route('**/proof-atlas-reference-partition.js*', async r => {hit(); await gate; await r.continue();});
  await page.goto(url(entry.route), {waitUntil: 'domcontentloaded'}); await started;
  await page.locator('[data-syntax-counts]').uncheck(); release();
  await page.waitForFunction(() => !!window.ProofAtlasReferencePartition);
  assert.deepEqual(await page.evaluate(() => ProofAtlasOccurrenceView.getSyntaxCountState().partitions), []);
  assert.equal(await page.locator('[data-reference-partition]').count(), 0);
  await page.unroute('**/proof-atlas-reference-partition.js*');
  await page.locator('[data-syntax-counts]').check(); await ready(); await compare(false, x); out.delayedRelease = true;
  await page.goto('about:blank'); await page.route('**/syntax-count-pages/**/*.page.gz', r => r.abort());
  await page.goto(url(entry.route)); await ready(); state = await page.evaluate(() => ProofAtlasOccurrenceView.getSyntaxCountState());
  assert(state.error); assert.deepEqual(state.partitions, []); assert.equal(await page.locator('[data-reference-partition="complete"]').count(), 0); out.unknownCountHasNoSplit = true;
  assert.deepEqual(forbidden, []); assert.deepEqual(errors, []);
  const files = ['public/js/proof-atlas-reference-partition.js', 'public/js/proof-atlas-occurrence-view.js',
    'public/js/proof-atlas-library.js', 'public/css/proof-atlas-occurrence-window.css',
    'projects/proof-atlas/library/index.html', base + 'check-browser.cjs'];
  out.files = Object.fromEntries(files.map(f => [f, sha(fs.readFileSync(f))]));
  for (const file of files.filter(f => f.startsWith('public/'))) {
    assert.equal(sha(fs.readFileSync('_site_production/' + file)), out.files[file]);
    const response = await page.request.get(origin + '/' + file); assert(response.ok());
    assert.equal(sha(await response.body()), out.files[file], 'served runtime bytes: ' + file);
  }
  out.status = 'PASS'; out.scope = 'Production-browser source/frame reference partition, exact Riccati body navigation, finite optional-component/count failure and delayed-release controls, four accessibility audits. No new typing or comprehension evidence.';
  fs.writeFileSync(base + 'browser-check.json.gz', z.gzipSync(JSON.stringify(out, null, 2) + '\n'));
  console.log(JSON.stringify(out)); await browser.close();
})().catch(async error => {console.error(error.stack); await browser?.close(); process.exitCode = 1;});
