"""DirectInput 8 polling for game controllers that are not XInput devices.

Uses ctypes COM bindings against dinput8.dll. A dedicated daemon thread owns all
COM objects (avoiding apartment/cross-thread issues) and caches normalized state,
which HTTP handlers read without touching COM themselves.

If DirectInput is unavailable or fails, the module reports an error and the rest
of Pawd keeps working with XInput / PnP detection only.
"""

import ctypes
import ctypes.wintypes as w
import os
import threading
import time

DIDEVTYPE_JOYSTICK = 4
DIEDFL_ALLDEVICES = 0x00000000
DISCL_NONEXCLUSIVE = 0x00000002
DISCL_BACKGROUND = 0x00000008
DI_VERSION = 0x0800

# Common mapping for DirectInput gamepads (index -> Pawd button name).
DI_BUTTON_NAMES = {
    0: "a", 1: "b", 2: "x", 3: "y",
    4: "lb", 5: "rb", 8: "back", 9: "start",
    10: "ls", 11: "rs",
}

# MSI GC300 wireless reports stick presses at bits 8/9 and back/start at
# 7/6. The instance name is stable across connections even though the GUID
# is not, so use it to select this layout.
GC300_BUTTON_NAMES = {
    0: "a", 1: "b", 2: "x", 3: "y",
    4: "lb", 5: "rb", 7: "back", 6: "start",
    8: "ls", 9: "rs",
}

# DualSense reports face/shoulder/button bits like a standard pad, but the
# right stick lives on lZ/lRz and the triggers on lRx/lRy. PS, touchpad click,
# and the built-in mic button are buttons 12, 13, and 14. Selected by the
# stable device name because the instance GUID changes between connections.
DUALSENSE_BUTTON_NAMES = {
    # Hardware bits: 0=Square, 1=Cross, 2=Circle, 3=Triangle. Pawd's logical
    # names keep their usual positions (x=left, a=bottom, b=right, y=top),
    # which line up with the PlayStation glyphs shown in the UI.
    0: "x", 1: "a", 2: "b", 3: "y",
    4: "lb", 5: "rb", 8: "back", 9: "start",
    10: "ls", 11: "rs",
    12: "guide", 13: "touchpad", 14: "mic",
}
DUALSENSE_AXES = {
    "lx": {"source": "lX", "invert": False},
    "ly": {"source": "lY", "invert": True},
    "rx": {"source": "lZ", "invert": False},
    "ry": {"source": "lRz", "invert": True},
}
DUALSENSE_TRIGGERS = {
    "lt": {"source": "lRx", "invert": False},
    "rt": {"source": "lRy", "invert": False},
}

LOGICAL_BUTTONS = (
    "a", "b", "x", "y", "lb", "rb", "back", "start", "ls", "rs",
    "up", "down", "left", "right", "guide", "touchpad", "mic",
)
AXIS_KEYS = ("lx", "ly", "rx", "ry")
TRIGGER_KEYS = ("lt", "rt")
AXIS_SOURCES = (
    "lX", "lY", "lZ", "lRx", "lRy", "lRz", "rglSlider0", "rglSlider1",
    "lZ-low", "lZ-high",
)
DEFAULT_AXES = {
    "lx": {"source": "lX", "invert": False},
    "ly": {"source": "lY", "invert": True},
    "rx": {"source": "lRx", "invert": False},
    "ry": {"source": "lRy", "invert": True},
}
DEFAULT_TRIGGERS = {
    "lt": {"source": "lZ", "invert": False},
    "rt": {"source": "lRz", "invert": False},
}
# Both GC300 triggers share lZ: it rests at 32767, LT pulls it toward 0 and
# RT pushes it toward 65535. These pseudo-sources split the two halves.
GC300_TRIGGERS = {
    "lt": {"source": "lZ-high", "invert": False},
    "rt": {"source": "lZ-low", "invert": False},
}


