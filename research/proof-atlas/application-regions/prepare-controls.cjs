/* All maximal body applications in four authored, freshly checked control packets. */
'use strict';
const fs=require('fs'),assert=require('assert/strict'),S=require('../application-ports/store.cjs'),A=require('../../../public/js/proof-atlas-library-data'),P=require('../application-ports/prepare.cjs');
const folder=process.argv[2],names=['diamond','shortcut','twoPorts','proofShortcut'],sourceHash=S.sha(fs.readFileSync('research/proof-atlas/application-regions/Controls.lean')),plans=[];
for(const name of names){const file=folder+'/controls/'+name+'.json',raw=fs.readFileSync(file),data=JSON.parse(raw),record={name:data.declaration.name,module:'Runtime',kind:'definition',sourceSha256:sourceHash,indexSha256:S.sha(raw),uniqueNodes:data.kind.length,occurrences:data.roots.reduce((n,r)=>n+BigInt(data.expanded[r]),0n).toString()},source={edition:'application-region-controls',name:record.name,indexSha256:record.indexSha256,sourceSha256:sourceHash},anchors=[];A.validateIndex(data,record);let visits=0;
 function walk(node,slots,inFunction=false){assert(++visits<4096);for(const [slot,child]of data.children[node].entries())walk(child,[...slots,slot],data.kind[node]===5&&slot===0);if(data.kind[node]===5&&!inFunction)anchors.push({node,route:{root:1,slots}});}
 walk(data.roots[1],[]);plans.push(P.plan(source,record,null,data,anchors,'authored-application-region'));
}
assert.deepEqual(plans.map(p=>p.calls.length),[4,3,2,3]);fs.writeFileSync(folder+'/plan.json',JSON.stringify(plans));console.log(JSON.stringify({profiles:plans.length,calls:plans.reduce((n,p)=>n+p.calls.length,0),ports:plans.reduce((n,p)=>n+p.inputs.length,0)}));
