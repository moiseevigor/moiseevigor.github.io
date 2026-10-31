'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/expr-reference-laws/',sha=b=>crypto.createHash('sha256').update(b).digest('hex'),temp=fs.mkdtempSync('/private/tmp/atlas-binder-support-compat-'),reports={};
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
const result={format:'ProofAtlasExprReferenceCompatibility/1',status:'PASS',reports,checkerSha256:sha(fs.readFileSync(__filename)),scope:'Original authored, exchange, corpus and binder-reference browser assertions on the actual current production build. Only output paths redirected; frozen reports remain unchanged.'};
fs.writeFileSync(base+'compatibility.json.gz',z.gzipSync(Buffer.from(JSON.stringify(result,null,2)+'\n')));console.log(JSON.stringify(result));
