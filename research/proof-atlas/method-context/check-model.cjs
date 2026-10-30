'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const {sha,profiles,manifests,read,compact,table}=require('./catalogue.cjs');
const A=require('../../../public/js/proof-atlas-library-data'),M=require('../../../public/js/proof-atlas-method-interfaces'),I=require('../../../public/js/proof-atlas-branch-instantiation'),B=require('../../../public/js/proof-atlas-method-context'),Q=require('../../../public/js/proof-atlas-method-query-pages');
const base='research/proof-atlas/method-context/',cases=[];
const out={status:'RUNNING',profiles:0,frames:0,ports:0,inputPorts:0,bodyPorts:0,strict:0,alpha:0,unavailable:0,prefixComparisons:0,pagedFrames:0,pagedPorts:0,pagedCalls:0,selections:0,bindingChecks:0,refusals:0,synthetic:0,peakCells:0,peakTotalWork:0,rows:[]};
function oracleCase(name,rawExpected,rawActual,n,focus,value){return{name,rawExpected,rawActual,count:n,focus,expectedOutput:compact(value.graph,[value.expectedRoot]),actualOutput:compact(value.graph,[value.actualRoot]),relation:value.relation,status:value.status,
 betaSteps:value.reductions.map(s=>({graph:compact(value.graph,[s.before,s.lambda,s.argument,s.after]),contextLength:s.contextLength}))};}
