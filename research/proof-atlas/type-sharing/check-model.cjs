/* Finite type-sharing checks. The oracle walks constructor occurrences rather
 * than using the runtime support scan or its lexical-environment routine. */
'use strict';
const fs = require('fs'), path = require('path'), z = require('zlib');
const assert = require('assert/strict'), crypto = require('crypto'), vm = require('vm');
process.chdir(path.resolve(__dirname, '../../..'));
const SH = require('../../../public/js/proof-atlas-type-sharing');
const Q = require('../../../public/js/proof-atlas-application-paged-provider');
const A = require('../../../public/js/proof-atlas-library-data');
const copy = x => JSON.parse(JSON.stringify(x));
const sha = x => crypto.createHash('sha256').update(x).digest('hex');
const read = file => JSON.parse(z.gunzipSync(fs.readFileSync(file)));
const tuple = (g, n) => [g.kind[n], g.children[n], g.payloads[n], g.expanded[n], g.neededScope[n]];
const binds = (kind, slot) => (kind === 6 || kind === 7) ? slot === 1 : kind === 8 && slot === 2;
const nodes = root => [root, ...root.children.flatMap(c => nodes(c.value))];
const report = {format:'ProofAtlasTypeSharingModel/1', status:'RUNNING',
  nativeProfiles:[], roots:0, availableFamilies:0, useAssignments:0,
  relativeSelections:0, originalSelections:0, roundTrips:0, refusals:[], requests:0,
  wholeArchiveRequests:0, scope:'Finite constructor/path and lexical-assignment checks. No new typing judgment, semantic equality, global use inventory or total-heap bound.'};

// This oracle retains (row, depth) states and performs its own lexical traversal.
// It is deliberately independent of dependencyScan's intrinsic-set recurrence.
function freeIndices(g, root) {
  const todo = [[root, 0]], seen = new Set(), refs = new Set();
  while (todo.length) {
    const [id, depth] = todo.pop(), key = id + ':' + depth;
    if (seen.has(key)) continue;
    assert(seen.size < 2097152, 'oracle work bound'); seen.add(key);
    if (g.kind[id] === 0 && g.payloads[id].index >= depth)
      refs.add(g.payloads[id].index - depth);
    g.children[id].forEach((c, s) => todo.push([c, depth + Number(binds(g.kind[id], s))]));
  }
  return [...refs].sort((a, b) => a - b);
}
function walk(g, root, slots) {
  for (const slot of slots) { assert(slot < g.children[root].length); root = g.children[root][slot]; }
  return root;
}
function at(base, node, slots) { return {namespace:base.namespace,
  evidenceSha256:base.evidenceSha256,sourceIndexSha256:base.sourceIndexSha256,
  query:copy(base.query),input:base.input,component:base.component,
  node, route:{root:base.component, slots:copy(slots)}}; }
