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
const {parameterContext,exactCallInputs,equalitySegments,firstStructuralDifference} = require('../../../public/js/proof-atlas-omitted-references');
require('node:vm').runInNewContext(fs.readFileSync('public/data/proof-atlas/type-notation-catalog.js','utf8'),{window});
const contextShapes=new Map();
const contexts={operators:0n,identity:0n,unsupported:0n};
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
const congrFunctions=new Map();
let congrCalls=0n,congrProofs=0;
let transCalls=0n, transRows=0, transProofs=0;
let equalities = 0n, shared = 0n, affected = 0;
const published=process.argv.includes('--published-contexts');
let records=window.PROOF_ATLAS_AI_SAMPLE.edition.declarations;
if(published){
  require('node:vm').runInNewContext(fs.readFileSync('public/data/proof-atlas/library-manifest.js','utf8'),{window});
  records=window.PROOF_ATLAS_LIBRARY.editions.find(e=>e.id==='published-15').declarations
    .filter(r=>r.kind==='theorem' && r.bodyAvailable);
}
console.log('Theorem bodies:',records.length);
const missing=new Map();
for (const record of records) {
  const bytes = gunzipSync(fs.readFileSync('.'+record.indexFile));
  assert.equal(createHash('sha256').update(bytes).digest('hex'),record.indexSha256);
  const data = atlas.validateIndex(JSON.parse(bytes),record);
  const routes=atlas.routes(data);
  let congrHere=0n,chainsHere=0n;
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
    if(data.kind[head]===4 && data.payloads[head].name==='congrArg' && args.length===6){
      const inputs=exactCallInputs(data,{node:row,route:routes.route(row)},'congrArg',6);
      assert.deepEqual(inputs.map(a=>atlas.walk(data,a.route)),args);
      const fn=inputs[4];
      let key=atlas.kinds[data.kind[fn.node]];
      if(key==='lam'){
        const body=data.children[fn.node][1],counter=require('../../../public/js/proof-atlas-recursive-inputs').countReferences;
        const opts={useSupport:false,maxStates:4096},refs=counter(data,body,0,opts);
        // Count against the expanded body with a lexical stack, independently of the DAG counter.
        let total=0n;
        const repeatedPaths=[],path=[];
        function visit(node,depth){
          const kind=data.kind[node];
          if(kind===0 && data.payloads[node].index===depth){
            total++;
            if(refs.status==='counted' && BigInt(refs.occurrences)>1n)repeatedPaths.push(path.slice());
          }
          data.children[node].forEach((child,slot)=>{
            const binds=((kind===6||kind===7)&&slot===1)||(kind===8&&slot===2);
            path.push(slot);visit(child,depth+Number(binds));path.pop();
          });
        }
        visit(body,0);
        assert.equal(refs.occurrences,total.toString());
        for(const [i,slots] of repeatedPaths.entries()){
          const witness=counter(data,body,0,{...opts,ordinal:BigInt(i+1)}).witness;
          assert.deepEqual(witness.slots,slots);
          const route={root:fn.route.root,slots:fn.route.slots.concat(1,slots)};
          assert.equal(atlas.walk(data,route),witness.node);
          assert.deepEqual(atlas.binding(data,route),fn);
        }
        key+=' '+(refs.occurrences??refs.status);
        if(refs.status==='counted' && refs.occurrences!=='0'){
          const use=counter(data,body,0,{...opts,ordinal:1n}).witness;
          const route={root:fn.route.root,slots:fn.route.slots.concat(1,use.slots)};
          assert.equal(atlas.walk(data,route),use.node);
          assert.deepEqual(atlas.binding(data,route),fn);
          const at={node:body,route:{root:fn.route.root,slots:fn.route.slots.concat(1)}};
          if(refs.occurrences==='1'){
            const frames=parameterContext(data,window.PROOF_ATLAS_TYPE_NOTATION,at,{node:use.node,route});
            const category=frames?(frames.length?'operators':'identity'):'unsupported';
            if(published && category!=='operators' && !contexts[category])
              console.log(category+' example:',record.name,row);
            contexts[category]+=count;
            if(!frames){
              const path=[];
              let from={node:use.node,route};
              while(from.route.slots.length>at.route.slots.length){
                const dest=require('../../../public/js/proof-atlas-omitted-references').resultDestination(data,from);
                const call=dest.call;
                path.push(call?call.label+'['+call.slot+'/'+call.arity+']':dest.kind+'.'+dest.field);
                from=call?call.call:dest.at;
              }
              const name=path.join(' → ');
              missing.set(name,(missing.get(name)??0n)+count);
            }
            if(frames){
              const shape=frames.map(f=>f.glyph+'['+(f.operands.indexOf(null)+1)+']').join(' → ');
              contextShapes.set(shape,(contextShapes.get(shape)??0n)+count);
              let path=at.route.slots.slice(),row=body;
              for(const f of frames.slice().reverse()){
                while(data.kind[row]===10){row=data.children[row][0];path.push(0);}
                assert.deepEqual(f.call,{node:row,route:{root:route.root,slots:path}});
                const {head,args}=spine(data,row);
                const op=window.PROOF_ATLAS_TYPE_NOTATION.entries.find(e=>e.name===data.payloads[head].name);
                assert.equal(f.operands.filter(a=>a===null).length,1);
                for(const [i,slot] of op.visibleSlots.entries()){
                  const childPath=path.concat(Array(args.length-1-slot).fill(0),1);
                  if(f.operands[i])assert.deepEqual(f.operands[i],{node:args[slot],route:{root:route.root,slots:childPath}});
                }
                const slot=op.visibleSlots[f.operands.indexOf(null)];
                row=args[slot];path=path.concat(Array(args.length-1-slot).fill(0),1);
              }
              while(data.kind[row]===10){row=data.children[row][0];path.push(0);}
              assert.equal(row,use.node);assert.deepEqual(path,route.slots);
            }
          }
        }
      }
      congrFunctions.set(key,(congrFunctions.get(key)??0n)+count);
      congrHere+=count;
    }
    if(published)continue;
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
  congrCalls+=congrHere;
  if(congrHere)congrProofs++;
  transCalls+=chainsHere;
  if(chainsHere)transProofs++;
  equalities += pairs;
  shared += same;
  if (same) affected++;
  if(!published)console.log(record.name,String(pairs),String(same));
}
if(!published){
  console.log('Equality occurrences:',String(equalities),'with identical operand rows:',String(shared),'in proofs:',affected);
  console.log('Different operand rows:',differences,'below root:',String(belowRoot),'maximum field depth:',maxDepth);
  console.log('Eq.trans calls:',String(transCalls),'distinct rows:',transRows,'proofs:',transProofs);
  console.log('Expanded chains:',String(nested),'maximum steps:',maximum,'calls with boundaries:',String(boundaries));
  for(const [pair,count] of mismatchLabels) console.log(pair,String(count));
  if(process.argv[2]==='--conversion-requests') fs.writeFileSync(process.argv[3],JSON.stringify(requests));
}
console.log('congrArg calls:',String(congrCalls),'proofs:',congrProofs,'function forms:',Object.fromEntries(congrFunctions));
console.log('Single-use lambda contexts:',contexts);
console.log('Context shapes:',Object.fromEntries(contextShapes));
console.log('Unsupported paths:',Object.fromEntries(missing));
