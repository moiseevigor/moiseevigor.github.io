'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),assert=require('assert/strict'),crypto=require('crypto');
process.chdir(path.resolve(__dirname,'../../..'));
const A=require('../../../public/js/proof-atlas-library-data'),M=require('../region-output-composition/model.cjs'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const folder=process.argv[2];assert(folder);
const inventory=JSON.parse(fs.readFileSync(folder+'/packets/inventory.json')),sourceSha256=sha(fs.readFileSync('research/proof-atlas/frontier-functions/Controls.lean')),profiles=[];
for(const r of inventory){
 const bytes=fs.readFileSync(folder+'/packets/'+r.file),g=JSON.parse(bytes),name=r.name.split('.').at(-1);
 let prefix=[],node=g.roots[1];while(g.kind[node]===6){prefix.push(1);node=g.children[node][1];}
 // Stop before the last binder in the higher-order and alias examples.
 if(name==='nested'){prefix.pop();node=g.children[g.roots[1]][1];}
 if(name==='alias'){assert.equal(g.kind[node],8);prefix.push(2);node=g.children[node][2];assert.equal(g.kind[node],6);prefix.push(1);node=g.children[node][1];}
 const at=slots=>{let node=g.roots[1];for(const s of slots)node=g.children[node][s];return{node,route:{root:1,slots}};};
 const context=slots=>M.context(g,at(slots)),cases=[];
 function add(id,relative,generalizeTypes=true,expected='PASS'){
  const holes=relative.map(slots=>{const all=[...prefix,...slots];return{anchor:at(all),context:context(all)};});
  cases.push({id:name+':'+id,prefixRoute:{root:1,slots:prefix},context:context(prefix),holes,generalizeTypes,expected});
 }
 // Ordered constructor fields, never pretty-printed term matching.
 if(name==='plain')add('argument',[[1]]);
 else if(name==='nested')add('under-lambda',[[1,1]]);
 else if(name==='definition')add('let-value',[[1]]);
 else if(name==='proof')add('head-and-argument',[[0],[1]]);
 else if(name==='proofTwins')add('distinct-proof-ports',[[0,1],[1]]);
 else if(name==='dependent'){
  // Sigma.mk's final two arguments are the index and its indexed value.
  const term=A.kinds[g.kind[node]];assert.equal(term,'app');
  add('dependent-types',[[0,1],[1]]);
  add('fixed-original-types',[[0,1],[1]],false,'KERNEL_REJECTED');
  add('reversed-parameters',[[1],[0,1]],true,'KERNEL_REJECTED');
 }else if(name==='alias')add('fixed-ambient-let',[[0,1],[1]],true,'KERNEL_REJECTED');
 else if(name==='siblings'){
  // Prod.mk has two type arguments before the two lambda values.
  add('distinct-scopes',[[0,1,1,1],[1,1,1]]);
 }else if(name==='typeOutput')add('function-head',[[0]]);
 else throw Error('Uncovered authored declaration '+name);
 const source={name:r.name,module:'FrontierControls',edition:'authored-frontier-function-controls',indexSha256:sha(bytes),sourceSha256};
 const packetFile=path.resolve(folder,'packet-'+name+'.json');fs.writeFileSync(packetFile,bytes);
 const request={source,packetFile,cases},requestFile=path.resolve(folder,'request-'+name+'.json');fs.writeFileSync(requestFile,JSON.stringify(request));
 profiles.push({source,record:r,packetFile,requestFile,requestSha256:sha(fs.readFileSync(requestFile)),cases});
}
fs.writeFileSync(folder+'/plan.json',JSON.stringify({format:'ProofAtlasFrontierPlan/1',profiles},null,2)+'\n');
console.log(JSON.stringify({profiles:profiles.length,cases:profiles.reduce((n,p)=>n+p.cases.length,0)}));
