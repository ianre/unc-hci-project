// Security Information Service Worker
// Handles request tracking and security data collection

console.log('[Service Worker] Starting up...');

// Data collector categorization
const DATA_COLLECTORS = {
  analytics: [
    'google-analytics.com',
    'googletagmanager.com',
    'analytics.google.com',
    'mixpanel.com',
    'segment.com',
    'amplitude.com',
    'heap.io',
    'fullstory.com',
    'logrocket.com',
    'newrelic.com',
    'datadoghq.com'
  ],
  advertising: [
    'doubleclick.net',
    'googlesyndication.com',
    'googleadservices.com',
    'amazon-adsystem.com',
    'adsrvr.org',
    'adnxs.com',
    'advertising.com',
    'criteo.com',
    'pubmatic.com',
    'rubiconproject.com'
  ],
  socialMedia: [
    'facebook.com',
    'facebook.net',
    'connect.facebook.net',
    'twitter.com',
    'analytics.twitter.com',
    'linkedin.com',
    'instagram.com',
    'tiktok.com',
    'pinterest.com',
    'reddit.com'
  ],
  tracking: [
    'hotjar.com',
    'crazyegg.com',
    'mouseflow.com',
    'scorecardresearch.com',
    'quantserve.com',
    'crwdcntrl.net'
  ],
  marketing: [
    'mailchimp.com',
    'hubspot.com',
    'salesforce.com',
    'marketo.com',
    'eloqua.com',
    'pardot.com'
  ],
  payments: [
    'stripe.com',
    'paypal.com',
    'braintree.com',
    'square.com',
    'adyen.com'
  ],
  cdn: [
    'cloudflare.com',
    'akamai.net',
    'fastly.net',
    'cloudfront.net',
    'jsdelivr.net',
    'unpkg.com'
  ]
};

// Store for tracking requests per tab
const tabRequestData = new Map();

// Initialize tab tracking
function initializeTabTracking(tabId) {
  if (!tabRequestData.has(tabId)) {
    tabRequestData.set(tabId, {
      thirdPartyRequests: 0,
      trackerRequests: 0,
      mixedContent: false,
      domains: new Set(),
      mainDomain: null,
      collectors: {
        analytics: new Set(),
        advertising: new Set(),
        socialMedia: new Set(),
        tracking: new Set(),
        marketing: new Set(),
        payments: new Set(),
        cdn: new Set(),
        other: new Set()
      },
      apiAccess: {
        // Physical Privacy
        geolocation: false,
        mediaDevices: false,
        screenCapture: false,
        // Data Theft
        clipboardRead: false,
        credentials: false,
        // Device Fingerprinting
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
      }
    });
  }
}

// Categorize domain
function categorizeDomain(domain) {
  for (const [category, domains] of Object.entries(DATA_COLLECTORS)) {
    if (domains.some(tracker => domain.includes(tracker))) {
      return category;
    }
  }
  return 'other';
}

// Check if domain is a known tracker
// Includes: analytics, tracking, advertising, and social media (all track users)
function isKnownTracker(domain) {
  return DATA_COLLECTORS.tracking.some(tracker => domain.includes(tracker)) ||
         DATA_COLLECTORS.analytics.some(tracker => domain.includes(tracker)) ||
         DATA_COLLECTORS.advertising.some(tracker => domain.includes(tracker)) ||
         DATA_COLLECTORS.socialMedia.some(tracker => domain.includes(tracker));
}

// Setup context menu
function setupContextMenu() {
  chrome.contextMenus.create({
    id: 'show-security-info',
    title: 'Show Security Info',
    contexts: ['page']
  });
}

// Handle extension installation
chrome.runtime.onInstalled.addListener(() => {
  setupContextMenu();
});

// Handle context menu clicks
chrome.contextMenus.onClicked.addListener((data, tab) => {
  chrome.sidePanel.open({ tabId: tab.id });
});

// Track web requests
console.log('[Service Worker] Registering webRequest listener...');

if (!chrome.webRequest) {
  console.error('[Service Worker] chrome.webRequest is not available!');
} else if (!chrome.webRequest.onBeforeRequest) {
  console.error('[Service Worker] chrome.webRequest.onBeforeRequest is not available!');
} else {
  console.log('[Service Worker] chrome.webRequest API is available');
}

