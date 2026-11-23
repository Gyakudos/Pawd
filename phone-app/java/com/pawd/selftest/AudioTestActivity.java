package com.pawd.selftest;

import android.Manifest;
import android.app.Activity;
import android.content.BroadcastReceiver;
import android.content.Context;
import android.content.Intent;
import android.content.IntentFilter;
import android.content.pm.PackageManager;
import android.media.AudioAttributes;
import android.media.AudioDeviceInfo;
import android.media.AudioFormat;
import android.media.AudioManager;
import android.media.AudioRecord;
import android.media.AudioTrack;
import android.media.MediaPlayer;
import android.media.MediaRecorder;
import android.os.Bundle;
import android.os.Handler;
import android.os.Looper;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ProgressBar;
import android.widget.TextView;

import java.io.File;

public class AudioTestActivity extends Activity {
    private static final int REQ_MIC = 100;

    private AudioManager audioManager;
    private final Handler handler = new Handler(Looper.getMainLooper());

    private TextView speakerStatus;
    private TextView micStatus;
    private TextView headsetStatus;
    private ProgressBar micBar;
    private Button meterBtn;

    private AudioRecord audioRecord;
    private Thread meterThread;
    private volatile boolean meterRunning = false;

    private MediaRecorder recorder;
    private MediaPlayer player;
    private File recordFile;

    private BroadcastReceiver routeReceiver;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        audioManager = (AudioManager) getSystemService(Context.AUDIO_SERVICE);

        LinearLayout root = Ui.screen(this);
        Ui.header(this, root, "Speaker & microphone",
                "Play routed tones, watch the live mic level, and check headset routing.");

        LinearLayout scrollContent = Ui.column(this);

        LinearLayout speakerCard = Ui.card(this);
        speakerCard.addView(Ui.label(this, "SPEAKER / EARPIECE"));
        TextView speakerHelp = Ui.text(this,
                "Hold the phone to your ear for the earpiece test. Use both channels to check stereo separation.",
                12f, Ui.MUTED);
        speakerHelp.setPadding(0, Ui.dp(this, 4), 0, Ui.dp(this, 10));
        speakerCard.addView(speakerHelp);

        LinearLayout toneRow = Ui.row(this);
        Button left = Ui.button(this, "Left", 0xFF334155);
        Button right = Ui.button(this, "Right", 0xFF334155);
        Button both = Ui.button(this, "Both", Ui.ACCENT);
        Button earpiece = Ui.button(this, "Earpiece", 0xFF334155);
        left.setOnClickListener(v -> playTone(true, false, false, "Left channel"));
        right.setOnClickListener(v -> playTone(false, true, false, "Right channel"));
        both.setOnClickListener(v -> playTone(true, true, false, "Both channels"));
        earpiece.setOnClickListener(v -> playTone(true, true, true, "Earpiece"));
        toneRow.addView(left);
        toneRow.addView(right);
        toneRow.addView(both);
        toneRow.addView(earpiece);
        speakerCard.addView(toneRow);

        speakerStatus = Ui.text(this, "Ready.", 12f, Ui.MUTED);
        speakerStatus.setPadding(0, Ui.dp(this, 8), 0, 0);
        speakerCard.addView(speakerStatus);
        scrollContent.addView(speakerCard, spaced());

        LinearLayout micCard = Ui.card(this);
        micCard.addView(Ui.label(this, "MICROPHONE"));
        TextView micHelp = Ui.text(this,
                "Speak or tap near the mic. The bar should move with sound. Record and playback checks the full path.",
                12f, Ui.MUTED);
        micHelp.setPadding(0, Ui.dp(this, 4), 0, Ui.dp(this, 10));
        micCard.addView(micHelp);

