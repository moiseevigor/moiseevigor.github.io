'use strict';
const fs=require('fs'),vm=require('vm'),z=require('zlib'),path=require('path'),assert=require('assert/strict');
const T=require('../public/js/proof-atlas-deep-context'),{pack}=require('../research/proof-atlas/type-pages/pack.cjs'),{queryPack}=require('../research/proof-atlas/type-pages/query-pack.cjs'),h={};
for(const name of ['library-manifest','occurrence-types-manifest','goedel-sample-manifest','let-result-pools-manifest'])vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+name+'.js','utf8'),{window:h});
const U=require('../research/proof-atlas/recorded-union.cjs'),raw=U.raw,check=process.argv.includes('--check'),rows=[];let files=0,bytes=0;
function reserve(){const s=fs.statfsSync('.');assert(s.bavail*s.bsize>=30*1024**3,'Disk reserve');}
function emit(file,b){if(check){const actual=fs.readFileSync(file);assert(file.endsWith('.gz')?z.gunzipSync(actual).equals(z.gunzipSync(b)):actual.equals(b),'Asset differs: '+file);}else{fs.mkdirSync(path.dirname(file),{recursive:true});fs.writeFileSync(file,b);}}
(async()=>{
 for(const item of U.inventory()){reserve();const d={edition:item.edition},record=item.record,{package:pkg}=await U.open(item);
  const c=pkg.case(record.name),p=pack(c),q=queryPack(c,p);for(const [file,value]of [...p.files,...q.files]){const compressed=z.gzipSync(value);emit('.'+file,compressed);files++;bytes+=compressed.length;}rows.push({...q.descriptor,edition:d.edition});reserve();
 }
 emit('public/data/proof-atlas/type-query-pages-manifest.js',Buffer.from('window.PROOF_ATLAS_TYPE_QUERY_PAGES='+JSON.stringify({format:'ProofAtlasTypeQueryInventory/1',records:rows})+';\n'));console.log(JSON.stringify({status:'PASS',mode:check?'check':'write',declarations:rows.length,observations:rows.reduce((s,r)=>s+r.observations,0),files,compressedBytes:bytes,scope:'Compiled term/type metadata only; no private Lean source modules or new typing queries.'}));
})().catch(e=>{console.error(e.stack);process.exit(1);});
