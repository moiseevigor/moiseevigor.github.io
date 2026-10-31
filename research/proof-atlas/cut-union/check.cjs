/* Finite source-cut checks; the general Lean laws do not verify this codec. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict');
const A=require('../../../public/js/proof-atlas-library-data'),T=require('../../../public/js/proof-atlas-type-notation'),U=require('../../../public/js/proof-atlas-source-cut-union'),M=require('../region-context-projection/model.cjs');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/cut-union/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=f=>JSON.parse(z.gunzipSync(fs.readFileSync(f))),copy=x=>JSON.parse(JSON.stringify(x)),key=JSON.stringify;
const w={};vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/type-notation-catalog.js','utf8'),{window:w});const catalog=copy(Object.values(w)[0]);
const inputs=Object.entries(read('research/proof-atlas/region-native-types/packets.json.gz').files).filter(([f])=>f.startsWith('public/data/proof-atlas/region-native-types/'));
assert.equal(inputs.length,150);for(const[f,h]of inputs)assert.equal(sha(fs.readFileSync(f)),h);
const dependencies=[base+'check.cjs','public/js/proof-atlas-source-cut-union.js','public/js/proof-atlas-type-notation.js','public/js/proof-atlas-library-data.js','research/proof-atlas/region-context-projection/model.cjs','public/data/proof-atlas/type-notation-catalog.js','research/proof-atlas/region-native-types/packets.json.gz',...inputs.map(([f])=>f)];
const fingerprints=()=>Object.fromEntries(dependencies.map(f=>[f,sha(fs.readFileSync(f))])),before=fingerprints();
const report={format:'ProofAtlasCutUnionModel/1',status:'PASS',packets:0,notationCuts:0,constructorKinds:[],cutPairs:0,embeddedCuts:0,rejected:[],maxEntries:0,maxBytes:0};
// Independent traversal of the source, consuming raw preorder records. Payloads
// belong to the immutable source graph; rows identify literal occurrences.
function audit(g,r){
 let cursor=0,hidden=0n,paths=new Set();
 function visit(id,slots){const index=cursor,row=r.entries[cursor++];assert.equal(row.node,id);assert.deepEqual(row.slots,slots);if(row.tag==='hole'){hidden+=BigInt(g.expanded[id]);return;}
  assert.equal(row.tag,'node');assert.equal(row.constructor,A.kinds[g.kind[id]]);assert.equal(row.children.length,g.children[id].length);paths.add(key(slots));
  for(const[s,child]of g.children[id].entries()){assert.equal(row.children[s],cursor);assert(cursor>index);visit(child,[...slots,s]);}
 }
 const root=A.walk(g,r.root.route);visit(root,[]);assert.equal(cursor,r.entries.length);assert.equal(r.stats.retained,String(paths.size));assert.equal(r.stats.hidden,String(hidden));assert.equal(BigInt(paths.size)+hidden,BigInt(g.expanded[root]));assert.deepEqual(U.read(g,r).retained,paths);
 report.maxEntries=Math.max(report.maxEntries,r.entries.length);report.maxBytes=Math.max(report.maxBytes,Buffer.byteLength(JSON.stringify(r)));return paths;
}
function pair(g,a,b,c=a){
 const pa=audit(g,a),pb=audit(g,b),j=U.join(g,a,b),m=U.meet(g,a,b),pj=audit(g,j),pm=audit(g,m);
 assert.deepEqual(pj,new Set([...pa,...pb]));assert.deepEqual(pm,new Set([...pa].filter(p=>pb.has(p))));
 assert.equal(pj.size+pm.size,pa.size+pb.size);assert.equal(BigInt(j.stats.hidden)+BigInt(m.stats.hidden),BigInt(a.stats.hidden)+BigInt(b.stats.hidden));
 assert(U.refines(g,a,j)&&U.refines(g,b,j)&&U.refines(g,m,a)&&U.refines(g,m,b));
 assert.deepEqual(U.join(g,a,b),U.join(g,b,a));assert.deepEqual(U.join(g,a,a),a);
 assert.deepEqual(U.join(g,U.join(g,a,b),c),U.join(g,a,U.join(g,b,c)));report.cutPairs++;
}
let example;
for(const[file]of inputs){
 const p=read(file),g=p.types,packetSha256=sha(fs.readFileSync(file));
 for(let typeRoot=0;typeRoot<2;typeRoot++){
  const root=g.roots[typeRoot],ambient=(typeRoot===0?p.frames:p.query.keptSlots.map(s=>p.frames[s])).map(f=>({name:f.name,address:f.address}));
  const address=(node,slots)=>({namespace:'region-native-type',recordSha256:p.evidence.recordSha256,packetSha256,typeRoot,node,slots});
  const todo=[[]],seen=new Set();let rootCut;
  for(let i=0;i<todo.length;i++){
   const slots=todo[i],at=M.walk(g,root,slots),identity=at.node+':'+at.scope.map(s=>s.node).join(',');if(seen.has(identity))continue;seen.add(identity);
   const context=[...ambient,...at.scope.map(s=>({name:g.payloads[s.node].binderName||g.payloads[s.node].declName||'_',address:address(s.node,s.path)}))];
   const view=T.scene(g,at.node,catalog,{slots,context,address}),cut=U.fromNotation(g,view);audit(g,cut);report.notationCuts++;
   if(!slots.length){rootCut=cut;const small=U.fromNotation(g,T.scene(g,at.node,catalog,{slots,context,address,budget:7}));pair(g,cut,small);example??={g,cut,view};}
   else if(slots.length<=3){const embedded=U.embed(g,rootCut.root.owner,cut),joined=U.join(g,rootCut,embedded);audit(g,embedded);assert(U.refines(g,embedded,joined)&&U.refines(g,rootCut,joined));report.embeddedCuts++;}
   g.children[at.node].forEach((_,s)=>todo.push([...slots,s]));
  }
 }report.packets++;
}
// Exhaustive cuts of small authored syntax trees, including open terms. This is
// structural data, not a claim that each tree is a well-typed proof.
const g={kind:[],children:[],payloads:[],expanded:[],roots:[]};
function add(k,cs=[]){const id=g.kind.length;g.kind.push(k);g.children.push(cs);g.payloads.push({});g.expanded.push(String(1n+cs.reduce((n,c)=>n+BigInt(g.expanded[c]),0n)));return id;}
const b=add(0),f=add(1),mv=add(2),s=add(3),cn=add(4),lit=add(9),app=add(5,[cn,b]),lam=add(6,[s,app]),pi=add(7,[s,b]),letE=add(8,[s,lit,app]),md=add(10,[app]),proj=add(11,[app]);
g.roots=[b,f,mv,s,cn,app,lam,pi,letE,lit,md,proj];
function cuts(id,p=[]){let sets=[new Set([key(p)])];for(const[slot,child]of g.children[id].entries()){const children=cuts(child,[...p,slot]);sets=sets.flatMap(a=>children.map(c=>new Set([...a,...c])));}return[new Set(),...sets];}
for(const[typeRoot,id]of g.roots.entries()){
 const owner={namespace:'authored-structural-cut',typeRoot,node:id,slots:[]},all=cuts(id).map(paths=>U.build(g,owner,paths));
 for(const[aIndex,a]of all.entries())for(const[bIndex,bCut]of all.entries())pair(g,a,bCut,all[(aIndex+bIndex)%all.length]);report.constructorKinds.push(A.kinds[g.kind[id]]);
}
function reject(name,fn){assert.throws(fn);report.rejected.push(name);}
const {g:eg,cut,view}=example;
for(const field of['namespace','recordSha256','packetSha256','typeRoot']){const other=copy(cut);other.root.owner[field]=field==='typeRoot'?1:other.root.owner[field]+'-foreign';reject('foreign-'+field,()=>U.join(eg,cut,other));}
for(const change of['node','slots','constructor','children','counts']){const bad=copy(cut);if(change==='node')bad.entries[0].node=-1;if(change==='slots')bad.entries[0].slots=[2];if(change==='constructor')bad.entries[0].constructor='foreign';if(change==='children')bad.entries[0].children=[999];if(change==='counts')bad.stats.hidden='999';reject('record-'+change,()=>U.read(eg,bad));}
const leafOwner={namespace:'authored-structural-cut',typeRoot:0,node:b,slots:[]};reject('nonexistent-retained-child',()=>U.build(g,leafOwner,new Set(['[]','[2]'])));
reject('missing-prefix',()=>U.build(g,{...leafOwner,typeRoot:5,node:app},new Set(['[1]'])));
reject('too-many-paths',()=>U.build(g,leafOwner,new Set(Array.from({length:8193},(_,i)=>key([i])))));
reject('foreign-notation-owner',()=>{const bad=copy(view);bad.root.origin.namespace='foreign';U.fromNotation(eg,bad);});
reject('notation-accounting',()=>{const bad=copy(view);bad.stats.retained='0';U.fromNotation(eg,bad);});
// Storage sharing does not merge occurrences. Never expand the 2^60 tree.
const shared={kind:[4],children:[[]],payloads:[{}],expanded:['1'],roots:[]};let id=0;for(let i=0;i<60;i++){shared.kind.push(5);shared.children.push([id,id]);shared.payloads.push({});shared.expanded.push(String(1n+2n*BigInt(shared.expanded[id])));id++;}shared.roots=[id];
const owner={namespace:'shared-structural-cut',typeRoot:0,node:id,slots:[]},left=U.build(shared,owner,new Set(['[]','[0]'])),right=U.build(shared,owner,new Set(['[]','[1]']));pair(shared,left,right);assert.equal(U.join(shared,left,right).stats.retained,'3');assert(BigInt(shared.expanded[id])>2n**60n);
report.sharedControl={rows:shared.kind.length,represented:shared.expanded[id],joinedEntries:U.join(shared,left,right).entries.length,typingClaim:false};
report.files=fingerprints();assert.deepEqual(report.files,before,'Inputs changed during checks');
const raw=Buffer.from(JSON.stringify(report,null,2)+'\n');if(process.argv.includes('--check'))assert(z.gunzipSync(fs.readFileSync(base+'model.json.gz')).equals(raw));else fs.writeFileSync(base+'model.json.gz',z.gzipSync(raw,{mtime:0}));console.log(JSON.stringify({...report,files:undefined}));
