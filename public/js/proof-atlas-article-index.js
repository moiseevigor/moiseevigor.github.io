/* Version-bound, bidirectional curated correspondence; never guess by text similarity. */
(function(host){
 'use strict';
 function create(structure,terms,decoder,index){
  const passages=index?.passages||[],byId=new Map(passages.map(p=>[p.id,p])),byDeclaration=new Map();
  for(const p of passages)for(const name of p.declarations){if(!byDeclaration.has(name))byDeclaration.set(name,[]);byDeclaration.get(name).push(p);}
  const anchors=index?.anchors||[],byOccurrence=new Map(anchors.map(a=>[a.occurrence,a]));
  const valid=Boolean(index&&decoder.complete&&index.lean.coregirSha256===terms.source.coregirSha256&&anchors.every(a=>a.occurrence>=0&&a.occurrence<structure.parent.length&&decoder.path(a.occurrence)===a.path&&byId.has(a.passage)));
  function local(i){
   const exact=byOccurrence.get(i);
   if(exact)return{passage:byId.get(exact.passage),relation:exact.relation,anchor:exact};
   const head=decoder.kind(i)==='app'?decoder.spine(i).head:i;
   if(decoder.kind(head)==='const'){const name=decoder.constant(head),p=byDeclaration.get(name)?.[0];if(p)return{passage:p,relation:'Referenced declaration '+name};}
   return null;
  }
  function resolve(s){
   if(!valid||!s)return null;
   if(s.type==='decl'){const p=byDeclaration.get('CrossingData.'+s.id)?.[0];return p?{passage:p,relation:'Named declaration correspondence',inherited:false}:null;}
   if(s.type!=='expr'||!Number.isInteger(s.id)||s.id<0||s.id>=structure.parent.length)return null;
   const direct=local(s.id);if(direct)return{...direct,inherited:false,matchedOccurrence:s.id};
   let i=structure.parent[s.id];while(i>=0){const match=local(i);if(match)return{...match,relation:'Context from enclosing occurrence #'+i+' · '+match.relation,inherited:true,matchedOccurrence:i};i=structure.parent[i];}
   return null;
  }
  function reverse(id){if(!valid||!byId.has(id))return{declarations:[],anchors:[]};return{declarations:byId.get(id).declarations,anchors:anchors.filter(a=>a.passage===id)};}
  return{valid,passages,get:id=>byId.get(id),resolve,reverse,source:index?.source,scope:index?.scope};
 }
 const api={create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else host.ProofAtlasArticleIndex=api;
})(typeof window==='undefined'?globalThis:window);
