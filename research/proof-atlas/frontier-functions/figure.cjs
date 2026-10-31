'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),assert=require('assert/strict'),crypto=require('crypto');process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/frontier-functions/',raw=z.gunzipSync(fs.readFileSync(base+'native-check.json.gz')),native=JSON.parse(raw),sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function find(id){const p=native.profiles.find(p=>p.output.cases.some(c=>c.id===id)),c=p.output.cases.find(c=>c.id===id);assert.equal(c.status,'PASS');return{p,c};}
const dependent=find('dependent:dependent-types'),nested=find('nested:under-lambda');assert(dependent.c.typeText.includes('P input0'));assert.equal(nested.c.typeText,'(Nat → Nat) → Nat → Nat');
const g=dependent.c.graph;let body=g.roots[0];for(let i=0;i<2;i++){assert.equal(g.kind[body],6);body=g.children[body][1];}const args=[];while(g.kind[body]===5){args.unshift(g.children[body][1]);body=g.children[body][0];}assert.equal(g.payloads[body].name,'Sigma.mk');assert.equal(g.payloads[args.at(-2)].index,1);assert.equal(g.payloads[args.at(-1)].index,0);
const metadata={format:'ProofAtlasFrontierFigure/1',nativeEvidenceSha256:sha(raw),cases:[dependent,nested].map(({p,c})=>({source:p.source,case:c.id,holes:c.holes.map(h=>h.source),computed:{namespace:c.namespace,roots:c.graph.roots}})),relation:'Computed value flow and literal parameter-type references; not original proof-use edges',kernelRejectedCases:native.profiles.flatMap(p=>p.output.cases).filter(c=>c.status==='KERNEL_REJECTED').map(c=>c.id)};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&apos;'}[c]));
const svg=`<svg xmlns="http://www.w3.org/2000/svg" width="1200" height="790" viewBox="0 0 1200 790" role="img" aria-labelledby="title desc">
<title id="title">Typed source frontiers</title><desc id="desc">Two kernel-checked authored examples. A dependent input type refers to an earlier parameter. A fragment beneath a lambda becomes a function input. Fixed original dependent types, reversed order and a fixed ambient let are rejected. Original source positions remain distinct from computed parameter positions.</desc>
<metadata>${esc(JSON.stringify(metadata))}</metadata>
<defs><marker id="arrow" markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto"><path d="M0 0 L8 4 L0 8" fill="none" stroke="#294a75"/></marker></defs>
<style>text{font-family:Georgia,serif;fill:#171a1e}.title{font-size:30px}.heading{font-size:23px}.label{font-family:Arial,sans-serif;font-size:17px}.term{font-family:monospace;font-size:18px}.caption{font-size:18px;fill:#414650}.panel{fill:#fff;stroke:#c5cad0}.node{fill:#f5f6f8;stroke:#767f8c}.wire{fill:none;stroke:#294a75;stroke-width:2;marker-end:url(#arrow)}.type{stroke-dasharray:6 5}.rule{stroke:#c5cad0}</style>
<rect width="1200" height="790" fill="#fff"/>
<text x="40" y="46" class="title">Typed source frontiers</text>
<text x="40" y="78" class="caption">New parameters have an ordered telescope; the original source context Γ stays fixed.</text>
<rect x="40" y="105" width="540" height="485" class="panel"/>
<text x="64" y="143" class="heading">Dependent input types · accepted</text>
<rect x="70" y="208" width="210" height="60" class="node"/><text x="90" y="244" class="term">input0 : Nat</text>
<rect x="320" y="208" width="232" height="60" class="node"/><text x="336" y="244" class="term">input1 : P input0</text>
<path d="M175 208 C175 177 434 177 434 208" class="wire type"/>
<text x="179" y="172" class="label">reference in the type</text>
<path d="M175 268 L240 335" class="wire"/><path d="M435 268 L380 335" class="wire"/>
<rect x="90" y="335" width="440" height="65" class="node"/><text x="107" y="374" class="term">@Sigma.mk Nat P input0 input1</text>
<path d="M310 400 V443" class="wire"/><text x="238" y="474" class="term">Σ n : Nat, P n</text>
<text x="64" y="524" class="caption">Recorded function type:</text><text x="64" y="555" class="term">${esc(dependent.c.typeText)}</text>
<rect x="620" y="105" width="540" height="485" class="panel"/>
<text x="644" y="143" class="heading">A fragment beneath a lambda</text>
<rect x="700" y="195" width="375" height="60" class="node"/><text x="723" y="232" class="term">input0 : Nat → Nat</text>
<path d="M887 255 V309" class="wire"/>
<rect x="673" y="309" width="434" height="145" class="panel"/><text x="693" y="342" class="label">λ n : Nat</text>
<rect x="700" y="365" width="380" height="60" class="node"/><text x="719" y="402" class="term">Nat.succ (input0 n)</text>
<text x="644" y="493" class="caption">The local n is supplied at the original scope.</text>
<text x="644" y="524" class="caption">Recorded function type:</text><text x="644" y="555" class="term">${esc(nested.c.typeText)}</text>
<path d="M40 620 H1160" class="rule"/>
<text x="40" y="654" class="heading">The checked boundary is conditional</text>
<text x="40" y="688" class="caption">Three rejected candidates: fixed original input types, reversed parameter order, and a fixed ambient-let alias.</text>
<text x="40" y="725" class="caption">Solid arrows: value flow in the computed term. Dashed arrow: a reference in a computed parameter type.</text>
<text x="40" y="759" class="caption">Authored controls: 8 accepted functions, 3 kernel rejections. Source recovery and ordered provenance are checked separately.</text>
</svg>\n`;
if(process.argv.includes('--check'))assert.equal(fs.readFileSync(base+'frontier-functions.svg','utf8'),svg);else fs.writeFileSync(base+'frontier-functions.svg',svg);
console.log(JSON.stringify({status:'PASS',cases:metadata.cases.map(c=>c.case),nativeEvidenceSha256:metadata.nativeEvidenceSha256,svgSha256:sha(Buffer.from(svg))}));
