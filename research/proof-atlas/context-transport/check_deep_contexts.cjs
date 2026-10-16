'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),crypto=require('crypto');
const I=require('../../../public/js/proof-atlas-introduction-transport'),C=require('../../../public/js/proof-atlas-context-transport'),L=require('../../../public/js/proof-atlas-context-views'),T=require('../../../public/js/proof-atlas-occurrence-types');
const folder=process.argv[2],read=f=>JSON.parse(fs.readFileSync(path.join(folder,f))),rows=[];let cuts=0,comparisons=0,negative=0,anchorScopes=0;
for(const pkg of read('introductions.json')){
 const data=read(pkg.source.name+'.json'),prior=read('ordinary.json').find(p=>p.source.name===pkg.source.name);assert(pkg.nativeDagMatchesPacket&&prior.nativeDagMatchesPacket);assert.equal(pkg.kernelDeclarationTyping,'PASS');assert.equal(pkg.leanVersion,'4.33.1');assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(folder,pkg.source.name+'.json'))).digest('hex'),pkg.source.indexSha256);
 for(const e of I.entries(pkg)){
  assert(e.derivation.steps.length<=1);const p=I.validate(e,data,pkg.source),old=prior.entries.find(x=>JSON.stringify(x.route)===JSON.stringify(e.route));assert.equal(old.status,'checked');assert.equal(old.kernelCheck,'PASS');assert(old.contextWellFormed&&old.typeAbstractionRoundtrip);assert(L.equal(p.graph,p.root,old.typeGraph,old.typeRoot).equal);comparisons++;
  const terminal=e.derivation.terminal,expected=C.candidates(data,terminal.route),stats={};assert(L.same(terminal.anchors,expected.anchors,stats));assert(stats.work<100000,'Shared comparison unexpectedly expanded');assert(terminal.anchorCollectorTruncated,'The finite 256-anchor limit must remain explicit');
  for(const a of expected.anchors){assert.deepEqual(a.sourceContext,T.context(data,a.route).binders);anchorScopes++;}
  for(const slots of [[],...e.derivation.steps.map((_,j)=>[...Array(j).fill(1),0])]){const scene=p.scene(slots);assert.equal(BigInt(scene.stats.retainedOccurrences)+BigInt(scene.stats.hidden),BigInt(scene.stats.represented));cuts++;}
  for(const mutate of [x=>x.context[0].path+='-wrong',x=>x.derivation.terminal.anchors[0].lift++,x=>x.derivation.terminal.anchors[0].sourceContext[0].node++,x=>x.derivation.terminal.anchorCollectorTruncated=false,x=>x.derivation.terminal.anchors.reverse()]){const bad=structuredClone(e);mutate(bad);assert.throws(()=>I.validate(bad,data,pkg.source));negative++;}
  rows.push({name:pkg.source.name,context:e.context.length,steps:e.derivation.steps.length,terminalContext:terminal.context.length,anchors:terminal.anchors.length,anchorCollectorTruncated:true,comparison:stats});
 }
}
assert.equal(rows.length,4);assert.deepEqual([...new Set(rows.map(r=>r.context))],[128,129,192,193]);const result={status:'PASS',native:read('native-result.json'),declarations:2,queries:4,independentNativeTypeComparisons:comparisons,independentAnchorScopes:anchorScopes,cuts,negativeControls:negative,rows};fs.writeFileSync(path.join(folder,'checks.json'),JSON.stringify(result,null,2)+'\n');console.log(JSON.stringify(result));
