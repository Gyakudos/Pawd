"""XInput controller polling, rumble, and a synthetic demo source.

Uses only the Python standard library. XInput is accessed directly through ctypes,
so no PowerShell round-trip is needed for the 5-10 Hz live input panel.
"""

import ctypes
import math
import os
import threading
import time

BUTTON_BITS = {
    "up": 0x0001,
    "down": 0x0002,
    "left": 0x0004,
    "right": 0x0008,
    "start": 0x0010,
    "back": 0x0020,
    "ls": 0x0040,
    "rs": 0x0080,
    "lb": 0x0100,
    "rb": 0x0200,
    "guide": 0x0400,
    "a": 0x1000,
    "b": 0x2000,
    "x": 0x4000,
    "y": 0x8000,
}

DPAD_KEYS = ("up", "down", "left", "right")
CORE_BUTTONS = ("a", "b", "x", "y", "lb", "rb", "ls", "rs", "start", "back")


class XINPUT_GAMEPAD(ctypes.Structure):
    _fields_ = [
        ("wButtons", ctypes.c_ushort),
        ("bLeftTrigger", ctypes.c_ubyte),
        ("bRightTrigger", ctypes.c_ubyte),
        ("sThumbLX", ctypes.c_short),
        ("sThumbLY", ctypes.c_short),
        ("sThumbRX", ctypes.c_short),
        ("sThumbRY", ctypes.c_short),
    ]


class XINPUT_STATE(ctypes.Structure):
    _fields_ = [
        ("dwPacketNumber", ctypes.c_uint32),
        ("Gamepad", XINPUT_GAMEPAD),
    ]


class XINPUT_VIBRATION(ctypes.Structure):
    _fields_ = [
        ("wLeftMotorSpeed", ctypes.c_ushort),
        ("wRightMotorSpeed", ctypes.c_ushort),
    ]


class XINPUT_BATTERY_INFORMATION(ctypes.Structure):
    _fields_ = [
        ("BatteryType", ctypes.c_ubyte),
        ("BatteryLevel", ctypes.c_ubyte),
    ]


_xinput = None
_init_error = None
_rumble_timers = {}
_rumble_lock = threading.Lock()


def _load():
    global _xinput, _init_error
    if _xinput is not None or _init_error is not None:
        return
    if os.name != "nt":
        _init_error = "XInput is only available on Windows"
        return
    dll = None
    for name in ("xinput1_4.dll", "xinput1_3.dll", "xinput9_1_0.dll"):
        try:
            dll = ctypes.WinDLL(name)
            break
        except OSError:
            continue
    if dll is None:
        _init_error = "xinput1_4.dll / xinput1_3.dll not found"
        return

    dll.XInputGetState.argtypes = [ctypes.c_uint32, ctypes.POINTER(XINPUT_STATE)]
    dll.XInputGetState.restype = ctypes.c_uint32
    dll.XInputSetState.argtypes = [ctypes.c_uint32, ctypes.POINTER(XINPUT_VIBRATION)]
    dll.XInputSetState.restype = ctypes.c_uint32
    dll.XInputGetBatteryInformation.argtypes = [
        ctypes.c_uint32, ctypes.c_ubyte, ctypes.POINTER(XINPUT_BATTERY_INFORMATION)
    ]
    dll.XInputGetBatteryInformation.restype = ctypes.c_uint32
    _xinput = dll


def available() -> bool:
    _load()
    return _xinput is not None


def error_message() -> str | None:
    _load()
    return _init_error


def connected_indices() -> list[int]:
    if not available():
        return []
    result = []
    state = XINPUT_STATE()
    for i in range(4):
        try:
            code = _xinput.XInputGetState(i, ctypes.byref(state))
            if code == 0:
                result.append(i)
        except Exception:
            continue
    return result


def _stick(value: int) -> float:
    normalized = max(-1.0, min(1.0, value / 32767.0))
    if abs(normalized) < 0.12:
        return 0.0
    return round(normalized, 3)


def _trigger(value: int) -> float:
    normalized = max(0.0, min(1.0, value / 255.0))
    if normalized < 0.05:
        return 0.0
    return round(normalized, 3)


