'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
const P=require('../../../public/js/proof-atlas-region-function-pages'),A=require('../../../public/js/proof-atlas-library-data'),T=require('../../../public/js/proof-atlas-occurrence-types');
const N=require('../../../public/js/proof-atlas-type-notation'),M=require('../region-context-projection/model.cjs');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/source-template-pages/',assetBase='/public/data/proof-atlas/region-function-pages/';
const sha=bytes=>crypto.createHash('sha256').update(bytes).digest('hex'),read=file=>JSON.parse(z.gunzipSync(fs.readFileSync(file))),copy=x=>JSON.parse(JSON.stringify(x));
const host={};for(const name of['source-template-function-pages-manifest','source-template-notation-bindings','type-notation-catalog'])vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+name+'.js','utf8'),{window:host});
const inventory=copy(host.PROOF_ATLAS_SOURCE_TEMPLATE_FUNCTION_PAGES),registry=copy(host.PROOF_ATLAS_SOURCE_TEMPLATE_NOTATION_BINDINGS),catalog=copy(host.PROOF_ATLAS_TYPE_NOTATION);
const nativeFile='research/proof-atlas/source-template-inputs/native.json.gz',native=read(nativeFile),fields=['kind','children','payloads','expanded','neededScope'];
assert.equal(inventory.nativeInventorySha256,sha(z.gunzipSync(fs.readFileSync(nativeFile))));
const dependencies=[base+'check.cjs',base+'pack.cjs',base+'registry.cjs',base+'constant-data.json.gz',base+'notation-environment.json.gz',nativeFile,'research/proof-atlas/source-template-inputs/verification.json.gz',
 'public/data/proof-atlas/source-template-function-pages-manifest.js','public/data/proof-atlas/source-template-notation-bindings.js','public/data/proof-atlas/type-notation-catalog.js',
 'public/js/proof-atlas-region-function-pages.js','public/js/proof-atlas-computed-type-neighborhood.js','public/js/proof-atlas-paged-notation.js','public/js/proof-atlas-type-notation.js','public/js/proof-atlas-library-data.js',
 'public/js/proof-atlas-source-cut-union.js','public/js/proof-atlas-notation-refinement.js','public/js/proof-atlas-occurrence-types.js','public/js/proof-atlas-geometry-core.js','research/proof-atlas/region-context-projection/model.cjs'];
const fingerprints=()=>Object.fromEntries(dependencies.map(file=>[file,sha(fs.readFileSync(file))])),initial=fingerprints();
const report={format:'ProofAtlasSourceTemplatePagesModel/1',status:'RUNNING',cases:0,rows:0,originalRows:0,components:0,cuts:0,bindings:0,derivedDefinitions:0,templates:0,permutations:0,sourcePorts:0,variablePortTargets:0,fixedPorts:0,
 sourceReferences:0,localReferences:0,notationScenes:0,notationBinderTargets:0,refusals:0,peakRows:0,peakIndices:0,peakNotationRows:0,peakNotationObjects:0};
const virtual=new Map();let requests=0;
async function fetcher(file){assert(file.startsWith(assetBase)&&/^\w{64}\.(manifest|index|page)\.gz$/.test(file.slice(assetBase.length)),'Unexpected or complete-table request: '+file);requests++;return new Response(virtual.get(file)||fs.readFileSync('.'+file));}
const binds=(kind,slot)=>((kind===6||kind===7)&&slot===1)||(kind===8&&slot===2);
function at(g,root,slots){let node=root;const scope=[];for(const [depth,slot]of slots.entries()){assert(slot<g.children[node].length);if(binds(g.kind[node],slot))scope.push({node,slots:slots.slice(0,depth)});node=g.children[node][slot];}return{node,scope};}
function rootDigests(g){const out=[];for(let i=0;i<g.kind.length;i++){assert(g.children[i].every(id=>id<i));out.push(sha(Buffer.from(JSON.stringify([g.kind[i],g.payloads[i],g.children[i].map(id=>out[id]),g.expanded[i],g.neededScope[i]]))));}return out;}
function reference(g,root,slots,context){const picked=at(g,root,slots);function point(node,path,scope){let binding=null;if(g.kind[node]===0){const index=g.payloads[node].index;if(index<scope.length){const target=scope.at(-1-index);binding={relation:'computed-local-binder',node:target.node,slots:target.slots};}else{const target=context.at(-1-(index-scope.length));assert(target,'unbound reference in oracle');binding={relation:'original-context-binder',node:target.node,slots:target.route.slots};}}return{node,slots:path,kind:A.kinds[g.kind[node]],expanded:g.expanded[node],binding};}
 return[point(picked.node,slots,picked.scope),...g.children[picked.node].map((child,slot)=>point(child,[...slots,slot],binds(g.kind[picked.node],slot)?[...picked.scope,{node:picked.node,slots}]:picked.scope))];}
