#!/bin/bash
set -e

BUILD_DIR="/home/ubuntu/android-build"
SDK="/opt/android-sdk"
PLATFORM="$SDK/platforms/android-34/android.jar"
BUILD_TOOLS="$SDK/build-tools/34.0.0"

echo "=== 1. PREPARING DIRECTORIES ==="
rm -rf "$BUILD_DIR"
mkdir -p "$BUILD_DIR/src/ai/mindguard/student"
mkdir -p "$BUILD_DIR/res/values"
mkdir -p "$BUILD_DIR/res/mipmap-xxhdpi"
mkdir -p "$BUILD_DIR/gen"
mkdir -p "$BUILD_DIR/obj"

echo "=== 2. WRITING ANDROID MANIFEST ==="
cat > "$BUILD_DIR/AndroidManifest.xml" << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android"
    xmlns:tools="http://schemas.android.com/tools"
    package="ai.mindguard.student"
    android:versionCode="3"
    android:versionName="1.2.0">

    <uses-sdk
        android:minSdkVersion="24"
        android:targetSdkVersion="34" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.VIBRATE" />
    <uses-permission android:name="android.permission.PACKAGE_USAGE_STATS" tools:ignore="ProtectedPermissions" />

    <application
        android:label="@string/app_name"
        android:icon="@mipmap/ic_launcher"
        android:theme="@style/AppTheme"
        android:hardwareAccelerated="true"
        android:usesCleartextTraffic="true">

        <activity
            android:name=".MainActivity"
            android:exported="true"
            android:configChanges="orientation|screenSize|keyboardHidden"
            android:theme="@style/AppTheme">
            <intent-filter>
                <action android:name="android.intent.action.MAIN" />
                <category android:name="android.intent.category.LAUNCHER" />
            </intent-filter>
        </activity>
    </application>
</manifest>
EOF

echo "=== 3. WRITING RESOURCES ==="
cat > "$BUILD_DIR/res/values/strings.xml" << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <string name="app_name">MindGuard AI</string>
</resources>
EOF

cat > "$BUILD_DIR/res/values/colors.xml" << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <color name="background">#070A11</color>
</resources>
EOF

cat > "$BUILD_DIR/res/values/styles.xml" << 'EOF'
<?xml version="1.0" encoding="utf-8"?>
<resources>
    <style name="AppTheme" parent="android:Theme.Material.NoActionBar">
        <item name="android:windowBackground">@color/background</item>
        <item name="android:statusBarColor">@color/background</item>
        <item name="android:navigationBarColor">@color/background</item>
    </style>
</resources>
EOF

# Copy logo as launcher icon
if [ -f "/opt/mindguard/frontend/public/logo.png" ]; then
    cp "/opt/mindguard/frontend/public/logo.png" "$BUILD_DIR/res/mipmap-xxhdpi/ic_launcher.png"
elif [ -f "/opt/mindguard/frontend/dist/logo.png" ]; then
    cp "/opt/mindguard/frontend/dist/logo.png" "$BUILD_DIR/res/mipmap-xxhdpi/ic_launcher.png"
fi

echo "=== 4. WRITING PHONE TELEMETRY MANAGER (JAVA) ==="
cat > "$BUILD_DIR/src/ai/mindguard/student/PhoneTelemetryManager.java" << 'EOF'
package ai.mindguard.student;

import android.app.Activity;
import android.app.AppOpsManager;
import android.app.usage.UsageStats;
import android.app.usage.UsageStatsManager;
import android.content.Context;
import android.content.Intent;
import android.content.pm.ApplicationInfo;
import android.content.pm.PackageManager;
import android.net.Uri;
import android.os.Build;
import android.os.Process;
import android.provider.Settings;
import android.util.Log;

import org.json.JSONArray;
import org.json.JSONObject;

import java.io.OutputStream;
import java.net.HttpURLConnection;
import java.net.URL;
import java.nio.charset.StandardCharsets;
import java.text.SimpleDateFormat;
import java.util.ArrayList;
import java.util.Calendar;
import java.util.Collections;
import java.util.Comparator;
import java.util.Date;
import java.util.HashMap;
import java.util.HashSet;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Set;

