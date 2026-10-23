'use strict';
const fs=require('fs'),vm=require('vm'),z=require('zlib'),path=require('path'),assert=require('assert/strict');
const T=require('../public/js/proof-atlas-deep-context'),{pack}=require('../research/proof-atlas/construction-pages/pack.cjs'),h={};
const captions=require('../research/proof-atlas/construction-pages/captions.cjs');
for(const name of ['library-manifest','occurrence-types-manifest','goedel-sample-manifest','let-result-pools-manifest'])vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+name+'.js','utf8'),{window:h});
const{library,types}=require('../public/js/proof-atlas-ai-sample').register(h.PROOF_ATLAS_LIBRARY,h.PROOF_ATLAS_OCCURRENCE_TYPES,null,h.PROOF_ATLAS_AI_SAMPLE),raw=f=>z.gunzipSync(fs.readFileSync('.'+f),{maxOutputLength:67108864}),check=process.argv.includes('--check'),rows=[],seen=new Set();let compressedBytes=0,newFiles=0,constructions=0,positionCaptions=0;
function reserve(){const s=fs.statfsSync('.');assert(s.bavail*s.bsize>=30*1024**3,'Disk reserve');}
function emit(file,raw){
 if(fs.existsSync(file)){const actual=fs.readFileSync(file);assert(file.endsWith('.gz')?z.gunzipSync(actual,{maxOutputLength:1048576}).equals(raw):actual.equals(raw),'Existing asset differs: '+file);return actual.length;}
 assert(!check,'Asset missing: '+file);fs.mkdirSync(path.dirname(file),{recursive:true});const b=file.endsWith('.gz')?z.gzipSync(raw):raw;fs.writeFileSync(file,b);newFiles++;return b.length;
}
(async()=>{
 for(const d of types.records){reserve();const record=library.editions.find(e=>e.id===d.edition).declarations.find(r=>r.name===d.name),source=raw(record.indexFile);let pkg=await T.recorded(source,raw(d.file),d,record);const ld=h.PROOF_ATLAS_LET_REDUCTIONS.records.find(x=>x.edition===d.edition&&x.name===record.name&&x.indexSha256===record.indexSha256);if(ld)pkg=T.mergeRecorded(pkg,await T.recordedLets(source,raw(ld.file),ld,record));
  const c=pkg.case(record.name),p=await pack(c,{captions:captions.open(c,owner=>raw(owner.evidenceFile))});for(const[file,value]of p.files){const size=emit('.'+file,value);if(!seen.has(file)){seen.add(file);compressedBytes+=size;}}rows.push({...p.descriptor,edition:d.edition});constructions+=p.stats.constructions;positionCaptions+=p.stats.positionCaptions;reserve();
 }
 const manifest=Buffer.from('window.PROOF_ATLAS_CONSTRUCTION_PAGES='+JSON.stringify({format:'ProofAtlasConstructionInventory/1',records:rows})+';\n'),file='public/data/proof-atlas/construction-pages-manifest.js';
 if(check)assert(fs.readFileSync(file).equals(manifest),'Construction registry differs');else{fs.writeFileSync(file,manifest);}console.log(JSON.stringify({status:'PASS',mode:check?'check':'write',profiles:rows.length,positions:rows.reduce((sum,r)=>sum+r.entries,0),constructions,positionCaptions,uniqueGzipAssets:seen.size,compressedBytes,newFiles,scope:'Existing compiled term/type/construction metadata only; no new native queries or private mathematical source modules.'}));
})().catch(error=>{console.error(error.stack);process.exit(1);});
