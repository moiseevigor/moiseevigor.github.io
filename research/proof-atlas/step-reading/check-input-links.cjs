// Open all generated occurrence links through the public reader's normal entry point.
'use strict';
const fs = require('node:fs');
const path = require('node:path');
const assert = require('node:assert/strict');
const {chromium} = require('playwright');
const index = fs.readFileSync(path.join(__dirname, 'article-inputs.md'), 'utf8');
const urls = [...index.matchAll(/\]\((https:[^)]+)\)/g)].map(match => match[1]);
assert(urls.length > 0);
(async () => {
  const browser = await chromium.launch({executablePath: process.env.ATLAS_CHROMIUM_PATH});
  try {
    const page = await browser.newPage();
    for (const address of urls) {
      const url = new URL(address);
      await page.goto(address, {waitUntil: 'domcontentloaded'});
      await page.waitForFunction(expected => {
        const s = window.ProofAtlasLibrary?.getSnapshot();
        return s && s.edition === expected.edition && s.name === expected.proof &&
          s.selected === expected.node && s.route.root + ':' + s.route.slots.join('.') === expected.route;
      }, {edition: url.searchParams.get('edition'), proof: url.searchParams.get('proof'),
        node: Number(url.hash.slice(6)), route: url.searchParams.get('route')});
    }
    console.log('Verified ' + urls.length + ' published reader selections');
  } finally {
    await browser.close();
  }
})().catch(error => { console.error(error); process.exitCode = 1; });
