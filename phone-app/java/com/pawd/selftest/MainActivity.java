package com.pawd.selftest;

import android.app.Activity;
import android.content.Intent;
import android.content.res.ColorStateList;
import android.graphics.Typeface;
import android.os.Bundle;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.ScrollView;
import android.widget.TextView;

public class MainActivity extends Activity {
    private static final String[] ALL_IDS = {
            "controllers", "touch", "display", "audio", "camera", "biometric",
            "sensors", "vibration", "buttons", "location", "system"
    };

    private static final TestDef[] TESTS = {
            new TestDef("controllers", "Game controllers",
                    "Detect USB/Bluetooth gamepads and watch every button, stick, and trigger live. Includes a 10s stick drift check.",
                    ControllerTestActivity.class),
            new TestDef("touch", "Touchscreen & multitouch",
                    "Draw across the grid with one or more fingers. Check edges and gesture coverage.",
                    TouchTestActivity.class),
            new TestDef("display", "Display & dead pixels",
                    "Cycle full-screen solid colors to spot dead pixels, tint, or uniformity issues.",
                    DisplayTestActivity.class),
            new TestDef("audio", "Speaker & microphone",
                    "Play left/right tones and watch the live microphone level. Check headset routing.",
                    AudioTestActivity.class),
            new TestDef("camera", "Camera & flashlight",
                    "Preview front/back cameras, take a test photo, and toggle the torch.",
                    CameraTestActivity.class),
            new TestDef("biometric", "Biometrics",
                    "Run a real fingerprint or face authentication prompt and confirm it succeeds.",
                    BiometricTestActivity.class),
            new TestDef("sensors", "Sensors & battery",
                    "Watch live accelerometer, gyroscope, light, proximity, and battery readings.",
                    SensorsTestActivity.class),
            new TestDef("vibration", "Vibration motor",
                    "Trigger short, long, and patterned vibrations to verify haptics.",
                    VibrationTestActivity.class),
            new TestDef("buttons", "Buttons & keys",
                    "Press the volume, camera, and headset keys and confirm each press is detected.",
                    ButtonsTestActivity.class),
            new TestDef("location", "GPS & location",
                    "Request a fresh location fix and inspect provider, accuracy, and satellite data.",
                    LocationTestActivity.class),
            new TestDef("system", "System info & connectivity",
                    "Review device, display, memory, storage, battery, network, and feature support.",
                    SystemInfoActivity.class)
    };

    static class TestDef {
        final String id;
        final String title;
        final String desc;
        final Class<? extends Activity> cls;

        TestDef(String id, String title, String desc, Class<? extends Activity> cls) {
            this.id = id;
            this.title = title;
            this.desc = desc;
            this.cls = cls;
        }
    }

    private LinearLayout list;
    private TextView progressText;
    private ProgressBar progressBar;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        LinearLayout root = Ui.column(this);
        root.setBackgroundColor(Ui.BG);
        root.setPadding(Ui.dp(this, 18), Ui.dp(this, 20), Ui.dp(this, 18), Ui.dp(this, 14));

        root.addView(Ui.label(this, "PAWD ON-DEVICE TESTS"));

        TextView title = Ui.title(this, "Phone Self Test");
        title.setTextSize(28f);
        root.addView(title);

        TextView sub = Ui.text(this,
                "Run through the hardware checks below to verify this phone end to end.",
                13f, Ui.MUTED);
        sub.setPadding(0, Ui.dp(this, 4), 0, Ui.dp(this, 16));
        root.addView(sub);

