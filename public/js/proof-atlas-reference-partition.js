/* Project authenticated binder totals onto an already source-validated cut.
   The caller owns source authentication and lexical-link validation. */
(function(host) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const A = node ? require('./proof-atlas-library-data') : host.ProofAtlasLibraryData;
  const P = node ? require('./proof-atlas-packed-routes') : host.ProofAtlasPackedRoutes;
  const limits = Object.freeze({retained: 32, frontiers: 65, bytes: 8388608, countDigits: 16384});
  const copy = x => JSON.parse(JSON.stringify(x));
  const freeze = x => {if (x && typeof x === 'object' && !Object.isFrozen(x)) {Object.values(x).forEach(freeze); Object.freeze(x);} return x;};
  const demand = (v, m) => {if (!v) throw Error('Reference partition: ' + m);};
  const natural = x => Number.isSafeInteger(x) && x >= 0;
  const hash = x => typeof x === 'string' && /^[a-f0-9]{64}$/.test(x);
  const key = r => r.root + ':' + r.depth + ':' + r.slots;
  const same = (a, b) => key(a) === key(b);
  const prefix = (a, b) => a.root === b.root && a.depth <= b.depth && same(a, P.prefix(b, a.depth));
  const amount = s => {
    demand(typeof s === 'string' && s.length <= limits.countDigits && /^(0|[1-9][0-9]*)$/.test(s), 'exact count');
    return BigInt(s);
  };
  const arity = [0, 0, 0, 0, 0, 2, 2, 2, 3, 0, 1, 1];

  function normalize(scene) {
    const raw = scene?.format === 'ProofAtlasOccurrenceWindow/1';
    const framed = ['ProofAtlasMixedInterfaceFramePrototype/1', 'ProofAtlasLocalDefinitionFramePrototype/1'].includes(scene?.format);
    demand(raw || framed, 'supported exact source cut');
    const source = scene.source;
    demand(typeof source?.name === 'string' && source.name.length <= 4096 && hash(source.indexSha256) &&
      hash(raw ? source.sourceSha256 : source.sourceGraphSha256), 'source identity');
    const retained = raw ? scene.nodes : scene.units;
    demand(Array.isArray(retained) && retained.length > 0 && retained.length <= limits.retained, 'retained bound');
    if (raw) for (const n of retained) demand(Array.isArray(n.ports) && n.ports.length <= 3, 'source field bound');
    const points = retained.map(n => raw ? {
      node: n.node, kind: n.kind, route: n.route, expanded: n.expanded,
      ...(n.binding ? {binding: {node: n.binding.node, route: n.binding.route}} : {})
    } : {
      node: n.root.node, kind: n.format === 'ProofAtlasIntroductionInterfacePrototype/1' ? 'lam' :
        n.format === 'ProofAtlasLocalDefinitionUnitPrototype/1' ? 'letE' : 'unsupported',
      route: n.root.route, expanded: n.root.expanded
    });
    const frontiers = raw ? scene.nodes.flatMap(n => n.ports.filter(p => !p.displayed)) : scene.sourcePartition.regions;
    demand(Array.isArray(frontiers) && frontiers.length <= limits.frontiers, 'frontier bound');
    P.parse(scene.root.route);
    for (const p of [...points, ...frontiers]) {P.parse(p.route); amount(p.expanded); if (p.binding) P.parse(p.binding.route);}
    const result = {source: {name: source.name, indexSha256: source.indexSha256,
      ...(raw ? {sourceSha256: source.sourceSha256} : {sourceGraphSha256: source.sourceGraphSha256, edition: source.edition})},
      viewFormat: scene.format, root: scene.root.route,
      retained: points, frontiers: frontiers.map(p => ({node: p.node, route: p.route, expanded: p.expanded})),
      represented: raw ? scene.stats.represented : scene.sourcePartition.represented};
    demand(new TextEncoder().encode(JSON.stringify(result)).length <= limits.bytes, 'cut metadata bound');
    return copy(result);
  }

  async function open(scene, {signal} = {}) {
    let disposed = false;
    const live = () => {demand(!disposed, 'disposed'); if (signal?.aborted) throw signal.reason || Error('Reference partition cancelled');};
    live(); let cut = normalize(scene); const positions = new Map(), kept = new Map();
    P.parse(cut.root);
    for (const [rows, retained] of [[cut.retained, true], [cut.frontiers, false]]) for (const p of rows) {
      P.parse(p.route); demand(natural(p.node) && p.node < P.limits.sourceNodes && prefix(cut.root, p.route), 'original cut position');
      const k = key(p.route); demand(!positions.has(k), 'duplicate source position');
      demand(amount(p.expanded) > 0n, 'positive source mass');
      if (retained) {
        demand(A.kinds.includes(p.kind), 'retained constructor');
        kept.set(k, p);
        if (p.binding) {
          demand(p.kind === 'bvar' && natural(p.binding.node), 'original binding relation'); P.parse(p.binding.route);
        }
      }
      positions.set(k, p);
    }
    demand(kept.has(key(cut.root)), 'retained cut root');
    for (const p of positions.values()) if (!same(p.route, cut.root)) {
      demand(kept.has(key(P.prefix(p.route, p.route.depth - 1))), 'hidden overlap or unretained parent');
    }
    for (const p of kept.values()) {
      let mass = 1n;
      for (let slot = 0; slot < arity[A.kinds.indexOf(p.kind)]; slot++) {
        const child = positions.get(key(P.append(p.route, [slot])));
        demand(child && child.node < p.node, 'complete ordered source fields'); mass += amount(child.expanded);
      }
      demand(mass === amount(p.expanded), 'constructor occurrence partition');
    }
    const mass = BigInt(cut.retained.length) + cut.frontiers.reduce((n, f) => n + amount(f.expanded), 0n);
    demand(mass === amount(cut.represented) && mass === amount(kept.get(key(cut.root)).expanded), 'whole cut partition');
    const derivationSha256 = await A.digest(new TextEncoder().encode(JSON.stringify(cut))); live();
    return Object.freeze({
      forAnnotation(annotation) {
        live(); demand(annotation?.format === 'ProofAtlasSyntaxMultiplicityAnnotation/1' && annotation.status === 'complete', 'complete authenticated total required');
        demand(annotation.source.name === cut.source.name && annotation.source.indexSha256 === cut.source.indexSha256 && hash(annotation.manifestSha256) && hash(annotation.modelSha256), 'same original count source');
        P.parse(annotation.route); P.parse(annotation.body.route);
        const binder = kept.get(key(annotation.route));
        demand(binder && ['lam', 'forallE', 'letE'].includes(binder.kind) && binder.kind === annotation.kind && binder.node === annotation.node, 'retained original binder');
        const bodyRoute = P.append(binder.route, [binder.kind === 'letE' ? 2 : 1]), body = positions.get(key(bodyRoute));
        demand(body && same(bodyRoute, annotation.body.route) && body.node === annotation.body.node, 'complete original body region');
        let exposed = 0n;
        for (const p of kept.values()) if (p.kind === 'bvar' && prefix(bodyRoute, p.route) && p.binding &&
          p.binding.node === binder.node && same(p.binding.route, binder.route)) exposed++;
        const total = amount(annotation.count); demand(exposed <= total && total <= amount(body.expanded), 'body reference mass');
        return freeze({format: 'ProofAtlasReferencePartition/1', source: copy(cut.source),
          binder: {node: binder.node, kind: binder.kind, route: copy(binder.route)},
          body: {node: body.node, route: copy(bodyRoute)}, cutRoot: copy(cut.root), viewFormat: cut.viewFormat,
          rule: 'source-reference-cut-partition/1', cutDerivationSha256: derivationSha256,
          countManifestSha256: annotation.manifestSha256, countModelSha256: annotation.modelSha256,
          total: String(total), exposed: String(exposed), folded: String(total - exposed),
          countContribution: '0', typing: 'not-queried',
          scope: 'Retained source-variable occurrences plus references in folded original body regions. '
            + 'Conditional on a source-validated cut/lexical links and an authenticated exact total. '
            + 'Decoded previews are not retained constructors; no premise necessity or new typing.'});
      },
      state: () => ({disposed, retained: cut?.retained.length || 0, frontiers: cut?.frontiers.length || 0,
        cutDerivationSha256: derivationSha256, sourceRowsFetched: 0, nativeTypesInferred: 0}),
      dispose() {disposed = true; positions.clear(); kept.clear(); cut = null;}
    });
  }
  const api = Object.freeze({open, limits});
  if (node) module.exports = api; else host.ProofAtlasReferencePartition = api;
})(typeof window === 'undefined' ? globalThis : window);
