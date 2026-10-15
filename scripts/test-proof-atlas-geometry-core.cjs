/* Independent paths/binders and cut partitions; no article map or private sources. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),zlib=require('zlib'),assert=require('assert/strict'),crypto=require('crypto');
const A=require('../public/js/proof-atlas-library-data'),G=require('../public/js/proof-atlas-geometry-core'),root=path.resolve(__dirname,'..');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert.deepEqual(Object.keys(G.vocabulary),A.kinds);for(const k of A.kinds)assert.deepEqual(G.vocabulary[k].ports,A.fields[k]||[]);
const grammarHost={};vm.runInNewContext(fs.readFileSync(path.join(root,'public/data/proof-atlas/lean-expr-grammar.js'),'utf8'),{window:grammarHost});
function audit(data,record,scene){
 assert(scene.nodes.length<=scene.budget);assert.equal(new Set(scene.nodes.map(n=>n.id)).size,scene.nodes.length);
 const seen=new Map(scene.nodes.map(n=>[n.id,n]));assert.equal(scene.nodes[0].id,scene.root.path);
 for(const n of scene.nodes){assert.equal(A.walk(data,n.route),n.node);assert.equal(A.path(data,n.route),n.id);assert.deepEqual(n.payload,data.payloads[n.node]);assert.equal(n.kind,A.kinds[data.kind[n.node]]);assert.deepEqual(n.kernelPorts,Array.from(grammarHost.PROOF_ATLAS_GRAMMAR.kinds.find(k=>k.kind===n.kind).fields.filter(f=>f.link==='expr').map(f=>f.name)));const children=data.children[n.node];
  assert.equal(n.children.length,n.frontier?0:children.length);assert.equal(BigInt(n.hidden),n.frontier?BigInt(data.expanded[n.node])-1n:0n);
  n.children.forEach((p,j)=>{assert(seen.has(p));assert.equal(seen.get(p).node,children[j]);assert.deepEqual(seen.get(p).route.slots,[...n.route.slots,j]);assert(scene.edges.some(e=>e.from===n.id&&e.to===p&&e.field===(A.fields[n.kind]||[])[j]));});
  if(n.kind==='bvar'){const b=A.binding(data,n.route),link=scene.links.find(l=>l.from===n.id);assert.equal(link.relation,b?'bound-to':'unresolved-scope');if(b){assert.equal(link.target,A.path(data,b.route));assert.equal(link.node,b.node);assert.equal(link.boundary,!seen.has(link.target));}}
 }
 assert.equal(scene.edges.length,scene.nodes.length-1);assert.equal(BigInt(scene.nodes.length)+scene.nodes.reduce((s,n)=>s+BigInt(n.hidden),0n),BigInt(data.expanded[scene.root.node]));assert(G.validate(scene,data,record));
}
function fixture(){
 const d={serialization:'ExprDAG/1',declaration:{name:'ScopeControl',rootPaths:['root.value'],kind:'theorem'},kind:[],children:[],payloads:[],expanded:[],neededScope:[],roots:[]};
 const add=(k,children=[],payload={})=>{const i=d.kind.length;d.kind.push(A.kinds.indexOf(k));d.children.push(children);d.payloads.push(payload);d.expanded.push((1n+children.reduce((n,j)=>n+BigInt(d.expanded[j]),0n)).toString());d.neededScope.push(k==='bvar'?payload.index+1:Math.max(0,...children.map((j,slot)=>d.neededScope[j]-((['lam','forallE'].includes(k)&&slot===1||k==='letE'&&slot===2)?1:0))));return i;};
 const nat=add('const',[],{name:'Nat',levels:[]}),v=add('bvar',[],{index:0}),inner=add('lam',[v,v],{binderName:'x',binderInfo:'default'}),outer=add('lam',[nat,inner],{binderName:'x',binderInfo:'default'}),letNode=add('letE',[nat,v,v],{binderName:'x',nondep:false}),withLet=add('lam',[nat,letNode],{binderName:'x',binderInfo:'default'});
 const r={name:d.declaration.name,indexSha256:'synthetic-scope-control',sourceSha256:'synthetic-not-kernel-checked',kind:'theorem'};d.roots=[outer,withLet];d.declaration.rootPaths=['root.value','root.control'];return{d,r,add,v};
}
const{d,r,add,v}=fixture();let s=G.create(d,r,{route:{root:0,slots:[]},maxNodes:30,maxDepth:12});audit(d,r,s);
const references=s.nodes.filter(n=>n.node===v);assert.equal(references.length,2,'Shared bvar must have two occurrence vertices');const links=s.links.filter(l=>l.relation==='bound-to');assert.notEqual(links[0].target,links[1].target,'Domain refers to outer binder; body to inner binder');
s=G.create(d,r,{route:{root:1,slots:[]},maxNodes:30,maxDepth:12});audit(d,r,s);const letRefs=s.links.filter(l=>l.relation==='bound-to');assert.notEqual(letRefs[0].target,letRefs[1].target,'Let value must not bind itself');
s=G.create(d,r,{route:{root:0,slots:[1,1]},maxNodes:1,maxDepth:0});audit(d,r,s);assert(s.links[0].boundary,'Binder outside cut must remain an explicit boundary');
// Every constructor, including open elaborator objects, is a structural fixture.
const observed=new Set();for(const k of A.kinds){const cs=(A.fields[k]||[]).map(()=>0),payload=k==='bvar'?{index:0}:k==='fvar'||k==='mvar'?{id:'fixture-open-id'}:k==='const'?{name:'Nat',levels:[]}:{};const i=add(k,cs,payload);d.roots.push(i);d.declaration.rootPaths.push('root.fixture'+i);const scene=G.create(d,r,{route:{root:d.roots.length-1,slots:[]},maxNodes:1,maxDepth:0});observed.add(scene.nodes[0].kind);assert.deepEqual(scene.nodes[0].payload,payload);}
assert.equal(observed.size,12);
let rejected=0;for(const f of [()=>G.create(d,r,{maxNodes:0}),()=>G.create(d,r,{route:{root:0,slots:[-1]}}),()=>G.create(d,r,{maxDepth:129}),()=>G.validate({...s,source:{...s.source,indexSha256:'stale'}},d,r),()=>G.validate({...s,links:[]},d,r)]){assert.throws(f,/Geometric scene/);rejected++;}
const host={};vm.runInNewContext(fs.readFileSync(path.join(root,'public/data/proof-atlas/library-manifest.js'),'utf8'),{window:host});let packets=0,scenes=0,biggest=null,scopeLinks=0;
for(const edition of host.PROOF_ATLAS_LIBRARY.editions)for(const record of edition.declarations){
 const bytes=zlib.gunzipSync(fs.readFileSync(path.join(root,record.indexFile)));assert.equal(sha(bytes),record.indexSha256);const data=A.validateIndex(JSON.parse(bytes),record);packets++;
 const bvar=data.kind.indexOf(0);if(bvar>=0){const routes=A.routes(data),scene=G.create(data,record,{route:routes.route(bvar),maxNodes:1,maxDepth:0});audit(data,record,scene);scopeLinks+=scene.links.filter(l=>l.relation==='bound-to').length;scenes++;}
 for(let j=0;j<data.roots.length;j++){const scene=G.create(data,record,{route:{root:j,slots:[]},maxNodes:48,maxDepth:4});audit(data,record,scene);scopeLinks+=scene.links.filter(l=>l.relation==='bound-to').length;scenes++;if(!biggest||BigInt(scene.stats.represented)>BigInt(biggest.represented))biggest={edition:edition.id,name:record.name,...scene.stats};}
}
assert.equal(packets,2098);assert(BigInt(biggest.represented)>400000000n);
console.log(JSON.stringify({status:'PASS',constructors:12,syntheticScopeControls:3,negativeControls:rejected,packets,scenes,checkedScopeLinks:scopeLinks,largestScene:biggest,scope:'Bounded occurrence cuts, ordered ports, exact packet paths and lexical binding. Synthetic controls are not kernel certificates; large corpus is not labelled AI-generated.'}));
