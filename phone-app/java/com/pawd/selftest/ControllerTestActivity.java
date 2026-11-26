package com.pawd.selftest;

import android.app.Activity;
import android.graphics.Typeface;
import android.os.Bundle;
import android.os.Handler;
import android.view.InputDevice;
import android.view.KeyEvent;
import android.view.MotionEvent;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class ControllerTestActivity extends Activity {
    private static final float DRIFT_LIMIT = 0.10f;
    private static final long DRIFT_MS = 10000L;

    private static final int[] BUTTON_KEYS = {
            KeyEvent.KEYCODE_BUTTON_A, KeyEvent.KEYCODE_BUTTON_B,
            KeyEvent.KEYCODE_BUTTON_X, KeyEvent.KEYCODE_BUTTON_Y,
            KeyEvent.KEYCODE_BUTTON_L1, KeyEvent.KEYCODE_BUTTON_R1,
            KeyEvent.KEYCODE_BUTTON_L2, KeyEvent.KEYCODE_BUTTON_R2,
            KeyEvent.KEYCODE_BUTTON_SELECT, KeyEvent.KEYCODE_BUTTON_START,
            KeyEvent.KEYCODE_BUTTON_MODE,
            KeyEvent.KEYCODE_BUTTON_THUMBL, KeyEvent.KEYCODE_BUTTON_THUMBR,
            KeyEvent.KEYCODE_DPAD_UP, KeyEvent.KEYCODE_DPAD_DOWN,
            KeyEvent.KEYCODE_DPAD_LEFT, KeyEvent.KEYCODE_DPAD_RIGHT,
    };

    private static final String[] BUTTON_NAMES = {
            "A / Cross", "B / Circle", "X / Square", "Y / Triangle",
            "L1 / LB", "R1 / RB", "L2 / LT", "R2 / RT",
            "Select / Share", "Start / Options", "Mode / PS",
            "L3 / L-click", "R3 / R-click",
            "D-pad up", "D-pad down", "D-pad left", "D-pad right",
    };

    private static final int[] AXES = {
            MotionEvent.AXIS_X, MotionEvent.AXIS_Y,
            MotionEvent.AXIS_Z, MotionEvent.AXIS_RZ,
            MotionEvent.AXIS_RX, MotionEvent.AXIS_RY,
            MotionEvent.AXIS_LTRIGGER, MotionEvent.AXIS_RTRIGGER,
            MotionEvent.AXIS_BRAKE, MotionEvent.AXIS_GAS,
            MotionEvent.AXIS_HAT_X, MotionEvent.AXIS_HAT_Y,
            MotionEvent.AXIS_GENERIC_1, MotionEvent.AXIS_GENERIC_2,
            MotionEvent.AXIS_GENERIC_3, MotionEvent.AXIS_GENERIC_4,
            MotionEvent.AXIS_GENERIC_5, MotionEvent.AXIS_GENERIC_6,
            MotionEvent.AXIS_GENERIC_7, MotionEvent.AXIS_GENERIC_8,
            MotionEvent.AXIS_GENERIC_9, MotionEvent.AXIS_GENERIC_10,
            MotionEvent.AXIS_GENERIC_11, MotionEvent.AXIS_GENERIC_12,
            MotionEvent.AXIS_GENERIC_13, MotionEvent.AXIS_GENERIC_14,
            MotionEvent.AXIS_GENERIC_15, MotionEvent.AXIS_GENERIC_16,
    };

    static final class AxisView {
        final TextView value;
        float normalized;

        AxisView(TextView value) {
            this.value = value;
        }

        void set(float next) {
            normalized = next;
            String sign = next >= 0 ? "+" : "";
            value.setText(sign + String.format(Locale.US, "%.2f", next));
            value.setTextColor(Math.abs(next) > 0.05f ? Ui.GREEN : Ui.TEXT);
            value.setTypeface(Math.abs(next) > 0.05f ? Typeface.DEFAULT_BOLD : Typeface.DEFAULT);
        }
    }

    static final class DeviceCard {
        final int id;
        final String name;
        final int vendorId;
        final int productId;
        final int sources;
        final LinearLayout root;
        final TextView status;
        final Map<Integer, TextView> buttons = new LinkedHashMap<>();
        final Map<Integer, AxisView> axes = new LinkedHashMap<>();
        final Map<Integer, Float> center = new LinkedHashMap<>();
        long lastInputAt;

        DeviceCard(int id, String name, int vendorId, int productId, int sources,
                   LinearLayout root, TextView status) {
            this.id = id;
            this.name = name;
            this.vendorId = vendorId;
            this.productId = productId;
            this.sources = sources;
            this.root = root;
            this.status = status;
        }
    }

    private final Map<Integer, DeviceCard> cards = new LinkedHashMap<>();
    private final List<DeviceCard> ordered = new ArrayList<>();
    private final Handler handler = new Handler();
    private LinearLayout container;
    private TextView statusText;
    private TextView driftText;
    private DeviceCard selected;
    private Runnable driftRunnable;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        LinearLayout root = Ui.screen(this);
        Ui.header(this, root, "Game controllers",
                "Connect a Bluetooth or USB controller, then press buttons and move sticks and triggers.");

        LinearLayout statusCard = Ui.card(this);
        statusText = Ui.text(this, "Scanning for controllers…", 14f, Ui.TEXT);
        statusCard.addView(statusText);

        LinearLayout scanRow = Ui.row(this);
        Button refresh = Ui.button(this, "Refresh devices", Ui.ACCENT);
        refresh.setOnClickListener(v -> refreshDevices());
        scanRow.addView(refresh, Ui.matchWrap());
        statusCard.addView(scanRow);
        root.addView(statusCard);

        root.addView(Ui.spacer(this, 10));

        LinearLayout driftCard = Ui.card(this);
        driftCard.addView(Ui.label(this, "STICK DRIFT CHECK"));
        TextView help = Ui.text(this,
                "Set the current stick positions as center, then keep your hands off the controller for " +
                "10 seconds. Pawd records the largest deviation from center.",
                12f, Ui.MUTED);
        help.setPadding(0, Ui.dp(this, 4), 0, Ui.dp(this, 8));
        driftCard.addView(help);

        LinearLayout driftButtons = Ui.row(this);
        Button setCenter = Ui.button(this, "Set center", Ui.ACCENT);
        Button runDrift = Ui.button(this, "Run 10s drift check", 0xFF334155);
        LinearLayout.LayoutParams left = Ui.weighted(1f);
        left.setMargins(0, 0, Ui.dp(this, 8), 0);
        setCenter.setLayoutParams(left);
        runDrift.setLayoutParams(Ui.weighted(1f));
        setCenter.setOnClickListener(v -> setCenter());
        runDrift.setOnClickListener(v -> runDriftCheck());
        driftButtons.addView(setCenter);
        driftButtons.addView(runDrift);
        driftCard.addView(driftButtons);

        driftText = Ui.text(this, "No controller selected.", 13f, Ui.MUTED);
        driftText.setPadding(0, Ui.dp(this, 8), 0, 0);
        driftCard.addView(driftText);
        root.addView(driftCard);

        root.addView(Ui.spacer(this, 10));

        container = Ui.column(this);
        root.addView(Ui.scroll(this, container),
                new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));
        root.addView(Ui.footer(this, "controllers"));

        setContentView(root);
        refreshDevices();
    }

    @Override
    protected void onDestroy() {
        handler.removeCallbacks(driftRunnable);
        super.onDestroy();
    }

    private void refreshDevices() {
        handler.removeCallbacks(driftRunnable);
        cards.clear();
        ordered.clear();
        container.removeAllViews();
        selected = null;
        driftText.setText("No controller selected.");
        driftText.setTextColor(Ui.MUTED);

        int[] deviceIds = InputDevice.getDeviceIds();
        for (int deviceId : deviceIds) {
            InputDevice device = InputDevice.getDevice(deviceId);
            if (!isController(device)) continue;
            DeviceCard card = buildCard(device);
            cards.put(device.getId(), card);
            ordered.add(card);
            LinearLayout.LayoutParams lp = Ui.matchWrap();
            lp.bottomMargin = Ui.dp(this, 10);
            container.addView(card.root, lp);
            if (selected == null) selected = card;
        }

        if (selected == null) {
            statusText.setText("No controllers detected. Pair or connect one, then tap Refresh devices.");
            statusText.setTextColor(Ui.AMBER);
            return;
        }
        select(selected);
        statusText.setText(ordered.size() + " controller(s) detected. Tap a controller card to select it.");
        statusText.setTextColor(Ui.TEXT);
    }

    private boolean isController(InputDevice device) {
        if (device == null) return false;
        int source = device.getSources();
        int gamepadSources = InputDevice.SOURCE_GAMEPAD | InputDevice.SOURCE_JOYSTICK | InputDevice.SOURCE_DPAD;
        if ((source & gamepadSources) != 0) return true;
        String name = device.getName() == null ? "" : device.getName().toLowerCase(Locale.US);
        return name.contains("controller") || name.contains("gamepad") || name.contains("joystick")
                || name.contains("xbox") || name.contains("dualsense") || name.contains("dualshock")
                || name.contains("switch") || name.contains("wheel");
    }

    private DeviceCard buildCard(InputDevice device) {
        String name = device.getName() == null ? "Input device " + device.getId() : device.getName();
        LinearLayout cardRoot = Ui.card(this);
        cardRoot.setOnClickListener(v -> select(cards.get(device.getId())));

        TextView title = Ui.text(this, name, 16f, Ui.TEXT);
        title.setTypeface(Typeface.DEFAULT_BOLD);
        cardRoot.addView(title);

        TextView status = Ui.text(this, "Waiting for input", 12f, Ui.MUTED);
        cardRoot.addView(status);

        String ids = "id " + device.getId();
        if (device.getVendorId() > 0 || device.getProductId() > 0) {
            ids += " · VID " + hex(device.getVendorId()) + " · PID " + hex(device.getProductId());
        }
        cardRoot.addView(Ui.valueRow(this, "Device", ids));
        cardRoot.addView(Ui.valueRow(this, "Sources", "0x" + Integer.toHexString(device.getSources())));

        DeviceCard card = new DeviceCard(device.getId(), name, device.getVendorId(),
                device.getProductId(), device.getSources(), cardRoot, status);

        cardRoot.addView(Ui.spacer(this, 8));
        cardRoot.addView(Ui.label(this, "BUTTONS"));
        LinearLayout buttonGrid = Ui.column(this);
        for (int i = 0; i < BUTTON_KEYS.length; i += 2) {
            LinearLayout row = Ui.row(this);
            addButtonCell(row, card, BUTTON_KEYS[i], BUTTON_NAMES[i], Ui.weighted(1f));
            if (i + 1 < BUTTON_KEYS.length) {
                LinearLayout.LayoutParams lp = Ui.weighted(1f);
                lp.setMargins(Ui.dp(this, 8), 0, 0, 0);
                addButtonCell(row, card, BUTTON_KEYS[i + 1], BUTTON_NAMES[i + 1], lp);
            }
            buttonGrid.addView(row);
        }
        cardRoot.addView(buttonGrid);

        cardRoot.addView(Ui.spacer(this, 8));
        cardRoot.addView(Ui.label(this, "AXES (deadzone-free, -1.00 to +1.00)"));
        for (int axis : AXES) {
            if (device.getMotionRange(axis) == null) continue;
            LinearLayout row = Ui.row(this);
            TextView label = Ui.text(this, axisName(axis), 13f, Ui.TEXT);
            label.setLayoutParams(Ui.weighted(1f));
            TextView value = Ui.text(this, "+0.00", 13f, Ui.MUTED);
            value.setTypeface(Typeface.MONOSPACE);
            value.setLayoutParams(Ui.weighted(1f));
            row.addView(label);
            row.addView(value);
            cardRoot.addView(row);
            card.axes.put(axis, new AxisView(value));
        }
        if (card.axes.isEmpty()) {
            cardRoot.addView(Ui.text(this, "No motion axes reported by Android.", 12f, Ui.MUTED));
        }
        return card;
    }

    private void addButtonCell(LinearLayout row, DeviceCard card, int key, String label,
                               LinearLayout.LayoutParams lp) {
        LinearLayout cell = Ui.row(this);
        cell.setBackground(Ui.rounded(Ui.PANEL_2, 8, Ui.BORDER));
        cell.setPadding(Ui.dp(this, 8), Ui.dp(this, 6), Ui.dp(this, 8), Ui.dp(this, 6));
        TextView name = Ui.text(this, label, 12f, Ui.TEXT);
        name.setLayoutParams(Ui.weighted(1f));
        TextView state = Ui.text(this, "—", 12f, Ui.MUTED);
        cell.addView(name);
        cell.addView(state);
        cell.setLayoutParams(lp);
        row.addView(cell);
        card.buttons.put(key, state);
    }

    private void select(DeviceCard card) {
        if (card == null) return;
        selected = card;
        handler.removeCallbacks(driftRunnable);
        for (DeviceCard other : ordered) {
            boolean active = other == card;
            other.root.setBackground(Ui.rounded(
                    active ? 0xFF14243A : Ui.PANEL, 14,
                    active ? Ui.ACCENT : Ui.BORDER));
            updateDeviceStatus(other);
        }
        driftText.setText(card.center.isEmpty()
                ? "Selected " + card.name + ". Set center before the drift check."
                : "Selected " + card.name + ". Center is stored.");
        driftText.setTextColor(Ui.MUTED);
    }

    private void updateDeviceStatus(DeviceCard card) {
        if (card.lastInputAt == 0) {
            card.status.setText("Waiting for input");
            card.status.setTextColor(Ui.MUTED);
            return;
        }
        long seconds = Math.max(0, (System.currentTimeMillis() - card.lastInputAt) / 1000);
        card.status.setText((card == selected ? "Selected · " : "") + "Last input " + seconds + "s ago");
        card.status.setTextColor(Ui.GREEN);
    }

    private void setCenter() {
        if (selected == null) {
            driftText.setText("Connect a controller first.");
            driftText.setTextColor(Ui.AMBER);
            return;
        }
        selected.center.clear();
        for (Map.Entry<Integer, AxisView> entry : selected.axes.entrySet()) {
            selected.center.put(entry.getKey(), entry.getValue().normalized);
        }
        driftText.setText("Center stored for " + selected.name + ". Keep hands off, then run the 10s check.");
        driftText.setTextColor(Ui.TEXT);
    }

    private void runDriftCheck() {
        if (selected == null) {
            driftText.setText("Connect a controller first.");
            driftText.setTextColor(Ui.AMBER);
            return;
        }
        if (selected.center.isEmpty()) {
            driftText.setText("Tap Set center first.");
            driftText.setTextColor(Ui.AMBER);
            return;
        }
        handler.removeCallbacks(driftRunnable);
        final DeviceCard target = selected;
        final long until = System.currentTimeMillis() + DRIFT_MS;
        final float[] maxDeviation = {0f};
        driftText.setText("Drift check running for 10s — keep hands off the controller.");
        driftText.setTextColor(Ui.ACCENT);

        driftRunnable = new Runnable() {
            @Override
            public void run() {
                if (target != selected || !cards.containsKey(target.id)) return;
                for (Map.Entry<Integer, AxisView> entry : target.axes.entrySet()) {
                    Float centerValue = target.center.get(entry.getKey());
                    if (centerValue == null) continue;
                    float deviation = Math.abs(entry.getValue().normalized - centerValue);
                    if (deviation > maxDeviation[0]) maxDeviation[0] = deviation;
                }
                if (System.currentTimeMillis() < until) {
                    handler.postDelayed(this, 100);
                    return;
                }
                boolean good = maxDeviation[0] <= DRIFT_LIMIT;
                driftText.setText((good ? "GOOD" : "BAD") + " — max drift "
                        + percent(maxDeviation[0]) + " (limit " + percent(DRIFT_LIMIT) + ")");
                driftText.setTextColor(good ? Ui.GREEN : Ui.RED);
            }
        };
        handler.post(driftRunnable);
    }

    @Override
    public boolean dispatchKeyEvent(KeyEvent event) {
        DeviceCard card = cards.get(event.getDeviceId());
        if (card != null) {
            TextView state = card.buttons.get(event.getKeyCode());
            if (state != null) {
                boolean down = event.getAction() == KeyEvent.ACTION_DOWN;
                state.setText(down ? "pressed" : "—");
                state.setTextColor(down ? Ui.GREEN : Ui.MUTED);
                state.setTypeface(down ? Typeface.DEFAULT_BOLD : Typeface.DEFAULT);
                card.lastInputAt = System.currentTimeMillis();
                updateDeviceStatus(card);
                return true;
            }
        }
        return super.dispatchKeyEvent(event);
    }

    @Override
    public boolean dispatchGenericMotionEvent(MotionEvent event) {
        if (event.getAction() != MotionEvent.ACTION_MOVE) return super.dispatchGenericMotionEvent(event);
        DeviceCard card = cards.get(event.getDeviceId());
        if (card == null || card.axes.isEmpty()) return super.dispatchGenericMotionEvent(event);

        for (Map.Entry<Integer, AxisView> entry : card.axes.entrySet()) {
            entry.getValue().set(normalizedAxis(event, entry.getKey()));
        }
        card.lastInputAt = System.currentTimeMillis();
        updateDeviceStatus(card);
        return true;
    }

    private float normalizedAxis(MotionEvent event, int axis) {
        float raw = event.getAxisValue(axis);
        InputDevice device = event.getDevice();
        InputDevice.MotionRange range = device == null ? null : device.getMotionRange(axis);
        if (range == null) return clamp(raw);
        float min = range.getMin();
        float max = range.getMax();
        if (max <= min) return clamp(raw);
        float center = (min + max) / 2f;
        float half = (max - min) / 2f;
        return clamp((raw - center) / half);
    }

    private float clamp(float value) {
        if (value < -1f) return -1f;
        if (value > 1f) return 1f;
        return value;
    }

    private String axisName(int axis) {
        switch (axis) {
            case MotionEvent.AXIS_X: return "Left stick X";
            case MotionEvent.AXIS_Y: return "Left stick Y";
            case MotionEvent.AXIS_Z: return "Right stick X / 2";
            case MotionEvent.AXIS_RZ: return "Right stick Y / 5";
            case MotionEvent.AXIS_RX: return "Right stick X (alt)";
            case MotionEvent.AXIS_RY: return "Right stick Y (alt)";
            case MotionEvent.AXIS_LTRIGGER: return "Left trigger";
            case MotionEvent.AXIS_RTRIGGER: return "Right trigger";
            case MotionEvent.AXIS_BRAKE: return "Brake / left trigger";
            case MotionEvent.AXIS_GAS: return "Gas / right trigger";
            case MotionEvent.AXIS_HAT_X: return "D-pad hat X";
            case MotionEvent.AXIS_HAT_Y: return "D-pad hat Y";
            default:
                if (axis >= MotionEvent.AXIS_GENERIC_1 && axis <= MotionEvent.AXIS_GENERIC_16) {
                    return "Aux " + (axis - MotionEvent.AXIS_GENERIC_1 + 1);
                }
                return "Axis " + axis;
        }
    }

    private String percent(float value) {
        return String.format(Locale.US, "%.1f%%", value * 100f);
    }

    private String hex(int value) {
        return "0x" + Integer.toHexString(value).toUpperCase(Locale.US);
    }
}
