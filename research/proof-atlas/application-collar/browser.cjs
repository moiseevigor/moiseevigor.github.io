'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), z = require('zlib'), crypto = require('crypto'), assert = require('assert/strict'), { chromium } = require('playwright');
process.chdir(path.resolve(__dirname, '../../..'));
const base = 'research/proof-atlas/application-collar/', origin = process.env.ATLAS_ORIGIN || 'http://127.0.0.1:8877', folder = process.env.ATLAS_SCREENSHOTS || path.join(require('os').tmpdir(), 'atlas-application-collar');
const sha = b => crypto.createHash('sha256').update(b).digest('hex'), read = file => JSON.parse(z.gunzipSync(fs.readFileSync(file))), host = {}, checkerSha = sha(fs.readFileSync(__filename));
fs.mkdirSync(folder, { recursive: true }); vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/source-template-function-pages-manifest.js', 'utf8'), { window: host });
const inventory = host.PROOF_ATLAS_SOURCE_TEMPLATE_FUNCTION_PAGES, native = read('research/proof-atlas/source-template-inputs/native.json.gz');
const report = { format: 'ProofAtlasApplicationCollarBrowser/1', status: 'RUNNING', candidates: 0, values: 0, applications: 0, atomicValues: 0, ports: 0, binderLinks: 0, sourceAddresses: 0, pages: 0, audits: [], files: {} };
async function main() {
 const browser = await chromium.launch({ headless: true, executablePath: process.env.ATLAS_CHROMIUM_PATH }), context = await browser.newContext({ viewport: { width: 1500, height: 1100 } }), page = await context.newPage(), errors = [], forbidden = [];
 const blocked = new Set(native.profiles.flatMap(p => [p.record.indexFile, p.originalNativeOwner?.file]).filter(Boolean));
 await context.route('**/*', r => { const file = new URL(r.request().url()).pathname; if (blocked.has(file) || /\/(?:source-template-inputs|region-input-functions|region-input-adapters|dependent-region-inputs)\/native\.json\.gz$/.test(file)) { forbidden.push(file); return r.abort(); } return r.continue(); });
 await context.addInitScript(() => { localStorage.setItem('analytics-consent', 'no'); localStorage.setItem('theme', 'light'); }); page.on('pageerror', e => errors.push(String(e)));
 const state = () => page.evaluate(() => ProofAtlasNetworkStreamView.getRegionFunctionState()), block = () => page.locator('[data-declaration-window]'), collar = () => page.locator('[data-application-collar]');
 async function field(address) { await page.waitForFunction(a => { const s = ProofAtlasNetworkStreamView.getRegionFunctionState(); return !s.loading && s.selection?.node === a.node && JSON.stringify(s.selection.route) === JSON.stringify(a.route); }, address); assert.deepEqual((await state()).selection, address); }
 async function windowReady(offset) { await page.waitForFunction(n => { const s = ProofAtlasNetworkStreamView.getRegionFunctionState(); return !s.declarationWindow.loading && s.declarationWindow.ready && s.declarationWindow.offset === n; }, offset); }
 async function valueReady(index, offset = 0) { await page.waitForFunction(({ index, offset }) => { const s = ProofAtlasNetworkStreamView.getRegionFunctionState()?.valueStructure; return s && !s.loading && !s.previewLoading && s.data && s.index === index && s.offset === offset; }, { index, offset }); const s = await state(); assert(s.lease.cachedRows <= 64 && s.lease.indexPages <= 2 && s.lease.fullTableArchiveRequests === 0); assert(s.valueStructure.data.metadataBytes <= 1048576 && s.valueStructure.page.vertices <= 6); assert.equal(s.valueStructure.previewError, null); for (const p of s.valueStructure.previews) assert(p.text.length <= 96 && p.objects <= 48 && p.notationRows <= 8192 && p.notationBytes <= 4194304); assert.equal(s.lease.notation, undefined); assert.equal(await collar().count(), 1); assert.equal(await collar().locator('[data-ac-port]').count(), s.valueStructure.page.ports.length); return s.valueStructure; }
 async function open(profile, d) {
  const q = new URLSearchParams({ source: profile.source.indexSha256, edition: profile.source.edition, proof: profile.source.name, call: String(profile.members[0]), policy: d.id, rule: 'source-specializing', nativeCase: d.nativeCaseSha256 });
  const url = origin + '/projects/proof-atlas/manual/paged-network/?' + q + '#ns-lab'; if (page.url() === url) await page.reload(); else await page.goto(url);
  await page.waitForFunction(() => { const s = window.ProofAtlasNetworkStreamView?.getRegionFunctionState(); return s?.status === 'ready' && !s.loading && s.selection; }); await block().locator(':scope > summary').click(); await windowReady(0); return read('.' + d.file);
 }
 async function show(index) { const details = block().locator('[data-dw-value="' + index + '"]'); if (!await details.evaluate(e => e.open)) await details.locator(':scope > summary').click(); return valueReady(index); }
 try {
  let pagingChecked = false, originalJump = false;
  for (const [pi, profile] of inventory.profiles.entries()) for (const d of profile.cases) {
   const m = await open(profile, d), g = native.profiles[pi].native.cases.find(c => c.policy === d.id).graph;
   for (let start = 0; start < m.bindings.length; start += 4) {
    if (start) { await block().getByRole('button', { name: 'Next declarations', exact: true }).click(); await windowReady(start); assert.equal((await state()).valueStructure, null); }
    for (const [index, binding] of m.bindings.entries()) {
     if (index < start || index >= start + 4 || binding.kind === 'input' || binding.kind === 'adapter') continue;
     const v = await show(index), data = v.data; assert.equal(await block().locator('[data-dw-value][open]').count(), 1);
     for (let offset = 0; offset < Math.max(1, data.arguments); offset += 4) {
      if (offset) { await collar().getByRole('button', { name: 'Next arguments', exact: true }).click(); await valueReady(index, offset); }
      const current = (await state()).valueStructure; assert.equal(BigInt(current.page.retained) + BigInt(current.page.hidden), BigInt(data.expanded)); report.pages++;
      for (const port of current.page.ports) {
       if (offset && port.slot === 0) continue;
       let expected = m.components[0].root; for (const slot of port.address.route.slots) expected = g.children[expected][slot]; assert.equal(expected, port.address.node);
       const card = collar().locator('[data-ac-port="' + port.slot + '"]'); await card.locator('[data-ac-inspect]').click(); await field(port.address); report.ports++;
       if (port.reference) { const before = (await state()).selection; await card.locator('[data-ac-reference]').click(); if (port.reference.target.namespace === 'source-expression') { assert.deepEqual((await state()).sourceTarget, port.reference.target); assert.deepEqual((await state()).selection, before); } else await field(port.reference.target); report.binderLinks++; }
       if (port.original) { const link = card.locator('[data-ac-original]'); assert.equal(await link.count(), 1); if (await link.evaluate(e => e.tagName === 'A')) { const url = new URL(await link.getAttribute('href'), origin); assert.equal(url.searchParams.get('route'), port.original.route.root + ':' + port.original.route.slots.join('.')); assert.equal(url.hash, '#expr-' + port.original.node);
         if (!originalJump && profile.source.edition === 'published-15') { const source = await context.newPage(); try { await source.goto(url.href); await source.waitForFunction(() => window.ProofAtlasLibrary?.getSnapshot()); const selected = await source.evaluate(() => ProofAtlasLibrary.getSnapshot()); assert.equal(selected.indexSha256, profile.source.indexSha256); assert.equal(selected.selected, port.original.node); assert.deepEqual(selected.route, port.original.route); originalJump = true; } finally { await source.close(); } }
        } else { await link.click(); await page.waitForFunction(a => { const s = ProofAtlasNetworkStreamView.getSelection(); return s?.node === a.node && JSON.stringify(s.route) === JSON.stringify(a.route); }, port.original); await page.waitForFunction(p => { const s = ProofAtlasNetworkStreamView.getRegionFunctionState(); return !s.loading && JSON.stringify(s.sourceMatch?.source) === JSON.stringify(p.original) && JSON.stringify(s.sourceMatch?.counterpart) === JSON.stringify(p.address); }, port); await field(port.address); }
        report.sourceAddresses++;
       }
      }
     }
     if (data.application) { await collar().locator('[data-ac-result]').click(); await field(data.root); report.applications++; } else { assert.equal(await collar().locator('[data-ac-result]').count(), 0); report.atomicValues++; }
     if (!pagingChecked && data.arguments > 4) {
      // Return to the first page, retain removed controls and exercise native
      // keyboard paging across the boundary without moving the proof selection.
      while ((await state()).valueStructure.offset) await collar().getByRole('button', { name: 'Previous arguments', exact: true }).click();
      await collar().locator('[data-ac-inspect]').last().evaluate(e => window.__retiredPort = e); const oldSource = collar().locator('[data-ac-original]').last(); if (await oldSource.count()) await oldSource.evaluate(e => window.__retiredSource = e);
      const before = (await state()).selection, next = collar().getByRole('button', { name: 'Next arguments', exact: true }); await next.focus(); await page.keyboard.press('Enter'); await valueReady(index, 4); assert.deepEqual((await state()).selection, before);
      assert(await page.evaluate(() => { const focused = document.activeElement; return focused?.textContent === 'Next arguments' || focused?.textContent === 'Previous arguments'; }));
      const oldUrl = page.url(); await page.evaluate(() => { window.__retiredPort.click(); window.__retiredSource?.click(); }); assert.deepEqual((await state()).selection, before); assert.equal(page.url(), oldUrl); pagingChecked = true;
     }
     await collar().locator('[data-ac-inspect]').first().evaluate(e => window.__retiredValue = e);
     // Closing disposes this value, and its removed controls cannot act.
     await block().locator('[data-dw-value="' + index + '"] > summary').click(); await page.waitForFunction(() => ProofAtlasNetworkStreamView.getRegionFunctionState().valueStructure === null); const before = (await state()).selection; await page.evaluate(() => window.__retiredValue.click()); assert.deepEqual((await state()).selection, before); report.values++;
    }
   }
   report.candidates++; console.log('PASS value structures: ' + profile.source.name + ' · ' + d.id);
  }
  assert(pagingChecked && originalJump); report.keyboardPaging = true; report.retiredPagesRefused = true; report.retiredValuesRefused = true; report.originalJump = true;
  const profile = inventory.profiles[0], d = profile.cases.find(c => c.id === 'proof-arguments'), m = await open(profile, d), index = m.bindings.findIndex(b => b.kind === 'result');
  const shown = await show(index); assert.match(shown.previews.find(p => p.slot === 1).text, /T1/); assert.match(shown.previews.find(p => p.slot === 2).text, /T2/); report.riccatiArgumentPreviews = true;
  let entered, release; const arrival = new Promise(r => entered = r), gate = new Promise(r => release = r); let held = false;
  await page.route('**/*.page.gz*', async r => { if (!held && r.request().url().includes('/region-function-pages/')) { held = true; entered(); await gate; } await r.continue().catch(() => {}); });
  await collar().getByRole('button', { name: 'Read application inputs', exact: true }).click(); await Promise.race([arrival, new Promise((_, reject) => setTimeout(() => reject(Error('No active value page request intercepted')), 10000))]);
  assert((await state()).valueStructure.loading); const declaredType = (await state()).declarationWindow.declarations[0].domain;
  await block().locator('[data-dw-declaration]').first().getByRole('button', { name: 'Inspect declared type', exact: true }).click(); release(); await page.unroute('**/*.page.gz*'); await field(declaredType); assert.equal((await state()).valueStructure.data, null); assert.equal((await state()).valueStructure.loading, false);
  await collar().getByRole('button', { name: 'Read application inputs', exact: true }).click(); await valueReady(index); report.cancelAndRetry = true;
  await page.evaluate(() => document.fonts.ready); await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
  for (const width of [1500, 390]) for (const theme of ['light', 'dark']) { await page.setViewportSize({ width, height: 1100 }); await page.evaluate(t => document.documentElement.dataset.theme = t, theme); assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 3)); const violations = await block().evaluate(async e => (await axe.run(e, { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(v => v.id)); assert.deepEqual(violations, []); const file = 'application-' + width + '-' + theme + '.png'; await block().screenshot({ path: folder + '/' + file }); report.audits.push({ width, theme, violations: 0, screenshotSha256: sha(fs.readFileSync(folder + '/' + file)) }); }
  // A missing optional module retains the typed declarations and exact fields.
  await page.route('**/proof-atlas-application-collar.js?*', r => r.fulfill({ status: 503, body: 'unavailable' })); await open(profile, d); await block().locator('[data-dw-value="' + index + '"] > summary').click(); await page.waitForFunction(() => document.querySelector('[data-dw-value][open]')?.textContent.includes('reader unavailable')); assert.equal((await state()).valueStructure, null); await page.unroute('**/proof-atlas-application-collar.js?*'); report.missingModuleRetainsTypes = true;
  for (const file of ['public/js/proof-atlas-application-collar.js', 'public/js/proof-atlas-declaration-window.js', 'public/js/proof-atlas-region-function-pages-view.js', 'public/css/proof-atlas-declaration-window.css']) { const response = await page.request.get(origin + '/' + file), bytes = await response.body(); assert.equal(response.status(), 200); assert(bytes.equals(fs.readFileSync(file)) && bytes.equals(fs.readFileSync('_site_production/' + file))); report.files[file] = sha(bytes); }
  const url = '/projects/proof-atlas/manual/paged-network/', html = await (await page.request.get(origin + url)).body(); assert(html.equals(fs.readFileSync('_site_production' + url + 'index.html')));
  assert.equal(report.candidates, 30); assert.equal(report.values, 116); assert.equal(report.ports, 389); assert.equal(report.binderLinks, 273); assert.equal(report.sourceAddresses, 339); assert.deepEqual(errors, []); assert.deepEqual(forbidden, []); assert.equal(sha(fs.readFileSync(__filename)), checkerSha);
  report.status = 'PASS'; report.checkerSha256 = checkerSha; report.manualSourceSha256 = sha(fs.readFileSync('research/proof-atlas/network-streaming/index.html')); report.productionHtmlSha256 = sha(html); report.screenshotsPublished = false;
  report.scope = 'All 116 recorded value fields and every exposed port across 30 frozen candidates. Actual computed/binder selections, original position checks, finite lifecycle controls and four scoped theme/layout audits. No new native typing or comprehension measurement.';
  fs.writeFileSync(base + 'browser-check.json.gz', z.gzipSync(Buffer.from(JSON.stringify(report, null, 2) + '\n'), { mtime: 0 })); console.log(JSON.stringify(report));
 } finally { await browser.close(); }
}
main().catch(e => { console.error(e.stack); process.exitCode = 1; });
