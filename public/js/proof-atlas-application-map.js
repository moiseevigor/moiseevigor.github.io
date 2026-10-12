/* Exact named declaration-use bridges. No types, inference steps or tactic provenance
 * are inferred: each link is a verified Expr.const and Expr.app.fn/arg path. */
(function (host) {
  'use strict';
  function create(structure, terms, decoder) {
    const n=structure?.parent?.length||0;
    const invalid=()=>({valid:false,forDeclaration:()=>[],forOccurrence:()=>null,forApplication:()=>null});
    if (!n||!decoder?.complete||terms?.payloads?.length!==n||!Array.isArray(structure.deps))return invalid();
    const children=Array.from({length:n},()=>[]);
    for(let i=0;i<n;i++){
      const p=structure.parent[i];
      if(p>=0){if(p>=i||p>=n)return invalid();children[p].push(i);}
    }
    const kind=i=>structure.kinds[Number(structure.kind[i])];
    const references=new Map();
    // Validate all exact local named references, not source-map dependencies.
    for(const dep of structure.deps){
      if(!dep.name.startsWith('CrossingData.'))continue;
      if(references.has(dep.name)||!Array.isArray(dep.uses)||dep.count!==dep.uses.length)return invalid();
      const distinct=new Set(dep.uses);
      if(distinct.size!==dep.uses.length)return invalid();
      for(const i of dep.uses)if(!Number.isInteger(i)||i<0||i>=n||kind(i)!=='const'||terms.payloads[i]?.name!==dep.name)return invalid();
      references.set(dep.name,[...dep.uses]);
    }
    // No local theorem use may disappear from the index by deleting a record.
    const indexed=new Set(structure.deps.flatMap(d=>d.uses));
    for(let i=0;i<n;i++){
      const name=terms.payloads[i]?.name;
      // Some declaration occurrences are intentionally grouped under a
      // non-project display label; they still must be in the exact-use index.
      if(kind(i)==='const'&&typeof name==='string'&&name.startsWith('CrossingData.')&&!indexed.has(i))return invalid();
    }
    function occurrence(i) {
      if(!Number.isInteger(i)||i<0||i>=n||kind(i)!=='const')return null;
      const name=terms.payloads[i]?.name;
      if(!references.get(name)?.includes(i))return null;
      const args=[];let root=i;
      while(structure.parent[root]>=0){
        const p=structure.parent[root];
        if(kind(p)!=='app')break;
        // An application has exactly two children, ordered fn then arg.
        if(children[p].length!==2)return null;
        if(children[p][0]!==root)break;
        args.push(children[p][1]);root=p;
      }
      let checked;
      try { checked=decoder.spine(root); } catch (_) { return null; }
      if(checked.head!==i||checked.args.length!==args.length||checked.args.some((a,j)=>a!==args[j]))return null;
      let top=root;
      while(structure.parent[top]>=0)top=structure.parent[top];
      const position=top===structure.roots[0]?'type':top===structure.roots[1]?'value':null;
      if(!position)return null;
      return Object.freeze({name,constant:i,application:root,arguments:Object.freeze(args),position,path:decoder.path(i),applicationPath:decoder.path(root),kind:'exact Expr.const plus Expr.app spine'});
    }
    // A malformed occurrence must invalidate the entire named-use bridge,
    // rather than silently disappear from a declaration's reported uses.
    for (const [name, uses] of references) {
      for (const i of uses) {
        const result=occurrence(i);
        if (!result || result.name!==name) return invalid();
      }
    }
    function forDeclaration(name){return(references.get(name)||[]).map(occurrence);}
    function forApplication(i){
      if(!Number.isInteger(i)||i<0||i>=n||kind(i)!=='app')return null;
      const s=decoder.spine(i);if(kind(s.head)!=='const')return null;
      const record=occurrence(s.head);
      return record&&record.application===i?record:null;
    }
    return {valid:true,forDeclaration,forOccurrence:occurrence,forApplication};
  }
  const api={create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else host.ProofAtlasApplicationMap=api;
})(typeof window==='undefined'?globalThis:window);
