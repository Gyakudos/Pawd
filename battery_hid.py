"""Read-only HID battery telemetry for supported controllers.

Currently supports the Sony DualSense (VID 054C / PID 0CE6) on USB and
Bluetooth. All opens are read-only and only GET_REPORT / GET_FEATURE requests
are issued; nothing is written to the controller.
"""

from __future__ import annotations

import ctypes
from ctypes import wintypes

setupapi = ctypes.WinDLL("setupapi", use_last_error=True)
hid = ctypes.WinDLL("hid", use_last_error=True)
kernel32 = ctypes.WinDLL("kernel32", use_last_error=True)

GENERIC_READ = 0x80000000
FILE_SHARE_READ = 0x00000001
FILE_SHARE_WRITE = 0x00000002
OPEN_EXISTING = 3
DIGCF_PRESENT = 0x00000002
DIGCF_DEVICEINTERFACE = 0x00000010
INVALID_HANDLE_VALUE = ctypes.c_void_p(-1).value
HIDP_STATUS_SUCCESS = 0x00110000

DUALSENSE_VID = 0x054C
DUALSENSE_PID = 0x0CE6


class GUID(ctypes.Structure):
    _fields_ = [
        ("Data1", wintypes.DWORD),
        ("Data2", wintypes.WORD),
        ("Data3", wintypes.WORD),
        ("Data4", ctypes.c_ubyte * 8),
    ]


# GUID_DEVINTERFACE_HID {4D1E55B2-F16F-11CF-88CB-001111000030}
GUID_DEVINTERFACE_HID = GUID(
    0x4D1E55B2, 0xF16F, 0x11CF,
    (0x88, 0xCB, 0x00, 0x11, 0x11, 0x00, 0x00, 0x30),
)


class SP_DEVICE_INTERFACE_DATA(ctypes.Structure):
    _fields_ = [
        ("cbSize", wintypes.DWORD),
        ("InterfaceClassGuid", GUID),
        ("Flags", wintypes.DWORD),
        ("Reserved", ctypes.c_size_t),
    ]


class SP_DEVICE_INTERFACE_DETAIL_DATA_W(ctypes.Structure):
    _fields_ = [
        ("cbSize", wintypes.DWORD),
        ("DevicePath", wintypes.WCHAR * 1),
    ]


class HIDD_ATTRIBUTES(ctypes.Structure):
    _fields_ = [
        ("Size", wintypes.ULONG),
        ("VendorID", wintypes.USHORT),
        ("ProductID", wintypes.USHORT),
        ("VersionNumber", wintypes.USHORT),
    ]


class HIDP_CAPS(ctypes.Structure):
    _fields_ = [
        ("Usage", wintypes.USHORT),
        ("UsagePage", wintypes.USHORT),
        ("InputReportByteLength", wintypes.USHORT),
        ("OutputReportByteLength", wintypes.USHORT),
        ("FeatureReportByteLength", wintypes.USHORT),
        ("Reserved", wintypes.USHORT * 17),
        ("NumberLinkCollectionNodes", wintypes.USHORT),
        ("NumberInputButtonCaps", wintypes.USHORT),
        ("NumberInputValueCaps", wintypes.USHORT),
        ("NumberInputDataIndices", wintypes.USHORT),
        ("NumberOutputButtonCaps", wintypes.USHORT),
        ("NumberOutputValueCaps", wintypes.USHORT),
        ("NumberOutputDataIndices", wintypes.USHORT),
        ("NumberFeatureButtonCaps", wintypes.USHORT),
        ("NumberFeatureValueCaps", wintypes.USHORT),
        ("NumberFeatureDataIndices", wintypes.USHORT),
    ]


setupapi.SetupDiGetClassDevsW.argtypes = [ctypes.POINTER(GUID), wintypes.LPCWSTR,
                                          wintypes.HWND, wintypes.DWORD]
