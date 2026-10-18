/* Large public packets and a source-only deep control, without expanded trees. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
const A=require('../public/js/proof-atlas-library-data'),J=require('../public/js/proof-atlas-judgment-geometry'),R=require('../public/js/proof-atlas-local-refinement'),C=require('../public/js/proof-atlas-cut-certificate'),raw=require('./test-proof-atlas-judgment-audit.cjs');
const repo=path.resolve(__dirname,'..'),out=process.env.ATLAS_LARGE_CUT_REQUESTS||'/tmp/atlas-large-source-cuts',hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const text=fs.readFileSync(repo+'/public/data/proof-atlas/source-references-manifest.js','utf8'),inventory=JSON.parse(text.slice(text.indexOf('=')+1).trim().replace(/;$/,'')),results=[];fs.mkdirSync(out,{recursive:true});
function emit(record,data,packetFile,origin){
 const records=[],refinements=[];
 for(const root of [0,1]){
  const options={judgmentRoute:{root,slots:[]},maxNodes:13,maxDepth:3,sourceFallback:true,policy:'source-order'},scene=J.create(data,record,()=>null,options),state=R.start(scene,data,record),before=C.create(scene,data,record),start=records.length;records.push(before);
  for(const row of state.ledger.rows.slice(0,2)){
   const part=J.create(data,record,()=>null,{...options,judgmentRoute:row.route,maxNodes:4,maxDepth:1}),next=R.expand(state,row.path,part,data,record),after=C.create(next.scene,data,record);C.refinement(before,after);refinements.push([start,records.length]);records.push(after);
  }
 }
 const has=[];for(let i=0;i<data.kind.length;i++)has.push(data.kind[i]===0||data.children[i].some(c=>has[c]));
 let found=0,depthCappedBranches=0;const work=[{root:1,slots:[],node:data.roots[1]}],uses=[];
 while(work.length&&found<12){
  const at=work.pop();if(!has[at.node])continue;
  if(data.kind[at.node]===0){const scene=J.create(data,record,()=>null,{judgmentRoute:{root:at.root,slots:at.slots},maxNodes:1,maxDepth:0}),cert=C.create(scene,data,record);records.push(cert);uses.push({node:at.node,route:scene.root.route,binders:raw.occurrence(data,scene.root.route).binders});found++;continue;}
  if(at.slots.length>=512){depthCappedBranches++;continue;}
  for(let slot=data.children[at.node].length-1;slot>=0;slot--)work.push({root:at.root,slots:[...at.slots,slot],node:data.children[at.node][slot]});
 }
 const request={expected:{name:record.name,indexSha256:record.indexSha256,sourceSha256:record.sourceSha256,uniqueNodes:record.uniqueNodes},packetFile,records,refinements,rejectedRefinements:[]},file=path.join(out,'source-'+results.length+'.json');fs.writeFileSync(file,JSON.stringify(request));
 results.push({name:record.name,origin,nodes:record.uniqueNodes,records:records.length,refinements:refinements.length,variableCuts:found,depthCappedBranches,file,uses});
}
for(const record of inventory.edition.declarations.filter(r=>r.uniqueNodes>131072)){
 const packetFile=repo+record.indexFile,bytes=z.gunzipSync(fs.readFileSync(packetFile));assert.equal(hash(bytes),record.indexSha256);const data=A.validateIndex(JSON.parse(bytes),record);emit(record,data,packetFile,'published-compiled-synthetic-control');
}
assert.equal(results.length,4);
const binder={binderName:'x',binderNameParts:[{str:'x'}],binderInfo:'default'},deep={serialization:'ExprDAG/1',declaration:{name:'AtlasLargeCutControl.deepSucc',rootPaths:['root.type','root.value'],kernelCheck:'not-claimed'},kind:[4,7,4,0],children:[[],[0,0],[],[]],payloads:[{name:'Nat',nameParts:[{str:'Nat'}],levels:[]},binder,{name:'Nat.succ',nameParts:[{str:'Nat'},{str:'succ'}],levels:[]},{index:0}],expanded:['1','3','1','1'],neededScope:[0,0,0,1],roots:[]};
let last=3;for(let i=0;i<10000;i++){deep.kind.push(5);deep.children.push([2,last]);deep.payloads.push({});deep.expanded.push(String(BigInt(deep.expanded[last])+2n));deep.neededScope.push(1);last=deep.kind.length-1;}
deep.kind.push(6);deep.children.push([0,last]);deep.payloads.push(binder);deep.expanded.push(String(BigInt(deep.expanded[last])+2n));deep.neededScope.push(0);deep.roots=[1,deep.kind.length-1];
const bytes=Buffer.from(JSON.stringify(deep)),packetFile=path.join(out,'deep-source.json.gz'),record={name:deep.declaration.name,indexSha256:hash(bytes),sourceSha256:hash(fs.readFileSync(__filename)),uniqueNodes:deep.kind.length};fs.writeFileSync(packetFile,z.gzipSync(bytes));emit(record,deep,packetFile,'own-serialized-syntax-control-no-typing-claim');
assert.equal(results.length,5);assert.equal(results[4].depthCappedBranches,1);
fs.writeFileSync(path.join(out,'inventory.json'),JSON.stringify(results,null,2)+'\n');console.log(JSON.stringify({status:'PASS',packets:results.length,sourceNodes:results.map(r=>r.nodes),cuts:results.reduce((s,r)=>s+r.records,0),refinements:results.reduce((s,r)=>s+r.refinements,0),variableCuts:results.reduce((s,r)=>s+r.variableCuts,0),deepControl:results[4]}));
