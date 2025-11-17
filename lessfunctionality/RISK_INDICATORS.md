# Risk Indicator Documentation

This document describes the risk assessment logic used across the security extension, ensuring consistency between the banner alerts and sidepanel section indicators.

## Risk Level Classifications

The extension uses three risk levels to communicate security and privacy concerns to users:

| Risk Level | Color | CSS Class | Visual Indicator | Usage |
|------------|-------|-----------|------------------|-------|
| **Safe** | 🟢 Green | `risk-safe` | Green circle (●) | Minimal security/privacy concerns |
| **Moderate** | 🟠 Orange | `risk-moderate` | Orange circle (●) | Some privacy concerns detected |
| **High** | 🔴 Red | `risk-high` | Red circle (●) | Significant security/privacy risks |

## Color Values

```css
.risk-safe {
  background-color: #4caf50;  /* Green */
}

.risk-moderate {
  background-color: #ff9800;  /* Orange */
}

.risk-high {
  background-color: #f44336;  /* Red */
}
```

## Banner Risk Assessment Logic

The banner (displayed at the top of webpages) evaluates the overall site risk using the following priority order:

### Priority 1: High Risk (Red Banner)
Triggers if **ANY** of these conditions are met:
- `certificate.isSecure === false` (Not using HTTPS)
- `privacy.trackerRequests > 10` (More than 10 tracker requests)
- `privacy.thirdPartyCookies > 15` (More than 15 third-party cookies)

**Banner Display:**
- Title: "Insecure Connection" or "High Privacy Risk"
- Icon: ✋
- Status: `danger`

### Priority 2: Moderate Risk (Orange Banner)
Triggers if **ANY** of these conditions are met:
- `privacy.trackerRequests > 5` (6-10 tracker requests)
- `privacy.thirdPartyCookies > 5` (6-15 third-party cookies)
- Site is secure BUT accesses: `clipboardRead`, `screenCapture`, or `geolocation`

**Banner Display:**
- Title: "Privacy Concerns"
- Icon: ⚠️
- Status: `warning`

### Priority 3: Safe (Green Banner)
Triggers when:
- `certificate.isSecure === true` (Using HTTPS)
- `privacy.trackerRequests <= 5`
- `privacy.thirdPartyCookies <= 5`
- No high-risk API access detected

**Banner Display:**
- Title: "Secure Connection"
- Icon: ✅
- Status: `secure`

**Reference:** `banner.js` lines 99-158

---

## Sidepanel Section Risk Indicators

Each section in the sidepanel displays a colored risk indicator that aligns with the banner logic:

### 1. Security Alerts Section

**Purpose:** Shows user-friendly warnings about security and privacy issues that could put you at risk

**What Users See:**
- Clear, plain-language explanations of security problems
- Why each issue matters to them personally
- What risks they face (data theft, tracking, etc.)

**Example Messages:**
- "This website is not secure - your passwords, credit card numbers, and personal information can be stolen by hackers."
- "This website is sharing your activity with X external companies that can track you across the internet."
- "This website uses strong encryption and shows no major security red flags." ✅

**Risk Logic:**
```javascript
if (!certificate.isSecure) {
  riskLevel = 'high';    // 🔴 Red
} else if (trackerRequests > 10 || thirdPartyCookies > 15) {
  riskLevel = 'high';    // 🔴 Red
} else if (trackerRequests > 5 || thirdPartyCookies > 5) {
  riskLevel = 'moderate'; // 🟠 Orange
} else if (certificate.isSecure) {
  riskLevel = 'safe';    // 🟢 Green
}
```

**Alignment:** Exactly matches banner lines 110-127 (evaluates BOTH certificate security AND tracking levels)

**Reference:** `security-ui.js` lines 76-124

---

### 2. Sensitive Information Accessed Section

**Purpose:** Shows browser API access that could compromise privacy

**Risk Logic:**
```javascript
if (apiAccess.clipboardRead || apiAccess.screenCapture || apiAccess.geolocation) {
  riskLevel = 'moderate';  // 🟠 Orange
} else {
  riskLevel = 'safe';      // 🟢 Green
}
```

**Tracked APIs (shown to user):**
- **Physical Privacy Invasion:** geolocation, mediaDevices, screenCapture
- **Data Theft Attempts:** clipboardRead, credentials
- **Browsing History Tracking:** referrer
- **Device Fingerprinting:** canvas, webgl, audioContext, fonts
- **Persistent Tracking:** localStorage, indexedDB
- **Network Privacy Leak:** webrtc
- **Spam & Phishing:** notifications

**Risk Assessment (matching banner):**
- Only `clipboardRead`, `screenCapture`, and `geolocation` trigger moderate risk
- Other APIs are shown but don't affect risk level

**Alignment:** Exactly matches banner lines 142-154 (only evaluates these 3 specific APIs)

**Reference:** `security-ui.js` lines 109-219

---

### 3. Connection Security Section

**Purpose:** Shows HTTPS encryption status and certificate details

**Risk Logic:**
```javascript
if (certificate.isSecure) {
  riskLevel = 'safe';    // 🟢 Green
} else {
  riskLevel = 'high';    // 🔴 Red
}
```

