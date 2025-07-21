// YouTube Watch Later Cleaner - Popup Script
// by AI Consy (https://aiconsy.com)

let isCleaning = false;
let cleaningInterval = null;
let removedCount = 0;
let totalVideos = 0;

// DOM elements
const statusEl = document.getElementById('status');
const openWatchLaterBtn = document.getElementById('openWatchLater');
const checkPageBtn = document.getElementById('checkPage');
const removeAllBtn = document.getElementById('removeAll');
const removeOneBtn = document.getElementById('removeOne');
const stopCleaningBtn = document.getElementById('stopCleaning');
const buyMeCoffeeBtn = document.getElementById('buyMeCoffee');
const aiConsyLink = document.getElementById('aiConsyLink');

// Initialize popup
document.addEventListener('DOMContentLoaded', function() {
  setupEventListeners();
  checkCurrentPage();
});

// Set up event listeners
function setupEventListeners() {
  openWatchLaterBtn.addEventListener('click', openWatchLaterPage);
  checkPageBtn.addEventListener('click', checkCurrentPage);
  removeAllBtn.addEventListener('click', startBulkRemoval);
  removeOneBtn.addEventListener('click', removeSingleVideo);
  stopCleaningBtn.addEventListener('click', stopCleaning);
  buyMeCoffeeBtn.addEventListener('click', openBuyMeCoffee);
  aiConsyLink.addEventListener('click', openAIConsy);
}

// Open YouTube Watch Later page
function openWatchLaterPage() {
  chrome.tabs.create({
    url: 'https://www.youtube.com/playlist?list=WL'
  });
  updateStatus('Opening YouTube Watch Later page...', 'info');
}

// Check if current page is Watch Later
async function checkCurrentPage() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (tab.url && tab.url.includes('youtube.com/playlist?list=WL')) {
      updateStatus('✅ You are on the Watch Later page!', 'success');
      enableCleaningButtons();
      getVideoCount();
    } else {
      updateStatus('❌ Please navigate to your YouTube Watch Later playlist first.', 'error');
      disableCleaningButtons();
    }
  } catch (error) {
    updateStatus('❌ Error checking page: ' + error.message, 'error');
    disableCleaningButtons();
  }
}

// Get video count from current page
async function getVideoCount() {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    const response = await chrome.tabs.sendMessage(tab.id, {
      type: 'GET_VIDEO_COUNT'
    });
    
    if (response && response.count !== undefined) {
      totalVideos = response.count;
      updateStatus(`📊 Found ${totalVideos} videos in your Watch Later list.`, 'info');
    }
  } catch (error) {
    // Could not get video count - this is normal if not on Watch Later page
  }
}

// Start bulk removal process
async function startBulkRemoval() {
  if (isCleaning) return;
  
  const confirmed = confirm(
    `⚠️ WARNING: This will remove ALL videos from your Watch Later list!\n\n` +
    `This action cannot be undone. Are you sure you want to continue?`
  );
  
  if (!confirmed) return;
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url || !tab.url.includes('youtube.com/playlist?list=WL')) {
      updateStatus('❌ Please navigate to your YouTube Watch Later playlist first.', 'error');
      return;
    }
    
    isCleaning = true;
    removedCount = 0;
    updateCleaningUI(true);
    
    // Start the cleaning process
    chrome.tabs.sendMessage(tab.id, {
      type: 'START_BULK_REMOVAL'
    });
    
    updateStatus('🧹 Starting bulk removal...', 'info');
    
  } catch (error) {
    updateStatus('❌ Error starting bulk removal: ' + error.message, 'error');
    stopCleaning();
  }
}

// Remove single video
async function removeSingleVideo() {
  if (isCleaning) return;
  
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    
    if (!tab.url || !tab.url.includes('youtube.com/playlist?list=WL')) {
      updateStatus('❌ Please navigate to your YouTube Watch Later playlist first.', 'error');
      return;
    }
    
    chrome.tabs.sendMessage(tab.id, {
      type: 'REMOVE_SINGLE_VIDEO'
    });
    
    updateStatus('🎯 Removing next video...', 'info');
    
  } catch (error) {
    updateStatus('❌ Error removing video: ' + error.message, 'error');
  }
}

// Stop cleaning process
function stopCleaning() {
  isCleaning = false;
  if (cleaningInterval) {
    clearInterval(cleaningInterval);
    cleaningInterval = null;
  }
  
  updateCleaningUI(false);
  updateStatus('⏹️ Cleaning stopped.', 'info');
  
  // Notify content script to stop
  chrome.tabs.query({ active: true, currentWindow: true }, function(tabs) {
    if (tabs[0]) {
      chrome.tabs.sendMessage(tabs[0].id, {
        type: 'STOP_CLEANING'
      });
    }
  });
}

// Update cleaning UI state
function updateCleaningUI(cleaning) {
  removeAllBtn.disabled = cleaning;
  removeOneBtn.disabled = cleaning;
  stopCleaningBtn.disabled = !cleaning;
  checkPageBtn.disabled = cleaning;
}

// Enable cleaning buttons
function enableCleaningButtons() {
  removeAllBtn.disabled = false;
  removeOneBtn.disabled = false;
}

// Disable cleaning buttons
function disableCleaningButtons() {
  removeAllBtn.disabled = true;
  removeOneBtn.disabled = true;
  stopCleaningBtn.disabled = true;
}

// Update status message
function updateStatus(message, type = 'info') {
  statusEl.textContent = message;
  statusEl.className = `status ${type}`;
}

// Open Buy Me a Coffee
function openBuyMeCoffee() {
  chrome.tabs.create({
    url: 'https://www.buymeacoffee.com/aiconsy'
  });
}

// Open AI Consy website
function openAIConsy() {
  chrome.tabs.create({
    url: 'https://aiconsy.com'
  });
}

// Listen for messages from content script
chrome.runtime.onMessage.addListener(function(message, sender, sendResponse) {
  if (message.type === 'CLEANING_PROGRESS') {
    removedCount = message.removedCount;
    totalVideos = message.totalVideos;
    
    const remaining = totalVideos - removedCount;
    updateStatus(`🧹 Removed ${removedCount} videos. ${remaining} remaining...`, 'info');
    
  } else if (message.type === 'CLEANING_COMPLETE') {
    isCleaning = false;
    updateCleaningUI(false);
    updateStatus(`✅ Cleaning complete! Removed ${message.removedCount} videos.`, 'success');
    
  } else if (message.type === 'CLEANING_STOPPED') {
    isCleaning = false;
    updateCleaningUI(false);
    updateStatus(`⏹️ Cleaning stopped. Removed ${message.removedCount} videos.`, 'info');
    
  } else if (message.type === 'SINGLE_VIDEO_REMOVED') {
    updateStatus(`✅ Video removed successfully!`, 'success');
    setTimeout(() => {
      updateStatus('Ready to remove more videos.', 'info');
    }, 2000);
    
  } else if (message.type === 'ERROR') {
    updateStatus(`❌ Error: ${message.error}`, 'error');
    if (isCleaning) {
      stopCleaning();
    }
  }
}); 