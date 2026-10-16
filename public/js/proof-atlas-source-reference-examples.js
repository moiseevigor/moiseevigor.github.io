/* Source corpus registration is independent of optional typing/view modules. */
(function(host){'use strict';
 function register(library,inventory){if(!inventory?.edition)return library;const e=inventory.edition,p=inventory.provenance;
  if(inventory.format!=='ProofAtlasSourceReferenceInventory/1'||e.id!=='source-reference-controls'||p?.kind!=='assistant-authored-synthetic-controls'||!/^[a-f0-9]{64}$/.test(p.sourceSha256)||!Array.isArray(e.declarations)||!e.declarations.length||e.declarations.length>32||!e.declarations.every(r=>r.module==='ReferenceFixture'&&r.sourceSha256===p.sourceSha256&&r.kernelCheck==='PASS'&&/^[a-f0-9]{64}$/.test(r.indexSha256))||new Set(e.declarations.map(r=>r.name)).size!==e.declarations.length||library.editions.some(x=>x.id===e.id))throw Error('Invalid source-reference control edition');
  return{...library,editions:[...library.editions,e]};
 }
 const api={register};if(typeof module!=='undefined'&&module.exports)module.exports=api;else{host.ProofAtlasSourceReferenceExamples=api;try{host.PROOF_ATLAS_LIBRARY=register(host.PROOF_ATLAS_LIBRARY,host.PROOF_ATLAS_SOURCE_REFERENCES);}catch(_){/* Original inventories remain available. */}}
})(typeof window==='undefined'?globalThis:window);
