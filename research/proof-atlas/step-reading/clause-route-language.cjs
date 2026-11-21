// A state accepts a projection address at its terminal and/or continues by field slot.
// The terminal stores the number of fields to ascend to the receiving application.
'use strict';
function compile(group){
 const root={children:new Map()};
 for(const {use,target} of [group,...group.additional||[]]){
  if(!use.path.startsWith(target.path))throw Error('Receiver is outside occurrence ancestry');
  let state=root;
  for(const slot of use.path){
   if(!state.children.has(slot))state.children.set(slot,{children:new Map()});
   state=state.children.get(slot);
  }
  if(state.up!==undefined)throw Error('Duplicate occurrence');
  state.up=use.path.length-target.path.length;
 }
 const states=[],ids=new Map();
 function intern(state){
  const edges=[...state.children].sort(([a],[b])=>Number(a)-Number(b)).map(([s,c])=>[Number(s),intern(c)]);
  const row=[state.up??-1,...edges.flat()],key=JSON.stringify(row);
  if(ids.has(key))return ids.get(key);
  const id=states.length;states.push(row);ids.set(key,id);return id;
 }
 return {root:intern(root),states};
}
function index({root,states}){
 const weights=[];
 for(const [id,row] of states.entries()){
  let count=BigInt(row[0]>=0);
  for(let i=2;i<row.length;i+=2){
   if(row[i]>=id || row[i]<0)throw Error('Expected a bottom-up acyclic graph');
   count+=weights[row[i]];
  }
  weights.push(count);
 }
 function select(rank){
  if(typeof rank!=='bigint'||rank<0n||rank>=weights[root])throw RangeError('Occurrence rank');
  let path='',id=root;
  for(;;){
   const row=states[id];
   if(row[0]>=0){
    if(rank===0n)return {use:path,target:path.slice(0,path.length-row[0])};
    rank--;
   }
   for(let i=1;i<row.length;i+=2){
    const child=row[i+1];
    if(rank<weights[child]){path+=row[i];id=child;break;}
    rank-=weights[child];
   }
  }
 }
 function rankOf(path){
  let id=root,rank=0n;
  for(const slot of path){
   const row=states[id];
   if(row[0]>=0)rank++;
   let child;
   for(let i=1;i<row.length;i+=2){
    if(String(row[i])===slot){child=row[i+1];break;}
    rank+=weights[row[i+1]];
   }
   if(child===undefined)return null;
   id=child;
  }
  return states[id][0]>=0?rank:null;
 }
 return {total:weights[root],select,rankOf};
}
module.exports={compile,index};
