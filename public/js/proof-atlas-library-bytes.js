/* Bounded byte-preserving transport; the historical JSON loader stays unchanged. */
(function(host){
 'use strict';
 const A=typeof module!=='undefined'&&module.exports?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
 async function compressedBytes(file,hash,options={}){
  const signal=options.signal,check=()=>{if(signal?.aborted)throw signal.reason||Error('Proof load cancelled');};check();
  const limit=options.maxBytes??67108864;
  if(!Number.isInteger(limit)||limit<1||limit>67108864)throw Error('Invalid proof asset byte bound');
  if(options.expectedBytes!==undefined&&(!Number.isInteger(options.expectedBytes)||options.expectedBytes<0||options.expectedBytes>limit))throw Error('Invalid expected proof asset size');
  const r=await fetch(file,signal?{signal}:undefined);if(!r.ok)throw Error('Proof asset unavailable: '+file+' ('+r.status+')');
  if(!host.DecompressionStream)throw Error('This browser needs gzip decompression support. The compressed term packet remains available.');
  const reader=r.body.pipeThrough(new DecompressionStream('gzip')).getReader(),chunks=[];let total=0,bytes;
  try{
   while(true){check();const part=await reader.read();if(part.done)break;total+=part.value.byteLength;if(total>limit)throw Error('Proof asset exceeds decoded byte bound');chunks.push(part.value);}
   check();bytes=new Uint8Array(total);let offset=0;for(const chunk of chunks){bytes.set(chunk,offset);offset+=chunk.byteLength;}
  }catch(error){await reader.cancel(error).catch(()=>{});throw error;}finally{reader.releaseLock();}
  if(options.expectedBytes!==undefined&&bytes.byteLength!==options.expectedBytes)throw Error('Proof asset decoded size mismatch');
  if(await A.digest(bytes)!==hash)throw Error('Proof asset SHA-256 mismatch: '+file);check();return bytes;
 }
 const api={compressedBytes};if(typeof module!=='undefined'&&module.exports)module.exports=api;else host.ProofAtlasLibraryBytes=api;
})(typeof window==='undefined'?globalThis:window);
