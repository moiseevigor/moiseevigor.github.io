/* Hash-addressed rank lookup with one leaf and two branch records per cursor. */
(function(host){
  'use strict';
  const node=typeof module!=='undefined'&&module.exports;
  const A=node?require('./proof-atlas-library-data'):host.ProofAtlasLibraryData;
  const demand=(ok,m)=>{if(!ok)throw Error('Network page store: '+m);};
  const integer=n=>Number.isSafeInteger(n)&&n>=0;
  const hash=s=>typeof s==='string'&&/^[a-f0-9]{64}$/.test(s);
  const directory='/public/data/proof-atlas/network-streaming/';
  function reference(p){demand(p&&hash(p.sha256)&&p.file===directory+p.sha256+'.json.gz'&&integer(p.bytes)&&p.bytes>0&&p.bytes<=2097152&&integer(p.first)&&integer(p.count)&&p.count>0&&integer(p.level)&&p.level<=8,'bounded content address');return p;}
  function open(root,kind,scope,options={}){
    const size=kind==='calls'?4:32;
    demand(['calls','outgoing'].includes(kind)&&hash(scope),'tree identity');if(root)reference(root);
    const branches=new Map();let leaf=null,disposed=false,loads=0,peakLeafRows=0,peakLeafBytes=0,peakBranches=0;
    function live(signal){demand(!disposed,'disposed');if(signal?.aborted)throw signal.reason||Error('Network load cancelled');}
    async function read(p,signal){live(signal);const entry=p.level===0?leaf?.hash===p.sha256?leaf:null:branches.get(p.sha256);reference(p);if(entry){const cached=entry.row;demand(entry.bytes===p.bytes&&cached.kind===kind&&cached.scope===scope&&cached.first===p.first&&cached.count===p.count&&cached.level===p.level,'cached page range identity');return cached;}
      const row=await A.compressed(p.file,p.sha256,{expectedBytes:p.bytes,maxBytes:p.level===0?2097152:16384,signal});live(signal);loads++;
      demand(row.format==='ProofAtlasNetworkRankPage/1'&&row.kind===kind&&row.scope===scope&&row.first===p.first&&row.count===p.count&&row.level===p.level,'page ownership and range');
      if(p.level===0){demand(Array.isArray(row.rows)&&row.rows.length===p.count&&p.count<=size&&p.first%size===0&&!row.children,'leaf range');leaf={hash:p.sha256,row,bytes:p.bytes};peakLeafRows=Math.max(peakLeafRows,p.count);peakLeafBytes=Math.max(peakLeafBytes,p.bytes);}
      else {demand(Array.isArray(row.children)&&row.children.length>0&&row.children.length<=32&&!row.rows,'branch fanout');let first=p.first;for(const child of row.children){reference(child);demand(child.level===p.level-1&&child.first===first,'contiguous child ranges');first+=child.count;}demand(first===p.first+p.count,'complete branch range');branches.delete(p.sha256);branches.set(p.sha256,{row,bytes:p.bytes});while(branches.size>2)branches.delete(branches.keys().next().value);peakBranches=Math.max(peakBranches,branches.size);}
      return row;
    }
    async function get(index,signal){live(signal);demand(root&&integer(index)&&index<root.count,'rank outside inventory');let p=root;for(let depth=0;depth<=8;depth++){const row=await read(p,signal);if(p.level===0)return row.rows[index-p.first];p=row.children.find(c=>index>=c.first&&index<c.first+c.count);demand(p,'missing rank');}throw Error('Network page store: depth bound');}
    function dispose(){disposed=true;leaf=null;branches.clear();}
    const state=()=>({disposed,leafRows:leaf?.row.rows.length||0,branchRecords:branches.size,leafLimit:size,branchLimit:2,loads,peakLeafRows,peakLeafBytes,peakBranches});
    return Object.freeze({get,state,dispose});
  }
  const api={reference,open};if(node)module.exports=api;else host.ProofAtlasNetworkPageStore=api;
})(typeof window==='undefined'?globalThis:window);
