/* Article-independent scoped scenes. Input must already pass packet hash and ExprDAG/1 validation. */
(function(host){
 'use strict';
 const A=typeof module!=='undefined'&&module.exports?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
 const vocabulary=Object.freeze({
  bvar:{glyph:'↶',role:'bound-reference',ports:[]},fvar:{glyph:'Γ',role:'local-reference',ports:[]},mvar:{glyph:'?',role:'unresolved',ports:[]},sort:{glyph:'U',role:'universe',ports:[]},const:{glyph:'C',role:'declaration-reference',ports:[]},
  app:{glyph:'@',role:'application',ports:['fn','arg']},lam:{glyph:'λ',role:'abstraction',ports:['domain','body']},forallE:{glyph:'∀',role:'dependent-function-type',ports:['domain','body']},letE:{glyph:'let',role:'local-definition',ports:['type','value','body']},lit:{glyph:'#',role:'literal',ports:[]},mdata:{glyph:'μ',role:'annotation',ports:['expr']},proj:{glyph:'π',role:'projection',ports:['struct']}
 });
 for(const rule of Object.values(vocabulary)){Object.freeze(rule.ports);Object.freeze(rule);}
 const binds=(kind,slot)=>(kind==='lam'||kind==='forallE')&&slot===1||kind==='letE'&&slot===2;
 function demand(condition,message){if(!condition)throw Error('Geometric scene: '+message);}
 function checkedRoute(data,route,initialScope=null){
  demand(route&&Number.isInteger(route.root)&&route.root>=0&&route.root<data.roots.length&&Array.isArray(route.slots),'invalid root route');
  let id=data.roots[route.root],scope=initialScope;const slots=[];
  for(const slot of route.slots){const kind=A.kinds[data.kind[id]];demand(Number.isInteger(slot)&&slot>=0&&slot<data.children[id].length,'invalid occurrence slot');if(binds(kind,slot))scope={node:id,route:{root:route.root,slots:[...slots]},outer:scope};slots.push(slot);id=data.children[id][slot];}
  return{id,scope};
 }
 const scopePath=(data,binder)=>binder.external?binder.target:A.path(data,binder.route);
 function telescope(data,route,limit=64,initialScope=null){
  demand(Number.isInteger(limit)&&limit>=2&&limit<=128,'telescope limit must be 2–128');
  const start=checkedRoute(data,route,initialScope),members=[],regions=[];let id=start.id,at={root:route.root,slots:[...route.slots]},scope=start.scope,hidden=0n;
  while([6,7,8].includes(data.kind[id])&&members.length<limit){
   const kind=A.kinds[data.kind[id]],cs=data.children[id],body=kind==='letE'?2:1,path=A.path(data,at);
   const member={node:id,path,route:at,kind,payload:data.payloads[id],bodyPort:body,contextBefore:scope?scopePath(data,scope):null,regions:[]};
   for(let slot=0;slot<body;slot++){
    const r={node:cs[slot],route:{root:at.root,slots:[...at.slots,slot]},field:vocabulary[kind].ports[slot],scopeBefore:path,requiredScope:data.neededScope[cs[slot]],expanded:data.expanded[cs[slot]]};r.path=A.path(data,r.route);member.regions.push(r);regions.push(r);hidden+=BigInt(r.expanded);
   }
   members.push(member);scope={node:id,route:at,outer:scope};id=cs[body];at={root:at.root,slots:[...at.slots,body]};
  }
  demand(BigInt(members.length)+hidden+BigInt(data.expanded[id])===BigInt(data.expanded[start.id]),'telescope partition failed');
  return{members,regions,headerHidden:hidden.toString(),retainedOccurrences:members.length,continuation:{node:id,route:at,path:A.path(data,at),expanded:data.expanded[id]},truncated:[6,7,8].includes(data.kind[id])};
 }
 function application(data,route,limit=64){
  demand(Number.isInteger(limit)&&limit>=2&&limit<=128,'application limit must be 2–128');
  const start=checkedRoute(data,route),members=[];let id=start.id,at={root:route.root,slots:[...route.slots]},mass=0n;
  while(data.kind[id]===5&&members.length<limit){
   const arg=data.children[id][1],argRoute={root:at.root,slots:[...at.slots,1]};
   members.push({node:id,path:A.path(data,at),route:at,payload:data.payloads[id],argument:{node:arg,route:argRoute,path:A.path(data,argRoute),expanded:data.expanded[arg]}});
   mass+=BigInt(data.expanded[arg]);id=data.children[id][0];at={root:at.root,slots:[...at.slots,0]};
  }
  members.reverse();const truncated=data.kind[id]===5,args=members.map((m,j)=>({...m.argument,slot:j+1,position:truncated?null:j+1}));
  demand(BigInt(members.length)+mass+BigInt(data.expanded[id])===BigInt(data.expanded[start.id]),'application partition failed');
  return{members,arguments:args,head:{node:id,route:at,path:A.path(data,at),expanded:data.expanded[id]},spineComplete:!truncated,truncated,saturation:'not-inferred'};
 }
 function build(data,record,options={},origin=null,ambient=[]){
  demand(data.serialization==='ExprDAG/1'&&data.declaration.name===record.name,'packet identity mismatch');
  const budget=options.maxNodes??48,depthLimit=options.maxDepth??4,route=options.route||{root:data.roots.length>1?1:0,slots:[]};
  demand(Number.isInteger(budget)&&budget>=1&&budget<=10000,'node budget must be 1–10000');demand(Number.isInteger(depthLimit)&&depthLimit>=0&&depthLimit<=128,'depth must be 0–128');
  const folded=options.foldBinders===true,telescopeLimit=options.telescopeLimit??64,grouped=options.foldApplications===true,applicationLimit=options.applicationLimit??64,applicationChildren=options.maxApplicationChildren??6,maxLayerNodes=options.maxLayerNodes??8,abstracted=folded||grouped;
  if(folded)demand(Number.isInteger(telescopeLimit)&&telescopeLimit>=2&&telescopeLimit<=128,'telescope limit must be 2–128');
  if(grouped){demand(Number.isInteger(applicationLimit)&&applicationLimit>=2&&applicationLimit<=128,'application limit must be 2–128');demand(Number.isInteger(applicationChildren)&&applicationChildren>=1&&applicationChildren<=129,'application child budget must be 1–129');demand(Number.isInteger(maxLayerNodes)&&maxLayerNodes>=1&&maxLayerNodes<=10000,'layer budget must be 1–10000');}
  let initialScope=null;for(const b of ambient)initialScope={...b,target:b.path,external:true,outer:initialScope};
  const start=checkedRoute(data,route,initialScope),work=[{id:start.id,scope:start.scope,route:{root:route.root,slots:[...route.slots]},depth:0,parent:null,field:null}],nodes=[],edges=[],links=[];
  const layers=new Map([[0,1]]),enqueue=item=>{work.push(item);layers.set(item.depth,(layers.get(item.depth)||0)+1);};
  for(let at=0;at<work.length;at++){
   const item=work[at],kind=A.kinds[data.kind[item.id]],rule=vocabulary[kind],cs=data.children[item.id];demand(rule&&cs.length===rule.ports.length,'unknown constructor or port arity');
   const path=A.path(data,item.route),expanded=BigInt(data.expanded[item.id]);demand(expanded>=1n,'invalid expanded count');
   const prefix=folded&&[6,7,8].includes(data.kind[item.id])?telescope(data,item.route,telescopeLimit,initialScope):null;
   const fold=prefix&&prefix.members.length>=2;
   const spine=grouped&&kind==='app'?application(data,item.route,applicationLimit):null,group=spine&&spine.members.length>=2;
   const layerRoom=grouped?Math.max(0,maxLayerNodes-(layers.get(item.depth+1)||0)):Infinity;
   const expand=cs.length>0&&item.depth<depthLimit&&work.length+cs.length<=budget&&cs.length<=layerRoom;
   const node={id:path,node:item.id,kind,glyph:rule.glyph,role:rule.role,route:item.route,depth:item.depth,payload:data.payloads[item.id],ports:[...rule.ports],kernelPorts:rule.ports.map(p=>(kind==='lam'||kind==='forallE')&&p==='domain'?'binderType':p),expanded:expanded.toString(),hidden:expand?'0':(expanded-1n).toString(),frontier:cs.length>0&&!expand,children:[]};
   if(fold){
    const open=item.depth<depthLimit&&work.length+1<=budget&&layerRoom>=1;
    Object.assign(node,{abstraction:'binder-telescope',sourceRole:rule.role,role:'ordered-binder-context',glyph:'T',members:prefix.members,regions:prefix.regions,continuation:prefix.continuation,truncated:prefix.truncated,ports:['continuation'],retainedOccurrences:prefix.retainedOccurrences,hidden:(BigInt(prefix.headerHidden)+(open?0n:BigInt(prefix.continuation.expanded))).toString(),frontier:!open});
    if(open){node.children.push(prefix.continuation.path);enqueue({id:prefix.continuation.node,route:prefix.continuation.route,scope:checkedRoute(data,prefix.continuation.route,initialScope).scope,depth:item.depth+1,parent:path,field:'continuation',relation:'telescope-continuation'});}
   }else if(group){
    const regions=[{...spine.head,field:spine.truncated?'remaining-function':'head'},...spine.arguments.map(a=>({...a,field:'arg'+a.slot}))];
    const open=item.depth<depthLimit?Math.min(regions.length,applicationChildren,budget-work.length,layerRoom):0;
    regions.forEach((r,j)=>{r.displayed=j<open;if(r.displayed){node.children.push(r.path);enqueue({id:r.node,route:r.route,scope:item.scope,depth:item.depth+1,parent:path,field:r.field,relation:j===0?'application-head':'application-argument'});}});
    Object.assign(node,{abstraction:'application-spine',sourceRole:rule.role,role:'ordered-application-spine',glyph:'@',members:spine.members,head:spine.head,arguments:spine.arguments,regions,truncated:spine.truncated,spineComplete:spine.spineComplete,saturation:spine.saturation,ports:regions.map(r=>r.field),retainedOccurrences:spine.members.length,hidden:regions.filter(r=>!r.displayed).reduce((s,r)=>s+BigInt(r.expanded),0n).toString(),frontier:open<regions.length});
   }else if(abstracted)node.retainedOccurrences=1;
   nodes.push(node);
   if(item.parent!==null)edges.push({from:item.parent,to:path,field:item.field,relation:item.relation||'constructor-child'});
   if(kind==='bvar'){
    let binder=item.scope,index=node.payload.index;demand(Number.isInteger(index)&&index>=0,'invalid de Bruijn index');while(index--&&binder)binder=binder.outer;
    links.push(binder?{from:path,relation:'bound-to',node:binder.node,route:binder.route,target:scopePath(data,binder),...(binder.external?{external:true,targetNamespace:origin?.kind==='derived-constructor-expectation'&&origin.sourceNamespace==='kernel-rule'?'kernel-rule-context':'proof-context'}:{})}:{from:path,relation:'unresolved-scope',index:node.payload.index});
   }else if(kind==='const')links.push({from:path,relation:'declaration-reference',name:node.payload.name,levels:node.payload.levels});
   else if(kind==='fvar'||kind==='mvar')links.push({from:path,relation:kind==='fvar'?'local-context':'metavariable-context',contextId:node.payload.id,status:'context-not-exported'});
   if(expand&&!fold&&!group)cs.forEach((child,slot)=>{const childRoute={root:item.route.root,slots:[...item.route.slots,slot]};node.children.push(A.path(data,childRoute));enqueue({id:child,route:childRoute,depth:item.depth+1,parent:path,field:rule.ports[slot],scope:binds(kind,slot)?{node:item.id,route:item.route,outer:item.scope}:item.scope});});
  }
  const visible=new Set(nodes.map(n=>n.id)),members=new Map();for(const n of nodes)if(n.abstraction==='binder-telescope')for(let i=0;i<n.members.length;i++)members.set(n.members[i].path,{target:n.id,slot:i+1});
  for(const link of links)if(link.relation==='bound-to'){
   const member=members.get(link.target);link.boundary=!visible.has(link.target)&&!member;
   if(member){link.displayTarget=member.target;link.telescopeSlot=member.slot;}
  }
  const total=BigInt(data.expanded[start.id]),hidden=nodes.reduce((s,n)=>s+BigInt(n.hidden),0n),retained=nodes.reduce((s,n)=>s+BigInt(n.retainedOccurrences??1),0n);demand(retained+hidden===total,'frontier accounting failed');
  const result={format:grouped?'ProofAtlasGeometricScene/3':folded?'ProofAtlasGeometricScene/2':'ProofAtlasGeometricScene/1',source:{name:record.name,indexSha256:record.indexSha256,sourceSha256:record.sourceSha256},root:{node:start.id,route:{root:route.root,slots:[...route.slots]},path:A.path(data,route),category:route.slots.length?'expression':data.declaration.rootPaths[route.root]==='root.type'?'declaration-type':data.declaration.rootPaths[route.root]==='root.value'?(record.kind==='theorem'?'proof-body':'definition-body'):'reduction-or-other-root'},budget,depthLimit,nodes,edges,links,stats:{displayed:nodes.length,hidden:hidden.toString(),represented:total.toString(),frontiers:nodes.filter(n=>n.frontier).length,scopeBoundaries:links.filter(l=>l.relation==='bound-to'&&l.boundary).length},guarantee:'Occurrence structure and lexical binding against the identified packet. No inferred occurrence types, semantic equivalence, tactic reconstruction or human comprehension claim.'};
  if(abstracted)result.stats.retainedOccurrences=retained.toString();
  if(folded){const ts=nodes.filter(n=>n.abstraction==='binder-telescope');result.telescopeLimit=telescopeLimit;result.stats.foldedTelescopes=ts.length;result.stats.hiddenHeaderRegions=ts.reduce((s,n)=>s+n.regions.length,0);result.stats.foldedBinders=ts.reduce((s,n)=>s+n.members.length,0);}
  if(grouped){const apps=nodes.filter(n=>n.abstraction==='application-spine');Object.assign(result,{foldBinders:folded,applicationLimit,maxApplicationChildren:applicationChildren,maxLayerNodes});result.stats.foldedApplications=apps.length;result.stats.retainedApplications=apps.reduce((s,n)=>s+n.members.length,0);result.stats.hiddenApplicationRegions=apps.reduce((s,n)=>s+n.regions.filter(r=>!r.displayed).length,0);}
  if(origin){const expected=origin.kind==='derived-constructor-expectation',zeta=origin.kind==='checked-let-result',reduced=zeta||origin.kind==='checked-beta-result',rule=origin.kind==='native-kernel-rule';result.format=expected?'ProofAtlasGeometricScene/8':zeta?'ProofAtlasGeometricScene/7':rule?'ProofAtlasGeometricScene/6':reduced?'ProofAtlasGeometricScene/5':'ProofAtlasGeometricScene/4';result.source={...result.source,...origin};result.openOptions={foldBinders:folded,foldApplications:grouped};result.ambientContext=ambient.map(b=>({node:b.node,path:b.path,kind:b.kind,route:{root:b.route.root,slots:[...b.route.slots]}}));result.root.category=expected?'derived-expected-expression':zeta?'computed-let-result':rule?'kernel-reduction-rule':reduced?'computed-beta-result':'type-expression';result.guarantee=expected?'Capture-avoiding instantiation of a native constructor signature. Expected expressions and their descendants have no new typing or conversion checks.':rule?'A bounded cut of the compiled kernel reduction rule, in its own metadata namespace. These are formal rule binders and calls, not source-proof occurrences or execution events.':reduced?'Computed '+(zeta?'let':'beta')+' result in a separate namespace, with exact context links. Native term conversion is attested at its root; descendants have no new inferred typing judgments.': 'Structural type-expression cut with lexical links to internal type binders or the separately identified proof context. No inferred typing judgment for type descendants or semantic equivalence claim.';}
  return result;
 }
 function create(data,record,options={}){return build(data,record,options);}
 function createOpen(data,record,origin,ambient,options={}){
  demand(origin?.kind==='checked-type-expression'&&/^[a-f0-9]{64}$/.test(origin.typeEvidenceSha256),'open-expression origin');demand(Array.isArray(ambient)&&ambient.length<=512,'ambient context bound');for(const b of ambient)demand(Number.isInteger(b.node)&&b.node>=0&&typeof b.path==='string'&&['lam','forallE','letE'].includes(b.kind)&&Number.isInteger(b.route?.root)&&Array.isArray(b.route.slots),'ambient binder');
  return build(data,record,options,origin,ambient);
 }
 function validateOpen(scene,data,record,origin,ambient){
  demand(scene.format==='ProofAtlasGeometricScene/4','unknown open format');const expected=createOpen(data,record,origin,ambient,{route:scene.root.route,maxNodes:scene.budget,maxDepth:scene.depthLimit,foldBinders:scene.openOptions.foldBinders,foldApplications:scene.openOptions.foldApplications,telescopeLimit:scene.telescopeLimit,applicationLimit:scene.applicationLimit,maxApplicationChildren:scene.maxApplicationChildren,maxLayerNodes:scene.maxLayerNodes});demand(JSON.stringify(scene)===JSON.stringify(expected),'changed open scene or scope');return true;
 }
 function createReduction(data,record,origin,ambient,options={}){
  demand(((origin?.kind==='checked-beta-result'&&origin.method==='one-leading-beta/1')||(origin?.kind==='checked-let-result'&&origin.method==='one-let-zeta/1'))&&/^[a-f0-9]{64}$/.test(origin.typeEvidenceSha256),'reduction origin');demand(Array.isArray(ambient)&&ambient.length<=512,'reduction context bound');for(const b of ambient)demand(Number.isInteger(b.node)&&b.node>=0&&typeof b.path==='string'&&['lam','forallE','letE'].includes(b.kind)&&Number.isInteger(b.route?.root)&&Array.isArray(b.route.slots),'reduction binder');return build(data,record,options,origin,ambient);
 }
 function validateReduction(scene,data,record,origin,ambient){
  demand(scene.format===(origin.kind==='checked-let-result'?'ProofAtlasGeometricScene/7':'ProofAtlasGeometricScene/5'),'unknown reduction format');const expected=createReduction(data,record,origin,ambient,{route:scene.root.route,maxNodes:scene.budget,maxDepth:scene.depthLimit,foldBinders:scene.openOptions.foldBinders,foldApplications:scene.openOptions.foldApplications,telescopeLimit:scene.telescopeLimit,applicationLimit:scene.applicationLimit,maxApplicationChildren:scene.maxApplicationChildren,maxLayerNodes:scene.maxLayerNodes});demand(JSON.stringify(scene)===JSON.stringify(expected),'changed reduction scene/scope');return true;
 }
 function createExpected(data,record,origin,ambient,options={}){
  demand(origin?.kind==='derived-constructor-expectation'&&origin.namespace==='constructor-expectation'&&origin.method==='simultaneous-capture-avoiding-instantiation/1'&&origin.kernelCheck==='not-performed'&&/^[a-f0-9]{64}$/.test(origin.signature?.sha256),'expected-expression derivation');
  demand(origin.source?.name===record.name&&origin.source.indexSha256===record.indexSha256&&origin.source.sourceSha256===record.sourceSha256,'expected-expression source');demand(Array.isArray(ambient)&&ambient.length<=512&&ambient.every(b=>Number.isInteger(b.node)&&typeof b.path==='string'&&['lam','forallE','letE'].includes(b.kind)&&Number.isInteger(b.route?.root)&&Array.isArray(b.route.slots)),'expected context');return build(data,record,options,origin,ambient);
 }
 function validateExpected(scene,data,record,origin,ambient){demand(scene.format==='ProofAtlasGeometricScene/8','expected-expression format');const expected=createExpected(data,record,origin,ambient,{route:scene.root.route,maxNodes:scene.budget,maxDepth:scene.depthLimit,foldBinders:scene.openOptions.foldBinders,foldApplications:scene.openOptions.foldApplications,telescopeLimit:scene.telescopeLimit,applicationLimit:scene.applicationLimit,maxApplicationChildren:scene.maxApplicationChildren,maxLayerNodes:scene.maxLayerNodes});demand(JSON.stringify(scene)===JSON.stringify(expected),'changed expected-expression cut');return true;}
 // Source-backed substitution is transport, not another kernel constructor or
 // an inferred type of a computed descendant. The adapter validates its graph.
 function createReference(data,record,origin,ambient,options={}){
  demand(origin?.kind==='source-reference-expression'&&origin.namespace==='source-reference-view'&&origin.method==='delayed-capture-avoiding-instantiation/1'&&origin.kernelCheck==='not-performed'&&/^[a-f0-9]{64}$/.test(origin.template?.sha256),'source-reference derivation');
  demand(origin.source?.name===record.name&&origin.source.indexSha256===record.indexSha256&&origin.source.sourceSha256===record.sourceSha256,'source-reference source');demand(Array.isArray(ambient)&&ambient.length<=512&&ambient.every(b=>Number.isInteger(b.node)&&typeof b.path==='string'&&['lam','forallE','letE'].includes(b.kind)&&Number.isInteger(b.route?.root)&&Array.isArray(b.route.slots)),'source-reference context');
  demand(Number.isInteger(origin.template.root)&&origin.template.root>=0&&Array.isArray(origin.argumentRoots)&&origin.argumentRoots.length<=256&&origin.argumentRoots.every(r=>Number.isInteger(r)&&r>=0),'source-reference roots');
  const scene=build(data,record,options,origin,ambient);scene.format='ProofAtlasGeometricScene/9';scene.root.category='source-backed-expression';scene.guarantee='Bounded cut of delayed substitution. Explicit anchor routes identify borrowed source occurrences when provided; otherwise source occurrence provenance is unavailable. Computed parents have no source occurrence and no new inferred typing.';return scene;
 }
 function validateReference(scene,data,record,origin,ambient){demand(scene.format==='ProofAtlasGeometricScene/9','source-reference scene format');const expected=createReference(data,record,origin,ambient,{route:scene.root.route,maxNodes:scene.budget,maxDepth:scene.depthLimit,foldBinders:scene.openOptions.foldBinders,foldApplications:scene.openOptions.foldApplications,telescopeLimit:scene.telescopeLimit,applicationLimit:scene.applicationLimit,maxApplicationChildren:scene.maxApplicationChildren,maxLayerNodes:scene.maxLayerNodes});demand(JSON.stringify(scene)===JSON.stringify(expected),'changed source-reference cut');return true;}
 function createRule(data,record,origin,options={}){demand(origin?.kind==='native-kernel-rule'&&origin.namespace==='kernel-rule'&&/^[a-f0-9]{64}$/.test(origin.typeEvidenceSha256),'kernel rule origin');return build(data,record,options,origin,[]);}
 function validateRule(scene,data,record,origin){demand(scene.format==='ProofAtlasGeometricScene/6','kernel rule format');const expected=createRule(data,record,origin,{route:scene.root.route,maxNodes:scene.budget,maxDepth:scene.depthLimit,foldBinders:scene.openOptions.foldBinders,foldApplications:scene.openOptions.foldApplications,telescopeLimit:scene.telescopeLimit,applicationLimit:scene.applicationLimit,maxApplicationChildren:scene.maxApplicationChildren,maxLayerNodes:scene.maxLayerNodes});demand(JSON.stringify(scene)===JSON.stringify(expected),'changed kernel rule cut');return true;}
 function validate(scene,data,record){
  demand(['ProofAtlasGeometricScene/1','ProofAtlasGeometricScene/2','ProofAtlasGeometricScene/3'].includes(scene.format),'unknown format');demand(scene.source.name===record.name&&scene.source.indexSha256===record.indexSha256&&scene.source.sourceSha256===record.sourceSha256,'stale packet');
  const expected=create(data,record,{route:scene.root.route,maxNodes:scene.budget,maxDepth:scene.depthLimit,foldBinders:scene.format==='ProofAtlasGeometricScene/2'||scene.foldBinders===true,telescopeLimit:scene.telescopeLimit,foldApplications:scene.format==='ProofAtlasGeometricScene/3',applicationLimit:scene.applicationLimit,maxApplicationChildren:scene.maxApplicationChildren,maxLayerNodes:scene.maxLayerNodes});demand(JSON.stringify(scene)===JSON.stringify(expected),'changed scene or scope');return true;
 }
 const api={vocabulary,create,validate,createOpen,validateOpen,createReduction,validateReduction,createRule,validateRule,createExpected,validateExpected,createReference,validateReference,telescope,application};if(typeof module!=='undefined'&&module.exports)module.exports=api;else host.ProofAtlasGeometry=api;
})(typeof window==='undefined'?globalThis:window);
