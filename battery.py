"""Controller battery telemetry and guided battery-test sessions.

XInput only exposes a four-step battery level, so those readings are marked as
``coarse``. Device-specific HID feature reports (when available) provide a
``precise`` percentage and charging flag. No battery chemistry label is ever
returned to the UI: LiPo detection is used only to decide which controllers
the battery test applies to.
"""

from __future__ import annotations

import copy
import threading
import time

try:
    import controller as controller_api
except Exception:  # pragma: no cover - defensive
    controller_api = None

try:
    import dinput as dinput_api
except Exception:  # pragma: no cover - defensive
    dinput_api = None

try:
    import battery_hid as battery_hid_api
except Exception:  # pragma: no cover - defensive
    battery_hid_api = None


MAX_SAMPLES = 720
MODES = ("charge", "discharge", "benchmark")
COARSE_STEP = 33  # XInput level 0/33/66/100


def _coarse_percent(level):
    """Map an XInput four-step level to the percentage Pawd already displays."""
    if level is None:
        return None
    return {0: 0, 1: 33, 2: 66, 3: 100}.get(int(level))


def _make_sample(*, at=None, percent=None, level=None, charging=None,
                 source=None, precision="unknown", device=None, note=None,
                 available=True):
    return {
        "at": int(at if at is not None else time.time()),
        "percent": percent,
        "level": level,
        "charging": charging,
        "source": source,
        "precision": precision,
        "device": device,
        "note": note,
        "available": bool(available),
    }


def _xinput_sample(index):
    if not controller_api or not controller_api.available():
        return None
    try:
        info = controller_api.battery(index)
    except Exception:
        return None
    if not info or info.get("type") in (None, "unknown", "disconnected"):
        return None
    percent = info.get("percent")
    if percent is None:
        return None
    return _make_sample(
        percent=percent,
        level=info.get("level"),
        charging=None,
        source="xinput",
        precision="coarse",
        device=f"XInput player {index + 1}",
        note="Windows reports four battery levels; percentages are approximate.",
    )


def _dinput_sample(index):
    if not dinput_api:
        return None
    devices = []
    try:
        devices = dinput_api.devices() or []
    except Exception:
        pass
    if index < 0 or index >= len(devices):
        return None
    name = devices[index].get("name") or ""
    if not name:
        return None

    if battery_hid_api and battery_hid_api.is_supported(name):
        reading = battery_hid_api.read_battery(name)
        if reading:
            return _make_sample(
                percent=reading.get("percent"),
                charging=reading.get("charging"),
                source=reading.get("source", "hid"),
                precision="precise",
                device=name,
                note=reading.get("note"),
            )

    # A DirectInput device with no readable feature report still gets a
    # "present but unsupported" sample so the UI can explain the limitation.
    return _make_sample(
        percent=None,
        source="dinput",
        precision="unsupported",
        device=name,
        note="This controller does not expose a readable battery report to Pawd.",
        available=False,
    )


def _demo_sample():
    return _make_sample(
        percent=100,
        level=3,
        charging=True,
        source="demo",
        precision="simulated",
        device="Demo controller",
        note="Synthetic battery reading; no physical battery is being tested.",
    )


def sample(index=0, source="auto"):
    """Take one battery reading using the same source rules as live input."""
    source = (source or "auto").lower()
    if source not in ("auto", "xinput", "dinput", "demo"):
        source = "auto"

    if source == "demo":
        return _demo_sample()

    if source in ("auto", "xinput"):
        reading = _xinput_sample(index)
        if reading:
            return reading

    if source in ("auto", "dinput"):
        reading = _dinput_sample(index)
        if reading:
            return reading

    return _make_sample(
        source=source or None,
        precision="unavailable",
        note="No controller battery telemetry is available on this player/source.",
        available=False,
    )


def probe(index=0, source="auto"):
    """Quick capability check without starting a test session."""
    reading = sample(index, source)
    return {
        "available": reading["available"],
        "precision": reading["precision"],
        "source": reading["source"],
        "device": reading["device"],
        "percent": reading["percent"],
        "charging": reading["charging"],
        "note": reading["note"],
    }


def _percent(sample_):
    value = sample_.get("percent")
    return float(value) if isinstance(value, (int, float)) else None


def _is_significant(start, end, precision):
    delta = end - start
    threshold = 4 if precision == "precise" else COARSE_STEP
    return abs(delta) >= threshold


