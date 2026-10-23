/* Optional captions annotate an existing cut; they never create source/type nodes. */
(function (host) {
  'use strict';
  const node = typeof module !== 'undefined' && module.exports;
  const Q = node ? require('./proof-atlas-construction-pages') : host.ProofAtlasConstructionPages;
  const P = node ? require('./proof-atlas-packed-routes') : host.ProofAtlasPackedRoutes;
  const issued = new WeakMap(), byteLimit = 262144, pointLimit = 193;
  const demand = (value, message) => { if (!value) throw Error('Construction captions: ' + message); };
  const key = route => route.root + ':' + route.depth + ':' + route.slots;
  function freeze(value) { if (value && typeof value === 'object' && !Object.isFrozen(value)) { Object.values(value).forEach(freeze); Object.freeze(value); } return value; }
  function points(model, scene) {
    if (scene.format === 'ProofAtlasOccurrenceContextFrame/1') {
      return [...scene.members.map((m, member) => ({...m, address: {member}})),
        ...scene.headers, scene.continuation].map(point => {
          const address = point.address, member = address.member === scene.members.length ? address.member - 1 : address.member;
          const recording = scene.members[member].recording;
          return {...point, id: JSON.stringify(address), route: model.resolve(scene, address),
            typeReference: {...scene.origins[point.type.origin], root: point.type.root},
            recordingRoute: P.append(P.prefix(scene.root.route, recording.query.prefixDepth), recording.query.slots), recordingStage: recording.stage,
            query: model.resolve(scene, {member}), field: address.member === scene.members.length ? 'body' : address.field || 'conclusion'};
        });
    }
    demand(/^ProofAtlas(OccurrenceConstructionCut|ApplicationSpineCut)\/[12]$/.test(scene.format), 'supported cut');
    return [...scene.nodes.map(p => p.members ? {...p.members.at(-1), ...p} : p), ...scene.frontiers]
      .map(point => ({...point, route: model.routeFor(scene, point.id),
        recordingRoute: point.typeReference?.recordingQuery ? model.resolve(scene, point.typeReference.recordingQuery) : null, recordingStage: point.typeReference?.stage,
        query: point.typeSource ? model.resolve(scene, point.typeSource.query) : null, field: point.typeSource?.construction ? point.typeSource.field : 'recorded'}));
  }
  async function prepare(queries, model, scene, {signal} = {}) {
    const live = () => { if (signal?.aborted) throw signal.reason || Error('aborted'); return Q.identity(queries); };
    const source = live();
    demand(source.name === scene.source.name && source.indexSha256 === scene.source.indexSha256 && source.sourceGraphSha256 === scene.source.sourceGraphSha256, 'original packet');
    const candidates = points(model, scene); demand(candidates.length <= pointLimit, 'displayed point bound');
    // Visit one recording at a time so the one-package cache is sufficient.
    // This changes only delivery order, never diagram order or source identity.
    const batches = new Map();
    for (const point of candidates) {
      const owner = point.query ? key(point.query) : 'unrecorded:' + point.id;
      if (!batches.has(owner)) batches.set(owner, []);
      batches.get(owner).push(point);
    }
    const captions = {}, errors = []; let missing = 0;
    for (const point of [...batches.values()].flat()) {
      live();
      if (!point.query) { missing++; continue; }
      try {
        const row = await queries.lookup(point.query, {signal}); live();
        if (!row || point.field !== 'recorded' && !row.construction) { missing++; continue; }
        const construction = row.construction, owner = point.field === 'recorded' ? row.typed : construction.entry;
        const part = point.field === 'recorded' ? row.typed : point.field === 'conclusion' ? owner : construction.premises.find(p => p.field === point.field);
        demand(part && key(part.route) === key(point.route) && part.node === point.node && part.contextLength === point.contextLength && part.role === point.role, 'selected original component');
        const reference = point.typeReference, root = ['recorded','conclusion'].includes(point.field) ? owner.root : part.typeRoot, recording = point.field === 'recorded' ? owner.recording : construction.recording;
        demand(reference?.evidenceSha256 === owner.evidenceSha256 && reference.typeTableSha256 === owner.typeTableSha256
          && reference.root === root && key(point.recordingRoute) === key(recording.queryRoute || owner.route)
          && (point.recordingStage ?? null) === (recording.stage ?? null), 'same recorded type and query');
        const bundle = point.field === 'recorded' ? null : await queries.captionsFor(row, {signal}); live();
        const originalHeader = point.field === 'binderType' || point.field === 'type';
        const caption = point.field === 'recorded' ? await queries.positionCaptionFor(row, {signal}) : originalHeader ? bundle?.sourceHeader : bundle?.inferredTypes[point.field]; live();
        if (!caption) { missing++; continue; }
        demand(caption.origin.sourceIndexSha256 === scene.source.indexSha256 && caption.origin.sourceNode === point.node && caption.origin.contextLength === point.contextLength, 'caption/source interface');
        demand(caption.category === (originalHeader ? 'recorded-source-expression' : 'recorded-inferred-type'), 'source expression versus inferred type');
        captions[point.id] = {text: caption.text, category: caption.category, originKey: caption.origin.originKey,
          presentation: caption.presentation, truncated: caption.truncatedByCaptionBudget, nativeTextMayElide: true};
      } catch (error) {
        live(); errors.push({id: point.id, message: String(error.message).slice(0, 240)});
      }
    }
    live();
    const body = {format: 'ProofAtlasConstructionCaptionPresentation/1', source: scene.source, root: scene.root, captions,
      counts: {shown: Object.keys(captions).length, missing, refused: errors.length}, errors};
    const decodedBytes = new TextEncoder().encode(JSON.stringify(body)).length; demand(decodedBytes <= byteLimit, 'presentation byte bound');
    const result = freeze({...body, decodedBytes, byteLimit}); issued.set(result, scene); return result;
  }
  function assertFor(presentation, scene) { demand(issued.get(presentation) === scene, 'foreign caption presentation'); return true; }
  const api = {prepare, assertFor, byteLimit, pointLimit};
  if (node) module.exports = api; else host.ProofAtlasConstructionCaptions = api;
})(typeof window === 'undefined' ? globalThis : window);
