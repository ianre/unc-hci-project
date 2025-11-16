// Security UI Module
// Renders security information in the side panel

// Update the side panel with security information
function renderSecurityInfo(securityData) {
  // Handle errors
  if (securityData.error) {
    showError(securityData.error);
    return;
  }

  // Build combined security section
  const securityHtml = buildSecuritySection(securityData);

  // Update the DOM
  document.getElementById('security-content').innerHTML = `
    ${securityHtml}
    <div class="metadata">Last updated: ${securityData.timestamp}</div>
  `;
}

// Build combined security section with expandable sections
function buildSecuritySection(securityData) {
  // Security Alerts is always visible (not expandable) - matches banner exactly
  const alertsSection = buildSecurityAlertsSection(
    securityData.warnings,
    securityData.certificate,
    securityData.privacy,
    securityData.apiAccess
  );

  // Other sections are expandable
  const expandableSections = [
    buildSensitiveInfoSection(securityData.apiAccess),
    buildConnectionSecuritySection(securityData.certificate, securityData.collectors),
    buildPrivacyAnalysisSection(securityData.privacy),
    buildThirdPartyCollectorsSection(securityData.collectors)
  ];

  return `
    <h2>Security & Privacy Information</h2>
    ${alertsSection}
    ${expandableSections.join('')}
  `;
}

// Helper function to create an expandable section
// riskLevel: 'safe', 'moderate', 'high'
function createSection(title, content, openByDefault = false, riskLevel = 'safe') {
  const riskClass = `risk-${riskLevel}`;
  return `
    <details${openByDefault ? ' open' : ''}>
      <summary>
        <span class="summary-title">
          <span class="risk-indicator ${riskClass}"></span>
          ${escapeHtml(title)}
        </span>
      </summary>
      <div class="section-content">
        ${content}
      </div>
    </details>
  `;
}

// Helper function to create FAQ/help items (nested expandable)
function createFAQItem(question, answer) {
  return `
    <details>
      <summary>${escapeHtml(question)}</summary>
      <div class="section-content">
        <p>${escapeHtml(answer)}</p>
      </div>
    </details>
  `;
}

// Helper function to create multiple FAQ items
function createFAQSection(faqs) {
  if (!faqs || faqs.length === 0) return '';
  return faqs.map(faq => createFAQItem(faq.question, faq.answer)).join('');
}

// Build Security Alerts section (always visible, not expandable)
// Matches banner logic exactly from banner.js lines 99-158
function buildSecurityAlertsSection(warnings, certificate, privacy, apiAccess) {
  let status = 'secure';
  let title = 'Secure Connection';
  let details = 'Minimal tracking detected';
  let riskLevel = 'safe';

  // Exactly matching banner.js logic (lines 110-139)
  if (certificate && !certificate.isSecure) {
    status = 'danger';
    title = 'Insecure Connection';
    details = 'Not using HTTPS - data may be intercepted';
    riskLevel = 'high';
  }
  else if (privacy && (privacy.trackerRequests > 10 || privacy.thirdPartyCookies > 15)) {
    status = 'danger';
    title = 'High Privacy Risk';
    details = `Heavy tracking: ${privacy.trackerRequests || 0} trackers`;
    riskLevel = 'high';
  }
  else if (privacy && (privacy.trackerRequests > 5 || privacy.thirdPartyCookies > 5)) {
    status = 'warning';
    title = 'Privacy Concerns';
    details = `Tracking detected: ${privacy.trackerRequests || 0} trackers`;
    riskLevel = 'moderate';
  }
  else if (certificate && certificate.isSecure) {
    status = 'secure';
    title = 'Secure Connection';
    details = 'Minimal tracking detected';
    riskLevel = 'safe';
  }

  // Add API access warnings (matching banner.js lines 142-155)
  if (apiAccess) {
    const activeRisks = [];
    if (apiAccess.clipboardRead) activeRisks.push('clipboard');
    if (apiAccess.screenCapture) activeRisks.push('screen recording');
    if (apiAccess.geolocation) activeRisks.push('location');

    if (activeRisks.length > 0) {
      details += ` - ${activeRisks.join(', ')} access detected`;
      if (status === 'secure') {
        status = 'warning';
        riskLevel = 'moderate';  // Update risk level to moderate (orange)
      }
    }
  }

  const riskClass = `risk-${riskLevel}`;

  // Build the overall message (matching banner display)
  const messageHtml = `
    <div class="alert-summary">
      <div class="alert-title">${escapeHtml(title)}</div>
      <div class="alert-details">${escapeHtml(details)}</div>
    </div>
  `;

  // Conditional FAQs - only show if there are warnings (moderate or high risk)
  let faqsHtml = '';
  if (riskLevel === 'high' || riskLevel === 'moderate') {
    const faqs = [
      {
        question: 'Why does this matter?',
        answer: 'These alerts help you protect your personal information, passwords, and financial data from being stolen or tracked. They flag serious security problems that could put you at risk.'
      },
      {
        question: 'What should I do?',
        answer: 'If you see security warnings, avoid entering passwords, credit card numbers, or personal information on the website. For serious issues like "Insecure Connection", it\'s best to leave the site entirely.'
      },
      {
        question: 'Can I trust this website?',
        answer: 'It depends. "Insecure Connection" (no HTTPS) is a serious red flag - never enter sensitive data. Tracking warnings mean the site is monitoring you, which is common but invasive. Use your judgment based on what you\'re doing.'
      }
    ];
    faqsHtml = createFAQSection(faqs);
  }

  // Return non-expandable section (no title, just indicator + message)
  return `
    <div class="security-alerts-section ${riskClass}">
      <div class="alerts-header">
        <span class="risk-indicator ${riskClass}"></span>
      </div>
      <div class="alerts-content">
        ${messageHtml}
        ${faqsHtml}
      </div>
    </div>
  `;
}

