'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),z=require('zlib'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/region-composition-view/';
// The preceding experiment is immutable. Run its checker unchanged, redirecting
// only its report; all assertions and its own source fingerprint remain intact.
const previous='research/proof-atlas/region-output-view/model-check.json.gz';
const original=fs.readFileSync(previous);
cp.execFileSync(process.execPath,['-e',`
 const fs=require('fs'),path=require('path'),write=fs.writeFileSync;
 fs.writeFileSync=function(file,...rest){return write.call(this,
  path.resolve(String(file))===path.resolve(${JSON.stringify(previous)})
   ?${JSON.stringify(base+'output-model.json.gz')}:file,...rest);};
 require('./research/proof-atlas/region-output-view/check-model.cjs');
`],{stdio:'inherit'});
assert(fs.readFileSync(previous).equals(original),'previous model report changed');
cp.execFileSync(process.execPath,['scripts/test-proof-atlas-network-streaming.cjs'],{
 stdio:'inherit',env:{...process.env,ATLAS_NETWORK_STREAM_AUDIT:path.resolve(base+'network-model.json')}
});
const file=base+'network-model.json',raw=fs.readFileSync(file);
assert.equal(JSON.parse(raw).status,'PASS');
fs.writeFileSync(file+'.gz',z.gzipSync(raw));fs.unlinkSync(file);
