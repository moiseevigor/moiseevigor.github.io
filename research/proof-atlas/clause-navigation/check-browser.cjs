// Run against a built site with ATLAS_ORIGIN and optional ATLAS_CHROMIUM_PATH.
'use strict';
const assert = require('node:assert/strict');
const {chromium} = require('playwright');

async function main() {
  const browser = await chromium.launch({executablePath:process.env.ATLAS_CHROMIUM_PATH});
  try {
    const origin = process.env.ATLAS_ORIGIN;
    assert(origin, 'Pass the local site origin');
    const page = await browser.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    for (const paged of [false, true]) {
      const url = new URL('/projects/proof-atlas/library/', origin);
      url.search = new URLSearchParams({edition:'published-15', proof:'JacobiData.slope_bound_abs', route:'0:1.1.1.1.1.0'});
      if (paged) url.searchParams.set('loading', 'paged');
      await page.goto(url.href, {waitUntil:'domcontentloaded'});
      for (const [node, root, path, label] of [
        [61, 0, '111110', 'Open proof binder · #3245'],
        [3245, 1, '11111', 'Open statement binder · #160'],
        [160, 0, '11111', 'Open proof binder · #3245']
      ]) {
        await page.waitForFunction(({node, root, path, label}) => {
          const s = window.ProofAtlasLibrary?.getSnapshot();
          return s?.selected === node && s.route.root === root && s.route.slots.join('') === path &&
            document.querySelector('[data-clause-navigation]')?.textContent === label;
        }, {node, root, path, label});
        if (node !== 160) await page.getByRole('button', {name:label, exact:true}).click();
      }
      console.log(paged ? 'PASS paged Riccati clause' : 'PASS complete Riccati clause');
    }
    const projection = new URL('/projects/proof-atlas/library/', origin);
    projection.search = new URLSearchParams({edition:'published-15', proof:'JacobiCore.Sol.bC', route:'0:1.1'});
    await page.goto(projection.href, {waitUntil:'domcontentloaded'});
    await page.getByRole('button', {name:'Open proof of remaining statement · #35'}).click();
    const reverse = page.getByRole('button', {name:'Open remaining statement · #32'});
    await reverse.waitFor();
    assert.deepEqual(await page.evaluate(() => window.ProofAtlasLibrary.getSnapshot().route),
      {root:1, slots:[1,1]});
    await reverse.click();
    await page.getByRole('button', {name:'Open proof of remaining statement · #35'}).waitFor();
    assert.deepEqual(await page.evaluate(() => window.ProofAtlasLibrary.getSnapshot().route),
      {root:0, slots:[1,1]});
    console.log('PASS claim supplied by a projection');
    assert.deepEqual(errors, []);
  } finally {
    await browser.close();
  }
}
main().catch(error => {console.error(error); process.exitCode = 1;});
