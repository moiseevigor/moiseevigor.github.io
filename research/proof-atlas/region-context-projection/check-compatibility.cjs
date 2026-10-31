'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/region-context-projection/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),temp=fs.mkdtempSync('/private/tmp/atlas-region-binding-compat-'),reports={};
for(const[name,script]of [['authored','research/proof-atlas/definition-boundaries/check-browser.cjs'],['exchange','research/proof-atlas/binder-block-exchange/check-browser.cjs'],['corpus','research/proof-atlas/corpus-definition-boundaries/check-browser.cjs'],['references','research/proof-atlas/binder-support/check-browser.cjs']]){
 const file=path.resolve(script),original=fs.readFileSync(file,'utf8'),folder=temp+'/'+name+'/';fs.mkdirSync(folder);let code=original;
 for(const[needle,count]of[['base+file',2],["base+'failure.json'",1],["base+'failure.png'",1],["base+'browser-check.json.gz'",1]]){
  assert.equal(code.split(needle).length-1,count,needle);code=code.split(needle).join(JSON.stringify(folder)+(needle==='base+file'?'+file':needle.slice(4)));
 }
 const old=Object.fromEntries(fs.readdirSync(path.dirname(script)).filter(n=>/\.(gz|png)$/.test(n)).map(n=>[n,sha(fs.readFileSync(path.dirname(script)+'/'+n))]));
 cp.execFileSync(process.execPath,['-e',`const Module=require('module'),m=new Module(${JSON.stringify(file)});m.filename=${JSON.stringify(file)};m.paths=Module._nodeModulePaths(${JSON.stringify(path.dirname(file))});m._compile(${JSON.stringify(code)},${JSON.stringify(file)});`],{env:process.env,maxBuffer:8388608});
 for(const[n,h]of Object.entries(old))assert.equal(sha(fs.readFileSync(path.dirname(script)+'/'+n)),h,n);
 const bytes=fs.readFileSync(folder+'browser-check.json.gz'),r=JSON.parse(z.gunzipSync(bytes));assert.equal(r.status,'PASS');const output=base+name+'-browser.json.gz';fs.writeFileSync(output,bytes);
 const images={};for(const a of r.audits||[]){const f=base+'compat-'+name+'-'+a.file,image=fs.readFileSync(folder+a.file);assert.equal(sha(image),a.sha256);fs.writeFileSync(f,image);images[a.file]={file:f,sha256:sha(image)};}
 reports[name]={file:output,sha256:sha(bytes),images,originalChecker:script,originalCheckerSha256:sha(Buffer.from(original)),executionSha256:sha(Buffer.from(code)),outputPathsOnly:true};
}
const legacy='research/proof-atlas/corpus-definition-boundaries/check-pages.cjs',legacyPath=path.resolve(legacy),legacySource=fs.readFileSync(legacyPath,'utf8'),needle="base+'pages-check.json.gz'",legacyOutput=base+'legacy-pages-check.json.gz';
assert.equal(legacySource.split(needle).length-1,2);
const legacyCode=legacySource.split(needle).join(JSON.stringify(path.resolve(legacyOutput))),oldPages=fs.readFileSync(path.dirname(legacyPath)+'/pages-check.json.gz');
cp.execFileSync(process.execPath,['-e',`const Module=require('module'),m=new Module(${JSON.stringify(legacyPath)});m.filename=${JSON.stringify(legacyPath)};m.paths=Module._nodeModulePaths(${JSON.stringify(path.dirname(legacyPath))});m._compile(${JSON.stringify(legacyCode)},${JSON.stringify(legacyPath)});`],{env:process.env,maxBuffer:8388608});
assert(fs.readFileSync(path.dirname(legacyPath)+'/pages-check.json.gz').equals(oldPages));
const legacyBytes=fs.readFileSync(legacyOutput),legacyReport=JSON.parse(z.gunzipSync(legacyBytes));assert.equal(legacyReport.status,'PASS');assert.equal(legacyReport.cases,11);assert.equal(legacyReport.components,88);
const pageConsumer={file:legacyOutput,sha256:sha(legacyBytes),originalChecker:legacy,originalCheckerSha256:sha(Buffer.from(legacySource)),executionSha256:sha(Buffer.from(legacyCode)),outputPathsOnly:true};
for(const[name,script,filename]of [['boundary','research/proof-atlas/region-binding-ports/check-browser.cjs','browser-check.json.gz'],['fusion','research/proof-atlas/projection-substitution/check-production.cjs','production.json.gz']]){
 const file=path.resolve(script),original=fs.readFileSync(file,'utf8'),folder=temp+'/'+name+'/';fs.mkdirSync(folder);let code=original;
 if(name==='boundary'){const needle="output=dev?'/private/tmp/atlas-region-browser-dev/':base";assert.equal(code.split(needle).length-1,1);code=code.replace(needle,'output='+JSON.stringify(folder));}
 else {for(const[needle,count]of [['base+file',2],["base+'production.json.gz'",1]]){assert.equal(code.split(needle).length-1,count);code=code.split(needle).join(JSON.stringify(folder)+(needle==='base+file'?'+file':needle.slice(4)));}}
 const originalFolder=path.dirname(script),old=Object.fromEntries(fs.readdirSync(originalFolder).filter(n=>/\.(gz|png)$/.test(n)).map(n=>[n,sha(fs.readFileSync(originalFolder+'/'+n))]));
 cp.execFileSync(process.execPath,['-e',`const Module=require('module'),m=new Module(${JSON.stringify(file)});m.filename=${JSON.stringify(file)};m.paths=Module._nodeModulePaths(${JSON.stringify(path.dirname(file))});m._compile(${JSON.stringify(code)},${JSON.stringify(file)});`],{env:process.env,maxBuffer:8388608});
 for(const[n,h]of Object.entries(old))assert.equal(sha(fs.readFileSync(originalFolder+'/'+n)),h,n);
 const bytes=fs.readFileSync(folder+filename),r=JSON.parse(z.gunzipSync(bytes));assert.equal(r.status,'PASS');assert.equal(r.sourceOverride,false);const output=base+name+'-browser.json.gz';fs.writeFileSync(output,bytes);
 const images={};for(const a of r.audits||[]){const f=base+'compat-'+name+'-'+a.file,image=fs.readFileSync(folder+a.file);assert.equal(sha(image),a.sha256);fs.writeFileSync(f,image);images[a.file]={file:f,sha256:sha(image)};}
 reports[name]={file:output,sha256:sha(bytes),images,originalChecker:script,originalCheckerSha256:sha(Buffer.from(original)),executionSha256:sha(Buffer.from(code)),outputPathsOnly:true};
}
const result={format:'ProofAtlasRegionContextCompatibility/1',status:'PASS',reports,pageConsumer,checkerSha256:sha(fs.readFileSync(__filename)),scope:'Original authored, exchange, corpus, binder-reference, region-boundary and projection-law browser assertions on the actual current production build, plus the original component-page model checks. Only output paths redirected; frozen reports remain unchanged.'};
fs.writeFileSync(base+'compatibility.json.gz',z.gzipSync(Buffer.from(JSON.stringify(result,null,2)+'\n')));console.log(JSON.stringify(result));
