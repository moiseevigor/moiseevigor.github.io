// Intern identical lexical-depth/count profiles. Counts remain decimal integers.
function pack(index){
 const byNode=new Map();
 for(const [key,count] of Object.entries(index.weights)){
  const [node,depth]=key.split('/').map(Number);
  if(!byNode.has(node))byNode.set(node,[]);
  byNode.get(node).push([depth,count]);
 }
 const profiles=[],interned=new Map(),rows=[];
 let previous=0;
 for(const [node,profile] of [...byNode].sort((a,b)=>a[0]-b[0])){
  profile.sort((a,b)=>a[0]-b[0]);
  const key=JSON.stringify(profile);
  if(!interned.has(key)){interned.set(key,profiles.length);profiles.push(profile);}
  rows.push([node-previous,interned.get(key)]);previous=node;
 }
 const {indexSha256,cutoff,binders}=index;
 return {format:'ScopedWeightProfiles/1',indexSha256,cutoff,binders,profiles,rows};
}

function open(packed){
 if(packed.format!=='ScopedWeightProfiles/1')throw Error('Unknown weight profile format');
 const nodes=[],profileIds=[];
 let id=0;
 for(const [delta,profile] of packed.rows){
  id+=delta;
  if(!Number.isSafeInteger(delta)||delta<0||(nodes.length&&delta===0)||!Number.isSafeInteger(id)||
     !Number.isInteger(profile)||profile<0||profile>=packed.profiles.length)throw Error('Malformed weight row');
  nodes.push(id);profileIds.push(profile);
 }
 function weightAt(node,depth){
  let lo=0,hi=nodes.length;
  while(lo<hi){const mid=Math.floor((lo+hi)/2);if(nodes[mid]<node)lo=mid+1;else hi=mid;}
  if(nodes[lo]!==node)return 0n;
  const entry=packed.profiles[profileIds[lo]].find(([k])=>k===depth);
  return entry?BigInt(entry[1]):0n;
 }
 return {indexSha256:packed.indexSha256,binders:packed.binders,cutoff:packed.cutoff,weightAt};
}
module.exports={pack,open};
