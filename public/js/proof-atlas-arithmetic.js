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
 function formulaTransport(data,at){
  const forward=namedArguments(data,at,'Eq.mp',4);
  const cast=forward||namedArguments(data,at,'Eq.mpr',4);
  if(!cast)return null;
  const reverse=!forward;
  const before=formula(data,cast[reverse?1:0]),after=formula(data,cast[reverse?0:1]);
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
  mul_nonpos:[8,'a ≤ 0','0 < b','b × a ≤ 0']
 };
 function arithmeticInference(data,at){
  let head=at.node,arity=0;
  while(data.kind[head]===5 && arity<10){head=data.children[head][0];arity++;}
  if(data.kind[head]!==4)return null;
  const name=data.payloads[head].name,prefix='Mathlib.Tactic.Linarith.';
  if(!name.startsWith(prefix))return null;
  const rule=arithmeticRules[name.slice(prefix.length)];
  if(!Array.isArray(rule)||arity!==rule[0])return null;
  const args=namedArguments(data,at,name,arity),count=arity===9?3:2;
  return {name,terms:args.slice(-2-count,-2),proofs:args.slice(-2),premises:rule.slice(1,3),conclusion:rule[3]};
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
 function equalityChain(data,at,expected){
  const args=namedArguments(data,at,'Eq.trans',6);
  if(!args)return null;
  const [type,start,middle,end,first,second]=args;
  if(expected && (expected.name!=='Eq' || expected.parameters[0].node!==type.node ||
     expected.left.site.node!==start.node || expected.right.site.node!==end.node))return null;
  return {start,middle,end,first,second};
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
 function mount(container,data,at,link){
  const el=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
  function operandChange(t){
   const c=t.change,p=el('p');p.dataset.rewriteSide=c.side;
   const label=(tree,site)=>tree.site.node===site.node?caption(tree):caption(formula(data,site,3,true));
   p.append(c.path.length?'Inside the '+c.side+' operand, replace ':'The '+c.side+' operand changes from ',
    link(label(t.before[c.side],c.from),c.from),c.path.length?' with ':' to ',link(label(t.after[c.side],c.to),c.to),
    '. ',link(t.reverse?'Operand equality (used in reverse)':'Operand equality',c.certificate),' · ',link('Function applied to both sides',c.context));
   return p;
  }
  const selected=formulaTransport(data,at);
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
   panel.append(el('h4',selected?.change?'Arithmetic before the rewrite':'Arithmetic inference'));
   inputs.append(link(inference.premises[0],inference.proofs[0]),'  and  ',link(inference.premises[1],inference.proofs[1]),'  ⇒  '+inference.conclusion);
   for(const [i,site] of inference.terms.entries()){
    const value=el('dd');value.append(link(caption(formula(data,site,3,true)),site));
    terms.append(el('dt',['a','b','c'][i]),value);
   }
   panel.append(inputs,terms);container.append(panel);
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
 if(common)module.exports={boundPremise,arithmeticInference,equalityChain,rewriteSequence,formulaTransport,formula,statement,caption,hypothesisInputs,resultFlow,closingOrderArgument,contraryUses};else host.ProofAtlasArithmetic={mount,formula,caption,statement};
})(typeof window==='undefined'?globalThis:window);
