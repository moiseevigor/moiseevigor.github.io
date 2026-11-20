/* One inventoried call and one argument per existing native profile. This is
 * an explicitly bounded sample, not coverage of every application or term. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),z=require('zlib'),assert=require('assert/strict'),crypto=require('crypto');
process.chdir(path.resolve(__dirname,'../../..'));
const {checkScene,report}=require('./check-model.cjs');
const Q=require('../../../public/js/proof-atlas-application-paged-provider');
const A=require('../../../public/js/proof-atlas-library-data');
const copy=x=>JSON.parse(JSON.stringify(x)),sha=x=>crypto.createHash('sha256').update(x).digest('hex');
const host={},manifests=['network-streaming-manifest','application-region-controls-manifest',
  'inventory-region-controls-manifest','premise-source-controls-manifest','rule-support-controls-manifest'];
for(const name of manifests)vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+name+'.js','utf8'),{window:host});
const records=copy([host.PROOF_ATLAS_NETWORK_STREAMING,host.PROOF_ATLAS_APPLICATION_REGION_CONTROLS,
  host.PROOF_ATLAS_INVENTORY_REGION_CONTROLS,host.PROOF_ATLAS_PREMISE_SOURCE_CONTROLS,
  host.PROOF_ATLAS_RULE_SUPPORT_CONTROLS].flatMap(d=>d.records).filter(d=>d.mode==='native'));
const forbidden=new Set(records.flatMap(d=>[d.owner.file,d.record.indexFile]));
const fetcher=async file=>{assert(!forbidden.has(file),'whole native/source archive requested');
  assert(file.startsWith('/public/data/proof-atlas/'));report.requests++;return new Response(fs.readFileSync('.'+file));};
report.format='ProofAtlasTypeSharingCorpusSample/1';report.coverage='Argument with largest expanded original producer type per existing native profile (stable inventory-order ties); original/lifted/expected roots. 42 profiles, not all 877 inputs.';
report.unavailableRoots=[];
(async()=>{
  assert.equal(records.length,42);
  for(const d of records){
    // Full graphs are independent verifier input, outside the runtime reader.
    const batch=JSON.parse(z.gunzipSync(fs.readFileSync('.'+d.owner.file))),
      data=A.validateIndex(JSON.parse(z.gunzipSync(fs.readFileSync('.'+d.record.indexFile))),d.record);
    const candidates=batch.entries.filter(e=>e.junction.consumer.slot>0);
    const selected=candidates.reduce((a,b)=>BigInt(b.junction.graph.expanded[b.junction.roots.producerType])>BigInt(a.junction.graph.expanded[a.junction.roots.producerType])?b:a);
    const query=selected.junction.consumer.anchor.route,slot=selected.junction.consumer.slot;
    const lease=await Q.open(d,query,{fetcher,firstArgument:Math.floor((slot-1)/4)*4});
    const profile={name:d.source.name,owner:d.owner.sha256,input:selected.id,roots:[]};
    try{
      const port=lease.create().nodes.find(n=>n.slot===slot);assert(port?.typeBridge,'selected argument has recorded types');
      const j=batch.entries.find(e=>e.id===port.typeBridge.identity.input).junction;
      for(const stage of port.typeBridge.stages){
        const address=stage.address,ambient=stage.id==='original'?j.producer.context:j.consumer.context;
        const context=ambient.map(b=>({name:data.payloads[b.node].binderName||data.payloads[b.node].declName||'_',
          address:{namespace:'source-expression',name:d.source.name,indexSha256:d.source.indexSha256,
            sourceSha256:d.source.sourceSha256,node:b.node,route:copy(b.route)}}));
        let session;
        try{
          session=await lease.openTypeShapes(address);const scene=session.getScene();
          await checkScene(session,scene,j.graph,j.roots[address.component],context,address);
          profile.roots.push({component:address.component,status:'available',baseObjects:scene.base.stats.nodes,
            displayObjects:scene.display.stats.nodes,family:scene.family?.id||null,
            interfaceStatus:scene.family?.status||'no-repetition-in-cut'});
        }catch(error){
          // Fail unexpected errors. Resource refusal is part of the observed
          // coverage and remains visible rather than being called success.
          assert.match(error.message,/decoded row bound|decoded row byte bound|view metadata bound|context bound/);
          const boundary={component:address.component,status:'unavailable',reason:error.message};
          profile.roots.push(boundary);report.unavailableRoots.push({name:d.source.name,...boundary});
        }finally{session?.dispose();}
        report.roots++;
      }
      assert.equal(lease.state().completeRecordedTypeGraphArraysAllocated,0);
    }finally{lease.dispose();}
    report.nativeProfiles.push(profile);
  }
  assert.equal(report.roots,126);report.status='PASS';
  report.files=Object.fromEntries(['research/proof-atlas/type-sharing/check-corpus.cjs',
    'research/proof-atlas/type-sharing/check-model.cjs','public/js/proof-atlas-type-sharing.js',
    'public/js/proof-atlas-application-type-pages.js',...manifests.map(n=>'public/data/proof-atlas/'+n+'.js')]
    .map(f=>[f,sha(fs.readFileSync(f))]));
  assert(process.argv[2],'report output required');fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({...report,files:undefined,nativeProfiles:report.nativeProfiles.length}));
})().catch(e=>{console.error(e.stack);process.exit(1);});
