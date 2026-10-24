/* Delivery contract checks; native correspondence is checked offline by frame.cjs. */
(function(host) {
'use strict';
const node = typeof module !== 'undefined' && module.exports;
const P = node ? require('./proof-atlas-packed-routes') : host.ProofAtlasPackedRoutes;
const limits = Object.freeze({manifestBytes: 4096, catalogBytes: 262144, frameBytes: 524288, starts: 64, units: 8, retainedFrames: 1});
const demand = (ok, message) => {if (!ok) throw Error('Definition frame: ' + message);};
const hex = v => typeof v === 'string' && /^[a-f0-9]{64}$/.test(v);
const natural = v => Number.isSafeInteger(v) && v >= 0;
const decimal = v => typeof v === 'string' && /^(0|[1-9][0-9]*)$/.test(v) && v.length <= 1024;
const same = (a, b) => a && b && a.root === b.root && a.depth === b.depth && a.slots === b.slots;
const point = (a, b) => same(a?.route, b?.route) && a.node === b.node && a.contextLength === b.contextLength;
const key = p => p.source.edition + ':' + p.source.indexSha256 + ':' + p.root.route.root + ':' + p.root.route.depth + ':' + p.root.route.slots;
const source = (a, b) => a && b && a.edition === b.edition && a.name === b.name && a.indexSha256 === b.indexSha256 && a.sourceGraphSha256 === b.sourceGraphSha256;
function route(r) {demand(r?.format === 'ProofAtlasPackedRoute/1', 'route format'); P.parse(r);}
function sourceCheck(s) {demand(typeof s?.name === 'string' && s.name.length <= 512 && typeof s.edition === 'string' && s.edition.length <= 80 && hex(s.indexSha256) && hex(s.sourceGraphSha256), 'source identity');}
function manifest(v, dataset) {
  demand(v?.format === 'ProofAtlasDefinitionFrameManifestPrototype/1' && v.dataset === dataset, 'manifest identity');
  demand(hex(v.sha256) && v.file === v.sha256 + '.catalog.json' && natural(v.bytes) && v.bytes > 0 && v.bytes <= limits.catalogBytes, 'catalog descriptor');
  for (const name of ['modelSha256', 'unitModelSha256', 'producerSha256']) demand(hex(v[name]), 'producer provenance');
  return v;
}
function catalog(v, dataset) {
  demand(v?.format === 'ProofAtlasDefinitionFrameCatalogPrototype/1' && v.dataset === dataset, 'catalog identity');
  demand(Array.isArray(v.starts) && v.starts.length > 0 && v.starts.length <= limits.starts, 'start bound');
  const seen = new Set();
  for (const start of v.starts) {
    sourceCheck(start.source); route(start.root?.route); demand(natural(start.root.node) && natural(start.root.contextLength), 'root identity');
    demand(!seen.has(key(start)), 'duplicate occurrence'); seen.add(key(start));
    demand(start.frames && Object.keys(start.frames).sort().join(',') === '4,8', 'available budgets');
    for (const budget of [4, 8]) {
      const d = start.frames[budget];
      demand(hex(d.sha256) && d.file === d.sha256 + '.frame.json' && natural(d.bytes) && d.bytes > 0 && d.bytes <= limits.frameBytes, 'frame descriptor');
      demand(Number.isInteger(d.units) && d.units > 0 && d.units <= budget && typeof d.stop === 'string', 'frame summary');
    }
  }
  return v;
}
function next(catalog, v) {
  if (v.continuation.status !== 'member-budget' || v.continuation.availableRule !== 'let-binding' || !v.continuation.compatible) return null;
  return catalog.starts.find(s => source(s.source, v.source) && point(s.root, v.continuation)) || null;
}
function frame(v, catalog, start, budget) {
  demand(v?.format === 'ProofAtlasLocalDefinitionFramePrototype/1' && source(v.source, start.source) && point(v.root, start.root), 'frame source selection');
  demand(v.options?.maxUnits === budget && [4, 8].includes(budget), 'frame budget');
  demand(Array.isArray(v.units) && v.units.length === start.frames[budget].units && v.units.length > 0 && v.units.length <= budget && v.effectiveUnits === v.units.length, 'unit inventory');
  demand(v.joins?.length === v.units.length - 1, 'join count');
  for (const [i, u] of v.units.entries()) {
    demand(u.format === 'ProofAtlasLocalDefinitionUnitPrototype/1' && source(u.source, v.source), 'unit source');
    demand(same(u.root.route, P.append(v.root.route, Array(i).fill(2))) && u.context.length === v.root.contextLength + i && u.root.contextLength === u.context.length, 'ordered source context');
    const n = u.context.length;
    demand(u.binding.namespace === 'original-source-context-extension' && point(u.binding.sourceBinder, u.root) && u.binding.from === n && u.binding.to === n + 1 && u.binding.variableRole === 'not-recorded-by-this-interface', 'context extension');
    for (const [name, slot] of [['declared', 0], ['value', 1], ['body', 2]]) {
      const p = name === 'declared' ? u.ports.declared : u[name];
      demand(p.namespace === 'original-source' && same(p.route, P.append(u.root.route, [slot])) && p.contextLength === n + (slot === 2 ? 1 : 0) && natural(p.node), 'ordered source field');
    }
    for (const name of ['valueType', 'bodyType', 'conclusionType']) {
      const p = u.ports[name]; demand(p.namespace === 'computed-native-type' && hex(p.evidenceSha256) && hex(p.typeTableSha256) && natural(p.root) && p.context.length === n + (name === 'bodyType' ? 1 : 0), 'recorded type origin');
      demand(point(p.sourceAnchor, name === 'valueType' ? u.value : name === 'bodyType' ? u.body : u.root), 'recorded type source anchor');
    }
    demand(['value', 'type', 'proof'].includes(u.value.role) && ['value', 'type', 'proof'].includes(u.wholeRole), 'own recorded roles');
    for (const name of ['declared', 'valueType', 'bodyType', 'conclusionType']) demand(typeof u.ports[name].caption?.text === 'string' && typeof u.ports[name].caption.origin?.originKey === 'string', 'caption origin');
    if (i) {
      const parent = v.units[i - 1], j = v.joins[i - 1];
      demand(point(parent.body, u.root) && parent.body.role === u.wholeRole && j.from === i - 1 && j.to === i && point(j.sourcePosition, u.root), 'exact join source');
      demand(j.relation === 'same-original-source-typed-body' && j.preservesDistinctNativeOrigins === true, 'join relation');
      demand(JSON.stringify(j.parentPort) === JSON.stringify(parent.ports.bodyType) && JSON.stringify(j.childPort) === JSON.stringify(u.ports.conclusionType), 'distinct exact join origins');
      demand(j.parentPort.caption.origin.originKey !== j.childPort.caption.origin.originKey, 'collapsed native origin');
    }
  }
  demand(v.continuation.status === start.frames[budget].stop && point(v.units.at(-1).body, v.continuation), 'exact continuation');
  const p = v.sourcePartition;
  demand(decimal(p.retained) && decimal(p.hidden) && decimal(p.represented) && BigInt(p.retained) === BigInt(v.units.length) && BigInt(p.retained) + BigInt(p.hidden) === BigInt(p.represented), 'source accounting');
  demand(p.regions?.length === 2 * v.units.length + 1, 'source region inventory');
  const regions = v.units.flatMap(u => [u.partition.regions[0], u.partition.regions[1]]).concat(v.units.at(-1).body);
  demand(p.regions.every((r, i) => point(r, regions[i]) && r.expanded === regions[i].expanded && decimal(r.expanded)), 'exact disjoint regions');
  demand(p.regions.reduce((sum, r) => sum + BigInt(r.expanded), 0n) === BigInt(p.hidden), 'hidden accounting');
  if (v.continuation.status === 'member-budget') demand(v.continuation.compatible && next(catalog, v), 'missing continuation record');
  return v;
}
const api = Object.freeze({limits, manifest, catalog, frame, next, key, same, source, point});
if (node) module.exports = api; else host.ProofAtlasDefinitionFrameDelivery = api;
})(typeof window === 'undefined' ? globalThis : window);
