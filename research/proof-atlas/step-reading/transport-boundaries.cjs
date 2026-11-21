// Count maximal Eq.ndrec spines in proof bodies; cross-check shared and unfolded counts.
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {gunzipSync}=require('node:zlib'),{createHash}=require('node:crypto');
const atlas=require('../../../public/js/proof-atlas-library-data');
const {spine}=require('../../../public/js/proof-atlas-elimination');
global.window={};
require('../../../public/data/proof-atlas/goedel-sample-manifest');
const edition=window.PROOF_ATLAS_AI_SAMPLE.edition;
const signature=JSON.parse(gunzipSync(fs.readFileSync('public/data/proof-atlas/ai-wide-signatures.json.gz')))
  .find(s=>s.name==='Eq.ndrec');
const declared=signature.parameters.length;
const histogram={},records=[];
function add(counts,k,n){counts[k]=(counts[k]||0n)+n;}
for(const owner of edition.declarations.filter(d=>d.kind==='theorem'&&d.bodyAvailable)){
  const bytes=gunzipSync(fs.readFileSync('.'+owner.indexFile));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),owner.indexSha256);
  const term=atlas.validateIndex(JSON.parse(bytes),owner),root=term.roots[1];
  const isTransport=term.kind.map((k,i)=>k===4 && term.payloads[i].name===signature.name);
  const counts={},rows={},examples={};
  const visits=Array(root+1).fill(0n),fnEdges=Array(root+1).fill(0n);
  visits[root]=1n;
  for(let id=root;id>=0;id--){
    if(!visits[id])continue;
    const weight=visits[id]-fnEdges[id];
    if(weight && (term.kind[id]===5 || isTransport[id])){
      const {head,args}=spine(term,id);
      if(isTransport[head]){
        add(counts,args.length,weight);
        rows[args.length]=(rows[args.length]||0)+1;
      }
    }
    term.children[id].forEach((child,slot)=>{
      visits[child]+=visits[id];
      if(term.kind[id]===5 && slot===0)fnEdges[child]+=visits[id];
    });
  }
  const expanded={},path=[],parents=[];
  function walk(node,width){
    if(isTransport[node]){
      add(expanded,width,1n);
      if(width>declared){
        const slots=path.slice(0,path.length-width);
        const endpoint=parents[slots.length];
        const prefix=slots.concat(Array(width-declared).fill(0));
        assert.equal(atlas.walk(term,{root:1,slots}),endpoint);
        (examples[width]??=[]).push({slots:slots.join(''),node:endpoint,returnedNode:atlas.walk(term,{root:1,slots:prefix})});
      }
    }
    parents.push(node);
    const children=term.children[node];
    for(let slot=0;slot<children.length;slot++){
      path.push(slot);
      walk(children[slot],term.kind[node]===5&&slot===0?width+1:0);
      path.pop();
    }
    parents.pop();
  }
  walk(root,0);
  assert.deepEqual(counts,expanded);
  for(const [width,count] of Object.entries(counts))add(histogram,width,count);
  records.push({name:owner.name,indexSha256:owner.indexSha256,counts,distinctRows:rows,examples});
}
console.log(JSON.stringify({edition:edition.id,declared,histogram,records},(_,v)=>typeof v==='bigint'?String(v):v,2));
