// Read check-repeated-proof-parameters.cjs output on stdin.
'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const union = require('../recorded-union.cjs');
const atlas = require('../../../public/js/proof-atlas-library-data');
const {spine} = require('../../../public/js/proof-atlas-elimination');

async function main() {
  const report = JSON.parse(fs.readFileSync(0, 'utf8'));
  const results = [];
  const sharedArguments = [];
  for (const item of union.inventory().filter(i => i.edition === 'goedel-sample-4331')) {
    const hits = report.hits.filter(h => h.proof === item.record.name);
    if (!hits.length) continue;
    const graph = (await union.open(item)).case.data;
    const targets = new Map();
    const references = new Map();
    // One internal witness per distinct external de Bruijn index.
    function free(node) {
      if (references.has(node)) return references.get(node);
      const refs = new Map();
      if (graph.kind[node] === 0) refs.set(graph.payloads[node].index, []);
      else if (graph.neededScope[node]) graph.children[node].forEach((child, slot) => {
        const shift = Number(atlas.fields[atlas.kinds[graph.kind[node]]][slot] === 'body');
        for (const [index, path] of free(child)) {
          if (index >= shift && !refs.has(index-shift)) refs.set(index-shift, [slot, ...path]);
        }
      });
      assert.equal(Math.max(-1, ...refs.keys()) + 1, graph.neededScope[node]);
      references.set(node, refs);
      return refs;
    }
    for (const hit of hits) {
      assert.equal(item.record.indexSha256, hit.indexSha256);
      targets.set(hit.node, {hit, groups:hit.repeated.map(() => new Set()), count:0});
    }
    const relevant = new Uint8Array(graph.kind.length);
    for (let n=0; n<relevant.length; n++) relevant[n] = targets.has(n) || graph.children[n].some(c => relevant[c]);
    const path = [];
    function visit(node, partial) {
      const target = targets.get(node);
      if (target && !partial) {
        target.count++;
        const args = spine(graph,node).args;
        target.hit.repeated.forEach(([arg, positions], group) => {
          let owners;
          for (const pos of positions) {
            const slots = [...path, ...Array(args.length-pos).fill(0), 1];
            assert.equal(atlas.walk(graph,{root:1, slots}),arg);
            const identity = [...free(arg).values()].map(suffix => {
              const binder = atlas.binding(graph,{root:1,slots:slots.concat(suffix)});
              assert(binder);
              return binder.route.slots;
            });
            if (owners) assert.deepEqual(identity,owners);
            owners = identity;
          }
          target.groups[group].add(JSON.stringify(owners));
        });
      }
      graph.children[node].forEach((child,slot) => {
        if (!relevant[child]) return;
        path.push(slot);
        visit(child, graph.kind[node] === 5 && slot === 0);
        path.pop();
      });
    }
    visit(graph.roots[1],false);
    const acrossCalls = new Map();
    for (const {hit,groups,count} of targets.values()) {
      assert.equal(String(count),hit.weight);
      hit.repeated.forEach(([arg],i) => {
        if (!acrossCalls.has(arg)) acrossCalls.set(arg,new Set());
        for (const owners of groups[i]) acrossCalls.get(arg).add(owners);
        results.push({proof:hit.proof, call:hit.node,arg,count,
        externalIndices:free(arg).size, distinctBindings:groups[i].size});
      });
    }
    for (const [arg, owners] of acrossCalls) sharedArguments.push({proof:item.record.name,arg,bindings:owners.size});
  }
  assert.equal(results.length, report.hits.reduce((n,h) => n+h.repeated.length,0));
  console.log(JSON.stringify({results,sharedArguments},null,2));
}
main().catch(error => {console.error(error);process.exitCode=1;});