public class PhoneTelemetryManager {
    private static final String TAG = "MindGuardTelemetry";

    public static boolean hasUsagePermission(Context context) {
        try {
            AppOpsManager appOps = (AppOpsManager) context.getSystemService(Context.APP_OPS_SERVICE);
            int mode = appOps.checkOpNoThrow(
                AppOpsManager.OPSTR_GET_USAGE_STATS,
                Process.myUid(),
                context.getPackageName()
            );
            return mode == AppOpsManager.MODE_ALLOWED;
        } catch (Exception e) {
            return false;
        }
    }

    public static void requestUsagePermission(Activity activity) {
        try {
            Intent intent = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
            intent.setData(Uri.parse("package:" + activity.getPackageName()));
            intent.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
            activity.startActivity(intent);
        } catch (Exception e) {
            try {
                Intent fallback = new Intent(Settings.ACTION_USAGE_ACCESS_SETTINGS);
                fallback.addFlags(Intent.FLAG_ACTIVITY_NEW_TASK);
                activity.startActivity(fallback);
            } catch (Exception ex) {
                Log.e(TAG, "Failed to launch usage access settings: " + ex.getMessage());
            }
        }
    }

    public static JSONObject getTodayPhoneTelemetry(Context context) {
        JSONObject result = new JSONObject();
        try {
            boolean hasPerm = hasUsagePermission(context);
            result.put("has_permission", hasPerm);

            SimpleDateFormat sdf = new SimpleDateFormat("yyyy-MM-dd", Locale.US);
            String todayStr = sdf.format(new Date());
            result.put("date", todayStr);

            if (!hasPerm) {
                result.put("total_screen_time_minutes", 0);
                result.put("academic_usage_minutes", 0);
                result.put("social_usage_minutes", 0);
                result.put("entertainment_usage_minutes", 0);
                result.put("late_night_usage_minutes", 0);
                result.put("continuous_screen_minutes", 0);
                result.put("top_apps", new JSONArray());
                result.put("dominant_purpose", "Permission Pending");
                result.put("dominant_percentage", 0);
                return result;
            }

            Calendar cal = Calendar.getInstance();
            long now = cal.getTimeInMillis();
            cal.set(Calendar.HOUR_OF_DAY, 0);
            cal.set(Calendar.MINUTE, 0);
            cal.set(Calendar.SECOND, 0);
            cal.set(Calendar.MILLISECOND, 0);
            long midnight = cal.getTimeInMillis();

            cal.set(Calendar.HOUR_OF_DAY, 5);
            long lateNightEnd = cal.getTimeInMillis();

            UsageStatsManager usm = (UsageStatsManager) context.getSystemService(Context.USAGE_STATS_SERVICE);
            List<UsageStats> allStats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, midnight, now);

            PackageManager pm = context.getPackageManager();

            Set<String> systemPackages = new HashSet<>();
            systemPackages.add("com.android.systemui");
            systemPackages.add("com.google.android.googlequicksearchbox");
            systemPackages.add("com.android.settings");
            systemPackages.add("android");
            systemPackages.add("com.google.android.inputmethod.latin");
            systemPackages.add("com.sec.android.app.launcher");
            systemPackages.add("com.miui.home");
            systemPackages.add("com.huawei.android.launcher");
            systemPackages.add("com.oppo.launcher");
            systemPackages.add("com.vivo.launcher");

            Map<String, UsageStats> aggregated = new HashMap<>();
            if (allStats != null) {
                for (UsageStats u : allStats) {
                    String pkg = u.getPackageName();
                    if (systemPackages.contains(pkg) || pkg.contains("launcher") || pkg.contains("systemui")) {
                        continue;
                    }
                    if (u.getTotalTimeInForeground() > 25000) { // at least 25 seconds
                        if (aggregated.containsKey(pkg)) {
                            aggregated.get(pkg).add(u);
                        } else {
                            aggregated.put(pkg, u);
                        }
                    }
                }
            }

            class AppRecord {
                String name;
                String pkg;
                int minutes;
                int opens;
                String category;
                String icon;
            }

            List<AppRecord> appRecords = new ArrayList<>();
            int totalMins = 0;
            int acadMins = 0;
            int socMins = 0;
            int entMins = 0;

            for (UsageStats u : aggregated.values()) {
                String pkg = u.getPackageName();
                long millis = u.getTotalTimeInForeground();
                int mins = (int) (millis / 60000);
                if (mins <= 0) continue;

                String appLabel = pkg;
                int appCategory = -1;
                try {
                    ApplicationInfo ai = pm.getApplicationInfo(pkg, 0);
                    CharSequence label = pm.getApplicationLabel(ai);
                    if (label != null && label.length() > 0) {
                        appLabel = label.toString();
                    }
                    if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
                        appCategory = ai.category;
                    }
                } catch (Exception ignored) {}

                String pkgLower = pkg.toLowerCase(Locale.US);
                String labelLower = appLabel.toLowerCase(Locale.US);

                String cat = "Normal";
                String icon = "smartphone";

                // 1. Studying / Academic Coursework
                if (pkgLower.contains("classroom") || pkgLower.contains("canvas") || pkgLower.contains("moodle")
                        || pkgLower.contains("blackboard") || pkgLower.contains("duolingo") || pkgLower.contains("coursera")
                        || pkgLower.contains("udemy") || pkgLower.contains("khan") || pkgLower.contains("quizlet")
                        || pkgLower.contains("notion") || pkgLower.contains("word") || pkgLower.contains("excel")
                        || pkgLower.contains("powerpoint") || pkgLower.contains("docs") || pkgLower.contains("sheets")
                        || pkgLower.contains("slides") || pkgLower.contains("drive") || pkgLower.contains("acrobat")
                        || pkgLower.contains("pdf") || pkgLower.contains("nmims") || pkgLower.contains("camscanner")
                        || pkgLower.contains("study") || pkgLower.contains("learn") || pkgLower.contains("code")
                        || pkgLower.contains("sololearn") || labelLower.contains("classroom") || labelLower.contains("study")
                        || labelLower.contains("notes") || labelLower.contains("word") || labelLower.contains("reader")) {
                    cat = "Studying";
                    icon = "book";
                    acadMins += mins;
                }
                // 2. Playing / Gaming & Media Streaming
                else if (appCategory == ApplicationInfo.CATEGORY_GAME
                        || pkgLower.contains("freefire") || pkgLower.contains("pubg") || pkgLower.contains("bgmi")
                        || pkgLower.contains("roblox") || pkgLower.contains("clash") || pkgLower.contains("candycrush")
                        || pkgLower.contains("subway") || pkgLower.contains("asphalt") || pkgLower.contains("ludo")
                        || pkgLower.contains("chess") || pkgLower.contains("game") || pkgLower.contains("youtube")
                        || pkgLower.contains("hotstar") || pkgLower.contains("netflix") || pkgLower.contains("jiocinema")
                        || pkgLower.contains("primevideo") || pkgLower.contains("spotify") || pkgLower.contains("music")
                        || pkgLower.contains("saavn") || pkgLower.contains("gaana") || pkgLower.contains("wynk")
                        || pkgLower.contains("tiktok") || labelLower.contains("game") || labelLower.contains("fire")
                        || labelLower.contains("video") || labelLower.contains("music") || labelLower.contains("hotstar")
                        || labelLower.contains("youtube")) {
                    cat = "Playing";
                    icon = (labelLower.contains("music") || labelLower.contains("spotify")) ? "music" :
                           (labelLower.contains("youtube") || labelLower.contains("video") || labelLower.contains("hotstar") || labelLower.contains("netflix")) ? "video" : "gamepad";
                    entMins += mins;
                }
                // 3. Social / Normal (Instagram, WhatsApp, Telegram, etc.)
                else {
                    cat = "Normal";
                    icon = pkgLower.contains("instagram") ? "camera" :
                           (pkgLower.contains("whatsapp") || pkgLower.contains("telegram") || pkgLower.contains("message")) ? "message" :
                           (pkgLower.contains("chrome") || pkgLower.contains("browser")) ? "globe" : "smartphone";
                    socMins += mins;
                }

                totalMins += mins;

                AppRecord rec = new AppRecord();
                rec.name = appLabel;
                rec.pkg = pkg;
                rec.minutes = mins;
                rec.category = cat;
                rec.icon = icon;
                rec.opens = Math.max(1, (int) (mins / 4) + 1);
                appRecords.add(rec);
            }

