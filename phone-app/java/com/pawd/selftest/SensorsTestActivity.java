package com.pawd.selftest;

import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.hardware.Sensor;
import android.hardware.SensorEvent;
import android.hardware.SensorEventListener;
import android.hardware.SensorManager;
import android.os.BatteryManager;
import android.os.Bundle;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.util.ArrayList;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;

public class SensorsTestActivity extends android.app.Activity implements SensorEventListener {
    private SensorManager sensorManager;
    private final Map<String, TextView> rows = new LinkedHashMap<>();
    private final List<Sensor> active = new ArrayList<>();
    private TextView batteryText;
    private BroadcastReceiver batteryReceiver;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        sensorManager = (SensorManager) getSystemService(Context.SENSOR_SERVICE);

        LinearLayout root = Ui.screen(this);
        Ui.header(this, root, "Sensors & battery",
                "Live readings update while this screen is open. Move the phone to test motion sensors.");

        LinearLayout content = Ui.column(this);

        LinearLayout batteryCard = Ui.card(this);
        batteryCard.addView(Ui.label(this, "BATTERY"));
        batteryText = Ui.text(this, "Reading battery\u2026", 12f, Ui.TEXT);
        batteryText.setPadding(0, Ui.dp(this, 6), 0, 0);
        batteryCard.addView(batteryText);
        content.addView(batteryCard, spaced());

        LinearLayout sensorCard = Ui.card(this);
        sensorCard.addView(Ui.label(this, "SENSORS"));
        TextView help = Ui.text(this,
                "Only sensors reported by this device are listed. Proximity: cover the top of the phone.",
                12f, Ui.MUTED);
        help.setPadding(0, Ui.dp(this, 4), 0, Ui.dp(this, 8));
        sensorCard.addView(help);

        List<Sensor> all = sensorManager.getSensorList(Sensor.TYPE_ALL);
        int shown = 0;
        for (Sensor s : all) {
            if (!isUseful(s.getType())) continue;
            shown++;
            TextView name = Ui.text(this, s.getName(), 13f, Ui.TEXT);
            name.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
            sensorCard.addView(name);

            TextView vendor = Ui.text(this,
                    sensorTypeName(s.getType()) + " \u00b7 " + s.getVendor(),
                    11f, Ui.MUTED);
            sensorCard.addView(vendor);

            TextView value = Ui.text(this, "waiting for data\u2026", 12f, Ui.ACCENT);
            value.setPadding(0, Ui.dp(this, 2), 0, Ui.dp(this, 8));
            sensorCard.addView(value);
            rows.put(s.getName(), value);
            active.add(s);
        }
        if (shown == 0) {
            sensorCard.addView(Ui.text(this, "No common sensors reported.", 12f, Ui.MUTED));
        }
        content.addView(sensorCard, spaced());

