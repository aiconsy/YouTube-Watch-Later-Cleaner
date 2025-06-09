document.addEventListener('DOMContentLoaded', function() {
  const checkPageBtn = document.getElementById('checkPage');
  const removeAllBtn = document.getElementById('removeAll');
  const removeOneBtn = document.getElementById('removeOne');
  const stopCleaningBtn = document.getElementById('stopCleaning');
  const statusDiv = document.getElementById('status');
  
  let isCleaningActive = false;
  
  // Function to open YouTube Watch Later page
  async function openWatchLaterPage() {
    try {
      await chrome.tabs.create({
        url: 'https://www.youtube.com/playlist?list=WL',
        active: true
      });
      // Close the popup after opening the tab
      window.close();
    } catch (error) {
      updateStatus('❌ Error opening YouTube Watch Later page.', 'error');
    }
  }
  
  // Check if we're on the right page
  async function checkCurrentPage() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      if (!tab.url.includes('youtube.com/playlist?list=WL')) {
        updateStatus('❌ Not on Watch Later page. Click "Open Watch Later Page" to get started!', 'error');
        disableButtons();
        return false;
      }
      
      // Inject content script and check for videos
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: checkForVideos
      });
      
      const videoCount = results[0].result;
      
      if (videoCount === 0) {
        updateStatus('✅ Your Watch Later list is already empty!', 'success');
        disableButtons();
      } else {
        updateStatus(`📺 Found ${videoCount} videos in your Watch Later list. Ready to clean!`, 'ready');
        enableButtons();
      }
      
      return videoCount > 0;
    } catch (error) {
      updateStatus('❌ Error checking page. Make sure you\'re on YouTube.', 'error');
      disableButtons();
      return false;
    }
  }
  
  // Function to inject into the page to check for videos
  function checkForVideos() {
    // Try to get the actual count from YouTube's interface first
    const playlistStats = document.querySelector('#stats .style-scope.ytd-playlist-sidebar-primary-info-renderer');
    if (playlistStats) {
      const statsText = playlistStats.textContent;
      const videoCountMatch = statsText.match(/(\d+)\s+videos?/i);
      if (videoCountMatch) {
        return parseInt(videoCountMatch[1]);
      }
    }
    
    // Fallback: count visible video elements
    const videos = document.querySelectorAll('ytd-playlist-video-renderer');
    return videos.length;
  }
  
  // Remove all videos
  async function removeAllVideos() {
    if (!confirm('Are you sure you want to remove ALL videos from your Watch Later list? This action cannot be undone.')) {
      return;
    }
    
    isCleaningActive = true;
    updateStatus('🧹 Removing all videos...', 'cleaning');
    removeAllBtn.disabled = true;
    removeOneBtn.disabled = true;
    stopCleaningBtn.disabled = false;
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: startBulkRemoval
      });
      
    } catch (error) {
      updateStatus('❌ Error during bulk removal.', 'error');
      resetButtons();
    }
  }
  
  // Remove one video
  async function removeOneVideo() {
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      const results = await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: removeSingleVideo
      });
      
      const result = results[0].result;
      
      if (result.success) {
        const totalCount = result.actualCount || result.remaining + 1;
        updateStatus(`✅ Removed 1 video. ${result.remaining}/${totalCount} videos remaining.`, 'success');
        if (result.remaining === 0) {
          updateStatus('🎉 All videos removed! Your Watch Later list is now empty.', 'success');
          disableButtons();
        }
      } else {
        updateStatus('❌ Could not remove video. ' + result.message, 'error');
      }
      
    } catch (error) {
      updateStatus('❌ Error removing video.', 'error');
    }
  }
  
  // Function to inject for bulk removal
  function startBulkRemoval() {
    let removedCount = 0;
    let isRunning = true;
    
    // Listen for stop signal
    window.stopCleaning = () => {
      isRunning = false;
    };
    
    function removeNext() {
      if (!isRunning) {
        window.postMessage({ type: 'CLEANING_STOPPED', removedCount }, '*');
        return;
      }
      
      const videos = document.querySelectorAll('ytd-playlist-video-renderer');
      
      // Check if playlist is empty by looking at the actual count
      const playlistStats = document.querySelector('#stats .style-scope.ytd-playlist-sidebar-primary-info-renderer');
      let actualCount = videos.length;
      if (playlistStats) {
        const statsText = playlistStats.textContent;
        const videoCountMatch = statsText.match(/(\d+)\s+videos?/i);
        if (videoCountMatch) {
          actualCount = parseInt(videoCountMatch[1]);
        }
      }
      
      if (videos.length === 0 || actualCount === 0) {
        window.postMessage({ type: 'CLEANING_COMPLETE', removedCount, actualCount: 0 }, '*');
        return;
      }
      
      const video = videos[0];
      const menuButton = video.querySelector('button[aria-label*="Action menu"]');
      
      if (menuButton) {
        menuButton.click();
        
        setTimeout(() => {
          // Find the specific "Remove from Watch later" option (3rd in the list)
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
          
          if (removeButton) {
            removeButton.click();
            removedCount++;
            
            // Update status with actual count
            window.postMessage({ 
              type: 'CLEANING_PROGRESS', 
              removedCount, 
              remaining: Math.max(actualCount - removedCount, videos.length - 1),
              actualCount: actualCount
            }, '*');
            
            setTimeout(removeNext, 150);
          } else {
            // Try clicking the menu again if button not found
            setTimeout(() => {
              const menuButton = video.querySelector('button[aria-label*="Action menu"]');
              if (menuButton) menuButton.click();
              setTimeout(removeNext, 100);
            }, 50);
          }
        }, 125);
              } else {
                        setTimeout(removeNext, 75);
        }
    }
    
    removeNext();
  }
  
  // Function to inject for single video removal
  function removeSingleVideo() {
    const videos = document.querySelectorAll('ytd-playlist-video-renderer');
    
    // Get actual count from YouTube's interface
    const playlistStats = document.querySelector('#stats .style-scope.ytd-playlist-sidebar-primary-info-renderer');
    let actualCount = videos.length;
    if (playlistStats) {
      const statsText = playlistStats.textContent;
      const videoCountMatch = statsText.match(/(\d+)\s+videos?/i);
      if (videoCountMatch) {
        actualCount = parseInt(videoCountMatch[1]);
      }
    }
    
    if (videos.length === 0 || actualCount === 0) {
      return { success: false, message: 'No videos found to remove.', remaining: 0, actualCount: 0 };
    }
    
    const video = videos[0];
    const menuButton = video.querySelector('button[aria-label*="Action menu"]');
    
    if (!menuButton) {
      return { success: false, message: 'Could not find menu button.', remaining: actualCount, actualCount: actualCount };
    }
    
    menuButton.click();
    
    setTimeout(() => {
      // Find the specific "Remove from Watch later" option (3rd in the list)
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
      
      if (removeButton) {
        removeButton.click();
      }
    }, 125);
    
    return { success: true, remaining: Math.max(actualCount - 1, 0), actualCount: actualCount };
  }
  
  // Stop cleaning process
  async function stopCleaning() {
    isCleaningActive = false;
    
    try {
      const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
      
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        function: () => {
          if (window.stopCleaning) {
            window.stopCleaning();
          }
        }
      });
      
      updateStatus('⏹️ Cleaning stopped by user.', 'warning');
      resetButtons();
      
    } catch (error) {
      updateStatus('❌ Error stopping cleaning process.', 'error');
    }
  }
  
  // Listen for messages from content script
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.type === 'CLEANING_PROGRESS') {
      const totalCount = message.actualCount || message.remaining + message.removedCount;
      updateStatus(`🧹 Removed ${message.removedCount}/${totalCount} videos. ${message.remaining} remaining...`, 'cleaning');
    } else if (message.type === 'CLEANING_COMPLETE') {
      updateStatus(`🎉 All videos removed! Cleaned ${message.removedCount} videos from your Watch Later list.`, 'success');
      resetButtons();
      // Auto-refresh the count
      setTimeout(checkCurrentPage, 1000);
    } else if (message.type === 'CLEANING_STOPPED') {
      updateStatus(`⏹️ Cleaning stopped. Removed ${message.removedCount} videos.`, 'warning');
      resetButtons();
    }
  });
  
  function updateStatus(message, type) {
    // Sanitize message to prevent XSS
    const sanitizedMessage = String(message).replace(/[<>]/g, '');
    statusDiv.textContent = sanitizedMessage;
    statusDiv.className = 'status ' + (type || '');
  }
  
  function enableButtons() {
    removeAllBtn.disabled = false;
    removeOneBtn.disabled = false;
  }
  
  function disableButtons() {
    removeAllBtn.disabled = true;
    removeOneBtn.disabled = true;
    stopCleaningBtn.disabled = true;
  }
  
  function resetButtons() {
    isCleaningActive = false;
    removeAllBtn.disabled = false;
    removeOneBtn.disabled = false;
    stopCleaningBtn.disabled = true;
  }
  
  // Function to open support links
  async function openSupportLink(url) {
    try {
      await chrome.tabs.create({
        url: url,
        active: true
      });
    } catch (error) {
      // Fallback: try to open in same tab
      window.open(url, '_blank');
    }
  }

  // Event listeners
  document.getElementById('openWatchLater').addEventListener('click', openWatchLaterPage);
  checkPageBtn.addEventListener('click', checkCurrentPage);
  removeAllBtn.addEventListener('click', removeAllVideos);
  removeOneBtn.addEventListener('click', removeOneVideo);
  stopCleaningBtn.addEventListener('click', stopCleaning);
  
  // Support button event listeners
  document.getElementById('buyMeCoffee').addEventListener('click', () => {
    openSupportLink('https://buymeacoffee.com/aiconsy');
  });
  
  document.getElementById('aiConsyLink').addEventListener('click', (e) => {
    e.preventDefault();
    openSupportLink('https://aiconsy.com');
  });
  
  // Auto-check page on popup open
  checkCurrentPage();
}); 