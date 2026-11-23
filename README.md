# Pawd — PC Device Test App

**Version:** `001.000.000.2026` (Major.Minor.Sub.Year) · **Repository:** https://github.com/Gyakudos/Pawd

A local PC application for detecting plugged-in devices and running guided test walkthroughs.
The current release covers **Android phones** (with a companion on-phone self-test app installed over ADB)
and **game controllers / joysticks**, plus built-in session recording and shareable test reports.

## Features

- Enumerates present Plug and Play / USB-related devices on Windows through the in-process SetupAPI (`pnp.py`) — no per-request PowerShell processes. PowerShell is only a fallback if SetupAPI is unavailable.
- Highlights likely **Android** candidates and **game controller** candidates (Xbox, PlayStation, Nintendo, generic HID, wheels, flight sticks) based on device class/name/VID/PID.
- Tabbed interface: **Android phone** walkthrough and **Game controllers** walkthrough, with step progress saved in the browser.
- **Tri-state step results**: every walkthrough step can be marked **Pass**, **Fail**, or **Skip** (or left not tested), with progress and summary counts reflecting all states.
- Shows ADB availability and connected ADB devices (PATH or local install).
- **Install ADB (Platform Tools)** button to download/extract Android Platform Tools locally into `tools/platform-tools` (Windows).
- Step-by-step **Android phone test walkthrough** with progress tracking, including:
  - Connection, USB mode, PC detection, trust/authorization
  - Optional ADB communication check
  - Launch of the on-device self-test suite
  - File access (MTP) check
  - Touchscreen and biometric checks
  - Charging and reconnect consistency checks
- **On-phone self test app** (`com.pawd.selftest`) that covers:
  - Touchscreen and multitouch (grid coverage, pointer IDs, max simultaneous touches)
  - Display (full-screen solid colors + gradient for dead pixels/tint)
  - Speaker and microphone (routed left/right/earpiece tones, live mic meter, record + playback)
  - Camera and torch (front/back preview, photo capture, flashlight toggle)
  - Biometrics (real system `BiometricPrompt` / fingerprint authentication)
  - Sensors and battery (accelerometer, gyroscope, magnetometer, light, proximity, pressure, battery telemetry)
  - Vibration motor (short, long, patterned haptics)
  - Buttons and keys (volume, camera/shutter, headset hook detection)
  - GPS and location (live fix, provider, accuracy, GNSS satellite usage)
  - System info and connectivity (device, display, memory, storage, battery, network, cameras, USB, feature support)
- **Install & launch on phone** button: installs the bundled APK (`-r -g`), wakes the phone, dismisses the keyguard, keeps the screen on, and opens the test dashboard.
- **Auto-launch on connect** toggle: a background watcher polls ADB every 6 seconds and prepares/launches the phone as soon as an authorized device appears. The setting persists in `pawd-config.json`.
- **Controller auto-open** toggle: a watcher polls PnP every 5 seconds and switches to the controller walkthrough when a new controller appears.
- **Live controller input panel**: reads XInput/DirectInput state directly through `ctypes` (`controller.py` / `dinput.py`) at ~10 Hz and visualizes every button, both analog sticks, triggers, D-pad, and battery level on an on-screen gamepad. The stick position view polls at ~20 Hz. Player index 1-4 can be selected.
- **Live controller view**: a full-size gamepad view in the **Live controller** tab (or via **Go to live controller view**) with button glyphs that switch to match the detected controller family (PlayStation, Nintendo, or Xbox), plus exact stick positions and a drift check directly underneath. Shows detected devices, active input source, observed inputs, raw stick/trigger movement, and battery level.
- **Demo mode**: a synthetic controller cycles all buttons, sticks, and triggers so the walkthrough and visualization can be exercised without physical hardware.
- **Rumble / haptics test**: pulses left/right XInput motors with adjustable intensity and duration, plus presets (strong, light, left-only, right-only). Simulated in demo mode.
- **Auto-completing walkthrough**: observing all face buttons + bumpers, stick movement, and trigger/D-pad input checks off the corresponding controller walkthrough steps and adds recording markers.
- **Session recording** panel: records the Pawd window/tab or a webcam as WebM video using browser `MediaRecorder`, stores files next to the app in `recordings/`, and saves walkthrough step completions as timeline markers in a JSON sidecar.
- **Test reports** panel: generates a self-contained HTML report with pass/fail/skip results, device details, observations, session notes, and links to recordings. Open a report and use the browser's **Print → Save as PDF** to export a PDF. Reports are stored next to the app in `reports/`.

