/* Literal ambient bvar support. A bounded scan, not premise necessity or reduction. */
(function(host){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
 const limits=Object.freeze({nodes:65536,sourceNodes:2147483647,context:512,states:262144,memo:4096,frontier:4096,path:512,bytes:2097152});
 const demand=(v,m)=>{if(!v)throw Error('Type support: '+m);},natural=x=>Number.isSafeInteger(x)&&x>=0,binds=(k,s)=>(k===6||k===7)&&s===1||k===8&&s===2;
 async function scan(read,n,root,ambient,options={}){
  const nodeLimit=options.nodeLimit??limits.nodes,stateLimit=options.stateLimit??limits.states,memoLimit=options.memoLimit??limits.memo,frontierLimit=options.frontierLimit??limits.frontier;
  demand(typeof read==='function'&&natural(nodeLimit)&&nodeLimit>0&&nodeLimit<=limits.sourceNodes&&natural(n)&&n>0&&n<=nodeLimit&&natural(root)&&root<n&&natural(ambient)&&ambient<=limits.context,'root/context bounds');
  demand([[stateLimit,limits.states],[memoLimit,limits.memo],[frontierLimit,limits.frontier]].every(([v,max])=>natural(v)&&v>0&&v<=max),'work bounds');
  const live=()=>{if(options.signal?.aborted)throw options.signal.reason||Error('Type support cancelled');};
  const work=[{node:root,binders:0,length:0,path:new Uint8Array(0)}],memo=new Map(),found=new Map();
  let states=0,evictions=0,peakMemo=0,peakFrontier=1,pathBytes=0,peakPathBytes=0,localVariableStates=0;
  const stats=()=>({states,stateLimit,nodeLimit,memoLimit,frontierLimit,peakMemo,peakFrontier,peakFrontierPathBytes:peakPathBytes,memoEvictions:evictions,localVariableStates,pathLimit:limits.path});
  const unavailable=reason=>({format:'ProofAtlasTypeSupportScan/1',status:'unavailable',reason,ambientLength:ambient,stats:stats()});
  function witness(frame,index){
   if(frame.length>limits.path)return{status:'outside-path-bound',node:frame.node,pathLength:frame.length,formalBinders:frame.binders,bvarIndex:index};
   const slots=[];for(let i=0;i<frame.length;i++)slots.push((frame.path[i>>2]>>((i%4)*2))&3);
   return{status:'located',node:frame.node,slots,formalBinders:frame.binders,bvarIndex:index};
  }
  live();
  while(work.length){
   live();const frame=work.pop();pathBytes-=frame.path?.byteLength||0;const tag=frame.node+':'+frame.binders;
   if(memo.has(tag)){const value=memo.get(tag);memo.delete(tag);memo.set(tag,value);continue;}
   if(states===stateLimit)return unavailable('state-budget');
   if(memo.size===memoLimit){memo.delete(memo.keys().next().value);evictions++;}memo.set(tag,true);peakMemo=Math.max(peakMemo,memo.size);states++;
   const tuple=await read(frame.node,{signal:options.signal});live();
   demand(Array.isArray(tuple)&&tuple.length===5&&natural(tuple[0])&&tuple[0]<12&&Array.isArray(tuple[1])&&tuple[1].length===(A.fields[A.kinds[tuple[0]]]?.length||0)&&tuple[1].every(c=>natural(c)&&c<frame.node),'ordered expression row');
   const [kind,children,payload]=tuple;demand(payload&&typeof payload==='object'&&!Array.isArray(payload),'expression payload');
   if(kind===1||kind===2)return unavailable('unresolved-expression');
   if(kind===0){
    const index=payload.index;demand(natural(index)&&index<Number.MAX_SAFE_INTEGER,'bvar index');
    if(index<frame.binders)localVariableStates++;
    else{const relative=index-frame.binders,ordinal=ambient-1-relative;demand(natural(ordinal)&&ordinal<ambient,'ambient reference outside original context');
     if(!found.has(ordinal))found.set(ordinal,witness(frame,index));
    }
   }
   if(work.length+children.length>frontierLimit)return unavailable('frontier-budget');
   for(let slot=children.length-1;slot>=0;slot--){
    let path=null;
    if(frame.length<limits.path){path=new Uint8Array(Math.ceil((frame.length+1)/4));path.set(frame.path);path[frame.length>>2]|=slot<<((frame.length%4)*2);}
    pathBytes+=path?.byteLength||0;work.push({node:children[slot],binders:frame.binders+(binds(kind,slot)?1:0),length:frame.length+1,path});
   }
   peakFrontier=Math.max(peakFrontier,work.length);peakPathBytes=Math.max(peakPathBytes,pathBytes);
   if(states%1024===0)options.onProgress?.({states});
  }
  const support=[...found].sort((a,b)=>a[0]-b[0]).map(([ordinal,witness])=>({ordinal,witness})),absent=Array.from({length:ambient},(_,i)=>i).filter(i=>!found.has(i));
  const result={format:'ProofAtlasTypeSupportScan/1',status:'complete',ambientLength:ambient,support,absent,stats:stats(),scope:'Literal expression syntax only. Type-local binders are excluded. No unfolding, normalization, transitive definition closure or premise-necessity claim. One witness per present ambient binder; no occurrence counts.'};
  demand(new TextEncoder().encode(JSON.stringify(result)).length<=limits.bytes,'result byte bound');live();return result;
 }
 const api={scan,limits};if(node)module.exports=api;else host.ProofAtlasTypeSupport=api;
})(typeof window==='undefined'?globalThis:window);
