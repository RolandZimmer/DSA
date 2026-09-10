(() => {
  'use strict';
  const $ = id => document.getElementById(id);
  const notes = {
    division: ['h(k) = k mod m', 'Negative keys use non-negative modulo.'],
    'mid-square': ['h(k) = middleTwo(k²) mod m', 'The square is padded to eight digits. We take digits 4–5 from the left, then reduce modulo m. This fixed window makes the example reproducible. Opposite keys share a home bucket.'],
    multiplication: ['h(k) = floor(m × frac(|k|A))', 'A = 0.6180339887498949. This floating-point teaching demo is limited to keys between -9999 and 9999.'],
  };
  const strategyNotes = {
    chaining: 'Each bucket stores a list. Search scans that list; deletion removes the matching entry. Load factor may exceed 1.',
    linear: 'Probe (h(k) + i) mod m. Nearby occupied slots can form clusters. Lookup skips tombstones and stops at EMPTY.',
    quadratic: 'Probe (h(k) + i²) mod m. With prime m, load below 0.5 guarantees a free position for a new key. Above that, a probe sequence may fail even with empty slots elsewhere.',
    double: 'Probe (h(k) + i × h₂(k)) mod m, with h₂(k) = 1 + (k mod (m−1)). Prime m makes every nonzero step coprime to m, so the sequence visits every slot.'
  };
  let table, steps = [], cursor = -1, timer = null;
  const controls = [...$('operation').querySelectorAll('input, button'), ...$('resize').querySelectorAll('input, button')];
  function pause() { clearTimeout(timer); timer = null; $('play').textContent = 'Play'; }
  function lock(disabled) { controls.forEach(el => el.disabled = disabled); }
  function render(step) {
    $('slots').replaceChildren(...step.slots.map((value, i) => {
      const cell = document.createElement('div');
      cell.className = 'slot' + (value === DSAHash.DELETED ? ' deleted' : '') + (i === step.pos ? (step.found ? ' found' : ' checking') : '');
      const index = document.createElement('small'), content = document.createElement('b');
      index.textContent = `slot ${i}`;
      content.textContent = Array.isArray(value) ? (value.join(' → ') || 'EMPTY') : value === null ? 'EMPTY' : value === DSAHash.DELETED ? 'DEL' : String(value);
      cell.append(index, content); return cell;
    }));
    $('load').textContent = `n = ${step.count}, m = ${table.config.size} · α = ${(step.count / table.config.size).toFixed(2)}`;
    $('status').textContent = step.message;
    $('status').classList.remove('error');
    $('counter').textContent = `${cursor + 1} / ${steps.length}`;
    const done = cursor === steps.length - 1;
    for (const id of ['step', 'play', 'finish']) $(id).disabled = done;
    lock(!done);
    if (done) pause();
  }
  function next() { if (cursor + 1 < steps.length) render(steps[++cursor]); }
  function trace(result) { pause(); steps = result; cursor = -1; next(); }
  function settings() { return { method: $('method').value, strategy: $('strategy').value, size: Number($('size').value) }; }
  function explain() {
    const c = settings();
    $('method-note').textContent = notes[c.method][1]; $('formula').textContent = notes[c.method][0]; $('strategy-note').textContent = strategyNotes[c.strategy];
  }
  function error(e) { pause(); $('status').textContent = e.message; $('status').classList.add('error'); }
  function build() {
    try {
      const keys = DSADemo.parseList($('keys').value), candidate = new DSAHash.Table(settings());
      const run = keys.flatMap(key => candidate.operate('insert', key).steps);
      table = candidate; explain(); trace(run);
    } catch (e) { error(e); }
  }
  $('setup').addEventListener('submit', e => { e.preventDefault(); build(); });
  $('setup').addEventListener('input', () => {
    pause(); explain(); lock(true);
    for (const id of ['step', 'play', 'finish']) $(id).disabled = true;
    $('status').textContent = 'Settings changed. Build the table to apply them.';
  });
  $('operation').addEventListener('submit', e => {
    e.preventDefault();
    try { trace(table.operate(e.submitter?.value || 'insert', DSADemo.integer($('key').value)).steps); }
    catch (err) { error(err); }
  });
  $('resize').addEventListener('submit', e => {
    e.preventDefault();
    try {
      const result = table.rehash(Number($('new-size').value));
      $('size').value = table.config.size;
      trace(result.steps);
    } catch (err) { error(err); }
  });
  $('step').addEventListener('click', () => { pause(); next(); });
  $('finish').addEventListener('click', () => { pause(); cursor = steps.length - 1; render(steps[cursor]); });
  $('play').addEventListener('click', () => {
    if (timer !== null) { pause(); return; }
    $('play').textContent = 'Pause';
    const tick = () => { next(); if (cursor < steps.length - 1) timer = setTimeout(tick, 650); };
    timer = setTimeout(tick, 150);
  });
  fetch('code/hash_demo.cpp').then(response => {
    if (!response.ok) throw new Error('Source unavailable'); return response.text();
  }).then(source => {
    const tokens = source.split(/(\/\/[^\n]*|\b(?:int|long|double|bool|void|const|return|if|else|for|while|do|struct|class|public|private|true|false|unsigned|throw|try|catch|auto|enum)\b|\b\d+(?:\.\d+)?\b)/g);
    $('code').replaceChildren(...tokens.map(token => {
      const span = document.createElement('span'); span.textContent = token;
      span.className = token.startsWith('//') ? 'tok-comment' : /^\d/.test(token) ? 'tok-num' : /^(int|long|double|bool|void|const|return|if|else|for|while|do|struct|class|public|private|true|false|unsigned|throw|try|catch|auto|enum)$/.test(token) ? 'tok-key' : '';
      return span;
    }));
  }).catch(() => { $('code').textContent = 'Use the download link above to open the C++ source.'; });
  build();
})();
