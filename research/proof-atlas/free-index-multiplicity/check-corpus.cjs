'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),Module=require('module'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
const repo=path.resolve(__dirname,'../../..');process.chdir(repo);
const M=require('./model.cjs'),{brute}=require('./oracles.cjs'),A=require('../../../public/js/proof-atlas-library-data'),P=require('../../../public/js/proof-atlas-packed-routes'),T=require('../../../public/js/proof-atlas-deep-context'),{cases}=require('../mixed-interfaces/inputs.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),key=q=>q.node+':'+q.index;
const scalarFile=path.join(__dirname,'../recorded-variable-uses/support.cjs'),scalarOriginal=fs.readFileSync(scalarFile,'utf8');assert.equal(scalarOriginal.split('maxStates>65536').length,2);
const scalarCode=scalarOriginal.replace('maxStates>65536','maxStates>262144'),scalarModule={exports:{}};
vm.runInNewContext(scalarCode,{module:scalarModule,require:Module.createRequire(scalarFile),__dirname:path.dirname(scalarFile)});const scalar=scalarModule.exports,legacy=require('../recorded-variable-uses/support.cjs');
const out={status:'RUNNING',selectedProfiles:0,selectedCounts:0,scalarComparisons:0,legacyUnavailableResolved:0,profileBinderQueries:0,profileBinderComplete:0,profileBinderUnavailable:0,profileBruteComparisons:0,libraryPackets:0,libraryNodes:0,libraryBinderNodes:0,libraryQueries:0,libraryComplete:0,libraryUnavailable:0,libraryBruteComparisons:0,partialPackets:0,unavailablePackets:0,peakCoefficientCells:0,peakDecimalDigits:0,peakIndexBytes:0,packets:[],selected:[]};
function census(data,identity,category){
 const binders=[];data.kind.forEach((k,node)=>{if([6,7,8].includes(k))binders.push({node,index:0,body:data.children[node][k===8?2:1]});});
 const queries=[...new Map([...binders.map(b=>({node:b.body,index:0})),...data.roots.map(node=>({node,index:0}))].map(q=>[key(q),q])).values()],result=M.evaluate(data,queries),rows=new Map(result.rows.map(r=>[key(r),r]));
 assert(result.stats.peakCoefficientCells<=result.limits.coefficientCells&&result.stats.peakDecimalDigits<=result.limits.decimalDigits);out.peakCoefficientCells=Math.max(out.peakCoefficientCells,result.stats.peakCoefficientCells);out.peakDecimalDigits=Math.max(out.peakDecimalDigits,result.stats.peakDecimalDigits);out.peakIndexBytes=Math.max(out.peakIndexBytes,result.stats.indexBytes);
 let complete=0,unavailable=0,comparisons=0;
 for(const b of binders){const row=rows.get(b.body+':0');assert(row);if(row.status!=='complete'){assert.equal(row.count,null);unavailable++;continue;}complete++;
  if(BigInt(data.expanded[b.body])<=4096n){const exact=brute(data,b.body);assert(exact);assert.equal(row.count,String(exact.get(0)||0n));comparisons++;}
 }
 for(const node of data.roots){const r=rows.get(node+':0');if(r.status==='complete'&&data.neededScope[node]===0)assert.equal(r.count,'0');}
 const prefix=category==='library'?'library':'profile';out[prefix+'Binder'+(prefix==='library'?'Nodes':'Queries')]+=binders.length;
 out[prefix==='library'?'libraryComplete':'profileBinderComplete']+=complete;out[prefix==='library'?'libraryUnavailable':'profileBinderUnavailable']+=unavailable;out[prefix+'BruteComparisons']+=comparisons;
 if(category==='library'){out.libraryPackets++;out.libraryNodes+=data.kind.length;out.libraryQueries+=queries.length;if(result.status==='partial')out.partialPackets++;if(result.status==='unavailable')out.unavailablePackets++;}
 out.packets.push({...identity,category,nodes:data.kind.length,binderNodes:binders.length,queries:queries.length,status:result.status,complete,unavailable,bruteComparisons:comparisons,resultSha256:sha(JSON.stringify(result)),stats:result.stats,...(result.reason?{reason:result.reason,stoppedAt:result.stoppedAt}:{})});
}
(async()=>{
 for await(const x of cases()){
  out.selectedProfiles++;const entries=x.c.entries.filter(e=>['Pi-introduction','let-binding'].includes(T.construction(e,x.c.data)?.rule)),queries=[...new Map(entries.map(e=>({node:x.c.data.children[e.node][x.c.data.kind[e.node]===8?2:1],index:0})).map(q=>[key(q),q])).values()],result=M.evaluate(x.c.data,queries),rows=new Map(result.rows.map(r=>[key(r),r]));
  assert.equal(result.status,'complete');
  for(const e of entries){const body=x.c.data.children[e.node][x.c.data.kind[e.node]===8?2:1],row=rows.get(body+':0'),expected=scalar.count(x.c.data,e.route,{maxStates:262144}),prior=legacy.count(x.c.data,e.route);assert.equal(expected.status,'complete');assert.equal(row.count,expected.count);out.selectedCounts++;out.scalarComparisons++;if(prior.status==='unavailable')out.legacyUnavailableResolved++;else assert.equal(prior.count,row.count);
   out.selected.push({name:x.record.name,edition:x.edition,sourceIndexSha256:x.record.indexSha256,route:e.route,body,count:row.count,scalarStates:expected.states,priorStatus:prior.status});
  }
  census(x.c.data,{name:x.record.name,edition:x.edition,sourceIndexSha256:x.record.indexSha256},'profile');
 }
 const h={};vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/library-manifest.js','utf8'),{window:h});
 for(const edition of h.PROOF_ATLAS_LIBRARY.editions)for(const record of edition.declarations){
  const raw=z.gunzipSync(fs.readFileSync(path.join(repo,record.indexFile)),{maxOutputLength:67108864});assert.equal(sha(raw),record.indexSha256);const data=A.validateIndex(JSON.parse(raw),record);census(data,{name:record.name,edition:edition.id,sourceIndexSha256:record.indexSha256},'library');
  if(out.libraryPackets%250===0)console.log(JSON.stringify({libraryPackets:out.libraryPackets,complete:out.libraryComplete,unavailable:out.libraryUnavailable}));
 }
 assert.equal(out.selectedProfiles,51);assert.equal(out.selectedCounts,303);assert.equal(out.scalarComparisons,303);assert.equal(out.legacyUnavailableResolved,7);assert.equal(out.libraryPackets,2098);assert.equal(out.libraryBinderNodes,out.libraryComplete+out.libraryUnavailable);assert.equal(out.profileBinderQueries,out.profileBinderComplete+out.profileBinderUnavailable);
 out.status='PASS';out.algorithm='free-index-live-frontier/1';out.limits=M.limits;out.modelSha256=sha(fs.readFileSync(path.join(__dirname,'model.cjs')));out.testSha256=sha(fs.readFileSync(__filename));out.oracleSha256=sha(fs.readFileSync(path.join(__dirname,'oracles.cjs')));out.scalarSourceSha256=sha(scalarOriginal);out.verificationScalarSha256=sha(scalarCode);out.scope='Exact source-syntax multiplicities, conditional on authenticated validated DAGs. All stored binders in each packet are attempted under fixed coefficient/output limits; unavailable entries remain explicit. Small-body occurrence enumeration and 303 separate larger-budget scalar comparisons are independent checks. Profile and library inventories overlap and are reported separately. No new native judgments, browser integration, semantic necessity or measured comprehension.';
 fs.writeFileSync('/tmp/atlas-free-index-multiplicity-corpus.json',JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({...out,packets:undefined,selected:undefined}));
})().catch(e=>{out.status='FAIL';out.error=e.stack;fs.writeFileSync('/tmp/atlas-free-index-multiplicity-corpus.json',JSON.stringify(out,null,2)+'\n');console.error(e.stack);process.exit(1)});
