/* Public Node/browser models against the retained reference and native source fields. */
'use strict';
const fs=require('fs'),vm=require('vm'),assert=require('assert/strict');
const T=require('../public/js/proof-atlas-deep-context'),P=require('../public/js/proof-atlas-packed-routes'),CF=require('../public/js/proof-atlas-occurrence-context-frame'),U=require('../public/js/proof-atlas-local-definition-unit'),C=require('../public/js/proof-atlas-recorded-captions');
const M=require('../public/js/proof-atlas-mixed-interfaces'),F=require('../research/proof-atlas/mixed-interfaces/model.cjs'),{cases}=require('../research/proof-atlas/mixed-interfaces/inputs.cjs');
(async()=>{
 const out={status:'RUNNING',profiles:0,starts:0,frames:0,mixedFrames:0,typedPorts:0,codomainCuts:0,browserModelComparisons:0,refusals:0};
 const host={ProofAtlasDeepContext:T,ProofAtlasPackedRoutes:P,ProofAtlasOccurrenceContextFrame:CF,ProofAtlasLocalDefinitionUnit:U,ProofAtlasRecordedCaptions:C};vm.runInNewContext(fs.readFileSync('public/js/proof-atlas-mixed-interfaces.js','utf8'),{window:host,TextEncoder});
 for await(const x of cases()){
  const m=M.open(x.c,x.captions,x.edition),reference=F.open(x.c,x.captions,x.edition),browser=host.ProofAtlasMixedInterfaces.open(x.c,x.captions,x.edition);out.profiles++;
  for(const e of x.c.entries){if(!['Pi-introduction','let-binding'].includes(T.construction(e,x.c.data)?.rule))continue;out.starts++;
   for(const maxUnits of [1,4,8]){const v=await m.create(e.route,{maxUnits});assert.deepEqual(v,await reference.create(e.route,{maxUnits}));out.frames++;out.mixedFrames+=new Set(v.units.map(u=>u.format)).size>1;
    if(maxUnits!==8)continue;
    for(const[i,u]of v.units.entries()){
     const intro=u.rule==='Pi-introduction',fields=intro?['binderType','body','conclusion']:['type','value','body','conclusion'];
     for(const field of fields){const route=m.resolve(v,{unit:i,field}),native=T.construction(x.c.get(u.root.route),x.c.data),part=field==='conclusion'?native.entry:native.premises.find(p=>p.field===field);assert.deepEqual(route,part.route);const typed=await m.typeFor(v,{unit:i,field});assert.deepEqual(typed.route,part.route);assert.equal(typed.contextLength,part.contextLength);assert.equal(typed.typeData.roots[0],field==='conclusion'?native.entry.typeData.roots[0]:part.typeRoot);out.typedPorts++;}
     if(intro){const typed=await m.typeFor(v,{unit:i,field:'conclusion'}),scene=T.typeScene(typed,x.c.data,u.ports.codomain.typeRoute);assert.equal(scene.root.node,u.ports.codomain.root);assert.equal(scene.namespace,'computed-native-type');out.codomainCuts++;}
    }
    for(const field of ['expectedBody','codomain','invented']){assert.throws(()=>m.resolve(v,{unit:0,field}));await assert.rejects(()=>m.typeFor(v,{unit:0,field}));out.refusals+=2;}
    await assert.rejects(()=>m.typeFor(v,{unit:0,field:'binding'}));assert.throws(()=>m.resolve(structuredClone(v),0));out.refusals+=2;
    if(out.browserModelComparisons<20&&new Set(v.units.map(u=>u.format)).size>1){assert.deepEqual(JSON.parse(JSON.stringify(await browser.create(e.route,{maxUnits}))),v);out.browserModelComparisons++;}
   }
  }
 }
 assert.equal(out.profiles,51);assert.equal(out.starts,303);assert.equal(out.frames,909);assert.equal(out.browserModelComparisons,20);
 out.status='PASS';out.scope='Finite public model/reference comparison and actual source/type port resolution. Expected/codomain expression ports cannot be requested as independent typing judgments. No renderer or comprehension claim.';
 fs.writeFileSync(process.env.ATLAS_MIXED_REPORT||'/tmp/atlas-mixed-interfaces.json',JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out));
})().catch(e=>{console.error(e.stack);process.exit(1)});
