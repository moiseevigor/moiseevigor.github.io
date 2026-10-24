'use strict';
const path=require('path'),fs=require('fs'),assert=require('assert/strict'),I=require('./index.cjs'),B=require('./support.cjs');
const repo=path.resolve(__dirname,'../../..');process.chdir(repo);
const P=require(path.join(repo,'public/js/proof-atlas-packed-routes')),T=require(path.join(repo,'public/js/proof-atlas-deep-context')),{cases}=require(path.join(repo,'research/proof-atlas/mixed-interfaces/inputs.cjs'));
// Enumerate actual original source paths on small bodies. The oracle resolves
// each lexical binder from its complete original route, instead of shifting an index.
function brute(data,route,limit=4096){
 const binder=P.resolve(data,route).node,slot=data.kind[binder]===8?2:1,todo=[P.append(route,[slot])];let visits=0,count=0n;
 while(todo.length){if(++visits>limit)return null;const r=todo.pop(),s=P.resolve(data,r);if(data.kind[s.node]===0&&I.key(s.binding?.route||P.encode(31,[]))===I.key(route))count++;
  data.children[s.node].forEach((_,i)=>todo.push(P.append(r,[i])));
 }return String(count);
}
(async()=>{
 const out={status:'RUNNING',profiles:0,binders:0,complete:0,unavailable:0,bruteComparisons:0,pruningComparisons:0,scopeOnlyComparisons:0,additionalResiduePrunedCounts:0,zeroSyntacticUses:0,recordedCoverageGaps:0,statesPeak:0,rows:[]};
 const loadedCodeHash=I.hash(fs.readFileSync(path.resolve(__dirname,'support.cjs')));
 for await(const x of cases()){
  out.profiles++;const inventory=await I.extract(x);
  for(const e of x.c.entries){
   if(!['Pi-introduction','let-binding'].includes(T.construction(e,x.c.data)?.rule))continue;
   const result=B.count(x.c.data,e.route),recorded=inventory.rows.filter(r=>I.key(r.binder.route)===I.key(e.route)).length;out.binders++;out.statesPeak=Math.max(out.statesPeak,result.states);
   const row={name:x.record.name,edition:x.edition,packet:x.record.indexSha256,binder:e.route,recordedUses:recorded,...result};
   const old=B.count(x.c.data,e.route,{residuePruning:false});
   if(old.status==='complete'){assert.equal(result.status,'complete');assert.equal(result.count,old.count);out.scopeOnlyComparisons++;}else if(result.status==='complete')out.additionalResiduePrunedCounts++;
   if(result.status==='unavailable'){out.unavailable++;out.rows.push(row);continue;}
   out.complete++;assert(BigInt(result.count)>=BigInt(recorded));if(result.count==='0')out.zeroSyntacticUses++;if(BigInt(result.count)>BigInt(recorded))out.recordedCoverageGaps++;
   const exact=brute(x.c.data,e.route);if(exact!==null){assert.equal(result.count,exact);out.bruteComparisons++;}
   const unpruned=B.count(x.c.data,e.route,{scopePruning:false,residuePruning:false});if(unpruned.status==='complete'){assert.equal(result.count,unpruned.count);out.pruningComparisons++;}
   out.rows.push(row);
  }
 }
 assert.equal(out.profiles,51);assert.equal(out.binders,303);assert(out.bruteComparisons>0&&out.recordedCoverageGaps>0&&out.zeroSyntacticUses>0);
 // Force an explicit refusal rather than treating an unfinished traversal as zero.
 const tiny={kind:[0,6,6],payloads:[{index:1},{binderName:'y'},{binderName:'x'}],children:[[],[0,0],[0,1]],roots:[2],neededScope:[2,1,0]};
 assert.equal(B.count(tiny,P.encode(0,[]),{maxStates:1,scopePruning:false,residuePruning:false}).status,'unavailable');
 // Nested y shadows x in the body; y's domain remains in x's context.
 const shadow={kind:[0,0,6,6],payloads:[{index:0},{index:1},{binderName:'y'},{binderName:'x'}],children:[[],[],[0,0],[0,2]],roots:[3],neededScope:[1,2,1,0]};
 assert.equal(B.count(shadow,P.encode(0,[])).count,'1');assert.equal(brute(shadow,P.encode(0,[])),'1');
 const letValue={kind:[0,8,6],payloads:[{index:0},{declName:'y'},{binderName:'x'}],children:[[],[0,0,0],[0,1]],roots:[2],neededScope:[1,1,0]};
 assert.equal(B.count(letValue,P.encode(0,[])).count,'2');assert.equal(brute(letValue,P.encode(0,[])),'2');
 // Residue zero may stand for index64. Discharging zero must retain index64.
 const wrap={kind:[0,4],payloads:[{index:64},{name:'synthetic-domain'}],children:[[],[]],roots:[],neededScope:[65,0]};
 let body=0;for(let i=0;i<64;i++){wrap.kind.push(6);wrap.payloads.push({binderName:'inner'+i});wrap.children.push([1,body]);wrap.neededScope.push(wrap.neededScope[body]-1);body=wrap.kind.length-1;}
 wrap.kind.push(6);wrap.payloads.push({binderName:'outer'});wrap.children.push([1,body]);wrap.neededScope.push(0);wrap.roots.push(wrap.kind.length-1);
 assert.equal(B.count(wrap,P.encode(0,[])).count,'1');assert.equal(brute(wrap,P.encode(0,[])),'1');
 assert.equal(I.hash(fs.readFileSync(path.resolve(__dirname,'support.cjs'))),loadedCodeHash);
 out.status='PASS';out.codeSha256=loadedCodeHash;out.testSha256=I.hash(fs.readFileSync(__filename));out.scope='Local finite source-syntax counts, not variable typing or logical necessity. Small-body path/binder oracle and independent unpruned dynamic evaluation are separate controls. Large counts rely on validated DAG/scope metadata. Bounded per-binder state; unavailable results have no count. No public integration or exhaustive native typing claim.';
 fs.writeFileSync(path.resolve(__dirname,'support-verification.json'),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({...out,rows:undefined}));
})().catch(e=>{console.error(e.stack);process.exit(1)});
