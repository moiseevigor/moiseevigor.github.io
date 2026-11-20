'use strict';
const assert = require('node:assert/strict');
const atlas = require('../../../public/js/proof-atlas-library-data');

// Inside one introduction, an occurrence refers to it exactly when its de
// Bruijn index equals the number of intervening lexical binders. The same
// stored row at two such depths can have different answers.
function* useRows(data, binderRoute, skipExplicitTypeFields = false) {
  const body = { root: binderRoute.root, slots: [...binderRoute.slots, 1] };
  const queue = [];
  const seen = new Set();
  function offer(node, depth, parent, slot) {
    if (depth >= data.neededScope[node]) return;
    const key = node + '/' + depth;
    if (seen.has(key)) return;
    seen.add(key);
    queue.push({ node, depth, parent, slot });
  }
  offer(atlas.walk(data, body), 0, -1, null);
  for (let i = 0; i < queue.length; i++) {
    const { node, depth } = queue[i];
    const kind = atlas.kinds[data.kind[node]];
    if (kind === 'bvar' && data.payloads[node].index === depth) {
      const suffix = [];
      for (let j = i; queue[j].parent >= 0; j = queue[j].parent) suffix.push(queue[j].slot);
      const route = { root: body.root, slots: body.slots.concat(suffix.reverse()) };
      assert.equal(atlas.walk(data, route), node);
      assert.deepEqual(atlas.binding(data, route), { node: atlas.walk(data, binderRoute), route: binderRoute });
      yield { node, route };
    }
    data.children[node].forEach((child, slot) => {
      const field = atlas.fields[kind][slot];
      if (skipExplicitTypeFields && (field === 'domain' || (kind === 'letE' && field === 'type'))) return;
      const binds = field === 'body' && ['lam', 'forallE', 'letE'].includes(kind);
      offer(child, depth + Number(binds), i, slot);
    });
  }
}

function firstUse(data, binderRoute, skipExplicitTypeFields = false) {
  for (const witness of useRows(data, binderRoute, skipExplicitTypeFields)) return witness;
  return null;
}

module.exports = {firstUse, useRows};
