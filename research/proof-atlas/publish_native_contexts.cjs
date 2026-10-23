/* Append exact compiled native queries; private projects and logs are not inputs. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
const S=require('./share_type_graphs.cjs'),O=require('../../public/js/proof-atlas-occurrence-types'),Z=require('../../public/js/proof-atlas-let-reduction');
const bytes=v=>Buffer.from(JSON.stringify(v)),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),clone=v=>JSON.parse(JSON.stringify(v));
function project(input,kind,record){
 assert(['types','lets'].includes(kind));assert(input.format==='ProofAtlasOccurrenceTypes/1'&&input.entries.length>0&&input.entries.length<=512);
 const keys=['format','name','source','nativeDagMatchesPacket','leanVersion','entries','environment','sourceModuleHashVerified'];assert(Object.keys(input).every(k=>keys.includes(k)),'Unreviewed native envelope');
 assert(input.entries.every(e=>e.status==='checked'),'Unavailable queries require separate reviewed publication');
 const raw=bytes(input);assert(raw.length<=67108864);assert(!raw.includes(Buffer.from('/Users/'))&&!raw.includes(Buffer.from('/tmp/'))&&!raw.includes(Buffer.from('full_proof')),'Private source/path fields');
 const source=z.gunzipSync(fs.readFileSync('.'+record.indexFile),{maxOutputLength:67108864});assert.equal(sha(source),record.indexSha256);const data=JSON.parse(source);
 O.validate(input,data,record);if(kind==='lets'){assert(input.entries.every(e=>e.letJudgment?.status==='checked'));Z.validate(input,data,record);}
 const projected=clone(input);projected.environment={...projected.environment,historicalSnapshotEnvironmentReconstructed:false,attestationScope:'Selected native judgments in the recorded existing compiled environment, matched to the exact immutable packet. This is not reconstruction of a complete historical snapshot or a portable kernel certificate.'};
 const packed=S.pack(projected);
 // Compression sizes vary with zlib. They describe an encoding artifact, not
 // the canonical projection of the recorded judgments.
 delete packed.packing.originalCompressedBytes;packed.packing.originalDecodedBytes=bytes(projected).length;packed.packing.compressionMetricsExcluded=true;
 S.verify(packed);O.validate(packed,data,record);if(kind==='lets')Z.validate(packed,data,record);
 const body=bytes(packed),base='/public/data/proof-atlas/'+(kind==='lets'?'let-reductions':'occurrence-types')+'/',inputFile=base+'native-'+sha(raw)+'.json.gz',file=base+'context-'+sha(body)+'.json.gz';
 const descriptor={...input.source,file,sha256:sha(body),checked:input.entries.length,queried:input.entries.length,nativeInput:{file:inputFile,sha256:sha(raw)},queryScope:'finite-exact-occurrences/1',...(kind==='lets'?{routes:input.entries.map(e=>e.route)}:{})};
 return{descriptor,files:[[inputFile,z.gzipSync(raw)],[file,z.gzipSync(body)]],packed};
}
function readManifest(name,globalName){const h={};vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+name+'.js','utf8'),{window:h});return clone(h[globalName]);}
function append(manifest,descriptor){const prior=manifest.records.find(d=>d.edition===descriptor.edition&&d.name===descriptor.name);if(prior)assert.deepEqual(prior,descriptor,'Refuse replacing an existing native profile');else manifest.records.push(descriptor);}
function emit(file,b){if(fs.existsSync(file)){assert(z.gunzipSync(fs.readFileSync(file)).equals(z.gunzipSync(b)),'Existing compiled archive changed');return;}fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,b);}
function reproject(){
 const library=readManifest('library-manifest','PROOF_ATLAS_LIBRARY');let profiles=0;
 for(const[kind,name,globalName]of [['types','occurrence-types-manifest','PROOF_ATLAS_OCCURRENCE_TYPES'],['lets','let-reductions-manifest','PROOF_ATLAS_LET_REDUCTIONS']]){
  const manifest=readManifest(name,globalName);
  for(let i=0;i<manifest.records.length;i++){
   const old=manifest.records[i];if(!old.nativeInput)continue;
   const raw=z.gunzipSync(fs.readFileSync('.'+old.nativeInput.file),{maxOutputLength:67108864});assert.equal(sha(raw),old.nativeInput.sha256);
   const record=library.editions.find(e=>e.id===old.edition).declarations.find(r=>r.name===old.name),result=project(JSON.parse(raw),kind,record);
   const priorRaw=z.gunzipSync(fs.readFileSync('.'+old.file),{maxOutputLength:67108864});assert.equal(sha(priorRaw),old.sha256);const prior=JSON.parse(priorRaw);S.verify(prior);
   const previous={...prior},next={...result.packed};delete previous.packing;delete next.packing;
   assert.deepEqual(previous,next,'Reprojection cannot replace recorded data');assert.deepEqual(result.descriptor.nativeInput,old.nativeInput);
   assert.equal(prior.packing.nativeAttestationSha256,result.packed.packing.nativeAttestationSha256);assert.equal(prior.packing.nativeJudgmentsSha256,result.packed.packing.nativeJudgmentsSha256);
   for(const[file,b]of result.files)emit('.'+file,b);manifest.records[i]=result.descriptor;profiles++;
  }
  fs.writeFileSync('public/data/proof-atlas/'+name+'.js','window.'+globalName+'='+JSON.stringify(manifest)+';\n');
 }
 console.log(JSON.stringify({status:'PASS',reprojectedProfiles:profiles,nativeQueriesUnchanged:true,originalArchivesRetained:true,compressionMetricsExcluded:true}));
}
function main(args){
 if(args.length===1&&args[0]==='--reproject'){const stat=fs.statfsSync('.');assert(stat.bavail*stat.bsize>=30*1024**3,'Disk reserve');return reproject();}
 assert(args.length>0&&args.length%2===0,'Use --lets native.json and/or --types native.json');const library=readManifest('library-manifest','PROOF_ATLAS_LIBRARY'),primary=readManifest('occurrence-types-manifest','PROOF_ATLAS_OCCURRENCE_TYPES'),lets=readManifest('let-reductions-manifest','PROOF_ATLAS_LET_REDUCTIONS'),files=[];let count=0;const before=primary.records.length+lets.records.length;
 for(let i=0;i<args.length;i+=2){const kind=args[i].slice(2);assert(['types','lets'].includes(kind));const inputs=JSON.parse(fs.readFileSync(args[i+1]));assert(Array.isArray(inputs)&&inputs.length>0&&inputs.length<=32);
  for(const input of inputs){const record=library.editions.find(e=>e.id===input.source.edition)?.declarations.find(r=>r.name===input.name);assert(record,'Project packet identity');const result=project(input,kind,record);append(kind==='lets'?lets:primary,result.descriptor);files.push(...result.files);count+=result.descriptor.checked;}
 }
 const stat=fs.statfsSync('.');assert(stat.bavail*stat.bsize>=30*1024**3,'Disk reserve');for(const[file,b]of files)emit('.'+file,b);
 lets.coverage='Finite native local-definition queries at the listed exact source routes. The fixed AI sample and project packet identities retain separate provenance. Other occurrences are not covered.';
 fs.writeFileSync('public/data/proof-atlas/occurrence-types-manifest.js','window.PROOF_ATLAS_OCCURRENCE_TYPES='+JSON.stringify(primary)+';\n');fs.writeFileSync('public/data/proof-atlas/let-reductions-manifest.js','window.PROOF_ATLAS_LET_REDUCTIONS='+JSON.stringify(lets)+';\n');console.log(JSON.stringify({status:'PASS',validatedQueries:count,newProfiles:primary.records.length+lets.records.length-before,primaryProfiles:primary.records.length,letProfiles:lets.records.length,scope:'Compiled native inputs and validated packed judgments only. Delivery pools and Merkle pages are generated separately.'}));
}
if(require.main===module)main(process.argv.slice(2));module.exports={project};
