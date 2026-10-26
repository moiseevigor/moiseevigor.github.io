/* Independent source antichains and occurrence sums, without hidden-tree expansion. */
'use strict';
const fs=require('fs'),assert=require('assert/strict'),vm=require('vm'),z=require('zlib');
const A=require('../public/js/proof-atlas-library-data'),J=require('../public/js/proof-atlas-judgment-geometry'),L=require('../public/js/proof-atlas-boundary-ledger'),T=require('../public/js/proof-atlas-occurrence-types');
const {sources}=require('./proof-atlas-judgment-fixtures.cjs'),raw=require('./test-proof-atlas-judgment-audit.cjs');
const fields={5:['fn','arg'],6:['domain','body'],7:['domain','body'],8:['type','value','body'],10:['expr'],11:['struct']};
const key=r=>r.root+':'+r.slots.join('.');
function audit(ledger,scene,data){
 const expected=new Map();let total=0n;
 for(const n of scene.nodes){
  const hidden=n.ports.length?n.ports.filter(p=>p.frontier):BigInt(n.hidden)>0n?data.children[n.node].map((node,slot)=>({node,route:{root:n.route.root,slots:[...n.route.slots,slot]},field:fields[data.kind[n.node]][slot]})):[];
  for(const p of hidden){const at=raw.occurrence(data,p.route);assert.equal(at.node,p.node);expected.set(key(p.route),{node:at.node,path:at.path,role:p.typeReference?p.role:'unrecorded',expanded:data.expanded[p.node]});total+=BigInt(data.expanded[p.node]);}
 }
 assert.equal(expected.size,ledger.rows.length);assert.equal(total.toString(),ledger.hidden);
 const roots=ledger.rows.map(r=>r.route);
 for(const row of ledger.rows){const e=expected.get(key(row.route));assert(e);for(const f of ['node','path','role','expanded'])assert.deepEqual(row[f],e[f]);}
 for(let i=0;i<roots.length;i++)for(let j=0;j<roots.length;j++)if(i!==j)assert(!(roots[i].root===roots[j].root&&roots[i].slots.length<=roots[j].slots.length&&roots[i].slots.every((s,k)=>s===roots[j].slots[k])),'Overlapping source roots');
 assert.equal(total+BigInt(ledger.retained),BigInt(data.expanded[raw.occurrence(data,scene.root.route).node]));
 for(const role of ['proof','type','value','unrecorded']){const rows=ledger.rows.filter(r=>r.role===role);assert.equal(ledger.totals[role].regions,rows.length);assert.equal(ledger.totals[role].occurrences,rows.reduce((s,r)=>s+BigInt(r.expanded),0n).toString());}
 let seen=0;for(let offset=0;offset<ledger.rows.length;offset+=16)seen+=L.page(ledger,{offset}).rows.length;assert.equal(seen,ledger.rows.length);
 assert(L.validate(ledger,scene,data));return ledger.rows.length;
}
(async()=>{
 let cuts=0,regions=0,inventories=0,largest='0',example=null;
 for await(const x of sources()){
  inventories++;const root=x.data.declaration.rootPaths.indexOf('root.value');
  for(const policy of ['proof-first','proof-focus','source-order'])for(const grouping of ['none','introductions','context'])for(const sourceFallback of [false,true]){
   const scene=J.create(x.data,x.record,x.resolve,{judgmentRoute:{root:root<0?0:root,slots:[]},policy,foldIntroductions:grouping==='introductions',foldContextFrames:grouping==='context',sourceFallback});
   const ledger=L.create(scene,x.data);regions+=audit(ledger,scene,x.data);cuts++;
   if(BigInt(ledger.represented)>BigInt(largest))largest=ledger.represented;
   if(!example&&ledger.rows.length>1)example={ledger,scene,data:x.data};
  }
 }
 assert.equal(inventories,35);assert.equal(cuts,630);
 const w={};for(const f of ['goedel-sample-manifest.js','packet-types-manifest.js'])vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+f,'utf8'),{window:w});
 const d=w.PROOF_ATLAS_PACKET_TYPES.records[0],record=w.PROOF_ATLAS_AI_SAMPLE.edition.declarations.find(r=>r.name===d.name),data=A.validateIndex(JSON.parse(z.gunzipSync(fs.readFileSync('.'+record.indexFile))),record),evidence=JSON.parse(z.gunzipSync(fs.readFileSync('.'+d.file))),provider=T.provider(evidence,data,record,d);let currentCuts=0;
 for(const e of evidence.entries)for(const policy of ['proof-first','proof-focus','source-order']){const scene=J.create(data,record,r=>provider.get(r)?provider:null,{judgmentRoute:e.route,policy,sourceFallback:true}),ledger=L.create(scene,data);regions+=audit(ledger,scene,data);currentCuts++;}
 let controls=0;const {ledger,scene,data:exampleData}=example;
 for(const change of [x=>x.rows.pop(),x=>x.rows.push(x.rows[0]),x=>x.hidden='0',x=>x.retained='0',x=>x.represented='0',x=>x.source.indexSha256='0'.repeat(64),x=>x.rows[0].route.slots.push(2),x=>x.rows[0].expanded='0',x=>x.rows[0].role='forged',x=>x.rows[0].reason='other',x=>x.rows[0].origin.field='other',x=>x.rows[0].relation='other']){const changed=structuredClone(ledger);change(changed);assert.throws(()=>L.validate(changed,scene,exampleData));controls++;}
 for(const options of [{maxBoundaries:0},{maxBoundaries:4097},{maxBoundaries:ledger.rows.length-1}]){assert.throws(()=>L.create(scene,exampleData,options));controls++;}
 for(const options of [{offset:-1},{offset:ledger.rows.length+1},{limit:33},{role:'other'}]){assert.throws(()=>L.page(ledger,options));controls++;}
 const wrongNamespace=structuredClone(scene);wrongNamespace.root.namespace='type-expression';assert.throws(()=>L.create(wrongNamespace,exampleData));controls++;
 // Source-only syntactic stress: application sharing, without any typing claim.
 const stress={serialization:'ExprDAG/1',declaration:{name:'BoundarySyntax.binary',rootPaths:['root.value']},kind:[4],children:[[]],payloads:[{name:'Nat.zero',levels:[]}],expanded:['1'],neededScope:[0],roots:[]};for(let i=1;i<=700;i++){stress.kind.push(5);stress.children.push([i-1,i-1]);stress.payloads.push({});stress.expanded.push((1n+2n*BigInt(stress.expanded[i-1])).toString());stress.neededScope.push(0);}stress.roots=[700];const stressRecord={name:stress.declaration.name,indexSha256:'1'.repeat(64),sourceSha256:'2'.repeat(64)},stressScene=J.create(stress,stressRecord,()=>null,{judgmentRoute:{root:0,slots:[]},maxNodes:1,maxDepth:0}),stressLedger=L.create(stressScene,stress);audit(stressLedger,stressScene,stress);assert(stressLedger.represented.length>160);assert(stressLedger.rows.every(r=>r.role==='unrecorded'));
 const report={status:'PASS',inventories,initialCuts:cuts,currentNativeQueryCuts:currentCuts,boundaryAppearances:regions,largestSelectedOccurrences:largest,negativeControls:controls,syntacticStressCountDigits:stressLedger.represented.length,syntacticStressHasNoTypingClaim:true,unknownDescendantsRemainUntyped:true,pagesBoundedTo32Rows:true,scope:'Exact hidden source-region accounting and original-route navigation. Root roles do not classify descendants or establish whole-proof coverage.'};
 fs.writeFileSync('/tmp/atlas-boundary-ledger.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
})().catch(e=>{console.error(e.stack);process.exit(1)});
