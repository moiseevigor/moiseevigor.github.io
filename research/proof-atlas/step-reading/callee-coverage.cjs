// Census of maximal application occurrences and a separate recorded proof-role sample.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const {gunzipSync} = require('node:zlib');
const {createHash} = require('node:crypto');
const atlas = require('../../../public/js/proof-atlas-library-data');
const {spine} = require('../../../public/js/proof-atlas-elimination');
const union = require('../recorded-union.cjs');
const typing = require('../../../public/js/proof-atlas-deep-context');
global.window={};
require('../../../public/data/proof-atlas/library-manifest');
require('../../../public/data/proof-atlas/goedel-sample-manifest');
const expandedIndex=process.argv.includes('--all-bodies');
const reader=require('../../../public/data/proof-atlas/callee-parameter-uses.json');

function census(edition){
  const owners=new Map(edition.declarations.map(r=>[r.name,r]));
  const indexed=new Map(reader.records.map(r=>[r.name,r.indexSha256]));
  const counts={}, outside=new Map();
  const parameters=new Map();
  if(expandedIndex && edition.id===reader.edition){
    for(let i=0;i<16;i++){
      const shard=require('../../../public/data/proof-atlas/callee-uses/'+i.toString(16)+'.json');
      assert.equal(shard.edition,edition.id);
      for(const record of shard.records){
        assert.equal(record.indexSha256[0],i.toString(16));
        assert.equal(record.indexSha256,owners.get(record.name).indexSha256);
        assert(!parameters.has(record.name));
        parameters.set(record.name,record.parameters);
      }
    }
    assert.equal(parameters.size,edition.declarations.filter(r=>r.bodyAvailable).length);
  }
  let localInputSlots=0n,matchedSlots=0n,usedSlots=0n;
  function record(term,id,weight){
    const {head,args}=spine(term,id);
    let category='nonconstant';
    if(atlas.kinds[term.kind[head]]==='const'){
      const name=term.payloads[head].name, owner=owners.get(name);
      if(owner){
        assert.deepEqual(term.payloads[head].nameParts,name.split('.').map(str=>({str})));
        category=owner.bodyAvailable?'bodyAvailable':'declarationOnly';
        if(parameters.has(name)){
          category='indexedBody';
          const bound=parameters.get(name).slice(0,args.length);
          localInputSlots+=BigInt(args.length)*weight;
          matchedSlots+=BigInt(bound.length)*weight;
          usedSlots+=BigInt(bound.filter(p=>p.count>0).length)*weight;
        }
        if(reader.edition===edition.id && owner.indexSha256===indexed.get(name))category='indexedBody';
      }else{
        category='outsideEdition';
        outside.set(name,(outside.get(name)||0n)+weight);
      }
    }
    counts[category]=(counts[category]||0n)+weight;
  }
  return {record,localCount:()=>(counts.bodyAvailable||0n)+(counts.indexedBody||0n),report:()=>({counts,...(expandedIndex?{localInputSlots,matchedSlots,usedSlots}:{}),distinctExternalNames:outside.size,
    leadingExternalNames:[...outside].sort((a,b)=>a[1]===b[1]?a[0].localeCompare(b[0]):a[1]>b[1]?-1:1).slice(0,10)})};
}

async function measure(edition,profiles){
  const all=census(edition), recordedProofResults=census(edition);
  const declarations=edition.declarations.filter(r=>r.bodyAvailable && r.kind==='theorem');
  let endpoints=0n,hasLocalBody=0;
  for(const owner of declarations){
    const bytes=gunzipSync(fs.readFileSync('.'+owner.indexFile));
    assert.equal(createHash('sha256').update(bytes).digest('hex'),owner.indexSha256);
    const term=atlas.validateIndex(JSON.parse(bytes),owner);
    const root=term.roots[1],visits=Array(root+1).fill(0n),prefixes=Array(root+1).fill(0n);
    visits[root]=1n;
    const localBefore=all.localCount();
    for(let id=root;id>=0;id--){
      if(!visits[id])continue;
      const app=atlas.kinds[term.kind[id]]==='app';
      if(app && visits[id]>prefixes[id]){
        const weight=visits[id]-prefixes[id];
        all.record(term,id,weight);endpoints+=weight;
      }
      term.children[id].forEach((child,slot)=>{
        visits[child]+=visits[id];
        if(app && slot===0)prefixes[child]+=visits[id];
      });
    }
    if(all.localCount()>localBefore)hasLocalBody++;
    const profile=profiles.find(p=>p.edition===edition.id && p.record.indexSha256===owner.indexSha256);
    if(profile){
      const {case:c}=await union.open(profile);
      for(const e of c.entries){
        if(e.role==='proof' && e.route.root===1 && typing.construction(e,c.data)?.rule==='Pi-application'){
          recordedProofResults.record(term,e.node,1n);
        }
      }
    }
  }
  assert.equal(Object.values(all.report().counts).reduce((a,b)=>a+b,0n),endpoints);
  return {edition:edition.id,theoremBodies:declarations.length,bodiesCallingAvailableBody:hasLocalBody,
    endpoints,all:all.report(),recordedProofResults:recordedProofResults.report()};
}
(async()=>{
  const profiles=union.inventory();
  const results=[];
  for(const edition of [window.PROOF_ATLAS_LIBRARY.editions.find(e=>e.id==='published-15'),window.PROOF_ATLAS_AI_SAMPLE.edition]){
    results.push(await measure(edition,profiles));
  }
  const se2=require('./se2-call-widths.json'),ai=require('./ai-call-widths.json');
  assert.deepEqual(results.map(r=>String(r.endpoints)),[se2.endpointCount,ai.endpointCount]);
  console.log(JSON.stringify(results,(_,v)=>typeof v==='bigint'?String(v):v,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
