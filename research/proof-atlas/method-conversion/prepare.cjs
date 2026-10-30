'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),assert=require('assert/strict');process.chdir(path.resolve(__dirname,'../../..'));
const {profiles,read,compact,sha}=require('../method-context/catalogue.cjs'),A=require('../../../public/js/proof-atlas-library-data'),M=require('../../../public/js/proof-atlas-method-interfaces'),I=require('../../../public/js/proof-atlas-branch-instantiation'),B=require('../../../public/js/proof-atlas-method-context');
const folder=process.argv[2];assert(folder);fs.mkdirSync(folder,{recursive:true});
const previous=JSON.parse(z.gunzipSync(fs.readFileSync('research/proof-atlas/method-context/model-check.json.gz'))),targets=previous.rows.filter(r=>r.status==='unavailable'),plan=[];
(async()=>{for(const name of [...new Set(targets.map(t=>t.name))]){
 const d=profiles.find(x=>x.d.name===name).d,bytes=z.gunzipSync(fs.readFileSync('.'+d.record.indexFile));assert.equal(sha(bytes),d.record.indexSha256);const source=A.validateIndex(JSON.parse(bytes),d.record),raw=read(d.file,d.sha256),model=M.open(raw,source,d.record,d),selected=[];
 for(const q of raw.entries){const wanted=targets.filter(t=>t.name===name&&JSON.stringify(t.query)===JSON.stringify(q.parent.route));if(!wanted.length)continue;const ports=[];
  for(const t of wanted){const flow=model.flow(q.parent.route,t.minor),parent=await I.compare(flow),local=B.compare(flow,parent,{kind:'body'});assert.equal(local.status,'unavailable');const value=B.exportRecord(local);ports.push({minor:t.minor,body:local.computed,candidateGraph:compact(value.graph,[value.expectedRoot,value.actualRoot]),originalLocalComparison:local});}
  selected.push({originalQuery:q,ports});
 }
 const ordinal=plan.length,packet=path.resolve(folder,'packet-'+ordinal+'.json');fs.writeFileSync(packet,bytes);
 const request={source:{name:d.name,edition:d.edition,indexSha256:d.indexSha256,sourceSha256:d.sourceSha256,module:d.record.module},packetFile:packet,originalNativeOwner:d.sha256,queries:selected};
 const file=path.resolve(folder,'request-'+ordinal+'.json');fs.writeFileSync(file,JSON.stringify(request));plan.push({ordinal,name,record:d.record,descriptor:d,requestFile:file,requestSha256:sha(fs.readFileSync(file)),packetSha256:sha(bytes),ports:selected.reduce((n,q)=>n+q.ports.length,0)});
}
assert.equal(plan.length,3);assert.equal(plan.reduce((n,p)=>n+p.ports,0),6);fs.writeFileSync(path.join(folder,'plan.json'),JSON.stringify({format:'ProofAtlasMethodConversionPlan/1',profiles:plan,previousModelSha256:sha(fs.readFileSync('research/proof-atlas/method-context/model-check.json.gz'))},null,2));console.log(JSON.stringify({status:'PASS',profiles:plan.length,ports:6}));})().catch(e=>{console.error(e.stack);process.exitCode=1});
