// Pipe the output of check.cjs into this script from the repository root.
'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const zlib = require('node:zlib');
const { createHash } = require('node:crypto');
const atlas = require('../../../public/js/proof-atlas-library-data');
const fixtures = require('../../../scripts/proof-atlas-judgment-fixtures.cjs');
const edition = 'published-15';
const name = 'JacobiData.slope_bound_abs';
const { record } = fixtures.inventory().find(x => x.edition === edition && x.record.name === name);
const raw = zlib.gunzipSync(fs.readFileSync('.' + record.indexFile));
const digest = createHash('sha256').update(raw).digest('hex');
assert.equal(digest, record.indexSha256);
const report = JSON.parse(fs.readFileSync(0, 'utf8')).find(x => x.edition === edition && x.name === name);
assert.equal(report.indexSha256, digest);
const data = atlas.validateIndex(JSON.parse(raw), record);
const labels = ['Jacobi data J', 'Real variable p', '0 < a(p)b(p)', 'z(p) < 1', '0 < d(p)', 's(p) ≠ 0'];
assert.deepEqual(report.binders.map(x => x.name), ['J','p','hab','hz1','hd','hs']);
function link(route, text) {
  const id = atlas.walk(data, route);
  const url = new URL('https://moiseevigor.github.io/projects/proof-atlas/library/');
  url.search = new URLSearchParams({edition, proof:name, route:route.root + ':' + route.slots.join('.')});
  url.hash = 'expr-' + id;
  return '<a href="' + url.href.replaceAll('&', '&amp;') + '">' + text + '</a>';
}
const rows = report.binders.map((b,i) => {
  assert.deepEqual(atlas.binding(data,b.firstUse.route).route, b.introduction);
  const binder = atlas.walk(data,b.introduction);
  assert.equal(data.children[binder][0],atlas.walk(data,b.clause));
  const alternative = b.useOutsideTypeFields;
  const second = alternative && atlas.path(data,alternative.route) !== atlas.path(data,b.firstUse.route)
    ? '<br>' + link(alternative.route,'Outside explicit type fields · #' + alternative.node) : '';
  return '<tr><th scope="row">' + link(b.clause,labels[i]) + '</th><td>' +
    link(b.introduction,b.name) + '</td><td>' + link(b.firstUse.route,'Use of ' + b.name + ' · #' + b.firstUse.node) + second + '</td></tr>';
});
const conclusion = {root:0,slots:report.binders.map(() => 1)};
console.log(`<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Tracing the Riccati bound</title>
<style>:root{color-scheme:light dark}body{font:1.12rem/1.55 Georgia,serif;max-width:45rem;margin:auto;padding:clamp(.75rem,4vw,3rem)}h1{line-height:1.1}a{color:LinkText;text-underline-offset:.17em}table{width:100%;border-collapse:collapse}th,td{text-align:left;padding:.55em .25em;border-bottom:1px solid GrayText}thead{font:600 .88em system-ui}code{overflow-wrap:anywhere}@media(max-width:30rem){body{font-size:1rem}}</style>
<main><h1>Tracing the Riccati bound</h1><p>Read across a row to follow a clause into the proof. Each link selects its own occurrence in the compiled proof library.</p>
<table><thead><tr><th scope="col">Statement clause</th><th scope="col">Proof binder</th><th scope="col">Nearest use</th></tr></thead><tbody>${rows.join('\n')}</tbody></table>
<p>These inputs establish ${link(conclusion,'2√(z(1 − z)D<sub>z</sub>) ≤ |(T₁ + T₂)/(ds)|')}, with functions evaluated at <i>p</i>.</p>
<p>The two links to #50 select different paths. At one path the variable refers to <code>hab</code>, at the other to <code>hd</code>. “Nearest” counts constructor edges below the introduction and includes uses inside types. For J and p the nearest use lies inside a binder domain. Their second links skip binder domains and local-definition types. Implicit arguments can still occur on those paths.</p>
<details><summary>Compiled source</summary><p><code>${name}</code> · ${edition}<br>Index SHA-256 <code>${digest}</code></p></details></main></html>`);
