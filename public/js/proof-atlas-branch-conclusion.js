/* Literal branch conclusions in a recorded recursor signature. No source
   occurrence, signature instantiation or fresh typing judgment is invented. */
(function(host) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const M = node ? require('./proof-atlas-method-interfaces') : host.ProofAtlasMethodInterfaces;
  const A = node ? require('./proof-atlas-library-data') : host.ProofAtlasLibraryData;
  const limits = Object.freeze({indices: 4, arguments: 4, spine: 128, motiveArity: 129, route: 512, bytes: 262144});
  const cache = new WeakMap(), copy = x => JSON.parse(JSON.stringify(x));
  const demand = (v, m) => {if (!v) throw Error('Branch conclusion: ' + m);};
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const freeze = x => {if (x && typeof x === 'object' && !Object.isFrozen(x)) {Object.values(x).forEach(freeze); Object.freeze(x);} return x;};
  const child = (g, at, slot) => ({node: g.children[at.node][slot], route: {root: 0, slots: [...at.route.slots, slot]}});
  function spine(g, at) {
    const args = []; let head = at;
    while (g.kind[head.node] === 5) {
      demand(args.length < limits.spine, 'application spine bound'); args.unshift(child(g, head, 1)); head = child(g, head, 0);
    }
    return {head, args};
  }
  function scope(g, at) {
    let id = g.roots[0]; const binders = [];
    for (const [i, slot] of at.route.slots.entries()) {
      const kind = g.kind[id];
      if ((kind === 6 || kind === 7) && slot === 1 || kind === 8 && slot === 2)
        binders.push({node: id, route: {root: 0, slots: at.route.slots.slice(0, i)}});
      id = g.children[id][slot];
    }
    demand(id === at.node, 'signature node/route'); return binders;
  }
  function analyze(data) {
    demand(M.isFlowData(data) && data.kernel, 'validated immutable method record');
    if (cache.has(data)) return cache.get(data);
    const t = data.kernel.trace, r = data.kernel.rule, g = {...t.metadataGraph,
      roots: [t.recursorTypeRoot], declaration: {name: data.source.name, rootPaths: ['signature.recursorType']}};
    const ambient = t.parameters + t.motives + r.minor, inputs = [];
    let at = {node: t.recursorTypeRoot, route: {root: 0, slots: []}};
    const prefix = [];
    for (let i = 0; i <= ambient; i++) {
      demand(g.kind[at.node] === 7, 'recursor prefix telescope');
      if (i === ambient) break;
      prefix.push(at); at = child(g, at, 1);
    }
    const minorBinder = at; at = child(g, at, 0);
    for (let i = 0; i < r.inputCount; i++) {
      demand(g.kind[at.node] === 7, 'branch input telescope'); inputs.push(at); at = child(g, at, 1);
    }
    demand(inputs.length === data.inputs.length, 'recorded/computed input positions');
    const result = spine(g, at);
    demand(g.kind[result.head.node] === 0, 'literal result motive variable');
    const ordinal = ambient + inputs.length - 1 - g.payloads[result.head.node].index;
    const motive = ordinal - t.parameters;
    demand(Number.isInteger(motive) && motive >= 0 && motive < t.motives, 'result motive in signature context');
    const motiveBinder = prefix[ordinal]; demand(motiveBinder, 'motive prefix position');
    let motiveType = child(g, motiveBinder, 0); const motiveInputs = [];
    while (g.kind[motiveType.node] === 7) {
      demand(motiveInputs.length < limits.motiveArity, 'motive arity bound'); motiveInputs.push(motiveType); motiveType = child(g, motiveType, 1);
    }
    demand(g.kind[motiveType.node] === 3 && motiveInputs.length > 0 && result.args.length === motiveInputs.length, 'complete motive application');
    const majorType = spine(g, child(g, motiveInputs.at(-1), 0));
    demand(g.kind[majorType.head.node] === 4, 'motive major inductive');
    const inductive = g.payloads[majorType.head.node].name;
    const owner = t.format === 'ProofAtlasElimination/2' ? t.targets.find(x => x.recursor === r.recursor) :
      {recursor: t.recursor, motive: 0, indices: t.indices, inductive: t.inductives[0]};
    demand(owner && owner.motive === motive && owner.indices === result.args.length - 1 && owner.inductive === inductive, 'recorded constructor/motive owner');
    const constructor = result.args.at(-1), ctor = spine(g, constructor);
    demand(g.kind[ctor.head.node] === 4 && g.payloads[ctor.head.node].name === r.constructor, 'literal constructor result');
    const value = {g, t, r, owner, ambient, inputs, minorBinder, result: at, head: result.head,
      motive, motiveBinder, constructor, constructorHead: ctor.head, constructorArguments: ctor.args,
      indices: result.args.slice(0, -1), inductive};
    cache.set(data, value); return value;
  }
  function address(data, at) {
    const d = analyze(data); demand(at.route.root === 0 && at.route.slots.length <= limits.route && A.walk(d.g, at.route) === at.node, 'exact signature position');
    return {namespace: 'kernel-signature', component: 'recursor-branch-conclusion', evidenceSha256: data.evidenceSha256,
      query: copy(data.source.query), minor: data.kernelRule.minor, recursor: data.recursor,
      ruleOwner: d.owner.recursor, signatureRoot: d.t.recursorTypeRoot, node: at.node, route: copy(at.route)};
  }
  function locate(data, at) {
    const d = analyze(data);
    demand(at?.namespace === 'kernel-signature' && at.component === 'recursor-branch-conclusion' &&
      at.evidenceSha256 === data.evidenceSha256 && same(at.query, data.source.query) && at.minor === data.kernelRule.minor &&
      at.recursor === data.recursor && at.ruleOwner === d.owner.recursor && at.signatureRoot === d.t.recursorTypeRoot,
      'signature address owner/namespace');
    demand(at.route?.root === 0 && Array.isArray(at.route.slots) && at.route.slots.length <= limits.route &&
      at.route.slots.every(s => Number.isInteger(s) && s >= 0 && s <= 2) && A.walk(d.g, at.route) === at.node, 'signature address route');
    return d;
  }
  function preview(data, at) {
    const d = analyze(data), g = d.g; let visits = 0;
    function label(b, ordinal) {
      const p = g.payloads[b.node], n = p.binderName || p.declName || '_'; return n.split('._@.')[0].slice(0, 60) + '⟨κ' + (ordinal + 1) + '⟩';
    }
    function term(id, env, depth) {
      if (++visits > 64 || depth > 6) return '…';
      const kind = g.kind[id], p = g.payloads[id], cs = g.children[id];
      if (kind === 0) {const ordinal = env.length - 1 - p.index; return env[ordinal] ? label(env[ordinal], ordinal) : 'bvar ' + p.index;}
      if (kind === 4) return p.name.slice(0, 100);
      if (kind === 3) return 'Sort ' + A.levelText(p.level);
      if (kind === 5) return '(' + term(cs[0], env, depth + 1) + ' ' + term(cs[1], env, depth + 1) + ')';
      if (kind === 6 || kind === 7) return (kind === 6 ? 'λ ' : 'Π ') + (p.binderName || '_').slice(0, 40) + ', …';
      if (kind === 8) return 'let ' + (p.declName || '_').slice(0, 40) + '; …';
      return A.describe(g, id).slice(0, 100);
    }
    const text = term(at.node, scope(g, at), 0); return text.length <= 320 ? text : text.slice(0, 319) + '…';
  }
  function inspect(data, at, {firstArgument = 0} = {}) {
    const d = locate(data, at), g = d.g, env = scope(g, at), kind = A.kinds[g.kind[at.node]], payload = copy(g.payloads[at.node]);
    const fields = g.children[at.node].map((node, slot) => ({field: A.fields[kind][slot], address: address(data, child(g, at, slot))}));
    let binding = null;
    if (kind === 'bvar') {
      const ordinal = env.length - 1 - payload.index, binder = env[ordinal]; demand(binder, 'closed signature scope');
      const input = d.inputs.findIndex(x => same(x.route, binder.route));
      binding = {ordinal, address: address(data, binder), ...(input >= 0 ? {computedInput: input, counterpart: copy(data.inputs[input].address),
        relation: 'same recorded method-input position; not expression equality'} : {})};
    }
    const app = spine(g, {node: at.node, route: at.route});
    demand(Number.isInteger(firstArgument) && firstArgument >= 0 && firstArgument < Math.max(1, app.args.length), 'argument window');
    const result = {address: copy(at), kind, payload, preview: preview(data, at), contextLength: env.length, fields, binding,
      application: {head: address(data, app.head), arguments: app.args.slice(firstArgument, firstArgument + limits.arguments).map((x, j) =>
        ({ordinal: firstArgument + j, address: address(data, x), preview: preview(data, x)})), firstArgument, totalArguments: app.args.length},
      typing: 'signature-syntax-only', sourceOccurrenceInvented: false};
    demand(new TextEncoder().encode(JSON.stringify(result)).length <= limits.bytes, 'selection metadata bound'); return freeze(result);
  }
  function create(data, options = {}) {
    const d = analyze(data), first = options.firstIndex ?? 0, limit = options.indexLimit ?? limits.indices;
    demand(Number.isInteger(first) && first >= 0 && first < Math.max(1, d.indices.length) && Number.isInteger(limit) && limit >= 1 && limit <= limits.indices, 'index window');
    const port = (id, label, detail, at, x, y, width, height = 104) =>
      ({id, kind: 'kernel-signature', label, detail: detail.length <= 80 ? detail : '…' + detail.slice(-79), fullDetail: detail,
        preview: preview(data, at), address: address(data, at), x, y, width, height});
    const nodes = [port('signature:result', 'Branch conclusion schema', d.r.constructor + ' · motive ' + (d.motive + 1), d.result, 24, 18, 436),
      {id: 'body-type', kind: 'body-type', label: 'Computed method body type', detail: 'Original Γ' + data.context.length + ' + ' + data.inputs.length + ' computed inputs',
        preview: data.body.typeText, address: copy(data.body.address), x: 500, y: 18, width: 436, height: 104},
      port('signature:motive', 'Result motive ' + (d.motive + 1), 'Variable in the recursor signature', d.head, 24, 166, 220),
      port('signature:constructor', 'Constructor instance', d.r.constructor + ' · ' + d.constructorArguments.length + ' supplied arguments', d.constructor, 480, 166, 456)];
    const links = [{kind: 'branch-association', from: 'body-type', to: 'signature:result', label: 'Same recorded branch; no expression equality claimed'},
      {kind: 'signature-field', from: 'signature:result', to: 'signature:motive', label: 'Motive head'},
      {kind: 'signature-field', from: 'signature:result', to: 'signature:constructor', label: 'Constructor argument'}];
    for (const [j, at] of d.indices.slice(first, first + limit).entries()) {
      const ordinal = first + j, p = port('signature:index:' + ordinal, 'Result index ' + (ordinal + 1), 'Motive argument ' + (ordinal + 1), at, 24 + j * 234, 354, 220);
      nodes.push(p); links.push({kind: 'signature-index', from: 'signature:result', to: p.id, label: 'Result index ' + (ordinal + 1), ordinal});
    }
    const result = {format: 'ProofAtlasBranchConclusionScene/1', source: copy(data.source), evidenceSha256: data.evidenceSha256,
      namespace: 'kernel-signature', rule: 'literal-recursor-branch-conclusion/1', ruleOwner: d.owner.recursor, recursor: data.recursor,
      constructor: d.r.constructor, motive: d.motive, inputCount: d.inputs.length,
      options: {focus: {kind: 'branch-conclusion'}, firstIndex: first, indexLimit: limit}, nodes, links, width: 960, height: 492,
      resultAddress: address(data, d.result), motiveBinder: address(data, d.motiveBinder),
      constructorPayload: copy(d.g.payloads[d.constructorHead.node]),
      stats: {displayedVertices: nodes.length, visibleResultIndices: Math.min(limit, d.indices.length - first),
        hiddenResultIndices: d.indices.length - Math.min(limit, d.indices.length - first), representedResultIndices: d.indices.length},
      guarantee: 'Literal motive, indices and constructor in the recorded generic recursor signature. '
        + 'The computed body type remains separately owned. Association does not instantiate the signature, assert expression equality, '
        + 'add source occurrences, infer new types or explain a proof strategy.'};
    demand(nodes.length <= 8 && links.length <= 7 && new TextEncoder().encode(JSON.stringify(result)).length <= limits.bytes, 'diagram bound');
    return freeze(result);
  }
  const api = {create, inspect, validate: (scene, data) => {demand(same(scene, create(data, scene.options)), 'changed branch conclusion'); return true;}, limits};
  if (node) module.exports = api; else host.ProofAtlasBranchConclusion = api;
})(typeof window === 'undefined' ? globalThis : window);
