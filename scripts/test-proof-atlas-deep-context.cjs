/* Independent source/type paths and lexical targets for the finite native records. */
'use strict';
const fs=require('fs'),z=require('zlib'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict');
const T=require('../public/js/proof-atlas-deep-context'),P=require('../public/js/proof-atlas-packed-routes'),W=require('../public/js/proof-atlas-occurrence-window');
const host={};vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/deep-typing-manifest.js','utf8'),{window:host});
const d=host.PROOF_ATLAS_DEEP_TYPING,raw=z.gunzipSync(fs.readFileSync('.'+d.file)),e=JSON.parse(raw),sha=b=>crypto.createHash('sha256').update(b).digest('hex');assert.equal(sha(raw),d.sha256);
const rows=[...e.nativeResult.cases,e.originalPublicReplay.record];
function unpack(r){const b=Buffer.from(r.slots,'base64url');return Array.from({length:r.depth},(_,i)=>Math.floor(b[Math.floor(i/4)]/4**(i%4))%4);}
function at(data,root,slots){let node=data.roots[root];const scope=[];slots.forEach((s,depth)=>{const k=data.kind[node];if((k===6||k===7)&&s===1||k===8&&s===2)scope.push({node,depth});node=data.children[node][s];assert.notEqual(node,undefined);});return{node,scope};}
function representative(data,selected){
 const parents=new Int32Array(data.kind.length).fill(-2),slots=new Uint8Array(data.kind.length),work=[];
 data.roots.forEach((r,root)=>{if(parents[r]===-2){parents[r]=-1;work.push([r,root]);}});
 for(let i=0;i<work.length;i++){const [n,root]=work[i];data.children[n].forEach((c,s)=>{if(parents[c]===-2){parents[c]=n;slots[c]=s;work.push([c,root]);}});}
 let n=selected,reverse=[];while(parents[n]>=0){reverse.push(slots[n]);n=parents[n];}return P.encode(data.roots.indexOf(n),reverse.reverse());
}
(async()=>{
 const pkg=await T.prepare(e,d);let cuts=0,internal=0,ambient=0,queries=0,maxDepth=0,maxContext=0,rejections=0;
 for(const c of pkg.cases){
  const original=rows.find(r=>r.name===c.name);assert.equal(await pkg.attach(c.data,c.record),c);
  for(let i=0;i<c.entries.length;i++){
   const entry=c.entries[i],q=original.queries[i];assert.deepEqual(unpack(entry.route),q.slots);assert.equal(entry.node,q.node);assert.equal(entry.role,q.role);
   const unchanged=W.create(c.data,c.record,entry.route),routes=[P.encode(0,[])];
   q.typeGraph.kind.forEach((k,n)=>{if(k===0)routes.push(representative(q.typeGraph,n));});
   for(const route of routes)for(const maxNodes of [1,9]){
    const scene=T.typeScene(entry,c.data,route,{maxNodes,maxDepth:2}),start=at(q.typeGraph,route.root,unpack(route));
    assert.equal(scene.namespace,'computed-native-type');assert.equal(scene.root.node,start.node);assert.equal(scene.origin.sourceIndexSha256,c.record.indexSha256);assert.deepEqual(scene.origin.sourceRoute,entry.route);
    assert.equal(BigInt(scene.stats.retained)+BigInt(scene.stats.hidden),BigInt(q.typeGraph.expanded[start.node]));assert(scene.nodes.length<=maxNodes);
    for(const n of scene.nodes){
     const selected=at(q.typeGraph,n.route.root,unpack(n.route));assert.equal(n.node,selected.node);assert.equal(n.namespace,'computed-native-type');assert.equal(n.typeStatus,'type-syntax-only');assert.deepEqual(n.payload,q.typeGraph.payloads[n.node]);
     n.ports.forEach((port,slot)=>{assert.equal(port.node,q.typeGraph.children[n.node][slot]);assert.deepEqual(unpack(port.route),[...unpack(n.route),slot]);});
     if(q.typeGraph.kind[n.node]!==0){assert.equal(n.binding,null);continue;}
     const index=q.typeGraph.payloads[n.node].index,local=selected.scope[selected.scope.length-1-index];
     if(local){assert.equal(n.binding.namespace,'computed-native-type');assert.equal(n.binding.node,local.node);assert.deepEqual(unpack(n.binding.route),unpack(n.route).slice(0,local.depth));internal++;}
     else{const ordinal=q.binderDepths.length-1-(index-selected.scope.length),depth=q.binderDepths[ordinal],target=at(original.source,q.root,q.slots.slice(0,depth));assert.equal(n.binding.namespace,'original-source-context');assert.equal(n.binding.ordinal,ordinal);assert.equal(n.binding.node,target.node);assert.deepEqual(unpack(n.binding.route),q.slots.slice(0,depth));ambient++;}
    }
    assert(!('sourcePath' in scene.root));assert(scene.nodes.every(n=>!('sourcePath' in n)));cuts++;
   }
   assert.deepEqual(W.create(c.data,c.record,entry.route),unchanged);assert.equal(unchanged.typing,'not-queried');
   maxDepth=Math.max(maxDepth,entry.route.depth);maxContext=Math.max(maxContext,entry.contextLength);queries++;
  }
 }
 const c=pkg.case('dependent-domain'),entry=c.entries.at(-1),refuse=action=>{assert.throws(action);rejections++;};
 refuse(()=>T.typeScene({...entry,role:'proof'},c.data));
 refuse(()=>T.typeScene(entry,structuredClone(c.data)));
 refuse(()=>T.typeScene(entry,pkg.case('shadowed-shared-variable').data));
 refuse(()=>T.typeScene(entry,c.data,P.encode(0,[]),{maxNodes:14}));
 refuse(()=>T.typeScene(entry,c.data,P.encode(0,[]),{maxDepth:4}));
 refuse(()=>c.get({root:entry.route.root,depth:entry.route.depth,slots:entry.route.slots}));
 refuse(()=>{entry.typeData.payloads[entry.typeData.roots[0]].index=0;});
 assert.equal(c.get(P.encode(1,[])),null);assert.equal(await pkg.attach(c.data,{...c.record,indexSha256:'0'.repeat(64)}),null);
 await assert.rejects(()=>pkg.attach({...c.data,declaration:{name:'another source'}},c.record));rejections++;
 await assert.rejects(()=>pkg.attach({...c.data,declaration:{...c.data.declaration,rootPaths:['root.rule.0','root.value']}},c.record));rejections++;
 await assert.rejects(()=>pkg.attach(c.data,{...c.record,uniqueNodes:c.record.uniqueNodes+1}));rejections++;
 const corrupt=structuredClone(e);corrupt.nativeResult.cases[0].queries[0].role='value';await assert.rejects(()=>T.prepare(corrupt,d));rejections++;
 const wrongDescriptor={...d,decodedBytes:d.decodedBytes+1};await assert.rejects(()=>T.prepare(e,wrongDescriptor));rejections++;
 assert(internal>0&&ambient>0);assert.equal(queries,27);assert.equal(maxDepth,10002);assert.equal(maxContext,10000);
 console.log(JSON.stringify({status:'PASS',cases:pkg.cases.length,queries,typeCuts:cuts,internalTypeBindings:internal,originalContextBindings:ambient,maxDepth,maxContext,rejections,sourceCutsUnchanged:true,unrecordedPositionsRemainUnknown:true,computedNamespacePreserved:true,nativeKernelRerun:false}));
})().catch(e=>{console.error(e.stack);process.exitCode=1});
