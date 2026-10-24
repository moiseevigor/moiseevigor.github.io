/* Shared field notation. Ordered semantic fields come from the pinned Expr schema. */
(function(host){
 'use strict';
 const labels={expr:'Expr child',scope:'Scope reference',context:'Context reference',level:'Universe link',reference:'Declaration reference',payload:'Payload'};
 const escape=value=>String(value).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
 function model(rule){
  if(!rule||!Array.isArray(rule.fields)||!rule.fields.length)throw Error('Constructor field schema unavailable');
  return {kind:rule.kind,fields:rule.fields.map(f=>{
   if(!labels[f.link])throw Error('Unknown constructor field relation');
   return {...f,relation:labels[f.link],scope: f.link==='expr'&&f.name==='body'&&['lam','forallE','letE'].includes(rule.kind)?'Γ + binder':f.link==='expr'?'Γ':null};
  })};
 }
 function html(rule){const m=model(rule);return '<div class="pa-field-diagram" role="group" aria-label="'+escape(m.kind)+' ordered constructor fields"><div class="pa-field-root"><code>Expr.<br><strong>'+escape(m.kind)+'</strong></code><small>semantic fields ↓</small></div><ol>'+m.fields.map(f=>'<li data-field="'+escape(f.name)+'" data-relation="'+escape(f.link)+'"><span class="pa-field-wire" aria-hidden="true"></span><div><code>'+escape(f.name)+'</code> <span class="pa-field-type">: '+escape(f.type)+'</span><small>'+escape(f.relation)+(f.scope?' · '+escape(f.scope):'')+'</small></div></li>').join('')+'</ol></div>';}
 const api={model,html};if(typeof module!=='undefined'&&module.exports)module.exports=api;else host.ProofAtlasConstructorDiagram=api;
})(typeof window==='undefined'?globalThis:window);
