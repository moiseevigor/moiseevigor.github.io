/* Rendered-site regression: coverage, link semantics, field focus, routing,
   keyboard use, contrast and responsive diagrams. Not a Lean kernel checker. */
const {chromium}=require('playwright'),fs=require('fs'),path=require('path');
const assert=(ok,message)=>{if(!ok)throw Error(message);};
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.ATLAS_CHROMIUM_PATH?{executablePath:process.env.ATLAS_CHROMIUM_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 const base=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8833';
 const shots=process.env.ATLAS_SCREENSHOTS||'/tmp/proof-atlas-browser';fs.mkdirSync(shots,{recursive:true});
 const audit=[];
 try{
  await page.addInitScript(()=>{localStorage.setItem('theme','light');localStorage.setItem('analytics-consent','no');});
  await page.goto(base+'/projects/proof-atlas/grammar/');
  const catalog=await page.evaluate(()=>({kernel:window.PROOF_ATLAS_GRAMMAR,reference:window.PROOF_ATLAS_SYNTAX_REFERENCE}));
  const expected={expr:12,level:6,syntax:4,surface:16,tactic:11,command:13,macro:6,elab:6};
  assert(catalog.kernel.leanVersion==='4.33.1','Missing pinned Lean version');
  for(const [layer,count]of Object.entries(expected)){
   await page.locator('[data-layer="'+layer+'"]').click();
   assert(await page.locator('#pa-grammar-choices button').count()===count,'Wrong coverage '+layer);
   const ids=await page.locator('#pa-grammar-choices button').evaluateAll(b=>b.map(x=>x.dataset.id));
   for(const id of ids){
    const button=page.locator('[data-id="'+id+'"]');await button.click();
    assert(await button.getAttribute('aria-pressed')==='true','Selection state '+id);
    assert(await button.evaluate(e=>document.activeElement===e),'Keyboard focus was lost after selection '+id);
    assert((await page.locator('#pa-g-description').textContent()).length>30,'Missing prose '+id);
    assert((await page.locator('#pa-g-reading').textContent()).length>40,'Missing diagram reading '+id);
    assert((await page.locator('#pa-g-example').textContent()).trim().length>0,'Missing example '+id);
    assert((await page.locator('#pa-reference-source').getAttribute('href')).startsWith('https://'),'Missing provenance '+id);
    const structure=await page.locator('#pa-grammar-svg').evaluate(svg=>({
     ports:[...svg.querySelectorAll('.pa-diagram-field')].map(g=>g.dataset.field),
     paths:[...svg.querySelectorAll('.pa-diagram-edge')].map(g=>g.getAttribute('class')),
     boxes:[...svg.querySelectorAll('rect')].map(r=>({x:+r.getAttribute('x'),y:+r.getAttribute('y'),w:+r.getAttribute('width'),h:+r.getAttribute('height')}))
    }));
    for(let i=0;i<structure.boxes.length;i++)for(let j=i+1;j<structure.boxes.length;j++){
     const a=structure.boxes[i],b=structure.boxes[j];assert(!(a.x<b.x+b.w&&b.x<a.x+a.w&&a.y<b.y+b.h&&b.y<a.y+a.h),'Overlapping diagram fields '+id);
    }
    const fields=await page.locator('.pa-reference-field').count();
    assert(structure.ports.length===fields,'Diagram/field list mismatch '+id);
    if(fields){await page.locator('.pa-reference-field').first().click();assert(await page.locator('.pa-reference-field').first().getAttribute('aria-pressed')==='true','Field selection '+id);assert(await page.locator('.pa-diagram-field.is-dim').count()===fields-1,'Field highlighting '+id);}
   }
  }
  await page.locator('#pa-reference-search').fill('imax');
  assert(await page.locator('[data-id="level-imax"]').count()===1,'Search must cross layer boundaries');
  await page.locator('[data-id="level-imax"]').click();
  assert((await page.locator('#pa-g-reading').textContent()).includes('imax u 0 = 0'),'Wrong universe explanation');
  await page.locator('#pa-reference-search').fill('no-such-construct');
  assert(await page.locator('#pa-grammar-choices button').count()===0,'Search empty state');
  assert((await page.locator('.pa-reference-empty').textContent()).includes('No matches'),'Missing search feedback');
  await page.goto(base+'/projects/proof-atlas/grammar/#expr-letE');
  assert((await page.locator('#pa-g-name').textContent()).startsWith('letE'),'Deep link restoration');
  await page.locator('[data-id="expr-lam"]').focus();await page.keyboard.press('Enter');
  assert((await page.locator('#pa-g-name').textContent()).startsWith('lam'),'Keyboard selection');
  const checkTheme=async(theme)=>{
   await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
   await page.addScriptTag({path:require.resolve('axe-core/axe.min.js')});
   const result=await page.evaluate(()=>axe.run({include:[['#pa-grammar']]},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}}));
   audit.push({theme,violations:result.violations.map(v=>({id:v.id,nodes:v.nodes.map(n=>({target:n.target,summary:n.failureSummary}))}))});
  };
  await checkTheme('light');await checkTheme('dark');
  await page.locator('#pa-reference-detail').scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(shots,'lean-reference-dark.png')});
  await page.evaluate(()=>document.documentElement.dataset.theme='light');
  await page.locator('[data-id="expr-app"]').click();await page.locator('#pa-reference-detail').scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(shots,'lean-reference-desktop.png')});
  for(const width of [390,768,1280]){
   await page.setViewportSize({width,height:900});
   await page.locator('[data-layer="syntax"]').click();await page.locator('[data-id="syntax-ident"]').click();
   const dims=await page.evaluate(()=>({width:document.documentElement.clientWidth,scroll:document.documentElement.scrollWidth}));
   assert(dims.scroll<=dims.width+2,'Responsive overflow at '+width);
   const font=await page.locator('.pa-diagram-field-name').first().evaluate(e=>{const s=e.ownerSVGElement;const view=s.viewBox.baseVal;return parseFloat(getComputedStyle(e).fontSize)*Math.min(s.clientWidth/view.width,s.clientHeight/view.height);});
   assert(font>=12,'Unreadably small diagram labels at '+width+': '+font);
  }
  await page.setViewportSize({width:390,height:850});await page.locator('#pa-reference-detail').scrollIntoViewIfNeeded();
  await page.screenshot({path:path.join(shots,'lean-reference-mobile.png'),fullPage:true});
  await page.setViewportSize({width:1440,height:1000});await page.goto(base+'/projects/proof-atlas/');
  await page.locator('[data-kind="app"]').click();
  const contrast=await page.locator('#pa-scale-core').evaluate(e=>{const s=getComputedStyle(e);const rgb=x=>x.match(/\d+/g).slice(0,3).map(Number);const lum=x=>rgb(x).map(v=>{v/=255;return v<=.04045?v/12.92:((v+.055)/1.055)**2.4}).reduce((a,v,i)=>a+v*[.2126,.7152,.0722][i],0);return (Math.max(lum(s.color),lum(s.backgroundColor))+.05)/(Math.min(lum(s.color),lum(s.backgroundColor))+.05);});
  assert(contrast>=7,'Reported code contrast regression: '+contrast);
  await page.locator('.pa-scale-panels').scrollIntoViewIfNeeded();await page.screenshot({path:path.join(shots,'lean-four-scales-readable.png')});
  fs.writeFileSync(path.join(shots,'lean-reference-a11y.json'),JSON.stringify({audit,contrast},null,2));
  assert(audit.every(a=>!a.violations.length),'Accessibility violations '+JSON.stringify(audit));
  assert(!errors.length,'Browser errors '+errors.join('; '));
  console.log(JSON.stringify({status:'PASS',entries:74,layers:8,axeViolations:0,codeContrast:contrast}));
 }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1);});
