// Discover a compiled application without fetching a declaration-wide expression index.
'use strict';
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { DatabaseSync } = require('node:sqlite');
const { gunzipSync } = require('node:zlib');
const { createHash } = require('node:crypto');
const pages = require('../../../public/js/proof-atlas-source-pages');
const atlas = require('../../../public/js/proof-atlas-library-data');
const { spine } = require('../../../public/js/proof-atlas-elimination');
const { inventory } = require('../../../scripts/proof-atlas-judgment-fixtures.cjs');

async function discover(descriptor, record, db) {
 const directory = path.posix.dirname(descriptor.file) + '/';
 const cursor = await pages.open(descriptor, record, {pageLimit:1,indexLimit:1,fetcher:async file=>{
  assert(file.startsWith(directory));
  return new Response(fs.readFileSync('.'+file));
 }});
 try {
  const data=cursor.data, root=data.roots[1];
  assert(Number.isInteger(root));
  db.exec('CREATE TABLE reach(id INTEGER PRIMARY KEY, parent INTEGER, slot INTEGER); CREATE TABLE applications(id INTEGER PRIMARY KEY, arity INTEGER)');
  const reach=db.prepare('INSERT OR IGNORE INTO reach VALUES(?,?,?)');
  const parent=db.prepare('SELECT parent,slot FROM reach WHERE id=?');
  const add=db.prepare('INSERT INTO applications VALUES(?,?)');
  const arity=db.prepare('SELECT arity FROM applications WHERE id=?');
  const read=id=>cursor.run(()=>({kind:data.kind[id],children:data.children[id],name:data.payloads[id].name}));
  db.exec('BEGIN');
  reach.run(root,null,null);
  // Children precede their parents. The first incoming edge gives one exact proof route.
  for(let id=root;id>=0;id--){
   if(!parent.get(id))continue;
   const row=await read(id);
   row.children.forEach((child,slot)=>reach.run(child,id,slot));
  }
  // Track only prefixes of the selected constant, through its required arity.
  for(let id=0;id<=root;id++){
   if(!parent.get(id))continue;
   const row=await read(id);
   if(row.kind===4 && row.name==='congrArg')add.run(id,0);
   if(row.kind!==5)continue;
   const prefix=arity.get(row.children[0]);
   if(prefix && prefix.arity<6)add.run(id,prefix.arity+1);
  }
  db.exec('COMMIT');
  const state=cursor.state();
  assert(state.peakCachedNodes<=256 && state.indexPages<=1);
  return {loads:state.pageLoads,peak:state.peakCachedNodes,root};
 }finally{cursor.dispose();}
}

function* matches(db,root){
 const parent=db.prepare('SELECT parent,slot FROM reach WHERE id=?');
 const next=db.prepare('SELECT id FROM applications WHERE arity=6 AND id>? ORDER BY id LIMIT 1');
 let last=-1;
 while(true){
  const match=next.get(last);
  if(!match)return;
  const id=match.id;
  last=id;
  let node=id;
  const slots=[];
  while(node!==root){
   const edge=parent.get(node);
   assert(edge.parent>node);
   slots.push(edge.slot);
   node=edge.parent;
  }
  yield {node:id,route:{root:1,slots:slots.reverse()}};
 }
}

