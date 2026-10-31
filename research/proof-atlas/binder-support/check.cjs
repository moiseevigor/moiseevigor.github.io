'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const M=require('./model.cjs'),B=require('../binder-block-exchange/model.cjs'),F=require('../binder-computation-exchange/model.cjs');
const base='research/proof-atlas/binder-support/',publicBase='/public/data/proof-atlas/binder-support/',freeze=process.argv.includes('--freeze');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=f=>JSON.parse(z.gunzipSync(fs.readFileSync(f))),hash=f=>sha(fs.readFileSync(f));
const inputs=['binder-block-exchange','definition-boundaries','corpus-definition-boundaries'].map(n=>'research/proof-atlas/'+n+'/native-check.json.gz');
const baselineModels=inputs.map(f=>f.replace('native-check','model-check'));
for(const f of baselineModels){const r=read(f);assert.equal(r.status,'PASS');for(const[file,h]of Object.entries(r.files))assert.equal(hash(file),h,'baseline producer');}
const bundles=inputs.map(read),cases=[],assets=new Map(),descriptors=[];
const report={format:'ProofAtlasBinderSupportAudit/1',status:'PASS',accepted:0,rejected:0,exchangeSteps:0,rewiredSteps:0,oracleFields:0,oracleOccurrences:'0',peakStoredStates:0,peakCoefficients:0,peakRetainedDigits:0,refusals:0,profiles:[],files:{}};
let oracleOccurrences=0n;
function audit(item,input,isBlock=false,pi=null,ci=null){
 const r=item.observation?.result||item.native.result,g=r.graph,source=JSON.parse(item.sourcePacketText),owner=item.source;
 assert.equal(sha(Buffer.from(item.sourcePacketText)),owner.indexSha256);assert(F.equal(g,g.roots[0],source,source.roots[1]),'native original term');assert(F.equal(g,g.roots[1],source,source.roots[0]),'native original declared type');
 const ids=B.spine(g,g.roots[0]).rows.map((_,i)=>i),c=M.counter(g),sourceProjection=M.describe(g,g.roots[0],ids,c);
 const roots=new Set();
 function validateRoot(root){if(roots.has(root))return;roots.add(root);const a=c.at(root),b=M.weighted(g,root);assert.deepEqual(a,b,'independent weighted occurrence oracle');assert.equal(a.occurrences,g.expanded[root]);report.oracleFields++;oracleOccurrences+=BigInt(a.occurrences);}
 function validateSpine(root){for(const row of B.spine(g,root).rows){validateRoot(g.children[row.node][0]);if(row.kind===8)validateRoot(g.children[row.node][1]);}const rows=B.spine(g,root).rows,last=rows.at(-1);validateRoot(last?g.children[last.node][last.kind===8?2:1]:root);}
 validateSpine(g.roots[0]);
 const accepted=r.status==='PASS';
 if(!accepted){assert.equal(r.status,'KERNEL_REJECTED');assert(!isBlock);report.rejected++;report.profiles.push({source:owner,id:owner.name,accepted:false,sourceFrames:sourceProjection.frames.length});return;}
 const promotedRoot=isBlock?g.roots[0]:g.roots[2],normalRoot=isBlock?g.roots[2]:g.roots[pi===null?r.normalRoot:4];
 const promotion=M.describe(g,promotedRoot,ids,c);
 for(const f of promotion.frames){const s=sourceProjection.frames[f.binder];assert.deepEqual(s.domain.references,f.domain.references);if(f.value)assert.deepEqual(s.value.references,f.value.references);}
 assert.deepEqual(promotion.tail.references,sourceProjection.tail.references);validateSpine(promotedRoot);
 const schedules=isBlock?r.schedules.map(s=>({name:s.name,steps:s.steps})):['outermost','deepest'].map(name=>({name,steps:r.steps.filter(s=>s.schedule===name)}));
 const traces=[];
 for(const schedule of schedules){let order=ids.slice(),current=promotedRoot;const records=[];
  for(const s of schedule.steps){const before=g.roots[s.beforeRoot],after=g.roots[s.afterRoot];assert.equal(B.digest(g,current),B.digest(g,before),'trace chain');const result=M.exchangeLaw(g,before,after,s.path,order,c);order=result.next;current=after;records.push({...result.record,path:s.path});validateSpine(before);validateSpine(after);report.exchangeSteps++;if(result.record.replacedReferences!=='0')report.rewiredSteps++;}
  assert.equal(B.digest(g,current),B.digest(g,normalRoot));traces.push({name:schedule.name,order,steps:records});
 }
 assert.deepEqual(traces[0].order,traces[1].order,'same binder identities under both schedules');
 const normalProjection=M.describe(g,normalRoot,traces[0].order,c);validateSpine(normalRoot);
 // Independent source-origin order: stable partition of promoted inputs and retained lets.
 const order=promotion.frames.filter(f=>f.kind==='lam').concat(promotion.frames.filter(f=>f.kind==='letE')).map(f=>f.binder);
 assert.deepEqual(traces[0].order,order);
 for(const f of normalProjection.frames){const s=sourceProjection.frames[f.binder];assert.equal(s.name,f.name,'original binder name is corroboration, not identity');}
 const state=c.state();report.peakStoredStates=Math.max(report.peakStoredStates,state.states);report.peakCoefficients=Math.max(report.peakCoefficients,state.coefficients);report.peakRetainedDigits=Math.max(report.peakRetainedDigits,state.totalDigits);
 const row={format:'ProofAtlasBinderSupport/1',source:owner,nativeInventorySha256:hash(input),nativeCaseSha256:pi===null?sha(Buffer.from(JSON.stringify(item.observation))):bundles[2].verification.cases.find(x=>x.profile===pi&&x.case===ci).outputSha256,id:item.plan?.id||owner.name,sourceProjection,normalProjection,exchanges:traces,meaning:'Exact original-variable occurrences in literal types and values. Includes implicit arguments. No reduction, premise necessity or new typing judgment.'};
 cases.push(row);report.accepted++;report.profiles.push({source:owner,id:row.id,accepted:true,sourceFrames:sourceProjection.frames.length,exchangeSteps:traces.reduce((n,t)=>n+t.steps.length,0),rewired:traces.reduce((n,t)=>n+t.steps.filter(s=>s.replacedReferences!=='0').length,0)});
 if(pi!==null){const raw=Buffer.from(JSON.stringify(row)),sha256=sha(raw),file=publicBase+sha256+'.json.gz';assert(raw.length<=131072,'support input bound');assets.set(file,raw);descriptors.push({source:owner,nativeCaseSha256:row.nativeCaseSha256,nativeInventorySha256:row.nativeInventorySha256,id:row.id,file,sha256,bytes:raw.length});}
}
for(const item of bundles[0].controls)audit(item,inputs[0],true);
for(const item of bundles[1].controls)audit(item,inputs[1]);
for(const[pi,p]of bundles[2].profiles.entries())for(const[ci,item]of p.cases.entries())audit({...item,source:p.source,sourcePacketText:p.sourcePacketText},inputs[2],false,pi,ci);
// Scope controls: one shared variable under different binders, plus enormous sharing.
const t=F.table(),nat=t.add(4,{name:'Nat',levels:[],nameParts:[{str:'Nat'}]}),v=t.add(0,{index:0}),lam=t.add(6,{binderName:'x',binderInfo:'default'},[nat,v]),mix=t.add(5,{},[lam,v]);
assert.deepEqual(M.counter(t.g).at(mix).free,[{index:0,count:'1'}]);assert.equal(M.counter(t.g).at(mix).localReferences,'1');assert.deepEqual(M.counter(t.g).at(mix),M.weighted(t.g,mix));
let huge=v;for(let i=0;i<100;i++)huge=t.add(5,{},[huge,huge]);const wide=M.counter(t.g).at(huge);assert.equal(wide.free[0].count,String(2n**100n));assert.equal(wide.occurrences,String(2n**101n-1n));assert.deepEqual(wide,M.weighted(t.g,huge));
for(const fn of [()=>M.counter(t.g,{maxStates:0}).at(v),()=>M.counter(t.g,{maxSupport:0}).at(v),()=>M.weighted(t.g,huge,{maxStates:1}),()=>M.weighted(t.g,lam,{maxDepth:0}),()=>M.describe(t.g,mix,[]),()=>M.counter(t.g,{maxCoefficients:0}).at(v),()=>M.counter(t.g,{maxTotalDigits:0}).at(v),()=>M.counter(t.g,{maxDigits:1}).at(huge),()=>M.weighted(t.g,v,{maxPendingDigits:0})]){assert.throws(fn);report.refusals++;}
const constructionBytes=Buffer.from(JSON.stringify({format:'ProofAtlasBinderSupportConstructions/1',cases}));if(freeze)fs.writeFileSync(base+'constructions.json.gz',z.gzipSync(constructionBytes));else assert(z.gunzipSync(fs.readFileSync(base+'constructions.json.gz')).equals(constructionBytes));report.constructionsSha256=sha(constructionBytes);
report.controls={sharedVariableDifferentScopes:true,storedRows:t.g.kind.length,expandedOccurrences:wide.occurrences,freeVariableOccurrences:wide.free[0].count,typed:false};
report.oracleOccurrences=String(oracleOccurrences);report.files=Object.fromEntries([...inputs,...baselineModels,base+'model.cjs',base+'check.cjs'].map(f=>[f,hash(f)]));
const registry='window.PROOF_ATLAS_BINDER_SUPPORT = '+JSON.stringify({format:'ProofAtlasBinderSupportInventory/1',cases:descriptors})+';\n';
if(freeze){fs.mkdirSync('.'+publicBase,{recursive:true});for(const[file,raw]of assets)fs.writeFileSync('.'+file,z.gzipSync(raw));fs.writeFileSync('public/data/proof-atlas/binder-support-manifest.js',registry);}else{assert.equal(fs.readFileSync('public/data/proof-atlas/binder-support-manifest.js','utf8'),registry);for(const[file,raw]of assets)assert(z.gunzipSync(fs.readFileSync('.'+file)).equals(raw));}
report.assets={count:assets.size,decodedBytes:[...assets.values()].reduce((n,b)=>n+b.length,0),registrySha256:sha(Buffer.from(registry))};
report.scope='Finite exact-support audit of all original/promoted/normalized binder fields and intermediate exchanges in the three frozen native inventories. Counts are syntactic occurrences, not mathematical premises. Generic state/size bounds are guarded; the sharing stress control is structural only.';
const bytes=Buffer.from(JSON.stringify(report,null,2)+'\n');if(freeze)fs.writeFileSync(base+'model-check.json.gz',z.gzipSync(bytes));else assert(z.gunzipSync(fs.readFileSync(base+'model-check.json.gz')).equals(bytes));console.log(JSON.stringify({...report,profiles:undefined,files:undefined}));
