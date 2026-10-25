/* Stream the finite recorded typing inventory, one complete source packet at a time. */
'use strict';
const fs=require('fs'),vm=require('vm'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict'),A=require('../public/js/proof-atlas-library-data'),T=require('../public/js/proof-atlas-occurrence-types'),B=require('../public/js/proof-atlas-beta-reduction'),Z=require('../public/js/proof-atlas-let-reduction'),E=require('../public/js/proof-atlas-elimination');
const read=f=>JSON.parse(z.gunzipSync(fs.readFileSync('.'+f))),key=r=>r.root+':'+r.slots.join('.');
function resolver(providers){return route=>{const ps=[providers.case,providers.beta,providers.let,providers.primary,providers.projection,providers.packet,providers.useSites],es=ps.map(p=>p?.get(route));if(es[0]?.eliminationJudgment)return ps[0];if(es[1]?.betaJudgment?.status==='checked')return ps[1];if(es[2]?.letJudgment?.status==='checked'||es[2]?.letReduction?.status==='available')return ps[2];for(const f of ['lambdaJudgment','applicationJudgment']){const i=es.findIndex(e=>e?.[f]?.status==='checked');if(i>=0)return ps[i];}return ps.find((p,i)=>es[i]?.status==='checked'&&!es[i].typingOrigin)||ps.find((p,i)=>es[i]?.status==='checked')||providers.primary;};}
function inventory(){
 const w={};for(const f of ['library-manifest.js','occurrence-types-manifest.js','goedel-sample-manifest.js','recursion-examples-manifest.js','let-result-pools-manifest.js','beta-reductions-manifest.js','eliminations-manifest.js'])vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+f,'utf8'),{window:w});
 const editions=[...w.PROOF_ATLAS_LIBRARY.editions,w.PROOF_ATLAS_AI_SAMPLE.edition,w.PROOF_ATLAS_RECURSION_EXAMPLES.edition],groups=[['primary',T,w.PROOF_ATLAS_OCCURRENCE_TYPES.records],['primary',T,w.PROOF_ATLAS_AI_SAMPLE.types],['case',E,w.PROOF_ATLAS_ELIMINATIONS.records],['case',E,w.PROOF_ATLAS_AI_SAMPLE.eliminations],['case',E,w.PROOF_ATLAS_RECURSION_EXAMPLES.eliminations],['beta',B,w.PROOF_ATLAS_BETA_REDUCTIONS.records],['let',Z,w.PROOF_ATLAS_LET_REDUCTIONS.records]],inventory=new Map();
 for(const [kind,api,descriptors]of groups)for(const descriptor of descriptors){const id=descriptor.edition+'/'+descriptor.name;if(!inventory.has(id))inventory.set(id,[]);inventory.get(id).push({kind,api,descriptor});}
 return [...inventory.values()].map(descriptors=>{const first=descriptors[0].descriptor;return{edition:first.edition,record:editions.find(e=>e.id===first.edition).declarations.find(r=>r.name===first.name),descriptors};});
}
async function* sources(){
 for(const item of inventory()){
  const {record,descriptors}=item;
  const bytes=z.gunzipSync(fs.readFileSync('.'+record.indexFile));assert.equal(crypto.createHash('sha256').update(bytes).digest('hex'),record.indexSha256);
  const data=A.validateIndex(JSON.parse(bytes),record),providers={},routes=new Map(),old=globalThis.fetch;
  try{globalThis.fetch=async f=>new Response(fs.readFileSync('.'+f));for(const {kind,api,descriptor:d}of descriptors){providers[kind]=await api.open(d,data,record);for(const e of read(d.file).entries)if(e.status==='checked')routes.set(key(e.route),e.route);}}finally{globalThis.fetch=old;}
  yield{edition:item.edition,record,data,resolve:resolver(providers),routes};
 }
}
async function supplements(item,data,providers={}){
 const w={};for(const f of ['packet-types-manifest.js','use-site-types-manifest.js'])vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+f,'utf8'),{window:w});
 const next={...providers};for(const [kind,records]of [['packet',w.PROOF_ATLAS_PACKET_TYPES.records],['useSites',w.PROOF_ATLAS_USE_SITE_TYPES.records]]){const d=records.find(d=>d.edition===item.edition&&d.name===item.record.name);if(d)next[kind]=await T.open(d,data,item.record);}return next;
}
module.exports={sources,inventory,resolver,supplements};
