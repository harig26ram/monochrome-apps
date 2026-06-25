(function() {
  'use strict';

  var TOAST_EVENT = 'monochrome-playback-error';
  var DEBOUNCE_MS = 3000;
  var lastErrorTime = 0;

  function showError(msg) {
    var now = Date.now();
    if (now - lastErrorTime < DEBOUNCE_MS) return;
    lastErrorTime = now;
    if (typeof window.showErrorToast === 'function') {
      window.showErrorToast(msg);
    } else {
      window.dispatchEvent(new CustomEvent(TOAST_EVENT, { detail: { message: msg } }));
    }
  }

  // 1. Monitor <audio> and <video> elements for media errors
  function watchMediaElements() {
    var els = document.querySelectorAll('audio, video');
    els.forEach(function(el) {
      if (el._monitorAttached) return;
      el._monitorAttached = true;
      el.addEventListener('error', function(e) {
        var err = el.error;
        if (!err) return;
        // MEDIA_ERR_ABORTED=1, MEDIA_ERR_NETWORK=2, MEDIA_ERR_DECODE=3, MEDIA_ERR_SRC_NOT_SUPPORTED=4
        if (err.code >= 2) {
          showError('Playback error');
        }
      }, true);
    });
  }

  // 2. MutationObserver - watch for error text appearing in DOM
  var ERROR_PATTERNS = [
    /source\s+not\s+found/i,
    /failed\s+to\s+load/i,
    /playback\s+error/i,
    /no\s+source/i,
    /could\s+not\s+load/i,
    /unable\s+to\s+play/i,
    /media\s+error/i,
    /not\s+available/i,
    /unavailable/i
  ];

  function checkNodeForErrors(node) {
    if (!node || !node.textContent) return;
    var text = node.textContent;
    for (var i = 0; i < ERROR_PATTERNS.length; i++) {
      if (ERROR_PATTERNS[i].test(text)) {
        showError('Playback issue detected');
        return true;
      }
    }
    return false;
  }

  var domObserver = null;
  function startDomObserver() {
    if (domObserver) return;
    domObserver = new MutationObserver(function(mutations) {
      for (var i = 0; i < mutations.length; i++) {
        var m = mutations[i];
        if (m.type === 'childList') {
          for (var j = 0; j < m.addedNodes.length; j++) {
            var n = m.addedNodes[j];
            if (n.nodeType === 1) {
              if (checkNodeForErrors(n)) return;
              // Also check children
              var children = n.querySelectorAll ? n.querySelectorAll('*') : [];
              for (var k = 0; k < children.length; k++) {
                if (checkNodeForErrors(children[k])) return;
              }
            }
          }
        } else if (m.type === 'characterData') {
          checkNodeForErrors(m.target);
        }
      }
    });
    domObserver.observe(document.body, {
      childList: true,
      subtree: true,
      characterData: true
    });
  }

  // 3. Intercept fetch() to detect failed API calls
  var origFetch = window.fetch;
  window.fetch = function() {
    return origFetch.apply(this, arguments).catch(function(err) {
      var url = (arguments[0] && arguments[0].url) ? arguments[0].url : String(arguments[0]);
      if (url.indexOf('source') !== -1 || url.indexOf('stream') !== -1 || url.indexOf('play') !== -1 || url.indexOf('api') !== -1) {
        showError('Network error');
      }
      throw err;
    });
  };

  // 4. Intercept XMLHttpRequest for failed requests
  var origXHROpen = XMLHttpRequest.prototype.open;
  var origXHRSend = XMLHttpRequest.prototype.send;
  XMLHttpRequest.prototype.open = function(method, url) {
    this._monitorUrl = url;
    return origXHROpen.apply(this, arguments);
  };
  XMLHttpRequest.prototype.send = function() {
    var self = this;
    this.addEventListener('error', function() {
      var url = self._monitorUrl || '';
      if (url.indexOf('source') !== -1 || url.indexOf('stream') !== -1 || url.indexOf('play') !== -1 || url.indexOf('api') !== -1) {
        showError('Network error');
      }
    });
    return origXHRSend.apply(this, arguments);
  };

  // 5. Periodically re-scan for new media elements
  setInterval(function() {
    watchMediaElements();
  }, 2000);

  // Init
  if (document.body) {
    watchMediaElements();
    startDomObserver();
  } else {
    document.addEventListener('DOMContentLoaded', function() {
      watchMediaElements();
      startDomObserver();
    });
  }

  // Also watch for dynamic SPA navigation
  var origPushState = history.pushState;
  history.pushState = function() {
    setTimeout(function() {
      watchMediaElements();
      startDomObserver();
    }, 1000);
    return origPushState.apply(this, arguments);
  };

})();
