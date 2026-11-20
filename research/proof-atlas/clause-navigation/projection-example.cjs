// Generate a linked field diagram from the published packet; run from repo root.
'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const zlib = require('node:zlib');
const {createHash} = require('node:crypto');
const assert = require('node:assert/strict');
const atlas = require('../../../public/js/proof-atlas-library-data');
const {firstUse} = require('./first-use.cjs');

const window = {};
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/library-manifest.js','utf8'), {window});
const edition = window.PROOF_ATLAS_LIBRARY.editions.find(e => e.id === 'published-15');
const record = edition.declarations.find(r => r.name === 'JacobiCore.Sol.bC');
const packet = zlib.gunzipSync(fs.readFileSync('.'+record.indexFile));
assert.equal(createHash('sha256').update(packet).digest('hex'),record.indexSha256);
const data = atlas.validateIndex(JSON.parse(packet),record);
const proof = slots => ({root:1,slots});
const k = proof([]), self = proof([1]), domain = proof([1,0]), projection = proof([1,1]);
const kUse = firstUse(data,k), selfUse = firstUse(data,self,true);
assert.equal(firstUse(data,k,true),null);
assert.deepEqual(kUse.route,proof([1,0,1]));
assert.deepEqual(selfUse.route,proof([1,1,0]));
assert.equal(kUse.node,selfUse.node);
const node = route => atlas.walk(data,route);
assert.equal(data.payloads[node(k)].binderName,'k');
assert.equal(data.payloads[node(self)].binderName,'self');
assert.equal(data.payloads[data.children[node(domain)][0]].name,'JacobiCore.Sol');
assert.equal(data.kind[node(projection)],11);
assert.equal(data.payloads[node(projection)].index,7);
function link(route,text) {
  const u = new URL('https://moiseevigor.github.io/projects/proof-atlas/library/');
  u.search = new URLSearchParams({edition:edition.id,proof:record.name,route:route.root+':'+route.slots.join('.')});
  u.hash = 'expr-'+node(route);
  return '<a href="'+u.href.replaceAll('&','&amp;')+'">'+text+'</a>';
}
console.log(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width, initial-scale=1">
<title>How a parameter enters a projection proof</title>
<style>:root{color-scheme:light dark}body{font:1.12rem/1.55 Georgia,serif;max-width:44rem;margin:auto;padding:clamp(1rem,4vw,3rem)}h1{font-size:clamp(1.8rem,5vw,2.6rem);line-height:1.12}figure{margin:2rem 0}strong,dt{font:600 .98rem system-ui}section{border-inline-start:.22rem solid GrayText;padding:0 1rem;margin:1.3rem 0}section p{margin:.25rem 0}a{color:LinkText;text-underline-offset:.18em}code{overflow-wrap:anywhere}a:focus-visible{outline:2px solid currentColor;outline-offset:.15em}</style>
<main><h1>How a parameter enters a projection proof</h1>
<p>For a solution <i>self</i> at parameter <i>k</i>, the theorem gives |<i>C</i>(<i>p</i>)| ≤ 1 for every real <i>p</i>. Its compiled proof introduces ${link(k,'k')} and then ${link(self,'self')}. The second binder has two fields.</p>
<figure aria-label="Two field paths from the self binder">
<section><strong>Domain of self</strong><p>${link(domain,'JacobiCore.Sol k')} → ${link(kUse.route,'argument k')} → ${link(k,'binder k')}</p><p>This is the only kind of direct use of <i>k</i> in the proof body. It appears in the type of the solution.</p></section>
<section><strong>Body under self</strong><p>${link(projection,'Projection, field 7')} → ${link(selfUse.route,'operand self')} → ${link(self,'binder self')}</p><p>This field of the solution supplies the entire quantified bound.</p></section>
<figcaption>Follow either middle link. Both open stored row #${kUse.node}, a variable with index 0. In the domain the nearest binder is <i>k</i>. Entering the body brings <i>self</i> into scope.</figcaption></figure>
<details><summary>Compiled source</summary><p><code>${record.name}</code> · ${edition.id}<br>Packet SHA-256 <code>${record.indexSha256}</code></p></details></main></html>`);
