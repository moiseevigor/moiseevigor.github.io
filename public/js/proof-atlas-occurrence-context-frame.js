/* Bounded context frames over source-bound native introduction/let records. */
(function(host){
'use strict';
const node=typeof module!=='undefined'&&module.exports;
const T=node?require('./proof-atlas-deep-context'):host.ProofAtlasDeepContext;
const P=node?require('./proof-atlas-packed-routes'):host.ProofAtlasPackedRoutes;
const limits=Object.freeze({members:64,frontiers:129,metadataBytes:131072,recordingSuffix:65});
const demand=(v,m)=>{if(!v)throw Error('Context frame: '+m);};
const natural=n=>Number.isSafeInteger(n)&&n>=0;
const same=(a,b)=>a.root===b.root&&a.depth===b.depth&&a.slots===b.slots;
const canonical=v=>JSON.stringify(v,(_,x)=>x&&typeof x==='object'&&!Array.isArray(x)?Object.fromEntries(Object.keys(x).sort().map(k=>[k,x[k]])):x);
const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
const contextRule=c=>c&&['Pi-introduction','let-binding'].includes(c.rule);
function open(nativeCase){
 const data=nativeCase.data,source=T.sourceIdentity(data,nativeCase.record),scenes=new WeakSet();
 const lookup=r=>{const e=nativeCase.get(r);if(!e)return null;demand(same(e.route,r),'record at another occurrence');return T.construction(e,data);};
 function relative(root,route){
  demand(root.root===route.root,'recording source root');
  const a=P.parse(root),b=P.parse(route);let depth=0;
  const slot=(bytes,i)=>(bytes[i>>2]>>((i%4)*2))&3;
  while(depth<Math.min(root.depth,route.depth)&&slot(a,depth)===slot(b,depth))depth++;
  const slots=[];for(let i=depth;i<route.depth;i++)slots.push(slot(b,i));
  demand(slots.length<=limits.recordingSuffix,'recording address bound');return{prefixDepth:depth,slots};
 }
 function sourceRoute(root,members,address){
  demand(address&&typeof address==='object'&&!Array.isArray(address),'source address');
  if(Object.keys(address).join(',')==='prefixDepth'){
   demand(natural(address.prefixDepth)&&address.prefixDepth<root.depth,'original context prefix');
   return P.prefix(root,address.prefixDepth);
  }
  demand(Object.keys(address).every(k=>k==='member'||k==='field')&&natural(address.member)&&address.member<=members.length,'frame member address');
  const slots=members.slice(0,address.member).map(m=>m.rule==='let-binding'?2:1);
  if(address.member===members.length)demand(address.field===undefined,'continuation fields');
  else if(address.field!==undefined){
   const fields=members[address.member].rule==='let-binding'?['type','value','body']:['binderType','body'];
   const index=fields.indexOf(address.field);demand(index>=0,'member source field');slots.push(index);
  }
  return P.append(root,slots);
 }
 function create(route,options={}){
  const maxMembers=options.maxMembers??32;
  demand(Number.isInteger(maxMembers)&&maxMembers>=1&&maxMembers<=limits.members,'member bound');
  const selected=P.resolve(data,route);let current=lookup(route);
  demand(contextRule(current),'no recorded context construction at selection');
  const members=[],headers=[],origins=[],originKeys=new Map(),routes=[],links=[];
  function origin(entry){
   const value={namespace:'computed-native-type',evidenceSha256:entry.evidenceSha256,...(entry.typeTableSha256?{typeTableSha256:entry.typeTableSha256}:{typeGraphSha256:entry.typeGraphSha256}),...(entry.profile?{profile:entry.profile}:{})};
   const k=canonical(value);if(!originKeys.has(k)){originKeys.set(k,origins.length);origins.push(value);}return originKeys.get(k);
  }
  function typeRef(c,root,address){return{origin:origin(c.entry),root,context:address};}
  function boundary(c,part,address){
   const resolved=P.resolve(data,part.route);
   return{address,node:resolved.node,kind:data.kind[resolved.node],role:part.role,contextLength:part.contextLength,expanded:data.expanded[resolved.node],type:typeRef(c,part.typeRoot,address),...(part.alternateTypeRoot!==undefined?{alternateType:typeRef(c,part.alternateTypeRoot,address)}:{})};
  }
  let continuation,stop;
  while(current){
   const c=current,i=members.length,entry=c.entry,body=c.premises.at(-1),payload=data.payloads[entry.node];
   demand(entry.contextLength===selected.scopeDepth+i&&same(entry.route,sourceRoute(route,members,{member:i})),'ordered context chain');
   routes.push(entry.route);
   members.push({id:'m'+i,node:entry.node,rule:c.rule,role:entry.role,contextLength:entry.contextLength,
    binder:{kind:c.rule==='let-binding'?'local-definition':'assumption',name:c.rule==='let-binding'?payload.declName:payload.binderName,...(c.rule==='let-binding'?{nondep:payload.nondep}:{binderInfo:payload.binderInfo})},
    type:typeRef(c,entry.typeData.roots[0],{member:i}),components:{status:'recorded-type-expressions-only',expressions:Object.fromEntries(Object.entries(c.components).map(([name,root])=>[name,typeRef(c,root,c.rule==='Pi-introduction'&&name==='expectedBody'?{member:i,field:'body'}:{member:i})]))},
    recording:{kind:c.recording?.kind||'primary-query',query:relative(route,c.recording?.queryRoute||entry.route),...(c.recording?.stage?{stage:c.recording.stage}:{})},checks:c.checks});
   for(const part of c.premises.slice(0,-1)){
    demand(part.contextLength===entry.contextLength,'header acquired its own binder');
    headers.push(boundary(c,part,{member:i,field:part.field}));
   }
   demand(body.field==='body'&&body.contextLength===entry.contextLength+1,'body context extension');
   continuation=boundary(c,body,{member:i+1});
   const next=lookup(body.route);
   const compatible=!!next&&next.entry.role===body.role&&next.entry.contextLength===body.contextLength&&T.expressionEqual(entry.typeData,body.typeRoot,next.entry.typeData,next.entry.typeData.roots[0]);
   if(!next)stop='no-construction-record';
   else if(!compatible)stop='different-recorded-interface';
   else if(!contextRule(next))stop='non-context-construction';
   else if(members.length===maxMembers)stop='member-budget';
   else{current=next;continue;}
   continuation.availableRule=next?.rule||null;continuation.compatible=compatible;break;
  }
  function binding(point){
   const actual=P.resolve(data,sourceRoute(route,members,point.address));if(!actual.binding)return;
   const index=routes.findIndex(r=>same(r,actual.binding.route)),target=index>=0?{member:index}:{prefixDepth:actual.binding.route.depth};
   demand(same(sourceRoute(route,members,target),actual.binding.route),'lexical target outside original context');
   links.push({from:point.address,namespace:'original-source-context',target,node:actual.binding.node,bindingClass:data.kind[actual.binding.node]===8?'local-definition':'assumption',countContribution:'0'});
  }
  headers.forEach(binding);binding(continuation);
  const hidden=[...headers,continuation].reduce((sum,p)=>sum+BigInt(p.expanded),0n);
  demand(BigInt(members.length)+hidden===BigInt(data.expanded[selected.node]),'exact source partition');
  demand(headers.length+1<=limits.frontiers,'frontier bound');
  const frame=freeze({format:'ProofAtlasOccurrenceContextFrame/1',addressing:'context-member-relative/1',source,root:{node:selected.node,route},options:{maxMembers},
   context:{initialLength:selected.scopeDepth,finalLength:selected.scopeDepth+members.length,extensionCount:members.length},members,headers,continuation,origins,links,stop,
   stats:{retained:String(members.length),hidden:String(hidden),represented:data.expanded[selected.node]},
   guarantee:'Exact source partition and ordered recorded context extensions. No rewriting, new native judgments or semantic compression.'});
  demand(new TextEncoder().encode(JSON.stringify(frame)).length<=limits.metadataBytes,'metadata byte bound');scenes.add(frame);return frame;
 }
 function accepted(scene){demand(scenes.has(scene),'foreign context frame');}
 function resolve(scene,address){accepted(scene);return sourceRoute(scene.root.route,scene.members,address);}
 function expand(scene){
  accepted(scene);
  const edges=scene.members.flatMap((m,i)=>[
   ...scene.headers.filter(p=>p.address.member===i).map(p=>({from:{member:i},to:p.address,field:p.address.field})),
   {from:{member:i},to:{member:i+1},field:'body'}]);
  return freeze({format:'ProofAtlasContextFrameExpansion/1',source:scene.source,root:scene.root,nodes:scene.members,frontiers:[...scene.headers,scene.continuation],edges,links:scene.links,origins:scene.origins,stats:scene.stats});
 }
 function validate(scene){demand(scene?.format==='ProofAtlasOccurrenceContextFrame/1'&&canonical(create(scene.root.route,scene.options))===canonical(scene),'frame differs from original records');return true;}
 async function typeFor(scene,address,observation='kernel'){
  accepted(scene);sourceRoute(scene.root.route,scene.members,address);
  demand(address.prefixDepth===undefined,'no type invented for external context');
  const i=address.member===scene.members.length?address.member-1:address.member,field=address.member===scene.members.length?'body':address.field||'conclusion';
  const c=lookup(sourceRoute(scene.root.route,scene.members,{member:i}));return T.constructionType(c.entry,data,field,observation);
 }
 return Object.freeze({create,validate,resolve,expand,typeFor,source});
}
const api={open,limits};if(node)module.exports=api;else host.ProofAtlasOccurrenceContextFrame=api;
})(typeof window==='undefined'?globalThis:window);
