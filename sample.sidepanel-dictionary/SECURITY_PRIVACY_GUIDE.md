# Security & Privacy Information Panel - User Guide

## What This Extension Does

The Security Information Panel is a Chrome extension that monitors what sensitive information websites are accessing about you. It provides real-time visibility into privacy-invasive tracking techniques, data collection attempts, and security risks.

## Why This Matters

Most users don't realize how much information websites can collect about them. This extension reveals:
- **What data** websites are accessing
- **Who is collecting** your data (first-party and third-party trackers)
- **Hidden tracking** methods that work even without cookies

---

## Categories of Information Monitored

### 1. Physical Privacy Invasion

#### Geolocation
**What it is**: Your physical location (latitude/longitude coordinates)

**How it's accessed**: Websites call `navigator.geolocation.getCurrentPosition()` or `navigator.geolocation.watchPosition()`

**Privacy risk**: 🔴 **HIGH**
- Reveals your exact location
- Can track your movements over time
- Used for location-based advertising
- Can reveal home/work addresses

**What to watch for**:
- Legitimate use: Maps, weather, restaurant finders
- Suspicious: News sites, random blogs requesting location

#### Camera/Microphone Access
**What it is**: Access to your camera and microphone devices

**How it's accessed**: Websites call `navigator.mediaDevices.getUserMedia()` or `navigator.mediaDevices.enumerateDevices()`

**Privacy risk**: 🔴 **HIGH**
- Can spy on you through camera/microphone
- Device enumeration used for fingerprinting
- Can identify specific hardware

**What to watch for**:
- Legitimate use: Video conferencing, photo uploads
- Suspicious: Sites that don't need camera/mic access

#### Screen Recording
**What it is**: Ability to record your entire screen

**How it's accessed**: Websites call `navigator.mediaDevices.getDisplayMedia()`

**Privacy risk**: 🔴 **CRITICAL**
- Can record everything on your screen
- Captures passwords, personal documents, other tabs
- Records all visible information

**What to watch for**:
- Legitimate use: Screen sharing for support/collaboration
- Suspicious: Any site requesting screen access without clear reason

---

### 2. Data Theft Attempts

#### Clipboard Reading
**What it is**: Reading what you've copied to clipboard

**How it's accessed**: Websites call `navigator.clipboard.readText()` or `navigator.clipboard.read()`

**Privacy risk**: 🔴 **CRITICAL**
- Steals passwords you've copied
- Captures credit card numbers
- Reads any sensitive data you copy
- Works silently without notification

**What to watch for**:
- Legitimate use: "Paste" buttons on forms
- Suspicious: News sites, blogs accessing clipboard
- **Common abuse**: Many sites read clipboard automatically

#### Password Access
**What it is**: Access to passwords saved in your browser

**How it's accessed**: Websites call `navigator.credentials.get()` or `navigator.credentials.store()`

**Privacy risk**: 🔴 **HIGH**
- Can request stored passwords for their domain
- Can attempt to store fake credentials
- Part of Credential Management API

**What to watch for**:
- Legitimate use: Modern login flows using Web Authentication
- Suspicious: Sites you don't trust asking for credential access

---

### 3. Browsing History Tracking

#### Previous Website
**What it is**: The URL you visited immediately before this site

**How it's accessed**: Websites read `document.referrer`

**Privacy risk**: 🟡 **MEDIUM**
- Reveals where you came from
- Exposes your search terms (if from search engine)
- Tracks your browsing path across sites
- Shared with advertisers

**Example**:
- You search "best divorce lawyers" on Google
- Click result to go to LegalSite.com
- LegalSite sees your full Google search URL including "best divorce lawyers"

**What to watch for**:
- Very common and mostly unavoidable
- Combined with other data to build profiles

---

### 4. Device Fingerprinting

**What it is**: Creating a unique "fingerprint" of your device to track you **without cookies**

**Privacy risk**: 🔴 **HIGH**
- Tracks you even if you delete cookies
- Works in private/incognito mode
- Nearly impossible to prevent
- Follows you across different websites

#### Canvas Fingerprinting
**How it works**: Websites draw invisible images and extract pixel data unique to your device

**Technical details**: Calls `canvas.toDataURL()`, `canvas.toBlob()`, or `context.getImageData()`

