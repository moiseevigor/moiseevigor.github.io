// Generate the research index from the same compiled packets the reader opens.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const zlib = require('node:zlib');
const crypto = require('node:crypto');
const path = require('node:path');
const data = require('../../../public/js/proof-atlas-library-data.js');
global.window = {};
require('../../../public/data/proof-atlas/library-manifest.js');
require('../../../public/data/proof-atlas/article-proof-steps.js');
const article = window.PROOF_ATLAS_PROOF_STEPS;
const edition = window.PROOF_ATLAS_LIBRARY.editions.find(e => e.id === article.edition);
const records = new Map(edition.declarations.map(r => [r.name, r]));
const traces = require('./article-call-traces.json');
assert.equal(traces.edition, edition.id);
const root = path.resolve(__dirname, '../../..');
const rows = [];
let inputs = 0;
let references = 0;
for (const anchor of article.anchors.filter(a => a.callee && a.kind === 'app')) {
  const owner = records.get(anchor.declaration);
  const packet = article.packets.find(p => p.name === owner.name);
  assert.equal(owner.indexSha256, packet.indexSha256);
  assert.equal(owner.sourceSha256, packet.sourceSha256);
  const bytes = zlib.gunzipSync(fs.readFileSync(path.join(root, owner.indexFile)));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), packet.indexSha256);
  const term = data.validateIndex(JSON.parse(bytes), owner);
  const slots = [];
  let node = term.roots[1];
  const prefix = term.declaration.rootPaths[1] + '.';
  assert(anchor.path.startsWith(prefix));
  for (const field of anchor.path.slice(prefix.length).split('.')) {
    const slot = data.fields[data.kinds[term.kind[node]]].indexOf(field);
    assert(slot >= 0);
    slots.push(slot);
    node = term.children[node][slot];
  }
  assert.equal(node, anchor.node);
  function link(label, target, route) {
    assert.equal(data.walk(term, route), target);
    const params = new URLSearchParams({edition: edition.id, proof: owner.name, route: route.root + ':' + route.slots.join('.')});
    return '[' + label + '](https://moiseevigor.github.io/projects/proof-atlas/library/?' + params + '#expr-' + target + ')';
  }
  const trace = traces.results.find(r => r.step === anchor.step && r.declaration === owner.name && r.path === anchor.path);
  assert(trace);
  const call = link(anchor.callee, node, {root: 1, slots});
  const args = [];
  while (data.kinds[term.kind[node]] === 'app') {
    const [fn, arg] = term.children[node];
    const route = {root: 1, slots: slots.concat(1)};
    const position = anchor.arity - args.length;
    const typed = trace.inputs?.[position - 1];
    if (typed) {
      assert.equal(typed.node, arg);
      assert.deepEqual(typed.route, route);
    }
    let item = link(String(position) + (typed ? ' ' + typed.role : ''), arg, route);
    if (data.kinds[term.kind[arg]] === 'bvar') {
      const binder = data.binding(term, route);
      assert(binder);
      // Recompute the de Bruijn index walking outward from this use to its target.
      const start = binder.route.slots.length;
      assert.deepEqual(route.slots.slice(0, start), binder.route.slots);
      let nested = 0;
      for (let depth = route.slots.length - 1; depth >= start; depth--) {
        const ancestor = data.walk(term, {root: route.root, slots: route.slots.slice(0, depth)});
        const kind = data.kinds[term.kind[ancestor]];
        const field = data.fields[kind][route.slots[depth]];
        const binds = ['lam', 'forallE', 'letE'].includes(kind) && field === 'body';
        if (depth === start) assert(binds && ancestor === binder.node);
        else if (binds) nested++;
      }
      assert.equal(nested, term.payloads[arg].index);
      item += ' → ' + link(term.payloads[binder.node].binderName || 'binder', binder.node, binder.route);
      references++;
    }
    args.unshift(item);
    slots.push(0);
    node = fn;
  }
  assert.equal(args.length, anchor.arity);
  assert.equal(data.kinds[term.kind[node]], 'const');
  assert.equal(term.payloads[node].name, anchor.callee);
  inputs += args.length;
  rows.push('| ' + article.passages.find(p => p.id === anchor.step).title + ' | ' + call + ' | ' + args.join(' · ') + ' |');
}
console.log('# Input positions at article-linked calls\n');
console.log('Each call opens the compiled result. Each numbered input opens its occurrence. An arrow follows a bound variable to its introducing binder. Value and proof labels appear where the occurrence-type manifest supplies a checked trace.\n');
console.log(rows.length + ' calls, ' + inputs + ' input positions, ' + references + ' direct bound-variable inputs.\n');
console.log('| Passage | Compiled call | Inputs in application order |\n|---|---|---|');
console.log(rows.join('\n'));
