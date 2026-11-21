// How many enclosing row/field pairs suffice to identify a single call occurrence?
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const {gunzipSync} = require('node:zlib');
const {createHash} = require('node:crypto');
const atlas = require('../../../public/js/proof-atlas-library-data');
const baseline = require('./ai-call-destinations.json');

function unresolved(term, root) {
  const isApp = id => atlas.kinds[term.kind[id]] === 'app';
  const visits = Array(root + 1).fill(0n);
  const calls = Array(root + 1).fill(0n);
  visits[root] = 1n;
  if (isApp(root)) calls[root] = 1n;
  for (let id = root; id >= 0; id--) {
    if (!visits[id]) continue;
    term.children[id].forEach((child, slot) => {
      assert(child < id);
      visits[child] += visits[id];
      if (isApp(child) && !(isApp(id) && slot === 0)) calls[child] += visits[id];
    });
  }
  // Depth zero already restricts the search to endpoints of complete function spines.
  const curve = [calls.reduce((sum,n) => sum + (n > 1n ? n : 0n), 0n)];
  let descendants = visits.map((weight, id) => weight > 1n ?
    BigInt(term.children[id].filter((child,slot) => isApp(child) && !(isApp(id) && slot === 0)).length) : 0n);
  // A fixed suffix below row A has precisely visits[A] copies. Count suffixes
  // of length k below repeated ancestors without allocating any route strings.
  while (curve.at(-1) > 0n) {
    const count = descendants.reduce((sum,n,id) => sum + n * visits[id], 0n);
    assert(count <= curve.at(-1));
    curve.push(count);
    if (!count) break;
    descendants = descendants.map((_, id) => visits[id] > 1n ?
      term.children[id].reduce((sum,c) => sum + descendants[c], 0n) : 0n);
  }
  return curve;
}

function enumerate(term,root) {
  const paths = [];
  function walk(id, edges, endpoint) {
    const app = atlas.kinds[term.kind[id]] === 'app';
    if (app && endpoint) paths.push({id, edges});
    term.children[id].forEach((child,slot) => walk(child, edges.concat(id + '.' + slot), !app || slot !== 0));
  }
  walk(root, [], true);
  const curve = [];
  for (let depth = 0; ; depth++) {
    const groups = new Map();
    for (const {id,edges} of paths) {
      const key = [id,...edges.slice(Math.max(0, edges.length-depth))].join('/');
      groups.set(key,(groups.get(key) || 0n) + 1n);
    }
    const count = [...groups.values()].reduce((sum,n) => sum + (n > 1n ? n : 0n), 0n);
    curve.push(count);
    if (!count) return curve;
  }
}

const window = {};
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/goedel-sample-manifest.js','utf8'),{window});
const edition = window.PROOF_ATLAS_AI_SAMPLE.edition;
assert.equal(edition.id,baseline.edition);
const proofs = [];
const totals = [];
for (const owner of edition.declarations.filter(r => r.kind === 'theorem' && r.bodyAvailable)) {
  const bytes = gunzipSync(fs.readFileSync('.'+owner.indexFile));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),owner.indexSha256);
  const term = atlas.validateIndex(JSON.parse(bytes),owner);
  const root = term.roots[1];
  let sample = root;
  while (BigInt(term.expanded[sample]) > 2000n) {
    sample = term.children[sample].reduce((a,b) => BigInt(term.expanded[a]) >= BigInt(term.expanded[b]) ? a : b);
  }
  assert.deepEqual(unresolved(term,sample),enumerate(term,sample));
  const counts = unresolved(term,root);
  const prior = baseline.proofs.find(p => p.name === owner.name);
  assert.equal(prior.indexSha256,owner.indexSha256);
  assert(counts[0] <= BigInt(prior.maximal));
  counts.forEach((n,i) => { totals[i] = (totals[i] || 0n) + n; });
  proofs.push({name:owner.name,indexSha256:owner.indexSha256,endpoints:prior.maximal,unresolved:counts});
}
console.log(JSON.stringify({edition:edition.id,totals,proofs},(_,v) => typeof v === 'bigint' ? v.toString() : v,2));
