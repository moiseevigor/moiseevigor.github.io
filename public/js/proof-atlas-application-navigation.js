/* Exact declaration-use navigation. No inferred proof edges or type claims. */
(function(){
'use strict';
const root=document.getElementById('proof-atlas'),box=document.getElementById('pa-reader-content');
if(!root||!box||!window.ProofAtlasTermReader||!window.ProofAtlasApplicationMap)return;
const api=window.ProofAtlasAPI,S=window.PROOF_ATLAS_DATA,T=window.PROOF_ATLAS_TERMS;
const D=ProofAtlasTermReader.create(S,T),A=ProofAtlasApplicationMap.create(S,T,D);
let selection={type:'decl',id:'crossing'};
function annotate(){
if(box.querySelector('[data-application-bridge]')||document.querySelector('[data-pa-reader-tab="article"].active'))return;
if(!A.valid)return;
const list=selection.type==='decl'?A.forDeclaration('CrossingData.'+selection.id):[];
const occ=selection.type==='expr'?(D.kind(selection.id)==='const'?A.forOccurrence(selection.id):A.forApplication(selection.id)):null;
if(!list.length&&!occ)return;
const section=document.createElement('section');section.dataset.applicationBridge='1';section.className='pr-context';
const text=document.createElement('p');text.className='pr-body';text.textContent='Exact Expr.const uses and Expr.app arguments; not inferred propositions or proof steps.';section.append(text);
function action(label,i){const b=document.createElement('button');b.type='button';b.textContent=label;b.addEventListener('click',()=>api.selectExpression(i));section.append(b);}
for(const r of list.slice(0,8))action('Application #'+r.application+' · '+r.arguments.length+' arguments',r.application);
if(occ){if(selection.id!==occ.application)action('Enclosing application #'+occ.application,occ.application);else occ.arguments.forEach((i,j)=>action('Argument '+(j+1)+' → #'+i,i));}
box.prepend(section);
}
window.addEventListener('proof-atlas:selection',e=>{selection=e.detail;queueMicrotask(annotate);});
new MutationObserver(annotate).observe(box,{childList:true});
window.ProofAtlasApplicationNavigation={valid:A.valid,count:A.count};
annotate();
})();
