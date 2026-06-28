// HP_Monochrome Injected Script — runs on remote monochrome.tf
(function() {
  'use strict';

  var CURRENT_VERSION = 'v1.6.0';
  var REPO = 'monochrome-music/monochrome-apps';
  var DEBOUNCE_MS = 3000;
  var lastErrorTime = 0;

  // === STYLES ===
  function injectStyles() {
    var css = '' +
      '@keyframes hpFadeIn{from{opacity:0;transform:translateY(-8px);}to{opacity:1;transform:translateY(0);}}' +
      '@keyframes hpPulse{0%,100%{opacity:1;}50%{opacity:0.3;}}' +
      '@keyframes hpShimmer{0%{background-position:-200% 0;}100%{background-position:200% 0;}}' +
      '@keyframes hpToastIn{from{opacity:0;transform:translateX(-50%) translateY(12px) scale(0.96);}to{opacity:1;transform:translateX(-50%) translateY(0) scale(1);}}' +
      '@keyframes hpToastOut{from{opacity:1;transform:translateX(-50%) translateY(0) scale(1);}to{opacity:0;transform:translateX(-50%) translateY(6px) scale(0.96);}}' +
      '@media(prefers-reduced-motion:reduce){*,*::before,*::after{animation-duration:0.01ms!important;transition-duration:0.01ms!important;}}' +

      // Source status
      '#hp-source-status{position:fixed;top:0;left:0;right:0;z-index:99999;padding:0.45rem 1rem;padding-top:calc(0.45rem + env(safe-area-inset-top,0px));display:flex;align-items:center;justify-content:center;gap:0.5rem;font-size:0.72rem;font-weight:600;letter-spacing:0.01em;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",Roboto,sans-serif;backdrop-filter:blur(16px);-webkit-backdrop-filter:blur(16px);transition:all 0.4s cubic-bezier(0.4,0,0.2,1);animation:hpFadeIn 0.3s ease-out;}' +
      '#hp-source-status.hp-ok{background:rgba(0,34,0,0.6);border-bottom:1px solid rgba(74,222,128,0.15);color:#4ade80;}' +
      '#hp-source-status.hp-checking{background:rgba(26,26,46,0.7);border-bottom:1px solid rgba(255,255,255,0.06);color:#888;}' +
      '#hp-source-status.hp-error{background:rgba(34,0,0,0.6);border-bottom:1px solid rgba(248,113,113,0.15);color:#f87171;}' +
      '#hp-source-status .hp-dot{width:6px;height:6px;border-radius:50%;flex-shrink:0;}' +
      '#hp-source-status.hp-ok .hp-dot{background:#4ade80;box-shadow:0 0 8px rgba(74,222,128,0.4);}' +
      '#hp-source-status.hp-checking .hp-dot{background:#888;animation:hpPulse 1.2s ease-in-out infinite;}' +
      '#hp-source-status.hp-error .hp-dot{background:#f87171;box-shadow:0 0 8px rgba(248,113,113,0.4);}' +

      // Update banner
      '#hp-update-banner{display:none;position:fixed;top:0;left:0;right:0;z-index:99999;padding:0.6rem 1rem;padding-top:calc(0.6rem + env(safe-area-inset-top,0px));background:rgba(26,26,46,0.8);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border-bottom:1px solid rgba(255,255,255,0.06);font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",Roboto,sans-serif;animation:hpFadeIn 0.3s ease-out;}' +
      '#hp-update-banner .hp-inner{max-width:600px;margin:0 auto;display:flex;align-items:center;justify-content:space-between;gap:0.75rem;}' +
      '#hp-update-banner .hp-text{font-size:0.78rem;color:rgba(255,255,255,0.7);}' +
      '#hp-update-banner .hp-text strong{color:#fff;font-weight:600;}' +
      '#hp-update-banner .hp-actions{display:flex;gap:0.5rem;flex-shrink:0;}' +
      '#hp-update-banner .hp-dl{background:#fff;color:#000;border:none;padding:0.32rem 0.85rem;border-radius:999px;font-size:0.73rem;font-weight:600;cursor:pointer;text-decoration:none;display:inline-block;transition:opacity 0.2s,transform 0.15s;}' +
      '#hp-update-banner .hp-dl:active{opacity:0.7;transform:scale(0.97);}' +
      '#hp-update-banner .hp-dismiss{background:transparent;color:rgba(255,255,255,0.4);border:1px solid rgba(255,255,255,0.1);padding:0.32rem 0.7rem;border-radius:999px;font-size:0.73rem;cursor:pointer;transition:all 0.2s;}' +
      '#hp-update-banner .hp-dismiss:hover{border-color:rgba(255,255,255,0.2);color:rgba(255,255,255,0.6);}' +

      // Error toast
      '#hp-error-toast{display:none;position:fixed;bottom:2rem;left:50%;transform:translateX(-50%);z-index:99999;background:rgba(45,27,0,0.85);backdrop-filter:blur(20px);-webkit-backdrop-filter:blur(20px);border:1px solid rgba(90,61,0,0.4);border-radius:14px;padding:0.65rem 1.1rem;max-width:88%;font-family:-apple-system,BlinkMacSystemFont,"SF Pro Display","Segoe UI",Roboto,sans-serif;animation:hpToastIn 0.3s cubic-bezier(0.4,0,0.2,1);box-shadow:0 8px 32px rgba(0,0,0,0.5),0 0 0 1px rgba(255,179,71,0.05);}' +
      '#hp-error-toast.hp-hiding{animation:hpToastOut 0.25s cubic-bezier(0.4,0,0.2,1) forwards;}' +
      '#hp-error-toast .hp-inner{display:flex;align-items:center;justify-content:space-between;gap:0.6rem;}' +
      '#hp-error-toast .hp-icon{font-size:0.85rem;flex-shrink:0;width:22px;height:22px;border-radius:50%;background:rgba(255,179,71,0.15);display:flex;align-items:center;justify-content:center;color:#ffb347;font-weight:700;}' +
      '#hp-error-toast .hp-msg{font-size:0.78rem;color:#ffb347;flex:1;line-height:1.3;}' +
      '#hp-error-toast .hp-ok{background:transparent;color:rgba(255,179,71,0.5);border:1px solid rgba(90,61,0,0.3);padding:0.22rem 0.55rem;border-radius:999px;font-size:0.68rem;cursor:pointer;flex-shrink:0;transition:all 0.2s;}' +
      '#hp-error-toast .hp-ok:hover{border-color:rgba(90,61,0,0.6);color:#ffb347;}';
    var s = document.createElement('style');
    s.id = 'hp-mono-styles';
    s.textContent = css;
    document.head.appendChild(s);
  }

  // === SOURCE STATUS ===
  function createSourceStatus() {
    var el = document.createElement('div');
    el.id = 'hp-source-status';
    el.className = 'hp-checking';
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
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
          if (el) {
            el.style.opacity = '0';
            setTimeout(function() { el.remove(); }, 400);
          }
        }, 2500);
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
    el.setAttribute('role', 'status');
    el.setAttribute('aria-live', 'polite');
    el.innerHTML = '<div class="hp-inner"><span class="hp-text">Update available — <strong id="hp-update-ver"></strong></span><div class="hp-actions"><a id="hp-update-link" href="#" target="_blank" class="hp-dl" rel="noopener">Download</a><button class="hp-dismiss" aria-label="Dismiss update notification" onclick="document.getElementById(\'hp-update-banner\').style.display=\'none\'">Dismiss</button></div></div>';
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
    el.setAttribute('role', 'alert');
    el.setAttribute('aria-live', 'assertive');
    el.innerHTML = '<div class="hp-inner"><span class="hp-icon" aria-hidden="true">!</span><span class="hp-msg" id="hp-error-msg">Playback issue detected</span><button class="hp-ok" aria-label="Dismiss error" onclick="dismissHpToast()">OK</button></div>';
    document.body.appendChild(el);
  }

  window.dismissHpToast = function() {
    var el = document.getElementById('hp-error-toast');
    if (!el) return;
    el.classList.add('hp-hiding');
    setTimeout(function() { el.style.display = 'none'; el.classList.remove('hp-hiding'); }, 250);
  };

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
    el.classList.remove('hp-hiding');
    if (errorTimeout) clearTimeout(errorTimeout);
    errorTimeout = setTimeout(function() { dismissHpToast(); }, 6000);
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
