'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/notation-refinement/',script='research/proof-atlas/region-native-types/check-types.cjs',file=path.resolve(script),original=fs.readFileSync(file,'utf8'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');let code=original;
const needle="base+'consumer.json.gz'";assert.equal(code.split(needle).length-1,2);code=code.split(needle).join(JSON.stringify(path.resolve(base+'consumer.json.gz')));
assert.equal(code.split('report.typeCuts++;').length-1,1);code=code.replace('report.typeCuts++;',`checkOpening(native,view);report.typeCuts++;`);
const extra=`
let expansionCases=0,expansions=0,foreignOwners=0;
function checkOpening(native,view){
 if(!view.notation)return;
 let current=view.notation;const original=native.record(),cache=native.state();
 for(let step=0;step<192;step++){
  const todo=[current.root];let target;while(todo.length){const n=todo.pop();if(n.kind==='frontier'){target=n;break;}todo.push(...n.children.map(c=>c.value));}if(!target)break;
  const next=native.expandNotation(current,target.slots);assert.deepEqual(next.root.origin,current.root.origin);assert(BigInt(next.stats.retained)>BigInt(current.stats.retained));assert(next.stats.nodes<=192);assert.deepEqual(native.record(),original);assert.deepEqual(native.state(),cache);
  if(!step){const bad=clone(current);bad.root.origin.query+=1;assert.throws(()=>native.expandNotation(bad,target.slots),/owner/);foreignOwners++;expansionCases++;}
  current=next;expansions++;
 }
}
`;
code=code.replace('(async()=>{',extra+'\n(async()=>{');
code=code.replace("report.files=Object.fromEntries(","assert(expansions>0&&expansionCases>0);report.expansions=expansions;report.expansionCases=expansionCases;report.foreignOwners=foreignOwners;report.files=Object.fromEntries(");
const frozen=fs.readFileSync('research/proof-atlas/region-native-types/consumer.json.gz');
const catalogFile=path.resolve('public/data/proof-atlas/type-notation-catalog.js'),launcher=`const fs=require('fs'),vm=require('vm'),w={};vm.runInNewContext(fs.readFileSync(${JSON.stringify(catalogFile)},'utf8'),{window:w});globalThis.PROOF_ATLAS_TYPE_NOTATION=JSON.parse(JSON.stringify(w.PROOF_ATLAS_TYPE_NOTATION));const Module=require('module'),m=new Module(${JSON.stringify(file)});m.filename=${JSON.stringify(file)};m.paths=Module._nodeModulePaths(${JSON.stringify(path.dirname(file))});m._compile(${JSON.stringify(code)},${JSON.stringify(file)});`;
cp.execFileSync(process.execPath,['-e',launcher],{env:process.env,stdio:'inherit'});assert(fs.readFileSync('research/proof-atlas/region-native-types/consumer.json.gz').equals(frozen));
const report=JSON.parse(z.gunzipSync(fs.readFileSync(base+'consumer.json.gz')));report.checkerSha256=sha(fs.readFileSync(__filename));report.originalChecker=script;report.originalCheckerSha256=sha(Buffer.from(original));report.executedCheckerSha256=sha(Buffer.from(code));report.instrumentation='Original 150-query consumer assertions, production catalogue enabled, plus local expansion and foreign-owner checks; output redirected.';
for(const f of['public/js/proof-atlas-notation-refinement.js','public/js/proof-atlas-source-cut-union.js','public/js/proof-atlas-type-notation.js','public/data/proof-atlas/type-notation-catalog.js'])report.files[f]=sha(fs.readFileSync(f));
fs.writeFileSync(base+'consumer.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n'),{mtime:0}));
