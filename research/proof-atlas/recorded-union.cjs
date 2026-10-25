/* Finite compiled-package union shared by occurrence-page producers/tests.
   Only existing public term archives are opened; no private source is read. */
'use strict';
const fs=require('fs'),vm=require('vm'),z=require('zlib'),T=require('../../public/js/proof-atlas-deep-context'),F=require('../../scripts/proof-atlas-judgment-fixtures.cjs');
function inventory(){
 const h={};for(const f of ['packet-types-manifest.js','use-site-types-manifest.js'])vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+f,'utf8'),{window:h});
 return F.inventory().map(item=>{const inputs=item.descriptors.map(p=>({kind:p.kind,descriptor:p.descriptor}));for(const [kind,records]of [['packet',h.PROOF_ATLAS_PACKET_TYPES.records],['useSites',h.PROOF_ATLAS_USE_SITE_TYPES.records]]){const descriptor=records.find(d=>d.edition===item.edition&&d.name===item.record.name);if(descriptor)inputs.push({kind,descriptor});}return{edition:item.edition,record:item.record,inputs};});
}
const raw=file=>z.gunzipSync(fs.readFileSync('.'+file),{maxOutputLength:67108864});
async function open(item){
 const source=raw(item.record.indexFile),inputs=[];
 for(const p of item.inputs)inputs.push({kind:p.kind,package:await (p.kind==='let'?T.recordedLets:T.recorded)(source,raw(p.descriptor.file),p.descriptor,item.record)});
 const pkg=T.unionRecorded(inputs);return{package:pkg,case:pkg.case(item.record.name),inputs};
}
module.exports={inventory,open,raw};
