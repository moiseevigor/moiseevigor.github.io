// Existential test per theorem. Stop only on an exact pair with distinct binder rows.
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
  const stack = inside[root] ? [{node:root, slots:[]}] : [];
  let pair = null;
  while (stack.length && !pair) {
    const {node, slots} = stack.pop();
    if (eligible[node]) {
      const arg = term.children[node][1];
      const input = {node:arg, route:{root:1, slots:slots.concat(1)}};
      const head = inputHead(term, input);
      assert(head.binder);
      const earlier = seen.get(arg);
      if (!earlier) seen.set(arg,{input,head});
      else if (earlier.head.binder.node !== head.binder.node) pair = [earlier,{input,head}];
    }
    term.children[node].forEach((child,i) => {
      if (inside[child]) stack.push({node:child, slots:slots.concat(i)});
    });
  }
  if (pair) {
    assert.equal(pair[0].input.node,pair[1].input.node);
    assert.equal(pair[0].head.node,pair[1].head.node);
    assert.notDeepEqual(pair[0].input.route,pair[1].input.route);
    for (const {input,head} of pair) {
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
  results.push({name:r.name,indexSha256:r.indexSha256,hasLocalFunctionArgument:Boolean(inside[root]),pair});
}
assert(results.length);
console.log('{"edition":' + JSON.stringify(edition.id) + ',"results":[\n' + results.map(r => JSON.stringify(r)).join(',\n') + '\n]}');
