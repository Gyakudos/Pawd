package com.pawd.selftest;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.os.Build;
import android.os.Bundle;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.view.WindowInsets;
import android.view.WindowInsetsController;
import android.view.WindowManager;
import android.widget.Button;
import android.widget.FrameLayout;
import android.widget.LinearLayout;
import android.widget.TextView;

public class DisplayTestActivity extends android.app.Activity {
    private static final String[] NAMES = {
            "White", "Black", "Red", "Green", "Blue",
            "Cyan", "Magenta", "Yellow", "Gray", "Gradient"
    };
    private static final int[] COLORS = {
            Color.WHITE, Color.BLACK, 0xFFFF0000, 0xFF00FF00, 0xFF0000FF,
            0xFF00FFFF, 0xFFFF00FF, 0xFFFFFF00, 0xFF808080, 0
    };

    private ColorView colorView;
    private TextView nameView;
    private int index = 0;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().addFlags(WindowManager.LayoutParams.FLAG_KEEP_SCREEN_ON);

        FrameLayout root = new FrameLayout(this);
        root.setBackgroundColor(Color.BLACK);

        colorView = new ColorView(this);
        root.addView(colorView, new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.MATCH_PARENT));

        LinearLayout bar = Ui.row(this);
        bar.setBackgroundColor(0xCC0B1020);
        bar.setPadding(Ui.dp(this, 14), Ui.dp(this, 10),
                Ui.dp(this, 14), Ui.dp(this, 10));

        nameView = Ui.text(this, NAMES[0], 14f, Ui.TEXT);
        nameView.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        bar.addView(nameView, new LinearLayout.LayoutParams(
                0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));

        Button next = Ui.button(this, "Next", Ui.ACCENT);
        next.setOnClickListener(v -> nextColor());
        bar.addView(next);

        Button fail = Ui.button(this, "Fail", Ui.RED);
        fail.setOnClickListener(v -> {
            TestResults.mark(this, "display", TestResults.FAILED);
            finish();
        });
        LinearLayout.LayoutParams flp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        flp.leftMargin = Ui.dp(this, 8);
        bar.addView(fail, flp);

        Button pass = Ui.button(this, "Pass", Ui.GREEN);
        pass.setOnClickListener(v -> {
            TestResults.mark(this, "display", TestResults.PASSED);
            finish();
        });
        LinearLayout.LayoutParams plp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.WRAP_CONTENT, ViewGroup.LayoutParams.WRAP_CONTENT);
        plp.leftMargin = Ui.dp(this, 8);
        bar.addView(pass, plp);

        FrameLayout.LayoutParams barLp = new FrameLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT,
                ViewGroup.LayoutParams.WRAP_CONTENT,
                Gravity.BOTTOM);
        root.addView(bar, barLp);

        colorView.setOnClickListener(v -> nextColor());
        setContentView(root);
        updateColor();
        hideSystemBars();
    }

    @Override
    public void onWindowFocusChanged(boolean hasFocus) {
        super.onWindowFocusChanged(hasFocus);
        if (hasFocus) hideSystemBars();
    }

    private void nextColor() {
        index = (index + 1) % NAMES.length;
        updateColor();
    }

    private void updateColor() {
        if (index >= NAMES.length) index = 0;
        colorView.setColor(COLORS[index]);
        nameView.setText(NAMES[index] + "  (" + (index + 1) + "/" + NAMES.length + ")");
        nameView.setTextColor(Color.WHITE);
        colorView.invalidate();
    }

    private void hideSystemBars() {
        if (Build.VERSION.SDK_INT >= 30) {
            WindowInsetsController c = getWindow().getInsetsController();
            if (c != null) {
                c.hide(WindowInsets.Type.systemBars());
                c.setSystemBarsBehavior(
                        WindowInsetsController.BEHAVIOR_SHOW_TRANSIENT_BARS_BY_SWIPE);
            }
        } else {
            getWindow().getDecorView().setSystemUiVisibility(
                    View.SYSTEM_UI_FLAG_IMMERSIVE_STICKY
                            | View.SYSTEM_UI_FLAG_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_FULLSCREEN
                            | View.SYSTEM_UI_FLAG_LAYOUT_HIDE_NAVIGATION
                            | View.SYSTEM_UI_FLAG_LAYOUT_STABLE);
        }
    }

    private static class ColorView extends View {
        private final Paint paint = new Paint(Paint.ANTI_ALIAS_FLAG);
        private final Paint gradient = new Paint(Paint.ANTI_ALIAS_FLAG);
        private int color = Color.WHITE;

        ColorView(Context c) {
            super(c);
            gradient.setShader(new android.graphics.LinearGradient(
                    0, 0, 1, 1,
                    new int[]{0xFFFF0000, 0xFFFFFF00, 0xFF00FF00,
                            0xFF00FFFF, 0xFF0000FF, 0xFFFF00FF},
                    null, android.graphics.Shader.TileMode.CLAMP));
        }

        void setColor(int c) {
            color = c;
        }

        @Override
        protected void onDraw(Canvas canvas) {
            if (color == 0) {
                gradient.setShader(new android.graphics.LinearGradient(
                        0, 0, getWidth(), getHeight(),
                        new int[]{0xFFFF0000, 0xFFFFFF00, 0xFF00FF00,
                                0xFF00FFFF, 0xFF0000FF, 0xFFFF00FF},
                        null, android.graphics.Shader.TileMode.CLAMP));
                canvas.drawRect(0, 0, getWidth(), getHeight(), gradient);
            } else {
                paint.setColor(color);
                canvas.drawRect(0, 0, getWidth(), getHeight(), paint);
            }
        }
    }
}
