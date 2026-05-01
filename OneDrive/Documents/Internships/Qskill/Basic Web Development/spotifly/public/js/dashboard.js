/* SpotiFly Dashboard JS */

// ===== STATE =====
let currentUser = null;
let sessionDownloads = 0;
let downloadHistory = [];
const trackStore = {}; // trackId → track object (avoids JSON-in-onclick issues)

// ===== INIT =====
document.addEventListener('DOMContentLoaded', async () => {
  await checkAuth();
  initNav();
  initSidebar();
  initGreeting();
  loadHistory();
  renderStats();
  initDownloadPage();
  initQuickDownload();
  initProfile();
});

// ===== AUTH CHECK =====
async function checkAuth() {
  try {
    const res = await fetch('/api/auth/me', { credentials: 'include' });
    const data = await res.json();
    if (!data.loggedIn) { window.location.href = '/'; return; }
    currentUser = data.user;
    document.getElementById('userName').textContent = currentUser.name;
    document.getElementById('userAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
  } catch { window.location.href = '/'; }
}

// ===== LOGOUT =====
async function doLogout() {
  try { await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' }); } catch {}
  window.location.href = '/';
}

document.getElementById('logoutBtn').addEventListener('click', doLogout);
document.getElementById('profileLogoutBtn').addEventListener('click', doLogout);

// ===== NAVIGATION =====
function initNav() {
  document.querySelectorAll('.nav-item[data-page]').forEach(item => {
    item.addEventListener('click', () => {
      navigateTo(item.getAttribute('data-page'));
      closeSidebar();
    });
  });
}

function navigateTo(page) {
  document.querySelectorAll('.nav-item').forEach(n => n.classList.remove('active'));
  document.querySelectorAll('.page-section').forEach(s => s.classList.remove('active'));

  const activeNav = document.querySelector(`.nav-item[data-page="${page}"]`);
  const activePage = document.getElementById(`page-${page}`);

  if (activeNav) activeNav.classList.add('active');
  if (activePage) activePage.classList.add('active');

  if (page === 'history') renderHistory();
  if (page === 'profile') renderProfile();
}

// ===== MOBILE SIDEBAR =====
function initSidebar() {
  document.getElementById('hamburgerBtn').addEventListener('click', openSidebar);
  document.getElementById('sidebarOverlay').addEventListener('click', closeSidebar);
}
function openSidebar() {
  document.getElementById('sidebar').classList.add('open');
  document.getElementById('sidebarOverlay').classList.add('visible');
}
function closeSidebar() {
  document.getElementById('sidebar').classList.remove('open');
  document.getElementById('sidebarOverlay').classList.remove('visible');
}

// ===== GREETING =====
function initGreeting() {
  const h = new Date().getHours();
  const greeting = h < 12 ? 'Good morning' : h < 17 ? 'Good afternoon' : 'Good evening';
  document.getElementById('greetingText').textContent = `${greeting} 👋`;
}

// ===== HISTORY =====
function loadHistory() {
  try { downloadHistory = JSON.parse(localStorage.getItem('spotifly_history') || '[]'); }
  catch { downloadHistory = []; }
  updateStats();
}
function saveHistory() {
  localStorage.setItem('spotifly_history', JSON.stringify(downloadHistory));
}
function addToHistory(track) {
  downloadHistory.unshift({ ...track, downloadedAt: new Date().toISOString(), id: Date.now() });
  if (downloadHistory.length > 50) downloadHistory = downloadHistory.slice(0, 50);
  saveHistory();
  sessionDownloads++;
  renderStats();
  renderRecentHistory();
}

// ===== STATS =====
function renderStats() {
  document.getElementById('statDownloads').textContent = downloadHistory.length;
  document.getElementById('statSession').textContent = sessionDownloads;
}
function updateStats() { renderStats(); renderRecentHistory(); }

// ===== RECENT HISTORY (HOME) =====
function renderRecentHistory() {
  const container = document.getElementById('recentHistoryList');
  const recent = downloadHistory.slice(0, 5);
  if (!recent.length) {
    container.innerHTML = `<div class="empty-history">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <path d="M9 18V5l12-2v13M6 21a3 3 0 100-6 3 3 0 000 6zM18 19a3 3 0 100-6 3 3 0 000 6z"/>
      </svg>
      <p>No downloads yet. Paste a Spotify link above!</p>
    </div>`;
    return;
  }
  container.innerHTML = recent.map(historyItemHTML).join('');
}

function historyItemHTML(item) {
  const dateStr = new Date(item.downloadedAt).toLocaleDateString('en-IN', {
    month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit'
  });
  return `<div class="history-item">
    ${item.thumbnail
      ? `<img class="history-thumb" src="${item.thumbnail}" alt="${item.title}" onerror="this.style.display='none'">`
      : `<div class="history-thumb" style="background:var(--input-bg);display:flex;align-items:center;justify-content:center;">
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="var(--text-muted)" stroke-width="2">
            <path d="M9 18V5l12-2v13M6 21a3 3 0 100-6 3 3 0 000 6zM18 19a3 3 0 100-6 3 3 0 000 6z"/>
          </svg></div>`
    }
    <div class="history-info">
      <div class="history-title">${item.title}</div>
      <div class="history-artist">${item.artist}</div>
    </div>
    <div class="history-date">${dateStr}</div>
    <span class="history-status done">Downloaded</span>
  </div>`;
}

// ===== FULL HISTORY PAGE =====
function renderHistory() {
  const container = document.getElementById('historyList');
  if (!downloadHistory.length) {
    container.innerHTML = `<div class="empty-history">
      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
      </svg>
      <p>Your download history will appear here</p>
    </div>`;
    return;
  }
  container.innerHTML = downloadHistory.map(historyItemHTML).join('');
}

document.getElementById('clearHistoryBtn').addEventListener('click', () => {
  if (!downloadHistory.length) { showToast('No history to clear', 'info'); return; }
  downloadHistory = [];
  saveHistory();
  renderHistory();
  renderStats();
  renderRecentHistory();
  showToast('History cleared', 'success');
});

// ===== PROFILE =====
function renderProfile() {
  if (!currentUser) return;
  document.getElementById('profileName').textContent = currentUser.name;
  document.getElementById('profileEmail').textContent = currentUser.email;
  document.getElementById('profileAvatar').textContent = currentUser.name.charAt(0).toUpperCase();
  document.getElementById('profileDownloads').textContent = downloadHistory.length;
  document.getElementById('profileJoined').textContent = 'Today';
}
function initProfile() {}

// ===== TRACK CARD HTML =====
function parseSpotifyUrl(url) {
  const u = url.match(/open\.spotify\.com\/track\/([A-Za-z0-9]+)/);
  if (u) return u[1];
  const s = url.match(/^spotify:track:([A-Za-z0-9]+)$/);
  if (s) return s[1];
  return null;
}

function trackResultHTML(track) {
  // Store track object by ID so onclick can look it up safely (no JSON-in-attr)
  trackStore[track.id] = track;

  return `<div class="track-card">
    ${track.thumbnail
      ? `<img class="track-thumbnail" src="${track.thumbnail}" alt="${track.title}" onerror="this.style.display='none'">`
      : `<div class="track-thumbnail-placeholder">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <path d="M9 18V5l12-2v13M6 21a3 3 0 100-6 3 3 0 000 6zM18 19a3 3 0 100-6 3 3 0 000 6z"/>
          </svg>
        </div>`
    }
    <div class="track-info">
      <div class="track-name">${track.title}</div>
      <div class="track-artist">${track.artist} • ${track.album || 'Unknown Album'}</div>
      <div class="track-meta">
        <div class="track-meta-item">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>
          </svg>${track.duration || 'N/A'}
        </div>
        <div class="track-meta-item">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
          </svg>${track.year || 'N/A'}
        </div>
        ${track.genre ? `<div class="track-meta-item">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 18V5l12-2v13M6 21a3 3 0 100-6 3 3 0 000 6zM18 19a3 3 0 100-6 3 3 0 000 6z"/>
          </svg>${track.genre}
        </div>` : ''}
      </div>
      <div class="track-actions">
        <button class="download-btn" data-track-id="${track.id}" onclick="startDownload('${track.id}', this)">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5">
            <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
          </svg>
          Download MP3
        </button>
        <a href="${track.spotifyUrl}" target="_blank" rel="noopener" class="open-spotify-btn">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" width="14" height="14">
            <path d="M12 2C6.477 2 2 6.477 2 12s4.477 10 10 10 10-4.477 10-10S17.523 2 12 2zm4.586 14.424a.622.622 0 01-.857.207c-2.348-1.435-5.304-1.76-8.785-.964a.622.622 0 11-.277-1.215c3.808-.87 7.076-.496 9.712 1.115a.622.622 0 01.207.857zm1.223-2.722a.778.778 0 01-1.07.256C14.056 12.348 11.5 12 8.862 12.657a.778.778 0 11-.352-1.515c2.98-.694 5.895-.292 8.042 1.49a.778.778 0 01.257 1.07zm.105-2.835C15.23 9.14 11.5 9.018 8.647 9.779a.934.934 0 11-.484-1.804c3.243-.87 7.396-.7 10.308 1.118a.934.934 0 11-.958 1.774z"/>
          </svg>
          Open in Spotify
        </a>
      </div>
      <div class="download-progress" id="progress-${track.id}">
        <div class="progress-bar-wrap"><div class="progress-bar-fill" id="progressFill-${track.id}"></div></div>
        <div class="progress-text" id="progressText-${track.id}">Preparing download...</div>
      </div>
    </div>
  </div>`;
}

// ===== FETCH TRACK =====
async function fetchTrack(urlInput, resultContainer, fetchBtn) {
  const url = urlInput.value.trim();
  if (!url) { showToast('Please paste a Spotify link first', 'error'); return; }

  const trackId = parseSpotifyUrl(url);
  if (!trackId) {
    showToast('Invalid Spotify link format', 'error');
    urlInput.classList.add('error');
    setTimeout(() => urlInput.classList.remove('error'), 2000);
    return;
  }

  fetchBtn.disabled = true;
  const origContent = fetchBtn.innerHTML;
  fetchBtn.innerHTML = `<span style="display:inline-block;width:16px;height:16px;border:2px solid rgba(0,0,0,0.3);border-top-color:black;border-radius:50%;animation:spin 0.8s linear infinite;"></span> Fetching...`;
  resultContainer.classList.remove('visible');

  try {
    const res = await fetch('/api/download/fetch', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ spotifyUrl: url }),
    });

    const data = await res.json();

    if (res.ok && data.success) {
      resultContainer.innerHTML = trackResultHTML(data.track);
      resultContainer.classList.add('visible');
      showToast(`Found: ${data.track.title} by ${data.track.artist}`, 'success');
    } else {
      showToast(data.error || 'Failed to fetch track', 'error');
    }
  } catch {
    showToast('Network error. Is the server running?', 'error');
  } finally {
    fetchBtn.disabled = false;
    fetchBtn.innerHTML = origContent;
  }
}

