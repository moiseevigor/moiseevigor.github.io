/* Independent de Bruijn accounting for native-expected/source vs Pi-local binders. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict');
const get=n=>require(path.resolve(__dirname,'../../../public/js/proof-atlas-'+n));
const T=get('deep-context'),P=get('packed-routes'),A=get('library-data'),M=require('./model.cjs'),{cases}=require('./inputs.cjs');
const key=r=>r.root+':'+r.depth+':'+r.slots;
function sameSyntax(g,a,b){
 const todo=[[a,b]],seen=new Set();while(todo.length){const[x,y]=todo.pop(),k=x+':'+y;if(seen.has(k))continue;seen.add(k);assert.equal(g.kind[x],g.kind[y]);assert.equal(A.payloadKey(g.kind[x],g.payloads[x]),A.payloadKey(g.kind[y],g.payloads[y]));assert.equal(g.children[x].length,g.children[y].length);g.children[x].forEach((v,i)=>todo.push([v,g.children[y][i]]));}return seen.size;
}
(async()=>{
 const out={status:'RUNNING',profiles:0,introductions:0,syntaxPairs:0,scopeStates:0,innerBinderStates:0,introducedBinderStates:0,outerContextStates:0,sameRootDifferentBinderNamespaces:0,maxScopeStates:0,rows:[]};
 for await(const x of cases()){
  if(x.core)continue;out.profiles++;const model=M.open(x.c,x.captions,x.edition);
  for(const e of x.c.entries){const c=T.construction(e,x.c.data);if(c?.rule!=='Pi-introduction')continue;
   const unit=(await model.create(e.route,{maxUnits:1})).units[0],g=c.entry.typeData,n=e.contextLength,root=g.roots[0],expected=c.components.expectedBody,observed=g.children[root][1];
   assert.equal(unit.ports.expectedBody.root,expected);assert.equal(unit.ports.codomain.root,observed);assert.equal(g.kind[root],7);out.syntaxPairs+=sameSyntax(g,expected,observed);
   const todo=[{a:expected,b:observed,depth:0,slots:[]}],seen=new Set(),counts={inner:0,introduced:0,outer:0};
   while(todo.length){const s=todo.pop(),k=s.a+':'+s.b+':'+s.depth;if(seen.has(k))continue;assert(seen.size<65536,'Independent scope audit bound');seen.add(k);
    assert.equal(g.kind[s.a],g.kind[s.b]);assert.equal(A.payloadKey(g.kind[s.a],g.payloads[s.a]),A.payloadKey(g.kind[s.b],g.payloads[s.b]));
    if(g.kind[s.a]===0){
     const index=g.payloads[s.a].index;assert.equal(index,g.payloads[s.b].index);
     if(index<s.depth){counts.inner++;assert(index<s.depth+1);}
     else if(index===s.depth){counts.introduced++;assert.equal(n-(index-s.depth),n);assert.equal(index,s.depth);assert.equal(unit.ports.expectedBody.context.length,n+1);assert.equal(unit.ports.codomain.context.typeLocalBinders,1);assert.equal(unit.ports.expectedBody.context.sourceBinder.namespace,'original-source');assert.equal(unit.binderCorrespondence.typeBinder.namespace,'computed-native-type');assert.equal(key(unit.binderCorrespondence.sourceBinder.route),key(e.route));assert.equal(unit.binderCorrespondence.typeBinder.root,root);}
     else{
      // Expected D starts in Γ+x. R's codomain starts below one Pi-local binder.
      const expectedOrdinal=(n+1)-1-(index-s.depth),observedOrdinal=n-1-(index-(s.depth+1));
      assert.equal(expectedOrdinal,observedOrdinal);assert(expectedOrdinal>=0&&expectedOrdinal<n);
      const binder=e.contextAt(expectedOrdinal),source=P.resolve(x.c.data,binder.route);assert.equal(source.node,binder.node);assert.equal(source.scopeDepth,expectedOrdinal);counts.outer++;
     }
    }
    for(const[slot,id]of g.children[s.a].entries()){
     const introduces=([6,7].includes(g.kind[s.a])&&slot===1)||(g.kind[s.a]===8&&slot===2);
     todo.push({a:id,b:g.children[s.b][slot],depth:s.depth+(introduces?1:0),slots:[...s.slots,slot]});
    }
   }
   if(expected===observed&&counts.introduced)out.sameRootDifferentBinderNamespaces++;
   out.introductions++;out.scopeStates+=seen.size;out.maxScopeStates=Math.max(out.maxScopeStates,seen.size);out.innerBinderStates+=counts.inner;out.introducedBinderStates+=counts.introduced;out.outerContextStates+=counts.outer;
   out.rows.push({name:x.record.name,edition:x.edition,route:e.route,contextLength:n,expectedRoot:expected,observedRoot:observed,scopeStates:seen.size,counts});
  }
 }
 assert.equal(out.profiles,26);assert.equal(out.introductions,209);assert(out.introducedBinderStates>0&&out.outerContextStates>0&&out.innerBinderStates>0&&out.sameRootDifferentBinderNamespaces>0);
 out.status='PASS';out.scope='Finite symbolic de Bruijn scope-state check. Expected D uses original Γ+x; the observed codomain uses a computed Pi-local binder plus Γ. Matching syntax/root IDs do not identify those binders. Repeated DAG node/depth states are memoized; this is not an enumeration of every expanded occurrence, a new typing judgment or general preservation theorem.';
 fs.writeFileSync(path.join(__dirname,'binder-correspondence-verification.json'),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({...out,rows:undefined}));
})().catch(e=>{console.error(e.stack);process.exit(1)});
