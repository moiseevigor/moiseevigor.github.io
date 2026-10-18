'use strict';
const fs=require('fs'),assert=require('assert/strict'),vm=require('vm'),z=require('zlib'),crypto=require('crypto'),audit=require('./proof-atlas-local-cut-context-audit.cjs');
let data;
if(process.argv[2])data=JSON.parse(fs.readFileSync(process.argv[2]));
else{
 const w={};vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/local-cut-context-manifest.js','utf8'),{window:w});const d=w.PROOF_ATLAS_LOCAL_CUT_CONTEXT;
 assert.equal(d.format,'ProofAtlasLocalCutContextDescriptor/1');assert(d.decodedBytes<=8388608);
 const raw=z.gunzipSync(fs.readFileSync('.'+d.file));assert.equal(raw.length,d.decodedBytes);assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),d.sha256);data=JSON.parse(raw);
 for(const [f,h]of Object.entries(data.producer.sourceFiles))assert.equal(crypto.createHash('sha256').update(fs.readFileSync(f)).digest('hex'),h);
}
const result=audit(data);let negativeControls=0;
const changes=[
 x=>x.format='other',x=>x.theorems.pop(),x=>x.theorems[0].name='other',x=>x.theorems[0].axioms.push('sorryAx'),x=>x.theorems[0].kernelProof='unrecorded',
 x=>x.cases.pop(),x=>x.cases[1].label=x.cases[0].label,x=>x.cases[0].proofTypingClaim=true,x=>x.cases[0].source.kind='unknown',
 x=>x.cases[1].focus=[1],x=>x.cases[0].occurrences++,x=>x.cases[0].initialHidden++,x=>x.cases[0].rows[0].depth++,
 x=>x.cases[0].rows[0].retained++,x=>x.cases[0].rows[0].hidden++,x=>x.cases[0].rows[0].replacementRetained++,
 x=>x.cases[0].rows[0].visibility.pop(),x=>x.cases[0].rows[0].visibility[0].after=true,x=>x.cases[1].rows[0].visibility[0].inside=true,
 x=>x.cases[1].rows[1].after.children[1].payload='changed sibling',x=>x.cases[0].rows[1].after.payload='changed payload',
 x=>x.cases[0].rows[0].replacement.source.payload='changed hole source'
];
for(const change of changes){const changed=structuredClone(data);change(changed);assert.throws(()=>audit(changed));negativeControls++;}
const report={...result,negativeControls};fs.writeFileSync(process.env.ATLAS_LOCAL_CUT_CONTEXT_REPORT||'/tmp/atlas-local-cut-context.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
