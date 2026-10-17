/* Real SVG bounds and exact connection endpoints, independent of placement code. */
'use strict';
const fs = require('fs'), vm = require('vm'), z = require('zlib');
const assert = require('assert/strict'), {chromium} = require('playwright');
const globals = {};
vm.runInNewContext(fs.readFileSync('public/data/proof-atlas/projected-context-modules-manifest.js', 'utf8'), {window: globals});
const descriptor = globals.PROOF_ATLAS_PROJECTED_CONTEXT_MODULES.records[0];
const packet = JSON.parse(z.gunzipSync(fs.readFileSync('.' + descriptor.file)));
const origin = process.env.ATLAS_ORIGIN || 'http://127.0.0.1:8833';
const dir = process.env.ATLAS_SCREENSHOTS || '/tmp/atlas-computed-captions-browser';

async function inspect(page) {
  return page.evaluate(() => {
    const host = document.getElementById('pl-context-module');
    const svg = host.querySelector('svg.pl-beta-diagram');
    const bounds = n => { const b = n.getBBox(); return {x:b.x, y:b.y, width:b.width, height:b.height}; };
    const overlaps = (a,b) => a.x < b.x+b.width && b.x < a.x+a.width && a.y < b.y+b.height && b.y < a.y+a.height;
    const line = n => {
      const first = n.getPointAtLength(0), last = n.getPointAtLength(n.getTotalLength());
      return {a:{x:first.x,y:first.y}, b:{x:last.x,y:last.y}};
    };
    const edges = [...svg.querySelectorAll('[data-computed-edge]')];
    const captions = [...svg.querySelectorAll('.pl-beta-edge-label')];
    const obstacles = [...svg.querySelectorAll('[data-sourcecontextmodule-path], .pl-beta-node-label')].map(bounds);
    const errors = [];
    const key = e => [e.dataset.edgeFrom, e.dataset.edgeTo, e.dataset.edgeRole].join('|');
    for (const [i,caption] of captions.entries()) {
      const b = bounds(caption), own = edges.find(e => key(e) === key(caption));
      if (!own) { errors.push('caption-without-edge'); continue; }
      if (caption.textContent !== own.dataset.edgeRole) errors.push('wrong-caption-role');
      if (obstacles.some(o => overlaps(b,o))) errors.push('caption-obscures-node');
      if (captions.slice(i+1).some(n => overlaps(b,bounds(n)))) errors.push('caption-collision');
      const {a,b:end} = line(own), x = Number(caption.getAttribute('x')), y = Number(caption.getAttribute('y'));
      const length = Math.hypot(end.x-a.x,end.y-a.y);
      const distance = Math.abs((end.x-a.x)*(y-a.y)-(end.y-a.y)*(x-a.x))/length;
      const t = ((x-a.x)*(end.x-a.x)+(y-a.y)*(end.y-a.y))/(length*length);
      if (distance > .02 || t < 0 || t > 1) errors.push('caption-detached-from-edge');
      if (b.x < 0 || b.y < 0 || b.x+b.width > svg.clientWidth || b.y+b.height > 320) errors.push('caption-clipped');
      // A second line through a label can imply the wrong port association.
      for (const other of edges) if (other !== own) {
        const {a:c,b:d} = line(other);
        let crosses = false;
        // Sample actual SVG path points; placement uses no such sample oracle.
        const steps = Math.max(2,Math.ceil(Math.hypot(d.x-c.x,d.y-c.y)));
        for (let j=0;j<=steps;j++) {
          const p = other.getPointAtLength(other.getTotalLength()*j/steps);
          if (p.x>b.x && p.x<b.x+b.width && p.y>b.y && p.y<b.y+b.height) {crosses=true;break;}
        }
        if (crosses) errors.push('caption-on-unrelated-edge');
      }
    }
    const connections = [...host.querySelectorAll('[data-computed-connection-role]')];
    const listed = connections.map(row => {
      const buttons = [...row.querySelectorAll('[data-computed-connection-path]')];
      return [buttons[0]?.dataset.computedConnectionPath, buttons[1]?.dataset.computedConnectionPath, row.dataset.computedConnectionRole].join('|');
    }).sort();
    if (JSON.stringify(listed)!==JSON.stringify(edges.map(key).sort())) errors.push('incomplete-keyboard-connections');
    const scene = ProofAtlasLibrary.getContextModuleScene();
    const expected = [...scene.edges.map(e=>[e.from,e.to,e.field].join('|')),
      ...scene.links.filter(l=>l.relation==='bound-to').map(l=>[l.from,l.displayTarget||l.target,l.telescopeSlot?'slot '+l.telescopeSlot:'scope'].join('|'))].sort();
    if (JSON.stringify(expected)!==JSON.stringify(edges.map(key).sort())) errors.push('scene-connection-mismatch');
    return {errors, captions:captions.length, edges:edges.length, represented:scene.stats.represented};
  });
}