def _is_dualsense(name: str) -> bool:
    upper = name.upper()
    return "DUALSENSE" in upper or ("054C" in upper and "0CE6" in upper)


def _is_powera_rechargeable(name: str) -> bool:
    upper = name.upper()
    return ("NSW ENHANCED WIRELESS" in upper or "POWERA" in upper or
            "POWER A" in upper or "POWERED A RECHARGEABLE" in upper)


def default_button_map(name: str = "") -> dict[str, int]:
    if "GC300" in name.upper():
        layout = GC300_BUTTON_NAMES
    elif _is_dualsense(name):
        layout = DUALSENSE_BUTTON_NAMES
    else:
        layout = DI_BUTTON_NAMES
    return {button: bit for bit, button in layout.items()}


def default_axis_map(name: str = "") -> dict[str, dict]:
    sony_style = _is_dualsense(name) or _is_powera_rechargeable(name)
    source = DUALSENSE_AXES if sony_style else DEFAULT_AXES
    return {key: dict(cfg) for key, cfg in source.items()}


def default_trigger_map(name: str = "") -> dict[str, dict]:
    if "GC300" in name.upper():
        return dict(GC300_TRIGGERS)
    if _is_dualsense(name) or _is_powera_rechargeable(name):
        return dict(DUALSENSE_TRIGGERS)
    return dict(DEFAULT_TRIGGERS)


def default_mapping(guid: str = "", name: str = "") -> dict:
    """Return a fresh copy of the factory mapping for a device."""
    return {
        "guid": guid,
        "name": name,
        "buttons": default_button_map(name),
        "axes": default_axis_map(name),
        "triggers": default_trigger_map(name),
    }


class GUID(ctypes.Structure):
    _fields_ = [
        ("Data1", ctypes.c_ulong),
        ("Data2", ctypes.c_ushort),
        ("Data3", ctypes.c_ushort),
        ("Data4", ctypes.c_ubyte * 8),
    ]

    @classmethod
    def from_string(cls, text: str) -> "GUID":
        text = text.strip().strip("{}")
        a, b, c, d, e = text.split("-")
        g = cls()
        g.Data1 = int(a, 16)
        g.Data2 = int(b, 16)
        g.Data3 = int(c, 16)
        g.Data4 = (ctypes.c_ubyte * 8)(*bytes.fromhex(d + e))
        return g


IID_IDirectInput8W = GUID.from_string("BF798031-483A-4DA2-AA99-5D64ED369700")

# Per-device GUID -> user mapping. The server loads this from disk and applies
# it at startup and whenever a mapping is saved/reset.
_mappings: dict[str, dict] = {}
_mapping_lock = threading.RLock()


def set_mappings(mappings: dict[str, dict]) -> None:
    global _mappings
    with _mapping_lock:
        _mappings = {
            str(guid): mapping for guid, mapping in (mappings or {}).items()
            if isinstance(mapping, dict)
        }


def get_mappings() -> dict[str, dict]:
    with _mapping_lock:
        return {guid: mapping for guid, mapping in _mappings.items()}


def mapping_for(guid: str) -> dict | None:
    with _mapping_lock:
        mapping = _mappings.get(guid)
        return mapping if mapping is None else {
            "guid": mapping.get("guid", guid),
            "name": mapping.get("name", ""),
            "buttons": dict(mapping.get("buttons") or {}),
            "axes": {k: dict(v) for k, v in (mapping.get("axes") or {}).items()},
            "triggers": {k: dict(v) for k, v in (mapping.get("triggers") or {}).items()},
        }


class DIDEVICEINSTANCEW(ctypes.Structure):
    _fields_ = [
        ("dwSize", w.DWORD),
        ("guidInstance", GUID),
        ("guidProduct", GUID),
        ("dwDevType", w.DWORD),
        ("tszInstanceName", ctypes.c_wchar * 260),
        ("tszProductName", ctypes.c_wchar * 260),
        ("guidFFDriver", GUID),
        ("wUsagePage", w.WORD),
        ("wUsage", w.WORD),
    ]


