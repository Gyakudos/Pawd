const refreshBtn = document.getElementById('refreshBtn');
const resetWalkthroughBtn = document.getElementById('resetWalkthroughBtn');
const installAdbBtn = document.getElementById('installAdbBtn');
const adbInstallMsg = document.getElementById('adbInstallMsg');
const autoLaunchToggle = document.getElementById('autoLaunchToggle');
const launchPhoneBtn = document.getElementById('launchPhoneBtn');
const stopPhoneBtn = document.getElementById('stopPhoneBtn');
const phoneStatusEl = document.getElementById('phoneStatus');
const summaryEl = document.getElementById('summary');
const adbStatusEl = document.getElementById('adbStatus');
const devicesTbody = document.querySelector('#devicesTable tbody');
const walkthroughEl = document.getElementById('walkthrough');
const walkthroughTitle = document.getElementById('walkthroughTitle');
const walkthroughIntro = document.getElementById('walkthroughIntro');
const progressFill = document.getElementById('progressFill');
const progressText = document.getElementById('progressText');
const selectedDeviceEl = document.getElementById('selectedDevice');
const phonePanel = document.getElementById('phonePanel');
const controllerPanel = document.getElementById('controllerPanel');
const controllerAutoToggle = document.getElementById('controllerAutoToggle');
const controllerStatusEl = document.getElementById('controllerStatus');
const refreshControllersBtn = document.getElementById('refreshControllersBtn');
const controllerIndexSelect = document.getElementById('controllerIndex');
const controllerSourceSelect = document.getElementById('controllerSource');
const dinputStatusEl = document.getElementById('dinputStatus');
const mappingDeviceEl = document.getElementById('mappingDevice');
const mappingEditorEl = document.getElementById('mappingEditor');
const mappingStatusEl = document.getElementById('mappingStatus');
const mappingRawEl = document.getElementById('mappingRaw');
const mappingSaveBtn = document.getElementById('mappingSaveBtn');
const mappingResetBtn = document.getElementById('mappingResetBtn');
const controllerDemoToggle = document.getElementById('controllerDemoToggle');
const liveSourceEl = document.getElementById('liveSource');
const liveMetaEl = document.getElementById('liveMeta');
const observedButtonsEl = document.getElementById('observedButtons');
const observedAxesEl = document.getElementById('observedAxes');
const stickLeftEl = document.getElementById('stickLeft');
const stickRightEl = document.getElementById('stickRight');
const triggerLTEl = document.getElementById('triggerLT');
const triggerRTEl = document.getElementById('triggerRT');
const rumbleLeftEl = document.getElementById('rumbleLeft');
const rumbleRightEl = document.getElementById('rumbleRight');
const rumbleDurationEl = document.getElementById('rumbleDuration');
const rumbleBtn = document.getElementById('rumbleBtn');
const rumbleStopBtn = document.getElementById('rumbleStopBtn');
const rumbleStatusEl = document.getElementById('rumbleStatus');
const batteryStateEl = document.getElementById('batteryState');
const batteryPercentEl = document.getElementById('batteryPercent');
const batterySourceEl = document.getElementById('batterySource');
const batteryNoteEl = document.getElementById('batteryNote');
const batteryModeEl = document.getElementById('batteryMode');
const batteryDurationEl = document.getElementById('batteryDuration');
const batteryIntervalEl = document.getElementById('batteryInterval');
const batteryReadBtn = document.getElementById('batteryReadBtn');
const batteryStartBtn = document.getElementById('batteryStartBtn');
const batteryStopBtn = document.getElementById('batteryStopBtn');
const batteryResetBtn = document.getElementById('batteryResetBtn');
const batteryProgressFill = document.getElementById('batteryProgressFill');
const batteryResultEl = document.getElementById('batteryResult');
const batterySamplesEl = document.getElementById('batterySamples');
const batteryPanel = document.getElementById('batteryPanel');
const batteryJumpBtn = document.getElementById('batteryJumpBtn');

function jumpToBatteryPanel() {
  // Battery test lives inside Test app -> Game controllers. Open both, then scroll.
  switchView('app');
  switchTab('controller');
  if (batteryPanel) {
    // Wait for the tab's hidden class to be removed before scrolling.
    requestAnimationFrame(() => {
      batteryPanel.scrollIntoView({ behavior: 'smooth', block: 'start' });
      batteryPanel.classList.add('battery-flash');
      setTimeout(() => batteryPanel.classList.remove('battery-flash'), 1800);
    });
  }
  addMarker('Opened battery test panel');
}

const recordSource = document.getElementById('recordSource');
const recordStartBtn = document.getElementById('recordStartBtn');
const recordStopBtn = document.getElementById('recordStopBtn');
const recordStatusEl = document.getElementById('recordStatus');
const recIndicator = document.getElementById('recIndicator');
const recordingsListEl = document.getElementById('recordingsList');

let selectedDevice = null;
let latestData = null;
let phoneBusy = false;
let autoLaunch = false;
let controllerAutoLaunch = false;
let lastControllerAutoAt = 0;
let controllerAutoPrimed = false;
let activeTab = 'android';
let controllerDemo = false;
let livePollTimer = null;
let batteryPollTimer = null;
let controllerMappings = {};
let mappingDefaults = null;
let mappingDeviceSignature = '';
let dinputDevicesCache = [];
let learningTarget = null;     // e.g. 'button:a' or 'axis:lx'
let learningBaseline = null;   // raw state captured when Learn was clicked
const observedInputs = {
  buttons: new Set(),
  stickMove: false,
  triggerMove: false,
};

const STEP_STATE_KEY = 'pawd.stepState.v1';
let stepState = {};
try {
  stepState = JSON.parse(localStorage.getItem(STEP_STATE_KEY) || '{}') || {};
} catch (e) {
  stepState = {};
}
// Migrate Phase 1/2 booleans to tri-state strings.
Object.keys(stepState).forEach(k => {
  if (stepState[k] === true) stepState[k] = 'pass';
  else if (stepState[k] === false || stepState[k] == null) delete stepState[k];
});
const sessionStartedAt = Date.now();
let appVersion = '001.000.000.2026';

const stepSets = {
  android: {
    title: 'Android Phone Test Walkthrough',
    intro: 'Select a detected Android candidate above or follow these steps to verify connection and basic functionality.',
    empty: 'No specific Android device selected. Walkthrough can still be used.',
    steps: [
      {
        id: 'physical',
        title: 'Physical connection',
        desc: 'Connect the Android phone to the PC using a known-good USB data cable (not charge-only).',
        hint: 'Try a different USB port/cable if the device is not detected. Avoid unpowered hubs when testing.'
      },
      {
        id: 'unlock',
        title: 'Unlock phone and choose USB mode',
        desc: 'Unlock the phone and check the USB notification. Select an appropriate mode (File transfer/MTP or USB tethering) as needed.',
        hint: 'Some phones default to "Charging only". You must choose a data mode for the PC to interact with content.'
      },
      {
        id: 'detected',
        title: 'Confirm detection on PC',
        desc: 'Verify the phone appears in the Connected Devices list above as an Android candidate or portable device.',
        hint: 'Click Refresh after changing cables/ports. If it appears with an error status, check Device Manager drivers.'
      },
      {
        id: 'trust',
        title: 'Authorize/trust the computer (if prompted)',
        desc: 'Accept any "Allow access" or RSA fingerprint/trust prompts on the phone.',
        hint: 'For ADB debugging, enable Developer Options and USB debugging, then accept the computer fingerprint prompt.'
      },
      {
        id: 'adb',
        title: 'Optional: Verify ADB communication',
        desc: 'If Android Platform Tools are installed, confirm the device appears as "device" in ADB status.',
        hint: 'Use "Install ADB (Platform Tools)" above if needed. If it shows "unauthorized", recheck the phone prompt.'
      },
      {
        id: 'ondevice',
        title: 'Launch on-device self-test suite',
        desc: 'Install and launch the Pawd Self Test app on the phone. It opens a hardware dashboard covering touch, display, audio, camera, biometrics, sensors, vibration, buttons, GPS, and system info.',
        hint: 'Use "Install & launch on phone" in the On-phone test app panel. It grants runtime test permissions and keeps the screen awake during testing.'
      },
      {
        id: 'file-access',
        title: 'Validate basic data access',
        desc: 'If using MTP/File Transfer, open the phone in File Explorer and confirm storage is browseable.',
        hint: 'You should be able to list folders (e.g. DCIM, Download). Disconnect/reconnect if Explorer does not refresh.'
      },
      {
        id: 'touchscreen',
        title: 'Touchscreen functionality test',
        desc: 'On the phone, verify touch input works across the screen: taps, swipes, multi-touch gestures, and keyboard typing.',
        hint: 'Open a notes app or browser, drag an icon across the screen, pinch-to-zoom, and test edges/corners for dead zones.'
      },
      {
        id: 'biometric',
        title: 'Biometric functionality test',
        desc: 'Test enrolled biometrics on the phone (fingerprint and/or face unlock) to confirm sensors respond correctly.',
        hint: 'Lock and unlock the device multiple times. If recognition fails, clean the sensor/camera, re-enroll a finger/face, and check for screen protector interference.'
      },
      {
        id: 'charging',
        title: 'Verify charging/power indicator',
        desc: 'Confirm the phone shows charging or power from USB connection.',
        hint: 'Charging works even on charge-only cables, but data tests require a data-capable cable/port.'
      },
      {
        id: 'disconnect',
        title: 'Safe disconnect and reconnect test',
        desc: 'Safely eject if applicable, unplug, then reconnect to confirm the device enumerates consistently.',
        hint: 'Intermittent detection can indicate cable, port, or driver issues.'
      }
    ]
  },
  controller: {
    title: 'Game Controller Test Walkthrough',
    intro: 'Select a detected controller below or follow these steps to verify Windows detection and every input surface.',
    empty: 'No specific controller selected. Walkthrough can still be used.',
    steps: [
      {
        id: 'connect',
        title: 'Connect the controller',
        desc: 'Connect by USB, wireless dongle, or Bluetooth. Make sure the controller has charge or fresh batteries.',
        hint: 'For wireless play, use the official dongle where possible. Avoid unpowered USB hubs during testing.'
      },
      {
        id: 'detected',
        title: 'Confirm Windows detects it',
        desc: 'Verify the controller appears in the Controllers panel below with a family badge (Xbox, PlayStation, Nintendo, or generic).',
        hint: 'Click Refresh controllers after connecting. If it does not appear, try another cable/port or pair it again in Bluetooth settings.'
      },
      {
        id: 'drivers',
        title: 'Check driver and device status',
        desc: 'Confirm the device status is OK and there are no driver warnings in Device Manager.',
        hint: 'Xbox controllers update through the Xbox Accessories app. PlayStation and Switch pads may need their vendor utility for firmware updates.'
      },
      {
        id: 'assign',
        title: 'Assign as Player 1',
        desc: 'Press a face button or the Home/Guide button and confirm the controller is treated as player one.',
        hint: 'On Windows, open Settings > Bluetooth & devices > Game controllers or a game that shows controller assignment.'
      },
      {
        id: 'buttons',
        title: 'Test every button',
        desc: 'Press each face button, shoulder bumper, back paddle, and the Guide/Home button once and confirm each registers.',
        hint: 'Sticky or unregistered buttons often indicate wear. Note any button that needs a hard press.'
      },
      {
        id: 'sticks',
        title: 'Test analog sticks',
        desc: 'Rotate both sticks through their full range and press L3/R3. Watch for dead zones, drift, or grinding.',
        hint: 'A stick that moves on its own when untouched is drift. Test slow small circles as well as full deflection.'
      },
      {
        id: 'triggers',
        title: 'Test triggers and D-pad',
        desc: 'Press both analog triggers through their full travel and check all eight D-pad directions.',
        hint: 'Diagonal D-pad inputs that register as two buttons at once can indicate a worn membrane.'
      },
      {
        id: 'rumble',
        title: 'Test vibration / haptics',
        desc: 'Check that rumble motors or haptic actuators respond, ideally with different intensities.',
        hint: 'Some lightweight or budget controllers have no rumble; record that as a capability limit rather than a failure.'
      },
      {
        id: 'battery',
        title: 'Battery / power test (LiPo controllers)',
        desc: 'Use the Battery test panel to watch charge or discharge over time. The test passes when the reported level moves in the expected direction.',
        hint: 'Use the same player/source as the live input panel. XInput gives four coarse levels; DualSense over HID gives an exact percentage and charging state. Skip for wired-only controllers.'
      },
      {
        id: 'wireless',
        title: 'Wireless range and latency (if applicable)',
        desc: 'Move the controller several metres away and behind obstacles while watching for dropped inputs.',
        hint: 'Interference from USB 3.0 hubs, Wi-Fi, and metal surfaces can reduce wireless range. Skip for wired-only controllers.'
      },
      {
        id: 'disconnect',
        title: 'Reconnect consistency',
        desc: 'Disconnect and reconnect the controller and confirm it is redetected without a reboot.',
        hint: 'Repeated failures after reconnect suggest driver, dongle, or hardware issues.'
      }
    ]
  }
};

