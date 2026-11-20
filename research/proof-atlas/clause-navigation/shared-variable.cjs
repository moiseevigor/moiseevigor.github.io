// Build a self-contained occurrence diagram from the published census witnesses.
'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const zlib = require('node:zlib');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const atlas = require('../../../public/js/proof-atlas-library-data');
const census = require('./use-census.json');
const window = {};
for (const manifest of ['library-manifest','goedel-sample-manifest','recursion-examples-manifest']) {
  vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+manifest+'.js','utf8'),{window});
}
const editions = [...window.PROOF_ATLAS_LIBRARY.editions,window.PROOF_ATLAS_AI_SAMPLE.edition,
  window.PROOF_ATLAS_RECURSION_EXAMPLES.edition];
const escape = value => String(value).replaceAll('&','&amp;').replaceAll('<','&lt;').replaceAll('>','&gt;').replaceAll('"','&quot;');
function diagram(result) {
  const e = editions.find(x => x.id === result.edition);
  const example = result.missedByNearest;
  const record = e.declarations.find(r => r.name === example.name);
  const bytes = zlib.gunzipSync(fs.readFileSync('.'+record.indexFile));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),record.indexSha256);
  assert.equal(record.indexSha256,example.indexSha256);
  const data = atlas.validateIndex(JSON.parse(bytes),record);
  const address = route => {
    const url = new URL('https://moiseevigor.github.io/projects/proof-atlas/library/');
    url.search = new URLSearchParams({edition:e.id,proof:record.name,route:route.root+':'+route.slots.join('.')});
    url.hash = 'expr-'+atlas.walk(data,route);
    return escape(url.href);
  };
  assert.equal(data.kind[example.node],0);
  const uses = example.uses;
  assert.equal(uses.length,2);
  assert.notDeepEqual(uses[0].introduction,uses[1].introduction);
  const fields = uses.map(u => atlas.path(data,u.use).split('.'));
  let common = 0;
  while (common < fields[0].length && fields[0][common] === fields[1][common]) common++;
  const branches = uses.map((u,i) => {
    assert.equal(atlas.walk(data,u.use),example.node);
    assert.deepEqual(atlas.binding(data,u.use).route,u.introduction);
    assert.equal(data.payloads[atlas.walk(data,u.introduction)].binderName,u.name);
    return '<li><span class="branch"><code>'+escape(fields[i].slice(common).join('.'))+
      '</code></span><span class="links"><a href="'+address(u.use)+'">Open use of '+escape(u.name)+
      '</a><span aria-hidden="true"> → </span><a href="'+address(u.introduction)+'">Binder '+escape(u.name)+'</a></span></li>';
  }).join('');
  return '<section><h2>'+escape(record.name)+'</h2><p><strong>Shared row #'+example.node+
    '</strong> · bound variable, index '+data.payloads[example.node].index+'</p><figure><figcaption>Common proof path</figcaption><code>'+
    escape(fields[0].slice(0,common).join('.'))+'</code><ul>'+branches+
    '</ul></figure><details><summary>Packet identity</summary><code>'+escape(e.id)+' · '+record.indexSha256+'</code></details></section>';
}
const labels = {'published-15':'Published SE(2)','working-26':'Working SE(2)','goedel-sample-4331':'AI proof','recursion-controls':'Recursion control'};
const examples = [...census.editions].sort((a,b)=>Number(b.edition==='goedel-sample-4331')-Number(a.edition==='goedel-sample-4331'));
console.log(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>One variable row, two binders</title><style>
:root{color-scheme:light dark}body{font:1.1rem/1.5 Georgia,serif;margin:2rem auto;padding:0 1rem;max-width:45rem}h1,h2{line-height:1.15;overflow-wrap:anywhere}h1{font-size:clamp(1.9rem,5vw,2.7rem)}figure{margin:1.5rem 0}label,figcaption,summary,.links{font:1rem/1.5 system-ui}select{max-width:100%;font:inherit}code{font-size:.92em;overflow-wrap:anywhere}ul{padding:0 0 0 .9rem;margin:.3rem 0;list-style:none}li{border-inline-start:2px solid GrayText;padding:0 0 .8rem 1.2rem;position:relative}li::before{content:'';position:absolute;left:0;top:.7rem;width:.9rem;border-top:2px solid GrayText}li:last-child{border-color:transparent}li:last-child::before{border-left:2px solid GrayText;top:0;height:.7rem;border-top:0;border-bottom:2px solid GrayText}.links{display:block}a{color:LinkText;text-underline-offset:.18em}:focus-visible{outline:2px solid currentColor;outline-offset:.15rem}
</style><main><h1>One variable row, two binders</h1><p>Follow either branch from the common path. Each reaches the same stored variable. The surrounding binders give that variable its meaning.</p>
<label hidden id="picker">Example <select>${examples.map(r=>'<option>'+escape(labels[r.edition])+'</option>').join('')}</select></label>
${examples.map(diagram).join('\n')}</main>
<script>const picker=document.querySelector('#picker'),select=picker.querySelector('select'),examples=document.querySelectorAll('section');function show(){examples.forEach((section,i)=>{section.hidden=i!==select.selectedIndex})}picker.hidden=false;select.addEventListener('change',show);show()</script></html>`);
