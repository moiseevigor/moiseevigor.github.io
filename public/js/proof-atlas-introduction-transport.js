(function(host){
'use strict';
const node=typeof module!=='undefined'&&module.exports;
// Composition of checked lambda premises; computed Pi binders are not source
// lambda occurrences. Their relation is an explicit introduction derivation.
const A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,T=node?require('./proof-atlas-occurrence-types'):host.ProofAtlasOccurrenceTypes,G=node?require('./proof-atlas-geometry-core'):host.ProofAtlasGeometry,C=node?require('./proof-atlas-context-transport'):host.ProofAtlasContextTransport,L=node?require('./proof-atlas-context-views'):host.ProofAtlasContextViews,same=L.same;
const demand=(x,m)=>{if(!x)throw Error('Introduction transport: '+m);};
function validate(e,data,record,options={}){
 demand(e?.format==='ProofAtlasIntroductionTransport/1'&&e.namespace==='introduction-transport'&&e.status==='checked'&&e.reconstruction==='structural-pi-composition/1','native format');
 demand(e.kernelOriginalTermTyping==='PASS'&&e.kernelOriginalTypeTyping==='PASS'&&['proof','value','type'].includes(e.role)&&typeof e.typeText==='string','native typing');
 const ambient=T.context(data,e.route);demand(e.node===ambient.node&&e.path===A.path(data,e.route)&&same(e.context,ambient.binders),'selected source/context');
 const steps=e.derivation?.steps;demand(Array.isArray(steps)&&steps.length<=64,'prefix bound');
 let current={root:e.route.root,slots:[...e.route.slots]},ctx=[...e.context];
 for(const step of steps){
  const node=A.walk(data,current),payload=data.payloads[node];demand(data.kind[node]===6,'source lambda');
  const source={node,route:current,path:A.path(data,current),kind:'lam'},domainRoute={root:current.root,slots:[...current.slots,0]},bodyRoute={root:current.root,slots:[...current.slots,1]};
  demand(same(step.source,source)&&same(step.context,ctx),'lambda premise/context');
  demand(same(step.domain,{node:data.children[node][0],route:domainRoute,path:A.path(data,domainRoute)})&&same(step.body,{node:data.children[node][1],route:bodyRoute,path:A.path(data,bodyRoute)}),'lambda ports');
  demand(step.binderName===payload.binderName&&step.binderInfo===payload.binderInfo,'binder annotation');
  demand(step.kernelDomainSort==='PASS'&&step.kernelBodyTyping==='PASS'&&step.kernelBodyConversion==='PASS'&&step.piDomainStructuralMatch===true&&step.piBodyStructuralMatch===true&&step.domainBeforeBinder===true&&step.bodyContextExtended===true,'introduction attestations');
  current=bodyRoute;ctx.push(source);
 }
 demand(data.kind[A.walk(data,current)]!==6,'incomplete introduction prefix');
 const terminal=e.derivation.terminal;demand(same(terminal.route,current)&&same(terminal.context,ctx),'terminal premise');
 const child=C.validate(terminal,data,record);T.validateExpressionGraph(e.sortGraph,[e.sortRoot],e.context.length,8192);demand(e.sortGraph.kind[e.sortRoot]===3,'native sort root');
 const maxNodes=options.maxNodes??65536,maxWork=options.maxWork??131072;demand(Number.isInteger(maxNodes)&&maxNodes>0&&maxNodes<=131072&&Number.isInteger(maxWork)&&maxWork>0&&maxWork<=524288,'view bounds');
 const states=[],memo=new Map(),arrays={kind:[],children:[],payloads:[],expanded:[],neededScope:[]};let work=0,evaluating=0;
 function add(space,node,route=null,depth=0){demand(depth<=512,'view depth');const k=space+':'+node+':'+(route?route.root+':'+route.slots.join('.'):'')+':'+depth;if(memo.has(k))return memo.get(k);demand(states.length<maxNodes,'view node bound');const id=states.length;states.push({space,node,route,depth});memo.set(k,id);return id;}
 function property(id,field){const s=states[id];demand(s,'view identity');if(arrays[field][id]!==undefined)return arrays[field][id];demand(++work<=maxWork&&evaluating<512,'view work/depth');evaluating++;try{
  let result;if(s.space==='pi'){
   const step=steps[s.node];if(field==='kind')result=7;
   if(field==='payloads')result=data.payloads[step.source.node];
   if(field==='children')result=[add('source',step.domain.node,step.domain.route,s.depth+1),s.node+1<steps.length?add('pi',s.node+1,null,s.depth+1):add('terminal',child.view.roots[1],null,s.depth+1)];
   if(field==='expanded')result=(1n+property(id,'children').reduce((n,c)=>n+BigInt(property(c,'expanded')),0n)).toString();
   if(field==='neededScope'){const cs=property(id,'children');result=Math.max(property(cs[0],'neededScope'),property(cs[1],'neededScope')-1,0);}
  }else{
   const g=s.space==='source'?data:child.view.graph;
   if(field==='children')result=g.children[s.node].map((c,j)=>add(s.space,c,s.route?{root:s.route.root,slots:[...s.route.slots,j]}:null,s.depth+1));
   else result=g[field][s.node];
  }
  arrays[field][id]=result;return result;
 }finally{evaluating--;}}
 const graph={};for(const f of Object.keys(arrays))graph[f]=new Proxy([],{get(_,p){if(p==='length')return states.length;demand(typeof p==='string'&&/^(0|[1-9]\d*)$/.test(p),'indexed graph access');return property(Number(p),f);}});
 graph.sourceReference=id=>{const s=states[id];demand(s,'source identity');return s.space==='pi'?null:{graph:s.space==='source'?data:child.view.graph,node:s.node,lift:0,cutoff:0};};
 const root=steps.length?add('pi',0):add('terminal',child.view.roots[1]);demand(graph.neededScope[root]<=e.context.length,'composed type scope');
 function at(slots){demand(Array.isArray(slots)&&slots.length<=512,'computed route bound');let id=root,terminalSlots=[];for(const slot of slots){demand(Number.isInteger(slot)&&slot>=0&&slot<graph.children[id].length,'computed route');const before=states[id];id=graph.children[id][slot];terminalSlots=before.space==='terminal'?[...terminalSlots,slot]:[];}return{id,state:states[id],terminalSlots};}
 function origin(slots){const s=at(slots);if(s.state.space==='source')return{node:s.state.node,route:s.state.route,lift:0};if(s.state.space==='terminal')return child.origin(s.terminalSlots,child.view.roots[1]);return null;}
 function binderCorrespondence(slots){const s=at(slots);return s.state.space==='pi'?{kind:'checked-lambda-pi-binder',source:steps[s.state.node].source}:null;}
 const computed={...graph,serialization:'ExprDAG/1',roots:[root],declaration:{name:record.name,rootPaths:['introduction-transport.type']}},provenance={kind:'checked-type-expression',namespace:'introduction-transport',method:e.reconstruction,typeEvidenceSha256:options.evidenceSha256||(node?require('crypto').createHash('sha256').update(JSON.stringify(e)).digest('hex'):null),source:record,judgment:{node:e.node,route:e.route,path:e.path},binderCorrespondences:steps.map((s,j)=>({computed:{root:0,slots:Array(j).fill(1)},source:s.source})),terminal:{route:terminal.route,templateRoots:terminal.roots}};
 function scene(slots=[],sceneOptions={}){const core=G||host.ProofAtlasGeometry;demand(core?.createOpen,'geometry unavailable');const s=core.createOpen(computed,record,provenance,e.context,{route:{root:0,slots},maxNodes:32,maxDepth:3,maxLayerNodes:6,maxApplicationChildren:4,foldBinders:true,foldApplications:true,...sceneOptions});core.validateOpen(s,computed,record,provenance,e.context);return s;}
 return{graph,root,child,computed,provenance,origin,binderCorrespondence,scene,stats:()=>({nodes:states.length,work,child:child.view.stats(),embedding:child.embedded.stats()})};
}
// Expand only the selected entry. Context prefixes are immutable and shared
// within that selection; a package is never eagerly expanded into all entries.
function* entries(pkg){
 demand(['ProofAtlasIntroductionTransportPackage/1','ProofAtlasIntroductionTransportPackage/2'].includes(pkg?.format)&&Array.isArray(pkg.entries)&&pkg.entries.length<=512,'package inventory');
 if(pkg.format.endsWith('/1')){yield* pkg.entries;return;}
 demand(pkg.packing==='lexical-context-prefix-interning/1'&&Array.isArray(pkg.contexts)&&pkg.contexts.length>0&&pkg.contexts.length<=16384&&pkg.contexts[0]===null,'context packing');
 const depths=[0];for(let j=1;j<pkg.contexts.length;j++){const c=pkg.contexts[j];demand(Number.isInteger(c.parent)&&c.parent>=0&&c.parent<j&&Number.isInteger(c.binder?.node)&&c.binder.node>=0&&typeof c.binder.path==='string'&&c.binder.path.length<=8192&&['lam','forallE','letE'].includes(c.binder.kind)&&Number.isInteger(c.binder.route?.root)&&c.binder.route.root>=0&&Array.isArray(c.binder.route.slots)&&c.binder.route.slots.length<=512&&c.binder.route.slots.every(s=>Number.isInteger(s)&&s>=0&&s<3),'context prefix order/binder');depths[j]=depths[c.parent]+1;demand(depths[j]<=512,'context prefix depth');}
 for(const entry of pkg.entries){
  const cache=new Map([[0,[]]]);let work=0;
  function context(id){demand(Number.isInteger(id)&&id>=0&&id<pkg.contexts.length,'context reference');const pending=[];let current=id;while(!cache.has(current)){demand(pending.length<512,'context prefix depth');pending.push(current);current=pkg.contexts[current].parent;}for(const j of pending.reverse()){const c=pkg.contexts[j],value=[...cache.get(c.parent),c.binder];demand(value.length<=512,'context size');cache.set(j,value);}return cache.get(id);}
  function expand(j,depth=0){demand(++work<=524288&&depth<=1024,'entry expansion bound');if(Array.isArray(j))return j.map(x=>expand(x,depth+1));if(j&&typeof j==='object'){const out=Object.create(null);for(const[k,v]of Object.entries(j)){if(k==='contextRef'||k==='sourceContextRef'){const field=k.slice(0,-3);demand(!(field in j),'duplicate packed context');out[field]=context(v);}else{demand(k!=='context'&&k!=='sourceContext','unpacked context in packed entry');out[k]=expand(v,depth+1);}}return out;}return j;}
  yield expand(entry);
 }
}
const api={validate,entries};
if(node)module.exports=api;else host.ProofAtlasIntroductionTransport=api;
})(typeof window==='undefined'?globalThis:window);
