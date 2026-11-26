const refreshBtn = document.getElementById('refreshBtn');
const resetWalkthroughBtn = document.getElementById('resetWalkthroughBtn');
const consoleWalkthroughEl = document.getElementById('consoleWalkthrough');
const consoleWalkthroughTitle = document.getElementById('consoleWalkthroughTitle');
const consoleWalkthroughIntro = document.getElementById('consoleWalkthroughIntro');
const consoleProgressFill = document.getElementById('consoleProgressFill');
const consoleProgressText = document.getElementById('consoleProgressText');
const resetConsoleWalkthroughBtn = document.getElementById('resetConsoleWalkthroughBtn');
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

const ps5Panel = document.getElementById('ps5Panel');
const ps5Badge = document.getElementById('ps5Badge');
const ps5Player = document.getElementById('ps5Player');
const ps5Source = document.getElementById('ps5Source');
const ps5Port = document.getElementById('ps5Port');
const consoleSelect = document.getElementById('consoleSelect');
const ps5ChargeMinutes = document.getElementById('ps5ChargeMinutes');
const ps5BeforeBtn = document.getElementById('ps5BeforeBtn');
const ps5AfterBtn = document.getElementById('ps5AfterBtn');
const ps5ChargeBefore = document.getElementById('ps5ChargeBefore');
const ps5ChargeAfter = document.getElementById('ps5ChargeAfter');
const ps5PairWatchBtn = document.getElementById('ps5PairWatchBtn');
const ps5PairStopBtn = document.getElementById('ps5PairStopBtn');
const ps5PairStatus = document.getElementById('ps5PairStatus');
const ps5PairEvents = document.getElementById('ps5PairEvents');
const ps5Host = document.getElementById('ps5Host');
const ps5PingBtn = document.getElementById('ps5PingBtn');
const ps5PingResult = document.getElementById('ps5PingResult');
const ps5TempZone = document.getElementById('ps5TempZone');
const ps5TempC = document.getElementById('ps5TempC');
const ps5FanRpm = document.getElementById('ps5FanRpm');
const ps5ThermalNote = document.getElementById('ps5ThermalNote');
const ps5ThermalAddBtn = document.getElementById('ps5ThermalAddBtn');
const ps5ThermalClearBtn = document.getElementById('ps5ThermalClearBtn');
const ps5ThermalSummary = document.getElementById('ps5ThermalSummary');
const ps5ThermalList = document.getElementById('ps5ThermalList');
const ps5MaxTemp = document.getElementById('ps5MaxTemp');
const ps5MinRpm = document.getElementById('ps5MinRpm');
const ps5MaxPingMs = document.getElementById('ps5MaxPingMs');
const ps5MaxLoss = document.getElementById('ps5MaxLoss');
const ps5MinGain = document.getElementById('ps5MinGain');
const ps5SaveCriteria = document.getElementById('ps5SaveCriteria');
const ps5ResetCriteria = document.getElementById('ps5ResetCriteria');
const ps5CriteriaBadge = document.getElementById('ps5CriteriaBadge');
const ps5CriteriaText = document.getElementById('ps5CriteriaText');

