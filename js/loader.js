(function () {
  const loader = document.getElementById('page-loader');
  const statusEl = document.getElementById('loader-status');
  const fillEl = document.getElementById('loader-bar-fill');


  if (!loader) return;

  const statusSteps = [
    'Initializing AI engine…',
    'Warming up structured output pipeline…',
    'Preparing syntax highlighter…',
    'Almost there…'
  ];

  let pct = 0;
  let stepIndex = 0;
  let finished = false;

  const setPct = (value) => {
    pct = Math.max(0, Math.min(100, value));
    if (fillEl) fillEl.style.width = pct + '%';
  };


  const tick = () => {
    if (finished) return;

    const delta = 1 + Math.random() * 4;
    setPct(pct + delta);

    const shouldAdvanceStep = pct >= (stepIndex + 1) * 25 && stepIndex < statusSteps.length - 1;
    if (shouldAdvanceStep) {
      stepIndex++;
      if (statusEl) statusEl.textContent = statusSteps[stepIndex];
    }
  };

  const intervalId = window.setInterval(tick, 160);

  const MIN_LOADER_MS = 3000;
  const finishedAt = { value: 0 };
  const startedAt = (performance && performance.now) ? performance.now() : Date.now();

  const finish = () => {
    if (finished) return;

    const now = (performance && performance.now) ? performance.now() : Date.now();
    const elapsed = now - startedAt;

    // Enforce a minimum visible duration so the loader doesn't disappear “too fast”.
    if (elapsed < MIN_LOADER_MS) {
      window.setTimeout(finish, MIN_LOADER_MS - elapsed);
      return;
    }

    finished = true;
    finishedAt.value = now;
    window.clearInterval(intervalId);

    setPct(100);
    if (statusEl) statusEl.textContent = 'Ready';

    loader.classList.add('loader-finish');
    loader.setAttribute('aria-hidden', 'true');

    // Match CSS transition duration.
    window.setTimeout(() => {
      loader.remove();
    }, 550);
  };

  // Prefer real readiness.
  window.addEventListener('load', () => finish(), { once: true });

  // If loader elements are missing (wrong page/partial render), stop showing it.
  window.setTimeout(() => {
    if (!document.getElementById('loader-bar-fill') || !document.getElementById('loader-percent')) {
      try { finish(); } catch (e) {}
    }
  }, 50);

  // Safety timeout (handles edge cases where load never fires in some embeds).
  // Increased to avoid cutting the loader short.
  window.setTimeout(() => finish(), 12000);
})();


