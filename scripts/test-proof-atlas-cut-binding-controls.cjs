/* Shared de Bruijn nodes must retain different targets in domains, values and bodies. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict'),J=require('../public/js/proof-atlas-judgment-geometry'),C=require('../public/js/proof-atlas-cut-certificate'),R=require('../public/js/proof-atlas-local-refinement');
const folder=process.env.ATLAS_CUT_RECORDS||'/tmp/atlas-cut-records',hash=x=>crypto.createHash('sha256').update(x).digest('hex'),binder=name=>({binderName:name,binderNameParts:[{str:name}],binderInfo:'default'}),header=name=>({serialization:'ExprDAG/1',declaration:{name,rootPaths:['root.value'],kernelCheck:'not-claimed'}});
const graphs=[
 {...header('AtlasCutBindings.lambda'),kind:[3,0,6,6],children:[[],[],[1,1],[0,2]],payloads:[{level:{kind:'zero'}},{index:0},binder('x'),binder('A')],expanded:['1','1','3','5'],neededScope:[0,1,1,0],roots:[3]},
 {...header('AtlasCutBindings.forall'),kind:[3,0,7,6],children:[[],[],[1,1],[0,2]],payloads:[{level:{kind:'zero'}},{index:0},binder('x'),binder('A')],expanded:['1','1','3','5'],neededScope:[0,1,1,0],roots:[3]},
 {...header('AtlasCutBindings.shadow'),kind:[3,0,6,6],children:[[],[],[1,1],[0,2]],payloads:[{level:{kind:'zero'}},{index:0},binder('x'),binder('x')],expanded:['1','1','3','5'],neededScope:[0,1,1,0],roots:[3]},
 {...header('AtlasCutBindings.let'),kind:[3,0,0,8,6,6],children:[[],[],[],[2,1,1],[1,3],[0,4]],payloads:[{level:{kind:'zero'}},{index:0},{index:1},{declName:'y',declNameParts:[{str:'y'}],nondep:false},binder('x'),binder('A')],expanded:['1','1','1','4','6','8'],neededScope:[0,1,2,2,1,0],roots:[5]}
];
fs.mkdirSync(folder,{recursive:true});let cuts=0,bindings=0,externalTargets=0,pairs=0;
for(const [i,data]of graphs.entries()){
 const bytes=Buffer.from(JSON.stringify(data)),record={name:data.declaration.name,indexSha256:hash(bytes),sourceSha256:hash(fs.readFileSync(__filename)),uniqueNodes:data.kind.length},records=[],refinements=[];
 for(const slots of [[],[1],...(i===3?[[1,1],[1,1,1],[1,1,2]]:[[1,0],[1,1]])]){
  const options={judgmentRoute:{root:0,slots},sourceFallback:true,maxNodes:13,maxDepth:5},scene=J.create(data,record,()=>null,options),cut=C.create(scene,data,record);C.validate(cut,scene,data,record);records.push(cut);
 }
 const whole=records[0],uses=whole.entries.filter(e=>e.constructor==='bvar'),shared=uses.filter(e=>e.node===1);assert(shared.length>=2);assert.notDeepEqual(shared[0].binding.target,shared.at(-1).binding.target);
 if(i===3){assert.deepEqual(shared.at(-2).binding.target,{entry:2});assert.deepEqual(shared.at(-1).binding.target,{entry:4});const focused=records[2],local=focused.entries.filter(e=>e.constructor==='bvar'&&e.node===1);assert.deepEqual(local[0].binding.target,{external:1});assert.deepEqual(local[1].binding.target,{entry:0});}
 else{assert.deepEqual(shared[0].binding.target,{entry:0});assert.deepEqual(shared[1].binding.target,{entry:2});const focused=records[1],local=focused.entries.filter(e=>e.constructor==='bvar');assert.deepEqual(local[0].binding.target,{external:0});assert.deepEqual(local[1].binding.target,{entry:0});}
 const initial=J.create(data,record,()=>null,{judgmentRoute:{root:0,slots:[]},sourceFallback:true,maxNodes:1,maxDepth:0}),state=R.start(initial,data,record),region=state.ledger.rows.at(-1),part=J.create(data,record,()=>null,{judgmentRoute:region.route,sourceFallback:true,maxNodes:4,maxDepth:1}),next=R.expand(state,region.path,part,data,record),before=C.create(initial,data,record),after=C.create(next.scene,data,record);C.refinement(before,after);refinements.push([records.length,records.length+1]);records.push(before,after);
 const packetFile=path.join(folder,'binding-'+i+'-packet.json.gz');fs.writeFileSync(packetFile,z.gzipSync(bytes));fs.writeFileSync(path.join(folder,'binding-'+i+'.json'),JSON.stringify({expected:record,packetFile,records,refinements}));cuts+=records.length;pairs+=refinements.length;bindings+=records.reduce((n,c)=>n+c.stats.boundVariables,0);externalTargets+=records.reduce((n,c)=>n+c.entries.filter(e=>e.binding?.target?.external!==undefined).length,0);
}
const report={status:'PASS',packets:graphs.length,cuts,bindings,externalTargets,refinements:pairs,sharedNodeGetsDifferentSourceBinders:true,domainsAndLetValuesUseOldContext:true,bodiesUseExtendedContext:true,sourcePathsSurviveShadowing:true,focusedCutsRetainExternalAndInternalTargets:true,mathematicalTypingClaim:false};fs.writeFileSync('/tmp/atlas-cut-binding-controls.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
