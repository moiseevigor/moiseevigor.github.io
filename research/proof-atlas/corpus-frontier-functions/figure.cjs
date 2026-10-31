'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');process.chdir(path.resolve(__dirname,'../../..'));
const A=require('../../../public/js/proof-atlas-library-data'),C=require('./components.cjs'),{digest}=require('../region-output-composition/model.cjs'),base='research/proof-atlas/corpus-frontier-functions/',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const bytes=z.gunzipSync(fs.readFileSync(base+'native-check.json.gz')),native=JSON.parse(bytes),model=JSON.parse(z.gunzipSync(fs.readFileSync(base+'model-check.json.gz')));
const p=native.profiles[0],item=p.cases.find(c=>c.case.holes.length===6),data=JSON.parse(z.gunzipSync(fs.readFileSync(base+item.output.file))),opened=C.open(data.case,item.case),g=JSON.parse(z.gunzipSync(fs.readFileSync('.'+p.record.indexFile)));
assert.equal(data.case.declaredGoalFunctionTyping,'PASS');assert.equal(model.cases,19);const row=model.rows.find(r=>r.id===item.case.id),w=row.binderWitness;assert(w);
function portal(profile,hole){return'/projects/proof-atlas/library/?'+new URLSearchParams({edition:profile.source.edition,proof:profile.source.name,geometry:'scoped',fold:'binders,applications',route:hole.anchor.route.root+':'+hole.anchor.route.slots.join('.')})+'#expr-'+hole.anchor.node;}
const contexts=new Map(),ports=item.case.holes.map((h,i)=>{const key=digest(h.context);if(!contexts.has(key))contexts.set(key,'C'+(contexts.size+1));return{call:h.call,parameter:i,alias:'H'+h.call,context:contexts.get(key),frames:h.context.length,arguments:data.case.holes[i].letSlots.filter(x=>!x).length,lets:data.case.holes[i].letSlots.filter(Boolean).length,source:h.anchor,url:portal(p,h),path:A.path(g,h.anchor.route),typeRoot:opened.roots['parameter.'+i+'.type']};});
const ai=native.profiles[1],aiItem=ai.cases.find(c=>c.case.holes.length===4),aiGraph=JSON.parse(z.gunzipSync(fs.readFileSync('.'+ai.record.indexFile))),aiPorts=aiItem.case.holes.map(h=>({call:h.call,source:h.anchor,url:portal(ai,h),path:A.path(aiGraph,h.anchor.route)}));
const metadata={format:'ProofAtlasCorpusFrontierFigure/1',nativeEvidenceSha256:sha(bytes),case:item.case.id,source:p.source,computed:{namespace:'source-frontier-function',caseSha256:item.output.sha256,roots:opened.roots},ports,binderWitness:w,ai:{source:ai.source,case:aiItem.case.id,ports:aiPorts},scope:'Notation schematic; arrows have no metric. Source correspondence, computed input flow and kernel type conversion are distinct.'};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const text=(x,y,s,cls='label')=>`<text x="${x}" y="${y}" class="${cls}">${esc(s)}</text>`,rect=(x,y,w,h,cls='node')=>`<rect x="${x}" y="${y}" width="${w}" height="${h}" class="${cls}"/>`;
let body='';
for(const [i,port]of ports.entries()){const y=155+i*68;body+=rect(40,y,270,54)+`<a href="${esc(port.url)}" aria-label="Open original source for Riccati call ${port.call}">`+text(56,y+23,'Call '+port.call+' · e'+port.source.node,'portal')+text(56,y+43,port.context+' · '+port.frames+' frames · original source','small portal')+'</a>';
 body+=`<path d="M310 ${y+27} H380" class="correspondence"/>`+rect(380,y,270,54)+text(397,y+24,port.alias+' : A'+port.call,'term')+text(397,y+44,'apply to '+port.arguments+' original arguments','small')+`<path d="M650 ${y+27} H722" class="flow"/>`;}
