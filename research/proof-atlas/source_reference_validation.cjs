'use strict';
const A=require('../../public/js/proof-atlas-library-data'),T=require('../../public/js/proof-atlas-occurrence-types'),V=require('./source_reference_view.cjs');
const demand=(x,m)=>{if(!x)throw Error('Source reference evidence: '+m);},same=require('util').isDeepStrictEqual;
function spine(g,r){const args=[];while(g.kind[r]===5){demand(args.length<256,'spine bound');args.unshift(g.children[r][1]);r=g.children[r][0];}return{head:r,args};}
function validate(e,data,record){
 demand(e.format==='ProofAtlasSourceReferences/1'&&e.status==='checked'&&e.method==='native-exact-source-substitution/1'&&e.templateInstantiationStructuralRoundtrip===true&&e.templatesAreKernelJudgments===false,'native substitution attestation');
 for(const f of ['kernelProjectionTyping','kernelStructureConversion','kernelFieldConversion','kernelParameters','kernelPrecedingFields'])demand(e[f]==='PASS','native projection checks');
 const at=T.context(data,e.route);demand(at.node===e.node&&data.kind[e.node]===11&&A.path(data,e.route)===e.path&&same(e.context,at.binders),'selected occurrence/context');
 const payload=data.payloads[e.node];demand(payload.typeName===e.family&&A.levelNameIdentity(payload.typeNameParts)===A.levelNameIdentity(e.familyNameParts)&&payload.index===e.index&&Number.isInteger(e.parameters)&&e.parameters>=0&&Number.isInteger(e.fields)&&e.fields>e.index&&e.parameters+e.fields<=256,'native family/field');
 demand(['type','value','proof'].includes(e.role),'native role');
 const input={root:e.route.root,slots:[...e.route.slots,0]},inputNode=data.children[e.node][0],args=spine(data,inputNode).args;
 demand(Array.isArray(e.anchors)&&e.anchors.length===1+args.length&&args.length<=128,'anchor inventory');
 const expected=[input];for(let j=0;j<args.length;j++)expected.push({root:input.root,slots:[...input.slots,...Array(args.length-1-j).fill(0),1]});
 for(let j=0;j<e.anchors.length;j++){const a=e.anchors[j],ctx=T.context(data,expected[j]);demand(a.node===ctx.node&&same(a.route,expected[j])&&a.path===A.path(data,expected[j])&&same(ctx.binders,e.context)&&a.contextAbstractionRoundtrip===true,'anchor route/context/roundtrip');}
 demand(e.roots.length===5+e.parameters+e.index,'template roots');T.validateExpressionGraph(e.templateGraph,e.roots,e.context.length+e.anchors.length,32768);
 T.validateExpressionGraph(e.metadataGraph,[e.signatureRoot],0,32768);
 const view=V.instantiate(e.templateGraph,e.roots[0],data,e.anchors.map(a=>a.node),e.context.length,{roots:e.roots}),g=view.graph,rs=view.roots;
 demand(V.equal(g,rs[0],data,inputNode).equal,'borrowed input');
 const normalized=spine(g,rs[2]);demand(g.kind[normalized.head]===4&&g.payloads[normalized.head].name===e.family&&A.levelNameIdentity(g.payloads[normalized.head].nameParts)===A.levelNameIdentity(e.familyNameParts)&&A.levelsKey(g.payloads[normalized.head].levels)===A.levelsKey(e.levels)&&normalized.args.length===e.parameters,'normalized structure type');
 for(let j=0;j<e.parameters;j++)demand(V.equal(g,rs[5+j],g,normalized.args[j]).equal,'parameter order');
 for(let j=0;j<e.index;j++){const r=rs[5+e.parameters+j],p=g.payloads[r];demand(g.kind[r]===11&&p.typeName===e.family&&p.index===j&&A.levelNameIdentity(p.typeNameParts)===A.levelNameIdentity(e.familyNameParts)&&V.equal(g,g.children[r][0],data,inputNode).equal,'earlier projection');}
 const m=e.metadataGraph;let formal=e.signatureRoot;const binders=[];
 while(m.kind[formal]===7){demand(binders.length<256,'constructor telescope bound');binders.push(formal);formal=m.children[formal][1];}
 demand(binders.length===e.parameters+e.fields,'constructor telescope arity');const family=spine(m,formal);demand(m.kind[family.head]===4&&m.payloads[family.head].name===e.family&&A.levelNameIdentity(m.payloads[family.head].nameParts)===A.levelNameIdentity(e.familyNameParts)&&A.levelsKey(m.payloads[family.head].levels)===A.levelsKey(e.levels)&&family.args.length===e.parameters,'constructor family');
 for(let j=0;j<e.parameters;j++)demand(m.kind[family.args[j]]===0&&m.payloads[family.args[j]].index===binders.length-1-j,'constructor parameter position');
 const field=binders[e.parameters+e.index];demand(m.payloads[field].binderName===e.fieldName&&m.payloads[field].binderInfo===e.binderInfo,'field identity');
 const derived=V.instantiate(m,m.children[field][0],g,rs.slice(5),e.context.length,{allowExternal:false});
 const comparison=V.equal(derived.graph,derived.root,g,rs[4]);demand(comparison.equal,'independent expected field reconstruction');
 return{view,derived,comparison,record};
}
module.exports={validate};
