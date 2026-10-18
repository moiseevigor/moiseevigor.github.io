/* Publish only the compiled control packet and native judgments, not run logs. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict'),S=require('../share_type_graphs.cjs');
const root=path.resolve(__dirname,'../../..'),folder=path.resolve(process.argv[2]),v=JSON.parse(fs.readFileSync(path.join(folder,'verification.json'))),native=v.nativeFolder,name='AtlasProjectionControl.hugeProofProjection',hash=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.equal(v.status,'PASS');for(const [f,h]of Object.entries(v.producerFiles))assert.equal(hash(fs.readFileSync(path.join(root,f))),h,'Native producer changed');
const packetBytes=fs.readFileSync(path.join(native,name+'.json')),packet=JSON.parse(packetBytes),raw=JSON.parse(fs.readFileSync(path.join(native,'types.json'))).find(e=>e.name===name),rawWitness=JSON.parse(fs.readFileSync(path.join(native,'witness-types.json')))[0],sourceSha256=hash(fs.readFileSync(path.join(native,'ProjectionFixture.lean'))),moduleSha256=hash(fs.readFileSync(path.join(native,'ProjectionFixture.olean')));
assert.equal(raw.environment.sourceSha256,sourceSha256);assert.equal(raw.environment.compiledModuleSha256,moduleSha256);assert.deepEqual(rawWitness.environment,raw.environment);
const source={edition:'projection-controls',name,module:'ProjectionFixture',sourceSha256,indexSha256:hash(packetBytes)},record={...source,uniqueNodes:packet.kind.length,occurrences:packet.roots.reduce((s,r)=>s+BigInt(packet.expanded[r]),0n).toString()};
for(const e of [raw,rawWitness]){assert.equal(e.nativeDagMatchesPacket,true);e.source=source;}
const types=S.pack(raw),witness=S.pack(rawWitness);for(const e of [...types.entries,...witness.entries])assert(Buffer.byteLength(JSON.stringify(e))<=2097152,'Existing per-query decoded bound');const dir=path.join(root,'public/data/proof-atlas/boundary-controls');fs.mkdirSync(dir,{recursive:true});
function put(bytes,kind){assert(bytes.length<=16777216,'Existing complete-evidence decoded asset bound');const sha256=hash(bytes),file='/public/data/proof-atlas/boundary-controls/'+sha256+'.json.gz';fs.writeFileSync(path.join(root,file.slice(1)),z.gzipSync(bytes));return{...source,kind,file,sha256,bytes:bytes.length};}
const packetDescriptor=put(packetBytes,'source-packet'),typesDescriptor=put(Buffer.from(JSON.stringify(types)),'projection-and-value-queries'),witnessDescriptor=put(Buffer.from(JSON.stringify(witness)),'proof-witness-query');record.indexFile=packetDescriptor.file;
const result=require('../../../scripts/proof-atlas-boundary-control-audit.cjs')({packet,record,types,witness,typesDescriptor,witnessDescriptor});
const manifest={format:'ProofAtlasBoundaryControls/1',record,packet:packetDescriptor,types:typesDescriptor,witness:witnessDescriptor,scope:result.scope};
fs.writeFileSync(path.join(root,'public/data/proof-atlas/boundary-controls-manifest.js'),'window.PROOF_ATLAS_BOUNDARY_CONTROLS='+JSON.stringify(manifest)+';\n');
fs.writeFileSync(path.join(folder,'boundary-audit.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({...result,source:undefined}));
