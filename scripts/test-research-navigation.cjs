/* User journeys through the research index and canonical Proof Atlas views. */
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const origin=process.env.ATLAS_ORIGIN||'http://127.0.0.1:8833';
const shots=process.env.ATLAS_SCREENSHOTS||'/tmp/research-navigation';
fs.mkdirSync(shots,{recursive:true});
const check=(ok,message)=>{if(!ok)throw Error(message)};
(async()=>{
 const browser=await chromium.launch({headless:true,...(process.env.ATLAS_CHROMIUM_PATH?{executablePath:process.env.ATLAS_CHROMIUM_PATH}:{})});
 const page=await browser.newPage({viewport:{width:1440,height:1000}});
 await page.addInitScript(()=>localStorage.setItem('analytics-consent','no'));
 const contentReady=async selector=>{await page.waitForLoadState('domcontentloaded');await page.locator(selector).first().waitFor({state:'visible'});};
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 try{
  await page.goto(origin+'/',{waitUntil:'domcontentloaded'});
  check(JSON.stringify(await page.locator('.site-nav-links a').allTextContents())===JSON.stringify(['Lab','Articles','Projects','About']),'Confusing primary navigation');
  check(await page.locator('.site-nav-brand').getAttribute('href')==='/','Name must link home');
  check(await page.locator('.hp-intro').count()===1,'Home should open with the introduction');
  check(await page.locator('.hc').count()>=5,'Home should list recent posts');
  await page.locator('.site-nav-links').getByRole('link',{name:'Lab',exact:true}).click();
  await contentReady('.hc--lab');
  check(await page.locator('.hc--lab').count()===6,'Lost a research topic');
  check(await page.locator('.hc--lab .lab-verdicts .v-no').count()>=4,'Refuted hypotheses disappeared');
  check(await page.locator('.hc--lab .hc-res').count()===6,'Every series needs its main result');
  await page.screenshot({path:path.join(shots,'research-desktop.png')});
  await page.locator('.site-nav-links').getByRole('link',{name:'Projects',exact:true}).click();
  await contentReady('.project-entry');
  check(await page.locator('#interactive-tools + .project-entries .project-entry').count()===3,'Interactive tool roles should be distinct');
  check(await page.locator('.project-entry').count()===4,'Software entry missing');
  // A nonessential pending request must not hold up checks of ready page content.
  let requested,release;const pending=new Promise(resolve=>requested=resolve);
  await page.route('**/__navigation_pending__',async route=>{requested();await new Promise(resolve=>release=resolve);await route.fulfill({body:'done'});});
  await page.evaluate(()=>{window.__navigationPending=fetch('/__navigation_pending__').catch(()=>null);});await pending;
  await contentReady('.project-entry');check(await page.locator('.project-entry').count()===4,'Ready projects hidden by background request');release();await page.evaluate(()=>window.__navigationPending);await page.unroute('**/__navigation_pending__');

  await page.locator('.project-entry').getByRole('link',{name:'Proof Atlas',exact:true}).click();
  await contentReady('.atlas-overview-route');
  check(await page.locator('.atlas-overview-route article').count()===3,'Missing ordered notation, proof and research route');
  check(await page.locator('canvas').count()===0,'Overview duplicates the working graph');
  check(await page.locator('script[src*="/public/data/proof-atlas/"]').count()===0,'Overview downloads term data before a tool is chosen');
  await page.screenshot({path:path.join(shots,'atlas-overview-desktop.png')});
  await page.getByRole('link',{name:'SE(2) article reader',exact:true}).click();
  await contentReady('#pa-reading-status');
  await page.waitForFunction(()=>document.getElementById('pa-reading-status')?.textContent.includes('Centered'));
  check((await page.locator('#pa-reading-status').textContent()).includes('Centered'),'Readable article should be default');
  check(await page.locator('.atlas-navigation a[aria-current="page"]').getAttribute('href')==='/projects/proof-atlas/article/','Wrong active article view');
  await page.locator('.atlas-navigation-help summary').press('Enter');
  check(await page.locator('.atlas-navigation-help').getAttribute('open')!==null,'Reference menu inaccessible by keyboard');
  await page.locator('.atlas-navigation-help').getByRole('link',{name:'Coverage and provenance',exact:true}).click();
  await contentReady('h1');
  check((await page.locator('h1').textContent()).includes('coverage'),'Coverage route lost');
  const packet=await page.request.get(origin+'/research/proof-atlas/compiled-term-checks.json');
  check(packet.status()===200,'Published audit packet missing');
  await page.locator('.atlas-navigation-help summary').press('Enter');
  await page.locator('.atlas-navigation-main').getByRole('link',{name:'2. Explore proofs',exact:true}).click();
  await contentReady('#pl-edition');
  await page.waitForFunction(()=>document.querySelector('#pl-edition')?.options.length===7);
  check(await page.locator('#pl-edition').evaluate(select=>Array.from(select.options,o=>o.value).join(',')==='published-15,working-26,recursion-controls,goedel-sample-4331,source-reference-controls,closed-context-controls,context-module-controls'),'Project snapshots, recursion controls, AI-source sample, source-reference controls closed-context controls and checked-module controls must stay separately labelled');
  check((await page.locator('h1').textContent()).includes('Compiled Lean'),'Library reading role unclear');
  await page.goto(origin+'/projects/proof-atlas/#expr-1852',{waitUntil:'domcontentloaded'});
  await page.waitForFunction(()=>document.querySelector('#pa-inspector-heading')?.textContent.includes('1852'));
  check(new URL(page.url()).pathname==='/projects/proof-atlas/app/','Legacy shared selection lost');
  const axePath=require.resolve('axe-core/axe.min.js');
  let audits=0;
  for(const route of ['/','/lab/','/projects/','/projects/proof-atlas/']){
   for(const width of [1280,390]){
    await page.setViewportSize({width,height:900});
    await page.goto(origin+route,{waitUntil:'domcontentloaded'});
    await contentReady({'/':'.hc','/lab/':'.hc--lab','/projects/':'.project-entry','/projects/proof-atlas/':'.atlas-overview-route'}[route]);
    check(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth+2),'Horizontal overflow at '+route+' '+width);
    check(await page.locator('.katex-error').count()===0,'Math parse error at '+route);
    for(const theme of ['light','dark']){
     await page.evaluate(theme=>{document.documentElement.dataset.theme=theme;localStorage.setItem('theme',theme)},theme);
     await page.waitForTimeout(250);
     await page.addScriptTag({path:axePath});
     const violations=await page.evaluate(async()=> (await axe.run({include:[['.site-nav'],['main'],['.d-article']]},{runOnly:{type:'tag',values:['wcag2a','wcag2aa','wcag21aa']}})).violations.map(v=>({id:v.id,targets:v.nodes.map(n=>n.target)})));
     check(!violations.length,'Accessibility '+route+' '+theme+': '+JSON.stringify(violations));audits++;
    }
    await page.evaluate(()=>document.documentElement.dataset.theme='light');
    await page.waitForTimeout(250);
    if(width===390)await page.screenshot({path:path.join(shots,route==='/lab/'?'research-mobile.png':route==='/projects/proof-atlas/'?'atlas-overview-mobile.png':route==='/projects/'?'tools-mobile.png':'home-mobile.png')});
   }
  }
  check(!errors.length,'Browser errors: '+errors.join('; '));
  console.log(JSON.stringify({status:'PASS',topics:6,tools:3,software:1,orderedAtlasSteps:3,accessibilityAudits:audits,sharedExpressionRoute:true,compiledAuditPacket:true,readyContentIndependentOfPendingRequest:true,screenshots:shots}));
 }finally{await browser.close()}
})().catch(e=>{console.error(e.stack);process.exit(1)});
