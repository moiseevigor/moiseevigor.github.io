/* A native proof subterm below a non-proof boundary, with exact source accounting. */
'use strict';
const assert=require('assert/strict'),A=require('../public/js/proof-atlas-library-data'),T=require('../public/js/proof-atlas-occurrence-types'),P=require('../public/js/proof-atlas-projections'),J=require('../public/js/proof-atlas-judgment-geometry'),L=require('../public/js/proof-atlas-boundary-ledger'),F=require('../research/proof-atlas/packet-typing/frontier.cjs'),S=require('../research/proof-atlas/share_type_graphs.cjs'),independent=require('./proof-atlas-frontier-chain-audit.cjs');
module.exports=function({packet,record,types,witness,typesDescriptor,witnessDescriptor}){
 const data={...packet,serialization:'ExprDAG/1'};T.validateExpressionGraph(data,data.roots,0,65536);assert.equal(data.kind.length,177);
 for(const e of [...types.entries,...witness.entries])assert(Buffer.byteLength(JSON.stringify(e))<=2097152,'Native query bound');assert(S.verify(types));assert(S.verify(witness));const provider=P.provider(types,data,record,typesDescriptor.sha256,typesDescriptor.file),witnessProvider=T.provider(witness,data,record,witnessDescriptor),resolve=()=>provider;
 const route={root:1,slots:[1]},projection=provider.get(route);assert.equal(projection.role,'proof');assert.equal(projection.projectionJudgment.status,'checked');
 const value=projection.projectionJudgment.structure;assert.equal(value.role,'value');assert.equal(provider.get(value.route).applicationJudgment.status,'checked');
 const closed=F.collect(data,record,resolve,[route]);assert.equal(closed.proofPremises,0);assert.equal(closed.pending.length,0);
 const opened=F.collect(data,record,resolve,[route,value.route]);assert.equal(opened.proofPremises,1);assert.equal(opened.pending.length,1);
 const hidden=opened.pending[0],observed=witnessProvider.getQuery(hidden.route);assert.equal(hidden.kind,'app');assert.equal(observed.role,'proof');assert.equal(observed.applicationJudgment.status,'checked');assert.equal(observed.node,hidden.node);
 const premise=provider.get(hidden.route);assert.equal(premise.role,'proof');assert.deepEqual(premise.context,observed.context);
 assert.deepEqual(independent.normalized({typeRoot:premise.typeRoot},premise.typeGraph),independent.normalized({typeRoot:observed.typeRoot},observed.typeGraph));
 const scene=J.create(data,record,resolve,{judgmentRoute:route,maxNodes:1,maxDepth:0}),ledger=L.create(scene,data);
 assert.equal(ledger.rows.length,1);assert.equal(ledger.rows[0].role,'value');assert.deepEqual(ledger.rows[0].route,value.route);
 assert.equal(BigInt(ledger.retained)+BigInt(ledger.hidden),BigInt(scene.stats.represented));assert(BigInt(scene.stats.represented)>2n**80n);
 const missing=J.create(data,record,()=>null,{judgmentRoute:route,maxNodes:1,maxDepth:0}),unknown=L.create(missing,data);assert.equal(unknown.rows[0].role,'unrecorded');assert.equal(unknown.rows[0].typeReference,null);
 const opaque=J.create(data,record,()=>null,{judgmentRoute:value.route,maxNodes:1,maxDepth:0}),children=L.create(opaque,data);assert.equal(children.rows.length,2);assert(children.rows.every(r=>r.role==='unrecorded'&&r.reason==='uninspected-source-descendants'));
 return{status:'PASS',source:types.source,storedSourceNodes:data.kind.length,sourceOccurrences:scene.stats.represented,closedProofPremiseFrontier:closed.pending.length,additionalValueSeedRevealsProofRoots:opened.pending.length,hiddenProofRoute:hidden.route,hiddenProofNode:hidden.node,hiddenProofApplicationNativelyChecked:true,independentWitnessTypeMatches:true,hiddenBoundaryRole:ledger.rows[0].role,opaqueChildrenRemainUntyped:true,retained:ledger.retained,hidden:ledger.hidden,scope:'Core-only synthetic counterexample: a closed proof-premise frontier can omit a natively typed proof application inside a value input. Root roles and occurrence accounting are not whole-proof coverage.'};
};
