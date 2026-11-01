/* An illustration derived from exact native type rows and occurrence paths. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),assert=require('assert/strict'),W=require('../../../../public/js/proof-atlas-scope-comparison'),K=require('../certificate.cjs');
const read=n=>JSON.parse(z.gunzipSync(fs.readFileSync(path.join(__dirname,n)))),inventory=read('inventory.json.gz'),d=inventory.profiles.find(p=>p.source.name==='AtlasScopeNative.dependentLet'),native=read('dependentLet.native.json.gz'),j=native.entries.find(e=>e.id==='0:1').junction,g=j.graph,shift=j.consumer.context.length-j.producer.context.length;
const result=W.compare(g,j.roots.producerType,g,j.roots.producerTypeInConsumer,shift,{includeCertificate:true});K.check(g,j.roots.producerType,g,j.roots.producerTypeInConsumer,shift,result.certificate);
function at(root,slots){let node=root,depth=0;for(const slot of slots){const k=g.kind[node];depth+=((k===6||k===7)&&slot===1||k===8&&slot===2)?1:0;node=g.children[node][slot];}return{node,depth,index:g.payloads[node].index};}
const paths=[[1,1,1],[1,1,2,0,1]],uses=paths.map(slots=>{const source=at(j.roots.producerType,slots),lifted=at(j.roots.producerTypeInConsumer,slots);assert.equal(g.kind[source.node],0);assert.equal(source.depth,lifted.depth);assert.equal(lifted.index,source.index+(source.index>=source.depth?shift:0));return{slots,source,lifted};});
assert.equal(uses[0].source.node,uses[1].source.node);assert.notEqual(uses[0].lifted.node,uses[1].lifted.node);assert.equal(shift,2);
const addr=(component,node,slots)=>({namespace:'application-ports',evidenceSha256:d.owner.sha256,sourceIndexSha256:d.source.indexSha256,query:j.consumer.anchor.route,input:'0:1',component,node,route:{root:component,slots}});
const data={format:'ProofAtlasScopeNativeFigure/1',mathematicalTyping:'kernel-checked-authored-control',source:d.source,owner:d.owner,contextExtension:shift,sourceContext:j.producer.context,consumerContext:j.consumer.context,uses:uses.map(u=>({...u,sourceAddress:addr('producerType',u.source.node,u.slots),liftedAddress:addr('producerTypeInConsumer',u.lifted.node,u.slots)})),certificate:result.certificate,scope:'Only two paths through a compiled type. Storage row IDs belong to its native type table, not the original proof DAG. No source occurrence or context is merged.'};
const font='font-family="system-ui,sans-serif"',mono='font-family="ui-monospace,monospace"',ink='#202832',muted='#425466',line='#5a6470';
const box=(x,y,w,label)=>`<rect x="${x}" y="${y}" width="${w}" height="50" rx="4" fill="#fff" stroke="${line}" stroke-width="1.5"/><text x="${x+w/2}" y="${y+32}" text-anchor="middle" ${mono} font-size="21" fill="${ink}">${label}</text>`;
const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1080 640" role="img" aria-labelledby="title description">
<title id="title">One typed storage row has two scope-dependent targets</title>
<desc id="description">In the kernel-checked dependent-let control, source type row ${uses[0].source.node}, bvar one, refers to external p in a let value at local depth one, and to local x in a let body at depth two. Extending the external context by two maps the first to bvar three and preserves the second as bvar one. Both original occurrence paths and contexts remain distinct.</desc>
<defs><marker id="arrow" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto"><path d="M0 0L10 5L0 10Z" fill="${line}"/></marker></defs>
<rect width="1080" height="640" fill="#faf9f6"/>
<g ${font} fill="${ink}">
<text x="36" y="42" font-size="25" font-weight="600">A typed term needs distinct reference targets</text>
<text x="36" y="76" font-size="18" fill="${muted}">Kernel-checked authored control · original [p] → consumer [p, f, guard]</text>
<text x="36" y="126" ${mono} font-size="19">∀ x : Nat, (let y := p; x + y) = (let y := p; x + y)</text>
<text x="36" y="161" font-size="17" fill="${muted}">Selected input: f · external context extension +${shift} · no change to local binders</text>
<text x="60" y="226" font-size="21" font-weight="600">Original producer type</text>
<text x="710" y="226" font-size="21" font-weight="600">Type in consumer context</text>
<path d="M355 355C480 355 480 288 690 288" fill="none" stroke="${line}" stroke-width="2" marker-end="url(#arrow)"/>
<path d="M355 365C480 365 480 418 690 418" fill="none" stroke="${line}" stroke-width="2" marker-end="url(#arrow)"/>
<text x="415" y="265" font-size="18">let value · local depth ${uses[0].source.depth}</text>
<text x="415" y="292" ${mono} font-size="16">ports ${paths[0].join('.')}</text>
<text x="415" y="441" font-size="18">let body · local depth ${uses[1].source.depth}</text>
<text x="415" y="469" ${mono} font-size="16">ports ${paths[1].join('.')}</text>
${box(60,330,295,`e${uses[0].source.node}: bvar ${uses[0].source.index}`)}
${box(710,263,300,`e${uses[0].lifted.node}: bvar ${uses[0].lifted.index}`)}
${box(710,393,300,`e${uses[1].lifted.node}: bvar ${uses[1].lifted.index}`)}
<text x="60" y="410" font-size="18">One stored row, two paths.</text>
<text x="710" y="344" font-size="18">External p shifts: 1 + 2 = 3.</text>
<text x="710" y="474" font-size="18">Local x stays at index 1.</text>
<path d="M36 510H1044" stroke="#c8ccd1"/>
<text x="36" y="546" font-size="18">The paired rows carry separate scope ranges; they do not identify the two references.</text>
<text x="36" y="580" ${mono} font-size="16" fill="${muted}">Native owner ${d.owner.sha256.slice(0,20)}… · input 0:1 · query 1:1.2.2</text>
<text x="36" y="610" font-size="16" fill="${muted}">Addresses and certificate are in native-sharing.json.gz. Row IDs belong to the native type table.</text>
</g></svg>\n`;
const outputs={'native-sharing.svg':Buffer.from(svg),'native-sharing.json.gz':z.gzipSync(Buffer.from(JSON.stringify(data,null,2)+'\n'),{mtime:0})};
for(const[name,bytes]of Object.entries(outputs)){const file=path.join(__dirname,name);if(process.argv.includes('--check'))assert.deepEqual(name.endsWith('.gz')?z.gunzipSync(fs.readFileSync(file)):fs.readFileSync(file),name.endsWith('.gz')?z.gunzipSync(bytes):bytes,name);else fs.writeFileSync(file,bytes);}
console.log(JSON.stringify({status:'PASS',sourceRow:uses[0].source.node,targetRows:uses.map(u=>u.lifted.node),paths,typing:'kernel-checked-authored-control'}));
