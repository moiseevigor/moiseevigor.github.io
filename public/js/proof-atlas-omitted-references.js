// References under operands suppressed in the initial theorem-statement notation.
(function(host){
 'use strict';
 const local=typeof module!=='undefined'&&module.exports;
 const A=local?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
 const notation=local?require('./proof-atlas-type-notation'):host.ProofAtlasTypeNotation;
 function inspect(data,catalog){
  const root=data.roots[0],counts=[],groups=[];
  for(let row=0;row<=root;row++)
   counts[row]=data.children[row].reduce((sum,c)=>sum+counts[c],data.kind[row]===0?1n:0n);
  const address=(node,slots)=>({namespace:'statement',node,route:{root:0,slots}});
  const scene=notation.scene(data,root,catalog,{address});
  function visit(term){
   for(const port of [...(term.hiddenPorts??[]),...(term.foldedPorts??[])]){
    const total=counts[port.node];
    if(!total)continue;
    groups.push({symbol:term.label,operator:term.origin,name:port.name,slot:port.slot,
     operand:port.origin,total,select(n){
      if(typeof n!=='bigint'||n<1n||n>total)throw RangeError('Reference outside operand');
      const slots=[...port.slots];let node=port.node;
      while(data.kind[node]!==0){
       const field=data.children[node].findIndex(child=>{
        if(n<=counts[child])return true;
        n-=counts[child];return false;
       });
       if(field<0)throw Error('Incomplete reference counts');
       slots.push(field);node=data.children[node][field];
      }
      const use=address(node,slots),binder=A.binding(data,use.route);
      if(!binder)throw Error('Reference has no enclosing binder');
      return {use,binder};
     }});
   }
   term.children.forEach(c=>visit(c.value));
  }
  visit(scene.root);return groups;
 }
 function control(data,catalog,url){
  const el=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
  const link=(text,hit)=>{const a=el('a',text);a.href=url(hit);return a;};
  const panel=el('details');panel.id='pl-omitted-references';
  panel.append(el('summary','Trace variables in operands omitted by notation'));
  panel.ontoggle=()=>{
   if(!panel.open||panel.children.length>1)return;
   const groups=inspect(data,catalog);
   if(!groups.length){panel.append(el('p','The initial statement notation omits no operands containing variable references.'));return;}
   for(const g of groups){
    const section=el('section'),heading=el('p');
    heading.append(link(g.symbol,g.operator),' · ',link('operand '+(g.slot+1)+' ('+g.name+')',g.operand));
    const label=el('label','Reference '),input=el('input'),form=el('form'),result=el('p');
    input.value='1';input.required=true;input.inputMode='numeric';input.pattern='[1-9][0-9]*';input.size=6;
    input.maxLength=String(g.total).length;
    label.append(input);const go=el('button','Trace');
    form.append(label,' of '+g.total+' ',go);result.setAttribute('aria-live','polite');
    function show(n){
     const {use,binder}=g.select(n),p=data.payloads[binder.node];
     result.replaceChildren(link('Variable #'+data.payloads[use.node].index,use),' bound by ',link(p.binderName??p.declName,binder));
    }
    show(1n);section.append(heading);
    if(g.total>1n)section.append(form);
    section.append(result);panel.append(section);
    input.oninput=()=>input.setCustomValidity('');
    form.onsubmit=e=>{
     e.preventDefault();if(!input.reportValidity())return;
     const n=BigInt(input.value);
     if(n>g.total){input.setCustomValidity('Enter a number up to '+g.total+'.');input.reportValidity();return;}
     show(n);
    };
   }
  };
  return panel;
 }
 const api={inspect,control};
 if(local)module.exports=api;else host.ProofAtlasOmittedReferences=api;
})(typeof window==='undefined'?globalThis:window);
