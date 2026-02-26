const metricFetching = document.getElementById('metric-fetching');
const metricCompleted = document.getElementById('metric-completed');
const metricCycleTime = document.getElementById('metric-cycle-time');
const metricEta = document.getElementById('metric-eta');
const metricOperators = document.getElementById('metric-operators');
const operatorAvatarNodes = Array.from(document.querySelectorAll('.workflow-avatars .workflow-avatar'));

function formatCycleTime(seconds) {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${mins}m ${String(secs).padStart(2, '0')}s`;
}

function formatEta(seconds) {
  if (seconds >= 60) {
    return `${Math.ceil(seconds / 60)}m`;
  }
  return `${seconds}s`;
}

function pulseValue(el) {
  if (!el) return;
  el.classList.remove('metric-updated');
  window.requestAnimationFrame(() => {
    el.classList.add('metric-updated');
  });
}

if (metricFetching && metricCompleted && metricCycleTime && metricEta && metricOperators) {
  const state = {
    fetching: 27,
    completed: 143,
    cycleSeconds: 102, // 1m 42s
    etaSeconds: 60, // 1m
    operators: 6,
    etaTickCount: 0,
  };

  function jitter(minMs, maxMs) {
    return minMs + Math.random() * (maxMs - minMs);
  }

  const scheduler = {
    fetching: performance.now() + jitter(1400, 3000),
    completed: performance.now() + jitter(1800, 3600),
    cycle: performance.now() + jitter(2200, 4200),
    eta: performance.now() + jitter(1600, 2600),
    operators: performance.now() + jitter(5000, 9000),
  };

  function renderOperatorAvatars(count) {
    if (!operatorAvatarNodes.length) return;
    operatorAvatarNodes.forEach((node, idx) => {
      node.style.display = idx < count ? 'grid' : 'none';
    });
  }

  renderOperatorAvatars(state.operators);

  function runScheduler() {
    const now = performance.now();

    if (now >= scheduler.fetching) {
      state.fetching += Math.random() < 0.35 ? 2 : 1;
      metricFetching.textContent = String(state.fetching);
      pulseValue(metricFetching);
      scheduler.fetching = now + jitter(1400, 3000);
    }

    if (now >= scheduler.completed) {
      state.completed += Math.random() < 0.2 ? 2 : 1;
      metricCompleted.textContent = String(state.completed);
      pulseValue(metricCompleted);
      scheduler.completed = now + jitter(1800, 3600);
    }

    if (now >= scheduler.cycle) {
      const cycleDelta = Math.random() < 0.6 ? -1 : 2;
      state.cycleSeconds = Math.max(70, Math.min(170, state.cycleSeconds + cycleDelta));
      metricCycleTime.textContent = formatCycleTime(state.cycleSeconds);
      pulseValue(metricCycleTime);
      scheduler.cycle = now + jitter(2200, 4200);
    }

    if (now >= scheduler.eta) {
      state.etaTickCount += 1;
      state.etaSeconds -= 6;
      if (state.etaSeconds <= 10) {
        state.etaSeconds = 60 + (state.etaTickCount % 3) * 10;
      }
      metricEta.textContent = formatEta(state.etaSeconds);
      pulseValue(metricEta);
      scheduler.eta = now + jitter(1600, 2600);
    }

    if (now >= scheduler.operators) {
      const rand = Math.random();
      if (rand > 0.7) {
        state.operators = Math.max(3, state.operators - 1);
      } else if (rand < 0.3) {
        state.operators = Math.min(7, state.operators + 1);
      }
      metricOperators.textContent = String(state.operators);
      renderOperatorAvatars(state.operators);
      pulseValue(metricOperators);
      scheduler.operators = now + jitter(5000, 9000);
    }
  }

  let schedulerIntervalId = null;

  function startScheduler() {
    if (schedulerIntervalId !== null) return;
    schedulerIntervalId = window.setInterval(runScheduler, 200);
  }

  function stopScheduler() {
    if (schedulerIntervalId === null) return;
    window.clearInterval(schedulerIntervalId);
    schedulerIntervalId = null;
  }

  startScheduler();

  document.addEventListener('visibilitychange', () => {
    if (document.hidden) {
      stopScheduler();
      return;
    }
    // Resume with fresh next-update times to avoid burst updates on return.
    const now = performance.now();
    scheduler.fetching = now + jitter(400, 1200);
    scheduler.completed = now + jitter(500, 1300);
    scheduler.cycle = now + jitter(600, 1400);
    scheduler.eta = now + jitter(400, 1100);
    scheduler.operators = now + jitter(1200, 2200);
    startScheduler();
  });
}
