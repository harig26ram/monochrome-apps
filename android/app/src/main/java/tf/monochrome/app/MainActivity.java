package tf.monochrome.app;

import android.content.Intent;
import android.net.Uri;
import android.webkit.WebView;
import com.getcapacitor.BridgeActivity;
import com.getcapacitor.WebViewListener;

public class MainActivity extends BridgeActivity {
    @Override
    public void load() {
        super.load();

        bridge.addWebViewListener(new WebViewListener() {
            @Override
            public void onPageStarted(WebView webView) {
                webView.evaluateJavascript(
                    "if('serviceWorker' in navigator){" +
                    "navigator.serviceWorker.getRegistrations().then(function(r){r.forEach(function(reg){reg.unregister();});});" +
                    "navigator.serviceWorker.register=function(){return Promise.reject(new Error('SW disabled in native app'));};" +
                    "}" +
                    "if('caches' in window){caches.keys().then(function(k){k.forEach(function(key){caches.delete(key);});});}",
                    null
                );
            }

            @Override
            public void onPageLoaded(WebView webView) {
                webView.evaluateJavascript(
                    "if('serviceWorker' in navigator){" +
                    "navigator.serviceWorker.getRegistrations().then(function(r){r.forEach(function(reg){reg.unregister();});});" +
                    "}" +
                    "if('caches' in window){caches.keys().then(function(k){k.forEach(function(key){caches.delete(key);});});}",
                    null
                );
            }
        });
    }

    @Override
    protected void onNewIntent(Intent intent) {
        super.onNewIntent(intent);

        if (intent != null && Intent.ACTION_VIEW.equals(intent.getAction())) {
            Uri data = intent.getData();
            if (data != null && "monochrome.tf".equals(data.getHost())) {
                String callbackUrl = data.toString();
                try {
                    com.getcapacitor.Bridge b = bridge;
                    if (b != null && b.getWebView() != null) {
                        b.getWebView().post(() -> {
                            b.getWebView().evaluateJavascript(
                                "window.location.href = " + jsonQuote(callbackUrl) + ";",
                                null
                            );
                        });
                    }
                } catch (Exception e) {
                    e.printStackTrace();
                }
            }
        }
    }

    private static String jsonQuote(String s) {
        StringBuilder sb = new StringBuilder("\"");
        for (char c : s.toCharArray()) {
            switch (c) {
                case '"': sb.append("\\\""); break;
                case '\\': sb.append("\\\\"); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                default:
                    if (c < 0x20) sb.append(String.format("\\u%04x", (int) c));
                    else sb.append(c);
            }
        }
        sb.append("\"");
        return sb.toString();
    }
}
