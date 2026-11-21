// Measure which observed maximal calls expose two proof inputs and an immediate destination.
'use strict';
const assert = require('node:assert/strict');
const union = require('../recorded-union.cjs');
const typing = require('../../../public/js/proof-atlas-deep-context');
const atlas = require('../../../public/js/proof-atlas-library-data');
const packed = require('../../../public/js/proof-atlas-packed-routes');
const {spine} = require('../../../public/js/proof-atlas-elimination');

async function measure(item) {
  const profile = (await union.open(item)).case;
  const graph = profile.data;
  const stages = new Map();
  const walk = slots => atlas.walk(graph, {root:1, slots});
  for (const entry of profile.entries) {
    if (entry.route.root !== 1) continue;
    const construction = typing.construction(entry, graph);
    if (construction?.rule !== 'Pi-application') continue;
    const bytes = packed.parse(entry.route);
    const slots = Array.from({length:entry.route.depth}, (_,i) => (bytes[i>>2] >> (2*(i%4))) & 3);
    assert.equal(walk(slots), entry.node);
    const key = slots.join('.');
    assert(!stages.has(key));
    const binderInfo = entry.typeData.payloads[construction.components.pi].binderInfo;
    assert(['default','implicit','strictImplicit','instImplicit'].includes(binderInfo));
    stages.set(key, {slots, node:entry.node, binderInfo, premise:construction.premises[1]});
  }
  let maximal = 0, complete = 0, twoPremises = 0, twoExplicit = 0, example;
  for (const stage of stages.values()) {
    const route = stage.slots;
    const parent = route.length ? walk(route.slice(0,-1)) : null;
    if (parent !== null && graph.kind[parent] === 5 && route.at(-1) === 0) continue;
    maximal++;
    const call = spine(graph,stage.node);
    const inputs = [];
    let address = route.slice();
    for (let i=call.args.length-1; i>=0; i--) {
      const slot = stages.get(address.join('.'));
      if (slot) {
        assert.equal(slot.premise.node,call.args[i]);
        assert.equal(walk([...address,1]),call.args[i]);
        inputs.push({position:i+1, role:slot.premise.role, binderInfo:slot.binderInfo, statement:slot.premise.typeText, route:[...address,1]});
      }
      address.push(0);
    }
    if (inputs.length !== call.args.length) continue;
    complete++;
    const premises = inputs.reverse().filter(input=>input.role==='proof' && input.statement);
    if (premises.length < 2) continue;
    twoPremises++;
    if (premises.filter(input=>input.binderInfo==='default').length < 2) continue;
    twoExplicit++;
    if (!example && parent !== null) example = {node:stage.node,route,head:graph.payloads[call.head],premises,
      destination:{node:parent,route:route.slice(0,-1),field:atlas.fields[atlas.kinds[graph.kind[parent]]][route.at(-1)]}};
  }
  return {declaration:item.record.name,indexSha256:item.record.indexSha256,maximal,complete,twoPremises,twoExplicit,example};
}
(async()=>{
  const rows=[];
  for(const item of union.inventory().filter(item=>item.edition==='goedel-sample-4331')) rows.push(await measure(item));
  console.log(JSON.stringify(rows,null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
