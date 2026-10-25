const fs=require('fs'),assert=require('assert/strict'),crypto=require('crypto'),z=require('zlib');
const base='research/proof-atlas/network-streaming/',origin='http://127.0.0.1:8866',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),e=JSON.parse(fs.readFileSync(base+'network-streaming-evidence.json'));
(async()=>{
 const assets=require(process.cwd()+'/'+base+'assets.cjs')(),digest=crypto.createHash('sha256');let bytes=0;
 for(const file of assets){const built=fs.readFileSync('_site_production/'+file);bytes+=built.length;digest.update(file+'\t'+sha(built)+'\n');}
 assert.equal(assets.length,e.deliveryClosure.assets);assert.equal(bytes,e.deliveryClosure.compressedBytes);assert.equal(digest.digest('hex'),e.deliveryClosure.sha256,'built delivery closure differs');
 const samples=Array.from({length:16},(_,i)=>assets[Math.floor(i*(assets.length-1)/15)]),files=[...new Set([...samples,...e.files.filter(d=>d.file.startsWith('public/')).map(d=>d.file),'public/data/proof-atlas/network-streaming-evidence.json.gz',base+'README.md'])];
 for(const file of files){const r=await fetch(origin+'/'+file);assert.equal(r.status,200,file);assert.equal(sha(Buffer.from(await r.arrayBuffer())),sha(fs.readFileSync(file)),file);}
 const html=await fetch(origin+'/projects/proof-atlas/manual/paged-network/');assert.equal(html.status,200);assert.equal(sha(Buffer.from(await html.arrayBuffer())),sha(fs.readFileSync('_site_production/projects/proof-atlas/manual/paged-network/index.html')));
 assert.equal(sha(z.gunzipSync(fs.readFileSync('public/data/proof-atlas/network-streaming-evidence.json.gz'))),sha(fs.readFileSync(base+'network-streaming-evidence.json')));
 const report={format:'ProofAtlasNetworkStreamingDelivery/1',status:'PASS',origin,builtAssets:assets.length,builtCompressedBytes:bytes,closureSha256:e.deliveryClosure.sha256,httpByteChecks:files.length,pages:1,evidenceSha256:sha(fs.readFileSync(base+'network-streaming-evidence.json')),checkerSha256:sha(fs.readFileSync(__filename)),scope:'All reachable new topology files match the checked closure in the actual production build; representative files, application assets and evidence download match through the local HTTP server. No public deployment.'};
 fs.writeFileSync('/private/tmp/atlas-network-stream-delivery.json',JSON.stringify(report,null,2)+'\n');fs.writeFileSync(base+'delivery.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
})().catch(error=>{console.error(error.stack);process.exit(1)});
