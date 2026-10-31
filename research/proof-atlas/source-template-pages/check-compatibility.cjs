'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/source-template-pages/',temp=fs.mkdtempSync('/private/tmp/atlas-template-compat-'),reports={},screenshots={},sha=b=>crypto.createHash('sha256').update(b).digest('hex');
function run(script,args=[]){cp.execFileSync(process.execPath,[script,...args],{maxBuffer:4194304});}
function retain(file,name){const raw=z.gunzipSync(fs.readFileSync(file));assert.equal(JSON.parse(raw).status,'PASS');const target=base+name+'.json.gz';fs.writeFileSync(target,z.gzipSync(raw,{mtime:0}));reports[name]={file:target,sha256:sha(fs.readFileSync(target))};console.log('PASS '+name);}
function model(script,old,name){const before=fs.readFileSync(old),output=temp+'/'+name+'.json.gz';run('-e',[`const fs=require('fs'),path=require('path'),write=fs.writeFileSync;
 fs.writeFileSync=function(file,...args){return write.call(this,path.resolve(String(file))===path.resolve(${JSON.stringify(old)})?${JSON.stringify(output)}:file,...args);};require('./'+${JSON.stringify(script)});`]);assert(fs.readFileSync(old).equals(before),'Historical report changed');retain(output,name);}
function browser(script,oldBase,name){const output=temp+'/'+name+'/';fs.mkdirSync(output);
 const before=fs.readFileSync(oldBase+'browser-check.json.gz');
 run('-e',[`const fs=require('fs'),path=require('path'),Module=require('module'),file=path.resolve(${JSON.stringify(script)});let source=fs.readFileSync(file,'utf8');
 const edits=[[/fs\\.writeFileSync\\(base\\s*\\+/g,'fs.writeFileSync('+${JSON.stringify(JSON.stringify(output))}+'+',2],
 [/screenshot\\(\\{\\s*path:\\s*base\\s*\\+/g,'screenshot({path:'+${JSON.stringify(JSON.stringify(output))}+'+',2],
 [/fs\\.readFileSync\\(base\\s*\\+\\s*file\\)/g,'fs.readFileSync('+${JSON.stringify(JSON.stringify(output))}+'+file)',1]];
 for(const[pattern,replacement,count]of edits){if([...source.matchAll(pattern)].length!==count)throw Error('Output-only boundary changed');source=source.replace(pattern,replacement);}
 const scoped=new Module(file,module);scoped.filename=file;scoped.paths=Module._nodeModulePaths(path.dirname(file));scoped._compile(source,file);`]);
 assert(fs.readFileSync(oldBase+'browser-check.json.gz').equals(before),'Historical browser report changed');retain(output+'browser-check.json.gz',name);
 for(const file of fs.readdirSync(output).filter(f=>f.endsWith('.png'))){const target=base+name+'-'+file;fs.copyFileSync(output+file,target);screenshots[target]=sha(fs.readFileSync(target));}
}
if(!process.argv.includes('--browsers-only')){
 model('research/proof-atlas/region-function-pages/check.cjs','research/proof-atlas/region-function-pages/model-check.json.gz','direct-model');
 model('research/proof-atlas/region-input-adapters/check-pages.cjs','research/proof-atlas/region-input-adapters/pages-check.json.gz','adapter-model');
 model('research/proof-atlas/dependent-region-inputs/check.cjs','research/proof-atlas/dependent-region-inputs/model-check.json.gz','dependent-model');
 model('research/proof-atlas/paged-type-notation/check.cjs','research/proof-atlas/paged-type-notation/model-check.json.gz','notation-model');
}
if(!process.argv.includes('--models-only')){
 browser('research/proof-atlas/region-function-pages/check-browser.cjs','research/proof-atlas/region-function-pages/','direct-browser');
 browser('research/proof-atlas/region-input-adapters/check-browser.cjs','research/proof-atlas/region-input-adapters/','adapter-browser');
 browser('research/proof-atlas/paged-type-notation/check-browser.cjs','research/proof-atlas/paged-type-notation/','notation-browser');
}
const name=process.argv.includes('--models-only')?'compatibility-models':process.argv.includes('--browsers-only')?'compatibility-browsers':'compatibility';
const report={format:'ProofAtlasSourceTemplatePageCompatibility/1',status:'PASS',reports,screenshots,checkerSha256:sha(fs.readFileSync(__filename)),scope:'Existing direct, dependent and adapter interfaces, plus recoverable notation. Checker assertions and fixture paths are unchanged; only report/screenshot writes and matching screenshot reads are redirected. Historical evidence remains unchanged. No new kernel judgments.'};
fs.writeFileSync(base+name+'.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n'),{mtime:0}));console.log(JSON.stringify({status:'PASS',reports:Object.keys(reports)}));
