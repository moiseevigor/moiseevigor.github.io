'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {gunzipSync} = require('node:zlib');
const {createHash} = require('node:crypto');
const atlas = require('../../../public/js/proof-atlas-library-data');
const bindingUses = require('../../../public/js/proof-atlas-binding-uses');
const {countReferences} = require('../../../public/js/proof-atlas-recursive-inputs');
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
  const reader = {budget:bindingUses.readerBudget,maxPeakEntries:0,maxRankWork:0,counted:0,largestStates:0,verifiedRoutes:0,unavailable:[]};
  result.reader = reader;
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
      const scene = bindingUses.describe(term,owner,route,bindingUses.readerBudget);
      const coverage = scene.references;
      if (coverage.status === 'counted') {
        assert.equal(BigInt(coverage.occurrences),expected);
        reader.counted++;
        reader.largestStates = Math.max(reader.largestStates,coverage.states);
      } else {
        assert.equal(coverage.status,'unavailable');
        reader.unavailable.push({name:owner.name,indexSha256:owner.indexSha256,
          parameter:i+1,uses:expected,reason:coverage.reason,states:coverage.states});
      }
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
        if (coverage.status === 'counted') {
          const selection = countReferences(term,scene.body.node,0,{...scene.budget,ordinal:rank+1n});
          assert.equal(selection.status,'counted');
          reader.maxPeakEntries = Math.max(reader.maxPeakEntries,selection.peakEntries);
          reader.maxRankWork = Math.max(reader.maxRankWork,selection.states);
          assert(selection.peakEntries <= scene.budget.maxStates && selection.states <= scene.budget.maxWork);
          assert.equal(selection.witness.node,entry.node);
          assert.deepEqual(scene.body.route.slots.concat(selection.witness.slots),entry.route.slots);
          reader.verifiedRoutes++;
        }
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
// A count can succeed just before selection exhausts the remaining work.
function checkRecomputationLimit() {
  const term = {kind:[0,5,5,5],children:[[],[0,0],[1,1],[2,2]],
    neededScope:[1,1,1,1],payloads:[{index:0},{},{},{}]};
  const budget = {maxStates:2,maxWork:4};
  assert.equal(countReferences(term,3,0,budget).occurrences,'8');
  const limited = countReferences(term,3,0,{...budget,ordinal:8n});
  assert.equal(limited.status,'unavailable');
  assert.equal(limited.witness,undefined);
  for (let i=0;i<8;i++) {
    const selected = countReferences(term,3,0,{...budget,maxWork:16,ordinal:BigInt(i+1)});
    assert.deepEqual(selected.witness.slots,[(i>>2)&1,(i>>1)&1,i&1]);
    assert.equal(selected.peakEntries,2);
  }
}
checkRecomputationLimit();
const editions = [...window.PROOF_ATLAS_LIBRARY.editions,window.PROOF_ATLAS_AI_SAMPLE.edition];
console.log(JSON.stringify(editions.map(census),(_,v)=>typeof v==='bigint'?String(v):v,2));
