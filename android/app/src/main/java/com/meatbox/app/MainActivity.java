package com.meatbox.app;

import android.os.Bundle;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);

        // Native WebView scrollbar-ı söndür — yalnız custom qırmızı indikator görünsün.
        // Native scroll (momentum) toxunulmadan qalır → smooth.
        WebView webView = this.getBridge().getWebView();
        if (webView != null) {
            webView.setVerticalScrollBarEnabled(false);
            webView.setHorizontalScrollBarEnabled(false);
        }
    }
}