function escapeHtml(s) {
  return String(s ?? '').replace(/[&<>"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c]));
}

function stepKey(category, id) {
  return `${category}:${id}`;
}

function saveStepState() {
  try {
    localStorage.setItem(STEP_STATE_KEY, JSON.stringify(stepState));
  } catch (e) {
    // Storage is optional; walkthrough still works in-memory.
  }
}

function addMarker(label) {
  if (!recording) return;
  recordMarkers.push({ t: Math.max(0, Math.round(Date.now() - recordStartAt)), label: String(label) });
}

const STATUS_LABELS = { pass: 'PASS', fail: 'FAIL', skip: 'SKIP' };

function stepStatus(category, id) {
  const v = stepState[stepKey(category, id)];
  return (v === 'pass' || v === 'fail' || v === 'skip') ? v : 'not_tested';
}

function setStepStatus(category, id, status, title) {
  const key = stepKey(category, id);
  const prev = stepStatus(category, id);
  const next = (prev === status) ? 'not_tested' : status;
  if (next === 'not_tested') delete stepState[key];
  else stepState[key] = next;
  saveStepState();
  renderWalkthrough();
  const label = STATUS_LABELS[next] || 'Not tested';
  addMarker(`${title}: ${label}`);
}

function markStepDone(id, category = activeTab) {
  if (stepStatus(category, id) === 'pass') return;
  const key = stepKey(category, id);
  stepState[key] = 'pass';
  saveStepState();
  renderWalkthrough();
  const step = (stepSets[category]?.steps || []).find(s => s.id === id);
  addMarker(`Passed: ${step ? step.title : id}`);
}

function renderWalkthrough() {
  const set = stepSets[activeTab];
  walkthroughTitle.textContent = set.title;
  walkthroughIntro.textContent = set.intro;
  walkthroughEl.innerHTML = '';
  set.steps.forEach(step => {
    const status = stepStatus(activeTab, step.id);
    const li = document.createElement('li');
    li.className = `step status-${status}`;
    li.dataset.stepId = step.id;
    const inputId = `step-${activeTab}-${step.id}`;
    const badge = STATUS_LABELS[status]
      ? `<span class="step-status ${status}">${STATUS_LABELS[status]}</span>`
      : '';
    li.innerHTML = `
      <div class="step-head">
        <input type="checkbox" id="${inputId}" ${status === 'pass' ? 'checked' : ''} />
        <div class="step-body">
          <h3><label for="${inputId}">${escapeHtml(step.title)}</label> ${badge}</h3>
          <p>${escapeHtml(step.desc)}</p>
          <div class="hint"><strong>Hint:</strong> ${escapeHtml(step.hint)}</div>
          <div class="step-controls">
            <button type="button" class="step-pass ${status === 'pass' ? 'selected' : ''}" data-status="pass">Pass</button>
            <button type="button" class="step-fail ${status === 'fail' ? 'selected' : ''}" data-status="fail">Fail</button>
            <button type="button" class="step-skip ${status === 'skip' ? 'selected' : ''}" data-status="skip">Skip</button>
          </div>
        </div>
      </div>`;
    const cb = li.querySelector('input');
    cb.addEventListener('change', () => {
      setStepStatus(activeTab, step.id, cb.checked ? 'pass' : 'not_tested', step.title);
    });
    li.querySelectorAll('[data-status]').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = btn.dataset.status;
        setStepStatus(activeTab, step.id, s === status ? 'not_tested' : s, step.title);
      });
    });
    walkthroughEl.appendChild(li);
  });
  updateProgress();
}

function updateProgress() {
  const steps = stepSets[activeTab].steps;
  const statuses = steps.map(s => stepStatus(activeTab, s.id));
  const total = steps.length;
  const done = statuses.filter(s => s === 'pass').length;
  const failed = statuses.filter(s => s === 'fail').length;
  const skipped = statuses.filter(s => s === 'skip').length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  progressFill.style.width = pct + '%';
  progressText.textContent = `${done} / ${total} pass${failed ? ` · ${failed} fail` : ''}${skipped ? ` · ${skipped} skip` : ''}`;
}

const viewPanes = {
  app: 'viewApp',
  controller: 'viewController',
};
const frameSources = {
  controllerFrame: '/controller-display.html',
  stickFrame: '/stick-view.html',
};

function switchView(view) {
  if (!viewPanes[view]) return;
  document.querySelectorAll('.view-tab').forEach(btn => {
    btn.classList.toggle('active', btn.dataset.view === view);
  });
  Object.entries(viewPanes).forEach(([name, id]) => {
    const pane = document.getElementById(id);
    if (pane) pane.classList.toggle('hidden', name !== view);
  });
  Object.entries(frameSources).forEach(([id, src]) => {
    const frame = document.getElementById(id);
    if (!frame) return;
    const target = view === 'controller' ? src : 'about:blank';
    if (frame.getAttribute('src') !== target) frame.src = target;
  });
}

document.querySelectorAll('.view-tab').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});

function switchTab(tab) {
  if (!stepSets[tab]) return;
  const changed = tab !== activeTab;
  activeTab = tab;
  document.querySelectorAll('.tab').forEach(b => {
    b.classList.toggle('active', b.dataset.tab === tab);
  });
  phonePanel.classList.toggle('hidden', tab !== 'android');
  controllerPanel.classList.toggle('hidden', tab !== 'controller');
  selectedDeviceEl.textContent = stepSets[tab].empty;
  renderWalkthrough();
  if (tab === 'controller') {
    startLivePolling();
    startBatteryPolling();
  } else {
    stopLivePolling();
    stopBatteryPolling();
  }
  if (changed) addMarker(`Switched to ${tab === 'android' ? 'Android phone' : 'game controller'} tests`);
}

document.querySelectorAll('.tab').forEach(btn => {
  btn.addEventListener('click', () => switchTab(btn.dataset.tab));
});

function renderSummary(data) {
  const s = data.summary || {};
  summaryEl.textContent = `Total detected (filtered): ${s.total ?? 0} | Android candidates: ${s.androidCandidates ?? 0} | Controllers: ${s.controllerCandidates ?? 0} | ADB connected: ${s.adbConnected ?? 0}`;
  const adb = data.adb || {};
  if (adb.available) {
    const devs = (adb.devices || []).map(d => `${escapeHtml(d.serial)} (${escapeHtml(d.state)}) ${escapeHtml(d.details || '')}`).join('<br>') || 'No devices reported by ADB.';
    adbStatusEl.innerHTML = `<strong>ADB:</strong> available at <code>${escapeHtml(adb.path)}</code><br><strong>ADB devices:</strong><br>${devs}`;
  } else {
    const localPath = adb.localInstallPath ? ` Local install target: <code>${escapeHtml(adb.localInstallPath)}</code>.` : '';
    adbStatusEl.innerHTML = `<strong>ADB:</strong> not found on PATH.${localPath} Use the button below to download Android Platform Tools locally, or install manually.`;
  }
}

function renderDevices(data) {
  devicesTbody.innerHTML = '';
  const devices = data.devices || [];
  if (!devices.length) {
    const tr = document.createElement('tr');
    tr.innerHTML = `<td colspan="6" class="muted">No matching present devices found. Click Refresh after connecting a device.</td>`;
    devicesTbody.appendChild(tr);
    return;
  }
  devices.forEach((d, idx) => {
    const tr = document.createElement('tr');
    tr.dataset.index = String(idx);
    const kind = d.kind || 'other';
    tr.innerHTML = `
      <td><span class="badge ${escapeHtml(kind)}">${escapeHtml(kind)}</span></td>
      <td>${escapeHtml(d.name)}</td>
      <td>${escapeHtml(d.status || '')}</td>
      <td>${escapeHtml(d.class || '')}</td>
      <td>${escapeHtml(d.manufacturer || '')}</td>
      <td><code>${escapeHtml(d.instanceId || '')}</code></td>`;
    tr.addEventListener('click', () => selectDevice(d, tr));
    devicesTbody.appendChild(tr);
  });
}

function selectDevice(d, tr) {
  selectedDevice = d;
  document.querySelectorAll('#devicesTable tbody tr').forEach(r => r.classList.remove('selected'));
  if (tr) tr.classList.add('selected');
  const kind = d.kind || 'other';
  selectedDeviceEl.innerHTML = `<strong>Selected:</strong> ${escapeHtml(d.name)} <span class="badge ${escapeHtml(kind)}">${escapeHtml(kind)}</span><br><small><code>${escapeHtml(d.instanceId || '')}</code></small>`;
  if (kind === 'android') {
    switchTab('android');
    selectedDeviceEl.innerHTML = `<strong>Selected:</strong> ${escapeHtml(d.name)} <span class="badge android">android</span><br><small><code>${escapeHtml(d.instanceId || '')}</code></small>`;
    markStepDone('detected', 'android');
  } else if (kind === 'controller') {
    switchTab('controller');
    selectedDeviceEl.innerHTML = `<strong>Selected:</strong> ${escapeHtml(d.name)} <span class="badge controller">controller</span><br><small><code>${escapeHtml(d.instanceId || '')}</code></small>`;
    markStepDone('detected', 'controller');
  }
}

async function loadDevices() {
  summaryEl.textContent = 'Loading devices...';
  try {
    const res = await fetch('/api/devices', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    latestData = data;
    renderSummary(data);
    renderDevices(data);
  } catch (e) {
    summaryEl.textContent = 'Failed to load devices: ' + e.message;
    adbStatusEl.textContent = '';
    devicesTbody.innerHTML = `<tr><td colspan="6">Error: ${escapeHtml(e.message)}</td></tr>`;
  }
}

async function installAdb() {
  installAdbBtn.disabled = true;
  adbInstallMsg.textContent = 'Downloading and installing Android Platform Tools...';
  try {
    const res = await fetch('/api/adb/install', { method: 'POST' });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || ('HTTP ' + res.status));
    adbInstallMsg.textContent = (data.message || 'ADB installed.') + (data.path ? ` Path: ${data.path}` : '');
    await loadDevices();
  } catch (e) {
    adbInstallMsg.textContent = 'Install failed: ' + e.message;
  } finally {
    installAdbBtn.disabled = false;
  }
}

