'use strict';
const assert = require('node:assert/strict');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const {chromium} = require('playwright');
(async () => {
  const browser = await chromium.launch({executablePath:process.env.ATLAS_CHROMIUM_PATH});
  try {
    const page = await browser.newPage(), live = await browser.newPage();
    const figure = pathToFileURL(path.join(__dirname,'local-function-scopes.html'));
    for (const width of [320,1280]) {
      await page.setViewportSize({width,height:760});
      await page.goto(figure.href + '#repeated-scope');
      for (const name of ['Argument','Function']) {
        const result = require('./fold-aliases.json').results.find(r => r.repeatedBinder);
        const i = result.fork.branches.indexOf(name === 'Argument' ? 'arg' : 'fn');
        const w = result.repeatedBinder[i];
        await page.getByRole('radio',{name,exact:true}).check();
        const links = await page.locator('[data-branch]:visible a').evaluateAll(nodes => nodes.map(a => a.href));
        assert.equal(links.length,3);
        for (const [j,target] of [w.input,w.head,w.head.binder].entries()) {
          const route = target.route.root + ':' + target.route.slots.join('.');
          const url = new URL(links[j]);
          assert.equal(url.searchParams.get('route'),route);
          assert.equal(url.hash,'#expr-' + target.node);
          if (width !== 320) continue;
          await live.goto(url.href,{waitUntil:'domcontentloaded'});
          await live.waitForFunction(e => {
            const s = window.ProofAtlasLibrary?.getSnapshot();
            return s && s.name === e.name && s.edition === e.edition && s.selected === e.node &&
              s.route.root + ':' + s.route.slots.join('.') === e.route;
          },{name:result.name,edition:'published-15',node:target.node,route});
        }
      }
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
    }
    console.log('Both widths and six live selections passed');
  } finally { await browser.close(); }
})().catch(error => {console.error(error);process.exitCode=1;});
