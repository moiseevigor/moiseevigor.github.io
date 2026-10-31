/* Predetermine all queries from the frozen lexical census, before native typing. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),vm=require('vm'),assert=require('assert/strict'),crypto=require('crypto'),M=require('../region-context-projection/model.cjs'),S=require('../binder-support/model.cjs'),A=require('../../../public/js/proof-atlas-library-data'),P=require('../../../public/js/proof-atlas-corpus-boundary-pages');
process.chdir(path.resolve(__dirname,'../../..'));
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=f=>JSON.parse(z.gunzipSync(fs.readFileSync(f))),registry=f=>{const w={};vm.runInNewContext(fs.readFileSync(f,'utf8'),{window:w});return JSON.parse(JSON.stringify(Object.values(w)[0]));};
const folder=path.resolve(process.argv[2]);assert(!fs.existsSync(folder));fs.mkdirSync(folder);
const input='research/proof-atlas/corpus-definition-boundaries/native-check.json.gz',census='research/proof-atlas/region-context-projection/model.json.gz',bundle=read(input),selections=read(census).bodySelections,descriptors=registry('public/data/proof-atlas/corpus-boundaries-manifest.js').cases,profiles=[];
for(const d of descriptors){
 const p=bundle.profiles.find(p=>p.source.indexSha256===d.source.indexSha256),entry=p.cases.find(e=>e.plan.id===d.id),g=entry.native.result.graph,original=JSON.parse(p.sourcePacketText),counter=S.counter(g),queries=[];
 function address(component,slots){const ci=P.components.indexOf(component),node=A.walk(g,{root:ci,slots});if(ci<2)return{namespace:'source-expression',edition:d.source.edition,name:d.source.name,indexSha256:d.source.indexSha256,sourceSha256:d.source.sourceSha256,node:A.walk(original,{root:ci===0?1:0,slots}),route:{root:ci===0?1:0,slots}};return{namespace:'corpus-definition-boundary',sourceIndexSha256:d.source.indexSha256,nativeInventorySha256:d.nativeInventorySha256,nativeCaseSha256:d.nativeCaseSha256,manifestSha256:d.sha256,case:d.id,component,node,route:{root:component,slots}};}
 for(const selection of selections.filter(s=>s.nativeCaseSha256===d.nativeCaseSha256)){
  const component=selection.component,ci=P.components.indexOf(component),region=M.reference(g,g.roots[ci],selection.slots,counter),regionAddress=address(component,selection.slots);
  function add(part,slots,keptSlots){queries.push({id:queries.length,componentIndex:ci,component,regionSlots:selection.slots,baseKeptSlots:region.kept,part,slots,keptSlots,regionAddress,originalAddress:address(component,slots),sourceTableNode:A.walk(g,{root:ci,slots})});}
  add({kind:'term'},selection.slots,region.kept);
  for(const slot of region.kept){const frame=region.scope[slot],fields=g.kind[frame.node]===8?[0,1]:[0];for(const field of fields)add({kind:'header',slot,role:field===0?'binderType':'letValue'},[...frame.path,field],region.kept.filter(s=>s<slot));}
 }
 profiles.push({source:p.source,id:d.id,nativeCaseSha256:d.nativeCaseSha256,nativeInventorySha256:d.nativeInventorySha256,graphManifestSha256:d.sha256,queries});
}
assert.equal(profiles.length,11);assert.equal(profiles.reduce((n,p)=>n+p.queries.filter(q=>q.part.kind==='term').length,0),22);
const files=[input,census,'public/data/proof-atlas/corpus-boundaries-manifest.js','research/proof-atlas/region-context-projection/model.cjs','research/proof-atlas/binder-support/model.cjs','research/proof-atlas/region-native-types/prepare.cjs'];
const report={format:'ProofAtlasRegionNativePlan/1',profiles,queryCount:profiles.reduce((n,p)=>n+p.queries.length,0),files:Object.fromEntries(files.map(f=>[f,sha(fs.readFileSync(f))])),scope:'All 22 predetermined body regions and every retained header field in the frozen lexical projection census; no success-based selection.'};
fs.writeFileSync(folder+'/plan.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify({status:'PASS',profiles:11,queries:report.queryCount,termQueries:22}));
