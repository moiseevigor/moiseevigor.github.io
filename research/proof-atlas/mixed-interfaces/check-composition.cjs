/* Rechunking law over unchanged source cuts and native interface origins. */
'use strict';
const fs=require('fs'),path=require('path'),assert=require('assert/strict'),{cases}=require('./inputs.cjs'),M=require('./model.cjs');
const T=require(path.resolve(__dirname,'../../../public/js/proof-atlas-deep-context'));
const key=r=>r.root+':'+r.depth+':'+r.slots;
(async()=>{
 const out={status:'RUNNING',profiles:0,starts:0,partitions:0,chunks:0,mixedPartitions:0,seams:0,conversionSensitiveBodyJoins:0,refusals:0,rows:[]};
 for await(const x of cases()){
  const model=M.open(x.c,x.captions,x.edition);out.profiles++;
  for(const e of x.c.entries){const first=T.construction(e,x.c.data);if(!['Pi-introduction','let-binding'].includes(first?.rule))continue;out.starts++;
   const full=await model.create(e.route,{maxUnits:8});
   for(const pattern of [[4,4],[1,3,4]]){
    const chunks=[],flatUnits=[],regions=[];let route=e.route,retained=0n;
    for(const budget of pattern){
     const v=await model.create(route,{maxUnits:budget});chunks.push(v);flatUnits.push(...v.units);regions.push(...v.sourcePartition.regions.slice(0,-1));retained+=BigInt(v.sourcePartition.retained);
     if(v.continuation.stop!=='member-budget')break;
     route=v.continuation.route;
    }
    const last=chunks.at(-1);regions.push(last.sourcePartition.regions.at(-1));
    assert.deepEqual(flatUnits,full.units);assert.equal(key(last.continuation.route),key(full.continuation.route));assert.equal(last.continuation.stop,full.continuation.stop);
    assert.deepEqual(regions,full.sourcePartition.regions);assert.equal(String(retained),full.sourcePartition.retained);
    const hidden=regions.reduce((sum,p)=>sum+BigInt(p.expanded),0n);assert.equal(String(hidden),full.sourcePartition.hidden);assert.equal(String(retained+hidden),full.sourcePartition.represented);
    let offset=0;
    for(const chunk of chunks.slice(0,-1)){
     offset+=chunk.units.length;const a=flatUnits[offset-1],b=flatUnits[offset],join=full.joins[offset-1];
     assert.equal(key(chunk.continuation.route),key(b.root.route));assert.deepEqual(a.body,b.ports.conclusionType.sourceAnchor?{...b.ports.conclusionType.sourceAnchor,role:b.wholeRole}:null);
     assert.deepEqual(a.ports.bodyType,join.parentActualBodyType);assert.deepEqual(b.ports.conclusionType,join.childConclusionType);
     assert.notEqual(a.ports.bodyType.caption.origin.originKey,b.ports.conclusionType.caption.origin.originKey);out.seams++;
    }
    out.partitions++;out.chunks+=chunks.length;out.mixedPartitions+=new Set(flatUnits.map(u=>u.format)).size>1;
   }
   if(first.rule==='Pi-introduction'&&!full.units[0].bodyConversion.structuralEquality){
    const actual=first.premises[1],next=x.c.get(actual.route),rule=next&&T.construction(next,x.c.data);
    if(rule){assert(T.expressionEqual(first.entry.typeData,actual.typeRoot,rule.entry.typeData,rule.entry.typeData.roots[0]));assert(!T.expressionEqual(first.entry.typeData,first.components.expectedBody,rule.entry.typeData,rule.entry.typeData.roots[0]));out.conversionSensitiveBodyJoins++;out.rows.push({name:x.record.name,edition:x.edition,route:e.route,nextRule:rule.rule});}
   }
   if(full.units.length>1){const bad=structuredClone(full);bad.joins[0].parentActualBodyType=structuredClone(bad.joins[0].childConclusionType);await assert.rejects(()=>model.validate(bad));out.refusals++;}
  }
 }
 assert.equal(out.profiles,51);assert.equal(out.starts,303);assert.equal(out.partitions,606);assert(out.seams>0&&out.mixedPartitions>0);
 out.status='PASS';out.scope='Finite rechunking at 4+4 and 1+3+4: same eight-unit prefix, final original boundary, disjoint source partition and distinct native seam origins. Corpus/calibration starts overlap. This is not a general associativity/preservation proof or semantic proof compression.';
 fs.writeFileSync(path.join(__dirname,'composition-verification.json'),JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify({...out,rows:undefined}));
})().catch(e=>{console.error(e.stack);process.exit(1)});
