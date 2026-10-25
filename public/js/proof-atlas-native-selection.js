/* One construction-selection policy for independently validated native packages.
   Missing-page errors propagate to the owning cursor; this module invents no
   observations, conversions or source positions. */
(function(host){
 'use strict';
 const order=Object.freeze(['case','beta','let','primary','projection','packet','useSites']);
 function select(providers,route){
  const ps=order.map(k=>providers[k]),es=ps.map(p=>p?.get(route));
  if(es[4]?.status==='checked'&&es[4]?.projectionJudgment?.status==='checked')return ps[4];
  if(es[0]?.status==='checked'&&es[0]?.eliminationJudgment?.status==='checked')return ps[0];
  if(es[1]?.status==='checked'&&es[1]?.betaJudgment?.status==='checked')return ps[1];
  if(es[2]?.status==='checked'&&(es[2]?.letJudgment?.status==='checked'||es[2]?.letReduction?.status==='available'))return ps[2];
  for(const field of ['lambdaJudgment','applicationJudgment']){
   const at=es.findIndex(e=>e?.status==='checked'&&e[field]?.status==='checked');if(at>=0)return ps[at];
  }
  return ps.find((p,i)=>es[i]?.status==='checked'&&!es[i].typingOrigin)||ps.find((p,i)=>es[i]?.status==='checked')||providers.primary||null;
 }
 const resolver=providers=>route=>select(providers,route),api={order,select,resolver};
 if(typeof module!=='undefined'&&module.exports)module.exports=api;else host.ProofAtlasNativeSelection=api;
})(typeof window==='undefined'?globalThis:window);
