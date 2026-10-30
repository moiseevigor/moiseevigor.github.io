'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),z=require('zlib'),cp=require('child_process'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const {sha}=require('../method-context/catalogue.cjs'),file='research/proof-atlas/region-result-closures/native-check.json.gz';
const bytes=fs.readFileSync(file);assert(bytes.equals(cp.execFileSync('git',['show','e22691381fa67123d67c33a19ff172c1ed6dce8c:'+file])));
const evidence=JSON.parse(z.gunzipSync(bytes)),h={};assert.equal(evidence.verification.status,'PASS');
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/network-streaming-manifest.js','utf8'),{window:h});
const records=[],directory='public/data/proof-atlas/region-output-types';fs.mkdirSync(directory,{recursive:true});
function save(data,limit){const raw=Buffer.from(JSON.stringify(data));assert(raw.length<=limit);const digest=sha(raw),file=directory+'/'+digest+'.json.gz';fs.writeFileSync(file,z.gzipSync(raw));return{file:'/'+file,sha256:digest,bytes:raw.length};}
for(const p of evidence.profiles){const d=h.PROOF_ATLAS_NETWORK_STREAMING.records.find(d=>d.source.indexSha256===p.source.indexSha256&&d.owner?.sha256===p.originalNativeOwner?.sha256);if(!d)continue;
 for(const g of p.output.groups){const ports=g.ports.map((entry,ordinal)=>{
   const {originalType,...port}=entry.port,closedType=entry.graph.typeGraph;
   assert(originalType.kind.length<=2048&&closedType.kind.length<=2048);
   const type=save({format:'ProofAtlasRegionOutputType/1',source:d.source,originalNativeOwner:d.owner.sha256,nativeBundleSha256:sha(bytes),group:g.id,port,checks:entry.checks,graphs:{originalResultType:originalType,closedResultType:closedType}},1048576);
   return{...port,checks:entry.checks,projection:{snd:ordinal,fst:ordinal+1<g.ports.length},type};
  });
  const data={format:'ProofAtlasRegionOutputIndex/1',source:d.source,originalNativeOwner:d.owner.sha256,nativeBundleSha256:sha(bytes),
   group:g.id,commonContext:g.commonContext,prefixRoute:g.prefixRoute,tupleTyping:g.tupleTyping,tupleNamespace:g.tupleNamespace,isIndependentBoundaryFunction:false,ports,
   provenance:{compiler:evidence.verification.compiler,dependencyRecovery:evidence.verification.dependencyRecovery,originalEnvironmentIdentityVerified:false,originalDeclarationImported:p.output.originalDeclarationImported,laws:p.output.laws}};
  const index=save(data,262144);records.push({...index,source:d.source,originalNativeOwner:d.owner.sha256,members:ports.map(p=>p.call),commonContextLength:g.commonContext.length,label:d.source.name+' · '+ports.length+' results · Γ'+g.commonContext.length});
 }
}
assert.equal(records.length,3);fs.writeFileSync('public/data/proof-atlas/region-outputs-manifest.js','window.PROOF_ATLAS_REGION_OUTPUTS = '+JSON.stringify({format:'ProofAtlasRegionOutputInventory/1',records})+';\n');
console.log(JSON.stringify({status:'PASS',collections:records.length,ports:18,maxIndexBytes:Math.max(...records.map(r=>r.bytes))}));
