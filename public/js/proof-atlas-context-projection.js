/* Ordered context projection over authenticated source tuples, not kernel inference. */
(function(host){
'use strict';
class ContextProjectionError extends Error{constructor(message){super('Context projection: '+message);}}
const demand=(ok,message)=>{if(!ok)throw new ContextProjectionError(message);},fields=['kind','payloads','children','expanded','neededScope'],binds=(k,s)=>(k===6||k===7)&&s===1||k===8&&s===2,clone=x=>JSON.parse(JSON.stringify(x));
function freeze(value){if(!value||typeof value!=='object'||Object.isFrozen(value))return value;for(const child of Object.values(value))freeze(child);return Object.freeze(value);}
// Root support must come from authenticated scope summaries (source) or a
// validated recorded-type graph. Children inherit that root's support guarantee.
function create(source,rawType,{snapshotLimit=4096,snapshotByteLimit=8*1024**2,maxStates=8192,maxWork=65536}={}){
 demand(Number.isInteger(snapshotLimit)&&snapshotLimit>=1&&snapshotLimit<=4096&&Number.isInteger(snapshotByteLimit)&&snapshotByteLimit>=1&&snapshotByteLimit<=8*1024**2,'snapshot bounds');
 demand(Number.isInteger(maxStates)&&maxStates>=1&&maxStates<=8192&&Number.isInteger(maxWork)&&maxWork>=1&&maxWork<=65536,'view bounds');
 const sourceNodes=source.kind.length,typeNodes=rawType.kind.length;demand(Number.isSafeInteger(sourceNodes)&&sourceNodes>=1&&sourceNodes<=2147483647&&Number.isInteger(typeNodes)&&typeNodes>=1&&typeNodes<=32768,'input graph bounds');freeze(rawType);
 const captured=new Map(),states=[],memo=new Map(),cache=Object.fromEntries(fields.map(f=>[f,[]]));let sourceAccess=source,sealed=false,decodedBytes=0,work=0;
 function original(field,node){demand(Number.isInteger(node)&&node>=0&&node<sourceNodes,'source node');if(!captured.has(node)){demand(!sealed&&sourceAccess,'source tuple outside prepared cut');demand(captured.size<snapshotLimit,'source tuple bound');const tuple={};for(const f of fields)tuple[f]=sourceAccess[f][node];const text=JSON.stringify(tuple),bytes=new TextEncoder().encode(text).length;demand(decodedBytes+bytes<=snapshotByteLimit,'source byte bound');captured.set(node,freeze(JSON.parse(text)));decodedBytes+=bytes;}return captured.get(node)[field];}
 function input(space,field,node){if(space==='source')return original(field,node);demand(space==='type'&&Number.isInteger(node)&&node>=0&&node<typeNodes,'type node');return rawType[field][node];}
 function mapping(depth,kept){demand(Number.isInteger(depth)&&depth>=0&&depth<=512&&Array.isArray(kept)&&kept.length<=depth&&kept.every((n,j)=>Number.isInteger(n)&&n>=0&&n<depth&&(j===0||kept[j-1]<n)),'ordered retained context');return freeze({depth,kept:[...kept],key:depth+':'+kept.join('.')});}
 function index(i,cutoff,map){if(i<cutoff)return i;const slot=map.depth-1-(i-cutoff),target=map.kept.indexOf(slot);demand(target>=0,'omitted required ambient slot');return cutoff+map.kept.length-1-target;}
 function add(space,node,map,cutoff=0,depth=0){demand(Number.isInteger(cutoff)&&cutoff>=0&&cutoff<=512&&depth<=512,'projection depth bound');const key=[space,node,map.key,cutoff].join('|');if(memo.has(key))return memo.get(key);demand(states.length<maxStates,'virtual state bound');const id=states.length;memo.set(key,id);states.push({space,node,map,cutoff,depth});return id;}
 function root(space,node,depth,kept,support){const map=mapping(depth,kept);demand(typeof support==='string'&&/^(0|[1-9a-f][0-9a-f]{0,127})$/.test(support),'support encoding');const mask=BigInt('0x'+support);demand(mask>>BigInt(depth)===0n,'escaped support');for(let i=0;i<depth;i++)if(mask&(1n<<BigInt(i)))index(i,0,map);const needed=mask===0n?0:mask.toString(2).length;demand(needed===input(space,'neededScope',node),'support maximum differs from graph');return add(space,node,map);}
 function wrapper(kind,payload,children){demand([6,7,8].includes(kind)&&children.length===(kind===8?3:2)&&children.every(c=>Number.isInteger(c)&&c>=0&&c<states.length),'wrapper shape');demand(states.length<maxStates,'virtual state bound');const id=states.length,row={kind,payloads:freeze(clone(payload)),children:Object.freeze([...children])};row.expanded=(1n+children.reduce((sum,c)=>sum+BigInt(property(c,'expanded')),0n)).toString();row.neededScope=Math.max(0,...children.map((c,j)=>property(c,'neededScope')-(binds(kind,j)?1:0)));states.push({space:'wrapper',row});return id;}
 function property(id,field){demand(Number.isInteger(id)&&id>=0&&id<states.length,'virtual node identity');if(cache[field][id]!==undefined)return cache[field][id];demand(++work<=maxWork,'view work bound');const s=states[id];let value;
  if(s.space==='wrapper')value=s.row[field];
  else if(field==='children'){const kind=input(s.space,'kind',s.node);value=Object.freeze(input(s.space,'children',s.node).map((c,j)=>add(s.space,c,s.map,s.cutoff+(binds(kind,j)?1:0),s.depth+1)));}
  else if(field==='payloads'){const p=input(s.space,field,s.node);value=input(s.space,'kind',s.node)===0?freeze({...p,index:index(p.index,s.cutoff,s.map)}):p;}
  else if(field==='neededScope'){const need=input(s.space,field,s.node);value=need<=s.cutoff?need:index(need-1,s.cutoff,s.map)+1;}
  else value=input(s.space,field,s.node);
  cache[field][id]=value;return value;
 }
 const graph={};for(const field of fields)graph[field]=new Proxy([],{get(_,p){if(p==='length')return states.length;demand(typeof p==='string'&&/^(0|[1-9]\d*)$/.test(p),'indexed graph access only');return property(Number(p),field);},has(_,p){return p==='length'||typeof p==='string'&&/^(0|[1-9]\d*)$/.test(p)&&Number(p)<states.length;},set(){throw new ContextProjectionError('immutable graph');},ownKeys(){throw new ContextProjectionError('whole graph enumeration unavailable');}});
 function reference(id){demand(Number.isInteger(id)&&id>=0&&id<states.length,'reference identity');const s=states[id];return s.space==='wrapper'?null:freeze({space:s.space,node:s.node,originalDepth:s.map.depth,retainedSlots:s.map.kept,cutoff:s.cutoff});}
 return Object.freeze({graph:Object.freeze(graph),root,wrapper,originalPayload:node=>original('payloads',node),reference,seal(){sealed=true;sourceAccess=null;},state:()=>({sealed,preparedSourceTuples:captured.size,sourceSnapshotLimit:snapshotLimit,preparedSourceDecodedBytes:decodedBytes,sourceSnapshotByteLimit:snapshotByteLimit,virtualStates:states.length,maxStates,work,maxWork,borrowedTypeNodes:typeNodes,wholeSourceCopied:false})});
}
const api={create,ContextProjectionError};if(typeof module!=='undefined'&&module.exports)module.exports=api;else host.ProofAtlasContextProjection=api;
})(typeof window==='undefined'?globalThis:window);
