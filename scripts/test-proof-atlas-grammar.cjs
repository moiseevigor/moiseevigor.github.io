/* Actual Chromium validation of all 12 Lean.Expr visual constructors. */
const {chromium}=require('playwright');
const path=require('path'),fs=require('fs');
(async()=>{
  const browser=await chromium.launch({headless:true, ...(process.env.ATLAS_CHROMIUM_PATH?{executablePath:process.env.ATLAS_CHROMIUM_PATH}:{})});
  const page=await browser.newPage({viewport:{width:1440,height:1000},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  const shots=process.env.ATLAS_SCREENSHOTS||'/tmp/proof-atlas-browser';
  fs.mkdirSync(shots,{recursive:true});
  try{
    await page.goto('http://127.0.0.1:8833/projects/proof-atlas/grammar/index.html',{waitUntil:'networkidle'});
    const tags=['bvar','fvar','mvar','sort','const','app','lam','forallE','letE','lit','mdata','proj'];
    for(const t of tags){
      const b=page.locator('[data-tag="'+t+'"]');
      if(await b.count()!==1)throw Error('Missing constructor '+t);
      await b.click();
      const title=await page.locator('#pa-g-name').textContent();
      if(!title.startsWith(t+' '))throw Error('Wrong selected constructor '+t+': '+title);
      if(await page.locator('#pa-grammar-svg rect').count()<2)throw Error('Missing graphical nodes for '+t);
      const statement=await page.locator('#pa-g-example').textContent();
      if(!statement.trim())throw Error('Missing code example for '+t);
      const description=await page.locator('#pa-g-description').textContent();
      if(description.length<40)throw Error('Missing meaningful explanation for '+t);
      const pressed=await b.getAttribute('aria-pressed');
      if(pressed!=='true')throw Error('Broken keyboard-friendly selection state '+t);
    }
    await page.locator('[data-tag="lam"]').click();
    await page.screenshot({path:path.join(shots,'lean-constructor-lambda.png'),fullPage:true});
    await page.setViewportSize({width:390,height:850});
    await page.locator('[data-tag="proj"]').click();
    const dimension=await page.evaluate(()=>({
      body:document.documentElement.scrollWidth,available:document.documentElement.clientWidth,
      diagram:document.querySelector('#pa-grammar-svg').getBoundingClientRect().width
    }));
    if(dimension.body>dimension.available+4)throw Error('Mobile page horizontal overflow '+JSON.stringify(dimension));
    await page.screenshot({path:path.join(shots,'lean-constructor-mobile.png'),fullPage:true});
    // The compact reference’s optional "four scales" is interactive, not just four prose
    // cards. Every one of Lean.Expr's 12 constructor tags must update all
    // four visual views and preserve native keyboard/button interaction.
    await page.setViewportSize({width:1490,height:1030});
    await page.goto('http://127.0.0.1:8833/projects/proof-atlas/language/index.html',{waitUntil:'networkidle'});
    await page.locator('.pa-reference-scales > summary').click();
    const chips=page.locator('#pa-scale-choices button');
    if(await chips.count()!==12)throw Error('Expected 12 interactive four-scale constructor buttons');
    const observed=['app','const','bvar','lam','lit','forallE'];
    for(const tag of tags){
      await page.locator('#pa-scale-choices [data-kind="'+tag+'"]').click();
      const selected=await page.locator('#pa-scale-kind').textContent();
      if(!selected.startsWith(tag+' '))throw Error('Four-scale selection mismatch '+tag+': '+selected);
      const code=await page.locator('#pa-scale-core').textContent();
      if(!code.includes('Lean.Expr.'+tag+' ')||code.includes('Lean.Expr..'))throw Error('Incorrect Lean.Expr constructor signature for '+tag+': '+code);
      const visual=await page.locator('#pa-scale-graph rect').count();
      if(visual<2)throw Error('Missing typed graph for '+tag);
      if(await page.locator('#pa-scale-module rect').count()<2)throw Error('Missing module view '+tag);
      if(await page.locator('#pa-scale-meaning-diagram rect').count()<2)throw Error('Missing separate interpretive view '+tag);
      const status=await page.locator('#pa-scale-status').textContent();
      if(observed.includes(tag)?!status.includes('OBSERVED IN CROSSING'):!status.includes('NOT PRESENT')){
        throw Error('Benchmark observation status incorrect for '+tag+': '+status);
      }
      // Constructor ports must never overlap. The graph panel is intentionally
      // vector-only, with metadata / environment links distinguished by dashes.
      const overlap=await page.locator('#pa-scale-graph').evaluate(svg=>{
        const b=Array.from(svg.querySelectorAll('rect')).slice(1);
        const r=b.map(el=>({x:+el.getAttribute('x'),y:+el.getAttribute('y'),w:+el.getAttribute('width'),h:+el.getAttribute('height')}));
        for(let i=0;i<r.length;i++)for(let j=i+1;j<r.length;j++){
          const a=r[i],b=r[j];
          if(a.x<b.x+b.w-1 && b.x<a.x+a.w-1 && a.y<b.y+b.h-1 && b.y<a.y+a.h-1)return [i,j];
        }
        return null;
      });
      if(overlap)throw Error('Overlapping constructor diagram ports: '+tag+' '+JSON.stringify(overlap));
    }
    await page.locator('#pa-scale-choices [data-kind="letE"]').click();
    await page.screenshot({path:path.join(shots,'lean-four-scales-all-fields.png'),fullPage:true});
    await page.setViewportSize({width:390,height:850});
    await page.locator('#pa-scale-choices [data-kind="forallE"]').click();
    const landing=await page.evaluate(()=>({
      body:document.documentElement.scrollWidth,
      available:document.documentElement.clientWidth,
      panels:document.querySelectorAll('.pa-scale-panel').length
    }));
    if(landing.body>landing.available+4)throw Error('Four-scale mobile horizontal overflow '+JSON.stringify(landing));
    if(landing.panels!==4)throw Error('Incomplete four-scale view');
    await page.screenshot({path:path.join(shots,'lean-four-scales-mobile.png'),fullPage:true});
    if(errors.length)throw Error(errors.join('; '));
    console.log(JSON.stringify({status:'PASS',constructors:tags.length,mobileWidth:dimension.available,mobileScrollWidth:dimension.body}));
  }finally{await browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1)});
