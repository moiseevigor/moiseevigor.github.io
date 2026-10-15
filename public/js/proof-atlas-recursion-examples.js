/* Optional controlled corpus; the original two snapshots remain separately labelled. */
(function(host){
 'use strict';
 function register(library,eliminations,examples){
  if(!examples)return{library,eliminations};
  const e=examples.edition,p=examples.provenance;
  if(examples.format!=='ProofAtlasRecursionExamples/1'||e.id!=='recursion-controls'||e.modulePrefix!=='ProofAtlasExamples.'||p.kind!=='assistant-authored-synthetic-controls'||!Array.isArray(e.declarations)||!e.declarations.every(r=>r.module==='ProofAtlasExamples.Recursion'&&r.name.startsWith('AtlasExamples.')&&r.sourceSha256===p.sourceSha256)||new Set(e.declarations.map(r=>r.name)).size!==e.declarations.length)throw Error('Invalid controlled-corpus manifest');
  if(library.editions.some(x=>x.id===e.id))throw Error('Controlled-corpus edition already registered');
  if(!examples.eliminations.every(d=>d.edition===e.id&&e.declarations.some(r=>r.name===d.name&&r.indexSha256===d.indexSha256&&r.sourceSha256===d.sourceSha256)))throw Error('Invalid controlled type descriptors');
  return{library:{...library,editions:[...library.editions,e]},eliminations:{...eliminations,records:[...(eliminations?.records||[]),...examples.eliminations]}};
 }
 if(typeof module!=='undefined'&&module.exports)module.exports={register};else{host.ProofAtlasRecursionExamples={register};try{const x=register(host.PROOF_ATLAS_LIBRARY,host.PROOF_ATLAS_ELIMINATIONS,host.PROOF_ATLAS_RECURSION_EXAMPLES);host.PROOF_ATLAS_LIBRARY=x.library;host.PROOF_ATLAS_ELIMINATIONS=x.eliminations;}catch(_){/* Optional examples cannot disable the original library. */}}
})(typeof window==='undefined'?globalThis:window);