// ===== DOWNLOAD =====
async function startDownload(trackId, btn) {
  const track = trackStore[trackId];
  if (!track) { showToast('Track info missing, please fetch again.', 'error'); return; }

  const progressEl = document.getElementById(`progress-${trackId}`);
  const fillEl     = document.getElementById(`progressFill-${trackId}`);
  const textEl     = document.getElementById(`progressText-${trackId}`);

  btn.disabled = true;
  btn.innerHTML = `<span style="display:inline-block;width:14px;height:14px;border:2px solid rgba(0,0,0,0.3);border-top-color:black;border-radius:50%;animation:spin 0.8s linear infinite;"></span> Downloading...`;

  progressEl.classList.add('visible');
  let progress = 0;
  const fillInterval = setInterval(() => {
    progress = Math.min(progress + Math.random() * 8, 85);
    fillEl.style.width = progress + '%';
    textEl.textContent = `Downloading... ${Math.round(progress)}%`;
  }, 300);

  try {
    const params = new URLSearchParams({ title: track.title, artist: track.artist, spotifyUrl: track.spotifyUrl });
    const response = await fetch(`/api/download/file/${trackId}?${params}`, { credentials: 'include' });

    if (!response.ok) {
      const err = await response.json().catch(() => ({ error: 'Download failed' }));
      throw new Error(err.error || 'Download failed');
    }

    clearInterval(fillInterval);
    fillEl.style.width = '100%';
    textEl.textContent = 'Download complete! ✓';

    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = downloadUrl;
    a.download = `${track.artist} - ${track.title}.mp3`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(downloadUrl);

    addToHistory(track);
    showToast(`✓ "${track.title}" downloaded!`, 'success');

    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">
      <polyline points="20 6 9 17 4 12"/></svg> Done!`;
    btn.style.background = '#1a7a3a';

    setTimeout(() => {
      progressEl.classList.remove('visible');
      fillEl.style.width = '0';
    }, 3000);

  } catch (err) {
    clearInterval(fillInterval);
    progressEl.classList.remove('visible');
    fillEl.style.width = '0';
    showToast(err.message || 'Download failed. Please try again.', 'error');
    btn.disabled = false;
    btn.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" width="16" height="16">
      <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4M7 10l5 5 5-5M12 15V3"/>
    </svg> Download MP3`;
  }
}

