/* Explanatory arithmetic only. No observational inputs or statistical fit. */
(function () {
  'use strict';
  const root = document.getElementById('sb-control-demo');
  if (!root) return;
  const input = root.querySelector('#sb-control');
  function update() {
    const control = Number(input.value);
    const delta = 20 - control;
    root.querySelector('#sb-control-value').textContent = control + '%';
    root.querySelector('#sb-control-percent').textContent = control + '%';
    root.querySelector('#sb-control-bar').style.width = (control / 25 * 100) + '%';
    root.querySelector('#sb-delta').textContent = 'Apparent excess: ' +
      (delta > 0 ? '+' : '') + delta + ' percentage points.';
  }
  input.addEventListener('input', update);
  update();
}());

/* Progressive enhancement: all source-bound results remain readable without JS. */
(function () {
  'use strict';
  const root = document.getElementById('results');
  if (!root) return;
  const picker = root.querySelector('#sb-result-picker');
  const select = root.querySelector('#sb-result-select');
  const panels = Array.from(root.querySelectorAll('[data-result]'));
  if (!picker || !select || panels.length !== select.options.length) return;
  function update() {
    const selected = panels.find(panel => panel.dataset.result === select.value);
    if (!selected) return;
    panels.forEach(panel => { panel.hidden = panel !== selected; });
  }
  select.addEventListener('change', update);
  update();
  picker.hidden = false;
}());