chrome.webRequest.onBeforeRequest.addListener(
  (details) => {
    const tabId = details.tabId;

    // Skip invalid tabs
    if (tabId < 0) {
      return;
    }

    initializeTabTracking(tabId);
    const data = tabRequestData.get(tabId);

    try {
      const requestUrl = new URL(details.url);
      const requestDomain = requestUrl.hostname;

      // Set main domain from main_frame requests
      if (details.type === 'main_frame') {
        data.mainDomain = requestDomain;
        console.log('[Tracker Detection] Main domain set from main_frame:', data.mainDomain);
        return; // Don't track main_frame as third-party
      }

      console.log('[Tracker Detection] Checking request:', requestDomain, 'Main:', data.mainDomain);

      // Check if this is a third-party request
      if (!data.mainDomain) {
        console.log('[Tracker Detection] Main domain not set yet, skipping');
        return;
      }

      const isThirdParty = requestDomain !== data.mainDomain &&
                          !requestDomain.endsWith('.' + data.mainDomain) &&
                          !data.mainDomain.endsWith('.' + requestDomain);

      if (isThirdParty) {
        data.thirdPartyRequests++;
        data.domains.add(requestDomain);

        // Categorize the domain
        const category = categorizeDomain(requestDomain);
        data.collectors[category].add(requestDomain);

        console.log('[Tracker Detection] Third-party request:', requestDomain, 'Category:', category);

        // Check if it's a known tracker
        if (isKnownTracker(requestDomain)) {
          data.trackerRequests++;
          console.log('[Tracker Detection] Known tracker detected:', requestDomain);
        }
      }

      // Check for mixed content
      if (requestUrl.protocol === 'http:') {
        if (data.mainDomain && requestDomain !== data.mainDomain) {
          // Check if main domain uses HTTPS
          chrome.tabs.get(tabId).then(tab => {
            if (tab && tab.url) {
              const tabUrl = new URL(tab.url);
              if (tabUrl.protocol === 'https:') {
                data.mixedContent = true;
                console.log('[Tracker Detection] Mixed content detected');
              }
            }
          }).catch(() => {});
        }
      }

    } catch (error) {
      console.error('[Tracker Detection] Error tracking request:', error);
    }
  },
  { urls: ['<all_urls>'] }
);

console.log('[Service Worker] webRequest listener registered successfully');

// Clear tracking data when navigation starts
chrome.webNavigation.onBeforeNavigate.addListener((details) => {
  if (details.frameId === 0) {
    tabRequestData.delete(details.tabId);
  }
});

// Clear tracking data when tab is closed
chrome.tabs.onRemoved.addListener((tabId) => {
  tabRequestData.delete(tabId);
});

