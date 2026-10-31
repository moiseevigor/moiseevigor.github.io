'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');process.chdir(path.resolve(__dirname,'../../..'));
const folder=process.argv[2],sha=x=>crypto.createHash('sha256').update(x).digest('hex');assert(folder);const sourceSha256=sha(fs.readFileSync('research/proof-atlas/binder-block-exchange/Controls.lean')),inventory=JSON.parse(fs.readFileSync(folder+'/packets/inventory.json')),profiles=[];
for(const record of inventory){const bytes=fs.readFileSync(folder+'/packets/'+record.file),packetFile=path.resolve(folder,'packet-'+profiles.length+'.json');fs.writeFileSync(packetFile,bytes);profiles.push({source:{edition:'authored-binder-block-controls',name:record.name,module:'BlockControls',sourceSha256,indexSha256:sha(bytes)},record,packetFile});}
assert.equal(profiles.length,8);fs.writeFileSync(folder+'/plan.json',JSON.stringify({format:'ProofAtlasBinderBlocksPlan/1',profiles},null,2)+'\n');