            Collections.sort(appRecords, new Comparator<AppRecord>() {
                @Override
                public int compare(AppRecord a, AppRecord b) {
                    return Integer.compare(b.minutes, a.minutes);
                }
            });

            JSONArray topAppsJson = new JSONArray();
            int effectiveTotal = Math.max(1, totalMins);
            for (AppRecord r : appRecords) {
                JSONObject appObj = new JSONObject();
                appObj.put("name", r.name);
                appObj.put("proc", r.pkg);
                appObj.put("package", r.pkg);
                appObj.put("minutes", r.minutes);
                appObj.put("times_opened", r.opens);
                appObj.put("notifications", 0);
                appObj.put("category", r.category);
                appObj.put("icon", r.icon);
                int pct = Math.min(100, Math.round(((float) r.minutes / effectiveTotal) * 100));
                appObj.put("percentage", pct);
                topAppsJson.put(appObj);
            }

            // Calculate Late-Night Usage (12 AM - 5 AM)
            int lateNightMins = 0;
            if (now > midnight) {
                List<UsageStats> lateStats = usm.queryUsageStats(UsageStatsManager.INTERVAL_DAILY, midnight, Math.min(now, lateNightEnd));
                if (lateStats != null) {
                    long lateMillis = 0;
                    for (UsageStats lu : lateStats) {
                        String lpkg = lu.getPackageName();
                        if (!systemPackages.contains(lpkg)) {
                            lateMillis += lu.getTotalTimeInForeground();
                        }
                    }
                    lateNightMins = (int) (lateMillis / 60000);
                }
            }

