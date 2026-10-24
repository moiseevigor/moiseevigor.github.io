/* Independent finite cut identity for a selected original binder's body. */
'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),M=require('./model.cjs'),W=require('../../../public/js/proof-atlas-occurrence-window'),P=require('../../../public/js/proof-atlas-packed-routes'),T=require('../../../public/js/proof-atlas-deep-context'),{cases}=require('../mixed-interfaces/inputs.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),key=q=>q.node+':'+q.index;
const out={status:'RUNNING',profiles:0,binders:0,cuts:0,frontierTerms:0,retainedVariableTerms:0,changedPartitions:0,peakCoefficientCells:0,peakDecimalDigits:0};
(async()=>{
 for await(const x of cases()){
  out.profiles++;const cuts=[],queries=new Map();
  for(const entry of x.c.entries)if(['Pi-introduction','let-binding'].includes(T.construction(entry,x.c.data)?.rule)){
   out.binders++;const route=P.append(entry.route,[x.c.data.kind[entry.node]===8?2:1]),sizes=new Set();
   for(const options of [{maxNodes:1,maxDepth:0},{maxNodes:7,maxDepth:2},{maxNodes:13,maxDepth:3}]){
    const scene=W.create(x.c.data,x.record,route,options),context=scene.nodes[0].scopeDepth,frontiers=[];let retained=0n;
    for(const n of scene.nodes){
     const depth=n.scopeDepth-context;assert(depth>=0);
     if(n.kind==='bvar'&&x.c.data.payloads[n.node].index===depth)retained++;
     for(const p of n.ports)if(!p.displayed){const resolved=P.resolve(x.c.data,p.route),index=resolved.scopeDepth-context;assert(index>=0);assert.equal(resolved.node,p.node);const query={node:p.node,index};queries.set(key(query),query);frontiers.push(query);}
    }
    const root={node:scene.root.node,index:0};queries.set(key(root),root);cuts.push({scene,before:JSON.stringify(scene),root,frontiers,retained});sizes.add(scene.stats.retained+':'+scene.stats.hidden);
   }
   if(sizes.size>1)out.changedPartitions++;
  }
  const result=M.evaluate(x.c.data,[...queries.values()]);assert.equal(result.status,'complete');const counts=new Map(result.rows.map(r=>[key(r),BigInt(r.count)]));
  for(const cut of cuts){const reconstructed=cut.frontiers.reduce((n,q)=>n+counts.get(key(q)),cut.retained);assert.equal(reconstructed,counts.get(key(cut.root)));assert.equal(JSON.stringify(cut.scene),cut.before);out.cuts++;out.frontierTerms+=cut.frontiers.length;out.retainedVariableTerms+=Number(cut.retained);}
  out.peakCoefficientCells=Math.max(out.peakCoefficientCells,result.stats.peakCoefficientCells);out.peakDecimalDigits=Math.max(out.peakDecimalDigits,result.stats.peakDecimalDigits);
 }
 assert.equal(out.profiles,51);assert.equal(out.binders,303);assert.equal(out.cuts,909);assert(out.frontierTerms>0&&out.retainedVariableTerms>0&&out.changedPartitions>0);out.status='PASS';out.modelSha256=sha(fs.readFileSync(path.join(__dirname,'model.cjs')));out.testSha256=sha(fs.readFileSync(__filename));out.scope='Finite free-index-zero cut composition for each selected original binder body: retained variable occurrences plus scope-shifted hidden-region coefficients equals the whole-body count. Exact source partitions stay unchanged under three display budgets. No new source occurrences, typing, semantic necessity or general formal proof.';
 fs.writeFileSync('/tmp/atlas-free-index-multiplicity-refinement.json',JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out));
})().catch(e=>{out.status='FAIL';out.error=e.stack;fs.writeFileSync('/tmp/atlas-free-index-multiplicity-refinement.json',JSON.stringify(out,null,2)+'\n');console.error(e.stack);process.exit(1)});
