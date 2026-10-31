/* Source cuts have one qualified root. Union operates on occurrence paths,
   never on shared row IDs, rendered labels or inferred semantic equivalence. */
(function(host){
 'use strict';
 const isNode=typeof module!=='undefined'&&module.exports,A=isNode?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
 const limits=Object.freeze({entries:8192,path:512,bytes:4194304}),nat=x=>Number.isSafeInteger(x)&&x>=0,copy=v=>JSON.parse(JSON.stringify(v)),canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v,same=(a,b)=>JSON.stringify(canonical(a))===JSON.stringify(canonical(b)),key=p=>JSON.stringify(p),demand=(ok,m)=>{if(!ok)throw Error('Source cut union: '+m);},prefix=(a,b)=>a.length<=b.length&&a.every((s,i)=>s===b[i]);
 const freeze=v=>{if(v&&typeof v==='object'&&!Object.isFrozen(v)){Object.values(v).forEach(freeze);Object.freeze(v);}return v;};
 function point(g,owner){demand(owner&&typeof owner.namespace==='string'&&nat(owner.typeRoot)&&Array.isArray(owner.slots)&&owner.slots.length<=limits.path&&owner.slots.every(s=>nat(s)&&s<3),'qualified root');const node=A.walk(g,{root:owner.typeRoot,slots:owner.slots});demand(node===owner.node,'root node/path');return node;}
 function build(g,owner,retained){
  const root=point(g,owner),entries=[],paths=[...retained].map(p=>JSON.parse(p));demand(paths.length<=limits.entries,'retained path bound');
  for(const p of paths){demand(p.length+owner.slots.length<=limits.path&&p.every(s=>nat(s)&&s<3),'retained path');for(let i=0;i<p.length;i++)demand(retained.has(key(p.slice(0,i))),'retained prefix');}
  let visible=0n,hidden=0n;
  function visit(node,slots){demand(entries.length<limits.entries&&slots.length+owner.slots.length<=limits.path,'cut entry/path bound');const index=entries.length;
   if(!retained.has(key(slots))){entries.push({tag:'hole',node,slots:copy(slots)});hidden+=BigInt(g.expanded[node]);return index;}
   const row={tag:'node',node,slots:copy(slots),constructor:A.kinds[g.kind[node]],children:[]};demand(row.constructor,'constructor');entries.push(row);visible++;for(const[s,child]of g.children[node].entries())row.children.push(visit(child,[...slots,s]));return index;
  }
  visit(root,[]);demand(visible===BigInt(retained.size),'unvisited retained path');demand(BigInt(g.expanded[root])===visible+hidden,'exact source count');
  const record={format:'ProofAtlasSourceCutRecord/1',root:{owner:copy(owner),node:root,route:{root:owner.typeRoot,slots:copy(owner.slots)}},entries,stats:{retained:String(visible),hidden:String(hidden),represented:g.expanded[root],entries:entries.length}};
  demand(new TextEncoder().encode(JSON.stringify(record)).length<=limits.bytes,'record byte bound');return freeze(record);
 }
 function read(g,record){
  demand(record?.format==='ProofAtlasSourceCutRecord/1'&&Array.isArray(record.entries)&&record.entries.length>0&&record.entries.length<=limits.entries,'record shape');demand(new TextEncoder().encode(JSON.stringify(record)).length<=limits.bytes,'record byte bound');
  const owner=record.root?.owner,node=point(g,owner);demand(record.root.node===node&&same(record.root.route,{root:owner.typeRoot,slots:owner.slots}),'root route');let cursor=0,retained=new Set(),hidden=0n;
  function visit(id,slots){demand(slots.length+owner.slots.length<=limits.path,'record path bound');const index=cursor,row=record.entries[cursor++];demand(row&&row.node===id&&same(row.slots,slots),'source row/path');
   if(row.tag==='hole'){demand(Object.keys(row).every(k=>['tag','node','slots'].includes(k)),'hole fields');hidden+=BigInt(g.expanded[id]);return;}
   demand(row.tag==='node'&&row.constructor===A.kinds[g.kind[id]]&&Object.keys(row).every(k=>['tag','node','slots','constructor','children'].includes(k))&&Array.isArray(row.children)&&row.children.length===g.children[id].length,'retained constructor');retained.add(key(slots));
   for(const[s,child]of g.children[id].entries()){demand(row.children[s]===cursor&&cursor>index,'preorder field');visit(child,[...slots,s]);}
  }
  visit(node,[]);demand(cursor===record.entries.length,'unconsumed entries');demand(record.stats?.retained===String(retained.size)&&record.stats.hidden===String(hidden)&&record.stats.represented===g.expanded[node]&&record.stats.entries===record.entries.length&&BigInt(retained.size)+hidden===BigInt(g.expanded[node]),'source accounting');return{owner:copy(owner),retained};
 }
 function fromNotation(g,scene){
  demand(scene?.format==='ProofAtlasTypeNotationScene/1'&&scene.root,'notation scene');const owner=scene.root.origin,base=owner.slots;point(g,owner);demand(same(base,scene.root.slots),'notation root');const retained=new Set();let visits=0;
  const source=(node,slots,origin)=>{demand(prefix(base,slots),'source outside root');const expected={...copy(owner),node,slots:copy(slots)};demand(same(origin,expected)&&A.walk(g,{root:owner.typeRoot,slots})===node,'notation source identity');};
  const keep=slots=>retained.add(key(slots.slice(base.length)));
  function visit(n){demand(++visits<=192,'notation object bound');const id=A.walk(g,{root:owner.typeRoot,slots:n.slots});source(id,n.slots,n.origin);demand(n.expanded===g.expanded[id],'notation occurrence count');
   if(n.kind==='frontier'){demand(n.children.length===0&&n.retained==='0'&&n.hidden===n.expanded,'frontier');return;}
   if(n.residual){
    let at=id,path=n.slots,argumentsOuter=[];for(const frame of n.residual.frames){source(at,path,frame.origin);demand(frame.node===at&&same(frame.slots,path),'frame path');const kind=g.kind[at];demand(frame.kind===(kind===5?'argument':kind===10?'metadata':''),'frame constructor');keep(path);
     if(kind===5){demand(frame.argument===g.children[at][1]&&same(frame.argumentSlots,[...path,1]),'frame argument');argumentsOuter.push({node:g.children[at][1],slots:[...path,1]});}else demand(same(frame.payload,g.payloads[at]),'metadata payload');at=g.children[at][0];path=[...path,0];
    }
    source(at,path,n.residual.head.origin);demand(n.residual.head.node===at&&same(n.residual.head.payload,g.payloads[at]),'exact head payload');
    const args=argumentsOuter.reverse(),visible=n.children.filter(c=>c.slot!==undefined),head=n.children.filter(c=>c.field==='head');
    if(g.kind[at]===4){demand(head.length===0,'constant head');keep(path);}else{demand(head.length===1&&same(head[0].value.slots,path),'head cut');}
    const ports=[...n.hiddenPorts,...n.foldedPorts];demand(same([...visible.map(c=>c.slot),...ports.map(p=>p.slot)].sort((a,b)=>a-b),args.map((_,i)=>i)),'complete ordered arguments');
    for(const port of ports){const arg=args[port.slot];source(arg.node,arg.slots,port.origin);demand(port.node===arg.node&&same(port.slots,arg.slots)&&port.expanded===g.expanded[arg.node],'argument port');}
    for(const folded of n.foldedPorts){demand(g.kind[folded.node]===9&&g.children[folded.node].length===0,'folded literal');keep(folded.slots);}
    for(const child of visible)demand(same(child.value.slots,args[child.slot].slots),'visible argument');
   }else{keep(n.slots);demand(n.children.length===g.children[id].length,'constructor child count');n.children.forEach((c,s)=>demand(c.field===A.fields[A.kinds[g.kind[id]]][s]&&same(c.value.slots,[...n.slots,s]),'constructor field'));}
   n.children.forEach(c=>visit(c.value));
  }
  visit(scene.root);const record=build(g,owner,retained);demand(record.stats.retained===scene.stats.retained&&record.stats.hidden===scene.stats.hidden&&record.stats.represented===scene.stats.represented,'notation/source cut accounting');return record;
 }
 function combine(g,a,b,intersection){const x=read(g,a),y=read(g,b);demand(same(a.root,b.root),'same qualified root required');const paths=intersection?new Set([...x.retained].filter(k=>y.retained.has(k))):new Set([...x.retained,...y.retained]);return build(g,x.owner,paths);}
 function embed(g,wholeOwner,subrecord){point(g,wholeOwner);const sub=read(g,subrecord),family=o=>{const c=copy(o);delete c.node;delete c.slots;return c;};demand(same(family(wholeOwner),family(sub.owner))&&prefix(wholeOwner.slots,sub.owner.slots),'same source family and descendant');const relative=sub.owner.slots.slice(wholeOwner.slots.length),paths=new Set();for(let i=0;i<relative.length;i++)paths.add(key(relative.slice(0,i)));for(const p of sub.retained)paths.add(key([...relative,...JSON.parse(p)]));return build(g,wholeOwner,paths);}
 const join=(g,a,b)=>combine(g,a,b,false),meet=(g,a,b)=>combine(g,a,b,true);
 function refines(g,a,b){const x=read(g,a),y=read(g,b);demand(same(a.root,b.root),'same qualified root required');return[...x.retained].every(p=>y.retained.has(p));}
 const api={fromNotation,read,build,join,meet,embed,refines,limits};if(isNode)module.exports=api;else host.ProofAtlasSourceCutUnion=api;
})(typeof window==='undefined'?globalThis:window);
