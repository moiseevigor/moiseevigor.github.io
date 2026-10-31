'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict');
const A=require('../../../public/js/proof-atlas-library-data'),P=require('../../../public/js/proof-atlas-corpus-boundary-pages'),R=require('../../../public/js/proof-atlas-region-binding-pages'),C=require('../../../public/js/proof-atlas-region-context'),N=require('../../../public/js/proof-atlas-region-native-types'),M=require('../region-context-projection/model.cjs');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/region-native-types/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),load=f=>JSON.parse(z.gunzipSync(fs.readFileSync(f))),clone=v=>JSON.parse(JSON.stringify(v)),registry=f=>{const w={};vm.runInNewContext(fs.readFileSync(f,'utf8'),{window:w});return clone(Object.values(w)[0]);};
const registryFile='public/data/proof-atlas/region-types-manifest.js',types=registry(registryFile),descriptors=registry('public/data/proof-atlas/corpus-boundaries-manifest.js').cases,bindings=registry('public/data/proof-atlas/region-bindings-manifest.js').cases,plan=load(base+'plan.json.gz');
let requests=0;const fetcher=async file=>{requests++;assert(!file.startsWith('/research/'),'whole evidence archive requested');return new Response(fs.readFileSync('.'+file));};
function actual(g,root,slots){let node=root,scope=[];slots.forEach((s,depth)=>{assert(s<g.children[node].length);if(M.binds(g.kind[node],s))scope.push({node,slots:slots.slice(0,depth)});node=g.children[node][s];});return{node,scope};}
(async()=>{
 const report={format:'ProofAtlasRegionTypeConsumer/1',status:'PASS',profiles:0,queries:0,typeCuts:0,ambientReferences:0,localReferences:0,refusals:0,peakRows:0,peakBytes:0};
 for(const profile of plan.profiles){
  const d=descriptors.find(d=>d.nativeCaseSha256===profile.nativeCaseSha256),graph=await P.open(d,{fetcher}),support=await R.open(bindings.find(b=>b.nativeCaseSha256===d.nativeCaseSha256),d,graph.header,{fetcher});
  for(const choice of profile.queries.filter(q=>q.part.kind==='term')){
   const scene=await graph.inspect(choice.component,choice.regionSlots),projection=await C.prepare(graph,support,scene),native=N.open(types,graph.header,{fetcher});
   const queries=profile.queries.filter(q=>q.component===choice.component);
   for(const q of queries){
    const cut=await(q.part.kind==='term'?projection.inspect():projection.inspectHeader(q.part.slot,q.part.role)),entry=native.match(cut);assert(entry);assert.equal(entry.record,q.id);
    const p=load('.'+entry.file),record=await native.load(cut);assert.equal(record.query.id,q.id);assert.deepEqual(record.query,q);
    assert.deepEqual(native.record(),record);assert.equal(record.judgments.kernelProjectedOpenTyping,'PASS');
    for(const typeRoot of[0,1]){
     const todo=[[]],seen=new Set();for(let i=0;i<todo.length;i++){
      assert(todo.length<=65536,'finite type traversal');const slots=todo[i],at=actual(p.types,p.types.roots[typeRoot],slots),key=at.node+':'+at.scope.map(s=>s.node).join(',');if(seen.has(key))continue;seen.add(key);
      const view=native.inspect(slots,{typeRoot}),k=p.types.kind[at.node];assert.equal(view.root.kind,A.kinds[k]);assert.equal(A.payloadKey(k,view.root.payload),A.payloadKey(k,p.types.payloads[at.node]));assert.equal(view.root.expanded,p.types.expanded[at.node]);assert.equal(view.root.neededScope,p.types.neededScope[at.node]);assert(view.stats.vertices<=4);assert.equal(BigInt(view.stats.hiddenOccurrences)+BigInt(view.stats.vertices),BigInt(view.root.expanded));assert.equal(view.root.address.namespace,'region-native-type');assert.equal(view.root.address.recordSha256,p.evidence.recordSha256);assert.equal(view.typing,'type-syntax-only');
      assert(view.preview.text.length<=641&&view.preview.visited<=512);if(k===0){const index=p.types.payloads[at.node].index;
       if(index<at.scope.length){const target=at.scope[at.scope.length-1-index];assert.equal(view.binding.relation,'type-local-binder');assert.deepEqual(view.binding.relativeSlots,target.slots);assert.equal(view.binding.address.node,target.node);report.localReferences++;}
       else{const ambient=index-at.scope.length,slot=typeRoot===0?p.originalDepth-1-ambient:q.keptSlots[p.retainedDepth-1-ambient],frame=p.frames[slot];assert.equal(view.binding.relation,'original-context-binder');assert.deepEqual(view.binding.address,frame.address);assert.deepEqual(view.binding.locator,frame.locator);assert.equal(view.preview.text,frame.name+'[#'+index+']');const original=await graph.inspect(frame.locator.component,frame.locator.slots);assert.deepEqual(original.root.address,frame.address);report.ambientReferences++;}
      }else assert.equal(view.binding,null);
      assert.deepEqual(view.children.map(c=>c.field),A.fields[A.kinds[k]]||[]);for(const c of view.children)todo.push(c.relativeSlots);report.typeCuts++;
     }
    }
    assert.throws(()=>native.inspect(Array(513).fill(0)));assert.throws(()=>native.inspect([],{typeRoot:2}));report.refusals+=2;
    const mismatch=clone(cut);mismatch.root.address.keptSlots.push(512);assert.equal(native.match(mismatch),null);
    const descendant=clone(cut);descendant.root.address.relativeSlots=[0];assert.equal(native.match(descendant),null);report.refusals+=2;
    const stats=native.state();report.peakRows=Math.max(report.peakRows,stats.cachedRows);report.peakBytes=Math.max(report.peakBytes,stats.cachedBytes);report.queries++;
   }
   // Unrecorded selections clear the previous record and retain no type table.
   const root=await projection.inspect();await native.load(root);const unrecorded=clone(root);unrecorded.root.address.relativeSlots=[0];const before=requests;assert.equal(await native.load(unrecorded),null);assert.equal(requests,before);assert.equal(native.state().cachedRows,0);assert.throws(()=>native.inspect());report.refusals++;
   await native.load(root);const cancelled=new AbortController();cancelled.abort(Error('Control cancellation'));await assert.rejects(()=>native.load(root,{signal:cancelled.signal}),/Control cancellation/);report.refusals++;
   native.dispose();assert.equal(native.state().cachedRows,0);assert.throws(()=>native.record());await assert.rejects(()=>native.load(root));report.refusals+=2;projection.dispose();
  }
  graph.dispose();support.dispose();report.profiles++;
 }
 // Requests are serialized even when a transport ignores cancellation.
 const d=descriptors[0],graph=await P.open(d,{fetcher}),support=await R.open(bindings.find(b=>b.nativeCaseSha256===d.nativeCaseSha256),d,graph.header,{fetcher}),q=plan.profiles[0].queries[0],projection=await C.prepare(graph,support,await graph.inspect(q.component,q.regionSlots)),cut=await projection.inspect();
 let arrive,finish;const arrived=new Promise(r=>arrive=r),gate=new Promise(r=>finish=r);let inFlight=0,peak=0,first=true;
 const slow=async file=>{inFlight++;peak=Math.max(peak,inFlight);if(first){first=false;arrive();await gate;}const response=await fetcher(file);inFlight--;return response;},native=N.open(types,graph.header,{fetcher:slow});
 const older=native.load(cut);const rejection=assert.rejects(older);await arrived;const superseded=native.load(cut),pendingRejection=assert.rejects(superseded);const newer=native.load(cut);assert(native.state().pending);assert.equal(native.state().cachedRows,0);finish();await rejection;await pendingRejection;await newer;assert.equal(peak,1);report.serialLatestRequest=true;
 native.release();assert.equal(native.state().cachedRows,0);const packet=load('.'+native.match(cut).file),entry=native.match(cut);
 const damaged=N.open(types,graph.header,{fetcher:async()=>new Response(z.gzipSync(Buffer.from('{}')))});await assert.rejects(()=>damaged.load(cut),/decoded size|packet hash/);assert.equal(damaged.state().cachedRows,0);damaged.dispose();report.corruptPacket=true;
 // A self-consistent transport hash cannot bypass owner or context validation.
 for(const change of[p=>p.owner.nativeCaseSha256='0'.repeat(64),p=>p.query.keptSlots=[],p=>p.contextLetNondep=true]){
  const bad=clone(packet);change(bad);const raw=Buffer.from(JSON.stringify(bad)+'\n'),h=sha(raw),altered=clone(types),selected=altered.profiles[0].entries.find(e=>e.sha256===entry.sha256);selected.sha256=h;selected.file=N.base+h+'.json.gz';selected.bytes=raw.length;
  const lease=N.open(altered,graph.header,{fetcher:async()=>new Response(z.gzipSync(raw))});await assert.rejects(()=>lease.load(cut));lease.dispose();report.refusals++;
 }
 // Separate structural fixture: the finite native sample contains no reference
 // to a binder introduced inside a recorded type. Do not count this fixture as
 // native typing. One shared row must acquire different occurrence addresses.
 const synthetic=clone(packet);synthetic.types={serialization:'ExprDAG/1',kind:[3,0,7,7],children:[[],[],[0,1],[0,2]],payloads:[{level:{kind:'zero'}},{index:0},{binderName:'x',binderNameParts:[{str:'x'}],binderInfo:'default'},{binderName:'y',binderNameParts:[{str:'y'}],binderInfo:'default'}],expanded:['1','1','3','5'],neededScope:[0,1,0,0],roots:[2,3]};
 const raw=Buffer.from(JSON.stringify(synthetic)+'\n'),h=sha(raw),fixtureRegistry=clone(types),fixtureEntry=fixtureRegistry.profiles[0].entries.find(e=>e.sha256===entry.sha256);fixtureEntry.sha256=h;fixtureEntry.file=N.base+h+'.json.gz';fixtureEntry.bytes=raw.length;
 const fixture=N.open(fixtureRegistry,graph.header,{fetcher:async()=>new Response(z.gzipSync(raw))});await fixture.load(cut);
 const left=fixture.inspect([1],{typeRoot:0}),right=fixture.inspect([1,1],{typeRoot:1});assert.equal(left.binding.relation,'type-local-binder');assert.equal(right.binding.relation,'type-local-binder');assert.deepEqual(left.binding.relativeSlots,[]);assert.deepEqual(right.binding.relativeSlots,[1]);assert.notDeepEqual(left.binding.address,right.binding.address);fixture.dispose();report.syntheticLocalBinderCuts=2;
 native.dispose();projection.dispose();graph.dispose();support.dispose();assert.equal(report.profiles,11);assert.equal(report.queries,150);assert(report.ambientReferences>0);assert(report.peakRows<=N.limits.rows&&report.peakBytes<=N.limits.packetBytes);
 report.files=Object.fromEntries(['public/js/proof-atlas-region-native-types.js',registryFile,base+'check-types.cjs',base+'packets.json.gz','research/proof-atlas/region-context-projection/view.js','research/proof-atlas/region-context-projection/view.css'].map(f=>[f,sha(fs.readFileSync(f))]));
 const bytes=Buffer.from(JSON.stringify(report,null,2)+'\n');if(process.argv.includes('--check'))assert(z.gunzipSync(fs.readFileSync(base+'consumer.json.gz')).equals(bytes));else fs.writeFileSync(base+'consumer.json.gz',z.gzipSync(bytes,{mtime:0}));console.log(JSON.stringify({...report,files:undefined}));
})().catch(e=>{console.error(e.stack);process.exitCode=1;});
