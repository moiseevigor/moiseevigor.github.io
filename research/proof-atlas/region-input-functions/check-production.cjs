'use strict';
const fs = require('fs');
const path = require('path');
const zlib = require('zlib');
const crypto = require('crypto');
const assert = require('assert/strict');
const { execFileSync } = require('child_process');
const { chromium } = require('playwright');
process.chdir(path.resolve(__dirname, '../../..'));

const base = 'research/proof-atlas/region-input-functions/';
const origin = process.env.ATLAS_ORIGIN || 'http://127.0.0.1:8877';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const read = file => JSON.parse(zlib.gunzipSync(fs.readFileSync(file)));

async function main() {
  const browser = await chromium.launch({
    headless: true,
    ...(process.env.ATLAS_CHROMIUM_PATH ? { executablePath: process.env.ATLAS_CHROMIUM_PATH } : {})
  });
  try {
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.addInitScript(() => {
      localStorage.setItem('analytics-consent', 'no');
      localStorage.setItem('theme', 'light');
    });
    await page.goto(origin + '/projects/proof-atlas/manual/paged-network/#region-input-functions');
    await page.waitForFunction(() => window.ProofAtlasNetworkStreamView);
    const section = page.locator('#region-input-functions');
    assert.match(await section.innerText(), /offline checked artifact/);
    assert.match(await section.innerText(), /five proof arguments/);
    assert.match(await section.innerText(), /other thirty positions/);
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    const audits = [];
    for (const width of [1500, 390]) for (const theme of ['light', 'dark']) {
      await page.setViewportSize({ width, height: 1000 });
      await page.emulateMedia({ colorScheme: theme, reducedMotion: 'reduce' });
      await page.evaluate(async value => {
        document.documentElement.dataset.theme = value;
        await Promise.all(document.getAnimations().filter(animation =>
          animation.effect.getTiming().iterations !== Infinity
        ).map(animation => animation.finished.catch(() => {})));
      }, theme);
      await section.scrollIntoViewIfNeeded();
      const violations = await page.evaluate(async () => (await axe.run(document.body, {
        runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] }
      })).violations.map(value => ({ id: value.id, targets: value.nodes.map(node => node.target) })));
      assert.deepEqual(violations, []);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 3));
      const viewport = section.getByRole('region');
      const overflow = await viewport.evaluate(node => node.scrollWidth > node.clientWidth);
      let keyboardPan = false;
      if (overflow) {
        await viewport.evaluate(node => { node.scrollLeft = 0; });
        await viewport.focus();
        await page.keyboard.press('ArrowRight');
        await page.waitForFunction(() => document.querySelector('#region-input-functions [role="region"]').scrollLeft > 0);
        keyboardPan = true;
        await viewport.evaluate(node => { node.scrollLeft = 0; });
      }
      const screenshot = `production-${width}-${theme}.png`;
      await section.screenshot({ path: base + screenshot });
      audits.push({ width, theme, violations: 0, overflow, keyboardPan,
        screenshot, sha256: hash(fs.readFileSync(base + screenshot)) });
    }

    const figure = read(base + 'figure.json.gz');
    const portals = [];
    for (const portal of figure.portals) {
      await page.goto(origin + '/' + base + 'riccati-module.svg');
      const link = page.getByRole('link', { name: portal.label, exact: true });
      assert.equal(await link.count(), 1);
      assert.equal(await link.getAttribute('href'), portal.href);
      await link.focus();
      await page.keyboard.press('Enter');
      await page.waitForFunction(value =>
        window.ProofAtlasLibrary?.getSnapshot()?.selected === value.node &&
        ProofAtlasLibrary.getSnapshot().path === value.path &&
        ProofAtlasLibrary.getScene()?.source.name === value.name,
      { node: portal.anchor.node, path: portal.path, name: portal.source.name }, { timeout: 60000 });
      const selected = await page.evaluate(() => ({
        snapshot: ProofAtlasLibrary.getSnapshot(), source: ProofAtlasLibrary.getScene().source
      }));
      assert.equal(selected.source.indexSha256, portal.source.indexSha256);
      portals.push({ label: portal.label, node: selected.snapshot.selected,
        path: selected.snapshot.path, source: selected.source });
    }
    assert.equal(portals.length, 13);

    await page.goto(origin + '/projects/proof-atlas/program/');
    assert.equal(await page.getByRole('link', { name: 'checked input functions', exact: true }).getAttribute('href'), '/' + base + 'README.md');
    assert.equal(await page.getByRole('link', { name: 'Source-linked schematic', exact: true }).getAttribute('href'), '/projects/proof-atlas/manual/paged-network/#region-input-functions');

    const files = {};
    const artifacts = ['README.md', 'Native.lean', 'prepare.cjs', 'build.py', 'verify.py',
      'check-negative.py', 'model.cjs', 'check.cjs', 'figure.cjs', 'render.cjs', 'check-production.cjs',
      'native.json.gz', 'verification.json.gz', 'model.json.gz', 'refusals.json.gz',
      'retirement.json.gz', 'figure.json.gz', 'presentation.json.gz', 'riccati-module.svg',
      'riccati-module.png', 'riccati-module-dark.png'];
    const prior = read('research/proof-atlas/region-composition-view/browser-check.json.gz');
    for (const file of [...artifacts.map(name => base + name), ...Object.keys(prior.files)]) {
      const response = await page.request.get(origin + '/' + file);
      assert.equal(response.status(), 200, file);
      const bytes = await response.body();
      assert(bytes.equals(fs.readFileSync(file)), 'Source/served mismatch: ' + file);
      assert(bytes.equals(fs.readFileSync('_site_production/' + file)), 'Built/served mismatch: ' + file);
      if (Object.hasOwn(prior.files, file)) assert(bytes.equals(execFileSync('git', ['show', 'HEAD:' + file])), 'Application changed in this iteration: ' + file);
      files[file] = hash(bytes);
    }
    assert.deepEqual(errors, []);
    const report = { format: 'ProofAtlasRegionInputFunctionProduction/1', status: 'PASS',
      audits, sourcePortals: portals, keyboard: true, pageErrors: errors, files,
      html: Object.fromEntries(['projects/proof-atlas/manual/paged-network/index.html',
        'projects/proof-atlas/program/index.html'].map(file => [file, hash(fs.readFileSync('_site_production/' + file))])),
      applicationReferenceCommit: execFileSync('git', ['rev-parse', 'HEAD'], { encoding: 'utf8' }).trim(),
      checkerSha256: hash(fs.readFileSync(__filename)),
      scope: 'Actual production build, four responsive/theme layouts, all thirteen original-source portals, keyboard navigation and unchanged application assets. The checked function remains an offline artifact, not a new interactive computed component. No deployment or comprehension measurement.' };
    fs.writeFileSync(base + 'production-check.json.gz', zlib.gzipSync(Buffer.from(JSON.stringify(report, null, 2) + '\n'), { mtime: 0 }));
    console.log(JSON.stringify({ status: 'PASS', audits: audits.length, sourcePortals: portals.length }));
  } finally {
    await browser.close();
  }
}
main().catch(error => { console.error(error.stack); process.exitCode = 1; });
