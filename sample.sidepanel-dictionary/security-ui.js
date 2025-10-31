// Security UI Module
// Renders security information in the side panel

// Update the side panel with security information
function renderSecurityInfo(securityData) {
  // Handle errors
  if (securityData.error) {
    document.getElementById('security-content').innerHTML = `
      <p style="color: red;">${securityData.error}</p>
    `;
    return;
  }

  // Build combined security section
  const securityHtml = buildSecuritySection(securityData);

  // Update the DOM
  document.getElementById('security-content').innerHTML = `
    ${securityHtml}
    <hr />
    <p style="font-size: 0.9em; color: #666;">Last updated: ${securityData.timestamp}</p>
  `;
}

// Build combined security section
function buildSecuritySection(securityData) {
  const warnings = securityData.warnings;
  const certInfo = securityData.certificate;
  const privacyInfo = securityData.privacy;
  const collectors = securityData.collectors;
  const apiAccess = securityData.apiAccess;

  let html = '<h2>Security & Privacy Information</h2>';

  // Certificate/Connection Details
  html += `<p><strong>Connection Security:</strong></p>`;
  html += `<p style="margin-left: 20px;">Domain: ${escapeHtml(collectors?.firstParty || certInfo.domain)}</p>`;
  html += `<p style="margin-left: 20px;">Protocol: ${certInfo.protocol.toUpperCase()}</p>`;
  html += `<p style="margin-left: 20px;">Encryption: ${certInfo.isSecure ? 'Enabled (HTTPS)' : 'Not Encrypted (HTTP)'}</p>`;
  html += `<p style="margin-left: 20px;">Status: ${certInfo.status}</p>`;

  // Sensitive Information Accessed
  if (apiAccess) {
    html += `<p><strong>Sensitive Information Accessed:</strong></p>`;

    const sensitiveAPIs = [
      {
        title: 'Physical Privacy Invasion',
        items: [
          { key: 'geolocation', label: 'Geolocation', desc: 'Tracking your physical location' },
          { key: 'mediaDevices', label: 'Camera/Microphone', desc: 'Checking for recording devices' },
          { key: 'screenCapture', label: 'Screen Recording', desc: 'Can record your entire screen' }
        ]
      },
      {
        title: 'Data Theft Attempts',
        items: [
          { key: 'clipboardRead', label: 'Clipboard Reading', desc: 'Stealing copied passwords/data' },
          { key: 'credentials', label: 'Password Access', desc: 'Accessing browser-saved passwords' }
        ]
      },
      {
        title: 'Browsing History Tracking',
        items: [
          { key: 'referrer', label: 'Previous Website', desc: 'Accessing where you came from' }
        ]
      },
      {
        title: 'Device Fingerprinting',
        desc: 'Creating a unique ID to track you without cookies',
        items: [
          { key: 'canvas', label: 'Canvas Fingerprinting' },
          { key: 'webgl', label: 'WebGL Fingerprinting' },
          { key: 'audioContext', label: 'Audio Fingerprinting' },
          { key: 'fonts', label: 'Font Detection' }
        ]
      },
      {
        title: 'Persistent Tracking',
        desc: 'Storing data to track you across sessions (like hidden cookies)',
        items: [
          { key: 'localStorage', label: 'Local Storage' },
          { key: 'indexedDB', label: 'IndexedDB' }
        ]
      },
      {
        title: 'Network Privacy Leak',
        items: [
          { key: 'webrtc', label: 'WebRTC', desc: 'Can reveal your real IP (bypasses VPN)' }
        ]
      },
      {
        title: 'Spam & Phishing',
        items: [
          { key: 'notifications', label: 'Notification Requests', desc: 'Push notifications (often spam)' }
        ]
      }
    ];

    let accessDetected = false;
    sensitiveAPIs.forEach(category => {
      const accessed = category.items.filter(item => apiAccess[item.key]);
      if (accessed.length > 0) {
        accessDetected = true;
        html += `<p style="margin-left: 20px;"><strong>${category.title}</strong>`;
        if (category.desc) {
          html += ` - ${category.desc}`;
        }
        html += `:</p>`;
        accessed.forEach(item => {
          html += `<p style="margin-left: 40px;">- ${item.label}`;
          if (item.desc) {
            html += ` (${item.desc})`;
          }
          html += `</p>`;
        });
      }
    });

    if (!accessDetected) {
      html += `<p style="margin-left: 20px;">No sensitive information accessed</p>`;
    }
  }

  // Privacy Details
  html += `<p><strong>Privacy Analysis:</strong></p>`;
  html += `<p style="margin-left: 20px;">Total Cookies: ${privacyInfo.totalCookies}</p>`;
  html += `<p style="margin-left: 40px;">First-party: ${privacyInfo.firstPartyCookies}</p>`;
  html += `<p style="margin-left: 40px;">Third-party: ${privacyInfo.thirdPartyCookies}</p>`;
  html += `<p style="margin-left: 20px;">Third-party Domains Contacted: ${privacyInfo.thirdPartyDomains}</p>`;
  html += `<p style="margin-left: 20px;">Known Tracker Requests: ${privacyInfo.trackerRequests}</p>`;

  // Third Party Data Collectors
  if (collectors) {
    html += `<p><strong>Third-Party Data Collectors:</strong></p>`;

    const collectorCategories = [
      { key: 'analytics', label: 'Analytics Services' },
      { key: 'advertising', label: 'Advertising Networks' },
      { key: 'socialMedia', label: 'Social Media Platforms' },
      { key: 'tracking', label: 'Tracking & Monitoring' },
      { key: 'marketing', label: 'Marketing Services' },
      { key: 'payments', label: 'Payment Processors' },
      { key: 'cdn', label: 'Content Delivery Networks' },
      { key: 'other', label: 'Other Third Parties' }
    ];

    let hasCollectors = false;
    collectorCategories.forEach(category => {
      const domains = collectors[category.key];
      if (domains && domains.length > 0) {
        hasCollectors = true;
        html += `<p style="margin-left: 20px;"><strong>${category.label}:</strong> ${domains.length}</p>`;
        domains.slice(0, 5).forEach(domain => {
          html += `<p style="margin-left: 40px;">- ${escapeHtml(domain)}</p>`;
        });
        if (domains.length > 5) {
          html += `<p style="margin-left: 40px;">... and ${domains.length - 5} more</p>`;
        }
      }
    });

    if (!hasCollectors) {
      html += '<p style="margin-left: 20px;">No third-party data collectors detected</p>';
    }
  }

  // Security Alerts
  html += `<p><strong>Security Alerts:</strong></p>`;
  const warningsList = warnings.map(warning =>
    `<p style="margin-left: 20px;">${escapeHtml(warning)}</p>`
  ).join('');
  html += warningsList;

  return html;
}

// Escape HTML to prevent XSS
function escapeHtml(unsafe) {
  if (typeof unsafe !== 'string') return unsafe;

  return unsafe
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#039;");
}

// Show loading state
function showLoading() {
  document.getElementById('security-content').innerHTML = `
    <p>Loading security information...</p>
  `;
}

// Show error message
function showError(message) {
  document.getElementById('security-content').innerHTML = `
    <p style="color: red;">Error: ${escapeHtml(message)}</p>
  `;
}
