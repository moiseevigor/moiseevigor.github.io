/* Preserve the preceding 150-query browser assertions and add local openings.
   Frozen predecessor reports remain unchanged. Dev overlays are explicit. */
'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/notation-refinement/',dev=process.env.ATLAS_DEV==='1',output=dev?'/private/tmp/atlas-notation-refinement-dev/':base,script='research/proof-atlas/type-notation/check-browser.cjs',file=path.resolve(script),original=fs.readFileSync(file,'utf8'),sha=b=>crypto.createHash('sha256').update(b).digest('hex');fs.mkdirSync(output,{recursive:true});
let code=original;
function replace(needle,value){assert.equal(code.split(needle).length-1,1,needle);code=code.replace(needle,value);}
replace("output=dev?'/private/tmp/atlas-type-notation-dev/':base",'output='+JSON.stringify(output));
replace("const appFiles=['public/js/proof-atlas-type-notation.js',","const appFiles=['public/js/proof-atlas-source-cut-union.js','public/js/proof-atlas-notation-refinement.js','public/js/proof-atlas-type-notation.js',");
replace("report.typeRoots++;report.notationRoots++;return n;}","report.typeRoots++;report.notationRoots++;await checkOpening(qr);return projected();}");
replace("');return route.fulfill({body:html,contentType:'text/html'});", "');html=html.replace('<script src=\"/public/js/proof-atlas-region-native-types.js','<script src=\"/public/js/proof-atlas-source-cut-union.js\" defer></script><script src=\"/public/js/proof-atlas-notation-refinement.js\" defer></script><script src=\"/public/js/proof-atlas-region-native-types.js');return route.fulfill({body:html,contentType:'text/html'});");
const extra=`
 report.inPlaceOpenings=0;report.openedTypeRoots=0;report.maxRefinedObjects=0;report.openingRequests=0;
 async function checkOpening(qr){
  let opened=false;
  for(let step=0;step<192;step++){
   const buttons=rc('[data-tn-expand]');if(!await buttons.count())break;
   const before=await projected(),path=JSON.parse(await buttons.first().getAttribute('data-tn-expand'));
   const prefix=(a,b)=>a.length<=b.length&&a.every((s,i)=>s===b[i]);
   const outside=await rc('[data-tn-pick]').evaluateAll(bs=>bs.map(b=>({slots:JSON.parse(b.dataset.tnPick),text:b.textContent}))).then(xs=>xs.filter(x=>!prefix(x.slots,path)&&!prefix(path,x.slots)));
   await p.evaluate(()=>window.staleOpeningButton=document.querySelector('[data-tn-expand]'));
   const requests=report.typePacketRequests;
   await buttons.first().focus();await p.keyboard.press('Enter');
   const after=await projected();assert.equal(after.notationError,null);assert.equal(after.mode,'type');assert(after.notationActive);assert(after.vertices<=192);
   assert.deepEqual(after.typeSelection,before.typeSelection);assert.deepEqual(after.native,before.native);assert.deepEqual(after.notation.origin,before.notation.origin);
   assert(BigInt(after.notation.stats.retained)>BigInt(before.notation.stats.retained));assert.equal(after.notation.stats.represented,before.notation.stats.represented);
   assert.equal(after.notation.refinement.rule,'source-cut-union/1');assert.deepEqual(after.notation.refinement.opened.slots,path);
   assert.equal(report.typePacketRequests,requests);report.openingRequests+=report.typePacketRequests-requests;assert(await p.evaluate(path=>document.activeElement?.dataset.tnPick===JSON.stringify(path),path));
   const visible=await rc('[data-tn-pick]').evaluateAll(bs=>bs.map(b=>({slots:JSON.parse(b.dataset.tnPick),text:b.textContent})));
   for(const old of outside)assert(visible.some(n=>JSON.stringify(n)===JSON.stringify(old)),'Outside symbol changed');
   await p.evaluate(()=>staleOpeningButton.click());assert.deepEqual(await projected(),after);
   opened=true;report.inPlaceOpenings++;report.maxRefinedObjects=Math.max(report.maxRefinedObjects,after.vertices);
  }
  if(opened)report.openedTypeRoots++;
 }
`;
replace(" try{\n  await p.goto",extra+"\n try{\n  await p.goto");
replace("assert.equal(report.profiles,11);", "assert(report.inPlaceOpenings>0&&report.openedTypeRoots>0&&report.maxRefinedObjects>48);assert.equal(report.profiles,11);");
const frozen=fs.readFileSync('research/proof-atlas/type-notation/browser.json.gz');
const launcher=`const Module=require('module'),m=new Module(${JSON.stringify(file)});m.filename=${JSON.stringify(file)};m.paths=Module._nodeModulePaths(${JSON.stringify(path.dirname(file))});m._compile(${JSON.stringify(code)},${JSON.stringify(file)});`;
cp.execFileSync(process.execPath,['-e',launcher],{env:process.env,stdio:'inherit'});assert(fs.readFileSync('research/proof-atlas/type-notation/browser.json.gz').equals(frozen));
const report=JSON.parse(z.gunzipSync(fs.readFileSync(output+'browser.json.gz')));report.checkerSha256=sha(fs.readFileSync(__filename));report.originalChecker=script;report.originalCheckerSha256=sha(Buffer.from(original));report.executedCheckerSha256=sha(Buffer.from(code));report.instrumentation='Original browser assertions plus in-place keyboard, owner, source count, unchanged outside, no-fetch and stale-control checks; output redirected.';
fs.writeFileSync(output+'browser.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n'),{mtime:0}));
