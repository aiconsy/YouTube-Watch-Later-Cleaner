// Content script for YouTube Watch Later Cleaner by AI Consy

// Listen for messages from the injected script
window.addEventListener('message', function(event) {
  if (event.source !== window) return;
  
  if (event.data.type === 'CLEANING_PROGRESS' || 
      event.data.type === 'CLEANING_COMPLETE' || 
      event.data.type === 'CLEANING_STOPPED') {
    // Forward message to popup
    chrome.runtime.sendMessage(event.data);
  }
});

// Function to wait for element to appear
function waitForElement(selector, timeout = 10000) {
  return new Promise((resolve, reject) => {
    const element = document.querySelector(selector);
    if (element) {
      resolve(element);
      return;
    }
    
    const observer = new MutationObserver((mutations, obs) => {
      const element = document.querySelector(selector);
      if (element) {
        obs.disconnect();
        resolve(element);
      }
    });
    
    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
    
    setTimeout(() => {
      observer.disconnect();
      reject(new Error('Element not found within timeout'));
    }, timeout);
  });
}

// Enhanced video removal function
async function removeVideoSafely(video) {
  try {
    // Find the menu button (three dots)
    const menuButton = video.querySelector('button[aria-label*="Action menu"]') || 
                      video.querySelector('ytd-menu-renderer button') ||
                      video.querySelector('[aria-label*="More actions"]');
    
    if (!menuButton) {
      throw new Error('Menu button not found');
    }
    
    // Click the menu button
    menuButton.click();
    
    // Wait for the menu to appear and find the remove option
    await new Promise(resolve => setTimeout(resolve, 50));
    
    const removeButton = 
      // Try to find by text content first (most reliable)
      Array.from(document.querySelectorAll('ytd-menu-service-item-renderer')).find(item => {
        const text = item.textContent.toLowerCase();
        return text.includes('remove from watch later');
      })?.querySelector('a') ||
      // Try to find the 3rd menu item (0-indexed, so index 2)
      document.querySelectorAll('ytd-menu-service-item-renderer')[2]?.querySelector('a') ||
      // Fallback: look for any element with "remove" and "watch later" text
      Array.from(document.querySelectorAll('tp-yt-paper-item, ytd-menu-service-item-renderer')).find(item => {
        const text = item.textContent.toLowerCase();
        return text.includes('remove') && text.includes('watch later');
      })?.querySelector('a') ||
      Array.from(document.querySelectorAll('tp-yt-paper-item, ytd-menu-service-item-renderer')).find(item => {
        const text = item.textContent.toLowerCase();
        return text.includes('remove') && text.includes('watch later');
      });
    
    if (!removeButton) {
      // Try to close the menu if remove button not found
      document.body.click();
      throw new Error('Remove button not found');
    }
    
    // Click the remove button
    removeButton.click();
    
    // Wait for the removal to complete
    await new Promise(resolve => setTimeout(resolve, 75));
    
    return true;
  } catch (error) {
    return false;
  }
}

// Function to get current video count
function getVideoCount() {
  const videos = document.querySelectorAll('ytd-playlist-video-renderer');
  return videos.length;
}

// Function to check if we're on the Watch Later page
function isWatchLaterPage() {
  return window.location.href.includes('youtube.com/playlist?list=WL');
}

// Add visual feedback for the extension
function addExtensionIndicator() {
  if (document.getElementById('ytw-cleaner-indicator')) return;
  
  const indicator = document.createElement('div');
  indicator.id = 'ytw-cleaner-indicator';
  indicator.style.cssText = `
    position: fixed;
    top: 10px;
    right: 10px;
    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    color: white;
    padding: 8px 12px;
    border-radius: 20px;
    font-size: 12px;
    font-weight: bold;
    z-index: 10000;
    box-shadow: 0 2px 10px rgba(0,0,0,0.3);
    font-family: 'Segoe UI', sans-serif;
  `;
  indicator.textContent = '🧹 Watch Later Cleaner Active';
  document.body.appendChild(indicator);
  
  // Remove indicator after 3 seconds
  setTimeout(() => {
    if (indicator.parentNode) {
      indicator.parentNode.removeChild(indicator);
    }
  }, 3000);
}

// Initialize when page loads
if (isWatchLaterPage()) {
  addExtensionIndicator();
}

// Listen for navigation changes (YouTube is a SPA)
let lastUrl = location.href;
new MutationObserver(() => {
  const url = location.href;
  if (url !== lastUrl) {
    lastUrl = url;
    if (isWatchLaterPage()) {
      setTimeout(addExtensionIndicator, 1000);
    }
  }
}).observe(document, { subtree: true, childList: true }); 