**Why it's unique**: Tiny rendering differences in graphics hardware create unique signatures

#### WebGL Fingerprinting
**How it works**: Accesses 3D graphics card information

**Technical details**: Calls `canvas.getContext('webgl')` or `canvas.getContext('webgl2')`

**Why it's unique**: GPU model, driver version, and rendering capabilities differ per device

#### Audio Fingerprinting
**How it works**: Processes audio signals to detect unique audio hardware characteristics

**Technical details**: Creates `AudioContext` objects to analyze audio processing

**Why it's unique**: Audio hardware processes signals slightly differently

#### Font Detection
**How it works**: Tests which fonts are installed on your system

**Technical details**: Calls `document.fonts.check()` to enumerate available fonts

**Why it's unique**: Font combinations vary widely between users

**Combined Fingerprinting**:
When sites use multiple fingerprinting techniques together, they can create a nearly unique identifier for your device with 99.9%+ accuracy.

---

### 5. Persistent Tracking

**What it is**: Storing data to track you across sessions (like "super cookies")

#### Local Storage
**How it's accessed**: Websites read/write `window.localStorage`

**Privacy risk**: 🟡 **MEDIUM**
- Stores data permanently until manually deleted
- Not cleared in "normal" browsing history deletion
- Can store tracking IDs
- Larger capacity than cookies (5-10MB)

**What it stores**:
- User preferences (legitimate)
- Tracking identifiers (privacy concern)
- Analytics data

#### IndexedDB
**How it's accessed**: Websites read/write `window.indexedDB`

**Privacy risk**: 🟡 **MEDIUM**
- Large storage capacity (50MB-1GB+)
- Complex database for storing extensive data
- Can store detailed user profiles
- Persists across sessions

**What it stores**:
- Offline application data (legitimate)
- Extensive tracking databases (privacy concern)
- User behavior history

---

### 6. Network Privacy Leak

#### WebRTC (IP Address Leak)
**What it is**: Protocol that can reveal your real IP address

**How it's accessed**: Websites create `RTCPeerConnection` objects

**Privacy risk**: 🔴 **HIGH**
- Bypasses VPN protection
- Reveals your real IP address
- Shows local network IP addresses
- Can be used for geolocation

**Why this matters**:
- Even if you use a VPN, WebRTC can leak your actual IP
- Advertisers use this to track your true location
- Can identify you across different networks

**What to watch for**:
- Legitimate use: Video conferencing (Zoom, Google Meet, Discord)
- Suspicious: Sites with no need for real-time communication

---

### 7. Spam & Phishing

#### Notification Requests
**What it is**: Push notifications from websites

**How it's accessed**: Websites call `Notification.requestPermission()` or create `new Notification()`

**Privacy risk**: 🟡 **MEDIUM**
- Spam notifications even when browser is closed
- Used for phishing attacks
- Fake virus/security alerts
- Ad delivery mechanism

**Common abuse**:
- "Click Allow to verify you're not a robot"
- Fake virus warnings
- Cryptocurrency scams
- Adult content notifications

**What to watch for**:
- Only allow notifications from sites you trust
- Most sites don't need notification permission

---

## Third-Party Data Collectors

The extension also tracks **who** is collecting your data by monitoring network requests:

### Categories of Collectors:

1. **Analytics Services** (Google Analytics, Mixpanel, Amplitude)
   - Track your behavior on websites
   - Page views, clicks, time spent
   - Build user profiles

2. **Advertising Networks** (DoubleClick, Amazon Ads, Criteo)
   - Track you across multiple websites
   - Build advertising profiles
   - Retargeting campaigns

3. **Social Media Platforms** (Facebook Pixel, Twitter Analytics)
   - Track you even if not logged in
   - See what sites you visit
   - Build shadow profiles

4. **Tracking & Monitoring** (Hotjar, Crazy Egg)
   - Record your mouse movements
   - Session recordings
   - Heatmaps of clicks

5. **Marketing Services** (Mailchimp, HubSpot)
   - Email tracking
   - Campaign analytics
   - Lead scoring

6. **Payment Processors** (Stripe, PayPal)
   - Payment processing (legitimate)
   - Transaction tracking

7. **Content Delivery Networks** (Cloudflare, Akamai)
   - Deliver website content (legitimate)
   - Can see what content you access

---

