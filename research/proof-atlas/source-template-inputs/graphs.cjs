'use strict';
const assert = require('assert/strict');
const A = require('../../../public/js/proof-atlas-library-data');
const binds = (kind, slot) => (kind === 6 || kind === 7) && slot === 1 || kind === 8 && slot === 2;

function graph(g) {
  const n = g.kind.length;
  assert(n > 0 && n <= 131072);
  for (const field of ['children', 'payloads', 'expanded', 'neededScope']) assert.equal(g[field].length, n);
  for (let id = 0; id < n; id++) {
    const kind = g.kind[id], children = g.children[id];
    assert(Number.isInteger(kind) && kind >= 0 && kind < 12);
    assert.equal(children.length, (A.fields[A.kinds[kind]] || []).length);
    assert(children.every(child => Number.isInteger(child) && child >= 0 && child < id));
    assert.equal(1n + children.reduce((sum, child) => sum + BigInt(g.expanded[child]), 0n), BigInt(g.expanded[id]));
    const needed = kind === 0 ? g.payloads[id].index + 1 : Math.max(0, ...children.map((child, slot) => g.neededScope[child] - Number(binds(kind, slot))));
    assert.equal(needed, g.neededScope[id]);
    A.payloadKey(kind, g.payloads[id]);
  }
  assert(g.roots.every(root => Number.isInteger(root) && root >= 0 && root < n));
}

function allGraphs(record) {
  if (record.graph) graph(record.graph);
  for (const row of record.bindings || []) graph(row.graph);
  for (const row of record.constraints || []) graph(row.graph);
  for (const row of record.permutations || []) graph(row.graph);
  for (const row of record.templates || []) graph(row.graph);
  if (record.template) graph(record.template.graph);
  for (const row of record.calls || []) { graph(row.graph); graph(row.originalType); }
}

module.exports = {graph, allGraphs, binds};
