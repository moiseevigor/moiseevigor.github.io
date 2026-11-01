'use strict';
// Syntax probes of every recorded module use. No original proof project is read.
const fs=require('fs'),vm=require('vm'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict'),path=require('path');
process.chdir(path.resolve(__dirname,'../../..'));
const A=require('../../../public/js/proof-atlas-library-data'),C=require('../../../public/js/proof-atlas-context-modules');
const {reconstruct}=require('../../../scripts/proof-atlas-context-module-audit.cjs'),digest=require('../../../scripts/proof-atlas-expression-digest.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),copy=x=>JSON.parse(JSON.stringify(x)),files={},w={};
function bytes(file){const b=fs.readFileSync(file);files[file]=sha(b);return b;}
for(const name of ['context-modules','context-types','goedel-sample','reduced-replay'])vm.runInNewContext(bytes('public/data/proof-atlas/'+name+'-manifest.js').toString(),{window:w});
const inv=copy(w),records=[...inv.PROOF_ATLAS_CONTEXT_MODULES.edition.declarations,...inv.PROOF_ATLAS_CONTEXT_TYPES.edition.declarations,...inv.PROOF_ATLAS_AI_SAMPLE.edition.declarations];
function read(file,hash){const b=z.gunzipSync(bytes(file.replace(/^\//,'')));if(hash)assert.equal(sha(b),hash,file);return JSON.parse(b);}
let graph={serialization:'ExprDAG/1',kind:[],children:[],payloads:[],expanded:[],neededScope:[]},seen=new Map();
const binds=(k,j)=>(k===6||k===7)&&j===1||k===8&&j===2;
function add(k,p,cs=[]){const key=JSON.stringify([k,A.payloadKey(k,p),cs]);if(seen.has(key))return seen.get(key);assert(graph.kind.length<262144,'Combined probe graph bound');const i=graph.kind.length;graph.kind.push(k);graph.children.push(cs);graph.payloads.push(copy(p));graph.expanded.push((1n+cs.reduce((n,c)=>n+BigInt(graph.expanded[c]),0n)).toString());graph.neededScope.push(k===0?p.index+1:Math.max(0,...cs.map((c,j)=>graph.neededScope[c]-Number(binds(k,j)))));seen.set(key,i);return i;}
function include(g,root,memo=new Map()){if(memo.has(root))return memo.get(root);const out=add(g.kind[root],g.payloads[root],g.children[root].map(c=>include(g,c,memo)));memo.set(root,out);return out;}
function shift(root,by){const memo=new Map();function walk(i,d){const key=i+':'+d;if(memo.has(key))return memo.get(key);const k=graph.kind[i],p=graph.payloads[i];const out=k===0&&p.index>=d?add(0,{index:p.index+by}):add(k,p,graph.children[i].map((c,j)=>walk(c,d+Number(binds(k,j)))));memo.set(key,out);return out;}return by===0?root:walk(root,0);}
function substitute(root,images){const memo=new Map();function walk(i,d){const key=i+':'+d;if(memo.has(key))return memo.get(key);assert(memo.size<262144&&d<=512,'Substitution work bound');const k=graph.kind[i],p=graph.payloads[i];let out;
 if(k===0&&p.index>=d){const j=p.index-d;out=j<images.length?shift(images[images.length-1-j],d):add(0,{index:p.index-images.length});}
 else out=add(k,p,graph.children[i].map((c,j)=>walk(c,d+Number(binds(k,j)))));memo.set(key,out);return out;}return walk(root,0);}
const arg=i=>add(1,{id:'Lean.Name.mkNum `__atlas_instantiation_arg '+i,idNameParts:[{str:'__atlas_instantiation_arg'},{num:String(i)}]});
let cases=[];const packages=[],shards=[],allCases=[];
const outputPosition=process.argv.indexOf('--output'),outputFolder=outputPosition>=0?path.resolve(process.argv[outputPosition+1]):null;if(outputFolder)fs.mkdirSync(outputFolder+'/inputs',{recursive:true});
function flush(){if(!cases.length)return;const data={format:'ProofAtlasContextInstantiationShard/1',graph,cases},output=JSON.stringify(data)+'\n';assert(Buffer.byteLength(output)<=64*1024*1024);const file='inputs/'+String(shards.length).padStart(3,'0')+'.json.gz';
 if(outputFolder)fs.writeFileSync(outputFolder+'/'+file,z.gzipSync(output,{level:9,mtime:0}));
 shards.push({file,sha256:sha(Buffer.from(output)),rows:graph.kind.length,cases:cases.length,bytes:Buffer.byteLength(output)});cases=[];graph={serialization:'ExprDAG/1',kind:[],children:[],payloads:[],expanded:[],neededScope:[]};seen.clear();}

function probe(term,type,plan,owner,args=null,targetScope=0){
 assert(plan.length<=512);let t=term,u=type;const headers=[];
 for(const isLet of plan){const tk=graph.kind[t],uk=graph.kind[u],tc=graph.children[t],uc=graph.children[u];assert.equal(tk,isLet?8:6);assert.equal(uk,isLet?8:7);assert.equal(A.payloadKey(tk,graph.payloads[t]),A.payloadKey(uk,graph.payloads[u]));assert.equal(tc[0],uc[0]);if(isLet)assert.equal(tc[1],uc[1]);headers.push({type:tc[0],...(isLet?{value:tc[1]}:{})});t=tc[isLet?2:1];u=uc[isLet?2:1];}
 assert.equal(graph.neededScope[term],0);assert.equal(graph.neededScope[type],0);
 args??=plan.filter(x=>!x).map((_,j)=>arg(j));assert.equal(args.length,plan.filter(x=>!x).length);assert(args.every(i=>graph.neededScope[i]<=targetScope));
 const env=[];let j=0;for(const h of headers)env.push('value'in h?substitute(h.value,env):args[j++]);
 const expectedTerm=substitute(t,env),expectedType=substitute(u,env);assert(graph.neededScope[expectedTerm]<=targetScope&&graph.neededScope[expectedType]<=targetScope);
 const row={index:allCases.length,owner,term,type,plan,args,body:t,bodyType:u,expectedTerm,expectedType,targetScope,headers};row.runSpecification=[term,type,expectedTerm,expectedType,...headers.flatMap(h=>[h.type,...('value'in h?[h.value]:[])])].reduce((n,i)=>n+BigInt(graph.expanded[i]),0n)<=20000n;
 cases.push(row);allCases.push({owner,expandedResult:graph.expanded[expectedTerm],runSpecification:row.runSpecification});if(graph.kind.length>=32768)flush();return row;
}
function recorded(source,entry,g,term,type,slots,owner){const memo=new Map(),t=include(g,term,memo),u=include(g,type,memo),plan=slots.map(j=>source.kind[entry.recipe[j].node]===8);probe(t,u,plan,{...owner,use:copy(entry.state.route),sourceNode:entry.node,originalSlots:slots.map(j=>({slot:entry.discardedPrefix+j,binder:entry.recipe[j].sourceRoute}))});}
for(const d of inv.PROOF_ATLAS_CONTEXT_TYPES.records){
 const pkg=read(d.file,d.sha256),r=records.find(r=>r.name===d.name),s=A.validateIndex(read(r.indexFile,r.indexSha256),r);let n=0;
 for(const e of pkg.entries){const canonical=e.selectedTargetTransport?.canonicalRoute?pkg.entries.find(x=>JSON.stringify(x.state.route)===JSON.stringify(e.selectedTargetTransport.canonicalRoute)):e;assert(canonical);const out=reconstruct(s,canonical,canonical.recipe.map((_,j)=>j),{maxNodes:131072});recorded(s,e,out.graph,out.term,out.type,e.recipe.map((_,j)=>j),{kind:'full-recorded-context',name:r.name,indexSha256:r.indexSha256,sourceSha256:r.sourceSha256,evidenceSha256:d.sha256,canonicalRoute:canonical.state.route});n++;}packages.push({kind:'full-recorded-context',name:r.name,count:n});
}
function reduced(pkg,d,r,s){const canonical=new Map();let n=0;
 for(const e of pkg.entries){const use=e.reducedContext;if(use.module.status==='first-checked-module')canonical.set(use.module.id,e);const first=canonical.get(use.module.id);assert(first);C.validateUse(s,r,first.reducedContext.module,e);const m=first.reducedContext.module;let out;
  if(m.moduleGraph)out={graph:m.moduleGraph,term:m.moduleTermRoot,type:m.moduleTypeRoot};else{out=reconstruct(s,first,first.reducedContext.slots,{maxNodes:131072});assert.deepEqual(digest.roots(out.graph,[out.term,out.type]),[m.nativeTermShapeSha256,m.nativeExpectedTypeShapeSha256]);}
  recorded(s,e,out.graph,out.term,out.type,use.slots,{kind:d.format==='ProofAtlasReplayContextModuleDescriptor/1'?'public-packet-reduced-context':'own-reduced-context',name:r.name,indexSha256:r.indexSha256,sourceSha256:r.sourceSha256,evidenceSha256:d.sha256,moduleId:m.id,canonicalRoute:m.canonicalRoute});n++;
 }packages.push({kind:d.format==='ProofAtlasReplayContextModuleDescriptor/1'?'public-packet-reduced-context':'own-reduced-context',name:r.name,count:n});
}
for(const d of inv.PROOF_ATLAS_CONTEXT_MODULES.records){const p=read(d.file,d.sha256),r=records.find(r=>r.name===d.name),s=A.validateIndex(read(r.indexFile,r.indexSha256),r);reduced(p,d,r,s);}
const d=inv.PROOF_ATLAS_REDUCED_REPLAY,p=read(d.file,d.sha256),r=records.find(r=>r.name===d.source.name),s=A.validateIndex(read(r.indexFile,r.indexSha256),r);reduced(p,{...d,format:'ProofAtlasReplayContextModuleDescriptor/1'},r,s);
assert.equal(allCases.length,1376);assert.equal(packages.length,29);
// Authored data controls include open target images and an exponentially shared body.
const nat=add(4,{name:'Nat',nameParts:[{str:'Nat'}],levels:[]}),bv=i=>add(0,{index:i}),payload={binderName:'x',binderNameParts:[{str:'x'}],binderInfo:'default'};
const lam=b=>add(6,payload,[nat,b]),pi=b=>add(7,payload,[nat,b]);
const owner=name=>({kind:'authored-syntax-control',name,mathematicalTyping:false});
const identity=lam(bv(0)),identityType=pi(nat);
probe(identity,identityType,[],owner('empty-interface-retains-function'));
probe(identity,identityType,[false],owner('one-argument-interface'));
probe(lam(lam(bv(1))),pi(pi(nat)),[false],owner('capture-avoidance-under-lambda'),[bv(0)],1);
probe(lam(lam(add(5,{},[bv(1),bv(0)]))),pi(pi(nat)),[false,false],owner('ordered-two-argument-interface'));
const lp={declName:'k',declNameParts:[{str:'k'}],nondep:false};
probe(lam(add(8,lp,[nat,bv(0),bv(0)])),pi(add(8,lp,[nat,bv(0),nat])),[false,true],owner('let-value-uses-prefix'));
let shared=bv(0);for(let i=0;i<90;i++)shared=add(5,{},[shared,shared]);
probe(lam(shared),pi(nat),[false],owner('shared-2pow90-body'));
const vocabulary=read('research/proof-atlas/source-template-laws/instances.json.gz').instances.at(-1).graph;
const raw=include(vocabulary,vocabulary.roots[2]);assert.equal(graph.neededScope[raw],1);
probe(lam(raw),pi(nat),[false],owner('all-twelve-constructors'));
assert.deepEqual([...new Set(graph.kind)].sort((a,b)=>a-b),Array.from({length:12},(_,i)=>i));flush();
const data={format:'ProofAtlasContextInstantiationInputs/1',files,packages,shards,counts:{recordedUses:1376,authoredControls:allCases.length-1376,storedRows:shards.reduce((n,s)=>n+s.rows,0),maximumShardRows:Math.max(...shards.map(s=>s.rows)),specificationCases:allCases.filter(c=>c.runSpecification).length,distinctSourceDeclarations:new Set(allCases.slice(0,1376).map(c=>c.owner.indexSha256)).size,maximumResultOccurrences:allCases.reduce((a,c)=>BigInt(c.expandedResult)>BigInt(a)?c.expandedResult:a,'0')},scope:'Symbolic syntax probes; source identities retained. No new mathematical typing judgments.'};
const output=JSON.stringify(data)+'\n';assert(shards.reduce((n,s)=>n+s.bytes,0)<=128*1024*1024);
if(process.argv.includes('--write'))fs.writeFileSync(__dirname+'/inputs.json.gz',z.gzipSync(output,{level:9,mtime:0}));
else assert.equal(z.gunzipSync(fs.readFileSync(__dirname+'/inputs.json.gz')).toString(),output,'Regenerate instantiation manifest');
console.log(JSON.stringify({status:'PASS',...data.counts,shards:shards.length,bytes:shards.reduce((n,s)=>n+s.bytes,0)}));