## Privacy Analysis Metrics

### Cookies
- **First-party cookies**: Set by the website you're visiting (generally necessary)
- **Third-party cookies**: Set by trackers embedded in the site (privacy concern)

**What's concerning**: More than 10 third-party cookies indicates heavy tracking

### Known Tracker Requests
Requests to domains known for tracking:
- Analytics services
- Ad networks
- Social media trackers
- Behavioral tracking

**What's concerning**: More than 5 tracker requests indicates aggressive tracking

### Third-party Domains
Total number of external domains contacted.

**What's concerning**: 20+ third-party domains means extensive data sharing

---

## Security Warnings

### Connection Security
- **HTTPS**: Encrypted connection (good)
- **HTTP**: Unencrypted connection (bad - your data can be intercepted)

### Mixed Content
- HTTPS page loading HTTP resources
- Security downgrade
- Risk of man-in-the-middle attacks

---

## How to Use This Information

### 🔴 Red Flags (High Risk):
- Screen recording on non-conferencing sites
- Clipboard reading on blogs/news sites
- Geolocation on sites that don't need it
- WebRTC on sites without video/audio features
- Password access on untrusted sites

### 🟡 Yellow Flags (Medium Risk):
- Multiple fingerprinting techniques combined
- Excessive third-party trackers (20+)
- Many third-party cookies (15+)
- Notification requests from questionable sites

### ✅ Generally Safe:
- HTTPS connection
- Few third-party trackers (< 5)
- First-party cookies only
- localStorage for functionality (not tracking)

---

## Common Tracking Scenarios

### Scenario 1: News Website
**Typical tracking**:
- Canvas fingerprinting
- WebGL fingerprinting
- 20-30 third-party trackers
- Google Analytics
- Facebook Pixel
- Ad networks
- Referrer tracking

**Why**: Ad-supported business model requires extensive tracking

### Scenario 2: E-commerce Site
**Typical tracking**:
- LocalStorage (shopping cart)
- Fingerprinting (fraud prevention + tracking)
- Payment processor (legitimate)
- Retargeting pixels
- Analytics

**Why**: Mix of legitimate functionality and aggressive marketing

### Scenario 3: Google Maps
**Typical tracking**:
- Geolocation (necessary for functionality)
- Canvas/WebGL (map rendering)
- Camera (Street View)
- Google trackers

**Why**: Service requires location access; Google tracking expected

### Scenario 4: Suspicious Site
**Red flags**:
- Clipboard reading without reason
- Screen recording request
- Multiple fingerprinting methods
- Notification spam
- HTTP (not HTTPS)

**Action**: Leave immediately

---

## Technical Details: How Detection Works

### Architecture

1. **API Monitor Script** (runs in page context):
   - Intercepts browser API calls BEFORE page scripts run
   - Uses JavaScript property descriptors and proxies
   - Wraps sensitive APIs to detect access

2. **Content Bridge** (isolated extension context):
   - Receives messages from API monitor
   - Forwards to service worker

3. **Service Worker** (extension background):
   - Aggregates data per tab
   - Tracks network requests
   - Analyzes third-party domains

4. **Side Panel UI**:
   - Displays collected information
   - Real-time updates

### Detection Methods

**Property Interception**:
```javascript
// Example: Detecting geolocation access
Object.defineProperty(Navigator.prototype, 'geolocation', {
  get: function() {
    // Log access detection
    return originalGeolocation;
  }
});
```

**Method Wrapping**:
```javascript
// Example: Detecting canvas fingerprinting
originalToDataURL = canvas.toDataURL;
canvas.toDataURL = function() {
  // Log fingerprinting attempt
  return originalToDataURL.apply(this, arguments);
};
```

**Network Monitoring**:
- Chrome webRequest API intercepts all network requests
- Domain categorization by known tracker lists
- Third-party detection via domain comparison

---

## Limitations

### What This Extension Can Detect:
✅ Browser API access (geolocation, camera, clipboard, etc.)
✅ Fingerprinting techniques
✅ Network requests to third-parties
✅ Cookie storage

### What This Extension CANNOT Detect:
❌ Server-side tracking (IP address logging)
❌ Tracking via form submissions
❌ Cross-site tracking via login
❌ Browser fingerprinting via network timing
❌ Machine learning based behavioral tracking

---

