/* Context frames from bounded source rows and sparse native records. */
(function(host){
'use strict';
const node=typeof module!=='undefined'&&module.exports;
const P=node?require('./proof-atlas-packed-routes'):host.ProofAtlasPackedRoutes;
const SP=node?require('./proof-atlas-source-pages'):host.ProofAtlasSourcePages;
const Q=node?require('./proof-atlas-construction-pages'):host.ProofAtlasConstructionPages;
const CM=node?require('./proof-atlas-cursor-constructions'):host.ProofAtlasCursorConstructions;
const A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
const limits=Object.freeze({members:64,frontiers:129,metadataBytes:131072,recordingSuffix:65});
const demand=(v,m)=>{if(!v)throw Error('Cursor context frame: '+m);};
const natural=n=>Number.isSafeInteger(n)&&n>=0;
const same=(a,b)=>a.root===b.root&&a.depth===b.depth&&a.slots===b.slots;
const canonical=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
const contextRule=c=>c&&['Pi-introduction','let-binding'].includes(c.rule);
function relative(root,route){
 demand(root.root===route.root,'recording source root');
 const a=P.parse(root),b=P.parse(route),slot=(bytes,i)=>(bytes[i>>2]>>((i%4)*2))&3;let depth=0;
 while(depth<Math.min(root.depth,route.depth)&&slot(a,depth)===slot(b,depth))depth++;
 const slots=[];for(let i=depth;i<route.depth;i++)slots.push(slot(b,i));
 demand(slots.length<=limits.recordingSuffix,'recording address bound');return{prefixDepth:depth,slots};
}
function sourceRoute(root,members,address){
 demand(address&&typeof address==='object'&&!Array.isArray(address),'source address');
 if(Object.keys(address).join(',')==='prefixDepth'){
  demand(natural(address.prefixDepth)&&address.prefixDepth<root.depth,'original context prefix');return P.prefix(root,address.prefixDepth);
 }
 demand(Object.keys(address).every(k=>k==='member'||k==='field')&&natural(address.member)&&address.member<=members.length,'frame member address');
 const slots=members.slice(0,address.member).map(m=>m.rule==='let-binding'?2:1);
 if(address.member===members.length)demand(address.field===undefined,'continuation fields');
 else if(address.field!==undefined){const fields=members[address.member].rule==='let-binding'?['type','value','body']:['binderType','body'],index=fields.indexOf(address.field);demand(index>=0,'member source field');slots.push(index);}
 return P.append(root,slots);
}
function open(sourceCursor,queries){
 const sourceIdentity=SP.identity(sourceCursor),identity=Q.identity(queries);
 demand(sourceIdentity.name===identity.name&&sourceIdentity.indexSha256===identity.indexSha256&&sourceIdentity.sourceSha256===identity.sourceSha256,'source identity');
 const source=freeze({name:identity.name,indexSha256:identity.indexSha256,sourceGraphSha256:identity.sourceGraphSha256}),model=CM.open(sourceCursor,queries),scenes=new WeakSet();
 function live(options={}){if(options.signal?.aborted)throw options.signal.reason||Error('aborted');SP.identity(sourceCursor);Q.identity(queries);}
 async function create(input,options={}){
  live(options);const route=freeze(JSON.parse(JSON.stringify(input))),maxMembers=options.maxMembers??32;P.parse(route);
  demand(Number.isInteger(maxMembers)&&maxMembers>=1&&maxMembers<=limits.members,'member bound');
  const selected=await model.sourcePoint(route,options);let current=(await queries.lookup(route,options))?.construction;
  demand(contextRule(current),'no recorded context construction at selection');
  const members=[],headers=[],origins=[],originKeys=new Map(),routes=[],bindings=[],links=[];
  function origin(entry){
   const value={namespace:'computed-native-type',evidenceSha256:entry.evidenceSha256,typeTableSha256:entry.typeTableSha256,...(entry.profile?{profile:entry.profile}:{})},key=canonical(value);
   if(!originKeys.has(key)){originKeys.set(key,origins.length);origins.push(value);}return originKeys.get(key);
  }
  const typeRef=(c,root,address)=>({origin:origin(c.entry),root,context:address});
  async function boundary(c,part,address){
   const actual=await model.sourcePoint(part.route,options),p=actual.point;
   demand(p.node===part.node&&p.scopeDepth===part.contextLength,'actual premise interface');
   if(p.binding)bindings.push({address,binding:p.binding,kind:actual.data.kind[p.binding.node]});
   return{address,node:p.node,kind:actual.data.kind[p.node],role:part.role,contextLength:part.contextLength,expanded:p.expanded,type:typeRef(c,part.typeRoot,address),...(part.alternateTypeRoot!==undefined?{alternateType:typeRef(c,part.alternateTypeRoot,address)}:{})};
  }
  let continuation,stop;
  while(current){
   live(options);const c=current,i=members.length,entry=c.entry,body=c.premises.at(-1),actual=await model.sourcePoint(entry.route,options),p=actual.point,payload=actual.data.payloads[entry.node];
   demand(entry.node===p.node&&entry.contextLength===p.scopeDepth&&entry.contextLength===selected.point.scopeDepth+i&&same(entry.route,sourceRoute(route,members,{member:i})),'ordered context chain');
   demand(p.kind===(c.rule==='let-binding'?'letE':'lam')&&p.ports.length===c.premises.length,'actual construction fields');
   for(const [slot,part]of c.premises.entries())demand(part.node===p.ports[slot].node,'actual premise source');
   routes.push(entry.route);
   members.push({id:'m'+i,node:entry.node,rule:c.rule,role:entry.role,contextLength:entry.contextLength,
    binder:{kind:c.rule==='let-binding'?'local-definition':'assumption',name:c.rule==='let-binding'?payload.declName:payload.binderName,...(c.rule==='let-binding'?{nondep:payload.nondep}:{binderInfo:payload.binderInfo})},
    type:typeRef(c,entry.root,{member:i}),components:{status:'recorded-type-expressions-only',expressions:Object.fromEntries(Object.entries(c.components).map(([name,root])=>[name,typeRef(c,root,c.rule==='Pi-introduction'&&name==='expectedBody'?{member:i,field:'body'}:{member:i})]))},
    recording:{kind:c.recording.kind,query:relative(route,c.recording.queryRoute||entry.route),...(c.recording.stage?{stage:c.recording.stage}:{})},checks:c.checks});
   for(const part of c.premises.slice(0,-1)){demand(part.contextLength===entry.contextLength,'header acquired its own binder');headers.push(await boundary(c,part,{member:i,field:part.field}));}
   demand(body.field==='body'&&body.contextLength===entry.contextLength+1,'body context extension');
   // Only the final body is a frontier. Earlier bodies become frame members.
   const beforeBody=bindings.length;continuation=await boundary(c,body,{member:i+1});
   const next=(await queries.lookup(body.route,options))?.construction;
   const compatible=!!next&&next.entry.role===body.role&&next.entry.contextLength===body.contextLength&&next.entry.typeFingerprint===body.typeFingerprint;
   if(!next)stop='no-construction-record';
   else if(!compatible)stop='different-recorded-interface';
   else if(!contextRule(next))stop='non-context-construction';
   else if(members.length===maxMembers)stop='member-budget';
   else{bindings.length=beforeBody;current=next;continue;}
   continuation.availableRule=next?.rule||null;continuation.compatible=compatible;break;
  }
  for(const {address,binding,kind}of bindings){
   const index=routes.findIndex(r=>same(r,binding.route)),target=index>=0?{member:index}:{prefixDepth:binding.route.depth};
   demand(same(sourceRoute(route,members,target),binding.route),'lexical target outside original context');
   links.push({from:address,namespace:'original-source-context',target,node:binding.node,bindingClass:kind===8?'local-definition':'assumption',countContribution:'0'});
  }
  const hidden=[...headers,continuation].reduce((sum,p)=>sum+BigInt(p.expanded),0n);
  demand(BigInt(members.length)+hidden===BigInt(selected.point.expanded),'exact source partition');demand(headers.length+1<=limits.frontiers,'frontier bound');
  const frame=freeze({format:'ProofAtlasOccurrenceContextFrame/1',addressing:'context-member-relative/1',source,root:{node:selected.point.node,route},options:{maxMembers},
   context:{initialLength:selected.point.scopeDepth,finalLength:selected.point.scopeDepth+members.length,extensionCount:members.length},members,headers,continuation,origins,links,stop,
   stats:{retained:String(members.length),hidden:String(hidden),represented:selected.point.expanded},
   guarantee:'Exact source partition and ordered recorded context extensions. No rewriting, new native judgments or semantic compression.'});
  demand(new TextEncoder().encode(JSON.stringify(frame)).length<=limits.metadataBytes,'metadata byte bound');live(options);scenes.add(frame);return frame;
 }
 function accepted(scene){live();demand(scenes.has(scene),'foreign context frame');}
 function resolve(scene,address){accepted(scene);return sourceRoute(scene.root.route,scene.members,address);}
 function expand(scene){
  accepted(scene);const edges=scene.members.flatMap((m,i)=>[...scene.headers.filter(p=>p.address.member===i).map(p=>({from:{member:i},to:p.address,field:p.address.field})),{from:{member:i},to:{member:i+1},field:'body'}]);
  return freeze({format:'ProofAtlasContextFrameExpansion/1',source:scene.source,root:scene.root,nodes:scene.members,frontiers:[...scene.headers,scene.continuation],edges,links:scene.links,origins:scene.origins,stats:scene.stats});
 }
 async function validate(scene,options={}){demand(scene?.format==='ProofAtlasOccurrenceContextFrame/1'&&canonical(await create(scene.root.route,{...scene.options,signal:options.signal}))===canonical(scene),'frame differs from original records');return true;}
 async function typeFor(scene,address,observation='kernel',options={}){
  accepted(scene);sourceRoute(scene.root.route,scene.members,address);demand(address.prefixDepth===undefined,'no type invented for external context');
  const i=address.member===scene.members.length?address.member-1:address.member,field=address.member===scene.members.length?'body':address.field||'conclusion';
  const row=await queries.lookup(sourceRoute(scene.root.route,scene.members,{member:i}),options);demand(row?.construction,'missing construction record');return queries.typeFor(row,field,observation,options);
 }
 async function presentation(scene,options={}){
  accepted(scene);const previews={};
  const addresses=[...scene.members.map((m,i)=>({member:i})),...scene.headers.map(p=>p.address),scene.continuation.address];
  for(const address of addresses){const actual=await model.sourcePoint(sourceRoute(scene.root.route,scene.members,address),options),text=A.describe(actual.data,actual.point.node);previews[JSON.stringify(address)]={node:actual.point.node,text:text.length>240?text.slice(0,240)+'… [constructor preview]':text};}
  live(options);const decodedBytes=new TextEncoder().encode(JSON.stringify({previews})).length;demand(decodedBytes<=262144,'presentation byte bound');return freeze({previews,decodedBytes,byteLimit:262144});
 }
 return Object.freeze({create,validate,resolve,expand,typeFor,presentation,source,sourcePoint:model.sourcePoint});
}
const api={open,limits};if(node)module.exports=api;else host.ProofAtlasCursorContextFrame=api;
})(typeof window==='undefined'?globalThis:window);
