'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict');
const T=require('../../../public/js/proof-atlas-type-notation'),S=require('../../../public/js/proof-atlas-paged-notation'),R=require('../../../public/js/proof-atlas-notation-refinement'),U=require('../../../public/js/proof-atlas-source-cut-union'),P=require('../../../public/js/proof-atlas-region-function-pages'),M=require('../region-context-projection/model.cjs');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/paged-type-notation/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=f=>JSON.parse(z.gunzipSync(fs.readFileSync(f))),copy=x=>JSON.parse(JSON.stringify(x)),host={};
for(const file of['type-notation-catalog','paged-notation-bindings','region-function-pages-manifest','dependent-region-function-pages-manifest','region-adapter-function-pages-manifest'])vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+file+'.js','utf8'),{window:host});
const h=copy(host),catalog=h.PROOF_ATLAS_TYPE_NOTATION,registry=h.PROOF_ATLAS_PAGED_NOTATION_BINDINGS;
const dependencyFiles=[base+'check.cjs',base+'bindings.cjs',base+'verify.py',base+'environment.json.gz',base+'bindings.json.gz','public/js/proof-atlas-paged-notation.js','public/js/proof-atlas-type-notation.js','public/js/proof-atlas-source-cut-union.js','public/js/proof-atlas-notation-refinement.js','public/js/proof-atlas-region-function-pages.js','public/js/proof-atlas-library-data.js','public/data/proof-atlas/type-notation-catalog.js','public/data/proof-atlas/paged-notation-bindings.js','research/proof-atlas/region-context-projection/model.cjs'];
const fingerprints=()=>Object.fromEntries(dependencyFiles.map(f=>[f,sha(fs.readFileSync(f))])),initialFiles=fingerprints();
const report={format:'ProofAtlasPagedNotationModel/1',status:'RUNNING',legacyPackets:0,legacyCuts:0,regionCases:0,componentRoots:0,fieldDomains:0,adapterEndpoints:0,refinements:0,regionRefinements:0,unchangedOutside:0,binderTargets:0,refusals:0,peakRows:0,peakBytes:0,peakObjects:0,controls:[]};
const rows=g=>async id=>['kind','children','payloads','expanded','neededScope'].map(f=>g[f][id]);
function reference(g,owner,ambient,slots=[],activeCatalog=catalog){const at=M.walk(g,g.roots[owner.typeRoot],slots),address=(node,slots)=>({...owner,node,slots});return T.scene(g,at.node,activeCatalog,{slots,address,context:[...ambient,...at.scope.map(s=>({name:g.payloads[s.node].binderName||g.payloads[s.node].declName||'_',address:address(s.node,s.path)}))]});}
function objects(root,out=[]){out.push(root);for(const c of root.children)objects(c.value,out);return out;}
function stats(lease,scene){const s=lease.state();assert(s.cachedRows<=8192&&s.decodedRowBytes<=4194304);assert.equal(s.completeTableArraysAllocated,0);assert(scene.stats.nodes<=192&&scene.stats.metadataBytes<=4194304);report.peakRows=Math.max(report.peakRows,s.peakRows);report.peakBytes=Math.max(report.peakBytes,s.peakBytes);report.peakObjects=Math.max(report.peakObjects,scene.stats.nodes);}
function bindings(g,owner,ambient,scene){for(const n of objects(scene.root))if(n.kind==='reference'){const at=M.walk(g,g.roots[owner.typeRoot],n.slots),index=g.payloads[at.node].index,target=index<at.scope.length?{...owner,node:at.scope.at(-1-index).node,slots:at.scope.at(-1-index).path}:ambient.at(-1-(index-at.scope.length)).address;assert.deepEqual(n.head.target.address||n.head.target.origin,target);report.binderTargets++;}}
async function main(){
 const input=read('research/proof-atlas/region-native-types/packets.json.gz');
 for(const file of Object.keys(input.files).filter(f=>f.startsWith('public/data/proof-atlas/region-native-types/'))){
  assert.equal(sha(fs.readFileSync(file)),input.files[file]);const packet=read(file),g=packet.types;
  for(const typeRoot of[0,1]){
   const owner={namespace:'paged-notation-legacy',recordSha256:packet.evidence.recordSha256,typeRoot},ambient=(typeRoot===0?packet.frames:packet.query.keptSlots.map(s=>packet.frames[s])).map(f=>({name:f.name,address:f.address}));
   const lease=S.open({read:rows(g),nodeCount:g.kind.length,roots:g.roots,owner,catalog,context:ambient}),todo=[[]],seen=new Set();
   for(let i=0;i<todo.length;i++){
    const slots=todo[i],at=M.walk(g,g.roots[typeRoot],slots),key=at.node+':'+at.scope.map(s=>s.node).join(',');if(seen.has(key))continue;seen.add(key);
    let actual=await lease.inspect(slots),expected=reference(g,owner,ambient,slots);assert.deepEqual(actual,expected);bindings(g,owner,ambient,actual);stats(lease,actual);report.legacyCuts++;
    for(let step=0;step<192;step++){
     const frontier=objects(actual.root).find(n=>n.kind==='frontier');if(!frontier)break;
     let replacement=reference(g,owner,ambient,frontier.slots);if(replacement.root.kind==='frontier')replacement=R.openConstructor(g,replacement);
     let next;try{next=R.refine(g,expected,frontier.slots,replacement);}catch(e){assert(/limit|cannot open/.test(e.message));await assert.rejects(()=>lease.expand(actual,frontier.slots));break;}
     const old=actual;actual=await lease.expand(actual,frontier.slots);expected=next;assert.deepEqual(actual,expected);assert(U.refines(g,U.fromNotation(g,old),U.fromNotation(g,actual)));
     const byPath=new Map(objects(actual.root).map(n=>[JSON.stringify(n.slots),n]));
     for(const n of objects(old.root))if(!n.slots.every((s,j)=>s===frontier.slots[j])&&!frontier.slots.every((s,j)=>s===n.slots[j])){assert.equal(byPath.get(JSON.stringify(n.slots)),n);report.unchangedOutside++;}
     bindings(g,owner,ambient,actual);stats(lease,actual);report.refinements++;
    }
    g.children[at.node].forEach((_,slot)=>todo.push([...slots,slot]));
   }
   lease.dispose();assert.equal(lease.state().cachedRows,0);
  }report.legacyPackets++;
 }
 for(const[name,inventory]of[['region-input-functions',h.PROOF_ATLAS_REGION_FUNCTION_PAGES],['dependent-region-inputs',h.PROOF_ATLAS_DEPENDENT_REGION_FUNCTION_PAGES],['region-input-adapters',h.PROOF_ATLAS_REGION_ADAPTER_FUNCTION_PAGES]]){
  const native=read('research/proof-atlas/'+name+'/native.json.gz');
  for(const profile of native.profiles)for(const c of profile.native.cases){if(c.status!=='PASS')continue;
   const d=inventory.profiles.find(p=>p.source.indexSha256===profile.source.indexSha256).cases.find(d=>d.id===c.policy),cursor=await P.open(d,profile.source,{fetcher:async f=>new Response(fs.readFileSync('.'+f))}),m=cursor.manifest;
   const binding=registry.registries.find(r=>r.nativeInventorySha256===d.nativeInventorySha256),source=binding.sources.find(s=>s.source.indexSha256===profile.source.indexSha256),activeCatalog=binding.mode==='core'?{...catalog,entries:catalog.entries.filter(e=>registry.coreNames.includes(e.name))}:catalog;
   for(const[componentIndex,component]of m.components.entries()){
    const frames=component.scope==='original'?source.context:component.scope==='reduced'?m.keptContextSlots.map(i=>source.context[i]):[],ambient=frames.map(f=>({name:f.name,address:{namespace:'source-expression',name:profile.source.name,indexSha256:profile.source.indexSha256,sourceSha256:profile.source.sourceSha256,node:f.node,route:f.route}}));
    const owner={namespace:'region-input-notation',sourceIndexSha256:profile.source.indexSha256,nativeInventorySha256:d.nativeInventorySha256,nativeCaseSha256:d.nativeCaseSha256,manifestSha256:d.sha256,case:m.id,component:component.component,typeRoot:componentIndex,catalogueObjectSha256:registry.catalogueObjectSha256,environmentSha256:registry.environmentSha256};
    const paths=[[],...(componentIndex===0?cursor.bindings.flatMap(b=>[b.domain.route.slots,...(b.kind==='adapter'?[[...b.domain.route.slots,0],[...b.domain.route.slots,1]]:[])]):[])];
    for(const[pi,slots]of paths.entries()){
     const lease=await cursor.openNotation(component.component,slots,{catalog,registry}),expected=reference(c.graph,owner,ambient,slots,activeCatalog);
     assert.deepEqual(lease.scene,expected);bindings(c.graph,owner,ambient,lease.scene);stats(lease,lease.scene);assert(cursor.state().cachedRows<=64&&cursor.state().indexPages<=2);
     const frontier=objects(lease.scene.root).find(n=>n.kind==='frontier');
     if(frontier){
      let replacement=reference(c.graph,owner,ambient,frontier.slots,activeCatalog);if(replacement.root.kind==='frontier')replacement=R.openConstructor(c.graph,replacement);
      let combined;try{combined=R.refine(c.graph,expected,frontier.slots,replacement);}catch(e){assert(/limit|cannot open/.test(e.message));await assert.rejects(()=>lease.expand(lease.scene,frontier.slots));}
      if(combined){const expanded=await lease.expand(lease.scene,frontier.slots);assert.deepEqual(expanded,combined);bindings(c.graph,owner,ambient,expanded);stats(lease,expanded);report.regionRefinements++;}
     }
     if(pi===0)report.componentRoots++;else{const b=cursor.bindings.find(b=>JSON.stringify(b.domain.route.slots)===JSON.stringify(slots));if(b)report.fieldDomains++;else report.adapterEndpoints++;}
     lease.dispose();assert.equal(lease.state().cachedRows,0);
    }
   }
   cursor.dispose();report.regionCases++;
  }
 }
 assert.equal(report.legacyPackets,150);assert.equal(report.legacyCuts,11324);assert.equal(report.regionCases,57);assert.equal(report.componentRoots,570);assert.equal(report.fieldDomains,383);assert.equal(report.adapterEndpoints,18);assert(report.refinements>0&&report.unchangedOutside>0);
 const p=h.PROOF_ATLAS_REGION_FUNCTION_PAGES.profiles[0],d=p.cases.find(c=>c.id==='proof-arguments'),cursor=await P.open(d,p.source,{fetcher:async f=>new Response(fs.readFileSync('.'+f))});
 for(const mutate of[
  (c,r)=>c.entries[0].glyph='foreign',
  (c,r)=>r.registries.find(v=>v.nativeInventorySha256===d.nativeInventorySha256).nativeInventorySha256='0'.repeat(64),
  (c,r)=>r.registries.find(v=>v.nativeInventorySha256===d.nativeInventorySha256).sources[0].context[0].node++,
  (c,r)=>r.coreNames.pop(),(c,r)=>r.environmentSha256='foreign'
 ]){const damaged=copy(catalog),binding=copy(registry);mutate(damaged,binding);await assert.rejects(()=>cursor.openNotation('function.original',[],{catalog:damaged,registry:binding}));report.refusals++;}
 await cursor.neighborhood('function.original');cursor.dispose();
 const native=read('research/proof-atlas/type-notation/native.json.gz');
 const values=[];for(const c of native.controls){const lease=S.open({read:rows(c.graph),nodeCount:c.graph.kind.length,roots:c.graph.roots,owner:{namespace:'paged-typed-instance-control',typeRoot:0,control:c.name},catalog}),scene=await lease.inspect();assert.equal(scene.root.label,'+');values.push(scene.root.hiddenPorts.find(p=>p.slot===3));stats(lease,scene);lease.dispose();}
 assert.notDeepEqual(values[0],values[1]);report.controls.push('typed-instance-collision-retains-distinct-instances');
 const fixture=read('research/proof-atlas/projection-substitution/native.json.gz').graph;
 for(let kind=0;kind<12;kind++){
  const root=fixture.kind.indexOf(kind),g={...fixture,roots:[root]},owner={namespace:'paged-raw-constructor-control',kind,typeRoot:0},ambient=Array.from({length:g.neededScope[root]},(_,i)=>({name:'v'+i,address:{namespace:'raw-context',kind,i}}));
  const lease=S.open({read:rows(g),nodeCount:g.kind.length,roots:g.roots,owner,catalog,context:ambient}),scene=await lease.inspect();assert.deepEqual(scene,reference(g,owner,ambient));stats(lease,scene);lease.dispose();
 }report.controls.push('all-twelve-raw-constructors-not-new-typing');
 {
  const g={serialization:'ExprDAG/1',kind:[4],children:[[]],payloads:[{name:'f',nameParts:[{str:'f'}],levels:[]}],expanded:['1'],neededScope:[0],roots:[60]};
  for(let i=1;i<=60;i++){g.kind.push(5);g.children.push([i-1,i-1]);g.payloads.push({});g.expanded.push(String(1n+2n*BigInt(g.expanded[i-1])));g.neededScope.push(0);}
  const owner={namespace:'paged-shared-structural-control',typeRoot:0},lease=S.open({read:rows(g),nodeCount:61,roots:g.roots,owner,catalog});let current=await lease.inspect(),expected=reference(g,owner,[]),stopped=false;
  for(let i=0;i<192;i++){
   const frontier=objects(current.root).find(n=>n.kind==='frontier');if(!frontier)break;let replacement=reference(g,owner,[],frontier.slots);if(replacement.root.kind==='frontier')replacement=R.openConstructor(g,replacement);
   try{expected=R.refine(g,expected,frontier.slots,replacement);}catch(e){assert(/192-object limit/.test(e.message));await assert.rejects(()=>lease.expand(current,frontier.slots),/192-object limit/);assert.equal(lease.getScene(),current);stopped=true;break;}
   current=await lease.expand(current,frontier.slots);assert.deepEqual(current,expected);stats(lease,current);
  }
  assert(stopped);report.sharedControl={storedRows:61,represented:g.expanded[60],objects:current.stats.nodes,typingClaim:false,failedOpeningPreservesScene:true};lease.dispose();
 }
 {
  // A sparse joint table forces a later row-budget refusal. This is raw
  // storage calibration, not a typed proof or an AI benchmark.
  const g={serialization:'ExprDAG/1',kind:[],children:[],payloads:[],expanded:[],neededScope:[],roots:[9999]};
  for(let i=0;i<9998;i++){g.kind.push(4);g.children.push([]);g.payloads.push({name:'c'+i,nameParts:[{str:'c'+i}],levels:[]});g.expanded.push('1');g.neededScope.push(0);}
  for(const children of[[5000,0],[0,9998]]){g.kind.push(5);g.children.push(children);g.payloads.push({});g.expanded.push(String(1n+children.reduce((n,c)=>n+BigInt(g.expanded[c]),0n)));g.neededScope.push(0);}
  const lease=S.open({read:rows(g),nodeCount:10000,roots:g.roots,owner:{namespace:'paged-sparse-storage-control',typeRoot:0},catalog,rowLimit:80}),scene=await lease.inspect([0]);
  await assert.rejects(()=>lease.inspect([1]),/decoded row bound/);assert.equal(lease.getScene(),scene);assert.equal(lease.state().cachedRows,80);lease.dispose();report.controls.push('row-budget-refusal-preserves-prior-scene');
 }
 const g=native.controls[0].graph,owner={namespace:'paged-notation-refusal-control',typeRoot:0},request={read:rows(g),nodeCount:g.kind.length,roots:g.roots,owner,catalog};
 async function refused(fn){await assert.rejects(fn);report.refusals++;}
 const small=S.open({...request,rowLimit:1,batchSize:1});await refused(()=>small.inspect());assert(small.state().cachedRows<=1);small.dispose();
 const tiny=S.open({...request,byteLimit:1});await refused(()=>tiny.inspect());assert.equal(tiny.state().decodedRowBytes,0);tiny.dispose();
 const normal=S.open(request),scene=await normal.inspect();await refused(()=>normal.expand(copy(scene),[]));await refused(()=>normal.expand(scene,[]));await refused(()=>normal.inspect([2]));await refused(()=>normal.inspect(Array(513).fill(0)));
 normal.dispose();await refused(()=>normal.inspect());const aborted=new AbortController();aborted.abort(Error('cancelled'));await refused(()=>S.open({...request,signal:aborted.signal}).inspect());
 let entered,resume;const arrival=new Promise(r=>entered=r),gate=new Promise(r=>resume=r),retired=S.open({...request,read:async id=>{entered();await gate;return rows(g)(id);}}),pending=retired.inspect();await arrival;retired.dispose();resume();await refused(()=>pending);assert.equal(retired.state().cachedRows,0);
 report.files=fingerprints();assert.deepEqual(report.files,initialFiles,'Executed inputs changed during comparison');report.status='PASS';report.scope='Exact scene equality with the existing complete-table grammar, all 11,324 preceding type cuts and 57 recorded region functions. Source-cut refinements preserve counts and outside objects; binder links and hidden instances remain qualified. Delivery bounds are component bounds, not whole-heap or human-comprehension results.';
 fs.writeFileSync(base+'model-check.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n'),{mtime:0}));console.log(JSON.stringify({...report,files:undefined}));
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
