(function () {
  'use strict';

  // ===== Configuration =====
  const CONFIG = {
    delays: {
      afterClick: 300,        // ms after clicking a button
      afterMenuOpen: 250,     // ms after menu opens
      afterRemove: 400,       // ms after removing a video
      afterScroll: 500,       // ms after scrolling
      escapeWait: 200,        // ms after pressing escape
      batchPause: 2000,       // ms pause every N videos
      batchSize: 10,          // videos per batch before pausing
    },
    retries: {
      maxAttempts: 3,         // attempts before giving up on a video
      maxConsecutive: 5,     // consecutive failures before aborting
      backoffBase: 1000,     // ms base for exponential backoff
      backoffMax: 10000,     // ms max backoff delay
    },
    scroll: {
      distance: 400,          // px to scroll when looking for items
      maxScrolls: 3,          // max scroll attempts before giving up
    },
  };

  // ===== Selectors for YouTube DOM (with fallbacks) =====
  const SELECTORS = {
    playlistItems: [
      'ytd-playlist-video-renderer',
      'ytd-playlist-panel-video-renderer',
    ],
    menuButton: [
      'button.yt-icon-button[aria-label="Action menu"]',
      '#button.yt-icon-button',
      'button[aria-label="More actions"]',
      'yt-icon-button#button',
    ],
    menuPopup: [
      'tp-yt-paper-listbox',
      'ytd-menu-popup-renderer',
    ],
    menuItem: [
      'ytd-menu-service-item-renderer',
      'yt-formatted-string.ytd-menu-service-item-renderer',
    ],
    headerMenuButton: [
      'ytd-playlist-header-renderer #button-shape-wiz button',
      'ytd-playlist-header-renderer button[aria-label="More actions"]',
      'ytd-playlist-header-renderer yt-icon-button#button',
    ],
    headerMenu: [
      'ytd-popup-container tp-yt-paper-listbox',
      'ytd-popup-container ytd-menu-popup-renderer',
    ],
    videoTitle: [
      '#video-title',
      'a.yt-simple-endpoint #video-title',
    ],
    videoMeta: [
      '#metadata span',
      'ytd-video-meta-block-renderer span',
    ],
    progressBar: [
      '#progress',
      'ytd-thumbnail-overlay-resume-playback-renderer #progress',
    ],
  };

  // ===== Multi-language menu text patterns =====
  const MENU_TEXT = {
    remove: /remove from|retirer de|entfernen|quitar de|rimuovi da|verwijderen uit|削除|삭제|remover de|удалить из|usuń z|eliminali|odstrani|izņemt|ta bort|fjern fra|poista|eemalda|eltávolítás|odebrat|премахване|уклони|видалити|Retirer|Aus\s.*entfernen|Quitar|Rimuovi|Verwijder|削除|삭제|Remover|Удалить|Usuń|Odstranit|Eltávolítás|Poista|Fjern/i,
    removeWatched: /remove watched|retirer les vidéos regardées|gesehene videos entfernen|quitar vídeos vistos|rimuovi guardati|verwijder bekeken|視聴済みを削除|시청함 삭제|remover assistidos|убрать просмотренные|usuń obejrzane|odstranit zhlédé|eltávolított|poista katsotut|fjern sette|ta bort tittade|eliminar vistos|odstrániť pozreté/i,
  };

  // ===== State management =====
  let state = {
    inProgress: false,
    shouldStop: false,
    removed: 0,
    total: 0,
    startTime: 0,
    lastRate: 0,
  };

  // ===== Utility functions =====
  function sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  function querySelectorFallback(selectors, parent = document) {
    for (const selector of selectors) {
      const el = parent.querySelector(selector);
      if (el) return el;
    }
    return null;
  }

  function querySelectorAllFallback(selectors, parent = document) {
    for (const selector of selectors) {
      const els = parent.querySelectorAll(selector);
      if (els.length > 0) return els;
    }
    return [];
  }

  function getRate() {
    if (!state.startTime || state.removed === 0) return 0;
    const elapsed = (Date.now() - state.startTime) / 1000;
    return elapsed > 0 ? state.removed / elapsed : 0;
  }

  // ===== Messaging =====
  function sendMessage(data) {
    try {
      chrome.runtime.sendMessage(data);
    } catch (e) {
      console.warn('Failed to send message:', e);
    }
  }

  function sendProgress() {
    state.lastRate = getRate();
    sendMessage({
      type: 'progress',
      removed: state.removed,
      total: state.total,
      rate: state.lastRate,
    });
  }

  function sendComplete(message = '') {
    sendMessage({
      type: 'complete',
      removed: state.removed,
      message,
    });
  }

  function sendError(message) {
    sendMessage({ type: 'error', message });
  }

  function sendStopped() {
    sendMessage({
      type: 'stopped',
      removed: state.removed,
    });
  }

  function sendStats() {
    const items = getPlaylistItems();
    sendMessage({
      type: 'stats',
      totalVideos: items.length,
    });
  }

  function resetState() {
    state = {
      inProgress: false,
      shouldStop: false,
      removed: 0,
      total: 0,
      startTime: 0,
      lastRate: 0,
    };
  }

  // ===== Playlist interaction =====
  function getPlaylistItems() {
    return querySelectorAllFallback(SELECTORS.playlistItems);
  }

  async function waitForElement(selectors, timeout = 5000, parent = document) {
    const startTime = Date.now();

    while (Date.now() - startTime < timeout) {
      const element = querySelectorFallback(selectors, parent);
      if (element) return element;
      await sleep(100);
    }

    return null;
  }

  async function clickElement(element) {
    if (!element) return false;

    try {
      element.scrollIntoView({ behavior: 'instant', block: 'center' });
      await sleep(CONFIG.delays.afterClick);
      element.click();
      return true;
    } catch (e) {
      console.warn('Click failed:', e);
      return false;
    }
  }

  async function closeAnyOpenMenu() {
    // Dispatch Escape on document.body for better coverage
    document.body.dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true, cancelable: true }));
    await sleep(CONFIG.delays.escapeWait);
  }

  async function findAndClickMenuItem(pattern) {
    const menuItems = querySelectorAllFallback(SELECTORS.menuItem);

    for (const item of menuItems) {
      const text = item.textContent?.trim() || '';
      if (pattern.test(text)) {
        await clickElement(item);
        return true;
      }
    }

    return false;
  }

  // ===== Video info extraction (for export/dating) =====
  function extractVideoInfo(item) {
    const titleEl = querySelectorFallback(SELECTORS.videoTitle, item);
    const progressEl = querySelectorFallback(SELECTORS.progressBar, item);

    return {
      title: titleEl?.textContent?.trim() || 'Unknown',
      url: titleEl?.href || '',
      watchProgress: progressEl ? parseFloat(progressEl.style.width) || 0 : 0,
    };
  }

  function isVideoWatched(item) {
    const progressEl = querySelectorFallback(SELECTORS.progressBar, item);
    if (progressEl) {
      const width = parseFloat(progressEl.style.width) || 0;
      return width > 90; // Consider >90% as watched
    }
    return false;
  }

  // ===== Scroll to load more videos =====
  async function scrollToLoadMore() {
    for (let i = 0; i < CONFIG.scroll.maxScrolls; i++) {
      const lastItem = getPlaylistItems();
      const countBefore = lastItem.length;

      window.scrollBy(0, CONFIG.scroll.distance);
      await sleep(CONFIG.delays.afterScroll);

      const countAfter = getPlaylistItems().length;
      if (countAfter > countBefore) return true;
    }
    return false;
  }

  // ===== Core removal operations =====
  async function removeVideoAtIndex(index, retryCount = 0) {
    const items = getPlaylistItems();
    if (index >= items.length) return false;

    const item = items[index];
    if (!item) return false;

    const menuButton = querySelectorFallback(SELECTORS.menuButton, item);

    if (!menuButton) {
      console.warn(`Menu button not found for item ${index} (attempt ${retryCount + 1})`);

      if (retryCount < CONFIG.retries.maxAttempts) {
        // Exponential backoff
        const delay = Math.min(
          CONFIG.retries.backoffBase * Math.pow(2, retryCount),
          CONFIG.retries.backoffMax
        );
        await sleep(delay);

        // Try scrolling and retrying
        if (retryCount === 1) {
          window.scrollBy(0, CONFIG.scroll.distance);
          await sleep(CONFIG.delays.afterScroll);
        }

        return removeVideoAtIndex(index, retryCount + 1);
      }

      return false;
    }

    // Click the menu button
    const clicked = await clickElement(menuButton);
    if (!clicked) return false;

    await sleep(CONFIG.delays.afterMenuOpen);

    // Wait for menu to appear
    await waitForElement(SELECTORS.menuPopup, 2000);
    await sleep(CONFIG.delays.escapeWait);

    // Find and click the remove option
    const removed = await findAndClickMenuItem(MENU_TEXT.remove);

    if (!removed) {
      await closeAnyOpenMenu();
      console.warn(`Remove option not found for item ${index}`);
      return false;
    }

    await sleep(CONFIG.delays.afterRemove);
    return true;
  }

  async function removeWatchedVideos() {
    if (state.inProgress) {
      return { success: false, error: 'Operation already in progress' };
    }

    state.inProgress = true;
    state.shouldStop = false;
    state.removed = 0;
    state.startTime = Date.now();

    try {
      const headerMenuButton = querySelectorFallback(SELECTORS.headerMenuButton);

      if (!headerMenuButton) {
        sendError('Could not find playlist menu button. YouTube may have changed their UI.');
        resetState();
        return { success: false, error: 'Could not find playlist menu' };
      }

      await clickElement(headerMenuButton);
      await sleep(CONFIG.delays.afterMenuOpen);

      const menuEl = await waitForElement(SELECTORS.headerMenu, 3000);
      if (!menuEl) {
        await closeAnyOpenMenu();
        sendError('Menu did not appear. YouTube UI may have changed.');
        resetState();
        return { success: false, error: 'Menu did not appear' };
      }

      await sleep(CONFIG.delays.escapeWait);

      const found = await findAndClickMenuItem(MENU_TEXT.removeWatched);

      if (!found) {
        await closeAnyOpenMenu();
        sendComplete('No "Remove watched" option found. You may not have any watched videos, or YouTube may have changed the menu text.');
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
    state.startTime = Date.now();

    try {
      let consecutiveFailures = 0;

      while (!state.shouldStop) {
        const items = getPlaylistItems();
        state.total = items.length;

        if (items.length === 0) {
          // Try scrolling to find more
          const loaded = await scrollToLoadMore();
          if (!loaded) {
            sendComplete('All videos removed');
            break;
          }
          continue;
        }

        sendProgress();

        // Batch pause for rate limiting
        if (state.removed > 0 && state.removed % CONFIG.delays.batchSize === 0) {
          await sleep(CONFIG.delays.batchPause);
        }

        // Always remove the first item
        const success = await removeVideoAtIndex(0);

        if (success) {
          state.removed++;
          consecutiveFailures = 0;
          sendProgress();
          await sleep(CONFIG.delays.afterRemove);
        } else {
          consecutiveFailures++;

          if (consecutiveFailures >= CONFIG.retries.maxConsecutive) {
            sendError(
              `Failed after ${CONFIG.retries.maxConsecutive} attempts. YouTube UI may have changed. ${state.removed} videos were removed.`
            );
            break;
          }

          // Scroll and retry
          window.scrollBy(0, CONFIG.scroll.distance);
          await sleep(CONFIG.delays.afterScroll);
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

  async function removeOlderThan(days) {
    if (state.inProgress) {
      return { success: false, error: 'Operation already in progress' };
    }

    // Note: YouTube doesn't show "added date" in playlist view reliably.
    // This function removes individual videos from the bottom of the list
    // (oldest first) up to an estimated count. We attempt by removing from
    // the end of the list, assuming oldest items are at the bottom.
    // This is best-effort since YouTube's API doesn't expose add-dates via DOM.

    state.inProgress = true;
    state.shouldStop = false;
    state.removed = 0;
    state.startTime = Date.now();

    try {
      // First scroll to load all items
      let lastCount = 0;
      let scrollAttempts = 0;
      while (scrollAttempts < 15) {
        const items = getPlaylistItems();
        if (items.length === lastCount) {
          scrollAttempts++;
        } else {
          lastCount = items.length;
          scrollAttempts = 0;
        }
        window.scrollBy(0, CONFIG.scroll.distance);
        await sleep(CONFIG.delays.afterScroll);
      }

      const allItems = getPlaylistItems();
      state.total = allItems.length;

      // Estimate: if user has 500 videos and says "older than 90 days",
      // with 365 days in a year, roughly 90/365 of the playlist is "old"
      // This is approximate — we remove from the bottom (oldest) of the list
      const estimatedOldCount = Math.max(1, Math.round(allItems.length * (days / 365)));

      // Remove from the end of the list (oldest items)
      for (let i = 0; i < estimatedOldCount && !state.shouldStop; i++) {
        const items = getPlaylistItems();
        state.total = items.length;

        if (items.length === 0) break;

        // Remove the last item (oldest — YouTube sorts newest first)
        const lastIndex = items.length - 1;
        const success = await removeVideoAtIndex(lastIndex);

        if (success) {
          state.removed++;
          sendProgress();
          await sleep(CONFIG.delays.afterRemove);
        } else {
          break;
        }

        // Batch pause
        if (state.removed % CONFIG.delays.batchSize === 0) {
          await sleep(CONFIG.delays.batchPause);
        }
      }

      if (state.shouldStop) {
        sendStopped();
      } else {
        sendComplete(`Removed ${state.removed} older videos (estimated)`);
      }

      resetState();
      return { success: true };
    } catch (error) {
      console.error('Error removing old videos:', error);
      sendError('An error occurred while removing old videos');
      resetState();
      return { success: false, error: error.message };
    }
  }

  // ===== Export playlist data =====
  async function exportPlaylist() {
    // First scroll to load all items
    let lastCount = 0;
    let scrollAttempts = 0;
    while (scrollAttempts < 15) {
      const items = getPlaylistItems();
      if (items.length === lastCount) {
        scrollAttempts++;
      } else {
        lastCount = items.length;
        scrollAttempts = 0;
      }
      window.scrollBy(0, CONFIG.scroll.distance);
      await sleep(CONFIG.delays.afterScroll);
    }

    const items = getPlaylistItems();
    const videos = [];

    items.forEach((item, idx) => {
      const info = extractVideoInfo(item);
      videos.push({
        index: idx + 1,
        title: info.title,
        url: info.url,
        watchProgress: info.watchProgress,
      });
    });

    const exportData = {
      exportedAt: new Date().toISOString(),
      playlist: 'Watch Later',
      totalVideos: videos.length,
      videos,
    };

    // Save to chrome.storage
    try {
      await chrome.storage.local.set({ watchLaterExport: exportData });
      sendMessage({ type: 'exportComplete', count: videos.length });
      return { success: true, count: videos.length };
    } catch (e) {
      console.error('Export failed:', e);
      return { success: false, error: 'Failed to save export data' };
    }
  }

  // ===== Stop / Status =====
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

  // ===== Message listener =====
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    switch (message.action) {
      case 'removeWatched':
        removeWatchedVideos().then(sendResponse);
        return true;

      case 'removeAll':
        removeAllVideos().then(sendResponse);
        return true;

      case 'removeOlderThan':
        removeOlderThan(message.days).then(sendResponse);
        return true;

      case 'exportPlaylist':
        exportPlaylist().then(sendResponse);
        return true;

      case 'stop':
        sendResponse(stopOperation());
        return false;

      case 'getStatus':
        sendResponse(getStatus());
        return false;

      case 'getStats':
        sendStats();
        sendResponse({ totalVideos: getPlaylistItems().length });
        return false;

      default:
        sendResponse({ error: 'Unknown action' });
        return false;
    }
  });

  // ===== MutationObserver for dynamic content =====
  const observer = new MutationObserver((mutations) => {
    if (!state.inProgress) return;

    for (const mutation of mutations) {
      if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
        // New playlist items loaded — update total count
        const items = getPlaylistItems();
        if (items.length !== state.total) {
          state.total = items.length;
          sendProgress();
        }
      }
    }
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
  });

  console.log('YouTube Watch Later Cleaner v1.0.0 content script loaded');
})();