// Inspect recorded call-site judgments beyond both literal callee prefixes.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const union = require('../recorded-union.cjs');
const typing = require('../../../public/js/proof-atlas-deep-context');
const {spine} = require('../../../public/js/proof-atlas-elimination');
const dir = 'public/data/proof-atlas/callee-uses/';
const targets = new Map(fs.readdirSync(dir).flatMap(file => JSON.parse(fs.readFileSync(dir+file)).records).map(r=>[r.name,r]));
(async()=>{
  const stages=[];
  for(const item of union.inventory().filter(p=>p.edition==='published-15')){
    const {case:profile}=await union.open(item);
    for(const entry of profile.entries){
      if(entry.route.root!==1)continue;
      const c=typing.construction(entry,profile.data);
      if(c?.rule!=='Pi-application')continue;
      const {head,args}=spine(profile.data,entry.node);
      if(profile.data.kind[head]!==4)continue;
      const name=profile.data.payloads[head].name,callee=targets.get(name);
      if(!callee||args.length<=Math.max(callee.signature.length,callee.parameters.length))continue;
      assert.deepEqual(profile.data.payloads[head].nameParts,name.split('.').map(str=>({str})));
      const types=entry.typeData,{pi,expectedDomain}=c.components,arg=c.premises[1];
      assert.equal(types.kind[pi],7);
      assert.equal(types.children[pi][0],expectedDomain);
      assert.equal(arg.node,args.at(-1));
      for(const k of ['kernelFunctionConversion','kernelDomainConversion','kernelResultConversion'])assert.equal(c.checks[k],'PASS');
      stages.push({caller:item.record.name,callerIndex:item.record.indexSha256,stage:entry.route,
        callee:name,calleeIndex:callee.indexSha256,declaredResult:callee.result.head,slot:args.length,
        binder:types.payloads[pi].binderName,binderInfo:types.payloads[pi].binderInfo,
        actualArgumentType:arg.typeText,argument:arg.route,recording:entry.evidenceSha256,
        pi,expectedDomain,actualTypeRoot:arg.typeRoot});
    }
  }
  console.log(JSON.stringify(stages,null,2));
})().catch(error=>{console.error(error);process.exitCode=1;});
