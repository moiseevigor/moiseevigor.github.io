/* Freeze the existing primary inventory plus every recorded proof-role context root. */
'use strict';
const fs=require('fs'),vm=require('vm'),z=require('zlib'),crypto=require('crypto'),path=require('path'),assert=require('assert/strict');
const repo=path.resolve(__dirname,'../../..'),folder=path.resolve(process.argv[2]),name=process.argv[3],w={},A=require(repo+'/public/js/proof-atlas-library-data'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const f of ['goedel-sample-manifest.js','context-types-manifest.js'])vm.runInNewContext(fs.readFileSync(repo+'/public/data/proof-atlas/'+f,'utf8'),{window:w});
const record=w.PROOF_ATLAS_AI_SAMPLE.edition.declarations.find(r=>r.name===name),primary=w.PROOF_ATLAS_AI_SAMPLE.types.find(r=>r.name===name),contexts=w.PROOF_ATLAS_CONTEXT_TYPES.records.find(r=>r.name===name&&r.edition==='goedel-sample-4331');assert(record&&primary&&contexts);
function decode(d){const bytes=z.gunzipSync(fs.readFileSync(repo+d.file));assert.equal(sha(bytes),d.sha256);return JSON.parse(bytes);}
(async()=>{
const old=decode(primary),context=decode(contexts),packet=z.gunzipSync(fs.readFileSync(repo+record.indexFile));assert.equal(sha(packet),record.indexSha256);assert(packet.length<=64*1024**2);const data=A.validateIndex(JSON.parse(packet),record),key=r=>r.root+':'+r.slots.join('.'),routes=new Map();
for(const e of old.entries){assert.equal(e.status,'checked');routes.set(key(e.route),e.route);}
const proofRoots=context.entries.filter(e=>e.role==='proof');for(const e of proofRoots)routes.set(key(e.state.route),e.state.route);
const source=old.source;let frontier=null;
if(process.argv[4]){
 assert(['--proof-frontier','--frontier-seed'].includes(process.argv[4]));const F=require('./frontier.cjs'),T=require(repo+'/public/js/proof-atlas-occurrence-types'),E=require(repo+'/public/js/proof-atlas-elimination'),Z=require(repo+'/public/js/proof-atlas-let-reduction'),B=require(repo+'/public/js/proof-atlas-beta-reduction'),seedBytes=fs.readFileSync(process.argv[4]==='--frontier-seed'?path.resolve(process.argv[5]):__dirname+'/proof-premise-seed.json'),seed=JSON.parse(seedBytes),apis={primary:T,case:E,let:Z,beta:B},providers={};
 assert.equal(seed.format,'ProofAtlasProofPremiseSeed/1');assert.deepEqual(seed.source,source);const seedEvidence=decode(seed.seedTypes);const seedRoutes=new Map(seedEvidence.entries.map(e=>[key(e.route),e.route]));assert.equal(seedRoutes.size,seedEvidence.entries.length);for(const r of routes.values())assert(seedRoutes.has(key(r)),'Seed omits an earlier primary/proof-root query');routes.clear();for(const [k,r]of seedRoutes)routes.set(k,r);const prior=globalThis.fetch;
 try{globalThis.fetch=async f=>new Response(fs.readFileSync(repo+f));for(const {kind,descriptor}of seed.providers){assert(apis[kind]&&!providers[kind]);providers[kind]=await apis[kind].open(descriptor,data,record);}providers.packet=T.provider(seedEvidence,data,record,seed.seedTypes);}finally{globalThis.fetch=prior;}
 const snapshot=F.collect(data,record,F.resolver(providers),[...routes.values()]);assert.deepEqual({seedQueries:routes.size,proofPremises:snapshot.proofPremises,terminalReferences:snapshot.terminalReferences,recordedConstructions:snapshot.recordedConstructions,newQueries:snapshot.pending.length,totalQueries:routes.size+snapshot.pending.length},seed.expected);
 frontier={seed,seedPolicySha256:sha(seedBytes),snapshot};for(const p of snapshot.pending){assert(!routes.has(key(p.route)));routes.set(key(p.route),p.route);}
}
const packetFile=path.join(folder,'packet.json'),inventory={source,record,primary,contexts,previousPrimaryRoutes:old.entries.map(e=>e.route),proofRootRoutes:proofRoots.map(e=>e.state.route),routes:[...routes.values()],...(frontier?{frontier}:{})};
for(const r of inventory.routes)A.path(data,r);
fs.writeFileSync(packetFile,packet);fs.writeFileSync(path.join(folder,'inventory.json'),JSON.stringify(inventory));fs.writeFileSync(path.join(folder,'request.json'),JSON.stringify({packetFile,source,name,module:record.module,routes:inventory.routes}));fs.writeFileSync(path.join(folder,'proof-request.json'),JSON.stringify([{file:packetFile,...Object.fromEntries(['name','module','indexSha256','axioms'].map(k=>[k,record[k]]))}]));
console.log(JSON.stringify({primary:old.entries.length,proofRoots:proofRoots.length,union:routes.size,added:routes.size-old.entries.length,...(frontier?{frontier:{seedQueries:frontier.seed.expected.seedQueries,newQueries:frontier.snapshot.pending.length,totalQueries:routes.size}}:{})}));
})().catch(error=>{console.error(error.stack);process.exit(1)});