class DIJOYSTATE(ctypes.Structure):
    """Layout matching c_dfDIJoystick from GetdfDIJoystick() (80 bytes).

    The exported c_dfDIJoystick data format has 32 buttons (dwDataSize 80),
    even though the newer DIJOYSTATE header type declares 128 buttons.
    Passing the larger size to GetDeviceState returns E_INVALIDARG.
    """
    _fields_ = [
        ("lX", ctypes.c_long),
        ("lY", ctypes.c_long),
        ("lZ", ctypes.c_long),
        ("lRx", ctypes.c_long),
        ("lRy", ctypes.c_long),
        ("lRz", ctypes.c_long),
        ("rglSlider", ctypes.c_long * 2),
        ("rgdwPOV", w.DWORD * 4),
        ("rgbButtons", ctypes.c_ubyte * 32),
    ]


class ComObject:
    """Minimal COM interface wrapper that calls methods through the vtable."""

    def __init__(self, ptr: int):
        self.ptr = ptr
        self.vtbl = ctypes.cast(
            ctypes.c_void_p(ptr),
            ctypes.POINTER(ctypes.POINTER(ctypes.c_void_p)),
        ).contents

    def call(self, index: int, restype, argtypes, args):
        proto = ctypes.WINFUNCTYPE(restype, ctypes.c_void_p, *argtypes)
        fn = ctypes.cast(self.vtbl[index], proto)
        return fn(self.ptr, *args)

    def release(self):
        try:
            self.call(2, ctypes.c_ulong, [], [])
        except Exception:
            pass


class DirectInput8(ComObject):
    # IDirectInput8W vtable (0-based): QI, AddRef, Release, CreateDevice,
    # EnumDevices, GetDeviceStatus, RunControlPanel, Initialize, FindDevice ...
    def create_device(self, guid: GUID):
        out = ctypes.c_void_p()
        hr = self.call(
            3, ctypes.c_long,
            [ctypes.POINTER(GUID), ctypes.POINTER(ctypes.c_void_p), ctypes.c_void_p],
            [ctypes.byref(guid), ctypes.byref(out), None],
        )
        return hr, out.value or 0

    def enum_devices(self, callback, context=None):
        return self.call(
            4, ctypes.c_long,
            [w.DWORD, ctypes.c_void_p, w.LPVOID, w.DWORD],
            [DIDEVTYPE_JOYSTICK, ctypes.cast(callback, ctypes.c_void_p),
             context or 0, DIEDFL_ALLDEVICES],
        )


class DirectInputDevice8(ComObject):
    # IDirectInputDevice8 vtable (0-based): ... Acquire(7), Unacquire(8),
    # GetDeviceState(9), GetDeviceData(10), SetDataFormat(11),
    # SetEventNotification(12), SetCooperativeLevel(13) ... Poll(25)
    def set_data_format(self, format_ptr: int):
        return self.call(11, ctypes.c_long, [ctypes.c_void_p], [format_ptr])

    def set_cooperative_level(self, hwnd: int, flags: int):
        return self.call(13, ctypes.c_long, [w.HWND, w.DWORD], [hwnd, flags])

    def acquire(self):
        return self.call(7, ctypes.c_long, [], [])

    def unacquire(self):
        return self.call(8, ctypes.c_long, [], [])

    def get_device_state(self, size: int, buffer):
        return self.call(
            9, ctypes.c_long,
            [w.DWORD, w.LPVOID],
            [size, ctypes.cast(ctypes.byref(buffer), w.LPVOID)],
        )

    def poll(self):
        return self.call(25, ctypes.c_long, [], [])


def _axis(normalized: float) -> float:
    normalized = max(-1.0, min(1.0, normalized))
    if abs(normalized) < 0.12:
        return 0.0
    return round(normalized, 3)


