// API Monitoring Script
// Runs in MAIN world at document_start to intercept API access
// This script runs BEFORE page scripts, allowing reliable interception

(function() {
  'use strict';

  // Track what APIs have been accessed (only sensitive/identifiable information)
  const apiAccess = {
    // Physical Privacy
    geolocation: false,
    mediaDevices: false, // Camera/Microphone
    screenCapture: false, // Screen recording

    // Data Theft
    clipboardRead: false,
    credentials: false, // Password access

    // Device Fingerprinting (creates unique device ID)
    canvas: false,
    webgl: false,
    audioContext: false,
    fonts: false,

    // Persistent Tracking
    localStorage: false,
    indexedDB: false,

    // IP Leak
    webrtc: false,

    // Browsing History
    referrer: false,

    // Spam/Phishing
    notifications: false
  };

  // Send update to extension
  function notifyExtension() {
    window.postMessage({
      type: 'API_ACCESS_DETECTED',
      data: apiAccess
    }, '*');
  }

  // Intercept navigator.geolocation
  try {
    const originalGeolocation = Object.getOwnPropertyDescriptor(Navigator.prototype, 'geolocation');
    if (originalGeolocation && originalGeolocation.get) {
      // Get the original geolocation object
      const originalGeo = originalGeolocation.get.call(navigator);

      if (originalGeo) {
        // Wrap getCurrentPosition once
        if (originalGeo.getCurrentPosition) {
          const origGetPos = originalGeo.getCurrentPosition;
          originalGeo.getCurrentPosition = function() {
            apiAccess.geolocation = true;
            notifyExtension();
            return origGetPos.apply(this, arguments);
          };
        }

        // Wrap watchPosition once
        if (originalGeo.watchPosition) {
          const origWatchPos = originalGeo.watchPosition;
          originalGeo.watchPosition = function() {
            apiAccess.geolocation = true;
            notifyExtension();
            return origWatchPos.apply(this, arguments);
          };
        }
      }

      // Also detect when geolocation property is accessed
      Object.defineProperty(Navigator.prototype, 'geolocation', {
        get: function() {
          apiAccess.geolocation = true;
          notifyExtension();
          return originalGeo;
        },
        configurable: true
      });
    }
  } catch (e) {}

  // Intercept document.referrer (reveals previous website)
  try {
    const originalReferrer = Object.getOwnPropertyDescriptor(Document.prototype, 'referrer');
    if (originalReferrer && originalReferrer.get) {
      Object.defineProperty(Document.prototype, 'referrer', {
        get: function() {
          apiAccess.referrer = true;
          notifyExtension();
          return originalReferrer.get.call(this);
        },
        configurable: true
      });
    }
  } catch (e) {}

  // Intercept Clipboard API (reading clipboard)
  try {
    const originalClipboard = Object.getOwnPropertyDescriptor(Navigator.prototype, 'clipboard');
    if (originalClipboard && originalClipboard.get) {
      const originalClip = originalClipboard.get.call(navigator);

      if (originalClip) {
        // Wrap readText
        if (originalClip.readText) {
          const origReadText = originalClip.readText;
          originalClip.readText = function() {
            apiAccess.clipboardRead = true;
            notifyExtension();
            return origReadText.apply(this, arguments);
          };
        }

        // Wrap read
        if (originalClip.read) {
          const origRead = originalClip.read;
          originalClip.read = function() {
            apiAccess.clipboardRead = true;
            notifyExtension();
            return origRead.apply(this, arguments);
          };
        }
      }

      // Detect when clipboard property is accessed
      Object.defineProperty(Navigator.prototype, 'clipboard', {
        get: function() {
          return originalClip;
        },
        configurable: true
      });
    }
  } catch (e) {}

  // Intercept Credential Management API (password access)
  try {
    const originalCredentials = Object.getOwnPropertyDescriptor(Navigator.prototype, 'credentials');
    if (originalCredentials && originalCredentials.get) {
      const originalCreds = originalCredentials.get.call(navigator);

      if (originalCreds) {
        // Wrap get (retrieve credentials)
        if (originalCreds.get) {
          const origGet = originalCreds.get;
          originalCreds.get = function() {
            apiAccess.credentials = true;
            notifyExtension();
            return origGet.apply(this, arguments);
          };
        }

        // Wrap store (store credentials)
        if (originalCreds.store) {
          const origStore = originalCreds.store;
          originalCreds.store = function() {
            apiAccess.credentials = true;
            notifyExtension();
            return origStore.apply(this, arguments);
          };
        }
      }

      // Detect when credentials property is accessed
      Object.defineProperty(Navigator.prototype, 'credentials', {
        get: function() {
          return originalCreds;
        },
        configurable: true
      });
    }
  } catch (e) {}

  // Intercept Notification API
  try {
    if (window.Notification) {
      const OriginalNotification = window.Notification;

      // Wrap Notification constructor
      window.Notification = function() {
        apiAccess.notifications = true;
        notifyExtension();
        return new OriginalNotification(...arguments);
      };
      window.Notification.prototype = OriginalNotification.prototype;

      // Copy static properties with getters to keep them in sync
      Object.defineProperty(window.Notification, 'permission', {
        get: function() {
          return OriginalNotification.permission;
        }
      });

      Object.defineProperty(window.Notification, 'maxActions', {
        get: function() {
          return OriginalNotification.maxActions;
        }
      });

      // Wrap requestPermission
      if (OriginalNotification.requestPermission) {
        window.Notification.requestPermission = function() {
          apiAccess.notifications = true;
          notifyExtension();
          return OriginalNotification.requestPermission.apply(this, arguments);
        };
      }
    }
  } catch (e) {}

  // Intercept navigator.mediaDevices
  try {
    const originalMediaDevices = Object.getOwnPropertyDescriptor(Navigator.prototype, 'mediaDevices');
    if (originalMediaDevices && originalMediaDevices.get) {
      // Get the original mediaDevices object
      const originalMD = originalMediaDevices.get.call(navigator);

      if (originalMD) {
        // Wrap enumerateDevices
        if (originalMD.enumerateDevices) {
          const origEnumerate = originalMD.enumerateDevices;
          originalMD.enumerateDevices = function() {
            apiAccess.mediaDevices = true;
            notifyExtension();
            return origEnumerate.apply(this, arguments);
          };
        }

        // Wrap getUserMedia
        if (originalMD.getUserMedia) {
          const origGetUserMedia = originalMD.getUserMedia;
          originalMD.getUserMedia = function() {
            apiAccess.mediaDevices = true;
            notifyExtension();
            return origGetUserMedia.apply(this, arguments);
          };
        }

        // Wrap getDisplayMedia (screen capture)
        if (originalMD.getDisplayMedia) {
          const origGetDisplayMedia = originalMD.getDisplayMedia;
          originalMD.getDisplayMedia = function() {
            apiAccess.screenCapture = true;
            notifyExtension();
            return origGetDisplayMedia.apply(this, arguments);
          };
        }
      }

      // Also detect when mediaDevices property is accessed
      Object.defineProperty(Navigator.prototype, 'mediaDevices', {
        get: function() {
          apiAccess.mediaDevices = true;
          notifyExtension();
          return originalMD;
        },
        configurable: true
      });
    }
  } catch (e) {}

  // Intercept localStorage
  try {
    const originalLocalStorage = Object.getOwnPropertyDescriptor(Window.prototype, 'localStorage');
    if (originalLocalStorage && originalLocalStorage.get) {
      Object.defineProperty(Window.prototype, 'localStorage', {
        get: function() {
          apiAccess.localStorage = true;
          notifyExtension();
          return originalLocalStorage.get.call(this);
        },
        configurable: true
      });
    }
  } catch (e) {}

  // Intercept indexedDB
  try {
    const originalIndexedDB = Object.getOwnPropertyDescriptor(Window.prototype, 'indexedDB');
    if (originalIndexedDB && originalIndexedDB.get) {
      Object.defineProperty(Window.prototype, 'indexedDB', {
        get: function() {
          apiAccess.indexedDB = true;
          notifyExtension();
          return originalIndexedDB.get.call(this);
        },
        configurable: true
      });
    }
  } catch (e) {}

  // Intercept Canvas (toDataURL, toBlob, and getImageData)
  try {
    const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;
    HTMLCanvasElement.prototype.toDataURL = function() {
      apiAccess.canvas = true;
      notifyExtension();
      return originalToDataURL.apply(this, arguments);
    };

    const originalToBlob = HTMLCanvasElement.prototype.toBlob;
    HTMLCanvasElement.prototype.toBlob = function() {
      apiAccess.canvas = true;
      notifyExtension();
      return originalToBlob.apply(this, arguments);
    };
  } catch (e) {}

  // Intercept CanvasRenderingContext2D.getImageData (also used for fingerprinting)
  try {
    if (CanvasRenderingContext2D && CanvasRenderingContext2D.prototype.getImageData) {
      const originalGetImageData = CanvasRenderingContext2D.prototype.getImageData;
      CanvasRenderingContext2D.prototype.getImageData = function() {
        apiAccess.canvas = true;
        notifyExtension();
        return originalGetImageData.apply(this, arguments);
      };
    }
  } catch (e) {}

  // Intercept Canvas getContext for WebGL detection
  try {
    const originalGetContext = HTMLCanvasElement.prototype.getContext;
    HTMLCanvasElement.prototype.getContext = function(type) {
      // WebGL context access alone reveals GPU info (fingerprinting)
      if (type === 'webgl' || type === 'webgl2' || type === 'experimental-webgl') {
        apiAccess.webgl = true;
        notifyExtension();
      }
      // Note: 2D canvas is only flagged when toDataURL/toBlob is called (actual fingerprinting)
      return originalGetContext.apply(this, arguments);
    };
  } catch (e) {}

  // Intercept AudioContext
  try {
    if (window.AudioContext) {
      const OriginalAudioContext = window.AudioContext;
      window.AudioContext = function() {
        apiAccess.audioContext = true;
        notifyExtension();
        return new OriginalAudioContext(...arguments);
      };
      window.AudioContext.prototype = OriginalAudioContext.prototype;
    }
    if (window.webkitAudioContext) {
      const OriginalWebkitAudioContext = window.webkitAudioContext;
      window.webkitAudioContext = function() {
        apiAccess.audioContext = true;
        notifyExtension();
        return new OriginalWebkitAudioContext(...arguments);
      };
      window.webkitAudioContext.prototype = OriginalWebkitAudioContext.prototype;
    }
  } catch (e) {}

  // Intercept WebRTC
  try {
    if (window.RTCPeerConnection) {
      const OriginalRTC = window.RTCPeerConnection;
      window.RTCPeerConnection = function() {
        apiAccess.webrtc = true;
        notifyExtension();
        return new OriginalRTC(...arguments);
      };
      window.RTCPeerConnection.prototype = OriginalRTC.prototype;
    }
    if (window.webkitRTCPeerConnection) {
      const OriginalWebkitRTC = window.webkitRTCPeerConnection;
      window.webkitRTCPeerConnection = function() {
        apiAccess.webrtc = true;
        notifyExtension();
        return new OriginalWebkitRTC(...arguments);
      };
      window.webkitRTCPeerConnection.prototype = OriginalWebkitRTC.prototype;
    }
  } catch (e) {}

  // Intercept Font Detection
  // Note: document.fonts may not exist at document_start, so we intercept it lazily
  try {
    const originalFontsDescriptor = Object.getOwnPropertyDescriptor(Document.prototype, 'fonts');
    if (originalFontsDescriptor && originalFontsDescriptor.get) {
      // Flag to ensure we only wrap once (moved outside getter)
      let fontsIntercepted = false;
      let wrappedFonts = null;

      Object.defineProperty(Document.prototype, 'fonts', {
        get: function() {
          const fonts = originalFontsDescriptor.get.call(this);

          // Wrap the check method once
          if (fonts && fonts.check && !fontsIntercepted) {
            fontsIntercepted = true;
            wrappedFonts = fonts;
            const originalCheck = fonts.check;
            fonts.check = function() {
              apiAccess.fonts = true;
              notifyExtension();
              return originalCheck.apply(this, arguments);
            };
          }

          return fonts;
        },
        configurable: true
      });
    }
  } catch (e) {}

})();
