// HP_Monochrome Injected Script
// This runs on the remote monochrome.tf site
(function() {
  'use strict';

  var CURRENT_VERSION = 'v1.4.0';
  var REPO = 'monochrome-music/monochrome-apps';
  var DEBOUNCE_MS = 3000;
  var lastErrorTime = 0;

  // === STYLES ===
  function injectStyles() {
    var css = '' +
      '#hp-source-status{position:fixed;top:0;left:0;right:0;z-index:99999;padding:0.5rem 1rem;padding-top:calc(0.5rem + env(safe-area-inset-top,0px));display:flex;align-items:center;justify-content:center;gap:0.5rem;font-size:0.75rem;font-weight:600;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;transition:all 0.3s ease;}' +
      '#hp-source-status.hp-ok{background:#002200;border-bottom:1px solid #004400;color:#4ade80;}' +
      '#hp-source-status.hp-checking{background:#1a1a2e;border-bottom:1px solid #333;color:#888;}' +
      '#hp-source-status.hp-error{background:#220000;border-bottom:1px solid #440000;color:#f87171;}' +
      '#hp-source-status .hp-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}' +
      '#hp-source-status.hp-ok .hp-dot{background:#4ade80;}' +
      '#hp-source-status.hp-checking .hp-dot{background:#888;animation:hpPulse 1s infinite;}' +
      '#hp-source-status.hp-error .hp-dot{background:#f87171;}' +
      '@keyframes hpPulse{0%,100%{opacity:1;}50%{opacity:0.3;}}' +
      '#hp-update-banner{display:none;position:fixed;top:28px;left:0;right:0;z-index:99999;background:#1a1a2e;border-bottom:1px solid #333;padding:0.75rem 1rem;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;}' +
      '#hp-update-banner .hp-inner{max-width:600px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:0.75rem;}' +
      '#hp-update-banner .hp-text{font-size:0.85rem;color:#e0e0e0;}' +
      '#hp-update-banner .hp-text strong{color:#fff;}' +
      '#hp-update-banner .hp-actions{display:flex;gap:0.5rem;flex-shrink:0;}' +
      '#hp-update-banner .hp-dl{background:#fff;color:#000;border:none;padding:0.4rem 1rem;border-radius:999px;font-size:0.8rem;font-weight:600;cursor:pointer;text-decoration:none;display:inline-block;}' +
      '#hp-update-banner .hp-dismiss{background:transparent;color:#888;border:1px solid #444;padding:0.4rem 0.8rem;border-radius:999px;font-size:0.8rem;cursor:pointer;}' +
      '#hp-error-toast{display:none;position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);z-index:99999;background:#2d1b00;border:1px solid #5a3d00;border-radius:12px;padding:0.75rem 1.25rem;max-width:90%;font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;animation:hpToastPop 0.3s ease;}' +
      '@keyframes hpToastPop{from{transform:translateX(-50%) translateY(20px);opacity:0;}to{transform:translateX(-50%) translateY(0);opacity:1;}}' +
      '#hp-error-toast .hp-inner{display:flex;align-items:center;justify-content:space-between;gap:0.75rem;}' +
      '#hp-error-toast .hp-icon{font-size:1rem;flex-shrink:0;}' +
      '#hp-error-toast .hp-msg{font-size:0.85rem;color:#ffb347;flex:1;}' +
      '#hp-error-toast .hp-ok{background:transparent;color:#888;border:1px solid #5a3d00;padding:0.3rem 0.7rem;border-radius:999px;font-size:0.75rem;cursor:pointer;flex-shrink:0;}';
    var s = document.createElement('style');
    s.textContent = css;
    document.head.appendChild(s);
  }

  // === SOURCE STATUS ===
  function createSourceStatus() {
    var el = document.createElement('div');
    el.id = 'hp-source-status';
    el.className = 'hp-checking';
    el.innerHTML = '<span class="hp-dot"></span><span id="hp-status-text">Checking sources...</span>';
    document.body.insertBefore(el, document.body.firstChild);
  }

  function setSourceStatus(status, text) {
    var el = document.getElementById('hp-source-status');
    var txt = document.getElementById('hp-status-text');
    if (!el || !txt) return;
    el.className = 'hp-' + status;
    txt.textContent = text;
  }

  function checkSourceStatus() {
    setSourceStatus('checking', 'Checking sources...');
    var siteOk = false, apiOk = false;

    function update() {
      if (siteOk && apiOk) {
        setSourceStatus('ok', 'Source OK');
        setTimeout(function() {
          var el = document.getElementById('hp-source-status');
          if (el) { el.style.opacity = '0'; setTimeout(function() { el.remove(); }, 300); }
        }, 3000);
      } else if (!siteOk && !apiOk) {
        setSourceStatus('error', 'Source unavailable');
      }
    }

    fetch(location.origin, { mode: 'no-cors', cache: 'no-store' })
      .then(function() { siteOk = true; update(); })
      .catch(function() { siteOk = false; update(); });

    fetch(location.origin, { method: 'HEAD', cache: 'no-store' })
      .then(function(r) { if (r.ok) apiOk = true; update(); })
      .catch(function() { apiOk = false; update(); });

    setTimeout(function() {
      if (!siteOk || !apiOk) setSourceStatus('error', 'Source slow or unavailable');
    }, 5000);
  }

  // === UPDATE BANNER ===
  function createUpdateBanner() {
    var el = document.createElement('div');
    el.id = 'hp-update-banner';
    el.innerHTML = '<div class="hp-inner"><span class="hp-text">Update available — <strong id="hp-update-ver"></strong></span><div class="hp-actions"><a id="hp-update-link" href="#" target="_blank" class="hp-dl">Download</a><button class="hp-dismiss" onclick="document.getElementById(\'hp-update-banner\').style.display=\'none\'">Dismiss</button></div></div>';
    document.body.insertBefore(el, document.body.firstChild);
  }

  function checkForUpdate() {
    try {
      if (localStorage.getItem('hp_update_dismissed') === '1') return;
    } catch(e) {}
    fetch('https://api.github.com/repos/' + REPO + '/releases/latest')
      .then(function(r) { if (!r.ok) throw new Error(); return r.json(); })
      .then(function(d) {
        if (!d.tag_name || d.tag_name === CURRENT_VERSION) return;
        document.getElementById('hp-update-ver').textContent = d.tag_name;
        document.getElementById('hp-update-link').href = d.html_url;
        document.getElementById('hp-update-banner').style.display = 'block';
      })
      .catch(function() {});
  }

  // === ERROR TOAST ===
  function createErrorToast() {
    var el = document.createElement('div');
    el.id = 'hp-error-toast';
    el.innerHTML = '<div class="hp-inner"><span class="hp-icon">!</span><span class="hp-msg" id="hp-error-msg">Playback issue detected</span><button class="hp-ok" onclick="document.getElementById(\'hp-error-toast\').style.display=\'none\'">OK</button></div>';
    document.body.appendChild(el);
  }

  var errorTimeout = null;
  function showErrorToast(msg) {
    try {
      if (localStorage.getItem('hp_error_dismissed') === '1') return;
    } catch(e) {}
    var now = Date.now();
    if (now - lastErrorTime < DEBOUNCE_MS) return;
    lastErrorTime = now;
    var el = document.getElementById('hp-error-toast');
    var txt = document.getElementById('hp-error-msg');
    if (!el || !txt) return;
    txt.textContent = msg || 'Playback issue detected';
    el.style.display = 'block';
    if (errorTimeout) clearTimeout(errorTimeout);
    errorTimeout = setTimeout(function() { el.style.display = 'none'; }, 6000);
  }

  // === PLAYBACK MONITOR ===
  var ERROR_PATTERNS = [
    /source\s+not\s+found/i,
    /failed\s+to\s+load/i,
    /playback\s+error/i,
    /no\s+source/i,
    /could\s+not\s+load/i,
    /unable\s+to\s+play/i,
    /media\s+error/i,
    /not\s+available/i
  ];

  function watchMediaElements() {
    document.querySelectorAll('audio, video').forEach(function(el) {
      if (el._hpMonitored) return;
      el._hpMonitored = true;
      el.addEventListener('error', function() {
        var err = el.error;
        if (err && err.code >= 2) showErrorToast('Playback error');
      }, true);
    });
  }

  function checkNodeForErrors(node) {
    if (!node || !node.textContent) return false;
    var text = node.textContent;
    for (var i = 0; i < ERROR_PATTERNS.length; i++) {
      if (ERROR_PATTERNS[i].test(text)) {
        showErrorToast('Playback issue detected');
        return true;
      }
    }
    return false;
  }

  function startDomObserver() {
    new MutationObserver(function(mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        if (m.type === 'childList') {
          for (var j = 0; j < m.addedNodes.length; j++) {
            var n = m.addedNodes[j];
            if (n.nodeType === 1) {
              if (checkNodeForErrors(n)) return;
              (n.querySelectorAll ? n.querySelectorAll('*') : []).forEach(function(c) {
                checkNodeForErrors(c);
              });
            }
          }
        }
      }
    }).observe(document.body, { childList: true, subtree: true, characterData: true });
  }

  // Intercept fetch
  var origFetch = window.fetch;
  window.fetch = function() {
    return origFetch.apply(this, arguments).catch(function(err) {
      var url = arguments[0] && arguments[0].url ? arguments[0].url : String(arguments[0]);
      if (/source|stream|play|api/.test(url)) showErrorToast('Network error');
      throw err;
    });
  };

  // Intercept XHR
  var origOpen = XMLHttpRequest.prototype.open;
  XMLHttpRequest.prototype.open = function(method, url) {
    this._hpUrl = url;
    return origOpen.apply(this, arguments);
  };
  var origSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.send = function() {
    var self = this;
    this.addEventListener('error', function() {
      if (/source|stream|play|api/.test(self._hpUrl || '')) showErrorToast('Network error');
    });
    return origSend.apply(this, arguments);
  };

  // === INIT ===
  function init() {
    injectStyles();
    createSourceStatus();
    createUpdateBanner();
    createErrorToast();
    watchMediaElements();
    startDomObserver();
    setInterval(watchMediaElements, 2000);
    checkSourceStatus();
    checkForUpdate();

    // Re-check on SPA navigation
    var origPush = history.pushState;
    history.pushState = function() {
      origPush.apply(this, arguments);
      setTimeout(function() { watchMediaElements(); }, 1000);
    };
  }

  if (document.body) {
    init();
  } else {
    document.addEventListener('DOMContentLoaded', init);
  }
})();
