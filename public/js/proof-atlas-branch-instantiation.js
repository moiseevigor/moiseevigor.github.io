/* Literal simultaneous substitution. Existing native conversions stay separate. */
(function(host) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const A = node ? require('./proof-atlas-library-data') : host.ProofAtlasLibraryData;
  const M = node ? require('./proof-atlas-method-interfaces') : host.ProofAtlasMethodInterfaces;
  const receipts = new WeakMap(), copy = x => JSON.parse(JSON.stringify(x));
  const limits = Object.freeze({memo: 1024, frontier: 4096, work: 262144, depth: 1024, bytes: 262144});
  const demand = (ok, m) => {if (!ok) throw Error('Branch instantiation: ' + m);};
  const freeze = x => {if (x && typeof x === 'object' && !Object.isFrozen(x)) {Object.values(x).forEach(freeze); Object.freeze(x);} return x;};
  const check = signal => {if (signal?.aborted) throw signal.reason || Error('Branch instantiation cancelled');};
  async function literal(c, template, options = {}) {
    const signal = options.signal, bounds = {...limits, ...options.bounds};
    demand(Object.keys(bounds).length === Object.keys(limits).length, 'unknown working bound');
    for (const key of Object.keys(limits)) demand(Number.isInteger(bounds[key]) && bounds[key] >= 1 && bounds[key] <= limits[key], 'working bound ' + key);
    demand(Number.isInteger(c.prefix) && c.prefix >= 0 && c.prefix <= 128 && c.arguments.length === c.prefix, 'prefix inventory');
    for (const graph of [c.signature, c.expected]) demand(graph.kind.length > 0 && graph.kind.length <= 65536, 'graph bound');
    const memo = new Map(), pending = new Map(), used = new Set();
    const stats = {pairs: 0, sourceRows: 0, substitutions: 0, memoHits: 0, evictions: 0, peakMemo: 0, peakFrontier: 0};
    const keyOf = x => [x.mode, x.id, x.target, x.depth, x.shift].join(':');
    function push(at) {
      demand(at.depth <= bounds.depth && at.shift <= bounds.depth, 'binding depth');
      const key = keyOf(at); if (pending.has(key)) return;
      demand(pending.size < bounds.frontier, 'frontier bound'); pending.set(key, at);
      stats.peakFrontier = Math.max(stats.peakFrontier, pending.size);
    }
    push({mode: 'signature', id: template, target: c.expectedRoot, depth: 0, shift: 0});
    try {
      while (pending.size) {
        check(signal);
        // Descending source DAG order helps the existing one-page source cache.
        let at; for (const value of pending.values()) if (!at || value.id > at.id) at = value;
        const key = keyOf(at); pending.delete(key);
        if (memo.has(key)) {memo.delete(key); memo.set(key, true); stats.memoHits++; continue;}
        demand(++stats.pairs <= bounds.work, 'work bound');
        const [kind, children, payload] = at.mode === 'signature'
          ? [c.signature.kind[at.id], c.signature.children[at.id], c.signature.payloads[at.id]]
          : await c.readSource(at.id, {signal});
        demand(Number.isInteger(kind) && kind >= 0 && kind < 12 && Array.isArray(children) && children.every(id => Number.isInteger(id) && id >= 0 && id < at.id), 'postorder constructor row');
        if (at.mode === 'source') stats.sourceRows++;
        check(signal);
        if (at.mode === 'signature' && kind === 0 && payload.index >= at.depth) {
          const ordinal = c.prefix - 1 - (payload.index - at.depth);
          demand(ordinal >= 0 && ordinal < c.arguments.length, 'closed signature context');
          used.add(ordinal); stats.substitutions++;
          push({mode: 'source', id: c.arguments[ordinal].node, target: at.target, depth: 0, shift: at.depth});
        } else {
          const target = at.target, other = c.expected.children[target];
          demand(kind === c.expected.kind[target] && children.length === other.length, 'constructor/field mismatch');
          const expectedPayload = kind === 0 && at.mode === 'source' && payload.index >= at.depth
            ? {...payload, index: payload.index + at.shift} : payload;
          demand(A.payloadKey(kind, expectedPayload) === A.payloadKey(kind, c.expected.payloads[target]), 'payload or capture mismatch');
          for (const [slot, id] of children.entries()) push({...at, id, target: other[slot],
            depth: at.depth + (((kind === 6 || kind === 7) && slot === 1 || kind === 8 && slot === 2) ? 1 : 0)});
        }
        if (memo.size === bounds.memo) {memo.delete(memo.keys().next().value); stats.evictions++;}
        memo.set(key, true); stats.peakMemo = Math.max(stats.peakMemo, memo.size);
      }
      check(signal);
      return freeze({used: [...used].sort((a,b) => a-b), state: {...stats, sourceMode: c.sourceMode, ...bounds}});
    } finally {memo.clear(); pending.clear();}
  }
  async function compare(data, options = {}) {
    demand(M.isFlowData(data), 'validated method record');
    const c = M.signatureContext(data), t = data.kernel.trace, r = data.kernel.rule;
    let template = t.recursorTypeRoot;
    for (let i = 0; i < c.prefix; i++) {demand(c.signature.kind[template] === 7, 'signature prefix'); template = c.signature.children[template][1];}
    demand(c.signature.kind[template] === 7, 'minor domain'); template = c.signature.children[template][0];
    const verified = await literal(c, template, options), used = verified.used;
      const owner = {evidenceSha256: data.evidenceSha256, query: copy(data.source.query), minor: data.kernelRule.minor};
      const signature = {namespace: 'kernel-signature', ...owner, recursor: data.recursor, ruleOwner: r.recursor || t.recursor,
        signatureRoot: t.recursorTypeRoot, node: template, route: {root: 0, slots: [...Array(c.prefix).fill(1), 0]}};
      const expected = {namespace: 'recorded-parent-type', ...owner, root: c.expectedRoot, contextLength: data.context.length};
      const actual = {...expected, root: c.actualRoot};
      const result = freeze({format: 'ProofAtlasBranchInstantiation/1', status: 'checked', source: copy(data.source),
        signature, expected, actual, expectedText: c.expectedText, actualText: c.actualText,
        prefixCount: c.prefix, usedPrefixCount: used.length,
        bindings: used.map(ordinal => ({ordinal,
          role: ordinal < t.parameters ? 'parameter' : ordinal < t.parameters + t.motives ? 'motive' : 'earlier-method',
          argument: {namespace: 'source-expression', indexSha256: data.source.indexSha256, sourceSha256: data.source.sourceSha256,
            node: c.arguments[ordinal].node, route: copy(c.arguments[ordinal].route), path: c.arguments[ordinal].path}})),
        relation: 'capture-avoiding-substitution-equals-recorded-expected-method-type',
        conversion: {relation: 'previously-recorded-native-method-domain-conversion', status: 'PASS', from: actual, to: expected},
        state: verified.state,
        guarantee: 'Exact ordered substitution into the generic method domain, including lifting beneath binders. '
          + 'The expected/actual method-type conversion is an existing native observation. This check does not normalize '
          + 'the result, instantiate only the result without its input telescope, identify signature binders with computed inputs, '
          + 'add source occurrences or establish a new kernel typing judgment.'});
      demand(new TextEncoder().encode(JSON.stringify(result)).length <= verified.state.bytes, 'receipt byte bound');
      receipts.set(result, data); return result;
  }

  function accepts(value, data) {demand(receipts.get(value) === data && M.isFlowData(data), 'foreign or cloned substitution receipt'); return true;}
  const api = {literal, compare, accepts, limits};
  if (node) module.exports = api; else host.ProofAtlasBranchInstantiation = api;
})(typeof window === 'undefined' ? globalThis : window);
