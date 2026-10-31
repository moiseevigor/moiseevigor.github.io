'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict'),S=require('../binder-support/model.cjs'),M=require('./model.cjs');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/region-binding-ports/',assetBase='/public/data/proof-atlas/region-binding-pages/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),hash=f=>sha(fs.readFileSync(f)),input='research/proof-atlas/corpus-definition-boundaries/native-check.json.gz',inventory=JSON.parse(z.gunzipSync(fs.readFileSync(input))),host={};
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/corpus-boundaries-manifest.js','utf8'),{window:host});const descriptors=JSON.parse(JSON.stringify(host.PROOF_ATLAS_CORPUS_BOUNDARIES.cases)),assets=new Map(),cases=[];
const report={format:'ProofAtlasRegionBindingProducer/1',status:'PASS',cases:0,components:0,rows:0,coefficients:0,peakCounterStates:0,peakCoefficients:0,peakDigits:0,assets:{},files:{}};
function put(kind,value){const bytes=Buffer.from(JSON.stringify(value)),sha256=sha(bytes),file=assetBase+sha256+'.'+kind+'.gz';assert(bytes.length<=(kind==='manifest'?32768:kind==='index'?16384:1048576));if(assets.has(file))assert(assets.get(file).equals(bytes));assets.set(file,bytes);return{file,sha256,bytes:bytes.length};}
for(const p of inventory.profiles)for(const[c,entry]of p.cases.entries()){
 const g=entry.native.result.graph,record=inventory.verification.cases.find(r=>r.profile===inventory.profiles.indexOf(p)&&r.case===c),d=descriptors.find(d=>d.nativeCaseSha256===record.outputSha256);assert(d);assert.equal(d.nativeInventorySha256,hash(input));
 const graphManifest=JSON.parse(z.gunzipSync(fs.readFileSync('.'+d.file)));assert.equal(sha(Buffer.from(JSON.stringify(graphManifest))),d.sha256);assert.equal(graphManifest.nodeCount,g.kind.length);
 const counter=S.counter(g),rows=[];
 for(let node=0;node<g.kind.length;node++){
  const s=counter.at(node),row=[s.localReferences,s.free.map(r=>[r.index,r.count])];M.validate(row,g.expanded[node],g.neededScope[node]);assert.deepEqual(row,M.recurrence(g,node,rows),'independent complete row recurrence');assert.equal(s.occurrences,g.expanded[node]);rows.push(row);report.rows++;report.coefficients+=row[1].length;
 }
 const state=counter.state();report.peakCounterStates=Math.max(report.peakCounterStates,state.states);report.peakCoefficients=Math.max(report.peakCoefficients,state.coefficients);report.peakDigits=Math.max(report.peakDigits,state.totalDigits);
 const indexSizes={};let refs=[];for(let start=0;start<rows.length;start+=64){const page=put('page',{format:'ProofAtlasRegionBindingPage/1',start,rows:rows.slice(start,start+64)});refs.push({sha256:page.sha256,bytes:page.bytes});}
 const pageCount=refs.length;let level=0,span=1;while(true){const next=[];for(let i=0;i<refs.length;i+=64){const r=put('index',{format:'ProofAtlasRegionBindingIndex/1',level,first:i*span,children:refs.slice(i,i+64)});indexSizes[r.sha256]=r.bytes;next.push({sha256:r.sha256,bytes:r.bytes});}refs=next;if(refs.length===1)break;level++;span*=64;}
 const manifest={format:'ProofAtlasRegionBindingPages/1',id:d.id,source:d.source,nativeInventorySha256:d.nativeInventorySha256,nativeCaseSha256:d.nativeCaseSha256,graphManifestSha256:d.sha256,nodeCount:g.kind.length,pageSize:64,pageCount,indexLevel:level,indexRoot:refs[0].sha256,indexSizes,components:graphManifest.components,scope:'Exact de Bruijn reference coefficients. No new typing or premise-necessity judgment.'};
 cases.push({...put('manifest',manifest),id:d.id,source:d.source,nativeInventorySha256:d.nativeInventorySha256,nativeCaseSha256:d.nativeCaseSha256,graphManifestSha256:d.sha256});report.cases++;report.components+=graphManifest.components.length;
}
assert.equal(report.cases,11);assert.equal(report.components,88);
const registry='window.PROOF_ATLAS_REGION_BINDINGS = '+JSON.stringify({format:'ProofAtlasRegionBindingInventory/1',cases})+';\n',manifestFile='public/data/proof-atlas/region-bindings-manifest.js';
report.assets={count:assets.size,decodedBytes:[...assets.values()].reduce((n,b)=>n+b.length,0),manifestSha256:sha(Buffer.from(registry))};report.files=Object.fromEntries([input,'public/data/proof-atlas/corpus-boundaries-manifest.js',base+'pack.cjs',base+'model.cjs','research/proof-atlas/binder-support/model.cjs'].map(f=>[f,hash(f)]));
const bytes=Buffer.from(JSON.stringify(report,null,2)+'\n');if(process.argv.includes('--check')){assert.equal(fs.readFileSync(manifestFile,'utf8'),registry);for(const[file,raw]of assets)assert(z.gunzipSync(fs.readFileSync('.'+file)).equals(raw));assert(z.gunzipSync(fs.readFileSync(base+'producer-check.json.gz')).equals(bytes));}
else{fs.mkdirSync('.'+assetBase,{recursive:true});for(const[file,raw]of assets)fs.writeFileSync('.'+file,z.gzipSync(raw));fs.writeFileSync(manifestFile,registry);fs.writeFileSync(base+'producer-check.json.gz',z.gzipSync(bytes));}
console.log(JSON.stringify(report));
