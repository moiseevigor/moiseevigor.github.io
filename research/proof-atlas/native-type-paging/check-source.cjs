/* Re-hashed false metadata must fail source checks, independently of transport hashes. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),z=require('zlib'),assert=require('assert/strict');process.chdir(path.resolve(__dirname,'../../..'));
const K=require('./pack.cjs'),R=require('../../../public/js/proof-atlas-application-type-pages'),P=require('../../../public/js/proof-atlas-source-pages'),L=require('../../../public/js/proof-atlas-type-pages'),h={};
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/network-streaming-manifest.js','utf8'),{window:h});
const d=h.PROOF_ATLAS_NETWORK_STREAMING.records[0],prepared=K.prepare(d,z.gunzipSync(fs.readFileSync('.'+d.owner.file)),z.gunzipSync(fs.readFileSync('.'+d.record.indexFile))),copy=x=>JSON.parse(JSON.stringify(x));let active,hook=null,liveSources=0,liveTypes=0;
for(const [api,kind]of [[P,'source'],[L,'type']]){const original=api.open;api.open=async(...args)=>{const cursor=await original(...args);if(kind==='source')liveSources++;else liveTypes++;let disposed=false;return{...cursor,dispose(){if(!disposed){disposed=true;if(kind==='source')liveSources--;else liveTypes--;}cursor.dispose();}};};}
const requests=[],fetcher=async(file,options)=>{assert(![d.owner.file,d.record.indexFile].includes(file),'whole archive request');requests.push(file);if(options?.signal?.aborted)throw options.signal.reason;if(hook){const response=await hook(file);if(response)return response;}if(active.files.has(file))return new Response(z.gzipSync(active.files.get(file)));assert(file.startsWith('/public/data/proof-atlas/source-pages/'),'unlisted source asset');return new Response(fs.readFileSync('.'+file));};
function forge(id,mutate){active=K.pack(prepared,id);const descriptor=active.descriptor,manifest=JSON.parse(active.files.get(descriptor.file)),metadata=JSON.parse(active.files.get(manifest.applicationPort.file));mutate(metadata.port);const base=descriptor.file.slice(0,descriptor.file.lastIndexOf('/')+1),bytes=K.encode(metadata),sha=K.sha(bytes),file=base+sha+'.port.gz';active.files.set(file,bytes);manifest.applicationPort={file,sha256:sha,bytes:bytes.length};const mb=K.encode(manifest),mh=K.sha(mb),mf=base+mh+'.manifest.gz';active.files.set(mf,mb);Object.assign(descriptor,{file:mf,sha256:mh,bytes:mb.length,metadataSha256:sha});return descriptor;}
const refusals=[];let sharedOccurrence=null;
async function reject(label,descriptor,options={},pattern){await assert.rejects(()=>R.open(descriptor,{fetcher,...options}),pattern);assert.equal(liveSources,0,label+' leaked source cursor');assert.equal(liveTypes,0,label+' leaked type cursor');refusals.push(label);}
(async()=>{
 for(const [name,change]of [
  ['unchecked-native-port',j=>j.checks.kernelInputDomain='unchecked'],
  ['callable-input',j=>j.callableInput=!j.callableInput],
  ['callable-result',j=>j.callableResult=!j.callableResult],
  ['consumer-context-route',j=>j.consumer.context[0].route.slots.push(0)],
  ['consumer-context-node',j=>j.consumer.context[0].node++],
  ['consumer-context-path',j=>j.consumer.context[0].path+='\u002eforged'],
  ['producer-context-order',j=>j.producer.context.reverse()],
  ['producer-kind',j=>j.producer.kind=(j.producer.kind+1)%12],
  ['producer-head-payload',j=>j.producer.headPayload={name:'forged',levels:[]}],
  ['external-binder',j=>j.externalBinder=copy(j.consumer.context[0])],
  ['definition-boundary',j=>j.definitionBoundary=!j.definitionBoundary],
  ['producer-count',j=>j.producer.expanded=String(BigInt(j.producer.expanded)+1n)],
  ['consumer-arity',j=>j.consumer.arguments++],
  ['input-occurrence',j=>j.consumer.input.route.slots.push(0)]
 ])await reject(name,forge('0:0',change),{},/Application source paths:|Application ports:|Application type pages:/);
 for(const [name,change]of [
  ['binding-index',j=>j.definitionHops[0].index++],
  ['binding-nondep',j=>j.definitionHops[0].nondep=!j.definitionHops[0].nondep],
  ['binding-value-occurrence',j=>j.definitionHops[0].value.route.slots.push(0)],
  ['binding-removed',j=>j.definitionHops=[]]
 ])await reject(name,forge('25:4',change),{},/Application source paths:|Application ports:|Application type pages:/);
 const uses=new Map();for(const e of prepared.batch.entries){const at=e.junction.consumer.input,prior=uses.get(at.node);if(prior&&JSON.stringify(prior.junction.consumer.input.route)!==JSON.stringify(at.route)){sharedOccurrence={node:at.node,original:prior.junction.consumer.input.route,foreign:at.route};await reject('same-node-different-input-occurrence',forge(prior.id,j=>j.consumer.input=copy(at)),{},/actual function\/argument port/);break;}uses.set(at.node,e);}assert(sharedOccurrence,'shared occurrence control unavailable');
 const unequal=prepared.batch.entries.find(e=>require('../../../public/js/proof-atlas-application-ports').typeStructure(e.junction.graph,e.junction.roots.producerTypeInConsumer,e.junction.roots.inputType).status==='different');assert(unequal);await reject('false-literal-weakening',forge(unequal.id,j=>j.roots.producerTypeInConsumer=j.roots.inputType),{},/literal type weakening/);
 active=K.pack(prepared,'0:0');await reject('source-row-bound',active.descriptor,{rowLimit:1},/source path row bound/);
 active=K.pack(prepared,'0:0');await reject('source-byte-bound',active.descriptor,{byteLimit:1},/source path byte bound/);
 active=K.pack(prepared,'0:0');const foreign=copy(active.descriptor);foreign.sourcePages.file=d.record.indexFile;await reject('whole-source-substitution',foreign,{},/source manifest address/);
 active=K.pack(prepared,'0:0');hook=async f=>{if(!f.startsWith('/public/data/proof-atlas/source-pages/')||f.endsWith('.json.gz'))return null;const b=z.gunzipSync(fs.readFileSync('.'+f));b[10]^=1;return new Response(z.gzipSync(b));};await reject('source-page-hash',active.descriptor,{},/hash/);hook=null;
 active=K.pack(prepared,'0:0');const controller=new AbortController();hook=async f=>{if(f.startsWith('/public/data/proof-atlas/source-pages/')){controller.abort(Error('cancel source read'));throw controller.signal.reason;}return null;};await reject('source-read-cancellation',active.descriptor,{signal:controller.signal},/cancel source read/);hook=null;
 const fp=K.pack(prepared,'0:0'),ap=K.pack(prepared,'0:1'),foreignPort=K.pack(prepared,'25:4');active=fp;for(const pack of [ap,foreignPort])for(const [f,b]of pack.files)active.files.set(f,b);const fn=await R.open(fp.descriptor,{fetcher}),arg=await R.open(ap.descriptor,{fetcher}),foreignArg=await R.open(foreignPort.descriptor,{fetcher});try{for(const [label,run,pattern]of [['foreign-call-formal',()=>fn.formalFor(foreignArg),/same native call/],['argument-as-function',()=>arg.formalFor(fn),/original function/],['foreign-reader',()=>fn.formalFor({}),/original function/]]){await assert.rejects(run,pattern);refusals.push(label);}arg.dispose();await assert.rejects(()=>fn.formalFor(arg),/disposed/);refusals.push('disposed-argument-formal');}finally{fn.dispose();arg.dispose();foreignArg.dispose();}assert.equal(liveSources,0);assert.equal(liveTypes,0);
 const forged=forge('0:1',j=>j.formal.dependencies=[99]),functionPack=K.pack(prepared,'0:0');for(const [f,b]of functionPack.files)active.files.set(f,b);const functionReader=await R.open(functionPack.descriptor,{fetcher}),badArgument=await R.open(forged,{fetcher});try{await assert.rejects(()=>functionReader.formalFor(badArgument),/formal-domain/);refusals.push('forged-formal-dependency');}finally{functionReader.dispose();badArgument.dispose();}assert.equal(liveSources,0);assert.equal(liveTypes,0);
 active=K.pack(prepared,'25:4');const reader=await R.open(active.descriptor,{fetcher}),j=active.original.junction;
 for(const a of [j.producer.anchor,j.consumer.anchor,...j.definitionHops.flatMap(h=>[h.use,h.binder,h.value])])assert(reader.inspectSource({namespace:'source-expression',name:d.source.name,indexSha256:d.source.indexSha256,sourceSha256:d.source.sourceSha256,...a}).kind);
 const at={namespace:'source-expression',name:d.source.name,indexSha256:d.source.indexSha256,sourceSha256:d.source.sourceSha256,...j.producer.anchor};assert.throws(()=>reader.inspectSource({...at,indexSha256:'0'.repeat(64)}),/foreign source selection/);refusals.push('foreign-source-inspection');
 const state=reader.state();assert(state.sourcePaths.sourceWitnessesChecked);reader.dispose();assert.equal(reader.state().sourcePaths.sourceRows,0);assert.equal(liveSources,0);assert.equal(liveTypes,0);assert.throws(()=>reader.inspectSource(at),/disposed/);refusals.push('disposed-source-inspection');
 const result={format:'ProofAtlasPagedTypeSourceWitnessControls/1',status:'REHASHED_SOURCE_METADATA_REFUSALS_AND_RELEASES_PASS',refusals,sharedOccurrence,requests:requests.length,wholeArchiveRequests:0,sourceState:state.sourcePaths,scope:'Original source occurrences, lexical contexts and binding witnesses. Native typing remains the recorded attestation; no independent archive membership or semantic proof claim.'};assert(process.argv[2]);fs.writeFileSync(process.argv[2],JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
})().catch(e=>{console.error(e.stack);process.exit(1)});
