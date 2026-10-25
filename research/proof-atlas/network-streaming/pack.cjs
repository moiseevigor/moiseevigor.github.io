/* SQLite-backed assembly: no in-memory array of all calls or reverse edges. */
'use strict';
const fs=require('fs'),z=require('zlib'),assert=require('assert/strict'),{DatabaseSync}=require('node:sqlite'),S=require('../application-ports/store.cjs');
const directory='public/data/proof-atlas/network-streaming';
const encode=x=>Buffer.from(JSON.stringify(x));
function store(value){const bytes=encode(value);assert(bytes.length<=2097152,'decoded network page limit');return S.store(directory,bytes);}
function tree(kind,scope,iterator){const size=kind==='calls'?4:32,levels=[];let rows=[],first=0;
  function push(p,level){levels[level]??=[];levels[level].push(p);if(levels[level].length===32){const children=levels[level];levels[level]=[];push(branch(children),level+1);}}
  function branch(children){const first=children[0].first,count=children.reduce((n,c)=>n+c.count,0),level=children[0].level+1;const asset=store({format:'ProofAtlasNetworkRankPage/1',kind,scope,first,count,level,children});assert(asset.bytes<=16384);return{...asset,first,count,level};}
  function flush(){if(!rows.length)return;const count=rows.length,asset=store({format:'ProofAtlasNetworkRankPage/1',kind,scope,first,count,level:0,rows});push({...asset,first,count,level:0},0);first+=count;rows=[];}
  for(const row of iterator){rows.push(row);if(rows.length===size)flush();}flush();
  if(!first)return null;
  // Final partial groups rise until exactly one root remains.
  for(let level=0;level<levels.length;level++){const group=levels[level]||[];if(!group.length)continue;const above=levels.slice(level+1).some(g=>g?.length);if(!above&&group.length===1)return group[0];levels[level]=[];push(branch(group),level+1);}
  throw Error('Network tree root not assembled');
}
function database(file){const db=new DatabaseSync(file);db.exec('PRAGMA journal_mode=DELETE; PRAGMA cache_size=-16384; PRAGMA temp_store=FILE; CREATE TABLE calls(id INTEGER PRIMARY KEY, route TEXT UNIQUE, node INTEGER, payload TEXT); CREATE TABLE edges(producer INTEGER, consumer INTEGER, slot INTEGER, ordinal INTEGER, PRIMARY KEY(consumer,slot)); CREATE INDEX edge_order ON edges(producer,consumer,slot);');return db;}
function pack(db,meta){
  const count=db.prepare('SELECT COUNT(*) n FROM calls').get().n;assert(count>0&&count<=1000000000);
  const ordering=db.prepare('SELECT producer,consumer,slot FROM edges WHERE (producer,consumer,slot)>(?,?,?) ORDER BY producer,consumer,slot LIMIT 256');
  let ordinal=0,last=[-1,-1,-1];const update=db.prepare('UPDATE edges SET ordinal=? WHERE consumer=? AND slot=?');db.exec('BEGIN');
  for(;;){const batch=ordering.all(...last);if(!batch.length)break;for(const e of batch){update.run(ordinal++,e.consumer,e.slot);last=[e.producer,e.consumer,e.slot];}}
  db.exec('COMMIT');db.exec('CREATE UNIQUE INDEX edge_ordinal ON edges(ordinal)');
  const scope=S.sha(encode(meta)),edgeAt=db.prepare('SELECT ordinal FROM edges WHERE consumer=? AND slot=?'),out=db.prepare('SELECT MIN(ordinal) start, COUNT(*) count FROM edges WHERE producer=?');
  const callRows=db.prepare('SELECT id,payload FROM calls WHERE id=?'),edgeRows=db.prepare('SELECT producer,consumer,slot,ordinal FROM edges WHERE ordinal=?');
  let ports=0,unknown=0,maxCallBytes=0;
  function* calls(){for(let id=0;id<count;id++){const stored=callRows.get(id),c=JSON.parse(stored.payload),degree=out.get(c.index);c.outStart=degree.count?degree.start:0;c.outCount=degree.count;for(const p of c.ports){ports++;if(p.knownProducer===null){unknown++;p.outOrdinal=null;}else p.outOrdinal=edgeAt.get(c.index,p.slot).ordinal;}maxCallBytes=Math.max(maxCallBytes,encode(c).length);assert(encode(c).length<=262144,'single retained call bound');yield c;}}
  const callRoot=tree('calls',scope,calls()),load=db.prepare('SELECT payload FROM calls WHERE id=?');
  function* edges(){for(let rank=0;rank<ordinal;rank++){const e=edgeRows.get(rank),call=JSON.parse(load.get(e.consumer).payload),p=call.ports[e.slot];yield{from:e.producer,to:e.consumer,slot:e.slot,ordinal:e.ordinal,input:p.input,producer:p.producer,role:p.role,visibility:p.visibility,hops:p.hops.length};}}
  const outgoingRoot=tree('outgoing',scope,edges());assert.equal(ports,ordinal+unknown);
  const header={format:'ProofAtlasPagedNetwork/1',scope,...meta,counts:{calls:count,ports,known:ordinal,unrecorded:unknown},callRoot,outgoingRoot};
  const pages=store(header);assert(pages.bytes<=65536,'header bound');return{pages,scope,counts:header.counts,maxCallBytes};
}
function read(d){const bytes=z.gunzipSync(fs.readFileSync('.'+d.file));assert.equal(S.sha(bytes),d.sha256);return JSON.parse(bytes);}
module.exports={database,pack,read,store,sha:S.sha,encode};
