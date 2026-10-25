/* Exact reachable delivery closure, excluding complete legacy topology downloads. */
'use strict';const fs=require('fs'),vm=require('vm'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
module.exports=function assets(){const h={};vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/network-streaming-manifest.js','utf8'),{window:h});const files=new Set(),stack=[],sha=b=>crypto.createHash('sha256').update(b).digest('hex');
 function add(p){if(!p)return;assert(p.file.startsWith('/public/data/proof-atlas/network-streaming/'));const file=p.file.slice(1);if(files.has(file))return;files.add(file);stack.push(p);}
 for(const d of h.PROOF_ATLAS_NETWORK_STREAMING.records){add(d.pages);add(d.nativeDescriptor);}
 while(stack.length){const p=stack.pop(),bytes=z.gunzipSync(fs.readFileSync(p.file.slice(1)));assert.equal(sha(bytes),p.sha256);assert.equal(bytes.length,p.bytes);const row=JSON.parse(bytes);if(row.format==='ProofAtlasPagedNetwork/1'){add(row.callRoot);add(row.outgoingRoot);}else if(row.format==='ProofAtlasNetworkRankPage/1'&&row.level>0)row.children.forEach(add);}
 return [...files].sort();};
