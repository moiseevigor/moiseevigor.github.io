'use strict';
const fs=require('fs'),path=require('path'),crypto=require('crypto'),assert=require('assert/strict'),M=require('./model.cjs');
const sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function fixture(){
 const d={kind:[],children:[],payloads:[],neededScope:[],expanded:[]};
 const add=(k,children=[],payload={})=>{const node=d.kind.length;d.kind.push(k);d.children.push(children);d.payloads.push(payload);d.neededScope.push(k===0?payload.index+1:Math.max(0,...children.map((c,s)=>d.neededScope[c]-Number((k===6||k===7)&&s===1||k===8&&s===2))));d.expanded.push(String(1n+children.reduce((n,c)=>n+BigInt(d.expanded[c]),0n)));return node;};
 return{d,add};
}
const {brute}=require('./oracles.cjs');
const out={status:'RUNNING',smallComparisons:0,constructors:0,refusals:0,partialRefusals:0,largeSharing:0,deepBinders:0};
const{d,add}=fixture(),zero=add(0,[],{index:0}),one=add(0,[],{index:1}),large=add(0,[],{index:64}),nat=add(4,[],{name:'Nat'});
for(const k of [1,2,3,9])add(k,[],{id:'unresolved-structural-control'});
for(const k of [5,6,7,8,10,11])add(k,({5:[zero,one],6:[zero,zero],7:[large,one],8:[zero,zero,one],10:[one],11:[one]})[k]);
let seed=731;const random=limit=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed%limit;};
for(let i=0;i<120;i++){const kind=[5,6,7,8,10,11][random(6)],arity={5:2,6:2,7:2,8:3,10:1,11:1}[kind];add(kind,Array.from({length:arity},()=>random(d.kind.length)));}
const queries=[];for(let node=0;node<d.kind.length;node++)for(let index=0;index<Math.min(d.neededScope[node]+2,68);index++)queries.push({node,index});
const result=M.evaluate(d,queries);assert.equal(result.status,'complete');for(const row of result.rows){const expected=brute(d,row.node);if(expected){assert.equal(row.count,String(expected.get(row.index)||0n));out.smallComparisons++;}}
out.constructors=new Set(d.kind).size;assert.equal(out.constructors,12);assert(out.smallComparisons>100);
// A domain/value keeps its prior context; the body discharges its own zero.
const shadow=add(6,[zero,zero]);assert.equal(M.evaluate(d,[{node:shadow,index:0}]).rows[0].count,'1');
const local=add(8,[zero,zero,zero]);assert.equal(M.evaluate(d,[{node:local,index:0}]).rows[0].count,'2');
const{d:shared,add:s}=fixture();let body=s(0,[],{index:0});for(let i=0;i<240;i++)body=s(5,[body,body]);const doubled=M.evaluate(shared,[{node:body,index:0}]);assert.equal(doubled.status,'complete');assert.equal(doubled.rows[0].count,String(1n<<240n));assert(BigInt(shared.expanded[body])>10n**70n);out.largeSharing=240;
const{d:deep,add:b}=fixture(),domain=b(4,[],{name:'Nat'});body=b(0,[],{index:10000});for(let i=0;i<10000;i++)body=b(6,[domain,body]);const deepResult=M.evaluate(deep,[{node:body,index:0}]);assert.equal(deepResult.status,'complete');assert.equal(deepResult.rows[0].count,'1');out.deepBinders=10000;
// Unrelated prefixes do not enter the live frontier for this selected query.
const{d:isolated,add:a}=fixture(),atom=a(0,[],{index:0});for(let i=1;i<500;i++)a(0,[],{index:i});const focus=a(5,[atom,atom]);const isolatedResult=M.evaluate(isolated,[{node:focus,index:0}]);assert.equal(isolatedResult.rows[0].count,'2');assert.equal(isolatedResult.stats.reachableNodes,2);
for(const mutate of [x=>x.children[shadow]=[shadow,zero],x=>x.kind[shadow]=12,x=>x.children[shadow]=[zero],x=>x.neededScope[shadow]++,x=>x.payloads[zero].index=-1]){const x=structuredClone(d);mutate(x);assert.throws(()=>M.evaluate(x,[{node:shadow,index:0}]));out.refusals++;}
for(const options of [{coefficientCells:0},{decimalDigits:M.limits.decimalDigits+1},{unknown:1}]){assert.throws(()=>M.evaluate(d,[{node:shadow,index:0}],options));out.refusals++;}
for(const queries of [[{node:0,index:0},{node:0,index:0}],[{node:-1,index:0}],[{node:0,index:0,context:[]}],[{node:0,index:NaN}]]){assert.throws(()=>M.evaluate(d,queries));out.refusals++;}
for(const bound of [{coefficientCells:2},{decimalDigits:2}]){
 const tiny={kind:[0,0,5],children:[[],[],[0,1]],payloads:[{index:0},{index:1},{}],neededScope:[1,2,2]};const r=M.evaluate(tiny,[{node:0,index:0},{node:2,index:0}],bound);assert.equal(r.status,'partial');assert.equal(r.rows[0].status,'complete');assert.equal(r.rows[0].count,'1');assert.equal(r.rows[1].status,'unavailable');assert.equal(r.rows[1].count,null);assert(r.stats.peakCoefficientCells<=r.limits.coefficientCells&&r.stats.peakDecimalDigits<=r.limits.decimalDigits);out.partialRefusals++;
}
const empty=M.evaluate(d,[]);assert.equal(empty.status,'complete');assert.equal(empty.stats.indexBytes,0);
assert(Object.isFrozen(result)&&Object.isFrozen(result.rows)&&result.rows.every(Object.isFrozen));out.status='PASS';out.modelSha256=sha(fs.readFileSync(path.join(__dirname,'model.cjs')));out.testSha256=sha(fs.readFileSync(__filename));out.scope='Independent small occurrence enumeration, all twelve structural constructors, lexical shifts, extreme sharing, deep binders, bounded partial results and rejected modifications. Structural fixtures have no native kernel-validity claim.';
fs.writeFileSync('/tmp/atlas-free-index-multiplicity-controls.json',JSON.stringify(out,null,2)+'\n');console.log(JSON.stringify(out));
