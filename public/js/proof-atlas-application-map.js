/* Proof Atlas / Exact application bridge v1.
 * All records are *occurrences* of kernel-facing Expr.const and Expr.app;
 * not logical steps, article correspondences, typing judgments or tactic traces.
 * A malformed published reference makes the entire bridge unavailable.
 */
(function (host) {
  'use strict';
  function create(structure, terms, decoder) {
    const invalid=()=>Object.freeze({valid:false,reason:'Inconsistent exact application evidence',count:0,forDeclaration:()=>[],forOccurrence:()=>null,forApplication:()=>null});
    const n=structure?.parent?.length;
    if(!Number.isInteger(n)||n<1||!decoder?.complete||
      !Array.isArray(terms?.payloads)||terms.payloads.length!==n||
      !Array.isArray(structure?.deps)||!Array.isArray(structure.roots)||structure.roots.length!==2||
      !Array.isArray(structure.kinds)||structure.kind?.length!==n||
      !Array.isArray(terms.rootPaths)||terms.rootPaths.length!==2||
      terms.rootPaths[0]!=='root.type'||terms.rootPaths[1]!=='root.value')return invalid();
    const kind=i=>structure.kinds[Number(structure.kind[i])];
    const children=Array.from({length:n},()=>[]),roots=[];
    for(let i=0;i<n;i++){
      const p=structure.parent[i];
      if(!Number.isInteger(p)||p>=i||p< -1)return invalid();
      if(p===-1)roots.push(i);else children[p].push(i);
    }
    if(roots.length!==2||roots[0]!==structure.roots[0]||roots[1]!==structure.roots[1])return invalid();
    const references=new Map(),indexed=new Map();
    for(const dep of structure.deps){
      if(typeof dep.name!=='string'||!dep.name||
        !Array.isArray(dep.uses)||dep.count!==dep.uses.length)return invalid();
      for(const i of dep.uses){
        if(!Number.isInteger(i)||i<0||i>=n||indexed.has(i)||kind(i)!=='const')return invalid();
        const exactName=terms.payloads[i]?.name;
        if(typeof exactName!=='string'||!exactName)return invalid();
        // The published dependency constellation intentionally groups some
        // distinct declarations. Those display labels are NOT kernel names.
        if(dep.name==='Kernel/library declaration'){
          // Only the actual Expr.const payload supplies an exact name.
        }else if(dep.name.startsWith('Local helper · ')){
          if(exactName!=='CrossingData.'+dep.name.slice('Local helper · '.length))return invalid();
        }else if(exactName!==dep.name)return invalid();
        indexed.set(i,exactName);
        if(!references.has(exactName))references.set(exactName,[]);
        references.get(exactName).push(i);
      }
    }
    for(const [name,uses] of references)references.set(name,Object.freeze(uses));
    // All 2,892 constant occurrences must be indexed, not just project lemmas.
    for(let i=0;i<n;i++){
      if(kind(i)==='const'){
        if(!indexed.has(i)||indexed.get(i)!==terms.payloads[i]?.name)return invalid();
      }else if(indexed.has(i))return invalid();
      if(kind(i)==='app'&&children[i].length!==2)return invalid();
    }
    const records=new Map();
    try {
      for(const [name,uses] of references){
        for(const i of uses){
          const args=[];let application=i;
          while(structure.parent[application]>=0){
            const p=structure.parent[application];
            if(kind(p)!=='app'||children[p][0]!==application)break;
            args.push(children[p][1]);application=p;
          }
          // Cross-check with independently constructed full-term reader.
          const spine=decoder.spine(application);
          if(spine.head!==i||spine.args.length!==args.length||
              spine.args.some((j,k)=>j!==args[k]))return invalid();
          let top=application;
          while(structure.parent[top]>=0)top=structure.parent[top];
          const position=top===structure.roots[0]?'type':top===structure.roots[1]?'value':null;
          if(!position)return invalid();
          records.set(i,Object.freeze({name,constant:i,application,
            arguments:Object.freeze(args),position,path:decoder.path(i),
            applicationPath:decoder.path(application),evidence:'Expr.const + Expr.app.fn/arg'}));
        }
      }
    }catch(_){return invalid();}
    if(records.size!==indexed.size)return invalid();
    function forDeclaration(name){return (references.get(name)||[]).map(i=>records.get(i));}
    function forOccurrence(i){return records.get(i)||null;}
    function forApplication(i){
      if(!Number.isInteger(i)||i<0||i>=n||kind(i)!=='app')return null;
      let spine;
      try{spine=decoder.spine(i);}catch(_){return null;}
      const r=records.get(spine.head);
      return r&&r.application===i?r:null;
    }
    return Object.freeze({valid:true,count:records.size,forDeclaration,forOccurrence,forApplication});
  }
  const api={create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else host.ProofAtlasApplicationMap=api;
})(typeof window==='undefined'?globalThis:window);
