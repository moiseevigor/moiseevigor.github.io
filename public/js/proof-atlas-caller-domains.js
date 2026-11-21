/* Contextual kernel evidence is keyed by declaration digest and occurrence route. */
(function(host){
 'use strict';
 const A=host.ProofAtlasLibraryData;
 const packets=[
  {node:2181,path:'11111112111111110110101010010100100110011',file:'ai-caller-domains',
   hash:'b68b4a4283bd1eeff9bfa1009198ef17add44724906a23ff6a911c47411981ab',bytes:8265},

 ];
 function packetFor(record,call){
  if(record.indexSha256!=='8892b0884f374abfa704f50ac89a3c31872a9d3f1aef369b1ae84e44891bde8d' || call.route.root!==1)return;
  const index=host.PROOF_ATLAS_TRANSPORT_DOMAINS;
  const available=index?.indexSha256===record.indexSha256?packets.concat(index.records):packets;
  const cases=(host.PROOF_ATLAS_TRANSPORT_CASES||[]).filter(c=>c.indexSha256===record.indexSha256);
  const leaves=host.PROOF_ATLAS_TRANSPORT_LEAVES;
  const endings=leaves?.indexSha256===record.indexSha256?leaves.records:[];
  return available.concat(cases,endings).find(p=>p.node===call.node && p.path.split('').join('.')===call.route.slots.join('.'));
 }
 async function load(record,call){
  const packet=packetFor(record,call);
  if(!packet)return null;
  const report=await A.compressed('/public/data/proof-atlas/'+packet.file+'.json.gz',
   packet.hash,{maxBytes:packet.bytes,expectedBytes:packet.bytes});
  if(report.call.indexSha256!==record.indexSha256 || report.call.declaration!==record.name ||
    report.call.node!==call.node || report.call.root!==call.route.root ||
    String(report.call.slots)!==String(call.route.slots))throw Error('Caller type address mismatch');
  return report;
 }
 function conversionSubterms(graph,row){
  let left=row.expectedRoot,right=row.inferredRoot;
  const fields=[];
  for(const slot of row.conversionSite?.fields||[]){
   if(graph.kind[left]!==5 || graph.kind[right]!==5 || ![0,1].includes(slot))
    throw Error('Invalid conversion address');
   fields.push(A.fields.app[slot]);
   left=graph.children[left][slot];right=graph.children[right][slot];
  }
  return {fields,left,right};
 }
 function mount(container,record,call,data,sourceLink){
  const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
  const cases=(host.PROOF_ATLAS_TRANSPORT_CASES||[]).filter(c=>c.indexSha256===record.indexSha256);
  function addressLink(label,node,path){
   const route={root:1,slots:Array.from(path,Number)};
   if(A.walk(data,route)!==node)throw Error('Case evidence address mismatch');
   return sourceLink(label,{node,route});
  }
  function caseEvidence(){
   const branchCase=cases.find(c=>c.branches.some(b=>b.transport===call.node));
   if(branchCase && packetFor(record,call)){
    const branch=branchCase.branches.find(b=>b.transport===call.node);
    const box=el('p');
    box.append('This branch uses ',addressLink(branchCase.disjunction,branchCase.node,branchCase.path),
     '. Its equality is reversed by ',addressLink('Eq.symm',branch.symmetry,call.route.slots.join('')+'00001'),'.');
    container.append(box);
   }
   if(cases.length && call.route.root===1 && !call.route.slots.length){
    const box=el('details'),list=el('ul'),seen=new Set();
    box.append(el('summary','Disjunctions used in the proof'),list);
    for(const c of cases){
     if(seen.has(c.majorBinderPath))continue;
     seen.add(c.majorBinderPath);
     const uses=cases.filter(x=>x.majorBinderPath===c.majorBinderPath);
     const row=el('li');
     row.append(addressLink(c.name+' · '+c.disjunction,c.value,c.majorBinderPath+'1'),' · case splits ');
     uses.forEach((x,i)=>{if(i)row.append(', ');row.append(addressLink(String(i+1),x.node,x.path));});
     list.append(row);
    }
    container.append(box);
   }
  }
  function terminalCases(){
   const evidence=host.PROOF_ATLAS_TRANSPORT_LEAVES;
   if(evidence?.indexSha256!==record.indexSha256 || call.route.root!==1 || call.route.slots.length)return;
   const box=el('details'),table=el('table'),head=table.createTHead().insertRow(),body=table.createTBody();
   box.append(el('summary','How the eight cases close'));
   for(const title of ['(a, b, c)','Closing rule','Premise used for contradiction']){
    const th=el('th',title);th.scope='col';head.append(th);
   }
   for(const leaf of evidence.leaves){
    const row=body.insertRow(),th=el('th','('+leaf.triple.map(x=>x?'½':'0').join(', ')+')');
    th.scope='row';row.append(th);
    row.insertCell().append(addressLink(leaf.rule,leaf.node,leaf.closing));
    const reason=row.insertCell();
    if(leaf.cast){
     reason.append(addressLink(leaf.equation,leaf.castNode,leaf.cast));
    }else reason.textContent='—';
   }
   box.append(table);container.append(box);
  }
  function existentialIntroduction(){
   // A saturated constructor has exactly four application nodes, even in a shared term.
   const inputs=[];
   let head=call.node;
   while(inputs.length<4 && data.kind[head]===5){
    inputs.unshift(data.children[head][1]);
    head=data.children[head][0];
   }
   if(inputs.length!==4 || data.kind[head]!==4 || data.payloads?.[head]?.name!=='Exists.intro')return;
   const checked=(host.PROOF_ATLAS_EXISTENTIAL_INTRODUCTIONS||[]).find(r=>
    r.edition===call.edition && r.indexSha256===record.indexSha256 && r.declaration===record.name &&
    r.node===call.node && r.root===call.route.root && String(r.slots)===String(call.route.slots));
   if(checked && String(checked.inputs)!==String(inputs))throw Error('Existential input mismatch');
   const box=el('section');box.dataset.existentialIntroduction='';
   box.append(el('h4','Existence proof'));
   if(checked)box.append(el('p',checked.goal));
   for(const [index,label,value] of [[2,'Witness',checked?.witness],[3,'Proof for this witness',checked?.obligation]]){
    const route={root:call.route.root,slots:call.route.slots.concat(Array(3-index).fill(0),1)};
    if(A.walk(data,route)!==inputs[index])throw Error('Existential argument address mismatch');
    const row=el('p');row.append(sourceLink(label,{node:inputs[index],route}));
    if(value)row.append(' · ',el('code',value));
    box.append(row);
   }
   container.append(box);
  }
  function showLogicalCases(){
   const exact=host.ProofAtlasOmittedReferences?.exactCallInputs;
   if(!exact)return;
   const either=exact(data,call,'Or.casesOn',6);
   const inputs=either||exact(data,call,'And.casesOn',5);
   if(!inputs)return;
   const box=el('section'),list=el('ol');
   box.dataset.logicalCases=either?'or':'and';
   box.append(el('h4',either?'Two cases':'Use both conjuncts'),
    sourceLink(either?'Disjunction used for the split':'Conjunction being unpacked',inputs[3]),list);
   const branches=inputs.slice(4);
   for(const [index,branch] of branches.entries()){
    const row=el('li'),side=index?'Right':'Left';
    row.append(sourceLink(either?side+' case':'Joint branch',branch),' · ');
    if(either)row.append(sourceLink('Assumption',inputs[index]));
    else row.append(sourceLink('Left assumption',inputs[0]),' and ',sourceLink('Right assumption',inputs[1]));
    let node=branch.node;
    const slots=branch.route.slots.slice();
    const arity=either?1:2;
    let opened=0;
    while(opened<arity && data.kind[node]===6){slots.push(1);node=data.children[node][1];opened++;}
    if(opened===arity){
     const body=node,bodySlots=slots.slice(),uses=el('details');
     uses.append(el('summary','References to the branch assumptions'));
     let counted=false;
     uses.ontoggle=()=>{
      if(!uses.open || counted)return;
      counted=true;
      const budget={maxStates:8192,maxWork:16384,maxDepth:512,useSupport:false,firstIfPresent:true};
      for(let k=0;k<arity;k++){
       const index=arity-1-k;
       const result=host.ProofAtlasRecursiveInputs.countReferences(data,body,index,budget);
       const line=el('p'),label=arity===1?'Assumption':k===0?'Left assumption':'Right assumption';
       const binderRoute={root:branch.route.root,slots:branch.route.slots.concat(Array(k).fill(1))};
       line.append(sourceLink(label,{node:A.walk(data,binderRoute),route:binderRoute}));
       if(result.status==='counted'){
        const n=result.occurrences;
        line.append(' · '+n+' syntactic reference'+(n==='1'?'':'s')+' in the branch body');
        if(n!=='0'){
         const {witness}=result;
         const route={root:branch.route.root,slots:bodySlots.concat(witness.slots)};
         const binding=A.binding(data,route);
         if(!binding || String(binding.route.slots)!==String(binderRoute.slots))throw Error('Branch reference scope mismatch');
         const use={node:witness.node,route};
         line.append(' · ',sourceLink('First reference',use));
         const receiver=host.ProofAtlasOmittedReferences.applicationAtUse(data,use,{includePeers:false});
         if(receiver){
          const role=receiver.slot?'argument '+receiver.slot+' of '+receiver.arity:'function position';
          line.append(' → ',sourceLink(receiver.label+' · '+role,receiver.call));
         }else{
          const parent={root:route.root,slots:route.slots.slice(0,-1)};
          const node=A.walk(data,parent),kind=A.kinds[data.kind[node]];
          line.append(' → ',sourceLink(kind+'.'+A.fields[kind][route.slots.at(-1)],{node,route:parent}));
         }
        }
       }else line.append(' · reference count unavailable within the traversal limit');
       uses.append(line);
      }
     };
     row.append(uses);
     let lets=0;
     while(lets<8 && data.kind[node]===8){slots.push(2);node=data.children[node][2];lets++;}
     let head=node;
     for(let j=0;j<32 && data.kind[head]===5;j++)head=data.children[head][0];
     const name=data.kind[head]===4?data.payloads?.[head]?.name:null;
     const label=(lets?'Body after '+lets+' local definition'+(lets===1?'':'s'):'Branch body')+(name?' · '+name:'');
     row.append(el('br'),sourceLink(label,{node,route:{root:branch.route.root,slots}}));
    }
    list.append(row);
   }
   container.append(box);
  }
  showLogicalCases();
  const conjunction=host.ProofAtlasConjunction?.(data,call.node);
  if(conjunction){
   const box=el('section');box.dataset.conjunction=conjunction.kind;
   const rewrite=conjunction.kind==='rewrite';
   const checked=(host.PROOF_ATLAS_EXISTENTIAL_INTRODUCTIONS||[]).map(r=>r.conjunction).find(r=>
    r && r.edition===call.edition && r.indexSha256===record.indexSha256 && r.declaration===record.name &&
    r.root===call.route.root && r.node===call.node && String(r.slots)===String(call.route.slots));
   box.append(el('h4',rewrite?'Rewrite each conjunct to True':'Prove both conjuncts'));
   for(const side of ['left','right']){
    const route={root:call.route.root,slots:call.route.slots.concat(conjunction[side])};
    const node=A.walk(data,route),row=el('p');
    row.append(sourceLink((side==='left'?'Left':'Right')+(rewrite?' equality':' proof'),{node,route}));
    if(checked){
     if(checked[side].node!==node)throw Error('Conjunct evidence address mismatch');
     row.append(' · ',el('code',checked[side].expected));
    }
    box.append(row);
   }
   container.append(box);
  }
  existentialIntroduction();
  terminalCases();
  caseEvidence();
  function mountOutline(target){
    const index=host.PROOF_ATLAS_TRANSPORT_DOMAINS;
    if(index?.indexSha256===record.indexSha256){
     const outline=el('details');
     outline.append(el('summary','Nested equality transports in this proof'),
      el('p','Each label is the equality supplied to a transport. Indentation places a call inside the fourth argument of its parent.'));
     function branches(parent){
      const list=el('ul');
      for(const entry of index.records.filter(r=>r.parent===parent)){
       const route={root:1,slots:Array.from(entry.path,Number)};
       if(A.walk(data,route)!==entry.node)throw Error('Transport outline address mismatch');
       const line=el('li'),label=sourceLink(entry.equality,{node:entry.node,route});
       if(entry.node===call.node)label.setAttribute('aria-current','location');
       line.append(label);
       const children=branches(entry.node);if(children.children.length)line.append(children);
       list.append(line);
      }
      return list;
     }
     outline.append(branches(null));target.append(outline);
    }
  }
  if(!packetFor(record,call)){
   if(call.route.root===1 && !call.route.slots.length)mountOutline(container);
   return;
  }
  const details=el('details'),content=el('div');
  details.dataset.callerDomains='';
  details.append(el('summary','Compare kernel-checked argument types'),content);container.append(details);
  let pending=false,loaded=false;
  details.ontoggle=async()=>{
   if(!details.open||pending||loaded)return;
   pending=true;content.textContent='Loading checked types…';
   try{
    const report=await load(record,call),rows=report.arguments;
    const select=el('select'),label=el('label','Argument '),comparison=el('div');
    for(const row of rows){
     const option=el('option',String(row.slot));option.value=String(row.slot);select.append(option);
    }
    label.append(select);
    const returned=report.returnedFunction;
    select.value=String(returned?returned.declaredBinders+1:(rows.find(r=>!r.structurallyIdentical)||rows[0]).slot);
    const intro=el('div');
    if(returned){
     const route={root:call.route.root,slots:call.route.slots.concat(Array(rows.length-returned.declaredBinders).fill(0))};
     if(A.walk(data,route)!==returned.node)throw Error('Returned function address mismatch');
     const description=el('p');
     description.append(sourceLink(returned.head+' after '+returned.declaredBinders+' arguments',{node:returned.node,route}),
      ' returns a function. Arguments '+(returned.declaredBinders+1)+'–'+rows.length+' supply its premises.');
     intro.append(description,el('pre',returned.type),el('p','Conclusion after all premises'),el('code',returned.result));
    }
    if(returned)mountOutline(intro);
    function draw(){
     const row=rows[Number(select.value)-1];
     const route={root:call.route.root,slots:call.route.slots.concat(Array(rows.length-row.slot).fill(0),1)};
     if(A.walk(data,route)!==row.node)throw Error('Caller argument address mismatch');
     const title=el('p');title.append(sourceLink('Supplied argument '+row.slot+' · e'+row.node,{node:row.node,route}));
     comparison.replaceChildren(title,el('code',row.expected));
     if(row.structurallyIdentical){comparison.append(el('p','The inferred and expected types share the same compiled expression.'));return;}
     if(row.inferred!==row.expected)comparison.append(el('p','Inferred type'),el('code',row.inferred));
     const diff=conversionSubterms(report.types,row);
     comparison.append(el('p',row.conversionSite?.kernelDefEq?'Lean also checked the two subterms at '+(diff.fields.join('.')||'the type root')+' for definitional equality.':'Lean checked the conversion between these types.'));
     for(const [name,id] of [['Expected subterm',diff.left],['Inferred subterm',diff.right]]){
      comparison.append(el('strong',name),el('pre',A.termLines(report.types,id).join('\n')));
     }
    }
    content.replaceChildren(intro,label,comparison);draw();select.onchange=draw;loaded=true;
   }catch{content.textContent='Argument types unavailable. Close and reopen to retry.';}
   finally{pending=false;}
  };
 }
 host.ProofAtlasCallerDomains={load,mount};
})(typeof window==='undefined'?globalThis:window);
