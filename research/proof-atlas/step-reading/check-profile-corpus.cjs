// Repeat the prescribed first/middle/last session on every available AI theorem.
'use strict';
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),cp=require('node:child_process');
global.window={};
require('../../../public/data/proof-atlas/goedel-sample-manifest');
const edition=window.PROOF_ATLAS_AI_SAMPLE.edition,rows=[];
const dir=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-profile-census-'));
const weights=path.join(dir,'weights.json'),oracle=path.join(dir,'oracle.json');
const run=(file,args)=>cp.execFileSync(process.execPath,[path.join(__dirname,file),...args],{encoding:'utf8'});
try{
 for(const d of edition.declarations.filter(x=>x.kind==='theorem'&&x.bodyAvailable)){
  run('index-ai-binders.cjs',[weights,oracle,d.name]);
  const report=JSON.parse(run('check-profile-session.cjs',[weights,oracle]));
  const last=report.series.at(-1);
  if(!last)throw Error('No reference queries for '+d.name);
  rows.push({name:d.name,indexSha256:d.indexSha256,nodes:d.uniqueNodes,queries:last.query,
   full:report.full,auxiliary:report.packedGzip,first:report.series[0].bytes,
   cached:last.uniqueBytes,uncached:last.bytes});
 }
}finally{fs.rmSync(dir,{recursive:true,force:true});}
console.log(JSON.stringify({edition:edition.id,rows},null,2));