(async () => {
  fs.mkdirSync(dir,{recursive:true});
  const browser = await chromium.launch({headless:true, executablePath:process.env.ATLAS_CHROMIUM_PATH});
  const page = await browser.newPage({viewport:{width:1700,height:1100}}), errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{localStorage.setItem('analytics-consent','no');localStorage.setItem('theme','light');});
  let scenes=0, captions=0, edges=0, crowded=0;
  try {
    await page.goto(origin+'/projects/proof-atlas/library/?loading=paged&edition=goedel-sample-4331&proof='+descriptor.name);
    await page.waitForFunction(()=>window.ProofAtlasLibrary?.getSnapshot()?.name==='lean_workbook_plus_6206' && !document.getElementById('pl-library').matches('[aria-busy=true]'));
    for (const entry of packet.entries) {
      await page.evaluate(async e=>ProofAtlasLibrary.selectOccurrence(e.node,true,true,e.state.route),entry);
      await page.getByRole('button',{name:'Show checked context module',exact:true}).click();
      await page.waitForFunction(()=>ProofAtlasLibrary.getContextModuleScene());
      for (const mode of ['full','reduced']) {
        await page.getByRole('button',{name:mode==='full'?'Full recorded context':'Required syntactic context',exact:true}).click();
        await page.waitForFunction(m=>ProofAtlasLibrary.getContextModuleState()?.contextMode===m,mode);
        for (const part of ['term','type']) {
          await page.getByRole('button',{name:part==='term'?'Module term':'Module expected type',exact:true}).click();
          await page.waitForFunction(p=>ProofAtlasLibrary.getContextModuleSelection()?.part===p,part);
          for (const width of [1700,900,550,390]) for (const theme of ['light','dark']) {
            await page.setViewportSize({width,height:1100});
            await page.evaluate(t=>document.documentElement.dataset.theme=t,theme);
            await page.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));});
            const result = await inspect(page);
            assert.deepEqual(result.errors,[],JSON.stringify({mode,part,width,theme,result}));
            assert(result.edges>0);
            if(width===1700)assert(result.captions>0);
            if(width===390)assert.equal(result.captions,0);
            scenes++;captions+=result.captions;edges+=result.edges;
            if(result.captions<result.edges)crowded++;
          }
        }
      }
    }
    await page.setViewportSize({width:1700,height:1100});
    await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
    // Prove this independent oracle catches deliberately overlapping captions.
    await page.evaluate(()=>{const labels=document.querySelectorAll('#pl-context-module .pl-beta-edge-label');window.__captionPositions=[...labels].slice(0,2).map(n=>[n,n.getAttribute('x'),n.getAttribute('y')]);for(const n of [...labels].slice(0,2)){n.setAttribute('x','200');n.setAttribute('y','160');}});
    assert((await inspect(page)).errors.includes('caption-collision'));
    await page.evaluate(()=>{for(const[n,x,y]of __captionPositions){n.setAttribute('x',x);n.setAttribute('y',y);}});
    assert.deepEqual((await inspect(page)).errors,[]);
    const fontStyle = await page.addStyleTag({content:'.pl-beta-edge-label{font-size:18px}'});
    await page.evaluate(()=>document.fonts.dispatchEvent(new Event('loadingdone')));
    assert.deepEqual((await inspect(page)).errors,[]);
    await fontStyle.evaluate(n=>n.remove());
    await page.evaluate(()=>document.fonts.dispatchEvent(new Event('loadingdone')));
    assert.deepEqual((await inspect(page)).errors,[]);
    await page.evaluate(()=>{const row=document.querySelector('#pl-context-module [data-computed-connection-role]');window.__connectionRole=[row,row.dataset.computedConnectionRole];row.dataset.computedConnectionRole='wrong-port';});
    assert((await inspect(page)).errors.includes('incomplete-keyboard-connections'));
    await page.evaluate(()=>{__connectionRole[0].dataset.computedConnectionRole=__connectionRole[1];});
    await page.locator('#pl-context-module details').evaluateAll(ds=>ds.forEach(d=>d.open=true));
    // Exact endpoint buttons remain usable when visual captions are omitted.
    const next = await page.locator('#pl-context-module [data-computed-connection-path]').evaluateAll(bs=>bs.map(b=>b.dataset.computedConnectionPath).find(p=>p!==ProofAtlasLibrary.getContextModuleScene().root.path));
    assert(next);
    await page.locator('#pl-context-module [data-computed-connection-path="'+next+'"]').first().click();
    await page.waitForFunction(p=>ProofAtlasLibrary.getContextModuleScene()?.root.path===p,next);
    await page.getByRole('button',{name:'Module root',exact:true}).click();
    await page.waitForFunction(()=>ProofAtlasLibrary.getContextModuleScene()?.root.route.slots.length===0);
    assert.deepEqual((await inspect(page)).errors,[]);
    await page.locator('#pl-context-module').scrollIntoViewIfNeeded();
    await page.screenshot({path:dir+'/captions-1700.png'});
    assert.deepEqual(errors,[]);
    const report={status:'PASS',scenes,captions,edges,scenesWithOmittedCaptions:crowded,forcedCaptionCollisionRejected:true,wrongKeyboardPortRejected:true,fontChangeRemeasured:true,exactEndpointNavigation:true,scope:'Measured SVG caption bounds on 3 native routes, both context modes and term/type roots, four viewport widths and both themes. Does not measure human comprehension or claim all node captions are collision free.'};
    fs.writeFileSync(dir+'/caption-report.json',JSON.stringify(report,null,2)+'\n');
    console.log(JSON.stringify(report));
  } finally {await browser.close();}
})().catch(e=>{console.error(e.stack);process.exit(1);});