**Displayed Information:**
- Domain name
- Protocol (HTTP/HTTPS)
- Encryption status
- Certificate status

**Alignment:** Directly matches banner priority 1 logic for insecure connections

**Reference:** `security-ui.js` lines 221-252

---

### 4. Privacy Analysis Section

**Purpose:** Shows cookie and tracker statistics

**Risk Logic:**
```javascript
if (trackerRequests > 10 || thirdPartyCookies > 15) {
  riskLevel = 'high';        // 🔴 Red
} else if (trackerRequests > 5 || thirdPartyCookies > 5) {
  riskLevel = 'moderate';    // 🟠 Orange
} else {
  riskLevel = 'safe';        // 🟢 Green
}
```

**Thresholds:**
| Metric | Safe | Moderate | High |
|--------|------|----------|------|
| Tracker Requests | ≤ 5 | 6-10 | > 10 |
| Third-Party Cookies | ≤ 5 | 6-15 | > 15 |

**Displayed Information:**
- Total cookies (first-party + third-party)
- First-party cookies count
- Third-party cookies count
- Third-party domains contacted
- Known tracker requests

**Alignment:** Exactly matches banner lines 116-127 thresholds

**Reference:** `security-ui.js` lines 254-294

---

### 5. Third-Party Data Collectors Section

**Purpose:** Categorizes external services loading on the page

**Risk Logic:**
```javascript
if (collectors.advertising.length > 0 || collectors.tracking.length > 0) {
  riskLevel = 'moderate';  // 🟠 Orange
} else {
  riskLevel = 'safe';      // 🟢 Green
}
```

**Collector Categories:**
- Analytics Services (Google Analytics, Mixpanel, etc.)
- Advertising Networks (DoubleClick, AdSense, etc.)
- Social Media Platforms (Facebook, Twitter, etc.)
- Tracking & Monitoring (Hotjar, CrazyEgg, etc.)
- Marketing Services (MailChimp, HubSpot, etc.)
- Payment Processors (Stripe, PayPal, etc.)
- Content Delivery Networks (Cloudflare, Akamai, etc.)

**Alignment:** Advertising and tracking collectors contribute to privacy concerns, consistent with banner's tracking evaluation

**Reference:** `security-ui.js` lines 296-363

---

## Implementation Details

### CSS-Based Indicators

Risk indicators use pure CSS (no Unicode emojis) for maximum compatibility:

```css
.risk-indicator {
  display: inline-block;
  width: 12px;
  height: 12px;
  border-radius: 50%;  /* Creates circle */
  flex-shrink: 0;
  margin-right: 4px;
}
```

Each risk level has a subtle shadow for better visibility:

```css
.risk-safe {
  background-color: #4caf50;
  box-shadow: 0 0 0 2px rgba(76, 175, 80, 0.2);
}
```

### HTML Structure

Section titles include the risk indicator:

```html
<details>
  <summary>
    <span class="summary-title">
      <span class="risk-indicator risk-safe"></span>
      Section Name
    </span>
  </summary>
  <div class="section-content">
    <!-- Section content -->
  </div>
</details>
```

---

## Summary Table: Risk Conditions

| Condition | Banner | Security Alerts | Sensitive Info | Connection | Privacy | Collectors |
|-----------|--------|----------------|----------------|------------|---------|------------|
| No HTTPS | 🔴 High | 🔴 High | - | 🔴 High | - | - |
| >10 trackers | 🔴 High | 🔴 High | - | - | 🔴 High | - |
| >15 3rd cookies | 🔴 High | 🔴 High | - | - | 🔴 High | - |
| 6-10 trackers | 🟠 Moderate | 🟠 Moderate | - | - | 🟠 Moderate | - |
| 6-15 3rd cookies | 🟠 Moderate | 🟠 Moderate | - | - | 🟠 Moderate | - |
| Clipboard access | 🟠 Moderate | - | 🟠 Moderate | - | - | - |
| Screen capture | 🟠 Moderate | - | 🟠 Moderate | - | - | - |
| Geolocation | 🟠 Moderate | - | 🟠 Moderate | - | - | - |
| Ad/Tracking domains | - | - | - | - | - | 🟠 Moderate |
| HTTPS + minimal tracking | 🟢 Safe | 🟢 Safe | 🟢 Safe | 🟢 Safe | 🟢 Safe | 🟢 Safe |

---

## File References

- **Banner Logic:** `banner.js` (lines 99-158)
- **Section Builders:** `security-ui.js` (lines 22-363)
- **Risk Indicator Styles:** `sidepanel.css` (lines 62-92)
- **Color Constants:** Defined in CSS (Green: #4caf50, Orange: #ff9800, Red: #f44336)

---

## Maintenance Notes

When updating risk thresholds:

1. **Update banner logic first** (`banner.js` function `evaluateSecurityStatus`)
2. **Update corresponding section logic** in `security-ui.js`
3. **Update this documentation** to reflect new thresholds
4. **Test consistency** across banner and sidepanel

All thresholds should remain synchronized to provide consistent user experience.

---

**Last Updated:** 2024
**Version:** 1.0
