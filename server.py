import base64
import json
import os
import re
import shutil
import subprocess
import sys
import threading
import time
import zipfile
from http.server import SimpleHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from urllib.parse import parse_qs, urlparse
from urllib.request import urlretrieve

try:
    import controller as controller_api
except Exception as _controller_import_error:  # pragma: no cover - defensive
    controller_api = None
    print(f"[controller] module unavailable: {_controller_import_error}")

try:
    import dinput as dinput_api
except Exception as _dinput_import_error:  # pragma: no cover - defensive
    dinput_api = None
    print(f"[dinput] module unavailable: {_dinput_import_error}")

try:
    import pnp as pnp_api
except Exception as _pnp_import_error:  # pragma: no cover - defensive
    pnp_api = None
    print(f"[pnp] module unavailable: {_pnp_import_error}")

try:
    import battery as battery_api
except Exception as _battery_import_error:  # pragma: no cover - defensive
    battery_api = None
    print(f"[battery] module unavailable: {_battery_import_error}")

def get_base_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(getattr(sys, "_MEIPASS", Path(sys.executable).resolve().parent))
    return Path(__file__).resolve().parent


def get_runtime_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent


BASE_DIR = get_base_dir()
RUNTIME_DIR = get_runtime_dir()
STATIC_DIR = BASE_DIR / "static"
TOOLS_DIR = RUNTIME_DIR / "tools"
PLATFORM_TOOLS_DIR = TOOLS_DIR / "platform-tools"
LOCAL_ADB = PLATFORM_TOOLS_DIR / ("adb.exe" if os.name == "nt" else "adb")
ADB_ZIP_URL = "https://dl.google.com/android/repository/platform-tools-latest-windows.zip"

APP_VERSION = "001.002.001.2026"  # Major.Minor.Sub.Year
PHONE_PACKAGE = "com.pawd.selftest"
PHONE_ACTIVITY = f"{PHONE_PACKAGE}/.MainActivity"
PHONE_APK = STATIC_DIR / "pawd-selftest.apk"
CONFIG_PATH = RUNTIME_DIR / "pawd-config.json"
CONTROLLER_MAPPINGS_PATH = RUNTIME_DIR / "pawd-controller-maps.json"
RECORDINGS_DIR = RUNTIME_DIR / "recordings"
REPORTS_DIR = RUNTIME_DIR / "reports"
PHONE_LOCK = threading.Lock()
STATE = {
    "auto_launch": False,
    "last_serial": None,
    "launching": False,
    "last_result": None,
    "controller_auto_launch": False,
    "controller_seen": set(),
    "controller_last_result": None,
    "controller_demo": False,
    "controller_display_auto_open": True,
    "stick_view_auto_open": True,
}

CONTROLLER_TERMS = (
    "xbox", "dualsense", "dualshock", "playstation", "ps4", "ps5",
    "switch pro", "joy-con", "joycon", "nintendo", "gamepad", "game pad",
    "joystick", "flight stick", "racing wheel", "steering wheel",
    "game controller", "wireless controller", "hid-compliant game",
    "powered a rechargeable", "powera", "power a",
)
CONTROLLER_EXCLUDE = (
    "system controller", "host controller", "bus", "virtual", "synthetic",
    "root hub", "remote control", "device controller",
)
CONTROLLER_CLASSES = ("HIDClass", "Xbox", "GameController")


def load_config() -> dict:
    try:
        return json.loads(CONFIG_PATH.read_text(encoding="utf-8"))
    except Exception:
        return {}


def save_config(cfg: dict) -> None:
    try:
        CONFIG_PATH.write_text(json.dumps(cfg, indent=2), encoding="utf-8")
    except Exception:
        pass


def _di_constant(name: str, fallback):
    return getattr(dinput_api, name, fallback) if dinput_api else fallback


def load_controller_mappings() -> dict:
    try:
        data = json.loads(CONTROLLER_MAPPINGS_PATH.read_text(encoding="utf-8"))
        if isinstance(data, dict):
            return {str(k): v for k, v in data.items() if isinstance(v, dict)}
    except Exception:
        pass
    return {}


def save_controller_mappings(mappings: dict) -> None:
    try:
        CONTROLLER_MAPPINGS_PATH.write_text(
            json.dumps(mappings, indent=2), encoding="utf-8")
    except Exception:
        pass


def apply_controller_mappings() -> dict:
    mappings = load_controller_mappings()
    if dinput_api:
        dinput_api.set_mappings(mappings)
        dinput_api.reset_calibration()
    return mappings


def normalize_controller_mapping(body: dict) -> dict:
    """Validate and trim a posted mapping so bad values cannot break polling."""
    guid = str(body.get("guid") or "").strip()
    if not guid:
        raise ValueError("A device GUID is required")
    result = {
        "guid": guid,
        "name": str(body.get("name") or ""),
        "buttons": {},
        "axes": {},
        "triggers": {},
    }
    button_names = _di_constant("LOGICAL_BUTTONS", (
        "a", "b", "x", "y", "lb", "rb", "back", "start", "ls", "rs",
        "up", "down", "left", "right", "guide", "touchpad", "mic",
    ))
    posted_buttons = body.get("buttons") or {}
    for name in button_names:
        if name not in posted_buttons:
            continue
        raw = posted_buttons.get(name)
        if raw is None or raw == "":
            result["buttons"][name] = None  # explicitly unmapped
            continue
        try:
            bit = int(raw)
        except (TypeError, ValueError):
            continue
        if 0 <= bit < 32:
            result["buttons"][name] = bit

    axis_sources = _di_constant("AXIS_SOURCES", (
        "lX", "lY", "lZ", "lRx", "lRy", "lRz", "rglSlider0", "rglSlider1",
    ))
    for group, keys in (
        ("axes", _di_constant("AXIS_KEYS", ("lx", "ly", "rx", "ry"))),
        ("triggers", _di_constant("TRIGGER_KEYS", ("lt", "rt"))),
    ):
        for key in keys:
            cfg = (body.get(group) or {}).get(key) or {}
            if not isinstance(cfg, dict):
                continue
            source = str(cfg.get("source") or "")
            if source in axis_sources:
                result[group][key] = {
                    "source": source,
                    "invert": bool(cfg.get("invert")),
                }
    return result


