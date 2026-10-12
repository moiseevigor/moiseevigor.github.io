/* Lossless shared terms. Only one declaration is fetched; expanded counts use BigInt. */
(function(host){
 'use strict';
 const fields={app:['fn','arg'],lam:['domain','body'],forallE:['domain','body'],letE:['type','value','body'],mdata:['expr'],proj:['struct']};
 const kinds=['bvar','fvar','mvar','sort','const','app','lam','forallE','letE','lit','mdata','proj'];
 async function digest(bytes){return [...new Uint8Array(await crypto.subtle.digest('SHA-256',bytes))].map(x=>x.toString(16).padStart(2,'0')).join('');}
 async function compressed(file,hash){
  const r=await fetch(file);if(!r.ok)throw Error('Proof asset unavailable: '+file+' ('+r.status+')');
  if(!host.DecompressionStream)throw Error('This browser needs gzip decompression support. The compressed term packet remains available.');
  const bytes=await new Response(r.body.pipeThrough(new DecompressionStream('gzip'))).arrayBuffer();
  if(await digest(bytes)!==hash)throw Error('Proof asset SHA-256 mismatch: '+file);
  return JSON.parse(new TextDecoder().decode(bytes));
 }
 function children(data,i){return data.children[i];}
 function validateIndex(data,record){
  const n=record.uniqueNodes;if(data.serialization!=='ExprDAG/1'||data.kind.length!==n||data.children.length!==n||data.expanded.length!==n||data.payloads.length!==n||data.neededScope.length!==n||data.declaration.name!==record.name||data.declaration.kernelCheck!=='PASS')throw Error('Proof index does not match the compiled inventory');
  for(let i=0;i<n;i++){
   const cs=children(data,i),k=kinds[data.kind[i]];if(!k||cs.length!==(fields[k]||[]).length||cs.some(c=>!Number.isInteger(c)||c<0||c>=i))throw Error('Invalid DAG structure at '+i);
   if(1n+cs.reduce((s,c)=>s+BigInt(data.expanded[c]),0n)!==BigInt(data.expanded[i]))throw Error('Invalid expanded count at '+i);
   const need=k==='bvar'?data.payloads[i].index+1:Math.max(0,...cs.map((c,j)=>data.neededScope[c]-((['lam','forallE'].includes(k)&&j===1||k==='letE'&&j===2)?1:0)));
   if(need!==data.neededScope[i])throw Error('Invalid lexical scope at '+i);
  }
  if(data.roots.some(r=>!Number.isInteger(r)||r<0||r>=n||data.neededScope[r]!==0)||data.roots.reduce((s,i)=>s+BigInt(data.expanded[i]),0n)!==BigInt(record.occurrences))throw Error('Proof roots are incomplete or open');
  return data;
 }
 function routes(data){
  const parent=Array(data.kind.length).fill(-2),slot=Array(data.kind.length),origin=Array(data.kind.length),queue=[];
  data.roots.forEach((r,j)=>{if(parent[r]===-2){parent[r]=-1;origin[r]=j;queue.push(r);}});
  for(let p=0;p<queue.length;p++){const i=queue[p];children(data,i).forEach((c,j)=>{if(parent[c]===-2){parent[c]=i;slot[c]=j;origin[c]=origin[i];queue.push(c);}});}
  if(parent.includes(-2))throw Error('Unreachable proof nodes');
  const route=i=>{const slots=[];while(parent[i]>=0){slots.unshift(slot[i]);i=parent[i];}return{root:origin[i],slots};};
  return{parent,route};
 }
 function walk(data,route){let i=data.roots[route.root];if(i===undefined)throw Error('Unknown proof root');for(const j of route.slots){i=children(data,i)[j];if(i===undefined)throw Error('Invalid occurrence route');}return i;}
 function path(data,route){let i=data.roots[route.root],p=data.declaration.rootPaths[route.root];for(const j of route.slots){p+='.'+fields[kinds[data.kind[i]]][j];i=children(data,i)[j];}return p;}
 function binding(data,route){let i=data.roots[route.root],scope=[];for(let at=0;at<route.slots.length;at++){const j=route.slots[at],k=kinds[data.kind[i]];if(['lam','forallE'].includes(k)&&j===1||k==='letE'&&j===2)scope.unshift({node:i,route:{root:route.root,slots:route.slots.slice(0,at)}});i=children(data,i)[j];}return kinds[data.kind[i]]==='bvar'?scope[data.payloads[i].index]:undefined;}
 function binder(data,route){return binding(data,route)?.node;}
 function reachable(data,root){const seen=new Set(),queue=[root];for(let p=0;p<queue.length;p++){const i=queue[p];if(seen.has(i))continue;seen.add(i);queue.push(...children(data,i));}return [...seen];}
 async function open(record){const data=validateIndex(await compressed(record.indexFile,record.indexSha256),record),r=routes(data);data.parent=r.parent;return{data,record,children:i=>children(data,i),route:r.route,path:i=>path(data,r.route(i)),payloads:async()=>{},payload:i=>data.payloads[i],kind:i=>kinds[data.kind[i]]};}
 function levelText(u){switch(u.kind){case 'zero':return '0';case 'succ':return '('+levelText(u.of)+' + 1)';case 'max':case 'imax':return u.kind+'('+levelText(u.left)+', '+levelText(u.right)+')';case 'param':return u.name;case 'mvar':return u.id;default:throw Error('Unknown universe constructor');}}
 function describe(data,i){const k=kinds[data.kind[i]],p=data.payloads[i],cs=children(data,i).map(c=>'e'+c),name=p.binderName||p.declName||'_';switch(k){
  case 'bvar':return 'bound variable ['+p.index+']';
  case 'fvar':case 'mvar':return k+' '+p.id;
  case 'sort':return 'Sort '+levelText(p.level);
  case 'const':return p.name+(p.levels.length?'.{'+p.levels.map(levelText).join(', ')+'}':'');
  case 'app':return cs[0]+' ('+cs[1]+')';
  case 'lam':case 'forallE':{const pair=p.binderInfo==='implicit'?['{','}']:p.binderInfo==='strictImplicit'?['⦃','⦄']:p.binderInfo==='instImplicit'?['[',']']:['(',')'];return(k==='lam'?'fun ':'∀ ')+pair[0]+name+' : '+cs[0]+pair[1]+(k==='lam'?' => ':', ')+cs[1];}
  case 'letE':return 'let '+name+' : '+cs[0]+' := '+cs[1]+'; '+cs[2]+(p.nondep?' [nondependent]':'');
  case 'lit':return p.literalKind==='natVal'?p.value:JSON.stringify(p.value);
  case 'mdata':return cs[0]+' [metadata: '+p.metadata.map(m=>m.key+' = '+m.value.repr).join('; ')+']';
  case 'proj':return cs[0]+'.'+p.typeName+'['+p.index+']';
  default:throw Error('Unknown expression constructor');}}
 function termLines(data,root){return reachable(data,root).sort((a,b)=>a-b).map(i=>'e'+i+' := '+describe(data,i));}
 const api={fields,kinds,children,describe,termLines,path,binding,binder,walk,reachable,routes,validateIndex,digest,compressed,open};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else host.ProofAtlasLibraryData=api;
})(typeof window==='undefined'?globalThis:window);
