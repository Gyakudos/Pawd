package com.pawd.selftest;

import android.app.Activity;
import android.content.Context;
import android.graphics.drawable.GradientDrawable;
import android.view.Gravity;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.ScrollView;
import android.widget.TextView;

public final class Ui {
    public static final int BG = 0xFF0B1020;
    public static final int PANEL = 0xFF111827;
    public static final int PANEL_2 = 0xFF0F172A;
    public static final int BORDER = 0xFF243041;
    public static final int TEXT = 0xFFE5E7EB;
    public static final int MUTED = 0xFF9CA3AF;
    public static final int ACCENT = 0xFF38BDF8;
    public static final int GREEN = 0xFF22C55E;
    public static final int RED = 0xFFF87171;
    public static final int AMBER = 0xFFFBBF24;

    private Ui() {}

    public static int dp(Context c, float v) {
        return Math.round(v * c.getResources().getDisplayMetrics().density);
    }

    public static GradientDrawable rounded(int fill, int radiusDp, int stroke) {
        GradientDrawable d = new GradientDrawable();
        d.setColor(fill);
        d.setCornerRadius(radiusDp);
        if (stroke != 0) d.setStroke(1, stroke);
        return d;
    }

    public static TextView text(Context c, CharSequence s, float sp, int color) {
        TextView t = new TextView(c);
        t.setText(s);
        t.setTextSize(sp);
        t.setTextColor(color);
        t.setLineSpacing(dp(c, 2), 1f);
        return t;
    }

    public static TextView title(Context c, String s) {
        TextView t = text(c, s, 24f, TEXT);
        t.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        return t;
    }

    public static TextView label(Context c, String s) {
        TextView t = text(c, s, 11f, MUTED);
        t.setAllCaps(true);
        t.setLetterSpacing(0.1f);
        return t;
    }

    public static Button button(Context c, String label, int bg) {
        Button b = new Button(c);
        b.setText(label);
        b.setAllCaps(false);
        b.setTextSize(14f);
        b.setTextColor(bg == ACCENT || bg == GREEN || bg == AMBER ? 0xFF041018 : TEXT);
        b.setBackground(rounded(bg, 10, 0));
        b.setPadding(dp(c, 16), dp(c, 10), dp(c, 16), dp(c, 10));
        b.setMinWidth(0);
        b.setMinimumWidth(0);
        b.setMinHeight(0);
        b.setMinimumHeight(dp(c, 44));
        b.setStateListAnimator(null);
        return b;
    }

    public static LinearLayout column(Context c) {
        LinearLayout l = new LinearLayout(c);
        l.setOrientation(LinearLayout.VERTICAL);
        return l;
    }

    public static LinearLayout row(Context c) {
        LinearLayout l = new LinearLayout(c);
        l.setOrientation(LinearLayout.HORIZONTAL);
        l.setGravity(Gravity.CENTER_VERTICAL);
        return l;
    }

    public static LinearLayout card(Context c) {
        LinearLayout l = column(c);
        l.setPadding(dp(c, 14), dp(c, 12), dp(c, 14), dp(c, 12));
        l.setBackground(rounded(PANEL, 14, BORDER));
        return l;
    }

    public static View spacer(Context c, int hdp) {
        View v = new View(c);
        v.setLayoutParams(new LinearLayout.LayoutParams(1, dp(c, hdp)));
        return v;
    }

    public static LinearLayout screen(Activity a) {
        LinearLayout root = column(a);
        root.setBackgroundColor(BG);
        root.setPadding(dp(a, 18), dp(a, 16), dp(a, 18), dp(a, 16));
        root.setFitsSystemWindows(true);
        return root;
    }

    public static void header(Activity a, LinearLayout root, String title, String subtitle) {
        root.addView(label(a, "PAWD SELF TEST"));
        LinearLayout r = row(a);
        TextView t = title(a, title);
        t.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        r.addView(t);
        Button back = button(a, "Back", 0xFF334155);
        back.setOnClickListener(v -> a.finish());
        r.addView(back);
        root.addView(r);
        if (subtitle != null && !subtitle.isEmpty()) {
            TextView s = text(a, subtitle, 13f, MUTED);
            s.setPadding(0, dp(a, 2), 0, dp(a, 12));
            root.addView(s);
        } else {
            root.addView(spacer(a, 8));
        }
    }

    public static LinearLayout footer(Activity a, String testId) {
        LinearLayout f = row(a);
        f.setPadding(0, dp(a, 12), 0, 0);
        Button fail = button(a, "Fail", RED);
        Button pass = button(a, "Pass", GREEN);
        LinearLayout.LayoutParams lp = new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f);
        lp.setMargins(0, 0, dp(a, 8), 0);
        fail.setLayoutParams(lp);
        pass.setLayoutParams(new LinearLayout.LayoutParams(0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));
        fail.setOnClickListener(v -> {
            TestResults.mark(a, testId, TestResults.FAILED);
            a.finish();
        });
        pass.setOnClickListener(v -> {
            TestResults.mark(a, testId, TestResults.PASSED);
            a.finish();
        });
        f.addView(fail);
        f.addView(pass);
        return f;
    }

    public static ScrollView scroll(Activity a, View content) {
        ScrollView sv = new ScrollView(a);
        sv.setFillViewport(true);
        sv.setClipToPadding(false);
        sv.addView(content, new ScrollView.LayoutParams(
                ScrollView.LayoutParams.MATCH_PARENT,
                ScrollView.LayoutParams.WRAP_CONTENT));
        return sv;
    }

    public static LinearLayout.LayoutParams matchWrap() {
        return new LinearLayout.LayoutParams(
                LinearLayout.LayoutParams.MATCH_PARENT,
                LinearLayout.LayoutParams.WRAP_CONTENT);
    }

    public static LinearLayout.LayoutParams weighted(float weight) {
        return new LinearLayout.LayoutParams(0,
                LinearLayout.LayoutParams.WRAP_CONTENT, weight);
    }

    public static TextView valueRow(Context c, String key, String value) {
        TextView t = text(c, key + ": " + value, 13f, TEXT);
        t.setPadding(0, dp(c, 3), 0, dp(c, 3));
        return t;
    }
}
