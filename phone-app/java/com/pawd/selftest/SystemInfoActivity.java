package com.pawd.selftest;

import android.app.ActivityManager;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.graphics.Point;
import android.hardware.camera2.CameraCharacteristics;
import android.hardware.camera2.CameraManager;
import android.hardware.usb.UsbDevice;
import android.hardware.usb.UsbManager;
import android.net.ConnectivityManager;
import android.net.LinkAddress;
import android.net.LinkProperties;
import android.net.Network;
import android.net.NetworkCapabilities;
import android.net.wifi.WifiManager;
import android.os.BatteryManager;
import android.os.Build;
import android.os.Bundle;
import android.os.Environment;
import android.os.StatFs;
import android.bluetooth.BluetoothAdapter;
import android.bluetooth.BluetoothManager;
import android.nfc.NfcAdapter;
import android.util.DisplayMetrics;
import android.util.Size;
import android.view.Display;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.net.InetAddress;
import java.util.Locale;
import java.util.Map;

public class SystemInfoActivity extends android.app.Activity {
    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        LinearLayout root = Ui.screen(this);
        Ui.header(this, root, "System info & connectivity",
                "Snapshot of hardware, display, memory, battery, network, and feature support.");

        LinearLayout content = Ui.column(this);
        buildContent(content);

        Button refresh = Ui.button(this, "Refresh metrics", 0xFF334155);
        refresh.setOnClickListener(v -> recreate());
        content.addView(refresh, Ui.matchWrap());

