/* Native construction cuts. Original source paths and type namespaces stay distinct. */
(function(host){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 const A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,P=node?require('./proof-atlas-packed-routes'):host.ProofAtlasPackedRoutes;
 const T=node?require('./proof-atlas-deep-context'):host.ProofAtlasDeepContext,G=node?require('./proof-atlas-geometry-core'):host.ProofAtlasGeometry;
 const limits=Object.freeze({nodes:13,depth:4,metadataBytes:65536,addressSuffix:5});
 const demand=(v,m)=>{if(!v)throw Error('Construction cut: '+m);},key=r=>r.root+':'+r.depth+':'+r.slots;
 const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
 const canonical=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
 function resolveAddress(root,address){
  P.parse(root);demand(address&&typeof address==='object'&&!Array.isArray(address)&&Object.keys(address).every(k=>k==='prefixDepth'||k==='slots'),'address fields');
  const depth=address.prefixDepth??root.depth,slots=address.slots??[];
  demand(Number.isSafeInteger(depth)&&depth>=0&&depth<=root.depth&&Array.isArray(slots)&&slots.length<=limits.addressSuffix&&slots.every(s=>s===0||s===1)&&(slots.length===0||depth===root.depth),'original prefix/fields');
  return P.append(P.prefix(root,depth),slots);
 }
 function addressOf(root,route){
  P.parse(route);demand(route.root===root.root,'address source root');
  if(route.depth<root.depth){demand(key(P.prefix(root,route.depth))===key(route),'address ancestor');return {prefixDepth:route.depth};}
  demand(route.depth-root.depth<=limits.addressSuffix&&key(P.prefix(route,root.depth))===key(root),'address descendant');
  const bytes=P.parse(route),slots=[];for(let d=root.depth;d<route.depth;d++)slots.push((bytes[d>>2]>>((d%4)*2))&3);return{slots};
 }
 function open(nativeCase){
  const data=nativeCase.data,source=T.sourceIdentity(data,nativeCase.record),scenes=new WeakSet();
  function lookup(route){const e=nativeCase.get(route);if(!e)return null;demand(key(e.route)===key(route),'query at another occurrence');T.construction(e,data);return e;}
  const boundaryReason=(kind,typed)=>kind==='app'||kind==='lam'?'missing-construction-record':kind==='const'?'declaration-reference':kind==='bvar'?'context-reference':kind==='sort'||kind==='forallE'?'type-expression':typed?'typed-source-boundary':'unrecorded-source';
  function create(route,options={}){
   const maxNodes=options.maxNodes??7,maxDepth=options.maxDepth??3;
   demand(Number.isInteger(maxNodes)&&maxNodes>=1&&maxNodes<=limits.nodes&&Number.isInteger(maxDepth)&&maxDepth>=0&&maxDepth<=limits.depth,'display bounds');
   const selected=P.resolve(data,route),nodes=[],frontiers=[],edges=[],links=[],queue=[{route,entry:lookup(route),depth:0,parent:null,field:null,incoming:null}];
   const address=r=>addressOf(route,r);
   function reference(entry,root,contextRoute,recording){return{namespace:'computed-native-type',evidenceSha256:entry.evidenceSha256,...(entry.typeTableSha256?{typeTableSha256:entry.typeTableSha256}:{typeGraphSha256:entry.typeGraphSha256}),root,contextAddress:address(contextRoute),recordingQuery:address(recording?.queryRoute||entry.route),profile:entry.profile||'core-context-replay',...(recording?.stage?{stage:recording.stage}:{})};}
   function point(item,c){
    const actual=P.resolve(data,item.route),kind=A.kinds[data.kind[actual.node]],incoming=item.incoming,owner=incoming?.construction,part=incoming?.part;
    const own=c?.entry||(!incoming?item.entry:null),base=own||owner?.entry,role=own?.role||part?.role||'unknown',typeRoot=own?own.typeData.roots[0]:part?.typeRoot;
    const value={node:actual.node,address:address(item.route),kind,glyph:G.vocabulary[kind].glyph,role,contextLength:actual.scopeDepth,expanded:data.expanded[actual.node],depth:item.depth,parent:item.parent,field:item.field,
     ...(base?{typeReference:reference(base,typeRoot,item.route,own?c?.recording||base.recording:owner.recording),typeSource:{query:address(own?own.route:owner.entry.route),field:own?'conclusion':part.field,construction:own?!!c:true}}:{}),
     ...(own&&part?{premiseTypeReference:reference(owner.entry,part.typeRoot,item.route,owner.recording)}:{}),
     ...(part?.alternateTypeRoot!==undefined&&!T.expressionEqual(owner.entry.typeData,part.typeRoot,owner.entry.typeData,part.alternateTypeRoot)?{alternateTypeReference:reference(owner.entry,part.alternateTypeRoot,item.route,owner.recording),alternateTypeSource:{query:address(owner.entry.route),field:part.field,construction:true}}:{})};
    if(actual.binding)value.binding={namespace:'original-source-context',node:actual.binding.node,address:address(actual.binding.route),countContribution:'0'};
    return value;
   }
   while(queue.length){
    const item=queue.shift(),c=item.entry?T.construction(item.entry,data):null,p=point(item,c);let target;
    if(c&&nodes.length<maxNodes&&item.depth<=maxDepth){
     target={...p,id:'n'+nodes.length,rule:c.rule,recording:{kind:c.recording?.kind||'primary-query',query:address(c.recording?.queryRoute||c.entry.route),evidenceSha256:c.entry.evidenceSha256,...(c.recording?.stage?{stage:c.recording.stage}:{})},checks:c.checks};nodes.push(target);
     for(const part of c.premises){
      const candidate=lookup(part.route),child=candidate?T.construction(candidate,data):null;
      const compatible=!!child&&candidate.role===part.role&&candidate.contextLength===part.contextLength&&T.expressionEqual(c.entry.typeData,part.typeRoot,child.entry.typeData,child.entry.typeData.roots[0]);
      queue.push({route:part.route,entry:compatible?candidate:null,depth:item.depth+1,parent:target.id,field:part.field,incoming:{construction:c,part},withheld:!!child&&!compatible});
     }
    }else{
     target={...p,id:'f'+frontiers.length,boundaryReason:c?'display-boundary':item.withheld?'different-recorded-interface':boundaryReason(p.kind,!!p.typeReference),constructionAvailable:!!c};frontiers.push(target);
    }
    if(item.parent)edges.push({from:item.parent,to:target.id,field:item.field,relation:c?'native-premise-with-structural-type-agreement':'recorded-native-premise-boundary'});
    if(p.binding)links.push({from:target.id,...p.binding});
   }
   const hidden=frontiers.reduce((s,f)=>s+BigInt(f.expanded),0n);demand(BigInt(nodes.length)+hidden===BigInt(data.expanded[selected.node]),'source frontier partition');
   const scene=freeze({format:'ProofAtlasOccurrenceConstructionCut/1',addressing:'selected-source-relative/1',source,root:{node:selected.node,route},options:{maxNodes,maxDepth},nodes,frontiers,edges,links,
    stats:{retained:String(nodes.length),hidden:String(hidden),represented:data.expanded[selected.node]},scope:'Finite recorded native constructions. Source fields and computed types retain separate namespaces. Unrecorded rules and descendants remain boundaries.'});
   demand(new TextEncoder().encode(JSON.stringify(scene)).length<=limits.metadataBytes,'scene metadata bound');scenes.add(scene);return scene;
  }
  function validate(scene){demand(scene?.format==='ProofAtlasOccurrenceConstructionCut/1'&&canonical(create(scene.root.route,scene.options))===canonical(scene),'scene differs from original records');return true;}
  function point(scene,id){demand(scenes.has(scene),'foreign construction scene');const p=[...scene.nodes,...scene.frontiers].find(p=>p.id===id);demand(p,'point identity');return p;}
  function routeFor(scene,id){return resolveAddress(scene.root.route,point(scene,id).address);}
  async function typeFor(scene,id,observation='kernel'){
   const p=point(scene,id),origin=observation==='meta'?p.alternateTypeSource:p.typeSource;demand(origin,'no recorded type at this point');const e=lookup(resolveAddress(scene.root.route,origin.query));demand(e,'recorded type origin');
   if(!origin.construction){demand(observation==='kernel','no alternate observation');return e;}
   return T.constructionType(e,data,origin.field,observation);
  }
  return Object.freeze({create,validate,routeFor,typeFor,source,resolve:(scene,address)=>{demand(scenes.has(scene),'foreign construction scene');return resolveAddress(scene.root.route,address);}});
 }
 const api={open,resolveAddress,limits};if(node)module.exports=api;else host.ProofAtlasOccurrenceConstructions=api;
})(typeof window==='undefined'?globalThis:window);
