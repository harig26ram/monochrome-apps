package tf.monochrome.app.plugins;

import android.webkit.WebView;
import android.webkit.JavascriptInterface;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;

@CapacitorPlugin(name = "WebInjector")
public class WebInjector extends Plugin {

    private WebView getWebView() {
        return getBridge().getWebView();
    }

    @PluginMethod
    public void injectScript(PluginCall call) {
        String script = call.getString("script", "");
        if (script.isEmpty()) {
            call.reject("Script is required");
            return;
        }

        WebView webView = getWebView();
        if (webView != null) {
            webView.post(() -> {
                webView.evaluateJavascript(script, value -> {
                    JSObject result = new JSObject();
                    result.put("success", true);
                    call.resolve(result);
                });
            });
        } else {
            call.reject("WebView not available");
        }
    }

    @PluginMethod
    public void injectCSS(PluginCall call) {
        String css = call.getString("css", "");
        if (css.isEmpty()) {
            call.reject("CSS is required");
            return;
        }

        WebView webView = getWebView();
        if (webView != null) {
            String js = "var s=document.createElement('style');s.textContent='" +
                        css.replace("'", "\\'").replace("\n", " ") +
                        "';document.head.appendChild(s);";
            webView.post(() -> {
                webView.evaluateJavascript(js, value -> {
                    JSObject result = new JSObject();
                    result.put("success", true);
                    call.resolve(result);
                });
            });
        } else {
            call.reject("WebView not available");
        }
    }

    @PluginMethod
    public void injectHTML(PluginCall call) {
        String html = call.getString("html", "");
        String position = call.getString("position", "body"); // "body", "top", "bottom"
        if (html.isEmpty()) {
            call.reject("HTML is required");
            return;
        }

        WebView webView = getWebView();
        if (webView != null) {
            String js;
            if ("top".equals(position)) {
                js = "var d=document.createElement('div');d.innerHTML='" +
                     html.replace("'", "\\'").replace("\n", " ") +
                     "';d.style.cssText='position:fixed;top:0;left:0;right:0;z-index:99999;';" +
                     "document.body.insertBefore(d,document.body.firstChild);";
            } else if ("bottom".equals(position)) {
                js = "var d=document.createElement('div');d.innerHTML='" +
                     html.replace("'", "\\'").replace("\n", " ") +
                     "';d.style.cssText='position:fixed;bottom:0;left:0;right:0;z-index:99999;';" +
                     "document.body.appendChild(d);";
            } else {
                js = "var d=document.createElement('div');d.innerHTML='" +
                     html.replace("'", "\\'").replace("\n", " ") +
                     "';document.body.appendChild(d);";
            }
            webView.post(() -> {
                webView.evaluateJavascript(js, value -> {
                    JSObject result = new JSObject();
                    result.put("success", true);
                    call.resolve(result);
                });
            });
        } else {
            call.reject("WebView not available");
        }
    }
}