function environment(g, root, slots, context, address) {
  const result = copy(context), prefix = [];
  for (const slot of slots) {
    if (binds(g.kind[root], slot)) result.push({
      name:g.payloads[root].binderName || g.payloads[root].declName || '_',
      address:at(address, root, prefix)
    });
    prefix.push(slot); root = g.children[root][slot];
  }
  return result;
}
function owner(g, root, context = []) {
  const source = {edition:'authored-untyped-control', name:'Control', indexSha256:'1'.repeat(64), sourceSha256:'2'.repeat(64)};
  return {read:async id => copy(tuple(g, id)), nodeCount:g.kind.length, root, context,
    owner:{namespace:'application-ports', evidenceSha256:'3'.repeat(64),
      sourceIndexSha256:source.indexSha256, typeTableSha256:sha(JSON.stringify(g)), source,
      query:{root:1, slots:[]}, input:'0:1', component:'producerType'}};
}
function graph() { return Object.fromEntries(['kind','children','payloads','expanded','neededScope'].map(f => [f, []])); }
function add(g, kind, payload, children = []) {
  const id = g.kind.length; g.kind.push(kind); g.payloads.push(payload); g.children.push(children);
  g.expanded.push(String(1n + children.reduce((s, c) => s + BigInt(g.expanded[c]), 0n)));
  g.neededScope.push(kind === 0 ? payload.index + 1 : Math.max(0, ...children.map((c, s) => g.neededScope[c] - Number(binds(kind, s)))));
  return id;
}
function context(n) {
  const source = owner(graph(), 0).owner.source;
  return Array.from({length:n}, (_, i) => ({name:'same', address:{namespace:'source-expression',
    name:source.name,indexSha256:source.indexSha256,sourceSha256:source.sourceSha256,
    node:i,route:{root:1,slots:Array(i).fill(1)}}}));
}
async function refuse(label, task, pattern) {
  await assert.rejects(task, pattern); report.refusals.push(label);
}
async function checkScene(session, scene, g, root, context, address) {
  assert(scene.base.stats.nodes <= 192); assert(scene.display.stats.nodes <= scene.base.stats.nodes);
  assert.equal(BigInt(scene.display.stats.retained) + BigInt(scene.display.stats.hidden), BigInt(g.expanded[scene.base.root.origin.node]));
  for (const n of nodes(scene.display.root)) {
    const actual = await session.resolveBase(n.slots);
    assert.deepEqual(actual, at(address, walk(g, root, n.slots), n.slots)); report.originalSelections++;
  }
  if (scene.family?.status !== 'available') return;
  report.availableFamilies++;
  assert.deepEqual(SH.recover(scene.display), scene.base); report.roundTrips++;
  const family = scene.family;
  assert.deepEqual(family.ports, freeIndices(g, family.row));
  for (const [i, use] of family.uses.entries()) {
    assert.equal(walk(g, root, use.address.route.slots), family.row);
    const env = environment(g, root, use.address.route.slots, context, address);
    assert.equal(use.contextLength, env.length);
    assert.deepEqual(use.assignments, family.ports.map(index => ({index,parameter:'v'+index,
      ordinal:env.length-1-index,name:env[env.length-1-index].name,address:env[env.length-1-index].address})));
    report.useAssignments++;
    for (const n of nodes(family.shape.root)) {
      const slots = [...use.address.route.slots, ...n.slots];
      assert.deepEqual(await session.resolvePattern(n.slots, i), at(address, walk(g, root, slots), slots));
      report.relativeSelections++;
    }
  }
  const state = session.state();
  assert.equal(state.completeTableArraysAllocated, 0);
  for (const d of [state.base, state.pattern].filter(Boolean)) {
    assert(d.cachedRows <= 4096 && d.decodedRowBytes <= 2097152 && d.currentObjects <= 192);
  }
}
async function synthetic() {
  const g = graph(), t = add(g,4,{name:'T',levels:[]}), v0 = add(g,0,{index:0}), v2 = add(g,0,{index:2});
  const pair = add(g,5,{},[v0,v2]); let root = pair;
  // Five disjoint uses: a four-use page must leave an exact fifth occurrence.
  for (let i=0;i<4;i++) root=add(g,7,{binderName:'same',binderInfo:'default'},[pair,root]);
  const cfg = owner(g,root,context(3)), session = SH.open({...cfg,maxNodes:48});
  try {
    await session.inspect(); const scene=await session.selectFamily(pair);
    assert.deepEqual(scene.family.ports,[0,2]); assert.equal(scene.family.knownUses,5); assert.equal(scene.family.uses.length,4);
    await checkScene(session,scene,g,root,cfg.context,cfg.owner);
    const last=await session.usePage(4);assert.equal(last.family.uses.length,1);
    assert.equal(last.family.firstUse,4); await checkScene(session,last,g,root,cfg.context,cfg.owner);
    const selected=await session.selectUse(scene.family.uses[1].address.route.slots);
    assert.equal(selected.selectedUse,1);assert.equal(selected.family.firstUse,0);
    const mutations=[
      ['portal-source-path',d=>{nodes(d.root).find(n=>n.kind==='shape-use').origin.node++;}],
      ['portal-count',d=>{nodes(d.root).find(n=>n.kind==='shape-use').expanded='999';}],
      ['missing-residual',d=>{d.recovery.removed.pop();}],
      ['duplicate-residual',d=>{d.recovery.removed[1]=copy(d.recovery.removed[0]);}],
      ['ancestor-accounting',d=>{d.root.retained=String(BigInt(d.root.retained)+1n);}]
    ];
    for(const[label,change]of mutations){const d=copy(scene.display);change(d);assert.throws(()=>SH.recover(d));report.refusals.push(label);}
    assert.throws(()=>SH.fold(scene.base,{...SH.families(scene.base)[0],row:999}));report.refusals.push('foreign-family');
    const mixed=copy(scene.base);mixed.root.children[0].value.origin.typeTableSha256='f'.repeat(64);
    assert.throws(()=>SH.families(mixed),/one qualified component/);report.refusals.push('mixed-table-cut');
    await refuse('invalid-use-page',()=>session.usePage(1),/use page/);
    assert.deepEqual(session.getScene(),selected,'failed operation preserves published scene');
  } finally {session.dispose();}
  await refuse('disposed-session',()=>session.inspect(),/disposed/);

  // Identical printed names and stored binder rows are distinct occurrences.
  const h=graph(),ht=add(h,4,{name:'T',levels:[]}),hv=add(h,0,{index:0});
  const binder=add(h,7,{binderName:'same',binderInfo:'default'},[ht,hv]),hr=add(h,5,{},[binder,binder]);
  const hs=SH.open(owner(h,hr));await hs.inspect();const shadows=await hs.selectFamily(hv);
  assert.equal(shadows.family.uses.length,2);
  assert.equal(shadows.family.uses[0].assignments[0].address.node,shadows.family.uses[1].assignments[0].address.node);
  assert.notDeepEqual(shadows.family.uses[0].assignments[0].address.route,shadows.family.uses[1].assignments[0].address.route);
  await checkScene(hs,shadows,h,hr,[],owner(h,hr).owner);hs.dispose();
  report.shadowedBinderOccurrencesRemainDistinct=true;

  // Every kernel constructor is exercised as data, without claiming these
  // arbitrary syntax combinations are well-typed declarations.
  report.constructorControls=[];
  for(let kind=0;kind<12;kind++){
    const c=graph(),ct=add(c,4,{name:'T',levels:[]}),cv=add(c,0,{index:0});
    const payloads=[{index:0},{id:'f'},{id:'m'},{level:{kind:'zero'}},{name:'C',levels:[]},{},
      {binderName:'x',binderInfo:'default'},{binderName:'x',binderInfo:'default'},
      {declName:'x',nondep:false},{literalKind:'natVal',value:'7'},{metadata:[]},{typeName:'T',index:0}];
    const arity=(A.fields[A.kinds[kind]]||[]).length;
    const target=add(c,kind,payloads[kind],Array.from({length:arity},(_,i)=>i===0?ct:cv));
    const cr=add(c,5,{},[target,target]),cs=SH.open(owner(c,cr,context(2)));
    const initial=await cs.inspect();
    if(initial.families.some(f=>f.row===target)){
      const result=await cs.selectFamily(target);
      if(kind===1||kind===2)assert.equal(result.family.status,'unavailable');
      else await checkScene(cs,result,c,cr,context(2),owner(c,cr).owner);
    }
    report.constructorControls.push(A.kinds[kind]);cs.dispose();
  }
  const open=graph(),f=add(open,1,{id:'unresolved'}),wrapped=add(open,7,{binderName:'x',binderInfo:'default'},[f,f]),or=add(open,7,{binderName:'x',binderInfo:'default'},[wrapped,wrapped]);
  const os=SH.open(owner(open,or));assert.equal((await os.inspect()).family.status,'unavailable');os.dispose();
  report.unresolvedInterfaceMarkedUnavailable=true;

  let release, first=true;const cfg2=owner(g,root,context(3));
  const delayed=SH.open({...cfg2,read:async id=>{if(first){first=false;await new Promise(r=>{release=r;});}return tuple(g,id);}});
  const pending=delayed.inspect();await Promise.resolve();
  await refuse('concurrent-operation',()=>delayed.inspect(),/already active/);
  delayed.dispose();release();await refuse('dispose-pending',()=>pending,/disposed/);
  const controller=new AbortController();controller.abort(Error('cancel-control'));
  const cancelled=SH.open({...cfg2,signal:controller.signal});await refuse('cancelled-operation',()=>cancelled.inspect(),/cancel-control/);cancelled.dispose();
  const missing=SH.open({...cfg2,read:async()=>{throw Error('missing-row-control');}});
  await refuse('missing-row',()=>missing.inspect(),/missing-row-control/);missing.dispose();
  assert.throws(()=>SH.open({...cfg2,maxNodes:49}),/bounds/);report.refusals.push('invalid-cut-budget');
  const foreign=copy(cfg2);foreign.read=cfg2.read;foreign.context[0].address.sourceSha256='9'.repeat(64);
  assert.throws(()=>SH.open(foreign),/context/);report.refusals.push('foreign-source-context');
}

