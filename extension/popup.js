(function () {
  'use strict';

  // ===== Element references =====
  const elements = {
    status: document.getElementById('status'),
    notOnPlaylist: document.getElementById('not-on-playlist'),
    controls: document.getElementById('controls'),
    removeWatched: document.getElementById('remove-watched'),
    removeOld: document.getElementById('remove-old'),
    ageFilter: document.getElementById('age-filter'),
    ageDays: document.getElementById('age-days'),
    confirmAgeRemove: document.getElementById('confirm-age-remove'),
    cancelAgeRemove: document.getElementById('cancel-age-remove'),
    removeAll: document.getElementById('remove-all'),
    confirmAll: document.getElementById('confirm-all'),
    confirmAllYes: document.getElementById('confirm-all-yes'),
    confirmAllNo: document.getElementById('confirm-all-no'),
    exportFirst: document.getElementById('export-first'),
    exportPlaylist: document.getElementById('export-playlist'),
    stop: document.getElementById('stop'),
    progress: document.getElementById('progress'),
    progressCount: document.getElementById('progress-count'),
    progressFill: document.getElementById('progress-fill'),
    progressEta: document.getElementById('progress-eta'),
    progressRate: document.getElementById('progress-rate'),
    playlistStats: document.getElementById('playlist-stats'),
    statTotal: document.getElementById('stat-total'),
    openPlaylist: document.getElementById('open-playlist'),
  };

  let currentTabId = null;
  let lastTabUrl = null;

  // ===== DOM helpers =====
  function setStatus(message, type = 'info') {
    elements.status.textContent = message;
    elements.status.className = `status ${type}`;
  }

  function clearStatus() {
    elements.status.textContent = '';
    elements.status.className = 'status';
  }

  function showProgress(count, total, rate) {
    elements.progress.classList.remove('hidden');
    elements.progressCount.textContent = count;

    if (total > 0) {
      const percent = Math.min(100, Math.round((count / total) * 100));
      elements.progressFill.style.width = `${percent}%`;
      elements.progress.setAttribute('aria-valuenow', count);
      elements.progress.setAttribute('aria-valuemax', total);

      // ETA calculation
      if (rate > 0) {
        const remaining = total - count;
        const etaSec = Math.round(remaining / rate);
        elements.progressEta.textContent = etaSec > 60
          ? `~${Math.floor(etaSec / 60)}m ${etaSec % 60}s left`
          : `~${etaSec}s left`;
      }
    }

    if (rate > 0) {
      elements.progressRate.textContent = `${rate.toFixed(1)} videos/sec`;
    }
  }

  function hideProgress() {
    elements.progress.classList.add('hidden');
    elements.progressCount.textContent = '0';
    elements.progressFill.style.width = '0%';
    elements.progressEta.textContent = '';
    elements.progressRate.textContent = '';
  }

  function setButtonsDisabled(disabled) {
    elements.removeWatched.disabled = disabled;
    elements.removeOld.disabled = disabled;
    elements.removeAll.disabled = disabled;
    elements.exportPlaylist.disabled = disabled;
  }

  function showStopButton() {
    elements.stop.classList.remove('hidden');
    setButtonsDisabled(true);
    elements.progressFill.classList.add('active');
  }

  function hideStopButton() {
    elements.stop.classList.add('hidden');
    setButtonsDisabled(false);
    elements.progressFill.classList.remove('active');
  }

  function showConfirmDialog() {
    elements.confirmAll.classList.remove('hidden');
    elements.removeAll.classList.add('hidden');
  }

  function hideConfirmDialog() {
    elements.confirmAll.classList.add('hidden');
    elements.removeAll.classList.remove('hidden');
  }

  function showAgeFilter() {
    elements.ageFilter.classList.remove('hidden');
    elements.removeOld.classList.add('hidden');
    elements.ageDays.focus();
    elements.ageDays.select();
  }

  function hideAgeFilter() {
    elements.ageFilter.classList.add('hidden');
    elements.removeOld.classList.remove('hidden');
  }

  // ===== Tab helpers =====
  async function getCurrentTab() {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab;
  }

  function isWatchLaterPlaylist(url) {
    if (!url) return false;
    try {
      const urlObj = new URL(url);
      return (
        urlObj.hostname === 'www.youtube.com' &&
        urlObj.pathname === '/playlist' &&
        urlObj.searchParams.get('list') === 'WL'
      );
    } catch {
      return false;
    }
  }

  async function sendMessage(action, data = {}) {
    if (!currentTabId) return null;

    try {
      const response = await chrome.tabs.sendMessage(currentTabId, {
        action,
        ...data,
      });
      return response;
    } catch (error) {
      console.error('Failed to send message:', error);
      return null;
    }
  }

  // ===== Message handling =====
  function handleMessage(message) {
    switch (message.type) {
      case 'progress':
        showProgress(message.removed, message.total, message.rate || 0);
        break;

      case 'stats':
        if (message.totalVideos !== undefined) {
          elements.playlistStats.classList.remove('hidden');
          elements.statTotal.textContent = message.totalVideos;
        }
        break;

      case 'complete':
        hideStopButton();
        hideProgress();
        if (message.removed > 0) {
          setStatus(`Removed ${message.removed} video(s)`, 'success');
        } else {
          setStatus(message.message || 'No videos to remove', 'info');
        }
        // Refresh stats
        sendMessage('getStats');
        break;

      case 'error':
        hideStopButton();
        hideProgress();
        setStatus(message.message || 'An error occurred', 'error');
        break;

      case 'stopped':
        hideStopButton();
        if (message.removed > 0) {
          setStatus(`Stopped. Removed ${message.removed} video(s)`, 'info');
        } else {
          setStatus('Operation stopped', 'info');
        }
        sendMessage('getStats');
        break;

      case 'exportComplete':
        setStatus(`Exported ${message.count} video(s) to storage`, 'success');
        break;
    }
  }

  // ===== Initialization =====
  let messageListenerAdded = false;

  async function initialize() {
    const tab = await getCurrentTab();

    if (!tab || !isWatchLaterPlaylist(tab.url)) {
      elements.notOnPlaylist.classList.remove('hidden');
      setButtonsDisabled(true);
      elements.exportPlaylist.disabled = true;
      return;
    }

    currentTabId = tab.id;

    // Add message listener only once
    if (!messageListenerAdded) {
      chrome.runtime.onMessage.addListener((message, sender) => {
        if (sender.tab?.id === currentTabId) {
          handleMessage(message);
        }
      });
      messageListenerAdded = true;
    }

    // Get stats from content script
    const stats = await sendMessage('getStats');
    if (stats?.totalVideos !== undefined) {
      elements.playlistStats.classList.remove('hidden');
      elements.statTotal.textContent = stats.totalVideos;
    }

    // Check if operation is in progress
    const status = await sendMessage('getStatus');
    if (status?.inProgress) {
      showStopButton();
      showProgress(status.removed, status.total, 0);
      setStatus('Operation in progress...', 'info');
    }
  }

  // ===== Event listeners =====

  // Remove watched videos
  elements.removeWatched.addEventListener('click', async () => {
    clearStatus();
    setStatus('Removing watched videos...', 'info');
    showStopButton();

    const response = await sendMessage('removeWatched');
    if (!response?.success) {
      hideStopButton();
      setStatus(response?.error || 'Failed to start removal', 'error');
    }
  });

  // Remove older than — show filter
  elements.removeOld.addEventListener('click', () => {
    showAgeFilter();
  });

  elements.cancelAgeRemove.addEventListener('click', () => {
    hideAgeFilter();
  });

  elements.confirmAgeRemove.addEventListener('click', async () => {
    const days = parseInt(elements.ageDays.value, 10);
    if (isNaN(days) || days < 1) {
      setStatus('Please enter a valid number of days', 'error');
      return;
    }

    hideAgeFilter();
    clearStatus();
    setStatus(`Removing videos older than ${days} days...`, 'info');
    showStopButton();

    const response = await sendMessage('removeOlderThan', { days });
    if (!response?.success) {
      hideStopButton();
      setStatus(response?.error || 'Failed to start removal', 'error');
    }
  });

  // Remove all — show confirmation
  elements.removeAll.addEventListener('click', () => {
    showConfirmDialog();
  });

  elements.confirmAllNo.addEventListener('click', () => {
    hideConfirmDialog();
  });

  elements.confirmAllYes.addEventListener('click', async () => {
    const exportFirst = elements.exportFirst.checked;
    hideConfirmDialog();
    clearStatus();

    if (exportFirst) {
      setStatus('Exporting playlist data...', 'info');
      await sendMessage('exportPlaylist');
      await new Promise((r) => setTimeout(r, 500));
    }

    setStatus('Removing all videos...', 'info');
    showStopButton();
    showProgress(0, 0, 0);

    const response = await sendMessage('removeAll');
    if (!response?.success) {
      hideStopButton();
      hideProgress();
      setStatus(response?.error || 'Failed to start removal', 'error');
    }
  });

  // Export playlist data
  elements.exportPlaylist.addEventListener('click', async () => {
    clearStatus();
    setStatus('Exporting playlist data...', 'info');

    const response = await sendMessage('exportPlaylist');
    if (!response?.success) {
      setStatus(response?.error || 'Failed to export', 'error');
    } else {
      setStatus(`Exported ${response.count || 0} video(s)`, 'success');
    }
  });

  // Stop operation
  elements.stop.addEventListener('click', async () => {
    setStatus('Stopping...', 'info');
    await sendMessage('stop');
  });

  // Open playlist link with navigation callback
  elements.openPlaylist?.addEventListener('click', async (e) => {
    e.preventDefault();
    const url = 'https://www.youtube.com/playlist?list=WL';
    await chrome.tabs.create({ url });
    window.close();
  });

  // Keyboard shortcuts
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      if (!elements.confirmAll.classList.contains('hidden')) {
        hideConfirmDialog();
      } else if (!elements.ageFilter.classList.contains('hidden')) {
        hideAgeFilter();
      }
    }
  });

  // Initialize
  initialize();
})();