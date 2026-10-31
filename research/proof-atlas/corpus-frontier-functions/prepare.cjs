'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),cp=require('child_process'),assert=require('assert/strict'),crypto=require('crypto');process.chdir(path.resolve(__dirname,'../../..'));
const F=require('../frontier-functions/model.cjs'),folder=process.argv[2];assert(folder);fs.mkdirSync(folder,{recursive:false});
const sha=b=>crypto.createHash('sha256').update(b).digest('hex'),baseline='research/proof-atlas/region-result-closures/native-check.json.gz',bytes=fs.readFileSync(baseline);
assert(bytes.equals(cp.execFileSync('git',['show','e22691381fa67123d67c33a19ff172c1ed6dce8c:'+baseline])));
const prior=JSON.parse(z.gunzipSync(bytes));
function prefix(a,b){return a.root===b.root&&a.slots.length<=b.slots.length&&a.slots.every((s,i)=>s===b.slots[i]);}
const profiles=prior.profiles.slice(0,2).map((p,profile)=>{
 const raw=z.gunzipSync(fs.readFileSync('.'+p.record.indexFile));assert.equal(sha(raw),p.source.indexSha256);const packet=JSON.parse(raw),ports=[];
 for(const [gi,g]of p.groups.entries())for(const [pi,c]of g.calls.entries()){
  const type=p.output.groups[gi].ports[pi].port.originalType,existing=ports.find(x=>JSON.stringify(x.anchor.route)===JSON.stringify(c.anchor.route));
  if(existing){assert.equal(existing.call,c.id);assert(F.equalRoot(existing.originalType,existing.originalType.roots[0],type,type.roots[0]));continue;}
  ports.push({call:c.id,anchor:c.anchor,context:c.context,originalType:type,baselineGroup:gi,baselinePort:pi});
 }
 const antichain=[];for(const c of ports.slice().sort((a,b)=>b.anchor.route.slots.length-a.anchor.route.slots.length||a.call-b.call))if(!antichain.some(x=>prefix(x.anchor.route,c.anchor.route)||prefix(c.anchor.route,x.anchor.route)))antichain.push(c);
 const groups=ports.map(p=>[p]);assert(antichain.length>1);groups.push(antichain);
 const packetFile=path.resolve(folder,'packet-'+profile+'.json');fs.writeFileSync(packetFile,raw);
 const cases=groups.map((members,i)=>{
  const id=p.source.name+':'+(i<ports.length?'singleton-'+members[0].call:'deep-first-antichain'),c={id,prefixRoute:{root:1,slots:[]},context:[],holes:members.map(({call,anchor,context})=>({call,anchor,context})),generalizeTypes:true,expected:'PASS'};
  F.validate(packet,c);const file=path.resolve(folder,'request-'+profile+'-'+i+'.json');fs.writeFileSync(file,JSON.stringify({source:p.source,packetFile,cases:[c]}));
  return{case:c,requestFile:file,requestSha256:sha(fs.readFileSync(file))};
 });
 return{source:p.source,record:p.record,originalNativeOwner:p.originalNativeOwner,ports,packetFile,cases};
});
const plan={format:'ProofAtlasCorpusFrontierPlan/1',baselineSha256:sha(bytes),profiles};fs.writeFileSync(folder+'/plan.json',JSON.stringify(plan,null,2)+'\n');
console.log(JSON.stringify({profiles:profiles.length,cases:profiles.reduce((n,p)=>n+p.cases.length,0),sourcePositions:profiles.reduce((n,p)=>n+p.ports.length,0)}));
