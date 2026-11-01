'use strict';
const fs = require('fs'), path = require('path'), z = require('zlib'), vm = require('vm'), crypto = require('crypto'), assert = require('assert/strict'), { chromium } = require('playwright');
process.chdir(path.resolve(__dirname, '../../..'));
const A = require('../../../public/js/proof-atlas-library-data'), S = require('../../../public/js/proof-atlas-source-applications'), C = require('../../../public/js/proof-atlas-application-collar');
const origin = process.env.ATLAS_ORIGIN || 'http://127.0.0.1:8877', base = 'research/proof-atlas/source-applications/', folder = process.env.ATLAS_SCREENSHOTS || path.join(require('os').tmpdir(), 'atlas-source-applications'), sha = b => crypto.createHash('sha256').update(b).digest('hex'); fs.mkdirSync(folder, { recursive: true });
const report = JSON.parse(z.gunzipSync(fs.readFileSync(base + 'model-check.json.gz'))), h = {};
for (const name of ['library-manifest', 'goedel-sample-manifest', 'source-pages-manifest', 'application-ports-manifest']) vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/' + name + '.js', 'utf8'), { window: h });
const records = h.PROOF_ATLAS_LIBRARY.editions.flatMap(e => e.declarations.map(record => ({ edition: e.id, record }))).concat(h.PROOF_ATLAS_AI_SAMPLE.edition.declarations.map(record => ({ edition: h.PROOF_ATLAS_AI_SAMPLE.edition.id, record })));
for (const d of h.PROOF_ATLAS_SOURCE_PAGES.records) if (!records.some(x => x.edition === d.edition && x.record.name === d.name)) records.push({ edition: d.edition, record: JSON.parse(z.gunzipSync(fs.readFileSync('.' + d.file))).record });
const out = { format: 'ProofAtlasSourceApplicationBrowser/1', status: 'RUNNING', pagedPackets: 0, aiPagedPackets: 0, models: 0, ports: 0, pages: 0, exactSourceJumps: 0, exactBinderJumps: 0, atomicSelections: 0, audits: [], nativePreference: 0, staleControls: 0, failures: 0, completeArchiveRequests: 0, files: {} };
let browser;
async function main() {
 browser = await chromium.launch({ headless: true, executablePath: process.env.ATLAS_CHROMIUM_PATH }); const context = await browser.newContext({ viewport: { width: 1500, height: 1100 } }), page = await context.newPage(), errors = [], archives = []; let paged = true;
 await context.addInitScript(() => { if(location.protocol.startsWith('http')){localStorage.setItem('analytics-consent', 'no'); localStorage.setItem('theme', 'light');} }); page.on('pageerror', e => errors.push(String(e)));
 await context.route('**/*', r => { const file = new URL(r.request().url()).pathname; if (paged && /^\/public\/data\/proof-atlas\/(?:library|goedel-sample|recursion-examples)\/.*\.gz$/.test(file)) { archives.push(file); return r.abort(); } return r.continue(); });
 const same = (a, b) => JSON.stringify(a) === JSON.stringify(b), url = (c, mode) => origin + '/projects/proof-atlas/library/?' + new URLSearchParams({ edition: c.edition, proof: c.record.name, route: c.route.root + ':' + c.route.slots.join('.'), ...(mode === 'paged' ? { loading: 'paged' } : {}) }) + '#expr-' + c.node;
 const state = mode => page.evaluate(mode => mode === 'paged' ? window.ProofAtlasLibrary?.getApplicationPageState() : window.ProofAtlasLibrary?.getSourceApplicationState(), mode);
 async function selection(at) { await page.waitForFunction(at => { const s = window.ProofAtlasLibrary?.getSnapshot(); return s?.selected === at.node && JSON.stringify(s.route) === JSON.stringify(at.route); }, at); }
 async function open(c, mode) {
  paged = mode === 'paged'; await page.goto('about:blank'); await page.goto(url(c, mode)); await selection({ node: c.node, route: c.route });
  await page.locator('[data-source-application] > summary').click();
  await page.waitForFunction(mode => { const s = mode === 'paged' ? window.ProofAtlasLibrary?.getApplicationPageState() : window.ProofAtlasLibrary?.getSourceApplicationState(); return s && !s.loading && !s.previewLoading && s.data; }, mode);
  const s = await state(mode); assert(await page.locator('[data-source-application]').evaluate(e=>e.open)); assert.equal(s.previewError, null); assert(s.data.sourceOnly && s.data.typing === 'not-queried'); assert(s.page.vertices <= 6); return s;
 }
 let pagedStale = false, binder = false;
 for (const c of report.browserCases) {
  assert.equal(c.route.root,1,'exercise an actual proof body, not its theorem type');
  const typed = h.PROOF_ATLAS_APPLICATION_PORTS.records.find(p => p.source.edition === c.edition && p.record.name === c.record.name);
  assert(!typed?.calls.some(call => same(call.anchor.route, c.route)), 'sample must exercise the source-only fallback');
  const record = records.find(x => x.edition === c.edition && x.record.name === c.record.name).record, g = JSON.parse(z.gunzipSync(fs.readFileSync('.' + record.indexFile))), owner = S.complete(g, record), expected = await S.read(owner, c.route); owner.dispose();
  let s = await open(c, 'paged'); for (const key of ['root', 'wrappers', 'ports', 'arguments', 'expanded', 'originalContext']) assert.deepEqual(s.data[key], expected[key]); out.models++;
  const stale = await page.locator('[data-ac-port="0"] [data-ac-inspect]').elementHandle();
  for (let offset = 0; offset < Math.max(1, expected.arguments); offset += 4) {
   if (offset) { await page.getByRole('button', { name: 'Next arguments', exact: true }).click(); await page.waitForFunction(offset => { const s = ProofAtlasLibrary.getApplicationPageState(); return s && !s.loading && !s.previewLoading && s.offset === offset; }, offset); s = await state('paged'); }
   assert.equal(s.previewError, null); assert.deepEqual(s.page, C.page(expected, offset));
   for (const port of s.page.ports) assert.deepEqual(JSON.parse(await page.locator('[data-ac-port="' + port.slot + '"] [data-ac-inspect]').getAttribute('data-ac-address')), port.address);
   out.ports += s.page.ports.length; out.pages++;
   if (offset && !pagedStale) { const before = await page.evaluate(() => ProofAtlasLibrary.getSnapshot()); await stale.evaluate(e => e.click()); assert.deepEqual(await page.evaluate(() => ProofAtlasLibrary.getSnapshot()), before); out.staleControls++; pagedStale = true; }
  }
  const port = s.page.ports.find(p => p.reference) || s.page.ports.at(-1), staleCurrent = await page.locator('[data-ac-port="0"] [data-ac-inspect]').elementHandle();
  if (port.reference && !binder) { await page.locator('[data-ac-port="' + port.slot + '"] [data-ac-reference]').click(); await selection(port.reference.target); out.exactBinderJumps++; binder = true; }
  else { await page.locator('[data-ac-port="' + port.slot + '"] [data-ac-inspect]').click(); await selection(port.address); out.exactSourceJumps++; out.atomicSelections += Number(!['app'].includes(port.kind)); }
  const after = await page.evaluate(() => ProofAtlasLibrary.getSnapshot()); await staleCurrent.evaluate(e => e.click()); assert.deepEqual(await page.evaluate(() => ProofAtlasLibrary.getSnapshot()), after); out.staleControls++;
  const cache = await page.evaluate(() => ProofAtlasLibrary.getSourcePageState()); assert(cache.peakCachedNodes <= cache.nodeLimit); out.pagedPackets++; out.aiPagedPackets += Number(c.edition === 'goedel-sample-4331');
 }
 assert.equal(out.pagedPackets, 35); assert.equal(out.aiPagedPackets, 20);
 // The complete proof used in the earlier unreadable overview has no new type
 // evidence. Its source call can nevertheless be read and selected exactly.
 const c = { edition: 'published-15', record: { name: 'SBracket.exact_time' }, node: 11987, route: { root: 1, slots: [1, 1, 1] } };
 for (const width of [1500, 390]) for (const theme of ['light', 'dark']) {
  await page.setViewportSize({ width, height: 1100 }); const s = await open(c, 'complete'); assert.equal(s.data.arguments, 5); assert.equal(s.data.ports[0].label, 'Exists.casesOn'); await page.evaluate(theme => document.documentElement.dataset.theme = theme, theme);
  await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') }); const bad = await page.evaluate(async () => (await axe.run(document.querySelector('[data-source-application]'), { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations); assert.deepEqual(bad.map(v => ({ id: v.id, nodes: v.nodes.length })), []);
  assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 2)); const image = folder + '/source-' + width + '-' + theme + '.png'; await page.screenshot({ path: image, fullPage: true }); await page.locator('[data-source-application]').screenshot({path:folder+'/application-'+width+'-'+theme+'.png'}); out.audits.push({ width, theme, violations: 0 });
 }
 const before = await page.evaluate(() => ProofAtlasLibrary.getSnapshot()), first = (await state('complete')).data.ports[0].address; await page.locator('[data-ac-port="0"] [data-ac-inspect]').click(); await selection(first); assert.notDeepEqual(await page.evaluate(() => ProofAtlasLibrary.getSnapshot()), before); out.exactSourceJumps++;
 // Existing native application records keep priority at their exact source use.
 const d = h.PROOF_ATLAS_APPLICATION_PORTS.records.find(p => p.source.edition === 'published-15'), call = d.calls[0]; paged = true; await page.goto(url({ edition: d.source.edition, record: d.record, route: call.anchor.route, node: call.anchor.node }, 'paged')); await selection(call.anchor); await page.getByRole('button', { name: 'Show application ports', exact: true }).waitFor(); assert.equal(await page.locator('[data-source-application]').count(), 0); out.nativePreference++;
 // Missing optional source presentation must leave the ordinary graph usable.
 const sample = report.browserCases[0]; await page.route('**/proof-atlas-source-applications.js*', r => r.abort()); await page.goto(url(sample, 'paged')); await selection({ node: sample.node, route: sample.route }); await page.waitForFunction(() => document.querySelector('#pl-paged-application-section')?.textContent.includes('unavailable')); assert(await page.locator('#pl-paged-application-section').isVisible()); await page.unroute('**/proof-atlas-source-applications.js*'); out.failures++;
 await open(sample, 'paged'); out.failures++;
 assert.deepEqual(errors, []); assert.deepEqual(archives, []); out.completeArchiveRequests = archives.length; assert(out.staleControls && out.exactSourceJumps);
 for (const file of [base + 'browser.cjs', base + 'model-check.json.gz', 'public/js/proof-atlas-source-applications.js', 'public/js/proof-atlas-application-collar.js', 'public/js/proof-atlas-local-reader.js', 'public/js/proof-atlas-library.js', 'public/js/proof-atlas-paged-library.js', 'public/css/proof-atlas-declaration-window.css', 'projects/proof-atlas/library/index.html']) { const bytes = fs.readFileSync(file); out.files[file] = sha(bytes); if (/\.(js|css)$/.test(file)) { const r = await page.request.get(origin + '/' + file); assert.equal(r.status(), 200); assert.equal(sha(await r.body()), out.files[file]); } }
 out.productionHtmlSha256 = sha(await (await page.request.get(origin + '/projects/proof-atlas/library/')).body()); out.checkerSha256 = sha(fs.readFileSync(__filename)); out.status = 'PASS'; out.scope = 'Actual production source-application UI in all 35 paged packets, exact original field/binder selections, paging, stale controls, optional failure and native preference; complete SBracket source call, desktop/mobile light/dark accessibility. No new typing or comprehension result.';
 fs.writeFileSync(base + 'browser-check.json.gz', z.gzipSync(Buffer.from(JSON.stringify(out, null, 2) + '\n'), { mtime: 0 })); console.log(JSON.stringify({ ...out, files: undefined })); await browser.close();
}
main().catch(async error => { console.error(error); if (browser) await browser.close(); process.exit(1); });
