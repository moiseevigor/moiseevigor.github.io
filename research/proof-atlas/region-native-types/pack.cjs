/* Browser packets contain recorded types and exact context links, not full proofs. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),readline=require('readline'),assert=require('assert/strict');
const M=require('../region-context-projection/model.cjs'),A=require('../../../public/js/proof-atlas-library-data');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/region-native-types/',out='public/data/proof-atlas/region-native-types/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),load=f=>JSON.parse(z.gunzipSync(fs.readFileSync(f)));
async function main(){
 const plan=load(base+'plan.json.gz'),native=load(base+'native-check.json.gz'),model=load(base+'model.json.gz'),bundle=load('research/proof-atlas/corpus-definition-boundaries/native-check.json.gz');
 assert.equal(model.status,'PASS');for(const[f,h]of Object.entries(model.files))assert.equal(sha(fs.readFileSync(f)),h,f);
 fs.mkdirSync(out,{recursive:true});const profiles=[],files={},report={format:'ProofAtlasRegionTypePackets/1',status:'PASS',queries:0,maxBytes:0,maxRows:0};
 for(let pi=0;pi<plan.profiles.length;pi++){
  const p=plan.profiles[pi],record=native.profiles[pi],owner=bundle.profiles.find(v=>v.source.indexSha256===p.source.indexSha256),g=owner.cases.find(c=>c.plan.id===p.id).native.result.graph,source=JSON.parse(owner.sourcePacketText),entries=[];
  function address(componentIndex,slots){const node=A.walk(g,{root:componentIndex,slots});if(componentIndex===0)return{namespace:'source-expression',edition:p.source.edition,name:p.source.name,indexSha256:p.source.indexSha256,sourceSha256:p.source.sourceSha256,node:A.walk(source,{root:1,slots}),route:{root:1,slots}};return{namespace:'corpus-definition-boundary',sourceIndexSha256:p.source.indexSha256,nativeInventorySha256:p.nativeInventorySha256,nativeCaseSha256:p.nativeCaseSha256,manifestSha256:p.graphManifestSha256,case:p.id,component:'interface.term',node,route:{root:'interface.term',slots}};}
  const file=base+'native-'+pi+'.ndjson.gz';assert.equal(sha(fs.readFileSync(file)),record.outputSha256);let qi=0;const digest=crypto.createHash('sha256');
  for await(const line of readline.createInterface({input:fs.createReadStream(file).pipe(z.createGunzip()),crlfDelay:Infinity})){
   digest.update(line+'\n');const row=JSON.parse(line),q=p.queries[qi];assert.deepEqual(row.query,q);const evidence=record.resources.queries[qi++];assert.equal(sha(Buffer.from(line+'\n')),evidence.rawSha256);
   const at=M.walk(g,g.roots[q.componentIndex],q.slots),frames=at.scope.map((s,ordinal)=>({ordinal,kind:A.kinds[g.kind[s.node]],name:g.payloads[s.node].binderName||g.payloads[s.node].declName||'_',address:address(q.componentIndex,s.path),locator:{component:q.component,slots:s.path}}));
   const packet={format:'ProofAtlasRegionTypePacket/1',query:q,owner:{source:p.source,id:p.id,nativeCaseSha256:p.nativeCaseSha256,nativeInventorySha256:p.nativeInventorySha256,graphManifestSha256:p.graphManifestSha256},
    evidence:{nativeVerificationSha256:sha(z.gunzipSync(fs.readFileSync(base+'native-check.json.gz'))),archive:('/'+file),archiveSha256:record.outputSha256,record:q.id,recordSha256:evidence.rawSha256},
    judgments:Object.fromEntries(['kernelOriginalTyping','kernelProjectedOpenTyping','kernelClosedExpectedType','kernelRecoveryConversion','kernelEqualityWitness','literalInverse'].map(k=>{assert.equal(row[k],'PASS');return[k,row[k]];})),originalDepth:row.originalDepth,retainedDepth:row.retainedDepth,frames,types:row.types,contextLetNondep:false};
   const bytes=Buffer.from(JSON.stringify(packet)+'\n'),h=sha(bytes),filename=out+h+'.json.gz';assert(bytes.length<=1048576);assert(row.types.kind.length<=32768);
   const packed=z.gzipSync(bytes,{mtime:0});if(process.argv.includes('--check'))assert(fs.readFileSync(filename).equals(packed));else fs.writeFileSync(filename,packed);files[filename]=sha(packed);
   entries.push({region:q.regionAddress,keptSlots:q.baseKeptSlots,part:q.part,file:'/'+filename,sha256:h,bytes:bytes.length,record:q.id});
   report.queries++;report.maxBytes=Math.max(report.maxBytes,bytes.length);report.maxRows=Math.max(report.maxRows,row.types.kind.length);
  }
  assert.equal(qi,p.queries.length);assert.equal(digest.digest('hex'),record.resources.rawStreamSha256);profiles.push({source:p.source,id:p.id,nativeCaseSha256:p.nativeCaseSha256,nativeInventorySha256:p.nativeInventorySha256,graphManifestSha256:p.graphManifestSha256,entries});
 }
 assert.equal(report.queries,150);const registry={format:'ProofAtlasRegionTypeRegistry/1',profiles},manifest=Buffer.from('window.PROOF_ATLAS_REGION_TYPES = '+JSON.stringify(registry)+';\n');assert(manifest.length<=524288);
 const manifestFile='public/data/proof-atlas/region-types-manifest.js';if(process.argv.includes('--check'))assert(fs.readFileSync(manifestFile).equals(manifest));else fs.writeFileSync(manifestFile,manifest);files[manifestFile]=sha(manifest);
 report.registryBytes=manifest.length;report.files=files;report.producerSha256=sha(fs.readFileSync(__filename));report.modelSha256=sha(fs.readFileSync(base+'model.json.gz'));
 const bytes=Buffer.from(JSON.stringify(report,null,2)+'\n');if(process.argv.includes('--check'))assert(z.gunzipSync(fs.readFileSync(base+'packets.json.gz')).equals(bytes));else fs.writeFileSync(base+'packets.json.gz',z.gzipSync(bytes,{mtime:0}));
 console.log(JSON.stringify({...report,files:undefined}));
}
main().catch(e=>{console.error(e.stack);process.exitCode=1;});
