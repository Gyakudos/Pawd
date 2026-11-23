"""Pawd native desktop launcher.

Starts the local test server in the background and hosts the UI in embedded
WebView2 windows via pywebview, so Pawd behaves like a real desktop app with no
external browser dependency. If the embedded webview is unavailable, it falls
back to opening the UI in the system's default browser (Opera, Chrome, Edge,
Brave, Vivaldi, etc.).
"""
import ctypes
import ctypes.wintypes
import os
import re
import subprocess
import sys
import threading
import time
import urllib.request
import webbrowser
from pathlib import Path

import server

APP_ID = "Pawd.DeviceTest.1"
DEFAULT_PORT = 8766
MAIN_TITLE = "Pawd — Device Test App"
# Match the exact native window title so browser tabs whose titles merely
# start with "Pawd" are never mistaken for a Pawd window.
WINDOW_TITLES = (MAIN_TITLE,)
SINGLE_INSTANCE_MUTEX = r"Local\Pawd_Single_Instance_001_000_000_2026"
CHROMIUM_EXES = {
    "msedge.exe", "chrome.exe", "opera.exe", "brave.exe",
    "vivaldi.exe", "chromium.exe", "msedgewebview2.exe",
}


def runtime_dir() -> Path:
    if getattr(sys, "frozen", False):
        return Path(sys.executable).resolve().parent
    return Path(__file__).resolve().parent


def vendor_dir() -> Path:
    """Local third-party packages (pywebview/pythonnet), kept on drive F."""
    base = Path(getattr(sys, "_MEIPASS", runtime_dir()))
    candidate = base / "vendor"
    return candidate if candidate.is_dir() else runtime_dir() / "vendor"


def profile_dir() -> Path:
    """WebView2 user data stays next to the app on drive F, never in %TEMP%."""
    path = runtime_dir() / "pawd-webview-profile"
    path.mkdir(parents=True, exist_ok=True)
    return path


_MUTEX_HANDLE = None


def acquire_single_instance() -> bool:
    """Return True only for the first running copy of Pawd."""
    global _MUTEX_HANDLE
    try:
        kernel32 = ctypes.windll.kernel32
        kernel32.CreateMutexW.argtypes = [
            ctypes.c_void_p, ctypes.wintypes.BOOL, ctypes.wintypes.LPCWSTR]
        kernel32.CreateMutexW.restype = ctypes.wintypes.HANDLE
        kernel32.GetLastError.restype = ctypes.wintypes.DWORD
        _MUTEX_HANDLE = kernel32.CreateMutexW(None, True, SINGLE_INSTANCE_MUTEX)
        error = kernel32.GetLastError()
        # ERROR_ALREADY_EXISTS means another Pawd already owns the mutex.
        return bool(_MUTEX_HANDLE) and error != 183
    except Exception as e:
        print(f"[pawd] single-instance check unavailable: {e}")
        return True


def setup_output():
    """PyInstaller --noconsole leaves stdout/stderr as None; redirect to a log."""
    path = runtime_dir() / "pawd.log"
    try:
        stream = path.open("a", encoding="utf-8", buffering=1)
    except Exception:
        stream = open(os.devnull, "w")
    sys.stdout = stream
    sys.stderr = stream
    return stream


def icon_path() -> Path:
    base = Path(getattr(sys, "_MEIPASS", runtime_dir()))
    for candidate in (base / "pawd.ico", runtime_dir() / "pawd.ico"):
        if candidate.is_file():
            return candidate
    return base / "pawd.ico"


def set_app_id():
    try:
        ctypes.windll.shell32.SetCurrentProcessExplicitAppUserModelID(APP_ID)
    except Exception:
        pass


def _exe_from_command(command: str) -> str | None:
    command = (command or "").strip()
    if command.startswith('"'):
        end = command.find('"', 1)
        candidate = command[1:end] if end > 1 else ""
    else:
        match = re.match(r"([^\s]+)", command)
        candidate = match.group(1) if match else ""
    return candidate if candidate.lower().endswith(".exe") else None


