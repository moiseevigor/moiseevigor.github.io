/* Recoverable presentation grammar. A glyph is not an operation's identity:
   all supplied type/instance arguments, wrappers and raw ports stay attached. */
(function(host){
 'use strict';
 const isNode=typeof module!=='undefined'&&module.exports,A=isNode?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
 const limits=Object.freeze({nodes:48,depth:16,spine:64,path:512,metadataBytes:4194304});
 const demand=(ok,m)=>{if(!ok)throw Error('Type notation: '+m);},copy=v=>JSON.parse(JSON.stringify(v)),same=(a,b)=>JSON.stringify(a)===JSON.stringify(b),nat=x=>Number.isSafeInteger(x)&&x>=0;
 const bind=(k,s)=>(k===6||k===7)&&s===1||k===8&&s===2;
 function scene(g,root,catalog,{slots=[],context=[],address,budget=limits.nodes}={}){
  demand(typeof address==='function','qualified address provider required');
  demand(g?.serialization==='ExprDAG/1'&&g.kind.length<=262144&&nat(root)&&root<g.kind.length,'graph/root');demand(catalog?.format==='ProofAtlasNotationCatalog/1'&&catalog.entries.length<=64,'catalog');
  demand(nat(budget)&&budget>=1&&budget<=limits.nodes&&slots.length<=limits.path&&context.length<=512,'scene bounds');
  const signatures=new Map(catalog.entries.map(e=>[JSON.stringify(e.nameParts),e]));let bytes=0,work=0;
  function origin(node,path){demand(path.length<=limits.path,'path bound');const result=copy(address(node,path));demand(typeof result.namespace==='string'&&result.namespace.length>0,'qualified origin required');bytes+=new TextEncoder().encode(JSON.stringify(result)).length;demand(bytes<=limits.metadataBytes,'metadata bound');return result;}
  const alias=(name,ctx)=>{const base=(name||'_').split('._@')[0]||'_';return ctx.some(c=>c.display===base)||base==='_'?base+'·'+ctx.length:base;};
  let initial=[];for(const c of context){demand(typeof c.name==='string'&&typeof(c.address||c.origin)?.namespace==='string','qualified context entry required');initial.push({...c,display:alias(c.name,initial)});}
  function peek(node,path){let id=node,at=path,frames=[];while(g.kind[id]===5||g.kind[id]===10){if(frames.length===limits.spine||at.length===limits.path)return null;const k=g.kind[id];frames.push({kind:k===5?'argument':'metadata',node:id,path:at,...(k===5?{argument:g.children[id][1],argumentPath:[...at,1]}:{})});id=g.children[id][0];at=[...at,0];}return{head:id,headPath:at,frames,args:frames.filter(f=>f.kind==='argument').reverse()};}
  function frontier(node,path,reason){return{kind:'frontier',rawKind:A.kinds[g.kind[node]],label:'⟨'+A.kinds[g.kind[node]]+' · '+g.expanded[node]+' occurrences⟩',origin:origin(node,path),slots:copy(path),children:[],retained:'0',hidden:g.expanded[node],expanded:g.expanded[node],nodes:1,reason};}
  function visit(node,path,ctx,available,depth){
   demand(++work<=3072,'scene work bound');if(depth>limits.depth||path.length>=limits.path)return frontier(node,path,'depth/path');
   const k=g.kind[node],p=g.payloads[node],cs=g.children[node],spine=peek(node,path),metadata=spine?.frames.filter(f=>f.kind==='metadata').length||0;
   let kind='constructor',form=null,label=A.kinds[k],retained=1n,hidden=[],folded=[],fields=[],residual=null,signature=null,head=null;
   if(spine?.frames.length){
    const headKind=g.kind[spine.head],hp=g.payloads[spine.head],candidate=headKind===4?signatures.get(JSON.stringify(hp.nameParts)):null;
    signature=candidate&&hp.name===candidate.name&&hp.levels.length===candidate.levelParams.length&&spine.args.length===candidate.arity?candidate:null;
    if(signature?.form==='numeral'){
     const value=spine.args[signature.visibleSlots[0]],vp=value&&g.payloads[value.argument];if(!value||g.kind[value.argument]!==9||vp.literalKind!=='natVal'||!/^\d+$/.test(vp.value))signature=null;
    }
    const visible=signature?signature.visibleSlots:spine.args.map((_,i)=>i);
    retained=BigInt(spine.frames.length)+(headKind===4?1n:0n);head={node:spine.head,origin:origin(spine.head,spine.headPath),payload:copy(hp)};
    residual={head,frames:spine.frames.map(f=>({kind:f.kind,node:f.node,slots:copy(f.path),origin:origin(f.node,f.path),...(f.kind==='argument'?{argument:f.argument,argumentSlots:copy(f.argumentPath)}:{payload:copy(g.payloads[f.node])})}))};
    if(headKind!==4)fields.push({field:'head',node:spine.head,path:spine.headPath,context:ctx});
    spine.args.forEach((f,slot)=>{const port={slot,node:f.argument,slots:copy(f.argumentPath),origin:origin(f.argument,f.argumentPath),expanded:g.expanded[f.argument],binderInfo:signature?.binders[slot]?.binderInfo||'unclassified',name:signature?.binders[slot]?.name||'arg'+slot};
     if(signature?.form==='numeral'&&visible.includes(slot)){folded.push(port);retained+=BigInt(port.expanded);}
     else if(visible.includes(slot))fields.push({field:'arg'+slot,node:f.argument,path:f.argumentPath,context:ctx,slot});else hidden.push(port);
    });
    kind=signature?'notation':spine.args.length?'application':'annotated';form=signature?.form||'application';label=signature?.form==='numeral'?g.payloads[spine.args[signature.visibleSlots[0]].argument].value:signature?.glyph||(headKind===4?hp.name:'apply');
    // Metadata-only frames retain their source wrappers; the underlying head is
    // still a normal child whenever it is not an atom constant.
   }else{
    if(k===0){kind='reference';const target=ctx[ctx.length-1-p.index];demand(target,'unresolved binder');label=target.display;head={target:copy(target)};}
    else if(k===4){kind='constant';label=p.name;}
    else if(k===9){kind='literal';label=p.literalKind==='natVal'?p.value:JSON.stringify(p.value);}
    else if(k===3){kind='sort';const level=A.compileLevels([p.level]);label=level.kind[level.roots[0]]==='zero'?'Prop':'Sort '+A.levelText(p.level);}
    else if(k===6||k===7||k===8){kind='binder';label=alias(p.binderName||p.declName,ctx);form=k===6?'lambda':k===7?'forall':'let';}
    else if(k===1||k===2){kind='open';label=A.kinds[k]+' '+p.id;}
    cs.forEach((child,s)=>{const extended=bind(k,s)?[...ctx,{name:p.binderName||p.declName||'_',display:label,origin:origin(node,path),slots:copy(path),relation:'type-local-binder'}]:ctx;fields.push({field:A.fields[A.kinds[k]][s],node:child,path:[...path,s],context:extended});});
   }
   if(fields.length+1>available)return frontier(node,path,'node budget');
   // Read ports in source order. Reserve one frontier for each later port and
   // return unused capacity from a small operand to the remaining operands.
   let remaining=available-1;const children=fields.map((f,i)=>{const capacity=remaining-(fields.length-i-1),value=visit(f.node,f.path,f.context,capacity,depth+1);remaining-=value.nodes;return{field:f.field,...(f.slot===undefined?{}:{slot:f.slot}),value};});
   const hiddenCount=hidden.reduce((n,p)=>n+BigInt(p.expanded),0n)+children.reduce((n,c)=>n+BigInt(c.value.hidden),0n),retainedCount=retained+children.reduce((n,c)=>n+BigInt(c.value.retained),0n);
   demand(retainedCount+hiddenCount===BigInt(g.expanded[node]),'exact occurrence accounting');
   const clipped=String(label).slice(0,96),result={kind,rawKind:A.kinds[k],form,label:clipped,labelTruncated:String(label).length>96,origin:origin(node,path),slots:copy(path),children,head,residual,metadata,hiddenPorts:hidden,foldedPorts:folded,signature:signature?{name:signature.name,sha256:signature.signatureSha256,arity:signature.arity}:null,
    retained:String(retainedCount),hidden:String(hiddenCount),expanded:g.expanded[node],nodes:1+children.reduce((n,c)=>n+c.value.nodes,0)};
   demand(result.nodes<=available,'node accounting');return result;
  }
  let result;try{result=visit(root,slots,initial,budget,0);}catch(e){if(!/metadata bound|scene work bound/.test(e.message))throw e;bytes=0;result=frontier(root,slots,e.message);}
  bytes=new TextEncoder().encode(JSON.stringify(result)).length;if(bytes>limits.metadataBytes){bytes=0;result=frontier(root,slots,'serialized scene bound');bytes=new TextEncoder().encode(JSON.stringify(result)).length;}
  return{format:'ProofAtlasTypeNotationScene/1',rule:'recoverable-call-notation/1',root:result,stats:{nodes:result.nodes,retained:result.retained,hidden:result.hidden,represented:result.expanded,metadataBytes:bytes,work},limits,catalogNativeSha256:catalog.nativeSha256};
 }
 const api={scene,limits};if(isNode)module.exports=api;else host.ProofAtlasTypeNotation=api;
})(typeof window==='undefined'?globalThis:window);
