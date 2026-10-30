'use strict';
const fs=require('fs'),vm=require('vm'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
const A=require('../../../public/js/proof-atlas-library-data');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),h={};
const manifests=['method-interfaces','method-interfaces-ai','method-streaming','method-origins','method-indices','method-parameters','method-mutual','method-query-pages','source-pages'];
for(const n of manifests)vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+n+'-manifest.js','utf8'),{window:h});
const primary=[...h.PROOF_ATLAS_METHOD_INTERFACES.records,...h.PROOF_ATLAS_METHOD_REPLAY.records];
const fixtures=['PROOF_ATLAS_METHOD_ORIGINS','PROOF_ATLAS_METHOD_INDICES','PROOF_ATLAS_METHOD_PARAMETERS','PROOF_ATLAS_METHOD_MUTUAL'].flatMap(n=>h[n].records);
const profiles=[...primary.map(d=>({d,s:h.PROOF_ATLAS_SOURCE_PAGES.records.find(x=>x.name===d.name),q:h.PROOF_ATLAS_METHOD_QUERY_PAGES.records.find(x=>x.name===d.name)})),{d:h.PROOF_ATLAS_STREAM_FIXTURE.nativeDescriptor,s:h.PROOF_ATLAS_STREAM_FIXTURE.sourceDescriptor,q:h.PROOF_ATLAS_STREAM_FIXTURE.queryDescriptor},...fixtures.map(x=>({d:x.nativeDescriptor,s:x.sourceDescriptor,q:x.queryDescriptor}))];
function read(file,hash){const b=z.gunzipSync(fs.readFileSync('.'+file));if(hash)assert.equal(sha(b),hash);return JSON.parse(b);}
function table(){const g={kind:[],children:[],payloads:[],expanded:[],neededScope:[]},seen=new Map();return{g,add(k,p,cs=[]){const key=k+':'+A.payloadKey(k,p)+':'+cs.join(',');if(seen.has(key))return seen.get(key);const id=g.kind.length;g.kind.push(k);g.payloads.push(p);g.children.push(cs);g.expanded.push((1n+cs.reduce((n,c)=>n+BigInt(g.expanded[c]),0n)).toString());g.neededScope.push(k===0?p.index+1:Math.max(0,...cs.map((c,s)=>g.neededScope[c]-(((k===6||k===7)&&s===1||k===8&&s===2)?1:0))));seen.set(key,id);return id;}};}
function compact(g,roots){const t=table(),memo=new Map();function visit(id){if(memo.has(id))return memo.get(id);const r=t.add(g.kind[id],g.payloads[id],g.children[id].map(visit));memo.set(id,r);return r;}return{serialization:'ExprDAG/1',...t.g,roots:roots.map(visit)};}
module.exports={sha,profiles,manifests,read,compact,table};
