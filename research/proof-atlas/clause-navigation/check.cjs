// Run from the repository root. Output addresses are relative to the identified packet.
'use strict';
const assert = require('node:assert/strict');
const { createHash } = require('node:crypto');
const fs = require('node:fs');
const zlib = require('node:zlib');
const atlas = require('../../../public/js/proof-atlas-library-data');
const fixtures = require('../../../scripts/proof-atlas-judgment-fixtures.cjs');

const {firstUse} = require('./first-use.cjs');

const results = [];
for (const { edition, record } of fixtures.inventory()) {
  const raw = zlib.gunzipSync(fs.readFileSync('.' + record.indexFile));
  assert.equal(createHash('sha256').update(raw).digest('hex'), record.indexSha256);
  const data = atlas.validateIndex(JSON.parse(raw), record);
  let [statement, proof] = data.roots;
  const binders = [];
  const slots = [];
  while (atlas.kinds[data.kind[statement]] === 'forallE' && atlas.kinds[data.kind[proof]] === 'lam') {
    if (data.children[statement][0] !== data.children[proof][0]) break;
    const introduction = { root: 1, slots: [...slots] };
    binders.push({
      name: data.payloads[proof].binderName, domain: data.children[statement][0],
      clause: { root: 0, slots: [...slots, 0] }, introduction, firstUse: firstUse(data, introduction),
      useOutsideTypeFields: firstUse(data, introduction, true)
    });
    slots.push(1);
    statement = data.children[statement][1];
    proof = data.children[proof][1];
  }
  // Independently check absences by expanding these finite proof trees.
  // Track actual binder occurrence identities, without scope pruning or DAG memoization.
  const absent = new Set(binders.filter(b => !b.firstUse).map(b => b.introduction.slots.length));
  if (absent.size) {
    const scope = [];
    let visited = 0;
    function visit(node, outerPrefix) {
      visited++;
      const kind = atlas.kinds[data.kind[node]];
      if (kind === 'bvar') assert(!absent.has(scope.at(-1 - data.payloads[node].index)));
      data.children[node].forEach((child, slot) => {
        const introduces = ((kind === 'lam' || kind === 'forallE') && slot === 1) ||
          (kind === 'letE' && slot === 2);
        if (introduces) scope.push(outerPrefix);
        const next = outerPrefix !== null && outerPrefix < binders.length && kind === 'lam' && slot === 1
          ? outerPrefix + 1 : null;
        visit(child, next);
        if (introduces) scope.pop();
      });
    }
    visit(data.roots[1], 0);
    assert.equal(String(visited), record.proofOccurrences);
  }
  results.push({ edition, name: record.name, indexSha256: record.indexSha256, binders });
}
console.log(JSON.stringify(results, null, 2));
