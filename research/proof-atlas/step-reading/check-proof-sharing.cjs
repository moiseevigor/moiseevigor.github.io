'use strict';
// Scope conflicts within a single proof body. Each declaration is processed independently.
const assert = require('node:assert/strict');
const fs = require('node:fs');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const A = require('../../../public/js/proof-atlas-library-data');
global.window = {};
require('../../../public/data/proof-atlas/library-manifest');
require('../../../public/data/proof-atlas/goedel-sample-manifest');

function bindingBody(g, node, slot) {
  return A.fields[A.kinds[g.kind[node]]][slot] === 'body';
}

// Every occurrence of a possible binder row admits the same downward witness path.
function ownerCount(binders, counts) {
  let total = 0n;
  for (const binder of binders.keys()) total += counts[binder];
  return total;
}
const depths = [0, 1, 2, 4, 8, Infinity];
const unboundedLevel = 1 + Math.max(...depths.filter(Number.isFinite));
function conflicts(g) {
  const root = g.roots[1], uses = [], counts = Array(root + 1).fill(0n), owners = [];
  const splitDepth = [];
  for (let n = 0; n <= root; n++) {
    const indices = new Set();
    if (g.kind[n] === 0) indices.add(g.payloads[n].index);
    g.children[n].forEach((c, slot) => {
      const shift = Number(bindingBody(g, n, slot));
      for (const i of uses[c]) if (i >= shift) indices.add(i - shift);
    });
    let distance = Infinity;
    g.children[n].forEach((c, slot) => {
      if (bindingBody(g, n, slot) && uses[c].has(0)) distance = 1;
      else distance = Math.min(distance, 1 + splitDepth[c]);
    });
    splitDepth.push(distance);
    uses.push(indices);
    owners.push(new Map());
  }
  const navigable = depths.map(() => 0n);
  counts[root] = 1n;
  const ambiguous = new Set(), outerMiss = new Set(), classes = new Map();
  let childSlots = 0n, splitSlots = 0n, extraDestinations = 0n;
  let saturationDepth = 0, rows = 0, visits = 0n, ambiguousVisits = 0n;
  for (let n = root; n >= 0; n--) {
    if (!counts[n]) continue;
    rows++;
    visits += counts[n];
    assert.equal(owners[n].size, uses[n].size);
    const nearest = uses[n].size ? owners[n].get(Math.min(...uses[n])) : null;
    const scoped = nearest ? ownerCount(nearest, counts) : 1n;
    childSlots += scoped * BigInt(g.children[n].length);
    assert(scoped >= 1n && scoped <= counts[n]);
    classes.set(n, scoped);
    if (scoped < counts[n] && Number.isFinite(splitDepth[n]))
      saturationDepth = Math.max(saturationDepth, splitDepth[n]);
    depths.forEach((depth, i) => {
      navigable[i] += Number.isFinite(splitDepth[n]) && depth >= splitDepth[n] ? counts[n] : scoped;
    });
    if (scoped > 1n) {
      if (ownerCount(owners[n].get(g.neededScope[n]-1), counts) === 1n) outerMiss.add(n);
      ambiguous.add(n);
      ambiguousVisits += counts[n];
    }
    g.children[n].forEach((c, slot) => {
      counts[c] += counts[n];
      const shift = Number(bindingBody(g, n, slot));
      if (shift && uses[c].has(0)) {
        // Each occurrence of this parent supplies a distinct binder to the body.
        let repeats = counts[n] > 1n ? 1n : 0n;
        if (nearest) {
          repeats = 0n;
          let check = 0n;
          for (const [binder, paths] of nearest) {
            check += counts[binder] * paths;
            if (paths > 1n) repeats += counts[binder];
          }
          assert.equal(check, counts[n]);
        }
        splitSlots += repeats;
        extraDestinations += counts[n] - scoped;
      }
      for (const i of uses[c]) {
        if (!owners[c].has(i)) owners[c].set(i, new Map());
        const target = owners[c].get(i);
        if (shift && i === 0) target.set(n, 1n);
        else for (const [binder, paths] of owners[n].get(i-shift))
          target.set(binder, (target.get(binder) || 0n) + paths);
      }
    });
    owners[n].clear();
  }
  assert.equal(visits, BigInt(g.expanded[root]));
  return {navigable, saturationDepth, childSlots, splitSlots, extraDestinations, ambiguous, outerMiss, classes, rows, visits, ambiguousVisits};
}

