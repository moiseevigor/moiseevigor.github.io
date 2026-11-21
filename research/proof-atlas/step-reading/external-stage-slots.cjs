// Measure which supplied slot each recorded proof-role stage occupies.
'use strict';
const assert=require('node:assert/strict');
const union=require('../recorded-union.cjs');
const typing=require('../../../public/js/proof-atlas-deep-context');
const {spine}=require('../../../public/js/proof-atlas-elimination');
(async()=>{
  const profiles=union.inventory().filter(i=>i.edition==='goedel-sample-4331');
  const hist={};
  for(const item of profiles){
    const {case:profile}=await union.open(item);
    for(const entry of profile.entries){
      if(entry.role!=='proof'||entry.route.root!==1)continue;
      if(typing.construction(entry,profile.data)?.rule!=='Pi-application')continue;
      const {head,args}=spine(profile.data,entry.node);
      if(profile.data.kind[head]!==4)continue;
      const p=profile.data.payloads[head];
      assert.deepEqual(p.nameParts,p.name.split('.').map(str=>({str})));
      const slots=hist[p.name]||={};
      slots[args.length]=(slots[args.length]||0)+1;
    }
  }
  console.log(JSON.stringify(Object.fromEntries(Object.entries(hist).sort()),null,2));
})().catch(e=>{console.error(e);process.exitCode=1;});