def _battery(index: int) -> dict:
    info = XINPUT_BATTERY_INFORMATION()
    try:
        code = _xinput.XInputGetBatteryInformation(
            index, 0, ctypes.byref(info))
    except Exception:
        code = 1
    if code != 0:
        return {"type": "unknown", "level": None, "percent": None}
    types = {0: "disconnected", 1: "alkaline", 2: "nimh", 3: "lithium"}
    levels = {0: 0, 1: 33, 2: 66, 3: 100}
    return {
        "type": types.get(info.BatteryType, "unknown"),
        "level": info.BatteryLevel,
        "percent": levels.get(info.BatteryLevel),
    }


def battery(index: int) -> dict:
    """Public battery snapshot for the guided battery test."""
    return _battery(index)


def _normalized(index: int, state: XINPUT_STATE, packet: int) -> dict:
    gamepad = state.Gamepad
    buttons = {name: bool(gamepad.wButtons & bit) for name, bit in BUTTON_BITS.items()}
    return {
        "index": index,
        "connected": True,
        "packet": packet,
        "buttons": buttons,
        "axes": {
            "lx": _stick(gamepad.sThumbLX),
            "ly": _stick(gamepad.sThumbLY),
            "rx": _stick(gamepad.sThumbRX),
            "ry": _stick(gamepad.sThumbRY),
        },
        "rawAxes": {
            "lx": gamepad.sThumbLX,
            "ly": gamepad.sThumbLY,
            "rx": gamepad.sThumbRX,
            "ry": gamepad.sThumbRY,
        },
        "triggers": {
            "lt": _trigger(gamepad.bLeftTrigger),
            "rt": _trigger(gamepad.bRightTrigger),
        },
        "battery": _battery(index),
        "mock": False,
    }


def read_state(index: int) -> dict | None:
    if not available():
        return None
    state = XINPUT_STATE()
    try:
        code = _xinput.XInputGetState(index, ctypes.byref(state))
    except Exception:
        return None
    if code != 0:
        return None
    return _normalized(index, state, state.dwPacketNumber)


def demo_state(index: int = 0) -> dict:
    """Synthetic controller that cycles every button and moves both sticks."""
    t = time.time()
    all_buttons = list(BUTTON_BITS.keys())
    slot = int(t / 0.45) % len(all_buttons)
    buttons = {name: False for name in all_buttons}
    buttons[all_buttons[slot]] = True

    return {
        "index": index,
        "connected": True,
        "packet": int(t * 10),
        "buttons": buttons,
        "axes": {
            "lx": round(math.sin(t * 0.9), 3),
            "ly": round(math.cos(t * 0.7), 3),
            "rx": round(math.sin(t * 1.3 + 1.0), 3),
            "ry": round(math.cos(t * 1.1 + 0.5), 3),
        },
        "rawAxes": {
            "lx": int(math.sin(t * 0.9) * 32767),
            "ly": int(math.cos(t * 0.7) * 32767),
            "rx": int(math.sin(t * 1.3 + 1.0) * 32767),
            "ry": int(math.cos(t * 1.1 + 0.5) * 32767),
        },
        "triggers": {
            "lt": round((math.sin(t * 0.8) + 1) / 2, 3),
            "rt": round((math.cos(t * 0.6) + 1) / 2, 3),
        },
        "battery": {"type": "lithium", "level": 3, "percent": 100},
        "mock": True,
    }


def _set_vibration(index: int, left: float, right: float) -> bool:
    if not available():
        return False
    vibration = XINPUT_VIBRATION(
        max(0, min(65535, int(left * 65535))),
        max(0, min(65535, int(right * 65535))),
    )
    try:
        return _xinput.XInputSetState(index, ctypes.byref(vibration)) == 0
    except Exception:
        return False


def rumble(index: int, left: float, right: float, duration_ms: int) -> bool:
    """Pulse both motors, then stop them after duration_ms."""
    if not _set_vibration(index, left, right):
        return False
    with _rumble_lock:
        old = _rumble_timers.get(index)
        if old:
            old.cancel()
        timer = threading.Timer(max(0.05, duration_ms / 1000.0), _stop_rumble, [index])
        timer.daemon = True
        _rumble_timers[index] = timer
        timer.start()
    return True


def _stop_rumble(index: int) -> None:
    _set_vibration(index, 0.0, 0.0)
    with _rumble_lock:
        _rumble_timers.pop(index, None)
