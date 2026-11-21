// Measure root-port visibility with the production geometry builder.
// Input: the complete JSON from check-repeated-proof-parameters.cjs.
'use strict';
const fs = require('node:fs');
const assert = require('node:assert/strict');
const crypto = require('node:crypto');
const library = require('../../../public/js/proof-atlas-library-data');
const geometry = require('../../../public/js/proof-atlas-geometry-core');
const union = require('../recorded-union.cjs');

function layoutsFor(slots) {
  return [slots.slice(0,5), slots.slice(-5), slots.length<=5 ? slots : slots.slice(0,2).concat(slots.slice(-3))];
}

const report = JSON.parse(fs.readFileSync(0, 'utf8'));
const policies = ['current', 'lastFive', 'firstTwoLastThree'];
const totals = Object.fromEntries(policies.map(name => [name, {all:0, partial:0, none:0, allWeighted:0}]));
let groups = 0, calls = 0, occurrences = 0;
const perHead = new Map();
for (const item of union.inventory().filter(i => i.edition === 'goedel-sample-4331')) {
  const hits = report.hits.filter(h => h.proof === item.record.name);
  if (!hits.length) continue;
  const bytes = union.raw(item.record.indexFile);
  assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),item.record.indexSha256);
  const graph = library.validateIndex(JSON.parse(bytes),item.record);
  for (const hit of hits) {
    assert.equal(hit.indexSha256,item.record.indexSha256);
    const scene = geometry.create(graph,item.record,{route:hit.route,foldApplications:true,foldBinders:true});
    const root = scene.nodes[0];
    assert.equal(root.node,hit.node);
    assert(root.spineComplete);
    assert.equal(graph.payloads[root.head.node].name,hit.head);
    const slots = root.arguments.map(arg => arg.position);
    const visible = root.arguments.filter((arg,i) => root.regions[i+1].displayed).map(arg => arg.position);
    const edges = scene.edges.filter(e => e.from === root.id && e.relation === 'application-argument');
    assert.deepEqual(edges.map(e => e.to),visible.map(slot => root.arguments[slot-1].path));
    assert.deepEqual(visible,slots.slice(0,5));
    const layouts = layoutsFor(slots);
    const last=geometry.create(graph,item.record,{route:hit.route,foldApplications:true,foldBinders:true,rootArgumentOffset:'last'});
    assert(geometry.validate(last,graph,item.record));
    const drawn=last.edges.filter(e=>e.from===root.id && e.relation==='application-argument');
    assert.deepEqual(drawn.map(e=>e.to),layouts[1].map(slot=>root.arguments[slot-1].path));
    assert.equal(last.stats.represented,scene.stats.represented);
    const weight = Number(hit.weight);
    assert(Number.isSafeInteger(weight));
    calls++;
    occurrences+=weight;
    for (const [arg,positions] of hit.repeated) {
      groups++;
      for (const pos of positions) assert.equal(library.walk(graph,root.arguments[pos-1].route),arg);
      for (const [i,layout] of layouts.entries()) {
        assert.equal(layout.length,visible.length);
        const shown = positions.filter(p => layout.includes(p)).length;
        const status = shown===positions.length ? 'all' : shown ? 'partial' : 'none';
        const counts = totals[policies[i]];
        counts[status]++;
        if (status==='all') counts.allWeighted+=weight;
        if (i===0) {
          if (!perHead.has(hit.head)) perHead.set(hit.head,{all:0,partial:0,none:0});
          perHead.get(hit.head)[status]++;
        }
      }
    }
  }
}
assert.equal(calls,report.matchedRows);
assert.equal(String(occurrences),report.matchedOccurrences);
async function compareRecordedCalls() {
  const {measure} = require('./ai-inference-traces.cjs');
  const visibleProofPorts = [0,0,0];
  const lostVersusCurrent = [0,0,0];
  const declarations=[], hiddenInputs=[];
  let unrestrictedBest = 0;
  let completeCalls = 0, proofPorts = 0, wideCalls = 0;
  for (const item of union.inventory().filter(i=>i.edition==='goedel-sample-4331')) {
    const tally={proof:item.record.name, calls:0, first:0, last:0, best:0};
    declarations.push(tally);
    await measure(item,null,(inputs,n)=>{
      tally.calls++;
      const proofInputs=inputs.filter(p=>p.role==='proof');
      const width=Math.min(n,5);
      unrestrictedBest+=Math.min(width,proofInputs.length);
      const offsets=Array.from({length:n-width+1},(_,offset)=>offset);
      const scores=offsets.map(offset=>proofInputs.filter(p=>p.position>offset && p.position<=offset+width).length);
      tally.first+=scores[0];
      tally.last+=scores.at(-1);
      tally.best+=Math.max(...scores);
      completeCalls++;
      if (n>5) wideCalls++;
      const layouts=layoutsFor(Array.from({length:n},(_,i)=>i+1));
      for (const input of proofInputs) {
        if (!layouts[1].includes(input.position)) {
          let offset=n-width, moves=0;
          while(offset>=input.position) {offset=Math.max(0,offset-width);moves++;}
          assert(input.position>offset && input.position<=offset+width);
          hiddenInputs.push({proof:item.record.name,indexSha256:item.record.indexSha256,arity:n,slot:input.position,
            route:input.route,statement:input.statement,binderInfo:input.binderInfo,earlierMoves:moves});
        }
        proofPorts++;
        layouts.forEach((ports,i)=>{
          if (ports.includes(input.position)) visibleProofPorts[i]++;
          else if (layouts[0].includes(input.position)) lostVersusCurrent[i]++;
        });
      }
    });
  }
  for (const item of union.inventory().filter(i=>i.edition==='goedel-sample-4331')) {
    const hidden=hiddenInputs.filter(h=>h.proof===item.record.name);
    if (!hidden.length) continue;
    const bytes=union.raw(item.record.indexFile);
    assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),item.record.indexSha256);
    const graph=library.validateIndex(JSON.parse(bytes),item.record);
    for (const h of hidden) {
      const suffix=Array(h.arity-h.slot).fill(0).concat(1);
      assert.deepEqual(h.route.slice(-suffix.length),suffix);
      const route={root:1,slots:h.route.slice(0,-suffix.length)};
      let offset='last';
      for (let move=0;move<=h.earlierMoves;move++) {
        const scene=geometry.create(graph,item.record,{route,foldApplications:true,rootArgumentOffset:offset});
        const root=scene.nodes[0];
        const arg=root.arguments[h.slot-1];
        assert.equal(root.arguments.length,h.arity);
        assert.deepEqual(arg.route.slots,h.route);
        const drawn=scene.edges.some(e=>e.from===root.id && e.to===arg.path);
        assert.equal(drawn,move===h.earlierMoves);
        offset=Math.max(0,(scene.rootArgumentOffset||0)-5);
        h.callHead=graph.payloads[root.head.node].name || library.kinds[graph.kind[root.head.node]];
      }
    }
  }
  return {completeCalls,wideCalls,proofPorts,unrestrictedBest,declarations,hiddenInputs,lostVersusCurrent:Object.fromEntries(policies.map((p,i)=>[p,lostVersusCurrent[i]])),visibleProofPorts:Object.fromEntries(policies.map((p,i)=>[p,visibleProofPorts[i]]))};
}
compareRecordedCalls().then(recorded=>console.log(JSON.stringify({calls,occurrences,groups,totals,recorded,perHead:Object.fromEntries(perHead)},null,2)))
  .catch(error=>{console.error(error);process.exitCode=1;});