function compare(cut,expected){assert.equal(cut.stats.retained,expected.length);assert.equal(BigInt(cut.stats.retained)+BigInt(cut.stats.hidden),BigInt(cut.stats.represented));for(const[i,p]of[cut.root,...cut.children].entries()){const e=expected[i];assert.equal(p.address.node,e.node);assert.deepEqual(p.address.route.slots,e.slots);assert.equal(p.kind,e.kind);assert.equal(p.expanded,e.expanded);if(e.binding){assert.equal(p.binding.relation,e.binding.relation);assert.equal(p.binding.address.node,e.binding.node);assert.deepEqual(p.binding.address.route.slots,e.binding.slots);report[e.binding.relation==='original-context-binder'?'sourceReferences':'localReferences']++;}else assert.equal(p.binding,null);}report.cuts++;}
function witnesses(g,root){const todo=[{node:root,slots:[],depth:0}],seen=new Set(),found=new Map();for(let i=0;i<todo.length;i++){const p=todo[i],key=p.node+':'+p.depth;if(seen.has(key))continue;seen.add(key);assert(seen.size<=262144);if(g.kind[p.node]===0){const kind=g.payloads[p.node].index<p.depth?'local':'source';if(!found.has(kind))found.set(kind,p.slots);if(found.size===2)break;}if(p.slots.length<128)for(const[slot,node]of g.children[p.node].entries())todo.push({node,slots:[...p.slots,slot],depth:p.depth+Number(binds(g.kind[p.node],slot))});}return[...found.values()];}
const sourceAddress=(profile,anchor)=>({namespace:'source-expression',name:profile.source.name,indexSha256:profile.source.indexSha256,sourceSha256:profile.source.sourceSha256,node:anchor.node,route:anchor.route});
function objects(root,out=[]){out.push(root);for(const child of root.children)objects(child.value,out);return out;}
function notationReference(g,m,componentIndex,d,profile,slots){const component=m.components[componentIndex],entry=registry.registries.find(r=>r.nativeInventorySha256===d.nativeInventorySha256),source=entry.sources.find(s=>P.sourceEqual(s.source,profile.source));assert(source);const frames=component.scope==='original'?source.context:component.scope==='reduced'?m.keptContextSlots.map(i=>source.context[i]):[];
 const ambient=frames.map(f=>({name:f.name,address:sourceAddress(profile,f)})),owner={namespace:'region-input-notation',sourceIndexSha256:profile.source.indexSha256,nativeInventorySha256:d.nativeInventorySha256,nativeCaseSha256:d.nativeCaseSha256,manifestSha256:d.sha256,case:m.id,component:component.component,typeRoot:componentIndex,catalogueObjectSha256:registry.catalogueObjectSha256,environmentSha256:registry.environmentSha256};
 const selected=M.walk(g,component.root,slots),address=(node,slots)=>({...owner,node,slots}),activeCatalog=entry.mode==='full'?catalog:{...catalog,entries:catalog.entries.filter(e=>registry.coreNames.includes(e.name))};
 const scene=N.scene(g,selected.node,activeCatalog,{slots,address,context:[...ambient,...selected.scope.map(f=>({name:g.payloads[f.node].binderName||g.payloads[f.node].declName||'_',address:address(f.node,f.path)}))]});
 for(const n of objects(scene.root))if(n.kind==='reference'){const picked=at(g,component.root,n.slots),index=g.payloads[picked.node].index,frame=picked.scope.at(-1-index),target=index<picked.scope.length?address(frame.node,frame.slots):ambient.at(-1-(index-picked.scope.length)).address;assert.deepEqual(n.head.target.address||n.head.target.origin,target);report.notationBinderTargets++;}return scene;
}
async function refused(fn,pattern){await assert.rejects(fn,pattern);report.refusals++;}
async function main(){
 for(const [pi,profile]of native.profiles.entries()){
  const sourceBytes=z.gunzipSync(fs.readFileSync('.'+profile.record.indexFile));assert.equal(sha(sourceBytes),profile.source.indexSha256);const source=A.validateIndex(JSON.parse(sourceBytes),profile.record);
  for(const[ci,candidate]of profile.native.cases.entries()){
   const d=inventory.profiles[pi].cases[ci];assert.equal(d.nativeCaseSha256,sha(Buffer.from(JSON.stringify(candidate))));const cursor=await P.open(d,profile.source,{fetcher}),m=cursor.manifest;
   const g={serialization:'ExprDAG/1',roots:m.components.map(c=>c.root)};for(const f of fields)g[f]=[];
   for(let id=0;id<m.nodeCount;id++){const row=await cursor.readNode(id);fields.forEach((f,j)=>g[f].push(row[j]));if(id<candidate.graph.kind.length){assert.deepEqual(row,fields.map(f=>candidate.graph[f][id]));report.originalRows++;}report.rows++;}
   T.validateExpressionGraph(g,g.roots,m.commonContext.length,131072);const digests=rootDigests(g);
   for(const [i,component]of m.components.entries()){
    const owner=component.nativeOwner,ng=owner.kind==='function'?candidate.graph:owner.kind==='constraint'?candidate.constraints[owner.index].graph:candidate.templates[owner.index].graph;
    assert.equal(digests[component.root],rootDigests(ng)[ng.roots[owner.root]],'native root and original context');
    for(const slots of[[],...g.children[component.root].map((_,slot)=>[slot]),...witnesses(g,component.root)])compare(await cursor.neighborhood(component.component,slots),reference(g,component.root,slots,m.context[component.scope]));
    const notationPaths=[[],...(i===0?cursor.bindings.flatMap(b=>[b.domain.route.slots,...(b.kind==='derived-input'?[b.value.route.slots]:[])]):[])];
    for(const slots of notationPaths){const notation=await cursor.openNotation(component.component,slots,{catalog,registry});assert.deepEqual(notation.scene,notationReference(g,m,i,d,profile,slots));const state=notation.state();assert(state.cachedRows<=8192&&state.decodedRowBytes<=4194304&&notation.scene.stats.nodes<=192);assert.equal(state.completeTableArraysAllocated,0);report.peakNotationRows=Math.max(report.peakNotationRows,state.peakRows);report.peakNotationObjects=Math.max(report.peakNotationObjects,notation.scene.stats.nodes);notation.dispose();report.notationScenes++;}
    report.components++;
   }
   assert.deepEqual(m.creationOrder.map(key=>candidate.bindings.find(b=>b.key===key).key),m.creationOrder);
   for(const [i,b]of cursor.bindings.entries()){
    const original=candidate.bindings[i];assert.equal(b.key,original.key);assert.equal(b.kind,original.port.kind);assert.equal(b.call,original.port.call);assert.equal(b.slot,original.port.slot);
    const record=profile.records.find(r=>r.index===b.call);assert.deepEqual(b.original,sourceAddress(profile,b.kind==='result'?record.anchor:record.ports[b.slot].input));
    for(const address of[b.binder,b.domain,...(b.value?[b.value]:[])]){const cut=await cursor.neighborhood(address.component,address.route.slots);assert.deepEqual(cut.root.address,address);compare(cut,reference(g,m.components[0].root,address.route.slots,m.context.original));}
    if(b.kind==='derived-input'){assert.equal(m.derivations[b.constraint].bindingKey,b.key);assert.deepEqual(m.derivations[b.constraint].predecessorKeys,candidate.constraints[b.constraint].contextBindingKeys);report.derivedDefinitions++;}report.bindings++;
   }
   for(const t of m.templates){const original=candidate.templates[t.index];assert.equal(t.bindingKey,original.bindingKey);assert.deepEqual(t.patterns.map(p=>({group:p.group,targets:p.targets})),original.usedGroups.map(group=>({group,targets:original.groups[group].targets})));report.templates++;}
   assert.deepEqual(m.permutations,candidate.permutations.map(({cause,old,new:next,kernelContextTyping})=>({cause,old,new:next,kernelContextTyping})));report.permutations+=m.permutations.length;
   // Derive each argument occurrence by unrolling its actual let-value spine,
   // then resolve the variable against the preceding declarations. This does
   // not use the producer's computed slot formula or displayed binding name.
   for(const call of profile.order){const resultIndex=cursor.bindings.findIndex(b=>b.kind==='result'&&b.call===call),result=cursor.bindings[resultIndex],record=profile.records.find(r=>r.index===call),ports=[];let node=result.value.node,slots=[...result.value.route.slots];
    while(g.kind[node]===5){ports.unshift({node:g.children[node][1],slots:[...slots,1]});node=g.children[node][0];slots.push(0);}ports.unshift({node,slots});assert.equal(ports.length,record.ports.length);
    for(const [slot,point]of ports.entries()){const mapped=cursor.portMap.find(p=>p.call===call&&p.slot===slot),sourcePort=record.ports[slot];assert(mapped);assert.deepEqual(mapped.original,sourceAddress(profile,sourcePort.input));assert.equal(A.walk(source,sourcePort.input.route),sourcePort.input.node);assert.equal(mapped.counterpart.node,point.node);assert.deepEqual(mapped.counterpart.route.slots,point.slots);
     const boundary=cursor.bindings.find(b=>b.kind!=='result'&&b.call===call&&b.slot===slot),producer=profile.members.includes(sourcePort.knownProducer)?cursor.bindings.find(b=>b.kind==='result'&&b.call===sourcePort.knownProducer):null;
     const expected=producer||boundary;assert.equal(mapped.relation,producer?'internal-source-use':boundary?.kind==='derived-input'?'derived-boundary':boundary?'independent-boundary':'fixed-boundary');assert.equal(mapped.bindingKey,expected?.key||null);
     if(expected){assert.equal(g.kind[point.node],0);const target=cursor.bindings[resultIndex-1-g.payloads[point.node].index];assert(target);assert.equal(target.key,expected.key);const cut=await cursor.neighborhood('function.original',point.slots);assert.deepEqual(cut.root.binding.address,target.binder);report.variablePortTargets++;}else report.fixedPorts++;
     compare(await cursor.neighborhood('function.original',point.slots),reference(g,m.components[0].root,point.slots,m.context.original));report.sourcePorts++;
    }
   }
   await refused(()=>cursor.neighborhood('unknown'),/component path/);await refused(()=>cursor.neighborhood('function.original',Array(513).fill(1)),/component path/);
   const state=cursor.state();assert(state.peakCachedRows<=64&&state.peakIndexPages<=2&&state.cachedPages<=1);assert.equal(state.fullTableArchiveRequests,0);report.peakRows=Math.max(report.peakRows,state.peakCachedRows);report.peakIndices=Math.max(report.peakIndices,state.peakIndexPages);
   cursor.dispose();assert.equal(cursor.state().cachedRows,0);assert.equal(cursor.state().indexPages,0);await refused(()=>cursor.readNode(0),/disposed/);report.cases++;
  }
 }
 const d=inventory.profiles[0].cases.find(c=>c.id==='all-boundary-positions'),manifest=read('.'+d.file);
 async function altered(change){const m=copy(manifest);change(m);const bytes=Buffer.from(JSON.stringify(m)),sha256=sha(bytes),file=assetBase+sha256+'.manifest.gz';virtual.set(file,z.gzipSync(bytes));await refused(()=>P.open({...d,file,sha256,bytes:bytes.length},d.source,{fetcher}));virtual.clear();}
 for(const change of[
  m=>m.format='ProofAtlasRegionFunctionPages/1',m=>m.constraintRule='foreign',m=>m.components[0].nativeOwner.root++,m=>m.components.at(-1).scope='closed',m=>m.components.at(-1).nativeOwner.root++,
  m=>m.bindings[0].key='foreign',m=>m.creationOrder.reverse(),m=>m.bindings.find(b=>b.kind==='derived-input').constraint=999,m=>m.derivedInputs++,
  m=>m.derivations[0].bindingKey='foreign',m=>m.derivations[0].predecessorKeys.push(m.derivations[0].bindingKey),m=>m.derivations[0].kernelSourceEqualityWitness='FAIL',m=>m.derivations[0].components.witness=m.derivations[0].components.original,
  m=>m.templates[0].relation='source-use',m=>m.templates[0].patterns[0].targets=['foreign'],m=>m.permutations[0].new.reverse(),m=>m.permutations[0].kernelContextTyping='FAIL',
  m=>m.portMap[0].slots=[0],m=>m.portMap[0].slot++,m=>m.portMap.pop(),m=>m.nodeCount=131073,m=>m.context.reduced=[]
 ])await altered(change);
 await refused(()=>P.open(d,{...d.source,name:'foreign'},{fetcher}),/identity/);
 virtual.set(d.file,z.gzipSync(Buffer.alloc(P.limits.manifestBytes+1)));await refused(()=>P.open(d,d.source,{fetcher}),/byte bound/);virtual.clear();
 const aborted=new AbortController();aborted.abort(Error('test cancellation'));await refused(()=>P.open(d,d.source,{fetcher,signal:aborted.signal}),/cancellation/);
 let held=false,entered,resume;const arrival=new Promise(r=>entered=r),gate=new Promise(r=>resume=r),cursor=await P.open(d,d.source,{fetcher:async file=>{if(held){entered();await gate;}return fetcher(file);}});held=true;
 const active=cursor.readNode(0);await arrival;const pending=cursor.readNode(1),reject=assert.rejects(()=>pending,/superseded/),latest=cursor.readNode(2);assert.equal(cursor.state().pendingOperations,1);resume();await reject;await active;await latest;assert.equal(cursor.state().pendingOperations,0);report.refusals++;cursor.dispose();
 let started,release;const start=new Promise(r=>started=r),hold=new Promise(r=>release=r);held=false;const retired=await P.open(d,d.source,{fetcher:async file=>{if(held){started();await hold;}return fetcher(file);}});held=true;const task=retired.readNode(0);await start;retired.dispose();release();await refused(()=>task,/disposed/);assert.equal(retired.state().cachedRows,0);
 assert.equal(report.cases,30);assert.equal(report.components,424);assert.equal(report.derivedDefinitions,23);assert.equal(report.templates,3);assert.equal(report.permutations,1);assert.equal(report.sourcePorts,339);assert(report.sourceReferences&&report.localReferences&&report.notationBinderTargets);assert(report.variablePortTargets&&report.fixedPorts);
 assert.deepEqual(fingerprints(),initial,'Executed inputs changed');report.files=initial;report.status='PASS';report.requests=requests;report.scope='Finite independent native-row/root comparisons, lexical cuts, actual application-spine counterparts and complete-vs-paged notation. Offline oracles retain full graphs; consumer page/notation bounds are checked separately. No new kernel judgments, semantic-equivalence theorem or comprehension result.';
 const bytes=Buffer.from(JSON.stringify(report,null,2)+'\n');if(process.argv.includes('--check')){const old=read(base+'model-check.json.gz');assert.deepEqual(report,old);}else fs.writeFileSync(base+'model-check.json.gz',z.gzipSync(bytes,{mtime:0}));console.log(JSON.stringify({...report,files:undefined}));
}
main().catch(error=>{console.error(error.stack);process.exitCode=1;});
