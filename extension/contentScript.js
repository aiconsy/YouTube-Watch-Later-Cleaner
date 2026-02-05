(function () {
  'use strict';

  // State management
  let state = {
    inProgress: false,
    shouldStop: false,
    removed: 0,
    total: 0,
  };

  // Selectors for YouTube elements (may need updating if YouTube changes their UI)
  const SELECTORS = {
    playlistItems: 'ytd-playlist-video-renderer',
    menuButton: 'button.yt-icon-button[aria-label="Action menu"]',
    menuButtonAlt: '#button.yt-icon-button',
    menuPopup: 'tp-yt-paper-listbox',
    menuItem: 'ytd-menu-service-item-renderer',
    removeOption: 'ytd-menu-service-item-renderer',
    playlistHeader: 'ytd-playlist-header-renderer',
    headerMenuButton: 'ytd-playlist-header-renderer #button-shape-wiz button',
    headerMenu: 'ytd-popup-container tp-yt-paper-listbox',
  };

  // Text patterns for menu items (English)
  const MENU_TEXT = {
    remove: /remove from/i,
    removeWatched: /remove watched/i,
  };

  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function sendProgress() {
    chrome.runtime.sendMessage({
      type: 'progress',
      removed: state.removed,
      total: state.total,
    });
  }

  function sendComplete(message = '') {
    chrome.runtime.sendMessage({
      type: 'complete',
      removed: state.removed,
      message,
    });
  }

  function sendError(message) {
    chrome.runtime.sendMessage({
      type: 'error',
      message,
    });
  }

  function sendStopped() {
    chrome.runtime.sendMessage({
      type: 'stopped',
      removed: state.removed,
    });
  }

  function resetState() {
    state = {
      inProgress: false,
      shouldStop: false,
      removed: 0,
      total: 0,
    };
  }

  function getPlaylistItems() {
    return document.querySelectorAll(SELECTORS.playlistItems);
  }

  async function waitForElement(selector, timeout = 5000, parent = document) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const element = parent.querySelector(selector);
      if (element) return element;
      await sleep(100);
    }

    return null;
  }

  async function clickElement(element) {
    if (!element) return false;

    element.scrollIntoView({ behavior: 'instant', block: 'center' });
    await sleep(100);

    element.click();
    return true;
  }

  async function closeAnyOpenMenu() {
    // Press Escape to close any open menu
    document.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    await sleep(200);
  }

  async function findAndClickMenuItem(pattern) {
    const menuItems = document.querySelectorAll(SELECTORS.menuItem);

    for (const item of menuItems) {
      const text = item.textContent?.trim() || '';
      if (pattern.test(text)) {
        await clickElement(item);
        return true;
      }
    }

    return false;
  }

  async function removeVideoAtIndex(index) {
    const items = getPlaylistItems();
    if (index >= items.length) return false;

    const item = items[index];
    if (!item) return false;

    // Find the menu button in this item
    const menuButton =
      item.querySelector(SELECTORS.menuButton) ||
      item.querySelector(SELECTORS.menuButtonAlt);

    if (!menuButton) {
      console.warn('Menu button not found for item', index);
      return false;
    }

    // Click the menu button
    await clickElement(menuButton);
    await sleep(300);

    // Wait for menu to appear and find "Remove from" option
    await waitForElement(SELECTORS.menuPopup, 2000);
    await sleep(200);

    // Find and click the remove option
    const removed = await findAndClickMenuItem(MENU_TEXT.remove);

    if (!removed) {
      await closeAnyOpenMenu();
      console.warn('Remove option not found for item', index);
      return false;
    }

    await sleep(500);
    return true;
  }

  async function removeWatchedVideos() {
    if (state.inProgress) {
      return { success: false, error: 'Operation already in progress' };
    }

    state.inProgress = true;
    state.shouldStop = false;
    state.removed = 0;

    try {
      // Find the playlist header menu button
      const headerMenuButton = document.querySelector(SELECTORS.headerMenuButton);

      if (!headerMenuButton) {
        sendError('Could not find playlist menu button');
        resetState();
        return { success: false, error: 'Could not find playlist menu' };
      }

      // Click the header menu button
      await clickElement(headerMenuButton);
      await sleep(400);

      // Wait for menu and look for "Remove watched" option
      await waitForElement(SELECTORS.headerMenu, 3000);
      await sleep(200);

      const found = await findAndClickMenuItem(MENU_TEXT.removeWatched);

      if (!found) {
        await closeAnyOpenMenu();
        sendComplete('No "Remove watched videos" option found. You may not have any watched videos.');
        resetState();
        return { success: true };
      }

      await sleep(1000);
      sendComplete('Watched videos removal initiated');
      resetState();
      return { success: true };
    } catch (error) {
      console.error('Error removing watched videos:', error);
      sendError('An error occurred while removing watched videos');
      resetState();
      return { success: false, error: error.message };
    }
  }

  async function removeAllVideos() {
    if (state.inProgress) {
      return { success: false, error: 'Operation already in progress' };
    }

    state.inProgress = true;
    state.shouldStop = false;
    state.removed = 0;

    try {
      let consecutiveFailures = 0;
      const maxConsecutiveFailures = 3;

      while (!state.shouldStop) {
        const items = getPlaylistItems();
        state.total = items.length;

        if (items.length === 0) {
          sendComplete('All videos removed');
          break;
        }

        sendProgress();

        // Always try to remove the first item
        const success = await removeVideoAtIndex(0);

        if (success) {
          state.removed++;
          consecutiveFailures = 0;
          sendProgress();
          await sleep(300);
        } else {
          consecutiveFailures++;

          if (consecutiveFailures >= maxConsecutiveFailures) {
            sendError(
              `Failed to remove videos after ${maxConsecutiveFailures} attempts. YouTube may have changed their UI.`
            );
            break;
          }

          // Scroll to load more items and try again
          window.scrollBy(0, 300);
          await sleep(500);
        }
      }

      if (state.shouldStop) {
        sendStopped();
      }

      resetState();
      return { success: true };
    } catch (error) {
      console.error('Error removing all videos:', error);
      sendError('An error occurred while removing videos');
      resetState();
      return { success: false, error: error.message };
    }
  }

  function stopOperation() {
    state.shouldStop = true;
    return { success: true };
  }

  function getStatus() {
    return {
      inProgress: state.inProgress,
      removed: state.removed,
      total: state.total,
    };
  }

  // Message listener
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
      case 'removeWatched':
        removeWatchedVideos().then(sendResponse);
        return true; // Indicates async response

      case 'removeAll':
        removeAllVideos().then(sendResponse);
        return true;

      case 'stop':
        sendResponse(stopOperation());
        return false;

      case 'getStatus':
        sendResponse(getStatus());
        return false;

      default:
        sendResponse({ error: 'Unknown action' });
        return false;
    }
  });

  console.log('YouTube Watch Later Cleaner content script loaded');
})();
