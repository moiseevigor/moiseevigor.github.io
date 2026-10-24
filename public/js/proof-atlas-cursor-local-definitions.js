/* Local-definition interfaces from bounded original-source and native type rows. */
(function(host) {
'use strict';
const node = typeof module !== 'undefined' && module.exports;
const P = node ? require('./proof-atlas-packed-routes') : host.ProofAtlasPackedRoutes;
const SP = node ? require('./proof-atlas-source-pages') : host.ProofAtlasSourcePages;
const Q = node ? require('./proof-atlas-construction-pages') : host.ProofAtlasConstructionPages;
const CM = node ? require('./proof-atlas-cursor-constructions') : host.ProofAtlasCursorConstructions;
const CF = node ? require('./proof-atlas-cursor-context-frame') : host.ProofAtlasCursorContextFrame;
const A = node ? require('./proof-atlas-library-data') : host.ProofAtlasLibraryData;
const limits = Object.freeze({units:8, metadataBytes:524288, unitBytes:32768, syntaxPairs:65536, headFields:64, typePages:1});
const demand = (ok, message) => {if (!ok) throw Error('Cursor local definitions: ' + message);};
const freeze = v => {if (v && typeof v === 'object' && !Object.isFrozen(v)) {Object.values(v).forEach(freeze); Object.freeze(v);} return v;};
const canonical = v => JSON.stringify(v, (_, x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(k => [k,x[k]])) : x);
const same = (a,b) => a.root === b.root && a.depth === b.depth && a.slots === b.slots;
const byteLength = v => new TextEncoder().encode(JSON.stringify(v)).length;
async function syntax(left, a, right, b, live) {
  const todo = [[a,b]], seen = new Set();
  while (todo.length) {
    live(); const [x,y] = todo.pop(), key = x + ':' + y; if (seen.has(key)) continue;
    demand(seen.size < limits.syntaxPairs, 'syntax comparison limit; equality unavailable'); seen.add(key);
    const g = await left(x), h = await right(y); live();
    if (g[0] !== h[0] || A.payloadKey(g[0],g[2]) !== A.payloadKey(h[0],h[2]) || g[1].length !== h[1].length) return false;
    g[1].forEach((child,i) => todo.push([child,h[1][i]]));
  }
  return true;
}
function open(sourceCursor, queries, record, edition) {
  const input = SP.identity(sourceCursor), identity = Q.identity(queries);
  demand(input.name === record.name && identity.name === record.name && input.indexSha256 === record.indexSha256 && identity.indexSha256 === record.indexSha256 && input.sourceSha256 === record.sourceSha256 && identity.sourceSha256 === record.sourceSha256 && typeof edition === 'string', 'source/edition identity');
  const source = freeze({name:identity.name,indexSha256:identity.indexSha256,sourceGraphSha256:identity.sourceGraphSha256,edition,packetFile:record.indexFile});
  const construction = CM.open(sourceCursor, queries), context = CF.open(sourceCursor, queries), issued = new WeakSet();
  const stats = {units:0,frames:0,peakTypeNodes:0,syntaxComparisons:0};
  function live(options = {}) {if (options.signal?.aborted) throw options.signal.reason || Error('aborted'); SP.identity(sourceCursor); Q.identity(queries);}
  const sourceRead = (id, options) => sourceCursor.run(() => [sourceCursor.data.kind[id],sourceCursor.data.children[id],sourceCursor.data.payloads[id]], options);
  async function createUnit(route, options = {}) {
    live(options); const shareTypes = options.shareTypes ?? true; demand(typeof shareTypes === 'boolean', 'sharing policy');
    const row = await queries.lookup(route, options), c = row?.construction;
    demand(c?.rule === 'let-binding', 'recorded local definition at exact occurrence');
    const owner = c.entry, actual = await construction.sourcePoint(route, options), originalPoints = {};
    demand(actual.point.node === owner.node && actual.point.scopeDepth === owner.contextLength && actual.point.kind === 'letE' && actual.point.ports.length === 3, 'actual original let');
    for (const [slot, p] of c.premises.entries()) {
      demand(actual.point.ports[slot].node === p.node && same(p.route,P.append(route,[slot])), 'actual original field');
      const found = await construction.sourcePoint(p.route, options);
      demand(found.point.node === p.node && found.point.scopeDepth === p.contextLength, 'original premise/context'); originalPoints[p.field] = found.point;
    }
    const parts = Object.fromEntries(c.premises.map(p => [p.field,p]));
    demand(parts.type.contextLength === owner.contextLength && parts.value.contextLength === owner.contextLength && parts.body.contextLength === owner.contextLength + 1, 'prior and extended contexts');
    const payload = actual.data.payloads[owner.node];
    demand(payload.declName === c.contextExtension.binderName && payload.nondep === c.contextExtension.nondep, 'original definition payload');
    const bundle = await queries.captionsFor(row, options); live(options);
    demand(bundle?.sourceHeader && ['conclusion','type','value','body'].every(field => bundle.inferredTypes[field]), 'origin-validated local-definition captions unavailable');
    let sameType;
    const session = await queries.typeFor(row, 'conclusion', 'kernel', {...options,pageLimit:limits.typePages});
    try {
      const g = session.cursor.table(session.observation).data;
      const typeRead = id => session.cursor.run(() => [g.kind[id],g.children[id],g.payloads[id]], options);
      demand(await syntax(id => sourceRead(id,options), parts.type.node, typeRead, c.components.declaredType, () => live(options)), 'source-backed declared A'); stats.syntaxComparisons++;
      demand(await syntax(typeRead,c.components.declaredType,typeRead,c.components.expectedValueType,() => live(options)), 'expected value type is declared A'); stats.syntaxComparisons++;
      sameType = await syntax(typeRead,c.components.declaredType,typeRead,parts.value.typeRoot,() => live(options)); stats.syntaxComparisons++;
      stats.peakTypeNodes = Math.max(stats.peakTypeNodes,session.cursor.state().peakCachedNodes);
    } finally {session.cursor.dispose(); queries.releaseType(session.cursor);}
    live(options);
    const original = p => ({namespace:'original-source',route:p.route,node:p.node,contextLength:p.contextLength,expanded:p.expanded});
    const originalPart = p => original({...p,expanded:originalPoints[p.field].expanded});
    const root = original({route:owner.route,node:owner.node,contextLength:owner.contextLength,expanded:actual.point.expanded});
    const scope = {sourceIndexSha256:source.indexSha256,binderRoute:owner.route,length:owner.contextLength};
    const typed = (field, root, anchor) => ({namespace:'computed-native-type',field,evidenceSha256:owner.evidenceSha256,typeTableSha256:owner.typeTableSha256,root,
      context:field === 'body' ? {...scope,length:owner.contextLength + 1,extension:'selected-local-definition'} : scope,sourceAnchor:anchor});
    const header = bundle.sourceHeader, share = shareTypes && sameType;
    const ports = {
      declared:{...originalPart(parts.type),caption:header},
      valueType:{...typed('value',parts.value.typeRoot,originalPart(parts.value)),caption:bundle.inferredTypes.value},
      bodyType:{...typed('body',parts.body.typeRoot,originalPart(parts.body)),caption:bundle.inferredTypes.body},
      conclusionType:{...typed('conclusion',owner.root,root),caption:bundle.inferredTypes.conclusion}
    };
    let head = parts.value.node, headRow = await sourceRead(head, options); const fields = [];
    while (headRow[0] === 5 && fields.length < limits.headFields) {head = headRow[1][0]; fields.push(0); headRow = await sourceRead(head, options);}
    const headRoute = P.append(parts.value.route,fields), headPoint = await construction.sourcePoint(headRoute, options), binding = headPoint.point.binding;
    const binderName = binding ? (headPoint.data.payloads[binding.node].binderName ?? headPoint.data.payloads[binding.node].declName ?? '_') : null;
    const headLabel = headRow[0] === 4 ? headRow[2].name : headRow[0] === 0 ? 'Bound reference ' + binderName : 'Source constructor';
    const value = {...originalPart(parts.value),role:parts.value.role,head:{label:headLabel,node:head,route:headRoute,kind:headRow[0],applicationFields:fields.length,...(binding ? {binding} : {}),capped:headRow[0] === 5}};
    const body = {...originalPart(parts.body),role:parts.body.role};
    const regions = c.premises.map(p => ({field:p.field,...originalPart(p)})), hidden = regions.reduce((sum,p) => sum + BigInt(p.expanded),0n);
    demand(hidden + 1n === BigInt(root.expanded), 'original unit partition');
    const unit = freeze({format:'ProofAtlasLocalDefinitionUnitPrototype/1',source,root,options:{shareTypes},recording:c.recording,evidenceFile:owner.evidenceFile,context:scope,
      binding:{namespace:'original-source-context-extension',sourceBinder:root,name:c.contextExtension.binderName,nondep:c.contextExtension.nondep,from:owner.contextLength,to:owner.contextLength + 1,countContribution:'0',variableRole:'not-recorded-by-this-interface'},
      value,body,wholeRole:owner.role,ports,
      formulas:[{id:'A',ports:share ? ['declared','valueType'] : ['declared'],caption:header},...(!share ? [{id:'B',ports:['valueType'],caption:bundle.inferredTypes.value}] : []),{id:'C',ports:['bodyType'],caption:bundle.inferredTypes.body},{id:'R',ports:['conclusionType'],caption:bundle.inferredTypes.conclusion}],
      sharing:{requested:shareTypes,structuralEquality:sameType,active:share,scope:'One formula display; two original source/type ports remain distinct. The conclusion is never merged.'},
      relations:[{kind:'native-value-typing',from:'value',to:'valueType'},{kind:'native-value-conversion',from:'valueType',to:'declared',check:'kernelValueConversion'},{kind:'original-context-extension',from:'binding',to:'body',fromLength:owner.contextLength,toLength:owner.contextLength + 1},{kind:'recorded-let-result',from:'bodyType',to:'conclusionType',checks:['kernelTermConversion','kernelResultTyping','kernelResultTypeConversion','kernelSubstitutedTypeConversion']}],
      nativeComponents:{namespace:'computed-native-expressions',evidenceSha256:owner.evidenceSha256,typeTableSha256:owner.typeTableSha256,contextLength:owner.contextLength,roots:c.components,status:'recorded-expressions-not-new-typing-judgments'},checks:c.checks,
      partition:{retainedSourceConstructors:'1',regions,hidden:String(hidden),represented:root.expanded},scope:'View of one existing native let rule. No rewriting, invented variable judgment, new kernel check, semantic proof module or comprehension result.'});
    demand(byteLength(unit) <= limits.unitBytes, 'unit metadata byte bound'); stats.units++; return unit;
  }
  async function create(route, options = {}) {
    live(options); const maxUnits = options.maxUnits ?? 4;
    demand(Number.isInteger(maxUnits) && maxUnits >= 1 && maxUnits <= limits.units, 'unit budget');
    const first = await queries.lookup(route, options); demand(first?.construction?.rule === 'let-binding', 'recorded let at exact root');
    const candidate = await context.create(route, {...options,maxMembers:maxUnits}), other = candidate.members.findIndex(m => m.rule !== 'let-binding');
    demand(other !== 0, 'unsupported first unit'); const frame = other > 0 ? await context.create(route,{...options,maxMembers:other}) : candidate;
    const units = [], joins = []; let previousRecord = null;
    for (let i = 0; i < frame.members.length; i++) {
      const memberRoute = context.resolve(frame,{member:i}), unit = await createUnit(memberRoute,options), row = await queries.lookup(memberRoute,options); units.push(unit);
      if (i) {
        const before = units[i-1], part = previousRecord.construction.premises.at(-1), owner = row.construction.entry;
        demand(same(before.body.route,unit.root.route) && before.body.node === unit.root.node && before.body.contextLength === unit.root.contextLength && before.body.role === unit.wholeRole && part.typeFingerprint === owner.typeFingerprint, 'exact source and recorded typed interface');
        joins.push({from:i-1,to:i,sourcePosition:{route:unit.root.route,node:unit.root.node,contextLength:unit.root.contextLength},parentPort:before.ports.bodyType,childPort:unit.ports.conclusionType,relation:'same-original-source-typed-body',preservesDistinctNativeOrigins:true});
      }
      previousRecord = row;
    }
    const sourcePartition = {retained:frame.stats.retained,hidden:frame.stats.hidden,represented:frame.stats.represented,regions:[...frame.headers,frame.continuation].map(p => ({route:context.resolve(frame,p.address),node:p.node,contextLength:p.contextLength,expanded:p.expanded})),countScope:'One original context-frame cut. Individual unit subtrees overlap and are not added.'};
    const value = freeze({format:'ProofAtlasLocalDefinitionFramePrototype/1',source,root:units[0].root,options:{maxUnits},effectiveUnits:units.length,frame,units,joins,sourcePartition,
      continuation:{...frame.continuation,route:context.resolve(frame,frame.continuation.address),status:other > 0 ? 'unsupported-unit-rule' : frame.stop,availableRule:frame.continuation.availableRule},
      scope:'Composition of recorded let typing interfaces at exact original body positions. No combined reduction, new native judgment, semantic proof module or comprehension result.'});
    demand(byteLength(value) <= limits.metadataBytes,'frame metadata byte bound'); live(options); issued.add(value); stats.frames++; return value;
  }
  function accepted(scene) {live(); demand(issued.has(scene),'foreign frame');}
  function resolve(scene, address) {
    accepted(scene); demand(address && Object.keys(address).every(k => ['unit','field'].includes(k)) && Number.isInteger(address.unit) && address.unit >= 0 && address.unit < scene.units.length,'unit address');
    const u = scene.units[address.unit], field = address.field || 'conclusion'; demand(['conclusion','type','value','body','binding'].includes(field),'unit field');
    return field === 'type' ? u.ports.declared.route : ['conclusion','binding'].includes(field) ? u.root.route : u[field].route;
  }
  async function typeFor(scene, address, observation = 'kernel', options = {}) {
    resolve(scene,address); demand(observation === 'kernel' && address.field !== 'binding','recorded field observation');
    const row = await queries.lookup(scene.units[address.unit].root.route,options); demand(row?.construction?.rule === 'let-binding','missing construction');
    return queries.typeFor(row,address.field || 'conclusion','kernel',options);
  }
  async function validate(scene, options = {}) {demand(scene?.format === 'ProofAtlasLocalDefinitionFramePrototype/1' && canonical(scene) === canonical(await create(scene.root.route,{...scene.options,signal:options.signal})),'frame differs from original interfaces'); return true;}
  function releaseType(session) {session?.cursor?.dispose(); if (session?.cursor) queries.releaseType(session.cursor);}
  return Object.freeze({source,create,createUnit,resolve,typeFor,releaseType,validate,sourcePoint:construction.sourcePoint,state:() => ({...stats,activeTypeTables:queries.state().activeTypeTables})});
}
const api = Object.freeze({open,limits}); if (node) module.exports = api; else host.ProofAtlasCursorLocalDefinitions = api;
})(typeof window === 'undefined' ? globalThis : window);
