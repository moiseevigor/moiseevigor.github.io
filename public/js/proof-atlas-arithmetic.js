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
  ['LT.lt',{symbol:'<',parameters:['type','order instance'],relation:true}],
  ['Real.sqrt',{symbol:'√',parameters:[],unary:true}],
  ['abs',{symbol:'abs',parameters:['type','lattice instance','group instance'],unary:true}]
 ]);
 function formula(data,at,maxDepth=3){
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
   if(!depth)return null;
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
 function mount(container,data,at,link){
  const el=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
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
 if(common)module.exports={formula,statement,caption,hypothesisInputs,resultFlow};else host.ProofAtlasArithmetic={mount,formula,caption};
})(typeof window==='undefined'?globalThis:window);