def default_browser() -> str | None:
    """Resolve the user's default HTTP browser from the Windows UserChoice key."""
    try:
        import winreg
        with winreg.OpenKey(
            winreg.HKEY_CURRENT_USER,
            r"Software\Microsoft\Windows\Shell\Associations\UrlAssociations\http\UserChoice",
        ) as key:
            prog_id, _ = winreg.QueryValueEx(key, "ProgId")
        roots = (
            (winreg.HKEY_CURRENT_USER, r"Software\Classes"),
            (winreg.HKEY_LOCAL_MACHINE, r"SOFTWARE\Classes"),
        )
        for hive, prefix in roots:
            try:
                with winreg.OpenKey(
                    hive, rf"{prefix}\{prog_id}\shell\open\command"
                ) as key:
                    command, _ = winreg.QueryValueEx(key, None)
                exe = _exe_from_command(command)
                if exe and Path(exe).is_file():
                    return exe
            except OSError:
                continue
    except Exception:
        pass
    for candidate in (
        r"C:\Program Files (x86)\Microsoft\Edge\Application\msedge.exe",
        r"C:\Program Files\Microsoft\Edge\Application\msedge.exe",
    ):
        if Path(candidate).is_file():
            return candidate
    return None


def supports_app_mode(browser: str | None) -> bool:
    return bool(browser) and Path(browser).name.lower() in CHROMIUM_EXES


def wait_for_server(port: int, timeout: float = 20.0) -> bool:
    # Probe the static index: /api/controllers performs a full device scan.
    url = f"http://127.0.0.1:{port}/"
    deadline = time.monotonic() + timeout
    while time.monotonic() < deadline:
        try:
            with urllib.request.urlopen(url, timeout=2) as response:
                if response.status == 200:
                    return True
        except Exception:
            time.sleep(0.2)
    return False


def _configure_user32(user32):
    enum_proc = ctypes.WINFUNCTYPE(
        ctypes.c_bool, ctypes.c_void_p, ctypes.c_void_p)
    user32.EnumWindows.argtypes = [enum_proc, ctypes.c_void_p]
    user32.GetWindowTextLengthW.argtypes = [ctypes.c_void_p]
    user32.GetWindowTextLengthW.restype = ctypes.c_int
    user32.GetWindowTextW.argtypes = [
        ctypes.c_void_p, ctypes.c_wchar_p, ctypes.c_int]
    user32.IsWindowVisible.argtypes = [ctypes.c_void_p]
    user32.LoadImageW.argtypes = [
        ctypes.c_void_p, ctypes.c_wchar_p, ctypes.c_uint,
        ctypes.c_int, ctypes.c_int, ctypes.c_uint]
    user32.LoadImageW.restype = ctypes.c_void_p
    user32.SendMessageW.argtypes = [
        ctypes.c_void_p, ctypes.c_uint, ctypes.c_size_t, ctypes.c_size_t]
    user32.SendMessageW.restype = ctypes.c_size_t
    user32.PostMessageW.argtypes = [
        ctypes.c_void_p, ctypes.c_uint, ctypes.c_size_t, ctypes.c_size_t]
    user32.PostMessageW.restype = ctypes.c_bool
    return enum_proc


def pawd_windows():
    try:
        user32 = ctypes.windll.user32
        enum_proc = _configure_user32(user32)
        found = []

        def on_window(handle, _context):
            if user32.IsWindowVisible(handle):
                length = user32.GetWindowTextLengthW(handle)
                if length:
                    title = ctypes.create_unicode_buffer(length + 1)
                    user32.GetWindowTextW(handle, title, length + 1)
                    if title.value in WINDOW_TITLES:
                        found.append((handle, title.value))
            return True

        user32.EnumWindows(enum_proc(on_window), None)
        return found
    except Exception:
        return []


def apply_window_icon(ico_path: Path):
    """Match the app icon on every Pawd window as soon as it appears."""
    if not ico_path.is_file():
        return
    try:
        user32 = ctypes.windll.user32
        _configure_user32(user32)
        handled = set()
        deadline = time.monotonic() + 30.0
        while time.monotonic() < deadline and len(handled) < 1:
            for handle, _title in pawd_windows():
                if handle in handled:
                    continue
                handled.add(handle)
                for which, size in ((1, 32), (0, 16)):  # ICON_BIG, ICON_SMALL
                    icon = user32.LoadImageW(
                        None, str(ico_path), 1, size, size, 0x10)
                    if icon:
                        user32.SendMessageW(handle, 0x0080, which, icon)
            time.sleep(0.5)
    except Exception:
        pass


def enforce_single_window(stop_event: threading.Event):
    """Close duplicate Pawd windows and leave exactly one native window."""
    try:
        user32 = ctypes.windll.user32
        _configure_user32(user32)
        while not stop_event.is_set():
            for handle, _title in pawd_windows()[1:]:
                user32.PostMessageW(handle, 0x0010, 0, 0)  # WM_CLOSE
            stop_event.wait(1.0)
    except Exception as e:
        print(f"[pawd] window enforcement error: {e}")