const nativeBinder=data.case.graph.payloads[w.computedObservation.target.node].binderName||'binder',sourceBinder=g.payloads[w.sourceObservation.target.node].binderName||'binder';
let svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="950" viewBox="0 0 1200 950" role="group" aria-labelledby="title" aria-describedby="desc">
<title id="title">Typed fragments in the Riccati proof</title><desc id="desc">Six exact source occurrences correspond to six typed parameters of a checked function returning the original Riccati theorem. The original closures recover the source proof. The lower cards show one stored bound-variable node with different source and computed binding targets. Source portals open exact original occurrences.</desc>
<metadata>${esc(JSON.stringify(metadata))}</metadata>
<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="none" stroke="#294a75"/></marker></defs>
<style>text{font-family:Georgia,serif;fill:#171a1e}.title{font-size:29px}.heading{font-size:23px}.label{font-family:Arial,sans-serif;font-size:18px}.term{font-family:monospace;font-size:19px}.small{font-size:16px;fill:#414650}.caption{font-size:18px;fill:#414650}.portal{fill:#294a75;text-decoration:underline}.node{fill:#f6f7f8;stroke:#89909b}.panel{fill:#fff;stroke:#c5cad0}.flow{fill:none;stroke:#294a75;stroke-width:1.7}.arrow{marker-end:url(#arrow)}.correspondence{fill:none;stroke:#6c747f;stroke-dasharray:5 5}.rule{stroke:#c5cad0}a:focus rect{stroke:#294a75;stroke-width:3}</style>
<rect width="1200" height="950" fill="#fff"/>
${text(40,42,'Typed fragments in the Riccati proof','title')}
${text(40,74,'JacobiData.slope_bound_abs · closed proof root · six selected source occurrences','caption')}
${text(40,125,'Original source positions','heading')}${text(380,125,'Typed parameters','heading')}${text(788,260,'Complete proof','heading')}
${body}
<path d="M722 182 V522 M722 352 H780" class="flow arrow"/>
${rect(780,280,380,133)}${text(800,316,'F(H76, H77, H78,','term')}${text(800,345,'  H37, H44, H75)','term')}${text(800,377,'Other original fields are retained.','small')}
<path d="M970 413 V470" class="flow arrow"/>${rect(800,470,340,70)}${text(819,501,'Proof of T_Riccati','term')}${text(819,524,'checked at the declared Lean type','small')}
${text(40,593,'C1, C2, … identify exact source contexts; equal depth does not merge them.','caption')}
${text(40,624,'A# is the recorded parameter domain; its original let definitions remain in the closure.','caption')}
${text(40,655,'Dotted: source correspondence. Solid: computed input flow. T_Riccati is the original statement.','caption')}
<path d="M40 680 H1160" class="rule"/>
${text(40,716,'A shared row keeps separate binding addresses','heading')}
${rect(40,740,540,93,'panel')}${text(57,769,'Original inferred type · source context','label')}${text(57,798,'e'+w.sharedNode+' = bvar '+w.index+' → '+sourceBinder+' at original binder','term')}
${rect(620,740,540,93,'panel')}${text(637,769,'Computed function · local type context','label')}${text(637,798,'e'+w.sharedNode+' = bvar '+w.index+' → '+nativeBinder+' at computed binder','term')}
${text(40,861,'19 checked functions · 27 parameter appearances · 17 distinct source positions','caption')}
${text(40,891,'AI source: 31,752,787 body occurrences; the largest joint table has 91,650 stored rows.','caption')}
${text(40,926,'AI four-fragment source portals:','caption')}
${aiPorts.map((q,i)=>`<a href="${esc(q.url)}" aria-label="Open original source for AI call ${q.call}">${text(330+i*100,926,'Call '+q.call,'portal label')}</a>`).join('')}
</svg>\n`;
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(base+'corpus-frontiers.svg','utf8'),svg);else{fs.writeFileSync(base+'corpus-frontiers.svg',svg);fs.writeFileSync(base+'figure-data.json.gz',z.gzipSync(Buffer.from(JSON.stringify(metadata,null,2)+'\n')));}
console.log(JSON.stringify({status:'PASS',sourcePortals:ports.length+aiPorts.length,svgSha256:sha(Buffer.from(svg))}));
