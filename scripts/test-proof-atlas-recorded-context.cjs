/* Existing native records in packed source windows; no new kernel judgments. */
'use strict';
const fs=require('fs'),z=require('zlib'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict');
const A=require('../public/js/proof-atlas-library-data'),O=require('../public/js/proof-atlas-occurrence-types'),T=require('../public/js/proof-atlas-deep-context'),P=require('../public/js/proof-atlas-packed-routes'),W=require('../public/js/proof-atlas-occurrence-window');
const host={};for(const f of ['library-manifest','occurrence-types-manifest','goedel-sample-manifest'])vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+f+'.js','utf8'),{window:host});
const {library,types}=require('../public/js/proof-atlas-ai-sample').register(host.PROOF_ATLAS_LIBRARY,host.PROOF_ATLAS_OCCURRENCE_TYPES,null,host.PROOF_ATLAS_AI_SAMPLE);
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),raw=f=>z.gunzipSync(fs.readFileSync('.'+f),{maxOutputLength:67108864});
const unpack=r=>{const b=Buffer.from(r.slots,'base64url');return Array.from({length:r.depth},(_,i)=>(b[i>>2]>>((i%4)*2))&3);};
function at(data,root,slots){let node=data.roots[root];const scope=[];slots.forEach((s,depth)=>{if((data.kind[node]===6||data.kind[node]===7)&&s===1||data.kind[node]===8&&s===2)scope.push({node,depth});node=data.children[node][s];assert.notEqual(node,undefined);});return{node,scope};}
(async()=>{
 let typed=0,primary=0,observations=0,cuts=0,internal=0,ambient=0,rejections=0,unrecorded=0;const rows=[];
 for(const d of types.records){
  const record=library.editions.find(e=>e.id===d.edition).declarations.find(r=>r.name===d.name),sourceBytes=raw(record.indexFile),evidenceBytes=raw(d.file),source=JSON.parse(sourceBytes),evidence=JSON.parse(evidenceBytes);
  const indexed=O.indexObservations(evidence,source),pkg=await T.recorded(sourceBytes,evidenceBytes,d,record),c=pkg.case(record.name);assert.equal(await pkg.attach(c.data,record),c);assert.equal(await pkg.attach(source,record),c);
  assert.equal(c.stats.primaryQueries,evidence.entries.filter(q=>q.status==='checked').length);assert.equal(c.stats.explicitObservations,indexed.observed);assert.equal(c.stats.sharedTypeTables,1);assert.equal(c.stats.storedTypeNodes,evidence.typeGraph.kind.length);
  assert.deepEqual(c.provenance.environment,evidence.environment);assert.deepEqual(c.provenance.publisherOrigin,JSON.parse(JSON.stringify(record.origin||null)));assert.equal(c.provenance.readerSourceModuleBytesVerified,false);
  const tableRoots=new Map(),sourceRepresentatives=W.representatives(c.data),tableHash=sha(JSON.stringify(evidence.typeGraph,(_,v)=>v&&typeof v==='object'&&!Array.isArray(v)?Object.fromEntries(Object.keys(v).sort().map(k=>[k,v[k]])):v));
  for(const entry of c.entries){
   const slots=unpack(entry.route),q=indexed.lookup.get(entry.route.root+':'+slots.join('.')),origin=entry.recording;
   assert.equal(entry.node,at(source,entry.route.root,slots).node);assert.equal(entry.role,q.role);assert.equal(entry.contextLength,q.context.length);assert.equal(entry.typeTableRoot,q.typeRoot);assert.equal(entry.typeText,q.typeText);
   assert.equal(entry.typeData.kind,c.entries[0].typeData.kind);assert.equal(entry.typeData.children,c.entries[0].typeData.children);assert.equal(entry.typeData.payloads,c.entries[0].typeData.payloads);assert.equal(entry.typeData.expanded,c.entries[0].typeData.expanded);assert.equal(entry.typeTableSha256,tableHash);
   assert.equal(entry.typeData.roots[0],q.typeRoot);assert(!('typeGraphSha256' in entry));assert.equal(entry.readerSourceModuleBytesVerified,false);
   if(origin.kind==='primary-query'){primary++;assert.deepEqual(origin.queryRoute,entry.route);}else{observations++;assert.equal(origin.kind,q.typingOrigin.kind);assert.deepEqual(unpack(origin.queryRoute),q.typingOrigin.query.route.slots);assert.equal(origin.queryNode,q.typingOrigin.query.node);assert.equal(c.get(origin.queryRoute).recording.kind,'primary-query');}
   let candidates=tableRoots.get(q.typeRoot);
   if(!candidates){
    const rep=W.representatives(entry.typeData);candidates=[P.encode(0,[])];
    const reachable=A.reachable(entry.typeData,q.typeRoot),bvars=reachable.filter(id=>entry.typeData.kind[id]===0);
    // Every stored bound-variable representative reachable in this component.
    for(const id of bvars)candidates.push(rep.route(id));tableRoots.set(q.typeRoot,candidates);
   }
   for(const route of candidates){
    const scene=T.typeScene(entry,c.data,route),root=at(entry.typeData,route.root,unpack(route));assert.equal(scene.root.node,root.node);assert(scene.nodes.length<=13);assert.equal(BigInt(scene.stats.retained)+BigInt(scene.stats.hidden),BigInt(entry.typeData.expanded[root.node]));
    assert.deepEqual(scene.origin.recording,origin);assert.equal(scene.origin.typeTableRoot,q.typeRoot);assert.equal(scene.origin.typeTableSha256,entry.typeTableSha256);assert(!('typeGraphSha256' in scene.origin));
    for(const n of scene.nodes){
     const selected=at(entry.typeData,n.route.root,unpack(n.route));assert.equal(n.node,selected.node);assert.deepEqual(n.payload,evidence.typeGraph.payloads[n.node]);assert.equal(n.typeStatus,'type-syntax-only');assert(!('sourcePath' in n));
     n.ports.forEach((p,s)=>{assert.equal(p.node,evidence.typeGraph.children[n.node][s]);assert.deepEqual(unpack(p.route),[...unpack(n.route),s]);});
     if(entry.typeData.kind[n.node]!==0)continue;
     const index=entry.typeData.payloads[n.node].index,local=selected.scope.at(-1-index);
     if(local){assert.equal(n.binding.namespace,'computed-native-type');assert.equal(n.binding.node,local.node);assert.deepEqual(unpack(n.binding.route),unpack(n.route).slice(0,local.depth));internal++;}
     else{const ordinal=q.context.length-1-(index-selected.scope.length),b=q.context[ordinal];assert(b);assert.equal(n.binding.namespace,'original-source-context');assert.equal(n.binding.ordinal,ordinal);assert.equal(n.binding.node,b.node);assert.deepEqual(unpack(n.binding.route),b.route.slots);ambient++;}
    }cuts++;
   }
   assert.equal(W.create(c.data,c.record,entry.route).typing,'not-queried');typed++;
  }
  for(let id=0;id<source.kind.length;id++){const r=sourceRepresentatives.route(id);if(!c.get(r)){unrecorded++;assert.equal(W.create(c.data,c.record,r).typing,'not-queried');break;}}
  rows.push({edition:d.edition,name:record.name,...c.stats});
  if(d.name==='JacobiData.slope_bound_abs'){
   async function refuse(fn){await assert.rejects(fn);rejections++;}
   await refuse(()=>T.recorded(sourceBytes,evidenceBytes,{...d,sha256:'0'.repeat(64)},record));
   await refuse(()=>T.recorded(sourceBytes,evidenceBytes,{...d,edition:'wrong'},record));
   await refuse(()=>T.recorded(sourceBytes,evidenceBytes,{...d,name:'wrong'},record));
   await refuse(()=>T.recorded(sourceBytes,evidenceBytes,{...d,file:'/private/proofs.json.gz'},record));
   const mutate=async change=>{const e=JSON.parse(evidenceBytes);change(e);const b=Buffer.from(JSON.stringify(e));await refuse(()=>T.recorded(sourceBytes,b,{...d,sha256:sha(b)},record));};
   await mutate(e=>{e.entries[0].node++;});await mutate(e=>{e.entries[0].typeRoot=e.typeGraph.kind.length;});await mutate(e=>{e.entries.find(q=>q.context.length).context[0].node++;});await mutate(e=>{e.sourceModuleHashVerified=false;});
   await mutate(e=>{e.source.indexSha256='0'.repeat(64);});await mutate(e=>{e.typeGraph.payloads[e.typeGraph.kind.indexOf(0)].index+=2;});
   assert.throws(()=>T.typeScene({...c.entries[0]},c.data));rejections++;assert.throws(()=>T.typeScene(c.entries[0],structuredClone(c.data)));rejections++;
   const sCopy=Buffer.from(sourceBytes),eCopy=Buffer.from(evidenceBytes),descriptorCopy={...d},recordCopy={...record},captured=T.recorded(sCopy,eCopy,descriptorCopy,recordCopy);sCopy.fill(0);eCopy.fill(0);descriptorCopy.sha256='0'.repeat(64);recordCopy.name='changed while hashing';const immutable=await captured;assert.equal(immutable.cases[0].name,record.name);assert.equal(immutable.cases[0].stats.typedOccurrences,430);
   const attachingSource=structuredClone(c.data),attaching=pkg.attach(attachingSource,record);assert.throws(()=>{attachingSource.children[0].push(0);});assert.equal(await attaching,c);assert.equal(T.typeScene(c.entries[0],attachingSource).root.node,c.entries[0].typeTableRoot);
   const unavailable=JSON.parse(evidenceBytes);unavailable.entries=unavailable.entries.map(q=>({status:'unavailable',reason:'explicit control',route:q.route}));const b=Buffer.from(JSON.stringify(unavailable)),u=await T.recorded(sourceBytes,b,{...d,sha256:sha(b)},record);assert.equal(u.cases[0].entries.length,0);assert.equal(u.cases[0].stats.unavailableQueries,169);
  }
 }
 assert.equal(rows.length,25);assert.equal(primary,1129);assert.equal(observations,1174);assert.equal(typed,2303);assert.equal(rows.filter(r=>r.edition==='goedel-sample-4331').length,20);assert(internal>0&&ambient>0&&unrecorded===25);
 console.log(JSON.stringify({status:'PASS',declarations:rows.length,publisherAttributedAI:20,primaryQueries:primary,explicitObservations:observations,typedOccurrences:typed,cuts,internalBinderLinks:internal,originalContextLinks:ambient,unrecordedDeclarations:unrecorded,rejections,newNativeJudgments:0,rows}));
})().catch(error=>{console.error(error);process.exit(1);});
