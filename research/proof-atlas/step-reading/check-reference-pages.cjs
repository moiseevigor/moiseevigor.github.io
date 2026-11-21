// Evaluate in the library browser after selecting SBracket.exact_time's ten-use case.
module.exports=async function checkPages(){
 const insist=(value,message)=>{if(!value)throw Error(message);};
 const ready=async find=>{
  for(let i=0;i<100;i++){
   const result=find();if(result)return result;
   await new Promise(resolve=>setTimeout(resolve,20));
  }
  throw Error('Reference control unavailable');
 };
 const cases=await ready(()=>document.querySelector('[data-logical-cases]'));
 for(const section of cases.querySelectorAll('li > details'))section.open=true;
 const line=await ready(()=>[...cases.querySelectorAll('p')].find(p=>p.textContent.includes('10 syntactic references')));
 const diagram=line.nextElementSibling,input=line.querySelector('input');
 diagram.open=true;
 const tree=await ready(()=>diagram.querySelector('ul:has(a)'));
 const nav=diagram.querySelector('.pl-actions');
 const [previous,next]=nav.querySelectorAll('button');
 const snapshot=()=>[...tree.querySelectorAll('a')].map(a=>[Number(a.textContent),a.href]);
 const links=snapshot(),narrow=diagram.clientWidth<480;
 insist((getComputedStyle(nav).display!=='none')===narrow,'Pagination visibility');
 insist(links.length===(narrow?6:10),'Wrong initial page');
 if(narrow){
  insist(previous.disabled&&!next.disabled,'Initial navigation');
  next.click();links.push(...snapshot());
  insist(next.disabled&&!previous.disabled,'Last page navigation');
  previous.click();insist(snapshot().length===6,'Return navigation');
 }
 insist((getComputedStyle(nav).display!=='none')===narrow,'Pagination visibility');
 insist(links.length===10 && new Set(links.map(x=>x[1])).size===10,'Distinct occurrence links');
 for(const [rank,href] of links){
  input.value=String(rank);line.querySelector('button').click();
  insist(line.querySelector('span a').href===href,'Direct lookup disagrees at '+rank);
  insist(tree.querySelector('[aria-current="location"]').href===href,'Selection on wrong page');
 }
 return {width:diagram.clientWidth,pages:narrow?2:1,occurrences:links.length};
};