        root.addView(Ui.scroll(this, content),
                new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));
        root.addView(Ui.footer(this, "system"));
        setContentView(root);
    }

    private void buildContent(LinearLayout content) {
        PackageManager pm = getPackageManager();

        LinearLayout device = section("DEVICE");
        addRow(device, "Manufacturer", Build.MANUFACTURER);
        addRow(device, "Brand", Build.BRAND);
        addRow(device, "Model", Build.MODEL);
        addRow(device, "Device", Build.DEVICE);
        addRow(device, "Product", Build.PRODUCT);
        addRow(device, "Hardware", Build.HARDWARE);
        addRow(device, "Android", Build.VERSION.RELEASE);
        addRow(device, "SDK", String.valueOf(Build.VERSION.SDK_INT));
        addRow(device, "Security patch", Build.VERSION.SECURITY_PATCH);
        addRow(device, "Build ID", Build.ID);
        addRow(device, "ABIs", String.join(", ", Build.SUPPORTED_ABIS));
        addRow(device, "CPU cores", String.valueOf(Runtime.getRuntime().availableProcessors()));
        content.addView(device, spaced());

        LinearLayout display = section("DISPLAY");
        DisplayMetrics dm = new DisplayMetrics();
        Display d = getWindowManager().getDefaultDisplay();
        d.getRealMetrics(dm);
        double inches = Math.sqrt(
                Math.pow(dm.widthPixels / (double) dm.densityDpi, 2)
                        + Math.pow(dm.heightPixels / (double) dm.densityDpi, 2));
        addRow(display, "Resolution", dm.widthPixels + " x " + dm.heightPixels);
        addRow(display, "Density", dm.densityDpi + " dpi");
        addRow(display, "Approx. size", String.format(Locale.US, "%.2f in", inches));
        addRow(display, "Refresh rate", String.format(Locale.US, "%.1f Hz", d.getRefreshRate()));
        addRow(display, "HDR", hdrTypes(d));
        content.addView(display, spaced());

        ActivityManager am = (ActivityManager) getSystemService(Context.ACTIVITY_SERVICE);
        ActivityManager.MemoryInfo mem = new ActivityManager.MemoryInfo();
        if (am != null) am.getMemoryInfo(mem);
        LinearLayout memory = section("MEMORY");
        addRow(memory, "Total RAM", gb(mem.totalMem));
        addRow(memory, "Available RAM", gb(mem.availMem));
        addRow(memory, "Low RAM device", am != null && am.isLowRamDevice() ? "Yes" : "No");
        content.addView(memory, spaced());

        LinearLayout storage = section("STORAGE");
        try {
            StatFs data = new StatFs(Environment.getDataDirectory().getAbsolutePath());
            addRow(storage, "Data total", gb(data.getTotalBytes()));
            addRow(storage, "Data free", gb(data.getAvailableBytes()));
        } catch (Exception e) {
            addRow(storage, "Data", "Unavailable");
        }
        content.addView(storage, spaced());

        LinearLayout battery = section("BATTERY");
        Intent batt = registerReceiver(null, new IntentFilter(Intent.ACTION_BATTERY_CHANGED));
        if (batt != null) {
            int level = batt.getIntExtra(BatteryManager.EXTRA_LEVEL, -1);
            int scale = batt.getIntExtra(BatteryManager.EXTRA_SCALE, -1);
            int pct = scale > 0 ? level * 100 / scale : level;
            int temp = batt.getIntExtra(BatteryManager.EXTRA_TEMPERATURE, 0);
            int voltage = batt.getIntExtra(BatteryManager.EXTRA_VOLTAGE, 0);
            int health = batt.getIntExtra(BatteryManager.EXTRA_HEALTH, -1);
            addRow(battery, "Level", pct + "%");
            addRow(battery, "Status", batteryStatus(batt.getIntExtra(BatteryManager.EXTRA_STATUS, -1)));
            addRow(battery, "Power", plugged(batt.getIntExtra(BatteryManager.EXTRA_PLUGGED, 0)));
            addRow(battery, "Temperature", String.format(Locale.US, "%.1f C", temp / 10.0));
            addRow(battery, "Voltage", voltage + " mV");
            addRow(battery, "Health", batteryHealth(health));
            String tech = batt.getStringExtra(BatteryManager.EXTRA_TECHNOLOGY);
            if (tech != null) addRow(battery, "Technology", tech);
        } else {
            addRow(battery, "Battery", "Unavailable");
        }
        content.addView(battery, spaced());

        LinearLayout network = section("NETWORK");
        ConnectivityManager cm = (ConnectivityManager) getSystemService(Context.CONNECTIVITY_SERVICE);
        Network active = cm != null ? cm.getActiveNetwork() : null;
        NetworkCapabilities caps = active != null ? cm.getNetworkCapabilities(active) : null;
        if (caps != null) {
            addRow(network, "Transport", transports(caps));
            addRow(network, "Validated", caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_VALIDATED) ? "Yes" : "No");
            addRow(network, "Metered", caps.hasCapability(NetworkCapabilities.NET_CAPABILITY_NOT_METERED) ? "No" : "Yes");
            addRow(network, "Downstream", caps.getLinkDownstreamBandwidthKbps() + " Kbps");
            addRow(network, "Upstream", caps.getLinkUpstreamBandwidthKbps() + " Kbps");
            LinkProperties lp = cm.getLinkProperties(active);
            if (lp != null) {
                StringBuilder addrs = new StringBuilder();
                for (LinkAddress la : lp.getLinkAddresses()) {
                    if (addrs.length() > 0) addrs.append(", ");
                    InetAddress a = la.getAddress();
                    addrs.append(a != null ? a.getHostAddress() : "?");
                }
                addRow(network, "IP addresses", addrs.length() > 0 ? addrs.toString() : "None");
                addRow(network, "Interface", lp.getInterfaceName());
            }
        } else {
            addRow(network, "Active network", "None");
        }
        WifiManager wifi = getApplicationContext().getSystemService(WifiManager.class);
        addRow(network, "Wi-Fi enabled", wifi != null && wifi.isWifiEnabled() ? "Yes" : "No");
        BluetoothManager bm = (BluetoothManager) getSystemService(Context.BLUETOOTH_SERVICE);
        BluetoothAdapter bt = bm != null ? bm.getAdapter() : BluetoothAdapter.getDefaultAdapter();
        addRow(network, "Bluetooth", bt == null ? "Unsupported" : (bt.isEnabled() ? "Enabled" : "Disabled"));
        NfcAdapter nfc = NfcAdapter.getDefaultAdapter(this);
        addRow(network, "NFC", nfc == null ? "Unsupported" : (nfc.isEnabled() ? "Enabled" : "Disabled"));
        content.addView(network, spaced());

        LinearLayout features = section("FEATURES");
        addRow(features, "Touchscreen", feature(pm, PackageManager.FEATURE_TOUCHSCREEN));
        addRow(features, "Fingerprint", feature(pm, PackageManager.FEATURE_FINGERPRINT));
        addRow(features, "Face unlock", feature(pm, PackageManager.FEATURE_FACE));
        addRow(features, "Any camera", feature(pm, PackageManager.FEATURE_CAMERA_ANY));
        addRow(features, "Camera flash", feature(pm, PackageManager.FEATURE_CAMERA_FLASH));
        addRow(features, "GPS", feature(pm, PackageManager.FEATURE_LOCATION_GPS));
        addRow(features, "Telephony", feature(pm, PackageManager.FEATURE_TELEPHONY));
        addRow(features, "USB host", feature(pm, PackageManager.FEATURE_USB_HOST));
        addRow(features, "Low-latency audio", feature(pm, PackageManager.FEATURE_AUDIO_LOW_LATENCY));
        content.addView(features, spaced());

        content.addView(cameraSection(), spaced());
        content.addView(usbSection(), spaced());
    }

    private LinearLayout cameraSection() {
        LinearLayout card = section("CAMERAS");
        CameraManager cam = (CameraManager) getSystemService(Context.CAMERA_SERVICE);
        if (cam == null) {
            addRow(card, "Cameras", "Unavailable");
            return card;
        }
        try {
            String[] ids = cam.getCameraIdList();
            addRow(card, "Camera count", String.valueOf(ids.length));
            for (String id : ids) {
                CameraCharacteristics chars = cam.getCameraCharacteristics(id);
                Integer facing = chars.get(CameraCharacteristics.LENS_FACING);
                Boolean flash = chars.get(CameraCharacteristics.FLASH_INFO_AVAILABLE);
                Size px = chars.get(CameraCharacteristics.SENSOR_INFO_PIXEL_ARRAY_SIZE);
                String name = "Camera " + id + " (" + (facing != null
                        && facing == CameraCharacteristics.LENS_FACING_FRONT ? "front" : "back") + ")";
                StringBuilder value = new StringBuilder();
                if (px != null) {
                    value.append(String.format(Locale.US, "%.1f MP",
                            (px.getWidth() * (double) px.getHeight()) / 1_000_000.0));
                }
                value.append(" \u00b7 flash ").append(Boolean.TRUE.equals(flash) ? "yes" : "no");
                addRow(card, name, value.toString());
            }
        } catch (Exception e) {
            addRow(card, "Cameras", "Error: " + e.getMessage());
        }
        return card;
    }

    private LinearLayout usbSection() {
        LinearLayout card = section("USB");
        UsbManager um = (UsbManager) getSystemService(Context.USB_SERVICE);
        if (um == null) {
            addRow(card, "USB manager", "Unavailable");
            return card;
        }
        Map<String, UsbDevice> devices = um.getDeviceList();
        addRow(card, "Attached USB devices", String.valueOf(devices.size()));
        for (UsbDevice dev : devices.values()) {
            addRow(card, dev.getProductName() != null ? dev.getProductName() : "USB device",
                    String.format(Locale.US, "VID 0x%04X / PID 0x%04X",
                            dev.getVendorId(), dev.getProductId()));
        }
        return card;
    }

    private LinearLayout section(String title) {
        LinearLayout card = Ui.card(this);
        card.addView(Ui.label(this, title));
        return card;
    }

    private LinearLayout.LayoutParams spaced() {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT);
        lp.bottomMargin = Ui.dp(this, 10);
        return lp;
    }

    private void addRow(LinearLayout parent, String key, String value) {
        TextView t = Ui.text(this, key + ": " + (value == null || value.isEmpty() ? "-" : value), 12f, Ui.TEXT);
        t.setPadding(0, Ui.dp(this, 3), 0, Ui.dp(this, 3));
        parent.addView(t);
    }

    private String feature(PackageManager pm, String name) {
        return pm.hasSystemFeature(name) ? "Supported" : "Not reported";
    }

    private String gb(long bytes) {
        return String.format(Locale.US, "%.1f GB", bytes / 1_073_741_824.0);
    }

    private String hdrTypes(Display d) {
        try {
            int[] types = d.getHdrCapabilities().getSupportedHdrTypes();
            if (types == null || types.length == 0) return "None reported";
            StringBuilder sb = new StringBuilder();
            for (int t : types) {
                if (sb.length() > 0) sb.append(", ");
                switch (t) {
                    case Display.HdrCapabilities.HDR_TYPE_DOLBY_VISION: sb.append("Dolby Vision"); break;
                    case Display.HdrCapabilities.HDR_TYPE_HDR10: sb.append("HDR10"); break;
                    case Display.HdrCapabilities.HDR_TYPE_HLG: sb.append("HLG"); break;
                    case Display.HdrCapabilities.HDR_TYPE_HDR10_PLUS: sb.append("HDR10+"); break;
                    default: sb.append("Type ").append(t); break;
                }
            }
            return sb.toString();
        } catch (Exception e) {
            return "Unavailable";
        }
    }

    private String batteryStatus(int status) {
        switch (status) {
            case BatteryManager.BATTERY_STATUS_CHARGING: return "Charging";
            case BatteryManager.BATTERY_STATUS_DISCHARGING: return "Discharging";
            case BatteryManager.BATTERY_STATUS_FULL: return "Full";
            case BatteryManager.BATTERY_STATUS_NOT_CHARGING: return "Not charging";
            default: return "Unknown";
        }
    }

    private String plugged(int p) {
        switch (p) {
            case BatteryManager.BATTERY_PLUGGED_AC: return "AC";
            case BatteryManager.BATTERY_PLUGGED_USB: return "USB";
            case BatteryManager.BATTERY_PLUGGED_WIRELESS: return "Wireless";
            default: return "Unplugged";
        }
    }

    private String batteryHealth(int h) {
        switch (h) {
            case BatteryManager.BATTERY_HEALTH_GOOD: return "Good";
            case BatteryManager.BATTERY_HEALTH_OVERHEAT: return "Overheat";
            case BatteryManager.BATTERY_HEALTH_DEAD: return "Dead";
            case BatteryManager.BATTERY_HEALTH_OVER_VOLTAGE: return "Over voltage";
            case BatteryManager.BATTERY_HEALTH_COLD: return "Cold";
            case BatteryManager.BATTERY_HEALTH_UNSPECIFIED_FAILURE: return "Failure";
            default: return "Unknown";
        }
    }

    private String transports(NetworkCapabilities caps) {
        StringBuilder sb = new StringBuilder();
        if (caps.hasTransport(NetworkCapabilities.TRANSPORT_WIFI)) sb.append("Wi-Fi ");
        if (caps.hasTransport(NetworkCapabilities.TRANSPORT_CELLULAR)) sb.append("Cellular ");
        if (caps.hasTransport(NetworkCapabilities.TRANSPORT_ETHERNET)) sb.append("Ethernet ");
        if (caps.hasTransport(NetworkCapabilities.TRANSPORT_BLUETOOTH)) sb.append("Bluetooth ");
        if (caps.hasTransport(NetworkCapabilities.TRANSPORT_VPN)) sb.append("VPN ");
        if (caps.hasTransport(NetworkCapabilities.TRANSPORT_USB)) sb.append("USB ");
        return sb.length() > 0 ? sb.toString().trim() : "Unknown";
    }
}