// Independent oracle. Every external binder use below a row contributes its actual
// owning route to the corresponding relative reference path within that row.
function enumerate(g) {
  const first = new Map(), ambiguous = new Set(), outerChanges = new Set(), ancestors = [], scope = [], scopeDepth = [];
  const signatures = new Map(), destinations = new Map();
  // Intern the actual row, lexical signature and ordered child groups at each horizon.
  const partitions = Array.from({length:unboundedLevel + 1}, () => new Map());
  let example = null;
  function walk(n, route) {
    const external = new Set();
    if (g.kind[n] === 0) {
      const ownerIndex = scope.length - 1 - g.payloads[n].index;
      const owner = scope[ownerIndex];
      assert(owner);
      external.add(owner.route);
      for (let j = owner.depth + 1; j <= ancestors.length; j++) {
        const row = j === ancestors.length ? n : ancestors[j];
        const key = row + ':' + route.slice(j);
        if (!first.has(key)) first.set(key, owner.route);
        else if (first.get(key) !== owner.route) {
          ambiguous.add(row);
          const scopeSize = j === ancestors.length ? scope.length : scopeDepth[j];
          if (scopeSize - 1 - ownerIndex === g.neededScope[row] - 1) outerChanges.add(row);
        }
      }
    }
    const children = [], childGroups = [];
    ancestors.push(n);
    scopeDepth.push(scope.length);
    g.children[n].forEach((c, slot) => {
      const k = g.kind[n], bind = ((k === 6 || k === 7) && slot === 1) || (k === 8 && slot === 2);
      if (bind) scope.push({route, depth: route.length});
      const child = walk(c, route + slot);
      children.push(JSON.stringify([...child.external].sort()));
      childGroups.push(child.ids);
      for (const binder of child.external) if (binder !== route) external.add(binder);
      if (bind) scope.pop();
    });
    ancestors.pop();
    scopeDepth.pop();
    if (!signatures.has(n)) signatures.set(n, new Set());
    const signature = JSON.stringify([...external].sort());
    signatures.get(n).add(signature);
    children.forEach((child, slot) => {
      const key = JSON.stringify([n, signature, slot]);
      if (!destinations.has(key)) destinations.set(key, new Map());
      const targets = destinations.get(key);
      if (!targets.has(child)) {
        if (targets.size && !example) example = {parent:n, child:g.children[n][slot], slot,
          externalBinders:[...external], firstParentRoute:targets.values().next().value, secondParentRoute:route};
        targets.set(child, route);
      }
    });
    const ids = partitions.map((pool, level) => {
      const next = level === unboundedLevel ? level : level-1;
      const key = JSON.stringify([n, signature, level ? childGroups.map(group => group[next]) : []]);
      if (!pool.has(key)) pool.set(key, pool.size);
      return pool.get(key);
    });
    return {external, ids};
  }
  walk(g.roots[1], '');
  let splitSlots = 0n, extraDestinations = 0n;
  for (const targets of destinations.values()) {
    if (targets.size > 1) splitSlots++;
    extraDestinations += BigInt(targets.size - 1);
  }
  return {example, navigable: depths.map(d => BigInt(partitions[Number.isFinite(d) ? d : unboundedLevel].size)), childSlots:BigInt(destinations.size), splitSlots, extraDestinations, ambiguous, classes: new Map([...signatures].map(([n,s]) => [n, BigInt(s.size)])), outerMiss: new Set([...ambiguous].filter(n => !outerChanges.has(n)))};
}

for (const e of [...window.PROOF_ATLAS_LIBRARY.editions, window.PROOF_ATLAS_AI_SAMPLE.edition]) {
  const navigable = depths.map(() => 0n);
  const totals = {edition:e.id, proofs:0, exhaustiveChecks:0, affectedProofs:0, proofsWithConflictingApplication:0, rows:0, conflictingRows:0, conflictingApplications:0, outerMissApplications:0, proofsWithOuterMiss:0};
  let childSlots = 0n, splitSlots = 0n, extraDestinations = 0n, affectedProofBodies = 0;
  let example = null, deepest = null;
  let visits = 0n, affected = 0n, scopedRows = 0n, largestIncrease = null;
  for (const d of e.declarations.filter(x => x.kind === 'theorem' && x.bodyAvailable)) {
    const raw = zlib.gunzipSync(fs.readFileSync('.' + d.indexFile));
    assert.equal(crypto.createHash('sha256').update(raw).digest('hex'), d.indexSha256);
    const g = A.validateIndex(JSON.parse(raw), d);
    const r = conflicts(g);
    assert.equal(r.visits, BigInt(d.proofOccurrences));
    if (r.visits <= 10000n) {
      const observed = enumerate(g);
      if (observed.example && (!example || d.name === 'CrossingData.crossing'))
        example = {declaration:d.name, ...observed.example};
      assert.deepEqual(r.ambiguous, observed.ambiguous);
      assert.deepEqual(r.outerMiss, observed.outerMiss);
      assert.deepEqual(r.classes, observed.classes);
      assert.deepEqual(r.navigable, observed.navigable);
      for (const field of ['childSlots','splitSlots','extraDestinations'])
        assert.equal(r[field], observed[field]);
      totals.exhaustiveChecks++;
    }
    r.navigable.forEach((count,i) => { navigable[i] += count; });
    assert.equal(r.navigable[1] - r.navigable[0], r.extraDestinations);
    childSlots += r.childSlots;
    splitSlots += r.splitSlots;
    extraDestinations += r.extraDestinations;
    if (r.splitSlots) affectedProofBodies++;
    if (!deepest || deepest.depth < r.saturationDepth) deepest = {name:d.name, depth:r.saturationDepth};
    totals.proofs++;
    totals.rows += r.rows;
    totals.conflictingRows += r.ambiguous.size;
    if (r.ambiguous.size) totals.affectedProofs++;
    const applications = [...r.ambiguous].filter(n => g.kind[n] === 5).length;
    totals.conflictingApplications += applications;
    if (applications) totals.proofsWithConflictingApplication++;
    const outerMiss = [...r.outerMiss].filter(n => g.kind[n] === 5).length;
    totals.outerMissApplications += outerMiss;
    if (outerMiss) totals.proofsWithOuterMiss++;
    visits += r.visits;
    affected += r.ambiguousVisits;
    let groups = 0n;
    for (const count of r.classes.values()) groups += count;
    scopedRows += groups;
    if (!largestIncrease || groups * BigInt(largestIncrease.rows) > BigInt(largestIncrease.groups) * BigInt(r.rows))
      largestIncrease = {name:d.name, rows:r.rows, groups:String(groups), occurrences:String(r.visits)};
  }
  console.log(JSON.stringify({...totals, deepest, groupsByDepth:Object.fromEntries(depths.map((d,i)=>[String(d),String(navigable[i])])), example, childSlots:String(childSlots), splitSlots:String(splitSlots), extraDestinations:String(extraDestinations), affectedProofBodies, largestIncrease, scopedRows:String(scopedRows), occurrences:String(visits), occurrencesInConflictingRows:String(affected)}));
}