def run_webview(url: str) -> bool:
    """Host the UI in embedded WebView2 windows; return False if unavailable."""
    vendor = vendor_dir()
    if vendor.is_dir():
        sys.path.insert(0, str(vendor))
    try:
        import webview
    except Exception as e:
        print(f"[pawd] embedded webview unavailable: {e}")
        return False

    try:
        webview.create_window(
            MAIN_TITLE, f"{url}/", width=1360, height=940, on_top=True)
        stop_event = threading.Event()
        threading.Thread(
            target=apply_window_icon, args=(icon_path(),),
            name="pawd-icon", daemon=True,
        ).start()
        threading.Thread(
            target=enforce_single_window, args=(stop_event,),
            name="pawd-window-guard", daemon=True,
        ).start()
        print("[pawd] embedded webview: 1 topmost window, profile on drive F")
        try:
            webview.start(storage_path=str(profile_dir()))
        finally:
            stop_event.set()
        return True
    except Exception as e:
        print(f"[pawd] embedded webview failed: {e}")
        return False


def open_app_window(browser: str, url: str, size: str) -> subprocess.Popen | None:
    if not supports_app_mode(browser):
        webbrowser.open(url)
        return None
    name = Path(browser).name.lower()
    if name == "opera.exe":
        # Opera GX ignores `--app=URL` and opens Speed Dial instead; the
        # space-separated form loads the URL in a dedicated window.
        args = [browser, "--app", url, f"--window-size={size}", "--no-first-run"]
    else:
        args = [
            browser,
            f"--app={url}",
            f"--app-user-model-id={APP_ID}",
            "--no-first-run",
            "--no-default-browser-check",
            "--disable-session-crashed-bubble",
            f"--window-size={size}",
        ]
        if name in ("msedge.exe", "chrome.exe", "chromium.exe", "msedgewebview2.exe"):
            args.append("--disable-features=Translate,msEdgeSplitScreen,msEdgeSidebarV2")
    return subprocess.Popen(
        args,
        stdout=subprocess.DEVNULL,
        stderr=subprocess.DEVNULL,
        stdin=subprocess.DEVNULL,
    )


def monitor_windows(process: subprocess.Popen | None):
    """Keep the server alive while any Pawd window is open."""
    deadline = time.monotonic() + 30.0
    while time.monotonic() < deadline and not pawd_windows():
        time.sleep(0.3)

    seen_window = bool(pawd_windows())
    if not seen_window and process is not None:
        try:
            process.wait(timeout=10)
        except Exception:
            pass

    missing = 0
    while True:
        time.sleep(1)
        if pawd_windows():
            seen_window = True
            missing = 0
            continue
        missing += 1
        if missing >= 3:
            break
        if not seen_window and process is not None and process.poll() is not None:
            break


def main():
    setup_output()
    set_app_id()

    if not acquire_single_instance():
        print("[pawd] another Pawd instance is already running; exiting")
        return

    port = server.resolve_port(DEFAULT_PORT)
    url = f"http://127.0.0.1:{port}"

    if "--server-only" in sys.argv:
        print(f"[pawd] server-only mode on {url}")
        server.main()
        return

    http_server = None
    try:
        http_server = server.create_server(port)
    except OSError as exc:
        print(f"[pawd] port {port} in use ({exc}); opening existing session")

    if http_server is not None:
        threading.Thread(
            target=http_server.serve_forever, name="pawd-http", daemon=True
        ).start()
        print(f"[pawd] server ready at {url}")

    if not wait_for_server(port):
        print("[pawd] server failed to start")
        return

    try:
        embedded = run_webview(url)
    except Exception as e:
        print(f"[pawd] embedded webview error: {e}")
        embedded = False

    if not embedded:
        if "--allow-browser-fallback" not in sys.argv:
            print("[pawd] embedded WebView2 unavailable and browser fallback is disabled")
            print("[pawd] relaunch with --allow-browser-fallback to opt in")
            return
        browser = default_browser()
        print(f"[pawd] default browser fallback: {browser or 'system default'}")
        process = open_app_window(browser, f"{url}/", "1360,940")
        threading.Thread(
            target=apply_window_icon, args=(icon_path(),),
            name="pawd-icon", daemon=True,
        ).start()
        try:
            monitor_windows(process)
        except KeyboardInterrupt:
            pass

    print("[pawd] Pawd windows closed; shutting down server")
    if http_server is not None:
        http_server.shutdown()
        http_server.server_close()


if __name__ == "__main__":
    main()
