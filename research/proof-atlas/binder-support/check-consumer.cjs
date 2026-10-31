'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),z=require('zlib'),assert=require('assert/strict'),crypto=require('crypto'),P=require('../../../public/js/proof-atlas-binder-support');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/binder-support/',host={},sha=b=>crypto.createHash('sha256').update(b).digest('hex'),clone=x=>JSON.parse(JSON.stringify(x));
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/binder-support-manifest.js','utf8'),{window:host});
const descriptors=clone(host.PROOF_ATLAS_BINDER_SUPPORT.cases),report={format:'ProofAtlasBinderSupportConsumer/1',status:'PASS',cases:0,fields:0,refusals:0,files:{}};
(async()=>{
for(const d of descriptors){
 const bytes=fs.readFileSync('.'+d.file),raw=z.gunzipSync(bytes),expected=JSON.parse(raw);
 const parsed=await P.open(d,{fetcher:async file=>{assert.equal(file,d.file);return new Response(bytes);}});
 assert.deepEqual(parsed,expected);assert(Object.isFrozen(parsed.sourceProjection.frames[0]));
 for(const key of ['sourceProjection','normalProjection'])for(const f of parsed[key].frames){report.fields+=1+Number(!!f.value);}
 for(const mutate of [m=>{m.nativeCaseSha256='f'.repeat(64);},m=>{m.source.indexSha256='e'.repeat(64);},m=>{m.sourceProjection.frames[0].path=[1];},m=>{m.normalProjection.frames[0].binder=127;},m=>{m.normalProjection.frames[1].domain.references.push({binder:127,count:'1'});},m=>{m.sourceProjection.tailPath=[];},m=>{m.sourceProjection.frames[1].domain.free.push({index:100,count:'1'});}]){const m=clone(parsed);mutate(m);assert.throws(()=>P.validate(m,d));report.refusals++;}
 report.cases++;
}
const d=descriptors[0],bytes=fs.readFileSync('.'+d.file);
for(const options of [
 {d:{...d,nativeCaseSha256:'f'.repeat(64)},fetcher:async()=>new Response(bytes)},
 {d:{...d,sha256:'e'.repeat(64),file:'/public/data/proof-atlas/binder-support/'+'e'.repeat(64)+'.json.gz'},fetcher:async()=>new Response(bytes)},
 {d,fetcher:async()=>new Response(z.gzipSync(Buffer.alloc(d.bytes+1,32)))},
 {d,fetcher:async()=>new Response('',{status:404})},
 {d:{...d,bytes:131073},fetcher:async()=>new Response(bytes)}
]){await assert.rejects(()=>P.open(options.d,{fetcher:options.fetcher}));report.refusals++;}
const abort=new AbortController();abort.abort();await assert.rejects(()=>P.open(d,{signal:abort.signal,fetcher:async()=>new Response(bytes)}));report.refusals++;
report.files=Object.fromEntries(['public/js/proof-atlas-binder-support.js','public/data/proof-atlas/binder-support-manifest.js',base+'check-consumer.cjs'].map(f=>[f,sha(fs.readFileSync(f))]));
const output=Buffer.from(JSON.stringify(report,null,2)+'\n');if(process.argv.includes('--check'))assert(z.gunzipSync(fs.readFileSync(base+'consumer-check.json.gz')).equals(output));else fs.writeFileSync(base+'consumer-check.json.gz',z.gzipSync(output));console.log(JSON.stringify(report));
})().catch(e=>{console.error(e);process.exitCode=1;});
