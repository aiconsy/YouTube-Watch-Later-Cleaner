/**
 * YouTube Watch Later Cleaner — Background Service Worker
 * Handles extension lifecycle, badge updates, and cross-tab coordination.
 */

// Set up badge when extension is installed
chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({ text: '' });
  chrome.action.setBadgeBackgroundColor({ color: '#3ea6ff' });
  console.log('YouTube Watch Later Cleaner installed');
});

// Listen for messages from content scripts or popup
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  // Forward export data if needed
  if (message.type === 'exportComplete') {
    // Could trigger a download here in the future
    console.log(`Playlist exported: ${message.count} videos`);
  }
  return false;
});

// Badge update when navigating to YouTube
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.url) {
    if (tab.url.includes('youtube.com/playlist') && tab.url.includes('list=WL')) {
      chrome.action.setBadgeText({ text: '✓', tabId });
    } else {
      chrome.action.setBadgeText({ text: '', tabId });
    }
  }
});