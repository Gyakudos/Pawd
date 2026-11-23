package com.pawd.selftest;

import android.content.Context;

public final class TestResults {
    public static final String PASSED = "passed";
    public static final String FAILED = "failed";
    private static final String PREFS = "pawd_results";

    private TestResults() {}

    public static void mark(Context c, String id, String status) {
        c.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .edit().putString(id, status).apply();
    }

    public static String get(Context c, String id) {
        return c.getSharedPreferences(PREFS, Context.MODE_PRIVATE)
                .getString(id, null);
    }

    public static void reset(Context c) {
        c.getSharedPreferences(PREFS, Context.MODE_PRIVATE).edit().clear().apply();
    }
}
