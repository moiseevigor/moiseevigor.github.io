/* Centered prose by default; source-bound statement lines and correspondence graphs on demand. */
(function(){
 'use strict';
 const paper=document.querySelector('.pa-paper'),toolbar=document.querySelector('.pa-reading-toolbar');
 if(!paper||!toolbar)return;
 const status=document.getElementById('pa-reading-status');
 let requested='article',prepared=false,loading=null,graphFrame=0;
 const graphRows=[];
 const element=(tag,cls,text)=>{const n=document.createElement(tag);if(cls)n.className=cls;if(text!==undefined)n.textContent=text;return n;};
 function accessibleScrollRegions(){
  paper.querySelectorAll('.katex-display,table').forEach(n=>{
   if(n.scrollWidth>n.clientWidth+1){n.tabIndex=0;n.setAttribute('role','region');n.setAttribute('aria-label',n.matches('table')?'Scrollable article table':'Scrollable mathematical formula');}
   else{n.removeAttribute('tabindex');n.removeAttribute('role');n.removeAttribute('aria-label');}
  });
 }
 function highlightPair(id,name){
  paper.querySelectorAll('.pa-linked-active').forEach(n=>n.classList.remove('pa-linked-active'));
  document.getElementById(id)?.classList.add('pa-linked-active');
  paper.querySelectorAll('[data-lean-passage]').forEach(n=>{
   if(n.dataset.leanPassage===id&&(!name||!n.dataset.leanName||n.dataset.leanName===name))n.classList.add('pa-linked-active');
  });
 }
 async function reveal(){
  let id;try{id=decodeURIComponent(location.hash.slice(1));}catch(_){return;}
  const target=document.getElementById(id);if(!target)return;
  for(let parent=target.parentElement;parent&&parent!==paper;parent=parent.parentElement){if(parent.tagName==='DETAILS')parent.open=true;}
  if(document.fonts)await document.fonts.ready;
  paper.querySelectorAll('.pa-paper-highlight').forEach(n=>n.classList.remove('pa-paper-highlight'));
  const block=id.startsWith('passage-')||id.startsWith('lean-')?target:target.closest('p,.lemma,.theorem,.remark,table')||target;
  const counterpart=target.dataset.leanPassage||id;
  block.classList.add('pa-paper-highlight');block.tabIndex=requested==='compare'&&id.startsWith('passage-')?0:-1;
  highlightPair(counterpart);
  requestAnimationFrame(()=>{target.scrollIntoView({block:'center'});block.focus({preventScroll:true});});
 }
 function loadScript(src){
  return new Promise((resolve,reject)=>{const n=document.createElement('script');n.src=src;n.onload=resolve;n.onerror=()=>{n.remove();reject(Error('Comparison data could not be loaded. Select Article + Lean to try again.'));};document.head.append(n);});
 }
 function libraryUrl(name){return '/projects/proof-atlas/library/?edition=published-15&proof='+encodeURIComponent(name);}
 function graphUrl(d,passage){return d.proofUrl||((d.termGraph===false&&window.PROOF_ATLAS_LIBRARY?.editions[0].declarations.some(n=>n.name===d.name))?libraryUrl(d.name):d.termGraph===false?'#lean-'+passage.id+'-'+encodeURIComponent(d.name):'/projects/proof-atlas/app/#decl-'+encodeURIComponent(d.short));}
 function drawGraphs(){
  cancelAnimationFrame(graphFrame);graphFrame=requestAnimationFrame(()=>{
   const ns='http://www.w3.org/2000/svg';
   for(const entry of graphRows){
    const lane=entry.row.querySelector('.pa-row-connections');if(getComputedStyle(lane).display==='none')continue;
    const bounds=lane.getBoundingClientRect(),height=entry.row.getBoundingClientRect().height;
    const svg=document.createElementNS(ns,'svg');svg.setAttribute('viewBox','0 0 180 '+height);svg.setAttribute('role','group');svg.setAttribute('aria-label','Curated connections from these article passages to the adjacent Lean statements');
    const title=document.createElementNS(ns,'title');title.textContent='Article to Lean correspondence. These connections link whole statements and are not proof dependencies.';svg.append(title);
    const text=(x,y,value)=>{const n=document.createElementNS(ns,'text');n.setAttribute('x',x);n.setAttribute('y',y);n.textContent=value;return n;};
    svg.append(text(14,18,'Article → Lean'));
    for(const {passage,headers}of entry.passages){
     const target=document.getElementById(passage.htmlAnchor).getBoundingClientRect();
     const origin=(target.top+target.bottom)/2-bounds.top;
     for(const d of headers){
      const statement=[...entry.row.querySelectorAll('.pa-lean-statement,.pa-source-proof')].find(n=>n.dataset.leanName===d.name);if(!statement)continue;
      const position=statement.getBoundingClientRect();if(!position.height)continue;const y=(position.top+position.bottom)/2-bounds.top;
      const path=document.createElementNS(ns,'path');path.setAttribute('d','M 2 '+origin+' C 23 '+origin+', 23 '+y+', 34 '+y+' M 147 '+y+' L 179 '+y);svg.append(path);
      const link=document.createElementNS(ns,'a');link.setAttribute('href',graphUrl(d,passage));link.setAttribute('aria-label','Open '+d.short+(d.termGraph===false?' source statement':' in proof graph'));link.dataset.leanPassage=passage.htmlAnchor;link.dataset.leanName=d.name;
      const rect=document.createElementNS(ns,'rect');rect.setAttribute('x',34);rect.setAttribute('y',y-16);rect.setAttribute('width',113);rect.setAttribute('height',32);rect.setAttribute('rx',3);const short=d.short.length>17?d.short.slice(0,14)+'…':d.short;link.append(rect,text(40,y+4,short));svg.append(link);
      link.addEventListener('mouseenter',()=>highlightPair(passage.htmlAnchor,d.name));link.addEventListener('focus',()=>highlightPair(passage.htmlAnchor,d.name));
     }
    }
    lane.replaceChildren(svg);
   }
  });
 }
 function statement(d,passage){
  const block=element('section','pa-lean-statement');block.dataset.leanPassage=passage.htmlAnchor;block.dataset.leanName=d.name;if(d.termGraph===false)block.id='lean-'+passage.id+'-'+d.name;
  const label=element('h4','',d.name);block.append(label);
  if(d.module)block.append(element('p','pa-lean-context',d.module+'.lean · kernel check passed · statement header only'));
  const code=element('div','pa-lean-lines');code.setAttribute('aria-label',d.short+' statement source lines');
  for(const line of d.lines){
   const link=element('a','pa-lean-line');link.href=d.termGraph===false?'#lean-'+passage.id+'-'+encodeURIComponent(d.name):graphUrl(d,passage);link.dataset.sourceLine=line.number;
   link.title=(d.module||'Crossing')+'.lean line '+line.number+' · '+(d.termGraph===false?'view statement source':'open in the proof graph');
   const number=element('span','pa-lean-number',line.number);number.setAttribute('aria-hidden','true');
   link.setAttribute('aria-label','Open '+d.short+(d.termGraph===false?' statement source':' in proof graph')+' · line '+line.number+': '+line.text);link.append(number,element('code','',line.text));code.append(link);
   link.addEventListener('mouseenter',()=>highlightPair(passage.htmlAnchor,d.name));link.addEventListener('focus',()=>highlightPair(passage.htmlAnchor,d.name));
  }
  block.append(code);
  const complete=element('a','pa-proof-open','Open complete declaration and proof ↗');complete.href=libraryUrl(d.name);block.append(complete);
  return block;
 }
 async function prepare(){
  if(prepared)return;
  await Promise.all([
   window.PROOF_ATLAS_ARTICLE_INDEX?null:loadScript('/public/data/proof-atlas/crossing-article-index.js?v=2'),
   window.PROOF_ATLAS_DECLARATIONS?null:loadScript('/public/data/proof-atlas/crossing-declarations.js'),
   window.PROOF_ATLAS_ARTICLE_LINES?null:loadScript('/public/data/proof-atlas/crossing-article-lines.js?v=1'),
   window.PROOF_ATLAS_ARTICLE_COVERAGE?null:loadScript('/public/data/proof-atlas/article-coverage.js?v=1'),
   window.PROOF_ATLAS_LIBRARY?null:loadScript('/public/data/proof-atlas/library-manifest.js'),
   window.ProofAtlasLibraryData?null:loadScript('/public/js/proof-atlas-library-data.js')
  ]);
  const index=window.PROOF_ATLAS_ARTICLE_INDEX,data=window.PROOF_ATLAS_ARTICLE_LINES,declarations=window.PROOF_ATLAS_DECLARATIONS;
  const coverage=window.PROOF_ATLAS_ARTICLE_COVERAGE;
  const byName=new Map(data.declarations.map(d=>[d.name,d])),published=new Map(declarations.nodes.map(d=>[d.name,d]));
  const normalize=s=>s.trim().replace(/\s+/g,' ');
  const valid=data.format==='ProofAtlasArticleLines/1'&&data.articleSha256===paper.dataset.sourceSha256&&index.source.sha256===data.articleSha256&&index.passages.every(p=>document.getElementById(p.htmlAnchor)&&p.declarations.every(name=>{
   const d=byName.get(name),original=published.get(name);return d&&original&&d.lines[0].number===original.line&&d.lines.every((l,i)=>l.number===original.line+i)&&normalize(d.lines.map(l=>l.text).join(' '))===normalize(original.kind+' '+original.statement);
  }));
  const coverageValid=coverage.format==='ProofAtlasArticleCoverage/1'&&coverage.articleSha256===paper.dataset.sourceSha256&&coverage.statements.length===9&&coverage.statements.every(r=>document.getElementById(r.htmlAnchor)&&['partial','not-formalized'].includes(r.status)&&r.declarations.every(d=>coverage.declarations.some(n=>n.name===d.name&&n.kernelCheck==='PASS')))&&coverage.declarations.every(d=>d.lines.length&&d.lines.every((l,i)=>l.number===d.lines[0].number+i)&&d.axioms.every(a=>['propext','Classical.choice','Quot.sound'].includes(a)));
  if(!valid||!coverageValid)throw Error('Comparison data do not match this article and its published Lean statements. The article remains available.');
  const note=element('div','pa-comparison-note');
  note.append(element('p','','All nine numbered statements audited: five have partial, conditional Lean counterparts; four remain unformalized. Source lines are statement headers, not a certification of every article sentence.'));
  const library=window.PROOF_ATLAS_LIBRARY.editions.find(e=>e.id==='published-15');
  note.append(element('p','pa-lean-context','Published 7 October snapshot · '+library.counts.declarations+' compiled declarations, '+library.counts.theorems+' theorem proofs and every available body now have complete compiled term graphs. All six article proof blocks are indexed below. The article’s unformalized clauses remain explicitly marked.'));
  const jump=element('a','','Browse statement coverage ↓');jump.href='#pa-statement-coverage';note.append(jump);paper.prepend(note);
  const inventory=element('section','pa-coverage-inventory');inventory.id='pa-statement-coverage';inventory.append(element('h2','','Lean coverage of every statement'));
  const list=element('ul','');coverage.statements.forEach(r=>{const item=element('li',''),link=element('a','',r.title);link.href='#'+r.htmlAnchor;item.append(link,element('span','pa-coverage-status',r.status==='partial'?'Partial · conditional':'Not formalized'));list.append(item);});inventory.append(list);note.append(inventory);
  const evidence=element('a','','Read the source and check audit ↗');evidence.href='/research/proof-atlas/article-coverage-audit.json';note.append(evidence);
  const rows=new Map();
  for(const passage of index.passages){
   const target=document.getElementById(passage.htmlAnchor),block=target.closest('p')||target;
   let row=rows.get(block);
   if(!row){
    row=element('div','pa-aligned-row');const prose=element('div','pa-row-prose'),connections=element('div','pa-row-connections'),lean=element('aside','pa-row-lean');
    lean.setAttribute('aria-label','Lean statements corresponding to adjacent article passages');
    block.before(row);prose.append(block);row.append(prose,connections,lean);rows.set(block,row);
   }
   const headers=passage.declarations.map(name=>byName.get(name));
   const panel=element('section','pa-lean-passage');panel.dataset.leanPassage=passage.htmlAnchor;
   panel.append(element('h3','',passage.title));
   if(!headers.length)panel.append(element('p','','No corresponding Lean proof is indexed. This passage records the analytic scope outside the formalization.'));
   headers.forEach(d=>panel.append(statement(d,passage)));
   const details=element('details','pa-lean-relation');details.append(element('summary','','Correspondence and provenance'),element('p','',passage.note));
   details.append(element('p','','Article source lines '+passage.sourceLines.join('–')+' · '+passage.anchor+' · statement excerpt from '+data.sourceFile));
   const link=element('a','','Open passage in Proof Atlas ↗');link.href='/projects/proof-atlas/app/#article-'+passage.id;details.append(link);panel.append(details);
   row.querySelector('.pa-row-lean').append(panel);
   let entry=graphRows.find(e=>e.row===row);if(!entry){entry={row,passages:[]};graphRows.push(entry);}
   if(headers.length)entry.passages.push({passage,headers});
   target.dataset.leanMatch='true';
   target.addEventListener('mouseenter',()=>{if(requested==='compare')highlightPair(passage.htmlAnchor);});
   target.addEventListener('focus',()=>{if(requested==='compare')highlightPair(passage.htmlAnchor);});
   target.addEventListener('click',()=>{if(requested==='compare')highlightPair(passage.htmlAnchor);});
  }
  function clauses(parent,label,items){if(!items.length)return;parent.append(element('h4','',label));const ul=element('ul','');items.forEach(t=>ul.append(element('li','',t)));parent.append(ul);}
  for(const record of coverage.statements){
   const target=document.getElementById(record.htmlAnchor),overview=element('section','pa-coverage-panel');overview.dataset.coverageStatement=record.id;overview.dataset.coverageStatus=record.status;
   overview.append(element('h3','',record.title),element('p','pa-coverage-status',record.status==='partial'?'Partial coverage · conditional theorems checked':'Not formalized in this Lean snapshot'));
   if(record.id==='crossing'){
    clauses(overview,'Checked counterparts',record.covered);clauses(overview,'Explicit hypotheses',record.assumptions);clauses(overview,'Still outside Lean',record.missing);
    target.querySelector('.pa-row-lean').append(overview);continue;
   }
   const row=element('div','pa-aligned-row'),prose=element('div','pa-row-prose'),lane=element('div','pa-row-connections'),lean=element('aside','pa-row-lean');
   lean.setAttribute('aria-label','Coverage and checked Lean counterparts for '+record.title);target.before(row);prose.append(target);lean.append(overview);row.append(prose,lane,lean);
   target.dataset.leanMatch='true';target.addEventListener('mouseenter',()=>{if(requested==='compare')highlightPair(record.htmlAnchor);});target.addEventListener('focus',()=>{if(requested==='compare')highlightPair(record.htmlAnchor);});
   const headers=record.declarations.map(d=>coverage.declarations.find(n=>n.name===d.name));
   const entry={row,passages:[{passage:record,headers}]};graphRows.push(entry);
   headers.forEach((d,i)=>{const code=statement(d,record);if(i<2)overview.append(code);else{const more=element('details','pa-more-statement');more.append(element('summary','',d.name),code);more.addEventListener('toggle',()=>{accessibleScrollRegions();drawGraphs();});overview.append(more);}});
   clauses(overview,'Checked counterparts',record.covered);clauses(overview,'Explicit hypotheses',record.assumptions);clauses(overview,'Still outside Lean',record.missing);
   const scope=element('p','pa-lean-context','Original source lines · research revision '+coverage.researchRevision.slice(0,12)+'. Complete compiled proof terms and graphs are available through each declaration’s proof-library link.');if(headers.length)overview.append(scope);
  }
  const support=coverage.declarations.find(d=>d.name==='JacobiCore.toJacobiFull');
  const app=document.getElementById('app:lean'),supportRow=element('div','pa-aligned-row'),supportProse=element('div','pa-row-prose'),supportLane=element('div','pa-row-connections'),supportAside=element('aside','pa-row-lean');supportAside.setAttribute('aria-label','Checked reduction of the Jacobi hypothesis surface');
  const supportPassage={id:'hypothesis-reduction',htmlAnchor:'app:lean'};supportAside.append(element('h3','','Hypothesis reduction'),statement(support,supportPassage),element('p','pa-lean-context','JacobiCore.toJacobiFull constructs the 31-field structure from 13 hypotheses. Existence of the Jacobi functions and the first positive cn zero remains assumed. The counting theorems retain their explicit finite-tangency parameters.'));
  app.before(supportRow);supportProse.append(app);supportRow.append(supportProse,supportLane,supportAside);graphRows.push({row:supportRow,passages:[{passage:supportPassage,headers:[support]}]});
  // Proof blocks have their own source/term reader, distinct from statement headers.
  for(const proof of paper.querySelectorAll('.proof')){
   const anchor=proof.id.replace(/^proof-/,'').replace(/^(lem|thm)-/,'$1:'),records=library.declarations.filter(d=>d.articleAnchor===anchor);
   const pane=element('section','pa-proof-library');pane.dataset.articleProof=proof.id;
   pane.append(element('h3','','Complete compiled proofs and supporting declarations'));
   const mapped=coverage.statements.find(r=>r.htmlAnchor===anchor);
   if(!records.length){pane.append(element('p','','No Lean proof exists for this result in the published snapshot. The article proof is reproduced in full; it is not kernel-certified.'));const aside=element('aside','pa-row-lean');aside.append(pane);const row=element('div','pa-aligned-row'),prose=element('div','pa-row-prose');proof.before(row);prose.append(proof);row.append(prose,element('div','pa-row-connections'),aside);continue;}
   pane.append(element('p','',records.length+' / '+records.length+' declarations in the reviewed supporting modules, including generated helpers. Choose a complete compiled proof; the graph opens every elaborated occurrence. This is proof context, not a certified sentence-by-sentence translation.'));
   const label=element('label','','Lean declaration and proof'),select=element('select','');select.setAttribute('aria-label','Complete proofs corresponding to '+proof.id);label.append(select);pane.append(label);
   records.forEach(d=>{const option=element('option','',d.name+' · '+d.kind);option.value=d.name;select.append(option);});
   const initial=(anchor==='lem:crossing'&&records.find(d=>d.name==='CrossingData.crossing')?.name)||mapped?.declarations.find(d=>records.some(n=>n.name===d.name&&n.bodyAvailable))?.name||records.find(d=>d.kind==='theorem'&&d.bodyAvailable)?.name||records[0].name;select.value=initial;
   const body=element('section','pa-source-proof');pane.append(body);
   let row,entry,proofTarget=proof.id;
   if(proof.querySelector('.pa-aligned-row')){row=element('div','pa-aligned-row');const prose=element('div','pa-row-prose pa-proof-context'),context=element('p','','Complete Lean proofs supporting this crossing argument. The links preserve the enclosing proof context; each kernel occurrence remains independently navigable.');context.id=proof.id+'-library-context';proofTarget=context.id;prose.append(context);const aside=element('aside','pa-row-lean');aside.append(pane);row.append(prose,element('div','pa-row-connections'),aside);proof.append(row);entry={row,passages:[]};graphRows.push(entry);}
   else{row=element('div','pa-aligned-row');const prose=element('div','pa-row-prose'),lane=element('div','pa-row-connections'),aside=element('aside','pa-row-lean');proof.before(row);prose.append(proof);aside.append(pane);row.append(prose,lane,aside);entry={row,passages:[]};graphRows.push(entry);}
   const proofPassage={id:proof.id,htmlAnchor:proofTarget},connection={passage:proofPassage,headers:[]};entry.passages.push(connection);
   let load=0;
   async function showProof(){
    const token=++load,d=records.find(d=>d.name===select.value);body.replaceChildren(element('p','','Loading complete compiled proof…'));body.dataset.leanName=d.name;body.dataset.leanPassage=proof.id;
    const opened=await window.ProofAtlasLibraryData.open(d);if(token!==load)return;
    const root=opened.data.roots[d.bodyAvailable?1:0],ids=window.ProofAtlasLibraryData.reachable(opened.data,root).sort((a,b)=>a-b);
    body.replaceChildren(element('h4','',d.name));body.append(element('p','pa-lean-context',d.module+' · kernel check during extraction PASS · '+(d.bodyAvailable?'complete compiled type and body':'compiled declaration without an ordinary body')));
    body.append(element('p','pa-lean-context','Decoded shared kernel structure; original source projects and tactic scripts remain private. eN names a shared subterm; bound-variable indices are contextual.'));
    const open=element('a','pa-proof-open','Explore the entire compiled proof graph ↗');open.href=libraryUrl(d.name);body.append(open);
    const source=element('div','pa-compiled-term');source.tabIndex=0;source.setAttribute('role','region');source.setAttribute('aria-label','Decoded compiled proof for '+d.name);let offset=0;
    const more=element('button','','Show next 100 compiled subterms');more.type='button';
    function append(){for(const id of ids.slice(offset,offset+100)){const line=element('div','pa-proof-line');line.dataset.termNode=id;line.append(element('span','pa-lean-number','e'+id),element('code','',window.ProofAtlasLibraryData.describe(opened.data,id)));source.append(line);}offset=Math.min(offset+100,ids.length);more.hidden=offset===ids.length;}
    more.onclick=append;append();body.append(source,element('p','pa-lean-context',ids.length.toLocaleString()+' distinct subterms; every subterm and child link is available in the graph.'),more);
    connection.headers=[{name:d.name,short:d.name.split('.').pop(),proofUrl:libraryUrl(d.name)}];body.onmouseenter=()=>highlightPair(proofTarget,d.name);drawGraphs();
   }
   select.onchange=()=>showProof().catch(e=>body.replaceChildren(element('p','',e.message)));await showProof();
  }
  prepared=true;
  const observer=new ResizeObserver(drawGraphs);observer.observe(paper);graphRows.forEach(e=>observer.observe(e.row));
 }
 function offset(){
  const nav=document.querySelector('.site-nav');document.body.style.setProperty('--pa-nav-offset',(nav?nav.getBoundingClientRect().height:48)+'px');
 }
 async function mode(value,writeUrl=true){
  const previous=document.body.dataset.paReadingMode,top=toolbar.getBoundingClientRect().bottom+20;
  const anchor=previous&&previous!==value?[...paper.querySelectorAll('p,h2,h3,figure')].find(n=>!n.closest('.pa-row-lean,.pa-comparison-note')&&n.getBoundingClientRect().bottom>top&&n.getBoundingClientRect().top<innerHeight):null;
  const anchorTop=anchor?.getBoundingClientRect().top;
  requested=value;
  if(value==='compare'){
   window.ProofAtlasSync?.close();
   status.textContent='Loading corresponding Lean statements…';toolbar.setAttribute('aria-busy','true');
   try{if(!loading)loading=prepare().catch(e=>{loading=null;throw e;});await loading;}
   catch(e){if(requested==='compare')status.textContent=e.message;toolbar.removeAttribute('aria-busy');return;}
   toolbar.removeAttribute('aria-busy');if(requested!=='compare')return;
  }
  document.body.dataset.paReadingMode=value;
  const synced=value==='article'&&document.body.dataset.paSync==='open';
  toolbar.querySelectorAll('button[data-pa-reading]').forEach(b=>b.setAttribute('aria-pressed',String(!synced&&b.dataset.paReading===value)));
  paper.querySelectorAll('[data-lean-match]').forEach(n=>{n.tabIndex=value==='compare'?0:-1;});
  status.textContent=synced?'Synchronized reading':value==='compare'?'Article ↔ Lean · 9 statements audited':'Centered reading';
  if(writeUrl){const url=new URL(location.href);if(value==='compare')url.searchParams.set('view','lean');else url.searchParams.delete('view');history.replaceState(null,'',url);}
  offset();requestAnimationFrame(()=>{if(anchor)window.scrollBy(0,anchor.getBoundingClientRect().top-anchorTop);accessibleScrollRegions();drawGraphs();});
 }
 window.ProofAtlasArticle={mode};
 toolbar.hidden=false;toolbar.querySelectorAll('button[data-pa-reading]').forEach(b=>b.addEventListener('click',()=>mode(b.dataset.paReading)));
 function ready(){offset();accessibleScrollRegions();mode(new URLSearchParams(location.search).get('view')==='lean'?'compare':'article',false).then(reveal);}
 window.addEventListener('hashchange',reveal);window.addEventListener('popstate',()=>mode(new URLSearchParams(location.search).get('view')==='lean'?'compare':'article',false));
 window.addEventListener('resize',()=>{offset();accessibleScrollRegions();drawGraphs();});
 if(document.readyState==='complete')ready();else window.addEventListener('load',ready);
})();
