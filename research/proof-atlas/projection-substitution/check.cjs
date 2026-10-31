/* Independent small-graph evaluator; does not import the Lean or browser evaluators. */
'use strict';
const fs=require('fs'),path=require('path'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/projection-substitution/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),read=f=>JSON.parse(z.gunzipSync(fs.readFileSync(f)));
const data=read(base+'native.json.gz'),verification=read(base+'verification.json.gz');
assert.equal(verification.status,'PASS');assert.equal(sha(z.gunzipSync(fs.readFileSync(base+'native.json.gz'))),verification.controlsSha256);
for(const[f,h]of Object.entries(verification.producerFiles))assert.equal(sha(fs.readFileSync(f)),h,f);
assert.equal(data.format,'ProofAtlasProjectionFusionControls/1');assert.equal(data.typingClaim,false);assert.equal(data.generalNativeRefinementClaim,false);
const arities=[0,0,0,0,0,2,2,2,3,0,1,1],binds=(k,s)=>(k===6||k===7)&&s===1||k===8&&s===2;
const nodes=[],keys=new Map();
const canonical=v=>Array.isArray(v)?v.map(canonical):v&&typeof v==='object'?Object.fromEntries(Object.keys(v).sort().map(k=>[k,canonical(v[k])])):v;
function add(k,p,cs){
 assert(k>=0&&k<12&&Number.isInteger(k));assert.equal(cs.length,arities[k]);
 const key=JSON.stringify([k,canonical(p),cs]);if(keys.has(key))return keys.get(key);
 assert(nodes.length<65536,'control-only node bound');const id=nodes.length;nodes.push({k,p,cs});keys.set(key,id);return id;
}
const g=data.graph,ids=[];assert.deepEqual([...new Set(g.kind)].sort((a,b)=>a-b),Array.from({length:12},(_,i)=>i));
for(let i=0;i<g.kind.length;i++){
 const k=g.kind[i],p=g.payloads[i],cs=g.children[i];assert.equal(cs.length,arities[k]);for(const c of cs)assert(Number.isInteger(c)&&c>=0&&c<i);
 if(k===0)assert(Number.isInteger(p.index)&&p.index>=0);
 assert.equal(g.expanded[i],(1n+cs.reduce((n,c)=>n+BigInt(g.expanded[c]),0n)).toString());
 const need=k===0?p.index+1:Math.max(0,...cs.map((c,s)=>Math.max(0,g.neededScope[c]-Number(binds(k,s)))));
 assert.equal(need,g.neededScope[i]);ids.push(add(k,p,cs.map(c=>ids[c])));
}
const tableRows=g.kind.length;
assert.equal(data.maps.length,67);
for(let code=0;code<64;code++)assert.deepEqual(data.maps[code],Array.from({length:12},(_,i)=>i<3?(Math.floor(code/4**i)%4===3?null:Math.floor(code/4**i)%4):null));
assert.deepEqual(data.maps[64],Array.from({length:12},(_,i)=>i));assert.deepEqual(data.maps[65],Array.from({length:12},(_,i)=>i+2));assert.deepEqual(data.maps[66],Array(12).fill(0));
function projector(mapping,cutoff){
 const memo=new Map();
 function visit(id,c){const key=id+':'+c;if(memo.has(key))return memo.get(key);assert(memo.size<4096&&c<=32);
  const {k,p,cs}=nodes[id];let result;
  if(k===0){const n=p.index<c?p.index:((mapping[p.index-c]??null)===null?null:mapping[p.index-c]+c);result=n===null?null:add(0,{index:n},[]);}
  else{const children=cs.map((child,s)=>visit(child,c+Number(binds(k,s))));result=children.includes(null)?null:add(k,p,children);}
  memo.set(key,result);return result;
 }return id=>visit(id,cutoff);
}
function shift(root,amount,cutoff){
 const memo=new Map();function visit(id,c){const key=id+':'+c;if(memo.has(key))return memo.get(key);assert(memo.size<4096&&c<=32);const {k,p,cs}=nodes[id];
  const result=k===0?add(k,{index:p.index>=c?p.index+amount:p.index},[]):add(k,p,cs.map((child,s)=>visit(child,c+Number(binds(k,s)))));memo.set(key,result);return result;
 }return visit(root,cutoff);
}
function substitute(root,value,depth){
 const memo=new Map(),copies=new Map();function visit(id,d){const key=id+':'+d;if(memo.has(key))return memo.get(key);assert(memo.size<4096&&d<=32);const {k,p,cs}=nodes[id];let result;
  if(k===0){if(p.index===d){if(!copies.has(d))copies.set(d,shift(value,d,0));result=copies.get(d);}else result=add(k,{index:p.index>d?p.index-1:p.index},[]);}
  else result=add(k,p,cs.map((child,s)=>visit(child,d+Number(binds(k,s)))));
  memo.set(key,result);return result;
 }return visit(root,depth);
}
const root=id=>{assert(id===null||Number.isInteger(id)&&id>=0&&id<ids.length);return id===null?null:ids[id];};
const tally={liftSuccess:0,liftRefusal:0,substituteApplicableSuccess:0,substituteApplicableRefusal:0,replacementUnavailable:0,unusedReplacementSuccess:0};
const seenLifts=new Set(),seenSubs=new Set();
for(const[mi,c,ei,k,raw]of data.lifts){
 const key=[mi,c,ei,k].join(':');assert(!seenLifts.has(key));seenLifts.add(key);assert(mi<67&&c<4&&ei<23&&[0,1,3].includes(k));assert.equal(raw.length,6);
 const[e,before,direct,native,left,right]=raw.map(root),map=data.maps[mi];
 assert.equal(projector(map,c)(e),before);assert.equal(shift(e,k,c),direct);assert.equal(native,direct);
 assert.equal(projector(map,c+k)(direct),left);assert.equal(before===null?null:shift(before,k,c),right);assert.equal(left,right);
 tally[left===null?'liftRefusal':'liftSuccess']++;
}
for(const[mi,d,ei,vi,raw]of data.substitutions){
 const key=[mi,d,ei,vi].join(':');assert(!seenSubs.has(key));seenSubs.add(key);assert(mi<67&&d<4&&ei<23&&vi<5);assert.equal(raw.length,8);
 const[e,v,pv,before,direct,native,left,right]=raw.map(root),map=data.maps[mi];
 assert.equal(projector(map,0)(v),pv);assert.equal(projector(map,d+1)(e),before);assert.equal(substitute(e,v,d),direct);assert.equal(native,direct);
 assert.equal(projector(map,d)(direct),left);assert.equal(pv===null||before===null?null:substitute(before,pv,d),right);
 if(pv!==null){assert.equal(left,right);tally[left===null?'substituteApplicableRefusal':'substituteApplicableSuccess']++;}
 else{tally.replacementUnavailable++;if(left!==null){assert.equal(right,null);tally.unusedReplacementSuccess++;}}
}
assert.equal(seenLifts.size,18492);assert.equal(seenSubs.size,30820);assert(tally.liftRefusal>0&&tally.substituteApplicableRefusal>0&&tally.unusedReplacementSuccess>0);
// An eliminated binder is protected before projection. Using r directly drops
// that binder or turns an inner variable into an ambient one.
const variable=n=>add(0,{index:n},[]),empty=Array(12).fill(null),identity=Array.from({length:12},(_,i)=>i),dropFirst=identity.map((_,i)=>i===0?null:i-1);
const v0=variable(0),v1=variable(1),nat=add(4,{name:'Nat',nameParts:[{str:'Nat'}],levels:[]},[]);
assert.equal(projector(empty,1)(v0),v0);assert.equal(projector(empty,0)(v0),null);
const lambda=add(6,{binderName:'x',binderNameParts:[{str:'x'}],binderInfo:'default'},[nat,v1]);
const captureSafe=substitute(lambda,v0,0);assert.equal(nodes[captureSafe].cs[1],v1);assert.notEqual(nodes[captureSafe].cs[1],v0);
assert.equal(projector(dropFirst,0)(v1),v0);assert.equal(projector(dropFirst,1)(v1),null);
const lam=(name,type,body)=>add(6,{binderName:name,binderNameParts:[{str:name}],binderInfo:'default'},[type,body]),app=(f,a)=>add(5,{},[f,a]);
const universe=add(3,{level:{kind:'succ',of:{kind:'zero'}}},[]);
assert.equal(data.typedControls.length,2);
for(const row of data.typedControls){
 const dependent=row.label==='dependent-family';assert(dependent||row.label==='Nat-value');
 const [e,v,pe,pv,after,left,right,original,originalAfter,reduced,adapter,expected,witness,...types]=row.roots.map(root);
 assert.equal(row.roots.length,17);assert.deepEqual(row.mapping,dependent?[0,null,1]:[null,0]);
 assert.equal(projector(row.mapping,1)(e),pe);assert.equal(projector(row.mapping,0)(v),pv);
 assert.equal(substitute(e,v,0),after);assert.equal(projector(row.mapping,0)(after),left);assert.equal(substitute(pe,pv,0),right);assert.equal(left,right);
 const full=term=>dependent?lam('A',universe,lam('unused',nat,lam('a',v1,term))):lam('a',nat,lam('unused',nat,term));
 assert.equal(original,full(app(lam('x',dependent?variable(2):nat,e),v)));assert.equal(originalAfter,full(after));
 assert.equal(reduced,dependent?lam('A',universe,lam('a',v0,right)):lam('a',nat,right));
 assert.equal(adapter,full(dependent?app(app(reduced,variable(2)),v0):app(reduced,v1)));
 function spine(id){const args=[];while(nodes[id].k===5){args.unshift(nodes[id].cs[1]);id=nodes[id].cs[0];}return {head:nodes[id].p.name,args};}
 const eq=spine(expected),refl=spine(witness);assert.equal(eq.head,'Eq');assert.equal(refl.head,'Eq.refl');assert.deepEqual(eq.args.slice(1),[original,adapter]);assert.equal(refl.args.at(-1),original);
 for(const id of [original,originalAfter,reduced,adapter,expected,witness,...types])assert(g.neededScope[ids.indexOf(id)]===0);
 for(const k of ['kernelTyping','kernelRecoveryConversion','kernelEqualityWitness'])assert.equal(row[k],'PASS');
}
const files=Object.fromEntries([base+'check.cjs',base+'native.json.gz',base+'verification.json.gz',...Object.keys(verification.producerFiles)].map(f=>[f,sha(fs.readFileSync(f))]));
const report={format:'ProofAtlasProjectionFusionModel/1',status:'PASS',tableRows,modelRows:nodes.length,maps:67,shapes:23,constructors:12,lifts:seenLifts.size,substitutions:seenSubs.size,tally,typedControls:2,typedClosedTerms:8,kernelRecoveryWitnesses:2,
 controls:{protectedEliminatedBinder:true,captureAvoidance:true,innerAmbientSeparation:true,unusedReplacement:true},files,
 scope:'Independent finite raw graph reconstruction of both composition squares, all successes and failures, plus two closed typed controls. No general typing preservation, native implementation refinement, massive shared evaluation or comprehension claim.'};
const bytes=Buffer.from(JSON.stringify(report,null,2)+'\n');if(process.argv.includes('--check'))assert(z.gunzipSync(fs.readFileSync(base+'model.json.gz')).equals(bytes));else fs.writeFileSync(base+'model.json.gz',z.gzipSync(bytes,{mtime:0}));
console.log(JSON.stringify({status:'PASS',tableRows,tally,lifts:report.lifts,substitutions:report.substitutions}));
