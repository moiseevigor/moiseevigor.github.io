// Enumerate only paths that can reach a compound argument with a local head.
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
const key = hit => hit.route.root + ':' + hit.route.slots.join('.');
for (const {source, counts} of require('./full-input-heads.json')) {
  const {record} = records.find(r => r.edition === source.edition && r.record.name === source.name);
  const bytes = zlib.gunzipSync(fs.readFileSync('.' + record.indexFile));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), source.indexSha256);
  const term = atlas.validateIndex(JSON.parse(bytes), record);
  const root = term.roots[1];
  const local = new Uint8Array(root + 1);
  const matches = new Uint8Array(root + 1);
  const reachable = new Uint8Array(root + 1);
  for (let row = 0; row <= root; row++) {
    const [fn,arg] = term.children[row];
    const kind = atlas.kinds[term.kind[row]];
    local[row] = kind === 'app' ? local[fn] : Number(kind === 'bvar');
    matches[row] = Number(kind === 'app' && atlas.kinds[term.kind[arg]] === 'app' && local[arg]);
    reachable[row] = Number(matches[row] || term.children[row].some(child => reachable[child]));
  }
  const groups = new Map();
  const binders = new Set();
  let positions = 0;
  const pending = reachable[root] ? [{node: root, slots: []}] : [];
  while (pending.length) {
    const {node, slots} = pending.pop();
    if (matches[node]) {
      const arg = term.children[node][1];
      const input = {node: arg, route: {root: 1, slots: slots.concat(1)}};
      const head = inputHead(term, input);
      assert.equal(head.kind, 'bvar');
      // Independently count binding bodies while walking outwards from the use.
      let index = term.payloads[head.node].index;
      let depth = head.route.slots.length;
      for (; depth > 0; depth--) {
        const parent = {root: 1, slots: head.route.slots.slice(0, depth - 1)};
        const ancestor = atlas.walk(term, parent);
        const field = atlas.fields[atlas.kinds[term.kind[ancestor]]][head.route.slots[depth - 1]];
        if (field === 'body' && index-- === 0) {
          assert.deepEqual(head.binder.route, parent);
          assert.equal(head.binder.node, ancestor);
          break;
        }
      }
      assert(depth > 0);
      if (!groups.has(arg)) groups.set(arg, new Map());
      const targets = groups.get(arg);
      const binderKey = key(head.binder);
      if (!targets.has(binderKey)) targets.set(binderKey, {input,head,uses:0});
      targets.get(binderKey).uses++;
      binders.add(binderKey);
      positions++;
    }
    term.children[node].forEach((child, slot) => {
      if (reachable[child]) pending.push({node: child, slots: slots.concat(slot)});
    });
  }
  assert.equal(String(positions), counts['applied/bvar']?.count || '0');
  const multiple = [...groups.values()].filter(targets => targets.size > 1);
  const pairs = multiple.map(targets => {
    const witnesses = [...targets.values()];
    return [witnesses[0], witnesses.find(w => w.head.binder.node !== witnesses[0].head.binder.node) || witnesses[1]];
  });
  const witness = pairs.find(([a,b]) => a.head.binder.name !== b.head.binder.name) || pairs[0] || null;
  results.push({source, positions, inputRows: groups.size, binderOccurrences: binders.size,
    rowsWithMultipleBinderOccurrences: multiple.length,
    rowsWithMultipleBinderRows: multiple.filter(m => new Set([...m.values()].map(w => w.head.binder.node)).size > 1).length,
    groups: [...groups.values()].map(m => [...m.values()]),
    maxBindersPerInputRow: Math.max(0,...[...groups.values()].map(m => m.size)), witness});
}
console.log(JSON.stringify(results,null,2));
