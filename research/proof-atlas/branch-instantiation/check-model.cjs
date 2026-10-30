'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),z=require('zlib'),assert=require('assert/strict'),crypto=require('crypto');
process.chdir(path.resolve(__dirname,'../../..'));
const A=require('../../../public/js/proof-atlas-library-data'),M=require('../../../public/js/proof-atlas-method-interfaces'),I=require('../../../public/js/proof-atlas-branch-instantiation'),Q=require('../../../public/js/proof-atlas-method-query-pages');
const base='research/proof-atlas/branch-instantiation/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),h={};
const manifests=['method-interfaces','method-interfaces-ai','method-streaming','method-origins','method-indices','method-parameters','method-mutual','method-query-pages','source-pages'];
for(const n of manifests)vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+n+'-manifest.js','utf8'),{window:h});
const primary=[...h.PROOF_ATLAS_METHOD_INTERFACES.records,...h.PROOF_ATLAS_METHOD_REPLAY.records];
const fixtures=['PROOF_ATLAS_METHOD_ORIGINS','PROOF_ATLAS_METHOD_INDICES','PROOF_ATLAS_METHOD_PARAMETERS','PROOF_ATLAS_METHOD_MUTUAL'].flatMap(n=>h[n].records);
const profiles=[...primary.map(d=>({d,s:h.PROOF_ATLAS_SOURCE_PAGES.records.find(x=>x.name===d.name),q:h.PROOF_ATLAS_METHOD_QUERY_PAGES.records.find(x=>x.name===d.name)})),{d:h.PROOF_ATLAS_STREAM_FIXTURE.nativeDescriptor,s:h.PROOF_ATLAS_STREAM_FIXTURE.sourceDescriptor,q:h.PROOF_ATLAS_STREAM_FIXTURE.queryDescriptor},...fixtures.map(x=>({d:x.nativeDescriptor,s:x.sourceDescriptor,q:x.queryDescriptor}))];
const read=(f,hash)=>{const bytes=z.gunzipSync(fs.readFileSync('.'+f));if(hash)assert.equal(sha(bytes),hash);return JSON.parse(bytes);};
function table(){const g={kind:[],children:[],payloads:[],expanded:[],neededScope:[]},seen=new Map();return{g,add(kind,p,children=[]){const key=kind+':'+A.payloadKey(kind,p)+':'+children.join(',');if(seen.has(key))return seen.get(key);const id=g.kind.length;g.kind.push(kind);g.children.push(children);g.payloads.push(p);g.expanded.push((1n+children.reduce((n,c)=>n+BigInt(g.expanded[c]),0n)).toString());g.neededScope.push(kind===0?p.index+1:Math.max(0,...children.map((c,j)=>g.neededScope[c]-(((kind===6||kind===7)&&j===1||kind===8&&j===2)?1:0))));seen.set(key,id);return id;}};}
function compact(g,roots){const t=table(),memo=new Map();function walk(id){if(memo.has(id))return memo.get(id);const result=t.add(g.kind[id],g.payloads[id],g.children[id].map(walk));memo.set(id,result);return result;}const rs=roots.map(walk);return{serialization:'ExprDAG/1',...t.g,roots:rs};}
// Separate recursive materializer used only by the finite oracle. Runtime
// comparison does not construct this output or retain source closures.
function substitute(g,root,source,args){const t=table(),cache=new Map();function visit(graph,id,depth,shift,mode){const tag=[mode,id,depth,shift].join(':');if(cache.has(tag))return cache.get(tag);const kind=graph.kind[id],p=graph.payloads[id];let result;if(kind===0&&p.index>=depth){if(mode==='template'){const slot=args.length-1-(p.index-depth);assert(slot>=0);result=visit(source,args[slot],0,depth,'source');}else result=t.add(0,{...p,index:p.index+shift});}else result=t.add(kind,p,graph.children[id].map((c,j)=>visit(graph,c,depth+(((kind===6||kind===7)&&j===1||kind===8&&j===2)?1:0),shift,mode)));cache.set(tag,result);return result;}const r=visit(g,root,0,0,'template');return{serialization:'ExprDAG/1',...t.g,roots:[r]};}
const out={status:'RUNNING',profiles:0,frames:0,pagedFrames:0,pagedCalls:0,synthetic:0,refusals:0,peakMemo:0,peakFrontier:0,peakPairs:0,usedBindings:0,rows:[]},cases=[];
(async()=>{const originalFetch=globalThis.fetch,forbidden=new Set(profiles.flatMap(({d})=>[d.file,d.record.indexFile]));let forbiddenRequests=0;
globalThis.fetch=async f=>{if(forbidden.has(f)){forbiddenRequests++;throw Error('Whole archive forbidden');}return new Response(fs.readFileSync('.'+f));};
try{for(const {d,s,q:delivery}of profiles){const raw=read(d.file,d.sha256),source=A.validateIndex(read(d.record.indexFile,d.record.indexSha256),d.record),model=M.open(raw,source,d.record,d);out.profiles++;
for(const q of raw.entries){const paged=s?await Q.open(s,d,delivery,d.record,q.parent.route,{sourceStrategy:'stream'}):null;if(paged)out.pagedCalls++;
for(const b of q.branches){const flow=model.flow(q.parent.route,b.minor),receipt=await I.compare(flow),c=M.signatureContext(flow);assert(I.accepts(receipt,flow));assert.throws(()=>I.accepts(JSON.parse(JSON.stringify(receipt)),flow));out.refusals++;
const g=c.signature;let root=flow.kernel.trace.recursorTypeRoot;for(let j=0;j<c.prefix;j++)root=g.children[root][1];root=g.children[root][0];
const args=c.arguments.map(a=>a.node),expected=compact(c.expected,[c.expectedRoot]),materialized=substitute(g,root,source,args);
assert.deepEqual(materialized,expected,'independent materializer disagrees');cases.push({name:d.name,minor:b.minor,template:compact(g,[root]),source:compact(source,args),expected,shouldMatch:true});
assert.equal(receipt.signature.node,root);assert.deepEqual(receipt.signature.route.slots,[...Array(c.prefix).fill(1),0]);assert.equal(receipt.expected.root,c.expectedRoot);assert.equal(receipt.actual.root,c.actualRoot);
assert.equal(receipt.expected.contextLength,flow.context.length);assert.equal(receipt.prefixCount,c.prefix);assert.equal(receipt.bindings.length,receipt.usedPrefixCount);
for(const v of receipt.bindings){assert.deepEqual(v.argument.route,c.arguments[v.ordinal].route);assert.equal(v.argument.node,c.arguments[v.ordinal].node);}
const tiny=await I.compare(flow,{bounds:{memo:1}});assert.deepEqual({...tiny,state:null},{...receipt,state:null});
for(const options of [{bounds:{work:1}},{bounds:{memo:0}},{bounds:{frontier:0}},{bounds:{bytes:1}}]){await assert.rejects(()=>I.compare(flow,options));out.refusals++;}
const controller=new AbortController();controller.abort();await assert.rejects(()=>I.compare(flow,{signal:controller.signal}));out.refusals++;
await assert.rejects(()=>I.compare(JSON.parse(JSON.stringify(flow))));out.refusals++;
if(paged){const pf=paged.flow(q.parent.route,b.minor),peer=await I.compare(pf);assert.deepEqual({...peer,state:null},{...receipt,state:null});assert.equal(peer.state.sourceMode,'paged');out.pagedFrames++;}
out.frames++;out.usedBindings+=receipt.usedPrefixCount;for(const [key,value]of [['peakMemo',receipt.state.peakMemo],['peakFrontier',receipt.state.peakFrontier],['peakPairs',receipt.state.pairs]])out[key]=Math.max(out[key],value);
out.rows.push({name:d.name,minor:b.minor,query:q.parent.route,nativeOwner:d.sha256,signature:receipt.signature,expected:receipt.expected,actual:receipt.actual,bindings:receipt.bindings,state:receipt.state});}
if(paged){const f=paged.flow(q.parent.route,q.branches[0].minor);paged.dispose();await assert.rejects(()=>I.compare(f));out.refusals++;}
}}}finally{globalThis.fetch=originalFetch;}
// Deterministic structural controls: open substitution terms, shadowing, shared
// variables at different depths, binder domains, let type/value/body and nondep.
const np=n=>[{str:n}],bind=(n='x')=>({binderName:n,binderNameParts:np(n),binderInfo:'default'});
for(let i=0;i<256;i++){const t=table(),s=table(),sort=t.add(3,{level:{kind:'zero'}}),x=t.add(0,{index:0}),y=t.add(0,{index:1}),app=t.add(5,{},[x,y]);let root;
switch(i%8){case 0:root=t.add(6,bind(),[x,app]);break;case 1:root=t.add(7,bind(),[y,t.add(6,bind(),[x,app])]);break;case 2:root=t.add(8,{declName:'x',declNameParts:np('x'),nondep:!!(Math.floor(i/8)%2)},[y,x,app]);break;case 3:root=t.add(5,{},[t.add(6,bind(),[sort,x]),x]);break;case 4:root=t.add(11,{typeName:'Prod',typeNameParts:np('Prod'),index:i%2},[app]);break;case 5:root=t.add(10,{metadata:[]},[app]);break;case 6:root=t.add(5,{},[t.add(4,{name:'Nat',nameParts:np('Nat'),levels:[]}),app]);break;default:root=t.add(7,bind('x'),[t.add(6,bind('x'),[y,x]),app]);}
const v=s.add(0,{index:i%3}),w=s.add(0,{index:3+i%2}),a=s.add(5,{},[v,w]),args=[a,s.add(6,bind('x'),[v,a])],expected=substitute(t.g,root,s.g,args);
const c={signature:t.g,expected,expectedRoot:expected.roots[0],prefix:args.length,arguments:args.map(node=>({node})),sourceMode:'structural-control',readSource:async id=>[s.g.kind[id],s.g.children[id],s.g.payloads[id]]};
const verified=await I.literal(c,root);assert(verified.used.length>0);const broken=JSON.parse(JSON.stringify(expected));const varId=broken.kind.indexOf(0);broken.payloads[varId].index+=9;await assert.rejects(()=>I.literal({...c,expected:broken},root));out.refusals++;out.synthetic++;
cases.push({name:'structural-'+i,template:compact(t.g,[root]),source:compact(s.g,args),expected,shouldMatch:true});
if(i<16)cases.push({name:'capture-negative-'+i,template:compact(t.g,[root]),source:compact(s.g,args),expected:broken,shouldMatch:false});
}
// A shared argument has over 2^1024 expanded occurrences. Compare its DAG
// through a one-entry memo; neither runtime nor oracle expands occurrences.
{const t=table(),s=table(),root=t.add(0,{index:0});let arg=s.add(0,{index:0});for(let j=0;j<1024;j++)arg=s.add(5,{},[arg,arg]);
const expected=substitute(t.g,root,s.g,[arg]),c={signature:t.g,expected,expectedRoot:expected.roots[0],prefix:1,arguments:[{node:arg}],sourceMode:'shared-control',readSource:async id=>[s.g.kind[id],s.g.children[id],s.g.payloads[id]]};
const checked=await I.literal(c,root,{bounds:{memo:1}});assert(checked.state.pairs<=1026);out.sharedArgument={storedNodes:s.g.kind.length,expandedOccurrences:s.g.expanded[arg],pairs:checked.state.pairs,peakMemo:checked.state.peakMemo,peakFrontier:checked.state.peakFrontier};
const controller=new AbortController();await assert.rejects(()=>I.literal({...c,readSource:async id=>{controller.abort();return c.readSource(id);} },root,{signal:controller.signal}));out.refusals++;
cases.push({name:'shared-1024',template:compact(t.g,[root]),source:compact(s.g,[arg]),expected,shouldMatch:true});}
assert.equal(out.profiles,23);assert.equal(out.frames,65);assert.equal(out.pagedFrames,57);assert.equal(forbiddenRequests,0);out.wholeArchiveAttempts=forbiddenRequests;
const files=['public/js/proof-atlas-branch-instantiation.js','public/js/proof-atlas-method-interfaces.js',base+'check-model.cjs',...manifests.map(n=>'public/data/proof-atlas/'+n+'-manifest.js')];out.files=Object.fromEntries(files.map(f=>[f,sha(fs.readFileSync(f))]));out.status='PASS';out.scope='Finite literal substitution into expected method domains, capture/lifting controls, complete/paged agreement and bounded comparisons. Existing native domain conversions remain separately recorded; no new native typing judgment or comprehension claim.';
fs.writeFileSync(base+'primitive-input.json.gz',z.gzipSync(JSON.stringify(cases)));out.primitiveInputSha256=sha(Buffer.from(JSON.stringify(cases)));fs.writeFileSync(base+'model-check.json.gz',z.gzipSync(JSON.stringify(out,null,2)+'\n'));console.log(JSON.stringify({...out,rows:undefined,files:undefined}));
})().catch(e=>{console.error(e.stack);process.exitCode=1});
