/* Normal production reader: Riccati assumptions, definitions and exact type origins. */
'use strict';
const fs = require('fs'), vm = require('vm'), z = require('zlib'), assert = require('assert/strict');
const {chromium} = require('playwright');
const T = require('../public/js/proof-atlas-deep-context'), F = require('../public/js/proof-atlas-occurrence-context-frame');
const h = {};
for (const name of ['library-manifest', 'occurrence-types-manifest', 'let-result-pools-manifest']) {
  vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/' + name + '.js', 'utf8'), {window: h});
}
const raw = file => z.gunzipSync(fs.readFileSync('.' + file), {maxOutputLength: 67108864});
const origin = process.env.ATLAS_ORIGIN || 'http://127.0.0.1:8833';
const folder = process.env.ATLAS_SCREENSHOTS || '/tmp/atlas-riccati-context-browser';
(async () => {
  fs.mkdirSync(folder, {recursive: true});
  const browser = await chromium.launch({headless: true, ...(process.env.ATLAS_CHROMIUM_PATH ? {executablePath: process.env.ATLAS_CHROMIUM_PATH} : {})});
  const page = await browser.newPage({viewport: {width: 1700, height: 1100}}), errors = [], forbidden = [];
  const report = {status: 'RUNNING', profiles: 0, frameComparisons: 0, typeViews: 0, sourceFocuses: 0, accessibilityAudits: 0, rows: []};
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    const p = new URL(request.url()).pathname;
    if (p.startsWith('/public/data/proof-atlas/') && p.endsWith('.gz') &&
        !['source-pages', 'type-pages', 'type-query-pages', 'construction-pages'].some(d => p.startsWith('/public/data/proof-atlas/' + d + '/'))) forbidden.push(p);
  });
  await page.addInitScript(() => {
    if (/^https?:$/.test(location.protocol)) {localStorage.setItem('analytics-consent', 'no'); localStorage.setItem('theme', 'light');}
  });
  try {
    for (const edition of ['published-15', 'working-26']) {
      const record = h.PROOF_ATLAS_LIBRARY.editions.find(e => e.id === edition).declarations.find(r => r.name === 'JacobiData.slope_bound_abs');
      const same = d => d.edition === edition && d.name === record.name;
      const td = h.PROOF_ATLAS_OCCURRENCE_TYPES.records.find(same), ld = h.PROOF_ATLAS_LET_REDUCTIONS.records.find(same), bytes = raw(record.indexFile);
      const pkg = T.mergeRecorded(await T.recorded(bytes, raw(td.file), td, record), await T.recordedLets(bytes, raw(ld.file), ld, record));
      const c = pkg.case(record.name), model = F.open(c), root = {format: 'ProofAtlasPackedRoute/1', root: 1, depth: 0, slots: ''};
      const frame = model.create(root, {maxMembers: 64});
      const url = origin + '/projects/proof-atlas/library/?view=occurrence&loading=paged&diagram=construction&group=contexts&members=64&edition=' + edition + '&proof=' + record.name + '#occurrence=' + record.indexSha256 + '.1.0.';
      await page.goto(url);
      await page.waitForFunction(() => window.ProofAtlasOccurrenceView?.getConstructionScene()?.members?.length === 12);
      assert.deepEqual(await page.evaluate(() => ProofAtlasOccurrenceView.getConstructionScene()), JSON.parse(JSON.stringify(frame)));
      report.frameComparisons++;
      if (edition === 'working-26') assert(await page.getByText('No construction record at this exact body occurrence.', {exact: true}).isVisible());
      const addresses = [...frame.members.map((_, i) => ({member: i})), ...frame.headers.map(p => p.address), frame.continuation.address];
      for (const address of addresses) {
        const expected = T.typeScene(await model.typeFor(frame, address), c.data);
        await page.locator('[data-context-frame-type]').evaluateAll((buttons, address) => buttons.find(b => b.dataset.contextFrameType === address).click(), JSON.stringify(address));
        await page.waitForFunction(hash => ProofAtlasOccurrenceView.getTypeScene()?.origin.typeComponentSha256 === hash, expected.origin.typeComponentSha256);
        assert.deepEqual(await page.evaluate(() => ProofAtlasOccurrenceView.getTypeScene()), JSON.parse(JSON.stringify(expected)));
        report.typeViews++;
      }
      const address = {member: 10, field: 'value'}, expected = await model.typeFor(frame, address), route = model.resolve(frame, address);
      await page.locator('[data-context-frame-point]').evaluateAll((buttons, address) => buttons.find(b => b.dataset.contextFramePoint === address).click(), JSON.stringify(address));
      await page.waitForFunction(hash => ProofAtlasOccurrenceView.getSnapshot()?.native?.typeComponentSha256 === hash, expected.typeComponentSha256);
      const snapshot = await page.evaluate(() => ProofAtlasOccurrenceView.getSnapshot());
      assert.equal(snapshot.node, 1227); assert.equal(snapshot.scopeDepth, 10); assert.equal(snapshot.native.role, 'proof'); assert.deepEqual(snapshot.route, route);
      await page.locator('[data-context-frame-member="10"]').scrollIntoViewIfNeeded();
      await page.screenshot({path: folder + '/' + edition + '-amgm.png', fullPage: true});
      if (edition === 'published-15') {
        await page.addScriptTag({path: require.resolve('axe-core/axe.min.js')});
        for (const width of [1700, 390]) for (const theme of ['light', 'dark']) {
          await page.setViewportSize({width, height: 1100});
          await page.evaluate(t => document.documentElement.dataset.theme = t, theme);
          assert.deepEqual(await page.evaluate(async () => (await axe.run({include: [['main']]}, {runOnly: {type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa']}})).violations.map(v => ({id: v.id, targets: v.nodes.map(n => n.target)}))), []);
          assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 3));
          report.accessibilityAudits++;
        }
        await page.setViewportSize({width: 1700, height: 1100});
      }
      await page.locator('[data-context-frame-point]').evaluateAll((buttons, address) => {
        const point = buttons.find(b => b.dataset.contextFramePoint === address);
        [...point.closest('.pcf-header').querySelectorAll('button')].find(b => b.textContent === 'Focus source').click();
      }, JSON.stringify(address));
      await page.waitForFunction(route => JSON.stringify(ProofAtlasOccurrenceView.getScene()?.root.route) === JSON.stringify(route), route);
      await page.waitForFunction(() => ProofAtlasOccurrenceView.getSnapshot()?.node === 1227 && ProofAtlasOccurrenceView.getNativeState().matched);
      assert.equal((await page.evaluate(() => ProofAtlasOccurrenceView.getSnapshot())).scopeDepth, 10);
      report.sourceFocuses++; report.profiles++;
      report.rows.push({edition, members: 12, typeViews: addresses.length, amgmNode: 1227, amgmContext: 10, continuationStatus: frame.stop});
    }
    assert.equal(report.typeViews, 62); assert.equal(report.profiles, 2); assert.deepEqual(errors, []); assert.deepEqual(forbidden, []);
    report.status = 'PASS'; report.completeArchiveRequests = 0;
    report.scope = 'Normal production page and registries, with complete-reference comparisons. Finite selected Riccati contexts; no full proof coverage or comprehension claim.';
    fs.writeFileSync(folder + '/riccati-context-browser.json', JSON.stringify(report, null, 2) + '\n');
    console.log(JSON.stringify(report));
  } finally {await browser.close();}
})().catch(error => {console.error(error.stack); process.exit(1);});