setupapi.SetupDiGetClassDevsW.restype = wintypes.HANDLE
setupapi.SetupDiEnumDeviceInterfaces.argtypes = [wintypes.HANDLE, ctypes.c_void_p,
    ctypes.POINTER(GUID), wintypes.DWORD, ctypes.POINTER(SP_DEVICE_INTERFACE_DATA)]
setupapi.SetupDiEnumDeviceInterfaces.restype = wintypes.BOOL
setupapi.SetupDiGetDeviceInterfaceDetailW.argtypes = [wintypes.HANDLE,
    ctypes.POINTER(SP_DEVICE_INTERFACE_DATA), ctypes.c_void_p, wintypes.DWORD,
    ctypes.POINTER(wintypes.DWORD), ctypes.c_void_p]
setupapi.SetupDiGetDeviceInterfaceDetailW.restype = wintypes.BOOL
setupapi.SetupDiDestroyDeviceInfoList.argtypes = [wintypes.HANDLE]

kernel32.CreateFileW.argtypes = [wintypes.LPCWSTR, wintypes.DWORD, wintypes.DWORD,
    ctypes.c_void_p, wintypes.DWORD, wintypes.DWORD, wintypes.HANDLE]
kernel32.CreateFileW.restype = wintypes.HANDLE
kernel32.CloseHandle.argtypes = [wintypes.HANDLE]
kernel32.ReadFile.argtypes = [wintypes.HANDLE, ctypes.c_void_p, wintypes.DWORD,
    ctypes.POINTER(wintypes.DWORD), ctypes.c_void_p]

hid.HidD_GetAttributes.argtypes = [wintypes.HANDLE, ctypes.POINTER(HIDD_ATTRIBUTES)]
hid.HidD_GetAttributes.restype = wintypes.BOOL
hid.HidD_GetPreparsedData.argtypes = [wintypes.HANDLE, ctypes.POINTER(wintypes.HANDLE)]
hid.HidD_GetPreparsedData.restype = wintypes.BOOL
hid.HidD_FreePreparsedData.argtypes = [wintypes.HANDLE]
hid.HidP_GetCaps.argtypes = [wintypes.HANDLE, ctypes.POINTER(HIDP_CAPS)]
hid.HidP_GetCaps.restype = wintypes.LONG
hid.HidD_GetInputReport.argtypes = [wintypes.HANDLE, ctypes.c_void_p, wintypes.DWORD]
hid.HidD_GetInputReport.restype = wintypes.BOOL
hid.HidD_GetFeature.argtypes = [wintypes.HANDLE, ctypes.c_void_p, wintypes.DWORD]
hid.HidD_GetFeature.restype = wintypes.BOOL


def _interface_paths():
    hdev = setupapi.SetupDiGetClassDevsW(
        ctypes.byref(GUID_DEVINTERFACE_HID), None, None,
        DIGCF_PRESENT | DIGCF_DEVICEINTERFACE)
    if not hdev or hdev == INVALID_HANDLE_VALUE:
        return
    try:
        for i in range(256):
            iface = SP_DEVICE_INTERFACE_DATA()
            iface.cbSize = ctypes.sizeof(SP_DEVICE_INTERFACE_DATA)
            if not setupapi.SetupDiEnumDeviceInterfaces(
                    hdev, None, ctypes.byref(GUID_DEVINTERFACE_HID), i,
                    ctypes.byref(iface)):
                break
            buf = ctypes.create_string_buffer(1024)
            detail = ctypes.cast(buf, ctypes.POINTER(SP_DEVICE_INTERFACE_DETAIL_DATA_W))
            detail.contents.cbSize = ctypes.sizeof(SP_DEVICE_INTERFACE_DETAIL_DATA_W)
            if setupapi.SetupDiGetDeviceInterfaceDetailW(
                    hdev, ctypes.byref(iface), detail, len(buf), None, None):
                # DevicePath is a WCHAR[] of unknown length; read it from the
                # offset immediately after cbSize instead of the 1-element
                # ctypes field.
                yield ctypes.wstring_at(ctypes.addressof(detail.contents) + 4)
    finally:
        setupapi.SetupDiDestroyDeviceInfoList(hdev)