// Add a profile here (and a matching stepSets entry) when another console is supported.
const consoleProfiles = {
  ps5: {
    label: 'PlayStation 5',
    stepCategory: 'ps5',
    panelId: 'ps5Panel',
    render: () => renderPs5(),
  },
  switch1: {
    label: 'Nintendo Switch',
    stepCategory: 'switch1',
    panelId: 'switch1Panel',
    pairingLabel: 'Joy-Con',
    render: () => renderConsoleCheck('switch1'),
  },
  switchlite: {
    label: 'Switch Lite',
    stepCategory: 'switchlite',
    panelId: 'switchLitePanel',
    pairingLabel: null,
    render: () => renderConsoleCheck('switchlite'),
  },
  switch2: {
    label: 'Switch 2',
    stepCategory: 'switch2',
    panelId: 'switch2Panel',
    pairingLabel: 'Joy-Con 2',
    render: () => renderConsoleCheck('switch2'),
  },
};
let consoleProfileId = 'ps5';

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
let appVersion = '001.002.001.2026';

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
  },
  ps5: {
    title: 'PS5 Console Test Walkthrough',
    intro: 'Guided console checks. Pawd can observe charging, pairing handoff, and LAN reachability from this PC; other results are entered manually.',
    empty: 'PS5 console checks do not require a selected device.',
    steps: [
      {
        id: 'power',
        title: 'Console powers on normally',
        desc: 'Power on the PS5 and confirm normal startup with no error light or unexpected fan noise.',
        hint: 'Note any beep pattern, blinking light, or loud fan at idle in the session notes.'
      },
      {
        id: 'usb-charge',
        title: 'USB port charges a controller',
        desc: 'Use the USB charging check: read the controller battery here, plug it into a PS5 USB port for the chosen time, then reconnect and read again.',
        hint: 'Use a known-good USB-C cable. A DualSense over DirectInput gives an exact percentage; XInput levels are coarse.'
      },
      {
        id: 'pairing',
        title: 'Controller pairs to the console',
        desc: 'Start the pairing watch, then pair a DualSense to the PS5 and confirm the controller disappears from this PC.',
        hint: 'The controller must not be connected by USB while pairing. Re-pair it to the PC afterwards if you want to continue controller tests.'
      },
      {
        id: 'network',
        title: 'LAN reachability',
        desc: 'Enter the PS5 IP address or hostname and confirm it answers a ping from this PC.',
        hint: 'If ping fails, check that both devices are on the same network and that the console is not in Wi-Fi-only isolation mode.'
      },
      {
        id: 'video',
        title: 'HDMI output',
        desc: 'Connect the PS5 to a display and confirm stable video at the expected resolution with no flicker or artefacts.',
        hint: 'Try a different HDMI cable/port if the picture drops out. Pawd cannot inspect the video signal itself.'
      },
      {
        id: 'usb-data',
        title: 'USB data ports',
        desc: 'Plug a known-good USB storage device into each console USB port and confirm the PS5 recognises it.',
        hint: 'Test front and rear ports separately to isolate a single failing port.'
      },
      {
        id: 'disc',
        title: 'Disc drive (if fitted)',
        desc: 'Insert a known-good disc and confirm it is read without excessive noise or repeated spinning up.',
        hint: 'Skip this step on digital-only consoles.'
      },
      {
        id: 'thermal',
        title: 'Temperatures and fan speed',
        desc: 'Enter temperature and fan RPM readings from your own instrument. Pawd records each reading and flags values outside the configured limits.',
        hint: 'There is no public API for PS5 internal sensors, so these readings must be supplied manually. Take idle and loaded readings for comparison.'
      },
      {
        id: 'rest',
        title: 'Rest mode and resume',
        desc: 'Put the console into rest mode, confirm a controller can charge, then resume and verify the session restarts correctly.',
        hint: 'Check that rest-mode charging stays enabled in the PS5 power settings.'
      }
    ]
  },
  switch1: {
    title: 'Nintendo Switch Console Test Walkthrough',
    intro: 'Checks for the original Switch family (HAC-001 / HAC-001-01 / OLED). Pawd can observe controller handoff, charging, and LAN reachability from this PC; dock, screen, and card checks are entered manually.',
    empty: 'Switch console checks do not require a selected device.',
    steps: [
      {
        id: 'power',
        title: 'Console powers on normally',
        desc: 'Power on the Switch and confirm normal startup with no error screen or unusual fan noise.',
        hint: 'Note any repeated reboot or charging icon that appears instead of a normal boot.'
      },
      {
        id: 'handheld',
        title: 'Handheld screen and touch',
        desc: 'In handheld mode, confirm the built-in display is stable and touch input registers across the screen.',
        hint: 'Check for dead pixels, flicker, and dead zones in the touch panel.'
      },
      {
        id: 'joycon',
        title: 'Joy-Con detach and pairing',
        desc: 'Detach both Joy-Con, start the pairing watch here, then reattach or pair them to the console and confirm they leave this PC.',
        hint: 'Joy-Con that are connected by USB will not hand off; disconnect them from the PC first.'
      },
      {
        id: 'dock-video',
        title: 'Dock HDMI output',
        desc: 'Dock the console and confirm stable HDMI video up to 1080p with no flicker or dropouts.',
        hint: 'Try a different HDMI cable or dock port if the picture is unstable.'
      },
      {
        id: 'dock-usb',
        title: 'Dock USB-A ports',
        desc: 'Plug a known-good USB device into each dock USB-A port and confirm the Switch recognises it.',
        hint: 'Test each port separately; some docks supply charge only on a subset of ports.'
      },
      {
        id: 'network',
        title: 'Wired or Wi-Fi reachability',
        desc: 'Use the console\'s dock Ethernet or Wi-Fi address and confirm it answers a ping from this PC.',
        hint: 'Switch 1 has no Ethernet port on the console itself; wired LAN requires a dock.'
      },
      {
        id: 'charge',
        title: 'USB-C charging',
        desc: 'Use the charging check: read a controller battery on the PC, charge through a Switch USB port, then read again.',
        hint: 'The console USB-C port is used for charging and for connecting to the dock.'
      },
      {
        id: 'gamecard',
        title: 'Game card slot',
        desc: 'Insert a known-good game card and confirm it is detected and loads without repeated read errors.',
        hint: 'Skip if you only test digital software.'
      },
      {
        id: 'thermal',
        title: 'Temperatures and fan speed',
        desc: 'Enter temperature and fan RPM readings from your own instrument and compare them with the configured limits.',
        hint: 'Switch consoles do not expose internal sensor telemetry to a PC; readings must be entered manually.'
      },
      {
        id: 'sleep',
        title: 'Sleep and wake',
        desc: 'Put the console to sleep and wake it with a Joy-Con button; confirm the session resumes normally.',
        hint: 'Check that the console does not wake unexpectedly from controller input.'
      }
    ]
  },
  switchlite: {
    title: 'Switch Lite Console Test Walkthrough',
    intro: 'Checks for the handheld-only Switch Lite (HDH-001). It has integrated controls, no TV dock, no detachable Joy-Con, and no wired LAN dock; charging and Wi-Fi checks are automated where possible.',
    empty: 'Switch Lite checks do not require a selected device.',
    steps: [
      {
        id: 'power',
        title: 'Console powers on normally',
        desc: 'Power on the Switch Lite and confirm normal startup with no error screen or unusual noise.',
        hint: 'Because it is handheld-only, there is no dock or HDMI output to verify.'
      },
      {
        id: 'handheld',
        title: 'Built-in screen and touch',
        desc: 'Confirm the built-in display is stable and touch input registers across the screen.',
        hint: 'Look for dead pixels, flicker, and unresponsive touch zones.'
      },
      {
        id: 'controls',
        title: 'Integrated controls',
        desc: 'Exercise every built-in button, stick, and shoulder trigger; mark PASS only when all inputs register correctly.',
        hint: 'Switch Lite controls are not detachable, so the pairing handoff check does not apply.'
      },
      {
        id: 'charge',
        title: 'USB-C charging',
        desc: 'Use the charging check: read a controller battery on the PC, charge through the Switch Lite USB-C port, then read again.',
        hint: 'Use a known-good USB-C cable and charger; the Lite has no dock USB-A ports.'
      },
      {
        id: 'network',
        title: 'Wi-Fi reachability',
        desc: 'Enter the Switch Lite Wi-Fi IP address and confirm it answers a ping from this PC.',
        hint: 'Switch Lite has no Ethernet port; ping uses Wi-Fi only.'
      },
      {
        id: 'gamecard',
        title: 'Game card slot',
        desc: 'Insert a known-good game card and confirm it is detected and loads without repeated read errors.',
        hint: 'Skip if you only test digital software.'
      },
      {
        id: 'thermal',
        title: 'Temperatures and chassis warmth',
        desc: 'Enter temperature readings from your own instrument and compare them with the configured limits.',
        hint: 'There is no public API for Switch Lite internal sensors; use a thermal camera or contact thermometer.'
      },
      {
        id: 'sleep',
        title: 'Sleep and wake',
        desc: 'Put the console to sleep and wake it; confirm it resumes without a reload or charging error.',
        hint: 'Check that the power button and sleep timing behave consistently.'
      }
    ]
  },
  switch2: {
    title: 'Switch 2 Console Test Walkthrough',
    intro: 'Checks for the Nintendo Switch 2. Pawd observes Joy-Con 2 handoff, charging, and LAN reachability; dock video, USB-C ports, and game card checks are entered manually.',
    empty: 'Switch 2 checks do not require a selected device.',
    steps: [
      {
        id: 'power',
        title: 'Console powers on normally',
        desc: 'Power on the Switch 2 and confirm normal startup with no error screen or unexpected fan noise.',
        hint: 'Note any repeated reboot or failure to leave the charging screen.'
      },
      {
        id: 'joycon2',
        title: 'Joy-Con 2 attach and pairing',
        desc: 'Detach the magnetic Joy-Con 2, start the pairing watch here, then reattach or pair them to the console and confirm they leave this PC.',
        hint: 'Joy-Con 2 attach magnetically and can act as a mouse; verify both attachment and pointer input.'
      },
      {
        id: 'dock-video',
        title: 'Dock HDMI output',
        desc: 'Dock the console and confirm stable HDMI output at the expected resolution.',
        hint: 'Use a cable and display that support the resolution you are testing.'
      },
      {
        id: 'dock-lan',
        title: 'Dock wired LAN and USB',
        desc: 'Connect the dock Ethernet port and USB terminals; confirm wired networking and attached USB devices are recognised.',
        hint: 'Wired LAN is available through the Switch 2 dock in TV mode.'
      },
      {
        id: 'usb-c',
        title: 'Both USB-C ports',
        desc: 'Test the bottom USB-C port (charging/dock) and the top USB-C port (accessories/charging) separately.',
        hint: 'Confirm the top port can charge or drive an accessory while the console is in use.'
      },
      {
        id: 'charge',
        title: 'USB-C charging',
        desc: 'Use the charging check: read a controller battery on the PC, charge through a Switch 2 USB port, then read again.',
        hint: 'Use a known-good USB-C cable and charger capable of the console\'s power draw.'
      },
      {
        id: 'network',
        title: 'LAN reachability',
        desc: 'Enter the Switch 2 dock Ethernet or Wi-Fi 6 address and confirm it answers a ping from this PC.',
        hint: 'If ping fails, check that both devices are on the same network and that client isolation is disabled.'
      },
      {
        id: 'gamecard',
        title: 'Game card slot',
        desc: 'Insert a known-good Switch 2 game card and confirm it is detected and loads without read errors.',
        hint: 'Check backwards-compatible cards separately if you test those.'
      },
      {
        id: 'thermal',
        title: 'Temperatures and fan speed',
        desc: 'Enter temperature and fan RPM readings from your own instrument and compare them with the configured limits.',
        hint: 'There is no public API for Switch 2 internal sensors; readings must be entered manually.'
      },
      {
        id: 'sleep',
        title: 'Sleep and wake',
        desc: 'Put the console to sleep and wake it; confirm the session and controller pairing resume normally.',
        hint: 'Verify that Joy-Con 2 remain paired after wake.'
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

function renderWalkthroughInto(category, opts) {
  const set = stepSets[category];
  if (!set || !opts.listEl) return;
  if (opts.titleEl) opts.titleEl.textContent = set.title;
  if (opts.introEl) opts.introEl.textContent = set.intro;
  opts.listEl.innerHTML = '';
  set.steps.forEach(step => {
    const status = stepStatus(category, step.id);
    const li = document.createElement('li');
    li.className = `step status-${status}`;
    li.dataset.stepId = step.id;
    const inputId = `step-${category}-${step.id}`;
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
      setStepStatus(category, step.id, cb.checked ? 'pass' : 'not_tested', step.title);
    });
    li.querySelectorAll('[data-status]').forEach(btn => {
      btn.addEventListener('click', () => {
        const s = btn.dataset.status;
        setStepStatus(category, step.id, s === status ? 'not_tested' : s, step.title);
      });
    });
    opts.listEl.appendChild(li);
  });
  updateProgressInto(category, opts.fillEl, opts.textEl);
}

function updateProgressInto(category, fillEl, textEl) {
  const steps = stepSets[category].steps;
  const statuses = steps.map(s => stepStatus(category, s.id));
  const total = steps.length;
  const done = statuses.filter(s => s === 'pass').length;
  const failed = statuses.filter(s => s === 'fail').length;
  const skipped = statuses.filter(s => s === 'skip').length;
  const pct = total ? Math.round((done / total) * 100) : 0;
  if (fillEl) fillEl.style.width = pct + '%';
  if (textEl) textEl.textContent = `${done} / ${total} pass${failed ? ` · ${failed} fail` : ''}${skipped ? ` · ${skipped} skip` : ''}`;
}

function renderWalkthrough() {
  renderWalkthroughInto(activeTab, {
    titleEl: walkthroughTitle,
    introEl: walkthroughIntro,
    listEl: walkthroughEl,
    fillEl: progressFill,
    textEl: progressText,
  });
  const profile = consoleProfiles[consoleProfileId];
  if (profile) {
    renderWalkthroughInto(profile.stepCategory, {
      titleEl: consoleWalkthroughTitle,
      introEl: consoleWalkthroughIntro,
      listEl: consoleWalkthroughEl,
      fillEl: consoleProgressFill,
      textEl: consoleProgressText,
    });
  }
}

const viewPanes = {
  app: 'viewApp',
  controller: 'viewController',
  console: 'viewConsole',
};
const frameSources = {
  controllerFrame: '/controller-display.html',
  stickFrame: '/stick-view.html',
};
let currentView = 'app';

function switchView(view) {
  if (!viewPanes[view]) return;
  if (currentView === 'console' && view !== 'console') {
    if (ps5Watcher) stopPs5PairWatch();
    Object.keys(consoleWatchers).forEach(id => consoleStopPairWatch(id));
  }
  currentView = view;
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
  if (view === 'console') {
    applyConsoleProfile();
    renderWalkthrough();
  }
}

function applyConsoleProfile() {
  const profile = consoleProfiles[consoleProfileId];
  if (!profile) return null;
  Object.entries(consoleProfiles).forEach(([id, p]) => {
    const panel = document.getElementById(p.panelId);
    if (panel) panel.classList.toggle('hidden', id !== consoleProfileId);
  });
  return profile;
}

function selectConsoleProfile(id) {
  if (!consoleProfiles[id]) return;
  consoleProfileId = id;
  if (consoleSelect && consoleSelect.value !== id) consoleSelect.value = id;
  applyConsoleProfile();
  renderWalkthrough();
  addMarker(`Selected ${consoleProfiles[id].label} console profile`);
}

document.querySelectorAll('.view-tab').forEach(btn => {
  btn.addEventListener('click', () => switchView(btn.dataset.view));
});
if (consoleSelect) {
  consoleSelect.addEventListener('change', () => selectConsoleProfile(consoleSelect.value));
}
if (resetConsoleWalkthroughBtn) {
  resetConsoleWalkthroughBtn.addEventListener('click', () => {
    const profile = consoleProfiles[consoleProfileId];
    if (!profile) return;
    stepSets[profile.stepCategory].steps.forEach(s => {
      delete stepState[stepKey(profile.stepCategory, s.id)];
    });
    saveStepState();
    renderWalkthrough();
    if (profile.render) profile.render();
    addMarker(`Reset ${profile.label} console walkthrough`);
  });
}

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
  const label = tab === 'android' ? 'Android phone' : 'game controller';
  if (changed) addMarker(`Switched to ${label} tests`);
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

/* ---------- PS5 console check ---------- */

const PS5_STATE_KEY = 'pawd.ps5.v1';
const PS5_DEFAULT_CRITERIA = {
  maxTemp: 75, minRpm: 0, maxPingMs: 100, maxLoss: 0, minGain: 3,
  minWatts: 0, maxWatts: 0,
};
function ps5FreshState() {
  return {
    charge: null,
    pairing: { events: [] },
    ping: null,
    thermal: [],
    criteria: { ...PS5_DEFAULT_CRITERIA },
  };
}
let ps5State = ps5FreshState();
try {
  const saved = JSON.parse(localStorage.getItem(PS5_STATE_KEY) || '{}') || {};
  ps5State = Object.assign(ps5State, saved);
  ps5State.criteria = Object.assign({ ...PS5_DEFAULT_CRITERIA }, saved.criteria || {});
} catch (e) {
  ps5State = ps5FreshState();
}
if (!Array.isArray(ps5State.thermal)) ps5State.thermal = [];
if (!ps5State.pairing || !Array.isArray(ps5State.pairing.events)) {
  ps5State.pairing = { events: [] };
}
let ps5Watcher = null;

function savePs5State() {
  try {
    localStorage.setItem(PS5_STATE_KEY, JSON.stringify(ps5State));
  } catch (e) {
    // Storage is optional; results still appear in the report payload.
  }
}

function ps5Set(el, text, cls) {
  if (!el) return;
  el.textContent = text;
  el.className = `ps5-readout ${cls || 'muted'}`;
}

function setPs5Step(id, status, title) {
  if (stepStatus('ps5', id) !== status) setStepStatus('ps5', id, status, title);
}

function ps5Stamp(at) {
  return new Date(at).toLocaleTimeString();
}

function ps5Criteria() {
  const saved = ps5State.criteria || {};
  const number = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  return {
    maxTemp: Math.max(0, number(saved.maxTemp, PS5_DEFAULT_CRITERIA.maxTemp)),
    minRpm: Math.max(0, number(saved.minRpm, 0)),
    maxPingMs: Math.max(0, number(saved.maxPingMs, PS5_DEFAULT_CRITERIA.maxPingMs)),
    maxLoss: Math.max(0, number(saved.maxLoss, 0)),
    minGain: Math.max(0, number(saved.minGain, PS5_DEFAULT_CRITERIA.minGain)),
    minWatts: Math.max(0, number(saved.minWatts, 0)),
    maxWatts: Math.max(0, number(saved.maxWatts, 0)),
  };
}

function ps5CriteriaSummary(c = ps5Criteria()) {
  const power = c.maxWatts > 0
    ? ` · charge power ${c.minWatts > 0 ? `${c.minWatts}–${c.maxWatts}` : `≤ ${c.maxWatts}`} W`
    : c.minWatts > 0 ? ` · charge power ≥ ${c.minWatts} W` : '';
  return `GOOD when temp ≤ ${c.maxTemp} °C` +
    `${c.minRpm > 0 ? ` and fan ≥ ${c.minRpm} RPM` : ' (no fan minimum)'}` +
    ` · ping ≤ ${c.maxPingMs} ms with ≤ ${c.maxLoss}% loss` +
    ` · charge gain ≥ +${c.minGain}%` + power;
}

function ps5ChargeVerdict(r) {
  const reasons = [];
  if (r.delta >= r.minGain) reasons.push(`+${r.delta}% ≥ +${r.minGain}% minimum`);
  else reasons.push(`+${r.delta}% < +${r.minGain}% minimum`);
  return { good: r.delta >= r.minGain, reasons };
}

function ps5PingVerdict(p, c = ps5Criteria()) {
  if (!p || p.reachable == null) return null;
  const reasons = [];
  if (!p.reachable) reasons.push('console did not answer ping');
  if (p.lossPercent != null && p.lossPercent > c.maxLoss) {
    reasons.push(`loss ${p.lossPercent}% > ${c.maxLoss}%`);
  }
  if (p.avgMs != null && p.avgMs > c.maxPingMs) {
    reasons.push(`average ${p.avgMs} ms > ${c.maxPingMs} ms`);
  }
  return { good: reasons.length === 0, reasons };
}

function ps5ThermalVerdict(r, c = ps5Criteria()) {
  const reasons = [];
  if (r.tempC > c.maxTemp) reasons.push(`${r.tempC} °C > ${c.maxTemp} °C limit`);
  if (r.rpm != null && c.minRpm > 0 && r.rpm < c.minRpm) {
    reasons.push(`${r.rpm} RPM < ${c.minRpm} RPM minimum`);
  }
  return { good: reasons.length === 0, reasons };
}

function ps5VerdictText(v) {
  if (!v) return 'UNKNOWN';
  return v.good ? 'GOOD' : 'BAD';
}

function ps5LoadCriteriaInputs() {
  const c = ps5Criteria();
  if (ps5MaxTemp) ps5MaxTemp.value = c.maxTemp;
  if (ps5MinRpm) ps5MinRpm.value = c.minRpm;
  if (ps5MaxPingMs) ps5MaxPingMs.value = c.maxPingMs;
  if (ps5MaxLoss) ps5MaxLoss.value = c.maxLoss;
  if (ps5MinGain) ps5MinGain.value = c.minGain;
}

function ps5SaveCriteriaFromInputs() {
  const values = [ps5MaxTemp, ps5MinRpm, ps5MaxPingMs, ps5MaxLoss, ps5MinGain]
    .map(el => el ? Number(el.value) : NaN);
  if (values.some(v => !Number.isFinite(v) || v < 0)) {
    ps5Set(ps5CriteriaText, 'Enter a valid number (zero or more) in every limit.', 'warn');
    return;
  }
  ps5State.criteria = {
    maxTemp: values[0], minRpm: values[1], maxPingMs: values[2],
    maxLoss: values[3], minGain: values[4],
  };
  savePs5State();
  renderPs5();
  addMarker(`PS5: criteria saved — ${ps5CriteriaSummary()}`);
}

function ps5RestoreDefaultCriteria() {
  ps5State.criteria = { ...PS5_DEFAULT_CRITERIA };
  ps5LoadCriteriaInputs();
  savePs5State();
  renderPs5();
  addMarker('PS5: restored default pass criteria');
}

function renderPs5() {
  if (!ps5Panel) return;
  const c = ps5Criteria();
  const parts = [];
  let badCount = 0;

  const custom = Object.keys(PS5_DEFAULT_CRITERIA).some(k => c[k] !== PS5_DEFAULT_CRITERIA[k]);
  if (ps5CriteriaBadge) {
    ps5CriteriaBadge.textContent = custom ? 'Custom limits' : 'Defaults';
    ps5CriteriaBadge.className = custom ? '' : 'muted';
  }
  ps5Set(ps5CriteriaText, ps5CriteriaSummary(c));

  const charge = ps5State.charge;
  if (charge && charge.before) {
    ps5Set(ps5ChargeBefore,
      `Before: ${charge.before.percent}% · ${charge.before.precision || 'unknown precision'}` +
      ` · ${charge.before.device || charge.before.source || 'unknown source'} · ${ps5Stamp(charge.before.at)}`);
    parts.push('charge reading');
  }
  if (charge && charge.result) {
    const r = charge.result;
    const v = ps5ChargeVerdict(r);
    if (!v.good) badCount += 1;
    ps5Set(ps5ChargeAfter,
      `${ps5VerdictText(v)}: ${r.before.percent}% → ${r.after.percent}%` +
      ` (${r.delta >= 0 ? '+' : ''}${r.delta}% in ${(r.elapsedMs / 60000).toFixed(1)} min,` +
      ` ${r.rate == null ? '—' : r.rate.toFixed(1)} %/min) · ${v.reasons.join('; ')}`,
      v.good ? 'ok' : 'warn');
    parts.push('charge result');
  } else if (charge && charge.before) {
    ps5Set(ps5ChargeAfter, 'Waiting for the finish reading after charging on the PS5.');
  }

  const events = ps5State.pairing.events || [];
  ps5PairEvents.innerHTML = events.length
    ? events.map(ev => `<div>${escapeHtml(ps5Stamp(ev.at))} — controller left PC: ${escapeHtml(ev.gone.join(', '))}</div>`).join('')
    : 'No events recorded.';
  if (!ps5Watcher) {
    ps5Set(ps5PairStatus, events.length
      ? `Handoff observed at ${ps5Stamp(events[events.length - 1].at)}.`
      : 'Not watching.');
  }
  if (events.length) parts.push('pairing handoff');

  const ping = ps5State.ping;
  if (ping && ping.reachable != null) {
    const v = ping.verdict || ps5PingVerdict(ping, c);
    if (!v.good) badCount += 1;
    ps5Set(ps5PingResult,
      `${ps5VerdictText(v)}: ${ping.host}: ${ping.reachable ? 'reachable' : 'unreachable'}` +
      ` · loss ${ping.lossPercent == null ? '—' : ping.lossPercent + '%'}` +
      ` · avg ${ping.avgMs == null ? '—' : ping.avgMs + ' ms'}` +
      ` · ${v.reasons.join('; ')}`,
      v.good ? 'ok' : 'warn');
    parts.push('ping');
  }

  const readings = ps5State.thermal;
  if (readings.length) {
    const temps = readings.map(r => r.tempC).filter(Number.isFinite);
    const rpms = readings.map(r => r.rpm).filter(v => Number.isFinite(v));
    const bad = readings.filter(r => !(r.verdict || ps5ThermalVerdict(r, c)).good).length;
    badCount += bad;
    const min = temps.length ? Math.min(...temps) : null;
    const max = temps.length ? Math.max(...temps) : null;
    ps5Set(ps5ThermalSummary,
      `${readings.length} reading(s) · temp ${min ?? '—'}–${max ?? '—'} °C` +
      ` · max fan ${rpms.length ? Math.max(...rpms) : '—'} RPM` +
      ` · ${bad ? `${bad} BAD` : 'all GOOD'}`,
      bad ? 'warn' : 'ok');
    ps5ThermalList.innerHTML = readings.map(r => {
      const v = r.verdict || ps5ThermalVerdict(r, c);
      return `<div class="ps5-temp-row">
        <span>${escapeHtml(ps5Stamp(r.at))} · ${escapeHtml(r.zone)} · ${escapeHtml(r.tempC)} °C</span>
        <span>${r.rpm == null ? 'fan —' : `fan ${escapeHtml(r.rpm)} RPM`} ·
          <strong style="color:${v.good ? '#4ade80' : '#f87171'}">${ps5VerdictText(v)}</strong>
          ${v.reasons.length ? ` · ${escapeHtml(v.reasons.join('; '))}` : ''}
          ${r.note ? ` · ${escapeHtml(r.note)}` : ''}</span>
      </div>`;
    }).join('');
    parts.push(`${readings.length} thermal reading(s)`);
  } else {
    ps5Set(ps5ThermalSummary, 'No readings yet.');
    ps5ThermalList.textContent = 'No readings yet.';
  }

  if (badCount) parts.push(`${badCount} BAD measurement(s)`);
  ps5Badge.textContent = parts.length ? parts.join(' · ') : 'No readings yet';
  ps5Badge.className = badCount ? 'warn' : parts.length ? '' : 'muted';
}

async function ps5SampleBattery() {
  const body = {
    index: Number(ps5Player.value) || 0,
    source: ps5Source.value,
  };
  const res = await fetch('/api/controllers/battery/sample', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.available === false) {
    throw new Error(data.error || data.note || 'No readable controller battery on this player/source');
  }
  if (data.percent == null) throw new Error('This controller/source does not report a battery percentage');
  return data;
}

async function ps5ReadBefore() {
  ps5BeforeBtn.disabled = true;
  try {
    const reading = await ps5SampleBattery();
    ps5State.charge = { before: { ...reading, at: Date.now() }, result: null };
    savePs5State();
    renderPs5();
    addMarker('PS5: recorded controller battery before charge');
  } catch (e) {
    ps5Set(ps5ChargeBefore, `Could not read battery: ${e.message}`, 'warn');
  } finally {
    ps5BeforeBtn.disabled = false;
  }
}

async function ps5FinishCharge() {
  ps5AfterBtn.disabled = true;
  try {
    if (!ps5State.charge || !ps5State.charge.before) {
      throw new Error('Read the battery before charging first');
    }
    const after = await ps5SampleBattery();
    const before = ps5State.charge.before;
    const elapsedMs = Math.max(0, Date.now() - before.at);
    const delta = after.percent - before.percent;
    const minutes = elapsedMs / 60000;
    const minGain = ps5Criteria().minGain;
    const result = {
      before, after, elapsedMs, delta,
      rate: minutes > 0 ? delta / minutes : null,
      minGain,
      port: ps5Port.value,
      passed: delta >= minGain,
      at: Date.now(),
    };
    ps5State.charge.result = result;
    savePs5State();
    setPs5Step('usb-charge', result.passed ? 'pass' : 'fail', 'PS5 USB charging');
    renderPs5();
    addMarker(`PS5: charge ${result.passed ? 'passed' : 'failed'} (${delta}%)`);
  } catch (e) {
    ps5Set(ps5ChargeAfter, `Could not finish charge check: ${e.message}`, 'warn');
  } finally {
    ps5AfterBtn.disabled = false;
  }
}

function ps5ControllerNames(data) {
  return ((data && data.controllers) || [])
    .map(c => c.name || c.instanceId || '')
    .filter(Boolean);
}

async function ps5PollPairWatch() {
  if (!ps5Watcher) return;
  if (Date.now() >= ps5Watcher.until) {
    ps5Set(ps5PairStatus, 'Watch timed out with no controller handoff detected.', 'warn');
    stopPs5PairWatch();
    return;
  }
  try {
    const res = await fetch('/api/controllers', { cache: 'no-store' });
    if (!res.ok) return;
    const names = ps5ControllerNames(await res.json());
    const gone = ps5Watcher.initial.filter(n => !names.includes(n));
    if (gone.length) {
      const ev = { at: Date.now(), gone, remaining: names };
      ps5State.pairing.events.push(ev);
      savePs5State();
      setPs5Step('pairing', 'pass', 'PS5 pairing handoff');
      stopPs5PairWatch();
      ps5Set(ps5PairStatus, `Handoff observed at ${ps5Stamp(ev.at)}.`, 'ok');
      renderPs5();
      addMarker('PS5: controller handoff observed');
      return;
    }
    ps5Set(ps5PairStatus,
      `Watching… ${names.length} controller(s) still on PC · ${Math.ceil((ps5Watcher.until - Date.now()) / 1000)}s left`);
  } catch (e) {
    ps5Set(ps5PairStatus, `Watch error: ${e.message}`, 'warn');
  }
}

function startPs5PairWatch() {
  fetch('/api/controllers', { cache: 'no-store' })
    .then(r => r.ok ? r.json() : {})
    .then(data => {
      const initial = ps5ControllerNames(data);
      if (!initial.length) {
        ps5Set(ps5PairStatus, 'No controllers detected on this PC. Connect one by USB first, then start the watch.', 'warn');
        return;
      }
      ps5Watcher = { initial, until: Date.now() + 120000, timer: null };
      ps5PairWatchBtn.disabled = true;
      ps5PairStopBtn.disabled = false;
      ps5Watcher.timer = setInterval(ps5PollPairWatch, 1000);
      ps5PollPairWatch();
      addMarker('PS5: started pairing handoff watch');
    })
    .catch(e => ps5Set(ps5PairStatus, `Could not start watch: ${e.message}`, 'warn'));
}

function stopPs5PairWatch() {
  if (!ps5Watcher) return;
  clearInterval(ps5Watcher.timer);
  ps5Watcher = null;
  ps5PairWatchBtn.disabled = false;
  ps5PairStopBtn.disabled = true;
  if (!ps5State.pairing.events.length) ps5Set(ps5PairStatus, 'Watch stopped.');
}

async function ps5Ping() {
  const host = ps5Host.value.trim();
  if (!host) {
    ps5Set(ps5PingResult, 'Enter the PS5 hostname or IP address first.', 'warn');
    return;
  }
  ps5PingBtn.disabled = true;
  try {
    const res = await fetch('/api/ps5/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || 'Ping request failed');
    const verdict = ps5PingVerdict(data);
    ps5State.ping = { ...data, verdict, criteria: ps5Criteria(), at: Date.now() };
    savePs5State();
    setPs5Step('network', verdict.good ? 'pass' : 'fail', 'PS5 LAN ping');
    renderPs5();
    addMarker(`PS5: ping ${data.host} ${data.reachable ? 'reachable' : 'unreachable'}`);
  } catch (e) {
    ps5Set(ps5PingResult, `Ping failed: ${e.message}`, 'warn');
  } finally {
    ps5PingBtn.disabled = false;
  }
}

function ps5AddThermal() {
  const tempC = Number.parseFloat(ps5TempC.value);
  if (!Number.isFinite(tempC)) {
    ps5Set(ps5ThermalSummary, 'Enter a temperature in °C.', 'warn');
    return;
  }
  const rpm = ps5FanRpm.value === '' ? null : Number(ps5FanRpm.value);
  const fanRpm = Number.isFinite(rpm) ? rpm : null;
  const c = ps5Criteria();
  const verdict = ps5ThermalVerdict({ tempC, rpm: fanRpm }, c);
  ps5State.thermal.push({
    at: Date.now(),
    zone: ps5TempZone.value,
    tempC,
    rpm: fanRpm,
    note: ps5ThermalNote.value.trim(),
    criteria: c,
    verdict,
    status: verdict.good ? 'pass' : 'fail',
  });
  savePs5State();
  ps5TempC.value = '';
  ps5FanRpm.value = '';
  ps5ThermalNote.value = '';
  const allGood = ps5State.thermal.every(r => r.good);
  setPs5Step('thermal', allGood ? 'pass' : 'fail', 'PS5 thermal readings');
  renderPs5();
  addMarker(`PS5: thermal ${ps5TempZone.value} ${tempC}°C ${allGood ? 'GOOD' : `BAD (${verdict.reasons.join('; ')})`}`);
}

function ps5ClearThermal() {
  ps5State.thermal = [];
  delete stepState[stepKey('ps5', 'thermal')];
  savePs5State();
  renderWalkthrough();
  renderPs5();
  addMarker('PS5: cleared thermal readings');
}

if (ps5BeforeBtn) ps5BeforeBtn.addEventListener('click', ps5ReadBefore);
if (ps5AfterBtn) ps5AfterBtn.addEventListener('click', ps5FinishCharge);
if (ps5PairWatchBtn) ps5PairWatchBtn.addEventListener('click', startPs5PairWatch);
if (ps5PairStopBtn) ps5PairStopBtn.addEventListener('click', stopPs5PairWatch);
if (ps5PingBtn) ps5PingBtn.addEventListener('click', ps5Ping);
if (ps5ThermalAddBtn) ps5ThermalAddBtn.addEventListener('click', ps5AddThermal);
if (ps5ThermalClearBtn) ps5ThermalClearBtn.addEventListener('click', ps5ClearThermal);
if (ps5SaveCriteria) ps5SaveCriteria.addEventListener('click', ps5SaveCriteriaFromInputs);
if (ps5ResetCriteria) ps5ResetCriteria.addEventListener('click', ps5RestoreDefaultCriteria);

/* ---------- Shared console check engine (Switch profiles) ---------- */

const CONSOLE_CHECK_META = {
  switch1: {
    panelId: 'switch1Panel',
    title: 'Nintendo Switch console check',
    intro: 'A retail Switch does not expose internal temperature or fan telemetry to a PC. Pawd observes controller handoff, USB charging, and LAN reachability, and logs readings you take yourself.',
    ports: ['Dock USB-A', 'Console USB-C', 'Dock bottom USB-C'],
    pairing: true,
    pairingLabel: 'Joy-Con',
    pairStepId: 'joycon',
    pairingHint: 'Start watching, then detach or pair the Joy-Con to the Switch. Pawd records when they disappear from Windows.',
    pingLabel: 'Switch hostname/IP',
    pingHint: 'Wired LAN requires the dock; otherwise use the console Wi-Fi address.',
    zones: ['CPU', 'GPU', 'Exhaust', 'Intake', 'Other'],
    powerMeter: true,
  },
  switchlite: {
    panelId: 'switchLitePanel',
    title: 'Switch Lite console check',
    intro: 'The Switch Lite is handheld-only with integrated controls, no TV dock, no detachable Joy-Con, and no wired LAN dock. Pawd can check USB-C charging, Wi-Fi reachability, and manual thermal readings.',
    ports: ['Console USB-C'],
    pairing: false,
    pairingLabel: null,
    pairStepId: null,
    pairingHint: '',
    pingLabel: 'Switch Lite hostname/IP',
    pingHint: 'Switch Lite has no Ethernet port; enter its Wi-Fi address.',
    zones: ['CPU', 'GPU', 'Exhaust', 'Chassis', 'Other'],
    powerMeter: true,
  },
  switch2: {
    panelId: 'switch2Panel',
    title: 'Switch 2 console check',
    intro: 'Switch 2 has two USB-C ports, a dock with wired LAN, and magnetic Joy-Con 2. Pawd observes Joy-Con handoff, charging, and LAN reachability; thermal values are entered manually.',
    ports: ['Bottom USB-C (dock/charge)', 'Top USB-C (accessory)', 'Dock USB-A'],
    pairing: true,
    pairingLabel: 'Joy-Con 2',
    pairStepId: 'joycon2',
    pairingHint: 'Start watching, then detach or pair the Joy-Con 2 to the Switch 2. Pawd records when they disappear from Windows.',
    pingLabel: 'Switch 2 hostname/IP',
    pingHint: 'Use the dock Ethernet address or the Wi-Fi 6 address of the console.',
    zones: ['CPU', 'GPU', 'Exhaust', 'Intake', 'Other'],
    powerMeter: true,
  },
};

const consoleStates = {};
const consoleWatchers = {};
const viewConsoleEl = document.getElementById('viewConsole');

function freshConsoleState() {
  return {
    charge: null,
    pairing: { events: [] },
    ping: null,
    power: [],
    thermal: [],
    criteria: { ...PS5_DEFAULT_CRITERIA },
  };
}

function consoleState(id) {
  if (!consoleStates[id]) {
    let state = freshConsoleState();
    try {
      const saved = JSON.parse(localStorage.getItem(`pawd.console.${id}.v1`) || '{}') || {};
      state = Object.assign(state, saved);
      state.criteria = Object.assign({ ...PS5_DEFAULT_CRITERIA }, saved.criteria || {});
    } catch (e) {
      state = freshConsoleState();
    }
    if (!Array.isArray(state.thermal)) state.thermal = [];
    if (!Array.isArray(state.power)) state.power = [];
    if (!state.pairing || !Array.isArray(state.pairing.events)) state.pairing = { events: [] };
    consoleStates[id] = state;
  }
  return consoleStates[id];
}

function saveConsoleState(id) {
  try {
    localStorage.setItem(`pawd.console.${id}.v1`, JSON.stringify(consoleState(id)));
  } catch (e) {
    // Storage is optional; values still appear in the report.
  }
}

function consolePanel(id) {
  const meta = CONSOLE_CHECK_META[id];
  return meta ? document.getElementById(meta.panelId) : null;
}

function consoleEl(id, role) {
  const panel = consolePanel(id);
  return panel ? panel.querySelector(`[data-role="${role}"]`) : null;
}

function consoleSet(el, text, cls) {
  if (!el) return;
  el.textContent = text;
  el.className = `ps5-readout ${cls || 'muted'}`;
}

function consoleCriteria(id) {
  const saved = consoleState(id).criteria || {};
  const number = (value, fallback) => Number.isFinite(Number(value)) ? Number(value) : fallback;
  return {
    maxTemp: Math.max(0, number(saved.maxTemp, PS5_DEFAULT_CRITERIA.maxTemp)),
    minRpm: Math.max(0, number(saved.minRpm, 0)),
    maxPingMs: Math.max(0, number(saved.maxPingMs, PS5_DEFAULT_CRITERIA.maxPingMs)),
    maxLoss: Math.max(0, number(saved.maxLoss, 0)),
    minGain: Math.max(0, number(saved.minGain, PS5_DEFAULT_CRITERIA.minGain)),
    minWatts: Math.max(0, number(saved.minWatts, 0)),
    maxWatts: Math.max(0, number(saved.maxWatts, 0)),
  };
}

function consoleCriteriaSummary(c) {
  return ps5CriteriaSummary(c);
}

function consolePowerVerdict(r, c) {
  const watts = Number(r && r.watts);
  if (!Number.isFinite(watts)) return null;
  const reasons = [];
  if (c.minWatts > 0 && watts < c.minWatts) {
    reasons.push(`${watts} W < ${c.minWatts} W minimum`);
  }
  if (c.maxWatts > 0 && watts > c.maxWatts) {
    reasons.push(`${watts} W > ${c.maxWatts} W limit`);
  }
  return { good: reasons.length === 0, reasons };
}

function consoleLoadCriteriaInputs(id) {
  const c = consoleCriteria(id);
  const values = {
    'max-temp': c.maxTemp, 'min-rpm': c.minRpm, 'max-ping': c.maxPingMs,
    'max-loss': c.maxLoss, 'min-gain': c.minGain,
  };
  if (CONSOLE_CHECK_META[id].powerMeter) {
    values['min-watts'] = c.minWatts;
    values['max-watts'] = c.maxWatts;
  }
  Object.entries(values).forEach(([role, value]) => {
    const el = consoleEl(id, role);
    if (el) el.value = value;
  });
}

function consoleSaveCriteria(id) {
  const roles = ['max-temp', 'min-rpm', 'max-ping', 'max-loss', 'min-gain'];
  const values = roles.map(role => {
    const el = consoleEl(id, role);
    return el ? Number(el.value) : NaN;
  });
  let minWatts = 0;
  let maxWatts = 0;
  if (CONSOLE_CHECK_META[id].powerMeter) {
    const minEl = consoleEl(id, 'min-watts');
    const maxEl = consoleEl(id, 'max-watts');
    minWatts = minEl ? Number(minEl.value) : 0;
    maxWatts = maxEl ? Number(maxEl.value) : 0;
    if (!Number.isFinite(minWatts) || !Number.isFinite(maxWatts) || minWatts < 0 || maxWatts < 0) {
      consoleSet(consoleEl(id, 'criteria-text'), 'Enter a valid watt limit (zero or more).', 'warn');
      return;
    }
  }
  if (values.some(v => !Number.isFinite(v) || v < 0)) {
    consoleSet(consoleEl(id, 'criteria-text'), 'Enter a valid number (zero or more) in every limit.', 'warn');
    return;
  }
  consoleState(id).criteria = {
    maxTemp: values[0], minRpm: values[1], maxPingMs: values[2],
    maxLoss: values[3], minGain: values[4], minWatts, maxWatts,
  };
  saveConsoleState(id);
  renderConsoleCheck(id);
  addMarker(`${CONSOLE_CHECK_META[id].title}: criteria saved — ${consoleCriteriaSummary(consoleCriteria(id))}`);
}

function consoleResetCriteria(id) {
  consoleState(id).criteria = { ...PS5_DEFAULT_CRITERIA };
  consoleLoadCriteriaInputs(id);
  saveConsoleState(id);
  renderConsoleCheck(id);
  addMarker(`${CONSOLE_CHECK_META[id].title}: restored default pass criteria`);
}

function setConsoleStep(id, stepId, status, title) {
  if (stepStatus(id, stepId) !== status) setStepStatus(id, stepId, status, title);
}

function syncConsoleChargeStep(id) {
  const state = consoleState(id);
  const checks = [];
  if (state.charge && state.charge.result) checks.push(state.charge.result.passed !== false);
  if ((state.power || []).length) {
    const c = consoleCriteria(id);
    checks.push(state.power.every(r => {
      const v = r.verdict || consolePowerVerdict(r, c);
      return !!v && v.good;
    }));
  }
  if (!checks.length) return;
  const pass = checks.every(Boolean);
  setConsoleStep(id, 'charge', pass ? 'pass' : 'fail', `${CONSOLE_CHECK_META[id].title} charging`);
}

function renderConsoleCheck(id) {
  const meta = CONSOLE_CHECK_META[id];
  const panel = consolePanel(id);
  if (!meta || !panel) return;
  const state = consoleState(id);
  const c = consoleCriteria(id);
  const parts = [];
  let badCount = 0;

  const custom = Object.keys(PS5_DEFAULT_CRITERIA).some(k => c[k] !== PS5_DEFAULT_CRITERIA[k]);
  const criteriaBadge = consoleEl(id, 'criteria-badge');
  if (criteriaBadge) {
    criteriaBadge.textContent = custom ? 'Custom limits' : 'Defaults';
    criteriaBadge.className = custom ? '' : 'muted';
  }
  consoleSet(consoleEl(id, 'criteria-text'), consoleCriteriaSummary(c));

  if (state.charge && state.charge.before) {
    consoleSet(consoleEl(id, 'charge-before-out'),
      `Before: ${state.charge.before.percent}% · ${state.charge.before.precision || 'unknown precision'}` +
      ` · ${state.charge.before.device || state.charge.before.source || 'unknown source'} · ${ps5Stamp(state.charge.before.at)}`);
    parts.push('charge reading');
  }
  if (state.charge && state.charge.result) {
    const r = state.charge.result;
    const v = ps5ChargeVerdict(r);
    if (!v.good) badCount += 1;
    consoleSet(consoleEl(id, 'charge-after-out'),
      `${ps5VerdictText(v)}: ${r.before.percent}% → ${r.after.percent}%` +
      ` (${r.delta >= 0 ? '+' : ''}${r.delta}% in ${(r.elapsedMs / 60000).toFixed(1)} min,` +
      ` ${r.rate == null ? '—' : r.rate.toFixed(1)} %/min) · ${v.reasons.join('; ')}`,
      v.good ? 'ok' : 'warn');
    parts.push('charge result');
  } else if (state.charge && state.charge.before) {
    consoleSet(consoleEl(id, 'charge-after-out'), 'Waiting for the finish reading after charging on the console.');
  }

  if (meta.powerMeter) {
    const powerReadings = state.power || [];
    if (powerReadings.length) {
      const watts = powerReadings.map(r => Number(r.watts)).filter(Number.isFinite);
      const bad = powerReadings.filter(r => !(r.verdict || consolePowerVerdict(r, c) || {}).good).length;
      badCount += bad;
      const min = watts.length ? Math.min(...watts) : null;
      const max = watts.length ? Math.max(...watts) : null;
      consoleSet(consoleEl(id, 'power-summary'),
        `${powerReadings.length} reading(s) · ${min ?? '—'}–${max ?? '—'} W` +
        ` · ${bad ? `${bad} BAD` : 'all GOOD'}`,
        bad ? 'warn' : 'ok');
      const list = consoleEl(id, 'power-list');
      if (list) {
        list.innerHTML = powerReadings.map(r => {
          const v = r.verdict || consolePowerVerdict(r, c);
          return `<div class="ps5-temp-row">
            <span>${escapeHtml(ps5Stamp(r.at))} · ${escapeHtml(r.port || 'USB port')} · ${escapeHtml(r.watts)} W</span>
            <span>${r.volts == null ? 'V —' : `${escapeHtml(r.volts)} V`} · ${r.amps == null ? 'A —' : `${escapeHtml(r.amps)} A`} ·
              <strong style="color:${v && v.good ? '#4ade80' : '#f87171'}">${ps5VerdictText(v)}</strong>
              ${v && v.reasons.length ? ` · ${escapeHtml(v.reasons.join('; '))}` : ''}
              ${r.note ? ` · ${escapeHtml(r.note)}` : ''}</span>
          </div>`;
        }).join('');
      }
      parts.push(`${powerReadings.length} charge power reading(s)`);
    } else {
      consoleSet(consoleEl(id, 'power-summary'), 'No readings yet.');
      const list = consoleEl(id, 'power-list');
      if (list) list.textContent = 'No readings yet.';
    }
  }

  const events = state.pairing.events || [];
  const eventsEl = consoleEl(id, 'pair-events');
  if (eventsEl) {
    eventsEl.innerHTML = events.length
      ? events.map(ev => `<div>${escapeHtml(ps5Stamp(ev.at))} — controller left PC: ${escapeHtml(ev.gone.join(', '))}</div>`).join('')
      : 'No events recorded.';
  }
  if (!consoleWatchers[id]) {
    consoleSet(consoleEl(id, 'pair-status'), events.length
      ? `Handoff observed at ${ps5Stamp(events[events.length - 1].at)}.`
      : 'Not watching.');
  }
  if (events.length) parts.push('pairing handoff');

  const ping = state.ping;
  if (ping && ping.reachable != null) {
    const v = ping.verdict || ps5PingVerdict(ping, c);
    if (!v.good) badCount += 1;
    consoleSet(consoleEl(id, 'ping-out'),
      `${ps5VerdictText(v)}: ${ping.host}: ${ping.reachable ? 'reachable' : 'unreachable'}` +
      ` · loss ${ping.lossPercent == null ? '—' : ping.lossPercent + '%'}` +
      ` · avg ${ping.avgMs == null ? '—' : ping.avgMs + ' ms'}` +
      ` · ${v.reasons.join('; ')}`,
      v.good ? 'ok' : 'warn');
    parts.push('ping');
  }

  const readings = state.thermal;
  if (readings.length) {
    const temps = readings.map(r => r.tempC).filter(Number.isFinite);
    const rpms = readings.map(r => r.rpm).filter(v => Number.isFinite(v));
    const bad = readings.filter(r => !(r.verdict || ps5ThermalVerdict(r, c)).good).length;
    badCount += bad;
    const min = temps.length ? Math.min(...temps) : null;
    const max = temps.length ? Math.max(...temps) : null;
    consoleSet(consoleEl(id, 'thermal-summary'),
      `${readings.length} reading(s) · temp ${min ?? '—'}–${max ?? '—'} °C` +
      ` · max fan ${rpms.length ? Math.max(...rpms) : '—'} RPM` +
      ` · ${bad ? `${bad} BAD` : 'all GOOD'}`,
      bad ? 'warn' : 'ok');
    const list = consoleEl(id, 'thermal-list');
    if (list) {
      list.innerHTML = readings.map(r => {
        const v = r.verdict || ps5ThermalVerdict(r, c);
        return `<div class="ps5-temp-row">
          <span>${escapeHtml(ps5Stamp(r.at))} · ${escapeHtml(r.zone)} · ${escapeHtml(r.tempC)} °C</span>
          <span>${r.rpm == null ? 'fan —' : `fan ${escapeHtml(r.rpm)} RPM`} ·
            <strong style="color:${v.good ? '#4ade80' : '#f87171'}">${ps5VerdictText(v)}</strong>
            ${v.reasons.length ? ` · ${escapeHtml(v.reasons.join('; '))}` : ''}
            ${r.note ? ` · ${escapeHtml(r.note)}` : ''}</span>
        </div>`;
      }).join('');
    }
    parts.push(`${readings.length} thermal reading(s)`);
  } else {
    consoleSet(consoleEl(id, 'thermal-summary'), 'No readings yet.');
    const list = consoleEl(id, 'thermal-list');
    if (list) list.textContent = 'No readings yet.';
  }

  if (badCount) parts.push(`${badCount} BAD measurement(s)`);
  const badge = consoleEl(id, 'badge');
  if (badge) {
    badge.textContent = parts.length ? parts.join(' · ') : 'No readings yet';
    badge.className = badCount ? 'warn' : parts.length ? '' : 'muted';
  }
}

async function consoleSampleBattery(id) {
  const player = consoleEl(id, 'player');
  const source = consoleEl(id, 'source');
  const body = {
    index: Number(player && player.value) || 0,
    source: source ? source.value : 'auto',
  };
  const res = await fetch('/api/controllers/battery/sample', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok || data.available === false) {
    throw new Error(data.error || data.note || 'No readable controller battery on this player/source');
  }
  if (data.percent == null) throw new Error('This controller/source does not report a battery percentage');
  return data;
}

async function consoleReadBefore(id) {
  const btn = consoleEl(id, 'charge-before');
  if (btn) btn.disabled = true;
  try {
    const reading = await consoleSampleBattery(id);
    consoleState(id).charge = { before: { ...reading, at: Date.now() }, result: null };
    saveConsoleState(id);
    renderConsoleCheck(id);
    addMarker(`${CONSOLE_CHECK_META[id].title}: recorded controller battery before charge`);
  } catch (e) {
    consoleSet(consoleEl(id, 'charge-before-out'), `Could not read battery: ${e.message}`, 'warn');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function consoleFinishCharge(id) {
  const btn = consoleEl(id, 'charge-after');
  if (btn) btn.disabled = true;
  try {
    const state = consoleState(id);
    if (!state.charge || !state.charge.before) throw new Error('Read the battery before charging first');
    const after = await consoleSampleBattery(id);
    const before = state.charge.before;
    const elapsedMs = Math.max(0, Date.now() - before.at);
    const delta = after.percent - before.percent;
    const minutes = elapsedMs / 60000;
    const minGain = consoleCriteria(id).minGain;
    const portEl = consoleEl(id, 'port');
    const result = {
      before, after, elapsedMs, delta,
      rate: minutes > 0 ? delta / minutes : null,
      minGain,
      port: portEl ? portEl.value : null,
      passed: delta >= minGain,
      at: Date.now(),
    };
    state.charge.result = result;
    saveConsoleState(id);
    syncConsoleChargeStep(id);
    renderConsoleCheck(id);
    addMarker(`${CONSOLE_CHECK_META[id].title}: charge ${result.passed ? 'GOOD' : 'BAD'} (${delta}%)`);
  } catch (e) {
    consoleSet(consoleEl(id, 'charge-after-out'), `Could not finish charge check: ${e.message}`, 'warn');
  } finally {
    if (btn) btn.disabled = false;
  }
}

async function consolePollPairWatch(id) {
  const watcher = consoleWatchers[id];
  if (!watcher) return;
  if (Date.now() >= watcher.until) {
    consoleSet(consoleEl(id, 'pair-status'), 'Watch timed out with no controller handoff detected.', 'warn');
    consoleStopPairWatch(id);
    return;
  }
  try {
    const res = await fetch('/api/controllers', { cache: 'no-store' });
    if (!res.ok) return;
    const names = ps5ControllerNames(await res.json());
    const gone = watcher.initial.filter(n => !names.includes(n));
    if (gone.length) {
      const ev = { at: Date.now(), gone, remaining: names };
      consoleState(id).pairing.events.push(ev);
      saveConsoleState(id);
      const meta = CONSOLE_CHECK_META[id];
      if (meta.pairStepId) setConsoleStep(id, meta.pairStepId, 'pass', `${meta.title} pairing handoff`);
      consoleStopPairWatch(id);
      consoleSet(consoleEl(id, 'pair-status'), `Handoff observed at ${ps5Stamp(ev.at)}.`, 'ok');
      renderConsoleCheck(id);
      addMarker(`${meta.title}: ${meta.pairingLabel || 'controller'} handoff observed`);
      return;
    }
    consoleSet(consoleEl(id, 'pair-status'),
      `Watching… ${names.length} controller(s) still on PC · ${Math.ceil((watcher.until - Date.now()) / 1000)}s left`);
  } catch (e) {
    consoleSet(consoleEl(id, 'pair-status'), `Watch error: ${e.message}`, 'warn');
  }
}

function consoleStartPairWatch(id) {
  const meta = CONSOLE_CHECK_META[id];
  if (!meta.pairing) return;
  fetch('/api/controllers', { cache: 'no-store' })
    .then(r => r.ok ? r.json() : {})
    .then(data => {
      const initial = ps5ControllerNames(data);
      if (!initial.length) {
        consoleSet(consoleEl(id, 'pair-status'),
          `No controllers detected on this PC. Connect a ${meta.pairingLabel || 'controller'} first, then start the watch.`, 'warn');
        return;
      }
      consoleWatchers[id] = { initial, until: Date.now() + 120000, timer: null };
      const watchBtn = consoleEl(id, 'pair-watch');
      const stopBtn = consoleEl(id, 'pair-stop');
      if (watchBtn) watchBtn.disabled = true;
      if (stopBtn) stopBtn.disabled = false;
      consoleWatchers[id].timer = setInterval(() => consolePollPairWatch(id), 1000);
      consolePollPairWatch(id);
      addMarker(`${meta.title}: started pairing handoff watch`);
    })
    .catch(e => consoleSet(consoleEl(id, 'pair-status'), `Could not start watch: ${e.message}`, 'warn'));
}

function consoleStopPairWatch(id) {
  const watcher = consoleWatchers[id];
  if (!watcher) return;
  clearInterval(watcher.timer);
  delete consoleWatchers[id];
  const watchBtn = consoleEl(id, 'pair-watch');
  const stopBtn = consoleEl(id, 'pair-stop');
  if (watchBtn) watchBtn.disabled = false;
  if (stopBtn) stopBtn.disabled = true;
  if (!consoleState(id).pairing.events.length) {
    consoleSet(consoleEl(id, 'pair-status'), 'Watch stopped.');
  }
}

async function consolePing(id) {
  const hostEl = consoleEl(id, 'host');
  const host = hostEl ? hostEl.value.trim() : '';
  if (!host) {
    consoleSet(consoleEl(id, 'ping-out'), 'Enter the console hostname or IP address first.', 'warn');
    return;
  }
  const btn = consoleEl(id, 'ping');
  if (btn) btn.disabled = true;
  try {
    const res = await fetch('/api/ps5/ping', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ host }),
    });
    const data = await res.json().catch(() => ({}));
    if (!res.ok || !data.ok) throw new Error(data.error || 'Ping request failed');
    const verdict = ps5PingVerdict(data, consoleCriteria(id));
    consoleState(id).ping = { ...data, verdict, criteria: consoleCriteria(id), at: Date.now() };
    saveConsoleState(id);
    setConsoleStep(id, 'network', verdict.good ? 'pass' : 'fail', `${CONSOLE_CHECK_META[id].title} LAN ping`);
    renderConsoleCheck(id);
    addMarker(`${CONSOLE_CHECK_META[id].title}: ping ${data.host} ${ps5VerdictText(verdict)}`);
  } catch (e) {
    consoleSet(consoleEl(id, 'ping-out'), `Ping failed: ${e.message}`, 'warn');
  } finally {
    if (btn) btn.disabled = false;
  }
}

function consoleAddThermal(id) {
  const tempEl = consoleEl(id, 'temp');
  const tempC = Number.parseFloat(tempEl ? tempEl.value : '');
  if (!Number.isFinite(tempC)) {
    consoleSet(consoleEl(id, 'thermal-summary'), 'Enter a temperature in °C.', 'warn');
    return;
  }
  const rpmEl = consoleEl(id, 'rpm');
  const rpm = rpmEl && rpmEl.value !== '' ? Number(rpmEl.value) : null;
  const fanRpm = Number.isFinite(rpm) ? rpm : null;
  const c = consoleCriteria(id);
  const verdict = ps5ThermalVerdict({ tempC, rpm: fanRpm }, c);
  const zoneEl = consoleEl(id, 'zone');
  const noteEl = consoleEl(id, 'note');
  consoleState(id).thermal.push({
    at: Date.now(),
    zone: zoneEl ? zoneEl.value : 'Other',
    tempC,
    rpm: fanRpm,
    note: noteEl ? noteEl.value.trim() : '',
    criteria: c,
    verdict,
    status: verdict.good ? 'pass' : 'fail',
  });
  saveConsoleState(id);
  if (tempEl) tempEl.value = '';
  if (rpmEl) rpmEl.value = '';
  if (noteEl) noteEl.value = '';
  const allGood = consoleState(id).thermal.every(r => {
    const v = r.verdict || ps5ThermalVerdict(r, consoleCriteria(id));
    return v.good;
  });
  setConsoleStep(id, 'thermal', allGood ? 'pass' : 'fail', `${CONSOLE_CHECK_META[id].title} thermal readings`);
  renderConsoleCheck(id);
  addMarker(`${CONSOLE_CHECK_META[id].title}: thermal ${zoneEl ? zoneEl.value : 'Other'} ${tempC}°C ${allGood ? 'GOOD' : `BAD (${verdict.reasons.join('; ')})`}`);
}

function consoleClearThermal(id) {
  consoleState(id).thermal = [];
  delete stepState[stepKey(id, 'thermal')];
  saveStepState();
  saveConsoleState(id);
  renderWalkthrough();
  renderConsoleCheck(id);
  addMarker(`${CONSOLE_CHECK_META[id].title}: cleared thermal readings`);
}

function consoleAddPower(id) {
  const wattsEl = consoleEl(id, 'watts');
  const voltsEl = consoleEl(id, 'volts');
  const ampsEl = consoleEl(id, 'amps');
  let watts = Number.parseFloat(wattsEl ? wattsEl.value : '');
  const volts = voltsEl && voltsEl.value !== '' ? Number(voltsEl.value) : null;
  const amps = ampsEl && ampsEl.value !== '' ? Number(ampsEl.value) : null;
  if (!Number.isFinite(watts) && Number.isFinite(volts) && Number.isFinite(amps)) {
    watts = volts * amps;
  }
  if (!Number.isFinite(watts) || watts < 0) {
    consoleSet(consoleEl(id, 'power-summary'), 'Enter the meter watt reading (or both volts and amps).', 'warn');
    return;
  }
  const c = consoleCriteria(id);
  const verdict = consolePowerVerdict({ watts }, c);
  const portEl = consoleEl(id, 'power-port');
  const noteEl = consoleEl(id, 'power-note');
  consoleState(id).power.push({
    at: Date.now(),
    port: portEl ? portEl.value : 'USB port',
    watts,
    volts: Number.isFinite(volts) ? volts : null,
    amps: Number.isFinite(amps) ? amps : null,
    note: noteEl ? noteEl.value.trim() : '',
    criteria: c,
    verdict,
    status: verdict.good ? 'pass' : 'fail',
  });
  saveConsoleState(id);
  if (wattsEl) wattsEl.value = '';
  if (voltsEl) voltsEl.value = '';
  if (ampsEl) ampsEl.value = '';
  if (noteEl) noteEl.value = '';
  syncConsoleChargeStep(id);
  renderConsoleCheck(id);
  addMarker(`${CONSOLE_CHECK_META[id].title}: charge power ${watts} W ${ps5VerdictText(verdict)}` +
    `${verdict.reasons.length ? ` (${verdict.reasons.join('; ')})` : ''}`);
}

function consoleClearPower(id) {
  consoleState(id).power = [];
  syncConsoleChargeStep(id);
  saveConsoleState(id);
  renderConsoleCheck(id);
  addMarker(`${CONSOLE_CHECK_META[id].title}: cleared charge power readings`);
}

function consolePanelHtml(id, meta) {
  const ports = meta.ports.map(p => `<option value="${escapeHtml(p)}">${escapeHtml(p)}</option>`).join('');
  const zones = meta.zones.map(z => `<option value="${escapeHtml(z)}">${escapeHtml(z)}</option>`).join('');
  const powerBlock = meta.powerMeter
    ? `<div class="ps5-block">
        <div class="panel-head"><h3>Charge power log (USB meter readings)</h3></div>
        <p class="muted">Enter watt readings from your USB-C power meter. Optional volts and amps are recorded for traceability; if watts is blank, Pawd calculates watts from volts × amps.</p>
        <div class="ps5-controls">
          <label>Console port <select data-role="power-port">${ports}</select></label>
          <label>Watts <input type="number" data-role="watts" min="0" max="100" step="0.1" placeholder="e.g. 15.2" /></label>
          <label>Volts <input type="number" data-role="volts" min="0" max="30" step="0.01" placeholder="optional" /></label>
          <label>Amps <input type="number" data-role="amps" min="0" max="10" step="0.01" placeholder="optional" /></label>
          <label>Note <input type="text" data-role="power-note" placeholder=" handheld / docked / idle" /></label>
          <button type="button" data-action="power-add" data-role="power-add">Add reading</button>
          <button type="button" class="secondary" data-action="power-clear" data-role="power-clear">Clear</button>
        </div>
        <div data-role="power-summary" class="ps5-readout muted">No readings yet.</div>
        <div data-role="power-list" class="ps5-events muted">No readings yet.</div>
      </div>`
    : '';
  const powerCriteriaHtml = meta.powerMeter
    ? `<label>Min charge W <input type="number" data-role="min-watts" min="0" max="100" step="0.1" value="0" /></label>
       <label>Max charge W <input type="number" data-role="max-watts" min="0" max="100" step="0.1" value="0" /></label>`
    : '';
  const pairingBlock = meta.pairing
    ? `<div class="ps5-block">
        <h3>${escapeHtml(meta.pairingLabel)} handoff</h3>
        <p class="muted">${escapeHtml(meta.pairingHint)}</p>
        <div class="ps5-controls">
          <button type="button" data-action="pair-watch" data-role="pair-watch">Watch for handoff</button>
          <button type="button" class="secondary" data-action="pair-stop" data-role="pair-stop" disabled>Stop watching</button>
        </div>
        <div data-role="pair-status" class="ps5-readout muted">Not watching.</div>
        <div data-role="pair-events" class="ps5-events muted">No events recorded.</div>
      </div>`
    : `<div class="ps5-block">
        <h3>Integrated controls</h3>
        <p class="muted">Switch Lite controls are built in. There is no detachable controller handoff to observe; use the walkthrough to mark each input.</p>
      </div>`;
  return `<section class="panel hidden" id="${meta.panelId}" data-console="${id}">
    <div class="panel-head">
      <h2>${escapeHtml(meta.title)}</h2>
      <span data-role="badge" class="muted">No readings yet</span>
    </div>
    <p class="muted">${escapeHtml(meta.intro)}</p>
    <div class="ps5-grid">
      <div class="ps5-block">
        <h3>USB charging check</h3>
        <p class="muted">Read a controller battery on this PC, charge through the selected console USB port, then reconnect and read again.</p>
        <div class="ps5-controls">
          <label>Player
            <select data-role="player">
              <option value="0">1</option><option value="1">2</option>
              <option value="2">3</option><option value="3">4</option>
            </select>
          </label>
          <label>Source
            <select data-role="source">
              <option value="auto">Auto</option>
              <option value="dinput">DirectInput</option>
              <option value="xinput">XInput</option>
              <option value="demo">Demo</option>
            </select>
          </label>
          <label>Console port <select data-role="port">${ports}</select></label>
          <label>Minutes <input type="number" data-role="minutes" min="1" max="180" step="1" value="15" /></label>
          <button type="button" data-action="charge-before" data-role="charge-before">Read before</button>
          <button type="button" class="secondary" data-action="charge-after" data-role="charge-after">Finish &amp; calculate</button>
        </div>
        <div data-role="charge-before-out" class="ps5-readout muted">No before reading yet.</div>
        <div data-role="charge-after-out" class="ps5-readout muted">No charge result yet.</div>
      </div>
      ${pairingBlock}
      <div class="ps5-block">
        <h3>LAN reachability</h3>
        <p class="muted">${escapeHtml(meta.pingHint)}</p>
        <div class="ps5-controls">
          <label>${escapeHtml(meta.pingLabel)} <input type="text" data-role="host" placeholder="192.168.1.50" /></label>
          <button type="button" data-action="ping" data-role="ping">Ping</button>
        </div>
        <div data-role="ping-out" class="ps5-readout muted">No ping result yet.</div>
      </div>
    </div>
    <div class="ps5-block">
      <div class="panel-head"><h3>Temperature &amp; fan log (manual readings)</h3></div>
      <p class="muted">Enter readings taken with your own thermometer, thermal camera, or fan tachometer. Each value is labelled GOOD or BAD against the limits below.</p>
      <div class="ps5-controls">
        <label>Zone <select data-role="zone">${zones}</select></label>
        <label>Temp °C <input type="number" data-role="temp" min="0" max="150" step="0.1" placeholder="e.g. 45" /></label>
        <label>Fan RPM <input type="number" data-role="rpm" min="0" max="20000" step="1" placeholder="optional" /></label>
        <label>Note <input type="text" data-role="note" placeholder="idle / gaming / docked" /></label>
        <button type="button" data-action="thermal-add" data-role="thermal-add">Add reading</button>
        <button type="button" class="secondary" data-action="thermal-clear" data-role="thermal-clear">Clear</button>
      </div>
      <div data-role="thermal-summary" class="ps5-readout muted">No readings yet.</div>
      <div data-role="thermal-list" class="ps5-events muted">No readings yet.</div>
    </div>
    ${powerBlock}
    <div class="ps5-block">
      <div class="panel-head">
        <h3>Good vs bad — pass criteria</h3>
        <span data-role="criteria-badge" class="muted">Defaults</span>
      </div>
      <p class="muted">Every measurement is labelled GOOD or BAD against these editable limits, with the reason shown. Defaults are starting points, not official Nintendo specifications. Set a watt limit to 0 to disable it.</p>
      <div class="ps5-controls">
        <label>Max temp °C <input type="number" data-role="max-temp" min="0" max="150" step="1" value="75" /></label>
        <label>Min fan RPM <input type="number" data-role="min-rpm" min="0" max="20000" step="1" value="0" /></label>
        <label>Max ping ms <input type="number" data-role="max-ping" min="0" max="5000" step="1" value="100" /></label>
        <label>Max loss % <input type="number" data-role="max-loss" min="0" max="100" step="1" value="0" /></label>
        <label>Min charge gain % <input type="number" data-role="min-gain" min="0" max="100" step="1" value="3" /></label>
        ${powerCriteriaHtml}
        <button type="button" data-action="save-criteria" data-role="save-criteria">Save criteria</button>
        <button type="button" class="secondary" data-action="reset-criteria" data-role="reset-criteria">Reset defaults</button>
      </div>
      <div data-role="criteria-text" class="ps5-readout muted">No criteria saved yet.</div>
    </div>
  </section>`;
}

function buildConsolePanels() {
  if (!viewConsoleEl) return;
  Object.entries(CONSOLE_CHECK_META).forEach(([id, meta]) => {
    if (document.getElementById(meta.panelId)) return;
    const wrapper = document.createElement('div');
    wrapper.innerHTML = consolePanelHtml(id, meta).trim();
    if (wrapper.firstElementChild) viewConsoleEl.appendChild(wrapper.firstElementChild);
  });
  Object.keys(CONSOLE_CHECK_META).forEach(consoleLoadCriteriaInputs);
}

if (viewConsoleEl) {
  viewConsoleEl.addEventListener('click', event => {
    const btn = event.target.closest('[data-action]');
    if (!btn) return;
    const panel = btn.closest('[data-console]');
    if (!panel) return;
    const id = panel.dataset.console;
    if (!CONSOLE_CHECK_META[id]) return;
    switch (btn.dataset.action) {
      case 'charge-before': consoleReadBefore(id); break;
      case 'charge-after': consoleFinishCharge(id); break;
      case 'pair-watch': consoleStartPairWatch(id); break;
      case 'pair-stop': consoleStopPairWatch(id); break;
      case 'ping': consolePing(id); break;
      case 'thermal-add': consoleAddThermal(id); break;
      case 'thermal-clear': consoleClearThermal(id); break;
      case 'power-add': consoleAddPower(id); break;
      case 'power-clear': consoleClearPower(id); break;
      case 'save-criteria': consoleSaveCriteria(id); break;
      case 'reset-criteria': consoleResetCriteria(id); break;
      default: break;
    }
  });
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

  const walkthroughCategories = ['android', 'controller', ...Object.keys(consoleProfiles)];
  const walkthroughs = {};
  walkthroughCategories.forEach(cat => {
    walkthroughs[cat] = stepSets[cat].steps.map(s => ({
      id: s.id,
      title: s.title,
      desc: s.desc,
      status: stepStatus(cat, s.id),
    }));
  });
  const all = walkthroughCategories.flatMap(cat => walkthroughs[cat]);
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
    ps5: {
      charge: ps5State.charge || null,
      pairing: ps5State.pairing || { events: [] },
      ping: ps5State.ping || null,
      thermal: ps5State.thermal || [],
      criteria: ps5Criteria(),
    },
    consoles: Object.fromEntries(Object.keys(CONSOLE_CHECK_META).map(id => {
      const state = consoleState(id);
      return [id, {
        label: CONSOLE_CHECK_META[id].title,
        charge: state.charge || null,
        pairing: state.pairing || { events: [] },
        ping: state.ping || null,
        power: state.power || [],
        thermal: state.thermal || [],
        criteria: consoleCriteria(id),
      }];
    })),
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

function buildConsoleReportHtml(id, state, title) {
  const events = (state.pairing && state.pairing.events) || [];
  const readings = state.thermal || [];
  const powerReadings = state.power || [];
  if (!state.charge && !state.ping && !events.length && !readings.length && !powerReadings.length) return '';
  const criteria = state.criteria || {};
  const verdictText = v => v && v.good ? 'GOOD' : v ? 'BAD' : 'UNKNOWN';
  const powerLimit = criteria.maxWatts > 0
    ? ` · charge power ≤ ${criteria.maxWatts} W` : criteria.minWatts > 0
      ? ` · charge power ≥ ${criteria.minWatts} W` : '';
  const rows = [reportDeviceRow('Pass criteria',
    `GOOD when temp ≤ ${criteria.maxTemp ?? '—'} °C` +
    `${criteria.minRpm ? ` and fan ≥ ${criteria.minRpm} RPM` : ' (no fan minimum)'}` +
    ` · ping ≤ ${criteria.maxPingMs ?? '—'} ms · loss ≤ ${criteria.maxLoss ?? '—'}%` +
    ` · charge gain ≥ +${criteria.minGain ?? '—'}%` + powerLimit)];
  if (state.charge && state.charge.before) {
    rows.push(reportDeviceRow('Battery before',
      `${state.charge.before.percent}% (${state.charge.before.precision || 'unknown'}), ${new Date(state.charge.before.at).toLocaleString()}`));
    rows.push(reportDeviceRow('Console port', state.charge.result ? state.charge.result.port : '—'));
  }
  if (state.charge && state.charge.result) {
    const r = state.charge.result;
    const v = ps5ChargeVerdict(r);
    rows.push(reportDeviceRow('Battery after', `${r.after.percent}% (${r.after.precision || 'unknown'})`));
    rows.push(reportDeviceRow('Charge gain',
      `${r.delta >= 0 ? '+' : ''}${r.delta}% in ${(r.elapsedMs / 60000).toFixed(1)} min` +
      ` (${r.rate == null ? '—' : r.rate.toFixed(1)} %/min) — ${verdictText(v)} (${v.reasons.join('; ')})`));
  }
  if (state.ping) {
    const v = state.ping.verdict || ps5PingVerdict(state.ping, criteria);
    rows.push(reportDeviceRow('LAN ping',
      `${state.ping.host}: ${state.ping.reachable ? 'reachable' : 'unreachable'}` +
      `, loss ${state.ping.lossPercent == null ? '—' : state.ping.lossPercent + '%'}` +
      `, avg ${state.ping.avgMs == null ? '—' : state.ping.avgMs + ' ms'}` +
      ` — ${verdictText(v)} (${v ? v.reasons.join('; ') : 'no verdict'})`));
  }
  if (events.length) {
    rows.push(reportDeviceRow('Pairing handoff', events.map(ev =>
      `${new Date(ev.at).toLocaleTimeString()} — ${ev.gone.join(', ')}`).join('; ')));
  }
  const thermalRows = readings.map(r => {
    const v = r.verdict || ps5ThermalVerdict(r, criteria);
    const used = r.criteria || {};
    return `<tr>
      <td>${escapeHtml(new Date(r.at).toLocaleString())}</td>
      <td>${escapeHtml(r.zone)}</td>
      <td>${escapeHtml(r.tempC)} °C (limit ${escapeHtml(used.maxTemp ?? r.limit)})</td>
      <td>${r.rpm == null ? '—' : `${escapeHtml(r.rpm)} RPM (min ${escapeHtml(used.minRpm ?? r.minRpm ?? 0)})`}</td>
      <td>${escapeHtml(r.note || '')}</td>
      <td>${escapeHtml(v.reasons.join('; ') || 'within limits')}</td>
      <td>${verdictText(v)}</td>
    </tr>`;
  }).join('');
  const thermalTable = thermalRows
    ? `<h4>Manual temperature / fan readings</h4>
       <table><thead><tr><th>Time</th><th>Zone</th><th>Temperature</th><th>Fan</th><th>Note</th><th>Why</th><th>Result</th></tr></thead><tbody>${thermalRows}</tbody></table>`
    : '';
  const powerTableRows = powerReadings.map(r => {
    const v = r.verdict || consolePowerVerdict(r, criteria);
    return `<tr>
      <td>${escapeHtml(new Date(r.at).toLocaleString())}</td>
      <td>${escapeHtml(r.port || 'USB port')}</td>
      <td>${escapeHtml(r.watts)} W</td>
      <td>${r.volts == null ? '—' : `${escapeHtml(r.volts)} V`}</td>
      <td>${r.amps == null ? '—' : `${escapeHtml(r.amps)} A`}</td>
      <td>${escapeHtml(r.note || '')}</td>
      <td>${escapeHtml(v ? v.reasons.join('; ') : 'no reading')}</td>
      <td>${verdictText(v)}</td>
    </tr>`;
  }).join('');
  const powerTable = powerTableRows
    ? `<h4>USB charge power meter readings</h4>
       <table><thead><tr><th>Time</th><th>Port</th><th>Power</th><th>Volts</th><th>Amps</th><th>Note</th><th>Why</th><th>Result</th></tr></thead><tbody>${powerTableRows}</tbody></table>`
    : '';
  return `<h3>${escapeHtml(title)}</h3>
    <p class="rpt-muted">Console telemetry is not exposed to a PC; values below are from PC-side observation or manual meter entry.</p>
    <table>${rows.join('')}</table>${thermalTable}${powerTable}`;
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

  const walkthroughHtml = ['android', 'controller', ...Object.keys(consoleProfiles)].map(cat => {
    const title = cat === 'android' ? 'Android phone'
      : cat === 'controller' ? 'Game controllers' : consoleProfiles[cat].label;
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

  const ps5 = data.ps5 || {};
  let ps5Html = '<p class="rpt-muted">No PS5 console checks were recorded in this session.</p>';
  const handoffEvents = (ps5.pairing && ps5.pairing.events) || [];
  const thermalReadings = ps5.thermal || [];
  const criteria = ps5.criteria || {};
  const verdictText = v => v && v.good ? 'GOOD' : v ? 'BAD' : 'UNKNOWN';
  if (ps5.charge || ps5.ping || handoffEvents.length || thermalReadings.length || Object.keys(criteria).length) {
    const rows = [];
    rows.push(reportDeviceRow('Pass criteria',
      `GOOD when temp ≤ ${criteria.maxTemp ?? '—'} °C` +
      `${criteria.minRpm ? ` and fan ≥ ${criteria.minRpm} RPM` : ' (no fan minimum)'}` +
      ` · ping ≤ ${criteria.maxPingMs ?? '—'} ms · loss ≤ ${criteria.maxLoss ?? '—'}%` +
      ` · charge gain ≥ +${criteria.minGain ?? '—'}%`));
    const charge = ps5.charge;
    if (charge && charge.before) {
      rows.push(reportDeviceRow('Battery before',
        `${charge.before.percent}% (${charge.before.precision || 'unknown'}), ${new Date(charge.before.at).toLocaleString()}`));
      rows.push(reportDeviceRow('Console port', charge.result ? charge.result.port : '—'));
    }
    if (charge && charge.result) {
      const r = charge.result;
      const v = ps5ChargeVerdict(r);
      rows.push(reportDeviceRow('Battery after', `${r.after.percent}% (${r.after.precision || 'unknown'})`));
      rows.push(reportDeviceRow('Charge gain',
        `${r.delta >= 0 ? '+' : ''}${r.delta}% in ${(r.elapsedMs / 60000).toFixed(1)} min` +
        ` (${r.rate == null ? '—' : r.rate.toFixed(1)} %/min) — ${verdictText(v)} (${v.reasons.join('; ')})`));
    }
    if (ps5.ping) {
      const v = ps5.ping.verdict || ps5PingVerdict(ps5.ping, criteria);
      rows.push(reportDeviceRow('LAN ping',
        `${ps5.ping.host}: ${ps5.ping.reachable ? 'reachable' : 'unreachable'}` +
        `, loss ${ps5.ping.lossPercent == null ? '—' : ps5.ping.lossPercent + '%'}` +
        `, avg ${ps5.ping.avgMs == null ? '—' : ps5.ping.avgMs + ' ms'}` +
        ` — ${verdictText(v)} (${v ? v.reasons.join('; ') : 'no verdict'})`));
    }
    if (handoffEvents.length) {
      rows.push(reportDeviceRow('Pairing handoff', handoffEvents.map(ev =>
        `${new Date(ev.at).toLocaleTimeString()} — ${ev.gone.join(', ')}`).join('; ')));
    }
    const thermalRows = thermalReadings.map(r => {
      const v = r.verdict || ps5ThermalVerdict(r, criteria);
      const used = r.criteria || {};
      return `<tr>
        <td>${escapeHtml(new Date(r.at).toLocaleString())}</td>
        <td>${escapeHtml(r.zone)}</td>
        <td>${escapeHtml(r.tempC)} °C (limit ${escapeHtml(used.maxTemp ?? r.limit)})</td>
        <td>${r.rpm == null ? '—' : `${escapeHtml(r.rpm)} RPM (min ${escapeHtml(used.minRpm ?? r.minRpm ?? 0)})`}</td>
        <td>${escapeHtml(r.note || '')}</td>
        <td>${escapeHtml(v.reasons.join('; ') || 'within limits')}</td>
        <td>${verdictText(v)}</td>
      </tr>`;
    }).join('');
    const thermalTable = thermalRows
      ? `<h3>Manual temperature / fan readings</h3>
         <table><thead><tr><th>Time</th><th>Zone</th><th>Temperature</th><th>Fan</th><th>Note</th><th>Why</th><th>Result</th></tr></thead><tbody>${thermalRows}</tbody></table>`
      : '';
    ps5Html = `<p class="rpt-muted">A retail PS5 does not expose internal telemetry; values below are from PC-side observation or manual entry.</p>
      <table>${rows.join('') || '<tr><td class="rpt-muted">No measurable results.</td></tr>'}</table>${thermalTable}`;
  }

  const consoleSections = Object.entries(data.consoles || {}).map(([id, state]) =>
    buildConsoleReportHtml(id, state, (state && state.label) || consoleProfiles[id]?.label || id));
  const consoleHtml = consoleSections.filter(Boolean).join('')
    ? `<h2>Nintendo Switch consoles</h2>${consoleSections.filter(Boolean).join('')}`
    : '<h2>Nintendo Switch consoles</h2><p class="rpt-muted">No Switch console checks were recorded in this session.</p>';

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

  <h2>PS5 console check</h2>
  ${ps5Html}

  ${consoleHtml}

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
buildConsolePanels();
ps5LoadCriteriaInputs();
applyConsoleProfile();
renderWalkthrough();
renderPs5();
Object.keys(CONSOLE_CHECK_META).forEach(renderConsoleCheck);
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