        root.addView(Ui.scroll(this, content),
                new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));
        root.addView(Ui.footer(this, "sensors"));
        setContentView(root);

        batteryReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                updateBattery(intent);
            }
        };
    }

    private LinearLayout.LayoutParams spaced() {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT);
        lp.bottomMargin = Ui.dp(this, 10);
        return lp;
    }

    private boolean isUseful(int type) {
        switch (type) {
            case Sensor.TYPE_ACCELEROMETER:
            case Sensor.TYPE_GYROSCOPE:
            case Sensor.TYPE_MAGNETIC_FIELD:
            case Sensor.TYPE_LIGHT:
            case Sensor.TYPE_PROXIMITY:
            case Sensor.TYPE_PRESSURE:
            case Sensor.TYPE_RELATIVE_HUMIDITY:
            case Sensor.TYPE_AMBIENT_TEMPERATURE:
            case Sensor.TYPE_GRAVITY:
            case Sensor.TYPE_LINEAR_ACCELERATION:
            case Sensor.TYPE_ROTATION_VECTOR:
            case Sensor.TYPE_GAME_ROTATION_VECTOR:
            case Sensor.TYPE_GEOMAGNETIC_ROTATION_VECTOR:
                return true;
            default:
                return false;
        }
    }

    private String sensorTypeName(int type) {
        switch (type) {
            case Sensor.TYPE_ACCELEROMETER: return "Accelerometer";
            case Sensor.TYPE_GYROSCOPE: return "Gyroscope";
            case Sensor.TYPE_MAGNETIC_FIELD: return "Magnetometer";
            case Sensor.TYPE_LIGHT: return "Light";
            case Sensor.TYPE_PROXIMITY: return "Proximity";
            case Sensor.TYPE_PRESSURE: return "Pressure";
            case Sensor.TYPE_RELATIVE_HUMIDITY: return "Humidity";
            case Sensor.TYPE_AMBIENT_TEMPERATURE: return "Temperature";
            case Sensor.TYPE_GRAVITY: return "Gravity";
            case Sensor.TYPE_LINEAR_ACCELERATION: return "Linear acceleration";
            case Sensor.TYPE_ROTATION_VECTOR: return "Rotation vector";
            case Sensor.TYPE_GAME_ROTATION_VECTOR: return "Game rotation";
            case Sensor.TYPE_GEOMAGNETIC_ROTATION_VECTOR: return "Geomagnetic rotation";
            default: return "Sensor " + type;
        }
    }

    private String unit(int type) {
        switch (type) {
            case Sensor.TYPE_ACCELEROMETER:
            case Sensor.TYPE_GRAVITY:
            case Sensor.TYPE_LINEAR_ACCELERATION:
                return " m/s^2";
            case Sensor.TYPE_GYROSCOPE:
                return " rad/s";
            case Sensor.TYPE_MAGNETIC_FIELD:
                return " uT";
            case Sensor.TYPE_LIGHT:
                return " lx";
            case Sensor.TYPE_PROXIMITY:
                return " cm";
            case Sensor.TYPE_PRESSURE:
                return " hPa";
            case Sensor.TYPE_RELATIVE_HUMIDITY:
                return " %";
            case Sensor.TYPE_AMBIENT_TEMPERATURE:
                return " C";
            default:
                return "";
        }
    }

    @Override
    public void onSensorChanged(SensorEvent event) {
        TextView row = rows.get(event.sensor.getName());
        if (row == null) return;
        StringBuilder sb = new StringBuilder();
        for (int i = 0; i < event.values.length; i++) {
            if (i > 0) sb.append("  ");
            sb.append(String.format(Locale.US, "%.2f", event.values[i]));
        }
        sb.append(unit(event.sensor.getType()));
        final String text = sb.toString();
        runOnUiThread(() -> row.setText(text));
    }

    @Override
    public void onAccuracyChanged(Sensor sensor, int accuracy) {}

    private void updateBattery(Intent intent) {
        int level = intent.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
        int scale = intent.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
        int pct = scale > 0 ? level * 100 / scale : level;

        int status = intent.getIntExtra(BatteryManager.EXTRA_STATUS, -1);
        String statusText;
        switch (status) {
            case BatteryManager.BATTERY_STATUS_CHARGING: statusText = "Charging"; break;
            case BatteryManager.BATTERY_STATUS_DISCHARGING: statusText = "Discharging"; break;
            case BatteryManager.BATTERY_STATUS_FULL: statusText = "Full"; break;
            case BatteryManager.BATTERY_STATUS_NOT_CHARGING: statusText = "Not charging"; break;
            default: statusText = "Unknown"; break;
        }

        int plugged = intent.getIntExtra(BatteryManager.EXTRA_PLUGGED, 0);
        String plugText;
        switch (plugged) {
            case BatteryManager.BATTERY_PLUGGED_AC: plugText = "AC"; break;
            case BatteryManager.BATTERY_PLUGGED_USB: plugText = "USB"; break;
            case BatteryManager.BATTERY_PLUGGED_WIRELESS: plugText = "Wireless"; break;
            default: plugText = "Unplugged"; break;
        }

        int temp = intent.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 0);
        int voltage = intent.getIntExtra(BatteryManager.EXTRA_VOLTAGE, 0);
        String tech = intent.getStringExtra(BatteryManager.EXTRA_TECHNOLOGY);

        String text = pct + "%  \u00b7  " + statusText + "  \u00b7  " + plugText
                + "\nTemperature: " + String.format(Locale.US, "%.1f", temp / 10.0) + " C"
                + "  \u00b7  Voltage: " + voltage + " mV"
                + (tech != null ? "\nTechnology: " + tech : "");
        batteryText.setText(text);
    }

    @Override
    protected void onResume() {
        super.onResume();
        for (Sensor s : active) {
            sensorManager.registerListener(this, s, SensorManager.SENSOR_DELAY_UI);
        }
        if (batteryReceiver != null) {
            registerReceiver(batteryReceiver, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        sensorManager.unregisterListener(this);
        if (batteryReceiver != null) {
            try { unregisterReceiver(batteryReceiver); } catch (Exception ignored) {}
        }
    }
}
