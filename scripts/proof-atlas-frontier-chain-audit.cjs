/* Independent native-field audit. No renderer, frontier producer or scope helper. */
'use strict';
const assert = require('assert/strict');
const crypto = require('crypto');
const {occurrence} = require('./test-proof-atlas-judgment-audit.cjs');
const key = r => r.root + ':' + r.slots.join('.');
const canonical = x => Array.isArray(x) ? x.map(canonical) : x && typeof x === 'object'
  ? Object.fromEntries(Object.keys(x).sort().map(k => [k, canonical(x[k])])) : x;
const hash = x => crypto.createHash('sha256').update(JSON.stringify(canonical(x))).digest('hex');
const graphHashes = new WeakMap();

function normalized(entry, graph) {
  if (!graphHashes.has(graph)) {
    const hashes = [];
    for (let i = 0; i < graph.kind.length; i++) {
      assert(graph.children[i].every(c => Number.isInteger(c) && c >= 0 && c < i));
      hashes.push(hash([graph.kind[i], graph.payloads[i], graph.children[i].map(c => hashes[c]), graph.expanded[i], graph.neededScope[i]]));
    }
    graphHashes.set(graph, hashes);
  }
  const hashes = graphHashes.get(graph);
  function root(r) { assert(Number.isInteger(r) && r >= 0 && r < hashes.length); return hashes[r]; }
  function walk(x) {
    if (Array.isArray(x)) return x.map(walk);
    if (!x || typeof x !== 'object') return x;
    return Object.fromEntries(Object.entries(x).filter(([k]) => k !== 'typeGraph').map(([k, v]) =>
      [k, /Root$/.test(k) && Number.isInteger(v) ? root(v) : /Roots$/.test(k) && Array.isArray(v) ? v.map(root) : walk(v)]));
  }
  return canonical(walk(entry));
}

function checkedQuery(resolve, route) {
  const provider = resolve(route), visible = provider?.get(route);
  const entry = visible?.letReduction?.status === 'available' ? provider.getQuery(route) : visible;
  return entry?.status === 'checked' ? entry : null;
}

function premises(entry) {
  if (entry?.projectionJudgment?.status === 'checked') return [{field: 'struct', ...entry.projectionJudgment.structure}];
  if (entry?.letJudgment?.status === 'checked') return ['type', 'value', 'body'].map(field => ({field, ...entry.letJudgment[field]}));
  if (entry?.lambdaJudgment?.status === 'checked') return [{field: 'body', ...entry.lambdaJudgment.body}];
  if (entry?.applicationJudgment?.status === 'checked') return [
    {field: 'head', ...entry.applicationJudgment.head},
    ...entry.arguments.map((p, i) => ({field: 'arg' + (i + 1), ...p}))
  ];
  return null;
}

function enumerate(data, resolve, seeds, {maxNewQueries = 512} = {}) {
  assert(Array.isArray(seeds) && seeds.length > 0 && seeds.length <= 512);
  assert(Number.isInteger(maxNewQueries) && maxNewQueries > 0 && maxNewQueries <= 512);
  const seen = new Set(), pending = new Map();
  let proofPremises = 0, terminalReferences = 0, recordedConstructions = 0;
  for (const route of seeds) {
    assert(!seen.has(key(route)), 'Duplicate seed occurrence'); seen.add(key(route));
    const entry = checkedQuery(resolve, route), ports = premises(entry);
    if (!ports) continue;
    const at = occurrence(data, route);
    assert.equal(entry.node, at.node); assert.equal(entry.path, at.path); assert.deepEqual(entry.context, at.binders);
    for (const port of ports) {
      if (port.role !== 'proof') continue;
      proofPremises++;
      const child = occurrence(data, port.route);
      assert.equal(port.node, child.node); assert.equal(port.path, child.path);
      if (Array.isArray(port.context)) assert.deepEqual(port.context, child.binders);
      if (data.kind[child.node] === 0 || data.kind[child.node] === 4) { terminalReferences++; continue; }
      if (premises(checkedQuery(resolve, port.route))) { recordedConstructions++; continue; }
      if (!pending.has(key(port.route))) {
        assert(pending.size < maxNewQueries, 'Independent frontier exceeds fixed query bound');
        pending.set(key(port.route), {node: child.node, path: child.path, route: port.route, context: child.binders, parents: []});
      }
      pending.get(key(port.route)).parents.push({route, field: port.field});
    }
  }
  return {proofPremises, terminalReferences, recordedConstructions, pending: [...pending.values()]};
}

function auditFrontier(actual, independent) {
  for (const k of ['proofPremises', 'terminalReferences', 'recordedConstructions']) assert.equal(actual[k], independent[k], 'Native premise count: ' + k);
  assert.equal(new Set(actual.pending.map(p => key(p.route))).size, actual.pending.length, 'Duplicate pending route');
  assert.deepEqual(actual.pending.map(p => key(p.route)).sort(), independent.pending.map(p => key(p.route)).sort(), 'Exact pending route set');
  for (const p of actual.pending) {
    const expected = independent.pending.find(e => key(e.route) === key(p.route));
    assert.equal(p.node, expected.node); assert.equal(p.path, expected.path); assert.equal(p.role, 'proof');
    assert.deepEqual(p.parents.map(e => ({route: e.route, field: e.field})), expected.parents, 'Native parent incidence');
  }
}

function auditLayer(data, before, after, frontier) {
  assert.deepEqual(after.source, before.source, 'Layer source identity');
  const prior = new Map(before.entries.map(e => [key(e.route), e]));
  const current = new Map(after.entries.map(e => [key(e.route), e]));
  assert.equal(prior.size, before.entries.length, 'Duplicate previous query');
  assert.equal(current.size, after.entries.length, 'Duplicate current query');
  const routes = [...before.entries.map(e => key(e.route)), ...frontier.pending.map(p => key(p.route))];
  assert.equal(new Set(routes).size, routes.length, 'Frontier repeats an earlier query');
  assert.deepEqual(after.entries.map(e => key(e.route)), routes, 'Layer must preserve every query and add exactly its frontier');
  for (const entry of before.entries) assert.deepEqual(normalized(current.get(key(entry.route)), after.typeGraph), normalized(entry, before.typeGraph), 'Earlier contextual judgment changed');
  for (const pending of frontier.pending) {
    const entry = current.get(key(pending.route)), at = occurrence(data, pending.route);
    assert.equal(entry.status, 'checked'); assert.equal(entry.role, 'proof'); assert.equal(entry.node, pending.node);
    assert.equal(entry.path, at.path); assert.deepEqual(entry.context, at.binders);
    assert(premises(entry), 'New proof root lacks a recorded construction');
  }
  return {preservedQueries: prior.size, addedConstructions: frontier.pending.length, totalQueries: current.size};
}

module.exports = {key, normalized, checkedQuery, premises, enumerate, auditFrontier, auditLayer};
