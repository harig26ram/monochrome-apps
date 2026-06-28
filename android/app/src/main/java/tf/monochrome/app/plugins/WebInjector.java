package tf.monochrome.app.plugins;

import android.webkit.WebView;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import java.util.function.Consumer;

@CapacitorPlugin(name = "WebInjector")
public class WebInjector extends Plugin {

    @PluginMethod
    public void injectScript(PluginCall call) {
        String script = call.getString("script", "");
        if (script.isEmpty()) {
            call.reject("Script is required");
            return;
        }
        runOnWebView(webView ->
            webView.evaluateJavascript(script, value -> {
                JSObject result = new JSObject();
                result.put("success", true);
                call.resolve(result);
            }),
            () -> call.reject("WebView not available")
        );
    }

    @PluginMethod
    public void injectCSS(PluginCall call) {
        String css = call.getString("css", "");
        if (css.isEmpty()) {
            call.reject("CSS is required");
            return;
        }
        String js = "var s=document.createElement('style');s.textContent='" +
                    escapeForJs(css) +
                    "';document.head.appendChild(s);";
        runOnWebView(webView ->
            webView.evaluateJavascript(js, value -> {
                JSObject result = new JSObject();
                result.put("success", true);
                call.resolve(result);
            }),
            () -> call.reject("WebView not available")
        );
    }

    @PluginMethod
    public void injectHTML(PluginCall call) {
        String html = call.getString("html", "");
        String position = call.getString("position", "body");
        if (html.isEmpty()) {
            call.reject("HTML is required");
            return;
        }

        String escapedHtml = escapeForJs(html);
        String js;
        switch (position) {
            case "top":
                js = "var d=document.createElement('div');d.innerHTML='" + escapedHtml +
                     "';d.style.cssText='position:fixed;top:0;left:0;right:0;z-index:99999;';" +
                     "document.body.insertBefore(d,document.body.firstChild);";
                break;
            case "bottom":
                js = "var d=document.createElement('div');d.innerHTML='" + escapedHtml +
                     "';d.style.cssText='position:fixed;bottom:0;left:0;right:0;z-index:99999;';" +
                     "document.body.appendChild(d);";
                break;
            default:
                js = "var d=document.createElement('div');d.innerHTML='" + escapedHtml +
                     "';document.body.appendChild(d);";
                break;
        }

        runOnWebView(webView ->
            webView.evaluateJavascript(js, value -> {
                JSObject result = new JSObject();
                result.put("success", true);
                call.resolve(result);
            }),
            () -> call.reject("WebView not available")
        );
    }

    private void runOnWebView(Consumer<WebView> action, Runnable onNull) {
        WebView webView = getBridge().getWebView();
        if (webView != null) {
            webView.post(() -> action.accept(webView));
        } else {
            onNull.run();
        }
    }

    private static String escapeForJs(String input) {
        if (input == null) return "";
        StringBuilder sb = new StringBuilder(input.length());
        for (int i = 0; i < input.length(); i++) {
            char c = input.charAt(i);
            switch (c) {
                case '\\': sb.append("\\\\"); break;
                case '\'': sb.append("\\'"); break;
                case '"': sb.append("\\\""); break;
                case '\n': sb.append("\\n"); break;
                case '\r': sb.append("\\r"); break;
                case '\t': sb.append("\\t"); break;
                case '<': sb.append("\\x3c"); break;
                case '>': sb.append("\\x3e"); break;
                default:
                    if (c < 0x20) {
                        sb.append(String.format("\\u%04x", (int) c));
                    } else {
                        sb.append(c);
                    }
            }
        }
        return sb.toString();
    }
}
