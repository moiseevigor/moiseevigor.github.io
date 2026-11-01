/* The shared application join, over an original compiled source occurrence.
   Source fields and lexical references require no invented internal type. */
(function(host) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const A = node ? require('./proof-atlas-library-data') : host.ProofAtlasLibraryData;
  const collar = () => node ? require('./proof-atlas-application-collar') : host.ProofAtlasApplicationCollar;
  const owners = new WeakMap(), copy = x => JSON.parse(JSON.stringify(x));
  const limits = Object.freeze({ path: 512, reads: 8192, metadataBytes: 1048576 });
  const demand = (ok, message) => { if (!ok) throw Error('Source application: ' + message); };
  const same = (a, b) => JSON.stringify(a) === JSON.stringify(b), hex = x => /^[a-f0-9]{64}$/.test(x || '');
  const binds = (k, s) => (k === 6 || k === 7) && s === 1 || k === 8 && s === 2;
  const identity = r => ({ name: r.name, indexSha256: r.indexSha256, sourceSha256: r.sourceSha256 });
  function issue(header, record, read, live, delivery) {
    demand(header.serialization === 'ExprDAG/1' && header.declaration?.name === record.name && header.declaration.kernelCheck === 'PASS' && hex(record.indexSha256) && hex(record.sourceSha256) && Number.isSafeInteger(record.uniqueNodes) && record.uniqueNodes > 0, 'source owner');
    demand(Array.isArray(header.roots) && header.roots.length === header.declaration.rootPaths?.length && header.roots.every(n => Number.isSafeInteger(n) && n >= 0 && n < record.uniqueNodes), 'source roots');
    let disposed = false;
    const owner = Object.freeze({ dispose: () => { disposed = true; } });
    owners.set(owner, { header, record: { ...identity(record), uniqueNodes: record.uniqueNodes }, read, delivery, live: () => { demand(!disposed, 'retired reader'); live(); } });
    return owner;
  }
  // Complete input is borrowed from the library's hash-validated immutable
  // packet. This adapter does not authenticate arbitrary caller-supplied JSON.
  function complete(data, record) {
    demand(['kind', 'children', 'payloads', 'expanded', 'neededScope'].every(f => data[f]?.length === record.uniqueNodes), 'complete table shape');
    return issue(data, record, async id => [data.kind[id], data.children[id], data.payloads[id], data.expanded[id], data.neededScope[id]], () => {}, 'complete source packet remains separately resident');
  }
  function paged(cursor) {
    const P = node ? require('./proof-atlas-source-pages') : host.ProofAtlasSourcePages;
    demand(P && same(identity(P.identity(cursor)), identity(cursor.record)), 'paged owner identity');
    return issue(cursor.data, cursor.record, (id, signal) => cursor.run(() => [cursor.data.kind[id], cursor.data.children[id], cursor.data.payloads[id], cursor.data.expanded[id], cursor.data.neededScope[id]], { signal }), () => P.identity(cursor), 'borrowed authenticated source-page cache');
  }
  function entry(owner) { const e = owners.get(owner); demand(e, 'foreign reader'); e.live(); return e; }
  function routeCheck(route, e) {
    demand(Number.isInteger(route?.root) && route.root >= 0 && route.root < e.header.roots.length && ['root.type', 'root.value'].includes(e.header.declaration.rootPaths[route.root]) && Array.isArray(route.slots) && route.slots.length <= limits.path && route.slots.every(s => Number.isInteger(s) && s >= 0 && s <= 2), 'original source route/bound');
  }
  function address(e, id, route) { return { namespace: 'source-expression', ...identity(e.record), node: id, route: copy(route) }; }
  async function read(owner, selected, { signal } = {}) {
    const e = entry(owner); routeCheck(selected, e); const route = copy(selected);
    let rowReads = 0, budget = 0;
    const live = () => { e.live(); if (signal?.aborted) throw signal.reason || Error('Cancelled'); };
    const account = value => { budget += new TextEncoder().encode(JSON.stringify(value)).length; demand(budget <= limits.metadataBytes, 'metadata bound'); };
    async function raw(id) {
      live(); demand(Number.isInteger(id) && id >= 0 && id < e.record.uniqueNodes && ++rowReads <= limits.reads, 'row/work bound');
      const r = await e.read(id, signal); live();
      const [k, cs, p, mass, needed] = r;
      demand(Number.isInteger(k) && k >= 0 && k < 12 && Array.isArray(cs) && cs.length === (A.fields[A.kinds[k]] || []).length && cs.every(c => Number.isInteger(c) && c >= 0 && c < id) && p && typeof p === 'object' && !Array.isArray(p) && typeof mass === 'string' && mass.length <= 4096 && /^[1-9]\d*$/.test(mass) && Number.isSafeInteger(needed) && needed >= 0, 'source row');
      if (k === 0) demand(Number.isSafeInteger(p.index) && p.index >= 0 && needed === p.index + 1, 'variable scope');
      return r;
    }
    async function row(id) {
      const r = await raw(id), children = [];
      for (const c of r[1]) children.push(await raw(c));
      demand(1n + children.reduce((n, child) => n + BigInt(child[3]), 0n) === BigInt(r[3]), 'source occurrence recurrence');
      if (r[0] !== 0) demand(Math.max(0, ...children.map((c, s) => c[4] - Number(binds(r[0], s)))) === r[4], 'source scope recurrence');
      return r;
    }
    let id = e.header.roots[route.root]; const scope = [];
    demand((await row(id))[4] === 0, 'open source root');
    for (const [depth, slot] of route.slots.entries()) {
      const r = await row(id); demand(slot < r[1].length, 'invalid source field');
      if (binds(r[0], slot)) { const frame = { node: id, depth, name: String(r[2].binderName || r[2].declName || '_').slice(0, 64) }; account(frame); scope.push(frame); }
      id = r[1][slot];
    }
    demand((await row(id))[4] <= scope.length, 'unresolved original context');
    const point = (id, slots) => { demand(slots.length <= limits.path, 'path bound'); const a = address(e, id, { root: route.root, slots }); account(a); return a; };
    const root = point(id, route.slots);
    const { wrappers, ports, expanded } = await collar().spine(root, { row, point, port: async (slot, at) => {
      const r = await row(at.node); let reference = null;
      if (r[0] === 0) {
        const frame = scope.at(-1 - r[2].index); demand(frame, 'unresolved original binder');
        const target = point(frame.node, route.slots.slice(0, frame.depth));
        reference = { relation: 'original-binder-use', use: at, target, label: 'Uses binder ' + frame.name + ' · e' + frame.node };
      }
      const kind = A.kinds[r[0]], text = reference ? scope.at(-1 - r[2].index).name : r[0] === 4 ? r[2].name : r[0] === 9 ? String(r[2].value) : kind;
      const label = String(text), port = { slot, address: at, kind, expanded: r[3], label: label.slice(0, 96), labelTruncated: label.length > 96, reference };
      account(port); return port;
    } });
    live();
    const data = { format: 'ProofAtlasApplicationCollar/1', rule: 'curried-application-ports/1', bindingKind: 'source-expression', index: null, root, wrappers, ports, arguments: ports.length - 1, expanded, originalContext: scope.length, application: wrappers.length > 0, typing: 'not-queried', sourceOnly: true, rowReads, delivery: e.delivery,
      scope: 'Original literal application fields and exact lexical root references. No normalization, inferred argument roles, internal typing or mathematical premise necessity. Composite endpoints retain uninspected inner references.' };
    const metadataBytes = new TextEncoder().encode(JSON.stringify(data)).length; demand(metadataBytes <= limits.metadataBytes, 'metadata bound');
    return { ...data, metadataBytes };
  }
  function notationAddress(origin, at) {
    demand(origin.namespace === 'source-expression' && same(identity(origin), identity(at)) && origin.typeRoot === at.route.root && origin.node === at.node && same(origin.slots, at.route.slots), 'preview source occurrence');
    return copy(at);
  }
  async function openNotation(owner, at, { signal } = {}) {
    const e = entry(owner); demand(at.namespace === 'source-expression' && same(identity(at), identity(e.record)), 'foreign preview source'); routeCheck(at.route, e);
    const P = node ? require('./proof-atlas-paged-notation') : host.ProofAtlasPagedNotation;
    const reader = P.open({ read: async (id, options = {}) => { e.live(); const row = await e.read(id, options.signal); e.live(); return row; }, nodeCount: e.record.uniqueNodes, roots: e.header.roots, owner: { namespace: 'source-expression', ...identity(e.record), typeRoot: at.route.root }, catalog: { format: 'ProofAtlasNotationCatalog/1', entries: [] }, context: [], signal });
    try { const scene = await reader.inspect(at.route.slots, { signal }); notationAddress(scene.root.origin, at); return { scene, state: reader.state, dispose: reader.dispose }; }
    catch (error) { reader.dispose(); throw error; }
  }
  let scripts = null;
  function ready() {
    if (!scripts) scripts = (async () => {
      for (const [name, url] of [['ProofAtlasApplicationCollar', '/public/js/proof-atlas-application-collar.js?v=2'], ['ProofAtlasTypeNotation', '/public/js/proof-atlas-type-notation.js'], ['ProofAtlasNotationRefinement', '/public/js/proof-atlas-notation-refinement.js'], ['ProofAtlasPagedNotation', '/public/js/proof-atlas-paged-notation.js'], ['ProofAtlasTypeNotationView', '/research/proof-atlas/type-notation/view.js']]) if (!host[name]) await new Promise((resolve, reject) => { const script = document.createElement('script'); script.src = url; script.onload = resolve; script.onerror = () => { script.remove(); reject(Error('Source application component unavailable')); }; document.head.append(script); });
      if (!document.querySelector('link[data-source-application-style]')) { const link = document.createElement('link'); link.rel = 'stylesheet'; link.href = '/public/css/proof-atlas-declaration-window.css'; link.dataset.sourceApplicationStyle = ''; document.head.append(link); }
    })().catch(error => { scripts = null; throw error; });
    return scripts;
  }
  function control(root, { prepare, isCurrent = () => true, onSource }) {
    const details = document.createElement('details'), summary = document.createElement('summary'), content = document.createElement('div'); details.className = 'dw-reader'; details.dataset.sourceApplication = ''; summary.textContent = 'Read ordered source application inputs'; details.append(summary, content); root.replaceChildren(details);
    let disposed = false, revision = 0, owner = null, view = null, loading = false, error = null;
    const live = () => !disposed && isCurrent();
    details.ontoggle = async () => {
      const request = ++revision; view?.dispose(); view = null; owner?.dispose(); owner = null; loading = false;
      if (!details.open || !live()) return; loading = true; error = null; content.textContent = 'Loading source application…';
      try {
        await ready(); if (!live() || request !== revision) return;
        const prepared = prepare(); owner = prepared.owner;
        view = collar().mount(content, { index: 'source', isCurrent: () => live() && request === revision, readModel: signal => read(owner, prepared.route, { signal }), openPreview: (at, signal) => openNotation(owner, at, { signal }), previewAddress: notationAddress, onField: at => onSource(at.node, at.route), onBinder: ref => onSource(ref.target.node, ref.target.route), resultLabel: value => 'Selected expression · e' + value.root.node, resultNote: 'Source structure; this join asserts no internal type judgment.' });
      } catch (failure) { if (live() && request === revision) { error = failure.message; content.textContent = 'Source application unavailable: ' + error; } }
      finally { if (live() && request === revision) loading = false; }
    };
    return { getScene: () => view?.state().data || null, getSelection: () => null, getState: () => ({ loading, error, ...view?.state() }), dispose: () => { if (disposed) return; disposed = true; revision++; view?.dispose(); owner?.dispose(); view = null; owner = null; root.replaceChildren(); } };
  }
  const api = { complete, paged, read, openNotation, notationAddress, control, limits };
  if (node) module.exports = api; else host.ProofAtlasSourceApplications = api;
})(typeof window === 'undefined' ? globalThis : window);
