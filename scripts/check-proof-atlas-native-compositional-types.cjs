'use strict';
// Compare every formal field with a fresh native extraction of the public own
// controls. Template hashes are packing metadata; text remains presentation.
const fs=require('fs'),path=require('path'),vm=require('vm'),z=require('zlib'),assert=require('assert/strict'),crypto=require('crypto'),I=require('../public/js/proof-atlas-introduction-transport'),L=require('../public/js/proof-atlas-context-views');
const folder=process.argv[2],fresh=JSON.parse(fs.readFileSync(path.join(folder,'introductions.json'))),w={};vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/compositional-types-manifest.js','utf8'),{window:w});let queries=0,textMatches=0;
function formal(x){if(Array.isArray(x))return x.map(formal);if(x&&typeof x==='object')return Object.fromEntries(Object.entries(x).filter(([k])=>!['templateSha256','typeText'].includes(k)).map(([k,v])=>[k,formal(v)]));return x;}
for(const d of w.PROOF_ATLAS_COMPOSITIONAL_TYPES.records){const released=JSON.parse(z.gunzipSync(fs.readFileSync('.'+d.file))),native=fresh.find(p=>p.source.name===d.name);assert(native);assert.equal(native.kernelDeclarationTyping,'PASS');assert(native.nativeDagMatchesPacket);assert.equal(native.leanVersion,'4.33.1');assert(L.same(native.source,released.source));
 const data=JSON.parse(fs.readFileSync(path.join(folder,d.name+'.json')));assert.equal(crypto.createHash('sha256').update(JSON.stringify(data)).digest('hex'),d.indexSha256);const a=[...I.entries(released)],b=[...I.entries(native)];assert.equal(a.length,b.length);
 for(let j=0;j<a.length;j++){assert(L.same(formal(a[j]),formal(b[j])),'Native formal record differs: '+d.name+' query '+j);I.validate(b[j],data,native.source);if(a[j].typeText===b[j].typeText)textMatches++;queries++;}
}
assert.equal(fresh.length,19);assert.equal(queries,44);console.log(JSON.stringify({status:'PASS',declarations:19,queries,allFormalFieldsMatch:true,nativeDeclaredTypeConversions:19,presentationTextsMatching:textMatches}));