        micBar = new ProgressBar(this, null, android.R.attr.progressBarStyleHorizontal);
        micBar.setMax(100);
        micBar.setProgressTintList(android.content.res.ColorStateList.valueOf(Ui.ACCENT));
        LinearLayout.LayoutParams blp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, Ui.dp(this, 10));
        blp.bottomMargin = Ui.dp(this, 10);
        micCard.addView(micBar, blp);

        LinearLayout micRow = Ui.row(this);
        meterBtn = Ui.button(this, "Start level meter", Ui.ACCENT);
        meterBtn.setOnClickListener(v -> {
            if (meterRunning) stopMeter();
            else startMeter();
        });
        Button recordBtn = Ui.button(this, "Record 3s & play", 0xFF334155);
        recordBtn.setOnClickListener(v -> recordAndPlay());
        micRow.addView(meterBtn);
        LinearLayout.LayoutParams rlp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        rlp.leftMargin = Ui.dp(this, 8);
        micRow.addView(recordBtn, rlp);
        micCard.addView(micRow);

        micStatus = Ui.text(this, "Microphone not started.", 12f, Ui.MUTED);
        micStatus.setPadding(0, Ui.dp(this, 8), 0, 0);
        micCard.addView(micStatus);
        scrollContent.addView(micCard, spaced());

        LinearLayout routeCard = Ui.card(this);
        routeCard.addView(Ui.label(this, "AUDIO ROUTING"));
        headsetStatus = Ui.text(this, "Checking...", 12f, Ui.TEXT);
        headsetStatus.setPadding(0, Ui.dp(this, 6), 0, 0);
        routeCard.addView(headsetStatus);
        scrollContent.addView(routeCard, spaced());

        root.addView(Ui.scroll(this, scrollContent),
                new LinearLayout.LayoutParams(ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f));
        root.addView(Ui.footer(this, "audio"));
        setContentView(root);

        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_MIC);
        }

        routeReceiver = new BroadcastReceiver() {
            @Override
            public void onReceive(Context context, Intent intent) {
                updateRoutes();
            }
        };
        updateRoutes();
    }

    private LinearLayout.LayoutParams spaced() {
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        lp.bottomMargin = Ui.dp(this, 10);
        return lp;
    }

    private void playTone(boolean left, boolean right, boolean earpiece, String label) {
        final int sampleRate = 44100;
        final int durationMs = 1400;
        final int frames = sampleRate * durationMs / 1000;

        int previousMode = audioManager.getMode();
        boolean previousSpeaker = audioManager.isSpeakerphoneOn();

        if (earpiece) {
            audioManager.setMode(AudioManager.MODE_IN_COMMUNICATION);
            audioManager.setSpeakerphoneOn(false);
        } else {
            audioManager.setMode(AudioManager.MODE_NORMAL);
            audioManager.setSpeakerphoneOn(true);
        }

        AudioAttributes attrs = new AudioAttributes.Builder()
                .setUsage(earpiece
                        ? AudioAttributes.USAGE_VOICE_COMMUNICATION
                        : AudioAttributes.USAGE_MEDIA)
                .setContentType(earpiece
                        ? AudioAttributes.CONTENT_TYPE_SPEECH
                        : AudioAttributes.CONTENT_TYPE_MUSIC)
                .build();

        short[] buffer = new short[frames * 2];
        for (int i = 0; i < frames; i++) {
            double t = i / (double) sampleRate;
            short v = (short) (Math.sin(2.0 * Math.PI * 440.0 * t) * 9000);
            buffer[i * 2] = left ? v : 0;
            buffer[i * 2 + 1] = right ? v : 0;
        }

        try {
            AudioTrack track = new AudioTrack.Builder()
                    .setAudioAttributes(attrs)
                    .setAudioFormat(new AudioFormat.Builder()
                            .setEncoding(AudioFormat.ENCODING_PCM_16BIT)
                            .setSampleRate(sampleRate)
                            .setChannelMask(AudioFormat.CHANNEL_OUT_STEREO)
                            .build())
                    .setBufferSizeInBytes(buffer.length * 2)
                    .setTransferMode(AudioTrack.MODE_STATIC)
                    .build();
            track.write(buffer, 0, buffer.length);
            track.play();
            speakerStatus.setText("Playing " + label + " \u2026");

            handler.postDelayed(() -> {
                try {
                    track.stop();
                } catch (Exception ignored) {}
                track.release();
                audioManager.setMode(previousMode);
                audioManager.setSpeakerphoneOn(previousSpeaker);
                speakerStatus.setText("Ready. Last played: " + label + ".");
            }, durationMs + 120);
        } catch (Exception e) {
            audioManager.setMode(previousMode);
            audioManager.setSpeakerphoneOn(previousSpeaker);
            speakerStatus.setText("Could not play tone: " + e.getMessage());
        }
    }

    private void startMeter() {
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_MIC);
            return;
        }
        stopMeter();
        int min = AudioRecord.getMinBufferSize(44100,
                AudioFormat.CHANNEL_IN_MONO, AudioFormat.ENCODING_PCM_16BIT);
        int bufferSize = Math.max(min, 8192);
        try {
            audioRecord = new AudioRecord(MediaRecorder.AudioSource.MIC,
                    44100, AudioFormat.CHANNEL_IN_MONO,
                    AudioFormat.ENCODING_PCM_16BIT, bufferSize);
        } catch (Exception e) {
            micStatus.setText("Could not open microphone: " + e.getMessage());
            return;
        }
        if (audioRecord.getState() != AudioRecord.STATE_INITIALIZED) {
            micStatus.setText("Microphone unavailable (in use by another app?).");
            audioRecord.release();
            audioRecord = null;
            return;
        }

        meterRunning = true;
        meterBtn.setText("Stop level meter");
        micStatus.setText("Listening\u2026 make some noise.");
        final AudioRecord record = audioRecord;
        record.startRecording();
        meterThread = new Thread(() -> {
            short[] buf = new short[2048];
            while (meterRunning) {
                int n = record.read(buf, 0, buf.length);
                if (n <= 0) continue;
                double sum = 0;
                int peak = 0;
                for (int i = 0; i < n; i++) {
                    int v = buf[i];
                    sum += (double) v * v;
                    peak = Math.max(peak, Math.abs(v));
                }
                final double rms = Math.sqrt(sum / n);
                final int level = (int) Math.min(100, rms / 12000.0 * 100);
                final int peakPct = (int) Math.min(100, peak / 32767.0 * 100);
                handler.post(() -> {
                    micBar.setProgress(level);
                    micStatus.setText("Level: " + level + "%  \u00b7  peak: " + peakPct + "%");
                });
            }
            try {
                record.stop();
            } catch (Exception ignored) {}
            record.release();
        }, "mic-meter");
        meterThread.start();
    }

    private void stopMeter() {
        meterRunning = false;
        meterThread = null;
        audioRecord = null;
        if (meterBtn != null) meterBtn.setText("Start level meter");
        if (micBar != null) micBar.setProgress(0);
    }

    private void recordAndPlay() {
        if (checkSelfPermission(Manifest.permission.RECORD_AUDIO) != PackageManager.PERMISSION_GRANTED) {
            requestPermissions(new String[]{Manifest.permission.RECORD_AUDIO}, REQ_MIC);
            return;
        }
        stopMeter();
        if (player != null) {
            try { player.release(); } catch (Exception ignored) {}
            player = null;
        }
        recordFile = new File(getCacheDir(), "pawd-mic-test.m4a");
        if (recordFile.exists() && !recordFile.delete()) {
            micStatus.setText("Could not replace old recording.");
            return;
        }

        try {
            recorder = new MediaRecorder();
            recorder.setAudioSource(MediaRecorder.AudioSource.MIC);
            recorder.setOutputFormat(MediaRecorder.OutputFormat.MPEG_4);
            recorder.setAudioEncoder(MediaRecorder.AudioEncoder.AAC);
            recorder.setOutputFile(recordFile.getAbsolutePath());
            recorder.prepare();
            recorder.start();
            micStatus.setText("Recording 3 seconds\u2026 speak now.");
            handler.postDelayed(() -> {
                try {
                    if (recorder != null) {
                        recorder.stop();
                        recorder.release();
                        recorder = null;
                    }
                } catch (Exception e) {
                    micStatus.setText("Recording failed: " + e.getMessage());
                    return;
                }
                playRecording();
            }, 3000);
        } catch (Exception e) {
            micStatus.setText("Could not start recording: " + e.getMessage());
            if (recorder != null) {
                try { recorder.release(); } catch (Exception ignored) {}
                recorder = null;
            }
        }
    }

    private void playRecording() {
        try {
            player = new MediaPlayer();
            player.setDataSource(recordFile.getAbsolutePath());
            player.setOnCompletionListener(mp -> {
                micStatus.setText("Playback finished. Did the recording sound clear?");
                try { mp.release(); } catch (Exception ignored) {}
                if (player == mp) player = null;
            });
            player.prepare();
            player.start();
            micStatus.setText("Playing back recording\u2026");
        } catch (Exception e) {
            micStatus.setText("Playback failed: " + e.getMessage());
        }
    }

    private void updateRoutes() {
        if (audioManager == null || headsetStatus == null) return;
        StringBuilder sb = new StringBuilder();
        AudioDeviceInfo[] devices = audioManager.getDevices(AudioManager.GET_DEVICES_OUTPUTS);
        for (AudioDeviceInfo d : devices) {
            if (sb.length() > 0) sb.append('\n');
            sb.append("\u2022 ").append(typeName(d.getType()));
            CharSequence product = d.getProductName();
            if (product != null && product.length() > 0) {
                sb.append(" \u2014 ").append(product);
            }
        }
        if (sb.length() == 0) sb.append("No output devices reported.");
        sb.append("\n\nWired headset: ")
                .append(audioManager.isWiredHeadsetOn() ? "connected" : "not detected");
        sb.append("\nBluetooth A2DP: ")
                .append(audioManager.isBluetoothA2dpOn() ? "connected" : "not connected");
        headsetStatus.setText(sb.toString());
    }

    private String typeName(int type) {
        switch (type) {
            case AudioDeviceInfo.TYPE_BUILTIN_SPEAKER: return "Built-in speaker";
            case AudioDeviceInfo.TYPE_BUILTIN_EARPIECE: return "Built-in earpiece";
            case AudioDeviceInfo.TYPE_WIRED_HEADPHONES: return "Wired headphones";
            case AudioDeviceInfo.TYPE_WIRED_HEADSET: return "Wired headset";
            case AudioDeviceInfo.TYPE_BLUETOOTH_A2DP: return "Bluetooth A2DP";
            case AudioDeviceInfo.TYPE_BLUETOOTH_SCO: return "Bluetooth SCO";
            case AudioDeviceInfo.TYPE_USB_DEVICE: return "USB audio";
            case AudioDeviceInfo.TYPE_USB_HEADSET: return "USB headset";
            case AudioDeviceInfo.TYPE_HDMI: return "HDMI";
            default: return "Device type " + type;
        }
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        if (requestCode == REQ_MIC) {
            boolean granted = grantResults.length > 0
                    && grantResults[0] == PackageManager.PERMISSION_GRANTED;
            micStatus.setText(granted
                    ? "Microphone permission granted. Start the level meter."
                    : "Microphone permission denied.");
        }
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (routeReceiver != null) {
            registerReceiver(routeReceiver, new IntentFilter(AudioManager.ACTION_HEADSET_PLUG));
        }
        updateRoutes();
    }

    @Override
    protected void onPause() {
        super.onPause();
        if (routeReceiver != null) {
            try { unregisterReceiver(routeReceiver); } catch (Exception ignored) {}
        }
    }

    @Override
    protected void onDestroy() {
        super.onDestroy();
        handler.removeCallbacksAndMessages(null);
        stopMeter();
        if (recorder != null) {
            try { recorder.release(); } catch (Exception ignored) {}
            recorder = null;
        }
        if (player != null) {
            try { player.release(); } catch (Exception ignored) {}
            player = null;
        }
        if (audioManager != null) {
            try {
                audioManager.setMode(AudioManager.MODE_NORMAL);
                audioManager.setSpeakerphoneOn(false);
            } catch (Exception ignored) {}
        }
    }
}
