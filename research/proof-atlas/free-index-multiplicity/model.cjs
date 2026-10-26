/* Source-syntax multiplicities over an already authenticated, validated Expr DAG. */
'use strict';
const limits=Object.freeze({sourceNodes:262144,queryRows:262144,coefficientCells:65536,decimalDigits:524288});
const arity=[0,0,0,0,0,2,2,2,3,0,1,1];
const natural=n=>Number.isSafeInteger(n)&&n>=0;
const demand=(value,message)=>{if(!value)throw Error('Free-index multiplicity: '+message);};
const binds=(kind,slot)=>(kind===6||kind===7)&&slot===1||kind===8&&slot===2;
function evaluate(data,input,options={}){
 const bound={...limits,...options};
 demand(Object.keys(options).every(k=>Object.hasOwn(limits,k)),'unknown bound');
 for(const k of Object.keys(limits))demand(natural(bound[k])&&bound[k]>0&&bound[k]<=limits[k],k+' bound');
 const n=data?.kind?.length;
 demand(natural(n)&&n>0&&n<=bound.sourceNodes&&data.children?.length===n&&data.payloads?.length===n&&data.neededScope?.length===n,'source shape/bound');
 demand(Array.isArray(input)&&input.length<=bound.queryRows,'query bound');
 const requested=new Map(),rows=[],keys=new Set();
 for(const q of input){
  demand(q&&Object.keys(q).sort().join(',')==='index,node'&&natural(q.node)&&q.node<n&&natural(q.index)&&q.index<Number.MAX_SAFE_INTEGER,'query source/index');
  const key=q.node+':'+q.index;demand(!keys.has(key),'duplicate query');keys.add(key);
  const i=rows.length;rows.push({node:q.node,index:q.index,status:'unavailable',count:null,reason:'not-evaluated'});
  if(!requested.has(q.node))requested.set(q.node,[]);requested.get(q.node).push(i);
 }
 const stats={sourceNodes:n,reachableNodes:0,evaluatedNodes:0,indexBytes:0,pendingSlots:0,queryRows:rows.length,peakCoefficientCells:0,peakDecimalDigits:0,peakTables:0,resultCells:0,resultDigits:0};
 const finish=(reason=null,stoppedAt=null)=>Object.freeze({format:'ProofAtlasFreeIndexMultiplicity/1',algorithm:'free-index-live-frontier/1',status:rows.every(r=>r.status==='complete')?'complete':rows.some(r=>r.status==='complete')?'partial':'unavailable',limits:Object.freeze(bound),stats:Object.freeze({...stats}),...(reason?{reason,stoppedAt}:{}),rows:Object.freeze(rows.map(r=>Object.freeze(r))),scope:'Exact expanded source-syntax counts, conditional on authenticated validated source. Coefficient-table and output units include the live scratch table; source storage, index structures and JavaScript object/temporary overhead are separate. No typing or logical-necessity judgment.'});
 if(!rows.length)return finish();
 const reachable=new Uint8Array(n),users=new Uint32Array(n),pending=new Array(n),todo=[];
 stats.indexBytes=reachable.byteLength+users.byteLength;stats.pendingSlots=n;
 for(const node of requested.keys()){if(!reachable[node]){reachable[node]=1;todo.push(node);}}
 while(todo.length){
  const node=todo.pop(),kind=data.kind[node],children=data.children[node];
  demand(natural(kind)&&kind<arity.length&&Array.isArray(children)&&children.length===arity[kind]&&natural(data.neededScope[node]),'reachable constructor');
  if(kind===0)demand(natural(data.payloads[node]?.index)&&data.payloads[node].index<Number.MAX_SAFE_INTEGER,'bound-variable index');
  stats.reachableNodes++;
  for(const child of children){demand(natural(child)&&child<node,'postorder source fields');users[child]++;if(!reachable[child]){reachable[child]=1;todo.push(child);}}
 }
 let tableCells=0,tableDigits=0,tableCount=0;
 function peak(scratchCells=0,scratchDigits=0){stats.peakCoefficientCells=Math.max(stats.peakCoefficientCells,tableCells+scratchCells+stats.resultCells);stats.peakDecimalDigits=Math.max(stats.peakDecimalDigits,tableDigits+scratchDigits+stats.resultDigits);stats.peakTables=Math.max(stats.peakTables,tableCount+Number(scratchCells>0));}
 function release(node){const h=pending[node];if(!h)return;tableCells-=h.values.size;tableDigits-=h.digits;tableCount--;pending[node]=null;}
 function refusal(reason,node){for(const row of rows)if(row.status!=='complete')row.reason=reason;return finish(reason,node);}
 for(let node=0;node<n;node++){
  if(!reachable[node])continue;
  const values=new Map(),kind=data.kind[node],children=data.children[node];let scratchDigits=0,failure=null;
  function add(index,count){
   const old=values.get(index),next=(old||0n)+count,addedDigits=next.toString().length-(old?old.toString().length:0),newCell=Number(old===undefined);
   if(tableCells+values.size+stats.resultCells+newCell>bound.coefficientCells){failure='coefficient-cell-bound';return;}
   if(tableDigits+scratchDigits+stats.resultDigits+addedDigits>bound.decimalDigits){failure='decimal-digit-bound';return;}
   values.set(index,next);scratchDigits+=addedDigits;peak(values.size,scratchDigits);
  }
  if(kind===0)add(data.payloads[node].index,1n);
  else for(const [slot,child]of children.entries()){
   for(const [index,count]of pending[child]?.values||[]){if(binds(kind,slot)&&index===0)continue;add(index-Number(binds(kind,slot)),count);if(failure)break;}
   if(failure)break;
  }
  if(failure)return refusal(failure,node);
  let scope=0;for(const index of values.keys())scope=Math.max(scope,index+1);demand(scope===data.neededScope[node],'free-index scope metadata differs');
  if(values.size){pending[node]={values,digits:scratchDigits};tableCells+=values.size;tableDigits+=scratchDigits;tableCount++;}
  stats.evaluatedNodes++;
  for(const i of requested.get(node)||[]){
   const row=rows[i],count=String(values.get(row.index)||0n);
   if(tableCells+stats.resultCells+1>bound.coefficientCells)return refusal('coefficient-cell-bound',node);
   if(tableDigits+stats.resultDigits+count.length>bound.decimalDigits)return refusal('decimal-digit-bound',node);
   rows[i]={node:row.node,index:row.index,status:'complete',count};stats.resultCells++;stats.resultDigits+=count.length;peak();
  }
  for(const child of children){demand(users[child]>0,'remaining source edge');if(--users[child]===0)release(child);}
  if(users[node]===0)release(node);
 }
 demand(rows.every(r=>r.status==='complete')&&tableCells===0&&tableDigits===0,'complete result/frontier release');
 return finish();
}
module.exports={evaluate,limits};
