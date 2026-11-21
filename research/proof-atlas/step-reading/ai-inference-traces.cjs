// Measure which observed maximal calls expose two proof inputs and an immediate destination.
'use strict';
const assert = require('node:assert/strict');
const union = require('../recorded-union.cjs');
const typing = require('../../../public/js/proof-atlas-deep-context');
const atlas = require('../../../public/js/proof-atlas-library-data');
const packed = require('../../../public/js/proof-atlas-packed-routes');
const {spine} = require('../../../public/js/proof-atlas-elimination');

const {measure:countDestinations} = require('./call-destinations.cjs');

function countMatchingRoutes(graph,recordedRows) {
  // Independent bottom-up count: a matching function child is a partial call here.
  const copies = [];
  for (let id=0; id<=graph.roots[1]; id++) {
    let total = recordedRows.has(id) ? 1n : 0n;
    for (const child of graph.children[id]) total += copies[child];
    if (graph.kind[id]===5 && recordedRows.has(graph.children[id][0])) total--;
    copies.push(total);
  }
  return copies[graph.roots[1]];
}

async function measure(item, uncovered) {
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
  const recordedRows = new Set();
  for (const stage of stages.values()) {
    const route = stage.slots;
    const parent = route.length ? walk(route.slice(0,-1)) : null;
    if (parent !== null && graph.kind[parent] === 5 && route.at(-1) === 0) continue;
    maximal++;
    recordedRows.add(stage.node);
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
  const population = countDestinations(graph,graph.roots[1],recordedRows,(id,uses)=>{
    if (!uncovered || recordedRows.has(id)) return;
    const {head} = spine(graph,id);
    const headName = graph.kind[head]===4 ? graph.payloads[head].name : atlas.kinds[graph.kind[head]];
    uncovered.push({declaration:item.record.name,id,uses,headName,open:graph.neededScope[id]>0});
  });
  const matchingRoutes = countMatchingRoutes(graph,recordedRows);
  assert.equal(matchingRoutes,population.copiesOfRecordedRows ?? 0n);
  assert(BigInt(maximal) <= matchingRoutes);
  const coverage = {allRoutes:String(population.maximal), allRows:population.rows,
    recordedRows:recordedRows.size, routesWithRecordedRow:String(matchingRoutes)};
  return {coverage,declaration:item.record.name,indexSha256:item.record.indexSha256,maximal,complete,twoPremises,twoExplicit,example};
}
(async()=>{
  const rows=[];
  const uncovered = process.argv.includes('--concentration') ? [] : null;
  for(const item of union.inventory().filter(item=>item.edition==='goedel-sample-4331')) rows.push(await measure(item,uncovered));
  if (!uncovered) return console.log(JSON.stringify(rows,null,2));
  uncovered.sort((a,b)=>a.uses>b.uses?-1:a.uses<b.uses?1:0);
  const total = uncovered.reduce((sum,r)=>sum+r.uses,0n);
  assert.equal(total,rows.reduce((sum,r)=>sum+BigInt(r.coverage.allRoutes)-BigInt(r.coverage.routesWithRecordedRow),0n));
  const thresholds = [];
  let cumulative = 0n, openUses = 0n;
  const targets=[50,90,99,100];
  for (const [index,row] of uncovered.entries()) {
    cumulative += row.uses;
    if (row.open) openUses += row.uses;
    while (targets.length && 100n*cumulative >= BigInt(targets[0])*total) {
      thresholds.push({percent:targets.shift(), rows:index+1, occurrences:String(cumulative), openOccurrences:String(openUses)});
    }
  }
  const peak = uncovered[0];
  const half = uncovered.slice(0,thresholds[0].rows);
  const halfDeclarations = [...new Set(half.map(row=>row.declaration))];
  for (const item of union.inventory().filter(i=>i.edition==='goedel-sample-4331' && halfDeclarations.includes(i.record.name))) {
    const selected=half.filter(row=>row.declaration===item.record.name);
    const profile=(await union.open(item)).case;
    assert.equal(countMatchingRoutes(profile.data,new Set(selected.map(row=>row.id))),selected.reduce((sum,row)=>sum+row.uses,0n));
  }
  const halfHeads = [...new Set(half.map(row=>row.headName))];
  console.log(JSON.stringify({unrecordedRows:uncovered.length, occurrences:String(total), thresholds, halfDeclarations, halfHeads,
    mostFrequent:{...peak,uses:String(peak.uses)}},null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
