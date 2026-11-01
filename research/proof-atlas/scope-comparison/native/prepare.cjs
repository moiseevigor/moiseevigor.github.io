/* One original call under its two source lets, not occurrence-tree enumeration. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../../..'));
const A=require('../../../../public/js/proof-atlas-library-data'),P=require('../../application-ports/prepare.cjs');
const folder=path.resolve(process.argv[2]),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),names=['dependentDomain','dependentLet','sharedLocal'],plans=[];
for(const name of names){const file=path.join(folder,name+'.json'),raw=fs.readFileSync(file),data=JSON.parse(raw);
 const record={name:data.declaration.name,module:data.declaration.module,kind:'definition',sourceSha256:sha(fs.readFileSync(path.join(__dirname,'Controls.lean'))),indexSha256:sha(raw),uniqueNodes:data.kind.length,occurrences:data.roots.reduce((n,id)=>n+BigInt(data.expanded[id]),0n).toString()};
 A.validateIndex(data,record);const route={root:1,slots:[1,2,2]},node=A.walk(data,route);assert.equal(data.kind[node],5);
 const source={edition:'scope-native-controls',name:record.name,indexSha256:record.indexSha256,sourceSha256:record.sourceSha256};
 const plan=P.plan(source,record,null,data,[{node,route}],'authored-scope-native');assert.equal(plan.calls.length,1);assert.equal(plan.inputs.length,3);plans.push({...plan,packetFile:file});
}
fs.writeFileSync(path.join(folder,'plan.json'),JSON.stringify(plans,null,2)+'\n');
fs.writeFileSync(path.join(folder,'requests.json'),JSON.stringify(plans.map(plan=>({packetFile:plan.packetFile,source:plan.source,mode:'replay',inputs:plan.inputs})),null,2)+'\n');
console.log(JSON.stringify({status:'PASS',profiles:plans.length,ports:plans.reduce((n,p)=>n+p.inputs.length,0)}));
