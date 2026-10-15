/* Dependency-preserving binder abstraction: independent packet/path/partition audit. */
'use strict';
const fs=require('fs'),vm=require('vm'),zlib=require('zlib'),assert=require('assert/strict'),crypto=require('crypto');
const A=require('../public/js/proof-atlas-library-data'),G=require('../public/js/proof-atlas-geometry-core');
function audit(d,r,s){
 assert.equal(s.format,'ProofAtlasGeometricScene/2');assert(s.nodes.length<=s.budget);const shown=new Map(s.nodes.map(n=>[n.id,n])),folded=new Map();let retained=0n,hidden=0n;
 for(const n of s.nodes){assert.equal(A.walk(d,n.route),n.node);assert.equal(A.path(d,n.route),n.id);hidden+=BigInt(n.hidden);
  if(!n.abstraction){retained++;assert.equal(n.retainedOccurrences,1);assert.equal(BigInt(n.hidden),n.frontier?BigInt(d.expanded[n.node])-1n:0n);continue;}
  assert.equal(n.abstraction,'binder-telescope');assert(n.members.length>=2&&n.members.length<=s.telescopeLimit);retained+=BigInt(n.members.length);assert.equal(n.retainedOccurrences,n.members.length);
  let at=n.node,slots=[...n.route.slots],header=0n;
  for(let j=0;j<n.members.length;j++){
   const m=n.members[j],kind=A.kinds[d.kind[at]],body=kind==='letE'?2:1;assert(['lam','forallE','letE'].includes(kind));assert.equal(m.node,at);assert.deepEqual(m.route,{root:n.route.root,slots});assert.equal(m.path,A.path(d,m.route));assert.deepEqual(m.payload,d.payloads[at]);assert.equal(m.bodyPort,body);if(j>0)assert.equal(m.contextBefore,n.members[j-1].path);assert.equal(m.regions.length,body);folded.set(m.path,{node:n.id,slot:j+1});
   for(let k=0;k<body;k++){const region=m.regions[k];assert.equal(region.node,d.children[at][k]);assert.deepEqual(region.route,{root:n.route.root,slots:[...slots,k]});assert.equal(region.path,A.path(d,region.route));assert.equal(region.field,A.fields[kind][k]);assert.equal(region.requiredScope,d.neededScope[region.node]);assert.equal(region.scopeBefore,m.path);header+=BigInt(d.expanded[region.node]);}
   slots.push(body);at=d.children[at][body];
  }
  assert.deepEqual(n.continuation.route,{root:n.route.root,slots});assert.equal(n.continuation.node,at);assert.equal(BigInt(d.expanded[n.node]),BigInt(n.members.length)+header+BigInt(d.expanded[at]));assert.equal(BigInt(n.hidden),header+(n.frontier?BigInt(d.expanded[at]):0n));
  if(!n.frontier){assert(shown.has(n.continuation.path));assert(s.edges.some(e=>e.from===n.id&&e.to===n.continuation.path&&e.relation==='telescope-continuation'));}
 }
 for(const n of s.nodes)if(n.kind==='bvar'){const b=A.binding(d,n.route),l=s.links.find(l=>l.from===n.id);assert.equal(l.relation,b?'bound-to':'unresolved-scope');if(b){const target=A.path(d,b.route),m=folded.get(target);assert.equal(l.target,target);assert.equal(l.boundary,!m&&!shown.has(target));if(m){assert.equal(l.displayTarget,m.node);assert.equal(l.telescopeSlot,m.slot);}}}
 assert.equal(retained,BigInt(s.stats.retainedOccurrences));assert.equal(retained+hidden,BigInt(d.expanded[s.root.node]));assert.equal(s.edges.length,s.nodes.length-1);assert(G.validate(s,d,r));
}
function fixture(){
 const d={serialization:'ExprDAG/1',declaration:{name:'TelescopeControl',rootPaths:['root.value']},kind:[],children:[],payloads:[],expanded:[],neededScope:[],roots:[]};
 const add=(k,cs=[],payload={})=>{const i=d.kind.length;d.kind.push(A.kinds.indexOf(k));d.children.push(cs);d.payloads.push(payload);d.expanded.push(String(1n+cs.reduce((s,c)=>s+BigInt(d.expanded[c]),0n)));d.neededScope.push(k==='bvar'?payload.index+1:Math.max(0,...cs.map((c,j)=>d.neededScope[c]-((['lam','forallE'].includes(k)&&j===1||k==='letE'&&j===2)?1:0))));return i;};
 const nat=add('const',[],{name:'Nat',levels:[]}),v=add('bvar',[],{index:0}),outer=add('lam',[nat,add('forallE',[v,add('letE',[v,v,add('app',[v,v])],{binderName:'x',nondep:false})],{binderName:'x',binderInfo:'implicit'})],{binderName:'x',binderInfo:'default'});d.roots=[outer];return{d,r:{name:d.declaration.name,kind:'theorem',indexSha256:'synthetic',sourceSha256:'synthetic-not-kernel-checked'}};
}
const {d,r}=fixture(),s=G.create(d,r,{foldBinders:true,maxDepth:4,maxNodes:20});audit(d,r,s);assert.equal(s.nodes[0].members.length,3);assert.deepEqual(s.nodes[0].members.map(m=>m.kind),['lam','forallE','letE']);assert(s.links.filter(l=>l.relation==='bound-to').every(l=>l.telescopeSlot===3));
// Enumerate only this tiny synthetic term and prove its regions partition all paths.
const all=[],owners=new Map();function visit(node,route,fn){const path=A.path(d,route);fn(path);d.children[node].forEach((c,j)=>visit(c,{root:route.root,slots:[...route.slots,j]},fn));}
visit(d.roots[0],{root:0,slots:[]},p=>all.push(p));const own=p=>owners.set(p,(owners.get(p)||0)+1);
for(const n of s.nodes){if(n.abstraction){n.members.forEach(m=>own(m.path));n.regions.forEach(q=>visit(q.node,q.route,own));if(n.frontier)visit(n.continuation.node,n.continuation.route,own);}else{own(n.id);if(n.frontier)d.children[n.node].forEach((c,j)=>visit(c,{root:n.route.root,slots:[...n.route.slots,j]},own));}}
assert.deepEqual([...owners.keys()].sort(),all.sort());assert([...owners.values()].every(n=>n===1));
// Header types/let values retain their pre-binder environments when opened.
let headerChecks=0;for(const m of s.nodes[0].members)for(const q of m.regions){const cut=G.create(d,r,{route:q.route,foldBinders:true,maxDepth:4,maxNodes:20});audit(d,r,cut);for(const n of cut.nodes)if(n.kind==='bvar'){const b=A.binding(d,n.route),l=cut.links.find(l=>l.from===n.id);assert.equal(l.target,A.path(d,b.route));assert.notEqual(l.target,m.path,'A header type/value cannot bind itself');headerChecks++;}}
let rejected=0;for(const mutate of [x=>x.nodes[0].members[1].regions[0].route.slots.pop(),x=>x.nodes[0].retainedOccurrences++,x=>x.links[0].telescopeSlot++,x=>x.source.indexSha256='stale']){const bad=structuredClone(s);mutate(bad);assert.throws(()=>G.validate(bad,d,r));rejected++;}
assert.throws(()=>G.create(d,r,{foldBinders:true,telescopeLimit:1}));rejected++;
const limited=G.create(d,r,{foldBinders:true,telescopeLimit:2,maxNodes:1,maxDepth:0});audit(d,r,limited);assert(limited.nodes[0].truncated);assert.equal(limited.nodes[0].members.length,2);
const w={};vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/library-manifest.js','utf8'),{window:w});let packets=0,scenes=0,folds=0,members=0,links=0,largest=null;
for(const e of w.PROOF_ATLAS_LIBRARY.editions)for(const record of e.declarations){const bytes=zlib.gunzipSync(fs.readFileSync('.'+record.indexFile));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),record.indexSha256);const data=A.validateIndex(JSON.parse(bytes),record);packets++;
 for(let j=0;j<data.roots.length;j++){const scene=G.create(data,record,{foldBinders:true,route:{root:j,slots:[]},maxNodes:48,maxDepth:4});audit(data,record,scene);scenes++;folds+=scene.stats.foldedTelescopes;members+=scene.stats.foldedBinders;links+=scene.links.filter(l=>l.telescopeSlot).length;
  if(!largest||BigInt(scene.stats.represented)>BigInt(largest.represented))largest={edition:e.id,name:record.name,...scene.stats,rootBinders:scene.nodes[0].members?.length||0,continuationKind:A.kinds[data.kind[scene.nodes[0].continuation?.node]]||null};
 }}
assert.equal(packets,2098);assert.equal(largest.rootBinders,13);assert.equal(largest.continuationKind,'app');assert(BigInt(largest.represented)>400000000n);
console.log(JSON.stringify({status:'PASS',packets,scenes,folds,foldedBinders:members,linksToFoldedBinders:links,headerScopeControls:headerChecks,exactSmallPartition:true,negativeControls:rejected,largest,scope:'Reversible syntactic telescope abstraction and scoped boundaries, not inferred types or a semantic equivalence certificate.'}));
