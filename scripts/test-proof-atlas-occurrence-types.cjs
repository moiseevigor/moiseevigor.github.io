/* Hashes, exact contextual attachment and fail-closed controls; not a Lean replay. */
'use strict';
const fs=require('fs'),vm=require('vm'),zlib=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
const A=require('../public/js/proof-atlas-library-data'),T=require('../public/js/proof-atlas-occurrence-types'),G=require('../public/js/proof-atlas-geometry-core'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
(async()=>{
 const w={};for(const f of ['library-manifest.js','occurrence-types-manifest.js'])vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+f,'utf8'),{window:w});const inventory=w.PROOF_ATLAS_OCCURRENCE_TYPES.records;assert.equal(inventory.length,6);let entries=0,args=0,roleEdges=0,negatives=0,sharedContexts=0,unrecordedInitialArguments=0;
 const originalFetch=globalThis.fetch;globalThis.fetch=async file=>new Response(fs.readFileSync('.'+file));
 try{
  for(const descriptor of inventory){const edition=w.PROOF_ATLAS_LIBRARY.editions.find(e=>e.id===descriptor.edition),record=edition.declarations.find(r=>r.name===descriptor.name),bytes=zlib.gunzipSync(fs.readFileSync('.'+record.indexFile));assert.equal(sha(bytes),record.indexSha256);const d=A.validateIndex(JSON.parse(bytes),record),raw=zlib.gunzipSync(fs.readFileSync('.'+descriptor.file)),evidence=JSON.parse(raw);assert.equal(sha(raw),descriptor.sha256);assert(T.validate(evidence,d,record));const api=await T.open(descriptor,d,record);assert.equal(api.queried,evidence.entries.length);
   const byNode=new Map();for(const e of evidence.entries){assert.equal(e.status,'checked');entries++;args+=e.arguments.length;assert.equal(api.get(e.route).path,e.path);for(const arg of e.arguments)assert.equal(api.argument(e.route,arg.route).role,arg.role);if(!byNode.has(e.node))byNode.set(e.node,new Set());byNode.get(e.node).add(e.context.map(b=>b.path).join('|'));}
   sharedContexts+=[...byNode.values()].filter(v=>v.size>1).length;
   const cut=G.create(d,record,{foldBinders:true,foldApplications:true,maxNodes:48,maxDepth:4});for(const n of cut.nodes)if(n.abstraction==='application-spine')for(const arg of n.arguments){const judgment=api.argument(n.route,arg.route);if(judgment){roleEdges++;}else{assert.equal(descriptor.queryScope,'finite-exact-occurrences/1');assert.equal(api.get(n.route)?.applicationJudgment,undefined,'An unrecorded application does not inherit a trace from the introduction prefix');unrecordedInitialArguments++;}}
   for(const change of [x=>x.source.indexSha256='stale',x=>x.entries[0].node++,x=>(x.typeGraph||x.entries[0].typeGraph).expanded[0]='2',x=>x.entries.push(x.entries[0])]){const bad=structuredClone(evidence);change(bad);assert.throws(()=>T.validate(bad,d,record));negatives++;}
   const scoped=evidence.entries.find(e=>e.context.length);assert(scoped);{const bad=structuredClone(evidence);bad.entries.find(e=>e.path===scoped.path).context.pop();assert.throws(()=>T.validate(bad,d,record));negatives++;}
   const call=evidence.entries.find(e=>e.arguments.length>=2);if(call){const bad=structuredClone(evidence);bad.entries.find(e=>e.path===call.path).arguments.reverse();assert.throws(()=>T.validate(bad,d,record));negatives++;}else{assert.equal(descriptor.queryScope,'finite-exact-occurrences/1');assert(evidence.entries.every(e=>e.lambdaJudgment?.status==='checked'&&e.arguments.length===0),'The finite working profile records introductions only');}
   await assert.rejects(T.open({...descriptor,sha256:'0'.repeat(64)},d,record));negatives++;
   if(descriptor===inventory[0]){
    const changed=structuredClone(evidence);delete changed.environment;assert.throws(()=>T.validate(changed,d,record),/environment/);negatives++;
    const bad=structuredClone(evidence),entry=bad.entries[0],g=bad.typeGraph||entry.typeGraph,r=entry.typeRoot,id=g.kind.length;g.kind.push(10);g.children.push([r]);g.payloads.push({metadata:[{key:'forbidden',value:{kind:'ofSyntax',repr:'source syntax is not approved for publication'}}]});g.expanded.push(String(1n+BigInt(g.expanded[r])));g.neededScope.push(g.neededScope[r]);entry.typeRoot=id;assert.throws(()=>T.validate(bad,d,record),/unreviewed source syntax/);negatives++;
   }
   // An unqueried occurrence must not inherit a type by shared node ID or ancestor.
   const routes=A.routes(d);let missing=false;for(let id=0;id<d.kind.length;id++){const route=routes.route(id);if(!api.get(route)){assert.equal(api.get(route),undefined);missing=true;break;}}assert(missing);
  }
 }finally{globalThis.fetch=originalFetch;}
 assert.equal(entries,960);assert(sharedContexts>0);console.log(JSON.stringify({status:'PASS',declarations:inventory.length,entries,argumentObservations:args,initialGroupedArgumentRoles:roleEdges,unrecordedInitialArguments,sharedNodesWithDistinctContexts:sharedContexts,negativeControls:negatives,unknownPathsDoNotInherit:true,scope:'Hashes and structural/context attachment of native extraction attestations; no browser kernel replay or prose-equivalence claim.'}));
})().catch(e=>{console.error(e.stack);process.exit(1)});
