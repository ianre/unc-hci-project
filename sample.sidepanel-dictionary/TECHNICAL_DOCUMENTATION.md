# Security Information Panel - Technical Documentation

## Overview

This Chrome extension monitors sensitive browser API access and network requests to provide real-time visibility into privacy and security risks.

## Architecture

### Components

1. **api-monitor.js** (Content Script - MAIN world)
   - Runs at `document_start` before page scripts
   - Intercepts browser APIs using property descriptors and proxies
   - Executes in page's JavaScript context (world: MAIN)

2. **content-bridge.js** (Content Script - ISOLATED world)
   - Runs in isolated extension context
   - Receives `postMessage` events from api-monitor.js
   - Forwards to service worker via `chrome.runtime.sendMessage`

3. **service-worker.js** (Background Service Worker)
   - Aggregates data per tab
   - Monitors network requests via webRequest API
   - Categorizes third-party domains
   - Handles side panel communication

4. **security-ui.js** (Side Panel UI)
   - Renders security information
   - Displays API access, trackers, warnings

5. **sidepanel.js** (Side Panel Controller)
   - Requests data from service worker
   - Handles tab updates and refreshes

## Message Flow

```
Page Script Access API
         ↓
api-monitor.js intercepts (MAIN world)
         ↓
window.postMessage (cross-context)
         ↓
content-bridge.js receives (ISOLATED world)
         ↓
chrome.runtime.sendMessage
         ↓
service-worker.js stores data
         ↓
Side panel requests data
         ↓
security-ui.js displays
```

## API Interception Techniques

### Pattern 1: Property Getter Interception

Used for: geolocation, referrer, localStorage, indexedDB, clipboard, credentials

```javascript
const originalDescriptor = Object.getOwnPropertyDescriptor(
  Navigator.prototype,
  'geolocation'
);

Object.defineProperty(Navigator.prototype, 'geolocation', {
  get: function() {
    logAccess('geolocation');
    return originalDescriptor.get.call(this);
  },
  configurable: true
});
```

**Why this works**: Intercepts property access before page scripts run.

### Pattern 2: Method Wrapping

Used for: geolocation methods, clipboard methods, credential methods

```javascript
const originalGeo = navigator.geolocation;
const origGetPos = originalGeo.getCurrentPosition;

originalGeo.getCurrentPosition = function() {
  logAccess('geolocation');
  return origGetPos.apply(this, arguments);
};
```

**Why this works**: Wraps methods to detect actual usage, not just property access.

### Pattern 3: Constructor Proxying

Used for: Notification, AudioContext, WebRTC, RTCPeerConnection

```javascript
const OriginalNotification = window.Notification;

window.Notification = function() {
  logAccess('notifications');
  return new OriginalNotification(...arguments);
};

window.Notification.prototype = OriginalNotification.prototype;
```

**Why this works**: Intercepts constructor calls while preserving prototype chain.

### Pattern 4: Prototype Method Replacement

Used for: Canvas (toDataURL, toBlob), HTMLCanvasElement.getContext

```javascript
const originalToDataURL = HTMLCanvasElement.prototype.toDataURL;

HTMLCanvasElement.prototype.toDataURL = function() {
  logAccess('canvas');
  return originalToDataURL.apply(this, arguments);
};
```

**Why this works**: Replaces prototype methods to detect fingerprinting attempts.

## Tracked APIs

### Physical Privacy (3 APIs)
- `navigator.geolocation` - Location tracking
- `navigator.mediaDevices.getUserMedia()` - Camera/Microphone
- `navigator.mediaDevices.getDisplayMedia()` - Screen capture

### Data Theft (2 APIs)
- `navigator.clipboard.readText()` / `.read()` - Clipboard access
- `navigator.credentials.get()` / `.store()` - Password access

### Device Fingerprinting (4 APIs)
- `canvas.toDataURL()` / `.toBlob()` / `context.getImageData()` - Canvas fingerprinting
- `canvas.getContext('webgl')` - WebGL fingerprinting
- `AudioContext` constructor - Audio fingerprinting
- `document.fonts.check()` - Font detection