def _open_device(vid, pid):
    for path in _interface_paths():
        handle = kernel32.CreateFileW(
            path, GENERIC_READ, FILE_SHARE_READ | FILE_SHARE_WRITE,
            None, OPEN_EXISTING, 0, None)
        if not handle or handle == INVALID_HANDLE_VALUE:
            continue
        attrs = HIDD_ATTRIBUTES()
        attrs.Size = ctypes.sizeof(HIDD_ATTRIBUTES)
        if hid.HidD_GetAttributes(handle, ctypes.byref(attrs)) and \
                attrs.VendorID == vid and attrs.ProductID == pid:
            prep = wintypes.HANDLE()
            if hid.HidD_GetPreparsedData(handle, ctypes.byref(prep)):
                try:
                    caps = HIDP_CAPS()
                    if hid.HidP_GetCaps(prep, ctypes.byref(caps)) == HIDP_STATUS_SUCCESS:
                        yield handle, caps
                        continue
                finally:
                    hid.HidD_FreePreparsedData(prep)
        kernel32.CloseHandle(handle)


def _read_input(handle, report_id, length):
    if length < 1:
        return None
    buf = (ctypes.c_ubyte * length)()
    buf[0] = report_id
    if hid.HidD_GetInputReport(handle, buf, length):
        return buf
    read = wintypes.DWORD(0)
    if kernel32.ReadFile(handle, buf, length, ctypes.byref(read), None) and read.value >= 1:
        return buf
    return None


def _request_feature(handle, report_id, length):
    if length < 1:
        return False
    buf = (ctypes.c_ubyte * length)()
    buf[0] = report_id
    return bool(hid.HidD_GetFeature(handle, buf, length))


def _parse_dualsense(buf):
    report_id = int(buf[0])
    if report_id == 0x31:
        offset = 54
        transport = "hid-dualsense-bluetooth"
    elif report_id == 0x01:
        offset = 53
        transport = "hid-dualsense-usb"
    else:
        return None
    if len(buf) <= offset:
        return None

    value = int(buf[offset])
    level = value & 0x0F
    charge_state = (value >> 4) & 0x0F
    if level > 10:
        return None

    percent = min(100, level * 10)
    # State 2 means charging complete: the controller is still on power.
    charging = charge_state in (1, 2)
    notes = []
    if charge_state == 2:
        percent = 100
        notes.append("Fully charged")
    elif charge_state in (0xA, 0xB, 0xF):
        labels = {0xA: "abnormal voltage", 0xB: "abnormal temperature",
                  0xF: "charging error"}
        notes.append(labels.get(charge_state, "battery warning"))
    return {
        "percent": percent,
        "charging": charging,
        "source": transport,
        "note": "; ".join(notes) or None,
    }


def is_supported(name: str) -> bool:
    text = (name or "").upper()
    return ("DUALSENSE" in text or ("054C" in text and "0CE6" in text))


def read_battery(name: str | None = None):
    """Return a precise DualSense battery reading, or None if unavailable."""
    for handle, caps in _open_device(DUALSENSE_VID, DUALSENSE_PID):
        try:
            # Bluetooth starts with a truncated report; this GET_FEATURE makes
            # the controller switch to the full 0x31 input report.
            _request_feature(handle, 0x05, caps.FeatureReportByteLength)
            buf = _read_input(handle, 0x01, caps.InputReportByteLength)
            if buf is None:
                continue
            reading = _parse_dualsense(buf)
            if reading:
                return reading
            # Some Bluetooth stacks only answer with the full report ID.
            buf = _read_input(handle, 0x31, caps.InputReportByteLength)
            if buf:
                reading = _parse_dualsense(buf)
                if reading:
                    return reading
        finally:
            kernel32.CloseHandle(handle)
    return None
