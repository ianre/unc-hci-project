// Security Information Side Panel
// Displays security information for the current tab

// Load and display security information
async function loadSecurityInfo() {
  try {
    showLoading();

    // Get the current active tab
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

    if (!tab || !tab.id) {
      showError('No active tab found');
      return;
    }

    // Request security info from background service worker
    const response = await chrome.runtime.sendMessage({
      action: 'getSecurityInfo',
      tabId: tab.id
    });

    if (response.error) {
      showError(response.error);
    } else {
      renderSecurityInfo(response);
    }

  } catch (error) {
    console.error('Error loading security info:', error);
    showError('Failed to load security information: ' + error.message);
  }
}

// Listen for tab updates to refresh security info
chrome.tabs.onActivated.addListener(() => {
  loadSecurityInfo();
});

chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  // Only refresh when the page has finished loading
  if (changeInfo.status === 'complete') {
    loadSecurityInfo();
  }
});

// Listen for messages from service worker
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === 'refreshSecurityInfo') {
    loadSecurityInfo();
  }
});

// Initial load when side panel opens
document.addEventListener('DOMContentLoaded', () => {
  loadSecurityInfo();
});
