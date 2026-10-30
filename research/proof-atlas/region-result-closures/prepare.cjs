'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const A=require('../../../public/js/proof-atlas-library-data'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const [controls,folder]=process.argv.slice(2);assert(controls&&folder);fs.mkdirSync(folder,{recursive:false});
const read=d=>{const b=z.gunzipSync(fs.readFileSync('.'+d.file));assert.equal(sha(b),d.sha256);return JSON.parse(b);};
function context(g,anchor){let node=g.roots[anchor.route.root];const rows=[];
 for(const [i,slot] of anchor.route.slots.entries()){
  const kind=A.kinds[g.kind[node]],route={root:anchor.route.root,slots:anchor.route.slots.slice(0,i)};
  if((kind==='lam'||kind==='forallE')&&slot===1||kind==='letE'&&slot===2)rows.push({node,kind,route,path:A.path(g,route)});
  node=g.children[node][slot];
 }assert.equal(node,anchor.node);return rows;
}
function group(g,id,calls){calls.sort((a,b)=>a.id-b.id);assert(calls.length>0&&calls.length<=8);
 let common=calls[0].context.slice();for(const c of calls){let n=0;while(n<common.length&&n<c.context.length&&JSON.stringify(common[n])===JSON.stringify(c.context[n]))n++;common=common.slice(0,n);}
 const last=common.at(-1),prefixRoute=last?{root:last.route.root,slots:[...last.route.slots,last.kind==='letE'?2:1]}:{root:calls[0].anchor.route.root,slots:[]};
 for(const c of calls){assert.equal(c.anchor.route.root,prefixRoute.root);assert.deepEqual(c.anchor.route.slots.slice(0,prefixRoute.slots.length),prefixRoute.slots);assert.deepEqual(context(g,c.anchor),c.context);}
 return{id,calls,commonContext:common,prefixRoute};
}
const host={};vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/network-streaming-manifest.js','utf8'),{window:host});
const descriptors=Object.values(host)[0].records,profiles=[];
for(const [name,sets] of [['JacobiData.slope_bound_abs',[[25,26,27,75,76,77,78],[37,44,75]]],['lean_workbook_plus_6206',[[0,1,2,3,4,5,6,7]]]]){
 const d=descriptors.find(d=>d.source.name===name),packet=z.gunzipSync(fs.readFileSync('.'+d.record.indexFile));assert.equal(sha(packet),d.record.indexSha256);
 const g=A.validateIndex(JSON.parse(packet),d.record),native=read(d.owner),calls=new Map(native.entries.filter(e=>e.id.endsWith(':0')).map(e=>[+e.id.split(':')[0],e.junction]));
 const groups=sets.map((set,i)=>group(g,name+':'+i,set.map(id=>{const j=calls.get(id);assert(j);return{id,anchor:j.consumer.anchor,context:j.consumer.context,oldTypeGraph:j.graph,oldTypeRoot:j.roots.consumerType,oldRole:j.resultRole};})));
 profiles.push({source:{...d.source,module:d.record.module},record:d.record,originalNativeOwner:d.owner,groups,packet});
}
const inventory=JSON.parse(fs.readFileSync(path.join(controls,'packets/inventory.json')));assert.equal(inventory.length,3);
for(const record of inventory){const packet=fs.readFileSync(path.join(controls,'packets',record.file)),g=JSON.parse(packet),calls=[];let visits=0;
 function walk(node,slots=[],parent=null,parentSlot=null){assert(++visits<10000);const kind=A.kinds[g.kind[node]];
  if(kind==='app'&&!(parent!==null&&A.kinds[g.kind[parent]]==='app'&&parentSlot===0)){
   let head=node;while(A.kinds[g.kind[head]]==='app')head=g.children[head][0];
   if(A.kinds[g.kind[head]]==='bvar'){
    const anchor={node,route:{root:1,slots}},ctx=context(g,anchor),binder=ctx.at(-1-g.payloads[head].index);
    if(binder&&g.payloads[binder.node].binderName==='f')calls.push({id:calls.length,anchor,context:ctx});
   }
  }g.children[node].forEach((c,s)=>walk(c,[...slots,s],node,s));
 }walk(g.roots[1]);assert.equal(calls.length,2,record.name);
 const sourceSha256=sha(fs.readFileSync('research/proof-atlas/region-result-closures/Controls.lean'));
 profiles.push({source:{name:record.name,edition:'authored-region-closure-controls',indexSha256:sha(packet),sourceSha256,module:'RegionClosureControls'},record:{...record,indexSha256:sha(packet),sourceSha256},originalNativeOwner:null,groups:[group(g,record.name,calls)],packet});
}
for(const [i,p] of profiles.entries()){
 const packet=path.resolve(folder,'packet-'+i+'.json');fs.writeFileSync(packet,p.packet);delete p.packet;p.packetFile=packet;
 const file=path.resolve(folder,'request-'+i+'.json');fs.writeFileSync(file,JSON.stringify(p));p.requestFile=file;p.requestSha256=sha(fs.readFileSync(file));
}
const plan={format:'ProofAtlasRegionResultClosuresPlan/1',profiles};fs.writeFileSync(path.join(folder,'plan.json'),JSON.stringify(plan,null,2));
console.log(JSON.stringify({status:'PASS',profiles:profiles.length,groups:profiles.reduce((n,p)=>n+p.groups.length,0),ports:profiles.reduce((n,p)=>n+p.groups.reduce((n,g)=>n+g.calls.length,0),0),contexts:profiles.map(p=>({name:p.source.name,groups:p.groups.map(g=>({id:g.id,common:g.commonContext.length,depths:g.calls.map(c=>c.context.length)}))}))}));