def set_controller_display_auto_open(enabled: bool) -> dict:
    STATE["controller_display_auto_open"] = bool(enabled)
    cfg = load_config()
    cfg["controller_display_auto_open"] = STATE["controller_display_auto_open"]
    save_config(cfg)
    return {"enabled": STATE["controller_display_auto_open"]}


def set_stick_view_auto_open(enabled: bool) -> dict:
    STATE["stick_view_auto_open"] = bool(enabled)
    cfg = load_config()
    cfg["stick_view_auto_open"] = STATE["stick_view_auto_open"]
    save_config(cfg)
    return {"enabled": STATE["stick_view_auto_open"]}


def set_auto_launch(enabled: bool) -> dict:
    STATE["auto_launch"] = bool(enabled)
    STATE["last_serial"] = None
    cfg = load_config()
    cfg["auto_launch"] = STATE["auto_launch"]
    save_config(cfg)
    return {"enabled": STATE["auto_launch"]}


def set_controller_auto_launch(enabled: bool) -> dict:
    STATE["controller_auto_launch"] = bool(enabled)
    STATE["controller_seen"] = set()
    STATE["controller_last_result"] = None
    cfg = load_config()
    cfg["controller_auto_launch"] = STATE["controller_auto_launch"]
    save_config(cfg)
    return {"enabled": STATE["controller_auto_launch"]}


def set_controller_demo(enabled: bool) -> dict:
    STATE["controller_demo"] = bool(enabled)
    cfg = load_config()
    cfg["controller_demo"] = STATE["controller_demo"]
    save_config(cfg)
    return {"enabled": STATE["controller_demo"]}


def dinput_status() -> dict:
    if not dinput_api:
        return {"available": False, "error": "dinput module unavailable",
                "devices": [], "deviceCount": 0}
    return dinput_api.get_manager().status()


def controller_live_state(index: int, source: str = "auto") -> dict:
    """Return a live input snapshot for a player index.

    source: auto (XInput first, then DirectInput), xinput, dinput, or demo.
    """
    demo = bool(STATE["controller_demo"])
    available = bool(controller_api and controller_api.available())
    di = dinput_status()
    base = {
        "index": index,
        "xinputAvailable": available,
        "dinputAvailable": bool(di.get("available")),
        "dinputDeviceCount": di.get("deviceCount", 0),
    }
    if demo:
        state = controller_api.demo_state(index) if controller_api else None
        return {**base, "available": True, "source": "demo", "demoMode": True, "state": state}

    if source == "demo":
        state = controller_api.demo_state(index) if controller_api else None
        return {**base, "available": bool(state), "source": "demo" if state else None,
                "demoMode": True, "state": state}

    if source in ("auto", "xinput"):
        state = controller_api.read_state(index) if controller_api else None
        if state is not None:
            return {**base, "available": True, "source": "xinput", "state": state}

    if source in ("auto", "dinput") and di.get("available"):
        state = dinput_api.read_state(index) if dinput_api else None
        if state is not None:
            if state.get("deviceName"):
                state = dict(state)
                state["deviceName"] = display_name({"name": state["deviceName"]})
            return {**base, "available": True, "source": "dinput", "state": state}

    return {
        **base,
        "available": False,
        "source": None,
        "xinputError": (controller_api.error_message()
                        if controller_api and not available else None),
        "dinputError": di.get("error"),
        "state": None,
    }


def battery_status() -> dict:
    """Return the current guided battery-test session."""
    if not battery_api:
        return {
            "running": False, "mode": None, "samples": [], "result": None,
            "error": "battery module unavailable",
        }
    return battery_api.SESSION.status()


def battery_read(index: int, source: str, record: bool = False) -> dict:
    """Take one reading, optionally appending it to the active session."""
    if not battery_api:
        return {"error": "battery module unavailable", "available": False}
    reading = battery_api.sample(index, source)
    if record:
        return battery_api.SESSION.record_manual(reading)
    return reading


def ps5_ping(host: str) -> dict:
    """Best-effort LAN reachability check for a PS5 console.

    Pawd cannot interrogate a retail PS5 directly; this only verifies that the
    console answers ICMP echo requests on the local network.
    """
    host = str(host or "").strip()
    if not re.fullmatch(r"[A-Za-z0-9._-]{1,253}", host) or host.startswith("-"):
        return {"ok": False, "error": "Enter a valid hostname or IP address"}
    count_flag, timeout_flag, timeout = (
        ("-n", "-w", "1000") if os.name == "nt" else ("-c", "-W", "1"))
    try:
        proc = subprocess.run(
            ["ping", count_flag, "2", timeout_flag, timeout, host],
            capture_output=True, text=True, timeout=8)
        output = ((proc.stdout or "") + (proc.stderr or ""))[-2000:]
        loss = None
        match = re.search(r"\((\d+)%\s*loss\)|(\d+)%\s*packet\s+loss", output, re.I)
        if match:
            loss = int(match.group(1) or match.group(2))
        times = [float(v) for v in re.findall(
            r"time[<>=:]\s*([\d.]+)\s*ms", output, re.I) if v]
        avg = round(sum(times) / len(times), 1) if times else None
        return {
            "ok": True,
            "host": host,
            "reachable": proc.returncode == 0,
            "lossPercent": loss,
            "avgMs": avg,
            "output": output,
        }
    except Exception as e:
        return {"ok": False, "error": str(e)}


def _battery_request_values(body: dict) -> tuple[int, str, str, int, int]:
    try:
        index = max(0, min(3, int(body.get("index", 0))))
    except (TypeError, ValueError):
        index = 0
    source = (body.get("source") or "auto").lower()
    if source not in ("auto", "xinput", "dinput", "demo"):
        source = "auto"
    mode = (body.get("mode") or "discharge").lower()
    if mode not in (battery_api.MODES if battery_api else ("charge", "discharge", "benchmark")):
        mode = "discharge"
    try:
        duration_ms = max(0, min(24 * 60 * 60 * 1000, int(body.get("durationMs", 0))))
    except (TypeError, ValueError):
        duration_ms = 0
    try:
        interval_ms = max(1000, min(60000, int(body.get("intervalMs", 5000))))
    except (TypeError, ValueError):
        interval_ms = 5000
    return index, source, mode, duration_ms, interval_ms


def run_powershell(script: str, timeout: int = 15) -> tuple[int, str, str]:
    try:
        proc = subprocess.run(
            ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass", "-Command", script],
            capture_output=True,
            text=True,
            timeout=timeout,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0),
        )
        return proc.returncode, proc.stdout, proc.stderr
    except Exception as e:
        return 1, "", str(e)


