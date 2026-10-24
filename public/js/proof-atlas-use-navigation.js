/* Navigate literal binder uses. No assignments, normalization or typing is inferred. */
(function(host){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports;
 const A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
 const P=node?require('./proof-atlas-packed-routes'):host.ProofAtlasPackedRoutes;
 const pages=()=>node?require('./proof-atlas-source-pages'):host.ProofAtlasSourcePages;
 const limits=Object.freeze({visits:65536,depth:16384,rows:128,negativeStates:4096,bytes:131072});
 const demand=(ok,m)=>{if(!ok)throw Error('Source use navigation: '+m);};
 const binds=(k,s)=>(k===6||k===7)&&s===1||k===8&&s===2;
 const at=(bytes,i)=>(bytes[i>>2]>>((i%4)*2))&3;
 const identity=r=>({name:r.name,indexSha256:r.indexSha256,sourceSha256:r.sourceSha256});
 const same=(x,y)=>JSON.stringify(x)===JSON.stringify(y);
 function open(data,record,options={}){
  demand(data.serialization==='ExprDAG/1'&&data.declaration.name===record.name&&data.kind.length===record.uniqueNodes&&(!data.declaration.sourceSha256||data.declaration.sourceSha256===record.sourceSha256),'source owner');
  const I=node?require('./proof-atlas-scope-interfaces'):host.ProofAtlasScopeInterfaces;let derived=null;
  const scope=options.scope||(options.deriveScope!==false&&I?{run:async work=>work(),get:id=>{derived??=I.compute(data);return{node:id,indexSha256:record.indexSha256,sourceSha256:record.sourceSha256,width:512,mask:derived.rows[id][0]};}}:null);
  return owner(data,record,async id=>[data.kind[id],data.children[id],data.payloads[id],data.neededScope[id]],{...options,scope},()=>{derived=null;});
 }
 function paged(cursor,options={}){
  const id=pages().identity(cursor);demand(same(identity(cursor.record),{name:id.name,indexSha256:id.indexSha256,sourceSha256:id.sourceSha256}),'paged source owner');
  return owner(cursor.data,cursor.record,(id,signal)=>cursor.run(()=>[cursor.data.kind[id],cursor.data.children[id],cursor.data.payloads[id],cursor.data.neededScope[id]],{signal}),options);
 }
 function owner(header,record,read,options,release=()=>{}){
  demand(Number.isSafeInteger(record.uniqueNodes)&&record.uniqueNodes>0&&record.uniqueNodes<=P.limits.sourceNodes&&/^[a-f0-9]{64}$/.test(record.indexSha256)&&/^[a-f0-9]{64}$/.test(record.sourceSha256),'source bounds/hashes');
  const budget={...limits};for(const key of ['visits','depth'])if(options[key]!==undefined){demand(Number.isSafeInteger(options[key])&&options[key]>0&&options[key]<=limits[key],'search budget');budget[key]=options[key];}
  let disposed=false,busy=false,peakRows=0,peakNegative=0;const rows=new Map(),negative=new Map(),receipts=new WeakSet();
  function live(signal){demand(!disposed,'disposed owner');if(signal?.aborted)throw signal.reason||Error('Cancelled');}
  async function row(id,signal){
   live(signal);demand(Number.isSafeInteger(id)&&id>=0&&id<record.uniqueNodes,'source node');
   if(rows.has(id)){const r=rows.get(id);rows.delete(id);rows.set(id,r);return r;}
   const [kind,children,payload,needed]=await read(id,signal);live(signal);
   demand(Number.isInteger(kind)&&kind>=0&&kind<12&&Array.isArray(children)&&children.length===(A.fields[A.kinds[kind]]||[]).length&&children.every(c=>Number.isInteger(c)&&c>=0&&c<id)&&Number.isSafeInteger(needed)&&needed>=0,'source row');
   const index=kind===0?payload.index:null;demand(kind!==0||Number.isSafeInteger(index)&&index>=0&&needed===index+1,'bound index');
   // Copy only bounded structural fields: do not retain evicted source-page payloads.
   const r={kind,children:[...children],needed,index};rows.set(id,r);if(rows.size>limits.rows)rows.delete(rows.keys().next().value);peakRows=Math.max(peakRows,rows.size);return r;
  }
  function remember(key){negative.set(key,true);if(negative.size>limits.negativeStates)negative.delete(negative.keys().next().value);peakNegative=Math.max(peakNegative,negative.size);}
  async function select(binderRoute,{signal}={}){
   live(signal);const bytes=P.parse(binderRoute);demand(binderRoute.root<header.roots.length&&binderRoute.depth< P.limits.depth,'binder root/depth');let id=header.roots[binderRoute.root];
   for(let i=0;i<binderRoute.depth;i++){const r=await row(id,signal),slot=at(bytes,i);demand(slot<r.children.length,'binder route');id=r.children[slot];}
   const r=await row(id,signal);demand([6,7,8].includes(r.kind),'selection is not a binder');const slot=r.kind===8?2:1,body=r.children[slot],selected=Object.freeze({...binderRoute}),selection=Object.freeze({node:id,kind:A.kinds[r.kind],route:selected});
   const localReceipts=new WeakSet();
   async function search(reverse,previous,opts={}){
    live(opts.signal);demand(!busy,'concurrent search');if(previous)demand(receipts.has(previous)&&localReceipts.has(previous),'foreign navigation receipt');busy=true;
    let visits=0,scopePrunes=0,memoPrunes=0,supportPrunes=0,peakStack=0;const bound=previous?P.parse(previous.witness.relative):null,path=[],stack=[];
    const stats=()=>({visits,scopePrunes,memoPrunes,supportPrunes,peakStack,peakRows,peakNegative});
    try{
     async function push(id,index,comparison){
      live(opts.signal);demand(++visits<=budget.visits,'visit budget exhausted');demand(path.length<=budget.depth&&selected.depth+1+path.length<=P.limits.depth,'depth budget exhausted');
      const r=await row(id,opts.signal),key=id+':'+index;
      if(r.needed<=index){scopePrunes++;return null;}
      if(negative.has(key)){memoPrunes++;return null;}
      // needed = index+1 certifies presence of the maximum free index. A larger
      // maximum cannot certify membership of a smaller index; use a bitset or DFS.
      if(r.needed!==index+1&&options.scope){
       const s=await options.scope.run(()=>options.scope.get(id),{signal:opts.signal});live(opts.signal);
       demand(s.node===id&&s.indexSha256===record.indexSha256&&s.sourceSha256===record.sourceSha256&&s.width===512,'foreign scope summary');
       demand(s.mask===null||typeof s.mask==='string'&&s.mask.length<=128&&/^[0-9a-f]+$/.test(s.mask),'scope mask bound');
       // Bitsets describe raw bvars even when fvar/mvar atoms are also present.
       if(s.mask!==null&&(index>=s.width||(BigInt('0x'+(s.mask||'0'))&(1n<<BigInt(index)))===0n)){supportPrunes++;return null;}
      }
      if(r.kind===0){if(r.index===index&&(!previous||comparison!==0))return{id,index};return null;}
      const children=r.children;stack.push({id,index,comparison,key,kind:r.kind,children,next:reverse?children.length-1:0,complete:!previous||comparison!==0});peakStack=Math.max(peakStack,stack.length);return null;
     }
     let found=await push(body,0,0);
     while(!found&&stack.length){
      const f=stack.at(-1),s=f.next;f.next+=reverse?-1:1;
      if(s<0||s>=f.children.length){if(f.complete)remember(f.key);stack.pop();if(stack.length)path.pop();continue;}
      let comparison=f.comparison;
      if(previous&&comparison===0){if(path.length>=previous.witness.relative.depth){f.complete=false;continue;}comparison=Math.sign(s-at(bound,path.length));}
      if(previous&&(reverse?comparison>0:comparison<0)){f.complete=false;continue;}
      path.push(s);const before=stack.length;found=await push(f.children[s],f.index+(binds(f.kind,s)?1:0),comparison);if(!found&&stack.length===before)path.pop();
     }
     if(!found)return Object.freeze({status:'none',source:identity(record),selection,stats:stats(),guarantee:'No further literal bvar use in this lexical direction. No typing or semantic necessity inferred.'});
     const relative=P.encode(0,path),witness=Object.freeze({node:found.id,index:found.index,namespace:'selected-binder-body-relative',relative}),result=Object.freeze({format:'ProofAtlasUseWitness/1',status:'found',source:Object.freeze(identity(record)),selection,body:Object.freeze({node:body,slot}),witness,stats:Object.freeze(stats()),typing:'not-queried'});
     demand(new TextEncoder().encode(JSON.stringify(result)).length<=limits.bytes,'receipt byte budget');receipts.add(result);localReceipts.add(result);return result;
    }catch(error){return Object.freeze({status:'unavailable',reason:String(error.message||error).slice(0,256),source:identity(record),selection,stats:stats()});}finally{busy=false;}
   }
   function resolve(receipt){live();demand(receipts.has(receipt)&&localReceipts.has(receipt),'foreign navigation receipt');const b=P.parse(receipt.witness.relative),suffix=Array.from({length:receipt.witness.relative.depth},(_,i)=>at(b,i));return{node:receipt.witness.node,route:P.append(selected,[slot,...suffix])};}
   return Object.freeze({selection,first:opts=>search(false,null,opts),last:opts=>search(true,null,opts),next:(r,opts)=>search(false,r,opts),previous:(r,opts)=>search(true,r,opts),resolve});
  }
  return Object.freeze({select,state:()=>({rows:rows.size,peakRows,negativeStates:negative.size,peakNegative,busy,disposed}),dispose:()=>{disposed=true;rows.clear();negative.clear();release();}});
 }
 function mount(container,{owner,route,onSource}){
  const el=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;},controls=el('div'),status=el('p','Select a direction to find a literal source use.'),source=el('button','Open exact use'),address=el('pre'),details=el('details'),controller=new AbortController();let current=null,disposed=false,nav=null;
  container.classList.add('pl-use-navigation');controls.className='pl-actions';status.setAttribute('aria-live','polite');source.type='button';source.disabled=true;source.dataset.useSource='';address.tabIndex=0;address.hidden=true;details.hidden=true;details.append(el('summary','Exact source address'),address);container.append(el('h5','Follow a binding wire'),el('p','Find uses in source-field order, including nested types and values. This does not infer which uses matter to the argument.'),controls,status,source,details);
  const ns='http://www.w3.org/2000/svg',svg=document.createElementNS(ns,'svg');svg.classList.add('pl-binding-diagram');svg.setAttribute('viewBox','0 0 520 128');svg.setAttribute('aria-hidden','true');container.insertBefore(svg,controls);
  function draw(){const width=Math.max(260,svg.clientWidth||520);svg.setAttribute('viewBox','0 0 '+width+' 128');svg.replaceChildren();const shape=(tag,attrs,text)=>{const e=document.createElementNS(ns,tag);for(const [k,v]of Object.entries(attrs))e.setAttribute(k,v);if(text!==undefined)e.textContent=text;svg.append(e);};shape('rect',{x:12,y:30,width:110,height:44,rx:3,fill:'none',stroke:'#b6cbd1'});shape('text',{x:67,y:57,'text-anchor':'middle',class:'pl-binding-body-label'},nav?'binder e'+nav.selection.node:'selected binder');shape('rect',{x:width-122,y:30,width:110,height:44,rx:3,fill:'none',stroke:'#b6cbd1'});shape('text',{x:width-67,y:57,'text-anchor':'middle',class:'pl-binding-body-label'},current?'use e'+current.witness.node:'use not selected');if(current){shape('path',{d:'M '+(width-124)+' 52 L 124 52 l 8 -5 m -8 5 l 8 5',class:'pl-binding-wire'});shape('text',{x:width/2,y:98,'text-anchor':'middle',class:'pl-binding-body-label'},current.witness.index+' nested binders · exact source link');}}
  const observer=new ResizeObserver(draw);observer.observe(svg);
  const ready=owner.select(route,{signal:controller.signal});ready.then(value=>{if(!disposed){nav=value;draw();}}).catch(()=>{});const buttons=[];draw();
  function active(busy){container.setAttribute('aria-busy',String(busy));for(const b of buttons)b.disabled=busy||!current&&['next','previous'].includes(b.dataset.useDirection);}
  for(const [direction,label]of [['first','First use'],['previous','Previous use'],['next','Next use'],['last','Last use']]){const b=el('button',label);b.type='button';b.dataset.useDirection=direction;b.onclick=async()=>{active(true);status.textContent='Finding source use…';try{nav=await ready;const result=await (['next','previous'].includes(direction)?nav[direction](current,{signal:controller.signal}):nav[direction]({signal:controller.signal}));if(disposed)return;if(result.status==='found'){current=result;const at=nav.resolve(result);source.disabled=false;address.hidden=false;details.hidden=false;address.textContent=JSON.stringify(at.route,null,2);status.textContent='e'+result.witness.node+' · bound index '+result.witness.index+' · '+result.witness.relative.depth+' fields below the selected binder’s body. Original source; typing not queried.';}else status.textContent=result.status==='none'?'No further source use in this direction.':'Source use unavailable: '+result.reason+(current?' · previous selection retained.':'');}catch(error){if(!disposed)status.textContent='Source use unavailable: '+error.message;}finally{if(!disposed){active(false);draw();}}};controls.append(b);buttons.push(b);}
  source.onclick=()=>{if(current&&nav&&!disposed)onSource(nav.resolve(current));};active(false);
  return{getWitness:()=>current,dispose:()=>{disposed=true;controller.abort();observer.disconnect();owner.dispose();container.replaceChildren();}};
 }
 const api={open,paged,mount,limits};if(node)module.exports=api;else host.ProofAtlasUseNavigation=api;
})(typeof window==='undefined'?globalThis:window);
