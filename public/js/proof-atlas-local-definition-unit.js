/* Local research model: a typing interface over an unchanged native let record. */
(function(host) {
'use strict';
const node = typeof module !== 'undefined' && module.exports;
const T = node ? require('./proof-atlas-deep-context') : host.ProofAtlasDeepContext;
const P = node ? require('./proof-atlas-packed-routes') : host.ProofAtlasPackedRoutes;
const C = node ? require('./proof-atlas-recorded-captions') : host.ProofAtlasRecordedCaptions;
const limits = Object.freeze({metadataBytes: 32768, headFields: 64});
const demand = (ok, message) => {if (!ok) throw Error('Local definition unit: ' + message);};
const canonical = value => JSON.stringify(value, (_, v) => v && typeof v === 'object' && !Array.isArray(v)
  ? Object.fromEntries(Object.keys(v).sort().map(k => [k, v[k]])) : v);
const freeze = value => {if (value && typeof value === 'object' && !Object.isFrozen(value)) {
  Object.values(value).forEach(freeze); Object.freeze(value);
} return value;};
function open(nativeCase, captions, edition) {
  demand(typeof captions.create === 'function' && typeof edition === 'string', 'explicit inputs');
  const data = nativeCase.data, source = {...T.sourceIdentity(data, nativeCase.record), edition, packetFile: nativeCase.record.indexFile};
  const issued = new WeakSet();
  async function create(entry, {shareTypes = true} = {}) {
    demand(typeof shareTypes === 'boolean', 'sharing policy');
    const construction = T.construction(entry, data);
    demand(construction?.rule === 'let-binding', 'checked local definition required');
    const owner = construction.entry, parts = Object.fromEntries(construction.premises.map(p => [p.field, p]));
    const g = owner.typeData, bundle = await captions.create(entry);
    const normalized = {...construction, entry: {...owner, root: g.roots[0]}};
    const header = bundle.sourceHeader;
    await C.validate(header, C.origin(source, normalized, 'type', 'recorded-source-expression'));
    for (const field of ['conclusion', 'type', 'value', 'body']) {
      demand(bundle.inferredTypes[field], 'recorded component caption');
      await C.validate(bundle.inferredTypes[field], C.origin(source, normalized, field));
    }
    demand(T.expressionEqual(data, parts.type.node, g, construction.components.declaredType), 'source-backed declared A');
    demand(T.expressionEqual(g, construction.components.declaredType, g, construction.components.expectedValueType), 'native expected value type is declared A');
    demand(parts.type.contextLength === owner.contextLength && parts.value.contextLength === owner.contextLength
      && parts.body.contextLength === owner.contextLength + 1, 'prior and extended contexts');
    const sameType = T.expressionEqual(g, construction.components.declaredType, g, parts.value.typeRoot);
    const share = shareTypes && sameType;
    const context = {sourceIndexSha256: source.indexSha256, binderRoute: owner.route, length: owner.contextLength};
    const original = point => ({namespace: 'original-source', route: point.route, node: point.node,
      contextLength: point.contextLength, expanded: data.expanded[point.node]});
    const typed = (field, root, point) => ({namespace: 'computed-native-type', field,
      evidenceSha256: owner.evidenceSha256, typeTableSha256: owner.typeTableSha256, root,
      context: field === 'body' ? {...context, length: owner.contextLength + 1, extension: 'selected-local-definition'} : context,
      sourceAnchor: original(point)});
    const conclusionPoint = {route: owner.route, node: owner.node, contextLength: owner.contextLength};
    const ports = {
      declared: {...original(parts.type), caption: header},
      valueType: {...typed('value', parts.value.typeRoot, parts.value), caption: bundle.inferredTypes.value},
      bodyType: {...typed('body', parts.body.typeRoot, parts.body), caption: bundle.inferredTypes.body},
      conclusionType: {...typed('conclusion', g.roots[0], conclusionPoint), caption: bundle.inferredTypes.conclusion}
    };
    const slots = []; let head = parts.value.node;
    while (data.kind[head] === 5 && slots.length < limits.headFields) {head = data.children[head][0]; slots.push(0);}
    const headRoute=P.append(parts.value.route,slots), binding=P.resolve(data,headRoute).binding;
    const binderName=binding?(data.payloads[binding.node].binderName??data.payloads[binding.node].declName??'_'):null;
    const headLabel = data.kind[head] === 4 ? data.payloads[head].name : data.kind[head] === 0 ? 'Bound reference '+binderName : 'Source constructor';
    const value = {...original(parts.value), role: parts.value.role, head: {label: headLabel, node: head,
      route: headRoute, kind: data.kind[head], applicationFields: slots.length, ...(binding?{binding}:{}), capped: data.kind[head] === 5}};
    const body = {...original(parts.body), role: parts.body.role};
    const formulas = [{id: 'A', ports: share ? ['declared', 'valueType'] : ['declared'], caption: header},
      ...(!share ? [{id: 'B', ports: ['valueType'], caption: bundle.inferredTypes.value}] : []),
      {id: 'C', ports: ['bodyType'], caption: bundle.inferredTypes.body},
      {id: 'R', ports: ['conclusionType'], caption: bundle.inferredTypes.conclusion}];
    const regions = construction.premises.map(p => ({field: p.field, ...original(p)}));
    const hidden = regions.reduce((s, p) => s + BigInt(p.expanded), 0n);
    demand(hidden + 1n === BigInt(data.expanded[owner.node]), 'exact original source partition');
    const unit = freeze({format: 'ProofAtlasLocalDefinitionUnitPrototype/1', source,
      root: original(conclusionPoint), options: {shareTypes}, recording: construction.recording, evidenceFile: owner.evidenceFile,
      context, binding: {namespace: 'original-source-context-extension', sourceBinder: original(conclusionPoint),
        name: construction.contextExtension.binderName, nondep: construction.contextExtension.nondep,
        from: owner.contextLength, to: owner.contextLength + 1, countContribution: '0', variableRole: 'not-recorded-by-this-interface'},
      value, body, wholeRole: owner.role, ports, formulas,
      sharing: {requested: shareTypes, structuralEquality: sameType, active: share,
        scope: 'One formula display; two original source/type ports remain distinct. The conclusion is never merged.'},
      relations: [
        {kind: 'native-value-typing', from: 'value', to: 'valueType'},
        {kind: 'native-value-conversion', from: 'valueType', to: 'declared', check: 'kernelValueConversion'},
        {kind: 'original-context-extension', from: 'binding', to: 'body', fromLength: owner.contextLength, toLength: owner.contextLength + 1},
        {kind: 'recorded-let-result', from: 'bodyType', to: 'conclusionType', checks: ['kernelTermConversion', 'kernelResultTyping', 'kernelResultTypeConversion', 'kernelSubstitutedTypeConversion']}
      ], nativeComponents: {namespace: 'computed-native-expressions', evidenceSha256: owner.evidenceSha256, typeTableSha256: owner.typeTableSha256, contextLength: owner.contextLength, roots: construction.components, status: 'recorded-expressions-not-new-typing-judgments'}, checks: construction.checks,
      partition: {retainedSourceConstructors: '1', regions, hidden: String(hidden), represented: data.expanded[owner.node]},
      scope: 'View of one existing native let rule. No rewriting, invented variable judgment, new kernel check, semantic proof module or comprehension result.'});
    demand(new TextEncoder().encode(JSON.stringify(unit)).length <= limits.metadataBytes, 'metadata bound');
    issued.add(unit); return unit;
  }
  async function validate(unit, entry) {
    demand(unit?.format === 'ProofAtlasLocalDefinitionUnitPrototype/1', 'unit format');
    demand(canonical(unit) === canonical(await create(entry, unit.options)), 'unit differs from accepted source/type records');
    return true;
  }
  function port(unit, id) {demand(issued.has(unit), 'foreign unit'); demand(unit.ports[id], 'port identity'); return unit.ports[id];}
  return Object.freeze({create, validate, port, source});
}
const api = Object.freeze({open, limits});
if (node) module.exports = api; else host.ProofAtlasLocalDefinitionUnit = api;
})(typeof window === 'undefined' ? globalThis : window);
