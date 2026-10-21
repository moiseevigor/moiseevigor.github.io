/* Complete reader versus bounded source/type consumers; no complete archive fetch. */
'use strict';
const fs=require('fs'),vm=require('vm'),z=require('zlib'),assert=require('assert/strict');
const T=require('../public/js/proof-atlas-deep-context'),TP=require('../public/js/proof-atlas-type-pages'),SP=require('../public/js/proof-atlas-source-pages'),P=require('../public/js/proof-atlas-packed-routes'),{pack}=require('../research/proof-atlas/type-pages/pack.cjs'),h={};
for(const name of ['library-manifest','occurrence-types-manifest','goedel-sample-manifest','let-result-pools-manifest','source-pages-manifest'])vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+name+'.js','utf8'),{window:h});
const {library,types}=require('../public/js/proof-atlas-ai-sample').register(h.PROOF_ATLAS_LIBRARY,h.PROOF_ATLAS_OCCURRENCE_TYPES,null,h.PROOF_ATLAS_AI_SAMPLE),raw=f=>z.gunzipSync(fs.readFileSync('.'+f),{maxOutputLength:67108864});
let observations=0,scenes=0,tables=0,originalLinks=0,typeLocalLinks=0,peakTypeNodes=0,peakTypeBytes=0,fullArchiveRequests=0,refinements=0;const rows=[];
(async()=>{
 for(const d of types.records){const record=library.editions.find(e=>e.id===d.edition).declarations.find(r=>r.name===d.name),sourceBytes=raw(record.indexFile);let pkg=await T.recorded(sourceBytes,raw(d.file),d,record);
  const ld=h.PROOF_ATLAS_LET_REDUCTIONS.records.find(x=>x.edition===d.edition&&x.name===record.name&&x.indexSha256===record.indexSha256);if(ld)pkg=T.mergeRecorded(pkg,await T.recordedLets(sourceBytes,raw(ld.file),ld,record));
  const c=pkg.case(record.name),packed=pack(c),sourceDescriptor=h.PROOF_ATLAS_SOURCE_PAGES.records.find(x=>x.edition===d.edition&&x.name===record.name&&x.indexSha256===record.indexSha256);assert(sourceDescriptor);
  const fetcher=async file=>{if(file===record.indexFile||file===d.file||file===ld?.file){fullArchiveRequests++;throw Error('Complete archive request forbidden');}if(packed.files.has(file))return new Response(z.gzipSync(packed.files.get(file)));assert(file.startsWith('/public/data/proof-atlas/source-pages/'),'Unexpected consumer request: '+file);return new Response(fs.readFileSync('.'+file));};
  const source=await SP.open(sourceDescriptor,record,{fetcher}),cursors=new Map();
  try{
   for(const table of packed.tables){const cursor=await TP.open(table.descriptor,{fetcher});cursors.set(table.descriptor.sha256,cursor);tables++;}
   for(const row of packed.observations){const cursor=cursors.get(row.table.sha256),o=await cursor.observation(row.descriptor),entry=c.get(row.sourceRoute);assert(entry);observations++;
    for(const options of [{maxNodes:1,maxDepth:0},{maxNodes:9,maxDepth:2},{maxNodes:13,maxDepth:3}]){
     let actual;try{actual=await cursor.scene(o,source,P.encode(0,[]),options);}catch(error){const failure={status:'FAIL',name:record.name,sourceIndexSha256:record.indexSha256,sourceRoute:entry.route,typeRoot:o.root,options,state:cursor.state(),error:error.message};fs.writeFileSync('/tmp/atlas-type-pages-failed-cut.json',JSON.stringify(failure,null,2)+'\n');throw error;}const expected=T.typeScene(entry,c.data,P.encode(0,[]),options);assert.deepEqual(actual,expected);scenes++;
     originalLinks+=actual.links.filter(l=>l.namespace==='original-source-context').length;typeLocalLinks+=actual.links.filter(l=>l.namespace==='computed-native-type').length;
     if(options.maxNodes===9){const boundary=actual.nodes.flatMap(p=>p.ports).find(p=>!p.displayed);if(boundary){assert.deepEqual(await cursor.scene(o,source,boundary.route),T.typeScene(entry,c.data,boundary.route));refinements++;}}
    }
    const state=cursor.state();assert(state.cachedNodes<=512&&state.indexPages<=4&&state.fullTableArchiveRequests===0);peakTypeNodes=Math.max(peakTypeNodes,state.peakCachedNodes);peakTypeBytes=Math.max(peakTypeBytes,state.peakCachedBytes);
   }
   rows.push({name:record.name,edition:d.edition,observations:packed.observations.length,tables:packed.tables.map(t=>({nodes:t.nodes,state:cursors.get(t.descriptor.sha256).state()})),sourceState:source.state()});
  }finally{source.dispose();for(const cursor of cursors.values())cursor.dispose();}
 }
 assert.equal(observations,2411);assert.equal(tables,32);assert(originalLinks>0&&typeLocalLinks>0);assert.equal(fullArchiveRequests,0);
 const report={status:'PASS',scope:'Finite complete-reference comparison of paged computed type geometry; no UI integration or whole-browser memory proof',declarations:rows.length,tables,observations,scenes,refinements,originalContextLinkAppearances:originalLinks,typeLocalLinkAppearances:typeLocalLinks,peakTypeNodes,peakTypeBytes,fullArchiveRequests,rows};
 fs.writeFileSync(process.env.ATLAS_TYPE_PAGES_REPORT||'/tmp/atlas-type-pages.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({...report,rows:undefined}));
})().catch(e=>{console.error(e.stack);process.exit(1);});