async function main(){
 const window={};
 require('node:vm').runInNewContext(fs.readFileSync('public/data/proof-atlas/source-pages-manifest.js','utf8'),{window});
 require('node:vm').runInNewContext(fs.readFileSync('public/data/proof-atlas/type-notation-catalog.js','utf8'),{window});
 require('node:vm').runInNewContext(fs.readFileSync('public/data/proof-atlas/article-proof-steps.js','utf8'),{window});
 const article=window.PROOF_ATLAS_PROOF_STEPS;
 const items=inventory();
 const args=process.argv.slice(2);
 const output='public/data/proof-atlas/substitution-routes.json';
 const build=args.length===1 && args[0]==='--build';
 const catalog=[];
 const lookup=args.length>0 && !build;
 if(lookup && (args[0]!=='--proof' || args.length!==3))throw Error('Usage: --proof EDITION DECLARATION');
 const descriptors=window.PROOF_ATLAS_SOURCE_PAGES.records.filter(d=>!lookup || (d.edition===args[1] && d.name===args[2]));
 if(!descriptors.length)throw Error('No paged source for this declaration and edition');
 const results=[];
 for(const descriptor of descriptors){
  const {record}=items.find(i=>i.edition===descriptor.edition && i.record.indexSha256===descriptor.indexSha256);
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'atlas-discovery-'));
  const db=new DatabaseSync(path.join(dir,'search.db'));
  try{
   db.exec('PRAGMA cache_size=-512; PRAGMA mmap_size=0');
   const stats=await discover(descriptor,record,db);
   if(lookup){
    let count=0;
    for(const {node,route} of matches(db,stats.root)){
     const query=new URLSearchParams({edition:descriptor.edition,proof:descriptor.name,loading:'paged',route:'1:'+route.slots.join('.')});
     console.log('/projects/proof-atlas/library/?'+query+'#expr-'+node);
     count++;
    }
    console.error(count+' distinct matching rows');
    continue;
   }
   // Only the independent comparison below reads the complete index.
   const raw=gunzipSync(fs.readFileSync('.'+record.indexFile));
   assert.equal(createHash('sha256').update(raw).digest('hex'),descriptor.indexSha256);
   const data=atlas.validateIndex(JSON.parse(raw),record);
   const seen=new Set(),expected=new Set(),stack=[data.roots[1]];
   while(stack.length){
    const id=stack.pop();
    if(seen.has(id))continue;
    seen.add(id);
    if(data.kind[id]===5){
     const call=spine(data,id);
     if(data.kind[call.head]===4 && data.payloads[call.head].name==='congrArg' && call.args.length===6)expected.add(id);
    }
    stack.push(...data.children[id]);
   }
   const reviewed=new Map();
   if(descriptor.edition===article.edition && article.packets.some(p=>p.name===record.name &&
    p.indexSha256===record.indexSha256 && p.sourceSha256===record.sourceSha256)){
    for(const a of article.anchors.filter(a=>a.declaration===record.name && a.scope==='proof' && a.role==='call')){
     const group=reviewed.get(a.path)??[];
     group.push(a);reviewed.set(a.path,group);
    }
   }
   const entries=[];
   let count=0;
   for(const {node,route} of matches(db,stats.root)){
    assert(expected.delete(node));
    assert.equal(atlas.walk(data,route),node);
    const fn=spine(data,node).args[4],kind=atlas.kinds[data.kind[fn]];
    let term=kind==='lam'?data.children[fn][1]:fn;
    while(data.kind[term]===10)term=data.children[term][0];
    const {head,args}=spine(data,term);
    const payload=data.payloads[head];
    const op=data.kind[head]===4 && window.PROOF_ATLAS_TYPE_NOTATION.entries.find(e=>e.name===payload.name &&
     JSON.stringify(e.nameParts)===JSON.stringify(payload.nameParts) && e.levelParams.length===payload.levels.length &&
     e.arity===args.length+(kind==='app'?1:0));
    const rawName=data.kind[head]===4?payload.name:atlas.kinds[data.kind[head]];
    const name=op && op.glyph!==rawName?op.glyph+' ('+rawName+')':rawName;
    const label=kind==='lam'?'Lambda body headed by '+name:kind==='app'?'Partial application of '+name:'Function '+name;
    const annotations=reviewed.get(atlas.path(data,route)+'.arg')??[];
    const notes=annotations.map(a=>{
     assert.equal(a.node,data.children[node][1]);
     assert.equal(data.payloads[spine(data,a.node).head].name,a.callee);
     const passage=article.passages.find(p=>p.id===a.step);
     assert(passage);
     return 'Premise '+a.callee+' · '+passage.title;
    });
    const links=[];
    const premise={root:route.root,slots:route.slots.concat(1)};
    const binder=atlas.binding(data,premise);
    if(binder && data.kind[binder.node]===8){
     const value={root:binder.route.root,slots:binder.route.slots.concat(1)};
     const valuePath=atlas.path(data,value),local=data.payloads[binder.node].declName;
     for(const [path,anchors] of reviewed){
      if(path!==valuePath && !path.startsWith(valuePath+'.'))continue;
      let id=atlas.walk(data,value);
      const slots=value.slots.slice();
      for(const field of path.slice(valuePath.length).split('.').filter(Boolean)){
       const slot=atlas.fields[atlas.kinds[data.kind[id]]].indexOf(field);
       assert(slot>=0);slots.push(slot);id=data.children[id][slot];
      }
      for(const a of anchors){
       assert.equal(id,a.node);assert.equal(data.payloads[spine(data,id).head].name,a.callee);
       notes.push('Premise '+local+' · definition contains '+a.callee);
       if(!links.length)links.push(['Definition of '+local,atlas.walk(data,value),value.slots.join('')]);
       links.push([a.callee,id,slots.join('')]);
      }
     }
    }
    const entry=[node,route.slots.join(''),notes.concat(label).join(' · ')];
    if(links.length)entry.push(links);
    entries.push(entry);
    count++;
   }
   catalog.push({edition:descriptor.edition,name:record.name,indexSha256:record.indexSha256,sourceSha256:record.sourceSha256,entries});
   assert.equal(expected.size,0);
   assert.equal(db.prepare('SELECT count(*) AS n FROM reach').get().n,seen.size);
   results.push({name:record.name,edition:descriptor.edition,rows:record.uniqueNodes,count,loads:stats.loads,peak:stats.peak,
    databaseBytes:fs.statSync(path.join(dir,'search.db')).size});
  }finally{db.close();fs.rmSync(dir,{recursive:true,force:true});}
 }
 if(lookup)return;
 const encoded=JSON.stringify({format:'ProofAtlasSubstitutionRoutes/1',records:catalog})+'\n';
 if(build)fs.writeFileSync(output,encoded);
 else assert.equal(fs.readFileSync(output,'utf8'),encoded,'published substitution routes differ from checked sources');
 console.table(results);
 console.log('Packets:',results.length,'with matches:',results.filter(r=>r.count).length,'distinct matching rows across packets:',results.reduce((n,r)=>n+r.count,0));
}
main().catch(error=>{console.error(error);process.exitCode=1;});