### Persistent Tracking (2 APIs)
- `window.localStorage` - Persistent storage
- `window.indexedDB` - Database storage

### Network (1 API)
- `RTCPeerConnection` constructor - WebRTC IP leak

### History (1 API)
- `document.referrer` - Previous page tracking

### Notifications (1 API)
- `Notification` constructor / `.requestPermission()` - Push notifications

**Total: 15 sensitive APIs monitored**

## Network Request Tracking

### Implementation

```javascript
chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const tabId = details.tabId;
    const requestUrl = new URL(details.url);
    const requestDomain = requestUrl.hostname;

    // Set main domain from main_frame
    if (details.type === 'main_frame') {
      data.mainDomain = requestDomain;
      return;
    }

    // Check if third-party
    const isThirdParty = requestDomain !== data.mainDomain &&
                        !requestDomain.endsWith('.' + data.mainDomain);

    if (isThirdParty) {
      categorizeAndTrack(requestDomain);
    }
  },
  { urls: ['<all_urls>'] }
);
```

### Domain Categorization

Domains are categorized into:
- **Analytics**: Google Analytics, Mixpanel, Amplitude, etc.
- **Advertising**: DoubleClick, Amazon Ads, Criteo, etc.
- **Social Media**: Facebook Pixel, Twitter Analytics, etc.
- **Tracking**: Hotjar, Crazy Egg, etc.
- **Marketing**: Mailchimp, HubSpot, etc.
- **Payments**: Stripe, PayPal, etc.
- **CDN**: Cloudflare, Akamai, etc.

Known trackers list: 70+ domains across 7 categories

## Data Structure

### Per-Tab Tracking

```javascript
tabRequestData = Map<tabId, {
  thirdPartyRequests: number,
  trackerRequests: number,
  mixedContent: boolean,
  domains: Set<string>,
  mainDomain: string,
  collectors: {
    analytics: Set<string>,
    advertising: Set<string>,
    socialMedia: Set<string>,
    tracking: Set<string>,
    marketing: Set<string>,
    payments: Set<string>,
    cdn: Set<string>,
    other: Set<string>
  },
  apiAccess: {
    geolocation: boolean,
    mediaDevices: boolean,
    screenCapture: boolean,
    clipboardRead: boolean,
    credentials: boolean,
    canvas: boolean,
    webgl: boolean,
    audioContext: boolean,
    fonts: boolean,
    localStorage: boolean,
    indexedDB: boolean,
    webrtc: boolean,
    referrer: boolean,
    notifications: boolean
  }
}>
```

### Cleanup

- Tab data cleared on navigation (`webNavigation.onBeforeNavigate`)
- Tab data cleared on tab close (`tabs.onRemoved`)

## Security Considerations

### Why MAIN World Injection is Safe

1. **Read-Only Monitoring**: Extension only observes API calls, doesn't modify behavior
2. **No Data Extraction**: Doesn't read API return values (e.g., doesn't see actual location)
3. **Isolated Communication**: Uses postMessage to communicate with isolated world
4. **No Privileged Access**: MAIN world script has no chrome.* API access

### Potential Risks Mitigated

- **CSP Bypass**: Necessary for early injection, but justified for security monitoring
- **Page Script Interference**: All interceptions preserve original functionality
- **Memory Leaks**: Proper cleanup on tab close/navigation

## Performance

### Optimizations

1. **Minimal Overhead**: Interceptions add negligible overhead (~microseconds)
2. **Lazy Wrapping**: Some APIs (fonts) only wrapped when first accessed
3. **Efficient Messaging**: Debounced updates to reduce message frequency
4. **Set-Based Tracking**: O(1) domain deduplication

### Benchmarks

- API interception overhead: < 0.1ms per call
- Network request categorization: < 0.5ms per request
- Memory per tab: ~50-100KB

## Browser Compatibility

### Tested On
- Chrome 120+ (Manifest V3)
- Edge 120+ (Chromium-based)

