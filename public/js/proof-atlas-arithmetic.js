// Read bounded operator trees directly at selected occurrence routes.
(function(host){
 'use strict';
 const common=typeof module!=='undefined' && module.exports;
 const A=common?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
 const operators=new Map([['HPow.hPow','^'],['HAdd.hAdd','+'],['HSub.hSub','−'],['HMul.hMul','×']]);
 function formula(data,at){
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
   if(depth<3 && operators.has(name) && args.length===6){
    return {site,name,head,symbol:operators.get(name),parameters:args.slice(0,4),
     left:read(args[4],depth+1),right:read(args[5],depth+1)};
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
   return {site,label};
  }
  return read(at,0);
 }
 function mount(container,data,at,link){
  const tree=formula(data,at);if(!tree)return;
  const el=(tag,text)=>{const e=document.createElement(tag);if(text)e.textContent=text;return e;};
  const panel=el('section'),line=el('p'),detail=el('details'),list=el('ul');
  panel.dataset.arithmeticFormula='';line.className='pl-arithmetic-expression';
  function draw(t,level){
   if(!t.symbol)return link(t.label,t.site);
   const span=el('span'),item=el('li');
   item.append(link(t.name,t.head));
   ['left type','right type','result type','instance'].forEach((label,i)=>item.append(' · ',link(label,t.parameters[i])));
   list.append(item);
   const op=link(t.symbol,t.site);op.setAttribute('aria-label',t.name+' application');
   if(level)span.append('(');
   span.append(draw(t.left,level+1),' ',op,' ',draw(t.right,level+1));
   if(level)span.append(')');
   return span;
  }
  line.append(draw(tree,0));detail.append(el('summary','Types and instances'),list);
  panel.append(el('h4','Arithmetic expression'),line,detail);container.append(panel);
 }
 if(common)module.exports={formula};else host.ProofAtlasArithmetic={mount};
})(typeof window==='undefined'?globalThis:window);
