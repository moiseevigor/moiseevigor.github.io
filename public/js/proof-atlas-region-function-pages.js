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
    const adapted = d.adapterRule === 'explicit-function/1';
    const specializing = d.constraintRule === 'source-lambda-order/1';
    demand((d.constraintRule === undefined || specializing) && !(adapted && specializing), 'interface rule');
    const base = specializing ? '/public/data/proof-atlas/region-function-pages/' : adapted ? '/public/data/proof-atlas/region-adapter-function-pages/' : expected.edition === 'dependent-region-controls' ? '/public/data/proof-atlas/dependent-region-function-pages/' : '/public/data/proof-atlas/region-function-pages/';
    const pages = new Map(), indices = new Map();
    let disposed = false, active = false, pending = null, notationLease = null;
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
    demand(m.format === (specializing ? 'ProofAtlasRegionFunctionPages/3' : adapted ? 'ProofAtlasRegionFunctionPages/2' : 'ProofAtlasRegionFunctionPages/1') && (!adapted || m.adapterRule === d.adapterRule) && (!specializing || m.constraintRule === d.constraintRule) && m.id === d.id && m.status === d.status && sourceEqual(m.source, expected) && m.nativeInventorySha256 === d.nativeInventorySha256 && m.nativeCaseSha256 === d.nativeCaseSha256, 'manifest owner');
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
    const state = () => ({ ...stats, status: m.status, cachedRows: [...pages.values()].reduce((n, page) => n + page.value.nodes.length, 0), cachedPages: pages.size, indexPages: indices.size, rowLimit: 64, indexLimit: 2, nodeCount: m.nodeCount, disposed, activeOperation: active, pendingOperations: pending ? 1 : 0, fullTableArchiveRequests: 0, ...(notationLease ? { notation: notationLease.state() } : {}) });
    const dispose = () => { disposed = true; pending?.reject(Error('Region function pages: disposed')); pending = null; notationLease?.dispose(); notationLease = null; pages.clear(); indices.clear(); };
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
    demand(Array.isArray(m.components) && m.components.length >= 10 && m.components.length <= (specializing ? 256 : 10) && new Set(m.components.map(c => c.component)).size === m.components.length && Array.isArray(m.bindings) && m.bindings.length <= limits.bindings, 'component/binding inventory');
    const roots = {}, owners = {};
    for (const [i, component] of m.components.entries()) {
      demand((i < 10 ? component.component === names[i] && component.scope === scopes[i] : specializing && component.scope === 'original' && /^(derivation\.\d+\.(specialized|original|domain|witness|equality)|template\.\d+\.(original|pattern\.\d+))$/.test(component.component) && typeof component.label === 'string' && component.label.length <= 256 && ['constraint','template'].includes(component.nativeOwner?.kind) && nat(component.nativeOwner.index) && nat(component.nativeOwner.root)) && nat(component.root) && component.root < n, 'component root/scope');
      if (specializing && i < 10) demand(same(component.nativeOwner, {kind:'function',root:i}), 'main native component owner');
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
      const tuple = await row(binder, signal), adapter = binding.kind === 'adapter', derived = binding.kind === 'derived-input', input = binding.kind === 'input' || adapter, boundary = input || derived;
      demand((input || binding.kind === 'result' || specializing && derived) && m.members.includes(binding.call) && (boundary ? nat(binding.slot) && binding.slot <= 64 : !Object.hasOwn(binding, 'slot')), 'binding position');
      if (specializing) demand(typeof binding.key === 'string' && (derived ? nat(binding.constraint) : !Object.hasOwn(binding, 'constraint')), 'stable binding key and derivation');
      if (adapter) demand(adapted && !Object.hasOwn(binding, 'source') && anchorValid(binding.inputSource) && anchorValid(binding.producerSource) && nat(binding.adapterIndex) && binding.originalSpecialization === 'identity' && binding.kernelInputTypeNonconversion === 'PASS', 'computed adapter and original connection');
      else demand(anchorValid(binding.source), 'binding source');
      demand(binding.node === binder && same(binding.slots, slots) && tuple[0] === (input ? 6 : 8), 'binding/function path');
      if (adapter) demand((await row(tuple[1][0], signal))[0] === 7, 'adapter function domain');
      bindings.push(freeze({ ...binding, binder: address('function.original', binder, slots), domain: address('function.original', tuple[1][0], [...slots, 0]),
        ...(input ? {} : { value: address('function.original', tuple[1][1], [...slots, 1]) }),
        ...(adapter ? { originalInput: sourceAddress(binding.inputSource), originalProducer: sourceAddress(binding.producerSource) } : { original: sourceAddress(binding.source) }) }));
      slots.push(input ? 1 : 2); binder = tuple[1][input ? 1 : 2];
    }
    const adapterBindings = bindings.filter(binding => binding.kind === 'adapter'), boundaryInputs = bindings.filter(binding => binding.kind === 'input').length;
    const results = bindings.filter(binding => binding.kind === 'result');
    demand(boundaryInputs + adapterBindings.length === m.independentInputs && results.length === m.members.length && new Set(results.map(b => b.call)).size === results.length && (!specializing ? same(results.map(binding => binding.call), m.order) : results.every(b => m.members.includes(b.call))), 'input/result counts and order');
    if (adapted) demand(m.boundaryInputs === boundaryInputs && m.adapterInputs === adapterBindings.length && adapterBindings.every((binding, i) => binding.adapterIndex === i), 'additional adapter inventory');
    if (specializing) {
      const byKey = new Map(bindings.map(b => [b.key, b])), derived = bindings.filter(b => b.kind === 'derived-input');
      demand(byKey.size === bindings.length && Array.isArray(m.creationOrder) && m.creationOrder.length === bindings.length && new Set(m.creationOrder).size === bindings.length && m.creationOrder.every(key => byKey.has(key)), 'creation/declaration identity');
      const creation = m.creationOrder.map(key => byKey.get(key));
      demand(same(creation.filter(b => b.kind === 'result').map(b => b.call), m.order), 'original result creation order');
      const positions = new Set(); let callIndex = 0, previousSlot = -1;
      creation.forEach((binding, index) => {
        demand(binding.call === m.order[callIndex] && binding.key === (binding.kind === 'result' ? 'atlasRegionResult.' + binding.call : 'atlasRegionInput.' + index), 'source creation key');
        if (binding.kind === 'result') { callIndex++; previousSlot = -1; }
        else { demand(binding.slot > previousSlot && !positions.has(binding.call + ':' + binding.slot), 'original port order'); previousSlot = binding.slot; positions.add(binding.call + ':' + binding.slot); }
      });
      demand(nat(m.derivedInputs) && m.derivedInputs === derived.length && m.independentInputs + m.derivedInputs <= m.boundaryPositions && m.originalResultPortals === m.members.length, 'derived boundary counts');
      demand(Array.isArray(m.derivations) && m.derivations.length === derived.length && Array.isArray(m.templates) && m.templates.length <= derived.length && Array.isArray(m.permutations) && m.permutations.length <= derived.length, 'source-specializing inventory');
      const usedComponents = new Set(names);
      function observation(name, kind, index, root) {
        const component = m.components.find(c => c.component === name);
        demand(component && component.scope === 'original' && same(component.nativeOwner, {kind, index, root}) && !usedComponents.has(name), 'native observation component owner');
        usedComponents.add(name);
      }
      m.derivations.forEach((record, index) => {
        const binding = byKey.get(record.bindingKey);
        demand(binding?.kind === 'derived-input' && binding.constraint === index && record.index === index && m.members.includes(record.trigger?.call) && nat(record.trigger.slot) && record.trigger.slot <= 64 && Array.isArray(record.predecessorKeys) && record.predecessorKeys.length <= 512 && new Set(record.predecessorKeys).size === record.predecessorKeys.length && record.predecessorKeys.every(key => key !== record.bindingKey && byKey.has(key)), 'recorded assignment owner/context');
        demand(['kernelAssignmentTyping','kernelSourceSpecialization','kernelSourceEqualityWitness'].every(key => record[key] === 'PASS'), 'recorded source recovery');
        for (const [key, root] of [['specialized',1],['original',2],['domain',4],['witness',5],['equality',6]]) observation(record.components?.[key], 'constraint', index, root);
      });
      demand(new Set(m.templates.map(t => t.bindingKey)).size === m.templates.length, 'template identities');
      m.templates.forEach((record, index) => {
        const binding = byKey.get(record.bindingKey);
        demand(record.index === index && binding?.kind === 'derived-input' && binding.constraint === record.constraint && record.relation === 'derived-source-value-pattern/1' && Array.isArray(record.patterns) && record.patterns.length <= 512 && new Set(record.patterns.map(p => p.group)).size === record.patterns.length, 'source template relation');
        observation(record.originalComponent, 'template', index, 0);
        for (const pattern of record.patterns) {
          demand(nat(pattern.group) && Array.isArray(pattern.targets) && pattern.targets.length > 0 && pattern.targets.length <= 512 && new Set(pattern.targets).size === pattern.targets.length && pattern.targets.every(key => byKey.has(key) && key !== record.bindingKey), 'source pattern targets');
          const component = m.components.find(c => c.component === pattern.sourceComponent);
          demand(component?.nativeOwner?.root === 2 + 2 * pattern.group, 'native pattern root');
          observation(pattern.sourceComponent, 'template', index, component.nativeOwner.root);
        }
      });
      demand(usedComponents.size === m.components.length, 'unowned observation component');
      let declarationOrder = [], created = 0, previousCause = -1;
      for (const permutation of m.permutations) {
        const binding = byKey.get(permutation.cause);
        demand(binding?.kind === 'derived-input' && binding.constraint > previousCause && permutation.kernelContextTyping === 'PASS' && Array.isArray(permutation.old) && Array.isArray(permutation.new) && permutation.old.length >= created && permutation.old.length <= bindings.length && permutation.old.length === permutation.new.length && new Set(permutation.old).size === permutation.old.length && new Set(permutation.new).size === permutation.new.length && permutation.new.every(key => permutation.old.includes(key)), 'recorded declaration permutation');
        previousCause = binding.constraint;
        declarationOrder.push(...m.creationOrder.slice(created, permutation.old.length)); created = permutation.old.length;
        demand(same(declarationOrder, permutation.old), 'pre-permutation order'); declarationOrder = [...permutation.new];
      }
      declarationOrder.push(...m.creationOrder.slice(created)); demand(same(declarationOrder, bindings.map(b => b.key)), 'final declaration order');
      demand(Array.isArray(m.portMap) && m.portMap.length <= 520 && m.portMap.length === m.boundaryPositions + m.internalPositions, 'source port inventory');
      const portCalls = new Map();
      for (const port of m.portMap) { demand(m.members.includes(port.call), 'source port call'); if (!portCalls.has(port.call)) portCalls.set(port.call, []); portCalls.get(port.call).push(port); }
      demand(same([...portCalls.keys()], m.order), 'source port call order');
      let internal = 0, supplied = 0, computed = 0;
      for (const [call, ports] of portCalls) {
        const result = results.find(row => row.call === call); demand(ports.length > 0 && ports.length <= 65, 'complete call ports');
        ports.forEach((port, slot) => {
          const tail = slot === 0 ? Array(ports.length - 1).fill(0) : [...Array(ports.length - 1 - slot).fill(0), 1];
          demand(port.slot === slot && anchorValid(port.source) && nat(port.node) && port.node < n && Array.isArray(port.slots) && port.slots.length <= 512 && same(port.slots, [...result.value.route.slots, ...tail]), 'ordered computed input counterpart');
          const binding = byKey.get(port.bindingKey);
          if (port.relation === 'internal-source-use') { demand(binding?.kind === 'result', 'internal result reference'); internal++; }
          else if (port.relation === 'fixed-boundary') demand(port.bindingKey === null, 'fixed source port');
          else { demand(binding && binding.call === call && binding.slot === slot && same(binding.source, port.source) && (port.relation === 'independent-boundary' ? binding.kind === 'input' : port.relation === 'derived-boundary' && binding.kind === 'derived-input'), 'boundary counterpart'); if (binding.kind === 'input') supplied++; else computed++; }
        });
      }
      demand(internal === m.internalPositions && supplied === m.independentInputs && computed === m.derivedInputs, 'source counterpart counts');
    }
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
    async function openNotation(component, path = [], options = {}) {
      live(options.signal);
      const engine = node ? require('./proof-atlas-paged-notation') : host.ProofAtlasPagedNotation;
      const catalog = options.catalog || host.PROOF_ATLAS_TYPE_NOTATION, registry = options.registry || (specializing ? host.PROOF_ATLAS_SOURCE_TEMPLATE_NOTATION_BINDINGS : host.PROOF_ATLAS_PAGED_NOTATION_BINDINGS);
      demand(engine && catalog && registry?.format === 'ProofAtlasPagedNotationBindings/1' && Array.isArray(registry.registries) && registry.registries.length <= 16, 'notation catalogue binding unavailable');
      const componentIndex = m.components.findIndex(c => c.component === component); demand(componentIndex >= 0, 'notation component');
      demand(hex(registry.catalogueObjectSha256) && hex(registry.environmentSha256) && await A.digest(new TextEncoder().encode(JSON.stringify(catalog))) === registry.catalogueObjectSha256 && registry.catalogueNativeSha256 === catalog.nativeSha256 && registry.extraNativeSha256 === catalog.extraNativeSha256, 'notation catalogue identity');
      const binding = registry.registries.find(r => r.nativeInventorySha256 === d.nativeInventorySha256);
      demand(binding && ['core', 'full'].includes(binding.mode) && Array.isArray(binding.sources) && binding.sources.length <= 256, 'native notation environment');
      const source = binding.sources.find(s => sourceEqual(s.source, expected)); demand(source && Array.isArray(source.context) && source.context.length === m.commonContext.length, 'notation original context');
      source.context.forEach((frame, i) => demand(same({ node: frame.node, kind: frame.kind, route: frame.route }, m.commonContext[i]) && typeof frame.name === 'string' && frame.name.length <= 4096, 'original compiled binder name'));
      const frames = owners[component] === 'original' ? source.context : owners[component] === 'reduced' ? m.keptContextSlots.map(i => source.context[i]) : [];
      demand(Array.isArray(registry.coreNames) && registry.coreNames.length === 20 && new Set(registry.coreNames).size === 20, 'core signature inventory');
      const activeCatalog = binding.mode === 'full' ? catalog : { ...catalog, entries: catalog.entries.filter(e => registry.coreNames.includes(e.name)) };
      const owner = { namespace: 'region-input-notation', sourceIndexSha256: expected.indexSha256, nativeInventorySha256: d.nativeInventorySha256, nativeCaseSha256: d.nativeCaseSha256, manifestSha256: d.sha256, case: m.id, component, typeRoot: componentIndex,
        catalogueObjectSha256: registry.catalogueObjectSha256, environmentSha256: registry.environmentSha256 };
      notationLease?.dispose();
      const next = engine.open({ read: (id, request) => run(() => row(id, request.signal), request.signal), nodeCount: n, roots: m.components.map(c => c.root), owner, catalog: activeCatalog,
        context: frames.map(frame => ({ name: frame.name, address: sourceAddress(frame) })), signal: options.signal });
      notationLease = next;
      try {
        const scene = await next.inspect(path, { signal: options.signal }); live(options.signal);
        return Object.freeze({ scene, expand: (current, slots, request = {}) => next.expand(current, slots, request), state: next.state,
          dispose: () => { next.dispose(); if (notationLease === next) notationLease = null; } });
      } catch (error) { next.dispose(); if (notationLease === next) notationLease = null; throw error; }
    }
    const portMap = specializing ? freeze(m.portMap.map(port => ({...port, original:sourceAddress(port.source), counterpart:address('function.original',port.node,port.slots)}))) : null;
    return Object.freeze({ manifest: m, roots: freeze(roots), bindings: freeze(bindings), portMap, neighborhood, openNotation,
      readNode: (id, { signal: current } = {}) => run(() => row(id, current), current), state, dispose });
  }
  const api = { open, limits, base, sourceEqual };
  if (node) module.exports = api; else host.ProofAtlasRegionFunctionPages = api;
})(typeof window === 'undefined' ? globalThis : window);
