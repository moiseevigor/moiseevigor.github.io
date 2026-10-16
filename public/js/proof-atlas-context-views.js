(function(host){
'use strict';
const node=typeof module!=='undefined'&&module.exports;
// Scoped source embeddings wrap the original graph; they do not copy it or
// invent an Expr constructor. Callers verify context prefixes before use.
const A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,V=node?require('./proof-atlas-expression-views'):host.ProofAtlasExpressionViews;
const demand=(x,m)=>{if(!x)throw Error('Context embedding: '+m);},binds=(k,j)=>(k===6||k===7)&&j===1||k===8&&j===2;
const ids=new WeakMap();let next=0;function gid(g){if(!ids.has(g))ids.set(g,++next);return ids.get(g);}
function sourceViews(source,specs,scope,options={}){
 const maxNodes=options.maxNodes??65536,states=[],memo=new Map(),cache={kind:[],payloads:[],children:[],expanded:[],neededScope:[]};let work=0;
 demand(Number.isInteger(scope)&&scope>=0&&scope<=512&&specs.length<=256&&Number.isInteger(maxNodes)&&maxNodes>0&&maxNodes<=131072,'bounds');
 function add(node,amount,cutoff=0,depth=0){demand(depth<=512,'depth bound');if(source.neededScope[node]<=cutoff)amount=0;const key=[node,amount,cutoff,depth].join(':');if(memo.has(key))return memo.get(key);demand(states.length<maxNodes,'node bound');const id=states.length;memo.set(key,id);states.push({node,amount,cutoff,depth});return id;}
 const graph={};for(const field of Object.keys(cache))graph[field]=new Proxy([],{get(_,p){if(p==='length')return states.length;demand(typeof p==='string'&&/^(0|[1-9]\d*)$/.test(p),'indexed access only');const id=Number(p),s=states[id];demand(s,'node identity');if(cache[field][id]!==undefined)return cache[field][id];demand(++work<=131072,'work bound');const kind=source.kind[s.node];let result;
  if(field==='kind')result=kind;
  if(field==='payloads'){const payload=source.payloads[s.node];result=kind===0&&payload.index>=s.cutoff?{...payload,index:payload.index+s.amount}:payload;}
  if(field==='children')result=source.children[s.node].map((c,j)=>add(c,s.amount,s.cutoff+(binds(kind,j)?1:0),s.depth+1));
  if(field==='expanded')result=source.expanded[s.node];
  if(field==='neededScope')result=source.neededScope[s.node]>s.cutoff?source.neededScope[s.node]+s.amount:source.neededScope[s.node];
  cache[field][id]=result;return result;}});
 graph.sourceReference=id=>{const s=states[id];demand(s,'reference node');return{graph:source,node:s.node,lift:s.amount,cutoff:s.cutoff};};
 const roots=specs.map(s=>{demand(Number.isInteger(s.node)&&s.node>=0&&s.node<source.kind.length&&Number.isInteger(s.lift)&&s.lift>=0&&s.lift<=512,'source root/lift');const r=add(s.node,s.lift);demand(graph.neededScope[r]<=scope,'embedded root scope');return r;});
 return{graph,roots,stats:()=>({nodes:states.length,work})};
}
// Normalize sequential positive lifts as a monotone piecewise translation on
// original free indices. Different lift chains can have the same action;
// normalize that action before using a borrowed-source equality shortcut.
function mapping(lifts,needed){demand(Array.isArray(lifts)&&lifts.length<=64&&Number.isSafeInteger(needed)&&needed>=0,'mapping bounds');let pieces=[{at:0,by:0}];for(const {lift,cutoff}of lifts){demand(Number.isSafeInteger(lift)&&lift>=0&&lift<=512&&Number.isSafeInteger(cutoff)&&cutoff>=0&&cutoff<=512,'lift operation');if(!lift)continue;const value=i=>{let by=0;for(const p of pieces){if(p.at>i)break;by=p.by;}return i+by;};let lo=0,hi=cutoff;while(lo<hi){const mid=Math.floor((lo+hi)/2);if(value(mid)>=cutoff)hi=mid;else lo=mid+1;}const at=lo;if(at>=needed)continue;let prior=0;for(const p of pieces){if(p.at>at)break;prior=p.by;}if(!pieces.some(p=>p.at===at))pieces.push({at,by:prior});pieces.sort((a,b)=>a.at-b.at);pieces=pieces.map(p=>({at:p.at,by:p.by+(p.at>=at?lift:0)}));}
 return pieces.filter(p=>p.at<needed&&p.by!==0);
}
function identity(graph,node){const shifts=[],seen=new Set();let depth=0;while(graph.sourceReference){demand(++depth<=64,'embedding chain bound');const key=gid(graph)+':'+node;demand(!seen.has(key),'embedding cycle');seen.add(key);const r=graph.sourceReference(node);if(!r)break;shifts.push({lift:r.lift,cutoff:r.cutoff});graph=r.graph;node=r.node;}
 return gid(graph)+':'+node+':'+JSON.stringify(mapping(shifts.reverse(),graph.neededScope[node]));
}
function equal(g,x,h,y,options={}){const maxPairs=options.maxPairs??131072,todo=[[x,y]],seen=new Set();demand(Number.isInteger(maxPairs)&&maxPairs>0&&maxPairs<=131072,'comparison limit');let work=0,shortcuts=0;while(todo.length){const[a,b]=todo.pop(),key=a+':'+b;if(seen.has(key))continue;seen.add(key);demand(++work<=maxPairs,'comparison bound');if(identity(g,a)===identity(h,b)){shortcuts++;continue;}if(g.kind[a]!==h.kind[b]||A.payloadKey(g.kind[a],g.payloads[a])!==A.payloadKey(h.kind[b],h.payloads[b])||g.children[a].length!==h.children[b].length)return{equal:false,work,shortcuts};g.children[a].forEach((c,j)=>todo.push([c,h.children[b][j]]));}return{equal:true,work,shortcuts};}
function same(a,b,stats){
 // Memoize only fully verified pairs, within this comparison. Cycles still
 // hit the depth/work bound; a previous call cannot hide later mutations.
 let work=0,shortcuts=0;const memo=new WeakMap();
 function visit(x,y,depth){
  demand(++work<=524288&&depth<=1024,'JSON comparison bound');if(x===y)return 0;
  if(!x||!y||typeof x!==typeof y||typeof x!=='object'||Array.isArray(x)!==Array.isArray(y))return -1;
  const checked=memo.get(x)?.get(y);if(checked!==undefined){demand(depth+checked<=1024,'JSON comparison bound');shortcuts++;return checked;}
  const ka=Object.keys(x),kb=Object.keys(y);if(ka.length!==kb.length)return -1;let height=0;
  for(const k of ka){if(!Object.prototype.hasOwnProperty.call(y,k))return -1;const child=visit(x[k],y[k],depth+1);if(child<0)return -1;height=Math.max(height,child+1);}
  if(!memo.has(x))memo.set(x,new WeakMap());memo.get(x).set(y,height);return height;
 }
 const result=visit(a,b,0)>=0;if(stats)Object.assign(stats,{work,shortcuts});return result;
}

const api={sourceViews,mapping,equal,same,instantiate:V.instantiate};
if(node)module.exports=api;else host.ProofAtlasContextViews=api;
})(typeof window==='undefined'?globalThis:window);