            // Calculate Dominant Purpose
            String dominantPurpose = "Balanced Routine";
            int dominantPct = 0;
            if (totalMins > 0) {
                int acadPct = Math.round(((float) acadMins / totalMins) * 100);
                int entPct = Math.round(((float) entMins / totalMins) * 100);
                int socPct = Math.round(((float) socMins / totalMins) * 100);

                if (acadPct >= 50) {
                    dominantPurpose = "Academic Focus & Coursework";
                    dominantPct = acadPct;
                } else if (entPct >= socPct && entPct >= 40) {
                    dominantPurpose = "Gaming & Entertainment";
                    dominantPct = entPct;
                } else if (socPct >= 40) {
                    dominantPurpose = "Social Media & Communication";
                    dominantPct = socPct;
                } else {
                    dominantPurpose = "Balanced Multi-Tasking";
                    dominantPct = Math.max(acadPct, Math.max(entPct, socPct));
                }
            }

            result.put("total_screen_time_minutes", totalMins);
            result.put("academic_usage_minutes", acadMins);
            result.put("social_usage_minutes", socMins);
            result.put("entertainment_usage_minutes", entMins);
            result.put("late_night_usage_minutes", lateNightMins);
            result.put("continuous_screen_minutes", Math.min(totalMins, 45));
            result.put("top_apps", topAppsJson);
            result.put("dominant_purpose", dominantPurpose);
            result.put("dominant_percentage", dominantPct);

        } catch (Exception e) {
            Log.e(TAG, "Error querying phone telemetry: " + e.getMessage(), e);
        }
        return result;
    }

    public static void syncTelemetryDirectly(final Context context, final String authToken) {
        new Thread(new Runnable() {
            @Override
            public void run() {
                try {
                    JSONObject telemetry = getTodayPhoneTelemetry(context);
                    if (!telemetry.optBoolean("has_permission", false)) {
                        return;
                    }

                    JSONObject payload = new JSONObject();
                    payload.put("date", telemetry.getString("date"));
                    payload.put("total_screen_time_minutes", telemetry.getInt("total_screen_time_minutes"));
                    payload.put("academic_usage_minutes", telemetry.getInt("academic_usage_minutes"));
                    payload.put("social_usage_minutes", telemetry.getInt("social_usage_minutes"));
                    payload.put("entertainment_usage_minutes", telemetry.getInt("entertainment_usage_minutes"));
                    payload.put("late_night_usage_minutes", telemetry.getInt("late_night_usage_minutes"));
                    payload.put("continuous_screen_minutes", telemetry.getInt("continuous_screen_minutes"));
                    payload.put("top_apps", telemetry.getJSONArray("top_apps"));
                    payload.put("detected_intent_summary", "Mobile Phone: " + telemetry.getString("dominant_purpose"));

                    URL url = new URL("http://15.207.223.74/api/v1/chat/behavioral-features");
                    HttpURLConnection conn = (HttpURLConnection) url.openConnection();
                    conn.setRequestMethod("POST");
                    conn.setRequestProperty("Content-Type", "application/json");
                    conn.setRequestProperty("Accept", "application/json");
                    if (authToken != null && !authToken.isEmpty()) {
                        conn.setRequestProperty("Authorization", "Bearer " + authToken);
                    }
                    conn.setDoOutput(true);
                    conn.setConnectTimeout(8000);
                    conn.setReadTimeout(8000);

                    byte[] postBytes = payload.toString().getBytes(StandardCharsets.UTF_8);
                    try (OutputStream os = conn.getOutputStream()) {
                        os.write(postBytes);
                    }

                    int code = conn.getResponseCode();
                    Log.i(TAG, "Synced phone telemetry directly to backend: HTTP " + code);
                    conn.disconnect();
                } catch (Exception e) {
                    Log.e(TAG, "Failed to sync phone telemetry: " + e.getMessage());
                }
            }
        }).start();
    }
}
EOF