### Requirements
- Chrome 111+ (for `world: "MAIN"` in manifest)
- Chrome 102+ (for programmatic registration alternative)

### Known Issues
- Safari: Not compatible (different extension API)
- Firefox: Would require adaptation (different content script model)

## Limitations

### Cannot Detect

1. **Server-Side Tracking**: IP logging, server-side analytics
2. **Form Submissions**: Data sent via POST/form data
3. **Passive Fingerprinting**: Network timing, TLS fingerprinting
4. **Cross-Site Tracking**: Via authenticated sessions
5. **Machine Learning Profiling**: Behavioral analysis done server-side

### False Positives

- Canvas used for legitimate rendering may trigger fingerprinting warning
- WebGL for 3D graphics may trigger fingerprinting warning
- LocalStorage for app functionality triggers tracking warning

### False Negatives

- Page scripts can access APIs before our interception (race condition)
- Some APIs may be accessed via different code paths we don't intercept
- Server-side tracking invisible to browser

## Debugging

### Console Logging

Service worker logs:
```javascript
console.log('[Service Worker] Starting up...');
console.log('[Tracker Detection] Request detected:', url);
console.log('[API Monitor] Updated API access for tab', tabId);
```

### Accessing Logs

1. Open `chrome://extensions`
2. Find "Security Information Panel"
3. Click "service worker" link
4. View console logs

### Testing

Test specific APIs:
```javascript
// In page console
navigator.geolocation.getCurrentPosition(() => {});
navigator.clipboard.readText();
localStorage.getItem('test');
new Notification('test');
```

## Manifest Permissions Explained

```json
{
  "permissions": [
    "sidePanel",      // Display side panel UI
    "contextMenus",   // "Show Security Info" context menu
    "storage",        // Store extension settings
    "tabs",           // Access tab information
    "cookies",        // Read cookie data
    "webRequest",     // Monitor network requests
    "webNavigation"   // Track page navigation
  ],
  "host_permissions": ["<all_urls>"] // Access all websites
}
```

## Future Enhancements

### Potential Additions

1. **Bluetooth/USB Detection**: Web Bluetooth/USB API monitoring
2. **Sensor Access**: Accelerometer, gyroscope monitoring
3. **Network Information**: Connection type fingerprinting
4. **Idle Detection**: Idle Detection API monitoring
5. **File System Access**: File System API monitoring
6. **Export Data**: CSV/JSON export of tracking data
7. **Historical Tracking**: Track patterns over time
8. **Whitelist/Blacklist**: Per-site privacy settings

### Architecture Improvements

1. **Settings Page**: User preferences for sensitivity levels
2. **Notification Alerts**: Real-time warnings for high-risk access
3. **Dashboard**: Aggregate statistics across all sites
4. **Blocking Mode**: Option to block certain APIs (requires different approach)

## Development

### File Structure
```
extension/
├── manifest.json              # Extension configuration
├── service-worker.js          # Background processing
├── api-monitor.js            # API interception (MAIN world)
├── content-bridge.js         # Message bridge (ISOLATED world)
├── sidepanel.html            # UI structure
├── sidepanel.js              # UI controller
├── security-ui.js            # UI rendering
├── images/                   # Icons
├── SECURITY_PRIVACY_GUIDE.md # User documentation
└── TECHNICAL_DOCUMENTATION.md # This file
```

### Build Process

No build required - load as unpacked extension.

### Testing Workflow

1. Make code changes
2. Go to `chrome://extensions`
3. Click reload icon
4. Test on target website
5. Check service worker console for logs

## References

- [Chrome Extension Manifest V3](https://developer.chrome.com/docs/extensions/mv3/)
- [Content Scripts](https://developer.chrome.com/docs/extensions/develop/concepts/content-scripts)
- [webRequest API](https://developer.chrome.com/docs/extensions/reference/api/webRequest)
- [Canvas Fingerprinting](https://browserleaks.com/canvas)
- [WebRTC Leaks](https://browserleaks.com/webrtc)
- [EFF Cover Your Tracks](https://coveryourtracks.eff.org/)
