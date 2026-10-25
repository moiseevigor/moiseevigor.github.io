/* Derive the complete finite topology from authenticated native ports, not names. */
'use strict';
const fs=require('fs'),vm=require('vm'),z=require('zlib'),assert=require('assert/strict');
const A=require('../../../public/js/proof-atlas-library-data'),M=require('../../../public/js/proof-atlas-application-ports'),E=require('../../../public/js/proof-atlas-equality-transport'),N=require('../../../public/js/proof-atlas-application-network'),S=require('../application-ports/store.cjs');
const base='research/proof-atlas/application-network/',manifestFile='public/data/proof-atlas/application-network-manifest.js';
const originalFile='public/data/proof-atlas/application-ports-manifest.js',evidenceFile='research/proof-atlas/application-ports/application-ports-evidence.json';
const read=d=>{const bytes=z.gunzipSync(fs.readFileSync('.'+d.file));assert.equal(S.sha(bytes),d.sha256);return JSON.parse(bytes);};
const h={};vm.runInNewContext(fs.readFileSync(originalFile,'utf8'),{window:h});
const inventory=h.PROOF_ATLAS_APPLICATION_PORTS,nativeEvidenceSha256=S.sha(fs.readFileSync(evidenceFile));
const rows=[],totals={profiles:0,calls:0,ports:0,connections:0,bindingConnections:0,unrecordedPorts:0,sharedResults:0};
for(const descriptor of inventory.records) {
  const d=JSON.parse(JSON.stringify(descriptor)),native=read(d.owner),pages=read(d.pages),data=A.validateIndex(read({file:d.record.indexFile,sha256:d.record.indexSha256}),d.record);
  M.validateHeader(native,d);assert.deepEqual(native.entries,pages.calls.flatMap(c=>c.ports.map(p=>read(p).entry)));
  const entries=new Map(native.entries.map(e=>[e.id,e.junction])),routes=new Map(d.calls.map(c=>[M.key(c.anchor.route),c.index]));
  const table={format:'ProofAtlasApplicationNetwork/1',source:d.source,owner:d.owner,nativeEvidenceSha256,calls:d.calls.map(c=>{
    const result=entries.get(c.index+':0');
    return {index:c.index,anchor:c.anchor,arguments:c.arguments,functionLabel:c.functionLabel,result:{role:result.resultRole,contextLength:result.consumer.context.length,typeText:result.display.consumerType.slice(0,1024)},ports:c.ports.map(p=>{
      const j=entries.get(p.id);M.validatePort(j,data,c,p.slot);
      const known=routes.get(M.key(j.producer.anchor.route));let bridge=null;
      if(known!==undefined) {
        const output=entries.get(known+':0');
        assert.deepEqual(j.producer.anchor,output.consumer.anchor,'same exact source occurrence');
        assert.deepEqual(j.producer.context,output.consumer.context,'same original lexical context');
        assert(E.equal(j.graph,j.roots.producerType,output.graph,output.roots.consumerType,0),'literal producer/output type bridge');bridge='PASS';
      }
      return {id:p.id,slot:p.slot,input:j.consumer.input,producer:j.producer.anchor,producerKind:j.producer.kind,producerContextLength:j.producer.context.length,consumerContextLength:j.consumer.context.length,role:j.producer.role,visibility:j.binderInfo,hops:j.definitionHops,externalBinder:j.externalBinder,definitionBoundary:j.definitionBoundary,knownProducer:known===undefined?null:known,literalProducerResultType:bridge};
    })};
  })};
  d.topology={nativeEvidenceSha256};const counts=N.validate(table,d);const asset=S.store('public/data/proof-atlas/application-network',table);assert(asset.bytes<=2097152);
  d.topology={...asset,nativeEvidenceSha256};rows.push(d);
  totals.profiles++;totals.calls+=table.calls.length;totals.ports+=counts.ports;totals.connections+=counts.known;totals.unrecordedPorts+=counts.unrecorded;
  const uses=new Map();for(const c of table.calls)for(const p of c.ports)if(p.knownProducer!==null){if(p.hops.length)totals.bindingConnections++;uses.set(p.knownProducer,(uses.get(p.knownProducer)||0)+1);}
  totals.sharedResults+=[...uses.values()].filter(n=>n>1).length;
}
const out={format:'ProofAtlasApplicationNetworkInventory/1',producerSha256:S.sha(fs.readFileSync(__filename)),sourceInventorySha256:S.sha(fs.readFileSync(originalFile)),nativeEvidenceSha256,records:rows};
const bytes='window.PROOF_ATLAS_APPLICATION_NETWORK = '+JSON.stringify(out)+';\n';
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(manifestFile,'utf8'),bytes);else fs.writeFileSync(manifestFile,bytes);
const report={format:'ProofAtlasApplicationNetworkDerivation/1',status:'PASS',...totals,sourceInventorySha256:out.sourceInventorySha256,nativeEvidenceSha256,producerSha256:out.producerSha256,manifestSha256:S.sha(Buffer.from(bytes)),maxTopologyBytes:Math.max(...rows.map(d=>d.topology.bytes)),scope:'Every port of the earlier explicit application inventory. Exact-source composition and literal output/input type bridge only; no new Lean checks or whole-proof coverage claim.'};
if(process.argv.includes('--check'))assert.deepEqual(JSON.parse(fs.readFileSync(base+'derivation.json')),report);else fs.writeFileSync(base+'derivation.json',JSON.stringify(report,null,2)+'\n');
console.log(JSON.stringify(report));
