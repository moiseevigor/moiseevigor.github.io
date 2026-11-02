/* Supplemental authored controls in the existing application inspector.
 * Original native owners and source packets are unchanged. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const K=require('../native-type-paging/pack.cjs'),M=require('../../../public/js/proof-atlas-application-ports'),A=require('../../../public/js/proof-atlas-library-data'),check=process.argv.includes('--check'),assets=new Map(),base='/public/data/proof-atlas/application-type-index/',native='research/proof-atlas/scope-comparison/native/';
const inventory=JSON.parse(z.gunzipSync(fs.readFileSync(native+'inventory.json.gz'))),producer=K.sha(fs.readFileSync(__filename));
function emit(file,bytes){if(assets.has(file)){assert.equal(assets.get(file).sha256,K.sha(bytes));return;}if(check||fs.existsSync('.'+file))assert.deepEqual(z.gunzipSync(fs.readFileSync('.'+file)),bytes,file);else{fs.mkdirSync(path.dirname('.'+file),{recursive:true});fs.writeFileSync('.'+file,z.gzipSync(bytes));}assets.set(file,{file,sha256:K.sha(bytes),bytes:bytes.length,gzipBytes:fs.statSync('.'+file).size});}
function put(dir,suffix,value){const bytes=K.encode(value),sha256=K.sha(bytes),file=dir+sha256+suffix;emit(file,bytes);return{file,sha256,bytes:bytes.length};}
function sourcePages(d,data){
 const fields=['kind','children','payloads','expanded','neededScope'],header={...data},dir='/public/data/proof-atlas/source-pages/'+d.source.indexSha256+'/';for(const f of fields)delete header[f];let leaves=[];
 for(let start=0;start<data.kind.length;start+=256){const nodes=[];for(let n=start;n<Math.min(start+256,data.kind.length);n++)nodes.push(fields.map(f=>data[f][n]));const part=put(dir,'.gz',{format:'ProofAtlasSourcePage/1',indexSha256:d.source.indexSha256,start,nodes});assert(part.bytes<=1048576);leaves.push(part.sha256);}
 const pageCount=leaves.length;let level=0,span=1;
 for(;;){const next=[];for(let start=0;start<leaves.length;start+=64)next.push(put(dir,'.json.gz',{format:'ProofAtlasSourceIndex/1',level,first:start*span,children:leaves.slice(start,start+64)}).sha256);if(next.length===1){leaves=next;break;}leaves=next;span*=64;level++;}
 const manifest=put(dir+'manifest-','.json.gz',{format:'ProofAtlasSourcePages/1',record:d.record,descriptors:[],header,nodeCount:data.kind.length,pageCount,pageSize:256,fanout:64,indexLevel:level,indexRoot:leaves[0],originalIndexSha256:d.source.indexSha256,normalizedSourceSha256:K.sha(K.encode(data)),producerSha256:producer,validatorSha256:K.sha(fs.readFileSync('public/js/proof-atlas-library-data.js'))});assert(manifest.bytes<=1048576);
 return{edition:d.source.edition,name:d.source.name,indexSha256:d.source.indexSha256,sourceSha256:d.source.sourceSha256,...manifest,nodes:data.kind.length,pages:pageCount};
}
const records=[],profiles=[];
for(const original of inventory.profiles){
 const raw=z.gunzipSync(fs.readFileSync('.'+original.record.indexFile)),row=z.gunzipSync(fs.readFileSync('.'+original.owner.file)),data=A.validateIndex(JSON.parse(raw),original.record),d={...original,sourcePages:sourcePages(original,data)},prepared=K.prepare(d,row,raw),batch=prepared.batch,calls=[];
 for(const c of d.calls){const descriptors=[];M.create(batch,batch.entries,data,d,c);for(let slot=0;slot<=c.arguments;slot++){const packed=K.pack(prepared,c.index+':'+slot);for(const[file,bytes]of packed.files)emit(file,bytes);descriptors.push(packed.descriptor);}const call={index:c.index,anchor:c.anchor,arguments:c.arguments},page=put(base,'.call.gz',{format:'ProofAtlasApplicationTypeCallIndex/1',source:d.source,ownerSha256:d.owner.sha256,call,ports:descriptors});calls.push({...call,page});}
 const page=put(base,'.profile.gz',{format:'ProofAtlasApplicationTypeProfile/1',source:d.source,ownerSha256:d.owner.sha256,calls});profiles.push({source:d.source,ownerSha256:d.owner.sha256,page});records.push({...d,calls:d.calls.map(c=>({...c,functionLabel:'Authored scope control · '+d.record.name.split('.').at(-1),ports:c.inputs.map(i=>({id:i.id,slot:i.slot,input:i.input}))}))});
}
const catalog=put(base,'.catalog.gz',{format:'ProofAtlasApplicationTypeCatalog/1',producerSha256:producer,packerSha256:K.sha(fs.readFileSync(require.resolve('../native-type-paging/pack.cjs'))),profiles,scope:'Three authored kernel-typed controls. Separate from the existing 42-profile corpus/control inventory.'}),pointer={format:'ProofAtlasApplicationTypeCatalogRef/1',...catalog};
for(const d of records)d.pagedTypeCatalog=pointer;
const manifest={format:'ProofAtlasFormalSupportControls/1',producerSha256:producer,records},file='public/data/proof-atlas/formal-support-controls-manifest.js',script='/* Authored compiled controls; not corpus/AI provenance. */\nwindow.PROOF_ATLAS_FORMAL_SUPPORT_CONTROLS = '+JSON.stringify(manifest)+';\n';
if(check)assert.equal(fs.readFileSync(file,'utf8'),script);else fs.writeFileSync(file,script);
const report={format:'ProofAtlasFormalSupportPublication/1',status:'PASS',producerSha256:producer,nativeInventorySha256:K.sha(fs.readFileSync(native+'inventory.json.gz')),manifestSha256:K.sha(Buffer.from(script)),profiles:records.length,ports:9,originalOwners:records.map(d=>d.owner),assets:[...assets.values()].sort((a,b)=>a.file.localeCompare(b.file)),publicDeployment:false,originalPrivateSourcesPublished:false};
const output='research/proof-atlas/formal-support/publication.json.gz';if(check)assert.deepEqual(JSON.parse(z.gunzipSync(fs.readFileSync(output))),report);else fs.writeFileSync(output,z.gzipSync(K.encode(report)));
console.log(JSON.stringify({status:'PASS',profiles:records.length,ports:9,assets:assets.size,gzipBytes:report.assets.reduce((n,a)=>n+a.gzipBytes,0)}));
