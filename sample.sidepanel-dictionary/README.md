# Security Information Panel

A Chrome extension that provides real-time visibility into privacy-invasive tracking techniques, data collection attempts, and security risks on websites.

## Features

### Sensitive API Monitoring
Detects when websites access sensitive browser APIs:
- **Physical Privacy**: Geolocation, camera/microphone, screen recording
- **Data Theft**: Clipboard reading, password access
- **Device Fingerprinting**: Canvas, WebGL, audio, font detection
- **Persistent Tracking**: LocalStorage, IndexedDB
- **Network Leaks**: WebRTC IP address exposure
- **Browsing History**: Referrer tracking
- **Spam**: Notification requests

### Network Tracking Analysis
- **Third-Party Trackers**: Identifies all external domains contacted
- **Tracker Categorization**: Analytics, advertising, social media, tracking services
- **Cookie Analysis**: First-party vs third-party cookies
- **Known Trackers**: Detects 70+ known tracking domains

### Security Information
- **Connection Security**: HTTPS/HTTP status
- **Mixed Content Detection**: Identifies insecure resources on secure pages
- **Security Warnings**: Alerts for suspicious behavior

## What Makes This Different

Unlike simple tracker blockers, this extension:
- **Shows API access in real-time** - See exactly what information websites are accessing
- **Detects fingerprinting** - Identifies techniques that track you without cookies
- **Monitors clipboard access** - Alerts when sites read your copied data
- **Tracks data collectors** - Shows all third-parties receiving your information

## Documentation

- **[Security & Privacy Guide](SECURITY_PRIVACY_GUIDE.md)** - Comprehensive guide explaining what each detection means and why it matters
- **[Technical Documentation](TECHNICAL_DOCUMENTATION.md)** - Architecture, implementation details, and API reference

## Quick Start

1. Clone this repository
2. Open Chrome and go to `chrome://extensions`
3. Enable "Developer mode" (top right)
4. Click "Load unpacked"
5. Select the `sample.sidepanel-dictionary` directory
6. Navigate to any website
7. Right-click and choose "Show Security Info"

## What You'll See

The side panel displays:

**Sensitive Information Accessed**
- Physical Privacy Invasion
- Data Theft Attempts
- Browsing History Tracking
- Device Fingerprinting
- Persistent Tracking
- Network Privacy Leak
- Spam & Phishing

**Privacy Analysis**
- Total cookies (first-party vs third-party)
- Third-party domains contacted
- Known tracker requests

**Third-Party Data Collectors**
- Analytics services
- Advertising networks
- Social media trackers
- And more...

**Security Alerts**
- Connection security warnings
- Mixed content detection
- Excessive tracking warnings

## Example Output

On a typical news website, you might see:

```
Sensitive Information Accessed:
  Device Fingerprinting - Creating a unique ID to track you without cookies:
    - Canvas Fingerprinting
    - WebGL Fingerprinting
    - Font Detection
  Persistent Tracking - Storing data to track you across sessions:
    - Local Storage

Third-Party Data Collectors:
  Analytics Services: 3
    - google-analytics.com
    - mixpanel.com
    - segment.com
  Advertising Networks: 8
    - doubleclick.net
    - amazon-adsystem.com
    [... and 6 more]

Privacy Analysis:
  Total Cookies: 47
    First-party: 12
    Third-party: 35
  Third-party Domains: 31
  Known Tracker Requests: 28

Security Alerts:
  [WARNING] High number of third-party cookies (35)
  [WARNING] Multiple tracking requests detected (28)
```

## Browser Compatibility

- Chrome 111+ (Manifest V3 with `world: "MAIN"` support)
- Edge 111+ (Chromium-based)

## Permissions Explained

- `sidePanel` - Display the side panel UI
- `contextMenus` - Add "Show Security Info" to right-click menu
- `tabs` - Access current tab information
- `cookies` - Read cookie data
- `webRequest` - Monitor network requests
- `webNavigation` - Track page navigation
- `<all_urls>` - Required to monitor all websites

## Privacy

This extension:
- ✅ Does NOT collect any data
- ✅ Does NOT send data to external servers
- ✅ Only observes what websites are accessing
- ✅ Runs entirely locally in your browser
- ✅ Open source - you can review all code

## Contributing

Issues and pull requests welcome! This is an educational tool to raise awareness about web privacy.

## License

See repository license.

## Acknowledgments

Built using Chrome Extension Manifest V3 APIs and inspired by privacy research from EFF, Mozilla, and the web security community.
