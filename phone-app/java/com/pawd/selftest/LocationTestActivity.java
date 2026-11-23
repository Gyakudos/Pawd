package com.pawd.selftest;

import android.Manifest;
import android.content.Context;
import android.content.pm.PackageManager;
import android.location.GnssStatus;
import android.location.Location;
import android.location.LocationListener;
import android.location.LocationManager;
import android.os.Bundle;
import android.os.Looper;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.util.Locale;

public class LocationTestActivity extends android.app.Activity implements LocationListener {
    private static final int REQ_LOCATION = 300;

    private LocationManager locationManager;
    private TextView status;
    private TextView satellites;
    private Button toggleBtn;
    private boolean listening = false;

    private final GnssStatus.Callback gnssCallback = new GnssStatus.Callback() {
        @Override
        public void onSatelliteStatusChanged(GnssStatus s) {
            int visible = s.getSatelliteCount();
            int used = 0;
            for (int i = 0; i < visible; i++) {
                if (s.usedInFix(i)) used++;
            }
            satellites.setText("GNSS satellites: " + used + " used / " + visible + " visible");
        }
    };

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        locationManager = (LocationManager) getSystemService(Context.LOCATION_SERVICE);

        LinearLayout root = Ui.screen(this);
        Ui.header(this, root, "GPS & location",
                "Go near a window or outdoors. A fresh fix can take 30-60 seconds on a cold start.");

        LinearLayout card = Ui.card(this);
        card.addView(Ui.label(this, "LOCATION FIX"));

        TextView help = Ui.text(this,
                "The test requests high-accuracy GPS and network updates and reports the live fix plus satellite usage.",
                12f, Ui.MUTED);
        help.setPadding(0, Ui.dp(this, 4), 0, Ui.dp(this, 10));
        card.addView(help);

        toggleBtn = Ui.button(this, "Start location updates", Ui.ACCENT);
        toggleBtn.setOnClickListener(v -> {
            if (listening) stopUpdates();
            else startUpdates();
        });
        card.addView(toggleBtn, Ui.matchWrap());

        status = Ui.text(this, "Not started.", 13f, Ui.TEXT);
        status.setPadding(0, Ui.dp(this, 10), 0, 0);
        card.addView(status);

        satellites = Ui.text(this, "GNSS satellites: waiting\u2026", 12f, Ui.MUTED);
        satellites.setPadding(0, Ui.dp(this, 8), 0, 0);
        card.addView(satellites);

        root.addView(card, Ui.matchWrap());
        root.addView(Ui.spacer(this, 10));

        TextView note = Ui.text(this,
                "If location is disabled system-wide, enable it in Settings. Emulators may need a simulated location.",
                12f, Ui.MUTED);
        root.addView(note);

        root.addView(Ui.spacer(this, 8));
        root.addView(Ui.footer(this, "location"));
        setContentView(root);
    }

    private void startUpdates() {
        if (checkSelfPermission(Manifest.permission.ACCESS_FINE_LOCATION)
                != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{
                    Manifest.permission.ACCESS_FINE_LOCATION,
                    Manifest.permission.ACCESS_COARSE_LOCATION
            }, REQ_LOCATION);
            return;
        }

        boolean gpsEnabled = locationManager.isProviderEnabled(LocationManager.GPS_PROVIDER);
        boolean networkEnabled = locationManager.isProviderEnabled(LocationManager.NETWORK_PROVIDER);
        if (!gpsEnabled && !networkEnabled) {
            status.setText("Location services appear disabled. Enable them in Settings.");
            return;
        }

        listening = true;
        toggleBtn.setText("Stop location updates");
        status.setText("Waiting for a fix\u2026");

        try {
            if (gpsEnabled) {
                locationManager.requestLocationUpdates(
                        LocationManager.GPS_PROVIDER, 1000, 0, this, Looper.getMainLooper());
            }
            if (networkEnabled) {
                locationManager.requestLocationUpdates(
                        LocationManager.NETWORK_PROVIDER, 2000, 0, this, Looper.getMainLooper());
            }
            locationManager.registerGnssStatusCallback(gnssCallback);
        } catch (SecurityException e) {
            status.setText("Location permission missing: " + e.getMessage());
            stopUpdates();
            return;
        }

        for (String provider : new String[]{LocationManager.GPS_PROVIDER, LocationManager.NETWORK_PROVIDER}) {
            try {
                Location last = locationManager.getLastKnownLocation(provider);
                if (last != null) {
                    showLocation(last, true);
                    break;
                }
            } catch (SecurityException ignored) {}
        }
    }

    private void stopUpdates() {
        listening = false;
        if (toggleBtn != null) toggleBtn.setText("Start location updates");
        if (locationManager != null) {
            try {
                locationManager.removeUpdates(this);
            } catch (Exception ignored) {}
            try {
                locationManager.unregisterGnssStatusCallback(gnssCallback);
            } catch (Exception ignored) {}
        }
        if (status != null) status.setText("Stopped.");
    }

    private void showLocation(Location l, boolean lastKnown) {
        String text = (lastKnown ? "Last known fix" : "Live fix")
                + "\nProvider: " + l.getProvider()
                + "\nLatitude: " + String.format(Locale.US, "%.6f", l.getLatitude())
                + "\nLongitude: " + String.format(Locale.US, "%.6f", l.getLongitude())
                + "\nAccuracy: " + String.format(Locale.US, "%.1f", l.getAccuracy()) + " m"
                + "\nAltitude: " + String.format(Locale.US, "%.1f", l.getAltitude()) + " m"
                + "\nSpeed: " + String.format(Locale.US, "%.2f", l.getSpeed()) + " m/s"
                + "\nBearing: " + String.format(Locale.US, "%.1f", l.getBearing()) + " deg"
                + "\nAge: " + Math.max(0, (System.currentTimeMillis() - l.getTime()) / 1000) + " s";
        status.setText(text);
    }

    @Override
    public void onLocationChanged(Location location) {
        showLocation(location, false);
    }

    @Override
    public void onProviderDisabled(String provider) {
        if (status != null) status.setText("Provider disabled: " + provider);
    }

    @Override
    public void onProviderEnabled(String provider) {
        if (status != null) status.setText("Provider enabled: " + provider);
    }

    @Override
    public void onStatusChanged(String provider, int statusCode, Bundle extras) {}

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_LOCATION) {
            boolean granted = grantResults.length > 0
                    && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            if (granted) {
                startUpdates();
            } else {
                status.setText("Location permission denied.");
            }
        }
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (listening) stopUpdates();
    }
}
