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

// Keep one visible occurrence at the boundary of each outermost selected maximal call.
function foldSize(graph, selected, root = graph.roots[1]) {
  const visits = Array(root+1).fill(0n), prefixes = Array(root+1).fill(0n);
  let visible = 0n, boundaries = 0n, hidden = 0n;
  visits[root] = 1n;
  for (let id=root; id>=0; id--) {
    const reached = visits[id];
    if (!reached) continue;
    const folded = selected.has(id) ? reached-prefixes[id] : 0n;
    visible += reached;
    boundaries += folded;
    hidden += folded*(BigInt(graph.expanded[id])-1n);
    for (const [slot,child] of graph.children[id].entries()) {
      visits[child] += reached-folded;
      if (graph.kind[id]===5 && slot===0) prefixes[child] += reached-folded;
    }
  }
  const full = BigInt(graph.expanded[root]);
  assert.equal(visible+hidden,full);
  // Count the same visible tree from the leaves. A function child remains expanded.
  const sizes = [];
  for (let id=0; id<=root; id++) {
    let size = 1n;
    for (const [slot,child] of graph.children[id].entries()) {
      const partial = graph.kind[id]===5 && slot===0;
      size += selected.has(child) && !partial ? 1n : sizes[child];
    }
    sizes.push(size);
  }
  assert.equal(visible,selected.has(root) ? 1n : sizes[root]);
  return {full,visible,boundaries,hidden,visibleAt:id=>selected.has(id) ? 1n : sizes[id]};
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
  const repeatedRows = new Set();
  let repeatedOccurrences=0n, recordedRepeated=0, reusedProofCalls=0, explicitProofReuse=0;
  const repeatedRolePairs={};
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
    if(new Set(call.args).size < call.args.length) recordedRepeated++;
    const repeatedProofs=new Set(), repeatedExplicitProofs=new Set();
    for(const [i,first] of inputs.entries()){
      for(const second of inputs.slice(i+1)){
        const arg=call.args[first.position-1];
        if(arg!==call.args[second.position-1])continue;
        const roles=[first.role,second.role].sort().join('/');
        repeatedRolePairs[roles]=(repeatedRolePairs[roles]??0)+1;
        if(roles==='proof/proof'){
          repeatedProofs.add(arg);
          if(first.binderInfo==='default' && second.binderInfo==='default') repeatedExplicitProofs.add(arg);
        }
      }
    }
    if(repeatedProofs.size)reusedProofCalls++;
    if(repeatedExplicitProofs.size)explicitProofReuse++;
    const premises = inputs.reverse().filter(input=>input.role==='proof' && input.statement);
    if (premises.length < 2) continue;
    twoPremises++;
    if (premises.filter(input=>input.binderInfo==='default').length < 2) continue;
    twoExplicit++;
    if (!example && parent !== null) example = {node:stage.node,route,head:graph.payloads[call.head],premises,
      destination:{node:parent,route:route.slice(0,-1),field:atlas.fields[atlas.kinds[graph.kind[parent]]][route.at(-1)]}};
  }
  const population = countDestinations(graph,graph.roots[1],recordedRows,(id,uses)=>{
    const {head,args} = spine(graph,id);
    if(new Set(args).size < args.length){
      repeatedRows.add(id);
      repeatedOccurrences+=uses;
    }
    if (!uncovered || recordedRows.has(id)) return;
    const headName = graph.kind[head]===4 ? graph.payloads[head].name : atlas.kinds[graph.kind[head]];
    uncovered.push({declaration:item.record.name,id,uses,headName,open:graph.neededScope[id]>0});
  });
  assert.equal(countMatchingRoutes(graph,repeatedRows),repeatedOccurrences);
  const matchingRoutes = countMatchingRoutes(graph,recordedRows);
  assert.equal(matchingRoutes,population.copiesOfRecordedRows ?? 0n);
  assert(BigInt(maximal) <= matchingRoutes);
  const coverage = {allRoutes:String(population.maximal), allRows:population.rows,
    recordedRows:recordedRows.size, routesWithRecordedRow:String(matchingRoutes)};
  const repetition={rows:repeatedRows.size,occurrences:String(repeatedOccurrences),recordedRepeated,reusedProofCalls,explicitProofReuse,repeatedRolePairs};
  return {coverage,repetition,declaration:item.record.name,indexSha256:item.record.indexSha256,maximal,complete,twoPremises,twoExplicit,example};
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
  const argumentGroups={}, affectedDeclarations=new Set(), checkedArguments=new Set();
  let largestReduction=null;
  const observedCalls={total:0,insideFold:0};
  const folded={full:0n,visible:0n,boundaries:0n,hidden:0n};
  for (const item of union.inventory().filter(i=>i.edition==='goedel-sample-4331')) {
    const selected=half.filter(row=>row.declaration===item.record.name);
    const profile=(await union.open(item)).case;
    const ids=new Set(selected.map(row=>row.id));
    const size=foldSize(profile.data,ids);
    for (const entry of profile.entries) {
      if (entry.route.root!==1 || typing.construction(entry,profile.data)?.rule!=='Pi-application') continue;
      const path=packed.parse(entry.route);
      let id=profile.data.roots[1], partial=false, inside=false;
      for (let depth=0; depth<entry.route.depth; depth++) {
        if (!partial && ids.has(id)) inside=true;
        const slot=(path[depth>>2] >> (2*(depth%4))) & 3;
        partial=profile.data.kind[id]===5 && slot===0;
        id=profile.data.children[id][slot];
      }
      assert.equal(id,entry.node);
      if (!partial) {
        // Recover the native judgment of every supplied argument from this exact call.
        let stage=entry, route=entry.route;
        while (true) {
          const construction=typing.construction(stage,profile.data);
          assert.equal(construction.rule,'Pi-application');
          const premise=construction.premises[1], graph=profile.data;
          const [fn,arg]=graph.children[stage.node];
          assert.equal(arg,premise.node);
          const mode=stage.typeData.payloads[construction.components.pi].binderInfo;
          const key=mode+'/'+premise.role;
          const group=argumentGroups[key] ||= {slots:0,affected:0,foldedRoot:0};
          group.slots++;
          const shown=size.visibleAt(arg), original=BigInt(graph.expanded[arg]);
          assert(shown<=original);
          if (shown<original) {
            group.affected++;
            if (ids.has(arg)) group.foldedRoot++;
            affectedDeclarations.add(item.record.name);
            const identity=item.record.indexSha256+'/'+arg;
            if (!checkedArguments.has(identity)) {
              assert.equal(shown,foldSize(graph,ids,arg).visible);
              checkedArguments.add(identity);
            }
            if (!largestReduction || original-shown>largestReduction.hidden) {
              largestReduction={proof:item.record.name,indexSha256:item.record.indexSha256,arg,
                route:packed.append(route,[1]),statement:premise.typeText,original,shown,hidden:original-shown};
            }
          }
          if (graph.kind[fn]!==5) break;
          route=packed.append(route,[0]);
          stage=profile.get(route);
          assert.equal(stage.node,fn);
        }
        observedCalls.total++;
        if (inside) observedCalls.insideFold++;
      }
    }
    for (const key of Object.keys(folded)) folded[key]+=size[key];
    assert.equal(countMatchingRoutes(profile.data,ids),selected.reduce((sum,row)=>sum+row.uses,0n));
  }
  assert.equal(observedCalls.total,rows.reduce((sum,row)=>sum+row.maximal,0));
  const halfHeads = [...new Set(half.map(row=>row.headName))];
  console.log(JSON.stringify({unrecordedRows:uncovered.length, occurrences:String(total), thresholds, halfDeclarations, halfHeads, folded, observedCalls, argumentGroups, affectedDeclarations:[...affectedDeclarations], largestReduction,
    mostFrequent:{...peak,uses:String(peak.uses)}},(_,v)=>typeof v==='bigint'?String(v):v,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
