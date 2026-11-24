/* Stick position view: exact X/Y readouts plus a spin-to-start drift check. */
const sourceEl = document.getElementById('source');
const playerEl = document.getElementById('playerIndex');
const statusEl = document.getElementById('stickStatus');
const gauges = {
  left: document.getElementById('gaugeLeft'),
  right: document.getElementById('gaugeRight'),
};
const dots = {
  left: document.getElementById('dotLeft'),
  right: document.getElementById('dotRight'),
};
const values = {
  leftX: document.getElementById('leftX'),
  leftY: document.getElementById('leftY'),
  rightX: document.getElementById('rightX'),
  rightY: document.getElementById('rightY'),
  leftDrift: document.getElementById('leftDrift'),
  leftMax: document.getElementById('leftMax'),
  leftSpin: document.getElementById('leftSpin'),
  leftReturn: document.getElementById('leftReturn'),
  rightDrift: document.getElementById('rightDrift'),
  rightMax: document.getElementById('rightMax'),
  rightSpin: document.getElementById('rightSpin'),
  rightReturn: document.getElementById('rightReturn'),
};
const zeroBtn = document.getElementById('zeroBtn');
const driftBtn = document.getElementById('driftBtn');
const driftResult = document.getElementById('driftResult');

// Drift uses the deadzone-free axes; displayed positions keep the game deadzone.
const DRIFT_MS = 10000;
const DRIFT_LIMIT = 0.04;
const SPIN_RADIUS = 0.30;       // stick must be this far out to count rotation
// A hair under 360°: the first sample of a gesture only establishes a reference
// angle, so an exact one-turn spin would otherwise score 96% and never arm.
const SPIN_REQUIRED = Math.PI * 1.8;
const RELEASE_RADIUS = 0.22;    // below this after a spin counts as "let go"
const SETTLE_TOLERANCE = 0.04;  // considered back at center
const SETTLE_DWELL_MS = 150;    // must stay settled this long
const RETURN_TIMEOUT_MS = 2500;
const RETURN_SLOW_MS = 400;
const SPIN_TIMEOUT_MS = 20000;

const centers = { left: { x: 0, y: 0 }, right: { x: 0, y: 0 } };
const maxDrift = { left: 0, right: 0 };
let latest = { left: { x: 0, y: 0 }, right: { x: 0, y: 0 } };
let precise = { left: { x: 0, y: 0 }, right: { x: 0, y: 0 } };
let connected = false;
let check = null;     // the 10s hands-off drift window
let spinTest = null;  // spin -> release -> return-to-center sequence

