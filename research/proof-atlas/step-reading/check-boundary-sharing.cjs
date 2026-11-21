'use strict';

// Read the full-mode JSON from check-arithmetic-depth.cjs on stdin.
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const fs = require('node:fs');
const zlib = require('node:zlib');
const A = require('../../../public/js/proof-atlas-library-data');
const {rowCopies, outerReference} = require('../../../public/js/proof-atlas-arithmetic');
global.window = {};
require('../../../public/data/proof-atlas/goedel-sample-manifest');

const {summaries, roots} = JSON.parse(fs.readFileSync(0, 'utf8'));
assert(summaries.length > 0 && summaries.length === roots);
const edition = window.PROOF_ATLAS_AI_SAMPLE.edition;
const total = {visits: 0, occurrences: 0, rows: 0, scopedRows: 0, prefixScopedRows: 0, conflictingRows: 0, startsWithConflict: 0};
const examples = [];
const routeKey = route => route.root + ':' + route.slots.join('.');
const binds = (kind, slot) => ((kind === 6 || kind === 7) && slot === 1) || (kind === 8 && slot === 2);

// Retain one relative reference path per free de Bruijn index.
function freeReferences(g) {
  const refs = [];
  for (let node = 0; node < g.kind.length; node++) {
    const used = new Map();
    if (g.kind[node] === 0) used.set(g.payloads[node].index, []);
    g.children[node].forEach((child, slot) => {
      const shift = Number(binds(g.kind[node], slot));
      for (const [index, path] of refs[child]) {
        const free = index - shift;
        if (free >= 0 && !used.has(free)) used.set(free, [slot, ...path]);
      }
    });
    assert.equal(Math.max(-1, ...used.keys()) + 1, g.neededScope[node]);
    refs.push(used);
  }
  return refs;
}

// Independent top-down inventory. A row reached at two nesting depths must be visited twice.
function checkFreeIndices(g, root, expected) {
  const todo = [[root, 0]], seen = new Set(), actual = new Set();
  while (todo.length) {
    const [node, depth] = todo.pop();
    const key = node + ':' + depth;
    if (seen.has(key)) continue;
    seen.add(key);
    if (g.kind[node] === 0 && g.payloads[node].index >= depth) actual.add(g.payloads[node].index - depth);
    g.children[node].forEach((child, slot) => {
      const body = A.fields[A.kinds[g.kind[node]]][slot] === 'body';
      todo.push([child, depth + Number(body)]);
    });
  }
  assert.deepEqual(actual, new Set(expected.keys()));
}

for (const name of new Set(summaries.map(s => s.proof))) {
  const sites = new Map();
  for (const s of summaries.filter(s => s.proof === name)) {
    for (const [, group] of s.unexplained) {
      for (const site of group) {
        sites.set(routeKey(site.route), site);
        total.visits++;
      }
    }
  }
  if (!sites.size) continue;
  const d = edition.declarations.find(d => d.name === name);
  const raw = zlib.gunzipSync(fs.readFileSync('.' + d.indexFile));
  assert.equal(crypto.createHash('sha256').update(raw).digest('hex'), d.indexSha256);
  const g = A.validateIndex(JSON.parse(raw), d);
  const refs = freeReferences(g);
  const byRow = new Map(), signatureByRoute = new Map(), prefixSignatures = new Set();
  for (const site of sites.values()) {
    const scope = [];
    let node = g.roots[site.route.root];
    site.route.slots.forEach((slot, i) => {
      if (binds(g.kind[node], slot)) scope.push({node, route: {root: site.route.root, slots: site.route.slots.slice(0, i)}});
      node = g.children[node][slot];
    });
    assert.equal(node, site.node);
    const needed = g.neededScope[node];
    const prefix = needed ? scope.slice(-needed).map(binder => routeKey(binder.route)) : [];
    prefixSignatures.add(JSON.stringify([node, prefix]));
    const copies = rowCopies(g, site);
    assert.deepEqual(copies.select(copies.rank), site);
    const witness = outerReference(g, site);
    if (needed) {
      assert.deepEqual(witness.binder, scope.at(-needed));
      assert.equal(A.walk(g, witness.reference.route), witness.reference.node);
      assert.equal(g.kind[witness.reference.node], 0);
      assert.deepEqual(witness.binder, A.binding(g, witness.reference.route));
    } else assert.equal(witness, null);
    const owners = [];
    for (const [index, path] of refs[node]) {
      const binder = scope.at(-1-index);
      assert(binder);
      const route = {root: site.route.root, slots: site.route.slots.concat(path)};
      assert.deepEqual(A.binding(g, route), binder);
      owners.push([index, routeKey(binder.route)]);
    }
    if (!byRow.has(node)) byRow.set(node, new Map());
    const signature = JSON.stringify(owners);
    byRow.get(node).set(signature, site);
    signatureByRoute.set(routeKey(site.route), signature);
  }
  for (const summary of summaries.filter(s => s.proof === name)) {
    const first = new Map();
    const conflict = summary.unexplained.some(([, group]) => group.some(site => {
      const signature = signatureByRoute.get(routeKey(site.route));
      if (first.has(site.node)) return signature !== first.get(site.node);
      first.set(site.node, signature);
      return false;
    }));
    if (conflict) total.startsWithConflict++;
  }
  total.occurrences += sites.size;
  total.rows += byRow.size;
  total.prefixScopedRows += prefixSignatures.size;
  for (const [node, variants] of byRow) {
    checkFreeIndices(g, node, refs[node]);
    total.scopedRows += variants.size;
    if (variants.size > 1) {
      total.conflictingRows++;
      if (examples.length < 3) examples.push({proof: name, node, variants: [...variants].slice(0, 2).map(([owners, site]) => ({owners: JSON.parse(owners), site}))});
    }
  }
}
console.log(JSON.stringify({edition: edition.id, starts: roots, total, examples}, null, 2));
