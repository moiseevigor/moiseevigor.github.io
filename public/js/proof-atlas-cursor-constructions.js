/* Construction cuts from bounded native records and original source rows. */
(function(host){
'use strict';
const node=typeof module!=='undefined'&&module.exports,A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,P=node?require('./proof-atlas-packed-routes'):host.ProofAtlasPackedRoutes,CW=node?require('./proof-atlas-cursor-window'):host.ProofAtlasCursorWindow,SP=node?require('./proof-atlas-source-pages'):host.ProofAtlasSourcePages,Q=node?require('./proof-atlas-construction-pages'):host.ProofAtlasConstructionPages,G=node?require('./proof-atlas-geometry-core'):host.ProofAtlasGeometry;
const key=r=>r.root+':'+r.depth+':'+r.slots,demand=(v,m)=>{if(!v)throw Error('Cursor constructions: '+m);},freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
function addressOf(root,route){P.parse(route);demand(route.root===root.root,'address source root');if(route.depth<root.depth){demand(key(P.prefix(root,route.depth))===key(route),'address ancestor');return{prefixDepth:route.depth};}demand(route.depth-root.depth<=5&&key(P.prefix(route,root.depth))===key(root),'address fields');const bytes=P.parse(route),slots=[];for(let i=root.depth;i<route.depth;i++)slots.push((bytes[i>>2]>>((i%4)*2))&3);return{slots};}
function resolve(root,address,version){demand(address&&Object.keys(address).every(k=>k==='prefixDepth'||k==='slots'),'address shape');const depth=address.prefixDepth??root.depth,slots=address.slots??[];demand(Number.isSafeInteger(depth)&&depth>=0&&depth<=root.depth&&Array.isArray(slots)&&slots.length<=5&&slots.every(s=>s===0||s===1||version===2&&s===2)&&(!slots.length||depth===root.depth),'address bounds');return P.append(P.prefix(root,depth),slots);}
function open(sourceCursor,queries){
 const sourceIdentity=SP.identity(sourceCursor),identity=Q.identity(queries);demand(sourceIdentity.name===identity.name&&sourceIdentity.indexSha256===identity.indexSha256&&sourceIdentity.sourceSha256===identity.sourceSha256,'source identity');
 const source={name:identity.name,indexSha256:identity.indexSha256,sourceGraphSha256:identity.sourceGraphSha256},version=identity.version,windows=CW.open(sourceCursor),scenes=new WeakSet();
 const boundaryReason=(kind,typed)=>['app','lam','letE'].includes(kind)?'missing-construction-record':kind==='const'?'declaration-reference':kind==='bvar'?'context-reference':['sort','forallE'].includes(kind)?'type-expression':typed?'typed-source-boundary':'unrecorded-source';
 async function create(input,options={}){
  const route=freeze(JSON.parse(JSON.stringify(input))),maxNodes=options.maxNodes??7,maxDepth=options.maxDepth??3;P.parse(route);demand(Number.isInteger(maxNodes)&&maxNodes>=1&&maxNodes<=13&&Number.isInteger(maxDepth)&&maxDepth>=0&&maxDepth<=4,'display bounds');
  const live=()=>{if(options.signal?.aborted)throw options.signal.reason||Error('aborted');SP.identity(sourceCursor);Q.identity(queries);},address=r=>addressOf(route,r);
  async function actual(r){live();const scene=await windows.create(r,{maxNodes:1,maxDepth:0,signal:options.signal}),point=scene.nodes[0];return{...point,bindingKind:point.binding?windows.snapshot(scene).kind[point.binding.node]:null};}
  const selected=await actual(route),nodes=[],frontiers=[],edges=[],links=[],queue=[{route,record:await queries.lookup(route,options),depth:0,parent:null,field:null,incoming:null}];
  function reference(entry,root,contextRoute,recording){return{namespace:'computed-native-type',evidenceSha256:entry.evidenceSha256,typeTableSha256:entry.typeTableSha256,root,contextAddress:address(contextRoute),recordingQuery:address(recording?.queryRoute||entry.route),profile:entry.profile,...(recording?.stage?{stage:recording.stage}:{})};}
  while(queue.length){
   live();const item=queue.shift(),c=item.record?.construction,found=await actual(item.route),own=c?.entry||(!item.incoming?item.record?.typed:null),owner=item.incoming?.construction,part=item.incoming?.part,base=own||owner?.entry,role=own?.role||part?.role||'unknown',root=own?own.root:part?.typeRoot;
   const expected=own||part;if(expected)demand(found.node===expected.node&&found.scopeDepth===expected.contextLength&&key(item.route)===key(expected.route),'actual source interface');
   if(c){demand(found.kind===({'Pi-introduction':'lam','Pi-application':'app','let-binding':'letE'})[c.rule]&&found.ports.length===c.premises.length,'actual construction fields');for(const [slot,p]of c.premises.entries())demand(p.node===found.ports[slot].node,'actual premise source');}
   const point={node:found.node,address:address(item.route),kind:found.kind,glyph:G.vocabulary[found.kind].glyph,role,contextLength:found.scopeDepth,expanded:found.expanded,depth:item.depth,parent:item.parent,field:item.field,
    ...(base?{typeReference:reference(base,root,item.route,own?c?.recording||base.recording:owner.recording),typeSource:{query:address(own?own.route:owner.entry.route),field:own?'conclusion':part.field,construction:own?!!c:true}}:{}),
    ...(own&&part?{premiseTypeReference:reference(owner.entry,part.typeRoot,item.route,owner.recording)}:{}),
    ...(part?.alternateTypeRoot!==undefined&&part.typeFingerprint!==part.alternateFingerprint?{alternateTypeReference:reference(owner.entry,part.alternateTypeRoot,item.route,owner.recording),alternateTypeSource:{query:address(owner.entry.route),field:part.field,construction:true}}:{})};
   if(found.binding)point.binding={namespace:'original-source-context',node:found.binding.node,address:address(found.binding.route),countContribution:'0',...(version===2&&found.bindingKind===8?{bindingClass:'local-definition'}:{})};
   let target;
   if(c&&nodes.length<maxNodes&&item.depth<=maxDepth){
    target={...point,id:'n'+nodes.length,rule:c.rule,recording:{kind:c.recording.kind,query:address(c.recording.queryRoute||c.entry.route),evidenceSha256:c.entry.evidenceSha256,...(c.recording.stage?{stage:c.recording.stage}:{})},checks:c.checks,...(c.contextExtension?{contextExtension:c.contextExtension}:{})};
    if(c.rule==='let-binding'){const{root:unused,...origin}=point.typeReference;target.typeComponents={...origin,roots:c.components,typeStatus:'recorded-type-expressions-only'};target.evidenceFile=c.entry.evidenceFile;}nodes.push(target);
    for(const premise of c.premises){const candidate=await queries.lookup(premise.route,options),child=candidate?.construction,compatible=!!child&&candidate.typed.role===premise.role&&candidate.typed.contextLength===premise.contextLength&&child.entry.typeFingerprint===premise.typeFingerprint;
     queue.push({route:premise.route,record:compatible?candidate:null,depth:item.depth+1,parent:target.id,field:premise.field,incoming:{construction:c,part:premise},withheld:!!child&&!compatible});}
   }else{target={...point,id:'f'+frontiers.length,boundaryReason:c?'display-boundary':item.withheld?'different-recorded-interface':boundaryReason(point.kind,!!point.typeReference),constructionAvailable:!!c};frontiers.push(target);}
   if(item.parent)edges.push({from:item.parent,to:target.id,field:item.field,relation:c?'native-premise-with-structural-type-agreement':'recorded-native-premise-boundary'});if(point.binding)links.push({from:target.id,...point.binding});
  }
  const hidden=frontiers.reduce((sum,p)=>sum+BigInt(p.expanded),0n);demand(BigInt(nodes.length)+hidden===BigInt(selected.expanded),'source frontier partition');
  const scene=freeze({format:'ProofAtlasOccurrenceConstructionCut/'+version,addressing:'selected-source-relative/'+version,source,root:{node:selected.node,route},options:{maxNodes,maxDepth},nodes,frontiers,edges,links,stats:{retained:String(nodes.length),hidden:String(hidden),represented:selected.expanded},scope:'Finite recorded native constructions. Source fields and computed types retain separate namespaces. Unrecorded rules and descendants remain boundaries.'});
  demand(new TextEncoder().encode(JSON.stringify(scene)).length<=65536,'scene metadata bound');live();scenes.add(scene);return scene;
 }
 function point(scene,id){demand(scenes.has(scene),'foreign construction scene');const value=[...scene.nodes,...scene.frontiers].find(p=>p.id===id);demand(value,'point identity');return value;}
 async function typeFor(scene,id,observation='kernel',options={}){const p=point(scene,id),origin=observation==='meta'?p.alternateTypeSource:p.typeSource;demand(origin,'no recorded type origin');const row=await queries.lookup(resolve(scene.root.route,origin.query,version),options);demand(row,'missing recording query');demand(origin.construction||observation==='kernel','no alternate recorded observation');return queries.typeFor(row,origin.construction?origin.field:'recorded',observation,options);}
 async function sourcePoint(route,options={}){const scene=await windows.create(route,{maxNodes:1,maxDepth:0,signal:options.signal});return Object.freeze({point:scene.nodes[0],data:windows.snapshot(scene),state:windows.state(scene)});}
 async function presentation(scene,options={}){
  demand(scenes.has(scene),'foreign construction scene');const previews={},binders={},clip=s=>s.length<=1600?s:s.slice(0,1600)+'… [constructor preview clipped]';
  for(const p of [...scene.nodes,...scene.frontiers]){const route=resolve(scene.root.route,p.address,version);let text;
   if(p.kind!=='app'){const snapshot=await sourcePoint(route,options);text=A.describe(snapshot.data,p.node);}
   else{let id=p.node,count=0,row;while(true){row=await sourceCursor.run(()=>[sourceCursor.data.kind[id],sourceCursor.data.children[id]],options);if(row[0]!==5||count===32)break;id=row[1][0];count++;}
    if(row[0]===5)text='Application head beyond this 32-field preview';
    else{let head=await sourceCursor.run(()=>A.describe(sourceCursor.data,id),options);if(row[0]===0){const snapshot=await sourcePoint(P.append(route,Array(count).fill(0)),options),binding=snapshot.point.binding;if(binding){const payload=snapshot.data.payloads[binding.node];head=(payload.binderName||payload.declName||'_')+' · binder at source depth '+binding.route.depth;}}text='Head: '+head+' · '+count+' supplied source argument'+(count===1?'':'s');}
   }previews[p.id]=clip(text);
  }
  for(const link of scene.links)if(!binders[link.node]){const value=await sourceCursor.run(()=>({kind:sourceCursor.data.kind[link.node],payload:sourceCursor.data.payloads[link.node]}),options);binders[link.node]={kind:value.kind,name:clip(value.payload.binderName||value.payload.declName||'_')};}
  SP.identity(sourceCursor);Q.identity(queries);const bytes=new TextEncoder().encode(JSON.stringify({previews,binders})).length;demand(bytes<=524288,'presentation byte bound');return freeze({previews,binders,decodedBytes:bytes,byteLimit:524288});
 }
 return Object.freeze({create,routeFor:(scene,id)=>resolve(scene.root.route,point(scene,id).address,version),typeFor,sourcePoint,presentation,source,resolve:(scene,address)=>{demand(scenes.has(scene),'foreign construction scene');return resolve(scene.root.route,address,version);}});
}
const api={open};if(node)module.exports=api;else host.ProofAtlasCursorConstructions=api;
})(typeof window==='undefined'?globalThis:window);
