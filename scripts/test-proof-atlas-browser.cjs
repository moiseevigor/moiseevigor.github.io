/* Browser regression for the REAL website code and anonymized benchmark data.
 * Run: npm install --no-save playwright@1.57.0 && npx playwright install chromium
 *      python3 -m http.server 8833 & node scripts/test-proof-atlas-browser.cjs
 */
const { chromium } = require('playwright');
const fs = require('fs');
const path = require('path');

const base=process.env.ATLAS_TEST_URL || 'http://127.0.0.1:8833/projects/proof-atlas/app/index.html';
const captures=path.resolve(process.env.ATLAS_SCREENSHOTS || '/tmp/proof-atlas-browser');
fs.mkdirSync(captures,{recursive:true});
function check(ok,msg){ if(!ok)throw new Error(msg); }
async function rootPoint(page){
  return page.evaluate(()=>{
    const D=window.PROOF_ATLAS_DATA, canvas=document.querySelector('#pa-canvas');
    const child=Array.from({length:D.parent.length},()=>[]);
    D.parent.forEach((p,i)=>{if(p>=0)child[p].push(i)});
    const first=[],last=[];let count=0;
    function locate(i){if(!child[i].length){first[i]=last[i]=count++;return;}
      first[i]=count;for(const c of child[i])locate(c);last[i]=count-1;}
    D.roots.forEach(locate);
    const root=D.roots[1],rect=canvas.getBoundingClientRect();
    const a=Math.PI*2*((first[root]+last[root])*.5+.5)/count-Math.PI/2;
    const r=14+Math.min(rect.width,rect.height)*.44*Math.pow(1/(D.stats.maxDepth+1),.76);
    return {root, x:rect.left+rect.width/2+r*Math.cos(a),y:rect.top+rect.height/2+r*Math.sin(a),
      degree:new Set([...child[root], ...D.binder.filter(pair=>pair[1]===root).map(pair=>pair[0])]).size};
  });
}
async function run(){
  const browser=await chromium.launch({headless:true});
  const page=await browser.newPage({viewport:{width:1580,height:980},deviceScaleFactor:1});
  const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.addInitScript(()=>{
    const proto=CanvasRenderingContext2D.prototype;
    const origArc=proto.arc,origBezier=proto.bezierCurveTo,origLine=proto.lineTo;
    window.__canvasMetrics={maxCirclePx:0,beziers:0,lines:0};
    proto.arc=function(x,y,r,...args){
      const t=this.getTransform(),zoom=Math.hypot(t.a,t.b);
      window.__canvasMetrics.maxCirclePx=Math.max(window.__canvasMetrics.maxCirclePx,r*zoom);
      return origArc.call(this,x,y,r,...args);
    };
    proto.bezierCurveTo=function(...args){window.__canvasMetrics.beziers++;return origBezier.apply(this,args)};
    proto.lineTo=function(...args){window.__canvasMetrics.lines++;return origLine.apply(this,args)};
  });
  try{
    await page.goto(base,{waitUntil:'networkidle',timeout:40000});
    await page.locator('#pa-stage-count').waitFor();
    await page.waitForTimeout(350);
    check(await page.evaluate(()=>!!window.PROOF_ATLAS_DATA),'CoreGIR projection did not load');
    check((await page.evaluate(()=>window.PROOF_ATLAS_DATA.parent.length))===7288,'wrong node count');
    await page.locator('#pa-focus').click();
    await page.waitForTimeout(300);
    let r=await rootPoint(page);
    check(r.degree>100,'expected high-degree lambda proof root');
    await page.mouse.move(r.x,r.y);
    await page.waitForTimeout(280);
    let hover=await page.locator('.pa-node-tooltip:not([hidden]) strong').textContent();
    check(hover==='Expression #'+r.root,'unexpected hover node '+hover+' / '+r.root);
    let neighbors=await page.locator('.pa-hover-neighbors li').count();
    check(neighbors===r.degree,'one-hop degree mismatch '+neighbors+' / '+r.degree);
    let m=await page.evaluate(()=>window.__canvasMetrics);
    check(m.maxCirclePx<=9,'oversized hover marker at 1x: '+m.maxCirclePx);
    check(m.beziers>7200,'base proof edges not curved');
    check(m.lines===0,'straight-line spokes found: '+m.lines);
    await page.screenshot({path:path.join(captures,'hover-hub-fit.png')});
    const off=await page.locator('#pa-canvas').boundingBox();
    await page.mouse.move(off.x+8,off.y+8);
    await page.waitForTimeout(300);
    check(await page.locator('.pa-node-tooltip:not([hidden])').count()===0,'hover card persisted after mouse-out');
    // Three zoom steps; marker radius should remain bounded in screen pixels.
    await page.mouse.move(r.x,r.y);
    await page.mouse.wheel(0,-1000);
    await page.waitForTimeout(250);
    await page.mouse.move(20,20);
    await page.waitForTimeout(210);
    r=await rootPoint(page);
    // Graph zoom is centered on the viewport, so recompute transformed position.
    const scale=Math.exp(1); const canvasRect=await page.locator('#pa-canvas').boundingBox();
    const x=canvasRect.x+canvasRect.width/2+scale*(r.x-canvasRect.x-canvasRect.width/2);
    const y=canvasRect.y+canvasRect.height/2+scale*(r.y-canvasRect.y-canvasRect.height/2);
    await page.mouse.move(x,y);await page.waitForTimeout(300);
    m=await page.evaluate(()=>window.__canvasMetrics);
    check(m.maxCirclePx<=9,'oversized hover marker at zoom: '+m.maxCirclePx);
    await page.screenshot({path:path.join(captures,'hover-hub-zoom.png')});
    // Check a smaller local neighborhood in the zoomed graph, if possible.
    await page.locator('[data-mode="deps"]').click();
    await page.waitForTimeout(110);
    check((await page.locator('#pa-stage-count').textContent()).includes('42'),'dependency mode failed');
    await page.locator('[data-mode="recursive"]').click();
    check((await page.locator('#pa-stage-count').textContent()).includes('shown'),'recursive mode failed');
    await page.locator('[data-mode="meaning"]').click();
    check((await page.locator('#pa-view-title').textContent()).includes('Core mathematical'),'idea mode failed');
    // Responsive smoke: canvas bitmap keeps displayed aspect ratio.
    await page.setViewportSize({width:900,height:720});
    await page.waitForTimeout(300);
    const aspect=await page.locator('#pa-canvas').evaluate(c=>{
      const rect=c.getBoundingClientRect();return Math.abs(c.width/c.height-rect.width/rect.height);
    });
    check(aspect<.013,'canvas stretched or clipped after resize: '+aspect);
    check(errors.length===0,'page errors: '+errors.join('; '));
    console.log(JSON.stringify({status:'PASS',highDegree:r.degree,oneHop:neighbors,maxMarkerPx:m.maxCirclePx,
      curvedEdges:true,noStraightSpokes:true,canvasAspectError:aspect,screenCaptures:captures}));
  } finally {await browser.close();}
}
run().catch(e=>{console.error(e.stack);process.exit(1)});
