package com.pawd.selftest;

import android.content.Context;
import android.graphics.Canvas;
import android.graphics.Color;
import android.graphics.Paint;
import android.graphics.PointF;
import android.os.Bundle;
import android.util.SparseArray;
import android.view.MotionEvent;
import android.view.View;
import android.view.ViewGroup;
import android.widget.Button;
import android.widget.LinearLayout;
import android.widget.TextView;

public class TouchTestActivity extends android.app.Activity {
    private static final int GRID = 5;
    private static final int[] POINTER_COLORS = {
            0xFF38BDF8, 0xFF22C55E, 0xFFFBBF24, 0xFFF87171, 0xFFA78BFA,
            0xFFF472B6, 0xFF34D399, 0xFF60A5FA, 0xFFFB923C, 0xFFE879F9
    };

    private TouchView touchView;
    private TextView stats;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        LinearLayout root = Ui.screen(this);
        Ui.header(this, root, "Touchscreen & multitouch",
                "Draw across the grid with one or more fingers. Cover edges and corners.");

        LinearLayout statsRow = Ui.row(this);
        stats = Ui.text(this, "", 13f, Ui.TEXT);
        stats.setTypeface(android.graphics.Typeface.DEFAULT_BOLD);
        statsRow.addView(stats, new LinearLayout.LayoutParams(
                0, ViewGroup.LayoutParams.WRAP_CONTENT, 1f));

        Button clear = Ui.button(this, "Clear", 0xFF334155);
        clear.setOnClickListener(v -> touchView.clear());
        statsRow.addView(clear);
        root.addView(statsRow);

        touchView = new TouchView(this);
        LinearLayout.LayoutParams tp = new LinearLayout.LayoutParams(
                ViewGroup.LayoutParams.MATCH_PARENT, 0, 1f);
        tp.topMargin = Ui.dp(this, 10);
        tp.bottomMargin = Ui.dp(this, 8);
        root.addView(touchView, tp);

        root.addView(Ui.footer(this, "touch"));
        setContentView(root);
        updateStats();
    }

    private void updateStats() {
        stats.setText("Pointers: " + touchView.activePointers
                + "  \u00b7  Max: " + touchView.maxPointers
                + "  \u00b7  Grid: " + touchView.coveredCells() + "/" + (GRID * GRID));
    }

    private class TouchView extends View {
        final Paint gridPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        final Paint fillPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        final Paint pointerPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        final Paint textPaint = new Paint(Paint.ANTI_ALIAS_FLAG);
        final SparseArray<PointF> pointers = new SparseArray<>();
        final boolean[] cells = new boolean[GRID * GRID];
        int maxPointers = 0;
        int activePointers = 0;

        TouchView(Context c) {
            super(c);
            gridPaint.setStyle(Paint.Style.STROKE);
            gridPaint.setStrokeWidth(Ui.dp(c, 1));
            gridPaint.setColor(0xFF243041);
            fillPaint.setStyle(Paint.Style.FILL);
            fillPaint.setColor(0x2238BDF8);
            pointerPaint.setStyle(Paint.Style.FILL_AND_STROKE);
            pointerPaint.setStrokeWidth(Ui.dp(c, 2));
            textPaint.setColor(0xFFE5E7EB);
            textPaint.setTextSize(Ui.dp(c, 11));
            textPaint.setTextAlign(Paint.Align.CENTER);
            setBackgroundColor(Ui.PANEL_2);
            setFocusable(true);
        }

        void clear() {
            pointers.clear();
            java.util.Arrays.fill(cells, false);
            maxPointers = 0;
            activePointers = 0;
            invalidate();
            updateStats();
        }

        int coveredCells() {
            int n = 0;
            for (boolean b : cells) if (b) n++;
            return n;
        }

        @Override
        public boolean onTouchEvent(MotionEvent event) {
            int action = event.getActionMasked();
            switch (action) {
                case MotionEvent.ACTION_DOWN:
                case MotionEvent.ACTION_POINTER_DOWN:
                case MotionEvent.ACTION_MOVE: {
                    for (int i = 0; i < event.getPointerCount(); i++) {
                        int id = event.getPointerId(i);
                        float x = event.getX(i);
                        float y = event.getY(i);
                        pointers.put(id, new PointF(x, y));
                        markCell(x, y);
                    }
                    activePointers = event.getPointerCount();
                    maxPointers = Math.max(maxPointers, activePointers);
                    invalidate();
                    updateStats();
                    break;
                }
                case MotionEvent.ACTION_POINTER_UP: {
                    int id = event.getPointerId(event.getActionIndex());
                    pointers.remove(id);
                    activePointers = Math.max(0, pointers.size());
                    invalidate();
                    updateStats();
                    break;
                }
                case MotionEvent.ACTION_UP:
                case MotionEvent.ACTION_CANCEL: {
                    pointers.clear();
                    activePointers = 0;
                    invalidate();
                    updateStats();
                    break;
                }
            }
            return true;
        }

        private void markCell(float x, float y) {
            int w = getWidth();
            int h = getHeight();
            if (w <= 0 || h <= 0) return;
            int cx = Math.min(GRID - 1, Math.max(0, (int) (x / (w / (float) GRID))));
            int cy = Math.min(GRID - 1, Math.max(0, (int) (y / (h / (float) GRID))));
            cells[cy * GRID + cx] = true;
        }

        @Override
        protected void onDraw(Canvas canvas) {
            super.onDraw(canvas);
            int w = getWidth();
            int h = getHeight();
            float cw = w / (float) GRID;
            float ch = h / (float) GRID;

            for (int y = 0; y < GRID; y++) {
                for (int x = 0; x < GRID; x++) {
                    if (cells[y * GRID + x]) {
                        canvas.drawRect(x * cw, y * ch, (x + 1) * cw, (y + 1) * ch, fillPaint);
                    }
                }
            }
            for (int i = 1; i < GRID; i++) {
                canvas.drawLine(i * cw, 0, i * cw, h, gridPaint);
                canvas.drawLine(0, i * ch, w, i * ch, gridPaint);
            }
            canvas.drawRect(1, 1, w - 1, h - 1, gridPaint);

            for (int i = 0; i < pointers.size(); i++) {
                int id = pointers.keyAt(i);
                PointF p = pointers.valueAt(i);
                pointerPaint.setColor(POINTER_COLORS[Math.floorMod(id, POINTER_COLORS.length)]);
                pointerPaint.setAlpha(200);
                canvas.drawCircle(p.x, p.y, Ui.dp(getContext(), 30), pointerPaint);
                textPaint.setColor(Color.BLACK);
                canvas.drawText(String.valueOf(id), p.x, p.y + Ui.dp(getContext(), 4), textPaint);
            }
        }
    }
}
