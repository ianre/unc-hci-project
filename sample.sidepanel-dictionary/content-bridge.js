// Content Script Bridge
// Runs in ISOLATED world to receive messages from api-monitor.js (MAIN world)
// and forward them to the service worker

(function() {
  'use strict';

  // Listen for messages from the MAIN world api-monitor.js
  window.addEventListener('message', (event) => {
    // Only accept messages from the same window
    if (event.source !== window) return;

    // Check if this is an API access detection message
    if (event.data.type === 'API_ACCESS_DETECTED') {
      // Forward to service worker
      chrome.runtime.sendMessage({
        action: 'apiAccessDetected',
        data: event.data.data
      }).catch(() => {
        // Service worker might not be ready yet, that's ok
      });
    }
  });

})();
