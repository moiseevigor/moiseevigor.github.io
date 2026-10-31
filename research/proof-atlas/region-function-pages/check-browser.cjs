'use strict';
const fs = require('fs'), path = require('path'), vm = require('vm'), z = require('zlib'), crypto = require('crypto'), assert = require('assert/strict');
const { chromium } = require('playwright');
process.chdir(path.resolve(__dirname, '../../..'));
const base = 'research/proof-atlas/region-function-pages/', origin = process.env.ATLAS_ORIGIN || 'http://127.0.0.1:8877';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const read = descriptor => JSON.parse(z.gunzipSync(fs.readFileSync('.' + descriptor.file)));
const copy = value => JSON.parse(JSON.stringify(value)), host = {};
for (const name of ['network-streaming', 'application-region-controls', 'region-function-pages']) vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/' + name + '-manifest.js', 'utf8'), { window: host });
const catalogue = copy(host.PROOF_ATLAS_REGION_FUNCTION_PAGES), network = copy([...host.PROOF_ATLAS_NETWORK_STREAMING.records, ...host.PROOF_ATLAS_APPLICATION_REGION_CONTROLS.records]);
const assets = ['public/js/proof-atlas-region-function-pages.js', 'public/js/proof-atlas-region-function-pages-view.js', 'public/data/proof-atlas/region-function-pages-manifest.js', 'public/js/proof-atlas-computed-type-neighborhood.js', 'public/js/proof-atlas-computed-type-neighborhood-view.js', 'public/js/proof-atlas-network-stream-view.js', 'public/css/proof-atlas-frontier-pages.css'];
const report = { format: 'ProofAtlasRegionFunctionPageBrowser/1', status: 'RUNNING', accepted: 0, rejected: 0, componentRoots: 0, preservedSourceSelections: 0, bindingPortals: 0, synchronizedSourcePorts: 0, sourceLinks: 0, sourcePortals: [], audits: [], files: {} };
async function main() {
  const browser = await chromium.launch({ headless: true, executablePath: process.env.ATLAS_CHROMIUM_PATH });
  const page = await browser.newPage({ viewport: { width: 1500, height: 1100 } });
  const errors = [], forbidden = [];
  const blocked = new Set(network.flatMap(item => [item.record.indexFile, item.owner?.file]).filter(Boolean));
  await page.route('**/*', route => {
    const file = new URL(route.request().url()).pathname;
    if (blocked.has(file) || file.includes('/application-ports/') || file.endsWith('/region-input-functions/native.json.gz')) { forbidden.push(file); return route.abort(); }
    return route.continue();
  });
  page.on('pageerror', error => errors.push(error.stack || error.message));
  await page.addInitScript(() => { localStorage.setItem('analytics-consent', 'no'); localStorage.setItem('theme', 'light'); });
  const panel = () => page.locator('[data-region-function-reader]');
  const state = () => page.evaluate(() => ProofAtlasNetworkStreamView.getRegionFunctionState());
  const selected = () => page.evaluate(() => ProofAtlasNetworkStreamView.getSelection());
  async function ready(id, component = 'function.reduced') {
    await page.waitForFunction(({ id, component }) => {
      const value = window.ProofAtlasNetworkStreamView?.getRegionFunctionState();
      return value && !value.loading && value.case === id && (value.status === 'kernel-rejected' || value.selection?.component === component);
    }, { id, component });
  }
  async function load(profile) {
    await page.goto(origin + '/projects/proof-atlas/manual/paged-network/');
    await page.waitForFunction(() => window.ProofAtlasNetworkStreamView);
    const index = network.findIndex(item => item.source.indexSha256 === profile.source.indexSha256); assert(index >= 0);
    await page.locator('[data-ns-profile]').selectOption(String(index));
    await page.locator('[data-ns-call]').fill(String(profile.members[0]));
    await page.locator('[data-ns-load]').click();
    await page.waitForFunction(() => ProofAtlasNetworkStreamView.getScene() && document.querySelector('[data-ns-frontier] h3'));
    await page.locator('[data-ns-region-function-toggle]').click(); await ready('proof-arguments');
  }
  async function choose(descriptor) { await panel().locator('[data-region-function-case]').selectOption(descriptor.id); await ready(descriptor.id); }
  async function component(descriptor, name) { await panel().locator('[data-region-function-component]').selectOption(name); await ready(descriptor.id, name); }
  async function openBindings() { await panel().locator('[data-region-function-bindings]').evaluate(node => { node.open = true; }); }
  try {
    for (const profile of catalogue.profiles) {
      await load(profile);
      for (const descriptor of profile.cases) {
        await choose(descriptor); const manifest = read(descriptor);
        if (manifest.status === 'KERNEL_REJECTED') {
          assert.equal((await state()).selection, null); assert.equal(await panel().locator('[data-type-neighborhood]').count(), 0); assert.match(await panel().innerText(), /original proof is not rejected/); report.rejected++; continue;
        }
        const sourceBefore = await selected();
        for (const part of manifest.components) {
          await component(descriptor, part.component); const value = await state();
          assert.equal(value.selection.node, part.root); assert.equal(value.selection.namespace, 'region-input-components'); assert.equal(value.selection.nativeCaseSha256, descriptor.nativeCaseSha256); assert.equal(value.selection.manifestSha256, descriptor.sha256);
          assert.deepEqual(await selected(), sourceBefore); assert(value.lease.cachedRows <= 64 && value.lease.indexPages <= 2); report.componentRoots++; report.preservedSourceSelections++;
        }
        await openBindings();
        for (const [i, binding] of manifest.bindings.entries()) {
          const row = panel().locator('[data-region-function-binding="' + i + '"]');
          const link = row.locator('[data-region-function-source]'), address = JSON.parse(await link.getAttribute('data-region-function-source'));
          assert.equal(address.namespace, 'source-expression'); assert.equal(address.indexSha256, profile.source.indexSha256); assert.equal(address.node, binding.source.node); assert.deepEqual(address.route, binding.source.route); report.sourceLinks++;
          if (await link.getAttribute('data-region-function-source-mode') === 'explorer') { const url = new URL(await link.getAttribute('href'), origin); assert.equal(url.searchParams.get('route'), binding.source.route.root + ':' + binding.source.route.slots.join('.')); assert.equal(url.hash, '#expr-' + binding.source.node); } else { assert.equal(await link.evaluate(node => node.tagName), 'BUTTON'); assert.equal(await link.getAttribute('href'), null); }
          await row.getByRole('button', { name: 'Inspect domain ' + i, exact: true }).click();
          await page.waitForFunction(slots => { const value = ProofAtlasNetworkStreamView.getRegionFunctionState(); return !value.loading && JSON.stringify(value.selection?.route.slots) === JSON.stringify(slots); }, [...binding.slots, 0]); report.bindingPortals++;
          // Exercise every source port in the proof-argument policy and the
          // general all-position policy on authored controls. Other policies
          // retain exact links above and are covered by the complete model.
          if (descriptor.id === 'proof-arguments' || (profile.source.name.startsWith('AtlasRegionControls.') && descriptor.id === 'all-boundary-positions')) {
            await row.getByRole('button', { name: binding.kind === 'input' ? 'Select original input ' + binding.call + ':' + binding.slot : 'Select original result ' + binding.call, exact: true }).click();
            await page.waitForFunction(({ call, node, route }) => {
              const value = ProofAtlasNetworkStreamView.getSelection();
              return !ProofAtlasNetworkStreamView.isBusy() && ProofAtlasNetworkStreamView.getDetail()?.call === call && value?.node === node && JSON.stringify(value.route) === JSON.stringify(route);
            }, { call: binding.call, node: binding.source.node, route: binding.source.route });
            assert.equal((await selected()).namespace, 'source-expression'); report.synchronizedSourcePorts++;
          }
        }
        report.accepted++;
      }
      const descriptor = profile.cases.find(item => item.id === 'proof-arguments'); await choose(descriptor);
      await panel().getByRole('button', { name: 'Load recorded region calls', exact: true }).click();
      await page.waitForFunction(members => !ProofAtlasNetworkStreamView.isBusy() && JSON.stringify(ProofAtlasNetworkStreamView.getScene().nodes.map(node => node.id).sort((a, b) => a - b)) === JSON.stringify([...members].sort((a, b) => a - b)), profile.members);
      assert.equal((await state()).case, descriptor.id); report.regionCallsLoaded = (report.regionCallsLoaded || 0) + 1;
      await openBindings(); const portal = panel().locator('[data-region-function-source]').first();
      if (await portal.getAttribute('href')) report.sourcePortals.push({ address: JSON.parse(await portal.getAttribute('data-region-function-source')), href: await portal.getAttribute('href') });
    }

    const profile = catalogue.profiles[0], accepted = profile.cases.find(item => item.id === 'proof-arguments'), rejected = profile.cases.find(item => item.status === 'KERNEL_REJECTED');
    await load(profile); await choose(accepted);
    await page.evaluate(() => { window.oldRegionField = document.querySelector('[data-region-function-reader] [data-type-neighborhood-select="field"]'); });
    await choose(rejected); await page.evaluate(() => oldRegionField.click()); assert.equal((await state()).selection, null); report.staleFieldRefused = true;
    await choose(accepted); await openBindings();
    await page.evaluate(() => { window.oldRegionSource = document.querySelector('[data-region-function-binding] button'); });
    const before = await selected(); await choose(rejected); await page.evaluate(() => oldRegionSource.click()); assert.deepEqual(await selected(), before); report.staleBindingRefused = true;

    const failed = profile.cases.find(item => item.id === 'proof-and-function-inputs');
    await page.route('**' + failed.file, route => route.fulfill({ status: 200, body: z.gzipSync(Buffer.from('{}')) }));
    await panel().locator('[data-region-function-case]').selectOption(failed.id);
    await page.waitForFunction(() => document.querySelector('[data-region-function-status]').textContent.startsWith('Region function unavailable:'));
    assert.equal((await state()).selection, null); assert(await page.locator('[data-ns-node]').count());
    await page.unroute('**' + failed.file); await panel().getByRole('button', { name: 'Retry region function', exact: true }).click(); await ready(failed.id); report.failureRetry = true;

    let arrived, resume; const arrival = new Promise(resolve => { arrived = resolve; }), gate = new Promise(resolve => { resume = resolve; });
    await page.route('**' + accepted.file, async route => { arrived(); await gate; await route.continue().catch(() => {}); });
    await panel().locator('[data-region-function-case]').selectOption(accepted.id); await arrival;
    await page.locator('[data-ns-profile]').selectOption('1'); resume();
    await page.waitForFunction(() => ProofAtlasNetworkStreamView.getRegionFunctionState() === null);
    assert.equal(await panel().count(), 0); await page.unroute('**' + accepted.file); report.pendingRetirement = true;

    await load(profile); await choose(accepted);
    const manifest = read(accepted), externalPath = (() => {
      const g = JSON.parse(z.gunzipSync(fs.readFileSync('research/proof-atlas/region-input-functions/native.json.gz'))).profiles[0].native.cases.find(item => item.policy === accepted.id).graph;
      const todo = [{ node: g.roots[2], slots: [], depth: 0 }], seen = new Set();
      for (let at = 0; at < todo.length; at++) { const value = todo[at], key = value.node + ':' + value.depth; if (seen.has(key)) continue; seen.add(key);
        if (g.kind[value.node] === 0 && g.payloads[value.node].index >= value.depth) return value.slots;
        for (const [slot, node] of g.children[value.node].entries()) todo.push({ node, slots: [...value.slots, slot], depth: value.depth + Number(((g.kind[value.node] === 6 || g.kind[value.node] === 7) && slot === 1) || (g.kind[value.node] === 8 && slot === 2)) }); }
      throw Error('Expected real original-context binder witness');
    })();
    for (const [i, slot] of externalPath.entries()) { await panel().locator('[data-type-neighborhood-select="field"]').nth(slot).click(); await page.waitForFunction(depth => { const value = ProofAtlasNetworkStreamView.getRegionFunctionState(); return !value.loading && value.selection?.route.slots.length === depth; }, i + 1); }
    await panel().locator('[data-type-neighborhood-binding="original-context-binder"]').first().click();
    assert.equal((await state()).sourceTarget.namespace, 'source-expression'); report.originalBinderPortal = true;
    await component(accepted, 'function.closed');
    const closedGraph = JSON.parse(z.gunzipSync(fs.readFileSync('research/proof-atlas/region-input-functions/native.json.gz'))).profiles[0].native.cases.find(item => item.policy === accepted.id).graph;
    const queue = [{node:closedGraph.roots[4],slots:[],binders:[]}], visited = new Set(); let localWitness;
    for(let at=0;at<queue.length;at++){
      const value=queue[at], key=value.node+':'+value.binders.length;if(visited.has(key))continue;visited.add(key);
      if(closedGraph.kind[value.node]===0){localWitness={slots:value.slots,target:value.binders.at(-1-closedGraph.payloads[value.node].index)};break;}
      for(const[slot,node]of closedGraph.children[value.node].entries()){
        const binds=((closedGraph.kind[value.node]===6||closedGraph.kind[value.node]===7)&&slot===1)||(closedGraph.kind[value.node]===8&&slot===2);
        queue.push({node,slots:[...value.slots,slot],binders:binds?[...value.binders,{node:value.node,slots:value.slots}]:value.binders});
      }
    }
    assert(localWitness?.target);
    for(const[i,slot]of localWitness.slots.entries()){
      await panel().locator('[data-type-neighborhood-select="field"]').nth(slot).click();
      await page.waitForFunction(depth=>{const value=ProofAtlasNetworkStreamView.getRegionFunctionState();return!value.loading&&value.selection?.route.slots.length===depth;},i+1);
    }
    const sourceBeforeBinder=await selected();
    await panel().locator('[data-type-neighborhood-node="selected"] [data-type-neighborhood-binding="computed-local-binder"]').click();
    await page.waitForFunction(slots=>{const value=ProofAtlasNetworkStreamView.getRegionFunctionState();return!value.loading&&JSON.stringify(value.selection?.route.slots)===JSON.stringify(slots);},localWitness.target.slots);
    assert.equal((await state()).selection.node,localWitness.target.node);assert.deepEqual(await selected(),sourceBeforeBinder);report.computedBinderPortal=true;
    await component(accepted, 'function.closed');
    await panel().locator('[data-type-neighborhood-select="field"]').first().focus(); await page.keyboard.press('Enter');
    await page.waitForFunction(() => { const value = ProofAtlasNetworkStreamView.getRegionFunctionState(); return !value.loading && value.selection?.route.slots.length === 1; }); report.keyboard = true;
    await component(accepted, 'function.reduced'); await panel().locator('[data-region-function-bindings]').evaluate(node => { node.open = false; });
    await page.addScriptTag({ path: require.resolve('axe-core/axe.min.js') });
    for (const width of [1500, 390]) for (const theme of ['light', 'dark']) {
      await page.setViewportSize({ width, height: 1100 });
      await page.evaluate(async value => { document.documentElement.dataset.theme = value; await Promise.all(document.getAnimations().filter(animation => animation.effect.getTiming().iterations !== Infinity).map(animation => animation.finished.catch(() => {}))); }, theme);
      const violations = await page.evaluate(async () => (await axe.run(document.querySelector('[data-region-function-reader]'), { runOnly: { type: 'tag', values: ['wcag2a', 'wcag2aa', 'wcag21aa'] } })).violations.map(value => ({ id: value.id, targets: value.nodes.map(node => node.target) })));
      assert.deepEqual(violations, []); assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth + 3));
      const file = 'region-reader-' + width + '-' + theme + '.png'; await panel().screenshot({ path: base + file }); report.audits.push({ width, theme, file, sha256: hash(fs.readFileSync(base + file)), violations: 0 });
    }
    if (await page.locator('[data-ns-node="0"]').count()) await page.locator('[data-ns-node="0"]').click();
    else {
      // A call absent from the current cut is selected through the actual
      // source-call input; this retires the old function before reloading.
      await page.locator('[data-ns-call]').fill('0'); await page.locator('[data-ns-load]').click();
      await page.waitForFunction(() => ProofAtlasNetworkStreamView.getScene()?.focus === 0);
      await page.locator('[data-ns-region-function-toggle]').click();
    }
    await page.waitForFunction(() => ProofAtlasNetworkStreamView.getRegionFunctionState()?.status === 'unavailable'); assert.equal((await state()).selection, null); report.unrecordedCallClears = true;
    await page.locator('[data-ns-release]').click(); assert.equal(await state(), null); assert(await page.locator('[data-ns-region-function-toggle]').isDisabled()); report.release = true;
    const unsupported = network.findIndex(item => item.mode === 'source-only');
    await page.locator('[data-ns-profile]').selectOption(String(unsupported)); await page.locator('[data-ns-load]').click();
    await page.waitForFunction(() => ProofAtlasNetworkStreamView.getScene()?.mode === 'source-only'); await page.locator('[data-ns-region-function-toggle]').click(); assert.equal((await state()).status, 'unavailable'); report.sourceOnlyUnavailable = true;
    for (const portal of report.sourcePortals) {
      const other = await browser.newPage(); await other.goto(origin + portal.href);
      await other.waitForFunction(value => window.ProofAtlasLibrary?.getSnapshot()?.selected === value.node && ProofAtlasLibrary.getSnapshot().indexSha256 === value.indexSha256, portal.address, { timeout: 60000 });
      const profile = catalogue.profiles.find(item => item.source.indexSha256 === portal.address.indexSha256), source = network.find(item => item.source.indexSha256 === profile.source.indexSha256);
      const g = JSON.parse(z.gunzipSync(fs.readFileSync('.' + source.record.indexFile))), A = require('../../../public/js/proof-atlas-library-data');
      assert.equal(await other.evaluate(() => ProofAtlasLibrary.getSnapshot().path), A.path(g, portal.address.route)); await other.close();
    }
    assert.deepEqual(errors, []); assert.deepEqual(forbidden, []); assert.equal(report.accepted, 16); assert.equal(report.rejected, 2); assert.equal(report.componentRoots, 160);
    for (const file of assets) { const response = await page.request.get(origin + '/' + file); assert.equal(response.status(), 200); const bytes = await response.body(); assert(bytes.equals(fs.readFileSync(file)), file); assert(bytes.equals(fs.readFileSync('_site_production/' + file))); report.files[file] = hash(bytes); }
    const html = await (await page.request.get(origin + '/projects/proof-atlas/manual/paged-network/')).body(); assert(html.equals(fs.readFileSync('_site_production/projects/proof-atlas/manual/paged-network/index.html')));
    report.htmlSha256 = hash(html); report.checkerSha256 = hash(fs.readFileSync(__filename)); report.status = 'PASS'; report.wholeArchiveAttempts = 0;
    report.scope = 'Actual production reader: all sixteen accepted cases and 160 component roots, both rejected policies, every recorded binding domain and source link, selected live source/native synchronization, exact source/binder portals, retry and retirement, keyboard and four responsive/theme layouts. No new kernel or comprehension evidence.';
    fs.writeFileSync(base + 'browser-check.json.gz', z.gzipSync(Buffer.from(JSON.stringify(report, null, 2) + '\n'), { mtime: 0 })); console.log(JSON.stringify({ ...report, files: undefined, sourcePortals: report.sourcePortals.length }));
  } catch (error) {
    fs.writeFileSync(base + 'failure.json', JSON.stringify({ error: error.stack, errors, forbidden, report, state: await state().catch(() => null), text: await page.locator('#ns-lab').innerText().catch(() => '') }, null, 2));
    await page.screenshot({ path: base + 'failure.png' }).catch(() => {}); throw error;
  } finally { await browser.close(); }
}
main().catch(error => { console.error(error.stack); process.exitCode = 1; });
