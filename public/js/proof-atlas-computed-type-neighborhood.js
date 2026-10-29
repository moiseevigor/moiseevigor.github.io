/* A four-vertex occurrence cut inside one already validated native type component. */
(function(host){
 'use strict';
 const node=typeof module!=='undefined'&&module.exports,A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData,G=node?require('./proof-atlas-geometry-core'):host.ProofAtlasGeometry;
 const copy=x=>JSON.parse(JSON.stringify(x)),demand=(ok,m)=>{if(!ok)throw Error('Computed type neighborhood: '+m);},binds=(kind,slot)=>(kind===6||kind===7)&&slot===1||kind===8&&slot===2;
 const clipped=text=>({text:text.slice(0,1024),truncated:text.length>1024});
 function create(g,roots,address,ambient,contextSource){
  demand(address?.namespace==='application-ports'&&Object.hasOwn(roots,address.component)&&address.route?.root===address.component&&Array.isArray(address.route.slots)&&address.route.slots.length<=512,'component address');
  demand(Array.isArray(ambient)&&ambient.length<=512&&contextSource?.namespace==='source-expression'&&contextSource.indexSha256===address.sourceIndexSha256,'original context');
  const at=(n,slots)=>({...copy(address),node:n,route:{root:address.component,slots:[...slots]}}),local=[];let id=roots[address.component],parentNode=null;
  for(const [depth,slot]of address.route.slots.entries()){
   demand(Number.isInteger(slot)&&slot>=0&&slot<g.children[id].length,'ordered field path');parentNode=id;if(binds(g.kind[id],slot))local.push({node:id,depth});id=g.children[id][slot];
  }
  demand(id===address.node,'exact computed node');
  function row(n,slots,scope){
   const kind=A.kinds[g.kind[n]],rule=G.vocabulary[kind];demand(rule&&kind!=='fvar'&&kind!=='mvar','unresolved type objects remain unavailable');
   const value={address:at(n,slots),kind,glyph:rule.glyph,summary:clipped(A.describe(g,n)),expanded:g.expanded[n],localBinders:scope.length,binding:null};
   if(kind==='bvar'){
    const index=g.payloads[n].index;demand(Number.isInteger(index)&&index>=0&&index<scope.length+ambient.length,'lexical bound-variable target');
    if(index<scope.length){const binder=scope[scope.length-1-index];value.binding={relation:'computed-local-binder',address:at(binder.node,slots.slice(0,binder.depth))};}
    else{const ordinal=ambient.length-1-(index-scope.length),binder=ambient[ordinal];demand(['lam','forallE','letE'].includes(binder.kind),'original context binder');value.binding={relation:'original-context-binder',ordinal,address:{...copy(contextSource),node:binder.node,route:copy(binder.route)}};}
   }
   return value;
  }
  const root=row(id,address.route.slots,local),children=[],ports=[],canDescend=address.route.slots.length<512;
  for(const [slot,n]of g.children[id].entries()){
   const field=G.vocabulary[root.kind].ports[slot];demand(field,'constructor field');
   if(canDescend){const scope=binds(g.kind[id],slot)?[...local,{node:id,depth:address.route.slots.length}]:local,child=row(n,[...address.route.slots,slot],scope);children.push(child);ports.push({slot,field,expanded:child.expanded,address:copy(child.address),status:'shown'});}
   else ports.push({slot,field,expanded:g.expanded[n],address:null,status:'unavailable',reason:'selection-path-bound'});
  }
  const retained=1+children.length,represented=BigInt(root.expanded),hidden=canDescend?children.reduce((sum,n)=>sum+BigInt(n.expanded)-1n,0n):represented-1n;demand(BigInt(retained)+hidden===represented,'occurrence accounting');
  return{format:'ProofAtlasComputedTypeNeighborhood/1',root,children,ports,parent:parentNode===null?null:at(parentNode,address.route.slots.slice(0,-1)),componentRoot:at(roots[address.component],[]),context:{length:ambient.length,source:copy(contextSource)},stats:{retained,hidden:hidden.toString(),represented:represented.toString(),vertexLimit:4,pathLimit:512},guarantee:'Ordered syntax and lexical links inside a recorded type component. Descendants have no additional typing judgments; context links are outside the occurrence count.'};
 }
 const api={create};if(node)module.exports=api;else host.ProofAtlasComputedTypeNeighborhood=api;
})(typeof window==='undefined'?globalThis:window);
