/* Public compiled counterexample; all packet and type hashes checked before use. */
'use strict';
const fs=require('fs'),z=require('zlib'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict'),audit=require('./proof-atlas-boundary-control-audit.cjs'),w={};
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/boundary-controls-manifest.js','utf8'),{window:w});const m=JSON.parse(JSON.stringify(w.PROOF_ATLAS_BOUNDARY_CONTROLS));assert.equal(m.format,'ProofAtlasBoundaryControls/1');
function read(d){const bytes=z.gunzipSync(fs.readFileSync('.'+d.file),{maxOutputLength:16777216});assert.equal(bytes.length,d.bytes);assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),d.sha256);return JSON.parse(bytes);}
const result=audit({packet:read(m.packet),record:m.record,types:read(m.types),witness:read(m.witness),typesDescriptor:m.types,witnessDescriptor:m.witness});
fs.writeFileSync('/tmp/atlas-boundary-control.json',JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify({...result,source:undefined}));