_PNP_CACHE = {"data": None, "at": 0.0}
_PNP_LOCK = threading.Lock()
PNP_TTL = 3.0


def _pnp_devices_powershell() -> list[dict]:
    script = r'''
$classes = @('USB','WPD','Image','AndroidUsbDeviceClass','HIDClass','Xbox','GameController','MEDIA','Camera','Ports')
$devices = foreach ($c in $classes) {
  try { Get-PnpDevice -PresentOnly -Class $c -ErrorAction SilentlyContinue } catch {}
}
$devices = $devices | Where-Object { $_ } | Sort-Object InstanceId -Unique |
  Select-Object Status,Class,FriendlyName,InstanceId,Manufacturer
$devices | ConvertTo-Json -Depth 3
'''
    code, out, err = run_powershell(script, timeout=20)
    if code != 0 or not out.strip():
        return []
    try:
        data = json.loads(out)
    except Exception:
        return []
    if isinstance(data, dict):
        data = [data]
    return [{
        "status": d.get("Status"),
        "class": d.get("Class"),
        "name": d.get("FriendlyName") or "Unknown device",
        "instanceId": d.get("InstanceId"),
        "manufacturer": d.get("Manufacturer"),
    } for d in data if d]


def get_pnp_devices() -> list[dict]:
    """Enumerate devices from SetupAPI with a short shared cache.

    PowerShell is only a fallback now, so routine polling spawns no processes.
    """
    with _PNP_LOCK:
        cached = _PNP_CACHE["data"]
        if cached is not None and time.monotonic() - _PNP_CACHE["at"] < PNP_TTL:
            return list(cached)
        result = []
        if pnp_api:
            try:
                result = pnp_api.enumerate_devices()
            except Exception as e:
                print(f"[pnp] SetupAPI scan failed: {e}")
        if not result:
            result = _pnp_devices_powershell()
        _PNP_CACHE["data"] = result
        _PNP_CACHE["at"] = time.monotonic()
        return list(result)


def device_ids(dev: dict) -> tuple[str | None, str | None]:
    instance = str(dev.get("instanceId") or "")
    vid = re.search(r"vid_([0-9a-f]{4})", instance, re.I)
    pid = re.search(r"pid_([0-9a-f]{4})", instance, re.I)
    return (vid.group(1).upper() if vid else None,
            pid.group(1).upper() if pid else None)


# Friendly names shown in Pawd for devices whose Windows name is generic or
# unhelpful. Keyed by (VID, PID) so it is stable across reconnections.
DISPLAY_NAMES = {
    ("20D6", "0002"): "Powered A Rechargeable",
}


def display_name(dev: dict) -> str:
    vid, pid = device_ids(dev)
    override = DISPLAY_NAMES.get((vid, pid))
    if override:
        return override
    text = " ".join([str(dev.get("name") or ""), str(dev.get("instanceId") or "")]).lower()
    if "nsw enhanced wireless" in text or "powera" in text or "power a" in text:
        return "Powered A Rechargeable"
    return str(dev.get("name") or "Unknown device")


def controller_family(dev: dict) -> str:
    vid, _ = device_ids(dev)
    text = " ".join([
        str(dev.get("name") or ""),
        str(dev.get("manufacturer") or ""),
        str(dev.get("instanceId") or ""),
    ]).lower()
    if vid == "045E" or "xbox" in text:
        return "xbox"
    if vid == "054C" or any(t in text for t in ("dualsense", "dualshock", "playstation", "ps4", "ps5")):
        return "playstation"
    if (vid == "057E" or vid == "20D6" or
            any(t in text for t in ("nintendo", "switch pro", "joy-con", "joycon",
                                    "powera", "power a", "powered a rechargeable"))):
        return "nintendo"
    if any(t in text for t in ("racing wheel", "steering wheel", "flight stick")):
        return "specialty"
    return "generic"


def classify_device(dev: dict) -> str:
    text = " ".join([
        str(dev.get("name") or ""),
        str(dev.get("class") or ""),
        str(dev.get("instanceId") or ""),
        str(dev.get("manufacturer") or ""),
    ]).lower()
    if (dev.get("class") in CONTROLLER_CLASSES
            and any(t in text for t in CONTROLLER_TERMS)
            and not any(t in text for t in CONTROLLER_EXCLUDE)):
        return "controller"
    if "android" in text or "adb" in text or "mtp" in text or re.search(r"vid_18d1", text):
        return "android"
    if "phone" in text or "mobile" in text:
        return "phone"
    if dev.get("class") in ("WPD", "PortableDevices", "Image") and ("phone" in text or "samsung" in text or "pixel" in text or "xiaomi" in text):
        return "android"
    if "camera" in text or "webcam" in text:
        return "camera"
    if "keyboard" in text or "mouse" in text or "hid" in text:
        return "input"
    if "audio" in text or "headset" in text or "speaker" in text:
        return "audio"
    if "hub" in text:
        return "hub"
    if "storage" in text or "mass storage" in text or "disk" in text:
        return "storage"
    return "other"


_ADB_CACHE = {"path": None, "at": 0.0, "checked": False}
_ADB_LOCK = threading.Lock()


def find_adb() -> str | None:
    if LOCAL_ADB.exists():
        return str(LOCAL_ADB)
    with _ADB_LOCK:
        if _ADB_CACHE["checked"] and time.monotonic() - _ADB_CACHE["at"] < 300:
            return _ADB_CACHE["path"]
        # shutil.which is a cheap in-process PATH lookup; PowerShell is a last resort.
        adb_path = shutil.which("adb")
        if not adb_path:
            code, out, err = run_powershell(
                "Get-Command adb -ErrorAction SilentlyContinue | Select-Object -ExpandProperty Source",
                timeout=8)
            adb_path = out.strip().splitlines()[0].strip() if code == 0 and out.strip() else None
        _ADB_CACHE["path"] = adb_path
        _ADB_CACHE["at"] = time.monotonic()
        _ADB_CACHE["checked"] = True
        return adb_path


