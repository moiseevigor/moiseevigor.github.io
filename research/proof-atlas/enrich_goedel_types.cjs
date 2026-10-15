/* Add exact source lambda prefixes only for native-checked recursor minors. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict'),C=require('../../public/js/proof-atlas-elimination'),S=require('./share_type_graphs.cjs');
const [folder,output]=process.argv.slice(2),edition=JSON.parse(fs.readFileSync(path.join(folder,'edition.json'))),native=JSON.parse(fs.readFileSync(path.join(folder,'native-types-01.json'))),requests=JSON.parse(fs.readFileSync(path.join(folder,'type-requests-01.json'))),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert(!fs.existsSync(output),'Do not overwrite query evidence');let added=0;
for(const n of native){
 const record=edition.declarations.find(r=>r.name===n.name),request=requests.find(q=>q.source.name===n.name),raw=z.gunzipSync(fs.readFileSync(path.join(folder,'projection',path.basename(record.file)))),data=JSON.parse(raw);assert.equal(sha(raw),record.indexSha256);C.validate(S.pack(n),data,record);const keys=new Set(request.routes.map(q=>JSON.stringify(q)));
 for(const e of n.entries){const t=e.eliminationJudgment;if(t?.status!=='checked')continue;for(const rule of t.rules){const a=t.arguments[t.parameters+t.motives+rule.minor];let node=a.node,route=structuredClone(a.route);for(let j=0;j<rule.inputCount&&data.kind[node]===6;j++){const key=JSON.stringify(route);if(!keys.has(key)){request.routes.push(route);keys.add(key);added++;}node=data.children[node][1];route={root:route.root,slots:[...route.slots,1]};}}}
 assert(request.routes.length<=512);
}
fs.writeFileSync(output,JSON.stringify(requests));console.log(JSON.stringify({status:'PASS',declarations:requests.length,newExactBranchLambdaQueries:added,queries:requests.reduce((n,r)=>n+r.routes.length,0)}));
