/* Uniform literal weakening: paired storage rows retain local-depth ranges.
 * Original context ownership and kernel conversion are caller obligations. */
(function(host){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
 const natural=n=>Number.isSafeInteger(n)&&n>=0,demand=(ok,message)=>{if(!ok)throw Error('Scope comparison: '+message);};
 const binds=(kind,slot)=>((kind===6||kind===7)&&slot===1)||(kind===8&&slot===2);
 const limits=Object.freeze({rows:65536,pairs:262144,path:512});
 const live=options=>{if(options.signal?.aborted)throw options.signal.reason||Error('Scope comparison cancelled');};

 function create(leftSize,leftRoot,rightSize,rightRoot,shift,options){
  const pairLimit=options.pairLimit??limits.pairs;
  demand(natural(shift),'nonnegative safe context extension');
  demand(Number.isSafeInteger(pairLimit)&&pairLimit>=1&&pairLimit<=limits.pairs,'pair budget');
  demand(options.includeCertificate===undefined||typeof options.includeCertificate==='boolean','certificate option');
  for(const [size,root]of [[leftSize,leftRoot],[rightSize,rightRoot]])demand(natural(size)&&size>0&&size<=limits.rows&&natural(root)&&root<size,'graph bound/root');
  const rows=[],byPair=new Map();let cursor=0,peakPending=0,rangeUpdates=0,maximumLocalDepth=0,terminal=null;
  function add(i,j){
   const key=i+':'+j;if(byPair.has(key))return byPair.get(key);if(rows.length===pairLimit)return null;
   const row={i,j,kind:null,indices:null,edges:[],minimum:Infinity,maximum:-Infinity,minParent:null,maxParent:null};
   byPair.set(key,row);rows.push(row);return row;
  }
  const root=add(leftRoot,rightRoot);
  const summary=status=>({format:'ProofAtlasScopeComparison/1',status,shift,pairs:rows.length,pairLimit,peakPending,rangeUpdates});
  function difference(row,reason,depthChoice){
   const result={...summary('different'),reason,leftNode:row.i,rightNode:row.j};
   if(depthChoice){
    result.depthRange={minimum:row.minimum,maximum:row.maximum};
    const slots=[];let current=row,pathLength=0;
    while(current!==root){const parent=current[depthChoice+'Parent'];demand(parent,'reachable endpoint witness');pathLength++;if(pathLength<=limits.path)slots.push(parent.slot);current=parent.row;}
    slots.reverse();result.witness=pathLength<=limits.path?{status:'located',slots,binders:row[depthChoice==='min'?'minimum':'maximum']}:
     {status:'unavailable',reason:'selection-path-bound',pathLength,pathLimit:limits.path};
   }return result;
  }
  function next(){live(options);return terminal||cursor===rows.length?null:{left:rows[cursor].i,right:rows[cursor].j};}
  function accept(left,right){
   live(options);demand(!terminal&&cursor<rows.length,'pending row pair');
   peakPending=Math.max(peakPending,rows.length-cursor);const row=rows[cursor++];
   for(const [tuple,id]of [[left,row.i],[right,row.j]]){
    demand(Array.isArray(tuple)&&tuple.length>=3,'row fields');const [kind,children,payload]=tuple;
    demand(natural(kind)&&kind<12,'Expr constructor');
    demand(Array.isArray(children)&&children.length===(A.fields[A.kinds[kind]]||[]).length,'ordered constructor arity');
    demand(children.every(child=>natural(child)&&child<id),'postorder child');
    demand(payload&&typeof payload==='object','payload');if(kind===0)demand(natural(payload.index),'variable index');
   }
   row.kind=left[0];
   if(left[0]!==right[0]){terminal=difference(row,'constructor');return;}
   if(left[0]===0)row.indices=[left[2].index,right[2].index];
   else if(A.payloadKey(left[0],left[2])!==A.payloadKey(right[0],right[2])){terminal=difference(row,'payload');return;}
   for(let slot=0;slot<left[1].length;slot++){
    const child=add(left[1][slot],right[1][slot]);
    if(!child){terminal={...summary('unavailable'),reason:'paired-row-budget'};return;}
    row.edges.push({child,slot,increment:binds(row.kind,slot)?1:0});
   }
  }
  function finish(){
   live(options);if(terminal)return terminal;demand(cursor===rows.length,'all paired rows read');
   root.minimum=0;root.maximum=0;
   const ordered=rows.slice().sort((a,b)=>b.i-a.i||b.j-a.j);
   for(const row of ordered){
    live(options);demand(natural(row.minimum)&&natural(row.maximum)&&row.minimum<=row.maximum,'reachable depth range');
    maximumLocalDepth=Math.max(maximumLocalDepth,row.maximum);
    if(row.kind===0){
     const [i,j]=row.indices;
     if(shift===0){if(i!==j)return difference(row,'variable-index','min');}
     else if(j===i){if(row.minimum<=i)return difference(row,'unshifted-external-reference','min');}
     else if(Number.isSafeInteger(i+shift)&&j===i+shift){if(row.maximum>i)return difference(row,'shifted-local-reference','max');}
     else return difference(row,'variable-index','min');
    }
    for(const edge of row.edges){
     const minimum=row.minimum+edge.increment,maximum=row.maximum+edge.increment;
     if(minimum<edge.child.minimum){edge.child.minimum=minimum;edge.child.minParent={row,slot:edge.slot};rangeUpdates++;}
     if(maximum>edge.child.maximum){edge.child.maximum=maximum;edge.child.maxParent={row,slot:edge.slot};rangeUpdates++;}
    }
   }
   const result={...summary('same'),maximumLocalDepth};
   if(options.includeCertificate){const postorder=ordered.slice().reverse(),ids=new Map(postorder.map((row,index)=>[row,index]));
    result.certificate={format:'ProofAtlasScopeCertificate/1',root:ids.get(root),rows:postorder.map(row=>({left:row.i,right:row.j,minimum:row.minimum,maximum:row.maximum,children:row.edges.map(edge=>ids.get(edge.child))}))};
   }return result;
  }
  return{next,accept,finish};
 }
 function compare(left,leftRoot,right,rightRoot,shift=0,options={}){
  for(const graph of [left,right])demand(graph&&Array.isArray(graph.kind)&&['children','payloads'].every(field=>Array.isArray(graph[field])&&graph[field].length===graph.kind.length),'graph fields');
  const engine=create(left.kind.length,leftRoot,right.kind.length,rightRoot,shift,options);
  for(let pair=engine.next();pair;pair=engine.next())engine.accept([left.kind[pair.left],left.children[pair.left],left.payloads[pair.left]],[right.kind[pair.right],right.children[pair.right],right.payloads[pair.right]]);
  return engine.finish();
 }
 async function comparePaged(read,size,leftRoot,rightRoot,shift=0,options={}){
  demand(typeof read==='function','row reader');const engine=create(size,leftRoot,size,rightRoot,shift,options);
  for(let pair=engine.next();pair;pair=engine.next()){
   const left=await read(pair.left,{signal:options.signal});live(options);
   const right=pair.left===pair.right?left:await read(pair.right,{signal:options.signal});live(options);
   engine.accept(left,right);
  }
  return engine.finish();
 }
 const api={limits,compare,comparePaged};if(node)module.exports=api;else host.ProofAtlasScopeComparison=api;
})(typeof window==='undefined'?globalThis:window);