// Get security information for a tab
async function getSecurityInfo(tabId) {
  try {
    const tab = await chrome.tabs.get(tabId);

    // Check if tab has a valid URL
    if (!tab.url) {
      return {
        error: 'No URL available for this tab'
      };
    }

    // Check if URL is accessible (not a chrome:// or chrome-extension:// page)
    if (tab.url.startsWith('chrome://') ||
        tab.url.startsWith('chrome-extension://') ||
        tab.url.startsWith('edge://') ||
        tab.url.startsWith('about:')) {
      return {
        error: 'Cannot access security information for browser internal pages'
      };
    }

    const url = new URL(tab.url);

    console.log('[Security Info] Getting info for tab:', tabId, 'URL:', url.hostname);

    // Certificate Information
    const certificateInfo = {
      domain: url.hostname || 'Unknown',
      protocol: url.protocol.replace(':', ''),
      isSecure: url.protocol === 'https:',
      status: url.protocol === 'https:' ? 'Secure Connection' : 'Not Secure'
    };

    // Get cookies
    const cookies = await chrome.cookies.getAll({ url: tab.url });
    const firstPartyCookies = cookies.filter(cookie =>
      cookie.domain.includes(url.hostname) || url.hostname.includes(cookie.domain)
    );
    const thirdPartyCookies = cookies.filter(cookie =>
      !cookie.domain.includes(url.hostname) && !url.hostname.includes(cookie.domain)
    );

    // Get tracking data
    const trackingData = tabRequestData.get(tabId) || {
      thirdPartyRequests: 0,
      trackerRequests: 0,
      mixedContent: false,
      domains: new Set()
    };

    console.log('[Security Info] Tracking data for tab', tabId, ':', {
      thirdPartyRequests: trackingData.thirdPartyRequests,
      trackerRequests: trackingData.trackerRequests,
      domains: Array.from(trackingData.domains || []),
      collectors: trackingData.collectors ? {
        analytics: Array.from(trackingData.collectors.analytics || []),
        advertising: Array.from(trackingData.collectors.advertising || []),
        socialMedia: Array.from(trackingData.collectors.socialMedia || []),
        tracking: Array.from(trackingData.collectors.tracking || [])
      } : null
    });

    const privacyInfo = {
      totalCookies: cookies.length,
      firstPartyCookies: firstPartyCookies.length,
      thirdPartyCookies: thirdPartyCookies.length,
      trackerRequests: trackingData.trackerRequests,
      thirdPartyDomains: trackingData.domains.size
    };

    // Security warnings - user-friendly messages
    const warnings = [];

    if (!certificateInfo.isSecure) {
      warnings.push('This website is not secure - your passwords, credit card numbers, and personal information can be stolen by hackers.');
    }

    if (trackingData.mixedContent) {
      warnings.push('Some content on this secure page is being loaded insecurely, creating a vulnerability that could expose your data.');
    }

    if (thirdPartyCookies.length > 10) {
      warnings.push('This website is sharing your activity with ' + thirdPartyCookies.length + ' external companies that can track you across the internet.');
    }

    if (trackingData.trackerRequests > 5) {
      warnings.push('This website is actively tracking your behavior using ' + trackingData.trackerRequests + ' different tracking tools to build a profile about you.');
    }

    if (warnings.length === 0 && certificateInfo.isSecure) {
      warnings.push('This website uses strong encryption and shows no major security red flags.');
    }

    // Who's collecting data
    const collectors = {
      firstParty: url.hostname || 'Unknown',
      analytics: Array.from(trackingData.collectors?.analytics || []),
      advertising: Array.from(trackingData.collectors?.advertising || []),
      socialMedia: Array.from(trackingData.collectors?.socialMedia || []),
      tracking: Array.from(trackingData.collectors?.tracking || []),
      marketing: Array.from(trackingData.collectors?.marketing || []),
      payments: Array.from(trackingData.collectors?.payments || []),
      cdn: Array.from(trackingData.collectors?.cdn || []),
      other: Array.from(trackingData.collectors?.other || [])
    };

    return {
      certificate: certificateInfo,
      privacy: privacyInfo,
      warnings: warnings,
      collectors: collectors,
      apiAccess: trackingData.apiAccess,
      firstPartyDomain: url.hostname || 'Unknown',
      timestamp: new Date().toLocaleString()
    };

  } catch (error) {
    console.error('Error getting security info:', error);
    return {
      error: 'Unable to retrieve security information: ' + error.message
    };
  }
}

// Handle messages from side panel and content scripts
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'getSecurityInfo') {
    getSecurityInfo(message.tabId)
      .then(securityInfo => sendResponse(securityInfo))
      .catch(error => sendResponse({ error: error.message }));
    return true; // Keep channel open for async response
  }

  if (message.action === 'getSecurityInfoForCurrentTab') {
    // Get the tab ID from the sender
    const tabId = sender.tab?.id;
    if (tabId) {
      getSecurityInfo(tabId)
        .then(securityInfo => sendResponse(securityInfo))
        .catch(error => sendResponse({ error: error.message }));
      return true; // Keep channel open for async response
    } else {
      sendResponse({ error: 'No tab ID available' });
    }
  }

  if (message.action === 'openSecurityPanel') {
    chrome.sidePanel.open({ tabId: sender.tab.id });
    sendResponse({ success: true });
  }

  if (message.action === 'apiAccessDetected') {
    // Get tab ID from sender
    const tabId = sender.tab?.id;
    if (tabId) {
      initializeTabTracking(tabId);
      const data = tabRequestData.get(tabId);

      // Merge API access data
      if (data && message.data) {
        Object.keys(message.data).forEach(key => {
          if (message.data[key] === true) {
            data.apiAccess[key] = true;
          }
        });

        console.log('[API Monitor] Updated API access for tab', tabId, ':', data.apiAccess);
      }
    }
    sendResponse({ success: true });
    return true;
  }
});