// ===== PAGE INIT =====
function initDownloadPage() {
  const fetchBtn = document.getElementById('fetchBtn');
  const urlInput = document.getElementById('spotifyUrl');
  const resultContainer = document.getElementById('trackResult');
  fetchBtn.addEventListener('click', () => fetchTrack(urlInput, resultContainer, fetchBtn));
  urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') fetchTrack(urlInput, resultContainer, fetchBtn); });
}

function initQuickDownload() {
  const fetchBtn = document.getElementById('quickFetchBtn');
  const urlInput = document.getElementById('quickSpotifyUrl');
  const resultContainer = document.getElementById('quickTrackResult');
  fetchBtn.addEventListener('click', () => fetchTrack(urlInput, resultContainer, fetchBtn));
  urlInput.addEventListener('keydown', e => { if (e.key === 'Enter') fetchTrack(urlInput, resultContainer, fetchBtn); });
}

// ===== TOAST =====
function showToast(message, type = 'info') {
  const container = document.getElementById('toastContainer');
  const icons = { success: '✓', error: '✕', info: '♪' };
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="toast-icon">${icons[type] || icons.info}</span><span class="toast-msg">${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.classList.add('removing'); setTimeout(() => toast.remove(), 300); }, 4000);
}

// Expose for inline onclick
window.startDownload = startDownload;
