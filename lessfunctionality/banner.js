function createBanner() {
    console.log('Security Banner: Creating banner...');
    
    try {
        // Create banner element
        const banner = document.createElement('div');
        banner.id = 'custom-banner';
        banner.className = 'banner analyzing';
        banner.innerHTML = `
            <div class="banner-content">
                <div class="banner-status">
                    <span class="status-icon">⏳</span>
                    <div class="status-info">
                        <span class="status-title">Checking Security...</span>
                        <span class="status-details">Analyzing connection and privacy risks</span>
                    </div>
                </div>
                <div class="banner-actions">
                    <button class="banner-close">&times;</button>
                </div>
            </div>
        `;
        
        // Inject at the top of the body
        document.body.insertBefore(banner, document.body.firstChild);
        document.body.classList.add('banner-active');
        
        console.log('Security Banner: Banner created successfully!');
        
        // Add event listeners
        setupEventListeners();
        
        // Start security analysis after a short delay
        setTimeout(analyzeSecurityStatus, 1000);
        
    } catch (error) {
        console.error('Security Banner: Error creating banner:', error);
    }
}

function setupEventListeners() {
    // Close button
    const closeBtn = document.querySelector('#custom-banner .banner-close');
    if (closeBtn) {
        closeBtn.addEventListener('click', function() {
            const banner = document.getElementById('custom-banner');
            if (banner) {
                banner.style.opacity = '0';
                setTimeout(() => {
                    banner.remove();
                    document.body.classList.remove('banner-active');
                }, 300);
            }
        });
    }
    
    // Details button
    const detailsBtn = document.querySelector('#custom-banner .banner-btn');
    if (detailsBtn) {
        detailsBtn.addEventListener('click', function() {
            chrome.runtime.sendMessage({
                action: 'openSecurityPanel'
            }).catch(error => {
                console.log('Security Banner: Alternative panel opening method');
                chrome.runtime.sendMessage({
                    action: 'showSidePanel'
                });
            });
        });
    }
}

async function analyzeSecurityStatus() {
    try {
        console.log('Security Banner: Starting security analysis...');
        
        // Get the current tab ID from the URL or use a different approach
        // Since we can't use chrome.tabs.query in content script, we'll request data for the current context
        const securityInfo = await chrome.runtime.sendMessage({
            action: 'getSecurityInfoForCurrentTab'
        });

        console.log('Security Banner: Received security info:', securityInfo);

        if (securityInfo.error) {
            updateBanner('warning', 'Analysis Failed', securityInfo.error, '⚠️');
            return;
        }

        evaluateSecurityStatus(securityInfo);
        
    } catch (error) {
        console.error('Security Banner: Analysis error:', error);
        updateBanner('warning', 'Analysis Error', 'Failed to check security status', '⚠️');
    }
}

function evaluateSecurityStatus(data) {
    console.log('Security Banner: Evaluating security data:', data);
    
    const { certificate, privacy, warnings, apiAccess } = data;
    
    let status = 'secure';
    let title = 'Secure Connection';
    let details = 'Minimal tracking detected';
    let icon = '✅';

    // Basic security evaluation
    if (certificate && !certificate.isSecure) {
        status = 'danger';
        title = 'Insecure Connection';
        details = 'Not using HTTPS - data may be intercepted';
        icon = '✋';
    } 
    else if (privacy && (privacy.trackerRequests > 10 || privacy.thirdPartyCookies > 15)) {
        status = 'danger';
        title = 'High Privacy Risk';
        details = `Heavy tracking: ${privacy.trackerRequests || 0} trackers`;
        icon = '✋';
    }
    else if (privacy && (privacy.trackerRequests > 5 || privacy.thirdPartyCookies > 5)) {
        status = 'warning';
        title = 'Privacy Concerns';
        details = `Tracking detected: ${privacy.trackerRequests || 0} trackers`;
        icon = '⚠️';
    }
    else if (certificate && certificate.isSecure) {
        status = 'secure';
        title = 'Secure Connection';
        details = 'Minimal tracking detected';
        icon = '✅';
    }
    else {
        status = 'analyzing';
        title = 'Still Analyzing';
        details = 'Gathering security information...';
        icon = '⏳';
    }

    // Add API access warnings if any
    if (apiAccess) {
        const activeRisks = [];
        if (apiAccess.clipboardRead) activeRisks.push('clipboard');
        if (apiAccess.screenCapture) activeRisks.push('screen recording');
        if (apiAccess.geolocation) activeRisks.push('location');

        if (activeRisks.length > 0) {
            details += ` - ${activeRisks.join(', ')} access detected`;
            if (status === 'secure') {
                status = 'warning';
                icon = '⚠️';
            }
        }
    }

    updateBanner(status, title, details, icon);
}

function updateBanner(status, title, details, icon = '⏳') {
    const banner = document.getElementById('custom-banner');
    if (!banner) {
        console.log('Security Banner: Banner element not found during update');
        return;
    }
    
    // Update classes
    banner.className = `banner ${status}`;
    
    // Update content
    const statusIcon = banner.querySelector('.status-icon');
    const statusTitle = banner.querySelector('.status-title');
    const statusDetails = banner.querySelector('.status-details');
    
    if (statusIcon) statusIcon.textContent = icon;
    if (statusTitle) statusTitle.textContent = title;
    if (statusDetails) statusDetails.textContent = details;
    
    console.log(`Security Banner: Updated to ${status} - ${title}`);
}

// Initialize when DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createBanner);
} else {
    createBanner();
}

// Fallback in case DOMContentLoaded already fired
setTimeout(() => {
    if (!document.getElementById('custom-banner')) {
        console.log('Security Banner: Fallback initialization');
        createBanner();
    }
}, 2000);