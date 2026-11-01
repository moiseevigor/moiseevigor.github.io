'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), z = require('zlib'), crypto = require('crypto'), assert = require('assert/strict'), { chromium } = require('playwright');
process.chdir(path.resolve(__dirname, '../../..'));
const base = 'research/proof-atlas/application-collar/', origin = process.env.ATLAS_ORIGIN || 'http://127.0.0.1:8877', sha = b => crypto.createHash('sha256').update(b).digest('hex'), checkerSha = sha(fs.readFileSync(__filename)), host = {};
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/source-template-function-pages-manifest.js', 'utf8'), { window: host });
const profile = host.PROOF_ATLAS_SOURCE_TEMPLATE_FUNCTION_PAGES.profiles[0], d = profile.cases.find(c => c.id === 'all-boundary-positions'), m = JSON.parse(z.gunzipSync(fs.readFileSync('.' + d.file)));
async function main() {
 const browser = await chromium.launch({ headless: true, executablePath: process.env.ATLAS_CHROMIUM_PATH }), page = await browser.newPage({ viewport: { width: 1500, height: 1100 } }), errors = [];
 page.on('pageerror', e => errors.push(String(e))); await page.addInitScript(() => localStorage.setItem('analytics-consent', 'no'));
 const q = new URLSearchParams({ source: profile.source.indexSha256, edition: profile.source.edition, proof: profile.source.name, call: String(profile.members[0]), policy: d.id, rule: 'source-specializing', nativeCase: d.nativeCaseSha256 });
 const state = () => page.evaluate(() => ProofAtlasNetworkStreamView.getRegionFunctionState()), detail = i => page.locator('[data-dw-value="' + i + '"]');
 async function ready(i) { await page.waitForFunction(i => { const s = ProofAtlasNetworkStreamView.getRegionFunctionState(); return s.valueStructure?.index === i && !s.valueStructure.loading && !s.valueStructure.previewLoading && s.valueStructure.data; }, i); const s = await state(); assert.equal(s.valueStructure.previewError, null); assert(s.lease.cachedRows <= 64 && s.lease.indexPages <= 2); return s; }
 let release = () => {};
 try {
  await page.goto(origin + '/projects/proof-atlas/manual/paged-network/?' + q + '#ns-lab'); await page.waitForFunction(() => { const s = window.ProofAtlasNetworkStreamView?.getRegionFunctionState(); return s?.status === 'ready' && !s.loading && s.selection; });
  await page.locator('[data-declaration-window] > summary').click(); await page.waitForFunction(() => ProofAtlasNetworkStreamView.getRegionFunctionState().declarationWindow.ready);
  let start = 0, values;
  for (; start < m.bindings.length; start += 4) { values = m.bindings.slice(start, start + 4).map((b, n) => ({ b, i: start + n })).filter(p => p.b.kind !== 'input' && p.b.kind !== 'adapter'); if (values.length >= 2) break; }
  assert(values.length >= 2); while ((await state()).declarationWindow.offset < start) { await page.getByRole('button', { name: 'Next declarations', exact: true }).click(); await page.waitForFunction(() => { const s = ProofAtlasNetworkStreamView.getRegionFunctionState().declarationWindow; return s.ready && !s.loading; }); }
  const [a, b] = values.map(p => p.i), before = (await state()).selection;
  await detail(a).locator(':scope > summary').click(); await ready(a); await page.locator('[data-application-collar] [data-ac-inspect]').first().evaluate(e => window.__oldA = e);
  await detail(b).locator(':scope > summary').click(); await ready(b); assert.equal(await detail(a).evaluate(e => e.open), false); assert.equal(await page.locator('[data-dw-value][open]').count(), 1); await page.evaluate(() => window.__oldA.click()); assert.deepEqual((await state()).selection, before);
  // Hold a real provider request, then replace its value while it is live.
  let entered; const arrival = new Promise(r => entered = r), gate = new Promise(r => release = r); let held = false;
  await page.route('**/*.page.gz*', async r => { if (!held && r.request().url().includes('/region-function-pages/')) { held = true; entered(); await gate; } await r.continue().catch(() => {}); });
  await page.getByRole('button', { name: 'Read application inputs', exact: true }).click(); await Promise.race([arrival, new Promise((_, reject) => setTimeout(() => reject(Error('No live value request intercepted')), 10000))]);
  assert((await state()).valueStructure.loading || (await state()).valueStructure.previewLoading);
  await detail(a).locator(':scope > summary').click(); release(); await page.unroute('**/*.page.gz*'); await ready(a);
  assert.equal(await detail(b).evaluate(e => e.open), false); assert.equal(await page.locator('[data-application-collar]').count(), 1); assert.deepEqual((await state()).selection, before);
  // A rejected policy cannot retain the preceding checked value diagram.
  await page.locator('[data-region-function-rule]').selectOption('direct'); await page.waitForFunction(() => ProofAtlasNetworkStreamView.getRegionFunctionState().status === 'kernel-rejected');
  assert.equal((await state()).valueStructure, null); assert.equal(await page.locator('[data-application-collar]').count(), 0); assert(await page.locator('[data-declaration-window]').isHidden()); assert.deepEqual(errors, []); assert.equal(sha(fs.readFileSync(__filename)), checkerSha);
  const files = {}; for (const f of ['public/js/proof-atlas-application-collar.js', 'public/js/proof-atlas-region-function-pages-view.js', 'public/js/proof-atlas-declaration-window.js']) { const bytes = await (await page.request.get(origin + '/' + f)).body(); assert(bytes.equals(fs.readFileSync(f)) && bytes.equals(fs.readFileSync('_site_production/' + f))); files[f] = sha(bytes); }
  const report = { format: 'ProofAtlasApplicationCollarLifecycle/1', status: 'PASS', checkerSha256: checkerSha, files, singleActiveValue: true, supersededLiveRead: true, retiredValueRefused: true, rejectedPolicyClearsValue: true, selectionPreserved: true, scope: 'Actual transitions between two recorded value structures in one Riccati window, with a held live provider request. Separate finite lifecycle evidence; no new kernel judgment or comprehension result.' };
  fs.writeFileSync(base + 'lifecycle.json.gz', z.gzipSync(Buffer.from(JSON.stringify(report, null, 2) + '\n'), { mtime: 0 })); console.log(JSON.stringify(report));
 } finally { release(); await browser.close(); }
}
main().catch(e => { console.error(e.stack); process.exitCode = 1; });
