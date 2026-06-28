# Capacitor
-keep class com.getcapacitor.** { *; }
-keep class tf.monochrome.app.** { *; }
-keepclassmembers class * extends com.getcapacitor.Plugin {
    @com.getcapacitor.annotation.CapacitorPlugin *;
}
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
