// From the repository root: node research/proof-atlas/clause-navigation/census.cjs
'use strict';
const fs = require('node:fs');
const vm = require('node:vm');
const zlib = require('node:zlib');
const {createHash} = require('node:crypto');
const assert = require('node:assert/strict');
const atlas = require('../../../public/js/proof-atlas-library-data');

const {destination} = require('../../../public/js/proof-atlas-clause-navigation');

const window = {};
for (const file of ['library-manifest', 'goedel-sample-manifest', 'recursion-examples-manifest']) {
  vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/' + file + '.js', 'utf8'), {window});
}

function measure(record) {
  const bytes = zlib.gunzipSync(fs.readFileSync('.' + record.indexFile));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), record.indexSha256);
  const data = atlas.validateIndex(JSON.parse(bytes), record);
  assert.equal(data.roots.length, 2);
  let [type, value] = data.roots;
  let pairs = 0;
  let remaining = 0;
  let stop;
  while (atlas.kinds[data.kind[type]] === 'forallE') {
    const slots = Array(pairs).fill(1);
    const clause = destination(data, {root:0, slots:[...slots, 0]});
    const reverse = destination(data, {root:1, slots});
    assert.equal(clause.node, value);
    assert.equal(reverse.node, type);
    assert.deepEqual(clause.route, {root:1, slots});
    assert.deepEqual(reverse.route, {root:0, slots});
    const kind = atlas.kinds[data.kind[value]];
    if (kind !== 'lam' || data.children[type][0] !== data.children[value][0]) {
      assert.equal(clause.label, 'Open proof of remaining statement');
      assert.equal(reverse.label, 'Open remaining statement');
      stop = kind === 'lam' ? 'different domain rows' : kind;
      break;
    }
    assert.equal(clause.label, 'Open proof binder');
    assert.equal(reverse.label, 'Open statement binder');
    pairs++;
    type = data.children[type][1];
    value = data.children[value][1];
  }
  while (atlas.kinds[data.kind[type]] === 'forallE') {
    remaining++;
    type = data.children[type][1];
  }
  return {pairs, remaining, stop};
}

const results = [];
for (const edition of [...window.PROOF_ATLAS_LIBRARY.editions, window.PROOF_ATLAS_AI_SAMPLE.edition,
  window.PROOF_ATLAS_RECURSION_EXAMPLES.edition]) {
  const stats = {edition:edition.id, theorems:0, noLeadingBinders:0, allLeadingBindersPaired:0,
    stopped:0, pairs:0, remaining:0, stoppingReasons:{}};
  for (const record of edition.declarations.filter(x => x.kind === 'theorem')) {
    const {pairs, remaining, stop} = measure(record);
    stats.theorems++;
    stats.pairs += pairs;
    stats.remaining += remaining;
    if (stop) {
      stats.stopped++;
      const reason = stats.stoppingReasons[stop] ??= {count:0, example:record.name,
        indexSha256:record.indexSha256, firstUnpairedDepth:pairs};
      reason.count++;
    } else if (pairs) stats.allLeadingBindersPaired++;
    else stats.noLeadingBinders++;
  }
  assert.equal(stats.theorems, stats.noLeadingBinders + stats.allLeadingBindersPaired + stats.stopped);
  results.push(stats);
}
console.log(JSON.stringify(results, null, 2));