async function native() {
  const host={};vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/formal-support-controls-manifest.js','utf8'),{window:host});
  const records=copy(host.PROOF_ATLAS_FORMAL_SUPPORT_CONTROLS.records);
  const forbidden=new Set(records.flatMap(d=>[d.owner.file,d.record.indexFile]));
  const fetcher=async file=>{assert(!forbidden.has(file),'whole native/source archive request');assert(file.startsWith('/public/data/proof-atlas/'));report.requests++;return new Response(fs.readFileSync('.'+file));};
  for(const d of records){
    const batch=read('.'+d.owner.file),data=A.validateIndex(read('.'+d.record.indexFile),d.record);
    const lease=await Q.open(d,d.calls[0].anchor.route,{fetcher});const scene=lease.create();
    const result={name:d.source.name,owner:d.owner.sha256,roots:[]};
    try {
      for(const port of scene.nodes.filter(n=>n.typeBridge)){
        const j=batch.entries.find(e=>e.id===port.typeBridge.identity.input).junction;
        for(const stage of port.typeBridge.stages){
          const address=stage.address,ambient=address.component==='producerType'?j.producer.context:j.consumer.context;
          const context=ambient.map(b=>({name:data.payloads[b.node].binderName||data.payloads[b.node].declName||'_',address:{namespace:'source-expression',name:d.source.name,indexSha256:d.source.indexSha256,sourceSha256:d.source.sourceSha256,node:b.node,route:copy(b.route)}}));
          const session=await lease.openTypeShapes(address);let view=session.getScene();
          await checkScene(session,view,j.graph,j.roots[address.component],context,address);
          if(d.source.name.endsWith('dependentLet')&&port.slot===1&&stage.id==='original'){
            // Same stored bvar1: one use refers to original p, another to a local type binder.
            const candidates=view.families.filter(f=>j.graph.kind[f.row]===0);
            let found=false;
            for(const f of candidates){const v=await session.selectFamily(f.row),targets=v.family.uses.flatMap(u=>u.assignments.map(a=>a.address.namespace));
              await checkScene(session,v,j.graph,j.roots[address.component],context,address);
              if(targets.includes('source-expression')&&targets.includes('application-ports')){assert.deepEqual(v.family.ports,[1]);found=true;result.mixedOriginalAndLocalBinder={row:f.row,uses:v.family.uses};}}
            assert(found,'native mixed original/type binder counterexample');
          }
          if(d.source.name.endsWith('sharedLocal')&&port.slot===1&&stage.id==='original'){
            assert.equal(view.base.stats.nodes,69);assert.equal(view.display.stats.nodes,5);assert.equal(view.family.shape.stats.nodes,23);
            assert.deepEqual(view.family.ports,[]);assert.deepEqual(view.family.uses.map(u=>u.contextLength),[1,2]);
            result.sharedScale={tableRows:j.graph.kind.length,reachableRows:view.family.support.states,baseObjects:69,displayObjects:5,definitionObjects:23,expanded:view.base.stats.represented,state:session.state()};
          }
          const changed={...copy(address),evidenceSha256:'0'.repeat(64)};
          await refuse('foreign-native-owner',()=>lease.openTypeShapes(changed),/exact computed address/);
          assert.equal(session.state().disposed,false,'invalid address does not retire valid session');
          result.roots.push({input:address.input,component:address.component,baseObjects:view.base.stats.nodes,displayObjects:view.display.stats.nodes,family:view.family?.id||null});
          session.dispose();report.roots++;
        }
      }
      assert.equal(lease.state().completeRecordedTypeGraphArraysAllocated,0);
    } finally {lease.dispose();}
    report.nativeProfiles.push(result);
  }
  assert.equal(report.roots,27);
}
module.exports={checkScene,report};
if(require.main===module)(async()=>{
  await synthetic();await native();report.status='PASS';
  report.files=Object.fromEntries(['research/proof-atlas/type-sharing/check-model.cjs','public/js/proof-atlas-type-sharing.js','public/js/proof-atlas-type-notation.js','public/js/proof-atlas-paged-notation.js','public/js/proof-atlas-application-type-pages.js','public/js/proof-atlas-application-ports.js','public/data/proof-atlas/formal-support-controls-manifest.js'].map(f=>[f,sha(fs.readFileSync(f))]));
  if(process.argv[2])fs.writeFileSync(process.argv[2],JSON.stringify(report,null,2)+'\n');
  console.log(JSON.stringify({...report,files:undefined,nativeProfiles:report.nativeProfiles.map(d=>({name:d.name,roots:d.roots.length,sharedScale:d.sharedScale&&{baseObjects:d.sharedScale.baseObjects,displayObjects:d.sharedScale.displayObjects,definitionObjects:d.sharedScale.definitionObjects}}))}));
})().catch(e=>{console.error(e.stack);process.exit(1);});
