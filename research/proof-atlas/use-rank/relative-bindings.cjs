// Test binder-relative templates on every eligible occurrence in published-15.
'use strict';
const fs = require('node:fs'), zlib = require('node:zlib');
const assert = require('node:assert/strict');
const {createHash} = require('node:crypto');
const atlas = require('../../../public/js/proof-atlas-library-data');
const inputHead = require('../step-reading/input-head.cjs');
const census = require('./fold-aliases.json');
global.window = {};
require('../../../public/data/proof-atlas/library-manifest.js');
const edition = window.PROOF_ATLAS_LIBRARY.editions.find(e => e.id === census.edition);
const records = new Map(edition.declarations.map(r => [r.name,r]));
const results = [];
for (const theorem of census.results.filter(t => t.hasLocalFunctionArgument)) {
  const record = records.get(theorem.name);
  const bytes = zlib.gunzipSync(fs.readFileSync('.' + record.indexFile));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),theorem.indexSha256);
  const term = atlas.validateIndex(JSON.parse(bytes),record), root = term.roots[1];
  const heads = new Int32Array(root+1), eligible = new Uint8Array(root+1);
  const counts = Array(root+1);
  for (let row=0; row<=root; row++) {
    const [fn,arg] = term.children[row];
    const app = atlas.kinds[term.kind[row]] === 'app';
    heads[row] = app ? heads[fn] : row;
    eligible[row] = Number(app && arg !== heads[arg] && atlas.kinds[term.kind[heads[arg]]] === 'bvar');
    counts[row] = term.children[row].reduce((n,c) => n+counts[c],BigInt(eligible[row]));
  }
  const grouped = new Map(), binders = new Map();
  const stack = [{node:root,slots:[]}];
  let occurrences = 0, fullSlots = 0;
  const observed = new Set();
  while (stack.length) {
    const {node,slots} = stack.pop();
    if (eligible[node]) {
      const input = {node:term.children[node][1],route:{root:1,slots:slots.concat(1)}};
      const head = inputHead(term,input), binder = head.binder;
      const prefix = binder.route.slots;
      assert.deepEqual(input.route.slots.slice(0,prefix.length),prefix);
      const suffix = input.route.slots.slice(prefix.length);
      const key = binder.node + '/' + input.node;
      if (!grouped.has(key)) grouped.set(key,new Map());
      const templates = grouped.get(key);
      const path = suffix.join('.');
      if (!templates.has(path)) templates.set(path,{input:input.node,head:head.node,suffix,fn:head.route.slots.slice(input.route.slots.length)});
      if (!binders.has(binder.node)) binders.set(binder.node,new Map());
      binders.get(binder.node).set(prefix.join('.'),binder);
      observed.add(input.route.slots.join('.'));
      fullSlots += input.route.slots.length;
      occurrences++;
    }
    term.children[node].forEach((child,i) => {
      if (counts[child]) stack.push({node:child,slots:slots.concat(i)});
    });
  }
  assert.equal(BigInt(occurrences),counts[root]);
  let templates = 0, recovered = 0, ambiguous = 0, shared = 0, example;
  let prefixSlots = 0, suffixSlots = 0;
  for (const copies of binders.values()) for (const binder of copies.values()) prefixSlots += binder.route.slots.length;
  const unique = new Set();
  for (const [key,paths] of grouped) {
    const binderRow = Number(key.split('/')[0]);
    const copies = binders.get(binderRow);
    templates += paths.size;
    if (paths.size>1) {
      ambiguous++;
      example ??= {binderRow,inputRow:paths.values().next().value.input,suffixes:[...paths.keys()].slice(0,2)};
    }
    for (const template of paths.values()) {
      suffixSlots += template.suffix.length;
      if (copies.size>1) shared++;
      for (const binder of copies.values()) {
        const route = {root:1,slots:binder.route.slots.concat(template.suffix)};
        const fn = {root:1,slots:route.slots.concat(template.fn)};
        assert.equal(atlas.walk(term,route),template.input);
        assert.equal(atlas.walk(term,fn),template.head);
        assert.deepEqual(atlas.binding(term,fn),{node:binder.node,route:binder.route});
        assert(!unique.has(route.slots.join('.')));
        unique.add(route.slots.join('.'));
        recovered++;
      }
    }
  }
  assert.deepEqual(unique,observed);
  assert.equal(recovered,occurrences);
  results.push({name:theorem.name,indexSha256:theorem.indexSha256,occurrences,rowPairs:grouped.size,templates,shared,ambiguous,recovered,fullSlots,prefixSlots,suffixSlots,example});
}
console.log(JSON.stringify(results,null,2));
