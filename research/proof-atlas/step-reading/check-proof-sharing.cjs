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

// For each free index, an owner is either one uniquely occurring binder row or MANY.
// An introduction in a repeated parent already has distinct occurrence routes.
const MANY = -1;
function conflicts(g) {
  const root = g.roots[1], uses = [], counts = Array(root + 1).fill(0n), owners = [];
  for (let n = 0; n <= root; n++) {
    const indices = new Set();
    if (g.kind[n] === 0) indices.add(g.payloads[n].index);
    g.children[n].forEach((c, slot) => {
      const shift = Number(bindingBody(g, n, slot));
      for (const i of uses[c]) if (i >= shift) indices.add(i - shift);
    });
    uses.push(indices);
    owners.push(new Map());
  }
  counts[root] = 1n;
  const ambiguous = new Set(), outerMiss = new Set();
  let rows = 0, visits = 0n, ambiguousVisits = 0n;
  for (let n = root; n >= 0; n--) {
    if (!counts[n]) continue;
    rows++;
    visits += counts[n];
    assert.equal(owners[n].size, uses[n].size);
    if ([...owners[n].values()].includes(MANY)) {
      assert.equal(owners[n].get(Math.min(...uses[n])), MANY);
      if (owners[n].get(g.neededScope[n]-1) !== MANY) outerMiss.add(n);
      ambiguous.add(n);
      ambiguousVisits += counts[n];
    }
    g.children[n].forEach((c, slot) => {
      counts[c] += counts[n];
      const shift = Number(bindingBody(g, n, slot));
      for (const i of uses[c]) {
        const owner = shift && i === 0 ? (counts[n] === 1n ? n : MANY) : owners[n].get(i-shift);
        assert.notEqual(owner, undefined);
        const previous = owners[c].get(i);
        owners[c].set(i, previous === undefined || previous === owner ? owner : MANY);
      }
    });
  }
  assert.equal(visits, BigInt(g.expanded[root]));
  return {ambiguous, outerMiss, rows, visits, ambiguousVisits};
}

// Independent oracle. Every external binder use below a row contributes its actual
// owning route to the corresponding relative reference path within that row.
function enumerate(g) {
  const first = new Map(), ambiguous = new Set(), outerChanges = new Set(), ancestors = [], scope = [], scopeDepth = [];
  function walk(n, route) {
    if (g.kind[n] === 0) {
      const ownerIndex = scope.length - 1 - g.payloads[n].index;
      const owner = scope[ownerIndex];
      assert(owner);
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
    ancestors.push(n);
    scopeDepth.push(scope.length);
    g.children[n].forEach((c, slot) => {
      const k = g.kind[n], bind = ((k === 6 || k === 7) && slot === 1) || (k === 8 && slot === 2);
      if (bind) scope.push({route, depth: route.length});
      walk(c, route + slot);
      if (bind) scope.pop();
    });
    ancestors.pop();
    scopeDepth.pop();
  }
  walk(g.roots[1], '');
  return {ambiguous, outerMiss: new Set([...ambiguous].filter(n => !outerChanges.has(n)))};
}

for (const e of [...window.PROOF_ATLAS_LIBRARY.editions, window.PROOF_ATLAS_AI_SAMPLE.edition]) {
  const totals = {edition:e.id, proofs:0, exhaustiveChecks:0, affectedProofs:0, proofsWithConflictingApplication:0, rows:0, conflictingRows:0, conflictingApplications:0, outerMissApplications:0, proofsWithOuterMiss:0};
  let visits = 0n, affected = 0n;
  for (const d of e.declarations.filter(x => x.kind === 'theorem' && x.bodyAvailable)) {
    const raw = zlib.gunzipSync(fs.readFileSync('.' + d.indexFile));
    assert.equal(crypto.createHash('sha256').update(raw).digest('hex'), d.indexSha256);
    const g = A.validateIndex(JSON.parse(raw), d);
    const r = conflicts(g);
    assert.equal(r.visits, BigInt(d.proofOccurrences));
    if (r.visits <= 10000n) {
      const observed = enumerate(g);
      assert.deepEqual(r.ambiguous, observed.ambiguous);
      assert.deepEqual(r.outerMiss, observed.outerMiss);
      totals.exhaustiveChecks++;
    }
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
  }
  console.log(JSON.stringify({...totals, occurrences:String(visits), occurrencesInConflictingRows:String(affected)}));
}
