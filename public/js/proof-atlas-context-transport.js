(function(host){
'use strict';
const node=typeof module!=='undefined'&&module.exports;
const A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,T=node?require('./proof-atlas-occurrence-types'):host.ProofAtlasOccurrenceTypes,G=node?require('./proof-atlas-geometry-core'):host.ProofAtlasGeometry,L=node?require('./proof-atlas-context-views'):host.ProofAtlasContextViews;
const same=L.same,demand=(x,m)=>{if(!x)throw Error('Context transport: '+m);},key=r=>r.root+':'+r.slots.join('.');
function candidates(data,route){
 const ctx=T.context(data,route).binders,out=[],seen=new Set(),prefixes=new Map([[ctx.length,ctx]]);let truncated=false;
 function prefix(n){demand(Number.isInteger(n)&&n>=0&&n<=ctx.length,'candidate scope prefix');if(!prefixes.has(n))prefixes.set(n,ctx.slice(0,n));return prefixes.get(n);}
 function add(r,origin,scope){const k=key(r);if(seen.has(k))return;if(r.slots.length>512||out.length===256){truncated=true;return;}seen.add(k);out.push({node:A.walk(data,r),route:r,path:A.path(data,r),sourceContext:prefix(scope),lift:ctx.length-scope,origin,contextEmbeddingRoundtrip:true});}
 function group(r,origin,scope){if(r.slots.length>512){truncated=true;return;}add(r,origin,scope);let id=A.walk(data,r),slots=[...r.slots];const args=[];for(let j=0;j<Math.min(128,512-r.slots.length)&&data.kind[id]===5;j++){args.unshift({root:r.root,slots:[...slots,1]});id=data.children[id][0];slots.push(0);}for(const a of args)add(a,origin+'-argument',scope);if(data.kind[id]===5)truncated=true;}
 group(route,'selected',ctx.length);const node=A.walk(data,route),kind=data.kind[node],slots=kind===5?[0,1]:kind===6||kind===7||kind===10||kind===11?[0]:kind===8?[0,1]:[];
 // These child ports never enter their constructor's binder. Header regions
 // likewise live in the source context before that header's own binder.
 for(const j of slots)group({root:route.root,slots:[...route.slots,j]},'selected-child',ctx.length);
 const headers=[];for(let i=0;i<ctx.length;i++){const b=ctx[i];headers.push({route:{root:b.route.root,slots:[...b.route.slots,0]},scope:i});if(b.kind==='letE')headers.push({route:{root:b.route.root,slots:[...b.route.slots,1]},scope:i});}for(const h of headers.reverse())group(h.route,'context-header',h.scope);
 return{anchors:out,truncated,context:ctx};}

function validate(e,data,record,options={}){demand(e.format==='ProofAtlasContextTransport/1'&&e.namespace==='context-transport'&&e.status==='checked'&&e.kernelOriginalTermTyping==='PASS'&&e.kernelOriginalTypeTyping==='PASS'&&e.templateInstantiationStructuralRoundtrip===true&&e.templatesAreKernelJudgments===false,'native attestation');
 const expected=candidates(data,e.route);demand(e.node===A.walk(data,e.route)&&e.path===A.path(data,e.route)&&same(e.context,expected.context)&&same(e.anchors,expected.anchors)&&e.anchorCollectorTruncated===expected.truncated,'source candidates/context/lifting');demand(e.roots.length===3,'three original roots');T.validateExpressionGraph(e.templateGraph,e.roots,e.context.length+e.anchors.length,32768);
 const embedded=L.sourceViews(data,e.anchors,e.context.length),view=L.instantiate(e.templateGraph,e.roots[0],embedded.graph,embedded.roots,e.context.length,{roots:e.roots});const compare=L.equal(view.graph,view.roots[0],data,e.node);demand(compare.equal,'selected term reconstruction');
 function origin(slots,root){let node=root,original=null;function enter(){const r=view.graph.sourceReference(node);if(r&&!original){demand(r.graph===embedded.graph,'unexpected source graph');const i=embedded.roots.indexOf(r.node);demand(i>=0,'source anchor');const a=e.anchors[i];original={node:a.node,route:{root:a.route.root,slots:[...a.route.slots]},lift:a.lift+r.lift};}}enter();for(const slot of slots){demand(Number.isInteger(slot)&&slot>=0&&slot<view.graph.children[node].length,'computed route');node=view.graph.children[node][slot];if(original){original.node=data.children[original.node][slot];original.route.slots.push(slot);}enter();}return original;}
 function scene(component,slots=[]){const root=view.roots[component],computed={...view.graph,serialization:'ExprDAG/1',roots:[root],declaration:{name:record.name,rootPaths:['context-transport.'+component]}},provenance={kind:'source-reference-expression',namespace:'source-reference-view',method:'delayed-capture-avoiding-instantiation/1',kernelCheck:'not-performed',template:{sha256:options.templateSha256||e.templateSha256||(node?require('crypto').createHash('sha256').update(JSON.stringify(e.templateGraph)).digest('hex'):null),root:e.roots[component]},argumentRoots:e.anchors.map(a=>a.node),anchors:e.anchors,contextTransport:{format:e.format,root:component},source:record};return (G||host.ProofAtlasGeometry).createReference(computed,record,provenance,e.context,{route:{root:0,slots},maxNodes:32,maxDepth:3,maxLayerNodes:6,maxApplicationChildren:4,foldBinders:true,foldApplications:true});}
 return{embedded,view,compare,origin,scene};}
const api={candidates,validate};
if(node)module.exports=api;else host.ProofAtlasContextTransport=api;
})(typeof window==='undefined'?globalThis:window);
