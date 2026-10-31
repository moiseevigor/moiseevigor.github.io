'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict');
const A=require('../../../public/js/proof-atlas-library-data'),T=require('../../../public/js/proof-atlas-type-notation'),U=require('../../../public/js/proof-atlas-source-cut-union'),R=require('../../../public/js/proof-atlas-notation-refinement'),M=require('../region-context-projection/model.cjs');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/notation-refinement/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=f=>JSON.parse(z.gunzipSync(fs.readFileSync(f))),copy=x=>JSON.parse(JSON.stringify(x)),same=(a,b)=>assert.deepEqual(a,b),key=JSON.stringify,prefix=(a,b)=>a.length<=b.length&&a.every((s,i)=>s===b[i]);
const w={};vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/type-notation-catalog.js','utf8'),{window:w});const catalog=copy(Object.values(w)[0]);
const inputs=Object.entries(read('research/proof-atlas/region-native-types/packets.json.gz').files).filter(([f])=>f.startsWith('public/data/proof-atlas/region-native-types/'));
const dependencies=[base+'check.cjs',...['library-data','type-notation','source-cut-union','notation-refinement'].map(n=>'public/js/proof-atlas-'+n+'.js'),'research/proof-atlas/region-context-projection/model.cjs','public/data/proof-atlas/type-notation-catalog.js','research/proof-atlas/region-native-types/packets.json.gz','research/proof-atlas/cut-union/Union.lean','research/proof-atlas/cut-union/native.json.gz','research/proof-atlas/cut-union/verification.json.gz','research/proof-atlas/projection-substitution/native.json.gz',...inputs.map(([f])=>f)];
const fingerprints=()=>Object.fromEntries(dependencies.map(f=>[f,sha(fs.readFileSync(f))])),before=fingerprints();assert.equal(inputs.length,150);for(const[f,h]of inputs)assert.equal(before[f],h);
const report={format:'ProofAtlasNotationRefinementModel/1',status:'PASS',packets:0,initialCuts:0,refinements:0,commutingPairs:0,refusalControls:[],maxObjects:0,maxBytes:0,maxRecordEntries:0,nativeRecords:0,nativeJoins:0,budgetStops:0,unchangedOutside:0,bindingTargetsChecked:0},requests=[];
const nodes=scene=>{const all=[],todo=[scene.root];while(todo.length){const n=todo.pop();all.push(n);todo.push(...n.children.map(c=>c.value));}return all;};
function references(g,id,i,memo=new Map()){
 const k=id+':'+i;if(memo.has(k))return memo.get(k);const n=g.kind[id]===0?BigInt(Number(g.payloads[id].index===i)):g.children[id].reduce((s,c,slot)=>s+references(g,c,i+Number(M.binds(g.kind[id],slot)),memo),0n);memo.set(k,n);return n;
}
function record(g,scene){
 const cut=U.fromNotation(g,scene),root=A.walk(g,cut.root.route),visible=U.read(g,cut).retained;
 function count(id,p,i){if(!visible.has(key(p)))return 0n;if(g.kind[id]===0)return BigInt(Number(g.payloads[id].index===i));return g.children[id].reduce((s,c,slot)=>s+count(c,[...p,slot],i+Number(M.binds(g.kind[id],slot))),0n);}
 const refs=Array.from({length:g.neededScope[root]},(_,i)=>{const v=count(root,[],i);return{index:i,visible:String(v),hidden:String(references(g,root,i)-v)};});
 report.maxRecordEntries=Math.max(report.maxRecordEntries,cut.entries.length);return{cut,references:refs};
}
function inspectPacket(g,owner,ambient,request){
 const typeRoot=owner.typeRoot,root=g.roots[typeRoot],address=(node,slots)=>({...owner,node,slots}),make=(slots,budget=48)=>{const at=M.walk(g,root,slots),context=[...ambient,...at.scope.map(s=>({name:g.payloads[s.node].binderName||g.payloads[s.node].declName||'_',address:address(s.node,s.path)}))];return T.scene(g,at.node,catalog,{slots,context,address,budget});};
 const opening=slots=>{const s=make(slots);return s.root.kind==='frontier'?R.openConstructor(g,s):s;};
 const add=scene=>{request.records.push(record(g,scene));return request.records.length-1;};
 const todo=[[]],seen=new Set();for(let i=0;i<todo.length;i++){
  const slots=todo[i],at=M.walk(g,root,slots),identity=at.node+':'+at.scope.map(s=>s.node).join(',');if(seen.has(identity))continue;seen.add(identity);let current=make(slots),currentIndex=add(current);report.initialCuts++;
  let frontiers=nodes(current).filter(n=>n.kind==='frontier');
  if(frontiers.length>1){const[a,b]=frontiers,ra=opening(a.slots),rb=opening(b.slots);try{same(R.refine(g,R.refine(g,current,a.slots,ra),b.slots,rb).root,R.refine(g,R.refine(g,current,b.slots,rb),a.slots,ra).root);report.commutingPairs++;}catch(e){if(!/limit|cannot open/.test(e.message))throw e;}}
  for(let step=0;frontiers.length&&step<192;step++){
   const target=frontiers[0],replacement=opening(target.slots),prior=current;
   try{current=R.refine(g,current,target.slots,replacement);}catch(e){if(!/limit|cannot open/.test(e.message))throw e;report.budgetStops++;break;}
   for(const n of nodes(current))if(n.kind==='reference'){const at=M.walk(g,root,n.slots),index=g.payloads[at.node].index;const expected=index<at.scope.length?address(at.scope.at(-1-index).node,at.scope.at(-1-index).path):ambient.at(-1-(index-at.scope.length)).address;same(n.head.target.address||n.head.target.origin,expected);report.bindingTargetsChecked++;}
   const afterIndex=add(current),embedded=U.embed(g,prior.root.origin,U.fromNotation(g,replacement)),meet=U.meet(g,U.fromNotation(g,prior),embedded);
   // Native join inputs use the same raw-record envelope; counts and references
   // are checked separately for notation scenes above.
   request.records.push({cut:embedded,references:[]},{cut:meet,references:[]});request.joins.push([currentIndex,request.records.length-2,afterIndex,request.records.length-1]);
   assert.equal(current.root.origin,prior.root.origin);same(current.root.slots,prior.root.slots);assert(U.refines(g,U.fromNotation(g,prior),U.fromNotation(g,current)));
   const next=new Map(nodes(current).map(n=>[key(n.slots),n]));for(const n of nodes(prior))if(!prefix(n.slots,target.slots)&&!prefix(target.slots,n.slots)){assert.equal(next.get(key(n.slots)),n);report.unchangedOutside++;}
   assert(current.stats.nodes<=192&&current.stats.metadataBytes<=4194304);report.maxObjects=Math.max(report.maxObjects,current.stats.nodes);report.maxBytes=Math.max(report.maxBytes,current.stats.metadataBytes);report.refinements++;currentIndex=afterIndex;frontiers=nodes(current).filter(n=>n.kind==='frontier');
  }
  g.children[at.node].forEach((_,s)=>todo.push([...slots,s]));
 }
}
for(const[file]of inputs){const p=read(file),request={sourceFile:file,sourceSha256:before[file],graph:p.types,records:[],joins:[]};for(const typeRoot of[0,1]){const ambient=(typeRoot===0?p.frames:p.query.keptSlots.map(s=>p.frames[s])).map(f=>({name:f.name,address:f.address}));inspectPacket(p.types,{namespace:'region-native-type',nativeCaseSha256:p.owner.nativeCaseSha256,recordSha256:p.evidence.recordSha256,packetSha256:before[file],query:p.query.id,typeRoot},ambient,request);}requests.push(request);report.packets++;}
// Separate all-constructor structural fixture, including open fvar/mvar terms.
const fixture=read('research/proof-atlas/projection-substitution/native.json.gz').graph;for(let kind=0;kind<12;kind++){
 const root=fixture.kind.indexOf(kind),g={...fixture,roots:[root]},owner={namespace:'notation-constructor-control',kind,typeRoot:0},ambient=Array.from({length:g.neededScope[root]},(_,slot)=>({name:'v'+slot,address:{namespace:'structural-ambient',slot}})),request={sourceFile:'research/proof-atlas/projection-substitution/native.json.gz',sourceSha256:before['research/proof-atlas/projection-substitution/native.json.gz'],graph:g,records:[],joins:[]};inspectPacket(g,owner,ambient,request);requests.push(request);
}
// A shared binary application tree forces the global cap without allocating
// its occurrence tree. This is a structural stress control, not native typing.
const g={serialization:'ExprDAG/1',kind:[4],children:[[]],payloads:[{name:'f',nameParts:[{str:'f'}],levels:[]}],expanded:['1'],neededScope:[0],roots:[]};let root=0;for(let i=0;i<60;i++){g.kind.push(5);g.children.push([root,root]);g.payloads.push({});g.expanded.push(String(1n+2n*BigInt(g.expanded[root])));g.neededScope.push(0);root++;}g.roots=[root];
const address=(node,slots)=>({namespace:'shared-structural-refinement',typeRoot:0,node,slots}),make=slots=>T.scene(g,A.walk(g,{root:0,slots}),catalog,{slots,address});const opening=slots=>{const s=make(slots);return s.root.kind==='frontier'?R.openConstructor(g,s):s;};let stress=make([]),stops=0;
for(let i=0;i<192;i++){const n=nodes(stress).find(n=>n.kind==='frontier');if(!n)break;const old=stress;try{stress=R.refine(g,stress,n.slots,opening(n.slots));}catch(e){assert(/192-object limit/.test(e.message));assert.equal(stress,old);stops++;break;}}
assert.equal(stops,1);assert(stress.stats.nodes>48&&stress.stats.nodes<=192);report.sharedControl={storedRows:61,represented:g.expanded[root],objects:stress.stats.nodes,typingClaim:false,budgetPreservesScene:true};
const initial=make([]),target=nodes(initial).find(n=>n.kind==='frontier'),replacement=opening(target.slots),refuse=(name,fn)=>{assert.throws(fn);report.refusalControls.push(name);};
refuse('not-a-frontier',()=>R.refine(g,stress,[],opening([])));for(const field of['namespace','query','recordSha256','packetSha256','typeRoot']){const bad=copy(replacement);bad.root.origin[field]=field==='typeRoot'?1:'foreign';refuse('foreign-'+field,()=>R.refine(g,initial,target.slots,bad));}
refuse('catalogue',()=>R.refine(g,initial,target.slots,{...replacement,catalogNativeSha256:'foreign'}));refuse('zero-progress',()=>R.refine(g,initial,target.slots,{...replacement,root:target,stats:{...replacement.stats,nodes:1,retained:'0',hidden:target.expanded}}));
report.nativeRecords=requests.reduce((s,r)=>s+r.records.length,0);report.nativeJoins=requests.reduce((s,r)=>s+r.joins.length,0);assert(report.refinements>0&&report.commutingPairs>0&&report.unchangedOutside>0&&report.bindingTargetsChecked>0);report.files=fingerprints();same(report.files,before);
const raw=Buffer.from(JSON.stringify(report,null,2)+'\n'),nativeRaw=Buffer.from(JSON.stringify({format:'ProofAtlasNotationRefinementRequests/1',requests})+'\n');
if(process.argv.includes('--check')){assert(z.gunzipSync(fs.readFileSync(base+'model.json.gz')).equals(raw));assert(z.gunzipSync(fs.readFileSync(base+'native-input.json.gz')).equals(nativeRaw));}else{fs.writeFileSync(base+'model.json.gz',z.gzipSync(raw,{mtime:0}));fs.writeFileSync(base+'native-input.json.gz',z.gzipSync(nativeRaw,{mtime:0}));}console.log(JSON.stringify({...report,files:undefined,nativeInputBytes:nativeRaw.length}));