def run_adb(args: list[str], serial: str | None = None, timeout: int = 60) -> tuple[int, str, str]:
    adb_path = find_adb()
    if not adb_path:
        return 1, "", "adb not found"
    cmd = [adb_path]
    if serial:
        cmd += ["-s", serial]
    cmd += args
    try:
        proc = subprocess.run(
            cmd, capture_output=True, text=True, timeout=timeout,
            creationflags=getattr(subprocess, "CREATE_NO_WINDOW", 0))
        return proc.returncode, proc.stdout, proc.stderr
    except Exception as e:
        return 1, "", str(e)


def adb_status() -> dict:
    adb_path = find_adb()
    if not adb_path:
        return {"available": False, "path": None, "devices": [], "raw": "", "localInstallPath": str(LOCAL_ADB)}
    code, out, err = run_adb(["devices", "-l"], timeout=12)
    raw = (out or "").strip() or (err or "").strip()
    devices = []
    for line in raw.splitlines()[1:]:
        line = line.strip()
        if not line:
            continue
        parts = line.split()
        if len(parts) >= 2:
            devices.append({"serial": parts[0], "state": parts[1], "details": " ".join(parts[2:])})
    return {"available": True, "path": adb_path, "devices": devices, "raw": raw, "localInstallPath": str(LOCAL_ADB)}


def install_adb() -> dict:
    if os.name != "nt":
        return {"ok": False, "error": "Automatic ADB install is currently implemented for Windows only. Install platform-tools manually for your OS."}
    if LOCAL_ADB.exists():
        return {"ok": True, "message": "ADB already installed locally.", "path": str(LOCAL_ADB), "alreadyInstalled": True}
    TOOLS_DIR.mkdir(parents=True, exist_ok=True)
    zip_path = TOOLS_DIR / "platform-tools.zip"
    try:
        urlretrieve(ADB_ZIP_URL, zip_path)
        with zipfile.ZipFile(zip_path, 'r') as zf:
            zf.extractall(TOOLS_DIR)
        try:
            zip_path.unlink(missing_ok=True)
        except Exception:
            pass
        if not LOCAL_ADB.exists():
            return {"ok": False, "error": f"Download/extract completed but adb not found at {LOCAL_ADB}"}
        return {"ok": True, "message": "ADB (Android Platform Tools) installed locally.", "path": str(LOCAL_ADB), "alreadyInstalled": False}
    except Exception as e:
        try:
            if zip_path.exists():
                zip_path.unlink(missing_ok=True)
        except Exception:
            pass
        return {"ok": False, "error": str(e), "url": ADB_ZIP_URL}


def collect_devices() -> dict:
    devices = get_pnp_devices()
    enriched = []
    for d in devices:
        kind = classify_device(d)
        enriched.append({**d, "kind": kind, "name": display_name(d)})
    android_like = [d for d in enriched if d.get("kind") == "android"]
    controllers = [d for d in enriched if d.get("kind") == "controller"]
    adb = adb_status()
    return {
        "devices": enriched,
        "summary": {
            "total": len(enriched),
            "androidCandidates": len(android_like),
            "controllerCandidates": len(controllers),
            "adbAvailable": adb["available"],
            "adbConnected": len([x for x in adb.get("devices", []) if x.get("state") == "device"]),
        },
        "adb": adb,
        "androidCandidates": android_like,
        "controllerCandidates": controllers,
    }


def first_connected_serial(adb: dict | None = None) -> str | None:
    if adb is None:
        adb = adb_status()
    for d in adb.get("devices", []):
        if d.get("state") == "device":
            return d.get("serial")
    return None


def controller_status() -> dict:
    controllers = []
    for d in get_pnp_devices():
        if classify_device(d) != "controller":
            continue
        vid, pid = device_ids(d)
        controllers.append({
            **d,
            "name": display_name(d),
            "family": controller_family(d),
            "vid": vid,
            "pid": pid,
        })
    xinput_available = bool(controller_api and controller_api.available())
    xinput_indices = controller_api.connected_indices() if xinput_available else []
    di = dinput_status()
    input_sources = ["auto"]
    if xinput_available:
        input_sources.append("xinput")
    if di.get("available") and di.get("deviceCount"):
        input_sources.append("dinput")
    if controller_api:
        input_sources.append("demo")
    return {
        "controllers": controllers,
        "summary": {"total": len(controllers)},
        "autoLaunch": STATE["controller_auto_launch"],
        "lastAutoResult": STATE["controller_last_result"],
        "pollSeconds": 5,
        "liveInputAvailable": xinput_available or bool(di.get("deviceCount")),
        "demoMode": bool(STATE["controller_demo"]),
        "xinputAvailable": xinput_available,
        "xinputIndices": xinput_indices,
        "xinputError": (controller_api.error_message()
                        if controller_api and not xinput_available else None),
        "dinputAvailable": bool(di.get("available")),
        "dinputDevices": di.get("devices", []),
        "dinputDeviceCount": di.get("deviceCount", 0),
        "dinputError": di.get("error"),
        "inputSources": input_sources,
    }


def controller_watcher() -> None:
    while True:
        try:
            if STATE["controller_auto_launch"]:
                controllers = controller_status()["controllers"]
                ids = {c.get("instanceId") for c in controllers if c.get("instanceId")}
                new_ids = ids - STATE["controller_seen"]
                if new_ids:
                    STATE["controller_last_result"] = {
                        "ok": True,
                        "controllers": sorted(new_ids),
                        "at": int(time.time()),
                    }
                    print(f"[controller] detected {len(new_ids)} new controller(s)")
                STATE["controller_seen"] = ids
            else:
                STATE["controller_seen"] = set()
        except Exception as e:
            print(f"[controller] watcher error: {e}")
        time.sleep(5)


def start_controller_watcher() -> threading.Thread:
    t = threading.Thread(target=controller_watcher, name="pawd-controller-watcher", daemon=True)
    t.start()
    return t


def phone_app_status() -> dict:
    adb = adb_status()
    serial = first_connected_serial(adb)
    installed = False
    running = False
    version = None
    if serial:
        code, out, err = run_adb(
            ["shell", "pm", "list", "packages", PHONE_PACKAGE],
            serial=serial, timeout=15)
        installed = code == 0 and PHONE_PACKAGE in (out or "")
        if installed:
            code, out, err = run_adb(
                ["shell", "dumpsys", "package", PHONE_PACKAGE],
                serial=serial, timeout=15)
            m = re.search(r"versionName=([^\s]+)", out or "")
            version = m.group(1) if m else None
            code, out, err = run_adb(
                ["shell", "pidof", PHONE_PACKAGE],
                serial=serial, timeout=10)
            running = code == 0 and bool((out or "").strip())
    return {
        "adbAvailable": adb["available"],
        "adbPath": adb["path"],
        "serial": serial,
        "installed": installed,
        "version": version,
        "running": running,
        "apkAvailable": PHONE_APK.exists(),
        "apkPath": str(PHONE_APK),
        "package": PHONE_PACKAGE,
        "autoLaunch": STATE["auto_launch"],
        "lastAutoResult": STATE["last_result"],
    }