function signed(value) {
  const n = Number(value) || 0;
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}`;
}

function distance(x, y, center) {
  return Math.hypot(x - center.x, y - center.y);
}

function fmtMs(ms) {
  if (ms == null) return '—';
  return ms >= 1000 ? `${(ms / 1000).toFixed(2)}s` : `${Math.round(ms)}ms`;
}

function setResult(text, cls) {
  driftResult.textContent = text;
  driftResult.className = `drift-result ${cls || 'muted'}`;
}

function clearSpinUi() {
  for (const side of ['left', 'right']) {
    values[`${side}Spin`].textContent = '—';
    values[`${side}Spin`].style.color = '';
    values[`${side}Return`].textContent = '—';
    values[`${side}Return`].style.color = '';
  }
}

function moveDot(dot, gauge, x, y) {
  if (!dot || !gauge) return;
  const nx = Math.max(-1, Math.min(1, Number(x) || 0));
  const ny = Math.max(-1, Math.min(1, Number(y) || 0));
  const radius = (gauge.clientWidth || 240) / 2 - 18;
  dot.style.transform = `translate(${nx * radius}px, ${-ny * radius}px)`;
}

function renderDrift() {
  for (const side of ['left', 'right']) {
    const pos = precise[side];
    const drift = distance(pos.x, pos.y, centers[side]);
    values[`${side}Drift`].textContent = drift.toFixed(3);
    values[`${side}Max`].textContent = maxDrift[side].toFixed(3);
    // The deliberate spin must not pollute the "max seen" resting figure.
    if (!check && !spinTest) maxDrift[side] = Math.max(maxDrift[side], drift);
  }
}

function render(data) {
  const state = data.state;
  if (!data.available || !state) {
    if (spinTest || check) {
      spinTest = null;
      check = null;
      maxDrift.left = 0;
      maxDrift.right = 0;
      clearSpinUi();
      driftBtn.disabled = false;
      setResult('Controller disconnected — drift check cancelled.', 'warn');
    }
    connected = false;
    statusEl.textContent = data.dinputError || 'Waiting for controller…';
    statusEl.className = 'stick-status muted';
    latest = { left: { x: 0, y: 0 }, right: { x: 0, y: 0 } };
    precise = { left: { x: 0, y: 0 }, right: { x: 0, y: 0 } };
    for (const side of ['left', 'right']) moveDot(dots[side], gauges[side], 0, 0);
    values.leftX.textContent = values.leftY.textContent = '+0.00';
    values.rightX.textContent = values.rightY.textContent = '+0.00';
    renderDrift();
    return;
  }
  connected = true;
  const source = data.source;
  const name = state.deviceName || (source === 'demo' ? 'Demo controller' : `Player ${state.index + 1}`);
  statusEl.textContent = `${name} · ${source === 'demo' ? 'DEMO' : source === 'dinput' ? 'DirectInput' : 'XInput'}`;
  statusEl.className = 'stick-status';

  const axes = state.axes || {};
  const preciseAxes = state.preciseAxes || axes;
  latest.left = { x: Number(axes.lx) || 0, y: Number(axes.ly) || 0 };
  latest.right = { x: Number(axes.rx) || 0, y: Number(axes.ry) || 0 };
  precise.left = { x: Number(preciseAxes.lx) || 0, y: Number(preciseAxes.ly) || 0 };
  precise.right = { x: Number(preciseAxes.rx) || 0, y: Number(preciseAxes.ry) || 0 };
  moveDot(dots.left, gauges.left, latest.left.x, latest.left.y);
  moveDot(dots.right, gauges.right, latest.right.x, latest.right.y);
  values.leftX.textContent = signed(latest.left.x);
  values.leftY.textContent = signed(latest.left.y);
  values.rightX.textContent = signed(latest.right.x);
  values.rightY.textContent = signed(latest.right.y);

  for (const side of ['left', 'right']) {
    const drift = distance(precise[side].x, precise[side].y, centers[side]);
    if (check) check.max[side] = Math.max(check.max[side], drift);
  }
  if (spinTest) updateSpin(Date.now());
  renderDrift();
}

/* Spin detection: accumulate signed angle around the stored center. A back-and-forth
   wiggle cancels out; a real full rotation does not. After the spin, time the release
   until the stick settles back inside the drift tolerance. */
function updateSpin(now) {
  if (!spinTest) return;

  for (const side of ['left', 'right']) {
    const s = spinTest.sticks[side];
    const base = spinTest.base[side];
    const pos = precise[side];
    const radius = distance(pos.x, pos.y, base);

    if (!s.spun) {
      if (radius >= SPIN_RADIUS) {
        const angle = Math.atan2(pos.y - base.y, pos.x - base.x);
        if (s.lastAngle !== null) {
          let delta = angle - s.lastAngle;
          while (delta > Math.PI) delta -= 2 * Math.PI;
          while (delta < -Math.PI) delta += 2 * Math.PI;
          s.angle += delta;
        }
        s.lastAngle = angle;
      } else if (radius < 0.12) {
        s.lastAngle = null;
      }
      const pct = Math.min(100, Math.round(Math.abs(s.angle) / SPIN_REQUIRED * 100));
      if (Math.abs(s.angle) >= SPIN_REQUIRED) {
        s.spun = true;
        values[`${side}Spin`].textContent = '✓';
        values[`${side}Spin`].style.color = '#4ade80';
      } else {
        values[`${side}Spin`].textContent = `${pct}%`;
        values[`${side}Spin`].style.color = '';
      }
    }

    if (s.spun && s.releasedAt === null && radius < RELEASE_RADIUS) {
      s.releasedAt = now;
    }
    if (s.releasedAt !== null && s.returnMs === null && !s.timedOut) {
      if (radius <= SETTLE_TOLERANCE) {
        if (s.settleSince === null) s.settleSince = now;
        if (now - s.settleSince >= SETTLE_DWELL_MS) {
          s.returnMs = s.settleSince - s.releasedAt;
          values[`${side}Return`].textContent = fmtMs(s.returnMs);
          values[`${side}Return`].style.color =
            s.returnMs > RETURN_SLOW_MS ? '#f87171' : '#4ade80';
        }
      } else {
        s.settleSince = null;
      }
      if (s.returnMs === null && now - s.releasedAt > RETURN_TIMEOUT_MS) {
        s.timedOut = true;
        values[`${side}Return`].textContent = 'no return';
        values[`${side}Return`].style.color = '#f87171';
      }
    }
  }

  if (spinTest.phase !== 'spin') return;

  const progress = ['left', 'right'].map(side => {
    const s = spinTest.sticks[side];
    const pct = Math.min(100, Math.round(Math.abs(s.angle) / SPIN_REQUIRED * 100));
    return `${side === 'left' ? 'L' : 'R'} ${s.spun ? 'ready' : `${pct}%`}`;
  });
  const allSpun = ['left', 'right'].every(side => spinTest.sticks[side].spun);
  if (!allSpun) {
    if (now - spinTest.startedAt > SPIN_TIMEOUT_MS) {
      finishSpin('Spin not detected — rotate each stick a full circle, then try again.', 'warn');
    } else {
      setResult(`Spin each stick a full circle, then let go: ${progress.join(' · ')}`);
    }
    return;
  }

  const allReturned = ['left', 'right'].every(side => {
    const s = spinTest.sticks[side];
    return s.returnMs !== null || s.timedOut;
  });
  if (!allReturned) {
    setResult('Spin complete — release both sticks and let them return to center…');
    return;
  }
  beginMeasurement(now);
}

function beginMeasurement(now) {
  const base = spinTest.base;
  centers.left = { ...base.left };
  centers.right = { ...base.right };
  check = {
    until: now + DRIFT_MS,
    base: { left: { ...base.left }, right: { ...base.right } },
    max: { left: 0, right: 0 },
  };
  spinTest.phase = 'measuring';
  setResult('Return recorded — measuring drift for 10s, hands off…');
  tickCheck();
}

function tickCheck() {
  const timer = () => {
    if (!check || !spinTest || spinTest.phase !== 'measuring') return;
    if (Date.now() >= check.until) {
      finishSpin();
      return;
    }
    setResult(`Measuring drift… ${Math.ceil((check.until - Date.now()) / 1000)}s (hands off)`);
    setTimeout(timer, 250);
  };
  timer();
}

function finishSpin(message, cls) {
  if (spinTest && spinTest.phase === 'measuring' && check) {
    const worst = Math.max(check.max.left, check.max.right);
    const drifted = worst > DRIFT_LIMIT;
    const sides = ['left', 'right'].map(side => {
      const s = spinTest.sticks[side];
      return `${side === 'left' ? 'L' : 'R'} ${s.timedOut ? 'no return' : fmtMs(s.returnMs)}`;
    });
    const slow = ['left', 'right'].some(side => {
      const s = spinTest.sticks[side];
      return s.timedOut || (s.returnMs !== null && s.returnMs > RETURN_SLOW_MS);
    });
    if (!message) {
      message = [
        drifted
          ? `Drift detected — max deviation ${worst.toFixed(3)} (> ${DRIFT_LIMIT.toFixed(2)}, raw axes)`
          : `No drift detected — max deviation ${worst.toFixed(3)} (raw axes)`,
        `Return to center: ${sides.join(', ')}`,
        slow ? 'Slow or incomplete return to center' : null,
      ].filter(Boolean).join(' · ');
      cls = drifted || slow ? 'warn' : 'ok';
    }
    maxDrift.left = check.max.left;
    maxDrift.right = check.max.right;
    check = null;
  }
  spinTest = null;
  driftBtn.disabled = false;
  setResult(message, cls);
}

async function loadDetected() {
  try {
    const res = await fetch('/api/controllers', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    const allowed = data.inputSources || ['auto'];
    Array.from(sourceEl.options).forEach(opt => {
      opt.disabled = !allowed.includes(opt.value);
    });
    if (!allowed.includes(sourceEl.value)) sourceEl.value = allowed[0] || 'auto';
  } catch (e) {
    /* Keep the current selection if detection is unavailable. */
  }
}

async function pollState() {
  try {
    const res = await fetch(
      `/api/controllers/state?index=${encodeURIComponent(playerEl.value)}` +
      `&source=${encodeURIComponent(sourceEl.value)}`,
      { cache: 'no-store' });
    if (!res.ok) return;
    render(await res.json());
  } catch (e) {
    /* Transient; the next poll will recover. */
  }
}

if (zeroBtn) zeroBtn.addEventListener('click', () => {
  centers.left = { ...precise.left };
  centers.right = { ...precise.right };
  maxDrift.left = 0;
  maxDrift.right = 0;
  clearSpinUi();
  setResult('Center set to current position.');
});

if (driftBtn) driftBtn.addEventListener('click', () => {
  if (!connected) {
    setResult('Connect a controller first.', 'warn');
    return;
  }
  clearSpinUi();
  maxDrift.left = 0;
  maxDrift.right = 0;
  spinTest = {
    startedAt: Date.now(),
    phase: 'spin',
    base: { left: { ...centers.left }, right: { ...centers.right } },
    sticks: {
      left: { angle: 0, lastAngle: null, spun: false, releasedAt: null,
              settleSince: null, returnMs: null, timedOut: false },
      right: { angle: 0, lastAngle: null, spun: false, releasedAt: null,
               settleSince: null, returnMs: null, timedOut: false },
    },
  };
  driftBtn.disabled = true;
  setResult('Spin each stick a full circle, then let go.');
  updateSpin(Date.now());
});

sourceEl.addEventListener('change', pollState);
playerEl.addEventListener('change', pollState);

loadDetected();
pollState();
setInterval(loadDetected, 10000);
setInterval(pollState, 50);
