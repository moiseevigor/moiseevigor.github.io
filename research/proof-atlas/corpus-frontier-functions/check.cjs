'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),cp=require('child_process'),crypto=require('crypto'),assert=require('assert/strict');process.chdir(path.resolve(__dirname,'../../..'));
const F=require('./model.cjs'),C=require('./components.cjs'),base='research/proof-atlas/corpus-frontier-functions/',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const mode=process.argv[2],folder=process.argv[3],probe=mode==='--probe',freeze=mode==='--freeze';assert(!probe&&!freeze||folder);
let native,plan,verification;
if(probe||freeze){plan=JSON.parse(fs.readFileSync(folder+'/plan.json'));if(freeze)verification=JSON.parse(fs.readFileSync(folder+'/verification.json'));native={format:'ProofAtlasCorpusFrontierNative/1',profiles:plan.profiles,verification};}
else{native=JSON.parse(z.gunzipSync(fs.readFileSync(base+'native-check.json.gz')));verification=native.verification;}
const baseline='research/proof-atlas/region-result-closures/native-check.json.gz',oldBytes=fs.readFileSync(baseline);assert(oldBytes.equals(cp.execFileSync('git',['show','e22691381fa67123d67c33a19ff172c1ed6dce8c:'+baseline])));const prior=JSON.parse(z.gunzipSync(oldBytes));
if(!probe){assert.equal(verification.status,'PASS');assert.equal(verification.baselineSha256,sha(oldBytes));for(const [file,digest]of Object.entries(verification.producerFiles))assert.equal(sha(fs.readFileSync(file)),digest,file);}
const report={format:'ProofAtlasCorpusFrontierModel/1',status:'RUNNING',profiles:0,cases:0,singletons:0,antichains:0,positionAppearances:0,distinctSourcePositions:0,parameterDomains:0,declaredGoalLiteralMatches:0,declaredGoalMetadataErasedMatches:0,originalGoalLiteralMatches:0,nativeDeclaredGoalConversions:0,binderWitnesses:0,refusals:0,maxJointRows:0,maxTermRows:0,rows:[]},assets=new Set(),observed=new Set();
for(const [pi,p]of native.profiles.entries()){
 const original=prior.profiles.find(x=>x.source.indexSha256===p.source.indexSha256);assert(original);const bytes=z.gunzipSync(fs.readFileSync('.'+p.record.indexFile));assert.equal(sha(bytes),p.source.indexSha256);const g=JSON.parse(bytes),isRiccati=p.source.name==='JacobiData.slope_bound_abs';let count=0;
 for(const [ci,item]of p.cases.entries()){
  let raw,data,relative;
  if(probe||freeze){const file=folder+'/outputs/'+pi+'-'+ci+'.json.gz';if(probe&&!fs.existsSync(file))continue;raw=z.gunzipSync(fs.readFileSync(file));data=JSON.parse(raw);relative='cases/'+sha(raw)+'.json.gz';}
  else{relative=item.output.file;const compressed=fs.readFileSync(base+relative);assert.equal(sha(compressed),item.output.compressedSha256);raw=z.gunzipSync(compressed);assert.equal(sha(raw),item.output.sha256);data=JSON.parse(raw);}
  const c=item.case,joint=data.case,opened=C.open(joint,c),out=opened.legacy;assert.equal(out.id,c.id);assert.equal(out.status,'PASS');assert.deepEqual(data.source,p.source);assert.equal(data.closedPacketKernelTyping,'PASS');for(const k of['originalDeclarationImported','originalModuleImported','privateRiccatiModulesImported','recompiledOriginalTypeAndBodyMatch'])assert.equal(data[k],isRiccati);
  assert.equal(c.prefixRoute.root,1);assert.deepEqual(c.prefixRoute.slots,[]);assert.deepEqual(c.context,[]);F.validate(g,c);
  for(const [i,h]of c.holes.entries()){
   const port=p.ports.find(x=>x.call===h.call);assert(port);assert.deepEqual(h.anchor,port.anchor);assert.deepEqual(h.context,port.context);const old=original.output.groups[port.baselineGroup].ports[port.baselinePort].port;
   assert.equal(old.originalRole,'proof');assert(F.equalRoot(old.originalType,old.originalType.roots[0],out.holes[i].originalType,out.holes[i].originalType.roots[0]),'old/new original type');
  }
  for(const key of['functionTyping','declaredGoalFunctionTyping','declaredGoalTypeConversion','sourceInstantiationTyping','sourceInstantiationConversion','sourceEqualityWitness','literalHoleReopening','literalParameterTypeRecovery'])assert.equal(out[key],'PASS');
  const result=F.reconstruct(g,c,out);let finalType=out.graph.roots[1];for(let i=0;i<c.holes.length;i++){assert.equal(out.graph.kind[finalType],7);finalType=out.graph.children[finalType][1];}
  const declared=F.equalRoot(g,g.roots[0],out.graph,finalType),inferred=F.equalRoot(out.sourceGraph,out.sourceGraph.roots[1],out.graph,finalType);
  report.declaredGoalLiteralMatches+=Number(declared);report.originalGoalLiteralMatches+=Number(inferred);
  const metadataErased=C.metadataErasedKeys(g)(g.roots[0])===C.metadataErasedKeys(joint.graph)(finalType);report.declaredGoalMetadataErasedMatches+=Number(metadataErased);
  let expectedNode=opened.roots['function.declaredGoalType'];for(let i=0;i<c.holes.length;i++){assert.equal(joint.graph.kind[expectedNode],7);assert(F.equalRoot(joint.graph,joint.graph.children[expectedNode][0],out.parameterTypes[i],out.parameterTypes[i].roots[0]));expectedNode=joint.graph.children[expectedNode][1];}
  assert(F.equalRoot(g,g.roots[0],joint.graph,expectedNode),'declared goal function result');assert(F.equalRoot(g,g.roots[0],joint.graph,opened.roots['source.declaredType']));report.nativeDeclaredGoalConversions++;
  const witness=C.binderWitness(joint,c,opened);if(witness)report.binderWitnesses++;
  if(c.holes.length>1){const changed=JSON.parse(JSON.stringify(c));changed.holes.reverse();assert.throws(()=>F.reconstruct(g,changed,out));report.refusals++;}
  const wrong=JSON.parse(JSON.stringify(c));wrong.holes[0].anchor.node++;assert.throws(()=>F.reconstruct(g,wrong,out));report.refusals++;
  const wrongScope=JSON.parse(JSON.stringify(joint.components));wrongScope[wrongScope.length-1].scope.kind='source-prefix';assert.throws(()=>C.open({...joint,components:wrongScope},c));report.refusals++;
  c.holes.forEach(h=>observed.add(p.source.indexSha256+':'+JSON.stringify(h.anchor.route)));
  count++;report.cases++;report.positionAppearances+=c.holes.length;report.parameterDomains+=c.holes.length;report.maxJointRows=Math.max(report.maxJointRows,joint.graph.kind.length);report.maxTermRows=Math.max(report.maxTermRows,result.rows);
  if(c.holes.length===1)report.singletons++;else report.antichains++;
  report.rows.push({source:p.source,id:c.id,calls:c.holes.map(h=>h.call),positions:c.holes.length,functionTermRows:result.rows,jointRows:joint.graph.kind.length,bodyOccurrences:g.expanded[g.roots[1]],trieVisits:result.work,declaredGoalLiteralMatch:declared,declaredGoalMetadataErasedMatch:metadataErased,originalInferredGoalLiteralMatch:inferred,nativeDeclaredGoalConversion:true,binderWitness:witness,outputSha256:sha(raw)});
  if(freeze){const record=verification.cases.find(x=>x.profile===pi&&x.case===ci);assert(record&&record.id===c.id);assert.equal(record.outputSha256,sha(raw));fs.mkdirSync(base+'cases',{recursive:true});const compressed=z.gzipSync(raw);fs.writeFileSync(base+relative,compressed);item.output={file:relative,sha256:sha(raw),compressedSha256:sha(compressed)};delete item.requestFile;delete item.requestSha256;assets.add(base+relative);}
 }
 if(count)report.profiles++;
 if(freeze)delete p.packetFile;
}
report.distinctSourcePositions=observed.size;
if(probe){console.log(JSON.stringify({...report,status:'PARTIAL_MODEL_PROBE',rows:report.rows.map(r=>({id:r.id,declaredGoalLiteralMatch:r.declaredGoalLiteralMatch,rows:r.jointRows}))}));process.exit(0);}
assert.equal(report.profiles,2);assert.equal(report.cases,19);assert.equal(report.singletons,17);assert.equal(report.antichains,2);assert.equal(report.positionAppearances,27);assert.equal(report.distinctSourcePositions,17);
assert.equal(report.originalGoalLiteralMatches,19);assert.equal(report.nativeDeclaredGoalConversions,19);
assert.equal(report.declaredGoalMetadataErasedMatches,19);
report.status='PASS';report.scope='Independent full function-term and parameter-domain reconstruction on nineteen native corpus frontiers; exact original paths, shared component scopes, source closures and native declared-goal bridges. No arbitrary graph-region interface or comprehension result.';report.files=Object.fromEntries([baseline,base+'check.cjs',base+'components.cjs',base+'model.cjs','research/proof-atlas/frontier-functions/model.cjs'].map(f=>[f,sha(fs.readFileSync(f))]));
if(freeze){fs.writeFileSync(base+'native-check.json.gz',z.gzipSync(Buffer.from(JSON.stringify(native)+'\n')));fs.writeFileSync(base+'model-check.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n')));}
else assert.deepEqual(JSON.parse(z.gunzipSync(fs.readFileSync(base+'model-check.json.gz'))),report);
console.log(JSON.stringify({...report,rows:report.rows.map(r=>({id:r.id,goal:r.declaredGoalLiteralMatch,rows:r.jointRows}))}));