def launch_phone_app(serial: str | None = None) -> dict:
    with PHONE_LOCK:
        return _launch_phone_app(serial)


def _launch_phone_app(serial: str | None = None) -> dict:
    adb = adb_status()
    if not adb["available"]:
        return {"ok": False, "error": "ADB is not available. Use Install ADB (Platform Tools) first."}
    if not serial:
        serial = first_connected_serial(adb)
    if not serial:
        return {
            "ok": False,
            "error": "No authorized phone connected. Connect USB, enable USB debugging, "
                     "and accept the authorization prompt on the phone.",
        }
    if not PHONE_APK.exists():
        return {
            "ok": False,
            "error": f"Phone APK missing at {PHONE_APK}. Build it with phone-app/build.ps1.",
        }

    run_adb(["shell", "input", "keyevent", "KEYCODE_WAKEUP"], serial=serial, timeout=10)
    run_adb(["shell", "wm", "dismiss-keyguard"], serial=serial, timeout=10)
    run_adb(["shell", "svc", "power", "stayon", "true"], serial=serial, timeout=10)

    code, out, err = run_adb(
        ["install", "-r", "-g", str(PHONE_APK)], serial=serial, timeout=180)
    combined = ((out or "") + "\n" + (err or "")).strip()
    if code != 0 or "Success" not in combined:
        if "INSTALL_FAILED_UPDATE_INCOMPATIBLE" in combined or "signatures do not match" in combined:
            run_adb(["uninstall", PHONE_PACKAGE], serial=serial, timeout=60)
            code, out, err = run_adb(
                ["install", "-r", "-g", str(PHONE_APK)], serial=serial, timeout=180)
            combined = ((out or "") + "\n" + (err or "")).strip()
        if code != 0 or "Success" not in combined:
            return {
                "ok": False,
                "serial": serial,
                "error": "ADB install failed.",
                "output": combined,
            }

    code, out, err = run_adb(
        ["shell", "am", "start", "-W", "-n", PHONE_ACTIVITY],
        serial=serial, timeout=30)
    launch_out = ((out or "") + "\n" + (err or "")).strip()
    if code != 0:
        return {
            "ok": False,
            "serial": serial,
            "error": "Failed to launch the phone test app.",
            "output": launch_out,
            "installOutput": combined,
        }

    return {
        "ok": True,
        "serial": serial,
        "message": f"Pawd Self Test installed and launched on {serial}.",
        "installOutput": combined,
        "launchOutput": launch_out,
        "apkPath": str(PHONE_APK),
    }


def stop_phone_app(serial: str | None = None) -> dict:
    with PHONE_LOCK:
        return _stop_phone_app(serial)


def _stop_phone_app(serial: str | None = None) -> dict:
    adb = adb_status()
    if not serial:
        serial = first_connected_serial(adb)
    if not serial:
        return {"ok": False, "error": "No authorized phone connected."}
    code, out, err = run_adb(
        ["shell", "am", "force-stop", PHONE_PACKAGE], serial=serial, timeout=20)
    run_adb(["shell", "svc", "power", "stayon", "false"], serial=serial, timeout=10)
    if code != 0:
        return {
            "ok": False,
            "serial": serial,
            "error": "Failed to stop the phone test app.",
            "output": ((out or "") + "\n" + (err or "")).strip(),
        }
    return {"ok": True, "serial": serial, "message": "Phone test app stopped."}


def phone_watcher():
    while True:
        try:
            if STATE["auto_launch"]:
                adb = adb_status()
                serial = first_connected_serial(adb)
                last = STATE["last_result"] or {}
                retry_due = (
                    not last.get("ok")
                    and last.get("serial") == serial
                    and int(time.time()) - int(last.get("at") or 0) >= 30
                )
                should_launch = serial and (serial != STATE["last_serial"] or retry_due)
                if should_launch and not STATE["launching"]:
                    STATE["launching"] = True
                    try:
                        res = launch_phone_app(serial)
                        STATE["last_result"] = {
                            "ok": bool(res.get("ok")),
                            "serial": serial,
                            "message": res.get("message"),
                            "error": res.get("error"),
                            "at": int(time.time()),
                        }
                        print(f"[phone] auto-launch {serial}: {res.get('ok')} "
                              f"{res.get('message') or res.get('error') or ''}")
                        STATE["last_serial"] = serial
                    finally:
                        STATE["launching"] = False
                elif not serial:
                    STATE["last_serial"] = None
        except Exception as e:
            print(f"[phone] watcher error: {e}")
        time.sleep(6)


def start_phone_watcher() -> threading.Thread:
    t = threading.Thread(target=phone_watcher, name="pawd-phone-watcher", daemon=True)
    t.start()
    return t


def safe_recording_name(name: str | None) -> str | None:
    if not name:
        return None
    name = Path(name).name
    if not re.fullmatch(r"[A-Za-z0-9._-]+", name):
        return None
    if not name.lower().endswith(".webm"):
        return None
    return name


def list_recordings() -> dict:
    try:
        RECORDINGS_DIR.mkdir(parents=True, exist_ok=True)
    except Exception:
        pass
    items = []
    try:
        paths = sorted(RECORDINGS_DIR.glob("*.webm"),
                       key=lambda p: p.stat().st_mtime, reverse=True)
    except Exception:
        paths = []
    for p in paths:
        meta = {}
        try:
            meta = json.loads(p.with_suffix(".json").read_text(encoding="utf-8"))
        except Exception:
            pass
        try:
            st = p.stat()
        except Exception:
            continue
        items.append({
            "name": p.name,
            "size": st.st_size,
            "created": int(st.st_mtime),
            "meta": meta if isinstance(meta, dict) else {},
        })
    return {"dir": str(RECORDINGS_DIR), "recordings": items}


