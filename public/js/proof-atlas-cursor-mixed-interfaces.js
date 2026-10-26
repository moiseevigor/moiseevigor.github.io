/* Mixed context interfaces from bounded source and native type rows. */
'use strict';
(function(host) {
const node = typeof module !== 'undefined' && module.exports;
const P = node ? require('./proof-atlas-packed-routes') : host.ProofAtlasPackedRoutes;
const SP = node ? require('./proof-atlas-source-pages') : host.ProofAtlasSourcePages;
const Q = node ? require('./proof-atlas-construction-pages') : host.ProofAtlasConstructionPages;
const CM = node ? require('./proof-atlas-cursor-constructions') : host.ProofAtlasCursorConstructions;
const CF = node ? require('./proof-atlas-cursor-context-frame') : host.ProofAtlasCursorContextFrame;
const L = node ? require('./proof-atlas-cursor-local-definitions') : host.ProofAtlasCursorLocalDefinitions;
const A = node ? require('./proof-atlas-library-data') : host.ProofAtlasLibraryData;
const limits = Object.freeze({units:8,unitBytes:32768,frameBytes:524288,syntaxPairs:65536,typePages:1});
const demand = (ok,message) => {if (!ok) throw Error('Paged mixed interface: ' + message);};
const canonical = v => JSON.stringify(v,(_,x) => x && typeof x === 'object' && !Array.isArray(x) ? Object.fromEntries(Object.keys(x).sort().map(k => [k,x[k]])) : x);
const freeze = v => {if (v && typeof v === 'object' && !Object.isFrozen(v)) {Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
const same = (a,b) => a.root===b.root && a.depth===b.depth && a.slots===b.slots;
const bytes = v => new TextEncoder().encode(JSON.stringify(v)).length;
async function syntax(left,a,right,b,live) {
  const todo=[[a,b]],seen=new Set();
  while(todo.length){live();const[x,y]=todo.pop(),key=x+':'+y;if(seen.has(key))continue;
    demand(seen.size<limits.syntaxPairs,'syntax comparison bound; equality unavailable');seen.add(key);
    const g=await left(x),h=await right(y);live();
    if(g[0]!==h[0]||A.payloadKey(g[0],g[2])!==A.payloadKey(h[0],h[2])||g[1].length!==h[1].length)return false;
    g[1].forEach((id,i)=>todo.push([id,h[1][i]]));
  }return true;
}
function open(sourceCursor,queries,record,edition){
  const input=SP.identity(sourceCursor),identity=Q.identity(queries);
  demand(input.name===record.name&&identity.name===record.name&&input.indexSha256===record.indexSha256&&identity.indexSha256===record.indexSha256&&input.sourceSha256===record.sourceSha256&&identity.sourceSha256===record.sourceSha256&&typeof edition==='string','source/edition identity');
  const source=freeze({name:identity.name,indexSha256:identity.indexSha256,sourceGraphSha256:identity.sourceGraphSha256,edition,packetFile:record.indexFile});
  const context=CF.open(sourceCursor,queries),construction=CM.open(sourceCursor,queries),lets=L.open(sourceCursor,queries,record,edition),issued=new WeakSet();
  const stats={units:0,frames:0,peakTypeNodes:0,syntaxComparisons:0};
  function live(options={}){if(options.signal?.aborted)throw options.signal.reason||Error('aborted');SP.identity(sourceCursor);Q.identity(queries);}
  const sourceRead=(id,options)=>sourceCursor.run(()=>[sourceCursor.data.kind[id],sourceCursor.data.children[id],sourceCursor.data.payloads[id]],options);
  async function introduction(row,options){
    const rule=row.construction,owner=rule.entry,[domain,body]=rule.premises,n=owner.contextLength;
    demand(rule.rule==='Pi-introduction','recorded introduction');
    const actual=await construction.sourcePoint(owner.route,options),points=[];
    demand(actual.point.node===owner.node&&actual.point.scopeDepth===n&&actual.point.kind==='lam'&&actual.point.ports.length===2,'actual source lambda');
    for(const[i,p]of rule.premises.entries()){
      demand(p.node===actual.point.ports[i].node&&same(p.route,P.append(owner.route,[i])),'source field');
      const found=await construction.sourcePoint(p.route,options);demand(found.point.node===p.node&&found.point.scopeDepth===p.contextLength,'source field context');points.push(found.point);
    }
    demand(domain.contextLength===n&&body.contextLength===n+1,'prior and extended contexts');
    const payload=actual.data.payloads[owner.node],bundle=await queries.captionsFor(row,options);live(options);
    demand(bundle?.sourceHeader&&['conclusion','binderType','body'].every(f=>bundle.inferredTypes[f]),'origin-validated captions unavailable');
    let root,a,d,structuralEquality;
    const session=await queries.typeFor(row,'conclusion','kernel',{...options,pageLimit:limits.typePages});
    try{
      const g=session.cursor.table(session.observation).data;
      const read=id=>session.cursor.run(()=>[g.kind[id],g.children[id],g.payloads[id],g.neededScope[id]],options);
      root=owner.root;const top=await read(root);demand(top[0]===7,'recorded result Pi syntax required');[a,d]=top[1];
      demand(await syntax(id=>sourceRead(id,options),domain.node,read,a,()=>live(options)),'source/Pi domain');stats.syntaxComparisons++;
      demand(await syntax(read,rule.components.domainExpression,read,a,()=>live(options)),'recorded domain expression');stats.syntaxComparisons++;
      demand(await syntax(read,rule.components.expectedBody,read,d,()=>live(options)),'recorded expected codomain');stats.syntaxComparisons++;
      demand(payload.binderName===top[2].binderName&&payload.binderInfo===top[2].binderInfo,'source/Pi binder payload');
      demand((await read(d))[3]<=n+1&&(await read(body.typeRoot))[3]<=n+1,'body/codomain scope');
      structuralEquality=await syntax(read,body.typeRoot,read,rule.components.expectedBody,()=>live(options));stats.syntaxComparisons++;
      stats.peakTypeNodes=Math.max(stats.peakTypeNodes,session.cursor.state().peakCachedNodes);
    }finally{session.cursor.dispose();queries.releaseType(session.cursor);}
    live(options);
    const original=(p,expanded)=>({namespace:'original-source',route:p.route,node:p.node,contextLength:p.contextLength,expanded});
    const rootPoint=original(owner,actual.point.expanded),domainPoint=original(domain,points[0].expanded),bodyPoint=original(body,points[1].expanded);
    const binding={namespace:'original-source-context-extension',kind:'assumption',sourceBinder:rootPoint,name:payload.binderName,binderInfo:payload.binderInfo,from:n,to:n+1,countContribution:'0',variableRole:'not-recorded-by-this-interface'};
    const scope={sourceIndexSha256:source.indexSha256,length:n,binderRoute:owner.route};
    const typed=(field,typeRoot,anchor,length,caption)=>({namespace:'computed-native-type',field,evidenceSha256:owner.evidenceSha256,typeTableSha256:owner.typeTableSha256,root:typeRoot,context:{...scope,length,...(length===n+1?{extension:'selected-introduction'}:{})},sourceAnchor:anchor,caption});
    const recordedOwner={sourceIndexSha256:source.indexSha256,sourceRoute:owner.route,sourceNode:owner.node,contextLength:n,recording:rule.recording};
    const ports={
      domain:{...domainPoint,caption:bundle.sourceHeader},domainSort:typed('binderType',domain.typeRoot,domainPoint,n,bundle.inferredTypes.binderType),bodyType:typed('body',body.typeRoot,bodyPoint,n+1,bundle.inferredTypes.body),
      expectedBody:{namespace:'computed-native-expressions',component:'expectedBody',recordedOwner,evidenceSha256:owner.evidenceSha256,typeTableSha256:owner.typeTableSha256,root:rule.components.expectedBody,context:{sourceIndexSha256:source.indexSha256,length:n+1,sourceBinder:rootPoint,extension:'selected-introduction'},status:'recorded-expression-not-an-additional-typing-judgment'},
      codomain:{namespace:'computed-native-type',recordedOwner,evidenceSha256:owner.evidenceSha256,typeTableSha256:owner.typeTableSha256,root:d,enclosingRecordedTypeRoot:root,typeRoute:P.encode(0,[1]),context:{sourceIndexSha256:source.indexSha256,ambientLength:n,typeLocalBinders:1,mappedSourceContextLength:n+1,correspondence:'recorded-lambda-domain-to-Pi-binder'},status:'type-syntax-only'},
      conclusionType:typed('conclusion',root,rootPoint,n,bundle.inferredTypes.conclusion)};
    const binderCorrespondence={relation:'recorded-lambda-domain-to-Pi-binder',sourceBinder:rootPoint,typeBinder:{namespace:'computed-native-type',recordedOwner,evidenceSha256:owner.evidenceSha256,typeTableSha256:owner.typeTableSha256,root,typeRoute:P.encode(0,[])},expectedBodyRoot:rule.components.expectedBody,codomainRoot:d,sourceExtendedContextLength:n+1,ambientContextLength:n,countContribution:'0',scope:'The original lambda binder and computed Pi binder remain different objects. Expected D is interpreted under the source extension through this explicit correspondence.'};
    const regions=[{field:'binderType',...domainPoint},{field:'body',...bodyPoint}],hidden=regions.reduce((sum,p)=>sum+BigInt(p.expanded),0n);demand(hidden+1n===BigInt(rootPoint.expanded),'source partition');
    return freeze({format:'ProofAtlasIntroductionInterfacePrototype/1',source,root:rootPoint,rule:'Pi-introduction',wholeRole:owner.role,recording:rule.recording,evidenceFile:owner.evidenceFile,context:scope,binding,body:{...bodyPoint,role:body.role},ports,binderCorrespondence,
      bodyConversion:{actualRoot:body.typeRoot,expectedRoot:rule.components.expectedBody,structuralEquality,check:'kernelBodyConversion',status:rule.checks.kernelBodyConversion,contextLength:n+1,interpretation:'Apply the recorded source-lambda/Pi binder correspondence; the namespaces are not identified.',shareDisplay:false},
      resultRelation:{kind:'recorded-function-conversion',domainRoot:a,expectedCodomainRoot:rule.components.expectedBody,observedCodomainRoot:d,normalizedPiRoot:rule.components.pi,resultRoot:root,check:'kernelFunctionConversion',status:rule.checks.kernelFunctionConversion},
      nativeComponents:{namespace:'computed-native-expressions',evidenceSha256:owner.evidenceSha256,typeTableSha256:owner.typeTableSha256,roots:rule.components,status:'recorded-expressions-not-new-typing-judgments'},checks:rule.checks,partition:{retainedSourceConstructors:'1',regions,hidden:String(hidden),represented:rootPoint.expanded},
      scope:'One source lambda and its recorded typing interfaces. The native body type C and expected Pi codomain D remain distinct, including when convertible or structurally equal. No fresh variable judgment, namespace identification or new native check.'});
  }
  async function createUnit(route,options={}){
    live(options);const row=await queries.lookup(route,options);demand(row?.construction&&['Pi-introduction','let-binding'].includes(row.construction.rule),'recorded context unit');
    const u=row.construction.rule==='let-binding'?await lets.createUnit(route,options):await introduction(row,options);
    demand(bytes(u)<=limits.unitBytes,'unit metadata bound');live(options);stats.units++;return u;
  }
  async function create(route,options={}){
    live(options);const maxUnits=options.maxUnits??4;demand(Number.isInteger(maxUnits)&&maxUnits>=1&&maxUnits<=limits.units,'unit budget');
    const frame=await context.create(route,{...options,maxMembers:maxUnits}),units=[],joins=[];let prior;
    for(let i=0;i<frame.members.length;i++){
      const r=context.resolve(frame,{member:i}),u=await createUnit(r,options),row=await queries.lookup(r,options);units.push(u);
      if(i){const before=units[i-1],p=prior.construction.premises.at(-1),owner=row.construction.entry;demand(same(before.body.route,u.root.route)&&before.body.node===u.root.node&&before.body.contextLength===u.root.contextLength&&before.body.role===u.wholeRole&&p.typeFingerprint===owner.typeFingerprint,'exact actual body/next whole interface');joins.push({from:i-1,to:i,sourcePosition:u.root,parentActualBodyType:before.ports.bodyType,childConclusionType:u.ports.conclusionType,preservesDistinctOrigins:true});}prior=row;
    }
    const value=freeze({format:'ProofAtlasMixedInterfaceFramePrototype/1',source,root:units[0].root,options:{maxUnits},units,joins,frame,
      sourcePartition:{retained:frame.stats.retained,hidden:frame.stats.hidden,represented:frame.stats.represented,regions:[...frame.headers,frame.continuation].map(p=>({route:context.resolve(frame,p.address),node:p.node,contextLength:p.contextLength,expanded:p.expanded})),scope:'One disjoint context-frame cut; overlapping unit subtree sizes are not added.'},
      continuation:{...frame.continuation,route:context.resolve(frame,frame.continuation.address),stop:frame.stop},
      scope:'Finite composition through actual recorded body types. Pi expected codomains are separate conversion components, not replacements for actual body judgments. No new typing, reduction or comprehension result.'});
    demand(bytes(value)<=limits.frameBytes,'frame metadata bound');live(options);issued.add(value);stats.frames++;return value;
  }
  function resolve(scene,address){
    live();demand(issued.has(scene),'issued frame');
    if(Number.isInteger(address)){demand(address>=0&&address<scene.units.length,'unit');return scene.units[address].root.route;}
    demand(address&&Object.keys(address).every(k=>['unit','field'].includes(k))&&Number.isInteger(address.unit)&&address.unit>=0&&address.unit<scene.units.length,'unit address');
    const u=scene.units[address.unit],field=address.field||'conclusion',intro=u.rule==='Pi-introduction';
    demand((intro?['conclusion','binding','binderType','body']:['conclusion','binding','type','value','body']).includes(field),'source field');
    return ['conclusion','binding'].includes(field)?u.root.route:field==='binderType'?u.ports.domain.route:field==='type'?u.ports.declared.route:u[field].route;
  }
  async function typeFor(scene,address,observation='kernel',options={}){
    resolve(scene,address);demand(observation==='kernel'&&address.field!=='binding','recorded field observation');
    const row=await queries.lookup(scene.units[address.unit].root.route,options);demand(row?.construction,'missing construction');
    return queries.typeFor(row,address.field||'conclusion','kernel',options);
  }
  function releaseType(session){session?.cursor?.dispose();if(session?.cursor)queries.releaseType(session.cursor);}
  async function validate(scene,options={}){demand(scene?.format==='ProofAtlasMixedInterfaceFramePrototype/1'&&canonical(scene)===canonical(await create(scene.root.route,{...scene.options,signal:options.signal})),'changed source/type/origin correspondence');return true;}
  return Object.freeze({create,createUnit,resolve,typeFor,releaseType,sourcePoint:construction.sourcePoint,validate,source,state:()=>({...stats,letModel:lets.state(),activeTypeTables:queries.state().activeTypeTables})});
}
const api=Object.freeze({open,limits});if(node)module.exports=api;else host.ProofAtlasCursorMixedInterfaces=api;
})(typeof window==='undefined'?globalThis:window);
