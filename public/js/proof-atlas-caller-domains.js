/* Contextual kernel evidence is keyed by declaration digest and occurrence route. */
(function(host){
 'use strict';
 const A=host.ProofAtlasLibraryData;
 function matches(record,call){
  return record.indexSha256==='8892b0884f374abfa704f50ac89a3c31872a9d3f1aef369b1ae84e44891bde8d' &&
   call.node===2181 && call.route.root===1 && call.route.slots.join('.')==='11111112111111110110101010010100100110011'.split('').join('.');
 }
 async function load(record,call){
  if(!matches(record,call))return null;
  const report=await A.compressed('/public/data/proof-atlas/ai-caller-domains.json.gz',
   'b68b4a4283bd1eeff9bfa1009198ef17add44724906a23ff6a911c47411981ab',{maxBytes:8265,expectedBytes:8265});
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
  if(!matches(record,call))return;
  const el=(tag,text)=>{const n=document.createElement(tag);if(text!==undefined)n.textContent=text;return n;};
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
    select.value=String((rows.find(r=>!r.structurallyIdentical)||rows[0]).slot);
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
    content.replaceChildren(label,comparison);draw();select.onchange=draw;loaded=true;
   }catch{content.textContent='Argument types unavailable. Close and reopen to retry.';}
   finally{pending=false;}
  };
 }
 host.ProofAtlasCallerDomains={load,mount};
})(typeof window==='undefined'?globalThis:window);