def recording_metadata(query: dict) -> dict:
    raw = (query.get("meta") or [""])[0]
    if not raw:
        return {}
    try:
        padded = raw + "=" * (-len(raw) % 4)
        data = json.loads(base64.urlsafe_b64decode(padded.encode("ascii")).decode("utf-8"))
        return data if isinstance(data, dict) else {}
    except Exception:
        return {}


def safe_report_name(name: str | None) -> str | None:
    if not name:
        return None
    name = Path(name).name
    if not re.fullmatch(r"[A-Za-z0-9._-]+", name):
        return None
    if not name.lower().endswith(".html"):
        return None
    return name


def list_reports() -> dict:
    try:
        REPORTS_DIR.mkdir(parents=True, exist_ok=True)
    except Exception:
        pass
    items = []
    try:
        paths = sorted(REPORTS_DIR.glob("*.html"),
                       key=lambda p: p.stat().st_mtime, reverse=True)
    except Exception:
        paths = []
    for p in paths:
        meta = {}
        try:
            meta = json.loads(p.with_suffix(".json").read_text(encoding="utf-8"))
        except Exception:
            pass
        try:
            st = p.stat()
        except Exception:
            continue
        items.append({
            "name": p.name,
            "size": st.st_size,
            "created": int(st.st_mtime),
            "meta": meta if isinstance(meta, dict) else {},
        })
    return {"dir": str(REPORTS_DIR), "reports": items}


