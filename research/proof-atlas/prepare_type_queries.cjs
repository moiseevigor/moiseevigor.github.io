/* Finite geometry-derived queries. Publication is a separate, reviewed projection. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),zlib=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
const A=require('../../public/js/proof-atlas-library-data'),G=require('../../public/js/proof-atlas-geometry-core');
const [output,...specs]=process.argv.slice(2);if(!output||!specs.length)throw Error('Usage: node prepare_type_queries.cjs OUTPUT edition:declaration ...');
const dir=path.resolve(output);fs.mkdirSync(dir,{recursive:true});const w={};vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/library-manifest.js','utf8'),{window:w});const groups=new Map();
for(const spec of specs){const split=spec.indexOf(':'),edition=spec.slice(0,split),name=spec.slice(split+1),e=w.PROOF_ATLAS_LIBRARY.editions.find(e=>e.id===edition),record=e?.declarations.find(r=>r.name===name);assert(record,'Unknown compiled declaration: '+spec);
 const bytes=zlib.gunzipSync(fs.readFileSync('.'+record.indexFile));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),record.indexSha256);const d=A.validateIndex(JSON.parse(bytes),record),selected=new Map();
 const add=r=>{assert(r.slots.length<=512);selected.set(r.root+':'+r.slots.join('.'),r);};
 for(let root=0;root<d.roots.length;root++){const scene=G.create(d,record,{route:{root,slots:[]},foldBinders:true,foldApplications:true,maxNodes:48,maxDepth:4});for(const n of scene.nodes){add(n.route);if(n.members)n.members.forEach(m=>add(m.route));if(n.regions)n.regions.forEach(r=>add(r.route));if(n.continuation)add(n.continuation.route);}}
 assert(selected.size<=512,'Query selection exceeds finite extraction budget');const packetFile=path.join(dir,edition+'-'+groups.size+'-'+name.replace(/[^a-zA-Z0-9_-]/g,'_')+'.packet.json');assert(!fs.existsSync(packetFile));fs.writeFileSync(packetFile,bytes);
 if(!groups.has(edition))groups.set(edition,[]);groups.get(edition).push({packetFile,source:{edition,name,indexSha256:record.indexSha256,sourceSha256:record.sourceSha256},routes:[...selected.values()]});
}
for(const [edition,queries]of groups)fs.writeFileSync(path.join(dir,edition+'.requests.json'),JSON.stringify(queries));console.log(JSON.stringify({status:'PREPARED',editions:[...groups].map(([edition,queries])=>({edition,declarations:queries.length,queries:queries.reduce((s,q)=>s+q.routes.length,0)}))}));