## Requirements

- Windows PC
- Python 3.11+ (uses standard library only)
- **No browser required** — the native app embeds WebView2 (runtime is already present on Windows 11 and most Windows 10 installs). A Chromium-based default browser is only used as a fallback if the embedded webview cannot start.
- Internet access for the in-app ADB installer (downloads from Google)

Optional for deeper Android checks:
- USB debugging enabled on the Android device (for ADB and the on-phone app)

## Run

For the native desktop window (starts the server and opens a chromeless app window):

```powershell
python desktop.py
```

For the browser-only version:

```powershell
python server.py
```

Then open:

- http://127.0.0.1:8765 (source server) or http://127.0.0.1:8766 (packaged desktop app)

To use a different port:

```powershell
$env:PORT=9000; python server.py
$env:PORT=9000; python desktop.py
```

The native launcher hosts the UI in a single embedded WebView2 window (via the vendored
`pywebview`/`pythonnet` packages in `vendor\`) — it does **not** depend on Opera, Chrome,
or Edge being your default browser. Use the **Test app** and **Live controller** tabs at the top;
the stick position gauges and drift check sit directly below the gamepad in the Live controller
tab. Closing the Pawd window shuts the local server down.

If the embedded webview is unavailable, Pawd falls back to the system default browser:
Chrome, Edge, Brave, and Vivaldi use Chromium `--app=` mode; Opera/Opera GX ignores
`--app=URL`, so the space-separated `--app URL` form is used instead. Non-Chromium
defaults open in a regular browser window.

The launcher logs to `pawd.log` and keeps its isolated browser profile in
`pawd-webview-profile\`, both next to the executable. Use
`python desktop.py --server-only` to run just the server.

## Build the desktop app

```powershell
$env:PYTHONPATH = 'F:\Pawd\vendor'
python -m PyInstaller --noconfirm --clean --onefile --noconsole --name pawd `
  --icon "pawd.ico" --add-data "static;static" --add-data "pawd.ico;." `
  --add-data "vendor;vendor" `
  --hidden-import controller --hidden-import dinput --hidden-import pnp `
  --hidden-import __future__ --hidden-import webview `
  --hidden-import webview.platforms.winforms --hidden-import clr `
  --hidden-import clr_loader --hidden-import bottle --hidden-import proxy_tools `
  --hidden-import cffi desktop.py
```

`PYTHONPATH` must point at `vendor` during the build so PyInstaller's analysis can find
the bundled webview/runtime packages; without it the build logs missing hidden imports
and the resulting `pawd.exe` fails at startup with `No module named '__future__'`.

The result is `dist\pawd.exe` with the Pawd icon. Double-clicking it opens the native app
window. The bundled UI and APK are unpacked to a temp folder at runtime;
`pawd-config.json`, `pawd-controller-maps.json`, `pawd.log`, `pawd-webview-profile\`,
`tools\platform-tools`, `recordings\`, and `reports\` are stored next to the executable.

## Session recording

Use the **Session recording** panel to:

1. Choose **Screen / window / tab** (the browser will ask which surface to share) or **Webcam**.
2. Click **Start recording** and run through the walkthrough. Checking a step adds a timestamped marker.
3. Click **Stop & save**. The WebM file is uploaded to the local server and appears in the recording list with playback.

Recordings are stored in `dist\recordings\pawd-<category>-<timestamp>.webm` with a matching `.json`
metadata file containing duration, markers, completed steps, and selected device.
Screen capture requires a secure origin; `http://127.0.0.1` is treated as secure by browsers.
A GIF encoder is not bundled; WebM is the native recording format.

## Live controller input

Open the **Game controllers** tab to see the live gamepad panel. Pawd supports two input sources:

- **XInput** — Xbox pads and many generic "Xbox-compatible" gamepads.
- **DirectInput** — non-XInput devices such as PlayStation/DualSense pads, Nintendo Switch pads,
  generic HID gamepads, wheels, flight sticks, and joysticks. Uses `dinput8.dll` on Windows.

- **Player** selector chooses XInput slot 1-4 (or a DirectInput device index).
- **Input source** selector: **Auto** tries XInput first and falls back to DirectInput. You can also force **XInput**, **DirectInput**, or **Demo**.
- **Demo mode** switch turns on a synthetic controller that cycles every button and continuously moves sticks/triggers. Use it to verify the UI and auto-completion without hardware.
- The on-screen gamepad lights up for pressed buttons, moves the stick dots, fills trigger bars, and shows packet/battery info. The **Live input** label shows which source is active.
- The DirectInput device list under the controller status shows each enumerated joystick with a **rescan** link. Devices are also re-enumerated automatically every 5 seconds, so unplug/replug works.
- **Button mapping (DirectInput devices)** — expand this panel to remap any logical button to a raw button index (0-31), choose which raw axis feeds each stick/trigger, and invert axes. Click **Learn** and then press the physical control to capture it automatically. Mappings are saved per device GUID in `pawd-controller-maps.json`; **Reset to default** removes them. The live state also exposes `rawButtons` and `rawAllAxes` for troubleshooting.
- The **Observed inputs** line accumulates every input seen during the session; reaching full coverage checks off the walkthrough's buttons/sticks/triggers steps automatically.
- **Rumble** pulses the motors via XInput; **Stop rumble** forces them off. Rumble is not available for DirectInput-only devices (force-feedback is not implemented) — switch to XInput or use demo mode to exercise it. In demo mode the pulse is reported as simulated.
- **Battery test (LiPo controllers)** samples the battery over time in three modes: **Charge check** (level must rise), **Discharge check** (level must fall), and **Runtime benchmark** (level must fall, then estimates total runtime from the drop). Choose the same Player/Source as the live input panel, a duration in minutes, and a sample interval. The result and every sample are included in the generated report, and a passing result checks off the walkthrough's battery step.

Live input is polled only while the Game controllers tab is open, at 200 ms intervals, so it does not
add background load during Android testing. DirectInput is polled on its own daemon thread; if the
DLL is missing or initialization fails, Pawd continues with XInput and PnP detection only.

## Live controller and stick views

Both views live inside the single Pawd window. Open the **Live controller** tab at the top, or
use **Go to live controller view** / **Go to stick position view** in the Game controllers tab;
the latter scrolls straight down to the stick gauges. Switching back to **Test app** unloads both
views so they stop polling in the background.

The **Live controller** view (`controller-display.html`) shows a large Xbox-style gamepad that
mirrors the selected controller in real time. Immediately below it, the **Stick position** view
(`stick-view.html`) shows two large gauges with exact X/Y values (-1.00 to +1.00) for the left and
right analog sticks. It also has a drift check: **Set current position as center** stores a
reference, and **Start 10s drift check** measures the largest deviation while you leave the sticks
untouched (> 0.04 is flagged as drift). This is useful for verifying pads with suspected stick drift.

- Choose **Source** (Auto / XInput / DirectInput / Demo) and **Player** independently of the Test app view.
- Detected controllers are listed with family and VID/PID; buttons light up, sticks move, and trigger bars fill as input arrives.
- The readout accumulates every button seen and notes stick/trigger movement and battery level, which is useful when diagnosing pads that are connected but not sending input.

Some pads (for example the MSI GC300) can present in multiple modes: wired USB, a 2.4 GHz USB
adapter, or Bluetooth. Windows may enumerate the device but report a frozen/empty XInput state if
the pad is in the wrong mode, asleep, or not paired. Try wired mode first for confirmation, then
switch to the adapter/Bluetooth and re-pair as needed. Use **Rescan** in the DirectInput device list
after changing modes or ports. The GC300 reports a lithium battery; Pawd shows only its charge
percentage, with no battery-chemistry label. Its battery is read through XInput, which exposes only
four coarse levels (empty/low/medium/full), so charge/discharge tests on the GC300 need a longer
sample window to see a change.

## PlayStation DualSense

Pawd applies a DualSense default mapping by device name (USB or Bluetooth), so it survives changes
to the DirectInput instance GUID:

- Face buttons: □ → `x`, ✕ → `a`, ○ → `b`, △ → `y` (the on-screen PlayStation glyphs match the physical layout).
- Shoulders `lb`/`rb`, Share/Options `back`/`start`, stick clicks `ls`/`rs`.
- **PS** → `guide`, **touchpad click** → `touchpad`, **built-in mic button** → `mic`. All three are visible in both the Test app and Live controller views.
- Left stick `lX`/`lY` (Y inverted), right stick `lZ`/`lRz` (Y inverted), LT `lRx`, RT `lRy`.

The stick gauges and 10-second drift check work from the raw axes, so they also cover the DualSense's
slightly off-center at-rest values. A saved mapping in `pawd-controller-maps.json` overrides the
default; use **Reset to default** if you want to restore it.

When the DualSense is connected, Pawd reads a precise battery percentage and charging state directly
from its HID input report (`battery_hid.py`, read-only GET_REPORT/GET_FEATURE). USB reports 0x01 and
Bluetooth reports 0x31 are both supported. This is the source used by the battery test panel; no
chemistry label is shown.

For wireless use, Windows must complete Bluetooth pairing and install the HID gamepad service before
Pawd can read input. If Windows shows the controller as connected but no gamepad appears, remove the
pairing and pair it again. The built-in MediaTek adapter on the test machine failed DualSense mutual
authentication, so an experimental test-signed driver for the Broadcom `VID_19FF&PID_0239` dongle was
prepared; see `drivers/README-test-driver.md`. That experiment requires Windows Test Mode and is
documented separately — it is not part of the normal install.

## Test reports

Open the **Test reports** panel to:

1. Optionally enter a tester name and session notes.
2. Mark walkthrough steps **Pass** / **Fail** / **Skip** using the buttons on each step (the checkbox is a shortcut for Pass).
3. Click **Generate report**. Pawd captures the current device state, both walkthroughs, observed controller inputs, and the recording list.
4. Click **View** on a report, then use **Print → Save as PDF** in the browser to produce a PDF. **Download** saves the standalone HTML file.

Reports are stored in `dist\reports\pawd-report-<timestamp>.html` with a `.json` sidecar summary.
The generated HTML is fully self-contained (inline CSS, no external scripts or fonts). Recording links
point back to the running Pawd server, so keep it running when viewing a report with video links.

## Build the on-phone test app

The phone app has no Gradle dependency and builds directly with the Android SDK build tools
(`aapt2`, `javac`, `d8`, `zipalign`, `apksigner`).

```powershell
powershell -NoProfile -ExecutionPolicy Bypass -File "phone-app\build.ps1"
```

Defaults:
- SDK: `F:\dev\android-sdk` (override with `-Sdk`)
- Output: `static\pawd-selftest.apk` (override with `-Out`)
- Debug keystore: `phone-app\debug.keystore` (created on first build)

## How it works

- `server.py` serves the frontend from `static/` and exposes:
  - `GET /api/version` — application version (`001.000.000.2026`)
  - `GET /api/devices` — PnP/USB device list plus ADB status
  - `POST /api/adb/install` — download and extract Android Platform Tools locally
  - `GET /api/phone/status` — ADB state, connected serial, whether the phone app is installed/running, APK availability
  - `POST /api/phone/start` — install + launch the phone self-test app
  - `POST /api/phone/stop` — force-stop the phone self-test app
  - `GET /api/phone/auto` — current auto-launch state and last auto-launch result
  - `POST /api/phone/auto` — enable/disable auto-launch (`{"enabled": true}`); persists to `pawd-config.json`
  - `GET /api/controllers` — detected game controllers with family (Xbox/PlayStation/Nintendo/generic/specialty), VID/PID, and auto-open state
  - `GET /api/controllers/auto`, `POST /api/controllers/auto` — controller auto-open state (persisted)
  - `GET /api/controllers/state?index=N&source=auto|xinput|dinput|demo` — live input snapshot with buttons, axes, triggers, and battery. `auto` tries XInput then DirectInput; the response `source` field reports which was used.
  - `GET /api/controllers/dinput` — DirectInput availability, error, and enumerated joystick devices
  - `POST /api/controllers/dinput/refresh` — force a DirectInput device rescan
  - `GET /api/controllers/mappings` — saved per-device mappings plus factory defaults
  - `POST /api/controllers/mappings` — save a mapping (`{"guid":"...","buttons":{...},"axes":{...},"triggers":{...}}`)
  - `POST /api/controllers/mappings/reset` — remove a saved mapping (`{"guid":"..."}`)
  - `POST /api/controllers/demo` — enable/disable synthetic demo input (`{"enabled": true}`); persisted to `pawd-config.json`
  - `POST /api/controllers/rumble` — pulse motors (`{"index":0,"left":0.6,"right":0.6,"durationMs":400}`)
  - `GET /api/controllers/battery` — current battery test session, samples, and result
  - `POST /api/controllers/battery/sample` — take one reading (`{"index":0,"source":"auto","record":false}`)
  - `POST /api/controllers/battery/start` — start a test (`{"index":0,"source":"auto","mode":"charge|discharge|benchmark","durationMs":900000,"intervalMs":5000}`)
  - `POST /api/controllers/battery/stop`, `POST /api/controllers/battery/reset` — stop or clear a session
- `GET /api/recordings` — list saved recordings and metadata
  - `GET /api/recordings/file?name=...` — stream a saved WebM
  - `POST /api/recordings/save?name=...&meta=...` — upload a recording with base64url JSON metadata
  - `POST /api/recordings/delete` — delete a recording by name
  - `GET /api/reports` — list saved reports and summary metadata
  - `GET /api/reports/file?name=...` — serve a self-contained HTML report
  - `POST /api/reports/save?name=...&meta=...` — upload a report with base64url JSON metadata
  - `POST /api/reports/delete` — delete a report by name
- Device discovery uses the in-process SetupAPI helper (`pnp.py`), with PowerShell only as a fallback; ADB lookup uses `adb devices -l` when available.
- The UI lists detected devices, guides you through Android or controller checks, and drives the phone app.
- `controller.py` wraps XInput via `ctypes` (`xinput1_4.dll` / `xinput1_3.dll` / `xinput9_1_0.dll`) and provides `read_state()`, `rumble()`, `connected_indices()`, and `demo_state()`. It is imported by `server.py`, so PyInstaller bundles it automatically.
- Step results are stored in browser `localStorage` as `pass` / `fail` / `skip`; older boolean values are migrated to `pass` on load. Reports are assembled entirely in the browser as self-contained HTML, then uploaded to the local server.

## Notes

- Detection is heuristic; some phones may appear as generic USB/WPD devices depending on mode and drivers.
- Controller detection uses PnP names/VIDs and excludes system/bus HID entries, but generic HID game controllers may still be misidentified. Confirm with the walkthrough.
- Live input supports XInput and DirectInput devices. XInput pads also support rumble; DirectInput devices are mapped per-device via the mapping panel (auto or Learn), so PlayStation/Switch pads, wheels, flight sticks, and joysticks can appear in the live panel. Set the input source to `auto`, `xinput`, `dinput`, or `demo`.
- `POST /api/phone/start` grants runtime permissions at install time (`adb install -g`), so camera, microphone, and location prompts are pre-approved for the test app.
- The APK is signed with a local debug key, so Android may warn about installing from an unknown source; enable "Install unknown apps" for the ADB/USB installer if prompted.
- Auto-launch retries a failed attempt every 30 seconds while a device stays connected.
- The ADB installer places tools in `tools/platform-tools` within this app folder; it does not permanently modify system PATH.
- This is a local diagnostic helper, not a replacement for OEM/manufacturer test suites.
