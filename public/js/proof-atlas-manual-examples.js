/* Authored structural examples, not extracted declarations or native judgments. */
(function(host){
 'use strict';
 const A=typeof module!=='undefined'&&module.exports?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
 function example(id){
  const d={serialization:'ExprDAG/1',declaration:{name:'Illustration.'+id,kind:'definition',rootPaths:['root.value']},kind:[],children:[],payloads:[],expanded:[],neededScope:[],roots:[]};
  function add(kind,children=[],payload={}){const n=d.kind.length;d.kind.push(A.kinds.indexOf(kind));d.children.push(children);d.payloads.push(payload);d.expanded.push((1n+children.reduce((sum,c)=>sum+BigInt(d.expanded[c]),0n)).toString());d.neededScope.push(kind==='bvar'?payload.index+1:Math.max(0,...children.map((c,i)=>d.neededScope[c]-((['lam','forallE'].includes(kind)&&i===1||kind==='letE'&&i===2)?1:0))));return n;}
  const c=name=>add('const',[],{name,levels:[]}),v=add('bvar',[],{index:0}),nat=c('Nat');let root,text,note;
  if(id==='scope'){
   const universe=add('sort',[],{level:{kind:'succ',of:{kind:'zero'}}});root=add('lam',[universe,add('lam',[v,v],{binderName:'x',binderInfo:'default'})],{binderName:'A',binderInfo:'default'});
   text='fun (A : Type) => fun (x : A) => x';note='The two index-0 occurrences share one stored node. In the inner domain it refers to A; in the inner body it refers to x. Follow each dashed scope reference.';
  }else if(id==='let'){
   root=add('lam',[nat,add('letE',[nat,v,v],{binderName:'y',nondep:false})],{binderName:'x',binderInfo:'default'});
   text='fun (x : Nat) => let y : Nat := x; y';note='The value x uses the outer context. Only the body y sees the new local definition. Focus y to see its binder outside the selected subtree.';
  }else if(id==='application'){
   const zero=c('Nat.zero'),succ=c('Nat.succ'),one=add('app',[succ,zero]);root=add('app',[add('app',[c('Nat.add'),one]),one]);
   text='Nat.add (Nat.succ Nat.zero) (Nat.succ Nat.zero)';note='The two arguments share a stored subterm but retain two occurrence routes. Folding groups the left application spine without removing implicit arguments or checking saturation.';
  }else if(id==='scale'){
   root=c('f');for(let i=0;i<60;i++)root=add('app',[root,root]);
   text='e₀ = f; eₙ₊₁ = app eₙ eₙ; inspect e₆₀';note='A deliberately untyped shared-DAG stress example. The expanded tree has 2⁶¹ − 1 occurrences. A bounded cut accounts for them without expanding that tree. This demonstrates structural scaling, not a readable mathematical explanation.';
  }else throw Error('Unknown manual example');
  d.roots=[root];return {id,data:d,record:{name:d.declaration.name,kind:'definition',indexSha256:'authored-illustration-'+id,sourceSha256:'no-source-certificate'},text,note};
 }
 const api={ids:['scope','let','application','scale'],example};if(typeof module!=='undefined'&&module.exports)module.exports=api;else host.ProofAtlasManualExamples=api;
})(typeof window==='undefined'?globalThis:window);
