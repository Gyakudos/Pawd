package com.pawd.selftest;

import android.hardware.biometrics.BiometricManager;
import android.hardware.biometrics.BiometricPrompt;
import android.hardware.fingerprint.FingerprintManager;
import android.os.Build;
import android.os.Bundle;
import android.os.CancellationSignal;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public class BiometricTestActivity extends android.app.Activity {
    private TextView status;
    private TextView capability;
    private Button startBtn;
    private CancellationSignal cancellationSignal;
    private boolean ready = false;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        LinearLayout root = Ui.screen(this);
        Ui.header(this, root, "Biometrics",
                "Run a real authentication prompt for the enrolled fingerprint or face.");

        LinearLayout info = Ui.card(this);
        info.addView(Ui.label(this, "HARDWARE STATUS"));
        capability = Ui.text(this, "Checking capability\u2026", 13f, Ui.TEXT);
        capability.setPadding(0, Ui.dp(this, 6), 0, 0);
        info.addView(capability);
        root.addView(info, Ui.matchWrap());

        root.addView(Ui.spacer(this, 10));

        LinearLayout test = Ui.card(this);
        test.addView(Ui.label(this, "AUTHENTICATION TEST"));
        TextView help = Ui.text(this,
                "Press start and complete the system biometric prompt. This is the same prompt used by banking and lock-screen apps.",
                12f, Ui.MUTED);
        help.setPadding(0, Ui.dp(this, 5), 0, Ui.dp(this, 10));
        test.addView(help);

        startBtn = Ui.button(this, "Start biometric test", Ui.ACCENT);
        startBtn.setOnClickListener(v -> startBiometric());
        test.addView(startBtn);

        status = Ui.text(this, "Not started.", 13f, Ui.TEXT);
        status.setPadding(0, Ui.dp(this, 10), 0, 0);
        test.addView(status);
        root.addView(test, Ui.matchWrap());

        root.addView(Ui.spacer(this, 10));

        TextView note = Ui.text(this,
                "If no biometrics are enrolled, add a fingerprint or face in system Settings first. Devices without biometric hardware will report unsupported.",
                12f, Ui.MUTED);
        root.addView(note);

        root.addView(Ui.spacer(this, 8));
        root.addView(Ui.footer(this, "biometric"));
        setContentView(root);

        detectCapability();
    }

    private void detectCapability() {
        String text;
        if (Build.VERSION.SDK_INT >= 30) {
            BiometricManager bm = getSystemService(BiometricManager.class);
            int can = bm == null ? BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE
                    : bm.canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG
                    | BiometricManager.Authenticators.BIOMETRIC_WEAK);
            switch (can) {
                case BiometricManager.BIOMETRIC_SUCCESS:
                    ready = true;
                    text = "Biometric hardware ready and credentials enrolled.";
                    break;
                case BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED:
                    text = "Hardware present, but no fingerprint or face is enrolled. Enroll one in Settings.";
                    break;
                case BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE:
                    text = "Biometric hardware is currently unavailable.";
                    break;
                case BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE:
                    text = "No biometric hardware reported.";
                    break;
                default:
                    text = "Biometrics unavailable (code " + can + ").";
                    break;
            }
        } else if (Build.VERSION.SDK_INT >= 29) {
            BiometricManager bm = getSystemService(BiometricManager.class);
            int can = bm == null ? BiometricManager.BIOMETRIC_ERROR_NO_HARDWARE : bm.canAuthenticate();
            switch (can) {
                case BiometricManager.BIOMETRIC_SUCCESS:
                    ready = true;
                    text = "Biometric hardware ready and credentials enrolled.";
                    break;
                case BiometricManager.BIOMETRIC_ERROR_NONE_ENROLLED:
                    text = "Hardware present, but no fingerprint or face is enrolled. Enroll one in Settings.";
                    break;
                case BiometricManager.BIOMETRIC_ERROR_HW_UNAVAILABLE:
                    text = "Biometric hardware is currently unavailable.";
                    break;
                default:
                    text = "Biometrics unavailable (code " + can + ").";
                    break;
            }
        } else {
            FingerprintManager fm = getSystemService(FingerprintManager.class);
            if (fm == null || !fm.isHardwareDetected()) {
                text = "No fingerprint hardware reported.";
            } else if (!fm.hasEnrolledFingerprints()) {
                text = "Fingerprint hardware present, but no fingerprint is enrolled.";
            } else {
                ready = true;
                text = "Fingerprint hardware ready and enrolled.";
            }
        }
        capability.setText(text);
        startBtn.setEnabled(ready);
        startBtn.setAlpha(ready ? 1f : 0.5f);
    }

    private void startBiometric() {
        status.setText("Waiting for authentication\u2026");
        cancellationSignal = new CancellationSignal();
        if (Build.VERSION.SDK_INT >= 28) {
            BiometricPrompt prompt = new BiometricPrompt.Builder(this)
                    .setTitle("Pawd biometric test")
                    .setSubtitle("Verify fingerprint or face recognition")
                    .setDescription("Touch the sensor or look at the camera to authenticate.")
                    .setNegativeButton("Cancel", getMainExecutor(), (dialog, which) ->
                            status.setText("Authentication cancelled."))
                    .build();
            prompt.authenticate(cancellationSignal, getMainExecutor(),
                    new BiometricPrompt.AuthenticationCallback() {
                        @Override
                        public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
                            status.setText("Authentication succeeded.");
                        }

                        @Override
                        public void onAuthenticationFailed() {
                            status.setText("Not recognized. Try again.");
                        }

                        @Override
                        public void onAuthenticationError(int errorCode, CharSequence errString) {
                            status.setText("Error " + errorCode + ": " + errString);
                        }
                    });
        } else {
            FingerprintManager fm = getSystemService(FingerprintManager.class);
            if (fm == null) {
                status.setText("Fingerprint service unavailable.");
                return;
            }
            fm.authenticate(null, cancellationSignal, 0,
                    new FingerprintManager.AuthenticationCallback() {
                        @Override
                        public void onAuthenticationSucceeded(FingerprintManager.AuthenticationResult result) {
                            status.setText("Authentication succeeded.");
                        }

                        @Override
                        public void onAuthenticationFailed() {
                            status.setText("Not recognized. Try again.");
                        }

                        @Override
                        public void onAuthenticationError(int errorCode, CharSequence errString) {
                            status.setText("Error " + errorCode + ": " + errString);
                        }
                    }, null);
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        if (cancellationSignal != null) {
            cancellationSignal.cancel();
            cancellationSignal = null;
        }
    }
}
