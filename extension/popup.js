(function () {
  'use strict';

  const elements = {
    status: document.getElementById('status'),
    notOnPlaylist: document.getElementById('not-on-playlist'),
    controls: document.getElementById('controls'),
    removeWatched: document.getElementById('remove-watched'),
    removeAll: document.getElementById('remove-all'),
    stop: document.getElementById('stop'),
    progress: document.getElementById('progress'),
    progressCount: document.getElementById('progress-count'),
    progressFill: document.getElementById('progress-fill'),
  };

  let currentTabId = null;

  function setStatus(message, type = 'info') {
    elements.status.textContent = message;
    elements.status.className = `status ${type}`;
  }

  function clearStatus() {
    elements.status.textContent = '';
    elements.status.className = 'status';
  }

  function showProgress(count, total) {
    elements.progress.classList.remove('hidden');
    elements.progressCount.textContent = count;
    if (total > 0) {
      const percent = Math.round((count / total) * 100);
      elements.progressFill.style.width = `${percent}%`;
    }
  }

  function hideProgress() {
    elements.progress.classList.add('hidden');
    elements.progressCount.textContent = '0';
    elements.progressFill.style.width = '0%';
  }

  function setButtonsDisabled(disabled) {
    elements.removeWatched.disabled = disabled;
    elements.removeAll.disabled = disabled;
  }

  function showStopButton() {
    elements.stop.classList.remove('hidden');
    setButtonsDisabled(true);
  }

  function hideStopButton() {
    elements.stop.classList.add('hidden');
    setButtonsDisabled(false);
  }

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

  function handleMessage(message) {
    switch (message.type) {
      case 'progress':
        showProgress(message.removed, message.total);
        break;

      case 'complete':
        hideStopButton();
        hideProgress();
        if (message.removed > 0) {
          setStatus(`Removed ${message.removed} video(s)`, 'success');
        } else {
          setStatus(message.message || 'No videos to remove', 'info');
        }
        break;

      case 'error':
        hideStopButton();
        hideProgress();
        setStatus(message.message || 'An error occurred', 'error');
        break;

      case 'stopped':
        hideStopButton();
        setStatus(`Stopped. Removed ${message.removed} video(s)`, 'info');
        break;
    }
  }

  async function initialize() {
    const tab = await getCurrentTab();

    if (!tab || !isWatchLaterPlaylist(tab.url)) {
      elements.notOnPlaylist.classList.remove('hidden');
      setButtonsDisabled(true);
      return;
    }

    currentTabId = tab.id;

    // Listen for messages from content script
    chrome.runtime.onMessage.addListener((message, sender) => {
      if (sender.tab?.id === currentTabId) {
        handleMessage(message);
      }
    });

    // Check if operation is already in progress
    const status = await sendMessage('getStatus');
    if (status?.inProgress) {
      showStopButton();
      showProgress(status.removed, status.total);
      setStatus('Operation in progress...', 'info');
    }
  }

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

  elements.removeAll.addEventListener('click', async () => {
    clearStatus();
    setStatus('Removing all videos...', 'info');
    showStopButton();
    showProgress(0, 0);

    const response = await sendMessage('removeAll');
    if (!response?.success) {
      hideStopButton();
      hideProgress();
      setStatus(response?.error || 'Failed to start removal', 'error');
    }
  });

  elements.stop.addEventListener('click', async () => {
    setStatus('Stopping...', 'info');
    await sendMessage('stop');
  });

  initialize();
})();
