// Size of a recursively folded proof body, with one selectable marker per visible transport.
'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const {gunzipSync}=require('node:zlib');
const {createHash}=require('node:crypto');
const atlas=require('../../../public/js/proof-atlas-library-data');
const {spine}=require('../../../public/js/proof-atlas-elimination');

function measure(data){
 const root=data.roots[1],visible=Array(root+1).fill(0n),all=Array(root+1).fill(0n);
 const folded=new Set(),sizes=[];
 all[root]=visible[root]=1n;
 let rawRows=0,keptRows=0,total=0n,kept=0n,eligible=0n,markers=0n,hidden=0n;
 for(let id=root;id>=0;id--){
  if(!all[id])continue;
  const children=data.children[id];
  if(data.kind[id]===5){
   const {head,args}=spine(data,id),p=data.payloads[head];
   if(data.kind[head]===4 && ['Eq.mp','Eq.mpr'].includes(p.name) && args.length===4 && args[0]===args[1]){
    assert.deepEqual(p.nameParts,[{str:'Eq'},{str:p.name.slice(3)}]);
    folded.add(id);eligible+=all[id];
   }
  }
  total+=all[id];kept+=visible[id];rawRows++;
  if(visible[id])keptRows++;
  for(const child of children)all[child]+=all[id];
  if(folded.has(id)){
   markers+=visible[id];
   hidden+=visible[id]*BigInt(data.expanded[children[0]]);
   visible[children[1]]+=visible[id];
  }else for(const child of children)visible[child]+=visible[id];
 }
 // Check the same retained size by adding child sizes upwards, independently of visit weights.
 for(let id=0;id<=root;id++){
  if(!all[id])continue;
  const children=data.children[id];
  sizes[id]=folded.has(id)?1n+sizes[children[1]]:children.reduce((s,c)=>s+sizes[c],1n);
 }
 assert.equal(total,BigInt(data.expanded[root]));
 assert.equal(kept,sizes[root]);
 assert.equal(total-kept,hidden);
 return {rawRows,keptRows,total,kept,eligible,markers};
}

// Syntactic accounting control: the same inner transport occurs once in a hidden
// equality branch and again as the visible input. This fixture makes no typing claim.
{
 const data={kind:[],payloads:[],children:[],expanded:[],roots:[]};
 const add=(kind,payload,children=[])=>{
  const id=data.kind.length;
  data.kind.push(kind);data.payloads.push(payload);data.children.push(children);
  data.expanded.push(String(children.reduce((n,c)=>n+BigInt(data.expanded[c]),1n)));
  return id;
 };
 const head=add(4,{name:'Eq.mpr',nameParts:[{str:'Eq'},{str:'mpr'}]});
 const type=add(4,{name:'A'}),term=add(4,{name:'x'}),proof=add(4,{name:'h'});
 const cast=(e,x)=>[type,type,e,x].reduce((fn,arg)=>add(5,{},[fn,arg]),head);
 const inner=cast(proof,term),outer=cast(inner,inner);
 data.roots=[type,outer];
 const sample=measure(data);
 assert.equal(sample.eligible,3n);assert.equal(sample.markers,2n);
 assert.equal(sample.kept,3n);assert.equal(sample.keptRows,3);
}
const window={};
for(const file of ['library-manifest','goedel-sample-manifest']){
 vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+file+'.js','utf8'),{window});
}
const editions=[window.PROOF_ATLAS_LIBRARY.editions.find(e=>e.id==='published-15'),window.PROOF_ATLAS_AI_SAMPLE.edition];
for(const edition of editions){
 const records=edition.declarations.filter(r=>r.kind==='theorem' && r.bodyAvailable);
 const totals={rawRows:0,keptRows:0,total:0n,kept:0n,eligible:0n,markers:0n};
 let affected=0;
 const retention=[];
 for(const record of records){
  const raw=gunzipSync(fs.readFileSync('.'+record.indexFile));
  assert.equal(createHash('sha256').update(raw).digest('hex'),record.indexSha256);
  const data=atlas.validateIndex(JSON.parse(raw),record),counts=measure(data);
  if(counts.eligible)affected++;
  for(const k of Object.keys(totals))totals[k]+=counts[k];
  retention.push(Number(1000000n*counts.kept/counts.total)/10000);
  if(record.name==='JacobiData.slope_bound_abs')console.log(record.name,counts);
 }
 retention.sort((a,b)=>a-b);
 const mid=Math.floor(retention.length/2);
 console.log(edition.id,{proofs:records.length,affected,...totals,medianRetainedPercent:(retention[mid]+retention[Math.floor((retention.length-1)/2)])/2});
}
