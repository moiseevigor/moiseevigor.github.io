/* Lossless structural interning. A shared type node never identifies a context. */
'use strict';
const crypto=require('crypto'),zlib=require('zlib'),assert=require('assert/strict');
const canonical=x=>Array.isArray(x)?x.map(canonical):x&&typeof x==='object'?Object.fromEntries(Object.keys(x).sort().map(k=>[k,canonical(x[k])])):x;
const digest=x=>crypto.createHash('sha256').update(JSON.stringify(canonical(x))).digest('hex');
const applicationRootFields=['beforeRoot','piRoot','actualRoot','domainRoot','afterRoot','substitutedRoot'];
function mapApplication(trace,convert){if(trace?.status!=='checked')return trace;return{...trace,head:{...trace.head,typeRoot:convert(trace.head.typeRoot)},stages:trace.stages.map(s=>({...s,...Object.fromEntries(applicationRootFields.map(f=>[f,convert(s[f])]))}))};}
function mapLambda(trace,convert){if(trace?.status!=='checked')return trace;return{...trace,piRoot:convert(trace.piRoot),domain:{...trace.domain,...Object.fromEntries(['expressionRoot','piDomainRoot','typeRoot','sortRoot'].map(f=>[f,convert(trace.domain[f])]))},body:{...trace.body,typeRoot:convert(trace.body.typeRoot),expectedRoot:convert(trace.body.expectedRoot)}};}
function mapBeta(trace,convert){if(trace?.status!=='checked')return trace;return{...trace,head:{...trace.head,typeRoot:convert(trace.head.typeRoot)},introduction:mapLambda(trace.introduction,convert),reducedTypeRoot:convert(trace.reducedTypeRoot)};}
function hashes(g){const out=[];for(let i=0;i<g.kind.length;i++)out.push(digest([g.kind[i],g.payloads[i],g.children[i].map(c=>out[c]),g.expanded[i],g.neededScope[i]]));return out;}
function judgmentsDigest(evidence){
 const shared=evidence.typeGraph?hashes(evidence.typeGraph):null;
 const entries=evidence.entries.map(e=>{if(e.status!=='checked')return e;const h=shared||hashes(e.typeGraph),copy={...e,typeRoot:h[e.typeRoot],arguments:e.arguments.map(a=>({...a,typeRoot:h[a.typeRoot],expectedRoot:h[a.expectedRoot]}))};if(e.applicationJudgment)copy.applicationJudgment=mapApplication(e.applicationJudgment,r=>h[r]);if(e.lambdaJudgment)copy.lambdaJudgment=mapLambda(e.lambdaJudgment,r=>h[r]);if(e.betaJudgment)copy.betaJudgment=mapBeta(e.betaJudgment,r=>h[r]);delete copy.typeGraph;return copy;});
 const head={...evidence,entries};delete head.typeGraph;delete head.format;delete head.packing;return digest(head);
}
function verify(evidence){assert.equal(evidence.format,'ProofAtlasOccurrenceTypes/2');assert.equal(evidence.packing.method,'structural-interning/1');assert.equal(judgmentsDigest(evidence),evidence.packing.nativeJudgmentsSha256,'Packing changed a type expression or contextual judgment');return true;}
function pack(source){
 assert.equal(source.format,'ProofAtlasOccurrenceTypes/1');const table=new Map(),g={kind:[],children:[],payloads:[],expanded:[],neededScope:[]},entries=[];let originalNodes=0;
 for(const entry of source.entries){if(entry.status!=='checked'){entries.push(structuredClone(entry));continue;}const old=entry.typeGraph,map=[];originalNodes+=old.kind.length;
  for(let i=0;i<old.kind.length;i++){const children=old.children[i].map(c=>map[c]),signature=JSON.stringify([old.kind[i],canonical(old.payloads[i]),children]);let id=table.get(signature);if(id===undefined){id=g.kind.length;assert(id<65536,'Shared type DAG exceeds 65536 nodes');table.set(signature,id);for(const f of ['kind','payloads','expanded','neededScope'])g[f].push(old[f][i]);g.children.push(children);}assert.equal(g.kind[id],old.kind[i]);assert.deepEqual(g.payloads[id],old.payloads[i]);assert.deepEqual(g.children[id],children);assert.equal(g.expanded[id],old.expanded[i]);assert.equal(g.neededScope[id],old.neededScope[i]);map.push(id);}
  const copy={...entry,typeRoot:map[entry.typeRoot],arguments:entry.arguments.map(a=>({...a,typeRoot:map[a.typeRoot],expectedRoot:map[a.expectedRoot]}))};if(entry.applicationJudgment)copy.applicationJudgment=mapApplication(entry.applicationJudgment,r=>map[r]);if(entry.lambdaJudgment)copy.lambdaJudgment=mapLambda(entry.lambdaJudgment,r=>map[r]);if(entry.betaJudgment)copy.betaJudgment=mapBeta(entry.betaJudgment,r=>map[r]);delete copy.typeGraph;entries.push(copy);
 }
 const raw=JSON.stringify(source),result={...source,format:'ProofAtlasOccurrenceTypes/2',typeGraph:g,entries,packing:{method:'structural-interning/1',nativeAttestationSha256:crypto.createHash('sha256').update(raw).digest('hex'),nativeJudgmentsSha256:judgmentsDigest(source),originalNodes,sharedNodes:g.kind.length,originalCompressedBytes:zlib.gzipSync(raw).length}};
 verify(result);return result;
}
module.exports={pack,verify,judgmentsDigest};
