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
  let completeCalls = 0, proofPorts = 0, wideCalls = 0;
  for (const item of union.inventory().filter(i=>i.edition==='goedel-sample-4331')) {
    await measure(item,null,(inputs,n)=>{
      completeCalls++;
      if (n>5) wideCalls++;
      const layouts=layoutsFor(Array.from({length:n},(_,i)=>i+1));
      for (const input of inputs.filter(p=>p.role==='proof')) {
        proofPorts++;
        layouts.forEach((ports,i)=>{
          if (ports.includes(input.position)) visibleProofPorts[i]++;
          else if (layouts[0].includes(input.position)) lostVersusCurrent[i]++;
        });
      }
    });
  }
  return {completeCalls,wideCalls,proofPorts,lostVersusCurrent:Object.fromEntries(policies.map((p,i)=>[p,lostVersusCurrent[i]])),visibleProofPorts:Object.fromEntries(policies.map((p,i)=>[p,visibleProofPorts[i]]))};
}
compareRecordedCalls().then(recorded=>console.log(JSON.stringify({calls,occurrences,groups,totals,recorded,perHead:Object.fromEntries(perHead)},null,2)))
  .catch(error=>{console.error(error);process.exitCode=1;});
