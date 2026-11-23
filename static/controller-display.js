/* Live controller window: polls the same local API as the main Pawd UI. */
const sourceEl = document.getElementById('source');
const playerEl = document.getElementById('playerIndex');
const detectedEl = document.getElementById('detected');
const detectedCountEl = document.getElementById('detectedCount');
const deviceTitleEl = document.getElementById('deviceTitle');
const statusBadgeEl = document.getElementById('statusBadge');
const observedEl = document.getElementById('observed');
const rawEl = document.getElementById('rawReadout');
const batteryEl = document.getElementById('batteryReadout');
const stickLeftEl = document.getElementById('stickLeft');
const stickRightEl = document.getElementById('stickRight');
const triggerLTEl = document.getElementById('triggerLT');
const triggerRTEl = document.getElementById('triggerRT');

const buttonEls = {};
document.querySelectorAll('[data-btn]').forEach(el => { buttonEls[el.dataset.btn] = el; });

const seenButtons = new Set();
let sawStick = false;
let sawTrigger = false;

const GLYPHS = {
  playstation: {
    a: '\u2715', b: '\u25CB', x: '\u25A1', y: '\u25B3',
    back: 'SHARE', guide: 'PS', start: 'OPTIONS', touchpad: 'PAD', mic: 'MIC',
  },
  xbox: {
    a: 'A', b: 'B', x: 'X', y: 'Y',
    back: 'BACK', guide: 'GUIDE', start: 'START', touchpad: 'PAD', mic: 'MIC',
  },
  nintendo: {
    a: 'A', b: 'B', x: 'X', y: 'Y',
    back: '-', guide: 'HOME', start: '+', touchpad: 'PAD', mic: 'MIC',
  },
};
let glyphFamily = '';

function applyGlyphs(name) {
  const lower = String(name || '').toLowerCase();
  let family = 'xbox';
  if (lower.includes('dualsense') || lower.includes('playstation') ||
      lower.includes('dualshock') || /\bps[345]\b/.test(lower)) {
    family = 'playstation';
  } else if (lower.includes('switch') || lower.includes(' joy-con') ||
             lower.includes('nintendo') || lower.includes('wii')) {
    family = 'nintendo';
  }
  if (family === glyphFamily) return;
  glyphFamily = family;
  const glyphs = GLYPHS[family];
  Object.entries(glyphs).forEach(([key, text]) => {
    const el = buttonEls[key];
    if (el) el.textContent = text;
  });
}

function moveStick(el, x, y) {
  if (!el) return;
  const dot = el.querySelector('.stick-dot');
  if (!dot) return;
  const nx = Math.max(-1, Math.min(1, Number(x) || 0));
  const ny = Math.max(-1, Math.min(1, Number(y) || 0));
  const radius = (el.clientWidth || 108) / 2 - 10;
  dot.style.transform = `translate(calc(${nx * radius}px - 50%), calc(${-ny * radius}px - 50%))`;
}

function escapeHtml(value) {
  return String(value ?? '').replace(/[&<>"']/g, c => ({
    '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
  })[c]);
}

