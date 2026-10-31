/* Constructor-level oracle for the authored controls. No Lean type inference. */
'use strict';
const assert = require('assert/strict');
const A = require('../../../public/js/proof-atlas-library-data');
const {allGraphs, binds} = require('./graphs.cjs');

function auditControl(record) {
  allGraphs(record);
  const nodes = [], interned = new Map();
  function add(kind, payload, children = []) {
    const key = kind + ':' + A.payloadKey(kind, payload) + ':' + children.join(',');
    if (!interned.has(key)) { interned.set(key, nodes.length); nodes.push({kind, payload, children}); }
    assert(nodes.length <= 131072);
    return interned.get(key);
  }
  const symbol = key => add(1, {id: key, idNameParts: [{str: key}]}), key = i => 'sourceTemplateControl.' + i;
  const constant = (name, levels = []) => add(4, {name, nameParts: name.split('.').map(str => ({str})), levels});
  const app = (f, a) => add(5, {}, [f, a]), nat = constant('Nat'), zeroLevel = {kind: 'zero'};
  function numeral(value) {
    const literal = add(9, {literalKind: 'natVal', repr: 'Lean.Literal.natVal ' + value, value: String(value)});
    return app(app(app(constant('OfNat.ofNat', [zeroLevel]), nat), literal), app(constant('instOfNatNat'), literal));
  }
  const zero = numeral(0), seventeen = numeral(17), variable = index => add(0, {index});
  const lambda = body => add(6, {binderName: 'z', binderNameParts: [{str: 'z'}], binderInfo: 'default'}, [nat, body]);
  const addNat = (a, b) => app(app(constant('Nat.add'), a), b);
  function decode(graph, root, scope = []) {
    const memo = new Map();
    function visit(id, depth = 0) {
      const cache = id + ':' + depth;
      if (memo.has(cache)) return memo.get(cache);
      const kind = graph.kind[id], payload = graph.payloads[id];
      let value;
      if (kind === 0 && payload.index >= depth) {
        const position = scope.length - 1 - payload.index + depth;
        assert(position >= 0 && position < scope.length, 'control observation scope');
        value = scope[position];
      } else value = add(kind, payload, graph.children[id].map((child, slot) => visit(child, depth + Number(binds(kind, slot)))));
      memo.set(cache, value);
      return value;
    }
    return visit(root);
  }
  function rewrite(root, replacement) {
    const memo = new Map();
    function visit(id) {
      if (memo.has(id)) return memo.get(id);
      const node = nodes[id], value = replacement.has(id) ? replacement.get(id) : add(node.kind, node.payload, node.children.map(visit));
      memo.set(id, value);
      return value;
    }
    return {value: visit(root), states: memo.size};
  }
  function refs(root, symbols) {
    const seen = new Set(), result = new Set();
    function visit(id) {
      if (seen.has(id)) return;
      seen.add(id);
      if (symbols.has(id)) { result.add(symbols.get(id)); return; }
      for (const child of nodes[id].children) visit(child);
    }
    visit(root);
    return result;
  }
  // Enumerate the tiny controls' orders, independently of the producer's scan.
  function validOrders(order, dependencies) {
    const output = [];
    function visit(prefix, remaining) {
      if (!remaining.length) { output.push(prefix); return; }
      for (const candidate of remaining) if ([...dependencies.get(candidate)].every(dep => prefix.includes(dep))) visit([...prefix, candidate], remaining.filter(key => key !== candidate));
    }
    visit([], order);
    return output;
  }
  const refusals = {
    'cycle-refused': 'cyclic-or-unknown-binding-dependency',
    'constant-family-refused': 'source-specialization-refused',
    'source-value-refused': 'source-specialization-refused',
    'wrong-type-refused': 'assignment-typing-refused',
    'unknown-binding-refused': 'assignment-outside-recorded-context'
  };
  if (record.name in refusals) {
    assert.equal(record.refusal.reason, refusals[record.name]);
    if (record.name === 'cycle-refused') assert.equal(validOrders(['x', 'y'], new Map([['x', new Set(['y'])], ['y', new Set(['x'])]])).length, 0);
    if (record.name === 'constant-family-refused') {
      const equality = (a, b) => app(app(app(constant('Eq', [{kind: 'succ', of: zeroLevel}]), nat), a), b);
      const source = lambda(equality(variable(0), variable(0))), constantFamily = lambda(equality(zero, zero));
      assert.equal(decode(record.graph, record.graph.roots[0]), source);
      assert.equal(decode(record.graph, record.graph.roots[1]), constantFamily);
      assert.notEqual(source, constantFamily);
      const body = nodes[source].children[1];
      assert.equal(rewrite(body, new Map([[variable(0), zero]])).value, nodes[constantFamily].children[1], 'one-argument agreement does not preserve a whole function');
    }
    return {name: record.name, refusal: refusals[record.name], rows: nodes.length};
  }
  if (record.name === 'ambiguous-source-values-refused') {
    assert.equal(record.refused, true);
    assert.equal(record.refusalReason, 'ambiguous-source-value-pattern');
    // Same original value is insufficient to identify two independent parameters.
    assert.notEqual(symbol(key(0)), symbol(key(1)));
    return {name: record.name, refusal: 'ambiguous-source-values', rows: nodes.length};
  }
  const keys = record.bindings.map(row => row.key), symbols = new Map(keys.map(name => [name, symbol(name)]));
  assert.equal(new Set(keys).size, keys.length);
  const scope = names => names.map(name => { assert(symbols.has(name)); return symbols.get(name); });
  const rows = new Map(record.bindings.map((row, index) => {
    assert.equal(row.key, key(row.port.slot));
    const context = scope(keys.slice(0, index)), graph = row.graph;
    return [row.key, {port: row.port, domain: decode(graph, graph.roots[0], context),
      value: row.port.kind === 'input' ? null : decode(graph, graph.roots[1], context), original: decode(graph, graph.roots.at(-1))}];
  }));
  const originals = new Map(keys.map(name => [symbols.get(name), rows.get(name).original]));
  const sortOne = add(3, {level: {kind: 'succ', of: zeroLevel}});
  for (const name of keys) {
    const row = rows.get(name), slot = row.port.slot;
    if (record.name === 'dependent-domain-order') {
      assert.equal(row.domain, slot === 0 || slot === 2 ? sortOne : symbols.get(key(slot === 1 ? 0 : 2)));
      assert.equal(row.original, slot === 0 || slot === 2 ? nat : zero);
    } else if (record.name === 'closed-telescope-alignment') {
      assert.equal(row.domain, sortOne); assert.equal(row.original, nat); assert.equal(row.value, nat);
    } else if (record.name === 'forward-value-order') {
      assert.equal(row.domain, nat); assert.equal(row.original, zero);
    } else if (slot === 0 || record.name === 'coherent-source-values' && slot === 1) {
      assert.equal(row.domain, nat); assert.equal(row.original, seventeen);
    } else {
      const functionType = body => add(7, {binderName: 'z', binderNameParts: [{str: 'z'}], binderInfo: 'default'}, [nat, body]);
      assert.equal(row.domain, functionType(record.name === 'shadowed-lambda' ? functionType(nat) : nat));
    }
  }
  const events = new Map(record.constraints.map((row, index) => [row.bindingKey, index]));
  assert.equal(events.size, record.constraints.length);
  const permutations = new Map(record.permutations.map(row => [row.cause, row]));
  assert.equal(permutations.size, record.permutations.length);
  let order = [...keys].sort((a, b) => Number(a.split('.').at(-1)) - Number(b.split('.').at(-1)));
  for (const [index, assignment] of record.constraints.entries()) {
    const target = rows.get(assignment.bindingKey); assert(target);
    assert.equal(target.port.kind, 'derived-input'); assert.equal(target.port.constraint, index);
    const expectedPort = {...target.port, kind: 'input'}; delete expectedPort.constraint;
    assert.deepEqual(assignment.sourcePort, expectedPort);
    const dependencies = new Map();
    for (const name of order) {
      const row = rows.get(name), assigned = events.get(name), roots = [row.domain];
      if (assigned !== undefined && assigned <= index) roots.push(row.value);
      dependencies.set(name, new Set(roots.flatMap(root => [...refs(root, new Map([...symbols].map(([key, value]) => [value, key])))])));
    }
    const expectedOrder = validOrders(order, dependencies)[0]; assert(expectedOrder, 'acyclic control order');
    const permutation = permutations.get(assignment.bindingKey);
    if (JSON.stringify(expectedOrder) !== JSON.stringify(order)) {
      assert(permutation); assert.deepEqual(permutation.old, order); assert.deepEqual(permutation.new, expectedOrder);
      assert.equal(permutation.kernelContextTyping, 'PASS'); assert.equal(permutation.nodes.length, order.length);
      for (const [i, row] of permutation.nodes.entries()) {
        assert.equal(row.key, order[i]); const binding = rows.get(row.key), graph = permutation.graph;
        assert.equal(decode(graph, graph.roots[row.domainRoot], scope(order)), binding.domain);
        const assigned = events.get(row.key), hasValue = assigned !== undefined && assigned <= index;
        assert.equal(row.valueRoot !== null, hasValue);
        if (hasValue) assert.equal(decode(graph, graph.roots[row.valueRoot], scope(order)), binding.value);
      }
    } else assert(!permutation);
    order = expectedOrder;
    const position = order.indexOf(assignment.bindingKey), before = order.slice(0, position), graph = assignment.graph;
    assert.equal(assignment.binding, position); assert.equal(assignment.contextLength, position);
    assert.deepEqual(assignment.contextBindingKeys, before);
    assert.equal(decode(graph, graph.roots[0], scope(before)), target.value);
    assert.equal(decode(graph, graph.roots[3], scope(before)), target.domain);
    assert.equal(decode(graph, graph.roots[1]), rewrite(target.value, originals).value);
    assert.equal(decode(graph, graph.roots[2]), target.original);
    assert.equal(decode(graph, graph.roots[4]), rewrite(target.domain, originals).value);
    let equalityHead = graph.roots[6];
    while (graph.kind[equalityHead] === 5) equalityHead = graph.children[equalityHead][0];
    assert.equal(graph.payloads[equalityHead].name, 'Eq');
    const levels = graph.payloads[equalityHead].levels, domain = rewrite(target.domain, originals).value, restored = rewrite(target.value, originals).value;
    assert.equal(levels.length, 1);
    assert.equal(decode(graph, graph.roots[6]), app(app(app(constant('Eq', levels), domain), restored), target.original));
    assert.equal(decode(graph, graph.roots[5]), app(app(constant('Eq.refl', levels), domain), restored));
    assert.deepEqual(assignment.rootContexts, ['before-binding','original','original','before-binding','original','original','original']);
    for (const flag of ['kernelAssignmentTyping','kernelSourceSpecialization','kernelSourceEqualityWitness']) assert.equal(assignment[flag], 'PASS');
  }
  assert.deepEqual(order, keys);
  assert.equal(record.constraints.length, [...rows.values()].filter(row => row.value !== null).length);
  let templateStates = 0;
  if (record.template) {
    const plan = record.template, target = rows.get(plan.bindingKey), graph = plan.graph;
    assert.equal(plan.relation, 'derived-source-value-pattern/1');
    assert.deepEqual(plan.contextBindingKeys, keys.slice(0, keys.indexOf(plan.bindingKey)));
    assert.equal(decode(graph, graph.roots[0]), target.original);
    let body = seventeen;
    if (record.name === 'shared-lambda') for (let i = 0; i < 80; i++) body = addNat(body, body);
    let expectedSource = lambda(addNat(body, variable(0)));
    if (record.name === 'shadowed-lambda') expectedSource = lambda(expectedSource);
    assert.equal(target.original, expectedSource, 'independently authored complete lambda including shadowed bound indices');
    const expectedTargets = record.name === 'coherent-source-values' ? [key(0), key(1)] : [key(0)];
    assert.equal(plan.groups.length, 1); assert.deepEqual(plan.groups[0].targets, expectedTargets);
    const group = plan.groups[0];
    assert.equal(decode(graph, graph.roots[group.sourceRoot]), seventeen);
    assert.equal(decode(graph, graph.roots[group.targetRoot], scope(plan.contextBindingKeys)), symbols.get(key(0)));
    for (const name of expectedTargets) assert.equal(rows.get(name).original, seventeen);
    const rewritten = rewrite(target.original, new Map([[seventeen, symbols.get(key(0))]]));
    assert.equal(rewritten.value, target.value); assert.equal(decode(graph, graph.roots[1], scope(plan.contextBindingKeys)), target.value);
    assert.equal(rewrite(target.value, originals).value, target.original, 'complete function source specialization');
    assert.deepEqual(plan.usedGroups, [0]); assert.equal(plan.storedStates, rewritten.states);
    templateStates = rewritten.states;
    if (record.name === 'shared-lambda') {
      assert(templateStates >= 160 && templateStates <= 256);
      assert(BigInt(graph.expanded[graph.roots[0]]) > 2n ** 80n);
    }
    if (record.name !== 'coherent-source-values') assert.equal(record.sourceFunctionConversion, 'PASS');
  }
  if (record.graph) {
    function abstract(root, selected) {
      const memo = new Map();
      function visit(id, depth = 0) {
        const cache = id + ':' + depth;
        if (memo.has(cache)) return memo.get(cache);
        const node = nodes[id], position = selected.indexOf(id);
        const value = position >= 0 ? variable(depth + selected.length - 1 - position) : add(node.kind, node.payload, node.children.map((child, slot) => visit(child, depth + Number(binds(node.kind, slot)))));
        memo.set(cache, value); return value;
      }
      return visit(root);
    }
    let functionTerm = symbols.get(key(record.name === 'forward-value-order' ? 0 : 1));
    for (let i = keys.length - 1; i >= 0; i--) {
      const row = rows.get(keys[i]), body = abstract(functionTerm, [symbols.get(keys[i])]);
      functionTerm = row.value === null
        ? add(6, {binderName: 'input.' + i, binderNameParts: [{str: 'input'}, {num: String(i)}], binderInfo: 'default'}, [row.domain, body])
        : add(8, {declName: 'result.' + i, declNameParts: [{str: 'result'}, {num: String(i)}], nondep: false}, [row.domain, row.value, body]);
    }
    assert.equal(decode(record.graph, record.graph.roots[record.template ? 2 : 0]), functionTerm, 'complete closed control function');
    if (!record.template) {
      const specialized = record.name === 'forward-value-order' ? app(functionTerm, zero) : app(app(functionTerm, nat), zero);
      assert.equal(decode(record.graph, record.graph.roots[2]), specialized);
      assert.equal(decode(record.graph, record.graph.roots[3]), zero);
    }
  }
  return {name: record.name, bindings: keys.length, assignments: record.constraints.length, permutations: record.permutations.length, templateStates, rows: nodes.length};
}

module.exports = {auditControl};
