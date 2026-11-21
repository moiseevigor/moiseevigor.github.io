// Exercise the repository's library page with a test-only edition served by Playwright.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const {gzipSync} = require('node:zlib');
const {chromium} = require('playwright');
const A = require('../../../public/js/proof-atlas-library-data');
const repo = path.resolve(__dirname,'../../..');
const graph = JSON.parse(fs.readFileSync(0,'utf8'));
const name = 'separatedAssumptions';
const hash = bytes => crypto.createHash('sha256').update(bytes).digest('hex');
const expanded = [];
for (const children of graph.children) expanded.push(1+children.reduce((n,c)=>n+expanded[c],0));
const declaration = {name,kind:'theorem',kernelCheck:'PASS',bodyAvailable:true,rootPaths:['root.type','root.value']};
const bytes = Buffer.from(JSON.stringify({...graph,declaration,serialization:'ExprDAG/1',dependencies:[],expanded:expanded.map(String)}));
const [typeOccurrences,proofOccurrences] = graph.roots.map(i=>expanded[i]);
const file = '/control.json.gz';
const record = {...declaration,module:'SeparatedAssumptions',uniqueNodes:expanded.length,typeOccurrences,proofOccurrences,
  occurrences:typeOccurrences+proofOccurrences,indexFile:file,file,indexSha256:hash(bytes),
  sourceSha256:hash(fs.readFileSync(path.join(__dirname,'SeparatedAssumptions.lean'))),axioms:[]};
const constructors = {};
for (const k of graph.kind) constructors[A.kinds[k]]=(constructors[A.kinds[k]]||0)+1;
const edition = {id:'browser-control',modules:{SeparatedAssumptions:{}},edges:[],declarations:[record],
  counts:{modules:1,declarations:1,theorems:1,bodies:1,uniqueNodes:expanded.length,constructors}};
const libraryPath='/projects/proof-atlas/library/';
const pageHtml=fs.readFileSync(path.join(repo,libraryPath,'index.html'),'utf8').split('---').slice(2).join('---')
  .replace('{% include proof-atlas-compiled-workspace.html %}',fs.readFileSync(path.join(repo,'_includes/proof-atlas-compiled-workspace.html'),'utf8'));
async function main() {
  const browser=await chromium.launch({executablePath:process.env.ATLAS_CHROMIUM_PATH});
  try {
    const page=await browser.newPage();
    const errors=[];
    page.on('pageerror',err=>errors.push(err.message));
    await page.route('**/*',route=>{
      const url=new URL(route.request().url());
      const p=url.pathname;
      if (url.origin!=='http://localhost') return route.abort();
      if (p===libraryPath) return route.fulfill({contentType:'text/html',body:pageHtml});
      if (p===file) return route.fulfill({body:gzipSync(bytes)});
      if (p==='/public/data/proof-atlas/library-manifest.js') return route.fulfill({
        contentType:'application/javascript',body:'window.PROOF_ATLAS_LIBRARY='+JSON.stringify({editions:[edition]})});
      if (p.startsWith('/public/') && fs.existsSync(path.join(repo,p))) return route.fulfill({path:path.join(repo,p)});
      return route.fulfill({status:404});
    });
    const body='http://localhost'+libraryPath+'?edition=browser-control&proof='+name+'&route=1%3A#expr-'+graph.roots[1];
    for (const width of [1280,390]) {
      await page.setViewportSize({width,height:850});
      for (const branch of [[1,0,1],[1,1]]) for (const premise of [[1,0,1],[1,1]]) {
        await page.goto(body);
        const fields=page.locator('#pl-expression .pl-actions').first();
        for (const slot of branch.concat(premise)) {
          await fields.locator('button').nth(slot).click();
        }
        const snapshot=()=>page.evaluate(()=>window.ProofAtlasLibrary.getSnapshot());
        const ref=await snapshot();
        assert.deepEqual(ref.route,{root:1,slots:branch.concat(premise)});
        const owner=A.binding(graph,ref.route);
        const jump=fields.getByRole('button',{name:/^Enclosing binder/});
        if (width===390) await jump.click();
        else {await jump.focus(); await page.keyboard.press('Enter');}
        const selected=await snapshot();
        assert.deepEqual(selected.route,{root:1,slots:branch});
        assert.equal(selected.selected,owner.node);
        assert.equal(new URL(page.url()).searchParams.get('route'),'1:'+branch.join('.'));
        await page.reload();
        await page.waitForFunction(()=>window.ProofAtlasLibrary?.getSnapshot());
        assert.deepEqual((await snapshot()).route,selected.route);
      }
    }
    assert.deepEqual(errors,[]);
    console.log('All four premise selections, binder jumps and URL reloads passed at both widths.');
  } finally {await browser.close();}
}
main().catch(err=>{console.error(err);process.exitCode=1;});
