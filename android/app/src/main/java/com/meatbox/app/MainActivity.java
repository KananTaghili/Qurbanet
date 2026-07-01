package com.meatbox.app;

import android.graphics.Color;
import android.os.Bundle;
import android.view.Window;
import android.webkit.JavascriptInterface;
import android.webkit.WebView;
import androidx.core.view.WindowInsetsControllerCompat;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        WebView webView = this.getBridge().getWebView();
        if (webView != null) {
            // Native scrollbar gizli — yalnız custom indikator görünsün
            webView.setVerticalScrollBarEnabled(false);
            webView.setHorizontalScrollBarEnabled(false);

            // Long-press menyusunu / link URL tooltip-ini / mətn seçimini native səviyyədə blokla
            webView.setOnLongClickListener(v -> true);
            webView.setLongClickable(false);
            webView.setHapticFeedbackEnabled(false);

            // JS-dən sistem naviqasiya barının rəngini idarə etmək üçün interfeys
            webView.addJavascriptInterface(new NavBarBridge(), "AndroidNav");
        }
    }

    public class NavBarBridge {
        // color: "#RRGGBB", darkIcons: true → tünd ikonlar (açıq fon üçün)
        @JavascriptInterface
        public void set(final String color, final boolean darkIcons) {
            runOnUiThread(() -> {
                try {
                    Window w = getWindow();
                    w.setNavigationBarColor(Color.parseColor(color));
                    WindowInsetsControllerCompat c =
                        new WindowInsetsControllerCompat(w, w.getDecorView());
                    c.setAppearanceLightNavigationBars(darkIcons);
                } catch (Exception ignored) {}
            });
        }

        // Status bar (yuxarı) + nav bar (aşağı) rəngini eyni anda təyin et.
        // statusDark/navDark: true → tünd ikonlar (açıq fon üçün)
        @JavascriptInterface
        public void setBars(final String statusColor, final boolean statusDark,
                            final String navColor, final boolean navDark) {
            runOnUiThread(() -> {
                try {
                    Window w = getWindow();
                    w.setStatusBarColor(Color.parseColor(statusColor));
                    w.setNavigationBarColor(Color.parseColor(navColor));
                    WindowInsetsControllerCompat c =
                        new WindowInsetsControllerCompat(w, w.getDecorView());
                    c.setAppearanceLightStatusBars(statusDark);
                    c.setAppearanceLightNavigationBars(navDark);
                } catch (Exception ignored) {}
            });
        }
    }
}