echo "=== 5. WRITING MAIN ACTIVITY (JAVA) ==="
cat > "$BUILD_DIR/src/ai/mindguard/student/MainActivity.java" << 'EOF'
package ai.mindguard.student;

import android.app.Activity;
import android.os.Bundle;
import android.webkit.JavascriptInterface;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;
import android.webkit.WebChromeClient;
import android.webkit.PermissionRequest;
import android.view.Window;
import android.view.WindowManager;
import android.graphics.Color;
import android.content.Intent;
import android.net.Uri;
import android.util.Log;

public class MainActivity extends Activity {
    private WebView webView;

    public class WebAppInterface {
        private Activity mActivity;

        public WebAppInterface(Activity activity) {
            this.mActivity = activity;
        }

        @JavascriptInterface
        public boolean isNativeAndroid() {
            return true;
        }

        @JavascriptInterface
        public boolean hasUsagePermission() {
            return PhoneTelemetryManager.hasUsagePermission(mActivity);
        }

        @JavascriptInterface
        public void requestUsagePermission() {
            PhoneTelemetryManager.requestUsagePermission(mActivity);
        }

        @JavascriptInterface
        public String getTodayPhoneTelemetry() {
            return PhoneTelemetryManager.getTodayPhoneTelemetry(mActivity).toString();
        }

        @JavascriptInterface
        public void syncPhoneTelemetry(String token) {
            PhoneTelemetryManager.syncTelemetryDirectly(mActivity, token);
        }
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        Window window = getWindow();
        window.addFlags(WindowManager.LayoutParams.FLAG_DRAWS_SYSTEM_BAR_BACKGROUNDS);
        window.setStatusBarColor(Color.parseColor("#070A11"));

        webView = new WebView(this);
        setContentView(webView);

