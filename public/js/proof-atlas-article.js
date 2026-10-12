/* A graph link highlights the exact source passage, after formulas are rendered. */
(function(){
 'use strict';
 function accessibleScrollRegions(){
  document.querySelectorAll('.pa-paper .katex-display,.pa-paper table').forEach(n=>{
   if(n.scrollWidth>n.clientWidth+1){n.tabIndex=0;n.setAttribute('role','region');n.setAttribute('aria-label',n.matches('table')?'Scrollable article table':'Scrollable mathematical formula');}
   else{n.removeAttribute('tabindex');n.removeAttribute('role');n.removeAttribute('aria-label');}
  });
 }
 async function reveal(){
  const id=decodeURIComponent(location.hash.slice(1));if(!id)return;
  const target=document.getElementById(id);if(!target)return;
  if(document.fonts)await document.fonts.ready;
  document.querySelectorAll('.pa-paper-highlight').forEach(n=>n.classList.remove('pa-paper-highlight'));
  const block=id.startsWith('passage-')?target:target.closest('p,.lemma,.theorem,.remark,table')||target;
  block.classList.add('pa-paper-highlight');block.tabIndex=-1;
  requestAnimationFrame(()=>{target.scrollIntoView({block:'center'});block.focus({preventScroll:true});});
 }
 function ready(){accessibleScrollRegions();reveal();}
 window.addEventListener('hashchange',reveal);
 window.addEventListener('resize',accessibleScrollRegions);
 if(document.readyState==='complete')ready();else window.addEventListener('load',ready);
})();
