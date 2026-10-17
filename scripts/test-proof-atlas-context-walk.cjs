/* Prior scope contract versus incremental traversal, streamed one packet at a time. */
'use strict';
const fs=require('fs'),vm=require('vm'),z=require('zlib'),assert=require('assert/strict'),crypto=require('crypto'),A=require('../public/js/proof-atlas-library-data'),T=require('../public/js/proof-atlas-occurrence-types');
function reference(data,route){
 assert(Number.isInteger(route?.root)&&route.root>=0&&route.root<data.roots.length&&Array.isArray(route.slots)&&route.slots.length<=512,'invalid route');let id=data.roots[route.root];const binders=[],slots=[];
 for(const slot of route.slots){const kind=A.kinds[data.kind[id]];assert(Number.isInteger(slot)&&slot>=0&&slot<data.children[id].length,'invalid occurrence slot');if((kind==='lam'||kind==='forallE')&&slot===1||kind==='letE'&&slot===2){const at={root:route.root,slots:[...slots]};binders.push({node:id,kind,path:A.path(data,at),route:at});}slots.push(slot);id=data.children[id][slot];}return{node:id,binders};
}
let comparisons=0,synthetic=0,negative=0;
function check(data,route){const expected=reference(data,route),actual=T.context(data,route);assert.deepEqual(actual,expected);comparisons++;return actual;}
// All twelve constructors, shared variable uses, shadowing, and let headers.
const s={kind:[],children:[],payloads:[],roots:[],declaration:{rootPaths:['root.synthetic']}};
const add=(kind,children=[],payload={})=>{const i=s.kind.length;s.kind.push(kind);s.children.push(children);s.payloads.push(payload);return i;};
const typ=add(3,[],{level:{kind:'zero'}}),v=add(0,[],{index:0}),v1=add(0,[],{index:1}),constant=add(4,[],{name:'C',levels:[]}),fvar=add(1,[],{id:'local'}),mvar=add(2,[],{id:'hole'}),lit=add(9,[],{literalKind:'natVal',value:'0'});
const local=add(8,[typ,v,add(5,[v,v1])],{declName:'x',nondep:false}),lam1=add(6,[typ,v],{binderName:'x',binderInfo:'default'}),lam2=add(6,[typ,v],{binderName:'x',binderInfo:'implicit'}),pi=add(7,[v,v],{binderName:'x',binderInfo:'default'}),meta=add(10,[local],{metadata:[]}),proj=add(11,[meta],{typeName:'S',index:0});
let body=constant;for(const node of [fvar,mvar,lit,lam1,lam2,pi,proj])body=add(5,[body,node]);s.roots=[add(6,[typ,body],{binderName:'outer',binderInfo:'default'})];
const pending=[{root:0,slots:[]}];for(let i=0;i<pending.length;i++){const at=pending[i],id=check(s,at).node;synthetic++;s.children[id].forEach((_,slot)=>pending.push({root:0,slots:[...at.slots,slot]}));}assert.equal(new Set(s.kind).size,12);
for(const route of [null,{root:-1,slots:[]},{root:1,slots:[]},{root:0,slots:[-1]},{root:0,slots:[.5]},{root:0,slots:[2]},{root:0,slots:Array(513).fill(1)}]){assert.throws(()=>T.context(s,route));assert.throws(()=>reference(s,route));negative++;}
// The old helper never reads root-path metadata on a binder-free route.
const noPath={roots:[1],kind:[4,5],children:[[],[0,0]],payloads:[{},{}]};Object.defineProperty(noPath,'declaration',{get(){throw Error('Unneeded metadata access');}});check(noPath,{root:0,slots:[0]});
for(const rootPath of [undefined,null,17]){const data={roots:[2],kind:[4,6,6],children:[[],[0,0],[0,1]],payloads:[{}, {}, {}],declaration:{rootPaths:[rootPath]}};check(data,{root:0,slots:[1,1]});}
// Count source-array reads separately from output strings, prefix copies and loading.
const costs=[];
for(const depth of [0,16,64,128,256,512]){const data={kind:[4,0],children:[[],[]],payloads:[{name:'True',levels:[]},{index:0}],roots:[],declaration:{rootPaths:['root.depth']}};let root=depth?1:0;for(let j=0;j<depth;j++){const id=data.kind.length;data.kind.push(6);data.children.push([0,root]);data.payloads.push({binderName:'h',binderInfo:'default'});root=id;}data.roots=[root];const route={root:0,slots:Array(depth).fill(1)},measure=fn=>{let reads=0;const copy={...data};for(const field of ['kind','children','payloads'])copy[field]=new Proxy(data[field],{get(target,key,receiver){if(typeof key==='string'&&/^(0|[1-9]\d*)$/.test(key))reads++;return Reflect.get(target,key,receiver);}});return{result:fn(copy,route),reads};};const before=measure(reference),after=measure(T.context);assert.deepEqual(after.result,before.result);assert.equal(before.reads,depth*depth+2*depth);assert.equal(after.reads,3*depth);costs.push({depth,priorSourceArrayReads:before.reads,incrementalSourceArrayReads:after.reads});}
const w={};for(const f of ['library','goedel-sample','recursion-examples','source-references','context-types'])vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/'+f+'-manifest.js','utf8'),{window:w});
const editions=[...w.PROOF_ATLAS_LIBRARY.editions,w.PROOF_ATLAS_RECURSION_EXAMPLES.edition,w.PROOF_ATLAS_AI_SAMPLE.edition,w.PROOF_ATLAS_SOURCE_REFERENCES.edition,w.PROOF_ATLAS_CONTEXT_TYPES.edition];assert.equal(editions.reduce((n,e)=>n+e.declarations.length,0),2234);
let nodes=0,representatives=0,alternatives=0,depthSkipped=0;const packets=[];
for(const edition of editions)for(const record of edition.declarations){const data=A.validateIndex(JSON.parse(z.gunzipSync(fs.readFileSync('.'+record.indexFile))),record),routes=A.routes(data),depth=new Int32Array(data.kind.length);let checked=0,extra=0,skipped=0;
 for(let i=data.kind.length-1;i>=0;i--)depth[i]=routes.parent[i]<0?0:depth[routes.parent[i]]+1;
 const route=id=>{const slots=[];while(routes.parent[id]>=0){const parent=routes.parent[id];slots.push(data.children[parent].indexOf(id));id=parent;}slots.reverse();return{root:data.roots.indexOf(id),slots};};
 for(let i=0;i<data.kind.length;i++){nodes++;if(depth[i]>512){skipped++;continue;}check(data,route(i));checked++;}
 // Additional incoming-edge routes sample context sharing; not all unrollings.
 for(let parent=0;parent<data.kind.length&&extra<32;parent++)if(depth[parent]<512)data.children[parent].forEach((child,slot)=>{if(extra>=32||routes.parent[child]===parent||![0,6,8].includes(data.kind[child]))return;const at=route(parent);check(data,{root:at.root,slots:[...at.slots,slot]});extra++;});
 representatives+=checked;alternatives+=extra;depthSkipped+=skipped;packets.push({edition:edition.id,name:record.name,indexSha256:record.indexSha256,storedNodes:data.kind.length,representatives:checked,additionalIncomingRoutes:extra,overDepthBound:skipped});
}
const report={status:'PASS',moduleSha256:crypto.createHash('sha256').update(fs.readFileSync('public/js/proof-atlas-occurrence-types.js')).digest('hex'),packets:packets.length,storedNodes:nodes,representativeComparisons:representatives,additionalIncomingComparisons:alternatives,overDepthBound:depthSkipped,syntheticOccurrences:synthetic,sourceReadControls:costs,negativeControls:negative,comparisons,records:packets,scope:'One bounded representative route per stored node and at most 32 additional incoming routes per packet, plus structural controls. Not all expanded occurrences, native typing, source paging or measured readability.'};fs.writeFileSync(process.env.ATLAS_CONTEXT_WALK_REPORT||'/tmp/atlas-context-walk.json',JSON.stringify(report,null,2));console.log(JSON.stringify({...report,records:undefined}));
