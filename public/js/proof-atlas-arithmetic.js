// Read bounded operator trees directly at selected occurrence routes.
(function(host){
 'use strict';
 const common=typeof module!=='undefined' && module.exports;
 const A=common?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
 const binaryTypes=['left type','right type','result type','instance'];
 const operators=new Map([
  ...[['HPow.hPow','^'],['HAdd.hAdd','+'],['HSub.hSub','−'],['HMul.hMul','×'],['HDiv.hDiv','/']]
   .map(([name,symbol])=>[name,{symbol,parameters:binaryTypes}]),
  ['Or',{symbol:'∨',parameters:[],logical:true}],
  ['And',{symbol:'∧',parameters:[],logical:true}],
  ['Eq',{symbol:'=',parameters:['type'],relation:true}],
  ['Ne',{symbol:'≠',parameters:['type'],relation:true}],
  ['LE.le',{symbol:'≤',parameters:['type','order instance'],relation:true}],
  ['GE.ge',{symbol:'≥',parameters:['type','order instance'],relation:true}],
  ['LT.lt',{symbol:'<',parameters:['type','order instance'],relation:true}],
  ['Real.sqrt',{symbol:'√',parameters:[],unary:true}],
  ['abs',{symbol:'abs',parameters:['type','lattice instance','group instance'],unary:true}]
 ]);
 function formula(data,at,maxDepth=3,allowAtomicRoot=false){
  if(![3,6].includes(maxDepth))throw RangeError('Unsupported formula depth');
  function child(site,slot){
   return {node:data.children[site.node][slot],route:{root:site.route.root,slots:site.route.slots.concat(slot)}};
  }
  function read(site,depth){
   let head=site;
   const args=[];
   while(data.kind[head.node]===5 && args.length<6){
    args.unshift(child(head,1));head=child(head,0);
   }
   const name=data.kind[head.node]===4?data.payloads[head.node].name:null;
   const op=operators.get(name);
   const recognized=op && args.length===op.parameters.length+(op.unary?1:2);
   if(depth<maxDepth && recognized){
    return {site,name,head,symbol:op.symbol,relation:op.relation,logical:op.logical,parameterNames:op.parameters,
     parameters:args.slice(0,op.parameters.length),left:read(args[op.parameters.length],depth+1),
     right:op.unary?null:read(args.at(-1),depth+1)};
   }
   if(!depth && !allowAtomicRoot)return null;
   let label='e'+site.node;
   const p=data.payloads[site.node];
   if(data.kind[site.node]===0){
    const binding=A.binding(data,site.route);
    if(binding){const b=data.payloads[binding.node];label=b.binderName||b.declName||label;}
   }else if(data.kind[site.node]===4)label=p.name;
   else if(data.kind[site.node]===9 && p.literalKind==='natVal')label=String(p.value);
   else if(args.length===3 && (name==='Nat.rawCast'||name==='OfNat.ofNat')){
    const literal=args[name==='Nat.rawCast'?2:1],lp=data.payloads[literal.node];
    if(data.kind[literal.node]===9 && lp.literalKind==='natVal')label=name+'('+lp.value+')';
   }
   else if(name && args.length>0 && args.length<=3 && args.every(a=>data.kind[a.node]===0)){
    const variables=args.map(a=>{
     const bound=A.binding(data,a.route),p=bound && data.payloads[bound.node];
     return {site:a,label:p?.binderName||p?.declName||'e'+a.node};
    });
    return {site,label:name,variables};
   }
   return {site,label,expandable:Boolean(recognized)};
  }
  return read(at,0);
 }
 function statement(data,at){
  const binders=[];
  let focus=at,proof=data.roots[1];
  if(at.route.root===0 && !at.route.slots.length){
   while(data.kind[focus.node]===7 && binders.length<128){
    const [domain,body]=data.children[focus.node],slots=focus.route.slots;
    const matched=proof!=null && data.kind[proof]===6 && data.children[proof][0]===domain &&
     data.payloads[proof].binderInfo===data.payloads[focus.node].binderInfo;
    const proofBinder=matched?{node:proof,route:{root:1,slots}}:null;
    proof=matched?data.children[proof][1]:null;
    binders.push({proofBinder,site:focus,name:data.payloads[focus.node].binderName||'_',
     domain:{node:domain,route:{root:0,slots:slots.concat(0)}}});
    focus={node:body,route:{root:0,slots:slots.concat(1)}};
   }
  }
  return {focus,binders};
 }
 function caption(t){
  if(t.variables)return t.label+'('+t.variables.map(v=>v.label).join(', ')+')';
  if(!t.symbol)return t.label;
  if(!t.right)return t.symbol+'('+caption(t.left)+')';
  const operand=v=>v.right?'('+caption(v)+')':caption(v);
  return operand(t.left)+' '+t.symbol+' '+operand(t.right);
 }
 function hypothesisInputs(data,at){
  if(at.route.root!==1 || data.kind[at.node]!==5)return null;
  const slots=at.route.slots;
  if(slots.at(-1)===0 && data.kind[A.walk(data,{root:1,slots:slots.slice(0,-1)})]===5)return null;
  let node=at.node;
  const args=[];
  while(data.kind[node]===5 && args.length<32){
   args.unshift(data.children[node][1]);node=data.children[node][0];
  }
  if(data.kind[node]!==4 || args.filter(arg=>data.kind[arg]===0).length<2)return null;
  const {binders}=statement(data,{node:data.roots[0],route:{root:0,slots:[]}}),inputs=[];
  for(const [i,arg] of args.entries()){
   if(data.kind[arg]!==0)continue;
   const site={node:arg,route:{root:1,slots:slots.concat(Array(args.length-i-1).fill(0),1)}};
   const binding=A.binding(data,site.route);
   const b=binding && binders[binding.route.slots.length];
   if(!b?.proofBinder || b.proofBinder.node!==binding.node || !binding.route.slots.every(k=>k===1))continue;
   const condition=formula(data,b.domain);
   if(condition?.relation)inputs.push({binder:b,site,slot:i+1,label:caption(condition)});
  }
  if(new Set(inputs.map(input=>input.binder)).size<2)return null;
  return {name:data.payloads[node].name,head:{node,route:{root:1,slots:slots.concat(Array(args.length).fill(0))}},inputs};
 }
 function resultFlow(data,site){
  const refs=common?require('./proof-atlas-omitted-references'):host.ProofAtlasOmittedReferences;
  const count=common?require('./proof-atlas-recursive-inputs').countReferences:host.ProofAtlasRecursiveInputs.countReferences;
  const receiver=refs.applicationAtUse(data,site,{includePeers:false}),value=receiver?.call||site;
  const result={receiver};
  if(receiver?.label==='Or.casesOn' && data.kind[receiver.head.node]===4 && receiver.slot===4 && receiver.arity===6){
   function argument(i){
    const route={root:value.route.root,slots:value.route.slots.concat(Array(6-i).fill(0),1)};
    return {route,node:A.walk(data,route)};
   }
   function condition(at,depth){
    const [fn,right]=data.children[at.node];
    if(depth<3 && data.kind[at.node]===5 && data.kind[fn]===5){
     const [head,left]=data.children[fn];
     if(data.kind[head]===4 && data.payloads[head].name==='And'){
      const part=(node,path)=>condition({node,route:{root:at.route.root,slots:at.route.slots.concat(path)}},depth+1);
      return '('+part(left,[0,1])+' ∧ '+part(right,[1])+')';
     }
    }
    const t=formula(data,at);return t?caption(t):'e'+at.node;
   }
   result.cases=[1,2].map(i=>{
    const domain=argument(i);
    return {domain,label:condition(domain,0),branch:argument(i+4)};
   });
  }
  if(value.route.slots.at(-1)!==1)return result;
  const route={root:value.route.root,slots:value.route.slots.slice(0,-1)},node=A.walk(data,route);
  if(data.kind[node]!==8 || data.children[node][1]!==value.node)return result;
  const type={node:data.children[node][0],route:{root:route.root,slots:route.slots.concat(0)}};
  const t=formula(data,type,6);
  result.local={name:data.payloads[node].declName||'local result',site:{node,route},type,label:t?caption(t):'e'+type.node};
  const found=count(data,data.children[node][2],0,{maxStates:8192,maxWork:16384,useSupport:false,firstIfPresent:true});
  if(found.status!=='counted')return result;
  result.local.references=found.occurrences;
  if(found.witness){
   const use={node:found.witness.node,route:{root:route.root,slots:route.slots.concat(2,found.witness.slots)}};
   const binding=A.binding(data,use.route);
   if(binding?.node!==node || String(binding.route.slots)!==String(route.slots))throw Error('Local result binder mismatch');
   result.local.use=use;result.local.next=refs.applicationAtUse(data,use,{includePeers:false});
  }
  return result;
 }
 function namedArguments(data,site,name,arity){
  const child=(site,slot)=>({node:data.children[site.node][slot],route:{root:site.route.root,slots:site.route.slots.concat(slot)}});
  const args=[];
  for(let i=0;i<arity;i++){
   if(data.kind[site.node]!==5)return null;
   args.unshift(child(site,1));site=child(site,0);
  }
  return data.kind[site.node]===4 && data.payloads[site.node].name===name?args:null;
 }
 function rewriteSide(data,cast,before,after,reverse){
  if(!before?.right || !after?.right || before.head.node!==after.head.node ||
     before.parameters.some((p,i)=>p.node!==after.parameters[i].node))return null;
  let witness=cast[2];
  const identity=namedArguments(data,witness,'id',2);
  if(identity){
   const proposition=namedArguments(data,identity[0],'Eq',3);
   if(!proposition || proposition[1].node!==cast[0].node || proposition[2].node!==cast[1].node)return null;
   witness=identity[1];
  }
  const equality=namedArguments(data,witness,'congrArg',6);
  if(!equality)return null;
  for(const [side,other] of [['left','right'],['right','left']]){
   if(before[other].site.node!==after[other].site.node)continue;
   let from=before[side].site,to=after[side].site;
   const path=[];
   while(from.node!==to.node){
    if(equality[reverse?3:2].node===from.node && equality[reverse?2:3].node===to.node)
     return {side,path,from,to,witness,context:equality[4],certificate:equality[5]};
    if(path.length===32 || data.kind[from.node]!==5 || data.kind[to.node]!==5)break;
    const a=data.children[from.node],b=data.children[to.node];
    const slot=a[0]===b[0]?1:0;
    if(a[1-slot]!==b[1-slot] || a[slot]===b[slot])break;
    path.push(slot);
    from={node:a[slot],route:{root:from.route.root,slots:from.route.slots.concat(slot)}};
    to={node:b[slot],route:{root:to.route.root,slots:to.route.slots.concat(slot)}};
   }
  }
  return null;
 }
 function transportCall(data,at){
  const forward=namedArguments(data,at,'Eq.mp',4);
  const args=forward||namedArguments(data,at,'Eq.mpr',4);
  if(!args)return null;
  return {name:forward?'Eq.mp':'Eq.mpr',reverse:!forward,args,source:args[forward?0:1],
   target:args[forward?1:0],proofs:args.slice(2)};
 }
 function congruenceCall(data,at){
  const a=namedArguments(data,at,'congrArg',6);
  if(a)return {name:'congrArg',functions:[a[4],a[4]],operands:a.slice(2,4),proofs:[a[5]]};
  const c=namedArguments(data,at,'congr',8);
  return c?{name:'congr',functions:c.slice(2,4),operands:c.slice(4,6),proofs:c.slice(6)}:null;
 }
 function formulaTransport(data,at){
  const call=transportCall(data,at);
  if(!call)return null;
  const {args:cast,reverse}=call;
  const before=formula(data,call.source),after=formula(data,call.target);
  if(!before || !after)return null;
  return {before,after,equality:cast[2],premise:cast[3],reverse,change:rewriteSide(data,cast,before,after,reverse)};
 }
 // Operand positions and premise order follow Mathlib.Tactic.Linarith.Lemmas.
 const arithmeticRules={
  lt_of_lt_of_eq:[7,'a < 0','b = 0','a + b < 0'],
  lt_of_eq_of_lt:[7,'a = 0','b < 0','a + b < 0'],
  add_neg:[8,'a < 0','b < 0','a + b < 0'],
  add_lt_of_le_of_neg:[9,'b ≤ c','a < 0','b + a < c'],
  add_lt_of_neg_of_le:[9,'a < 0','b ≤ c','a + b < c'],
  mul_neg:[8,'a < 0','0 < b','b × a < 0'],
  mul_nonpos:[8,'a ≤ 0','0 < b','b × a ≤ 0'],
  mul_zero_eq:[7,'R a 0','b = 0','a × b = 0'],
  zero_mul_eq:[7,'a = 0','R b 0','a × b = 0'],
  mul_eq:[8,'a = 0','0 < b','b × a = 0'],
  add_nonpos:[8,'a ≤ 0','b ≤ 0','a + b ≤ 0'],
  le_of_le_of_eq:[7,'a ≤ 0','b = 0','a + b ≤ 0'],
  sub_nonpos_of_le:[7,'a ≤ b','a − b ≤ 0'],
  sub_neg_of_lt:[7,'a < b','a − b < 0']
 };
 const signRules=new Map([
  ['Mathlib.Tactic.Linarith.zero_lt_one',{arity:4,terms:[0],labels:['Ordered type'],premises:[],conclusion:'0 < 1'}],
  ['Mathlib.Tactic.RingNF.add_assoc_rev',{arity:5,terms:[2,3,4],premises:[],conclusion:'a + (b + c) = (a + b) + c'}],
  ['Mathlib.Tactic.CancelDenoms.derive_trans',{arity:8,terms:[2,3,4,5],labels:['a','b','c','d'],premises:['a = b','c × b = d'],conclusion:'c × a = d'}],
  ['mul_pos',{arity:8,terms:[2,3],premises:['0 < a','0 < b'],conclusion:'0 < a × b'}],
  ['Int.emod_eq_of_lt',{arity:4,terms:[0,1],premises:['0 ≤ a','a < b'],conclusion:'a % b = a'}],
  ['Mathlib.Tactic.CancelDenoms.add_subst',{arity:9,terms:[2,3,4,5,6],labels:['n','x','y','u','v'],
   premises:['n × x = u','n × y = v'],conclusion:'n × (x + y) = u + v'}],
  ['rfl',{arity:2,terms:[1],premises:[],conclusion:'a = a'}],
  ['Eq.refl',{arity:2,terms:[1],premises:[],conclusion:'a = a'}],
  ['Mathlib.Tactic.CancelDenoms.div_subst',{arity:11,terms:[2,3,4,5,6,7],labels:['m','n','k','x','y','u'],
   premises:['m × x = u','n / y = 1','m × n = k'],conclusion:'k × (x / y) = u'}],
  ['Mathlib.Tactic.CancelDenoms.mul_subst',{arity:12,terms:[2,3,4,5,6,7,8],labels:['m','n','k','x','y','u','v'],
   premises:['m × x = u','n × y = v','m × n = k'],conclusion:'k × (x × y) = u × v'}],
  ['Mathlib.Meta.NormNum.isNat_eq_true',{arity:7,terms:[2,3,4],labels:['a','b','n (natural)'],
   premises:['IsNat a n','IsNat b n'],conclusion:'a = b'}],
  ['Mathlib.Meta.NormNum.isNNRat_div',{arity:7,terms:[2,3,4,5],labels:['a','b','n (natural)','d (natural)'],
   premises:['IsNNRat (a × b⁻¹) n d'],conclusion:'IsNNRat (a / b) n d'}],
  ['Mathlib.Meta.NormNum.IsNNRat.to_eq',{arity:10,terms:[2,3,4,5,6],labels:['n (natural)','d (natural)','a','u','v'],
   premises:['IsNNRat a n d','↑n = u','↑d = v'],conclusion:'a = u / v'}],
  ['Mathlib.Tactic.CancelDenoms.sub_subst',{arity:9,terms:[2,3,4,5,6],labels:['n','x','y','u','v'],premises:['n × x = u','n × y = v'],conclusion:'n × (x − y) = u − v'}],
  ['neg_eq_zero',{arity:3,terms:[2],premises:[],conclusion:'−a = 0 ↔ a = 0'}],
  ['Int.add_one_le_iff',{arity:2,terms:[0,1],premises:[],conclusion:'a + 1 ≤ b ↔ a < b'}],
  ['le_of_lt',{arity:5,terms:[2,3],premises:['a < b'],conclusion:'a ≤ b'}],
  ['neg_neg_of_pos',{arity:6,terms:[4],premises:['0 < a'],conclusion:'−a < 0'}],
  ['Real.sq_sqrt',{arity:2,terms:[0],premises:['0 ≤ a'],conclusion:'(√a)² = a'}],
  ['sub_eq_zero_of_eq',{arity:5,terms:[2,3],premises:['a = b'],conclusion:'a − b = 0'}],
  ['mul_nonneg_of_nonpos_of_nonpos',{arity:11,terms:[3,4],premises:['a ≤ 0','b ≤ 0'],conclusion:'0 ≤ a × b'}],
  ['mul_pos_of_neg_of_neg',{arity:11,terms:[7,8],premises:['a < 0','b < 0'],conclusion:'0 < a × b'}],
  ['sq_nonneg',{arity:7,terms:[6],premises:[],conclusion:'0 ≤ a²'}]
 ]);
 function arithmeticInference(data,at){
  let head=at.node,arity=0;
  while(data.kind[head]===5 && arity<12){head=data.children[head][0];arity++;}
  if(data.kind[head]!==4)return null;
  const name=data.payloads[head].name,prefix='Mathlib.Tactic.Linarith.';
  const sign=signRules.get(name);
  if(sign){
   if(arity!==sign.arity)return null;
   const args=namedArguments(data,at,name,arity);
   return {name,labels:sign.labels,terms:sign.terms.map(i=>args[i]),proofs:args.slice(arity-sign.premises.length),
    premises:sign.premises,conclusion:sign.conclusion};
  }
  if(!name.startsWith(prefix))return null;
  const rule=arithmeticRules[name.slice(prefix.length)];
  if(!Array.isArray(rule)||arity!==rule[0])return null;
  const args=namedArguments(data,at,name,arity),count=arity===9?3:2;
  const premises=rule.slice(1,-1),n=premises.length;
  const helper=name.slice(prefix.length);
  const extra=helper==='mul_zero_eq'?0:(helper==='zero_mul_eq'||helper==='mul_eq'?1:null);
  const relation=helper==='mul_zero_eq'||helper==='zero_mul_eq'?args[1]:null;
  return {name,extra,relation,terms:args.slice(-n-count,-n),proofs:args.slice(-n),premises,conclusion:rule.at(-1)};
 }
 function numeralComparison(data,at){
  const args=namedArguments(data,at,'Mathlib.Meta.NormNum.isNat_lt_true',12);
  if(!args)return null;
  const values=[];
  for(const i of [0,1]){
   const term=args[5+i],literal=args[7+i],proof=args[9+i];
   const payload=data.payloads[literal.node],w=namedArguments(data,proof,'Mathlib.Meta.NormNum.isNat_ofNat',5);
   if(data.kind[literal.node]!==9 || payload.literalKind!=='natVal' || !w ||
      w[0].node!==args[0].node || w[2].node!==term.node || w[3].node!==literal.node)return null;
   values.push({term,literal,proof,text:String(payload.value)});
  }
  const comparison=args[11],refl=namedArguments(data,comparison,'Eq.refl',2);
  if(!refl || !['Bool','Bool.false'].every((name,i)=>data.kind[refl[i].node]===4 && data.payloads[refl[i].node].name===name) ||
     BigInt(values[0].text)>=BigInt(values[1].text))return null;
  return {values,comparison,carrier:args[0]};
 }
 function logicalInference(data,at){
  let head=at.node,arity=0;
  while(data.kind[head]===5 && arity<4){head=data.children[head][0];arity++;}
  if(data.kind[head]!==4)return null;
  const name=data.payloads[head].name,conjunction=name==='And.left'||name==='And.right';
  if(conjunction?arity!==3:arity!==4 || (name!=='Iff.mp' && name!=='Iff.mpr'))return null;
  const args=namedArguments(data,at,name,arity);
  const output=name==='And.left'||name==='Iff.mpr'?0:1;
  return {name,conjunction,propositions:args.slice(0,2),output,proofs:args.slice(2)};
 }
 function zeroDifference(data,logical){
  if(logical?.name!=='Iff.mpr')return null;
  const subtract=namedArguments(data,logical.proofs[1],'sub_eq_zero_of_eq',5);
  const negate=namedArguments(data,logical.proofs[0],'neg_eq_zero',3);
  if(!subtract||!negate)return null;
  const source=namedArguments(data,logical.propositions[1],'Eq',3);
  const target=namedArguments(data,logical.propositions[0],'Eq',3);
  if(!source||!target||source[2].node!==target[2].node)return null;
  const diff=namedArguments(data,source[1],'HSub.hSub',6);
  const neg=namedArguments(data,target[1],'Neg.neg',3);
  const zero=namedArguments(data,source[2],'OfNat.ofNat',3);
  if(!diff||!neg||!zero)return null;
  const carrier=source[0].node;
  if([target[0],subtract[0],negate[0],neg[0],zero[0],...diff.slice(0,3)].some(site=>site.node!==carrier))return null;
  if(data.kind[zero[1].node]!==9||data.payloads[zero[1].node].literalKind!=='natVal'||String(data.payloads[zero[1].node].value)!=='0')return null;
  if(diff[4].node!==subtract[2].node||diff[5].node!==subtract[3].node||
     neg[2].node!==source[1].node||negate[2].node!==source[1].node)return null;
  return {left:subtract[2],right:subtract[3],equality:subtract[4],difference:logical.proofs[1],equivalence:logical.proofs[0]};
 }
 function boundPremise(data,site){
  if(data.kind[site.node]!==0)return null;
  const binder=A.binding(data,site.route);
  if(!binder)return null;
  const field=slot=>({node:data.children[binder.node][slot],route:{root:binder.route.root,slots:binder.route.slots.concat(slot)}});
  const payload=data.payloads[binder.node];
  return {site,binder,name:payload.binderName||payload.declName||'Bound variable',domain:field(0),
   value:data.kind[binder.node]===8?field(1):null};
 }
 function statementOrigin(data,bound){
  if(bound.binder.route.root!==1 || !bound.binder.route.slots.every(k=>k===1))return null;
  const {binders}=statement(data,{node:data.roots[0],route:{root:0,slots:[]}});
  const b=binders[bound.binder.route.slots.length];
  return b?.proofBinder?.node===bound.binder.node?b:null;
 }
 function binderArgument(data,bound){
  if(data.kind[bound.binder.node]!==6||bound.binder.route.slots.at(-1)!==1)return null;
  const calls=common?require('./proof-atlas-omitted-references'):host.ProofAtlasOmittedReferences;
  const call=calls.applicationAtUse(data,bound.binder,{includePeers:false});
  return call?.slot>0?call:null;
 }
 // Number occurrences of a shared row under the selected root in child order.
 function rowCopies(data,site){
  const target=site.node,root=data.roots[site.route.root];
  const limit=200000,span=root-target;
  const ways=new Map([[target,1n]]);
  function countRow(n){
   let count=0n;
   for(const c of data.children[n])count+=ways.get(c)||0n;
   if(count)ways.set(n,count);
  }
  let visited=span;
  if(span<=limit){
   for(let n=target+1;n<=root;n++)countRow(n);
  }else{
   // Child row numbers strictly decrease. Rows below the binder cannot reach it.
   const pending=[root],above=new Set();
   while(pending.length){
    const n=pending.pop();
    if(n<=target || above.has(n))continue;
    if(above.size===limit)return null;
    above.add(n);
    for(const child of data.children[n])if(child>target)pending.push(child);
   }
   visited=above.size;
   for(const n of [...above].sort((a,b)=>a-b))countRow(n);
  }
  const total=ways.get(root);
  let node=root,rank=0n;
  for(const k of site.route.slots){
   for(let i=0;i<k;i++)rank+=ways.get(data.children[node][i])||0n;
   node=data.children[node][k];
  }
  function select(index){
   if(typeof index!=='bigint'||index<0n||index>=total)throw RangeError('Invalid occurrence');
   let n=root;
   const slots=[];
   while(n!==target){
    const children=data.children[n];let k=0;
    for(;k<children.length;k++){
     const size=ways.get(children[k])||0n;
     if(index<size)break;
     index-=size;
    }
    if(k===children.length)throw Error('Inconsistent occurrence count');
    slots.push(k);n=children[k];
   }
   return {node:target,route:{root:site.route.root,slots}};
  }
  return {total,rank,select,visited};
 }
 function binderCopies(data,site){
  const bound=boundPremise(data,site);
  const copies=bound && rowCopies(data,bound.binder);
  if(!copies)return null;
  const suffix=site.route.slots.slice(bound.binder.route.slots.length);
  function select(index){
   const binder=copies.select(index);
   return {binder,reference:{node:site.node,route:{root:site.route.root,slots:binder.route.slots.concat(suffix)}}};
  }
  return {...copies,select};
 }
 // One witness for the farthest enclosing binder required by this expression.
 function outerReference(data,site){
  let node=site.node;
  if(!data.neededScope[node])return null;
  const slots=site.route.slots.slice();
  while(data.kind[node]!==0){
   const fields=A.fields[A.kinds[data.kind[node]]];
   const k=data.children[node].findIndex((child,i)=>data.neededScope[child]-Number(fields[i]==='body')===data.neededScope[node]);
   if(k<0)throw Error('Missing external reference');
   slots.push(k);node=data.children[node][k];
  }
  const reference={node,route:{root:site.route.root,slots}};
  return {reference,binder:A.binding(data,reference.route)};
 }
 // The closest used external binder determines the path to every farther one.
 function nearestReference(data,site,limit=8192){
  if(!data.neededScope[site.node])return null;
  const todo=[{node:site.node,depth:0,parent:null}],seen=new Set();
  let best=null,index=Infinity;
  while(todo.length){
   const item=todo.pop(),{node,depth}=item;
   if(data.neededScope[node]<=depth)continue;
   const key=node+':'+depth;
   if(seen.has(key))continue;
   if(seen.size>=limit)return null;
   seen.add(key);
   if(data.kind[node]===0){
    const free=data.payloads[node].index-depth;
    if(free<index){best=item;index=free;}
    if(index===0)break;
    continue;
   }
   const children=data.children[node],fields=A.fields[A.kinds[data.kind[node]]];
   for(let k=children.length-1;k>=0;k--)todo.push({node:children[k],depth:depth+Number(fields[k]==='body'),parent:item,slot:k});
  }
  if(!best)return null;
  const suffix=[];
  for(let p=best;p.parent;p=p.parent)suffix.push(p.slot);
  const reference={node:best.node,route:{root:site.route.root,slots:site.route.slots.concat(suffix.reverse())}};
  return {reference,binder:A.binding(data,reference.route)};
 }
 // Find the first body field on which an introduced binder is used.
 function firstBindingBody(data,root,limit=8192){
  const pending=[root],rows=new Set();
  while(pending.length){
   const n=pending.pop();
   if(rows.has(n))continue;
   if(rows.size>=limit)return {limited:true};
   rows.add(n);
   for(const child of data.children[n])pending.push(child);
  }
  const free=new Map(),distance=new Map(),choice=new Map();
  let entries=0;
  for(const n of [...rows].sort((a,b)=>a-b)){
   const used=new Set(),fields=A.fields[A.kinds[data.kind[n]]];
   if(data.kind[n]===0)used.add(data.payloads[n].index);
   let shortest=Infinity;
   data.children[n].forEach((child,k)=>{
    const body=fields[k]==='body',indices=free.get(child);
    const depth=body && indices.has(0)?1:1+distance.get(child);
    if(depth<shortest){shortest=depth;choice.set(n,k);}
    for(const index of indices)if(!body||index>0)used.add(index-Number(body));
   });
   entries+=used.size;
   if(entries>4*limit)return {limited:true};
   free.set(n,used);distance.set(n,shortest);
  }
  const slots=[],fields=[];
  let n=root;
  while(choice.has(n)){
   const k=choice.get(n);
   slots.push(k);fields.push(A.fields[A.kinds[data.kind[n]]][k]);
   if(distance.get(n)===1)return {slots,fields,binder:n,body:data.children[n][k]};
   n=data.children[n][k];
  }
  return {slots:null};
 }
 function equalityChain(data,at,expected){
  const args=namedArguments(data,at,'Eq.trans',6);
  if(!args)return null;
  const [type,start,middle,end,first,second]=args;
  if(expected && (expected.name!=='Eq' || expected.parameters[0].node!==type.node ||
     expected.left.site.node!==start.node || expected.right.site.node!==end.node))return null;
  return {name:'Eq.trans',start,middle,end,first,second,proofs:[first,second]};
 }
 function rewriteSequence(data,at,selected){
  const steps=[{at,term:selected}];
  let current=selected;
  while(steps.length<8){
   const previous=formulaTransport(data,current.premise);
   if(!previous?.change || previous.after.site.node!==current.before.site.node)break;
   steps.push({at:current.premise,term:previous});
   current=previous;
  }
  return steps.reverse();
 }
 function closingOrderArgument(data){
  if(data.roots[1]==null)return null;
  const child=(site,slot)=>({node:data.children[site.node][slot],route:{root:site.route.root,slots:site.route.slots.concat(slot)}});
  let goal={node:data.roots[0],route:{root:0,slots:[]}},proof={node:data.roots[1],route:{root:1,slots:[]}};
  while(data.kind[goal.node]===7 && goal.route.slots.length<128){
   if(data.kind[proof.node]!==6 || data.children[proof.node][0]!==data.children[goal.node][0] ||
      data.payloads[proof.node].binderInfo!==data.payloads[goal.node].binderInfo)return null;
   goal=child(goal,1);proof=child(proof,1);
  }
  const args=namedArguments(data,proof,'le_of_not_gt',5);
  if(!args||data.kind[args[4].node]!==6)return null;
  const statement=formula(data,goal),domain=child(args[4],0),contrary=formula(data,domain);
  const [a,b]=args.slice(2,4);
  if(!statement || !['LE.le','GE.ge'].includes(statement.name) || contrary?.name!=='LT.lt')return null;
  const [left,right]=statement.name==='LE.le'?[a,b]:[b,a];
  if(statement.parameters[0].node!==args[0].node || contrary.parameters[0].node!==args[0].node ||
     statement.left.site.node!==left.node || statement.right.site.node!==right.node ||
     contrary.left.site.node!==b.node || contrary.right.site.node!==a.node)return null;
  const close=child(args[4],1),end=namedArguments(data,close,'Mathlib.Tactic.Linarith.lt_irrefl',4);
  if(!end)return null;
  const numeral=namedArguments(data,end[2],'OfNat.ofNat',3);
  const literal=numeral && data.kind[numeral[1].node]===9?data.payloads[numeral[1].node]:null;
  const operandLabel=literal?.literalKind==='natVal'?'OfNat.ofNat('+literal.value+')':'e'+end[2].node;
  const candidate=formulaTransport(data,end[3]);
  const transport=candidate?.before.name==='LT.lt' && candidate.after.name==='LT.lt'?candidate:null;
  return {goal,statement,proof,domain,contrary,close,operand:end[2],operandLabel,evidence:end[3],transport};
 }
 function contraryUses(data,order){
  const refs=common?require('./proof-atlas-recursive-inputs'):host.ProofAtlasRecursiveInputs;
  const calls=common?require('./proof-atlas-omitted-references'):host.ProofAtlasOmittedReferences;
  const budget={maxStates:8192,maxWork:16384,useSupport:true};
  const count=options=>refs.countReferences(data,order.close.node,0,{...budget,...options});
  const first=count({firstIfPresent:true}),uses=[];
  if(first.status!=='counted')return {uses,limited:true};
  const total=BigInt(first.occurrences),binder=order.close.route.slots.slice(0,-1);
  for(let rank=1n;rank<=total && rank<=8n;rank++){
   const result=rank===1n?first:count({ordinal:rank});
   if(!result.witness)break;
   const site={node:result.witness.node,route:{root:1,slots:order.close.route.slots.concat(result.witness.slots)}};
   const binding=A.binding(data,site.route);
   if(!binding || String(binding.route.slots)!==String(binder))throw Error('Contrary assumption scope mismatch');
   const chain=[],boundary=order.evidence.route.slots;
   let cursor=site;
   while(chain.length<32 && cursor.route.slots.length>boundary.length &&
         boundary.every((v,i)=>cursor.route.slots[i]===v)){
    const c=calls.applicationAtUse(data,cursor,{includePeers:false});
    if(!c || c.call.route.slots.length<boundary.length)break;
    chain.push(c);cursor=c.call;
   }
   const reached=cursor.node===order.evidence.node && String(cursor.route.slots)===String(boundary);
   uses.push({site,first:chain[0],next:chain[1],chain,reached});
  }
  return {uses,total:String(total),limited:BigInt(uses.length)<total};
 }
 function derivationInputs(data,root,limit=1024){
  const todo=[root],inputs=new Map(),theorems=new Map(),unexplained=new Map();
  let visits=0,steps=0,certificates=0,unread=0,firstUnread=null;
  while(todo.length && visits<limit){
   const site=todo.pop();visits++;
   const b=boundPremise(data,site);
   if(b && data.kind[b.binder.node]===6){
    const key=b.binder.route.slots.join('.');
    if(!inputs.has(key))inputs.set(key,{binding:b,origin:statementOrigin(data,b),uses:0});
    inputs.get(key).uses++;continue;
   }
   if(numeralComparison(data,site)){certificates++;continue;}
   const rule=logicalInference(data,site)||arithmeticInference(data,site)||transportCall(data,site)||congruenceCall(data,site)||equalityChain(data,site);
   if(!rule){
    unread++;firstUnread??=site;
    let head=site.node;
    for(let i=0;i<32 && data.kind[head]===5;i++)head=data.children[head][0];
    const name=data.kind[head]===4?data.payloads[head].name:A.kinds[data.kind[head]];
    if(!unexplained.has(name))unexplained.set(name,[]);
    unexplained.get(name).push(site);
    continue;
   }
   steps++;
   if(!rule.proofs.length){
    if(!theorems.has(rule.name))theorems.set(rule.name,{name:rule.name,site,uses:0});
    theorems.get(rule.name).uses++;
   }
   for(let i=rule.proofs.length-1;i>=0;i--)todo.push(rule.proofs[i]);
  }
  return {inputs:[...inputs.values()],theorems:[...theorems.values()],visits,steps,certificates,unread,firstUnread,unexplained:[...unexplained].sort((a,b)=>b[1].length-a[1].length),limited:todo.length>0};
 }
 function mount(container,data,at,link){
  const el=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
  function premiseLink(label,site){
   const binding=boundPremise(data,site);
   if(!binding)return link(label,site);
   const a=link(label+' ('+binding.name+', binder e'+binding.binder.node+')',site);
   a.dataset.premiseBinder=String(binding.binder.node);
   return a;
  }
  function operandChange(t){
   const c=t.change,p=el('p');p.dataset.rewriteSide=c.side;
   const label=(tree,site)=>tree.site.node===site.node?caption(tree):caption(formula(data,site,3,true));
   p.append(c.path.length?'Inside the '+c.side+' operand, replace ':'The '+c.side+' operand changes from ',
    link(label(t.before[c.side],c.from),c.from),c.path.length?' with ':' to ',link(label(t.after[c.side],c.to),c.to),
    '. ',link(t.reverse?'Operand equality (used in reverse)':'Operand equality',c.certificate),' · ',link('Function applied to both sides',c.context));
   return p;
  }
  if(data.kind[at.node]===0){
   const binding=boundPremise(data,at),origin=binding && statementOrigin(data,binding);
   if(origin){
    const panel=el('section');panel.dataset.statementOrigin='';
    panel.append(el('h4','Introduced in the theorem statement'),link(origin.name,origin.site),' · ',
     link(caption(formula(data,origin.domain,3,true)),origin.domain));container.append(panel);
   }
   if(binding && !origin && at.route.root===1){
    const call=binderArgument(data,binding);
    if(call){
     const panel=el('section');panel.dataset.localArgumentOrigin='';
     panel.append(el('h4','Introduced inside a proof argument'),link(binding.name,binding.binder),' has type ',
      link(caption(formula(data,binding.domain,3,true)),binding.domain),'. Its function is argument '+call.slot+' of '+call.arity+' to ',link(call.label,call.call),'.');
     container.append(panel);
    }
   }
   const copies=el('details');copies.dataset.binderCopies='';
   copies.append(el('summary','Occurrences of this binder'));
   copies.ontoggle=()=>{
    if(!copies.open||copies.childElementCount>1)return;
    const model=binderCopies(data,at);
    if(!model){copies.append(el('p','Occurrence counts are unavailable for this selection.'));return;}
    copies.append(el('p','This introduction is '+(model.rank+1n)+' of '+model.total+' under this root.'));
    if(model.total===1n)return;
    const input=el('input'),label=el('label','Introduction number '),links=el('p');
    input.type='text';input.inputMode='numeric';input.value=String(model.rank+1n);label.append(input);
    function update(){
     links.replaceChildren();
     const raw=input.value.trim(),index=/^[1-9][0-9]*$/.test(raw)&&raw.length<=String(model.total).length?BigInt(raw):0n;
     if(!index||index>model.total){links.textContent='Enter a number from 1 to '+model.total+'.';return;}
     const hit=model.select(index-1n);
     links.append(link('Open introduction',hit.binder),' · ',link('Open corresponding reference',hit.reference));
    }
    input.oninput=update;update();copies.append(label,links);
   };
   container.append(copies);
  }
  if([5,6,7,8].includes(data.kind[at.node])){
   const panel=el('details');panel.dataset.compareScope='';
   panel.append(el('summary','Compare bindings across occurrences'));
   panel.ontoggle=()=>{
    if(!panel.open||panel.childElementCount>1)return;
    const copies=rowCopies(data,at);
    if(!copies){panel.append(el('p','Occurrence comparison exceeds the row limit.'));return;}
    if(copies.total===1n){panel.append(el('p','This expression occurs once under this root.'));return;}
    const selected=nearestReference(data,at);
    if(!selected && data.neededScope[at.node]){panel.append(el('p','The binder search reached its inspection limit.'));return;}
    const suffix=selected?.reference.route.slots.slice(at.route.slots.length),output=el('div');
    let bodyPath;
    output.setAttribute('aria-live','polite');
    const label=el('label','Compare with occurrence '),input=el('input');
    input.type='text';input.inputMode='numeric';input.value=String(copies.rank===0n?2n:1n);label.append(input);
    function show(title,site,hit){
     const line=el('p');
     if(!hit){line.append(link(title,site));return line;}
     const p=data.payloads[hit.binder.node];
     line.append(link(title,site),' · ',link('Variable',hit.reference),' → ',link(p.binderName||p.declName||'Binder',hit.binder));
     return line;
    }
    function update(){
     output.replaceChildren();
     const raw=input.value.trim();
     if(!/^[1-9][0-9]*$/.test(raw)||raw.length>String(copies.total).length||BigInt(raw)>copies.total){
      output.textContent='Enter a number from 1 to '+copies.total+'.';return;
     }
     const other=copies.select(BigInt(raw)-1n);
     const reference=selected && {node:selected.reference.node,route:{root:other.route.root,slots:other.route.slots.concat(suffix)}};
     const hit=reference && {reference,binder:A.binding(data,reference.route)};
     const same=!selected || String(selected.binder.route.slots)===String(hit.binder.route.slots);
     output.append(show('Occurrence '+raw,other,hit));
     if(selected)output.append(el('p',same?'All external variables refer to the same binders at both occurrences.':'The selected variable refers to a different binder.'));
     if(!same || BigInt(raw)===copies.rank+1n)return;
     bodyPath??=firstBindingBody(data,at.node);
     if(bodyPath.limited){output.append(el('p','Descendant comparison reached the inspection limit.'));return;}
     if(!bodyPath.slots){output.append(el('p','Binder targets agree along every child path.'));return;}
     output.append(el('p','First change after '+bodyPath.slots.length+' child '+(bodyPath.slots.length===1?'link':'links')+' · '+bodyPath.fields.join(' → ')));
     for(const [site,title] of [[at,'Selected body'],[other,'Comparison body']]){
      const slots=site.route.slots.concat(bodyPath.slots),root=site.route.root;
      const line=el('p');
      line.append(link(title,{node:bodyPath.body,route:{root,slots}}),' → ',
       link('Its binder',{node:bodyPath.binder,route:{root,slots:slots.slice(0,-1)}}));
      output.append(line);
     }
    }
    input.oninput=update;update();
    panel.append(el('p',selected?'The links follow the nearest enclosing binder used by this expression. Its location also fixes every farther enclosing binder.':'This expression uses no external variables.'),
     show('Selected occurrence '+(copies.rank+1n)+' of '+copies.total,at,selected),label,output);
   };
   container.append(panel);
  }
  const logical=logicalInference(data,at);
  if(logical){
   const panel=el('section'),line=el('p'),evidence=el('div');
   panel.dataset.logicalInference=logical.name;
   const expression=site=>link(caption(formula(data,site,3,true)),site);
   const [p,q]=logical.propositions,step=zeroDifference(data,logical);
   if(logical.conjunction){
    panel.append(el('h4',logical.output?'Take the right conjunct':'Take the left conjunct'));
    line.append(expression(p),' ∧ ',expression(q),' ⇒ ',expression(logical.propositions[logical.output]));
    evidence.append(premiseLink('Proof of the conjunction',logical.proofs[0]));
   }else if(step){
    panel.dataset.zeroDifference='';
    panel.append(el('h4','Equal terms have zero difference'));
    line.append('Let a = ',expression(step.left),' and b = ',expression(step.right),'.');
    const steps=el('ol');
    for(const [text,proof] of [['a = b',step.equality],['a − b = 0',step.difference],['−(a − b) = 0',p]]){
     const row=el('li');row.append(link(text,proof));steps.append(row);
    }
    evidence.append(steps,link('Equivalence used in reverse',step.equivalence));
   }else{
    panel.append(el('h4',logical.output?'Use the forward implication':'Use the reverse implication'));
    line.append(expression(logical.propositions[1-logical.output]),' ⇒ ',expression(logical.propositions[logical.output]));
    evidence.append(premiseLink('Proof of the equivalence',logical.proofs[0]),' · ',premiseLink('Proof of the premise',logical.proofs[1]));
   }
   panel.append(line,evidence);container.append(panel);
  }
  const numeral=numeralComparison(data,at);
  if(numeral){
   const panel=el('section'),details=el('details'),list=el('ul');
   panel.dataset.numeralComparison='';
   panel.append(el('h4',numeral.values.map(v=>v.text).join(' < ')));
   details.append(el('summary','Numeral comparison evidence'));
   for(const v of numeral.values){
    const row=el('li');row.append(link(v.text,v.literal),' · ',link('Term',v.term),' · ',link('Numeral witness',v.proof));list.append(row);
   }
   details.append(list,link('Boolean comparison proof',numeral.comparison),' · ',link('Ordered type',numeral.carrier));
   panel.append(details);container.append(panel);
  }
  const selected=formulaTransport(data,at);
  const congruence=congruenceCall(data,at);
  if(congruence){
   const panel=el('section'),line=el('p'),evidence=el('p');panel.dataset.congruence=congruence.name;
   panel.append(el('h4','Equality of function applications'));
   const term=site=>link(caption(formula(data,site,3,true)),site);
   for(let i=0;i<2;i++){
    if(i)line.append(' = ');
    line.append(term(congruence.functions[i]),'(',term(congruence.operands[i]),')');
   }
   if(congruence.proofs.length===2)evidence.append(link('Function equality',congruence.proofs[0]),' · ');
   evidence.append(link('Argument equality',congruence.proofs.at(-1)));
   panel.append(line,evidence);container.append(panel);
  }
  const transport=transportCall(data,at);
  if(transport){
   const panel=el('details'),line=el('p');
   panel.dataset.transportInputs='';
   panel.append(el('summary',transport.reverse?'Transport by equality in reverse':'Transport by equality'));
   const term=site=>link(caption(formula(data,site,3,true)),site);
   line.append(term(transport.source),' → ',term(transport.target));
   panel.append(line,link('Equality used',transport.proofs[0]),' · ',link('Input term',transport.proofs[1]));
   container.append(panel);
  }
  const chainAt=selected?.change?selected.premise:at;
  const bound=selected?.change && boundPremise(data,chainAt);
  if(bound){
   const panel=el('section'),line=el('p');panel.dataset.boundRewritePremise='';
   panel.append(el('h4',bound.value?'Local proof before the rewrite':'Bound premise before the rewrite'));
   line.append(link(bound.name,bound.site),' is bound at ',link('the introduction',bound.binder),
    ' with type ',link(caption(formula(data,bound.domain,3,true)),bound.domain),'.');
   if(bound.value)line.append(' ',link('Defining proof',bound.value));
   panel.append(line);container.append(panel);
  }
  const inference=arithmeticInference(data,chainAt);
  if(inference){
   const panel=el('section'),inputs=el('p'),terms=el('dl');
   panel.dataset.arithmeticInference='';
   const reflexive=inference.name==='rfl'||inference.name==='Eq.refl';
   panel.append(el('h4',reflexive?'Equality by reflexivity':selected?.change?'Arithmetic before the rewrite':'Arithmetic inference'));
   if(inference.name==='Mathlib.Meta.NormNum.isNat_eq_true')
    panel.append(el('p','Both operands represent the same natural number n. Each premise identifies one operand with its cast.'));
   if(inference.name==='Mathlib.Meta.NormNum.isNNRat_div'||inference.name==='Mathlib.Meta.NormNum.IsNNRat.to_eq')
    panel.append(el('p','IsNNRat records an invertible denominator and identifies the value with the numerator times its inverse.'));
   let shown=0,fold=null;
   inference.proofs.forEach((proof,i)=>{
    const cert=numeralComparison(data,proof);
    const label=cert?inference.premises[i]+' ('+cert.values.map(v=>v.text).join(' < ')+')':inference.premises[i];
    if(i===inference.extra){
     fold=el('details');fold.dataset.extraPremise='';
     fold.append(el('summary','Additional supplied premise'),premiseLink(label,proof));
     if(inference.relation)fold.append(' · ',link('Relation R',inference.relation));
     return;
    }
    if(shown++)inputs.append(' and ');
    inputs.append(premiseLink(label,proof));
   });
   inputs.append((shown?' ⇒ ':'')+inference.conclusion);
   for(const [i,site] of inference.terms.entries()){
    const value=el('dd');value.append(link(caption(formula(data,site,3,true)),site));
    terms.append(el('dt',inference.labels?.[i]||['a','b','c'][i]),value);
   }
   panel.append(inputs,terms);if(fold)panel.append(fold);container.append(panel);
   if(inference.name==='Mathlib.Tactic.RingNF.add_assoc_rev'){
    const grouping=el('details'),equation=el('p');
    grouping.dataset.addGrouping='';
    grouping.append(el('summary','Show the regrouped sum'));
    const operand=i=>{
     const site=inference.terms[i];
     const operandTree=formula(data,site,3,true),label=caption(operandTree);
     return link(operandTree.right?'('+label+')':label,site);
    };
    equation.append(operand(0),' + (',operand(1),' + ',operand(2),') = (',operand(0),' + ',operand(1),') + ',operand(2));
    grouping.append(equation);panel.append(grouping);
   }
   const overview=el('details');overview.dataset.derivationInputs='';
   overview.append(el('summary','Trace this derivation to its inputs'));
   overview.ontoggle=()=>{
    if(!overview.open||overview.childElementCount>1)return;
    const r=derivationInputs(data,chainAt),list=el('ul');
    const status=r.limited?'Traversal limit reached':r.unread?'Partially traced':'Traced to inputs in scope';
    const count=el('p',status+' · '+r.steps+' inference visits · '+r.certificates+' numeral certificates · ');
    count.append(link('Starting inference',chainAt));overview.append(count);
    for(const {binding:b,origin,uses} of r.inputs.slice(0,8)){
     const row=el('li');
     row.append(origin?'Statement input ':'Local assumption ',link(b.name,b.binder),' · ',
      link(caption(formula(data,b.domain,3,true)),b.domain),' · ',link('Reference',b.site),' ('+uses+(uses===1?' use)':' uses)'));
     list.append(row);
    }
    if(list.childNodes.length)overview.append(list);
    if(r.inputs.length>8)overview.append(el('p','Showing 8 of '+r.inputs.length+' observed inputs.'));
    if(r.theorems.length){
     const leaves=el('details'),items=el('ul');leaves.dataset.theoremLeaves='';
     leaves.append(el('summary','Theorems used without a proof premise'),items);
     for(const t of r.theorems){
      const row=el('li');row.append(link(t.name,t.site),' · '+t.uses+(t.uses===1?' use':' uses'));items.append(row);
     }
     overview.append(leaves);
    }
    if(r.unread){
     overview.append(link('First of '+r.unread+' unexplained premise visits',r.firstUnread));
     const groups=el('details');groups.dataset.unexplainedPremises='';
     groups.append(el('summary','Unexplained premises by head'));
     for(const [name,sites] of r.unexplained){
      const group=el('details');
      group.append(el('summary',name+' · '+sites.length+(sites.length===1?' visit':' visits')));
      group.ontoggle=()=>{
       if(!group.open||group.childElementCount>1)return;
       const list=el('ol');
       for(const site of sites){
        const row=el('li');row.append(link('Expression '+site.node,site));list.append(row);
       }
       group.append(list);
      };
      groups.append(group);
     }
     overview.append(groups);
    }
    if(r.limited)overview.append(el('p','Only the first '+r.visits+' visits were inspected.'));
   };
   container.append(overview);
  }
  const chain=equalityChain(data,chainAt,selected?.change?selected.before:null);
  if(chain){
   const panel=el('section'),line=el('p'),proofs=el('p');panel.dataset.equalityChain='';
   panel.append(el('h4',selected?.change?'Equality before the rewrite':'Equality by transitivity'));
   for(const [i,site] of [chain.start,chain.middle,chain.end].entries()){
    if(i)line.append(' = ');
    line.append(link(caption(formula(data,site,3,true)),site));
   }
   proofs.append(link('First equality',chain.first),' · ',link('Second equality',chain.second));
   panel.append(line,proofs);container.append(panel);
  }
  if(selected?.change){
   const panel=el('section');panel.dataset.selectedRewrite='';
   panel.append(el('h4','Rewrite an operand'),link(caption(selected.before),selected.before.site),' → ',
    link(caption(selected.after),selected.after.site),operandChange(selected));container.append(panel);
   const steps=rewriteSequence(data,at,selected);
   if(steps.length>1){
    const trail=el('details'),list=el('ol'),first=steps[0].term;
    trail.dataset.rewriteSequence='';
    trail.append(el('summary',steps.length+' consecutive rewrites ending here'),
     link(caption(first.before),first.before.site), ' · ',link('Starting proof',first.premise),list);
    for(const step of steps){
     const row=el('li');row.append(link(caption(step.term.after),step.term.after.site),' · ',link('Inspect rewrite',step.at));
     list.append(row);
    }
    container.append(trail);
   }
  }
  if(!at.route.slots.length){
   const o=closingOrderArgument(data);
   if(o){
    const panel=el('section'),steps=el('ol');panel.dataset.orderContradiction='';
    panel.append(el('h4','Proof by contradiction'),steps);
    const assumption=el('li');assumption.append('Assume ',link(caption(o.contrary),o.domain),'.');
    const details=el('details'),trail=el('div');details.dataset.contraryUses='';
    details.append(el('summary','Where the assumption enters the derivation'),trail);assumption.append(details);
    details.ontoggle=()=>{
     if(!details.open || trail.childNodes.length)return;
     const result=contraryUses(data,o),list=el('ol');
     if(result.total!==undefined)trail.append(result.total+' compiled reference'+(result.total==='1'?'':'s'));
     for(const [i,u] of result.uses.entries()){
      const row=el('li');row.append(link('Reference '+(i+1),u.site));
      for(const c of [u.first,u.next])if(c){
       const role=c.slot?'argument '+c.slot+' of '+c.arity:'function position';
       const readings={'Mathlib.Tactic.Linarith.sub_neg_of_lt':'Take the negative difference',
        'Mathlib.Tactic.Linarith.mul_neg':'Multiply by a positive factor','le_of_lt':'Pass to a weak inequality'};
       const named=data.kind[c.head.node]===4 && Object.hasOwn(readings,c.label);
       const action=link(named?readings[c.label]:c.label,c.call);action.title=c.label;
       row.append(' → ',action,' ('+role+')');
      }
      if(u.chain.length>2){
       const more=el('details'),path=el('ol');more.dataset.arithmeticPath='';
       more.append(el('summary',u.reached?'Continue to the self-inequality':'Continue along the available calls'),path);
       for(const c of u.chain.slice(2)){
        const step=el('li');
        step.append(link(c.label,c.call),' · '+(c.slot?'argument '+c.slot+' of '+c.arity:'function position'));
        path.append(step);
       }
       row.append(more);
      }
      list.append(row);
     }
     if(result.uses.length)trail.append(list);
     if(result.limited)trail.append('Further references outside the display or traversal limit.');
    };
    const end=el('li');end.append(link('Derive',o.evidence),' ',link(o.operandLabel,o.operand),' < ',o.operandLabel,'. ',link('Irreflexivity',o.close),' rules this out.');
    if(o.transport){
     const t=o.transport,detail=el('details'),line=el('p');
     detail.dataset.contradictionRewrite='';
     line.append(link(caption(t.before),t.before.site),' → ',link(caption(t.after),t.after.site));
     detail.append(el('summary','Final rewrite'),line,link('Equality used',t.equality),' · ',link('Strict inequality before rewriting',t.premise));
     if(t.change)detail.append(operandChange(t));
     end.append(detail);
    }
    const conclusion=el('li');conclusion.append(link('le_of_not_gt',o.proof),' gives ',link(caption(o.statement),o.goal),'.');
    steps.append(assumption,end,conclusion);container.append(panel);
   }
  }
  const receiving=hypothesisInputs(data,at);
  if(receiving){
   const panel=el('section'),branches=el('ul');panel.dataset.hypothesisInputs='';
   branches.className='pl-reference-tree';
   panel.append(el('h4','Hypotheses used together'),link(receiving.name,receiving.head),branches);
   for(const input of receiving.inputs){
    const row=el('li');
    row.append(link(input.label,input.binder.domain),' → ',link(input.binder.name+' · argument '+input.slot,input.site));
    branches.append(row);
   }
   const output=el('details'),trail=el('div');
   output.append(el('summary','Follow the result'),trail);panel.append(output);
   output.ontoggle=()=>{
    if(!output.open || trail.childNodes.length)return;
    const flow=resultFlow(data,at),c=flow.receiver;
    if(c){
     const line=el('p');line.append('Used by ',link(c.label,c.call),' · '+(c.slot?'argument '+c.slot+' of '+c.arity:'function position'));
     trail.append(line);
    }
    if(flow.cases){
     const cases=el('ul');cases.className='pl-reference-tree';
     flow.cases.forEach((c,i)=>{
      const row=el('li');row.append(link(c.label,c.domain),' → ',link(i?'Right case':'Left case',c.branch));cases.append(row);
     });
     trail.append(cases);
    }
    if(flow.local){
     const l=flow.local,line=el('p');line.append(link(l.name,l.site),' : ',link(l.label,l.type));trail.append(line);
     if(l.references!==undefined){
      const next=el('p',l.references+' local reference'+(l.references==='1'?'':'s'));
      if(l.use)next.append(' · ',link('First use',l.use));
      if(l.next)next.append(' → ',link(l.next.label,l.next.call));
      trail.append(next);
     }
    }
    if(!c && !flow.local)trail.append('No immediate receiving application or local value at this occurrence.');
   };
   container.append(panel);
  }
  const {focus,binders}=statement(data,at);
  const tree=formula(data,focus);if(!tree || (binders.length && !tree.relation && !tree.logical))return;
  const panel=el('section'),line=el('p'),detail=el('details'),list=el('ul');
  panel.dataset.arithmeticFormula='';line.className='pl-arithmetic-expression';
  let truncated=false;
  function draw(t,level){
   if(!t.symbol){
    if(t.expandable)truncated=true;
    if(!t.variables)return link(t.label,t.site);
    const call=el('span');call.append(link(t.label,t.site),'(');
    t.variables.forEach((v,i)=>{if(i)call.append(', ');call.append(link(v.label,v.site));});
    call.append(')');return call;
   }
   const span=el('span'),item=el('li');
   item.append(link(t.name,t.head));
   t.parameterNames.forEach((label,i)=>item.append(' · ',link(label,t.parameters[i])));
   list.append(item);
   const op=link(t.symbol,t.site);op.setAttribute('aria-label',t.name+' application');
   if(!t.right){span.append(op,'(',draw(t.left,0),')');return span;}
   if(level)span.append('(');
   span.append(draw(t.left,level+1),' ',op,' ',draw(t.right,level+1));
   if(level)span.append(')');
   return span;
  }
  line.append(draw(tree,0));detail.append(el('summary','Types and instances'),list);
  panel.append(el('h4',binders.length?'Conclusion':tree.relation?'Relation':tree.logical?'Proposition':'Arithmetic expression'));
  if(binders.length){
   panel.append(link('Open conclusion',focus));
   const context=el('details'),rows=el('ol');
   context.dataset.formulaContext='';
   context.append(el('summary','Parameters and hypotheses ('+binders.length+')'),rows);
   context.ontoggle=()=>{
    if(!context.open || rows.childElementCount)return;
    for(const b of binders){
     const t=formula(data,b.domain);
     const name=t?caption(t):data.kind[b.domain.node]===4?data.payloads[b.domain.node].name:'e'+b.domain.node;
     const row=el('li');row.append(link(b.name,b.site),' : ',link(name,b.domain));rows.append(row);
     if(!t?.relation || !b.proofBinder)continue;
     const uses=el('details'),content=el('div');
     uses.dataset.hypothesisUses=b.name;
     uses.append(el('summary','Uses of '+b.name+' in the proof'),content);row.append(uses);
     uses.ontoggle=()=>{
      if(!uses.open || content.childNodes.length)return;
      const binder=b.proofBinder,body=data.children[binder.node][1];
      const budget={maxStates:8192,maxWork:16384,useSupport:false};
      const count=(options)=>host.ProofAtlasRecursiveInputs.countReferences(data,body,0,{...budget,...options});
      const first=count({firstIfPresent:true});
      content.append(link('Proof binder',binder));
      if(first.status!=='counted'){content.append(' · Count unavailable within the traversal limit');return;}
      const total=BigInt(first.occurrences);
      content.append(' · '+total+' compiled reference'+(total===1n?'':'s'));
      const list=el('ol');
      for(let n=1n;n<=total && n<=8n;n++){
       const result=n===1n?first:count({ordinal:n});
       if(result.status!=='counted'){content.append(' · Further references unavailable within the traversal limit');break;}
       const w=result.witness,route={root:1,slots:binder.route.slots.concat(1,w.slots)},site={node:w.node,route};
       const binding=A.binding(data,route);
       if(!binding || binding.node!==binder.node || String(binding.route.slots)!==String(binder.route.slots))
        throw Error('Hypothesis reference scope mismatch');
       const call=host.ProofAtlasOmittedReferences.applicationAtUse(data,site,{includePeers:false}),entry=el('li');
       entry.append(link(b.name,site),' → ');
       if(call)entry.append(link(call.label+' · '+(call.slot?'argument '+call.slot+' of '+call.arity:'function position'),call.call));
       else{
        const parent={root:1,slots:route.slots.slice(0,-1)},node=A.walk(data,parent),kind=A.kinds[data.kind[node]];
        entry.append(link(kind+'.'+A.fields[kind][route.slots.at(-1)],{node,route:parent}));
       }
       list.append(entry);
      }
      if(list.childElementCount)content.append(list);
      if(total>8n)content.append('First eight shown. Open the proof binder for all references.');
     };
    }
   };
   panel.append(context);
  }
  panel.append(line);
  if(truncated){
   const toggle=el('button','Expand formula');toggle.type='button';toggle.setAttribute('aria-expanded','false');
   let expanded=false;
   toggle.onclick=()=>{
    expanded=!expanded;list.replaceChildren();truncated=false;
    line.replaceChildren(draw(expanded?formula(data,focus,6):tree,0));
    toggle.textContent=expanded?'Collapse formula':'Expand formula';toggle.setAttribute('aria-expanded',String(expanded));
   };
   panel.append(toggle);
  }
  panel.append(detail);container.append(panel);
 }
 if(common)module.exports={firstBindingBody,nearestReference,rowCopies,outerReference,congruenceCall,transportCall,derivationInputs,binderArgument,statementOrigin,binderCopies,zeroDifference,logicalInference,numeralComparison,boundPremise,arithmeticInference,equalityChain,rewriteSequence,formulaTransport,formula,statement,caption,hypothesisInputs,resultFlow,closingOrderArgument,contraryUses};else host.ProofAtlasArithmetic={mount,formula,caption,statement};
})(typeof window==='undefined'?globalThis:window);
