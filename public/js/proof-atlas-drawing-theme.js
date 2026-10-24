/* Canvas has no CSS inheritance. Read the same article tokens once per redraw. */
(function(host){
 'use strict';
 function read(element){const s=getComputedStyle(element),v=name=>s.getPropertyValue(name).trim();return {paper:v('--bg'),surface:v('--fig-bg'),ink:v('--text'),muted:v('--text-light'),border:v('--border'),accent:v('--accent'),selected:v('--accent-light'),warm:v('--accent-warm'),sans:v('--sans'),palette:[v('--text-light'),v('--text-light'),v('--accent-warm'),v('--text-muted'),v('--text-light'),v('--accent'),v('--accent-warm'),v('--accent-warm'),v('--accent-warm'),v('--text-muted'),v('--text-muted'),v('--accent')]};}
 function subscribe(draw){let frame;const observer=new MutationObserver(()=>{cancelAnimationFrame(frame);frame=requestAnimationFrame(draw);});observer.observe(document.documentElement,{attributes:true,attributeFilter:['data-theme']});return ()=>{observer.disconnect();cancelAnimationFrame(frame);};}
 host.ProofAtlasDrawingTheme={read,subscribe};
})(window);
