/* Optional, source-pinned AI sample. Snapshot and control editions remain distinct. */
(function(host){
 'use strict';
 const demand=(ok,message)=>{if(!ok)throw Error('AI sample: '+message);};
 function register(library,types,eliminations,sample){
  if(!sample)return{library,types,eliminations};const e=sample.edition,p=sample.provenance;
  demand(sample.format==='ProofAtlasPublishedAISample/1'&&e.id==='goedel-sample-4331'&&e.modulePrefix==='ProofAtlasAI.Goedel.','format/edition');
  demand(p.kind==='publisher-attributed-ai-source'&&p.dataset==='Goedel-LM/Lean-workbook-proofs'&&p.revision==='b731852af8d8ab11498fda27bce9020738c01c59'&&p.parquetSha256==='24fcb50eecc2ccbcc52a58c6412c6d10edbeaa9483a97d30e207fb20ef6e2677','release identity');
  demand(p.attempted===24&&p.compiled===20&&p.outcomes.length===24&&new Set(p.outcomes.map(o=>o.problem_id)).size===24,'attempt denominator');
  demand(p.outcomes.filter(o=>o.status==='compiled').length===20&&p.outcomes.every(o=>['compiled','compiler-error','bounded-out'].includes(o.status)),'compilation outcomes');
  demand(e.counts.declarations===20&&e.counts.modules===20,'displayed denominator');
  demand(!library.editions.some(x=>x.id===e.id)&&e.declarations.length===20&&new Set(e.declarations.map(r=>r.name)).size===20&&new Set(e.declarations.map(r=>r.module)).size===20,'declaration inventory');
  for(const r of e.declarations){const origin=r.origin,outcome=p.outcomes.find(o=>o.problem_id===origin?.problemId);demand(r.name===origin?.problemId&&origin?.kind===p.kind&&origin.dataset===p.dataset&&origin.revision===p.revision&&outcome?.status==='compiled'&&outcome.row===origin.row&&outcome.sourceSha256===r.sourceSha256&&origin.sourceSha256===r.sourceSha256&&r.module==='ProofAtlasAI.Goedel.WB'+origin.row&&!r.sourceUrl&&!r.sourceRange,'compiled source identity');}
  for(const list of [sample.types,sample.eliminations]){demand(Array.isArray(list),'native descriptors');for(const d of list)demand(d.edition===e.id&&e.declarations.some(r=>r.name===d.name&&r.sourceSha256===d.sourceSha256&&r.indexSha256===d.indexSha256)&&/^[a-f0-9]{64}$/.test(d.sha256)&&d.file.startsWith('/public/data/proof-atlas/goedel-sample/'),'type source identity');}
  demand(sample.types.length===20&&new Set(sample.types.map(d=>d.name)).size===20,'typed declaration denominator');
  return{library:{...library,editions:[...library.editions,e]},types:{...types,records:[...(types?.records||[]),...sample.types]},eliminations:{...eliminations,records:[...(eliminations?.records||[]),...sample.eliminations]}};
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={register};else{host.ProofAtlasAISample={register,error:null};try{const x=register(host.PROOF_ATLAS_LIBRARY,host.PROOF_ATLAS_OCCURRENCE_TYPES,host.PROOF_ATLAS_ELIMINATIONS,host.PROOF_ATLAS_AI_SAMPLE);host.PROOF_ATLAS_LIBRARY=x.library;host.PROOF_ATLAS_OCCURRENCE_TYPES=x.types;host.PROOF_ATLAS_ELIMINATIONS=x.eliminations;}catch(error){host.ProofAtlasAISample.error=error.message;}}
})(typeof window==='undefined'?globalThis:window);
