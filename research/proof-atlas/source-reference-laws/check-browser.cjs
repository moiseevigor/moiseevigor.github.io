/* Check the new manual reference and served theorem assets after a real build. */
'use strict';
const {chromium} = require('playwright'), fs = require('fs'), path = require('path');
const crypto = require('crypto'), assert = require('assert/strict'), z = require('zlib');
process.chdir(path.resolve(__dirname, '../../..'));
const origin = process.env.ATLAS_ORIGIN || 'http://127.0.0.1:8866';
const folder = process.argv[2]; assert(folder, 'screenshot directory required');
fs.mkdirSync(folder, {recursive: true});
const base = 'research/proof-atlas/source-reference-laws/';
const sha = x => crypto.createHash('sha256').update(x).digest('hex');
let browser;
(async () => {
  browser = await chromium.launch({headless: true,
    ...(process.env.ATLAS_CHROMIUM_PATH ? {executablePath: process.env.ATLAS_CHROMIUM_PATH} : {})});
  const page = await browser.newPage({viewport: {width: 1480, height: 1050}});
  await page.addInitScript(() => {localStorage.setItem('analytics-consent', 'no'); localStorage.setItem('theme', 'light');});
  const response = await page.goto(origin + '/projects/proof-atlas/manual/');
  assert(response.ok()); const served = await response.body();
  const built = fs.readFileSync('_site_production/projects/proof-atlas/manual/index.html');
  assert.equal(sha(served), sha(built), 'browser must use the actual production build');
  await page.waitForFunction(() => window.ProofAtlasManual?.getScene());
  const rule = page.locator('#reference-refinement');
  assert((await rule.textContent()).includes('Refinement transfers the same amount from hidden to visible.'));
  assert.equal(await rule.locator('a').getAttribute('href'), '/' + base + 'README.md');
  const assets = {};
  for (const name of ['README.md', 'References.lean', 'Fixtures.lean', 'native.json.gz']) {
    const file = base + name, r = await page.request.get(origin + '/' + file);
    assert(r.ok(), file); const bytes = await r.body();
    assert.equal(sha(bytes), sha(fs.readFileSync(file)), 'served theorem asset: ' + file);
    assets[file] = sha(bytes);
  }
  for (const [width, theme] of [[1480, 'light'], [390, 'dark']]) {
    await page.setViewportSize({width, height: 1050});
    await page.evaluate(t => document.documentElement.dataset.theme = t, theme);
    await rule.evaluate(n => n.scrollIntoView({block: 'center'}));
    assert(await rule.isVisible());
    assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2));
    await rule.screenshot({path: path.join(folder, 'reference-refinement-' + width + '-' + theme + '.png')});
  }
  const normalized = built.toString().replace(/(href="\/public\/css\/(?:site|distill|syntax|theme)\.css\?v=)\d+(")/g, '$1BUILD_TIME$2');
  const report = {status: 'PASS', sourceSha256: sha(fs.readFileSync('projects/proof-atlas/manual/index.html')),
    checkerSha256: sha(fs.readFileSync('scripts/test-proof-atlas-manual-browser.cjs')),
    referenceCheckerSha256: sha(fs.readFileSync(base + 'check-browser.cjs')),
    normalizedSha256: sha(normalized), servedHtmlSha256: sha(served), assets,
    scope: 'Exact new manual paragraph/link, served original theorem assets and two rendered layouts. '
      + 'The separate existing manual suite covers interactive behavior and nine accessibility audits.'};
  fs.writeFileSync(base + 'rendered-manual.json.gz', z.gzipSync(JSON.stringify(report, null, 2) + '\n'));
  console.log(JSON.stringify(report)); await browser.close();
})().catch(async error => {console.error(error.stack); await browser?.close(); process.exitCode = 1;});
