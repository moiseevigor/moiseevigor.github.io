/* Freeze the existing primary inventory plus every recorded proof-role context root. */
'use strict';
const fs=require('fs'),vm=require('vm'),z=require('zlib'),crypto=require('crypto'),path=require('path'),assert=require('assert/strict');
const repo=path.resolve(__dirname,'../../..'),folder=path.resolve(process.argv[2]),name=process.argv[3],w={},A=require(repo+'/public/js/proof-atlas-library-data'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
for(const f of ['goedel-sample-manifest.js','context-types-manifest.js'])vm.runInNewContext(fs.readFileSync(repo+'/public/data/proof-atlas/'+f,'utf8'),{window:w});
const record=w.PROOF_ATLAS_AI_SAMPLE.edition.declarations.find(r=>r.name===name),primary=w.PROOF_ATLAS_AI_SAMPLE.types.find(r=>r.name===name),contexts=w.PROOF_ATLAS_CONTEXT_TYPES.records.find(r=>r.name===name&&r.edition==='goedel-sample-4331');assert(record&&primary&&contexts);
function decode(d){const bytes=z.gunzipSync(fs.readFileSync(repo+d.file));assert.equal(sha(bytes),d.sha256);return JSON.parse(bytes);}
const old=decode(primary),context=decode(contexts),packet=z.gunzipSync(fs.readFileSync(repo+record.indexFile));assert.equal(sha(packet),record.indexSha256);assert(packet.length<=64*1024**2);const data=A.validateIndex(JSON.parse(packet),record),key=r=>r.root+':'+r.slots.join('.'),routes=new Map();
for(const e of old.entries){assert.equal(e.status,'checked');routes.set(key(e.route),e.route);}
const proofRoots=context.entries.filter(e=>e.role==='proof');for(const e of proofRoots)routes.set(key(e.state.route),e.state.route);
const source=old.source,packetFile=path.join(folder,'packet.json'),inventory={source,record,primary,contexts,previousPrimaryRoutes:old.entries.map(e=>e.route),proofRootRoutes:proofRoots.map(e=>e.state.route),routes:[...routes.values()]};
for(const r of inventory.routes)A.path(data,r);
fs.writeFileSync(packetFile,packet);fs.writeFileSync(path.join(folder,'inventory.json'),JSON.stringify(inventory));fs.writeFileSync(path.join(folder,'request.json'),JSON.stringify({packetFile,source,name,module:record.module,routes:inventory.routes}));fs.writeFileSync(path.join(folder,'proof-request.json'),JSON.stringify([{file:packetFile,...Object.fromEntries(['name','module','indexSha256','axioms'].map(k=>[k,record[k]]))}]));
console.log(JSON.stringify({primary:old.entries.length,proofRoots:proofRoots.length,union:routes.size,added:routes.size-old.entries.length}));
