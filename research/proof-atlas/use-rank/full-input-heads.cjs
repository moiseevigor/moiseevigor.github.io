// Count one argument position per binary application, including partial applications.
'use strict';
const fs = require('node:fs');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const assert = require('node:assert/strict');
const atlas = require('../../../public/js/proof-atlas-library-data');
const inputHead = require('../step-reading/input-head.cjs');
const {inventory} = require('../../../scripts/proof-atlas-judgment-fixtures.cjs');
const records = inventory();
const results = [];
for (const {source} of require('./port-results.json')) {
  const {record} = records.find(r => r.edition === source.edition && r.record.name === source.name);
  assert.equal(record.indexSha256, source.indexSha256);
  assert.equal(record.sourceSha256, source.sourceSha256);
  const bytes = zlib.gunzipSync(fs.readFileSync('.' + record.indexFile));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), source.indexSha256);
  const term = atlas.validateIndex(JSON.parse(bytes), record);
  const root = term.roots[1];
  const mass = Array(root + 1).fill(0n);
  const parent = new Int32Array(root + 1);
  const slot = new Uint8Array(root + 1);
  mass[root] = 1n;
  const counts = new Map();
  let expanded = 0n;
  let reachableRows = 0;
  for (let row = root; row >= 0; row--) {
    if (!mass[row]) continue;
    reachableRows++;
    expanded += mass[row];
    term.children[row].forEach((child, i) => {
      if (!mass[child]) {
        parent[child] = row;
        slot[child] = i;
      }
      mass[child] += mass[row];
    });
    if (atlas.kinds[term.kind[row]] !== 'app') continue;
    const arg = term.children[row][1];
    let head = arg;
    while (atlas.kinds[term.kind[head]] === 'app') head = term.children[head][0];
    const kind = atlas.kinds[term.kind[head]];
    const shape = arg === head ? 'direct' : 'applied';
    const key = shape + '/' + kind;
    if (!counts.has(key)) {
      const slots = [1];
      for (let n = row; n !== root; n = parent[n]) slots.push(slot[n]);
      const route = {root: 1, slots: slots.reverse()};
      assert.equal(atlas.walk(term, route), arg);
      const witness = inputHead(term, {node: arg, route});
      assert.equal(witness.node, head);
      assert.equal(atlas.walk(term, witness.route), head);
      if (kind === 'bvar') assert(witness.binder);
      counts.set(key, {count: 0n, storedApplications: 0, input: {node: arg, route}, head: witness});
    }
    const group = counts.get(key);
    group.count += mass[row];
    group.storedApplications++;
  }
  assert.equal(String(expanded), term.expanded[root]);
  // Independent order: count matching positions inside each subtree, with a
  // cached function head per row, without using incoming multiplicities.
  const heads = new Uint8Array(root + 1);
  const app = atlas.kinds.indexOf('app');
  for (let row = 0; row <= root; row++) {
    heads[row] = term.kind[row] === app ? heads[term.children[row][0]] : term.kind[row];
  }
  const inside = Array(root + 1);
  let applicationPositions = 0n;
  for (let row = 0; row <= root; row++) {
    inside[row] = BigInt(term.kind[row] === app);
    for (const child of term.children[row]) inside[row] += inside[child];
  }
  for (const group of counts.values()) applicationPositions += group.count;
  assert.equal(inside[root], applicationPositions);
  for (const [key, group] of counts) {
    for (let row = 0; row <= root; row++) {
      let total = 0n;
      for (const child of term.children[row]) total += inside[child];
      if (term.kind[row] === app) {
        const arg = term.children[row][1];
        const category = (term.kind[arg] === app ? 'applied/' : 'direct/') + atlas.kinds[heads[arg]];
        if (category === key) total++;
      }
      inside[row] = total;
    }
    assert.equal(inside[root], group.count);
  }
  results.push({source, reachableRows, expanded, applicationPositions, counts: Object.fromEntries(counts)});
}
console.log(JSON.stringify(results, (_, v) => typeof v === 'bigint' ? String(v) : v, 2));