// Build Sensitive Information Accessed section
function buildSensitiveInfoSection(apiAccess) {
  const faqs = [
    {
      question: 'Why does this matter?',
      answer: 'Websites can access various browser features and APIs. Some of these can be used to track you, collect personal information, or invade your privacy. This section shows which sensitive features the website accessed.'
    },
    {
      question: 'Is accessing these features always bad?',
      answer: 'Not necessarily. Many legitimate websites need to access certain features (e.g., a maps app needs location, a video chat app needs your camera). The concern is when websites access features they don\'t need for their core functionality.'
    }
  ];

  if (!apiAccess) {
    return createSection('Sensitive Information Accessed', '<p>No data available</p>' + createFAQSection(faqs), false, 'safe');
  }

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

  let content = '';
  let accessDetected = false;

  sensitiveAPIs.forEach(category => {
    const accessed = category.items.filter(item => apiAccess[item.key]);
    if (accessed.length > 0) {
      accessDetected = true;
      content += `<p class="item-category">${category.title}`;
      if (category.desc) {
        content += ` - ${category.desc}`;
      }
      content += `</p>`;
      content += '<div class="item-list">';
      accessed.forEach(item => {
        content += `<p class="item-list-item">${item.label}`;
        if (item.desc) {
          content += ` (${item.desc})`;
        }
        content += `</p>`;
      });
      content += '</div>';
    }
  });

  // Risk level based on banner logic (banner.js lines 142-154)
  // Banner only checks: clipboardRead, screenCapture, geolocation
  // If any present, upgrades from secure to warning (moderate)
  let riskLevel = 'safe';
  if (apiAccess.clipboardRead || apiAccess.screenCapture || apiAccess.geolocation) {
    riskLevel = 'moderate';
  }

  if (!accessDetected) {
    content = '<p>No sensitive information accessed</p>';
  }

  content += createFAQSection(faqs);

  return createSection('Sensitive Information Accessed', content, false, riskLevel);
}

// Build Connection Security section
function buildConnectionSecuritySection(certInfo, collectors) {
  const domain = collectors?.firstParty || certInfo.domain;
  const isSecure = certInfo.isSecure;

  const faqs = [
    {
      question: 'What is HTTPS encryption?',
      answer: 'HTTPS encrypts the data sent between your browser and the website, preventing others from intercepting and reading your information. Always look for HTTPS when entering sensitive data like passwords or credit card numbers.'
    },
    {
      question: 'What does the connection status mean?',
      answer: 'The status indicates whether the website\'s security certificate is valid and trusted. A secure status means the certificate was verified by a trusted authority and hasn\'t expired.'
    }
  ];

  const riskLevel = isSecure ? 'safe' : 'high';

  const content = `
    <p><strong>Domain:</strong> ${escapeHtml(domain)}</p>
    <p><strong>Protocol:</strong> ${certInfo.protocol.toUpperCase()}</p>
    <p><strong>Encryption:</strong> <span class="${isSecure ? 'status-secure' : 'status-error'}">${isSecure ? 'Enabled (HTTPS)' : 'Not Encrypted (HTTP)'}</span></p>
    <p><strong>Status:</strong> ${escapeHtml(certInfo.status)}</p>
    ${createFAQSection(faqs)}
  `;

  return createSection('Connection Security', content, false, riskLevel);
}

