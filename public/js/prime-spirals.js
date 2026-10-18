export const GOLDEN_ANGLE = 360 / ((1 + Math.sqrt(5)) / 2) ** 2;
export function sieve(limit) {
  const flags = new Uint8Array(limit + 1).fill(1);
  flags[0] = flags[1] = 0;
  for (let d = 2; d * d <= limit; d++) {
    if (flags[d]) for (let n = d*d; n <= limit; n += d) flags[n] = 0;
  }
  return flags;
}
export function point(n, mode, angle, power) {
  const r = n ** power;
  const theta = mode === 'sacks' ? 2*Math.PI*Math.sqrt(n) : n*angle*Math.PI/180;
  return [r*Math.cos(theta), r*Math.sin(theta)];
}

function mount(root) {
  const get = id => root.querySelector('[data-control="'+id+'"]');
  const canvas = root.querySelector('canvas'), ctx = canvas.getContext('2d');
  const mode = get('mode'), count = get('count'), angle = get('angle');
  const power = get('power'), background = get('background'), track = get('track');
  const stats = root.querySelector('[data-stats]'), formula = root.querySelector('[data-formula]');
  const detail = root.querySelector('[data-detail]');
  const flags = sieve(30000);
  let points = [], pending = false;
  function render() {
    pending = false;
    const N = Number(count.value), a = Number(angle.value), b = Number(power.value);
    const width = Math.max(250, canvas.getBoundingClientRect().width);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width*dpr); canvas.height = Math.round(width*dpr);
    ctx.setTransform(dpr,0,0,dpr,0,0);
    // Plot sits on the page itself; dot colours follow the light/dark theme.
    const dark = document.documentElement.dataset.theme === 'dark';
    const C = dark ? {rest:'#3a3846', hi:'#6dffe2', hiRest:'#e5f9f5', light:65}
                   : {rest:'#d9d7e0', hi:'#00897b', hiRest:'#9fd6cf', light:48};
    ctx.clearRect(0,0,width,width);
    const scale = .46*width/(N**b), center = width/2;
    const radius = Math.max(.65, Math.min(2.8, width/Math.sqrt(N)*.22));
    const highlighted = new Set();
    if (track.value !== 'none') {
      for (let k=0; ; k++) {
        const n = track.value === 'euler' ? k*k+k+41 : k*k+1;
        if (n>N) break;
        highlighted.add(n);
      }
    }
    points = [];
    let primes = 0, trackPrimes = 0;
    for (let n=1; n<=N; n++) {
      if (flags[n]) primes++;
      if (highlighted.has(n) && flags[n]) trackPrimes++;
      if (!flags[n] && !background.checked && !highlighted.has(n)) continue;
      const [x,y] = point(n, mode.value, a, b);
      const px = center+scale*x, py = center-scale*y;
      ctx.fillStyle = highlighted.has(n) ? (flags[n] ? C.hi : C.hiRest) :
        flags[n] ? `hsl(${285-235*n/N} 95% ${C.light}%)` : C.rest;
      ctx.beginPath(); ctx.arc(px,py,highlighted.has(n) ? radius*1.65 : radius,0,2*Math.PI); ctx.fill();
      points.push({n,x:px,y:py});
    }
    angle.disabled = mode.value === 'sacks';
    root.querySelectorAll('[data-angle]').forEach(button => { button.disabled = angle.disabled; });
    root.querySelector('[data-count-value]').textContent = N.toLocaleString();
    root.querySelector('[data-angle-value]').textContent = a.toFixed(6)+'°';
    root.querySelector('[data-power-value]').textContent = b.toFixed(2);
    formula.textContent = mode.value === 'sacks' ? `r = n^${b.toFixed(2)}, θ = 2π√n radians` :
      `r = n^${b.toFixed(2)}, θ = n × ${a.toFixed(6)}°`;
    stats.textContent = `${N.toLocaleString()} integers · ${primes.toLocaleString()} primes (${(100*primes/N).toFixed(1)}%)`+
      (highlighted.size ? ` · selected formula: ${trackPrimes}/${highlighted.size} values prime` : '');
    canvas.setAttribute('aria-label', `${mode.value === 'sacks' ? 'Sacks' : 'Constant angle'} spiral. ${stats.textContent}. ${formula.textContent}.`);
    detail.textContent = 'Move over the plot or tap a point to inspect its integer label.';
  }
  function schedule() { if (!pending) { pending=true; requestAnimationFrame(render); } }
  root.addEventListener('input', schedule);
  root.addEventListener('change', schedule);
  root.querySelectorAll('[data-angle]').forEach(button => button.addEventListener('click', () => {
    // Programmatic assignment preserves the exact golden-angle preset.
    angle.value = button.dataset.angle === 'golden' ? GOLDEN_ANGLE : Number(button.dataset.angle);
    schedule();
  }));
  root.querySelector('[data-reset]').addEventListener('click', () => {
    mode.value='sunflower'; count.value=6000; angle.value=GOLDEN_ANGLE;
    power.value=.5; background.checked=true; track.value='none'; schedule();
  });
  function inspect(event) {
    const box=canvas.getBoundingClientRect(), x=event.clientX-box.left, y=event.clientY-box.top;
    let nearest=null, distance=12*12;
    for (const p of points) {
      const d=(p.x-x)**2+(p.y-y)**2;
      if (d<distance) { nearest=p; distance=d; }
    }
    detail.textContent = nearest ? `n = ${nearest.n.toLocaleString()} · ${flags[nearest.n] ? 'prime' : nearest.n===1 ? '1 is neither prime nor composite' : 'composite'}` : 'No point nearby. Move closer to a dot.';
  }
  canvas.addEventListener('pointermove', inspect);
  canvas.addEventListener('click', inspect);
  window.addEventListener('themechange', schedule);
  if (typeof ResizeObserver !== 'undefined') new ResizeObserver(schedule).observe(canvas);
  else window.addEventListener('resize', schedule);
  angle.value=GOLDEN_ANGLE;
  render();
}
if (typeof document !== 'undefined') document.querySelectorAll('[data-prime-explorer]').forEach(mount);
