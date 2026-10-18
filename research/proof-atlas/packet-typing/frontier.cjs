/* A finite construction frontier from recorded proof premises and exact source routes. */
'use strict';
const assert=require('assert/strict'),A=require('../../../public/js/proof-atlas-library-data'),J=require('../../../public/js/proof-atlas-judgment-geometry');
const key=r=>r.root+':'+r.slots.join('.'),rules=new Set(['introduction','application','recursor','let','projection','construction']);
function recorded(n){return rules.has(n.rule)&&!!n.checks&&!!n.attestation;}
function collect(data,record,resolveTyping,seeds,{maxNewQueries=128}={}){
 assert(Number.isInteger(maxNewQueries)&&maxNewQueries>0&&maxNewQueries<=512);assert(Array.isArray(seeds)&&seeds.length>0&&seeds.length<=512);
 const pending=new Map(),seen=new Set();let proofPremises=0,terminalReferences=0,recordedConstructions=0;
 for(const route of seeds){assert(!seen.has(key(route)),'Duplicate seed occurrence');seen.add(key(route));const root=J.create(data,record,resolveTyping,{judgmentRoute:route,maxNodes:1,maxDepth:0}).nodes[0];if(!recorded(root))continue;
  for(const p of root.ports){if(p.role!=='proof')continue;assert(p.typeReference,'Proof role without a native premise reference');proofPremises++;
   // A declaration/context reference is a terminal of this construction language.
   if([0,4].includes(data.kind[p.node])){terminalReferences++;continue;}
   const child=J.create(data,record,resolveTyping,{judgmentRoute:p.route,maxNodes:1,maxDepth:0}).nodes[0];if(recorded(child)){recordedConstructions++;continue;}
   const parent={node:root.node,route:root.route,rule:root.rule,field:p.field,attestation:root.attestation,premise:p.typeReference},k=key(p.route);if(pending.has(k)){pending.get(k).parents.push(parent);continue;}
   assert(pending.size<maxNewQueries,'Proof-premise frontier exceeds the fixed query bound');pending.set(k,{node:p.node,route:p.route,path:A.path(data,p.route),kind:A.kinds[data.kind[p.node]],expanded:p.expanded,role:'proof',typeText:p.typeText,parents:[parent]});
  }
 }
 return{format:'ProofAtlasProofPremiseFrontier/1',source:{name:record.name,indexSha256:record.indexSha256,sourceSha256:record.sourceSha256},seeds,proofPremises,terminalReferences,recordedConstructions,pending:[...pending.values()],maxNewQueries,scope:'Immediate native proof-valued premises without recorded construction; exact routes remain distinct. Terminals are declaration/context references. No semantic importance or complete proof coverage is inferred.'};
}
function resolver(providers){return route=>{const ps=[providers.case,providers.beta,providers.let,providers.primary,providers.packet],es=ps.map(p=>p?.get(route));if(es[0]?.eliminationJudgment?.status==='checked')return ps[0];if(es[1]?.betaJudgment?.status==='checked')return ps[1];if(es[2]?.letJudgment?.status==='checked'||es[2]?.letReduction?.status==='available')return ps[2];for(const field of ['lambdaJudgment','applicationJudgment']){const i=es.findIndex(e=>e?.[field]?.status==='checked');if(i>=0)return ps[i];}return ps.find((p,i)=>es[i]?.status==='checked'&&!es[i].typingOrigin)||ps.find((p,i)=>es[i]?.status==='checked');};}
module.exports={collect,resolver,recorded};
