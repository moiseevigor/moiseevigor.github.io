'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/binder-computation-exchange/',temp=fs.mkdtempSync('/private/tmp/atlas-exchange-compat-'),sha=b=>crypto.createHash('sha256').update(b).digest('hex'),reports={};
function retain(file,name){const bytes=fs.readFileSync(file),r=JSON.parse(bytes);assert.equal(r.status,'PASS');const out=base+name+'.json.gz';fs.writeFileSync(out,z.gzipSync(bytes));reports[name]={file:out,sha256:sha(fs.readFileSync(out))};}
function model(script,old,name){const frozen=fs.readFileSync(old),out=base+name+'.json.gz';cp.execFileSync(process.execPath,['-e',`
 const fs=require('fs'),path=require('path'),write=fs.writeFileSync;
 fs.writeFileSync=function(file,...args){return write.call(this,path.resolve(String(file))===path.resolve(${JSON.stringify(old)})?${JSON.stringify(out)}:file,...args);};
 require('./'+${JSON.stringify(script)});
`],{maxBuffer:8388608});assert(fs.readFileSync(old).equals(frozen));assert.equal(JSON.parse(z.gunzipSync(fs.readFileSync(out))).status,'PASS');reports[name]={file:out,sha256:sha(fs.readFileSync(out))};}
model('research/proof-atlas/frontier-pages/check.cjs','research/proof-atlas/frontier-pages/model-check.json.gz','frontier-model');
model('research/proof-atlas/region-output-view/check-model.cjs','research/proof-atlas/region-output-view/model-check.json.gz','output-model');
model('research/proof-atlas/region-composition-view/check-model.cjs','research/proof-atlas/region-composition-view/model-check.json.gz','composition-model');
const manual=JSON.parse(cp.execFileSync(process.execPath,['scripts/test-proof-atlas-manual.cjs'],{encoding:'utf8',maxBuffer:2097152}));assert.equal(manual.status,'PASS');fs.writeFileSync(temp+'/manual.json',JSON.stringify(manual));retain(temp+'/manual.json','manual-model');
// The older frontier checker fixes its output directory in one declaration.
// Change only that output-directory literal; retain every assertion and input.
function frontierBrowser(){const script='research/proof-atlas/frontier-pages/check-browser.cjs',file=path.resolve(script),original=fs.readFileSync(file,'utf8'),needle="base='research/proof-atlas/frontier-pages/'",folder=temp+'/frontier/';assert.equal(original.split(needle).length,2);fs.mkdirSync(folder,{recursive:true});const code=original.replace(needle,'base='+JSON.stringify(folder));
 const before=Object.fromEntries(fs.readdirSync('research/proof-atlas/frontier-pages').filter(n=>/\.(png|gz)$/.test(n)).map(n=>[n,sha(fs.readFileSync('research/proof-atlas/frontier-pages/'+n))]));
 cp.execFileSync(process.execPath,['-e',`const Module=require('module'),entry=new Module(${JSON.stringify(file)});entry.filename=${JSON.stringify(file)};entry.paths=Module._nodeModulePaths(${JSON.stringify(path.dirname(file))});entry._compile(${JSON.stringify(code)},${JSON.stringify(file)});`],{env:process.env,maxBuffer:8388608});
 for(const [name,digest]of Object.entries(before))assert.equal(sha(fs.readFileSync('research/proof-atlas/frontier-pages/'+name)),digest,name);
 const out=base+'frontier-browser.json.gz';fs.copyFileSync(folder+'browser-check.json.gz',out);assert.equal(JSON.parse(z.gunzipSync(fs.readFileSync(out))).status,'PASS');reports['frontier-browser']={file:out,sha256:sha(fs.readFileSync(out)),originalCheckerSha256:sha(Buffer.from(original)),executionSha256:sha(Buffer.from(code)),outputDirectoryOnly:true};}
if(!process.argv.includes('--models-only')){
 frontierBrowser();
 cp.execFileSync(process.execPath,['research/proof-atlas/region-composition-view/check-browser.cjs',temp+'/composition'],{env:process.env,maxBuffer:8388608});retain(temp+'/composition/browser-check.json','composition-browser');
 cp.execFileSync(process.execPath,['scripts/test-proof-atlas-manual-browser.cjs'],{env:{...process.env,ATLAS_SCREENSHOTS:temp+'/manual'},maxBuffer:8388608});retain(temp+'/manual/manual-browser.json','manual-browser');
 const result={format:'ProofAtlasBinderExchangeCompatibility/1',status:'PASS',reports,checkerSha256:sha(fs.readFileSync(__filename)),scope:'Shared neighborhood compatibility on complete prior frontier/output models, current production frontier/regrouping readers and the original manual/gallery. Earlier reports are preserved; all assertions remain in the existing checkers.'};fs.writeFileSync(base+'compatibility.json.gz',z.gzipSync(Buffer.from(JSON.stringify(result,null,2)+'\n')));
}
console.log(JSON.stringify({status:'PASS',reports}));
