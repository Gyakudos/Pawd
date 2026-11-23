"""Fast local Plug and Play enumeration via the Windows SetupAPI.

This replaces the previous per-request PowerShell process, which made Pawd
spawn several powershell.exe instances every few seconds while idle.
"""
import ctypes
import winreg
from ctypes import wintypes

if not hasattr(wintypes, "HWND"):
    wintypes.HWND = wintypes.HANDLE

DIGCF_PRESENT = 0x00000002
DIGCF_ALLCLASSES = 0x00000004
SPDRP_CLASS = 7
SPDRP_DEVICEDESC = 11
SPDRP_FRIENDLYNAME = 12
SPDRP_MFG = 13
INVALID_HANDLE_VALUE = ctypes.c_void_p(-1).value


class GUID(ctypes.Structure):
    _fields_ = [
        ("Data1", wintypes.DWORD),
        ("Data2", wintypes.WORD),
        ("Data3", wintypes.WORD),
        ("Data4", ctypes.c_ubyte * 8),
    ]


class SP_DEVINFO_DATA(ctypes.Structure):
    _fields_ = [
        ("cbSize", wintypes.DWORD),
        ("ClassGuid", GUID),
        ("DevInst", wintypes.DWORD),
        ("Reserved", ctypes.c_void_p),
    ]


_setupapi = None
_init_error = None

try:
    _setupapi = ctypes.WinDLL("setupapi.dll", use_last_error=True)
    _setupapi.SetupDiGetClassDevsW.argtypes = [
        ctypes.c_void_p, wintypes.LPCWSTR, wintypes.HWND, wintypes.DWORD]
    _setupapi.SetupDiGetClassDevsW.restype = ctypes.c_void_p
    _setupapi.SetupDiEnumDeviceInfo.argtypes = [
        ctypes.c_void_p, wintypes.DWORD, ctypes.POINTER(SP_DEVINFO_DATA)]
    _setupapi.SetupDiEnumDeviceInfo.restype = wintypes.BOOL
    _setupapi.SetupDiGetDeviceInstanceIdW.argtypes = [
        ctypes.c_void_p, ctypes.POINTER(SP_DEVINFO_DATA),
        wintypes.LPWSTR, wintypes.DWORD, ctypes.POINTER(wintypes.DWORD)]
    _setupapi.SetupDiGetDeviceInstanceIdW.restype = wintypes.BOOL
    _setupapi.SetupDiGetDeviceRegistryPropertyW.argtypes = [
        ctypes.c_void_p, ctypes.POINTER(SP_DEVINFO_DATA), wintypes.DWORD,
        ctypes.POINTER(wintypes.DWORD), ctypes.c_void_p,
        wintypes.DWORD, ctypes.POINTER(wintypes.DWORD)]
    _setupapi.SetupDiGetDeviceRegistryPropertyW.restype = wintypes.BOOL
    _setupapi.SetupDiDestroyDeviceInfoList.argtypes = [ctypes.c_void_p]
    _setupapi.SetupDiDestroyDeviceInfoList.restype = wintypes.BOOL
except Exception as exc:  # pragma: no cover - non-Windows / broken setupapi
    _init_error = str(exc)


def available() -> bool:
    return _setupapi is not None


def error_message() -> str | None:
    return _init_error


def _instance_id(handle, info) -> str | None:
    needed = wintypes.DWORD(0)
    _setupapi.SetupDiGetDeviceInstanceIdW(
        handle, ctypes.byref(info), None, 0, ctypes.byref(needed))
    if not needed.value:
        return None
    buffer = ctypes.create_unicode_buffer(needed.value)
    if not _setupapi.SetupDiGetDeviceInstanceIdW(
            handle, ctypes.byref(info), buffer, needed.value, ctypes.byref(needed)):
        return None
    return buffer.value


def _registry_string(handle, info, prop: int) -> str | None:
    needed = wintypes.DWORD(0)
    _setupapi.SetupDiGetDeviceRegistryPropertyW(
        handle, ctypes.byref(info), prop, None, None, 0, ctypes.byref(needed))
    if not needed.value or needed.value > 65536:
        return None
    size = max(needed.value, 2)
    buffer = ctypes.create_string_buffer(size)
    if not _setupapi.SetupDiGetDeviceRegistryPropertyW(
            handle, ctypes.byref(info), prop, None, buffer, size,
            ctypes.byref(needed)):
        return None
    return buffer.raw[:needed.value].decode("utf-16-le", "ignore").rstrip("\x00") or None


def _resolved_name(instance: str, fallback: str | None) -> str | None:
    """Read DeviceDesc from the devnode registry key.

    SetupAPI often returns a class-level placeholder such as
    "(Standard system devices)" for HID game controllers, while the registry
    stores the useful indirect string "@input.inf,%...%;HID-compliant game controller".
    """
    if not instance:
        return fallback
    if fallback and not fallback.startswith("(") and fallback != "Microsoft":
        return fallback
    try:
        with winreg.OpenKey(
                winreg.HKEY_LOCAL_MACHINE,
                "SYSTEM\\CurrentControlSet\\Enum\\" + instance) as key:
            value, _ = winreg.QueryValueEx(key, "DeviceDesc")
        if value:
            return value.rsplit(";", 1)[-1] if ";" in value else value
    except OSError:
        pass
    return fallback


def enumerate_devices() -> list[dict]:
    """Return present devices in the same shape as the old PowerShell scan."""
    if _setupapi is None:
        return []
    handle = _setupapi.SetupDiGetClassDevsW(
        None, None, None, DIGCF_PRESENT | DIGCF_ALLCLASSES)
    if not handle or handle == INVALID_HANDLE_VALUE:
        return []
    devices = []
    try:
        index = 0
        while True:
            info = SP_DEVINFO_DATA()
            info.cbSize = ctypes.sizeof(SP_DEVINFO_DATA)
            if not _setupapi.SetupDiEnumDeviceInfo(handle, index, ctypes.byref(info)):
                break
            index += 1
            instance = _instance_id(handle, info)
            if not instance:
                continue
            name = (_registry_string(handle, info, SPDRP_FRIENDLYNAME)
                    or _registry_string(handle, info, SPDRP_DEVICEDESC))
            devices.append({
                "status": "OK",
                "class": _registry_string(handle, info, SPDRP_CLASS) or "",
                "name": _resolved_name(instance, name) or "Unknown device",
                "instanceId": instance,
                "manufacturer": _registry_string(handle, info, SPDRP_MFG),
            })
    finally:
        _setupapi.SetupDiDestroyDeviceInfoList(handle)
    return devices
