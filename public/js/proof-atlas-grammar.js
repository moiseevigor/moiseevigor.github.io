/* Proof Atlas visual grammar: exhaustive on Lean.Expr constructor TAGS;
   examples show possible surface terms, never promise byte-identical kernel ASTs. */
(function(){
 'use strict';
 const root=document.getElementById('pa-grammar');if(!root)return;
 const entries=[
 {tag:'bvar',title:'Bound variable',group:'Variables',desc:'An occurrence referring to a surrounding binder using a de Bruijn index. Index 0 refers to the nearest binder.',example:'fun x : Nat => x',reading:'The small variable node points back to its enclosing λ binder. This is a scope reference, not a new theorem.',ports:[['binder','scope / de Bruijn index']],diagram:['bvar','binder'],edges:[['bvar','binder','scope']]},
 {tag:'fvar',title:'Free variable',group:'Variables',desc:'A local free-variable identifier introduced in an elaboration context, typically a local hypothesis or parameter.',example:'example (h : P) : P := h',reading:'A local-variable occurrence refers to an entry in the current context Γ. Closed kernel terms cannot leave unresolved local variables.',ports:[['Γ','local declaration']],diagram:['fvar','Γ'],edges:[['fvar','Γ','context']]},
 {tag:'mvar',title:'Metavariable',group:'Variables',desc:'A metavariable stands for an expression that elaboration still has to assign. Unresolved metavariables are not acceptable in a completed theorem certificate.',example:'by\n  refine ?_',reading:'The hollow question mark denotes a goal or placeholder. Elaboration must solve it before kernel checking.',ports:[['goal','assignment / pending']],diagram:['mvar','goal'],edges:[['mvar','goal','pending']]},
 {tag:'sort',title:'Sort / universe',group:'Types',desc:'A universe level expressed as Sort u; Prop is Sort 0, while Type u abbreviates Sort (u+1).',example:'#check Prop\n#check Type 0',reading:'A Sort node is a type universe at a particular level; the level is an attribute, not a child proof.',ports:[['u','universe level']],diagram:['sort','level'],edges:[['sort','level','universe']]},
 {tag:'const',title:'Named constant',group:'References',desc:'A reference to a declaration in the environment (definition, theorem, axiom, inductive constructor, etc.), with universe arguments.',example:'#check Nat.succ',reading:'The constant carries a declaration name and universe instantiations. You must look up the declaration to know whether it is a lemma.',ports:[['declaration','name'],['levels','universe arguments']],diagram:['const','declaration','levels'],edges:[['const','declaration','lookup'],['const','levels','levels']]},
 {tag:'app',title:'Application',group:'Composition',desc:'Applies a function expression to an argument expression; a multi-argument application is nested binary applications.',example:'#check Nat.succ 2',reading:'The application vertex has two ordered inputs: function and argument. This is the common repeated branching shape in elaborated Lean terms.',ports:[['function','expression'],['argument','expression']],diagram:['app','function','argument'],edges:[['app','function','function'],['app','argument','argument']]},
 {tag:'lam',title:'Lambda abstraction',group:'Binders',desc:'Builds a function from a binder name, parameter type, body expression and binder information.',example:'fun n : Nat => n + 1',reading:'The λ encloses a body and a parameter type. An occurrence of bvar 0 inside the body refers back to this λ.',ports:[['type','parameter type'],['body','scoped expression']],diagram:['lam','type','body','bvar'],edges:[['lam','type','type'],['lam','body','body'],['body','bvar','scoped use'],['bvar','lam','binder']]},
 {tag:'forallE',title:'Dependent function / ∀',group:'Binders',desc:'A dependent function type. When its result is Prop, it is used to represent universal quantification and implication.',example:'#check ∀ n : Nat, n = n',reading:'The ∀/Π node connects a domain type and a dependent body. An implication A → B is the nondependent special case.',ports:[['domain','binder type'],['body','dependent type']],diagram:['forallE','domain','body','bvar'],edges:[['forallE','domain','domain'],['forallE','body','codomain'],['body','bvar','scope']]},
 {tag:'letE',title:'Local let binding',group:'Binders',desc:'A local definition with binder type, bound value, and body (possibly referencing that bound variable).',example:'let n := 2\nn + n',reading:'Three distinct connections are needed: type, value and scoped body. The binding is local to the expression.',ports:[['type','declaration type'],['value','bound expression'],['body','expression']],diagram:['letE','type','value','body'],edges:[['letE','type','type'],['letE','value','value'],['letE','body','body']]},
 {tag:'lit',title:'Literal',group:'Values',desc:'A kernel literal such as a natural-number or string literal. Elaborated surface numerals can also involve type-class operations.',example:'#check (42 : Nat)',reading:'This is a terminal payload node, not a subproof. The value is stored on the node.',ports:[['payload','numeral / string']],diagram:['lit','payload'],edges:[['lit','payload','value']]},
 {tag:'mdata',title:'Metadata wrapper',group:'Annotations',desc:'Attaches auxiliary metadata to an underlying expression. Metadata does not supply a new proof rule.',example:'-- metadata can be generated by elaborators\nexample : True := trivial',reading:'The wrapper contains an underlying expression plus auxiliary annotations. The annotation is not itself a proof certificate.',ports:[['inner','wrapped expression'],['metadata','annotation']],diagram:['mdata','inner','metadata'],edges:[['mdata','inner','expression'],['mdata','metadata','annotation']]},
 {tag:'proj',title:'Structure projection',group:'References',desc:'Projects a numbered field from an expression of a structure type, using a structure name and projection index.',example:'#check (1, 2).1',reading:'The projection references a structure declaration and an input expression. The field index is an annotation; it is not simply a child node.',ports:[['structure','declaration / index'],['value','structure expression']],diagram:['proj','structure','value'],edges:[['proj','structure','declaration'],['proj','value','input']]}
 ];
 // The canonical Lean.Expr type has 11 constructors, not 12.
 const tags=['bvar','fvar','mvar','sort','const','app','lam','forallE','letE','lit','mdata','proj'];
 // Lean 4 Expr includes 12 tags: bvar, fvar, mvar, sort, const, app,
 // lam, forallE, letE, lit, mdata, proj. Keep count derived from source.
 const buttons=document.getElementById('pa-grammar-choices'),svg=document.getElementById('pa-grammar-svg');
 const $=id=>document.getElementById(id),NS='http://www.w3.org/2000/svg';
 function el(name,attrs,text){const n=document.createElementNS(NS,name);for(const [k,v] of Object.entries(attrs||{}))n.setAttribute(k,String(v));if(text!=null)n.textContent=text;return n;}
 for(const [i,item] of entries.entries()){
   const b=document.createElement('button');b.type='button';b.className='pa-grammar-choice';b.dataset.tag=item.tag;
   b.innerHTML='<span class="pa-g-num">'+String(i+1).padStart(2,'0')+'</span><span class="pa-g-tag"></span><small></small>';
   b.querySelector('.pa-g-tag').textContent=item.tag;b.querySelector('small').textContent=item.group;
   b.addEventListener('click',()=>select(i));buttons.appendChild(b);
 }
 function draw(item){
   svg.replaceChildren();
   const nodes=item.diagram;
   const positions=new Map();const cx=295,cy=83;
   positions.set(nodes[0],{x:cx,y:cy});
   const rest=nodes.slice(1);
   for(let j=0;j<rest.length;j++){
     let x,y;
     if(rest.length===1){x=cx;y=207;}
     else if(rest.length===2){x=175+j*240;y=208;}
     else if(rest.length===3){x=127+j*170;y=204;}
     else{x=110+j*125;y=209;}
     positions.set(rest[j],{x,y});
   }
   for(const [from,to,role] of item.edges){
     const a=positions.get(from),b=positions.get(to);if(!a||!b)continue;
     const cross=(role==='binder'||role==='scope');
     const path=el('path',{d:cross?('M'+a.x+','+(a.y-26)+' Q430,12 '+b.x+','+(b.y-27)):
       ('M'+a.x+','+(a.y+27)+' Q'+a.x+','+((a.y+b.y)/2)+' '+b.x+','+(b.y-27)),fill:'none',stroke:cross?'#b68b61':'#5c9b98','stroke-width':cross?'1.6':'2.2','stroke-dasharray':cross?'5 5':'none'});
     svg.appendChild(path);
     if(!cross)svg.appendChild(el('text',{x:(a.x+b.x)/2,y:(a.y+b.y)/2-6,'text-anchor':'middle',fill:'#648586','font-size':12},role));
   }
   for(const [name,p] of positions){
     const root=name===nodes[0],w=root?142:140;
     svg.appendChild(el('rect',{x:p.x-w/2,y:p.y-26,width:w,height:52,rx:9,fill:root?'#174657':'#e6f1ee',stroke:root?'#174657':'#699e9b','stroke-width':2}));
     svg.appendChild(el('text',{x:p.x,y:p.y+6,'text-anchor':'middle',fill:root?'#fff':'#1b4a55','font-size':root?18:15,'font-weight':root?750:550},name));
   }
 }
 function select(i){
   const x=entries[i];for(const b of buttons.children)b.setAttribute('aria-pressed',b.dataset.tag===x.tag?'true':'false');
   $('pa-g-group').textContent=x.group.toUpperCase();$('pa-g-name').textContent=x.tag+' — '+x.title;
   $('pa-g-description').textContent=x.desc;$('pa-g-example').textContent=x.example;
   $('pa-g-reading').textContent=x.reading;
   const ports=$('pa-g-ports');ports.replaceChildren();
   for(const [p,role] of x.ports){const s=document.createElement('span');s.textContent=p+' · '+role;ports.appendChild(s);}
   draw(x);
 }
 select(5);
})();