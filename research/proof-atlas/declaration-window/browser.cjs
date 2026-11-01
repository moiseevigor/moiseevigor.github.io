'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), z = require('zlib'), crypto = require('crypto'), assert = require('assert/strict'), { chromium } = require('playwright');
process.chdir(path.resolve(__dirname, '../../..'));
const base = 'research/proof-atlas/declaration-window/', origin = process.env.ATLAS_ORIGIN || 'http://127.0.0.1:8877', folder = process.env.ATLAS_SCREENSHOTS || path.join(require('os').tmpdir(), 'atlas-declaration-window');
const sha = b => crypto.createHash('sha256').update(b).digest('hex'), read = file => JSON.parse(z.gunzipSync(fs.readFileSync(file))), host = {};
const initialCheckerSha256 = sha(fs.readFileSync(__filename));
fs.mkdirSync(folder, { recursive: true });
for (const name of ['source-template-function-pages-manifest', 'region-function-pages-manifest', 'region-adapter-function-pages-manifest']) vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/' + name + '.js', 'utf8'), { window: host });
const inventory = host.PROOF_ATLAS_SOURCE_TEMPLATE_FUNCTION_PAGES;
const report = { format: 'ProofAtlasDeclarationWindowBrowser/1', status: 'RUNNING', profiles: 0, windows: 0, typeLinks: 0, computationLinks: 0, referenceLinks: 0, originalContextTargets: 0, typeLocalTargets: 0, originalLinks: 0, audits: [], files: {} };
async function main() {
 const browser = await chromium.launch({ headless: true, executablePath: process.env.ATLAS_CHROMIUM_PATH }), page = await browser.newPage({ viewport: { width: 1500, height: 1100 } }), errors = [], forbidden = [];
 page.on('pageerror', e => errors.push(String(e)));
 await page.route('**/*', r => { const file = new URL(r.request().url()).pathname; if (/\/(?:source-template-inputs|region-input-functions|region-input-adapters|dependent-region-inputs)\/native\.json\.gz$/.test(file)) { forbidden.push(file); return r.abort(); } return r.continue(); });
 await page.addInitScript(() => { localStorage.setItem('analytics-consent', 'no'); localStorage.setItem('theme', 'light'); });
 const state = () => page.evaluate(() => ProofAtlasNetworkStreamView.getRegionFunctionState());
 const panel = () => page.locator('[data-region-function-reader]'), block = () => page.locator('[data-declaration-window]');
 async function ready() { await page.waitForFunction(() => { const s = window.ProofAtlasNetworkStreamView?.getRegionFunctionState(); return s?.status === 'ready' && !s.loading && s.selection; }); }
 async function windowReady(start) {
  await page.waitForFunction(start => { const s = window.ProofAtlasNetworkStreamView?.getRegionFunctionState(); return s?.declarationWindow.ready && !s.declarationWindow.loading && s.declarationWindow.offset === start; }, start);
  const s = await state(), w = s.declarationWindow; assert(w.stats.objects <= 192 && w.stats.peakNotationRows <= 8192 && w.stats.peakNotationBytes <= 4194304); assert(s.lease.cachedRows <= 64 && s.lease.indexPages <= 2); assert.equal(s.lease.fullTableArchiveRequests, 0);
  assert.equal(await block().locator('[data-dw-declaration]').count(), w.declarations.length); return w;
 }
 async function selected(address) { await ready(); const s = await state(); assert.equal(s.selection.node, address.node); assert.equal(s.selection.component, address.component); assert.deepEqual(s.selection.route, address.route); }
 async function open(profile, policy = 'all-boundary-positions', rule = 'source-specializing') {
  const d = profile.cases.find(c => c.id === policy), q = new URLSearchParams({ source: profile.source.indexSha256, edition: profile.source.edition, proof: profile.source.name, call: String(profile.members[0]), policy, rule, nativeCase: d.nativeCaseSha256 });
  const target = origin + '/projects/proof-atlas/manual/paged-network/?' + q + '#ns-lab';
  if (page.url() === target) await page.reload(); else await page.goto(target); await ready();
  await block().locator('summary').click(); await windowReady(0); return read('.' + d.file);
 }
 try {
  for (const profile of inventory.profiles) {
   const m = await open(profile);
   for (let start = 0; start < m.bindings.length; start += 4) {
    if (start) { const before = (await state()).selection; await block().getByRole('button', { name: 'Next declarations', exact: true }).click(); await windowReady(start); assert.deepEqual((await state()).selection, before, 'reading a type window must not change exact selection'); }
    const w = await windowReady(start); report.windows++;
    for (const e of w.declarations) {
     const card = block().locator('[data-dw-declaration="' + e.index + '"]');
     await card.getByRole('button', { name: 'Inspect declared type', exact: true }).click(); await selected(e.domain); report.typeLinks++;
     if (m.bindings[e.index].kind !== 'input' && m.bindings[e.index].kind !== 'adapter') { await card.getByRole('button', { name: 'Inspect computation', exact: true }).click(); await ready(); assert.deepEqual((await state()).selection.route.slots, [...m.bindings[e.index].slots, 1]); report.computationLinks++; }
     const link = card.locator('a'); if (await link.count()) { const url = new URL(await link.getAttribute('href'), origin), original = m.bindings[e.index].source; assert.equal(url.searchParams.get('route'), original.route.root + ':' + original.route.slots.join('.')); assert.equal(url.hash, '#expr-' + original.node); assert.equal(url.searchParams.get('proof'), profile.source.name); report.originalLinks++; }
     const unique = []; for (const ref of e.references) if (!unique.some(r => JSON.stringify(r.target) === JSON.stringify(ref.target))) unique.push(ref);
     const reference = unique.slice(0, 4).find(r => r.relation === 'earlier-declaration');
     if (reference) { await card.locator('.dw-references').getByRole('button', { name: 'declaration ' + (reference.declaration + 1), exact: true }).click(); await selected(reference.target); report.referenceLinks++; }
     for (const relation of ['original-context', 'type-local']) {
      const ref = unique.slice(0, 4).find(r => r.relation === relation); if (!ref) continue;
      const before = (await state()).selection, text = ref.label + (relation === 'original-context' ? ' · original context' : ' · type-local binder');
      await card.locator('.dw-references').getByRole('button', { name: text, exact: true }).first().click();
      if (relation === 'original-context') { assert.deepEqual((await state()).sourceTarget, ref.target); assert.deepEqual((await state()).selection, before); report.originalContextTargets++; }
      else { await selected(ref.target); report.typeLocalTargets++; }
     }
    }
   }
   report.profiles++; console.log('PASS declaration windows: ' + profile.source.name);
  }
  // Existing rules use the same telescope rule, including supplied adapters.
  for (const [key, rule, policy] of [['PROOF_ATLAS_REGION_FUNCTION_PAGES', 'direct', 'proof-arguments'], ['PROOF_ATLAS_REGION_ADAPTER_FUNCTION_PAGES', 'adapters', 'all-boundary-positions']]) {
   const profile = host[key].profiles.find(p => p.source.name === 'JacobiData.slope_bound_abs'), m = await open(profile, policy, rule); await windowReady(0);
   if (rule === 'adapters') {
    const index = m.bindings.findIndex(b => b.kind === 'adapter'); assert(index >= 0);
    for (let start = 4; start <= Math.floor(index / 4) * 4; start += 4) { await block().getByRole('button', { name: 'Next declarations', exact: true }).click(); await windowReady(start); }
    const e = (await state()).declarationWindow.declarations.find(e => e.index === index); assert.equal(e.role, 'Supplied adapter');
    await block().locator('[data-dw-declaration="' + index + '"]').getByRole('button', { name: 'Inspect declared type', exact: true }).click(); await selected(e.domain); report.suppliedAdapterType = true;
   }
  }
  const riccati = inventory.profiles.find(p => p.source.name === 'JacobiData.slope_bound_abs');
  await open(riccati, 'proof-arguments');
  const before = (await state()).selection, next = block().getByRole('button', { name: 'Next declarations', exact: true }); await next.focus(); await page.keyboard.press('Enter'); await windowReady(4); assert.deepEqual((await state()).selection, before); const keyboardFocusPreserved = await next.evaluate(e => document.activeElement === e); report.keyboardPaging = true;
  await block().getByRole('button', { name: 'Previous declarations', exact: true }).click(); await windowReady(0);
  const first = block().locator('[data-dw-declaration]').first(); await first.getByRole('button', { name: 'Inspect declared type', exact: true }).click(); await ready();
  await panel().getByRole('button', { name: 'Read field notation', exact: true }).click(); await page.waitForFunction(() => { const s = ProofAtlasNetworkStreamView.getRegionFunctionState(); return s.notation && !s.notation.loading && s.notation.stats; });
  const oldSelection = (await state()).selection; await block().getByRole('button', { name: 'Next declarations', exact: true }).click(); await windowReady(4); assert.equal((await state()).notation, null); assert.deepEqual((await state()).selection, oldSelection); report.singleNotationCacheHandoff = true;
  await block().getByRole('button', { name: 'Previous declarations', exact: true }).click(); await windowReady(0);
  // Retired DOM handlers cannot mutate the new interface.
  await first.getByRole('button', { name: 'Inspect declared type', exact: true }).evaluate(e => window.__retiredDeclaration = e);
  await panel().locator('[data-region-function-rule]').selectOption('direct');
  await page.waitForFunction(() => ProofAtlasNetworkStreamView.getRegionFunctionState()?.status === 'kernel-rejected');
  const rejected = await state(); await page.evaluate(() => window.__retiredDeclaration.click()); assert.deepEqual(await state(), rejected); assert(await block().isHidden()); assert.equal(await block().locator('[data-dw-declaration]').count(), 0); report.retiredHandlersRefused = true;
  // Cancel a live page request by changing the selected field. The cancelled
  // four-type read cannot publish a partially constructed window.
  await open(riccati, 'proof-arguments'); let release, entered; const gate = new Promise(r => release = r), arrival = new Promise(r => entered = r); let held = false;
  await page.route('**/*.page.gz*', async r => { if (!held && new URL(r.request().url()).pathname.includes('/region-function-pages/')) { held = true; entered(); await gate; } await r.continue().catch(() => {}); });
  await block().getByRole('button', { name: 'Next declarations', exact: true }).click(); await Promise.race([arrival, new Promise((_, reject) => setTimeout(() => reject(Error('No live declaration page request intercepted')), 10000))]);
  assert((await state()).declarationWindow.loading);
  await panel().getByRole('button', { name: 'Read field notation', exact: true }).click(); release(); await page.unroute('**/*.page.gz*');
  await page.waitForFunction(() => { const s = ProofAtlasNetworkStreamView.getRegionFunctionState(); return !s.declarationWindow.loading && s.notation?.stats && !s.notation.loading; });
  assert.equal((await state()).declarationWindow.ready, false); report.cancelledWindowCleared = true;
  await block().getByRole('button', { name: 'Read these declarations', exact: true }).click(); await windowReady(4); report.cancelledWindowRetry = true;
  const riccatiManifest = await open(riccati, 'proof-arguments'), originalHref = await block().locator('[data-dw-declaration]').first().locator('a').getAttribute('href');
  const atom = block().locator('[data-dw-declaration]').first().locator('[data-tn-pick]').first(), slots = JSON.parse(await atom.getAttribute('data-tn-pick'));
  const native = read('research/proof-atlas/source-template-inputs/native.json.gz'), graph = native.profiles.find(p => p.source.name === riccati.source.name).native.cases.find(c => c.policy === 'proof-arguments').graph;
  let atomNode = riccatiManifest.components[0].root; for (const slot of slots) atomNode = graph.children[atomNode][slot];
  const domain = (await state()).declarationWindow.declarations[0].domain;
  await atom.click(); await selected({ ...domain, node: atomNode, route: { root: domain.component, slots } }); report.exactNotationSymbol = true;
  const sourcePage = await browser.newPage();
  try {
   await sourcePage.goto(new URL(originalHref, origin).href); await sourcePage.waitForFunction(() => window.ProofAtlasLibrary?.getSnapshot());
   const picked = await sourcePage.evaluate(() => ProofAtlasLibrary.getSnapshot()), expected = riccatiManifest.bindings[0].source;
   assert.equal(picked.selected, expected.node); assert.deepEqual(picked.route, expected.route); assert.equal(picked.indexSha256, riccati.source.indexSha256); assert.equal(picked.sourceSha256, riccati.source.sourceSha256); report.exactOriginalSourceJump = true;
  } finally { await sourcePage.close(); }
  await page.evaluate(() => document.fonts.ready); await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  for (const width of [1500, 390]) for (const theme of ['light', 'dark']) {
   await page.setViewportSize({ width, height: 1100 }); await page.evaluate(t => document.documentElement.dataset.theme = t, theme);
   assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 3), 'page overflow');
   const violations = await block().evaluate(async e => (await axe.run(e, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(v => v.id)); assert.deepEqual(violations, []);
   const file = 'declarations-' + width + '-' + theme + '.png'; await block().screenshot({ path: folder + '/' + file }); report.audits.push({ width, theme, violations: 0, screenshotSha256: sha(fs.readFileSync(folder + '/' + file)) });
  }
  assert(keyboardFocusPreserved, 'Keyboard paging must retain focus');
  for (const file of ['public/js/proof-atlas-declaration-window.js', 'public/js/proof-atlas-region-function-pages-view.js', 'public/css/proof-atlas-declaration-window.css']) { const response = await page.request.get(origin + '/' + file), bytes = await response.body(); assert.equal(response.status(), 200); assert(bytes.equals(fs.readFileSync(file)) && bytes.equals(fs.readFileSync('_site_production/' + file))); report.files[file] = sha(bytes); }
  const url = '/projects/proof-atlas/manual/paged-network/', html = await (await page.request.get(origin + url)).body(); assert(html.equals(fs.readFileSync('_site_production' + url + 'index.html')));
  assert.deepEqual(errors, []); assert.deepEqual(forbidden, []); assert.equal(sha(fs.readFileSync(__filename)), initialCheckerSha256, 'Checker changed during execution'); report.status = 'PASS'; report.checkerSha256 = initialCheckerSha256; report.manualSourceSha256 = sha(fs.readFileSync('research/proof-atlas/network-streaming/index.html')); report.productionHtmlSha256 = sha(html); report.screenshotsPublished = false;
  report.scope = 'All windows of ten all-position profiles, two additional existing rules, exact declared-type/computation/reference/source links and finite lifecycle controls. Four scoped axe audits are not a complete accessibility or comprehension study. No complete native archive requested.';
  fs.writeFileSync(base + 'browser-check.json.gz', z.gzipSync(Buffer.from(JSON.stringify(report, null, 2) + '\n'), { mtime: 0 })); console.log(JSON.stringify(report));
 } finally { await browser.close(); }
}
main().catch(e => { console.error(e.stack); process.exitCode = 1; });
