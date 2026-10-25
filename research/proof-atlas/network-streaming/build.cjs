/* All earlier typed calls, plus every maximal source spine in a larger public packet. */
'use strict';
const fs=require('fs'),path=require('path'),vm=require('vm'),assert=require('assert/strict');
const A=require('../../../public/js/proof-atlas-library-data'),M=require('../../../public/js/proof-atlas-application-ports'),C=require('../../../public/js/proof-atlas-construction-composition'),T=require('../../../public/js/proof-atlas-occurrence-types'),E=require('../../../public/js/proof-atlas-equality-transport'),N=require('../../../public/js/proof-atlas-application-network'),S=require('./pack.cjs');
const base='research/proof-atlas/network-streaming/',workdir=process.argv[2];assert(workdir&&path.isAbsolute(workdir),'fresh absolute work directory required');fs.mkdirSync(workdir,{recursive:true});
const h={};for(const file of ['application-network-manifest','goedel-sample-manifest','source-pages-manifest'])vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+file+'.js','utf8'),{window:h});
const previous='research/proof-atlas/application-network/application-network-evidence.json',previousSha256=S.sha(fs.readFileSync(previous)),profiles=[],survey=[];
const putCall=(db,c)=>db.prepare('INSERT INTO calls(id,route,node,payload) VALUES (?,?,?,?)').run(c.index,M.key(c.anchor.route),c.anchor.node,JSON.stringify(c));
function reserve(){const v=fs.statfsSync(workdir);assert(v.bavail*v.bsize>=30*1024**3,'30 GiB disk reserve');}
for(const [i,d]of h.PROOF_ATLAS_APPLICATION_NETWORK.records.entries()){
  reserve();const table=S.read(d.topology);N.validate(table,d);const file=path.join(workdir,'native-'+i+'.sqlite');assert(!fs.existsSync(file),'fresh stage required');const db=S.database(file);db.exec('BEGIN');
  for(const c of table.calls){putCall(db,c);for(const p of c.ports)if(p.knownProducer!==null)db.prepare('INSERT INTO edges(producer,consumer,slot) VALUES (?,?,?)').run(p.knownProducer,c.index,p.slot);}db.exec('COMMIT');
  const nativeDescriptor=S.store(d),meta={mode:'native',source:d.source,owner:d.owner,nativeEvidenceSha256:d.topology.nativeEvidenceSha256,previousTopologySha256:d.topology.sha256,previousEvidenceSha256:previousSha256};
  const result=S.pack(db,meta);db.close();profiles.push({mode:'native',source:d.source,owner:d.owner,record:d.record,sourcePages:d.sourcePages,nativeDescriptor,...result,focus:d.calls.find(c=>c.functionLabel.replace(/^@/,'')==='JacobiData.two_sqrt_mul_le_add')?.index??0});
}
const record=h.PROOF_ATLAS_AI_SAMPLE.edition.declarations.find(d=>d.name==='lean_workbook_plus_54159');assert(record&&record.kernelCheck==='PASS');
const data=A.validateIndex(S.read({file:record.indexFile,sha256:record.indexSha256}),record),source={edition:'goedel-sample-4331',name:record.name,indexSha256:record.indexSha256,sourceSha256:record.sourceSha256};
const file=path.join(workdir,'source.sqlite');assert(!fs.existsSync(file),'fresh stage required');const db=S.database(file),insert=db.prepare('INSERT INTO calls(id,route,node) VALUES (?,?,?)');
function* occurrences(){const stack=data.roots.map((node,root)=>({node,route:{root,slots:[]},inFunction:false,finish:false})).reverse();while(stack.length){const f=stack.pop(),k=data.kind[f.node];if(f.finish){if(k===5&&!f.inFunction)yield f;continue;}stack.push({...f,finish:true});for(let slot=data.children[f.node].length-1;slot>=0;slot--)stack.push({node:data.children[f.node][slot],route:{root:f.route.root,slots:[...f.route.slots,slot]},inFunction:k===5&&slot===0,finish:false});}}
let count=0;db.exec('BEGIN');for(const at of occurrences()){assert(at.route.slots.length<=512,'source route bound');insert.run(count++,M.key(at.route),at.node);if(count%20000===0){reserve();console.error('Indexed source calls:',count);}}db.exec('COMMIT');
const lookup=db.prepare('SELECT id FROM calls WHERE route=?'),stored=db.prepare('SELECT node,route FROM calls WHERE id=?'),update=db.prepare('UPDATE calls SET payload=? WHERE id=?'),edge=db.prepare('INSERT INTO edges(producer,consumer,slot) VALUES (?,?,?)');let totalPorts=0,maxArguments=0,sourceHops=0;
db.exec('BEGIN');for(let index=0;index<count;index++){
  const row=stored.get(index),split=row.route.indexOf(':'),route={root:Number(row.route.slice(0,split)),slots:row.route.slice(split+1)?row.route.slice(split+1).split('.').map(Number):[]},anchor={node:row.node,route};
  const spine=E.spine(data,anchor.node),n=spine.args.length;assert(n>0&&n<=64,'actual source spine bound');maxArguments=Math.max(maxArguments,n);
  const context=T.context(data,route).binders,c={index,anchor,arguments:n,functionLabel:data.kind[spine.head]===4?'@'+data.payloads[spine.head].name:A.kinds[data.kind[spine.head]],result:{role:'unobserved',contextLength:context.length,typeText:'Type observation unavailable · source structure only'},ports:[]};
  for(let slot=0;slot<=n;slot++){
    const input=M.sourceInput(data,anchor,slot),resolved=C.resolve(data,input),p=resolved.producer,known=lookup.get(M.key(p.route))?.id??null;
    if(known!==null){assert(known<index,'source-spine postorder must precede consumer');edge.run(known,index,slot);}
    sourceHops+=resolved.definitionHops.length?1:0;totalPorts++;
    c.ports.push({id:index+':'+slot,slot,input,producer:p,producerKind:data.kind[p.node],producerContextLength:resolved.producerContext.length,consumerContextLength:context.length,role:'unobserved',visibility:null,hops:resolved.definitionHops,externalBinder:resolved.externalBinder,definitionBoundary:resolved.definitionBoundary,knownProducer:known,literalProducerResultType:null});
  }
  update.run(JSON.stringify(c),index);if(index%20000===0){reserve();console.error('Resolved source calls:',index,'of',count);}
}db.exec('COMMIT');
const meta={mode:'source-only',source,owner:null,nativeEvidenceSha256:null,sourceInventorySha256:S.sha(fs.readFileSync('public/data/proof-atlas/goedel-sample-manifest.js')),sourcePacketSha256:record.indexSha256,coverage:'Every maximal raw application spine in both packet roots. Intermediate function-prefix app nodes are retained by source paths, not separate call boxes. Selected-call type observations are unavailable.'};
const result=S.pack(db,meta);db.close();profiles.push({mode:'source-only',source,owner:null,record,sourcePages:h.PROOF_ATLAS_SOURCE_PAGES.records.find(d=>d.indexSha256===record.indexSha256),nativeDescriptor:null,...result,focus:count-1});
survey.push({source,storedNodes:record.uniqueNodes,expandedOccurrences:record.occurrences,maximalSpines:count,ports:totalPorts,maxArguments,bindingPaths:sourceHops,...result.counts});
const manifest={format:'ProofAtlasNetworkStreamingInventory/1',producerSha256:S.sha(fs.readFileSync(__filename)),packerSha256:S.sha(fs.readFileSync(base+'pack.cjs')),previousEvidenceSha256:previousSha256,records:profiles};
fs.writeFileSync('public/data/proof-atlas/network-streaming-manifest.js','window.PROOF_ATLAS_NETWORK_STREAMING = '+JSON.stringify(manifest)+';\n');
const report={format:'ProofAtlasNetworkStreamingDerivation/1',status:'PASS',previousEvidenceSha256:previousSha256,nativeProfiles:profiles.filter(d=>d.mode==='native').length,nativeCalls:profiles.filter(d=>d.mode==='native').reduce((n,d)=>n+d.counts.calls,0),nativePorts:profiles.filter(d=>d.mode==='native').reduce((n,d)=>n+d.counts.ports,0),nativeConnections:profiles.filter(d=>d.mode==='native').reduce((n,d)=>n+d.counts.known,0),sourceOnly:survey,maxCallBytes:Math.max(...profiles.map(d=>d.maxCallBytes)),producerSha256:manifest.producerSha256,packerSha256:manifest.packerSha256,manifestSha256:S.sha(fs.readFileSync('public/data/proof-atlas/network-streaming-manifest.js')),scope:'Paged topology preserves the earlier finite native observations; the larger source-only packet adds structural coverage without per-call typing or new kernel runs.'};
fs.writeFileSync(base+'derivation.json',JSON.stringify(report,null,2)+'\n');console.log(JSON.stringify(report));
