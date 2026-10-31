/* Original, reduced and closed scopes of finite recorded region functions. */
(function(host) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const A = node ? require('./proof-atlas-library-data') : host.ProofAtlasLibraryData;
  const N = node ? require('./proof-atlas-computed-type-neighborhood') : host.ProofAtlasComputedTypeNeighborhood;
  const base = '/public/data/proof-atlas/region-function-pages/';
  const limits = Object.freeze({ nodes: 131072, pageSize: 64, pageBytes: 1048576, indexBytes: 16384, manifestBytes: 262144, path: 512, bindings: 512 });
  const demand = (value, message) => { if (!value) throw Error('Region function pages: ' + message); };
  const nat = value => Number.isSafeInteger(value) && value >= 0;
  const hex = value => typeof value === 'string' && /^[a-f0-9]{64}$/.test(value);
  const copy = value => JSON.parse(JSON.stringify(value));
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
  const freeze = value => { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); } return value; };
  const sourceEqual = (a, b) => a && b && ['edition', 'name', 'indexSha256', 'sourceSha256'].every(key => a[key] === b[key]);
  const pathValid = route => route?.root === 1 && Array.isArray(route.slots) && route.slots.length <= 512 && route.slots.every(slot => nat(slot) && slot < 3);
  const anchorValid = anchor => nat(anchor?.node) && pathValid(anchor.route);
  async function open(input, expectedSource, { fetcher = host.fetch.bind(host), signal } = {}) {
    const d = freeze(copy(input)), expected = freeze(copy(expectedSource));
    const base = expected.edition === 'dependent-region-controls' ? '/public/data/proof-atlas/dependent-region-function-pages/' : '/public/data/proof-atlas/region-function-pages/';
    const pages = new Map(), indices = new Map();
    let disposed = false, active = false, pending = null;
    const stats = { pageLoads: 0, indexLoads: 0, evictions: 0, peakCachedRows: 0, peakCachedBytes: 0, peakIndexPages: 0 };
    const live = current => { if (signal?.aborted || current?.aborted) throw signal?.reason || current.reason || Error('Navigation cancelled'); demand(!disposed, 'disposed'); };
    async function read(ref, extension, cap, current) {
      live(current);
      demand(hex(ref.sha256) && nat(ref.bytes) && ref.bytes > 0 && ref.bytes <= cap && ref.file === base + ref.sha256 + '.' + extension + '.gz', 'asset descriptor');
      const response = await fetcher(ref.file, { signal: current || signal });
      demand(response.ok, 'asset unavailable (' + response.status + ')');
      const reader = response.body.pipeThrough(new host.DecompressionStream('gzip')).getReader(), parts = [];
      let size = 0;
      try {
        while (true) { live(current); const part = await reader.read(); if (part.done) break; size += part.value.byteLength; demand(size <= ref.bytes && size <= cap, 'decoded byte bound'); parts.push(part.value); }
      } catch (error) { await reader.cancel(error).catch(() => {}); throw error; }
      finally { reader.releaseLock(); }
      demand(size === ref.bytes, 'decoded size');
      const bytes = new Uint8Array(size); let offset = 0;
      for (const part of parts) { bytes.set(part, offset); offset += part.byteLength; }
      demand(await A.digest(bytes) === ref.sha256, 'asset hash'); live(current);
      return freeze(JSON.parse(new TextDecoder().decode(bytes)));
    }
    demand(sourceEqual(d.source, expected) && hex(expected.indexSha256) && hex(expected.sourceSha256) && hex(d.nativeInventorySha256) && hex(d.nativeCaseSha256), 'source/native identity');
    const m = await read(d, 'manifest', limits.manifestBytes, signal);
    demand(m.format === 'ProofAtlasRegionFunctionPages/1' && m.id === d.id && m.status === d.status && sourceEqual(m.source, expected) && m.nativeInventorySha256 === d.nativeInventorySha256 && m.nativeCaseSha256 === d.nativeCaseSha256, 'manifest owner');
    demand(Array.isArray(m.members) && m.members.length > 0 && m.members.length <= 8 && new Set(m.members).size === m.members.length && m.members.every(nat) && same(m.members, d.members), 'region members');
    demand(Array.isArray(m.order) && m.order.length === m.members.length && new Set(m.order).size === m.order.length && m.order.every(id => m.members.includes(id)), 'region order');
    demand(anchorValid(m.sourceAnchor) && Array.isArray(m.commonContext) && m.commonContext.length <= 512, 'original context');
    let previous = -1;
    for (const frame of m.commonContext) {
      demand(anchorValid(frame) && ['lam', 'forallE', 'letE'].includes(frame.kind) && frame.route.slots.length > previous && frame.route.slots.length < m.sourceAnchor.route.slots.length && same(frame.route.slots, m.sourceAnchor.route.slots.slice(0, frame.route.slots.length)), 'original binder path');
      previous = frame.route.slots.length;
    }
    const sourceAddress = anchor => freeze({ namespace: 'source-expression', name: expected.name,
      indexSha256: expected.indexSha256, sourceSha256: expected.sourceSha256, node: anchor.node, route: copy(anchor.route) });
    const state = () => ({ ...stats, status: m.status, cachedRows: [...pages.values()].reduce((n, page) => n + page.value.nodes.length, 0), cachedPages: pages.size, indexPages: indices.size, rowLimit: 64, indexLimit: 2, nodeCount: m.nodeCount, disposed, activeOperation: active, pendingOperations: pending ? 1 : 0, fullTableArchiveRequests: 0 });
    const dispose = () => { disposed = true; pending?.reject(Error('Region function pages: disposed')); pending = null; pages.clear(); indices.clear(); };
    if (m.status === 'KERNEL_REJECTED') {
      demand(m.nodeCount === 0 && Array.isArray(m.components) && m.components.length === 0 && Array.isArray(m.bindings) && m.bindings.length === 0 && m.members.includes(m.rejection?.call) && nat(m.rejection.slot) && m.rejection.slot <= 64 && m.rejection.kernelInputTypeNonconversion === 'PASS' && anchorValid(m.rejection.source), 'recorded rejection');
      return Object.freeze({ manifest: m, state, dispose, rejectionAddress: () => { live(); return sourceAddress(m.rejection.source); } });
    }
    demand(m.status === 'PASS', 'unsupported candidate status');
    const n = m.nodeCount;
    demand(nat(n) && n > 0 && n <= limits.nodes && m.pageSize === 64 && m.pageCount === Math.ceil(n / 64) && hex(m.indexRoot), 'table bounds');
    let level = 0, capacity = 64; while (capacity < m.pageCount) { capacity *= 64; level++; }
    demand(m.indexLevel === level && m.indexSizes && Object.keys(m.indexSizes).length <= 34 && Object.entries(m.indexSizes).every(([key, value]) => hex(key) && nat(value) && value > 0 && value <= limits.indexBytes), 'index inventory');
    demand(['kernelClosedTyping', 'kernelEqualityWitness', 'kernelSpecialization'].every(key => m.judgments?.[key] === 'PASS'), 'recorded judgments');
    demand(Array.isArray(m.keptContextSlots) && m.keptContextSlots.every((slot, i) => nat(slot) && slot < m.commonContext.length && (i === 0 || slot > m.keptContextSlots[i - 1])), 'reduced context slots');
    demand(m.context && same(m.context.original, m.commonContext) && same(m.context.reduced, m.keptContextSlots.map(slot => m.commonContext[slot])) && same(m.context.closed, []), 'component context owners');
    const names = ['function.original', 'function.originalType', 'function.reduced', 'function.reducedType', 'function.closed', 'function.closedType', 'source.specialization', 'source.results', 'recovery.witness', 'recovery.type'];
    const scopes = ['original', 'original', 'reduced', 'reduced', 'closed', 'closed', 'original', 'original', 'closed', 'closed'];
    demand(Array.isArray(m.components) && m.components.length === 10 && Array.isArray(m.bindings) && m.bindings.length <= limits.bindings, 'component/binding inventory');
    const roots = {}, owners = {};
    for (const [i, component] of m.components.entries()) {
      demand(component.component === names[i] && component.scope === scopes[i] && nat(component.root) && component.root < n, 'component root/scope');
      roots[component.component] = component.root; owners[component.component] = component.scope;
    }
    async function index(sha, current) {
      if (indices.has(sha)) { const value = indices.get(sha); indices.delete(sha); indices.set(sha, value); return value; }
      const value = await read({ file: base + sha + '.index.gz', sha256: sha, bytes: m.indexSizes[sha] }, 'index', limits.indexBytes, current);
      demand(value.format === 'ProofAtlasRegionFunctionIndex/1' && Array.isArray(value.children) && value.children.length > 0 && value.children.length <= 64 && value.children.every(ref => hex(ref.sha256) && nat(ref.bytes) && ref.bytes > 0 && ref.bytes <= limits.pageBytes), 'index shape');
      if (indices.size === 2) indices.delete(indices.keys().next().value);
      indices.set(sha, value); stats.indexLoads++; stats.peakIndexPages = Math.max(stats.peakIndexPages, indices.size); return value;
    }
    async function row(id, current) {
      live(current); demand(nat(id) && id < n, 'row address');
      const page = Math.floor(id / 64); if (pages.has(page)) return pages.get(page).value.nodes[id % 64];
      let ref = { sha256: m.indexRoot, bytes: m.indexSizes[m.indexRoot] };
      for (let depth = m.indexLevel; depth >= 0; depth--) {
        demand(ref.bytes === m.indexSizes[ref.sha256], 'index parent size');
        const value = await index(ref.sha256, current), span = 64 ** depth, first = Math.floor(page / (64 * span)) * 64 * span;
        demand(value.level === depth && value.first === first && value.children.length === Math.min(64, Math.ceil((m.pageCount - first) / span)), 'index range');
        ref = value.children[Math.floor(page / span) % 64];
      }
      const value = await read({ ...ref, file: base + ref.sha256 + '.page.gz' }, 'page', limits.pageBytes, current);
      demand(value.format === 'ProofAtlasRegionFunctionPage/1' && value.start === page * 64 && Array.isArray(value.nodes) && value.nodes.length === Math.min(64, n - value.start), 'page range');
      for (const [j, tuple] of value.nodes.entries()) {
        demand(Array.isArray(tuple) && tuple.length === 5, 'row tuple');
        const [kind, children, payload, count, scope] = tuple;
        demand(nat(kind) && kind < 12 && kind !== 1 && kind !== 2 && Array.isArray(children) && children.length === (A.fields[A.kinds[kind]] || []).length && children.every(child => nat(child) && child < value.start + j), 'ordered constructor fields');
        demand(payload && typeof payload === 'object' && !Array.isArray(payload) && typeof count === 'string' && /^[1-9]\d*$/.test(count) && count.length <= 4096 && nat(scope) && scope <= limits.nodes, 'payload/count/scope');
        if (kind === 0) demand(nat(payload.index) && payload.index < limits.nodes, 'bound variable');
      }
      if (pages.size) { pages.clear(); stats.evictions++; }
      pages.set(page, { value, bytes: ref.bytes }); stats.pageLoads++;
      stats.peakCachedRows = Math.max(stats.peakCachedRows, value.nodes.length); stats.peakCachedBytes = Math.max(stats.peakCachedBytes, ref.bytes); return value.nodes[id % 64];
    }
    const address = (component, node, slots) => freeze({ namespace: 'region-input-components', sourceIndexSha256: expected.indexSha256,
      nativeInventorySha256: d.nativeInventorySha256, nativeCaseSha256: d.nativeCaseSha256, manifestSha256: d.sha256, case: m.id, component, node, route: { root: component, slots: [...slots] } });
    const bindings = []; let binder = roots['function.original'], slots = [];
    for (const binding of m.bindings) {
      const tuple = await row(binder, signal), input = binding.kind === 'input';
      demand((input || binding.kind === 'result') && m.members.includes(binding.call) && (input ? nat(binding.slot) && binding.slot <= 64 : !Object.hasOwn(binding, 'slot')) && anchorValid(binding.source), 'binding source');
      demand(binding.node === binder && same(binding.slots, slots) && tuple[0] === (input ? 6 : 8), 'binding/function path');
      bindings.push(freeze({ ...binding, binder: address('function.original', binder, slots), domain: address('function.original', tuple[1][0], [...slots, 0]),
        ...(input ? {} : { value: address('function.original', tuple[1][1], [...slots, 1]) }), original: sourceAddress(binding.source) }));
      slots.push(input ? 1 : 2); binder = tuple[1][input ? 1 : 2];
    }
    demand(bindings.filter(binding => binding.kind === 'input').length === m.independentInputs && bindings.filter(binding => binding.kind === 'result').length === m.members.length && same(bindings.filter(binding => binding.kind === 'result').map(binding => binding.call), m.order), 'input/result counts and order');
    for (const component of m.components) demand((await row(component.root, signal))[4] <= m.context[component.scope].length, 'component root scope');
    function start(task) {
      active = true;
      (async () => { try { live(task.signal); const value = await task.fn(); live(task.signal); task.resolve(value); } catch (error) { task.reject(error); }
        finally { active = false; const next = pending; pending = null; if (next) start(next); } })();
    }
    function run(fn, current) {
      return new Promise((resolve, reject) => { try { live(current); } catch (error) { reject(error); return; }
        const task = { fn, signal: current, resolve, reject };
        if (active) { pending?.reject(Error('Region function pages: pending operation superseded')); pending = task; } else start(task);
      });
    }
    async function neighborhood(component, path = [], options = {}) {
      demand(Object.hasOwn(roots, component) && Array.isArray(path) && path.length <= 512, 'component path'); const selectedPath = copy(path);
      return run(async () => {
        let id = roots[component];
        for (const slot of selectedPath) { const tuple = await row(id, options.signal); demand(nat(slot) && slot < tuple[1].length, 'ordered path'); id = tuple[1][slot]; }
        return N.createPaged(id => row(id, options.signal), roots, address(component, id, selectedPath), m.context[owners[component]], sourceAddress(m.sourceAnchor), options);
      }, options.signal);
    }
    return Object.freeze({ manifest: m, roots: freeze(roots), bindings: freeze(bindings), neighborhood,
      readNode: (id, { signal: current } = {}) => run(() => row(id, current), current), state, dispose });
  }
  const api = { open, limits, base, sourceEqual };
  if (node) module.exports = api; else host.ProofAtlasRegionFunctionPages = api;
})(typeof window === 'undefined' ? globalThis : window);
