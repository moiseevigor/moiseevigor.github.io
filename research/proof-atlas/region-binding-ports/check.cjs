'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict'),M=require('./model.cjs'),S=require('../binder-support/model.cjs'),A=require('../../../public/js/proof-atlas-library-data'),P=require('../../../public/js/proof-atlas-corpus-boundary-pages'),R=require('../../../public/js/proof-atlas-region-binding-pages');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/region-binding-ports/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),hash=f=>sha(fs.readFileSync(f)),read=f=>JSON.parse(z.gunzipSync(fs.readFileSync(f))),registry=file=>{const host={};vm.runInNewContext(fs.readFileSync(file,'utf8'),{window:host});return JSON.parse(JSON.stringify(Object.values(host)[0]));};
const input='research/proof-atlas/corpus-definition-boundaries/native-check.json.gz',bundle=read(input),descriptors=registry('public/data/proof-atlas/corpus-boundaries-manifest.js').cases,bindings=registry('public/data/proof-atlas/region-bindings-manifest.js').cases;
const report={format:'ProofAtlasRegionBindingModel/1',status:'PASS',cases:0,components:0,rows:0,coefficients:0,selections:0,ports:0,weightedOracles:0,peakCachedRows:0,peakIndexPages:0,refusals:0,controls:{},files:{}};
const fetcher=async file=>{assert(file.startsWith(P.base)||file.startsWith(R.base));return new Response(fs.readFileSync('.'+file));};
function candidates(g,root){const todo=[{node:root,slots:[]}],seen=new Set(),out=[[]];for(let i=0;i<todo.length&&out.length<18;i++){const item=todo[i];if(seen.has(item.node))continue;seen.add(item.node);if(g.neededScope[item.node]>0||[6,7,8].includes(g.kind[item.node]))out.push(item.slots);if(item.slots.length<512)g.children[item.node].forEach((node,s)=>todo.push({node,slots:[...item.slots,s]}));}return out;}
(async()=>{
 for(const p of bundle.profiles)for(const entry of p.cases){
  const d=descriptors.find(d=>d.source.indexSha256===p.source.indexSha256&&d.id===entry.plan.id),bd=bindings.find(x=>x.graphManifestSha256===d.sha256),g=entry.native.result.graph,counter=S.counter(g),graph=await P.open(d,{fetcher}),support=await R.open(bd,d,graph.header,{fetcher});
  // Stream every stored row through the actual consumer. No full support archive.
  for(let node=0;node<g.kind.length;node++){
   const summary=await support.summary(node,g.expanded[node],g.neededScope[node]),expected=counter.at(node);assert.equal(summary.node,node);assert.equal(summary.localReferences,expected.localReferences);assert.deepEqual(summary.free,expected.free);assert.equal(summary.owner.nativeCaseSha256,d.nativeCaseSha256);assert.equal(summary.owner.graphManifestSha256,d.sha256);report.rows++;report.coefficients+=summary.free.length;
  }
  for(const[ci,component]of P.components.entries()){
   const paths=candidates(g,g.roots[ci]);
   if(component==='source.term')paths.push(...entry.native.result.sourceSpine.map(r=>r.path));
   if(component==='interface.term')paths.push(...entry.native.result.normalSpine.map(r=>r.path));
   for(const slots of paths){
    const scene=await graph.inspect(component,slots),node=A.walk(g,{root:ci,slots}),raw=counter.at(node),tuple=[raw.localReferences,raw.free.map(r=>[r.index,r.count])];assert.equal(scene.root.tableNode,node);assert.equal(scene.root.neededScope,g.neededScope[node]);
    const summary=await support.summary(node,scene.root.expanded,scene.root.neededScope),pages=Math.max(1,Math.ceil(summary.portCount/4));
    for(let page=0;page<pages;page++){
     const model=M.boundary(g,g.roots[ci],slots,tuple,page),free=summary.free.slice(page*4,page*4+4),cut=await graph.inspect(component,slots,{referenceIndices:free.map(r=>r.index)});
     assert.equal(cut.contextDepth,model.contextDepth);assert.equal(cut.referenceTargets.length,model.ports.length);for(const[i,target]of cut.referenceTargets.entries()){const expected=model.ports[i];assert.equal(target.index,expected.index);assert.deepEqual(target.locator,{component,slots:expected.slots});assert.equal(target.kind,A.kinds[g.kind[expected.binder]]);const opened=await graph.inspect(component,target.locator.slots);assert.deepEqual(opened.root.address,target.address);report.ports++;}
    }
    if(report.selections%17===0){assert.deepEqual(raw,S.weighted(g,node));report.weightedOracles++;}report.selections++;
   }report.components++;
  }
  for(const fn of[()=>graph.inspect('interface.term',[],{referenceIndices:[0]}),()=>graph.inspect('source.term',[],{referenceIndices:[0,0]}),()=>graph.inspect('source.term',[],{referenceIndices:[0,1,2,3,4]}),()=>support.summary(g.kind.length,'1',0),()=>support.summary(0,'1',512)]){await assert.rejects(fn);report.refusals++;}
  const state=support.state();assert(state.peakCachedRows<=64&&state.peakIndexPages<=2);report.peakCachedRows=Math.max(report.peakCachedRows,state.peakCachedRows);report.peakIndexPages=Math.max(report.peakIndexPages,state.peakIndexPages);graph.dispose();support.dispose();assert.equal(support.state().cachedRows,0);assert.equal(graph.state().cachedRows,0);await assert.rejects(()=>support.summary(0,'1',0));report.refusals++;report.cases++;
 }
 // Native typed counterexample: one identical row, two different exact binders.
 const control=read('research/proof-atlas/scoped-dag-rewrite/controls.json.gz').observation.regressions,g=control.graph,counter=S.counter(g),left=[1,1,0,1],right=[1,1,1,1],ln=A.walk(g,{root:1,slots:left}),rn=A.walk(g,{root:1,slots:right});assert.equal(ln,rn);assert.equal(control.kernelInequalityProof,'PASS');
 const raw=counter.at(ln),tuple=[raw.localReferences,raw.free.map(r=>[r.index,r.count])],a=M.boundary(g,g.roots[1],left,tuple),b=M.boundary(g,g.roots[1],right,tuple);assert.notDeepEqual(a.ports.map(r=>r.slots),b.ports.map(r=>r.slots));assert.deepEqual(a.ports.map(r=>r.slots),[[1],[]]);assert.deepEqual(b.ports.map(r=>r.slots),[[1,1,1],[1]]);report.controls.sameRowDifferentBinders=true;
 const stress=read('research/proof-atlas/scoped-dag-rewrite/stress.json.gz').observation,h=stress.graph,counts=S.counter(h),body=[1,1,1,1],n=A.walk(h,{root:5,slots:body}),s=counts.at(n),boundary=M.boundary(h,h.roots[5],body,[s.localReferences,s.free.map(r=>[r.index,r.count])]);assert.equal(boundary.occurrences,s.occurrences);assert(BigInt(s.occurrences)>2n**64n);assert.deepEqual(s,S.weighted(h,n));report.controls.sharedProgram={jointRows:h.kind.length,selectedOccurrences:s.occurrences,localReferences:s.localReferences,free:s.free,ports:boundary.ports.length};
 const d=descriptors[0],bd=bindings.find(b=>b.graphManifestSha256===d.sha256),owner=await P.open(d,{fetcher});for(const patch of[{nativeCaseSha256:'f'.repeat(64)},{graphManifestSha256:'e'.repeat(64)},{source:{...bd.source,indexSha256:'a'.repeat(64)}}]){await assert.rejects(()=>R.open({...bd,...patch},d,owner.header,{fetcher}));report.refusals++;}owner.dispose();
 // A single worker plus the latest pending request keeps rapid navigation bounded.
 const choose=descriptors.at(-2),chosen=bindings.find(b=>b.graphManifestSha256===choose.sha256),graph=await P.open(choose,{fetcher});let release,arrive;const gate=new Promise(r=>release=r),arrival=new Promise(r=>arrive=r);let block=true;
 const slow=async(file,options)=>{if(block&&file.endsWith('.page.gz')){block=false;arrive();await gate;}return fetcher(file,options);};
 const support=await R.open(chosen,choose,graph.header,{fetcher:slow}),target=graph.header.components[0].root,profile=bundle.profiles.find(p=>p.source.indexSha256===choose.source.indexSha256),entry=profile.cases.find(e=>e.plan.id===choose.id),cg=entry.native.result.graph;
 const first=support.summary(target,cg.expanded[target],cg.neededScope[target]);await arrival;
 const middle=support.summary(0,cg.expanded[0],cg.neededScope[0]).then(()=>false,()=>true),last=support.summary(1,cg.expanded[1],cg.neededScope[1]);assert.equal(support.state().pendingOperations,1);release();await first;assert.equal(await middle,true);await last;assert.equal(support.state().pendingOperations,0);support.dispose();graph.dispose();report.controls.latestPendingOnly=true;
 let graphRelease,graphArrive;const graphGate=new Promise(r=>graphRelease=r),graphArrival=new Promise(r=>graphArrive=r);let graphBlock=true;
 const slowGraph=async(file,options)=>{if(graphBlock&&file.endsWith('.page.gz')){graphBlock=false;graphArrive();await graphGate;}return fetcher(file,options);};
 const queuedGraph=await P.open(choose,{fetcher:slowGraph}),graphFirst=queuedGraph.inspect('interface.term');await graphArrival;
 const graphMiddle=queuedGraph.inspect('source.term').then(()=>false,()=>true),graphLast=queuedGraph.inspect('source.declaredType');assert.equal(queuedGraph.state().pendingOperations,1);graphRelease();await graphFirst;assert.equal(await graphMiddle,true);await graphLast;assert.equal(queuedGraph.state().pendingOperations,0);queuedGraph.dispose();report.controls.graphLatestPendingOnly=true;
 assert.equal(report.cases,11);assert.equal(report.components,88);assert.equal(report.rows,439780);assert.equal(report.coefficients,759794);
 report.files=Object.fromEntries([input,'public/data/proof-atlas/corpus-boundaries-manifest.js','public/data/proof-atlas/region-bindings-manifest.js','public/js/proof-atlas-corpus-boundary-pages.js','public/js/proof-atlas-region-binding-pages.js','research/proof-atlas/binder-support/model.cjs',base+'model.cjs',base+'check.cjs','research/proof-atlas/scoped-dag-rewrite/controls.json.gz','research/proof-atlas/scoped-dag-rewrite/stress.json.gz'].map(f=>[f,hash(f)]));
 report.scope='All 439780 reference rows and finite occurrence-qualified consumer paths across 88 closed components. General reference laws and original whole-root typing are inherited. No new arbitrary-region typing, premise-necessity or comprehension result.';
 const bytes=Buffer.from(JSON.stringify(report,null,2)+'\n');if(process.argv.includes('--check'))assert(z.gunzipSync(fs.readFileSync(base+'model-check.json.gz')).equals(bytes));else fs.writeFileSync(base+'model-check.json.gz',z.gzipSync(bytes));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