class Handler(SimpleHTTPRequestHandler):
    def __init__(self, *args, **kwargs):
        super().__init__(*args, directory=str(STATIC_DIR), **kwargs)

    def _send_json(self, status: int, payload: dict):
        body = json.dumps(payload).encode("utf-8")
        self.send_response(status)
        self.send_header("Content-Type", "application/json; charset=utf-8")
        self.send_header("Content-Length", str(len(body)))
        self.end_headers()
        self.wfile.write(body)

    def _send_bytes(self, status: int, content_type: str, body: bytes,
                    extra_headers: dict | None = None):
        self.send_response(status)
        self.send_header("Content-Type", content_type)
        self.send_header("Content-Length", str(len(body)))
        self.send_header("Cache-Control", "no-store")
        for key, value in (extra_headers or {}).items():
            self.send_header(key, value)
        self.end_headers()
        self.wfile.write(body)

    def _read_json(self) -> dict:
        try:
            length = int(self.headers.get("Content-Length") or 0)
            if length <= 0:
                return {}
            raw = self.rfile.read(length)
            if not raw:
                return {}
            data = json.loads(raw.decode("utf-8"))
            return data if isinstance(data, dict) else {}
        except Exception:
            return {}

    def do_GET(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/version":
            self._send_json(200, {"version": APP_VERSION})
            return
        if parsed.path == "/api/devices":
            try:
                self._send_json(200, collect_devices())
            except Exception as e:
                self._send_json(500, {"error": str(e)})
            return
        if parsed.path == "/api/phone/status":
            try:
                self._send_json(200, phone_app_status())
            except Exception as e:
                self._send_json(500, {"error": str(e)})
            return
        if parsed.path == "/api/phone/auto":
            self._send_json(200, {
                "enabled": STATE["auto_launch"],
                "lastResult": STATE["last_result"],
            })
            return
        if parsed.path == "/api/controllers":
            try:
                self._send_json(200, controller_status())
            except Exception as e:
                self._send_json(500, {"error": str(e)})
            return
        if parsed.path == "/api/controllers/auto":
            self._send_json(200, {
                "enabled": STATE["controller_auto_launch"],
                "lastResult": STATE["controller_last_result"],
            })
            return
        if parsed.path == "/api/controllers/display-auto":
            self._send_json(200, {"enabled": STATE["controller_display_auto_open"]})
            return
        if parsed.path == "/api/controllers/stick-auto":
            self._send_json(200, {"enabled": STATE["stick_view_auto_open"]})
            return
        if parsed.path == "/api/controllers/state":
            try:
                query = parse_qs(parsed.query)
                raw = query.get("index", ["0"])[0]
                try:
                    index = max(0, min(3, int(raw)))
                except (TypeError, ValueError):
                    index = 0
                source = (query.get("source", ["auto"])[0] or "auto").lower()
                if source not in ("auto", "xinput", "dinput", "demo"):
                    source = "auto"
                self._send_json(200, controller_live_state(index, source))
            except Exception as e:
                self._send_json(500, {"error": str(e)})
            return
        if parsed.path == "/api/controllers/battery":
            self._send_json(200, battery_status())
            return
        if parsed.path == "/api/controllers/dinput":
            self._send_json(200, dinput_status())
            return
        if parsed.path == "/api/controllers/mappings":
            di_devices = dinput_api.devices() if dinput_api else []
            device_name = (di_devices[0].get("name") or "") if di_devices else ""
            default = (dinput_api.default_mapping("", device_name) if dinput_api else {
                "guid": "", "name": "", "buttons": {}, "axes": {}, "triggers": {},
            })
            self._send_json(200, {
                "mappings": list(load_controller_mappings().values()),
                "default": default,
                "buttonNames": list(_di_constant("LOGICAL_BUTTONS", ())),
                "axisSources": list(_di_constant("AXIS_SOURCES", ())),
            })
            return
        if parsed.path == "/api/recordings":
            self._send_json(200, list_recordings())
            return
        if parsed.path == "/api/recordings/file":
            name = safe_recording_name(parse_qs(parsed.query).get("name", [""])[0])
            path = RECORDINGS_DIR / name if name else None
            if not path or not path.exists():
                self._send_json(404, {"error": "Recording not found"})
                return
            try:
                data = path.read_bytes()
                self._send_bytes(200, "video/webm", data, {
                    "Content-Disposition": f'inline; filename="{name}"',
                })
            except Exception as e:
                self._send_json(500, {"error": str(e)})
            return
        if parsed.path == "/api/reports":
            self._send_json(200, list_reports())
            return
        if parsed.path == "/api/reports/file":
            name = safe_report_name(parse_qs(parsed.query).get("name", [""])[0])
            path = REPORTS_DIR / name if name else None
            if not path or not path.exists():
                self._send_json(404, {"error": "Report not found"})
                return
            try:
                data = path.read_bytes()
                self._send_bytes(200, "text/html; charset=utf-8", data, {
                    "Content-Disposition": f'inline; filename="{name}"',
                })
            except Exception as e:
                self._send_json(500, {"error": str(e)})
            return
        if parsed.path == "/":
            self.path = "/index.html"
        return super().do_GET()

    def do_POST(self):
        parsed = urlparse(self.path)
        if parsed.path == "/api/adb/install":
            try:
                result = install_adb()
                status = 200 if result.get("ok") else 500
                self._send_json(status, result)
            except Exception as e:
                self._send_json(500, {"ok": False, "error": str(e)})
            return
        if parsed.path == "/api/phone/start":
            try:
                body = self._read_json()
                result = launch_phone_app(body.get("serial"))
                status = 200 if result.get("ok") else 500
                self._send_json(status, result)
            except Exception as e:
                self._send_json(500, {"ok": False, "error": str(e)})
            return
        if parsed.path == "/api/phone/stop":
            try:
                body = self._read_json()
                result = stop_phone_app(body.get("serial"))
                status = 200 if result.get("ok") else 500
                self._send_json(status, result)
            except Exception as e:
                self._send_json(500, {"ok": False, "error": str(e)})
            return
        if parsed.path == "/api/phone/auto":
            try:
                body = self._read_json()
                result = set_auto_launch(bool(body.get("enabled")))
                self._send_json(200, {"ok": True, **result})
            except Exception as e:
                self._send_json(500, {"ok": False, "error": str(e)})
            return
        if parsed.path == "/api/controllers/auto":
            try:
                body = self._read_json()
                result = set_controller_auto_launch(bool(body.get("enabled")))
                self._send_json(200, {"ok": True, **result})
            except Exception as e:
                self._send_json(500, {"ok": False, "error": str(e)})
            return
        if parsed.path == "/api/controllers/demo":
            try:
                body = self._read_json()
                result = set_controller_demo(bool(body.get("enabled")))
                self._send_json(200, {"ok": True, **result})
            except Exception as e:
                self._send_json(500, {"ok": False, "error": str(e)})
            return
        if parsed.path == "/api/controllers/display-auto":
            try:
                body = self._read_json()
                result = set_controller_display_auto_open(bool(body.get("enabled")))
                self._send_json(200, {"ok": True, **result})
            except Exception as e:
                self._send_json(500, {"ok": False, "error": str(e)})
            return
        if parsed.path == "/api/controllers/stick-auto":
            try:
                body = self._read_json()
                result = set_stick_view_auto_open(bool(body.get("enabled")))
                self._send_json(200, {"ok": True, **result})
            except Exception as e:
                self._send_json(500, {"ok": False, "error": str(e)})
            return
        if parsed.path == "/api/controllers/dinput/refresh":
            try:
                if not dinput_api:
                    self._send_json(503, {"ok": False, "error": "dinput module unavailable"})
                    return
                dinput_api.refresh(wait=True)
                self._send_json(200, {"ok": True, **dinput_status()})
            except Exception as e:
                self._send_json(500, {"ok": False, "error": str(e)})
            return
        if parsed.path == "/api/controllers/mappings":
            try:
                mapping = normalize_controller_mapping(self._read_json())
                mappings = load_controller_mappings()
                mappings[mapping["guid"]] = mapping
                save_controller_mappings(mappings)
                apply_controller_mappings()
                self._send_json(200, {"ok": True, "mapping": mapping})
            except Exception as e:
                self._send_json(400, {"ok": False, "error": str(e)})
            return
        if parsed.path == "/api/controllers/mappings/reset":
            try:
                guid = str(self._read_json().get("guid") or "").strip()
                if not guid:
                    self._send_json(400, {"ok": False, "error": "A device GUID is required"})
                    return
                mappings = load_controller_mappings()
                mappings.pop(guid, None)
                save_controller_mappings(mappings)
                apply_controller_mappings()
                self._send_json(200, {"ok": True, "guid": guid})
            except Exception as e:
                self._send_json(500, {"ok": False, "error": str(e)})
            return
        if parsed.path == "/api/controllers/rumble":
            try:
                body = self._read_json()
                try:
                    index = max(0, min(3, int(body.get("index", 0))))
                except (TypeError, ValueError):
                    index = 0

                def clamp(value, default=0.0):
                    try:
                        return max(0.0, min(1.0, float(value)))
                    except (TypeError, ValueError):
                        return default

                left = clamp(body.get("left"))
                right = clamp(body.get("right"))
                try:
                    duration = max(50, min(5000, int(body.get("durationMs", 300))))
                except (TypeError, ValueError):
                    duration = 300
                demo = bool(STATE["controller_demo"])
                if demo:
                    ok = True
                    simulated = True
                elif controller_api and controller_api.available():
                    ok = bool(controller_api.rumble(index, left, right, duration))
                    simulated = False
                else:
                    ok = False
                    simulated = False
                if ok:
                    error = None
                elif not controller_api or not controller_api.available():
                    error = "XInput is not available on this PC"
                else:
                    error = "No XInput controller on this player index (enable demo mode to simulate)"
                self._send_json(200, {
                    "ok": ok,
                    "simulated": simulated,
                    "index": index,
                    "left": left,
                    "right": right,
                    "durationMs": duration,
                    "error": error,
                })
            except Exception as e:
                self._send_json(500, {"ok": False, "error": str(e)})
            return
        if parsed.path == "/api/controllers/battery/start":
            if not battery_api:
                self._send_json(500, {"ok": False, "error": "battery module unavailable"})
                return
            try:
                body = self._read_json()
                index, source, mode, duration_ms, interval_ms = _battery_request_values(body)
                status = battery_api.SESSION.start(
                    index=index, source=source, mode=mode,
                    duration_ms=duration_ms, interval_ms=interval_ms)
                self._send_json(200, {"ok": True, **status})
            except Exception as e:
                self._send_json(500, {"ok": False, "error": str(e)})
            return
        if parsed.path == "/api/controllers/battery/stop":
            if not battery_api:
                self._send_json(500, {"ok": False, "error": "battery module unavailable"})
                return
            try:
                status = battery_api.SESSION.stop()
                self._send_json(200, {"ok": True, **status})
            except Exception as e:
                self._send_json(500, {"ok": False, "error": str(e)})
            return
        if parsed.path == "/api/controllers/battery/reset":
            if not battery_api:
                self._send_json(500, {"ok": False, "error": "battery module unavailable"})
                return
            try:
                self._send_json(200, {"ok": True, **battery_api.SESSION.reset()})
            except Exception as e:
                self._send_json(500, {"ok": False, "error": str(e)})
            return
        if parsed.path == "/api/controllers/battery/sample":
            try:
                body = self._read_json()
                index, source, _mode, _duration, _interval = _battery_request_values(body)
                record = bool(body.get("record"))
                self._send_json(200, battery_read(index, source, record=record))
            except Exception as e:
                self._send_json(500, {"error": str(e), "available": False})
            return
        if parsed.path == "/api/ps5/ping":
            try:
                self._send_json(200, ps5_ping(self._read_json().get("host")))
            except Exception as e:
                self._send_json(500, {"ok": False, "error": str(e)})
            return
        if parsed.path == "/api/recordings/save":
            try:
                query = parse_qs(parsed.query)
                name = safe_recording_name(query.get("name", [""])[0])
                if not name:
                    self._send_json(400, {"ok": False, "error": "Invalid recording filename"})
                    return
                length = int(self.headers.get("Content-Length") or 0)
                if length <= 0 or length > 200 * 1024 * 1024:
                    self._send_json(400, {"ok": False, "error": "Invalid recording size"})
                    return
                RECORDINGS_DIR.mkdir(parents=True, exist_ok=True)
                path = RECORDINGS_DIR / name
                remaining = length
                with path.open("wb") as f:
                    while remaining > 0:
                        chunk = self.rfile.read(min(65536, remaining))
                        if not chunk:
                            break
                        f.write(chunk)
                        remaining -= len(chunk)
                if remaining != 0:
                    raise IOError("Incomplete upload")
                meta = recording_metadata(query)
                meta.update({
                    "file": name,
                    "bytes": length,
                    "savedAt": int(time.time()),
                })
                path.with_suffix(".json").write_text(
                    json.dumps(meta, indent=2), encoding="utf-8")
                self._send_json(200, {"ok": True, "name": name, "bytes": length})
            except Exception as e:
                self._send_json(500, {"ok": False, "error": str(e)})
            return
        if parsed.path == "/api/recordings/delete":
            try:
                body = self._read_json()
                name = safe_recording_name(body.get("name"))
                if not name:
                    self._send_json(400, {"ok": False, "error": "Invalid recording filename"})
                    return
                path = RECORDINGS_DIR / name
                removed = False
                if path.exists():
                    path.unlink()
                    removed = True
                meta = path.with_suffix(".json")
                if meta.exists():
                    meta.unlink()
                self._send_json(200, {"ok": True, "removed": removed, "name": name})
            except Exception as e:
                self._send_json(500, {"ok": False, "error": str(e)})
            return
        if parsed.path == "/api/reports/save":
            try:
                query = parse_qs(parsed.query)
                name = safe_report_name(query.get("name", [""])[0])
                if not name:
                    self._send_json(400, {"ok": False, "error": "Invalid report filename"})
                    return
                length = int(self.headers.get("Content-Length") or 0)
                if length <= 0 or length > 10 * 1024 * 1024:
                    self._send_json(400, {"ok": False, "error": "Invalid report size"})
                    return
                REPORTS_DIR.mkdir(parents=True, exist_ok=True)
                path = REPORTS_DIR / name
                remaining = length
                with path.open("wb") as f:
                    while remaining > 0:
                        chunk = self.rfile.read(min(65536, remaining))
                        if not chunk:
                            break
                        f.write(chunk)
                        remaining -= len(chunk)
                if remaining != 0:
                    raise IOError("Incomplete upload")
                meta = recording_metadata(query)
                meta.update({
                    "file": name,
                    "bytes": length,
                    "savedAt": int(time.time()),
                })
                path.with_suffix(".json").write_text(
                    json.dumps(meta, indent=2), encoding="utf-8")
                self._send_json(200, {"ok": True, "name": name, "bytes": length})
            except Exception as e:
                self._send_json(500, {"ok": False, "error": str(e)})
            return
        if parsed.path == "/api/reports/delete":
            try:
                body = self._read_json()
                name = safe_report_name(body.get("name"))
                if not name:
                    self._send_json(400, {"ok": False, "error": "Invalid report filename"})
                    return
                path = REPORTS_DIR / name
                removed = False
                if path.exists():
                    path.unlink()
                    removed = True
                meta = path.with_suffix(".json")
                if meta.exists():
                    meta.unlink()
                self._send_json(200, {"ok": True, "removed": removed, "name": name})
            except Exception as e:
                self._send_json(500, {"ok": False, "error": str(e)})
            return
        self._send_json(404, {"error": "Not found"})

    def log_message(self, fmt, *args):
        sys.stderr.write("[server] " + (fmt % args) + "\n")


def resolve_port(default: int = 8765) -> int:
    args = sys.argv[1:]
    if "--port" in args:
        try:
            return int(args[args.index("--port") + 1])
        except (IndexError, ValueError):
            print("Invalid --port value; expected an integer.")
    try:
        return int(os.environ.get("PORT", str(default)))
    except ValueError:
        return default


def initialize_state():
    cfg = load_config()
    STATE["auto_launch"] = bool(cfg.get("auto_launch", False))
    STATE["controller_auto_launch"] = bool(cfg.get("controller_auto_launch", False))
    STATE["controller_demo"] = bool(cfg.get("controller_demo", False))
    STATE["controller_display_auto_open"] = bool(
        cfg.get("controller_display_auto_open", True))
    STATE["stick_view_auto_open"] = bool(
        cfg.get("stick_view_auto_open", True))
    apply_controller_mappings()
    if dinput_api:
        try:
            dinput_api.get_manager().start()
            print("[dinput] DirectInput manager started")
        except Exception as e:
            print(f"[dinput] failed to start: {e}")
    start_phone_watcher()
    start_controller_watcher()
    if battery_api:
        battery_api.start_watcher()


def create_server(port: int) -> ThreadingHTTPServer:
    """Build a ready-to-serve HTTP server. Caller owns serve_forever/shutdown."""
    initialize_state()
    server = ThreadingHTTPServer(("127.0.0.1", port), Handler)
    server.daemon_threads = True
    return server


def main():
    port = resolve_port()
    server = create_server(port)
    print(f"Device Test App running at http://127.0.0.1:{port}")
    try:
        server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        server.server_close()


if __name__ == "__main__":
    main()