async function loadDetected() {
  try {
    const res = await fetch('/api/controllers', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    const controllers = data.controllers || [];
    detectedCountEl.textContent = `${controllers.length} detected · ${data.dinputDeviceCount || 0} DirectInput`;
    if (!controllers.length) {
      detectedEl.innerHTML = '<p class="muted">No controllers currently detected.</p>';
    } else {
      detectedEl.innerHTML = controllers.map(c => `
        <div class="detected-chip">
          <strong>${escapeHtml(c.name)}</strong>
          <span>${escapeHtml(c.family || 'generic')} · VID ${escapeHtml(c.vid || '?')} / PID ${escapeHtml(c.pid || '?')}</span>
        </div>`).join('');
    }
    const allowed = data.inputSources || ['auto'];
    Array.from(sourceEl.options).forEach(opt => {
      opt.disabled = !allowed.includes(opt.value);
    });
    if (!allowed.includes(sourceEl.value)) sourceEl.value = allowed[0] || 'auto';
  } catch (e) {
    detectedCountEl.textContent = 'scan unavailable';
  }
}

function clearView(message) {
  deviceTitleEl.textContent = message;
  statusBadgeEl.textContent = 'Disconnected';
  statusBadgeEl.className = 'live-source off';
  Object.values(buttonEls).forEach(el => el.classList.remove('active'));
  moveStick(stickLeftEl, 0, 0);
  moveStick(stickRightEl, 0, 0);
  triggerLTEl.style.width = '0%';
  triggerRTEl.style.width = '0%';
  batteryEl.textContent = '';
}

function renderState(data) {
  const state = data.state;
  if (!data.available || !state) {
    clearView('Waiting for controller');
    rawEl.textContent = data.dinputError || 'Connect a controller or enable demo mode.';
    return;
  }
  const source = data.source;
  const name = state.deviceName || (source === 'demo'
    ? 'Demo controller' : `Player ${state.index + 1}`);
  applyGlyphs(name);
  deviceTitleEl.textContent = name;
  statusBadgeEl.textContent = source === 'demo' ? 'DEMO'
    : source === 'dinput' ? `DirectInput #${state.index + 1}`
    : `XInput player ${state.index + 1}`;
  statusBadgeEl.className = source === 'demo' ? 'live-source demo' : 'live-source on';

  Object.entries(state.buttons || {}).forEach(([key, pressed]) => {
    const el = buttonEls[key];
    if (el) el.classList.toggle('active', !!pressed);
    if (pressed) seenButtons.add(key);
  });
  const axes = state.axes || {};
  moveStick(stickLeftEl, axes.lx, axes.ly);
  moveStick(stickRightEl, axes.rx, axes.ry);
  if (['lx', 'ly', 'rx', 'ry'].some(k => Math.abs(Number(axes[k]) || 0) > 0.25)) sawStick = true;
  const triggers = state.triggers || {};
  const lt = Number(triggers.lt) || 0;
  const rt = Number(triggers.rt) || 0;
  triggerLTEl.style.width = `${Math.round(lt * 100)}%`;
  triggerRTEl.style.width = `${Math.round(rt * 100)}%`;
  if (lt > 0.1 || rt > 0.1) sawTrigger = true;

  const names = Array.from(seenButtons).map(k => k.toUpperCase());
  observedEl.textContent = names.length ? names.join(', ') : 'none yet';
  const notes = [];
  if (sawStick) notes.push('sticks moved');
  if (sawTrigger) notes.push('triggers moved');
  rawEl.textContent = notes.length ? 'Observed: ' + notes.join(', ')
    : 'Sticks/triggers: not moved yet';

  const battery = state.battery || {};
  batteryEl.textContent = battery.percent != null
    ? `Battery: ${battery.percent}%` : '';
}

async function pollState() {
  const source = sourceEl.value;
  const index = playerEl.value;
  try {
    const res = await fetch(
      `/api/controllers/state?index=${encodeURIComponent(index)}&source=${encodeURIComponent(source)}`,
      { cache: 'no-store' });
    if (!res.ok) return;
    renderState(await res.json());
  } catch (e) {
    // Transient; the next poll will recover.
  }
}

const openBatteryBtn = document.getElementById('openBatteryBtn');
if (openBatteryBtn) openBatteryBtn.addEventListener('click', () => {
  // This page runs inside an iframe in the main window. Ask the parent app to
  // reveal the battery panel; fall back to a full-page load with the hash.
  if (window.parent && window.parent !== window) {
    window.parent.postMessage('pawd:open-battery', '*');
  } else {
    window.location.href = '/#battery';
  }
});

sourceEl.addEventListener('change', () => {
  seenButtons.clear(); sawStick = false; sawTrigger = false; pollState();
});
playerEl.addEventListener('change', () => {
  seenButtons.clear(); sawStick = false; sawTrigger = false; pollState();
});

/* ---- Battery test panel (shares the server session with the Test app view) ---- */
const battEls = {
  panel: document.getElementById('liveBatteryPanel'),
  state: document.getElementById('liveBattState'),
  percent: document.getElementById('liveBattPercent'),
  source: document.getElementById('liveBattSource'),
  note: document.getElementById('liveBattNote'),
  mode: document.getElementById('liveBattMode'),
  duration: document.getElementById('liveBattDuration'),
  interval: document.getElementById('liveBattInterval'),
  readBtn: document.getElementById('liveBattReadBtn'),
  startBtn: document.getElementById('liveBattStartBtn'),
  stopBtn: document.getElementById('liveBattStopBtn'),
  resetBtn: document.getElementById('liveBattResetBtn'),
  progress: document.getElementById('liveBattProgressFill'),
  result: document.getElementById('liveBattResult'),
  samples: document.getElementById('liveBattSamples'),
};

function battSelection() {
  return { index: playerEl.value || '0', source: sourceEl.value || 'auto' };
}

function renderBattSample(sample) {
  if (!sample || !battEls.percent) return;
  battEls.percent.textContent = sample.percent != null ? `${sample.percent}%` : '--%';
  const precision = sample.precision ? ` · ${sample.precision}` : '';
  battEls.source.textContent = `${sample.device || sample.source || 'unknown'}${precision}`;
  battEls.note.textContent = sample.note || '';
  if (sample.available === false) battEls.state.textContent = 'Unavailable';
}

function renderBatt(data) {
  if (!data || !battEls.state) return;
  const samples = data.samples || [];
  const last = samples.length ? samples[samples.length - 1] : null;
  if (last) renderBattSample(last);

  const result = data.result;
  const status = data.running ? 'running' : (result ? result.status : 'idle');
  battEls.state.textContent = status === 'idle' ? 'Idle' : status.toUpperCase();
  battEls.state.className = 'battery-state muted' +
    (status === 'running' ? ' running' : '') +
    (status === 'pass' ? ' pass' : '') +
    (status === 'fail' ? ' fail' : '');

  if (data.durationMs && data.startedAt) {
    const elapsed = Math.max(0, Date.now() - data.startedAt * 1000);
    battEls.progress.style.width = Math.min(100, elapsed / data.durationMs * 100) + '%';
  } else {
    battEls.progress.style.width = '0%';
  }

  if (!result) {
    battEls.result.textContent = data.running
      ? 'Test running — watching for a battery level change.'
      : 'No test run yet.';
  } else {
    let text = `${(result.status || 'unknown').toUpperCase()}: ${result.reason || ''}`;
    if (result.startPercent != null && result.endPercent != null) {
      text += ` (${result.startPercent}% → ${result.endPercent}%)`;
    }
    if (result.estimatedRuntimeMinutes != null) {
      text += ` · estimated runtime ${result.estimatedRuntimeMinutes} min`;
    }
    battEls.result.textContent = text;
    if (result.status === 'pass' && window.parent && window.parent !== window) {
      // Ask the parent app to mark the walkthrough step complete.
      window.parent.postMessage('pawd:battery-pass', '*');
    }
  }

  if (!samples.length) {
    battEls.samples.textContent = 'No samples yet.';
  } else {
    battEls.samples.textContent = samples.slice(-12).map(s => {
      const time = new Date(s.at * 1000).toLocaleTimeString();
      const pct = s.percent != null ? `${s.percent}%` : 'n/a';
      const charge = s.charging === true ? 'charging' : (s.charging === false ? 'discharging' : '');
      return `${time}  ${pct}  ${s.source || ''}${charge ? ' · ' + charge : ''}`;
    }).join('\n');
  }
}

async function pollBattery() {
  try {
    const res = await fetch('/api/controllers/battery', { cache: 'no-store' });
    if (res.ok) renderBatt(await res.json());
  } catch (e) {
    // Best-effort polling.
  }
}

async function battPost(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json().catch(() => ({}));
}

if (battEls.readBtn) battEls.readBtn.addEventListener('click', async () => {
  try {
    const data = await battPost('/api/controllers/battery/sample', battSelection());
    if (data.samples) renderBatt(data);
    else renderBattSample(data);
  } catch (e) {
    battEls.note.textContent = `Read failed: ${e.message}`;
  }
});
if (battEls.startBtn) battEls.startBtn.addEventListener('click', async () => {
  const body = {
    ...battSelection(),
    mode: battEls.mode.value,
    durationMs: Math.max(0, Number(battEls.duration.value) || 0) * 60000,
    intervalMs: Math.max(1, Number(battEls.interval.value) || 5) * 1000,
  };
  try {
    const data = await battPost('/api/controllers/battery/start', body);
    if (data.ok) renderBatt(data);
    else battEls.result.textContent = `Could not start: ${data.error || 'unknown error'}`;
  } catch (e) {
    battEls.result.textContent = `Could not start: ${e.message}`;
  }
});
if (battEls.stopBtn) battEls.stopBtn.addEventListener('click', async () => {
  try {
    const data = await battPost('/api/controllers/battery/stop', {});
    if (data.ok) renderBatt(data);
  } catch (e) {
    battEls.result.textContent = `Could not stop: ${e.message}`;
  }
});
if (battEls.resetBtn) battEls.resetBtn.addEventListener('click', async () => {
  try {
    renderBatt(await battPost('/api/controllers/battery/reset', {}));
  } catch (e) {
    battEls.result.textContent = `Could not clear: ${e.message}`;
  }
});

loadDetected();
pollState();
pollBattery();
setInterval(loadDetected, 10000);
setInterval(pollState, 50);
setInterval(pollBattery, 2000);
