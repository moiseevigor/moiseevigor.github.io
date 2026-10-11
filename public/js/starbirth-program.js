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
