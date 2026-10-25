/* Check the union against every original sealed input. The oracle walks source
   fields and hashes type syntax independently of the union implementation. */
'use strict';
const fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict'),T=require('../public/js/proof-atlas-deep-context'),A=require('../public/js/proof-atlas-library-data'),P=require('../public/js/proof-atlas-packed-routes'),U=require('../research/proof-atlas/recorded-union.cjs'),F=require('./proof-atlas-judgment-fixtures.cjs'),Q=require('../public/js/proof-atlas-native-selection');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),key=r=>r.root+':'+r.depth+':'+r.slots,order=['case','beta','let','primary','packet','useSites'],rows=[],pools=new WeakMap();let positions=0,overlaps=0,contexts=0,constructions=0,alternatives=0,refusals=0,crossViewSites=0,crossViewComponents=0;
function typeHash(e,root=e.typeData.roots[0]){const g=e.typeData;let hs=pools.get(g.kind);if(!hs){hs=[];for(let i=0;i<g.kind.length;i++)hs.push(sha(JSON.stringify([g.kind[i],A.payloadKey(g.kind[i],g.payloads[i]),g.children[i].map(c=>hs[c]),g.expanded[i],g.neededScope[i]])));pools.set(g.kind,hs);}return hs[root];}
function context(data,route){const bytes=P.parse(route);let id=data.roots[route.root];const binders=[];for(let i=0;i<route.depth;i++){const s=(bytes[i>>2]>>((i%4)*2))&3,k=data.kind[id];if((k===6||k===7)&&s===1||k===8&&s===2)binders.push({node:id,route:P.prefix(route,i)});assert.notEqual(data.children[id][s],undefined);id=data.children[id][s];}return{node:id,binders};}
const snapshot=inputs=>JSON.stringify(inputs.map(p=>p.package.cases[0].entries.map(e=>[e.evidenceSha256,key(e.route),e.recording,T.construction(e,p.package.cases[0].data)?.entry.evidenceSha256])));
(async()=>{
 let first,foreign,negativeFixture;
 for(const item of U.inventory()){
  const source=U.raw(item.record.indexFile),inputs=[];
  for(const p of item.inputs){const bytes=U.raw(p.descriptor.file),pkg=await(p.kind==='let'?T.recordedLets:T.recorded)(source,bytes,p.descriptor,item.record);inputs.push({kind:p.kind,package:pkg});
   if(!negativeFixture&&p.kind==='primary'){const raw=JSON.parse(bytes),q=raw.entries.find(q=>q.status==='checked'&&!q.applicationJudgment&&!q.lambdaJudgment&&!q.letJudgment&&JSON.parse(source).kind[q.node]===0);if(q)negativeFixture={item,source,evidence:raw,query:q};}
  }
  const before=snapshot(inputs),pkg=T.unionRecorded([...inputs].reverse()),c=pkg.case(item.record.name),byRoute=new Map();assert.equal(snapshot(inputs),before,'union changed an input package');
  for(const p of [...inputs].sort((a,b)=>order.indexOf(a.kind)-order.indexOf(b.kind)))for(const e of p.package.cases[0].entries){const k=key(e.route);if(!byRoute.has(k))byRoute.set(k,[]);byRoute.get(k).push({kind:p.kind,entry:e,source:p.package.cases[0].data});}
  assert.equal(c.entries.length,byRoute.size);let localConstructions=0;
  for(const entry of c.entries){const choices=byRoute.get(key(entry.route)),expected=choices.find(p=>T.construction(p.entry,p.source))||choices[0],at=context(c.data,entry.route);assert(expected);assert.equal(entry.evidenceSha256,expected.entry.evidenceSha256);assert.equal(entry.evidenceFile,expected.entry.evidenceFile);assert.equal(entry.node,at.node);assert.equal(entry.contextLength,at.binders.length);
   for(const choice of choices){assert.equal(typeHash(entry),typeHash(choice.entry));assert.equal(entry.role,choice.entry.role);assert.equal(entry.node,choice.entry.node);assert.equal(entry.contextLength,choice.entry.contextLength);alternatives++;}
   for(const [i,b]of at.binders.entries()){assert.deepEqual(entry.contextAt(i),{ordinal:i,...b});contexts++;}
   assert.equal(c.alternatives(entry.route).length,choices.length);assert.equal(entry.recording.union.alternatives.length,choices.length);assert.equal(entry.recording.union.method,'same-type-syntax-role-and-ordered-source-context');assert.deepEqual(entry.recording.union.alternatives,c.alternatives(entry.route));
   const construction=T.construction(entry,c.data);if(construction){const original=T.construction(expected.entry,expected.source);assert.equal(construction,original);assert.equal(construction.entry.evidenceSha256,expected.entry.evidenceSha256);assert.equal(construction.entry.evidenceFile,expected.entry.evidenceFile);assert([5,6,8].includes(c.data.kind[entry.node]));localConstructions++;}
   overlaps+=choices.length-1;positions++;
  }
  if(item.inputs.some(p=>p.kind==='useSites')){
   const oldFetch=global.fetch;global.fetch=async f=>new Response(fs.readFileSync('.'+f));
   try{const fixture=F.inventory().find(f=>f.edition===item.edition&&f.record.name===item.record.name),base={};for(const p of fixture.descriptors)base[p.kind]=await p.api.open(p.descriptor,c.data,item.record);const providers=await F.supplements(fixture,c.data,base),native=JSON.parse(U.raw(item.inputs.find(p=>p.kind==='useSites').descriptor.file));
    for(const e of native.entries){const entry=c.get(P.encode(e.route.root,e.route.slots)),construction=T.construction(entry,c.data);assert.equal(construction.rule,'Pi-application');const selected=Q.select(providers,e.route).get(e.route),stage=selected.applicationJudgment.stages.at(-1),owner=construction.entry,parts=construction.premises;
     for(const [root,field]of [[parts[0].typeRoot,'beforeRoot'],[parts[1].typeRoot,'actualRoot'],[owner.typeData.roots[0],'afterRoot'],[construction.components.pi,'piRoot'],[construction.components.expectedDomain,'domainRoot'],[construction.components.substitutedResult,'substitutedRoot']]){assert.equal(typeHash(owner,root),typeHash({typeData:selected.typeGraph},stage[field]),'ordinary/occurrence type component '+field);crossViewComponents++;}
     assert.equal(parts[0].role,stage.functionRole);assert.equal(parts[1].role,selected.arguments.at(-1).role);assert.equal(entry.role,stage.resultRole);assert.equal(entry.contextLength,selected.context.length);crossViewSites++;
    }
   }finally{global.fetch=oldFetch;}
  }
  constructions+=localConstructions;rows.push({edition:item.edition,name:c.name,indexSha256:item.record.indexSha256,sourceSha256:item.record.sourceSha256,inputs:inputs.map(p=>({kind:p.kind,evidenceSha256:p.package.evidenceSha256})),positions:c.entries.length,constructions:localConstructions,overlaps:c.stats.unionOverlaps,typeTables:c.stats.sharedTypeTables});
  if(!first)first={inputs,c,before};else if(!foreign)foreign=inputs.find(p=>p.kind!==first.inputs[0].kind);console.log(JSON.stringify({name:c.name,positions:c.entries.length,constructions:localConstructions}));
 }
 const reject=(f,reason)=>{assert.throws(f,reason);refusals++;};
 reject(()=>T.unionRecorded([]));reject(()=>T.unionRecorded(Array(9).fill(first.inputs[0])));reject(()=>T.unionRecorded([{...first.inputs[0],package:{...first.inputs[0].package}}]));reject(()=>T.unionRecorded([first.inputs[0],first.inputs[0]]));reject(()=>T.unionRecorded([{kind:'unknown',package:first.inputs[0].package}]));reject(()=>T.unionRecorded([{kind:'useSites',package:first.inputs[0].package}]));
 reject(()=>T.unionRecorded([first.inputs[0],foreign]),/union source correspondence/);assert.equal(snapshot(first.inputs),first.before);
 // These intentionally forged producer claims are negative controls only.
 // The decoder is an attestation consumer, not a browser Lean kernel. The
 // union must still refuse type/role conflicts even with matching byte hashes.
 assert(negativeFixture,'a direct variable query is needed for conflict controls');const {item,source,evidence,query}=negativeFixture;
 const goodRaw=Buffer.from(JSON.stringify({...evidence,entries:[query]})),descriptor={...item.inputs.find(p=>p.kind==='primary').descriptor,sha256:sha(goodRaw)},good=await T.recorded(source,goodRaw,descriptor,item.record);
 for(const change of [q=>q.role=q.role==='proof'?'value':'proof',q=>{const g=evidence.typeGraph;const root=g.kind.findIndex(k=>k===3);assert(root>=0&&root!==q.typeRoot);q.typeRoot=root;}]){const q=structuredClone(query);change(q);const raw=Buffer.from(JSON.stringify({...evidence,entries:[q]})),d={...descriptor,file:'/public/data/proof-atlas/use-site-types/'+sha(raw)+'.json.gz',sha256:sha(raw)},bad=await T.recorded(source,raw,d,item.record),before=snapshot([{kind:'primary',package:good}]);reject(()=>T.unionRecorded([{kind:'primary',package:good},{kind:'useSites',package:bad}]));assert.equal(snapshot([{kind:'primary',package:good}]),before);}
 assert.equal(positions,5568);assert.equal(constructions,2527);assert.equal(rows.length,35);assert.equal(crossViewSites,283);assert.equal(crossViewComponents,1698);
 const report={format:'ProofAtlasRecordedUnionAudit/1',status:'PASS',checkerSha256:sha(fs.readFileSync(__filename)),modelSha256:sha(fs.readFileSync('public/js/proof-atlas-deep-context.js')),profiles:rows.length,positions,constructions,overlapChecks:overlaps,inputObservationChecks:alternatives,orderedContextChecks:contexts,crossViewSites,crossViewTypeComponents:crossViewComponents,refusals,inputPackagesUnchanged:true,rows,scope:'Union of authenticated compiled native attestations. Independent source contexts and type-syntax agreement; no new native execution, portable kernel certificate, necessity or comprehension claim. Forged conflict claims are in-memory negative controls only.'};
 if(process.env.ATLAS_RECORDED_UNION_CHECK==='1')assert.deepEqual(JSON.parse(fs.readFileSync('research/proof-atlas/recorded-union/audit.json')),JSON.parse(JSON.stringify(report)));
 if(process.env.ATLAS_RECORDED_UNION_REPORT)fs.writeFileSync(process.env.ATLAS_RECORDED_UNION_REPORT,JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,rows:undefined}));
})().catch(e=>{console.error(e.stack);process.exit(1)});