// Build Privacy Analysis section
function buildPrivacyAnalysisSection(privacyInfo) {
  const thirdPartyCookies = privacyInfo.thirdPartyCookies;
  const trackerRequests = privacyInfo.trackerRequests;

  const faqs = [
    {
      question: 'What are cookies?',
      answer: 'Cookies are small pieces of data stored in your browser. First-party cookies are from the website you\'re visiting, while third-party cookies are from other domains (often used for tracking and advertising).'
    },
    {
      question: 'Why are third-party trackers a concern?',
      answer: 'Third-party trackers can follow you across multiple websites, building a profile of your browsing habits, interests, and personal information without your explicit consent.'
    },
    {
      question: 'What are third-party domains?',
      answer: 'These are external websites that the current page connects to, often for analytics, advertisements, or content delivery. Each connection can potentially share information about your visit.'
    }
  ];

  // Determine risk level based on tracking metrics (same as banner.js)
  let riskLevel = 'safe';
  if (trackerRequests > 10 || thirdPartyCookies > 15) {
    riskLevel = 'high';
  } else if (trackerRequests > 5 || thirdPartyCookies > 5) {
    riskLevel = 'moderate';
  }

  const content = `
    <p><strong>Total Cookies:</strong> ${privacyInfo.totalCookies}</p>
    <div class="item-list">
      <p class="item-list-item">First-party: ${privacyInfo.firstPartyCookies}</p>
      <p class="item-list-item ${thirdPartyCookies > 0 ? 'status-warning' : ''}">Third-party: ${thirdPartyCookies}</p>
    </div>
    <p><strong>Third-party Domains Contacted:</strong> ${privacyInfo.thirdPartyDomains}</p>
    <p><strong>Known Tracker Requests:</strong> <span class="${trackerRequests > 0 ? 'status-warning' : 'status-secure'}">${trackerRequests}</span></p>
    ${createFAQSection(faqs)}
  `;

  return createSection('Privacy Analysis', content, false, riskLevel);
}

// Build Third-Party Data Collectors section
function buildThirdPartyCollectorsSection(collectors) {
  const faqs = [
    {
      question: 'What are third-party data collectors?',
      answer: 'These are external companies and services that collect information about your visit to this website. They include analytics services, advertising networks, and social media platforms.'
    },
    {
      question: 'Why do websites use these services?',
      answer: 'Websites use third-party services for various purposes: analytics to understand visitor behavior, advertising to generate revenue, CDNs to deliver content faster, and payment processors to handle transactions.'
    },
    {
      question: 'How can I protect my privacy?',
      answer: 'You can use browser privacy settings, ad blockers, tracking protection features, or privacy-focused browser extensions to limit third-party data collection. Also consider using privacy-focused browsers.'
    }
  ];

  if (!collectors) {
    return createSection('Third-Party Data Collectors', '<p>No data available</p>' + createFAQSection(faqs), false, 'safe');
  }

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

  let content = '';
  let hasCollectors = false;

  collectorCategories.forEach(category => {
    const domains = collectors[category.key];
    if (domains && domains.length > 0) {
      hasCollectors = true;
      content += `<p class="item-category">${category.label}: ${domains.length}</p>`;
      content += '<div class="item-list">';
      domains.slice(0, 5).forEach(domain => {
        content += `<p class="item-list-item">${escapeHtml(domain)}</p>`;
      });
      if (domains.length > 5) {
        content += `<p class="item-list-item">... and ${domains.length - 5} more</p>`;
      }
      content += '</div>';
    }
  });

  if (!hasCollectors) {
    content = '<p>No third-party data collectors detected</p>';
  }

  content += createFAQSection(faqs);

  // Risk level based on presence of advertising/tracking collectors
  // Banner doesn't evaluate collectors directly, but these contribute to trackerRequests
  // Keep it simple: moderate if advertising or tracking present, safe otherwise
  let riskLevel = 'safe';
  if (collectors) {
    const hasAdvertising = collectors.advertising && collectors.advertising.length > 0;
    const hasTracking = collectors.tracking && collectors.tracking.length > 0;

    if (hasAdvertising || hasTracking) {
      riskLevel = 'moderate';
    }
  }

  return createSection('Third-Party Data Collectors', content, false, riskLevel);
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
    <p class="loading">Loading security information...</p>
  `;
}

// Show error message
function showError(message) {
  document.getElementById('security-content').innerHTML = `
    <p class="error">Error: ${escapeHtml(message)}</p>
  `;
}