async function fetchPhoneStatus() {
  const res = await fetch('/api/phone/status', { cache: 'no-store' });
  if (!res.ok) throw new Error('HTTP ' + res.status);
  return res.json();
}

function renderPhoneStatus(data) {
  if (!data || data.error) {
    phoneStatusEl.textContent = 'Phone status unavailable: ' + ((data && data.error) || 'unknown error');
    return;
  }
  if (!data.adbAvailable) {
    phoneStatusEl.innerHTML = '<strong>ADB:</strong> not available. Use <strong>Install ADB (Platform Tools)</strong> above.';
    return;
  }
  if (!data.serial) {
    phoneStatusEl.innerHTML = '<strong>ADB:</strong> ready, but no authorized phone is connected.<br>Connect USB, enable USB debugging, and accept the authorization prompt on the phone.';
    return;
  }
  const installed = data.installed
    ? `installed${data.version ? ' (v' + escapeHtml(data.version) + ')' : ''}`
    : 'not installed';
  const running = data.running ? 'running' : 'not running';
  const apk = data.apkAvailable ? 'APK ready' : 'APK missing';
  let html = `<strong>Phone:</strong> <code>${escapeHtml(data.serial)}</code><br>` +
    `<strong>Pawd Self Test:</strong> ${installed} · ${running}<br>` +
    `<strong>Bundle:</strong> ${apk}<br>` +
    `<strong>Auto-launch on connect:</strong> ${data.autoLaunch ? 'on' : 'off'}`;
  if (data.lastAutoResult && !data.lastAutoResult.ok) {
    html += `<br><strong>Last auto-launch:</strong> ${escapeHtml(data.lastAutoResult.error || 'failed')}`;
  }
  phoneStatusEl.innerHTML = html;
}

async function loadPhoneStatus() {
  try {
    const data = await fetchPhoneStatus();
    renderPhoneStatus(data);
    return data;
  } catch (e) {
    phoneStatusEl.textContent = 'Could not read phone status: ' + e.message;
    return null;
  }
}

async function startPhoneApp(manual = true) {
  if (phoneBusy) return;
  phoneBusy = true;
  launchPhoneBtn.disabled = true;
  addMarker('Started phone self-test app');
  phoneStatusEl.textContent = manual
    ? 'Installing and launching the phone test app...'
    : 'Phone detected — installing and launching the phone test app...';
  try {
    const res = await fetch('/api/phone/start', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || ('HTTP ' + res.status));
    markStepDone('ondevice', 'android');
    const lastLine = String(data.installOutput || '').trim().split('\n').filter(Boolean).pop() || '';
    phoneStatusEl.innerHTML = `<strong>Launched:</strong> ${escapeHtml(data.message || ('Phone app started on ' + data.serial))}` +
      (lastLine ? `<br><small>${escapeHtml(lastLine)}</small>` : '');
    await loadPhoneStatus();
  } catch (e) {
    phoneStatusEl.innerHTML = `<strong>Could not launch:</strong> ${escapeHtml(e.message)}`;
  } finally {
    phoneBusy = false;
    launchPhoneBtn.disabled = false;
  }
}

async function stopPhoneApp() {
  if (phoneBusy) return;
  phoneBusy = true;
  stopPhoneBtn.disabled = true;
  addMarker('Stopped phone self-test app');
  try {
    const res = await fetch('/api/phone/stop', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({}),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || ('HTTP ' + res.status));
    phoneStatusEl.textContent = data.message || 'Phone test app stopped.';
    await loadPhoneStatus();
  } catch (e) {
    phoneStatusEl.innerHTML = `<strong>Could not stop:</strong> ${escapeHtml(e.message)}`;
  } finally {
    phoneBusy = false;
    stopPhoneBtn.disabled = false;
  }
}

async function pollPhone() {
  try {
    const data = await fetchPhoneStatus();
    renderPhoneStatus(data);
  } catch (e) {
    // Polling is best-effort; manual actions surface errors.
  }
}

async function loadAutoLaunch() {
  try {
    const res = await fetch('/api/phone/auto', { cache: 'no-store' });
    const data = await res.json();
    autoLaunch = !!data.enabled;
    autoLaunchToggle.checked = autoLaunch;
  } catch (e) {
    // Keep the toggle at its current value.
  }
}

function renderDinputStatus(data) {
  dinputDevicesCache = data.dinputDevices || [];
  renderMappingEditor();
  if (!dinputStatusEl) return;
  const diDevices = dinputDevicesCache;
  const available = !!data.dinputAvailable;
  dinputStatusEl.hidden = false;
  if (!available) {
    dinputStatusEl.textContent = `DirectInput unavailable${data.dinputError ? ': ' + data.dinputError : ''}.`;
    return;
  }
  if (!diDevices.length) {
    dinputStatusEl.textContent = 'DirectInput ready · no joystick devices enumerated.';
    return;
  }
  const names = diDevices.map((d, i) => `#${i + 1} ${d.name || 'Unknown'}`).join(' · ');
  dinputStatusEl.innerHTML = `<strong>DirectInput devices (${diDevices.length}):</strong> ` +
    escapeHtml(names) +
    ` <button id="refreshDinputBtn" class="link-button" type="button">rescan</button>`;
  const btn = document.getElementById('refreshDinputBtn');
  if (btn) btn.addEventListener('click', refreshDinput);
}

