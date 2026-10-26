/* Checked-context composition versus introduction-only grouping on fixed query cuts. */
'use strict';
const fs=require('fs'),crypto=require('crypto'),assert=require('assert/strict'),J=require('../public/js/proof-atlas-judgment-geometry'),audit=require('./test-proof-atlas-context-frames-audit.cjs'),{sources}=require('./proof-atlas-judgment-fixtures.cjs');
const metric=s=>({displayed:s.nodes.length,ordinaryCalls:s.nodes.filter(n=>n.role==='proof'&&['application','projection','construction'].includes(n.rule)).length,frames:s.nodes.filter(n=>n.contextFrame).length,members:s.nodes.reduce((sum,n)=>sum+(n.contextFrame?.members.length||0),0)});
(async()=>{const rows=[];let packets=0,links=0,negative=0,bounds=0;const stops={};
 for await(const x of sources()){
  packets++;const {record,data,resolve}=x;
  for(const route of x.routes.values())for(const policy of ['proof-first','proof-focus']){
   const options={judgmentRoute:route,policy,foldContextFrames:true},scene=J.create(data,record,resolve,options);audit(scene,data,record,resolve);
   const original=J.create(data,record,resolve,{judgmentRoute:route,policy,foldIntroductions:true});links+=scene.links.filter(l=>l.binderSlot).length;
   rows.push({edition:x.edition,name:record.name,indexSha256:record.indexSha256,route,policy,baseline:metric(original),frames:metric(scene)});
   for(const n of scene.nodes)if(n.contextFrame)stops[n.contextFrame.stop]=(stops[n.contextFrame.stop]||0)+1;
   if(scene.nodes.some(n=>n.contextFrame)&&rows.length%43===0){assert(J.validate(scene,data,record,resolve));for(const change of [s=>s.nodes.find(n=>n.contextFrame).contextFrame.members.reverse(),s=>s.nodes.find(n=>n.contextFrame).ports[0].scopeExtension++,s=>s.nodes.find(n=>n.contextFrame).contextFrame.members[1].typeReference.evidenceSha256='forged']){const bad=structuredClone(scene);change(bad);assert.throws(()=>J.validate(bad,data,record,resolve));assert.throws(()=>audit(bad,data,record,resolve));negative++;}}
   if(!bounds&&scene.nodes.some(n=>n.contextFrame)){
    const frame=scene.nodes.find(n=>n.contextFrame);
    for(const options of [{contextFrameMembers:2},{contextFramePorts:2},{maxNodes:1,maxDepth:0},{maxNodes:5,maxDepth:2,policy:'source-order'}]){audit(J.create(data,record,resolve,{judgmentRoute:frame.route,foldContextFrames:true,...options}),data,record,resolve);bounds++;}
    for(const options of [{foldIntroductions:true},{foldContextFrames:'yes'},{contextFrameMembers:1},{contextFrameMembers:17},{contextFramePorts:1},{contextFramePorts:257}]){assert.throws(()=>J.create(data,record,resolve,{judgmentRoute:frame.route,foldContextFrames:true,...options}));negative++;}
   }
  }
 }
 assert.equal(packets,35);assert.equal(rows.length,2600);assert(bounds===4&&links>0&&negative>6);
 const comparison=Object.fromEntries(['proof-first','proof-focus'].map(policy=>{const rs=rows.filter(r=>r.policy===policy);return[policy,{cuts:rs.length,more:rs.filter(r=>r.frames.ordinaryCalls>r.baseline.ordinaryCalls).length,same:rs.filter(r=>r.frames.ordinaryCalls===r.baseline.ordinaryCalls).length,fewer:rs.filter(r=>r.frames.ordinaryCalls<r.baseline.ordinaryCalls).length,ordinaryBaseline:rs.reduce((sum,r)=>sum+r.baseline.ordinaryCalls,0),ordinaryFrame:rs.reduce((sum,r)=>sum+r.frames.ordinaryCalls,0),frames:rs.reduce((sum,r)=>sum+r.frames.frames,0),members:rs.reduce((sum,r)=>sum+r.frames.members,0)}];}));
 const strata=Object.fromEntries([...new Set(rows.map(r=>r.edition))].map(edition=>[edition,Object.fromEntries(['proof-first','proof-focus'].map(policy=>{const rs=rows.filter(r=>r.edition===edition&&r.policy===policy);return[policy,{cuts:rs.length,more:rs.filter(r=>r.frames.ordinaryCalls>r.baseline.ordinaryCalls).length,same:rs.filter(r=>r.frames.ordinaryCalls===r.baseline.ordinaryCalls).length,fewer:rs.filter(r=>r.frames.ordinaryCalls<r.baseline.ordinaryCalls).length,baseline:rs.reduce((s,r)=>s+r.baseline.ordinaryCalls,0),frames:rs.reduce((s,r)=>s+r.frames.ordinaryCalls,0)}];}))]));
 const report={status:'PASS',moduleSha256:crypto.createHash('sha256').update(fs.readFileSync('public/js/proof-atlas-judgment-geometry.js')).digest('hex'),sourcePackets:packets,cuts:rows.length,links,negativeControls:negative,boundControls:bounds,stops,comparison,strata,rows,scope:'Finite recorded queries, independently recovered source partitions and primitive interfaces. Overlapping cut sums, not complete typing coverage, proof size, semantic importance, readability or bounded total resident memory.'};fs.writeFileSync(process.env.ATLAS_CONTEXT_FRAMES_REPORT||'/tmp/atlas-context-frames.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,rows:undefined}));
})().catch(e=>{console.error(e.stack);process.exit(1)});
