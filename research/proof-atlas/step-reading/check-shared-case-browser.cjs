// Run in a browser with the library scripts loaded, passing the Lean-exported packet.
module.exports=async function checkSharedCase(g){
 const A=window.ProofAtlasLibraryData,box=document.createElement('section');
 const total=1n<<60n,root=0,prefix=[1,1,0,1,1];
 const check=(ok,msg)=>{if(!ok)throw Error(msg);};
 const wait=async f=>{
  for(let i=0;i<100;i++){if(f())return;await new Promise(resolve=>setTimeout(resolve,10));}
  throw Error('Branch control unavailable');
 };
 const sourceLink=(text,at)=>{
  const link=document.createElement('a');link.textContent=text;
  link.href='#fixture-'+at.node;link.dataset.route=at.route.slots.join('.');
  return link;
 };
 document.body.append(box);
 try{
  window.ProofAtlasCallerDomains.mount(box,{name:'shared-case',indexSha256:'fixture'},
   {node:A.walk(g,{root,slots:[1,1]}),route:{root,slots:[1,1]}},g,sourceLink);
  box.querySelector('details').open=true;
  await wait(()=>box.querySelector('input'));
  const input=box.querySelector('input'),line=input.closest('p'),diagram=line.nextElementSibling;
  diagram.open=true;await wait(()=>diagram.querySelector('ul a'));
  for(const rank of [1n,(1n<<53n)+1n,(1n<<53n)+2n,total/2n,total]){
   input.value=rank.toString();line.querySelector('button').click();
   const selected=diagram.querySelector('[aria-current]');
   check(selected?.textContent===String(rank),'Rounded selection');
   for(const a of diagram.querySelectorAll('ul a')){
    const index=BigInt(a.textContent)-1n;
    const bits=index.toString(2).padStart(60,'0');
    const slots=prefix.concat([...bits].flatMap(b=>b==='0'?[0,1]:[1]));
    check(a.dataset.route===slots.join('.'),'Incorrect occurrence link');
    check(A.binding(g,{root,slots}).route.slots.join('.')===prefix.slice(0,-1).join('.'),'Wrong binder');
   }
   check(line.querySelector('span a').dataset.route===selected.dataset.route,'Selection disagreement');
  }
  check(diagram.querySelector('.pl-actions button:last-child').disabled,'Next enabled at end');
  return {total:String(total),finalPageLinks:diagram.querySelectorAll('ul a').length};
 }finally{box.remove();}
};