async function refreshDinput() {
  if (!dinputStatusEl) return;
  dinputStatusEl.textContent = 'Rescanning DirectInput devices...';
  try {
    const res = await fetch('/api/controllers/dinput/refresh', {
      method: 'POST', headers: { 'Content-Type': 'application/json' }, body: '{}',
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || ('HTTP ' + res.status));
    renderDinputStatus(data);
    await loadControllers();
  } catch (e) {
    dinputStatusEl.textContent = 'DirectInput rescan failed: ' + e.message;
  }
}

const MAPPING_BUTTONS = ['a', 'b', 'x', 'y', 'lb', 'rb', 'back', 'start', 'ls', 'rs',
  'up', 'down', 'left', 'right', 'guide', 'touchpad', 'mic'];
const MAPPING_BUTTON_LABELS = {
  a: 'A', b: 'B', x: 'X', y: 'Y', lb: 'LB', rb: 'RB', back: 'Back', start: 'Start',
  ls: 'L3', rs: 'R3', up: 'D-up', down: 'D-down', left: 'D-left', right: 'D-right',
  guide: 'Guide', touchpad: 'Touchpad', mic: 'Mic',
};
const MAPPING_AXES = ['lx', 'ly', 'rx', 'ry'];
const MAPPING_TRIGGERS = ['lt', 'rt'];
const MAPPING_AXIS_LABELS = {
  lx: 'Left stick X', ly: 'Left stick Y', rx: 'Right stick X', ry: 'Right stick Y',
  lt: 'Left trigger', rt: 'Right trigger',
};
const MAPPING_SOURCES = ['lX', 'lY', 'lZ', 'lRx', 'lRy', 'lRz', 'rglSlider0', 'rglSlider1', 'lZ-low', 'lZ-high'];

function mappingDefaultsSafe() {
  return mappingDefaults || { buttons: {}, axes: {}, triggers: {} };
}

function mappingForGuid(guid) {
  const def = mappingDefaultsSafe();
  const saved = controllerMappings[guid];
  const mergedAxis = (group, keys) => {
    const out = {};
    keys.forEach(key => {
      out[key] = Object.assign({}, (def[group] || {})[key] || {},
        ((saved && saved[group]) || {})[key] || {});
    });
    return out;
  };
  return {
    guid,
    name: (saved && saved.name) || '',
    buttons: Object.assign({}, def.buttons || {}, (saved && saved.buttons) || {}),
    axes: mergedAxis('axes', MAPPING_AXES),
    triggers: mergedAxis('triggers', MAPPING_TRIGGERS),
  };
}

function mappingButtonOptions(selected) {
  let html = `<option value=""${selected === '' ? ' selected' : ''}>Unmapped</option>`;
  for (let i = 0; i < 32; i += 1) {
    html += `<option value="${i}"${selected === String(i) ? ' selected' : ''}>Button ${i}</option>`;
  }
  return html;
}

function mappingSourceOptions(selected) {
  return MAPPING_SOURCES.map(src =>
    `<option value="${escapeHtml(src)}"${selected === src ? ' selected' : ''}>${escapeHtml(src)}</option>`
  ).join('');
}

async function loadMappings() {
  if (!mappingStatusEl) return;
  try {
    const res = await fetch('/api/controllers/mappings', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    controllerMappings = Object.fromEntries((data.mappings || []).map(m => [m.guid, m]));
    mappingDefaults = data.default || null;
    mappingDeviceSignature = '';
    renderMappingEditor(true);
  } catch (e) {
    mappingStatusEl.textContent = 'Could not load mappings: ' + e.message;
  }
}

function renderMappingEditor(force = false) {
  if (!mappingDeviceEl || !mappingEditorEl || !mappingStatusEl) return;
  const devices = dinputDevicesCache;
  const signature = devices.map(d => d.guid).join('|');
  if (!force && signature === mappingDeviceSignature) return;
  mappingDeviceSignature = signature;
  const previous = mappingDeviceEl.value;
  mappingDeviceEl.innerHTML = devices.length
    ? devices.map((d, i) =>
        `<option value="${escapeHtml(d.guid)}">#${i + 1} ${escapeHtml(d.name || 'Unknown')}</option>`
      ).join('')
    : '<option value="">No DirectInput devices</option>';
  if (previous && devices.some(d => d.guid === previous)) mappingDeviceEl.value = previous;
  if (!devices.length) {
    mappingEditorEl.innerHTML = '<p class="muted">Connect a DirectInput joystick, wheel, or pad to edit its mapping.</p>';
    mappingStatusEl.textContent = 'No DirectInput devices detected.';
    return;
  }
  renderMappingFields();
}

function renderMappingFields() {
  if (!mappingDeviceEl || !mappingEditorEl) return;
  const guid = mappingDeviceEl.value;
  if (!guid) return;
  const index = dinputDevicesCache.findIndex(d => d.guid === guid);
  const name = index >= 0 ? (dinputDevicesCache[index].name || 'Unknown') : 'Unknown';
  const mapping = mappingForGuid(guid);
  let html = '<div class="mapping-section-title">Buttons</div>';
  MAPPING_BUTTONS.forEach(key => {
    const selected = mapping.buttons[key] == null ? '' : String(mapping.buttons[key]);
    html += `<div class="mapping-row" data-kind="button" data-key="${key}">
      <label>${escapeHtml(MAPPING_BUTTON_LABELS[key] || key)}</label>
      <select data-field="value" aria-label="${escapeHtml(key)} raw button">${mappingButtonOptions(selected)}</select>
      <button type="button" class="learn-btn" data-learn="button:${key}">Learn</button>
    </div>`;
  });
  const analogRows = (group, keys) => keys.map(key => {
    const cfg = mapping[group][key] || {};
    return `<div class="mapping-row" data-kind="${group === 'axes' ? 'axis' : 'trigger'}" data-key="${key}">
      <label>${escapeHtml(MAPPING_AXIS_LABELS[key] || key)}</label>
      <select data-field="source" aria-label="${escapeHtml(key)} source">${mappingSourceOptions(cfg.source || '')}</select>
      <label title="Reverse direction"><input type="checkbox" data-field="invert"${cfg.invert ? ' checked' : ''} /> invert</label>
    </div>`;
  }).join('');
  html += '<div class="mapping-section-title">Analog axes</div>' + analogRows('axes', MAPPING_AXES);
  html += '<div class="mapping-section-title">Triggers</div>' + analogRows('triggers', MAPPING_TRIGGERS);
  mappingEditorEl.innerHTML = html;
  const custom = !!controllerMappings[guid];
  mappingStatusEl.textContent = custom
    ? `Custom mapping for #${index + 1}: ${name}`
    : `Factory mapping for #${index + 1}: ${name} — click Save to customize.`;
}

function collectMappingFromEditor() {
  if (!mappingDeviceEl || !mappingEditorEl) return null;
  const guid = mappingDeviceEl.value;
  if (!guid) return null;
  const device = dinputDevicesCache.find(d => d.guid === guid) || {};
  const buttons = {};
  const axes = {};
  const triggers = {};
  mappingEditorEl.querySelectorAll('.mapping-row').forEach(row => {
    const kind = row.dataset.kind;
    const key = row.dataset.key;
    if (kind === 'button') {
      const value = row.querySelector('[data-field="value"]').value;
      buttons[key] = value === '' ? null : Number(value);
    } else {
      const cfg = {
        source: row.querySelector('[data-field="source"]').value,
        invert: row.querySelector('[data-field="invert"]').checked,
      };
      (kind === 'axis' ? axes : triggers)[key] = cfg;
    }
  });
  return { guid, name: device.name || '', buttons, axes, triggers };
}

let learningTimer = null;

function stopLearning(cancelled = false) {
  if (learningTimer) clearTimeout(learningTimer);
  learningTimer = null;
  learningTarget = null;
  learningBaseline = null;
  document.querySelectorAll('.learn-btn.listening').forEach(btn => {
    btn.classList.remove('listening');
    btn.textContent = 'Learn';
  });
  if (cancelled && mappingStatusEl) mappingStatusEl.textContent = 'Learn timed out — press Learn to try again.';
}

function startLearning(target, button) {
  stopLearning();
  learningTarget = target;
  const deviceIndex = mappingDeviceEl ? mappingDeviceEl.selectedIndex : 0;
  if (controllerSourceSelect) controllerSourceSelect.value = 'dinput';
  if (controllerIndexSelect) controllerIndexSelect.value = String(Math.max(0, deviceIndex));
  document.querySelectorAll('.learn-btn.listening').forEach(btn => {
    btn.classList.remove('listening');
    btn.textContent = 'Learn';
  });
  if (button) {
    button.classList.add('listening');
    button.textContent = 'Listening…';
  }
  mappingStatusEl.textContent = target.startsWith('button:')
    ? 'Press the physical button now…' : 'Move the physical axis now…';
  learningTimer = setTimeout(() => stopLearning(true), 10000);
  pollLiveState();
}

function applyLearnedValue(value) {
  if (!learningTarget || !mappingEditorEl) return;
  const [kind, key] = learningTarget.split(':');
  const row = mappingEditorEl.querySelector(
    `.mapping-row[data-kind="${kind}"][data-key="${key}"]`);
  if (!row) return;
  const field = row.querySelector(`[data-field="${kind === 'button' ? 'value' : 'source'}"]`);
  if (!field) return;
  field.value = String(value);
  stopLearning();
  mappingStatusEl.textContent = `Learned ${key} → ${value}. Click Save mapping to keep it.`;
  addMarker(`Learned ${key} = ${value}`);
}

function handleLearning(data) {
  if (!learningTarget || !data || data.source !== 'dinput') return;
  const state = data.state || {};
  const buttons = state.rawButtons || [];
  const axes = state.rawAllAxes || {};
  if (!learningBaseline) {
    learningBaseline = { buttons: new Set(buttons), axes: Object.assign({}, axes) };
    return;
  }
  if (learningTarget.startsWith('button:')) {
    const fresh = buttons.find(i => !learningBaseline.buttons.has(i));
    if (fresh !== undefined) applyLearnedValue(fresh);
  } else {
    for (const [source, value] of Object.entries(axes)) {
      const before = learningBaseline.axes[source];
      if (before !== undefined && Math.abs(value - before) > 3000) {
        applyLearnedValue(source);
        break;
      }
    }
  }
}

async function saveMapping() {
  const mapping = collectMappingFromEditor();
  if (!mapping || !mappingSaveBtn) return;
  mappingSaveBtn.disabled = true;
  try {
    const res = await fetch('/api/controllers/mappings', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(mapping),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || ('HTTP ' + res.status));
    controllerMappings[mapping.guid] = data.mapping;
    renderMappingFields();
    mappingStatusEl.textContent = 'Mapping saved for this device.';
    addMarker(`Saved button mapping for ${mapping.name || mapping.guid}`);
    pollLiveState();
  } catch (e) {
    mappingStatusEl.textContent = 'Could not save mapping: ' + e.message;
  } finally {
    mappingSaveBtn.disabled = false;
  }
}

async function resetMapping() {
  const mapping = collectMappingFromEditor();
  if (!mapping || !mappingResetBtn) return;
  mappingResetBtn.disabled = true;
  try {
    const res = await fetch('/api/controllers/mappings/reset', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ guid: mapping.guid }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || ('HTTP ' + res.status));
    delete controllerMappings[mapping.guid];
    renderMappingFields();
    mappingStatusEl.textContent = 'Mapping reset to factory defaults.';
    addMarker(`Reset button mapping for ${mapping.name || mapping.guid}`);
    pollLiveState();
  } catch (e) {
    mappingStatusEl.textContent = 'Could not reset mapping: ' + e.message;
  } finally {
    mappingResetBtn.disabled = false;
  }
}

function renderControllerStatus(data) {
  const controllers = data.controllers || [];
  const live = data.liveInputAvailable
    ? 'Live input ready (XInput / DirectInput)' : 'Live input unavailable';
  const demo = data.demoMode ? ' · demo mode ON' : '';
  const indices = (data.xinputIndices || []).map(i => `P${i + 1}`).join(', ');
  const xinfo = indices ? ` · XInput: ${indices}` : '';
  const diCount = data.dinputDeviceCount || 0;
  const diinfo = diCount ? ` · DirectInput: ${diCount}` : '';
  const summary = escapeHtml(live + xinfo + diinfo + demo);
  if (!controllers.length) {
    controllerStatusEl.innerHTML = '<strong>Controllers:</strong> none detected by PnP. ' +
      `Connect a gamepad, joystick, wheel, or flight stick and click Refresh controllers. ` +
      `<span class="muted">${summary}</span>`;
    renderDinputStatus(data);
    return;
  }
  const rows = controllers.map(c => {
    const ids = [c.vid ? `VID ${escapeHtml(c.vid)}` : null, c.pid ? `PID ${escapeHtml(c.pid)}` : null]
      .filter(Boolean).join(' / ');
    return `<div class="controller-row">
      <span class="badge controller">${escapeHtml(c.family || 'generic')}</span>
      <strong>${escapeHtml(c.name)}</strong>
      <span class="muted">${escapeHtml(c.status || '')}${ids ? ' · ' + ids : ''}</span>
    </div>`;
  }).join('');
  controllerStatusEl.innerHTML = `<strong>Controllers detected:</strong> ${controllers.length}<br>${rows}` +
    `<br><small class="muted">${summary}</small>`;
  renderDinputStatus(data);
}

async function loadControllers() {
  try {
    const res = await fetch('/api/controllers', { cache: 'no-store' });
    if (!res.ok) throw new Error('HTTP ' + res.status);
    const data = await res.json();
    renderControllerStatus(data);
    controllerAutoLaunch = !!data.autoLaunch;
    controllerAutoToggle.checked = controllerAutoLaunch;
    if (typeof data.demoMode === 'boolean') {
      controllerDemo = !!data.demoMode;
      controllerDemoToggle.checked = controllerDemo;
    }
    const at = data.lastAutoResult && data.lastAutoResult.at;
    if (!controllerAutoPrimed) {
      controllerAutoPrimed = true;
      lastControllerAutoAt = at || 0;
    } else if (controllerAutoLaunch && at && at > lastControllerAutoAt) {
      lastControllerAutoAt = at;
      switchTab('controller');
      addMarker('Auto-detected a controller');
      markStepDone('detected', 'controller');
      controllerStatusEl.innerHTML += '<br><strong>Auto-opened controller tests.</strong>';
    }
    return data;
  } catch (e) {
    controllerStatusEl.textContent = 'Could not read controller status: ' + e.message;
    return null;
  }
}

async function pollControllers() {
  await loadControllers();
}

async function loadControllerAuto() {
  try {
    const res = await fetch('/api/controllers/auto', { cache: 'no-store' });
    const data = await res.json();
    controllerAutoLaunch = !!data.enabled;
    controllerAutoToggle.checked = controllerAutoLaunch;
    lastControllerAutoAt = (data.lastResult && data.lastResult.at) || 0;
    controllerAutoPrimed = true;
  } catch (e) {
    // Keep the toggle at its current value.
  }
}

async function setControllerAuto(enabled) {
  controllerAutoToggle.disabled = true;
  try {
    const res = await fetch('/api/controllers/auto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || ('HTTP ' + res.status));
    controllerAutoLaunch = !!data.enabled;
    controllerAutoToggle.checked = controllerAutoLaunch;
    controllerAutoPrimed = false;
    addMarker(`Controller auto-launch ${enabled ? 'enabled' : 'disabled'}`);
    await loadControllers();
  } catch (e) {
    controllerAutoToggle.checked = !enabled;
    controllerStatusEl.innerHTML = `<strong>Could not update controller auto-launch:</strong> ${escapeHtml(e.message)}`;
  } finally {
    controllerAutoToggle.disabled = false;
  }
}

/* ---------- Live controller input ---------- */

const BUTTON_LABELS = {
  up: 'D-up', down: 'D-down', left: 'D-left', right: 'D-right',
  start: 'Start', back: 'Back', ls: 'L3', rs: 'R3',
  lb: 'LB', rb: 'RB', guide: 'Guide', touchpad: 'Touchpad', mic: 'Mic',
  a: 'A', b: 'B', x: 'X', y: 'Y',
};

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

const buttonEls = {};
document.querySelectorAll('[data-btn]').forEach(el => {
  buttonEls[el.dataset.btn] = el;
});

function moveStick(el, x, y) {
  if (!el) return;
  const dot = el.querySelector('.stick-dot');
  if (!dot) return;
  const nx = Math.max(-1, Math.min(1, Number(x) || 0));
  const ny = Math.max(-1, Math.min(1, Number(y) || 0));
  const radius = (el.clientWidth || 80) / 2 - 10;
  dot.style.transform = `translate(calc(${nx * radius}px - 50%), calc(${-ny * radius}px - 50%))`;
}

function noteObserved(state) {
  const before = observedInputs.buttons.size;
  const beforeStick = observedInputs.stickMove;
  const beforeTrigger = observedInputs.triggerMove;
  Object.entries(state.buttons || {}).forEach(([name, pressed]) => {
    if (pressed) observedInputs.buttons.add(name);
  });
  const axes = state.axes || {};
  if (['lx', 'ly', 'rx', 'ry'].some(k => Math.abs(Number(axes[k]) || 0) > 0.25)) {
    observedInputs.stickMove = true;
  }
  const triggers = state.triggers || {};
  if (Number(triggers.lt) > 0.1 || Number(triggers.rt) > 0.1) {
    observedInputs.triggerMove = true;
  }
  if (observedInputs.buttons.size > before) {
    const latest = Array.from(observedInputs.buttons).slice(-3).map(k => BUTTON_LABELS[k] || k).join(', ');
    addMarker(`Observed controller buttons: ${latest}`);
  }
  if (!beforeStick && observedInputs.stickMove) addMarker('Observed analog stick movement');
  if (!beforeTrigger && observedInputs.triggerMove) addMarker('Observed analog trigger movement');

  const allFace = ['a', 'b', 'x', 'y'].every(k => observedInputs.buttons.has(k));
  const shoulder = ['lb', 'rb'].every(k => observedInputs.buttons.has(k));
  const dpad = ['up', 'down', 'left', 'right'].every(k => observedInputs.buttons.has(k));
  if (allFace && shoulder) markStepDone('buttons', 'controller');
  if (observedInputs.stickMove) markStepDone('sticks', 'controller');
  if (observedInputs.triggerMove && dpad) markStepDone('triggers', 'controller');
}

function renderObserved() {
  const names = Array.from(observedInputs.buttons).map(k => BUTTON_LABELS[k] || k);
  observedButtonsEl.textContent = names.length ? names.join(', ') : 'none yet';
  observedButtonsEl.classList.toggle('muted', !names.length);
  const parts = [];
  if (observedInputs.stickMove) parts.push('sticks moved');
  if (observedInputs.triggerMove) parts.push('triggers moved');
  observedAxesEl.textContent = parts.length ? 'Observed: ' + parts.join(', ') : 'Sticks/triggers: not moved yet';
}

function renderLive(data) {
  const source = data.source;
  const state = data.state;
  if (mappingRawEl) {
    if (source === 'dinput' && state) {
      const rawButtons = state.rawButtons || [];
      const axes = state.rawAllAxes || {};
      const axisText = Object.entries(axes).map(([key, value]) => `${key}:${value}`).join('  ');
      mappingRawEl.textContent = `Raw buttons: ${rawButtons.length ? rawButtons.join(', ') : 'none'} · ${axisText}`;
    } else {
      mappingRawEl.textContent = 'Raw input: select DirectInput as the input source to inspect.';
    }
  }
  if (!data.available || !state) {
    const reasons = [];
    if (!data.xinputAvailable && data.xinputError) reasons.push('XInput: ' + data.xinputError);
    if (data.dinputError) reasons.push('DirectInput: ' + data.dinputError);
    liveSourceEl.textContent = 'No input on this index';
    liveSourceEl.className = 'live-source off';
    const err = reasons.length ? ` (${escapeHtml(reasons.join(' · '))})` : '';
    liveMetaEl.textContent = 'Connect a controller, choose an input source, or enable demo mode' + err;
    Object.values(buttonEls).forEach(el => el.classList.remove('active'));
    moveStick(stickLeftEl, 0, 0);
    moveStick(stickRightEl, 0, 0);
    triggerLTEl.style.width = '0%';
    triggerRTEl.style.width = '0%';
    return;
  }
  const demo = source === 'demo';
  applyGlyphs(state.deviceName);
  const label = source === 'dinput'
    ? `DirectInput · #${state.index + 1}`
    : (demo ? 'Demo mode (synthetic)' : `XInput · Player ${state.index + 1}`);
  liveSourceEl.textContent = label;
  liveSourceEl.className = 'live-source' + (demo ? ' demo' : ' on');

  Object.entries(buttonEls).forEach(([name, el]) => {
    el.classList.toggle('active', !!(state.buttons && state.buttons[name]));
  });
  moveStick(stickLeftEl, state.axes && state.axes.lx, state.axes && state.axes.ly);
  moveStick(stickRightEl, state.axes && state.axes.rx, state.axes && state.axes.ry);
  const lt = (state.triggers && state.triggers.lt) || 0;
  const rt = (state.triggers && state.triggers.rt) || 0;
  triggerLTEl.style.width = `${Math.round(lt * 100)}%`;
  triggerRTEl.style.width = `${Math.round(rt * 100)}%`;

  const battery = state.battery || {};
  const pct = battery.percent != null ? `${battery.percent}%` : 'unknown';
  const device = state.deviceName ? `${state.deviceName} · ` : '';
  liveMetaEl.textContent = device + `Packet ${state.packet} · Battery ${pct} · ` +
    `LT ${Math.round(lt * 100)}% / RT ${Math.round(rt * 100)}%`;
  noteObserved(state);
  renderObserved();
}

async function pollLiveState() {
  if (activeTab !== 'controller') return;
  try {
    const index = controllerIndexSelect.value || '0';
    const source = controllerSourceSelect ? controllerSourceSelect.value : 'auto';
    const res = await fetch(`/api/controllers/state?index=${encodeURIComponent(index)}&source=${encodeURIComponent(source)}`, { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    handleLearning(data);
    renderLive(data);
  } catch (e) {
    // Best-effort polling; transient errors are ignored.
  }
}

function startLivePolling() {
  if (livePollTimer) return;
  pollLiveState();
  livePollTimer = setInterval(pollLiveState, 100);
}

function stopLivePolling() {
  if (livePollTimer) clearInterval(livePollTimer);
  livePollTimer = null;
}

function batterySelection() {
  return {
    index: controllerIndexSelect.value || '0',
    source: controllerSourceSelect ? controllerSourceSelect.value : 'auto',
  };
}

function renderBatterySample(sample) {
  if (!sample) return;
  const pct = sample.percent != null ? `${sample.percent}%` : '--%';
  batteryPercentEl.textContent = pct;
  const precision = sample.precision ? ` · ${sample.precision}` : '';
  batterySourceEl.textContent = `${sample.device || sample.source || 'unknown'}${precision}`;
  batteryNoteEl.textContent = sample.note || '';
  if (sample.available === false) batteryStateEl.textContent = 'Unavailable';
}

function renderBattery(data) {
  if (!data) return;
  const samples = data.samples || [];
  const last = samples.length ? samples[samples.length - 1] : null;
  if (last) renderBatterySample(last);

  const result = data.result;
  const status = data.running ? 'running' : (result ? result.status : 'idle');
  batteryStateEl.textContent = status === 'idle' ? 'Idle' : status.toUpperCase();
  batteryStateEl.className = 'battery-state muted' +
    (status === 'running' ? ' running' : '') +
    (status === 'pass' ? ' pass' : '') +
    (status === 'fail' ? ' fail' : '');

  if (data.durationMs && data.startedAt) {
    const elapsed = Math.max(0, Date.now() - data.startedAt * 1000);
    batteryProgressFill.style.width = Math.min(100, elapsed / data.durationMs * 100) + '%';
  } else {
    batteryProgressFill.style.width = '0%';
  }

  if (!result) {
    batteryResultEl.textContent = data.running
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
    batteryResultEl.textContent = text;
    if (result.status === 'pass') markStepDone('battery', 'controller');
  }

  if (!samples.length) {
    batterySamplesEl.textContent = 'No samples yet.';
  } else {
    batterySamplesEl.textContent = samples.slice(-12).map(s => {
      const time = new Date(s.at * 1000).toLocaleTimeString();
      const pct = s.percent != null ? `${s.percent}%` : 'n/a';
      const charge = s.charging === true ? 'charging' : (s.charging === false ? 'discharging' : '');
      return `${time}  ${pct}  ${s.source || ''}${charge ? ' · ' + charge : ''}`;
    }).join('\n');
  }
}

async function pollBattery() {
  if (activeTab !== 'controller') return;
  try {
    const res = await fetch('/api/controllers/battery', { cache: 'no-store' });
    if (!res.ok) return;
    renderBattery(await res.json());
  } catch (e) {
    // Best-effort polling; transient errors are ignored.
  }
}

function startBatteryPolling() {
  if (batteryPollTimer) return;
  pollBattery();
  batteryPollTimer = setInterval(pollBattery, 2000);
}

function stopBatteryPolling() {
  if (batteryPollTimer) clearInterval(batteryPollTimer);
  batteryPollTimer = null;
}

async function batteryPost(path, body) {
  const res = await fetch(path, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  return res.json().catch(() => ({}));
}

async function batteryReadNow() {
  try {
    const data = await batteryPost('/api/controllers/battery/sample', batterySelection());
    if (data.samples) renderBattery(data);
    else renderBatterySample(data);
  } catch (e) {
    batteryNoteEl.textContent = `Read failed: ${e.message}`;
  }
}

async function batteryStartTest() {
  const body = {
    ...batterySelection(),
    mode: batteryModeEl.value,
    durationMs: Math.max(0, Number(batteryDurationEl.value) || 0) * 60000,
    intervalMs: Math.max(1, Number(batteryIntervalEl.value) || 5) * 1000,
  };
  try {
    const data = await batteryPost('/api/controllers/battery/start', body);
    if (data.ok) {
      addMarker(`Battery ${body.mode} test started`);
      renderBattery(data);
    } else {
      batteryResultEl.textContent = `Could not start: ${data.error || 'unknown error'}`;
    }
  } catch (e) {
    batteryResultEl.textContent = `Could not start: ${e.message}`;
  }
}

async function batteryStopTest() {
  try {
    const data = await batteryPost('/api/controllers/battery/stop', {});
    if (data.ok) {
      addMarker('Battery test stopped');
      renderBattery(data);
    }
  } catch (e) {
    batteryResultEl.textContent = `Could not stop: ${e.message}`;
  }
}

async function batteryResetTest() {
  try {
    const data = await batteryPost('/api/controllers/battery/reset', {});
    renderBattery(data);
  } catch (e) {
    batteryResultEl.textContent = `Could not clear: ${e.message}`;
  }
}

async function setControllerDemo(enabled) {
  controllerDemoToggle.disabled = true;
  try {
    const res = await fetch('/api/controllers/demo', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || ('HTTP ' + res.status));
    controllerDemo = !!data.enabled;
    controllerDemoToggle.checked = controllerDemo;
    addMarker(`Demo mode ${enabled ? 'enabled' : 'disabled'}`);
    await loadControllers();
    await pollLiveState();
  } catch (e) {
    controllerDemoToggle.checked = !enabled;
    liveMetaEl.textContent = `Could not change demo mode: ${e.message}`;
  } finally {
    controllerDemoToggle.disabled = false;
  }
}

async function pulseRumble(left, right, duration, stop = false) {
  rumbleBtn.disabled = true;
  rumbleStopBtn.disabled = true;
  try {
    const res = await fetch('/api/controllers/rumble', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        index: Number(controllerIndexSelect.value || 0),
        left: stop ? 0 : left,
        right: stop ? 0 : right,
        durationMs: stop ? 50 : duration,
      }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || ('HTTP ' + res.status));
    if (stop) {
      rumbleStatusEl.textContent = 'Rumble stopped.';
      addMarker('Stopped rumble');
    } else {
      rumbleStatusEl.textContent = `Pulsed ${Math.round(left * 100)}% / ${Math.round(right * 100)}% for ${duration} ms` +
        (data.simulated ? ' (simulated in demo mode)' : '');
      addMarker(`Rumble test: ${Math.round(left * 100)}/${Math.round(right * 100)}% for ${duration}ms`);
      markStepDone('rumble', 'controller');
    }
  } catch (e) {
    rumbleStatusEl.textContent = `Rumble failed: ${e.message}`;
  } finally {
    rumbleBtn.disabled = false;
    rumbleStopBtn.disabled = false;
  }
}

/* ---------- Session recording ---------- */

let recorder = null;
let recordStream = null;
let recordChunks = [];
let recordMarkers = [];
let recordStartAt = 0;
let recordTimer = null;
let recording = false;

function base64url(value) {
  const bytes = new TextEncoder().encode(value);
  let binary = '';
  bytes.forEach(b => { binary += String.fromCharCode(b); });
  return btoa(binary).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
}

function formatDuration(ms) {
  const total = Math.max(0, Math.floor(ms / 1000));
  const m = String(Math.floor(total / 60)).padStart(2, '0');
  const s = String(total % 60).padStart(2, '0');
  return `${m}:${s}`;
}

async function startRecording() {
  if (recording) return;
  if (!window.MediaRecorder) {
    recordStatusEl.textContent = 'This browser does not support MediaRecorder. Use a recent Chrome or Edge.';
    return;
  }
  const mode = recordSource.value;
  try {
    if (mode === 'camera') {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
        throw new Error('Webcam capture is not available in this browser.');
      }
      recordStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 } },
        audio: false,
      });
    } else {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        throw new Error('Screen/window capture needs Chrome or Edge on http://127.0.0.1 (or HTTPS).');
      }
      recordStream = await navigator.mediaDevices.getDisplayMedia({
        video: { frameRate: { ideal: 30 } },
        audio: false,
      });
    }
  } catch (e) {
    recordStatusEl.textContent = 'Recording cancelled: ' + e.message;
    return;
  }

  const mime = ['video/webm;codecs=vp9', 'video/webm;codecs=vp8', 'video/webm']
    .find(m => MediaRecorder.isTypeSupported(m));
  try {
    recorder = new MediaRecorder(recordStream, mime ? { mimeType: mime, videoBitsPerSecond: 2500000 } : undefined);
  } catch (e) {
    stopStream();
    recordStatusEl.textContent = 'Could not start recorder: ' + e.message;
    return;
  }

  recordChunks = [];
  recordMarkers = [];
  recordStartAt = Date.now();
  recording = true;
  recorder.ondataavailable = e => {
    if (e.data && e.data.size) recordChunks.push(e.data);
  };
  recorder.onstop = saveRecording;
  const videoTrack = recordStream.getVideoTracks()[0];
  if (videoTrack) {
    videoTrack.addEventListener('ended', () => {
      if (recording) stopRecording();
    }, { once: true });
  }
  recorder.start(1000);

  recordStartBtn.disabled = true;
  recordStopBtn.disabled = false;
  recordSource.disabled = true;
  recIndicator.textContent = 'REC';
  recIndicator.classList.add('on');
  addMarker(`Recording started (${mode})`);
  recordTimer = setInterval(() => {
    recordStatusEl.textContent = `Recording ${formatDuration(Date.now() - recordStartAt)} · ${recordMarkers.length} markers`;
  }, 250);
  recordStatusEl.textContent = `Recording ${mode === 'camera' ? 'webcam' : 'screen/window'}...`;
}