(async()=>{const originalFetch=globalThis.fetch,forbidden=new Set(profiles.flatMap(({d})=>[d.file,d.record.indexFile]));let fetches=0;
 globalThis.fetch=async f=>{assert(!forbidden.has(f),'whole archive forbidden');fetches++;return new Response(fs.readFileSync('.'+f));};
 try{for(const {d,s,q:delivery}of profiles){const raw=read(d.file,d.sha256),source=A.validateIndex(read(d.record.indexFile,d.record.indexSha256),d.record),model=M.open(raw,source,d.record,d);out.profiles++;
 for(const q of raw.entries){const paged=s?await Q.open(s,d,delivery,d.record,q.parent.route,{sourceStrategy:'stream'}):null;if(paged)out.pagedCalls++;
 for(const branch of q.branches){const data=model.flow(q.parent.route,branch.minor),parent=await I.compare(data),c=M.signatureContext(data);
 const peer=paged?paged.flow(q.parent.route,branch.minor):null,peerParent=peer?await I.compare(peer):null;
 for(let j=0;j<=data.inputs.length;j++){const focus=j===data.inputs.length?{kind:'body'}:{kind:'input',ordinal:j},beforeFetch=fetches,r=B.compare(data,parent,focus),v=B.exportRecord(r);
 assert.equal(fetches,beforeFetch,'context normalization must not request source data');assert(B.accepts(r,data,parent));
 assert.equal(r.context.status,'checked');assert.equal(r.context.length,data.context.length+j);assert.equal(r.context.prefix.length,j);assert(r.context.prefix.every((p,i)=>p.ordinal===i&&p.status==='checked'));
 out.prefixComparisons+=j;assert.equal(r.computed.root,focus.kind==='body'?branch.interface.body.typeRoot:branch.interface.inputs[j].domainRoot);
 assert.equal(r.expected.root,c.expectedRoot);assert.equal(r.expected.projection.openedInputs,j);
 assert(r.state.totalOperations<=B.limits.work&&r.state.derivedCells<=B.limits.cells);
 if(r.status==='unavailable'){out.unavailable++;assert(r.mismatch);assert.equal(r.relation,'beta-normal-forms-differ');}else if(r.renamings.length){out.alpha++;assert.equal(r.relation,'beta-and-explicit-binder-renaming');}else out.strict++;
 for(const side of ['expected','computed']){const root=side==='expected'?v.expectedRoot:v.actualRoot,queue=[[]];
  while(queue.length){const slots=queue.shift(),x=B.inspect(r,side,slots);let id=root;const binders=[...data.context.map((b,ordinal)=>({namespace:'source-expression',node:b.node,route:b.route,ordinal})),...data.inputs.slice(0,j).map(b=>({namespace:'computed-method-interface',ordinal:b.ordinal}))];
   for(const [at,slot]of slots.entries()){const k=v.graph.kind[id];if(((k===6||k===7)&&slot===1)||k===8&&slot===2)binders.push({namespace:'beta-method-type',node:id,route:{root:0,slots:slots.slice(0,at)}});id=v.graph.children[id][slot];}
   assert.equal(x.address.node,id);assert.equal(x.address.contextLength,binders.length);assert.deepEqual(x.payload,v.graph.payloads[id]);assert.equal(x.fields.length,v.graph.children[id].length);
   if(x.kind==='bvar'){const target=binders.at(-1-x.payload.index);assert(target);assert.equal(x.binding.namespace,target.namespace);if(target.namespace==='computed-method-interface')assert.equal(x.binding.ordinal,target.ordinal);else {assert.equal(x.binding.node,target.node);assert.deepEqual(x.binding.route,target.route);}out.bindingChecks++;}
   if(slots.length<2)for(const f of x.fields)queue.push(f.slots);out.selections++;
  }
 }
 cases.push(oracleCase(d.name+':'+branch.minor+':'+j,compact(c.expected,[c.expectedRoot]),compact(c.computed,[r.computed.root]),data.inputs.length,focus,v));
 const tiny=B.compare(data,parent,focus,{bounds:{memo:1}});assert.equal(tiny.status,r.status);assert.equal(tiny.relation,r.relation);
 for(const action of [()=>B.accepts(JSON.parse(JSON.stringify(r)),data,parent),()=>B.accepts(r,data,JSON.parse(JSON.stringify(parent))),()=>B.compare(JSON.parse(JSON.stringify(data)),parent,focus),()=>B.compare(data,parent,focus,{bounds:{work:1}}),()=>B.compare(data,parent,focus,{bounds:{keyBytes:1}}),()=>B.compare(data,parent,focus,{bounds:{keyWorkBytes:1}}),()=>B.compare(data,parent,focus,{bounds:{countDigits:1}}),()=>B.inspect(r,'original',[]),()=>B.inspect(r,'expected',[99])]){assert.throws(action);out.refusals++;}
 const controller=new AbortController();controller.abort();assert.throws(()=>B.compare(data,parent,focus,{signal:controller.signal}));out.refusals++;
 if(peer){const other=B.compare(peer,peerParent,focus);assert.deepEqual(other,r);out.pagedPorts++;}
 out.ports++;if(focus.kind==='body')out.bodyPorts++;else out.inputPorts++;
 out.peakCells=Math.max(out.peakCells,r.state.derivedCells);out.peakTotalWork=Math.max(out.peakTotalWork,r.state.totalOperations);
 out.rows.push({name:d.name,owner:d.sha256,query:q.parent.route,minor:branch.minor,focus,status:r.status,relation:r.relation,context:r.context,expected:r.expected,computed:r.computed,renamings:r.renamings,mismatch:r.mismatch,state:r.state});
 }
 out.frames++;if(peer)out.pagedFrames++;
 }paged?.dispose();}
 }}finally{globalThis.fetch=originalFetch;}
 // Unambiguous beta/alpha controls, metadata boundaries, binder flags and
 // captured free variables. These are syntax controls, not new typed proofs.
 const np=n=>[{str:n}],bind=(name='x',info='default')=>({binderName:name,binderNameParts:np(name),binderInfo:info});
 for(let i=0;i<48;i++){const t=table(),sort=t.add(3,{level:{kind:'zero'}}),x=t.add(0,{index:0}),outer=t.add(0,{index:1});let left,right,wanted;
 switch(i%8){
 case 0:left=t.add(5,{},[t.add(6,bind(),[sort,t.add(6,bind('y'),[sort,outer])]),x]);right=t.add(6,bind('z'),[sort,outer]);wanted='checked';break;
 case 1:left=t.add(5,{},[t.add(6,bind(),[sort,t.add(6,bind('y'),[sort,outer])]),x]);right=t.add(6,bind('z'),[sort,x]);wanted='unavailable';break;
 case 2:left=t.add(7,bind('a'),[sort,x]);right=t.add(7,bind('b'),[sort,x]);wanted='checked';break;
 case 3:left=t.add(7,bind('a'),[sort,x]);right=t.add(7,bind('b','implicit'),[sort,x]);wanted='unavailable';break;
 case 4:left=t.add(10,{metadata:[]},[x]);right=x;wanted='unavailable';break;
 case 5:left=t.add(8,{declName:'a',declNameParts:np('a'),nondep:false},[sort,x,x]);right=t.add(8,{declName:'b',declNameParts:np('b'),nondep:true},[sort,x,x]);wanted='unavailable';break;
 case 6:left=t.add(6,bind('same'),[sort,outer]);right=t.add(6,bind('same'),[sort,x]);wanted='unavailable';break;
 default:left=t.add(5,{},[t.add(6,bind(),[sort,x]),outer]);right=outer;wanted='checked';}
 const r=B.normalizePair(t.g,left,t.g,right,0,{kind:'body'},2);assert.equal(r.status,wanted);cases.push(oracleCase('structural-'+i,compact(t.g,[left]),compact(t.g,[right]),0,{kind:'body'},r));out.synthetic++;
 }
 // Untyped omega must stop at a bound; nontermination is not inferred for Lean proofs.
 {const t=table(),sort=t.add(3,{level:{kind:'zero'}}),x=t.add(0,{index:0}),f=t.add(6,bind(),[sort,t.add(5,{},[x,x])]),omega=t.add(5,{},[f,f]);assert.throws(()=>B.normalizePair(t.g,omega,t.g,x,0,{kind:'body'},1,{bounds:{calls:32}}),/bound/);out.refusals++;}
 assert.equal(out.frames,65);assert.equal(out.ports,171);assert.equal(out.strict,164);assert.equal(out.alpha,1);assert.equal(out.unavailable,6);assert.equal(out.pagedFrames,57);assert.equal(out.synthetic,48);
 const files=['public/js/proof-atlas-method-context.js','public/js/proof-atlas-method-interfaces.js','public/js/proof-atlas-branch-instantiation.js',base+'catalogue.cjs',base+'check-model.cjs',...manifests.map(n=>'public/data/proof-atlas/'+n+'-manifest.js')];
 out.files=Object.fromEntries(files.map(f=>[f,sha(fs.readFileSync(f))]));out.status='PASS';out.scope='Recorded input-prefix correspondence and local beta/explicit-alpha comparisons. Six local results remain unavailable under this policy; no new kernel judgment, arithmetic, delta or annotation erasure.';
 const input=Buffer.from(JSON.stringify(cases));out.primitiveInputSha256=sha(input);fs.writeFileSync(base+'primitive-input.json.gz',z.gzipSync(input));fs.writeFileSync(base+'model-check.json.gz',z.gzipSync(JSON.stringify(out,null,2)+'\n'));console.log(JSON.stringify({...out,rows:undefined,files:undefined}));
})().catch(e=>{console.error(e.stack);process.exitCode=1});
