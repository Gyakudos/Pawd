/* Stick position view: exact X/Y readouts plus a simple drift check. */
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
  rightDrift: document.getElementById('rightDrift'),
  rightMax: document.getElementById('rightMax'),
};
const zeroBtn = document.getElementById('zeroBtn');
const driftBtn = document.getElementById('driftBtn');
const driftResult = document.getElementById('driftResult');

const centers = { left: { x: 0, y: 0 }, right: { x: 0, y: 0 } };
const maxDrift = { left: 0, right: 0 };
let latest = { left: { x: 0, y: 0 }, right: { x: 0, y: 0 } };
let connected = false;
let check = null;

function signed(value) {
  const n = Number(value) || 0;
  return `${n >= 0 ? '+' : ''}${n.toFixed(2)}`;
}

function distance(x, y, center) {
  return Math.hypot(x - center.x, y - center.y);
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
    const pos = latest[side];
    const drift = distance(pos.x, pos.y, centers[side]);
    values[`${side}Drift`].textContent = drift.toFixed(2);
    values[`${side}Max`].textContent = maxDrift[side].toFixed(2);
    if (!check) maxDrift[side] = Math.max(maxDrift[side], drift);
  }
}

function render(data) {
  const state = data.state;
  if (!data.available || !state) {
    connected = false;
    statusEl.textContent = data.dinputError || 'Waiting for controller…';
    statusEl.className = 'stick-status muted';
    latest = { left: { x: 0, y: 0 }, right: { x: 0, y: 0 } };
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
  latest.left = { x: Number(axes.lx) || 0, y: Number(axes.ly) || 0 };
  latest.right = { x: Number(axes.rx) || 0, y: Number(axes.ry) || 0 };
  moveDot(dots.left, gauges.left, latest.left.x, latest.left.y);
  moveDot(dots.right, gauges.right, latest.right.x, latest.right.y);
  values.leftX.textContent = signed(latest.left.x);
  values.leftY.textContent = signed(latest.left.y);
  values.rightX.textContent = signed(latest.right.x);
  values.rightY.textContent = signed(latest.right.y);

  for (const side of ['left', 'right']) {
    const drift = distance(latest[side].x, latest[side].y, centers[side]);
    if (check) check.max[side] = Math.max(check.max[side], drift);
  }
  renderDrift();
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
  centers.left = { ...latest.left };
  centers.right = { ...latest.right };
  maxDrift.left = 0;
  maxDrift.right = 0;
  driftResult.textContent = 'Center set to current position.';
  driftResult.className = 'drift-result muted';
});

if (driftBtn) driftBtn.addEventListener('click', () => {
  if (!connected) {
    driftResult.textContent = 'Connect a controller first.';
    driftResult.className = 'drift-result warn';
    return;
  }
  check = {
    until: Date.now() + 10000,
    base: { left: { ...latest.left }, right: { ...latest.right } },
    max: { left: 0, right: 0 },
  };
  centers.left = { ...check.base.left };
  centers.right = { ...check.base.right };
  driftBtn.disabled = true;
  driftResult.textContent = 'Measuring for 10s — do not touch the sticks…';
  driftResult.className = 'drift-result muted';
  const tick = () => {
    if (!check) return;
    if (Date.now() >= check.until) {
      const worst = Math.max(check.max.left, check.max.right);
      const drifted = worst > 0.04;
      driftResult.textContent = drifted
        ? `Drift detected — max deviation ${worst.toFixed(2)} (> 0.04)`
        : `No drift detected — max deviation ${worst.toFixed(2)}`;
      driftResult.className = `drift-result ${drifted ? 'warn' : 'ok'}`;
      maxDrift.left = check.max.left;
      maxDrift.right = check.max.right;
      check = null;
      driftBtn.disabled = false;
    } else {
      driftResult.textContent = `Measuring… ${Math.ceil((check.until - Date.now()) / 1000)}s`;
      setTimeout(tick, 250);
    }
  };
  tick();
});

sourceEl.addEventListener('change', pollState);
playerEl.addEventListener('change', pollState);

loadDetected();
pollState();
setInterval(loadDetected, 10000);
setInterval(pollState, 50);
