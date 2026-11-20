// Keep one witness per theorem for each of two independent binding ambiguities.
'use strict';
const fs = require('node:fs'), zlib = require('node:zlib');
const {createHash} = require('node:crypto');
const assert = require('node:assert/strict');
const atlas = require('../../../public/js/proof-atlas-library-data');
const inputHead = require('../step-reading/input-head.cjs');
global.window = {};
require('../../../public/data/proof-atlas/library-manifest.js');
const edition = window.PROOF_ATLAS_LIBRARY.editions.find(e => e.id === 'published-15');
const results = [];
for (const r of edition.declarations.filter(r => r.kind === 'theorem' && r.bodyAvailable)) {
  const bytes = zlib.gunzipSync(fs.readFileSync('.' + r.indexFile));
  assert.equal(createHash('sha256').update(bytes).digest('hex'), r.indexSha256);
  const term = atlas.validateIndex(JSON.parse(bytes), r), root = term.roots[1];
  const variable = new Uint8Array(root + 1), eligible = new Uint8Array(root + 1), inside = new Uint8Array(root + 1);
  for (let row = 0; row <= root; row++) {
    const [fn,arg] = term.children[row], kind = atlas.kinds[term.kind[row]];
    variable[row] = kind === 'app' ? variable[fn] : Number(kind === 'bvar');
    eligible[row] = Number(kind === 'app' && atlas.kinds[term.kind[arg]] === 'app' && variable[arg]);
    inside[row] = Number(eligible[row] || term.children[row].some(child => inside[child]));
  }
  const seen = new Map();
  const byRowPair = new Map();
  const stack = inside[root] ? [{node:root, slots:[]}] : [];
  let pair = null;
  let repeatedBinder = null;
  while (stack.length && !(pair && repeatedBinder)) {
    const {node, slots} = stack.pop();
    if (eligible[node]) {
      const arg = term.children[node][1];
      const input = {node:arg, route:{root:1, slots:slots.concat(1)}};
      const head = inputHead(term, input);
      assert(head.binder);
      const earlier = seen.get(arg);
      if (!earlier) seen.set(arg,{input,head});
      else if (!pair && earlier.head.binder.node !== head.binder.node) pair = [earlier,{input,head}];
      const rowKey = arg + '/' + head.binder.node;
      const first = byRowPair.get(rowKey);
      if (!first) byRowPair.set(rowKey,{input,head});
      else if (!repeatedBinder && first.head.binder.route.slots.join('.') !== head.binder.route.slots.join('.')) {
        repeatedBinder = [first,{input,head}];
      }
    }
    term.children[node].forEach((child,i) => {
      if (inside[child]) stack.push({node:child, slots:slots.concat(i)});
    });
  }
  if (repeatedBinder) {
    assert.equal(repeatedBinder[0].head.binder.node,repeatedBinder[1].head.binder.node);
    assert.notDeepEqual(repeatedBinder[0].head.binder.route,repeatedBinder[1].head.binder.route);
  }
  for (const evidence of [pair,repeatedBinder].filter(Boolean)) {
    assert.equal(evidence[0].input.node,evidence[1].input.node);
    assert.equal(evidence[0].head.node,evidence[1].head.node);
    assert.notDeepEqual(evidence[0].input.route,evidence[1].input.route);
    for (const {input,head} of evidence) {
      assert.equal(atlas.walk(term,input.route),input.node);
      let node = root;
      const binders = [];
      for (const [depth,slot] of head.route.slots.entries()) {
        const kind = atlas.kinds[term.kind[node]];
        if (((kind === 'lam' || kind === 'forallE') && slot === 1) || (kind === 'letE' && slot === 2)) {
          binders.push({node,route:{root:1,slots:head.route.slots.slice(0,depth)}});
        }
        node = term.children[node][slot];
      }
      assert.equal(node,head.node);
      const owner = binders.at(-1-term.payloads[node].index);
      assert.equal(owner.node,head.binder.node);
      assert.deepEqual(owner.route,head.binder.route);
    }
  }
  let fork;
  if (repeatedBinder) {
    const [a,b] = repeatedBinder.map(w => w.head.binder.route.slots);
    const depth = a.findIndex((slot,i) => slot !== b[i]);
    assert(depth >= 0 && depth < b.length);
    const route = {root:1, slots:a.slice(0,depth)};
    const node = atlas.walk(term,route);
    const fields = atlas.fields[atlas.kinds[term.kind[node]]];
    fork = {node,route,branches:[fields[a[depth]],fields[b[depth]]]};
  }
  results.push({name:r.name,indexSha256:r.indexSha256,hasLocalFunctionArgument:Boolean(inside[root]),pair,repeatedBinder,fork});
}
assert(results.length);
console.log('{"edition":' + JSON.stringify(edition.id) + ',"results":[\n' + results.map(r => JSON.stringify(r)).join(',\n') + '\n]}');
