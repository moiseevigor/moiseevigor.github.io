'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict'),cp=require('child_process');
const A=require('../../../public/js/proof-atlas-library-data'),{table}=require('../method-context/catalogue.cjs');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/source-template-laws/',parent='research/proof-atlas/source-template-inputs/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=f=>JSON.parse(z.gunzipSync(fs.readFileSync(f)));
const binds=(k,s)=>((k===6||k===7)&&s===1)||(k===8&&s===2),clone=x=>JSON.parse(JSON.stringify(x));
function make(plan,bindings,prefixLength,owner){
 const t=table(),g=t.g,add=(k,p,c=[])=>{assert(g.kind.length<8192);return t.add(k,p,c);};
 const prefix=Array.from({length:prefixLength},(_,i)=>add(1,{id:'Lean.Name.mkNum `__atlas_source '+i,idNameParts:[{str:'__atlas_source'},{num:String(i)}]}));
 const keys=bindings.map(b=>b.key);assert.equal(new Set(keys).size,keys.length);
 const symbols=new Map(keys.map((key,i)=>[key,add(1,{id:'Lean.Name.mkNum Lean.Name.anonymous '+i,idNameParts:[{num:String(i)}]})]));
 const context=[...prefix,...plan.contextBindingKeys.map(key=>{assert(symbols.has(key));return symbols.get(key);})];
 function opened(packet,root,scope){const memo=new Map();function visit(node,depth=0){const key=node+':'+depth;if(memo.has(key))return memo.get(key);const k=packet.kind[node],p=packet.payloads[node];assert(k!==1||owner.kind==='authored-constructor-control','Native graphs must have abstracted their free variables');let out;
  if(k===0&&p.index>=depth){const slot=scope.length-1-(p.index-depth);assert(slot>=0&&slot<scope.length,'Unbound native observation');out=scope[slot];}
  else out=add(k,p,packet.children[node].map((c,s)=>visit(c,depth+Number(binds(k,s)))));memo.set(key,out);return out;}return visit(root);}
 const original=opened(plan.graph,plan.graph.roots[0],prefix),observed=opened(plan.graph,plan.graph.roots[1],context),groups=plan.groups.map((group,index)=>{
  const source=opened(plan.graph,plan.graph.roots[group.sourceRoot],prefix),target=opened(plan.graph,plan.graph.roots[group.targetRoot],context);assert.equal(g.neededScope[source],0);assert.equal(target,symbols.get(group.targets[0]));
  for(const key of group.targets){const b=bindings.find(b=>b.key===key);assert(b);assert.equal(opened(b.graph,b.graph.roots.at(-1),prefix),source,'Original capture image');}
  return{index,source,target,targets:group.targets,chosen:group.targets[0]};
 });
 const lookup=new Map(groups.map(group=>[group.source,group]));assert.equal(lookup.size,groups.length);
 const records=[],memo=new Map(),used=new Set();
 function visit(node){if(memo.has(node))return memo.get(node).node;const group=lookup.get(node);let output,children=[];
  if(group){output=group.target;used.add(group.index);}else{const values=g.children[node].map(c=>visit(c));children=g.children[node].map(c=>memo.get(c).record);output=add(g.kind[node],g.payloads[node],values);}
  const record=records.length;records.push({source:node,output,rule:group?'capture':'frame',...(group?{group:group.index}:{children})});memo.set(node,{node:output,record});return output;}
 const rebuilt=visit(original);assert.equal(rebuilt,observed,'Complete recorded template');if(owner.kind!=='authored-constructor-control')assert.equal(memo.size,plan.storedStates);assert.deepEqual([...used],plan.usedGroups);
 const selected=groups.filter(group=>used.has(group.index));assert.equal(new Set(selected.map(group=>group.target)).size,selected.length);
 const images=new Map(selected.map(group=>[group.target,group.source])),recovery=new Map();
 function plug(node){if(images.has(node))return images.get(node);if(recovery.has(node))return recovery.get(node);const out=add(g.kind[node],g.payloads[node],g.children[node].map(plug));recovery.set(node,out);return out;}
 assert.equal(plug(rebuilt),original);const rawMemo=new Map();function raw(node){if(rawMemo.has(node))return rawMemo.get(node);const out=add(plan.graph.kind[node],plan.graph.payloads[node],plan.graph.children[node].map(raw));rawMemo.set(node,out);return out;}const rawSource=raw(plan.graph.roots[0]),rawTemplate=raw(plan.graph.roots[1]);g.serialization='ExprDAG/1';g.roots=[original,rebuilt,rawSource,rawTemplate];
 const weights=new Map();function weighted(node){if(weights.has(node))return weights.get(node);const count=images.has(node)?BigInt(g.expanded[images.get(node)]):1n+g.children[node].reduce((n,c)=>n+weighted(c),0n);weights.set(node,count);return count;}
 const reached=new Set();function reachable(node){if(reached.has(node))return;reached.add(node);g.children[node].forEach(reachable);}reachable(rebuilt);assert.equal(weighted(rebuilt).toString(),g.expanded[original]);
 return{owner,opening:{rawSource,rawTemplate,sourceContext:prefix,templateContext:context},contextKeys:plan.contextBindingKeys,prefixLength,graph:g,groups,selectedGroups:plan.usedGroups,records,rootRecord:memo.get(original).record,
  counts:{storedRows:g.kind.length,certificateRows:records.length,templateDAGRows:reached.size,source:g.expanded[original],template:g.expanded[rebuilt],weighted:weighted(rebuilt).toString()},bindingKey:plan.bindingKey};
}
function vocabulary(){
 const fixtureFile='research/proof-atlas/projection-substitution/native.json.gz',fixture=read(fixtureFile).graph,t=table(),g=t.g;
 const add=(k,p,c=[])=>t.add(k,p,c),payload=k=>clone(fixture.payloads[fixture.kind.indexOf(k)]);
 const bvar=add(0,{index:0}),free=add(1,payload(1)),meta=add(2,payload(2)),sort=add(3,payload(3)),nat=add(4,payload(4));
 const cap=add(9,{literalKind:'natVal',value:'17',repr:'Lean.Literal.natVal 17'}),text=add(9,{literalKind:'strVal',value:'control',repr:'Lean.Literal.strVal "control"'});
 const app=(f,a)=>add(5,{},[f,a]);let spine=free;for(const x of[meta,sort,nat,cap,text,bvar])spine=app(spine,x);
 const lambda=add(6,payload(6),[nat,spine]),forall=add(7,payload(7),[nat,app(lambda,bvar)]),local=add(8,{...payload(8),nondep:true},[nat,cap,app(forall,bvar)]);
 const md=add(10,payload(10),[local]),projection=add(11,payload(11),[md]),source=app(projection,spine),memo=new Map();
 function rebuild(node,depth=0){const key=node+':'+depth;if(memo.has(key))return memo.get(key);let out;if(node===cap)out=add(0,{index:depth});else if(g.kind[node]===0&&g.payloads[node].index>=depth)out=add(0,{index:g.payloads[node].index+1});else out=add(g.kind[node],g.payloads[node],g.children[node].map((c,s)=>rebuild(c,depth+Number(binds(g.kind[node],s)))));memo.set(key,out);return out;}
 const template=rebuild(source),target=add(0,{index:0});g.roots=[source,template,cap,target];g.serialization='ExprDAG/1';
 const key='authored-vocabulary-capture',bindings=[{key,graph:{...g,roots:[cap]}}],plan={bindingKey:key,contextBindingKeys:[key],graph:g,groups:[{sourceRoot:2,targetRoot:3,targets:[key]}],usedGroups:[0]};
 return make(plan,bindings,1,{kind:'authored-constructor-control',name:'all-twelve-constructors',payloadFixtureSha256:sha(z.gunzipSync(fs.readFileSync(fixtureFile))),mathematicalTyping:false});
}
function collect(){
 cp.execFileSync(process.execPath,[parent+'check.cjs','--check'],{stdio:'pipe'});
 const native=read(parent+'native.json.gz'),controls=read(parent+'controls.json.gz'),instances=[];
 for(const profile of native.profiles)for(const c of profile.native.cases)for(const[index,plan]of c.templates.entries())instances.push(make(plan,c.bindings,profile.commonContext.length,
  {kind:'recorded-corpus-template',nativeInventorySha256:sha(z.gunzipSync(fs.readFileSync(parent+'native.json.gz'))),source:profile.source,nativeCaseSha256:sha(Buffer.from(JSON.stringify(c))),policy:c.policy,index,originalContext:profile.commonContext}));
 for(const row of controls.records)if(row.template)instances.push(make(row.template,row.bindings,0,
  {kind:'authored-native-control',controlsSha256:sha(z.gunzipSync(fs.readFileSync(parent+'controls.json.gz'))),name:row.name,recordSha256:sha(Buffer.from(JSON.stringify(row)))}));
 assert.equal(instances.length,7);instances.push(vocabulary());return{format:'ProofAtlasSourceRecoveryInstances/1',instances};
}
const quote=s=>JSON.stringify(s),name=parts=>parts.reduce((out,p)=>p.str!==undefined?'(Name.str '+out+' '+quote(p.str)+')':'(Name.num '+out+' '+p.num+')','Name.anonymous');
function level(l){switch(l.kind){case'zero':return'Level.zero';case'succ':return'(Level.succ '+level(l.of)+')';case'param':return'(Level.param '+name(l.nameParts)+')';case'mvar':return'(Level.mvar ⟨'+name(l.idNameParts)+'⟩)';case'max':case'imax':return'(Level.'+l.kind+' '+level(l.left)+' '+level(l.right)+')';default:throw Error('Level payload '+l.kind);}}
function expression(g,i){const k=g.kind[i],p=g.payloads[i],c=g.children[i].map(i=>'e'+i),n=field=>name(p[field]);switch(k){
 case 0:return'Expr.bvar '+p.index;case 1:return'Expr.fvar ⟨'+n('idNameParts')+'⟩';case 2:return'Expr.mvar ⟨'+n('idNameParts')+'⟩';case 3:return'Expr.sort '+level(p.level);
 case 4:return'Expr.const '+n('nameParts')+' ['+p.levels.map(level).join(', ')+']';case 5:return'Expr.app '+c.join(' ');
 case 6:case 7:return'Expr.'+(k===6?'lam':'forallE')+' '+n('binderNameParts')+' '+c.join(' ')+' BinderInfo.'+p.binderInfo;
 case 8:return'Expr.letE '+n('declNameParts')+' '+c.join(' ')+' '+p.nondep;
 case 9:return'Expr.lit (Literal.'+p.literalKind+' '+(p.literalKind==='natVal'?p.value:quote(p.value))+')';
 case 10:{let md='KVMap.empty';for(const e of p.metadata){if(e.value.kind==='ofBool'){assert(/true|false/.test(e.value.repr));md='('+md+'.setBool '+name(e.keyNameParts)+' '+e.value.repr.split(' ').at(-1)+')';}else{assert.equal(e.value.kind,'ofString');assert(e.value.repr.startsWith('Lean.DataValue.ofString '));const value=JSON.parse(e.value.repr.slice('Lean.DataValue.ofString '.length));md='('+md+'.set '+name(e.keyNameParts)+' (DataValue.ofString '+quote(value)+'))';}}return'Expr.mdata '+md+' '+c[0];}
 case 11:return'Expr.proj '+n('typeNameParts')+' '+p.index+' '+c[0];default:throw Error('Expr kind');}}