function stopStream() {
  if (recordStream) {
    recordStream.getTracks().forEach(t => {
      try { t.stop(); } catch (e) { /* already stopped */ }
    });
    recordStream = null;
  }
}

function stopRecording() {
  if (!recording || !recorder) return;
  addMarker('Recording stopped');
  recording = false;
  if (recordTimer) clearInterval(recordTimer);
  recordTimer = null;
  try {
    recorder.stop();
  } catch (e) {
    recordStatusEl.textContent = 'Recorder stop failed: ' + e.message;
  }
  recordStartBtn.disabled = false;
  recordStopBtn.disabled = true;
  recordSource.disabled = false;
  recIndicator.textContent = 'Idle';
  recIndicator.classList.remove('on');
  recordStatusEl.textContent = 'Saving recording...';
}

async function saveRecording() {
  stopStream();
  const durationMs = Date.now() - recordStartAt;
  const blob = new Blob(recordChunks, { type: recorder.mimeType || 'video/webm' });
  const stamp = new Date().toISOString().replace(/[:.]/g, '-');
  const name = `pawd-${activeTab}-${stamp}.webm`;
  const stepResults = stepSets[activeTab].steps.map(s => ({
    id: s.id,
    title: s.title,
    status: stepStatus(activeTab, s.id),
  }));
  const meta = {
    tab: activeTab,
    durationMs,
    startedAt: Math.round(recordStartAt / 1000),
    mimeType: blob.type,
    markers: recordMarkers,
    completedSteps: stepResults.filter(s => s.status === 'pass').map(s => s.title),
    stepResults,
    device: selectedDevice ? selectedDevice.name : null,
  };
  try {
    const res = await fetch(`/api/recordings/save?name=${encodeURIComponent(name)}&meta=${base64url(JSON.stringify(meta))}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/octet-stream' },
      body: blob,
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || ('HTTP ' + res.status));
    recordStatusEl.textContent = `Saved ${name} (${formatDuration(durationMs)}, ${recordMarkers.length} markers).`;
    await loadRecordings();
  } catch (e) {
    recordStatusEl.textContent = 'Could not save recording: ' + e.message;
  } finally {
    recorder = null;
    recordChunks = [];
  }
}

function formatBytes(n) {
  const v = Number(n || 0);
  if (v < 1024) return `${v} B`;
  if (v < 1048576) return `${(v / 1024).toFixed(1)} KB`;
  return `${(v / 1048576).toFixed(1)} MB`;
}

function renderRecordings(data) {
  recordingsListEl.innerHTML = '';
  const items = data.recordings || [];
  if (!items.length) {
    recordingsListEl.innerHTML = '<p class="muted">No recordings yet. Start a recording above to capture this test session.</p>';
    return;
  }
  items.forEach(item => {
    const meta = item.meta || {};
    const date = new Date(item.created * 1000).toLocaleString();
    const div = document.createElement('div');
    div.className = 'recording';
    const markers = (meta.markers || []).length;
    div.innerHTML = `
      <div class="recording-head">
        <strong>${escapeHtml(item.name)}</strong>
        <span class="muted">${escapeHtml(date)} · ${formatBytes(item.size)} · ${escapeHtml(meta.tab || 'session')} · ${markers} markers</span>
        <button class="secondary" data-delete="${escapeHtml(item.name)}">Delete</button>
      </div>
      <video controls preload="none" src="/api/recordings/file?name=${encodeURIComponent(item.name)}"></video>`;
    div.querySelector('[data-delete]').addEventListener('click', async () => {
      if (!confirm(`Delete ${item.name}?`)) return;
      try {
        const res = await fetch('/api/recordings/delete', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ name: item.name }),
        });
        const result = await res.json().catch(() => ({}));
        if (!res.ok || !result.ok) throw new Error(result.error || ('HTTP ' + res.status));
        await loadRecordings();
      } catch (e) {
        recordStatusEl.textContent = 'Delete failed: ' + e.message;
      }
    });
    recordingsListEl.appendChild(div);
  });
}

async function loadRecordings() {
  try {
    const res = await fetch('/api/recordings', { cache: 'no-store' });
    const data = await res.json();
    renderRecordings(data);
  } catch (e) {
    recordingsListEl.textContent = 'Could not load recordings: ' + e.message;
  }
}

/* ---------- Test reports ---------- */

const reportTesterEl = document.getElementById('reportTester');
const reportNotesEl = document.getElementById('reportNotes');
const reportStatusEl = document.getElementById('reportStatus');
const reportsListEl = document.getElementById('reportsList');
const generateReportBtn = document.getElementById('generateReportBtn');
const downloadReportBtn = document.getElementById('downloadReportBtn');

const REPORT_BADGE = { pass: 'PASS', fail: 'FAIL', skip: 'SKIP', not_tested: '—' };

async function collectReportData() {
  const asJson = (path, fallback) =>
    fetch(path, { cache: 'no-store' }).then(r => r.ok ? r.json() : fallback).catch(() => fallback);
  const [controllers, phone, recordings, battery] = await Promise.all([
    asJson('/api/controllers', null),
    asJson('/api/phone/status', null),
    asJson('/api/recordings', { recordings: [] }),
    asJson('/api/controllers/battery', null),
  ]);

  const walkthroughs = {};
  ['android', 'controller'].forEach(cat => {
    walkthroughs[cat] = stepSets[cat].steps.map(s => ({
      id: s.id,
      title: s.title,
      desc: s.desc,
      status: stepStatus(cat, s.id),
    }));
  });
  const all = [...walkthroughs.android, ...walkthroughs.controller];
  const pass = all.filter(s => s.status === 'pass').length;
  const fail = all.filter(s => s.status === 'fail').length;
  const skip = all.filter(s => s.status === 'skip').length;
  const notTested = all.filter(s => s.status === 'not_tested').length;
  const overall = fail ? 'FAIL' : (notTested === 0 ? 'PASS' : 'PARTIAL');

  return {
    generatedAt: new Date().toISOString(),
    version: appVersion,
    session: {
      startedAt: new Date(sessionStartedAt).toISOString(),
      durationMs: Date.now() - sessionStartedAt,
      tester: reportTesterEl.value.trim(),
      notes: reportNotesEl.value.trim(),
    },
    devices: {
      selected: selectedDevice ? {
        name: selectedDevice.name,
        kind: selectedDevice.kind,
        status: selectedDevice.status,
        class: selectedDevice.class,
        manufacturer: selectedDevice.manufacturer,
        instanceId: selectedDevice.instanceId,
      } : null,
      controllerPnp: (controllers && controllers.controllers) || [],
      xinputIndices: (controllers && controllers.xinputIndices) || [],
      dinputDevices: (controllers && controllers.dinputDevices) || [],
      dinputAvailable: !!(controllers && controllers.dinputAvailable),
      inputSources: (controllers && controllers.inputSources) || [],
      liveInputAvailable: !!(controllers && controllers.liveInputAvailable),
      demoMode: !!(controllers && controllers.demoMode),
      phone: phone ? {
        serial: phone.serial,
        adbAvailable: phone.adbAvailable,
        installed: phone.installed,
        version: phone.version,
        running: phone.running,
        apkAvailable: phone.apkAvailable,
      } : null,
    },
    walkthroughs,
    observations: {
      buttons: Array.from(observedInputs.buttons),
      stickMove: observedInputs.stickMove,
      triggerMove: observedInputs.triggerMove,
      activeCategory: activeTab,
    },
    recordings: (recordings.recordings || []).map(r => ({
      name: r.name,
      size: r.size,
      created: r.created,
      durationMs: (r.meta || {}).durationMs,
      markers: ((r.meta || {}).markers || []).length,
      tab: (r.meta || {}).tab,
    })),
    battery: battery ? {
      mode: battery.mode,
      running: battery.running,
      startedAt: battery.startedAt,
      durationMs: battery.durationMs,
      result: battery.result,
      samples: (battery.samples || []).map(s => ({
        at: s.at, percent: s.percent, charging: s.charging,
        source: s.source, precision: s.precision, device: s.device,
      })),
    } : null,
    summary: { total: all.length, pass, fail, skip, notTested, overall },
  };
}

function reportStatusBadge(status) {
  const cls = status === 'pass' ? 'pass' : status === 'fail' ? 'fail' : status === 'skip' ? 'skip' : 'nt';
  return `<span class="rpt-badge ${cls}">${REPORT_BADGE[status] || '—'}</span>`;
}

function reportDeviceRow(label, value) {
  return `<tr><th>${escapeHtml(label)}</th><td>${escapeHtml(value == null || value === '' ? '—' : value)}</td></tr>`;
}

function buildReportHtml(data) {
  const origin = window.location.origin;
  const s = data.summary;
  const d = data.devices;
  const gen = new Date(data.generatedAt).toLocaleString();
  const start = new Date(data.session.startedAt).toLocaleString();
  const dur = Math.max(0, Math.floor(data.session.durationMs / 1000));
  const duration = `${String(Math.floor(dur / 60)).padStart(2, '0')}:${String(dur % 60).padStart(2, '0')}`;

  const pnpRows = d.controllerPnp.length
    ? d.controllerPnp.map(c => `<tr>
        <td>${escapeHtml(c.family || 'generic')}</td>
        <td>${escapeHtml(c.name)}</td>
        <td>${escapeHtml([c.vid && `VID ${c.vid}`, c.pid && `PID ${c.pid}`].filter(Boolean).join(' / '))}</td>
        <td>${escapeHtml(c.status || '')}</td>
      </tr>`).join('')
    : '<tr><td colspan="4" class="rpt-muted">No game controllers detected by PnP.</td></tr>';

  const phone = d.phone;
  const phoneRows = phone
    ? reportDeviceRow('ADB available', phone.adbAvailable ? 'Yes' : 'No') +
      reportDeviceRow('Serial', phone.serial) +
      reportDeviceRow('Pawd Self Test installed', phone.installed ? `Yes${phone.version ? ` (v${phone.version})` : ''}` : 'No') +
      reportDeviceRow('Self Test running', phone.running ? 'Yes' : 'No') +
      reportDeviceRow('Bundled APK available', phone.apkAvailable ? 'Yes' : 'No')
    : '<tr><td colspan="2" class="rpt-muted">Phone status unavailable.</td></tr>';

  const selected = d.selected;
  const selectedRows = selected
    ? reportDeviceRow('Name', selected.name) +
      reportDeviceRow('Type', selected.kind) +
      reportDeviceRow('Status', selected.status) +
      reportDeviceRow('Class', selected.class) +
      reportDeviceRow('Manufacturer', selected.manufacturer) +
      reportDeviceRow('Instance ID', selected.instanceId)
    : '<tr><td colspan="2" class="rpt-muted">No device was selected in the UI.</td></tr>';

  const walkthroughHtml = ['android', 'controller'].map(cat => {
    const title = cat === 'android' ? 'Android phone' : 'Game controllers';
    const steps = data.walkthroughs[cat];
    const rows = steps.map(st => `<tr>
        <td class="rpt-status">${reportStatusBadge(st.status)}</td>
        <td><strong>${escapeHtml(st.title)}</strong><br><span class="rpt-muted">${escapeHtml(st.desc)}</span></td>
      </tr>`).join('');
    return `<h3>${title}</h3>
      <table class="rpt-steps"><thead><tr><th>Result</th><th>Step</th></tr></thead><tbody>${rows}</tbody></table>`;
  }).join('');

  const obs = data.observations;
  const obsButtons = obs.buttons.length ? obs.buttons.map(b => `<span class="rpt-chip">${escapeHtml(b)}</span>`).join('') : '<span class="rpt-muted">none</span>';
  const obsHtml = `
    <p><strong>Controller inputs observed:</strong> ${obsButtons}</p>
    <p><strong>Analog sticks:</strong> ${obs.stickMove ? 'movement detected' : 'not detected'} &nbsp;·&nbsp;
       <strong>Triggers:</strong> ${obs.triggerMove ? 'movement detected' : 'not detected'}</p>
    <p><strong>Live input sources available:</strong> ${(d.inputSources.length ? d.inputSources : ['none']).map(escapeHtml).join(', ')}
       ${d.demoMode ? ' &nbsp;·&nbsp; demo mode ON' : ''}</p>
    <p><strong>XInput players:</strong> ${d.xinputIndices.length ? d.xinputIndices.map(i => `P${i + 1}`).join(', ') : 'none'}
       &nbsp;·&nbsp; <strong>DirectInput devices:</strong> ${d.dinputDevices.length ? escapeHtml(d.dinputDevices.map(x => x.name).join(', ')) : 'none'}</p>
    <p><strong>Active test category:</strong> ${escapeHtml(obs.activeCategory)}</p>`;

  const batteryData = data.battery;
  let batteryHtml = '<p class="rpt-muted">No battery test was run in this session.</p>';
  if (batteryData) {
    const result = batteryData.result;
    const summary = result
      ? `<p><strong>Result:</strong> ${escapeHtml((result.status || 'unknown').toUpperCase())} — ${escapeHtml(result.reason || '')}
           ${result.startPercent != null && result.endPercent != null ? ` (${result.startPercent}% → ${result.endPercent}%)` : ''}
           ${result.estimatedRuntimeMinutes != null ? ` · estimated runtime ${result.estimatedRuntimeMinutes} min` : ''}</p>`
      : '<p class="rpt-muted">Test was still running when the report was generated.</p>';
    const rows = (batteryData.samples || []).map(s => `<tr>
        <td>${escapeHtml(new Date(s.at * 1000).toLocaleString())}</td>
        <td>${escapeHtml(s.percent == null ? '—' : s.percent + '%')}</td>
        <td>${escapeHtml(s.charging === true ? 'charging' : s.charging === false ? 'discharging' : '—')}</td>
        <td>${escapeHtml(s.device || s.source || '—')}</td>
        <td>${escapeHtml(s.precision || '—')}</td>
      </tr>`).join('');
    batteryHtml = summary + (rows
      ? `<table><thead><tr><th>Time</th><th>Level</th><th>State</th><th>Source</th><th>Precision</th></tr></thead><tbody>${rows}</tbody></table>`
      : '<p class="rpt-muted">No battery samples were recorded.</p>');
  }

  const recordRows = data.recordings.length
    ? data.recordings.map(r => {
        const secs = r.durationMs ? `${Math.round(r.durationMs / 1000)}s` : '—';
        const date = new Date(r.created * 1000).toLocaleString();
        return `<tr>
          <td><a href="${origin}/api/recordings/file?name=${encodeURIComponent(r.name)}">${escapeHtml(r.name)}</a></td>
          <td>${escapeHtml(date)}</td>
          <td>${escapeHtml(r.tab || '—')}</td>
          <td>${escapeHtml(secs)}</td>
          <td>${r.markers}</td>
        </tr>`;
      }).join('')
    : '<tr><td colspan="5" class="rpt-muted">No recordings in this session.</td></tr>';

  const overallCls = s.overall === 'PASS' ? 'pass' : s.overall === 'FAIL' ? 'fail' : 'partial';

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Pawd Test Report — ${escapeHtml(data.session.tester || gen)}</title>
<style>
  :root { --ink:#0f172a; --muted:#64748b; --line:#e2e8f0; --bg:#f8fafc; --pass:#15803d; --fail:#b91c1c; --skip:#a16207; }
  * { box-sizing:border-box; }
  body { margin:0 auto; max-width:960px; padding:32px 24px 64px; font-family:Segoe UI,system-ui,sans-serif; color:var(--ink); background:var(--bg); line-height:1.5; }
  h1 { margin:0 0 4px; font-size:1.8rem; }
  h2 { margin:28px 0 10px; font-size:1.25rem; border-bottom:2px solid var(--line); padding-bottom:6px; }
  h3 { margin:18px 0 8px; font-size:1.05rem; }
  .rpt-head { display:flex; justify-content:space-between; align-items:flex-start; gap:16px; margin-bottom:20px; }
  .rpt-brand { color:var(--muted); font-weight:700; letter-spacing:.08em; text-transform:uppercase; font-size:.75rem; }
  .rpt-sub { color:var(--muted); font-size:.9rem; }
  .rpt-overall { font-size:1.1rem; font-weight:800; padding:8px 16px; border-radius:999px; }
  .rpt-overall.pass { background:#dcfce7; color:var(--pass); }
  .rpt-overall.fail { background:#fee2e2; color:var(--fail); }
  .rpt-overall.partial { background:#fef3c7; color:var(--skip); }
  .rpt-cards { display:grid; grid-template-columns:repeat(auto-fit,minmax(120px,1fr)); gap:10px; margin:16px 0; }
  .rpt-card { background:#fff; border:1px solid var(--line); border-radius:10px; padding:12px; text-align:center; }
  .rpt-card b { display:block; font-size:1.6rem; }
  .rpt-card span { color:var(--muted); font-size:.8rem; text-transform:uppercase; letter-spacing:.05em; }
  table { width:100%; border-collapse:collapse; background:#fff; border:1px solid var(--line); border-radius:8px; overflow:hidden; font-size:.9rem; }
  th,td { padding:8px 10px; border-bottom:1px solid var(--line); text-align:left; vertical-align:top; }
  th { background:#f1f5f9; width:180px; }
  .rpt-steps th { width:90px; }
  .rpt-status { width:90px; }
  .rpt-muted { color:var(--muted); }
  .rpt-badge { display:inline-block; padding:2px 8px; border-radius:999px; font-size:.72rem; font-weight:800; }
  .rpt-badge.pass { background:#dcfce7; color:var(--pass); }
  .rpt-badge.fail { background:#fee2e2; color:var(--fail); }
  .rpt-badge.skip { background:#fef3c7; color:var(--skip); }
  .rpt-badge.nt { background:#f1f5f9; color:var(--muted); }
  .rpt-chip { display:inline-block; background:#e0f2fe; color:#075985; border-radius:6px; padding:1px 7px; margin:0 4px 4px 0; font-size:.8rem; font-weight:600; }
  a { color:#0369a1; }
  .rpt-notes { background:#fff; border:1px solid var(--line); border-left:4px solid #38bdf8; border-radius:8px; padding:12px; white-space:pre-wrap; }
  .no-print { position:fixed; right:20px; bottom:20px; }
  .no-print button { background:#0f172a; color:#fff; border:none; border-radius:999px; padding:10px 18px; font-weight:700; cursor:pointer; box-shadow:0 6px 20px rgba(0,0,0,.25); }
  footer { margin-top:32px; padding-top:12px; border-top:1px solid var(--line); color:var(--muted); font-size:.8rem; }
  @media print {
    body { background:#fff; padding:0; max-width:none; }
    .no-print { display:none; }
    h2 { break-after:avoid; }
    table { break-inside:avoid; }
  }
</style></head><body>
  <div class="rpt-head">
    <div>
      <div class="rpt-brand">Pawd · Device Test Report</div>
      <h1>Device Test Session</h1>
      <div class="rpt-sub">Generated ${escapeHtml(gen)} · Started ${escapeHtml(start)} · Duration ${duration}${data.session.tester ? ` · Tester ${escapeHtml(data.session.tester)}` : ''} · Pawd ${escapeHtml(data.version || appVersion)}</div>
    </div>
    <div class="rpt-overall ${overallCls}">${s.overall}</div>
  </div>

  <div class="rpt-cards">
    <div class="rpt-card"><b>${s.total}</b><span>Steps</span></div>
    <div class="rpt-card"><b style="color:var(--pass)">${s.pass}</b><span>Pass</span></div>
    <div class="rpt-card"><b style="color:var(--fail)">${s.fail}</b><span>Fail</span></div>
    <div class="rpt-card"><b style="color:var(--skip)">${s.skip}</b><span>Skip</span></div>
    <div class="rpt-card"><b>${s.notTested}</b><span>Not tested</span></div>
  </div>

  <h2>Device under test</h2>
  <table>${selectedRows}</table>
  <h3>Android phone / ADB</h3>
  <table>${phoneRows}</table>
  <h3>Game controllers detected (PnP)</h3>
  <table><thead><tr><th>Family</th><th>Name</th><th>IDs</th><th>Status</th></tr></thead><tbody>${pnpRows}</tbody></table>

  <h2>Walkthrough results</h2>
  ${walkthroughHtml}

  <h2>Observations</h2>
  ${obsHtml}

  <h2>Battery test</h2>
  ${batteryHtml}

  <h2>Session notes</h2>
  <div class="rpt-notes">${escapeHtml(data.session.notes || 'No notes recorded.')}</div>

  <h2>Recordings</h2>
  <table><thead><tr><th>File</th><th>Date</th><th>Category</th><th>Duration</th><th>Markers</th></tr></thead><tbody>${recordRows}</tbody></table>

  <footer>Pawd local device test app · Report generated ${escapeHtml(gen)} · Recording links require the Pawd server to be running.</footer>
  <div class="no-print"><button onclick="window.print()">Print / Save as PDF</button></div>
</body></html>`;
}

async function generateReport() {
  generateReportBtn.disabled = true;
  reportStatusEl.textContent = 'Collecting session data...';
  try {
    const data = await collectReportData();
    reportStatusEl.textContent = 'Building report...';
    const html = buildReportHtml(data);
    const stamp = new Date().toISOString().replace(/[:.]/g, '-');
    const name = `pawd-report-${stamp}.html`;
    const meta = {
      generatedAt: data.generatedAt,
      tab: activeTab,
      tester: data.session.tester,
      summary: data.summary,
      devices: [
        data.devices.selected && data.devices.selected.name,
        data.devices.phone && data.devices.phone.serial,
        ...data.devices.controllerPnp.map(c => c.name),
      ].filter(Boolean),
    };
    const res = await fetch(`/api/reports/save?name=${encodeURIComponent(name)}&meta=${base64url(JSON.stringify(meta))}`, {
      method: 'POST',
      headers: { 'Content-Type': 'text/html' },
      body: html,
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok || !result.ok) throw new Error(result.error || ('HTTP ' + res.status));
    reportStatusEl.textContent = `Saved ${name} (${data.summary.pass}/${data.summary.total} pass).`;
    addMarker(`Generated report ${name}`);
    await loadReports();
  } catch (e) {
    reportStatusEl.textContent = `Report failed: ${e.message}`;
  } finally {
    generateReportBtn.disabled = false;
  }
}

function renderReports(data) {
  reportsListEl.innerHTML = '';
  const items = data.reports || [];
  downloadReportBtn.disabled = !items.length;
  if (!items.length) {
    reportsListEl.innerHTML = '<p class="muted">No reports yet. Fill in the fields above and click Generate report.</p>';
    return;
  }
  items.forEach(item => {
    const meta = item.meta || {};
    const s = meta.summary || {};
    const date = new Date(item.created * 1000).toLocaleString();
    const div = document.createElement('div');
    div.className = 'recording';
    div.innerHTML = `
      <div class="recording-head">
        <strong>${escapeHtml(item.name)}</strong>
        <span class="muted">${escapeHtml(date)} · ${formatBytes(item.size)} · ${s.pass || 0} pass / ${s.fail || 0} fail / ${s.skip || 0} skip · ${escapeHtml(s.overall || '—')}</span>
        <button class="secondary" data-view="${escapeHtml(item.name)}">View</button>
        <button class="secondary" data-download="${escapeHtml(item.name)}">Download</button>
        <button class="secondary" data-delete="${escapeHtml(item.name)}">Delete</button>
      </div>`;
    div.querySelector('[data-view]').addEventListener('click', e => {
      window.open(`/api/reports/file?name=${encodeURIComponent(e.target.dataset.view)}`, '_blank');
    });
    div.querySelector('[data-download]').addEventListener('click', e => downloadReport(e.target.dataset.download));
    div.querySelector('[data-delete]').addEventListener('click', e => deleteReport(e.target.dataset.delete));
    reportsListEl.appendChild(div);
  });
}

async function loadReports() {
  try {
    const res = await fetch('/api/reports', { cache: 'no-store' });
    const data = await res.json();
    renderReports(data);
  } catch (e) {
    reportsListEl.textContent = 'Could not load reports: ' + e.message;
  }
}

function downloadReport(name) {
  const a = document.createElement('a');
  a.href = `/api/reports/file?name=${encodeURIComponent(name)}`;
  a.download = name;
  document.body.appendChild(a);
  a.click();
  a.remove();
}

async function deleteReport(name) {
  if (!confirm(`Delete ${name}?`)) return;
  try {
    const res = await fetch('/api/reports/delete', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name }),
    });
    const result = await res.json().catch(() => ({}));
    if (!res.ok || !result.ok) throw new Error(result.error || ('HTTP ' + res.status));
    await loadReports();
  } catch (e) {
    reportStatusEl.textContent = `Delete failed: ${e.message}`;
  }
}

