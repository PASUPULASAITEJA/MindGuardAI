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
    package="ai.mindguard.student"
    android:versionCode="2"
    android:versionName="1.1.0">

    <uses-sdk
        android:minSdkVersion="24"
        android:targetSdkVersion="34" />

    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.RECORD_AUDIO" />
    <uses-permission android:name="android.permission.MODIFY_AUDIO_SETTINGS" />
    <uses-permission android:name="android.permission.VIBRATE" />

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

echo "=== 4. WRITING MAIN ACTIVITY (JAVA) ==="
cat > "$BUILD_DIR/src/ai/mindguard/student/MainActivity.java" << 'EOF'
package ai.mindguard.student;

import android.app.Activity;
import android.os.Bundle;
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

public class MainActivity extends Activity {
    private WebView webView;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Modern full screen with dark system navigation styling
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

echo "=== 5. COMPILING RESOURCES (AAPT2) ==="
"$BUILD_TOOLS/aapt2" compile --dir res -o compiled_res.zip
"$BUILD_TOOLS/aapt2" link -I "$PLATFORM" --min-sdk-version 24 --target-sdk-version 34 --manifest AndroidManifest.xml --java gen -o base.apk compiled_res.zip

echo "=== 6. COMPILING JAVA CLASSES (JAVAC) ==="
javac -source 17 -target 17 -cp "$PLATFORM" gen/ai/mindguard/student/R.java src/ai/mindguard/student/MainActivity.java -d obj

echo "=== 7. DEXING BYTECODE (D8) ==="
"$BUILD_TOOLS/d8" --lib "$PLATFORM" --min-api 24 obj/ai/mindguard/student/*.class --output .

echo "=== 8. PACKAGING APK ==="
zip -u base.apk classes.dex

echo "=== 9. ZIPALIGN ==="
"$BUILD_TOOLS/zipalign" -v -p 4 base.apk aligned.apk

echo "=== 10. GENERATING SIGNING KEYSTORE ==="
if [ ! -f "mindguard.keystore" ]; then
    keytool -genkeypair -v -keystore mindguard.keystore -alias mindguard -keyalg RSA -keysize 2048 -validity 10000 -storepass mindguard123 -keypass mindguard123 -dname "CN=MindGuard, OU=Wellbeing, O=NMIMS, L=Mumbai, ST=MH, C=IN"
fi

echo "=== 11. SIGNING APK (APKSIGNER) ==="
"$BUILD_TOOLS/apksigner" sign --ks mindguard.keystore --ks-pass pass:mindguard123 --out mindguard.apk aligned.apk

echo "=== 12. PUBLISHING TO WEB ROOT ==="
sudo cp mindguard.apk /opt/mindguard/frontend/dist/mindguard.apk
sudo chmod 644 /opt/mindguard/frontend/dist/mindguard.apk

ls -lh /opt/mindguard/frontend/dist/mindguard.apk
echo "BUILD SUCCESSFUL! APK is live at http://15.207.223.74/mindguard.apk"
