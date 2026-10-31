'use strict';
const fs=require('fs'),path=require('path'),cp=require('child_process'),z=require('zlib'),crypto=require('crypto'),assert=require('assert/strict');
process.chdir(path.resolve(__dirname,'../../..'));
const base='research/proof-atlas/region-input-adapters/',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const temp=fs.mkdtempSync('/private/tmp/atlas-adapter-compat-'),reports={},screenshots={};
function run(script,args=[],env={}){
  cp.execFileSync(process.execPath,[script,...args],{env:{...process.env,...env},maxBuffer:4194304});
  console.log('PASS '+script);
}
function retain(file,name){
  const raw=file.endsWith('.gz')?z.gunzipSync(fs.readFileSync(file)):fs.readFileSync(file);
  assert.equal(JSON.parse(raw).status,'PASS');
  const output=base+name+'.json.gz';fs.writeFileSync(output,z.gzipSync(raw,{mtime:0}));
  reports[name]={file:output,sha256:sha(fs.readFileSync(output))};
}
function model(script,folder,name){
  const old=folder+'/model-check.json.gz',before=fs.readFileSync(old),output=temp+'/'+name+'.json.gz';
  run('-e',[
    `const fs=require('fs'),path=require('path'),write=fs.writeFileSync;
     fs.writeFileSync=function(file,...args){return write.call(this,path.resolve(String(file))===path.resolve(${JSON.stringify(old)})?${JSON.stringify(output)}:file,...args);};
     require('./'+${JSON.stringify(script)});`
  ]);
  assert(fs.readFileSync(old).equals(before),'Historical model report changed');retain(output,name);
}
function browser(script,oldBase,name,fixtures=[]){
  const output=temp+'/'+name+'/';fs.mkdirSync(output,{recursive:true});
  for(const file of fixtures)fs.copyFileSync('research/proof-atlas/dependent-region-inputs/'+file,output+file);
  // Substitute only this checker's output directory. Its original source
  // fingerprint, fixtures, assertions and runtime inputs remain unchanged.
  run('-e',[
    `const fs=require('fs'),path=require('path'),Module=require('module');
     const file=path.resolve(${JSON.stringify(script)}),source=fs.readFileSync(file,'utf8');
     const before=${JSON.stringify(oldBase)};if(source.split(before).length!==2)throw Error('Output-only redirect boundary changed');
     const scoped=new Module(file,module);scoped.filename=file;scoped.paths=Module._nodeModulePaths(path.dirname(file));
     scoped._compile(source.replace(before,'const base = '+${JSON.stringify(JSON.stringify(output))}+','),file);`
  ]);
  retain(output+'browser-check.json.gz',name);images(output,name);
}
function images(folder,name){
  for(const file of fs.readdirSync(folder).filter(file=>file.endsWith('.png'))){
    const target=base+name+'-'+file;fs.copyFileSync(path.join(folder,file),target);
    screenshots[target]=sha(fs.readFileSync(target));
  }
}
model('research/proof-atlas/region-function-pages/check.cjs','research/proof-atlas/region-function-pages','functions-model');
model('research/proof-atlas/dependent-region-inputs/check.cjs','research/proof-atlas/dependent-region-inputs','dependent-model');
model('research/proof-atlas/frontier-pages/check.cjs','research/proof-atlas/frontier-pages','frontier-model');
model('research/proof-atlas/region-composition-view/check-model.cjs','research/proof-atlas/region-composition-view','composition-model');
run('scripts/test-proof-atlas-application-ports.cjs',[],{ATLAS_APPLICATION_PORT_REPORT:temp+'/ports.json'});retain(temp+'/ports.json','ports-model');
run('scripts/test-proof-atlas-network-streaming.cjs',[],{ATLAS_NETWORK_STREAM_AUDIT:temp+'/network.json'});retain(temp+'/network.json','network-model');
browser('research/proof-atlas/region-function-pages/check-browser.cjs',"const base = 'research/proof-atlas/region-function-pages/',",'functions-browser');
browser('research/proof-atlas/dependent-region-inputs/check-browser.cjs',"const base='research/proof-atlas/dependent-region-inputs/',",'dependent-browser',['native.json.gz','model-check.json.gz','figure.json.gz']);
browser('research/proof-atlas/frontier-pages/check-browser.cjs',"const base='research/proof-atlas/frontier-pages/',",'frontier-browser');
run('research/proof-atlas/region-composition-view/check-browser.cjs',[temp+'/composition']);retain(temp+'/composition/browser-check.json','composition-browser');images(temp+'/composition','composition-browser');
run('scripts/test-proof-atlas-network-streaming-browser.cjs',[],{ATLAS_NETWORK_STREAM_SCREENSHOTS:temp+'/network'});retain(temp+'/network/audit.json','network-browser');images(temp+'/network','network-browser');
const report={format:'ProofAtlasRegionInputAdapterCompatibility/1',status:'PASS',reports,screenshots,
  checkerSha256:sha(fs.readFileSync(__filename)),
  scope:'Existing v1 application ports, paged source networks, region functions, source frontiers and output regrouping. Six model and five production-browser suites. Report/screenshot destinations change; dependent-browser fixture copies are byte-identical. Earlier reports remain historical. No fresh kernel evidence or comprehension claim.'};
fs.writeFileSync(base+'compatibility.json.gz',z.gzipSync(Buffer.from(JSON.stringify(report,null,2)+'\n'),{mtime:0}));
console.log(JSON.stringify({status:'PASS',reports:Object.keys(reports),temp}));
