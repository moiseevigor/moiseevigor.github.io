// Count homogeneous equalities in proof bodies, retaining multiplicity of shared rows.
'use strict';
const fs = require('node:fs');
const {gunzipSync} = require('node:zlib');
const {createHash} = require('node:crypto');
const assert = require('node:assert/strict');
const atlas = require('../../../public/js/proof-atlas-library-data');
const {spine} = require('../../../public/js/proof-atlas-elimination');
const window = {};
require('node:vm').runInNewContext(fs.readFileSync('public/data/proof-atlas/goedel-sample-manifest.js','utf8'),{window});
const {exactCallInputs,equalitySegments,firstStructuralDifference} = require('../../../public/js/proof-atlas-omitted-references');
const differences = {constructor:0n,payload:0n,identical:0n,limit:0n};
let belowRoot = 0n, maxDepth = 0;
function reference(data,left,right) {
  if (left===right) return null;
  const k=data.kind[left];
  if (k!==data.kind[right]) return {left,right,status:'constructor',slots:[]};
  if (atlas.payloadKey(k,data.payloads[left])!==atlas.payloadKey(k,data.payloads[right]))
    return {left,right,status:'payload',slots:[]};
  for (const [slot,child] of data.children[left].entries()) {
    const hit=reference(data,child,data.children[right][slot]);
    if (hit) return {...hit,slots:[slot,...hit.slots]};
  }
  return null;
}
// Two unary chains postpone the only mismatch beyond the comparison budget.
const chains={kind:[0,0],children:[[],[]],payloads:[{index:0},{index:1}]};
for (let i=2;i<1028;i++) {
  chains.kind.push(10);
  chains.children.push([i-2]);
  chains.payloads.push({});
}
assert.deepEqual(firstStructuralDifference(chains,1026,1027),{status:'limit'});
assert.deepEqual(firstStructuralDifference(chains,1026,1026),{status:'identical'});
// Independent slot control with differences in all three fields of the nested call.
{
  const data={kind:[4],payloads:[{name:'Eq.trans'}],children:[[]],roots:[]};
  for(let i=1;i<=8;i++){data.kind.push(9);data.payloads.push({value:String(i)});data.children.push([]);}
  function apply(args){
    let fn=0;
    for(const arg of args){
      data.kind.push(5);data.payloads.push({});data.children.push([fn,arg]);fn=data.kind.length-1;
    }
    return fn;
  }
  const inner=apply([2,3,4,5,7,8]);
  const outer=apply([1,2,3,4,inner,8]);data.roots.push(outer);
  const parts=exactCallInputs(data,{node:outer,route:{root:0,slots:[]}},'Eq.trans',6);
  const {mismatches}=equalitySegments(data,parts)[0];
  assert.deepEqual(mismatches.map(m=>[m.field,atlas.walk(data,m.outerSite.route),atlas.walk(data,m.nestedSite.route)]),
    [['carrier',1,2],['start',2,3],['end',3,5]]);
}
const requests=[];
const {index:rowOccurrences}=require('../../../public/js/proof-atlas-row-occurrences');
const mismatchLabels=new Map();
let nested=0n,maximum=0,boundaries=0n;
let transCalls=0n, transRows=0, transProofs=0;
let equalities = 0n, shared = 0n, affected = 0;
for (const record of window.PROOF_ATLAS_AI_SAMPLE.edition.declarations) {
  const bytes = gunzipSync(fs.readFileSync('.'+record.indexFile));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),record.indexSha256);
  const data = atlas.validateIndex(JSON.parse(bytes),record);
  const routes=atlas.routes(data);
  let chainsHere=0n;
  const visits = Array(data.kind.length).fill(0n);
  visits[data.roots[1]] = 1n;
  let total = 0n, pairs = 0n, same = 0n;
  for (let row = visits.length-1; row >= 0; row--) {
    const count = visits[row];
    if (!count) continue;
    total += count;
    for (const child of data.children[row]) visits[child] += count;
    if (data.kind[row] !== 5) continue;
    const {head,args} = spine(data,row);
    if (data.kind[head]===4 && data.payloads[head].name==='Eq.trans') {
      const at={node:row,route:routes.route(row)};
      const inputs=exactCallInputs(data,at,'Eq.trans',6);
      if(args.length===6){
        assert.deepEqual(inputs.map(input=>atlas.walk(data,input.route)),args);
        assert.deepEqual(inputs.map(input=>input.node),args);
        const segments=equalitySegments(data,inputs);
        function checkSegment(start,end,proof){
          const inner=spine(data,proof);
          if(data.payloads[inner.head].name==='Eq.trans' && inner.args.length===6 &&
            inner.args[0]===args[0] && inner.args[1]===start && inner.args[3]===end){
            return [...checkSegment(start,inner.args[2],inner.args[4]),...checkSegment(inner.args[2],end,inner.args[5])];
          }
          return [[start,end,proof]];
        }
        const expected=[...checkSegment(args[1],args[2],args[4]),...checkSegment(args[2],args[3],args[5])];
        assert.deepEqual(segments.map(s=>[s.start,s.end,s.proof].map(a=>atlas.walk(data,a.route))),expected);
        if(segments.length>2){
          nested+=count;
          const folded=equalitySegments(data,inputs,2);
          assert.deepEqual(folded.map(s=>s.proof),inputs.slice(4));
          assert(folded.some(s=>s.boundary==='display limit'));
        }
        if(segments.some(s=>s.mismatches) && process.argv[2]==='--conversion-requests'){
          assert.equal(at.route.root,1);
          const occurrences=rowOccurrences(data,row,at.route);
          assert.equal(occurrences.total,count);
          for(let ordinal=1n;ordinal<=count;ordinal++){
            const call={node:row,route:occurrences.select(ordinal)};
            const parts=equalitySegments(data,exactCallInputs(data,call,'Eq.trans',6));
            for(const part of parts) for(const m of part.mismatches??[])
              requests.push({name:record.name,indexSha256:record.indexSha256,call,field:m.field,
                outer:m.outer,nested:m.nested});
          }
        }
        if(segments.some(s=>s.boundary))boundaries+=count;
        for(const segment of segments){
          for(const m of segment.mismatches??[]){
            const actual=reference(data,m.outer.node,m.nested.node);
            for(const [base,site,node] of [[m.outer,m.outerSite,actual.left],[m.nested,m.nestedSite,actual.right]]){
              assert.deepEqual(site.route,{root:base.route.root,slots:base.route.slots.concat(actual.slots)});
              assert.equal(atlas.walk(data,site.route),node);
            }
            const names=[actual.left,actual.right].map(id=>data.payloads[spine(data,id).head].name);
            const key=[m.field,...names].join(' / ');
            mismatchLabels.set(key,(mismatchLabels.get(key)??0n)+count);
          }
        }
        maximum=Math.max(maximum,segments.length);
        chainsHere+=count;
        transRows++;
      }else assert.equal(inputs,null);
    }
    if (args.length !== 3 || data.kind[head] !== 4 || data.payloads[head].name !== 'Eq') continue;
    pairs += count;
    if (args[1] === args[2]) same += count;
    else {
      const hit=firstStructuralDifference(data,args[1],args[2]);
      differences[hit.status]+=count;
      if (hit.status==='limit') continue;
      assert.deepEqual(hit,reference(data,args[1],args[2])??{status:'identical'});
      if (hit.slots?.length) {
        belowRoot+=count;
        maxDepth=Math.max(maxDepth,hit.slots.length);
      }
    }
  }
  assert.equal(total,BigInt(data.expanded[data.roots[1]]));
  transCalls+=chainsHere;
  if(chainsHere)transProofs++;
  equalities += pairs;
  shared += same;
  if (same) affected++;
  console.log(record.name,String(pairs),String(same));
}
console.log('Equality occurrences:',String(equalities),'with identical operand rows:',String(shared),'in proofs:',affected);
console.log('Different operand rows:',differences,'below root:',String(belowRoot),'maximum field depth:',maxDepth);
console.log('Eq.trans calls:',String(transCalls),'distinct rows:',transRows,'proofs:',transProofs);
console.log('Expanded chains:',String(nested),'maximum steps:',maximum,'calls with boundaries:',String(boundaries));
for(const [pair,count] of mismatchLabels) console.log(pair,String(count));
if(process.argv[2]==='--conversion-requests') fs.writeFileSync(process.argv[3],JSON.stringify(requests));
