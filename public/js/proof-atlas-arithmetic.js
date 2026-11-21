// Read bounded operator trees directly at selected occurrence routes.
(function(host){
 'use strict';
 const common=typeof module!=='undefined' && module.exports;
 const A=common?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
 const binaryTypes=['left type','right type','result type','instance'];
 const operators=new Map([
  ...[['HPow.hPow','^'],['HAdd.hAdd','+'],['HSub.hSub','−'],['HMul.hMul','×'],['HDiv.hDiv','/']]
   .map(([name,symbol])=>[name,{symbol,parameters:binaryTypes}]),
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
    return {site,name,head,symbol:op.symbol,relation:op.relation,parameterNames:op.parameters,
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
  let focus=at;
  if(at.route.root===0 && !at.route.slots.length){
   while(data.kind[focus.node]===7 && binders.length<128){
    const [domain,body]=data.children[focus.node],slots=focus.route.slots;
    binders.push({site:focus,name:data.payloads[focus.node].binderName||'_',
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
 function mount(container,data,at,link){
  const {focus,binders}=statement(data,at);
  const tree=formula(data,focus);if(!tree || (binders.length && !tree.relation))return;
  const el=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
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
  panel.append(el('h4',binders.length?'Conclusion':tree.relation?'Relation':'Arithmetic expression'));
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
 if(common)module.exports={formula,statement,caption};else host.ProofAtlasArithmetic={mount};
})(typeof window==='undefined'?globalThis:window);
