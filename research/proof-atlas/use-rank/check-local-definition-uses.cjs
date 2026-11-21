// Count downstream uses of every distinct let row reachable from a proof root.
'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const zlib = require('node:zlib');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const A = require('../../../public/js/proof-atlas-library-data');
const B = require('../../../public/js/proof-atlas-binding-uses');
const window = {};
for (const file of ['library-manifest', 'goedel-sample-manifest']) {
  vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/' + file + '.js', 'utf8'), {window});
}

function audit(record) {
  const bytes = zlib.gunzipSync(fs.readFileSync('.' + record.indexFile));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), record.indexSha256);
  const data = A.validateIndex(JSON.parse(bytes), record);
  // A row's free-index multiplicities are independent of its enclosing occurrence.
  // Entering a binder body removes index zero and shifts every larger index down.
  const free = new Map();
  function freeIndices(row) {
    if (free.has(row)) return free.get(row);
    const counts = new Map(), kind = A.kinds[data.kind[row]];
    if (kind === 'bvar') counts.set(data.payloads[row].index, 1n);
    data.children[row].forEach((child, field) => {
      const bound = ((kind === 'lam' || kind === 'forallE') && field === 1) ||
        (kind === 'letE' && field === 2);
      for (const [index, count] of freeIndices(child)) {
        const outer = index - Number(bound);
        if (outer >= 0) counts.set(outer, (counts.get(outer) || 0n) + count);
      }
    });
    free.set(row, counts);
    return counts;
  }
  // Propagate route counts through each child slot, including duplicate edges.
  const root = data.roots[1];
  const visits = Array(root + 1).fill(0n);
  visits[root] = 1n;
  for (let row = root; row >= 0; row--) {
    for (const child of data.children[row]) visits[child] += visits[row];
  }
  assert.equal(visits.reduce((a,b) => a+b), BigInt(data.expanded[root]));
  const weight = {unused:0n, once:0n, repeated:0n, unavailable:0n};
  let sharedRows = 0;
  const visited = new Set();
  const stats = {letRows:0, unused:0, once:0, repeated:0, unavailable:0};
  const examples = [], shared = [];
  function walk(node, slots) {
    if (visited.has(node)) return;
    visited.add(node);
    const children = data.children[node];
    if (A.kinds[data.kind[node]] === 'letE') {
      stats.letRows++;
      const scene = B.describe(data, record, {root:1, slots});
      if (visits[node] > 1n) {
        sharedRows++;
        const table = require('../../../public/js/proof-atlas-row-occurrences').index(data,node,{root:1,slots});
        assert.equal(table.total,visits[node]);
        const first = table.select(1n), last = table.select(table.total);
        assert.notDeepEqual(first,last);
        assert.equal(A.walk(data,first),node);
        assert.equal(A.walk(data,last),node);
        shared.push({node,locations:String(table.total),first,last});
      }
      if (scene.references.status !== 'counted') {
        stats.unavailable++;
        weight.unavailable += visits[node];
      }
      else {
        const n = BigInt(scene.references.occurrences);
        assert.equal(n, freeIndices(children[2]).get(0) || 0n);
        const category = n === 0n ? 'unused' : n === 1n ? 'once' : 'repeated';
        stats[category]++;
        weight[category] += visits[node];
        if (record.name === 'JacobiData.slope_bound_abs' && ['hds','hsum'].includes(scene.selection.name)) {
          // Enumerate occurrences independently, retaining only those resolving to this binder.
          const uses = [];
          function visit(row, path) {
            if (A.kinds[data.kind[row]] === 'bvar') {
              const binder = A.binding(data, {root:1,slots:path});
              if (binder.node === node && binder.route.slots.join('.') === slots.join('.')) uses.push(path);
            }
            data.children[row].forEach((child,i) => visit(child,path.concat(i)));
          }
          visit(children[2],slots.concat(2));
          assert.equal(BigInt(uses.length),n);
          examples.push({name:scene.selection.name,node,slots,uses});
        }
      }
    }
    children.forEach((child,i) => walk(child,slots.concat(i)));
  }
  walk(data.roots[1],[]);
  // Independently count let occurrences bottom-up from subtrees.
  const letCounts = [];
  for (let row = 0; row <= root; row++) {
    letCounts.push(data.children[row].reduce((n,c) => n + letCounts[c], BigInt(A.kinds[data.kind[row]] === 'letE')));
  }
  assert.equal(Object.values(weight).reduce((a,b) => a+b), letCounts[root]);
  const occurrences = Object.fromEntries(Object.entries(weight).map(([key,n]) => [key,String(n)]));
  return {sharedRows,...(shared.length ? {shared} : {}), occurrences, name:record.name,indexSha256:record.indexSha256,...stats,...(examples.length ? {examples} : {})};
}

const published = window.PROOF_ATLAS_LIBRARY.editions.find(e => e.id === 'published-15').declarations.filter(r => r.kind === 'theorem');
const se2 = published.map(audit);
const riccati = se2.find(r => r.name === 'JacobiData.slope_bound_abs');
assert(riccati);
console.log(JSON.stringify({riccati, ai:window.PROOF_ATLAS_AI_SAMPLE.edition.declarations.map(audit), se2},null,2));