def _trigger(normalized: float) -> float:
    normalized = max(0.0, min(1.0, normalized))
    if normalized < 0.05:
        return 0.0
    return round(normalized, 3)


def _dpad(pov: int) -> tuple[bool, bool, bool, bool]:
    if pov == 0xFFFFFFFF:
        return False, False, False, False
    angle = pov / 100.0
    return (
        315 <= angle or angle < 45,
        45 <= angle < 135,
        135 <= angle < 225,
        225 <= angle < 315,
    )


def _axis_raw(state: DIJOYSTATE, source: str) -> int:
    return {
        "lX": state.lX, "lY": state.lY, "lZ": state.lZ,
        "lRx": state.lRx, "lRy": state.lRy, "lRz": state.lRz,
        "rglSlider0": state.rglSlider[0],
        "rglSlider1": state.rglSlider[1],
    }.get(source, 0)


class DirectInputManager:
    def __init__(self):
        self._lock = threading.RLock()
        self._available = False
        self._error = "not started"
        self._devices: list[dict] = []
        self._states: dict[int, dict] = {}
        self._calibration: dict[int, dict[str, dict]] = {}
        self._objects: list[tuple[DirectInputDevice8, dict]] = []
        self._refresh_requested = True
        self._last_refresh = 0.0
        self._refresh_event = threading.Event()
        self._running = False
        self._thread: threading.Thread | None = None
        self._di: DirectInput8 | None = None
        self._library = None
        self._format_ptr = 0

    def start(self):
        if self._thread and self._thread.is_alive():
            return
        self._running = True
        self._thread = threading.Thread(
            target=self._run, name="pawd-dinput", daemon=True)
        self._thread.start()

    def stop(self):
        self._running = False

    def refresh(self, wait: bool = False):
        with self._lock:
            self._refresh_requested = True
            self._refresh_event.clear()
        if wait:
            self._refresh_event.wait(timeout=5.0)

    def reset_calibration(self):
        """Forget learned axis ranges after a mapping/source change."""
        with self._lock:
            self._calibration = {}

    def status(self) -> dict:
        with self._lock:
            return {
                "available": self._available,
                "error": self._error,
                "devices": [dict(d) for d in self._devices],
                "deviceCount": len(self._devices),
            }

    def state(self, index: int) -> dict | None:
        with self._lock:
            s = self._states.get(index)
            return dict(s) if s else None

    def _set_status(self, available: bool, error: str | None):
        with self._lock:
            self._available = available
            self._error = error

    def _run(self):
        if os.name != "nt":
            self._set_status(False, "DirectInput is only available on Windows")
            return
        try:
            ole32 = ctypes.windll.ole32
            ole32.CoInitializeEx(None, 0x00000002)  # COINIT_MULTITHREADED
            dll = ctypes.WinDLL("dinput8")
            dll.DirectInput8Create.argtypes = [
                w.HINSTANCE, w.DWORD, ctypes.POINTER(GUID),
                ctypes.POINTER(ctypes.c_void_p), ctypes.c_void_p,
            ]
            dll.DirectInput8Create.restype = ctypes.c_long
            dll.GetdfDIJoystick.restype = ctypes.c_void_p
            self._format_ptr = dll.GetdfDIJoystick() or 0
            if not self._format_ptr:
                raise RuntimeError("GetdfDIJoystick returned NULL")
            ctypes.windll.kernel32.GetModuleHandleW.restype = w.HINSTANCE
            hinst = ctypes.windll.kernel32.GetModuleHandleW(None)
            out = ctypes.c_void_p()
            hr = dll.DirectInput8Create(
                hinst, DI_VERSION, ctypes.byref(IID_IDirectInput8W),
                ctypes.byref(out), None)
            if hr != 0 or not out.value:
                raise RuntimeError(f"DirectInput8Create failed: HRESULT 0x{hr & 0xFFFFFFFF:08X}")
            self._di = DirectInput8(out.value)
            self._library = dll
            self._set_status(True, None)
        except Exception as e:
            self._set_status(False, str(e))
            return

        hwnd = ctypes.windll.user32.GetDesktopWindow()
        while self._running:
            try:
                now = time.monotonic()
                with self._lock:
                    refresh = self._refresh_requested or (now - self._last_refresh) >= 5.0
                if refresh:
                    self._refresh_devices(hwnd)
                for index, (device, meta) in enumerate(self._objects):
                    self._poll_device(index, device, meta)
            except Exception as e:
                self._set_status(True, f"poll error: {e}")
            time.sleep(0.02)

        for device, _ in self._objects:
            device.unacquire()
            device.release()
        if self._di:
            self._di.release()

    def _refresh_devices(self, hwnd: int):
        found: list[tuple[GUID, str, str]] = []
        callback_type = ctypes.WINFUNCTYPE(
            w.BOOL, ctypes.POINTER(DIDEVICEINSTANCEW), w.LPVOID)

        def on_device(instance, _context):
            info = instance.contents
            # The callback buffer is owned by DirectInput and may be reused as
            # soon as we return, so copy the GUID by value.
            found.append((
                GUID.from_buffer_copy(info.guidInstance),
                info.tszInstanceName or "DirectInput device",
                info.tszProductName or "",
            ))
            return True  # DIENUM_CONTINUE

        cb = callback_type(on_device)
        instance = DIDEVICEINSTANCEW()
        instance.dwSize = ctypes.sizeof(DIDEVICEINSTANCEW)
        hr = self._di.enum_devices(cb, None)
        if hr != 0:
            raise RuntimeError(f"EnumDevices failed: HRESULT 0x{hr & 0xFFFFFFFF:08X}")

        objects = []
        metas = []
        for guid, name, product in found:
            try:
                result, ptr = self._di.create_device(guid)
                if result != 0 or not ptr:
                    continue
                device = DirectInputDevice8(ptr)
                device.set_data_format(self._format_ptr)
                device.set_cooperative_level(
                    hwnd, DISCL_BACKGROUND | DISCL_NONEXCLUSIVE)
                device.acquire()
                objects.append((device, {
                    "name": name,
                    "product": product,
                    "guid": _guid_string(guid),
                }))
                metas.append({
                    "index": len(objects) - 1,
                    "name": name,
                    "product": product,
                    "guid": _guid_string(guid),
                })
            except Exception:
                continue

        with self._lock:
            for device, _ in self._objects:
                device.unacquire()
                device.release()
            self._objects = objects
            self._devices = metas
            self._states = {}
            self._calibration = {}
            self._refresh_requested = False
            self._last_refresh = time.monotonic()
        self._refresh_event.set()

    def _poll_device(self, index: int, device: DirectInputDevice8, meta: dict):
        try:
            device.poll()
            state = DIJOYSTATE()
            hr = device.get_device_state(ctypes.sizeof(state), state)
            if hr != 0:
                device.acquire()
                return
        except Exception:
            return
        normalized = self._normalize(index, state, meta)
        with self._lock:
            self._states[index] = normalized

    def _calibrated(self, index: int, key: str, value: int, *, trigger: bool = False) -> float:
        """Return a value scaled around the axis's observed rest position.

        Many drivers ignore DIPROP_RANGE and leave axes in the default unsigned
        0..65535 range (rest = 32767), while others report signed -32768..32767.
        Learn which from the first samples so an idle stick reads 0 instead of 1.
        """
        cal = self._calibration.setdefault(index, {})
        entry = cal.setdefault(key, {"first": value, "min": value, "max": value})
        entry["min"] = min(entry["min"], value)
        entry["max"] = max(entry["max"], value)
        lo, hi, first = entry["min"], entry["max"], entry["first"]
        if trigger:
            if lo >= 20000:  # unsigned 0..65535 trigger resting at 32767
                center, scale = 32767.0, 32767.0
            elif hi > 40000:  # unsigned 0..65535 trigger resting at 0
                center, scale = 0.0, 65535.0
            else:  # 0..255 or 0..1023 style trigger
                center, scale = 0.0, float(max(hi, 255))
        elif lo < -1000 or (first < 20000 and hi < 40000):
            center, scale = 0.0, 32767.0  # signed axis
        else:
            center, scale = 32767.0, 32767.0  # unsigned axis centered at 32767
        return (float(value) - center) / scale

    def _normalize(self, index: int, state: DIJOYSTATE, meta: dict) -> dict:
        guid = meta.get("guid", "")
        mapping = mapping_for(guid) or default_mapping(guid, meta.get("name", ""))
        buttons = {name: False for name in LOGICAL_BUTTONS}
        up, right, down, left = _dpad(state.rgdwPOV[0])
        buttons.update({"up": up, "right": right, "down": down, "left": left})
        for name, bit in (mapping.get("buttons") or {}).items():
            if name in buttons and isinstance(bit, int) and 0 <= bit < 32:
                buttons[name] = buttons[name] or bool(state.rgbButtons[bit])

        axes = {}
        for key in AXIS_KEYS:
            cfg = (mapping.get("axes") or {}).get(key) or DEFAULT_AXES[key]
            source = cfg.get("source", DEFAULT_AXES[key]["source"])
            value = self._calibrated(index, key, _axis_raw(state, source))
            if cfg.get("invert"):
                value = -value
            axes[key] = _axis(value)

        triggers = {}
        for key in TRIGGER_KEYS:
            cfg = (mapping.get("triggers") or {}).get(key) or DEFAULT_TRIGGERS[key]
            source = cfg.get("source", DEFAULT_TRIGGERS[key]["source"])
            if source in ("lZ-low", "lZ-high"):
                # Shared trigger axis centred at 32767: one direction is LT,
                # the other RT. Do not run the generic auto-calibration here.
                raw = state.lZ
                delta = (32767 - raw) if source == "lZ-low" else (raw - 32767)
                value = max(0.0, min(1.0, delta / 32767.0))
            else:
                value = self._calibrated(
                    index, key, _axis_raw(state, source), trigger=True)
            if cfg.get("invert"):
                value = -value
            triggers[key] = _trigger(value)

        return {
            "index": index,
            "connected": True,
            "packet": int(time.time() * 10),
            "buttons": buttons,
            "axes": axes,
            "rawAxes": {
                "lx": state.lX, "ly": state.lY,
                "rx": state.lRx, "ry": state.lRy,
            },
            "rawButtons": [i for i, pressed in enumerate(state.rgbButtons) if pressed],
            "rawAllAxes": {source: _axis_raw(state, source) for source in AXIS_SOURCES},
            "triggers": triggers,
            "battery": {"type": "unknown", "level": None, "percent": None},
            "mock": False,
            "source": "dinput",
            "deviceName": meta.get("name"),
            "mappingGuid": guid,
        }


def _guid_string(guid: GUID) -> str:
    return (f"{{{guid.Data1:08X}-{guid.Data2:04X}-{guid.Data3:04X}-"
            f"{bytes(guid.Data4[:2]).hex().upper()}-"
            f"{bytes(guid.Data4[2:]).hex().upper()}}}")


_manager: DirectInputManager | None = None
_manager_lock = threading.Lock()


def get_manager() -> DirectInputManager:
    global _manager
    with _manager_lock:
        if _manager is None:
            _manager = DirectInputManager()
        return _manager


def available() -> bool:
    return get_manager().status()["available"]


def error_message() -> str | None:
    return get_manager().status()["error"]


def devices() -> list[dict]:
    return get_manager().status()["devices"]


def read_state(index: int) -> dict | None:
    return get_manager().state(index)


def refresh(wait: bool = False) -> None:
    get_manager().refresh(wait=wait)


def reset_calibration() -> None:
    get_manager().reset_calibration()