        LinearLayout progressCard = Ui.card(this);
        LinearLayout progressRow = Ui.row(this);
        progressText = Ui.text(this, "0 of " + TESTS.length + " tested", 14f, Ui.TEXT);
        progressText.setTypeface(Typeface.DEFAULT_BOLD);
        progressRow.addView(progressText, new LinearLayout.LayoutParams(
                0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        TextView reset = Ui.text(this, "Reset", 13f, Ui.ACCENT);
        reset.setPadding(Ui.dp(this, 10), Ui.dp(this, 4), Ui.dp(this, 4), Ui.dp(this, 4));
        reset.setOnClickListener(v -> {
            TestResults.reset(this);
            refresh();
        });
        progressRow.addView(reset);
        progressCard.addView(progressRow);

        progressBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        progressBar.setMax(ALL_IDS.length);
        progressBar.setProgressTintList(ColorStateList.valueOf(Ui.ACCENT));
        LinearLayout.LayoutParams plp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, Ui.dp(this, 8));
        plp.topMargin = Ui.dp(this, 10);
        progressCard.addView(progressBar, plp);
        root.addView(progressCard);

        root.addView(Ui.spacer(this, 12));

        Button start = Ui.button(this, "Start guided test", Ui.ACCENT);
        start.setOnClickListener(v -> {
            for (TestDef t : TESTS) {
                if (!TestResults.PASSED.equals(TestResults.get(this, t.id))) {
                    startActivity(new Intent(this, t.cls));
                    return;
                }
            }
            startActivity(new Intent(this, TESTS[0].cls));
        });
        root.addView(start);

        root.addView(Ui.spacer(this, 14));

        ScrollView sv = new ScrollView(this);
        sv.setClipToPadding(false);
        list = Ui.column(this);
        sv.addView(list, new ScrollView.LayoutParams(
                ScrollView.LayoutParams.MATCH_PARENT,
                ScrollView.LayoutParams.WRAP_CONTENT));
        root.addView(sv, new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));

        TextView footer = Ui.text(this,
                "Results are stored on this phone only. Pair with the Pawd PC app for the full USB walkthrough.",
                11f, Ui.MUTED);
        footer.setPadding(0, Ui.dp(this, 10), 0, 0);
        root.addView(footer);

        setContentView(root);
        refresh();
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (list != null) refresh();
    }

    private void refresh() {
        list.removeAllViews();
        int tested = 0;
        int passed = 0;

        for (TestDef t : TESTS) {
            String status = TestResults.get(this, t.id);
            boolean pass = TestResults.PASSED.equals(status);
            boolean fail = TestResults.FAILED.equals(status);
            if (pass || fail) tested++;
            if (pass) passed++;

            LinearLayout card = Ui.card(this);
            LinearLayout row = Ui.row(this);

            LinearLayout col = Ui.column(this);
            TextView tTitle = Ui.text(this, t.title, 15f, Ui.TEXT);
            tTitle.setTypeface(Typeface.DEFAULT_BOLD);
            col.addView(tTitle);
            TextView tDesc = Ui.text(this, t.desc, 12f, Ui.MUTED);
            tDesc.setPadding(0, Ui.dp(this, 3), 0, 0);
            col.addView(tDesc);
            row.addView(col, new LinearLayout.LayoutParams(
                    0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));

            TextView badge = Ui.text(this,
                    pass ? "PASSED" : fail ? "FAILED" : "NOT TESTED",
                    10f,
                    pass ? Ui.GREEN : fail ? Ui.RED : Ui.MUTED);
            badge.setTypeface(Typeface.DEFAULT_BOLD);
            badge.setBackground(Ui.rounded(
                    pass ? 0x3322C55E : fail ? 0x33F87171 : 0x229CA3AF, 999, 0));
            badge.setPadding(Ui.dp(this, 8), Ui.dp(this, 4), Ui.dp(this, 8), Ui.dp(this, 4));
            row.addView(badge);

            card.addView(row);
            card.setOnClickListener(v -> startActivity(new Intent(this, t.cls)));

            LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                    ViewGroup.LayoutParams.MATCH_PARENT,
                    ViewGroup.LayoutParams.WRAP_CONTENT);
            lp.bottomMargin = Ui.dp(this, 8);
            list.addView(card, lp);
        }

        progressText.setText(tested + " of " + TESTS.length + " tested \u00b7 " + passed + " passed");
        progressBar.setProgress(tested);
        progressBar.setProgressTintList(ColorStateList.valueOf(
                tested == TESTS.length ? (passed == TESTS.length ? Ui.GREEN : Ui.AMBER) : Ui.ACCENT));
    }
}