        WebSettings settings = webView.getSettings();
        settings.setJavaScriptEnabled(true);
        settings.setDomStorageEnabled(true);
        settings.setDatabaseEnabled(true);
        settings.setLoadWithOverviewMode(true);
        settings.setUseWideViewPort(true);
        settings.setMixedContentMode(WebSettings.MIXED_CONTENT_ALWAYS_ALLOW);
        settings.setMediaPlaybackRequiresUserGesture(false);

        webView.setBackgroundColor(Color.parseColor("#070A11"));

        // Register Native Android Bridge
        webView.addJavascriptInterface(new WebAppInterface(this), "MindGuardPhone");

        webView.setWebViewClient(new WebViewClient() {
            @Override
            public boolean shouldOverrideUrlLoading(WebView view, String url) {
                if (url.startsWith("http://15.207.223.74") || url.startsWith("https://")) {
                    return false;
                }
                try {
                    Intent intent = new Intent(Intent.ACTION_VIEW, Uri.parse(url));
                    startActivity(intent);
                    return true;
                } catch (Exception e) {
                    return false;
                }
            }
        });

        webView.setWebChromeClient(new WebChromeClient() {
            @Override
            public void onPermissionRequest(final PermissionRequest request) {
                request.grant(request.getResources());
            }
        });

        webView.loadUrl("http://15.207.223.74");
    }

    @Override
    protected void onResume() {
        super.onResume();
        if (PhoneTelemetryManager.hasUsagePermission(this) && webView != null) {
            webView.post(new Runnable() {
                @Override
                public void run() {
                    webView.evaluateJavascript("if (window.__syncNativePhoneTelemetry) { window.__syncNativePhoneTelemetry(); }", null);
                }
            });
        }
    }

    @Override
    public void onBackPressed() {
        if (webView != null && webView.canGoBack()) {
            webView.goBack();
        } else {
            super.onBackPressed();
        }
    }
}
EOF

cd "$BUILD_DIR"

echo "=== 6. COMPILING RESOURCES (AAPT2) ==="
"$BUILD_TOOLS/aapt2" compile --dir res -o compiled_res.zip
"$BUILD_TOOLS/aapt2" link -I "$PLATFORM" --min-sdk-version 24 --target-sdk-version 34 --manifest AndroidManifest.xml --java gen -o base.apk compiled_res.zip

echo "=== 7. COMPILING JAVA CLASSES (JAVAC) ==="
javac -source 17 -target 17 -cp "$PLATFORM" gen/ai/mindguard/student/R.java src/ai/mindguard/student/PhoneTelemetryManager.java src/ai/mindguard/student/MainActivity.java -d obj

echo "=== 8. DEXING BYTECODE (D8) ==="
"$BUILD_TOOLS/d8" --lib "$PLATFORM" --min-api 24 obj/ai/mindguard/student/*.class --output .

echo "=== 9. PACKAGING APK ==="
zip -u base.apk classes.dex

echo "=== 10. ZIPALIGN ==="
"$BUILD_TOOLS/zipalign" -v -p 4 base.apk aligned.apk

echo "=== 11. GENERATING SIGNING KEYSTORE ==="
if [ ! -f "mindguard.keystore" ]; then
    keytool -genkeypair -v -keystore mindguard.keystore -alias mindguard -keyalg RSA -keysize 2048 -validity 10000 -storepass mindguard123 -keypass mindguard123 -dname "CN=MindGuard, OU=Wellbeing, O=NMIMS, L=Mumbai, ST=MH, C=IN"
fi

echo "=== 12. SIGNING APK (APKSIGNER) ==="
"$BUILD_TOOLS/apksigner" sign --ks mindguard.keystore --ks-pass pass:mindguard123 --out mindguard.apk aligned.apk

echo "=== 13. PUBLISHING TO WEB ROOT ==="
sudo cp mindguard.apk /opt/mindguard/frontend/dist/mindguard.apk
sudo chmod 644 /opt/mindguard/frontend/dist/mindguard.apk

ls -lh /opt/mindguard/frontend/dist/mindguard.apk
echo "BUILD SUCCESSFUL! APK with Full Phone Screen Time & Purpose Tracking is live at http://15.207.223.74/mindguard.apk"
