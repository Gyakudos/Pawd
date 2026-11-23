package com.pawd.selftest;

import android.content.Context;
import android.os.Build;
import android.os.Bundle;
import android.os.VibrationEffect;
import android.os.Vibrator;
import android.os.VibratorManager;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public class VibrationTestActivity extends android.app.Activity {
    private Vibrator vibrator;
    private TextView status;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        vibrator = getVibrator();

        LinearLayout root = Ui.screen(this);
        Ui.header(this, root, "Vibration motor",
                "Feel each pattern in your hand. Check strength and that the motor does not rattle.");

        LinearLayout card = Ui.card(this);
        card.addView(Ui.label(this, "HAPTICS"));

        TextView help = Ui.text(this,
                "Short and long pulses verify basic operation. The pattern checks waveform amplitudes and timing.",
                12f, Ui.MUTED);
        help.setPadding(0, Ui.dp(this, 4), 0, Ui.dp(this, 10));
        card.addView(help);

        Button shortBtn = Ui.button(this, "Short buzz", Ui.ACCENT);
        Button longBtn = Ui.button(this, "Long buzz", 0xFF334155);
        Button patternBtn = Ui.button(this, "Pattern", 0xFF334155);
        Button stopBtn = Ui.button(this, "Stop", Ui.RED);

        shortBtn.setOnClickListener(v -> vibrateOneShot(150, "Short buzz"));
        longBtn.setOnClickListener(v -> vibrateOneShot(1000, "Long buzz"));
        patternBtn.setOnClickListener(v -> vibratePattern());
        stopBtn.setOnClickListener(v -> {
            if (vibrator != null) vibrator.cancel();
            status.setText("Stopped.");
        });

        card.addView(shortBtn, Ui.matchWrap());
        LinearLayout.LayoutParams lp = Ui.matchWrap();
        lp.topMargin = Ui.dp(this, 8);
        card.addView(longBtn, lp);
        LinearLayout.LayoutParams lp2 = Ui.matchWrap();
        lp2.topMargin = Ui.dp(this, 8);
        card.addView(patternBtn, lp2);
        LinearLayout.LayoutParams lp3 = Ui.matchWrap();
        lp3.topMargin = Ui.dp(this, 8);
        card.addView(stopBtn, lp3);

        status = Ui.text(this, "Ready.", 12f, Ui.MUTED);
        status.setPadding(0, Ui.dp(this, 10), 0, 0);
        card.addView(status);

        root.addView(card, Ui.matchWrap());
        root.addView(Ui.footer(this, "vibration"));
        setContentView(root);

        if (vibrator == null || !vibrator.hasVibrator()) {
            status.setText("No vibration motor reported on this device.");
            shortBtn.setEnabled(false);
            longBtn.setEnabled(false);
            patternBtn.setEnabled(false);
        }
    }

    private Vibrator getVibrator() {
        if (Build.VERSION.SDK_INT >= 31) {
            VibratorManager vm = (VibratorManager) getSystemService(Context.VIBRATOR_MANAGER_SERVICE);
            return vm != null ? vm.getDefaultVibrator() : null;
        }
        return (Vibrator) getSystemService(Context.VIBRATOR_SERVICE);
    }

    private void vibrateOneShot(int ms, String label) {
        if (vibrator == null) return;
        try {
            vibrator.vibrate(VibrationEffect.createOneShot(ms, VibrationEffect.DEFAULT_AMPLITUDE));
            status.setText("Playing: " + label + ".");
        } catch (Exception e) {
            status.setText("Vibration failed: " + e.getMessage());
        }
    }

    private void vibratePattern() {
        if (vibrator == null) return;
        try {
            long[] timings = {0, 120, 100, 320, 100, 620};
            int[] amplitudes = {0, 255, 0, 180, 0, 255};
            vibrator.vibrate(VibrationEffect.createWaveform(timings, amplitudes, -1));
            status.setText("Playing patterned vibration.");
        } catch (Exception e) {
            status.setText("Pattern failed: " + e.getMessage());
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (vibrator != null) vibrator.cancel();
    }
}
