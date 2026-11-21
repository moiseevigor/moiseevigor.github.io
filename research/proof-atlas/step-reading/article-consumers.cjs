// From a cited result to its immediate context and any uses of the local it supplies.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const crypto = require('node:crypto');
const zlib = require('node:zlib');
const data = require('../../../public/js/proof-atlas-library-data');
const inputHead = require('./input-head.cjs');
global.window = {};
require('../../../public/data/proof-atlas/library-manifest.js');
require('../../../public/data/proof-atlas/article-proof-steps.js');
const article = window.PROOF_ATLAS_PROOF_STEPS;
const edition = window.PROOF_ATLAS_LIBRARY.editions.find(e => e.id === article.edition);

function binderUses(term, binderRoute) {
  const binder = data.walk(term, binderRoute);
  const kindOf = node => data.kinds[term.kind[node]];
  const bodySlot = data.fields[kindOf(binder)].indexOf('body');
  assert(bodySlot >= 0);
  const memo = new Map();
  function visit(node, index, slots) {
    const key = node + '/' + index;
    if (memo.get(key) === false) return false;
    const kind = kindOf(node);
    if (kind === 'bvar' && term.payloads[node].index === index) {
      const route = {root: binderRoute.root, slots};
      const resolved = data.binding(term, route);
      assert.equal(resolved.node, binder);
      assert.deepEqual(resolved.route, binderRoute);
      uses.push({node, route});
      return true;
    }
    let found = false;
    for (const [slot, child] of term.children[node].entries()) {
      const binds = ['letE', 'forallE', 'lam'].includes(kind) && data.fields[kind][slot] === 'body';
      if (visit(child, index + Number(binds), slots.concat(slot))) found = true;
    }
    memo.set(key, found);
    return found;
  }
  const uses = [];
  visit(term.children[binder][bodySlot], 0, binderRoute.slots.concat(bodySlot));
  return uses;
}

function context(term, route) {
  if (!route.slots.length) return {kind: 'proof root'};
  const parent = {root: route.root, slots: route.slots.slice(0, -1)};
  const node = data.walk(term, parent);
  const kind = data.kinds[term.kind[node]];
  const field = data.fields[kind][route.slots.at(-1)];
  const result = {kind, field, node, route: parent};
  if (kind === 'app' && field === 'arg') {
    const head = inputHead(term, {node, route: parent});
    result.head = head.label;
    result.argument = head.route.slots.length - parent.slots.length;

  }
  if (kind === 'letE' && field === 'value') result.binder = parent;
  return result;
}

const results = [];
for (const packet of article.packets) {
  const anchors = article.anchors.filter(a => a.declaration === packet.name && a.callee && a.kind === 'app');
  if (!anchors.length) continue;
  const owner = edition.declarations.find(d => d.name === packet.name);
  const bytes = zlib.gunzipSync(fs.readFileSync(path.join(__dirname, '../../..', owner.indexFile)));
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'), packet.indexSha256);
  assert.equal(owner.indexSha256, packet.indexSha256);
  const term = data.validateIndex(JSON.parse(bytes), owner);
  for (const anchor of anchors) {
    const route = {root: 1, slots: []};
    const fields = anchor.path.split('.');
    assert.equal(fields.splice(0, 2).join('.'), term.declaration.rootPaths[1]);
    let node = term.roots[1];
    for (const field of fields) {
      const slot = data.fields[data.kinds[term.kind[node]]].indexOf(field);
      assert(slot >= 0);
      route.slots.push(slot);
      node = term.children[node][slot];
    }
    assert.equal(node, anchor.node);
    const parent = context(term, route);
    const row = {declaration: owner.name, indexSha256: packet.indexSha256, callee: anchor.callee, node, route, parent};
    if (parent.binder) row.uses = binderUses(term, parent.binder).map(use => ({...use, context: context(term, use.route)}));
    results.push(row);
  }
}
assert.equal(results.length, article.anchors.filter(a => a.callee && a.kind === 'app').length);
function link(row, target, label) {
  const selection = target.route.root + ':' + target.route.slots.join('.');
  const params = new URLSearchParams({edition: edition.id, proof: row.declaration, route: selection});
  return '[' + label + '](https://moiseevigor.github.io/projects/proof-atlas/library/?' + params + '#expr-' + target.node + ')';
}

function describe(row, target) {
  if (target.kind === 'app' && target.field === 'arg') {
    return link(row, target, target.head + ' argument ' + target.argument);
  }
  return link(row, target, target.kind + ' ' + target.field);
}

if (process.argv.includes('--json')) {
  console.log(JSON.stringify({edition: edition.id, results}));
} else {
  console.log('# Where article-linked results go\n');
  console.log('Each row follows one exact compiled occurrence in the published-15 edition. Argument numbers include implicit inputs. The argument link opens the application at the point where it receives that argument. For local definitions, each use links to the original bound-variable occurrence. A lambda body is returned by the enclosing function.\n');
  console.log('| Result | Immediate context | Uses of the local definition |');
  console.log('|---|---|---|');
  for (const row of results) {
    const uses = row.uses?.map(use => link(row, use, 'use ' + use.node) + ' → ' + describe(row, use.context));
    console.log('| ' + link(row, row, row.callee) + ' | ' + describe(row, row.parent) + ' | ' + (uses ? uses.join(', ') || 'Unused' : '—') + ' |');
  }
}
