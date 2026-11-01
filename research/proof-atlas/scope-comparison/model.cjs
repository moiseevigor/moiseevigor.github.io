/* Experimental literal weakening on validated, postorder Expr graphs.
 * This compares syntax. Original context ownership and kernel conversion
 * remain separate obligations of the calling application. */
'use strict';
const A=require('../../../public/js/proof-atlas-library-data');
const demand=(ok,message)=>{if(!ok)throw Error('Scope comparison: '+message);};
const binds=(kind,slot)=>(kind===6||kind===7)&&slot===1||kind===8&&slot===2;
const natural=n=>Number.isSafeInteger(n)&&n>=0;

function compare(left,leftRoot,right,rightRoot,shift=0,options={}){
 const pairLimit=options.pairLimit??262144;
 demand(options.includeCertificate===undefined||typeof options.includeCertificate==='boolean','certificate option');
 demand(natural(shift),'nonnegative safe context extension');
 demand(Number.isSafeInteger(pairLimit)&&pairLimit>=1&&pairLimit<=262144,'pair budget');
 for(const [graph,root]of [[left,leftRoot],[right,rightRoot]]){
  demand(graph&&Array.isArray(graph.kind)&&graph.kind.length>0&&graph.kind.length<=65536,'stored graph bound');
  demand(['children','payloads'].every(field=>Array.isArray(graph[field])&&graph[field].length===graph.kind.length),'graph fields');
  demand(natural(root)&&root<graph.kind.length,'selected root');
 }
 const rows=[],byPair=new Map();let peakPending=0,rangeUpdates=0,maximumLocalDepth=0;
 function add(i,j){
  const key=i+':'+j;
  if(byPair.has(key))return byPair.get(key);
  if(rows.length===pairLimit)return null;
  const row={i,j,edges:[],minimum:Infinity,maximum:-Infinity,minParent:null,maxParent:null};
  byPair.set(key,row);rows.push(row);return row;
 }
 const root=add(leftRoot,rightRoot);
 const summary=status=>({format:'ProofAtlasScopeComparison/1',status,shift,pairs:rows.length,pairLimit,peakPending,rangeUpdates});
 function difference(row,reason,depthChoice){
  const result={...summary('different'),reason,leftNode:row.i,rightNode:row.j};
  if(depthChoice){
   result.depthRange={minimum:row.minimum,maximum:row.maximum};
   const slots=[];let current=row,pathLength=0;
   while(current!==root){
    const parent=current[depthChoice+'Parent'];demand(parent,'reachable endpoint witness');
    pathLength++;if(pathLength<=512)slots.push(parent.slot);current=parent.row;
   }
   slots.reverse();
   result.witness=pathLength<=512?{status:'located',slots,binders:row[depthChoice==='min'?'minimum':'maximum']}:
    {status:'unavailable',reason:'selection-path-bound',pathLength,pathLimit:512};
  }
  return result;
 }
 // Child pairs are coupled by the original ordered constructor fields.
 // Building this finite graph never expands occurrence paths.
 for(let cursor=0;cursor<rows.length;cursor++){
  peakPending=Math.max(peakPending,rows.length-cursor);
  const row=rows[cursor],{i,j}=row,k=left.kind[i],other=right.kind[j];
  demand(natural(k)&&k<12&&natural(other)&&other<12,'Expr constructor');
  for(const [graph,node,kind]of [[left,i,k],[right,j,other]]){
   const children=graph.children[node],arity=(A.fields[A.kinds[kind]]||[]).length;
   demand(Array.isArray(children)&&children.length===arity,'ordered constructor arity');
   demand(children.every(child=>natural(child)&&child<node),'postorder child');
   demand(graph.payloads[node]&&typeof graph.payloads[node]==='object','payload');
   if(kind===0)demand(natural(graph.payloads[node].index),'variable index');
  }
  if(k!==other)return difference(row,'constructor');
  if(k!==0&&A.payloadKey(k,left.payloads[i])!==A.payloadKey(other,right.payloads[j]))return difference(row,'payload');
  for(let slot=0;slot<left.children[i].length;slot++){
   const child=add(left.children[i][slot],right.children[j][slot]);
   if(!child)return{...summary('unavailable'),reason:'paired-row-budget'};
   row.edges.push({child,slot,increment:binds(k,slot)?1:0});
  }
 }
 // A child has a strictly smaller left row, hence descending row order
 // visits every parent before any child. All incoming ranges are final
 // before a row propagates them; no depth-indexed worklist is needed.
 root.minimum=0;root.maximum=0;
 const ordered=rows.slice().sort((a,b)=>b.i-a.i||b.j-a.j);
 for(const row of ordered){
  demand(natural(row.minimum)&&natural(row.maximum)&&row.minimum<=row.maximum,'reachable depth range');
  maximumLocalDepth=Math.max(maximumLocalDepth,row.maximum);
  if(left.kind[row.i]===0){
   const i=left.payloads[row.i].index,j=right.payloads[row.j].index;
   if(shift===0){if(i!==j)return difference(row,'variable-index','min');}
   else if(j===i){if(row.minimum<=i)return difference(row,'unshifted-external-reference','min');}
   else if(Number.isSafeInteger(i+shift)&&j===i+shift){
    if(row.maximum>i)return difference(row,'shifted-local-reference','max');
   }else return difference(row,'variable-index','min');
  }
  for(const edge of row.edges){
   const minimum=row.minimum+edge.increment,maximum=row.maximum+edge.increment;
   if(minimum<edge.child.minimum){edge.child.minimum=minimum;edge.child.minParent={row,slot:edge.slot};rangeUpdates++;}
   if(maximum>edge.child.maximum){edge.child.maximum=maximum;edge.child.maxParent={row,slot:edge.slot};rangeUpdates++;}
  }
 }
 const result={...summary('same'),maximumLocalDepth};
 if(options.includeCertificate){
  const postorder=ordered.slice().reverse(),ids=new Map(postorder.map((row,index)=>[row,index]));
  result.certificate={format:'ProofAtlasScopeCertificate/1',root:ids.get(root),rows:postorder.map(row=>({
   left:row.i,right:row.j,minimum:row.minimum,maximum:row.maximum,children:row.edges.map(edge=>ids.get(edge.child))
  }))};
 }
 return result;
}

module.exports={compare};
