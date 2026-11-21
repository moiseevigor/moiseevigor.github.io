/* Follow constructor fields only. Each returned suffix is relative to this occurrence. */
(function(host){
 'use strict';
 function match(data,node){
  function inputs(id,name,width){
   const args=[];
   for(let i=0;i<width;i++){
    if(data.kind[id]!==5)return;
    args.unshift(data.children[id][1]);
    id=data.children[id][0];
   }
   if(data.kind[id]===4 && data.payloads?.[id]?.name===name)return args;
  }
  const direct=inputs(node,'And.intro',4);
  if(direct)return {kind:'introduction',left:[0,1],right:[1]};
  const outer=inputs(node,'of_eq_true',2);
  if(!outer)return;
  const clauses=inputs(outer[0],'And',2);
  const chain=inputs(outer[1],'Eq.trans',6);
  if(!clauses || !chain || chain[1]!==outer[0] || data.payloads?.[chain[3]]?.name!=='True')return;
  const replacement=inputs(chain[2],'And',2);
  const pair=inputs(chain[4],'congr',8);
  const finish=inputs(chain[5],'and_self',1);
  if(!replacement || !pair || !finish || finish[0]!==chain[3] ||
     replacement.some(x=>x!==chain[3]) || pair[4]!==clauses[1] || pair[5]!==chain[3])return;
  const left=inputs(pair[6],'congrArg',6);
  if(!left || data.payloads?.[left[4]]?.name!=='And' || left[2]!==clauses[0] || left[3]!==chain[3])return;
  return {kind:'rewrite',left:[1,0,1,0,1,1],right:[1,0,1,1]};
 }
 if(typeof module!=='undefined'&&module.exports)module.exports=match;
 else host.ProofAtlasConjunction=match;
})(typeof window==='undefined'?globalThis:window);