/* ---------- Event wiring ---------- */

refreshBtn.addEventListener('click', loadDevices);
installAdbBtn.addEventListener('click', installAdb);
launchPhoneBtn.addEventListener('click', () => startPhoneApp(true));
stopPhoneBtn.addEventListener('click', stopPhoneApp);
autoLaunchToggle.addEventListener('change', async () => {
  const enabled = autoLaunchToggle.checked;
  autoLaunchToggle.disabled = true;
  try {
    const res = await fetch('/api/phone/auto', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ enabled }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || ('HTTP ' + res.status));
    autoLaunch = !!data.enabled;
    autoLaunchToggle.checked = autoLaunch;
    phoneStatusEl.textContent = autoLaunch
      ? 'Auto-launch enabled. The next connected phone will be prepared and launched automatically.'
      : 'Auto-launch disabled.';
    addMarker(`Phone auto-launch ${enabled ? 'enabled' : 'disabled'}`);
    await loadPhoneStatus();
  } catch (e) {
    autoLaunchToggle.checked = !enabled;
    phoneStatusEl.innerHTML = `<strong>Could not update auto-launch:</strong> ${escapeHtml(e.message)}`;
  } finally {
    autoLaunchToggle.disabled = false;
  }
});

refreshControllersBtn.addEventListener('click', loadControllers);
const openControllerDisplayBtn = document.getElementById('openControllerDisplayBtn');
if (openControllerDisplayBtn) openControllerDisplayBtn.addEventListener('click', () => {
  switchView('controller');
  const section = document.getElementById('controllerSection');
  if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
const openStickViewBtn = document.getElementById('openStickViewBtn');
if (openStickViewBtn) openStickViewBtn.addEventListener('click', () => {
  switchView('controller');
  const section = document.getElementById('stickSection');
  if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
});
controllerAutoToggle.addEventListener('change', () => setControllerAuto(controllerAutoToggle.checked));
controllerDemoToggle.addEventListener('change', () => setControllerDemo(controllerDemoToggle.checked));
controllerIndexSelect.addEventListener('change', () => {
  addMarker(`Selected player ${Number(controllerIndexSelect.value) + 1}`);
  pollLiveState();
});
if (controllerSourceSelect) controllerSourceSelect.addEventListener('change', () => {
  if (learningTarget) stopLearning();
  addMarker(`Input source: ${controllerSourceSelect.value}`);
  pollLiveState();
});
if (mappingDeviceEl) mappingDeviceEl.addEventListener('change', () => {
  if (learningTarget) stopLearning();
  renderMappingFields();
});
if (mappingEditorEl) {
  mappingEditorEl.addEventListener('click', e => {
    const btn = e.target.closest('[data-learn]');
    if (btn) startLearning(btn.dataset.learn, btn);
  });
}
if (mappingSaveBtn) mappingSaveBtn.addEventListener('click', saveMapping);
if (mappingResetBtn) mappingResetBtn.addEventListener('click', resetMapping);
rumbleBtn.addEventListener('click', () => pulseRumble(
  Number(rumbleLeftEl.value) / 100,
  Number(rumbleRightEl.value) / 100,
  Number(rumbleDurationEl.value) || 400,
));
rumbleStopBtn.addEventListener('click', () => pulseRumble(0, 0, 50, true));
batteryReadBtn.addEventListener('click', batteryReadNow);
batteryStartBtn.addEventListener('click', batteryStartTest);
batteryStopBtn.addEventListener('click', batteryStopTest);
batteryResetBtn.addEventListener('click', batteryResetTest);
if (batteryJumpBtn) batteryJumpBtn.addEventListener('click', jumpToBatteryPanel);
// The Live controller iframe can ask its parent to reveal the battery panel.
window.addEventListener('message', (event) => {
  if (event.data === 'pawd:open-battery') jumpToBatteryPanel();
  else if (event.data === 'pawd:battery-pass') markStepDone('battery', 'controller');
});
document.querySelectorAll('.preset').forEach(btn => {
  btn.addEventListener('click', () => {
    rumbleLeftEl.value = btn.dataset.left;
    rumbleRightEl.value = btn.dataset.right;
  });
});

resetWalkthroughBtn.addEventListener('click', () => {
  stepSets[activeTab].steps.forEach(s => { delete stepState[stepKey(activeTab, s.id)]; });
  saveStepState();
  renderWalkthrough();
  selectedDevice = null;
  selectedDeviceEl.textContent = stepSets[activeTab].empty;
  document.querySelectorAll('#devicesTable tbody tr').forEach(r => r.classList.remove('selected'));
  if (activeTab === 'controller') {
    observedInputs.buttons.clear();
    observedInputs.stickMove = false;
    observedInputs.triggerMove = false;
    renderObserved();
  }
  addMarker(`Reset ${activeTab} walkthrough`);
});

recordStartBtn.addEventListener('click', startRecording);
recordStopBtn.addEventListener('click', stopRecording);

generateReportBtn.addEventListener('click', generateReport);
downloadReportBtn.addEventListener('click', () => {
  const first = reportsListEl.querySelector('[data-download]');
  if (first) downloadReport(first.dataset.download);
});

async function loadVersion() {
  try {
    const res = await fetch('/api/version', { cache: 'no-store' });
    if (!res.ok) return;
    const data = await res.json();
    if (data.version) {
      appVersion = data.version;
      const el = document.getElementById('appVersion');
      if (el) el.textContent = appVersion;
    }
  } catch (e) {
    // Keep the fallback version already shown in the header.
  }
}

loadVersion();
renderWalkthrough();
switchTab('android');
switchView('app');
if (window.location.hash === '#battery') jumpToBatteryPanel();
loadDevices();
loadControllers();
loadMappings();
loadAutoLaunch();
loadControllerAuto();
loadPhoneStatus();
loadRecordings();
loadReports();
// Device lists are cached server-side and change rarely; poll gently.
setInterval(pollPhone, 15000);
setInterval(pollControllers, 15000);
