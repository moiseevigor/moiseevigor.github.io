'use strict';
const assert=require('assert/strict'),V=require('../research/proof-atlas/source_reference_view.cjs'),A=require('../public/js/proof-atlas-library-data'),T=require('../public/js/proof-atlas-occurrence-types');
const binds=(k,j)=>(k===6||k===7)&&j===1||k===8&&j===2;
const nat={kind:4,payload:{name:'Nat',nameParts:[{str:'Nat'}],levels:[]},children:[]};
const variable=index=>({kind:0,payload:{index},children:[]});
const app=(f,a)=>({kind:5,payload:{},children:[f,a]});
const lambda=(name,body)=>({kind:6,payload:{binderName:name,binderNameParts:[{str:name}],binderInfo:'default'},children:[nat,body]});
const letTerm=(value,body)=>({kind:8,payload:{declName:'local',declNameParts:[{str:'local'}],nondep:false},children:[nat,value,body]});
function graph(tree){const g={kind:[],children:[],payloads:[],expanded:[],neededScope:[]},intern=new Map();function visit(t){const cs=t.children.map(visit),key=JSON.stringify([t.kind,t.payload,cs]);if(intern.has(key))return intern.get(key);const id=g.kind.length;g.kind.push(t.kind);g.payloads.push(t.payload);g.children.push(cs);g.expanded.push((1n+cs.reduce((n,c)=>n+BigInt(g.expanded[c]),0n)).toString());g.neededScope.push(t.kind===0?t.payload.index+1:Math.max(0,...cs.map((c,j)=>g.neededScope[c]-(binds(t.kind,j)?1:0))));intern.set(key,id);return id;}const root=visit(tree);return{g,root};}
// Independent tree substitution, used only on finite small controls. It uses no
// lazy-view code or production signature-instantiation implementation.
let copied=0;function lift(t,amount,cutoff=0){copied++;return{kind:t.kind,payload:t.kind===0&&t.payload.index>=cutoff?{index:t.payload.index+amount}:t.payload,children:t.children.map((c,j)=>lift(c,amount,cutoff+(binds(t.kind,j)?1:0)))};}
function replace(t,args,depth=0){copied++;if(t.kind===0&&t.payload.index>=depth){const i=t.payload.index-depth;if(i<args.length)return lift(args[args.length-1-i],depth);return variable(t.payload.index-args.length);}return{kind:t.kind,payload:t.payload,children:t.children.map((c,j)=>replace(c,args,depth+(binds(t.kind,j)?1:0)))};}
let comparisons=0,cuts=0,sourceOrigins=0;
const arguments_=[variable(0),variable(1),lambda('y',variable(2)),lambda('y',variable(0)),letTerm(variable(1),app(variable(0),variable(2)))];
const templates=[variable(0),variable(1),variable(2),lambda('z',app(variable(1),variable(3))),lambda('z',lambda('w',app(variable(2),variable(3)))),letTerm(variable(0),app(variable(1),variable(2))),lambda('z',letTerm(variable(1),app(variable(2),variable(4))))];
for(const a of arguments_)for(const t of templates){
 const source=graph(a),formal=graph(t),expected=graph(replace(t,[a]));if(expected.g.neededScope[expected.root]>2)continue;
 T.validateExpressionGraph(formal.g,[formal.root],3);const view=V.instantiate(formal.g,formal.root,source.g,[source.root],2);assert(V.equal(view.graph,view.root,expected.g,expected.root).equal);comparisons++;
 const ctx=[{node:1,path:'original.outer',kind:'lam',route:{root:0,slots:[]}},{node:2,path:'original.inner',kind:'lam',route:{root:0,slots:[1]}}],record={name:'control',indexSha256:'a'.repeat(64),sourceSha256:'b'.repeat(64)};
 const scene=V.scene(view,record,ctx);assert(scene.links.every(l=>l.relation!=='unresolved-scope'));assert.equal(BigInt(scene.stats.retainedOccurrences)+BigInt(scene.stats.hidden),BigInt(expected.g.expanded[expected.root]));cuts++;
 const anchor={node:source.root,route:{root:0,slots:[]}},data={...source.g,roots:[source.root],declaration:{name:'control',rootPaths:['original']}};
 for(const n of scene.nodes){const o=view.origin(n.route.slots,[anchor]);if(o){assert.equal(A.walk(data,o.route),o.node);sourceOrigins++;}}
}
// A graph with millions of claimed nodes whose borrowed root is never walked:
// getters make an accidental whole-source scan or eager copy fail immediately.
let sourceReads=0;const guarded={};for(const [field,value]of Object.entries({kind:5,children:[0,0],payloads:{},expanded:'9671406556917033397649412',neededScope:1}))guarded[field]=new Proxy([],{get(_,key){if(key==='length')return 2000000;if(key==='0'){sourceReads++;return value;}throw Error('unrequested source descendant');}});
const formal=graph(variable(0)),large=V.instantiate(formal.g,formal.root,guarded,[0],1);assert.equal(large.graph.expanded[large.root],'9671406556917033397649412');assert(large.stats().virtualNodes===1);assert(V.equal(large.graph,large.root,guarded,0).equal);assert(sourceReads<12);
assert.throws(()=>V.instantiate(formal.g,formal.root,guarded,[0],0));
assert.throws(()=>V.instantiate(formal.g,formal.root,guarded,[0],1,{maxNodes:0}));
const two=graph(app(variable(0),variable(1)));assert.throws(()=>V.instantiate(two.g,two.root,graph(nat).g,[0],0,{maxNodes:1}));
assert.throws(()=>V.instantiate(graph(variable(1)).g,0,graph(nat).g,[0],0,{allowExternal:false}));
assert.throws(()=>V.equal(large.graph,large.root,guarded,0,{maxPairs:0}));
assert.throws(()=>V.instantiate(two.g,two.root,graph(nat).g,[0],2,{maxWork:1}));
const chain=graph(app(app(app(variable(0),nat),nat),nat));assert.throws(()=>V.instantiate(chain.g,chain.root,graph(nat).g,[0],0,{maxDepth:2}));
const comparisonGraph=graph(app(app(app(variable(0),nat),nat),nat));assert.throws(()=>V.equal(chain.g,chain.root,comparisonGraph.g,comparisonGraph.root,{maxPairs:1}));
assert.equal(comparisons,35);assert(sourceOrigins>0);
console.log(JSON.stringify({status:'PASS',independentTreeComparisons:comparisons,boundedCuts:cuts,sourceOrigins,independentTreeNodesVisited:copied,guardedSourceNodes:2000000,largeVirtualNodes:large.stats().virtualNodes,sourceReads,scope:'Synthetic substitution controls; the guarded graph is an access trap, not a native proof.'}));
