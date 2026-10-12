/* Actual subtree rendering, independent of UI. Display sugar is conservative;
   the full occurrence listing retains every node, payload, field and scope link. */
(function (host) {
 'use strict';
 function create(structure,terms){
  const N=structure.parent.length,children=Array.from({length:N},()=>[]);
  structure.parent.forEach((p,i)=>{if(p>=0)children[p].push(i);});
  const kind=i=>structure.kinds[Number(structure.kind[i])];
  const payload=i=>terms?.payloads?.[i]||{};
  const binderAt=new Map(structure.binder);
  const deps=new Map();for(const d of structure.deps)for(const i of d.uses)deps.set(i,d.name);
  const declarationKinds=new Map((terms?.declarations||[]).map(d=>[d.name,d.kind]));
  const complete=Boolean(terms&&terms.payloads?.length===N&&terms.rootPaths?.length===structure.roots.length);
  const fieldNames={app:['fn','arg'],lam:['domain','body'],forallE:['domain','body'],letE:['type','value','body'],mdata:['expr'],proj:['struct']};
  function path(i){const parts=[];let p;while((p=structure.parent[i])>=0){parts.unshift(fieldNames[kind(p)][children[p].indexOf(i)]);i=p;}return (terms?.rootPaths[structure.roots.indexOf(i)]||('root#'+i))+(parts.length?'.'+parts.join('.'):'');}
  function check(i){if(!Number.isInteger(i)||i<0||i>=N)throw RangeError('Invalid expression occurrence');}
  function binderName(i){const original=payload(i).binderName||payload(i).declName;return original?original.split('._@')[0]:'x'+i;}
  // Use globally distinct display names for shadowed binders. Preserve the
  // original compiler names in the full listing. Binding identity is the ID.
  const friendly=new Map();
  for(let i=0;i<N;i++)if(['lam','forallE','letE'].includes(kind(i))){
   const base=binderName(i),taken=new Set();let p=structure.parent[i];
   while(p>=0){if(friendly.has(p))taken.add(friendly.get(p));p=structure.parent[p];}
   friendly.set(i,taken.has(base)?base+'_'+i:base);
  }
  const name=i=>i===undefined?'unresolved binder':(friendly.get(i)||binderName(i));
  function level(l){if(!l)return '?u';switch(l.kind){case'zero':return'0';case'succ':return'('+level(l.of)+' + 1)';case'param':return l.name;case'mvar':return'?'+l.id;case'max':case'imax':return l.kind+' '+level(l.left)+' '+level(l.right);default:return'?level';}}
  function constant(i){return payload(i).name||(deps.get(i)==='Kernel/library declaration'?'constant#'+i:deps.get(i))||'constant#'+i;}
  function spine(i){const args=[];let head=i;while(kind(head)==='app'){const [f,a]=children[head];if(f===undefined||a===undefined)throw Error('Invalid application children');args.unshift(a);head=f;}return{head,args};}
  function literal(i){const p=payload(i);const nat=p.repr?.match(/^Lean\.Literal\.natVal (\d+)$/);return nat?nat[1]:p.repr?.replace(/^Lean\.Literal\.strVal /,'')||'literal#'+i;}
  const exactMemo=new Map(),readMemo=new Map();
  function format(i,readable=true){
   check(i);const cache=readable?readMemo:exactMemo;if(cache.has(i))return cache.get(i);
   const k=kind(i),p=payload(i),cs=children[i],f=j=>format(j,readable);let out;
   if(k==='const'){const us=p.levels||[];out=constant(i)+(!readable&&us.length?'.{'+us.map(level).join(', ')+'}':'');}
   else if(k==='bvar'){const b=binderAt.get(i);out=b!==undefined?name(b):'unbound#'+i;if(!readable)out='bvar '+(p.index??'?')+' ['+out+' @#'+b+']';}
   else if(k==='lit')out=literal(i);
   else if(k==='sort')out=p.level?.kind==='zero'?'Prop':'Sort '+level(p.level);
   else if(k==='fvar'||k==='mvar')out=(k==='mvar'?'?':'')+(p.id||k+'#'+i);
   else if(k==='app'){
    const {head,args}=spine(i),c=kind(head)==='const'?constant(head):null;
    const a=args.map(f);
    const binary={Eq:[3,'='],And:[2,'∧'],Or:[2,'∨'],'HAdd.hAdd':[6,'+'],'HMul.hMul':[6,'*'],'HSub.hSub':[6,'-'],'Sub.sub':[4,'-'],'HDiv.hDiv':[6,'/']};
    if(readable&&binary[c]&&args.length===binary[c][0])out='('+a[a.length-2]+' '+binary[c][1]+' '+a[a.length-1]+')';
    else if(readable&&c==='Neg.neg'&&args.length===3)out='(-'+a[2]+')';
    else if(readable&&c==='OfNat.ofNat'&&args.length===3&&kind(args[1])==='lit'&&/^\d+$/.test(literal(args[1])))out='('+literal(args[1])+' : '+a[0]+')';
    else if(readable&&c==='Int.cast'&&args.length===3)out='(↑'+a[2]+' : '+a[0]+')';
    else if(readable&&c==='Set.Icc'&&args.length===4)out='['+a[2]+', '+a[3]+']';
    else if(readable&&c==='Membership.mem'&&args.length===5)out='('+a[4]+' ∈ '+a[3]+')';
    else if(readable&&['Exists','ExistsUnique'].includes(c)&&args.length===2&&kind(args[1])==='lam'){
     const lam=args[1],lc=children[lam];out='('+(c==='Exists'?'∃':'∃!')+' '+name(lam)+' : '+format(lc[0],true)+', '+format(lc[1],true)+')';
    }else if(readable&&['CrossingData.branch','CrossingData.lo','CrossingData.hi','CrossingData.K','CrossingData.exists_branch','CrossingData.unique_branch'].includes(c)&&args.length>=1){out=a[0]+'.'+c.slice('CrossingData.'.length)+(a.length>1?' '+a.slice(1).join(' '):'');}
    else out='('+f(head)+(a.length?' '+a.join(' '):'')+')';
   }else if(k==='lam'||k==='forallE'){
    const x=name(i),domain=f(cs[0]),body=f(cs[1]);
    const delimiters={default:['(',')'],implicit:['{','}'],strictImplicit:['⦃','⦄'],instImplicit:['[',']']}[p.binderInfo||'default'];
    const binder=delimiters[0]+x+' : '+domain+delimiters[1];out=k==='lam'?'(fun '+binder+' =>\n  '+body+')':'(∀ '+binder+',\n  '+body+')';
   }else if(k==='letE')out='(let '+name(i)+' : '+f(cs[0])+' := '+f(cs[1])+';\n  '+f(cs[2])+')';
   else if(k==='mdata')out=readable?f(cs[0]):'mdata [annotation payload unavailable] ('+f(cs[0])+')';
   else if(k==='proj')out='proj['+p.typeName+', '+p.index+'] ('+f(cs[0])+')';
   else out=k+'#'+i;
   cache.set(i,out);return out;
  }
  function context(i){check(i);const result=[];let child=i,p=structure.parent[i];while(p>=0){const k=kind(p),slot=children[p].indexOf(child);if((k==='lam'||k==='forallE')&&slot===1||k==='letE'&&slot===2)result.push({id:p,name:name(p),original:payload(p).binderName||payload(p).declName,type:format(children[p][0])});child=p;p=structure.parent[p];}return result.reverse();}
  function describe(i){
   check(i);const k=kind(i),cs=children[i],p=payload(i);
   if(k==='app'){
    const {head,args}=spine(i),c=kind(head)==='const'?constant(head):null;
    const required={'Exists.casesOn':5,'And.casesOn':5,'Exists.intro':4,'And.intro':4,'CrossingData.exists_branch':2,'CrossingData.unique_branch':14};
    if(required[c]&&args.length<required[c])return 'Partial application of '+c+' with '+args.length+' supplied argument'+(args.length===1?'':'s')+'. The remaining arguments are supplied by enclosing application nodes.';
    if(c==='Eq'&&args.length===3)return 'This subtree states that '+format(args[1])+' equals '+format(args[2])+'. It is an equality proposition; this node alone is not its proof.';
    if(c==='ExistsUnique'&&args.length===2)return 'This subtree states that exactly one value satisfies '+format(args[1])+'.';
    if(c==='Exists'&&args.length===2)return 'This subtree asks for a witness satisfying '+format(args[1])+'.';
    if(c==='And'&&args.length===2)return 'Both conditions must hold: '+format(args[0])+'; and '+format(args[1])+'.';
    if(c==='Or'&&args.length===2)return 'At least one of these conditions must hold: '+format(args[0])+'; or '+format(args[1])+'.';
    if(c==='Exists.casesOn')return 'Unpack an existential witness and its evidence, then use the supplied continuation. The arguments below are the actual witness package, motive and continuation terms.';
    if(c==='And.casesOn')return 'Unpack a conjunction into its two pieces of evidence and continue with the supplied branch function.';
    if(c==='Exists.intro')return 'Package a witness together with evidence that it satisfies the predicate.';
    if(c==='And.intro')return 'Combine two supplied proofs into evidence for their conjunction.';
    if(c==='CrossingData.exists_branch')return 'Use the existence theorem for the supplied crossing data and phase. Its arguments are shown in this term.';
    if(c==='CrossingData.unique_branch')return 'Use the uniqueness theorem with the supplied branch witnesses and hypotheses.';
    return 'Apply '+(c||format(head))+' to '+args.length+' supplied argument'+(args.length===1?'':'s')+'. The text below renders this actual application.';
   }
   if(k==='lam')return 'Introduce '+name(i)+' of type '+format(cs[0])+', then construct the body shown below.';
   if(k==='forallE')return 'For every '+name(i)+' of type '+format(cs[0])+', the resulting type or proposition is '+format(cs[1])+'.';
   if(k==='bvar')return 'Use '+name(binderAt.get(i))+' from enclosing binder #'+binderAt.get(i)+'.';
   if(k==='const')return 'Reference '+constant(i)+(declarationKinds.has(constant(i))?', a Lean '+declarationKinds.get(constant(i)):'')+'.';
   if(k==='lit')return 'The actual literal value here is '+literal(i)+'.';
   if(k==='letE')return 'Define '+name(i)+' locally as '+format(cs[1])+', then evaluate the body in that scope.';
   if(k==='sort')return 'The universe of this type is '+format(i)+'.';
   if(k==='mdata')return 'Use the wrapped expression. Its metadata payload was not retained by this exporter.';
   if(k==='proj')return 'Select zero-based field '+p.index+' from '+p.typeName+' in '+format(cs[0])+'.';
   return 'An open '+k+' reference '+(p.id||'#'+i)+'.';
  }
  function rows(i){check(i);const out=[];const end=i+structure.size[i];const base=depth(i);for(let j=i;j<end;j++){const p=structure.parent[j],slot=p>=0?children[p].indexOf(j):-1;const roles={app:['function','argument'],lam:['domain','body'],forallE:['domain','body'],letE:['type','value','body'],mdata:['inner'],proj:['structure']};const role=j===i?'selected root':roles[kind(p)]?.[slot]||'child';const k=kind(j),v=payload(j);let label=k;if(k==='const')label+=' '+constant(j)+(v.levels?.length?'.{'+v.levels.map(level).join(', ')+'}':'');else if(k==='bvar')label+=' '+(v.index??'?')+' → '+name(binderAt.get(j))+' @#'+binderAt.get(j);else if(k==='lit')label+=' '+literal(j);else if(['lam','forallE','letE'].includes(k))label+=' '+name(j)+' ['+(v.binderInfo||v.nondep)+']';else if(k==='sort')label+=' '+level(v.level);else if(k==='fvar'||k==='mvar')label+=' '+v.id;else if(k==='proj')label+=' '+v.typeName+' ['+v.index+']';out.push({id:j,role,depth:depth(j)-base,label,payload:v,path:complete?path(j):null});}return out;}
  function depth(i){let d=0;while(structure.parent[i]>=0){i=structure.parent[i];d++;}return d;}
  return {complete,path,kind,payload,children,format,describe,context,rows,spine,constant,name,level};
 }
 const api={create};if(typeof module!=='undefined'&&module.exports)module.exports=api;else host.ProofAtlasTermReader=api;
})(typeof window==='undefined'?globalThis:window);
