(() => {
  'use strict';

  const slides = [...document.querySelectorAll('.slide')];
  const deck = document.getElementById('deck');
  const prevButton = document.getElementById('prev');
  const nextButton = document.getElementById('next');
  const overviewButton = document.getElementById('overviewButton');
  const fullscreenButton = document.getElementById('fullscreenButton');
  const closeOverview = document.getElementById('closeOverview');
  const overview = document.getElementById('overview');
  const overviewGrid = document.getElementById('overviewGrid');
  const currentLabel = document.getElementById('current');
  const totalLabel = document.getElementById('total');
  const progress = document.getElementById('progress');
  const shortcutHint = document.getElementById('shortcutHint');
  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  let current = 0;
  let demoTimers = [];
  let touchStartX = null;

  const twoDigits = value => String(value).padStart(2, '0');

  function indexFromHash() {
    const match = location.hash.match(/#\/?(\d+)/);
    if (!match) return 0;
    return Math.max(0, Math.min(slides.length - 1, Number(match[1]) - 1));
  }

  function clearDemoTimers() {
    demoTimers.forEach(clearTimeout);
    demoTimers = [];
  }

  function later(callback, delay) {
    const timer = setTimeout(callback, reducedMotion ? Math.min(delay, 30) : delay);
    demoTimers.push(timer);
  }

  function updateOverviewSelection() {
    [...overviewGrid.children].forEach((item, i) => item.classList.toggle('current', i === current));
  }

  function showSlide(nextIndex, updateHash = true) {
    const bounded = Math.max(0, Math.min(slides.length - 1, nextIndex));
    if (bounded === current && slides[bounded].classList.contains('active')) {
      runSlideDemo(slides[bounded]);
      return;
    }

    clearDemoTimers();
    current = bounded;

    slides.forEach((slide, i) => {
      slide.classList.toggle('active', i === current);
      slide.classList.toggle('past', i < current);
      slide.classList.toggle('future', i > current);
      slide.setAttribute('aria-hidden', String(i !== current));
    });

    currentLabel.textContent = twoDigits(current + 1);
    totalLabel.textContent = twoDigits(slides.length);
    progress.style.width = `${((current + 1) / slides.length) * 100}%`;
    prevButton.disabled = current === 0;
    nextButton.disabled = current === slides.length - 1;
    updateOverviewSelection();

    if (updateHash) history.replaceState(null, '', `#/${current + 1}`);
    document.title = `${slides[current].dataset.title} — DSA`;
    runSlideDemo(slides[current]);
  }

  function next() { showSlide(current + 1); }
  function previous() { showSlide(current - 1); }

  function openOverview() {
    overview.classList.add('open');
    overview.setAttribute('aria-hidden', 'false');
    updateOverviewSelection();
    const activeItem = overviewGrid.querySelector('.current');
    if (activeItem) activeItem.focus();
  }

  function hideOverview() {
    overview.classList.remove('open');
    overview.setAttribute('aria-hidden', 'true');
    overviewButton.focus();
  }

  async function toggleFullscreen() {
    try {
      if (!document.fullscreenElement) await document.documentElement.requestFullscreen();
      else await document.exitFullscreen();
    } catch (_) {
      // Fullscreen can be unavailable in embedded browsers; presentation remains usable.
    }
  }

  function buildOverview() {
    slides.forEach((slide, i) => {
      const button = document.createElement('button');
      button.type = 'button';
      button.className = 'overview-item';
      button.dataset.number = twoDigits(i + 1);
      button.innerHTML = `<span>${slide.dataset.title || `Slide ${i + 1}`}</span>`;
      button.addEventListener('click', () => {
        hideOverview();
        showSlide(i);
      });
      overviewGrid.appendChild(button);
    });
  }

  function resetCells(panel) {
    panel.querySelectorAll('.demo-cell').forEach(cell => cell.classList.remove('checking', 'rejected', 'found'));
  }

  function runLinear(panel) {
    const cells = [...panel.querySelectorAll('.demo-cell')];
    const dot = panel.querySelector('.trace-dot');
    const status = panel.querySelector('.demo-status');
    resetCells(panel);
    dot.style.left = '0%';
    status.textContent = 'So sánh từ chỉ số 0 →';

    const positions = [0, 25, 50, 75];
    cells.slice(0, 4).forEach((cell, step) => {
      later(() => {
        cells.forEach(c => c.classList.remove('checking'));
        cell.classList.add('checking');
        dot.style.left = `${positions[step]}%`;
        status.textContent = `chỉ số ${step}: ${cell.dataset.value} ${step === 3 ? '= 4' : '≠ 4'}`;
      }, 350 + step * 780);

      if (step < 3) {
        later(() => {
          cell.classList.remove('checking');
          cell.classList.add('rejected');
        }, 880 + step * 780);
      } else {
        later(() => {
          cell.classList.remove('checking');
          cell.classList.add('found');
          status.textContent = 'Tìm thấy tại chỉ số 3 ✓';
        }, 900 + step * 780);
      }
    });
  }

  function runBinary(panel) {
    const cells = [...panel.querySelectorAll('.demo-cell')];
    const fill = panel.querySelector('.range-fill');
    const status = panel.querySelector('.demo-status');
    resetCells(panel);
    fill.style.marginLeft = '0%';
    fill.style.width = '100%';
    status.textContent = 'low = 0 · mid = 3 · high = 6';

    later(() => cells[3].classList.add('checking'), 350);
    later(() => {
      cells[3].classList.remove('checking');
      cells.slice(0, 4).forEach(cell => cell.classList.add('rejected'));
      fill.style.marginLeft = '57.14%';
      fill.style.width = '42.86%';
      status.textContent = '31 > 17 → low = 4 · mid = 5 · high = 6';
    }, 1250);
    later(() => cells[5].classList.add('checking'), 1750);
    later(() => {
      cells[5].classList.remove('checking');
      cells[5].classList.add('found');
      status.textContent = 'Tìm thấy 31 tại chỉ số 5 ✓';
    }, 2600);
  }

  function runInterpolation(panel) {
    const probe = panel.querySelector('.probe');
    const status = panel.querySelector('.demo-status');
    probe.style.transition = 'none';
    probe.style.left = '4%';
    status.textContent = 'Ước lượng vị trí có khả năng chứa giá trị cần tìm.';
    requestAnimationFrame(() => requestAnimationFrame(() => {
      probe.style.transition = reducedMotion ? 'none' : 'left 1.2s cubic-bezier(.2,.9,.2,1)';
      probe.style.left = '75%';
    }));
    later(() => { status.textContent = 'Phân bố đều giúp lần ước lượng đầu tiên chạm đúng 70.'; }, 1350);
  }

  function runProbing(panel) {
    const slots = [...panel.querySelectorAll('.hash-slots > div')];
    const status = panel.querySelector('.demo-status');
    slots.forEach(slot => {
      slot.classList.remove('occupied', 'probing');
      const value = slot.querySelector('b');
      if (value) value.textContent = '';
    });
    status.textContent = 'Chèn 12 tại chỉ số 1.';

    const place = (slotIndex, value) => {
      const slot = slots[slotIndex];
      slot.classList.remove('probing');
      slot.classList.add('occupied');
      slot.querySelector('b').textContent = value;
    };

    later(() => place(1, '12'), 450);
    later(() => {
      slots[1].classList.add('probing');
      status.textContent = '23 băm về 1 — ô đã bị chiếm. Dò sang chỉ số 2.';
    }, 1200);
    later(() => {
      slots[1].classList.remove('probing');
      place(2, '23');
    }, 1950);
    later(() => {
      slots[1].classList.add('probing');
      status.textContent = '34 băm về 1 — chỉ số 1 và 2 đều đã bị chiếm.';
    }, 2700);
    later(() => {
      slots[1].classList.remove('probing');
      slots[2].classList.add('probing');
    }, 3300);
    later(() => {
      slots[2].classList.remove('probing');
      place(3, '34');
      status.textContent = 'Dò tới chỉ số 3 — còn trống. Chèn 34 ✓';
    }, 4000);
  }

  function runSlideDemo(slide) {
    clearDemoTimers();
    const panel = slide.querySelector('[data-demo]');
    if (!panel) return;
    const name = panel.dataset.demo;
    if (name === 'linear') runLinear(panel);
    if (name === 'binary') runBinary(panel);
    if (name === 'interpolation') runInterpolation(panel);
    if (name === 'probing') runProbing(panel);
  }

  prevButton.addEventListener('click', previous);
  nextButton.addEventListener('click', next);
  overviewButton.addEventListener('click', openOverview);
  closeOverview.addEventListener('click', hideOverview);
  fullscreenButton.addEventListener('click', toggleFullscreen);

  document.querySelectorAll('[data-replay]').forEach(button => {
    button.addEventListener('click', event => {
      event.stopPropagation();
      runSlideDemo(slides[current]);
    });
  });

  document.addEventListener('keydown', event => {
    if (overview.classList.contains('open')) {
      if (event.key === 'Escape' || event.key.toLowerCase() === 'o') hideOverview();
      return;
    }
    if (['ArrowRight', 'PageDown', 'Enter'].includes(event.key) || event.key === ' ') {
      event.preventDefault();
      next();
    } else if (['ArrowLeft', 'PageUp', 'Backspace'].includes(event.key)) {
      event.preventDefault();
      previous();
    } else if (event.key === 'Home') {
      showSlide(0);
    } else if (event.key === 'End') {
      showSlide(slides.length - 1);
    } else if (event.key.toLowerCase() === 'o') {
      openOverview();
    } else if (event.key.toLowerCase() === 'f') {
      toggleFullscreen();
    }
  });

  deck.addEventListener('click', event => {
    if (event.target.closest('button, a, code, pre, table')) return;
    const rect = deck.getBoundingClientRect();
    if (event.clientX > rect.left + rect.width * .62) next();
    else if (event.clientX < rect.left + rect.width * .38) previous();
  });

  deck.addEventListener('touchstart', event => {
    touchStartX = event.changedTouches[0]?.clientX ?? null;
  }, { passive: true });

  deck.addEventListener('touchend', event => {
    if (touchStartX === null) return;
    const delta = (event.changedTouches[0]?.clientX ?? touchStartX) - touchStartX;
    touchStartX = null;
    if (Math.abs(delta) < 48) return;
    if (delta < 0) next(); else previous();
  }, { passive: true });

  window.addEventListener('hashchange', () => showSlide(indexFromHash(), false));
  setTimeout(() => shortcutHint.classList.add('hide'), 6500);

  buildOverview();
  current = indexFromHash();
  slides.forEach(slide => slide.classList.remove('active'));
  showSlide(current, false);

  /* Lightweight canvas particle field */
  const canvas = document.getElementById('particles');
  const context = canvas.getContext('2d');
  const colors = ['50,230,226', '168,121,255', '255,92,168', '255,200,87'];
  let particles = [];
  let animationFrame = null;

  function resizeCanvas() {
    const ratio = Math.min(window.devicePixelRatio || 1, 1.6);
    canvas.width = Math.round(innerWidth * ratio);
    canvas.height = Math.round(innerHeight * ratio);
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;
    context.setTransform(ratio, 0, 0, ratio, 0, 0);
    const count = Math.max(24, Math.min(72, Math.round((innerWidth * innerHeight) / 26000)));
    particles = Array.from({ length: count }, (_, i) => ({
      x: Math.random() * innerWidth,
      y: Math.random() * innerHeight,
      r: Math.random() * 1.8 + .4,
      vx: (Math.random() - .5) * .18,
      vy: (Math.random() - .5) * .18,
      color: colors[i % colors.length],
      alpha: Math.random() * .45 + .15
    }));
  }

  function drawParticles() {
    context.clearRect(0, 0, innerWidth, innerHeight);
    for (const particle of particles) {
      particle.x += particle.vx;
      particle.y += particle.vy;
      if (particle.x < -8) particle.x = innerWidth + 8;
      if (particle.x > innerWidth + 8) particle.x = -8;
      if (particle.y < -8) particle.y = innerHeight + 8;
      if (particle.y > innerHeight + 8) particle.y = -8;
      context.beginPath();
      context.arc(particle.x, particle.y, particle.r, 0, Math.PI * 2);
      context.fillStyle = `rgba(${particle.color},${particle.alpha})`;
      context.fill();
    }
    animationFrame = requestAnimationFrame(drawParticles);
  }

  resizeCanvas();
  if (!reducedMotion) drawParticles();
  else {
    drawParticles();
    cancelAnimationFrame(animationFrame);
  }
  window.addEventListener('resize', resizeCanvas, { passive: true });
})();