def evaluate(samples, mode, duration_ms=0):
    """Summarise a sample series into a pass/fail/inconclusive result."""
    usable = [s for s in samples if _percent(s) is not None]
    if len(usable) < 2:
        return {
            "status": "inconclusive",
            "reason": "Need at least two battery readings to compare.",
        }

    first, last = usable[0], usable[-1]
    start, end = _percent(first), _percent(last)
    delta = int(round(end - start))
    elapsed_ms = max(0, (last["at"] - first["at"]) * 1000)
    precision = last.get("precision") or first.get("precision")
    significant = _is_significant(start, end, precision)
    complete = bool(duration_ms) and elapsed_ms >= duration_ms

    result = {
        "status": "inconclusive",
        "reason": None,
        "startPercent": int(start),
        "endPercent": int(end),
        "delta": delta,
        "elapsedMs": elapsed_ms,
        "precision": precision,
        "complete": complete,
        "estimatedRuntimeMinutes": None,
    }

    if mode == "charge":
        if delta > 0 and significant:
            result["status"] = "pass"
            result["reason"] = "Battery level increased while charging."
        elif complete:
            result["status"] = "fail"
            result["reason"] = "Battery level did not rise during the charge window."
        else:
            result["reason"] = "Waiting for a measurable rise in battery level."
        return result

    if mode in ("discharge", "benchmark"):
        if delta < 0 and significant:
            drop = -delta
            result["status"] = "pass"
            result["reason"] = "Battery level fell while running on battery."
            if drop and elapsed_ms > 0 and mode == "benchmark":
                result["estimatedRuntimeMinutes"] = round(
                    (elapsed_ms / 60000.0) * (100.0 / drop), 1)
        elif complete:
            result["status"] = "fail"
            result["reason"] = "Battery level did not fall during the discharge window."
        else:
            result["reason"] = "Waiting for a measurable drop in battery level."
        return result

    result["reason"] = f"Unknown battery test mode: {mode}"
    return result


class BatterySession:
    """Thread-safe state for one active battery test."""

    def __init__(self):
        self._lock = threading.RLock()
        self._session = {
            "running": False,
            "mode": "discharge",
            "index": 0,
            "source": "auto",
            "startedAt": None,
            "durationMs": 0,
            "intervalMs": 5000,
            "lastSampleAt": 0,
            "samples": [],
            "result": None,
        }

    def status(self):
        with self._lock:
            data = copy.deepcopy(self._session)
        data.pop("lastSampleAt", None)
        data["sampleCount"] = len(data["samples"])
        return data

    def start(self, *, index=0, source="auto", mode="discharge",
              duration_ms=0, interval_ms=5000):
        mode = mode if mode in MODES else "discharge"
        interval_ms = max(1000, min(60000, int(interval_ms)))
        duration_ms = max(0, min(24 * 60 * 60 * 1000, int(duration_ms)))
        reading = sample(index, source)
        now = time.time()
        with self._lock:
            self._session.update({
                "running": True,
                "mode": mode,
                "index": index,
                "source": source,
                "startedAt": int(now),
                "durationMs": duration_ms,
                "intervalMs": interval_ms,
                "lastSampleAt": now,
                "samples": [reading],
                "result": None,
            })
        return self.status()

    def stop(self):
        with self._lock:
            self._session["running"] = False
            samples = list(self._session["samples"])
            mode = self._session["mode"]
            duration = self._session["durationMs"]
        result = evaluate(samples, mode, duration)
        with self._lock:
            self._session["result"] = result
        return self.status()

    def reset(self):
        with self._lock:
            initial = copy.deepcopy(self._session)
            self.__init__()
            self._session["mode"] = initial["mode"]
            self._session["index"] = initial["index"]
            self._session["source"] = initial["source"]
        return self.status()

    def tick(self):
        """Called by the background watcher once per second."""
        with self._lock:
            if not self._session["running"]:
                return
            now = time.time()
            interval = self._session["intervalMs"] / 1000.0
            if now - self._session["lastSampleAt"] < interval:
                return
            index = self._session["index"]
            source = self._session["source"]
            self._session["lastSampleAt"] = now

        reading = sample(index, source)
        with self._lock:
            if not self._session["running"]:
                return
            samples = self._session["samples"]
            samples.append(reading)
            if len(samples) > MAX_SAMPLES:
                del samples[:-MAX_SAMPLES]
            result = evaluate(samples, self._session["mode"],
                              self._session["durationMs"])
            self._session["result"] = result
            if self._session["durationMs"] and result.get("complete"):
                self._session["running"] = False

    def record_manual(self, reading):
        with self._lock:
            samples = self._session["samples"]
            samples.append(reading)
            if len(samples) > MAX_SAMPLES:
                del samples[:-MAX_SAMPLES]
            result = evaluate(samples, self._session["mode"],
                              self._session["durationMs"])
            self._session["result"] = result
        return self.status()


SESSION = BatterySession()
_WATCHER_STARTED = False
_WATCHER_LOCK = threading.Lock()


def start_watcher():
    global _WATCHER_STARTED
    with _WATCHER_LOCK:
        if _WATCHER_STARTED:
            return
        _WATCHER_STARTED = True

    def loop():
        while True:
            try:
                SESSION.tick()
            except Exception as e:
                print(f"[battery] sampler error: {e}")
            time.sleep(1)

    threading.Thread(target=loop, name="pawd-battery-sampler", daemon=True).start()
