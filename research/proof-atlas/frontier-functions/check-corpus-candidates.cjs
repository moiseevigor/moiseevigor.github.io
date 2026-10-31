/* Structural scale probes only: these new functions have NO native judgment. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),cp=require('child_process'),assert=require('assert/strict'),crypto=require('crypto');
process.chdir(path.resolve(__dirname,'../../..'));
const F=require('./model.cjs'),T=require('../../../public/js/proof-atlas-occurrence-types'),M=require('../region-output-composition/model.cjs');
const base='research/proof-atlas/frontier-functions/',oldFile='research/proof-atlas/region-result-closures/native-check.json.gz',compressed=fs.readFileSync(oldFile),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
assert(compressed.equals(cp.execFileSync('git',['show','e22691381fa67123d67c33a19ff172c1ed6dce8c:'+oldFile])),'immutable preceding observations');
const old=JSON.parse(z.gunzipSync(compressed)),rows=[];
for(const p of old.profiles.slice(0,2)){
 const sourceBytes=z.gunzipSync(fs.readFileSync('.'+p.record.indexFile));assert.equal(sha(sourceBytes),p.source.indexSha256);const g=JSON.parse(sourceBytes),group=p.groups[0],call=group.calls[0],port=p.output.groups[0].ports[0],hole={anchor:call.anchor,context:call.context};
 const c={id:p.source.name+':single-frontier-candidate',prefixRoute:{root:1,slots:[]},context:[],holes:[hole],generalizeTypes:true};
 const closed=M.close(g,call,c.context.length,port.port.originalType);
 const build=F.construct(g,c,[{source:hole,context:call.context,letSlots:call.context.slice(c.context.length).map(f=>f.kind==='letE'),original:closed,originalType:port.port.originalType}]);
 T.validateExpressionGraph(build.graph,build.graph.roots,c.context.length,131072);
 // A source-addressed one-hole inverse recovers the original syntax. This is
 // a codec property, not a typed beta-reduction or a Lean conversion check.
 const {table,compact}=require('../method-context/catalogue.cjs'),t=table(),memo=new Map(),routes=c.holes.map(h=>h.anchor.route.slots.slice(c.prefixRoute.slots.length));
 let inverseWork=0;
 function sourceRead(n){if(memo.has(n))return memo.get(n);const id=t.add(g.kind[n],g.payloads[n],g.children[n].map(sourceRead));memo.set(n,id);return id;}
 function inverse(n,slots=[]){assert(++inverseWork<=65536);const i=routes.findIndex(r=>JSON.stringify(r)===JSON.stringify(slots));if(i>=0)return sourceRead(c.holes[i].anchor.node);if(!routes.some(r=>r.length>slots.length&&JSON.stringify(r.slice(0,slots.length))===JSON.stringify(slots)))return sourceRead(n);return t.add(g.kind[n],g.payloads[n],g.children[n].map((ch,s)=>inverse(ch,[...slots,s])));}
 const root=F.validate(g,c).root,recovered=compact(t.g,[inverse(root)]);assert(F.equalRoot(g,root,recovered,recovered.roots[0]));
 rows.push({source:p.source,originalTypeEvidenceSha256:sha(compressed),sourceRows:g.kind.length,selectedRoot:{node:root,route:c.prefixRoute},selectedExpanded:g.expanded[root],hole,sourceContext:c.context.length,suffixContext:call.context.length-c.context.length,
  status:'STRUCTURAL_CANDIDATE_NOT_KERNEL_CHECKED',nativeFunctionTyping:'UNAVAILABLE',newRootClosureTyping:'UNAVAILABLE',candidateRows:build.graph.kind.length,candidateExpanded:build.graph.expanded[build.graph.roots[0]],candidateRootSyntaxSha256:F.keys(build.graph)(build.graph.roots[0]),trieVisits:build.work,inverseTrieVisits:inverseWork,sourceCodecRecovery:'PASS'});
}
const report={format:'ProofAtlasFrontierCorpusCandidates/1',status:'PASS',rows,files:Object.fromEntries([oldFile,base+'model.cjs',base+'check-corpus-candidates.cjs'].map(f=>[f,sha(fs.readFileSync(f))])),scope:'Two complete-data structural candidates on the actual Riccati and AI packets, with exact recorded original hole types. Original closure typing does not certify the new function. No new kernel judgment, browser memory bound, arbitrary-region interface or comprehension result.'};
const raw=Buffer.from(JSON.stringify(report,null,2)+'\n');if(process.argv.includes('--freeze'))fs.writeFileSync(base+'corpus-candidates.json.gz',z.gzipSync(raw));else assert.deepEqual(JSON.parse(z.gunzipSync(fs.readFileSync(base+'corpus-candidates.json.gz'))),report);
console.log(JSON.stringify(report));
