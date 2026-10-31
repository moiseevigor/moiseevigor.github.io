/* Independent reconstruction against immutable DAGs. No JavaScript typing. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),vm=require('vm'),crypto=require('crypto'),assert=require('assert/strict');
const A=require('../../../public/js/proof-atlas-library-data'),T=require('../../../public/js/proof-atlas-type-notation'),M=require('../region-context-projection/model.cjs');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/type-notation/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=f=>JSON.parse(z.gunzipSync(fs.readFileSync(f))),registry=f=>{const w={};vm.runInNewContext(fs.readFileSync(f,'utf8'),{window:w});return JSON.parse(JSON.stringify(Object.values(w)[0]));},catalog=registry('public/data/proof-atlas/type-notation-catalog.js'),native=read(base+'native.json.gz'),extraNative=read(base+'extra-native.json.gz'),verification=read(base+'verification.json.gz');
const report={format:'ProofAtlasNotationModel/1',status:'PASS',packets:0,cuts:0,objects:0,notations:0,references:0,frontiers:0,metadataFrames:0,hiddenArguments:0,maxObjects:0,maxBytes:0,controls:[]};
const dependencies=['public/js/proof-atlas-type-notation.js','public/js/proof-atlas-library-data.js','research/proof-atlas/region-context-projection/model.cjs','public/data/proof-atlas/type-notation-catalog.js',base+'check.cjs',base+'catalog.cjs',base+'native.json.gz',base+'verification.json.gz',base+'catalog.json.gz',base+'extra-native.json.gz',base+'extra-verification.json.gz','research/proof-atlas/region-native-types/packets.json.gz','research/proof-atlas/projection-substitution/native.json.gz'];
const inputFiles=Object.entries(read('research/proof-atlas/region-native-types/packets.json.gz').files).filter(([f])=>f.startsWith('public/data/proof-atlas/region-native-types/'));assert.equal(inputFiles.length,150);for(const[f,h]of inputFiles)assert.equal(sha(fs.readFileSync(f)),h);
const initial=Object.fromEntries([...dependencies,...inputFiles.map(([f])=>f)].map(f=>[f,sha(fs.readFileSync(f))]));
function canonical(g){const rows=[],keys=new Map(),ids=[];function add(kind,p,children){const key=JSON.stringify([kind,A.payloadKey(kind,p),children]);if(!keys.has(key)){keys.set(key,rows.length);rows.push(key);}return keys.get(key);}for(let i=0;i<g.kind.length;i++){assert(g.children[i].every(c=>c<i));ids.push(add(g.kind[i],g.payloads[i],g.children[i].map(c=>ids[c])));}return{ids,add};}
function audit(g,root,view,{start=[],ambient=[],address=(node,slots)=>({namespace:'notation-model',node,slots}),budget=48}={}){
 const canon=canonical(g);let visited=0;
 function visit(node){
  const at=M.walk(g,root,node.slots);assert.equal(node.expanded,g.expanded[at.node]);assert.deepEqual(node.origin,address(at.node,node.slots));visited++;report.objects++;
  if(node.kind==='frontier'){assert.equal(node.retained,'0');assert.equal(node.hidden,node.expanded);assert.equal(node.nodes,1);report.frontiers++;return canon.ids[at.node];}
  const children=node.children.map(c=>({field:c.field,slot:c.slot,node:c.value,rebuilt:visit(c.value)}));let recovered,retained=1n,hidden=0n;
  if(node.residual){
   let cursor=at.node,slots=node.slots;const frames=[],args=[];
   while(g.kind[cursor]===5||g.kind[cursor]===10){const k=g.kind[cursor];frames.push({kind:k===5?'argument':'metadata',node:cursor,slots:slots.slice()});if(k===5)args.unshift({node:g.children[cursor][1],slots:[...slots,1]});cursor=g.children[cursor][0];slots=[...slots,0];}
   assert.equal(node.residual.head.node,cursor);assert.deepEqual(node.residual.head.origin,address(cursor,slots));assert.equal(A.payloadKey(g.kind[cursor],node.head.payload),A.payloadKey(g.kind[cursor],g.payloads[cursor]));
   assert.equal(node.residual.frames.length,frames.length);
   frames.forEach((frame,i)=>{const actual=node.residual.frames[i];assert.equal(actual.kind,frame.kind);assert.equal(actual.node,frame.node);assert.deepEqual(actual.slots,frame.slots);assert.deepEqual(actual.origin,address(frame.node,frame.slots));if(frame.kind==='metadata'){assert.deepEqual(actual.payload,g.payloads[frame.node]);report.metadataFrames++;}else{assert.equal(actual.argument,g.children[frame.node][1]);assert.deepEqual(actual.argumentSlots,[...frame.slots,1]);}});
   const headChild=children.find(c=>c.field==='head');recovered=headChild?headChild.rebuilt:canon.ids[cursor];retained=BigInt(frames.length)+(headChild?0n:1n);
   const ports=[...(node.hiddenPorts||[]),...(node.foldedPorts||[])];const visible=children.filter(c=>c.slot!==undefined);assert.deepEqual([...ports.map(p=>p.slot),...visible.map(c=>c.slot)].sort((a,b)=>a-b),args.map((_,i)=>i));
   for(const port of ports){assert.equal(port.node,args[port.slot].node);assert.deepEqual(port.slots,args[port.slot].slots);assert.deepEqual(port.origin,address(port.node,port.slots));assert.equal(port.expanded,g.expanded[port.node]);}
   for(const child of visible){assert.deepEqual(child.node.slots,args[child.slot].slots);}
   if(node.signature){
    const sig=catalog.entries.find(e=>e.signatureSha256===node.signature.sha256);assert(sig);assert.equal(g.kind[cursor],4);assert.deepEqual(g.payloads[cursor].nameParts,sig.nameParts);assert.equal(g.payloads[cursor].name,sig.name);assert.equal(g.payloads[cursor].levels.length,sig.levelParams.length);assert.equal(args.length,sig.arity);
    const displayed=[...visible.map(c=>c.slot),...node.foldedPorts.map(p=>p.slot)].sort((a,b)=>a-b);assert.deepEqual(displayed,sig.visibleSlots);for(const port of node.hiddenPorts)assert.notEqual(sig.binders[port.slot].binderInfo,'default');
    if(sig.form==='numeral'){assert.equal(node.foldedPorts.length,1);const literal=g.payloads[node.foldedPorts[0].node];assert.equal(literal.literalKind,'natVal');assert.equal(node.label,literal.value.slice(0,96));}else assert.equal(node.label,sig.glyph);
    report.notations++;
   }else{assert.equal(node.hiddenPorts.length,0);assert.equal(node.foldedPorts.length,0);}
   for(const port of node.hiddenPorts){hidden+=BigInt(port.expanded);report.hiddenArguments++;}for(const port of node.foldedPorts)retained+=BigInt(port.expanded);
   let arg=0;for(const frame of [...frames].reverse()){
    if(frame.kind==='metadata')recovered=canon.add(10,g.payloads[frame.node],[recovered]);else{const child=visible.find(c=>c.slot===arg),value=child?child.rebuilt:canon.ids[args[arg].node];recovered=canon.add(5,g.payloads[frame.node],[recovered,value]);arg++;}
   }
  }else{
   assert.equal(children.length,g.children[at.node].length);children.forEach((c,s)=>{assert.equal(c.field,A.fields[A.kinds[g.kind[at.node]]][s]);assert.deepEqual(c.node.slots,[...node.slots,s]);});
   recovered=canon.add(g.kind[at.node],g.payloads[at.node],children.map(c=>c.rebuilt));
   if(g.kind[at.node]===0){const index=g.payloads[at.node].index,local=at.scope.at(-1-index);const target=local?address(local.node,local.path):ambient[ambient.length-1-(index-at.scope.length)]?.address;assert(target,'reference must resolve');assert.deepEqual(node.head.target.address||node.head.target.origin,target);report.references++;}
  }
  for(const child of children){retained+=BigInt(child.node.retained);hidden+=BigInt(child.node.hidden);}
  assert.equal(recovered,canon.ids[at.node]);assert.equal(String(retained),node.retained);assert.equal(String(hidden),node.hidden);assert.equal(retained+hidden,BigInt(node.expanded));assert.equal(node.nodes,1+children.reduce((n,c)=>n+c.node.nodes,0));return recovered;
 }
 assert.deepEqual(view.root.slots,start);visit(view.root);assert.equal(visited,view.stats.nodes);assert(visited<=budget);assert.equal(BigInt(view.stats.retained)+BigInt(view.stats.hidden),BigInt(view.stats.represented));assert(view.stats.metadataBytes<=T.limits.metadataBytes);report.maxObjects=Math.max(report.maxObjects,visited);report.maxBytes=Math.max(report.maxBytes,view.stats.metadataBytes);report.cuts++;
}
function text(node){const c=node.children.map(c=>text(c.value));if(node.kind==='notation'&&node.form==='binary')return '('+c[0]+node.label+c[1]+')';if(node.kind==='notation'&&node.form==='prefix')return node.label+'('+c[0]+')';if(node.kind==='annotated')return c.join('');if(node.kind==='binder')return node.form+' '+node.label+':'+c.join(',');return node.label+(c.length?'('+c.join(',')+')':'');}
assert.equal(verification.status,'PASS');assert.equal(verification.nativeSha256,sha(z.gunzipSync(fs.readFileSync(base+'native.json.gz'))));for(const[f,h]of Object.entries(verification.producerFiles))assert.equal(sha(fs.readFileSync(f)),h,f);
for(const entry of catalog.entries){const sig=[...native.signatures,...extraNative.signatures].find(s=>s.name===entry.name);assert(sig);assert.equal(entry.signatureSha256,sha(Buffer.from(JSON.stringify([sig.nameParts,sig.levelParams,sig.graph]))));let node=sig.graph.roots[0];for(const binder of sig.binders){assert.equal(sig.graph.kind[node],7);assert.equal(sig.graph.payloads[node].binderInfo,binder.binderInfo);assert.deepEqual(sig.graph.payloads[node].binderNameParts,binder.nameParts);node=sig.graph.children[node][1];}assert.deepEqual(entry.visibleSlots,sig.binders.flatMap((b,i)=>b.binderInfo==='default'?[i]:[]));}
assert.deepEqual(native.signatures.find(s=>s.name==='And').graph,native.signatures.find(s=>s.name==='Or').graph);assert.notEqual(catalog.entries.find(s=>s.name==='And').signatureSha256,catalog.entries.find(s=>s.name==='Or').signatureSha256);report.controls.push({name:'equal-types-different-heads',heads:['And','Or'],typeGraphsEqual:true});
for(const file of fs.readdirSync('public/data/proof-atlas/region-native-types').sort()){
 const p=read('public/data/proof-atlas/region-native-types/'+file),g=p.types;
 for(let typeRoot=0;typeRoot<2;typeRoot++){
  const root=g.roots[typeRoot],ambient=(typeRoot===0?p.frames:p.query.keptSlots.map(s=>p.frames[s])).map(f=>({name:f.name,address:f.address})),todo=[[]],seen=new Set(),address=(node,slots)=>({namespace:'notation-type-test',recordSha256:p.evidence.recordSha256,typeRoot,node,slots});
  for(let i=0;i<todo.length;i++){
   const slots=todo[i],at=M.walk(g,root,slots),key=at.node+':'+at.scope.map(s=>s.node).join(',');if(seen.has(key))continue;seen.add(key);
   const context=[...ambient,...at.scope.map(s=>({name:g.payloads[s.node].binderName||g.payloads[s.node].declName||'_',address:address(s.node,s.path)}))],view=T.scene(g,at.node,catalog,{slots,context,address});audit(g,root,view,{start:slots,ambient,address});g.children[at.node].forEach((_,s)=>todo.push([...slots,s]));
  }
 }report.packets++;
}
report.nativeCuts=report.cuts;report.nativeObjects=report.objects;report.nativeNotations=report.notations;
// Native value collision: same rendered operands/glyph; different retained instance.
const controlAddress=c=>(node,slots)=>({namespace:'notation-native-control',nativeSha256:verification.nativeSha256,control:c.name,node,slots});const controls=native.controls.map(c=>T.scene(c.graph,c.graph.roots[0],catalog,{address:controlAddress(c)}));controls.forEach((v,i)=>audit(native.controls[i].graph,native.controls[i].graph.roots[0],v,{address:controlAddress(native.controls[i])}));assert.equal(text(controls[0].root),text(controls[1].root));assert.equal(text(controls[0].root),'(7+2)');assert.notDeepEqual(controls[0].root.hiddenPorts.find(p=>p.slot===3),controls[1].root.hiddenPorts.find(p=>p.slot===3));assert.notDeepEqual(controls[0].root.residual,controls[1].root.residual);
const values=native.controls.map(c=>c.graph.payloads[c.graph.roots[2]].value);assert.deepEqual(values,['9','5']);report.controls.push({name:'typed-instance-collision',display:text(controls[0].root),results:values});
assert.deepEqual(native.controls.map((c,i)=>c.graph.payloads[controls[i].root.hiddenPorts.find(p=>p.slot===3).node].name),['AtlasNotation.addInstance','AtlasNotation.subtractInstance']);
// Literal name identity, universe arity, partial and extra applications decline notation.
for(const mode of['name','universes','partial','extra']){
 const g=JSON.parse(JSON.stringify(native.controls[0].graph));let root=g.roots[0],head=root;while(g.kind[head]===5)head=g.children[head][0];
 if(mode==='name')g.payloads[head].nameParts=[{str:'HAdd.hAdd'}];if(mode==='universes')g.payloads[head].levels=[];if(mode==='partial')root=g.children[root][0];
 if(mode==='extra'){const id=g.kind.length;g.kind.push(5);g.children.push([root,root]);g.payloads.push({});g.expanded.push(String(1n+2n*BigInt(g.expanded[root])));g.neededScope.push(0);root=id;}
 const s=T.scene(g,root,catalog,{address:controlAddress(native.controls[0])});assert.notEqual(s.root.kind,'notation');assert.equal(s.root.hiddenPorts.length,0);report.controls.push({name:mode,notationDeclined:true});
}
const structural=native.structural.graph,metadata=T.scene(structural,structural.roots[0],catalog,{address:(node,slots)=>({namespace:'notation-model',node,slots}),context:[{name:'a',address:{namespace:'notation-context-control',context:0}},{name:'b',address:{namespace:'notation-context-control',context:1}}]});audit(structural,structural.roots[0],metadata,{ambient:[{address:{namespace:'notation-context-control',context:0}},{address:{namespace:'notation-context-control',context:1}}]});report.controls.push({name:'interspersed-metadata',typingClaim:false});
// A 364-row structural DAG has over 2^60 expanded occurrences. It is not a
// native proof or an AI benchmark; the scene remains bounded at 48 objects.
const g={serialization:'ExprDAG/1',kind:[],payloads:[],children:[],expanded:[],neededScope:[],roots:[]};function add(k,p,cs){const id=g.kind.length;g.kind.push(k);g.payloads.push(p);g.children.push(cs);g.expanded.push(String(1n+cs.reduce((n,c)=>n+BigInt(g.expanded[c]),0n)));g.neededScope.push(0);return id;}
const nat=add(4,{name:'Nat',nameParts:[{str:'Nat'}],levels:[]},[]),head=add(4,{name:'HAdd.hAdd',nameParts:[{str:'HAdd'},{str:'hAdd'}],levels:[{kind:'zero'},{kind:'zero'},{kind:'zero'}]},[]),instance=add(4,{name:'instance',nameParts:[{str:'instance'}],levels:[]},[]);let root=add(9,{literalKind:'natVal',value:'1',repr:'Lean.Literal.natVal 1'},[]);
for(let i=0;i<60;i++){let term=head;for(const arg of[nat,nat,nat,instance,root,root])term=add(5,{},[term,arg]);root=term;}g.roots=[root];const stressAddress=(node,slots)=>({namespace:'notation-model',node,slots});const huge=T.scene(g,root,catalog,{address:stressAddress});audit(g,root,huge);assert(BigInt(g.expanded[root])>2n**60n);assert(huge.stats.nodes<=48);report.controls.push({name:'shared-60',rows:g.kind.length,expanded:g.expanded[root],objects:huge.stats.nodes,typingClaim:false});
for(const budget of[1,2,3,7,16,48]){const s=T.scene(g,root,catalog,{budget,address:stressAddress});audit(g,root,s,{budget});}assert.throws(()=>T.scene(g,root,catalog,{budget:49,address:stressAddress}));assert.throws(()=>T.scene(g,root,catalog),/qualified address/);
// Reuse the frozen native-authored raw Expr fixture, separately from typed
// corpus queries. All twelve constructors retain generic, recoverable syntax.
const fixture=read('research/proof-atlas/projection-substitution/native.json.gz').graph,constructors=[];
for(let kind=0;kind<12;kind++){
 const root=fixture.kind.indexOf(kind);assert(root>=0);const address=(node,slots)=>({namespace:'notation-constructor-control',kind,node,slots}),context=Array.from({length:fixture.neededScope[root]},(_,i)=>({name:'v'+i,address:{namespace:'notation-context-control',kind,slot:i}})),s=T.scene(fixture,root,catalog,{context,address});audit(fixture,root,s,{ambient:context,address});constructors.push(A.kinds[kind]);
}report.controls.push({name:'all-constructors',constructors,typingClaim:false});
report.files=Object.fromEntries(Object.keys(initial).map(f=>[f,sha(fs.readFileSync(f))]));assert.deepEqual(report.files,initial,'Inputs or executed sources changed during checks');
const raw=Buffer.from(JSON.stringify(report,null,2)+'\n');if(process.argv.includes('--check'))assert(z.gunzipSync(fs.readFileSync(base+'model.json.gz')).equals(raw));else fs.writeFileSync(base+'model.json.gz',z.gzipSync(raw,{mtime:0}));console.log(JSON.stringify({...report,files:undefined}));
