// Resolve references in disjoint regions omitted from a bounded notation scene.
(function(host){
 'use strict';
 const local=typeof module!=='undefined'&&module.exports;
 const A=local?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
 const notation=local?require('./proof-atlas-type-notation'):host.ProofAtlasTypeNotation;
 const E=local?require('./proof-atlas-elimination'):host.ProofAtlasElimination;
 function exactCallInputs(data,at,name,arity){
  let fn=at.node;
  const args=[];
  for(let n=0;n<arity;n++){
   if(data.kind[fn]!==5)return null;
   args.push(data.children[fn][1]);
   fn=data.children[fn][0];
  }
  if(data.kind[fn]!==4 || data.payloads[fn].name!==name)return null;
  return args.reverse().map((node,slot)=>({node,route:{root:at.route.root,
   slots:at.route.slots.concat(Array(arity-slot-1).fill(0),1)}}));
 }
 // Expand only directly supplied transitivity proofs with literal endpoint agreement.
 function equalitySegments(data,inputs,limit=16){
  const [carrier,start,middle,end,first,second]=inputs;
  const pending=[{start:middle,end,proof:second},{start,end:middle,proof:first}],segments=[];
  while(pending.length){
   const step=pending.pop();
   const inner=exactCallInputs(data,step.proof,'Eq.trans',6);
   if(!inner){segments.push(step);continue;}
   const mismatches=[];
   for(const [field,outer,nested] of [['carrier',carrier,inner[0]],['start',step.start,inner[1]],['end',step.end,inner[3]]]){
    if(outer.node===nested.node)continue;
    const difference=firstStructuralDifference(data,outer.node,nested.node);
    const locate=(at,node)=>({node,route:{root:at.route.root,slots:at.route.slots.concat(difference.slots)}});
    mismatches.push({field,outer,nested,difference:difference.status,...(difference.slots?{
     outerSite:locate(outer,difference.left),nestedSite:locate(nested,difference.right)}:{})});
   }
   if(mismatches.length){
    segments.push({...step,boundary:'different compiled endpoints or carrier',mismatches});continue;
   }
   if(segments.length+pending.length+2>limit){
    segments.push({...step,boundary:'display limit'});continue;
   }
   pending.push({start:inner[2],end:inner[3],proof:inner[5]},
    {start:inner[1],end:inner[2],proof:inner[4]});
  }
  return segments;
 }
 // Compare literal expression records in field order, skipping shared subtrees.
 function firstStructuralDifference(data,left,right){
  const pending=[{left,right,slots:[]}],seen=new Set();
  while(pending.length){
   const pair=pending.pop();
   if(pair.left===pair.right)continue;
   const key=pair.left+':'+pair.right;
   if(seen.has(key))continue;
   if(seen.size===512)return {status:'limit'};
   seen.add(key);
   const kind=data.kind[pair.left];
   if(kind!==data.kind[pair.right])return {...pair,status:'constructor'};
   if(A.payloadKey(kind,data.payloads[pair.left])!==A.payloadKey(kind,data.payloads[pair.right]))
    return {...pair,status:'payload'};
   const children=data.children[pair.left];
   for(let slot=children.length-1;slot>=0;slot--){
    const l=children[slot],r=data.children[pair.right][slot];
    if(l!==r)pending.push({left:l,right:r,slots:pair.slots.concat(slot)});
   }
  }
  return {status:'identical'};
 }
 function applicationAtUse(data,use){
  const {root,slots}=use.route,nodes=[data.roots[root]];
  for(const slot of slots)nodes.push(data.children[nodes.at(-1)][slot]);
  if(nodes.at(-1)!==use.node)throw Error('Variable occurrence mismatch');
  let depth=slots.length-1;
  if(depth<0||data.kind[nodes[depth]]!==5)return null;
  const functionUse=slots[depth]===0;
  while(depth>0&&slots[depth-1]===0&&data.kind[nodes[depth-1]]===5)depth--;
  const call={node:nodes[depth],route:{root,slots:slots.slice(0,depth)}};
  const {head,args}=E.spine(data,call.node),arity=args.length;
  const headRoute={root,slots:call.route.slots.concat(Array(arity).fill(0))};
  const slot=functionUse?0:arity-(slots.length-depth-1);
  const kind=A.kinds[data.kind[head]],binder=kind==='bvar'?A.binding(data,headRoute):null;
  const p=binder?data.payloads[binder.node]:data.payloads[head];
  const label=kind==='const'?p.name:binder?(p.binderName??p.declName):kind;
  const peers=[];
  args.forEach((node,i)=>{
   if(i+1===slot||data.kind[node]!==0)return;
   const route={root,slots:call.route.slots.concat(Array(arity-i-1).fill(0),1)};
   const binder=A.binding(data,route),p=data.payloads[binder.node];
   peers.push({slot:i+1,use:{node,route},binder,name:p.binderName??p.declName});
  });
  return {call,head:{node:head,route:headRoute},label,slot,arity,peers};
 }
 function resultDestination(data,from){
  const slots=from.route.slots,root=from.route.root;
  if(!slots.length)return {kind:'root',at:from};
  const call=applicationAtUse(data,from);
  if(call)return {kind:'argument',call};
  const route={root,slots:slots.slice(0,-1)},node=A.walk(data,route),kind=A.kinds[data.kind[node]];
  return {kind,field:A.fields[kind][slots.at(-1)],at:{node,route},
   name:data.payloads[node].declName??data.payloads[node].binderName};
 }
 function inspect(data,catalog,rootIndex=0){
  const root=data.roots[rootIndex],counts=[],groups=[];
  for(let row=0;row<=root;row++)
   counts[row]=data.children[row].reduce((sum,c)=>sum+counts[c],data.kind[row]===0?1n:0n);
  const address=(node,slots)=>({namespace:'source',node,route:{root:rootIndex,slots}});
  const scene=notation.scene(data,root,catalog,{address});
  const externalCounts=new Map();
  let queryKey=null;
  function beginQuery(node,index){
   const key=node+':'+index;
   if(queryKey!==key){externalCounts.clear();queryKey=key;}
  }
  const enters=(kind,field)=>((kind===6||kind===7)&&field===1)||(kind===8&&field===2);
  function external(node,depth,exact=false){
   if(data.neededScope[node]<=depth)return 0n;
   if(data.kind[node]===0)return !exact||data.payloads[node].index===depth?1n:0n;
   const key=node+':'+depth+':'+Number(exact);
   if(externalCounts.has(key))return externalCounts.get(key);
   if(externalCounts.size>=262144)throw RangeError('Scope comparison exceeds the query limit');
   let sum=0n;
   data.children[node].forEach((child,j)=>{sum+=external(child,depth+Number(enters(data.kind[node],j)),exact);});
   externalCounts.set(key,sum);return sum;
  }
  function add(region,operand){
   const total=counts[operand.node];
   if(!total)return;
   groups.push({...region,operand,total,externalTotal:()=>{beginQuery(operand.node,null);return external(operand.node,0);},inputs(){
      const stack=[];let node=root;
      operand.route.slots.forEach((slot,i)=>{
       if(enters(data.kind[node],slot))stack.push(address(node,operand.route.slots.slice(0,i)));
       node=data.children[node][slot];
      });
      return stack.reverse().flatMap((binder,index)=>{
       beginQuery(node,index);
       const count=external(node,index,true);
       return count?[{binder,index,count}]:[];
      });
     },select(n,outerOnly=false,index=null){
      if(outerOnly)beginQuery(operand.node,index);
      const available=outerOnly?external(operand.node,index??0,index!==null):total;
      if(typeof n!=='bigint'||n<1n||n>available)throw RangeError('Reference outside operand');
      const slots=[...operand.route.slots];let node=operand.node,depth=index??0;
      while(data.kind[node]!==0){
       const field=data.children[node].findIndex((child,j)=>{
        const count=outerOnly?external(child,depth+Number(enters(data.kind[node],j)),index!==null):counts[child];
        if(n<=count)return true;
        n-=count;return false;
       });
       if(field<0)throw Error('Incomplete reference counts');
       depth+=Number(enters(data.kind[node],field));slots.push(field);node=data.children[node][field];
      }
      const use=address(node,slots),binder=A.binding(data,use.route);
      if(!binder)throw Error('Reference has no enclosing binder');
      return {use,binder};
     }});
  }
  function visit(term){
   if(term.kind==='frontier')add({kind:'collapsed',symbol:term.label},term.origin);
   for(const port of [...(term.hiddenPorts??[]),...(term.foldedPorts??[])])
    add({kind:'notation',symbol:term.label,operator:term.origin,name:port.name,slot:port.slot},port.origin);
   term.children.forEach(c=>visit(c.value));
  }
  visit(scene.root);return groups;
 }
 function control(data,catalog,url,rootIndex=0,checkedCase){
  const el=(tag,text)=>{const e=document.createElement(tag);if(text!==undefined)e.textContent=text;return e;};
  const link=(text,hit)=>{const a=el('a',text);a.href=url(hit);return a;};
  const panel=el('details');panel.id='pl-omitted-references';
  panel.append(el('summary','Trace variables in collapsed regions and omitted operands'));
  panel.ontoggle=()=>{
   if(!panel.open||panel.children.length>1)return;
   const groups=inspect(data,catalog,rootIndex);
   if(!groups.length){panel.append(el('p','All variable references are visible in the initial notation.'));return;}
   for(const g of groups){
    const section=el('section'),heading=el('p');
    if(g.kind==='collapsed')heading.append('Collapsed region · ',link(g.symbol,g.operand));
    else heading.append(link(g.symbol,g.operator),' · ',link('operand '+(g.slot+1)+' ('+g.name+')',g.operand));
    const label=el('label','Reference '),input=el('input'),form=el('form'),result=el('p');
    input.value='1';input.required=true;input.inputMode='numeric';input.pattern='[1-9][0-9]*';input.size=6;
    input.maxLength=String(g.total).length;
    label.append(input);const go=el('button','Trace');
    const limit=el('span',' of '+g.total+' ');let outerOnly=false,selectedInput=null,available=g.total;
    form.append(label,limit,go);result.setAttribute('aria-live','polite');
    const consumer=el('div');
    function show(n){
     const {use,binder}=g.select(n,outerOnly,selectedInput),p=data.payloads[binder.node];
     const application=applicationAtUse(data,use);
     consumer.replaceChildren();
     if(application){
      const role=application.slot?'Argument '+application.slot+' of '+application.arity+' to ':'Function applied to '+application.arity+' arguments · ';
      consumer.append(role,link(application.label,application.head),' · ',link('Open application',application.call));
      if(application.peers.length){
       const details=el('details');details.append(el('summary','Other variable arguments ('+application.peers.length+')'));
       const list=el('ol');
       for(const peer of application.peers){
        const item=el('li');item.value=peer.slot;
        item.append(link(peer.name,peer.use),' · ',link('binder',peer.binder));list.append(item);
       }
       details.append(list);consumer.append(details);
      }
      const chain=el('details');chain.append(el('summary','Follow the result'));
      chain.ontoggle=()=>{
       if(!chain.open||chain.children.length>1)return;
       const list=el('ol');chain.append(list);
       let from=application.call;
       while(true){
        const step=resultDestination(data,from),item=el('li');list.append(item);
        if(step.kind==='argument'){
         const c=step.call;
         item.append('Argument '+c.slot+' of '+c.arity+' to ',link(c.label,c.call));
         const evidence=checkedCase?.(c.call.route),major=evidence?.major;
         if(major?.sourceSlot===c.slot && major.node===from.node && major.route.root===from.route.root &&
            major.route.slots.join('.')===from.route.slots.join('.')){
          item.append(el('p','Checked case split on '+major.typeText));
          for(const branch of evidence.branches){
           const row=el('p');row.append(link(branch.constructor,branch.argument),' · '+branch.argument.typeText);item.append(row);
          }
         }
         from=c.call;continue;
        }
        if(step.kind==='root')item.append(link('Root of the selected expression',step.at));
        else if(step.kind==='letE' && step.field==='value')item.append('Defines ',link(step.name,step.at));
        else item.append(step.field+' of ',link(step.name??step.kind,step.at));
        break;
       }
      };
      consumer.append(chain);
     }
     consumer.hidden=!application;
     result.replaceChildren(link('Variable #'+data.payloads[use.node].index,use),' bound by ',link(p.binderName??p.declName,binder));
    }
    show(1n);section.append(heading);
    const scope=el('details');scope.append(el('summary','Which references come from outside this region?'));
    scope.ontoggle=()=>{
     if(!scope.open||scope.children.length>1)return;
     let outside;
     try{outside=g.externalTotal();}catch(error){if(!(error instanceof RangeError))throw error;scope.append(el('p','Scope breakdown unavailable for this region.'));return;}
     scope.append(el('p',outside+' references use enclosing binders. '+(g.total-outside)+' use binders introduced in the region.'));
     if(!outside)return;
     let inputs;
     try{inputs=g.inputs();}catch(error){if(!(error instanceof RangeError))throw error;scope.append(el('p','Individual binder counts exceed the query limit.'));return;}
     const filter=el('select'),caption=el('label','Trace ');
     filter.append(new Option('All references','all'),new Option('All enclosing binders','outer'));
     for(const item of inputs){
      const p=data.payloads[item.binder.node],name=p.binderName??p.declName;
      filter.append(new Option(name+' · binder #'+item.binder.node+' · '+item.count+' uses',String(item.index)));
     }
     caption.append(filter);scope.append(caption);
     filter.onchange=()=>{
      outerOnly=filter.value!=='all';
      const item=inputs.find(i=>String(i.index)===filter.value);
      selectedInput=item?.index??null;available=item?.count??(outerOnly?outside:g.total);
      limit.textContent=' of '+available+' ';input.value='1';input.maxLength=String(available).length;input.setCustomValidity('');show(1n);
     };
    };
    section.append(scope);
    if(g.total>1n)section.append(form);
    section.append(result,consumer);panel.append(section);
    input.oninput=()=>input.setCustomValidity('');
    form.onsubmit=e=>{
     e.preventDefault();if(!input.reportValidity())return;
     const n=BigInt(input.value);
     if(n>available){input.setCustomValidity('Enter a number up to '+available+'.');input.reportValidity();return;}
     show(n);
    };
   }
  };
  return panel;
 }
 const api={inspect,control,exactCallInputs,equalitySegments,firstStructuralDifference,applicationAtUse,resultDestination};
 if(local)module.exports=api;else host.ProofAtlasOmittedReferences=api;
})(typeof window==='undefined'?globalThis:window);
