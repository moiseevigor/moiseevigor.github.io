'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {gunzipSync} = require('node:zlib');
const {createHash} = require('node:crypto');
const atlas = require('../../../public/js/proof-atlas-library-data');
const ranked = require('./ranked-binder-uses.cjs');
global.window = {};
require('../../../public/data/proof-atlas/library-manifest');
require('../../../public/data/proof-atlas/goedel-sample-manifest');

// Weigh paths from a component root down to its leaves. The surrounding
// leading lambdas are the only binders in scope before entering a component.
function accumulate(term, root, prefixLength, totals) {
  const pending = new Map([[root,new Map([[prefixLength,1n]])]]);
  for (let node = root; node >= 0; node--) {
    const depths = pending.get(node);
    if (!depths) continue;
    pending.delete(node);
    const kind = atlas.kinds[term.kind[node]];
    for (const [depth,weight] of depths) {
      if (kind === 'bvar') {
        const level = depth - 1 - term.payloads[node].index;
        assert(level >= 0);
        if (level < prefixLength) totals[level] += weight;
      }
      for (const [slot,child] of term.children[node].entries()) {
        assert(child < node);
        const binds = ((kind === 'lam' || kind === 'forallE') && slot === 1) ||
          (kind === 'letE' && slot === 2);
        const next = depth + Number(binds);
        if (!pending.has(child)) pending.set(child,new Map());
        const weights = pending.get(child);
        weights.set(next,(weights.get(next) || 0n) + weight);
      }
    }
  }
  assert.equal(pending.size,0);
}

// Stream the unfolded proof in field order. Only sampled addresses are kept.
function checkOrdinals(term, samples, totals) {
  const seen = totals.map(()=>0);
  const next = totals.map(()=>0);
  const slots = [], scope = [];
  function visit(node, leading) {
    const kind = atlas.kinds[term.kind[node]];
    if (kind === 'bvar') {
      const parameter = scope[scope.length-1-term.payloads[node].index];
      if (parameter >= 0) {
        const rank = seen[parameter]++;
        const target = samples[parameter][next[parameter]];
        if (target && rank === target.rank) {
          assert.equal(node,target.entry.node);
          assert.deepEqual(slots,target.entry.route.slots);
          next[parameter]++;
        }
      }
    }
    const children = term.children[node];
    for (let slot = 0; slot < children.length; slot++) {
      const binds = ((kind === 'lam' || kind === 'forallE') && slot === 1) ||
        (kind === 'letE' && slot === 2);
      const continues = leading && kind === 'lam' && slot === 1;
      if (binds) scope.push(continues ? slots.length : -1);
      slots.push(slot);
      visit(children[slot],continues);
      slots.pop();
      if (binds) scope.pop();
    }
  }
  visit(term.roots[1],true);
  assert.deepEqual(seen.map(BigInt),totals);
  assert.deepEqual(next,samples.map(rows=>rows.length));
}

function census(edition) {
  const result = {edition:edition.id,bodies:0,withoutLeadingLambda:0,parameters:0,unused:0,
    uses:0n,verifiedRoutes:0,sharedIndexAtSampledRanks:0,largestUseCount:0n};
  for (const owner of edition.declarations.filter(r=>r.bodyAvailable && r.kind==='theorem')) {
    const bytes = gunzipSync(fs.readFileSync(path.join(__dirname,'../../..',owner.indexFile)));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),owner.indexSha256);
    const term = atlas.validateIndex(JSON.parse(bytes),owner);
    const totals = [], binders = [];
    let node = term.roots[1];
    while (atlas.kinds[term.kind[node]] === 'lam') {
      if (totals.length) accumulate(term,term.children[node][0],totals.length,totals);
      binders.push(node);
      totals.push(0n);
      node = term.children[node][1];
    }
    result.bodies++;
    if (!totals.length) {result.withoutLeadingLambda++;continue;}
    accumulate(term,node,totals.length,totals);
    const samples = totals.map(()=>[]);
    for (const [i,expected] of totals.entries()) {
      const route = {root:1,slots:Array(i).fill(1)};
      const index = ranked(term,route);
      assert.equal(index.total,expected);
      result.parameters++;
      result.uses += expected;
      if (!expected) {
        assert.throws(()=>index.select(0n),RangeError);
        result.unused++;
        continue;
      }
      if (expected > result.largestUseCount) result.largestUseCount = expected;
      const nodes = new Set();
      let previous;
      for (const rank of new Set([0n,expected/2n,expected-1n])) {
        const entry = index.select(rank);
        assert.equal(atlas.walk(term,entry.route),entry.node);
        assert.deepEqual(atlas.binding(term,entry.route),{node:binders[i],route});
        // Field slots range from 0 to 2. String order agrees with field order.
        const key = entry.route.slots.join('');
        if (previous !== undefined) assert(key > previous);
        previous = key;
        nodes.add(entry.node);
        assert(rank <= BigInt(Number.MAX_SAFE_INTEGER));
        samples[i].push({rank:Number(rank),entry});
        result.verifiedRoutes++;
      }
      if (nodes.size < Number(expected<3n?expected:3n)) result.sharedIndexAtSampledRanks++;
    }
    checkOrdinals(term,samples,totals);
  }
  return result;
}
const editions = [...window.PROOF_ATLAS_LIBRARY.editions,window.PROOF_ATLAS_AI_SAMPLE.edition];
console.log(JSON.stringify(editions.map(census),(_,v)=>typeof v==='bigint'?String(v):v,2));
