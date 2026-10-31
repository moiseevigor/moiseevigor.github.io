'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');process.chdir(path.resolve(__dirname,'../../..'));
const F=require('./model.cjs'),C=require('./components.cjs'),base='research/proof-atlas/corpus-frontier-functions/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),folder=process.argv[2];assert(folder);
const native=JSON.parse(z.gunzipSync(fs.readFileSync(base+'native-check.json.gz'))),plan=JSON.parse(fs.readFileSync(folder+'/plan.json')),report={format:'ProofAtlasFrontierExportComparison/1',status:'PASS',completedEarlierCases:0,componentRootMatches:0,earlierOutputs:[]};
function equal(a,ar,b,br){assert(F.equalRoot(a,ar,b,br));assert.equal(a.expanded[ar],b.expanded[br]);assert.equal(a.neededScope[ar],b.neededScope[br]);report.componentRootMatches++;}
for(const [pi,p]of native.profiles.entries())for(const [ci,item]of p.cases.entries()){
 const file=folder+'/outputs/'+pi+'-'+ci+'.json.gz';if(!fs.existsSync(file))continue;
 const bytes=z.gunzipSync(fs.readFileSync(file)),before=JSON.parse(bytes);assert.deepEqual(plan.profiles[pi].cases[ci].case,item.case);assert.deepEqual(before.source,p.source);assert.equal(before.case.status,'PASS');
 const resource=JSON.parse(fs.readFileSync(folder+'/native-'+pi+'-'+ci+'.resources.json'));assert.equal(resource.exitCode,0);assert.equal(resource.stopReason,null);
 const data=JSON.parse(z.gunzipSync(fs.readFileSync(base+item.output.file))),after=C.open(data.case,item.case).legacy;
 for(const key of['graph','sourceGraph'])for(let i=0;i<2;i++)equal(before.case[key],before.case[key].roots[i],after[key],after[key].roots[i]);
 for(let i=0;i<after.holes.length;i++){for(let k=0;k<2;k++)equal(before.case.holes[i].original,before.case.holes[i].original.roots[k],after.holes[i].original,after.holes[i].original.roots[k]);equal(before.case.holes[i].originalType,before.case.holes[i].originalType.roots[0],after.holes[i].originalType,after.holes[i].originalType.roots[0]);equal(before.case.parameterTypes[i],before.case.parameterTypes[i].roots[0],after.parameterTypes[i],after.parameterTypes[i].roots[0]);}
 report.completedEarlierCases++;report.earlierOutputs.push({id:item.case.id,rawSha256:sha(bytes)});
}
assert.equal(report.completedEarlierCases,18);assert.equal(report.componentRootMatches,164);
const candidatesFile='research/proof-atlas/frontier-functions/corpus-candidates.json.gz',candidatesBytes=fs.readFileSync(candidatesFile),cp=require('child_process');assert(candidatesBytes.equals(cp.execFileSync('git',['show','82e0c7572c4b93b5d27494a7c416ef50e277b808:'+candidatesFile])));
const candidates=JSON.parse(z.gunzipSync(candidatesBytes));report.earlierStructuralCandidatesMatched=0;
for(const p of native.profiles){const previous=candidates.rows.find(r=>r.source.indexSha256===p.source.indexSha256),item=p.cases[0],data=JSON.parse(z.gunzipSync(fs.readFileSync(base+item.output.file))),opened=C.open(data.case,item.case);assert.equal(F.keys(data.case.graph)(opened.roots['function.term']),previous.candidateRootSyntaxSha256);report.earlierStructuralCandidatesMatched++;}
assert.equal(report.earlierStructuralCandidatesMatched,2);report.earlierStructuralCandidatesSha256=sha(candidatesBytes);
const resource=JSON.parse(fs.readFileSync(folder+'/native-1-8.resources.json')),log=fs.readFileSync(folder+'/native-1-8.log'),assembly=fs.readFileSync(folder+'/NativeCorpusFrontier.lean');
assert.equal(resource.exitCode,-6);assert.equal(resource.stopReason,null);assert(log.toString().includes('lean::memory_exception')&&log.toString().includes('excessive memory consumption'));
assert(assembly.toString().includes(fs.readFileSync('research/proof-atlas/frontier-functions/Frontier.lean','utf8')));
const successful=native.verification.cases.find(c=>c.profile===1&&c.case===8);assert.equal(successful.resources.exitCode,0);assert.equal(successful.resources.stopReason,null);
report.earlierFailure={id:plan.profiles[1].cases[8].case.id,status:'RESOURCE_FAILURE_NO_KERNEL_VERDICT',compilerAllocationMiB:6144,resources:resource,logSha256:sha(log),assemblySha256:sha(assembly),failurePhase:'not instrumented'};
report.sharedGraphCompletion={id:successful.id,compilerAllocationMiB:6144,resources:successful.resources};
report.scope='Earlier separate-component attempt stopped on the four-input AI case. Shared export completed the same planned case with extra declared-goal checks under the same allocation/RSS/time limits. Component syntax for the eighteen earlier outputs is unchanged. This is a finite completion comparison, not a general performance theorem or a kernel-negative result.';
report.files=Object.fromEntries([base+'check-export-comparison.cjs',base+'model.cjs',base+'components.cjs'].map(f=>[f,sha(fs.readFileSync(f))]));
fs.writeFileSync(base+'export-comparison.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n')));console.log(JSON.stringify({status:'PASS',earlierCases:18,rootMatches:164,sharedCase:successful.id}));
