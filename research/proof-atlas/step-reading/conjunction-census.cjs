/* Run from the site root. Inspect one compiled index at a time. */
'use strict';
const fs=require('node:fs'),assert=require('node:assert/strict');
const {gunzipSync}=require('node:zlib'),{createHash}=require('node:crypto');
const A=require('../../../public/js/proof-atlas-library-data');
const match=require('../../../public/js/proof-atlas-conjunction');
const {spine}=require('../../../public/js/proof-atlas-elimination');
global.window={};
require('../../../public/data/proof-atlas/library-manifest');
require('../../../public/data/proof-atlas/goedel-sample-manifest');

function census(edition){
 const rules=Object.fromEntries(['introduction','rewrite'].map(k=>[k,{owners:0,rows:0,occurrences:0n}]));
 const conclusions=[];
 const declarations=edition.declarations.filter(d=>d.kind==='theorem'&&d.bodyAvailable);
 for(const d of declarations){
  const raw=gunzipSync(fs.readFileSync('.'+d.indexFile));
  assert.equal(createHash('sha256').update(raw).digest('hex'),d.indexSha256);
  const g=A.validateIndex(JSON.parse(raw),d);
  const [type,body]=g.roots;
  const weights=Array(body+1).fill(0n);
  weights[body]=1n;
  const hits=new Map();
  const perOwner={introduction:0n,rewrite:0n};
  let expanded=0n;
  for(let i=body;i>=0;i--){
   if(!weights[i])continue;
   expanded+=weights[i];
   const m=match(g,i);
   if(m){
    rules[m.kind].rows++;
    rules[m.kind].occurrences+=weights[i];
    hits.set(i,m.kind);
    perOwner[m.kind]+=weights[i];
   }
   for(const c of g.children[i]){
    assert(c<i);
    weights[c]+=weights[i];
   }
  }
  assert.equal(expanded,BigInt(d.proofOccurrences));
  for(const [k,count] of Object.entries(perOwner)){
   if(!count)continue;
   rules[k].owners++;
   const subtotals=[];
   for(let i=0;i<=body;i++){
    let total=hits.get(i)===k?1n:0n;
    for(const child of g.children[i])total+=subtotals[child];
    subtotals.push(total);
   }
   assert.equal(subtotals[body],count);
   if(count>(rules[k].largest?.occurrences??0n)){
    rules[k].largest={name:d.name,occurrences:count,
     rows:[...hits.values()].filter(rule=>rule===k).length};
   }
  }
  let target=type;
  while(g.kind[target]===7)target=g.children[target][1];
  const statement=spine(g,target);
  if(statement.args.length!==2 || g.payloads[statement.head]?.name!=='And')continue;
  let core=body;
  const slots=[];
  while(g.kind[core]===6 || g.kind[core]===8){
   const slot=g.kind[core]===6?1:2;
   slots.push(slot);core=g.children[core][slot];
  }
  const head=spine(g,core).head;
  conclusions.push({name:d.name,indexSha256:d.indexSha256,node:core,slots:slots.join(''),
   rule:match(g,core)?.kind??null,head:g.payloads[head]?.name??A.kinds[g.kind[head]]});
 }
 return {edition:edition.id,theorems:declarations.length,rules,literalConjunctionConclusions:conclusions};
}

const editions=[...window.PROOF_ATLAS_LIBRARY.editions,window.PROOF_ATLAS_AI_SAMPLE.edition];
console.log(JSON.stringify(editions.map(census),(_,v)=>typeof v==='bigint'?String(v):v,2));
