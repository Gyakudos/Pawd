package com.pawd.selftest;

import android.os.Bundle;
import android.view.KeyEvent;
import android.widget.LinearLayout;
import android.widget.TextView;

import java.util.LinkedHashMap;
import java.util.Map;

public class ButtonsTestActivity extends android.app.Activity {
    private static final int[] KEYS = {
            KeyEvent.KEYCODE_VOLUME_UP,
            KeyEvent.KEYCODE_VOLUME_DOWN,
            KeyEvent.KEYCODE_CAMERA,
            KeyEvent.KEYCODE_HEADSETHOOK,
    };

    private final Map<Integer, TextView> rows = new LinkedHashMap<>();

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        LinearLayout root = Ui.screen(this);
        Ui.header(this, root, "Buttons & keys",
                "Press each hardware key listed below. The entry turns green when the press is detected.");

        LinearLayout card = Ui.card(this);
        card.addView(Ui.label(this, "HARDWARE KEYS"));

        TextView help = Ui.text(this,
                "Volume up/down are present on almost every phone. Camera and headset keys appear only on " +
                        "some devices. The power button is handled by the system and cannot be captured by apps, " +
                        "so verify it by locking and waking the phone manually.",
                12f, Ui.MUTED);
        help.setPadding(0, Ui.dp(this, 4), 0, Ui.dp(this, 10));
        card.addView(help);

        for (int key : KEYS) {
            addKeyRow(card, key);
        }

        root.addView(Ui.scroll(this, card),
                new LinearLayout.LayoutParams(LinearLayout.LayoutParams.MATCH_PARENT, 0, 1f));
        root.addView(Ui.footer(this, "buttons"));
        setContentView(root);
    }

    private void addKeyRow(LinearLayout parent, int keyCode) {
        LinearLayout row = Ui.row(parent.getContext());
        row.setPadding(0, Ui.dp(this, 6), 0, Ui.dp(this, 6));

        TextView name = Ui.text(this, keyName(keyCode), 14f, Ui.TEXT);
        name.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        row.addView(name, new LinearLayout.LayoutParams(
                0, LinearLayout.LayoutParams.WRAP_CONTENT, 1f));

        TextView state = Ui.text(this, "not pressed", 12f, Ui.MUTED);
        row.addView(state);

        parent.addView(row);
        rows.put(keyCode, state);
    }

    private String keyName(int keyCode) {
        switch (keyCode) {
            case KeyEvent.KEYCODE_VOLUME_UP: return "Volume up";
            case KeyEvent.KEYCODE_VOLUME_DOWN: return "Volume down";
            case KeyEvent.KEYCODE_CAMERA: return "Camera / shutter key";
            case KeyEvent.KEYCODE_HEADSETHOOK: return "Headset hook";
            default: return "Key " + keyCode;
        }
    }

    @Override
    public boolean onKeyDown(int keyCode, KeyEvent event) {
        if (event.getRepeatCount() == 0) {
            TextView state = rows.get(keyCode);
            if (state != null) {
                state.setText("detected \u2713");
                state.setTextColor(Ui.GREEN);
                state.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
            }
        }
        if (rows.containsKey(keyCode)) return true;
        return super.onKeyDown(keyCode, event);
    }
}