function source(data){const serializer=fs.readFileSync('research/proof-atlas/ExportLibrary.lean','utf8').split('\ndef kind : ConstantInfo')[0].replace('import SE2Conjugate','')+'\nend AtlasLibrary\n';const lines=[serializer,fs.readFileSync(base+'Recovery.lean','utf8').replace('import Lean',''),'set_option maxRecDepth 8192','set_option linter.unusedVariables false','set_option maxHeartbeats 10000000','open Lean ProofAtlas.SourceRecovery'];
 for(const[index,instance]of data.instances.entries()){
  const g=instance.graph,selected=instance.selectedGroups.map(j=>instance.groups[j]);lines.push('namespace Instance'+index);
  for(let i=0;i<g.kind.length;i++)lines.push('def e'+i+' : Expr := '+expression(g,i));
  const replacements=selected.map(row=>({id:g.payloads[row.target].idNameParts,source:row.source}));
  lines.push('def sigma (id : FVarId) : Expr := '+replacements.map(row=>'if id.name == '+name(row.id)+' then e'+row.source+' else ').join('')+'Expr.fvar id');
  for(let i=0;i<g.kind.length;i++){
   const k=g.kind[i],p=g.payloads[i],c=g.children[i],need=g.neededScope[i],go=(node,depth='d')=>'scope'+node+' (d := '+depth+') (by omega)';let proof;
   if(k===0)proof='change '+p.index+' < d; omega';
   else if([5,6,7].includes(k))proof='change Scoped e'+c[0]+' d ∧ Scoped e'+c[1]+' '+(k===5?'d':'(d+1)')+'; exact ⟨'+go(c[0])+', '+go(c[1],k===5?'d':'d+1')+'⟩';
   else if(k===8)proof='change Scoped e'+c[0]+' d ∧ Scoped e'+c[1]+' d ∧ Scoped e'+c[2]+' (d+1); exact ⟨'+go(c[0])+', '+go(c[1])+', '+go(c[2],'d+1')+'⟩';
   else if(k===10||k===11)proof='change Scoped e'+c[0]+' d; exact '+go(c[0]);else proof='trivial';
   lines.push('theorem scope'+i+' {d : Nat} (h : '+need+' ≤ d) : Scoped e'+i+' d := by '+proof);
  }
  lines.push('theorem closed_images : ClosedImages sigma := by','  intro id','  unfold sigma');
  function branches(i,indent){if(i===selected.length){lines.push(indent+'trivial');return;}lines.push(indent+'split',indent+'· exact scope'+selected[i].source+' (d := 0) (Nat.le_refl 0)',indent+'·');branches(i+1,indent+'  ');}
  branches(0,'  ');
  for(const [i,r]of instance.records.entries()){
   const k=g.kind[r.source],p=g.payloads[r.source],cs=(r.children||[]).map(j=>'rw'+j),n=f=>name(p[f]);let proof;
   if(r.rule==='capture'){const row=instance.groups[r.group];proof='Rewrite.capture e'+r.source+' ⟨'+name(g.payloads[row.target].idNameParts)+'⟩ (by rfl) (scope'+r.source+' (Nat.le_refl 0))';}
   else switch(k){case 0:proof='Rewrite.bvar '+p.index;break;case 1:proof='Rewrite.fvar ⟨'+n('idNameParts')+'⟩ (by rfl)';break;case 2:proof='Rewrite.mvar ⟨'+n('idNameParts')+'⟩';break;case 3:proof='Rewrite.sort '+level(p.level);break;case 4:proof='Rewrite.const '+n('nameParts')+' ['+p.levels.map(level).join(', ')+']';break;case 5:proof='Rewrite.app '+cs.join(' ');break;case 6:case 7:proof='Rewrite.'+(k===6?'lam':'forallE')+' '+n('binderNameParts')+' BinderInfo.'+p.binderInfo+' '+cs.join(' ');break;case 8:proof='Rewrite.letE '+n('declNameParts')+' '+p.nondep+' '+cs.join(' ');break;case 9:proof='Rewrite.lit (Literal.'+p.literalKind+' '+(p.literalKind==='natVal'?p.value:quote(p.value))+')';break;case 10:proof='Rewrite.mdata '+expression(g,r.source).slice('Expr.mdata '.length).replace(/ e\d+$/,'')+' '+cs[0];break;case 11:proof='Rewrite.proj '+n('typeNameParts')+' '+p.index+' '+cs[0];break;default:throw Error('Certificate constructor');}
   lines.push('theorem rw'+i+' : Rewrite sigma e'+r.source+' e'+r.output+' := '+proof);
  }
  const[original,template,rawSource,rawTemplate]=g.roots;
  lines.push('theorem recovered : plug sigma e'+template+' = e'+original+' := recovery rw'+instance.rootRecord,
   'theorem recovered_count : weighted sigma e'+template+' = occurrences e'+original+' := recovery_count rw'+instance.rootRecord,
   'def sourceExpr : Expr := e'+original,'def templateExpr : Expr := e'+template,'def rawSource : Expr := e'+rawSource,'def rawTemplate : Expr := e'+rawTemplate,'def sourceContext : Array Expr := #['+instance.opening.sourceContext.map(n=>'e'+n).join(', ')+']','def templateContext : Array Expr := #['+instance.opening.templateContext.map(n=>'e'+n).join(', ')+']',
   'def variables : Array Expr := #['+selected.map(row=>'e'+row.target).join(', ')+']','def images : Array Expr := #['+selected.map(row=>'e'+row.source).join(', ')+']',
   'end Instance'+index);
 }
 lines.push(fs.readFileSync(base+'Native.lean','utf8'));
 lines.push('def main (args : List String) : IO UInt32 := do','  let [output] := args | throw (IO.userError "Expected output path")','  IO.eprintln "recovery entry"','  let mut rows : Array Json := #[]');
 for(const[i,x]of data.instances.entries())lines.push('  rows := rows.push (← ProofAtlas.SourceRecoveryNative.check '+i+' Instance'+i+'.sigma Instance'+i+'.sourceExpr Instance'+i+'.templateExpr Instance'+i+'.variables Instance'+i+'.images Instance'+i+'.rawSource Instance'+i+'.rawTemplate Instance'+i+'.sourceContext Instance'+i+'.templateContext #['+x.graph.kind.map((_,j)=>'Instance'+i+'.e'+j).join(', ')+'] '+x.counts.source+' '+x.counts.template+' '+x.counts.templateDAGRows+')');
 lines.push('  IO.FS.writeFile output (Json.mkObj [("format",toJson "ProofAtlasSourceRecoveryNative/1"),("status",toJson "PASS"),("instances",toJson rows)]).compress','  return 0');
 for(const name of['scoped_mono','plug_scoped','plug_compose','closed_compose','recovery','template_scoped','same_template_same_source','two_stage_recovery','plug_count','recovery_count','open_cut_refused','open_image_breaks_scope','capture_17','capture_18','distinct_specializations'])lines.push('#print axioms ProofAtlas.SourceRecovery.'+name);
 for(let i=0;i<data.instances.length;i++)lines.push('#print axioms Instance'+i+'.recovered','#print axioms Instance'+i+'.recovered_count','#print axioms Instance'+i+'.closed_images');
 return lines.join('\n')+'\n';
}
if(require.main===module){const data=collect(),write=process.argv.includes('--write'),file=base+'instances.json.gz';if(write)fs.writeFileSync(file,z.gzipSync(Buffer.from(JSON.stringify(data)+'\n'),{mtime:0}));else assert.deepEqual(read(file),data);const at=process.argv.indexOf('--workdir');if(at>=0){const folder=path.resolve(process.argv[at+1]);fs.mkdirSync(folder,{recursive:true});fs.writeFileSync(path.join(folder,'Check.lean'),source(data));}console.log(JSON.stringify({status:'PASS',instances:data.instances.map(x=>({kind:x.owner.kind,name:x.owner.name||x.bindingKey,...x.counts}))}));}
module.exports={collect,source,make};