## Privacy Best Practices

1. **Use HTTPS sites only** - Look for padlock icon
2. **Deny unnecessary permissions** - Location, notifications, camera
3. **Clear cookies regularly** - Or use privacy-focused browsers
4. **Use tracker blockers** - uBlock Origin, Privacy Badger
5. **Use VPN** - But be aware of WebRTC leaks
6. **Be cautious with clipboard** - Don't copy sensitive data on untrusted sites
7. **Review notification permissions** - chrome://settings/content/notifications
8. **Disable WebRTC in privacy extensions** - To prevent IP leaks

---

## Understanding the Data

### Example Output Interpretation:

**Site: NewsWebsite.com**

**Sensitive Information Accessed:**
- Device Fingerprinting: Canvas, WebGL, Fonts
- Persistent Tracking: Local Storage
- Browsing History: Previous Website

**Third-Party Data Collectors:**
- Analytics: 3 services (Google Analytics, Mixpanel, Segment)
- Advertising: 5 networks (DoubleClick, Amazon Ads, etc.)
- Social Media: 2 platforms (Facebook, Twitter)

**Privacy Analysis:**
- Total Cookies: 47
- First-party: 12 (site functionality)
- Third-party: 35 (tracking)
- Known Tracker Requests: 28
- Third-party Domains: 31

**Interpretation**:
🔴 **High Privacy Risk** - This site:
- Uses multiple fingerprinting techniques to track you without cookies
- Shares data with 31 external companies
- Has aggressive advertising tracking (35 third-party cookies)
- Your browsing behavior is being extensively profiled

---

## FAQ

### Q: Is it bad if a site accesses my user agent?
**A**: User agent alone is not concerning (removed from our tracking). However, combined with other fingerprinting (canvas, WebGL, fonts), it helps create a unique profile.

### Q: Should I be worried about localStorage access?
**A**: Depends. If used for legitimate features (shopping cart, preferences), it's fine. But it can also store tracking IDs that persist even after deleting cookies.

### Q: Why does Google Maps trigger so many warnings?
**A**: Google Maps needs geolocation to function and uses canvas/WebGL for rendering maps. This is legitimate, but be aware Google is tracking your location searches.

### Q: Can I prevent fingerprinting?
**A**: Very difficult. Best options:
- Use Tor Browser (designed to resist fingerprinting)
- Use privacy-focused browsers (Brave, Firefox with resistFingerprinting)
- Browser extensions can help but aren't foolproof

### Q: What should I do if I see clipboard reading on a news site?
**A**: This is unfortunately common. Many sites monitor clipboard for "analytics." Best practice:
- Don't copy sensitive information while browsing
- Use password managers instead of copy/paste

### Q: Does this extension block tracking?
**A**: No, this extension only **detects and reports** tracking. It doesn't block anything. For blocking, use:
- uBlock Origin (ad/tracker blocker)
- Privacy Badger (behavioral tracker blocker)
- Browser privacy settings

---

## Glossary

**API (Application Programming Interface)**: Methods that websites can call to access browser features

**Fingerprinting**: Creating a unique identifier for your device without cookies

**First-party**: The website you're directly visiting

**Third-party**: External services/trackers embedded in the website

**Cookies**: Small data files stored by websites

**Local Storage**: Browser storage that persists permanently

**IndexedDB**: Large-capacity browser database

**WebRTC**: Protocol for real-time communication that can leak IP addresses

**Referrer**: The previous website URL you visited

**Canvas**: HTML element for drawing graphics, exploited for fingerprinting

**WebGL**: 3D graphics API, exploited for GPU fingerprinting

---

## Further Reading

- **EFF Cover Your Tracks**: https://coveryourtracks.eff.org/ - Test your browser fingerprint
- **Privacy Badger**: https://privacybadger.org/ - Tracker blocker
- **Brave Browser**: https://brave.com/ - Privacy-focused browser
- **Chrome Privacy Settings**: chrome://settings/privacy
- **Cookie Management**: chrome://settings/cookies

---

## Report Issues

If you notice incorrect detection or have questions:
- GitHub: https://github.com/anthropics/claude-code/issues
- Check service worker console: chrome://extensions → "Service worker" link

---

**Remember**: Complete privacy on the web is nearly impossible, but awareness is the first step toward better privacy practices.
