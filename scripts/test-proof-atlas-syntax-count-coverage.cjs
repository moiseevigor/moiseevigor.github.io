/* Separate sparse native-use coverage from expanded syntax multiplicity. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict'),repo=path.resolve(__dirname,'..');process.chdir(repo);
const C=require('../public/js/proof-atlas-syntax-counts'),I=require('../research/proof-atlas/recorded-variable-uses/index.cjs'),B=require('../research/proof-atlas/recorded-variable-uses/support.cjs'),T=require('../public/js/proof-atlas-deep-context'),W=require('../public/js/proof-atlas-occurrence-window'),{cases}=require('../research/proof-atlas/mixed-interfaces/inputs.cjs'),h={};vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/syntax-counts-manifest.js','utf8'),{window:h});
const out={status:'RUNNING',profiles:0,recordedUses:0,observations:0,binderRoutes:0,coverageGaps:0,constructionCounts:0,scalarComparisons:0,scalarUnavailableResolved:0};
(async()=>{
 for await(const x of cases()){
  if(x.core)break;const inventory=await I.extract(x),d=h.PROOF_ATLAS_SYNTAX_COUNTS.records.find(d=>d.name===x.record.name&&d.edition===x.edition&&d.indexSha256===x.record.indexSha256),cursor=await C.open(d,x.record,{fetcher:async file=>{assert(file.startsWith('/public/data/proof-atlas/syntax-count-pages/'));return new Response(fs.readFileSync(path.join(repo,file.slice(1))));}}),groups=new Map();out.profiles++;
  for(const use of inventory.rows){const k=I.key(use.binder.route);if(!groups.has(k))groups.set(k,{route:use.binder.route,uses:[]});groups.get(k).uses.push(use);out.recordedUses++;out.observations+=use.observations.length;}
  for(const group of groups.values()){
   const scene=W.create(x.c.data,x.record,group.route,{maxNodes:1,maxDepth:0}),a=await cursor.forPoint(scene.nodes[0],scene.source);assert(a&&a.status==='complete');assert(BigInt(a.count)>=BigInt(group.uses.length),'Sparse native-use catalogue exceeds original syntax multiplicity');assert.equal(a.typing,'not-queried');out.binderRoutes++;if(BigInt(a.count)>BigInt(group.uses.length))out.coverageGaps++;
  }
  for(const e of x.c.entries)if(['Pi-introduction','let-binding'].includes(T.construction(e,x.c.data)?.rule)){
   const scene=W.create(x.c.data,x.record,e.route,{maxNodes:1,maxDepth:0}),a=await cursor.forPoint(scene.nodes[0],scene.source),old=B.count(x.c.data,e.route);assert(a&&a.status==='complete');out.constructionCounts++;if(old.status==='complete'){assert.equal(a.count,old.count);out.scalarComparisons++;}else{assert.equal(old.count,null);out.scalarUnavailableResolved++;}
  }
  cursor.dispose();
 }
 assert.equal(out.profiles,26);assert.equal(out.recordedUses,152);assert.equal(out.observations,304);assert.equal(out.constructionCounts,269);assert.equal(out.scalarComparisons,262);assert.equal(out.scalarUnavailableResolved,7);assert(out.coverageGaps>0);out.status='PASS';out.scope='Finite public count/native-use bridge. Each distinct source use is counted once, separate from its multiple native observations. A syntax count is not additional typing coverage or logical necessity. Existing native records and old scalar assets remain unchanged.';fs.writeFileSync('/tmp/atlas-syntax-count-coverage.json',JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out));
})().catch(e=>{console.error(e.stack);process.exit(1)});
