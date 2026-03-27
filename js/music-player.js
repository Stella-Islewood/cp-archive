/**
 * ========================================
 * CP同人档案馆 - 全局音乐播放器
 * 固定在右下角，支持迷你/展开模式切换
 * 页面跳转时音乐不中断
 * ========================================
 */

(function() {
  'use strict';

  // 歌单数据（预置3首占位歌曲）
  const PLAYLIST = [
    {
      id: 1,
      title: '歌曲标题1',
      artist: '艺术家1',
      src: '',
      duration: '0:00'
    },
    {
      id: 2,
      title: '歌曲标题2',
      artist: '艺术家2',
      src: '',
      duration: '0:00'
    },
    {
      id: 3,
      title: '歌曲标题3',
      artist: '艺术家3',
      src: '',
      duration: '0:00'
    }
  ];

  // sessionStorage 键名
  const SESSION_KEY = 'music-player-state';

  // 播放器状态
  let state = {
    isPlaying: false,
    currentIndex: 0,
    volume: 0.7,
    isExpanded: false
  };

  // 音频元素
  let audio = null;

  // DOM 元素
  let playerContainer = null;
  let miniBtn = null;
  let expandPanel = null;

  /**
   * 初始化播放器
   */
  function init() {
    // 创建播放器 DOM
    createPlayerDOM();
    
    // 恢复播放状态
    restoreState();
    
    // 绑定事件
    bindEvents();
    
    // 监听主题变化
    window.addEventListener('themechange', updateThemeStyles);
    updateThemeStyles();
    
    // 页面卸载前保存状态
    window.addEventListener('beforeunload', saveState);
  }

  /**
   * 创建播放器 DOM 结构
   */
  function createPlayerDOM() {
    // 创建容器
    playerContainer = document.createElement('div');
    playerContainer.id = 'music-player';
    playerContainer.className = 'music-player';
    
    // 迷你模式按钮
    miniBtn = document.createElement('button');
    miniBtn.className = 'player-mini';
    miniBtn.innerHTML = `
      <div class="mini-vinyl ${state.isPlaying ? 'playing' : ''}">
        <div class="vinyl-disc">
          <div class="vinyl-label"></div>
        </div>
      </div>
    `;
    
    // 展开面板
    expandPanel = document.createElement('div');
    expandPanel.className = 'player-expand';
    expandPanel.innerHTML = `
      <div class="player-header">
        <span class="player-title">音乐播放器</span>
        <button class="player-close" aria-label="收起">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
      </div>
      <div class="player-info">
        <div class="track-vinyl ${state.isPlaying ? 'playing' : ''}">
          <div class="vinyl-disc">
            <div class="vinyl-label"></div>
          </div>
        </div>
        <div class="track-details">
          <p class="track-title" id="trackTitle">${PLAYLIST[state.currentIndex].title}</p>
          <p class="track-artist" id="trackArtist">${PLAYLIST[state.currentIndex].artist}</p>
        </div>
      </div>
      <div class="player-progress">
        <div class="progress-bar">
          <div class="progress-fill" id="progressFill"></div>
        </div>
        <div class="progress-time">
          <span id="currentTime">0:00</span>
          <span id="totalTime">${PLAYLIST[state.currentIndex].duration}</span>
        </div>
      </div>
      <div class="player-controls">
        <button class="control-btn" id="prevBtn" aria-label="上一曲">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M6 6h2v12H6zm3.5 6l8.5 6V6z"/>
          </svg>
        </button>
        <button class="control-btn play-btn" id="playBtn" aria-label="播放/暂停">
          <svg class="icon-play" viewBox="0 0 24 24" width="24" height="24" fill="currentColor">
            <path d="M8 5v14l11-7z"/>
          </svg>
          <svg class="icon-pause" viewBox="0 0 24 24" width="24" height="24" fill="currentColor" style="display: none;">
            <path d="M6 19h4V5H6v14zm8-14v14h4V5h-4z"/>
          </svg>
        </button>
        <button class="control-btn" id="nextBtn" aria-label="下一曲">
          <svg viewBox="0 0 24 24" width="20" height="20" fill="currentColor">
            <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z"/>
          </svg>
        </button>
      </div>
      <div class="player-volume">
        <svg viewBox="0 0 24 24" width="18" height="18" fill="currentColor">
          <path d="M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02z"/>
        </svg>
        <input type="range" class="volume-slider" id="volumeSlider" min="0" max="1" step="0.1" value="${state.volume}">
      </div>
      <div class="player-playlist">
        ${PLAYLIST.map((track, index) => `
          <div class="playlist-item ${index === state.currentIndex ? 'active' : ''}" data-index="${index}">
            <span class="playlist-number">${index + 1}</span>
            <span class="playlist-title">${track.title}</span>
            <span class="playlist-status">
              ${index === state.currentIndex && state.isPlaying ? '♪' : ''}
            </span>
          </div>
        `).join('')}
      </div>
    `;
    
    playerContainer.appendChild(miniBtn);
    playerContainer.appendChild(expandPanel);
    
    // 添加到 body
    document.body.appendChild(playerContainer);
    
    // 创建音频元素
    audio = new Audio();
    audio.volume = state.volume;
    
    // 如果有 src 设置音频源
    const currentTrack = PLAYLIST[state.currentIndex];
    if (currentTrack.src) {
      audio.src = currentTrack.src;
    }
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    // 迷你按钮点击 - 展开
    miniBtn.addEventListener('click', toggleExpand);
    
    // 关闭按钮 - 收起
    const closeBtn = expandPanel.querySelector('.player-close');
    closeBtn.addEventListener('click', toggleExpand);
    
    // 播放/暂停
    const playBtn = expandPanel.querySelector('#playBtn');
    playBtn.addEventListener('click', togglePlay);
    
    // 上一曲
    const prevBtn = expandPanel.querySelector('#prevBtn');
    prevBtn.addEventListener('click', playPrev);
    
    // 下一曲
    const nextBtn = expandPanel.querySelector('#nextBtn');
    nextBtn.addEventListener('click', playNext);
    
    // 音量控制
    const volumeSlider = expandPanel.querySelector('#volumeSlider');
    volumeSlider.addEventListener('input', handleVolumeChange);
    
    // 播放列表点击
    const playlistItems = expandPanel.querySelectorAll('.playlist-item');
    playlistItems.forEach(item => {
      item.addEventListener('click', () => {
        const index = parseInt(item.dataset.index);
        playTrack(index);
      });
    });
    
    // 音频事件
    audio.addEventListener('timeupdate', updateProgress);
    audio.addEventListener('ended', playNext);
    audio.addEventListener('loadedmetadata', updateDuration);
    
    // 点击播放器外部关闭
    document.addEventListener('click', (e) => {
      if (state.isExpanded && 
          !playerContainer.contains(e.target)) {
        toggleExpand();
      }
    });
  }

  /**
   * 展开/收起播放器
   */
  function toggleExpand() {
    state.isExpanded = !state.isExpanded;
    playerContainer.classList.toggle('expanded', state.isExpanded);
    saveState();
  }

  /**
   * 播放/暂停切换
   */
  function togglePlay() {
    const currentTrack = PLAYLIST[state.currentIndex];
    
    if (!currentTrack.src) {
      // 没有音频源，显示提示
      return;
    }
    
    if (state.isPlaying) {
      audio.pause();
    } else {
      audio.play();
    }
    
    state.isPlaying = !state.isPlaying;
    updatePlayState();
    saveState();
  }

  /**
   * 播放指定曲目
   * @param {number} index - 曲目索引
   */
  function playTrack(index) {
    if (index < 0 || index >= PLAYLIST.length) return;
    
    state.currentIndex = index;
    const track = PLAYLIST[index];
    
    // 更新显示
    updateTrackDisplay();
    updatePlaylistHighlight();
    
    // 如果有音频源则播放
    if (track.src) {
      audio.src = track.src;
      audio.play();
      state.isPlaying = true;
    } else {
      state.isPlaying = false;
    }
    
    updatePlayState();
    saveState();
  }

  /**
   * 上一曲
   */
  function playPrev() {
    let newIndex = state.currentIndex - 1;
    if (newIndex < 0) {
      newIndex = PLAYLIST.length - 1;
    }
    playTrack(newIndex);
  }

  /**
   * 下一曲
   */
  function playNext() {
    let newIndex = state.currentIndex + 1;
    if (newIndex >= PLAYLIST.length) {
      newIndex = 0;
    }
    playTrack(newIndex);
  }

  /**
   * 音量控制
   * @param {Event} e
   */
  function handleVolumeChange(e) {
    state.volume = parseFloat(e.target.value);
    audio.volume = state.volume;
    saveState();
  }

  /**
   * 更新播放状态显示
   */
  function updatePlayState() {
    const playIcon = expandPanel.querySelector('.icon-play');
    const pauseIcon = expandPanel.querySelector('.icon-pause');
    const miniVinyl = miniBtn.querySelector('.mini-vinyl');
    const trackVinyl = expandPanel.querySelector('.track-vinyl');
    
    if (state.isPlaying) {
      playIcon.style.display = 'none';
      pauseIcon.style.display = 'block';
      miniVinyl.classList.add('playing');
      trackVinyl.classList.add('playing');
    } else {
      playIcon.style.display = 'block';
      pauseIcon.style.display = 'none';
      miniVinyl.classList.remove('playing');
      trackVinyl.classList.remove('playing');
    }
    
    updatePlaylistStatus();
  }

  /**
   * 更新曲目显示
   */
  function updateTrackDisplay() {
    const track = PLAYLIST[state.currentIndex];
    const titleEl = expandPanel.querySelector('#trackTitle');
    const artistEl = expandPanel.querySelector('#trackArtist');
    const timeEl = expandPanel.querySelector('#totalTime');
    
    titleEl.textContent = track.title;
    artistEl.textContent = track.artist;
    timeEl.textContent = track.duration || '0:00';
  }

  /**
   * 更新播放列表高亮
   */
  function updatePlaylistHighlight() {
    const items = expandPanel.querySelectorAll('.playlist-item');
    items.forEach((item, index) => {
      item.classList.toggle('active', index === state.currentIndex);
    });
    updatePlaylistStatus();
  }

  /**
   * 更新播放列表播放状态
   */
  function updatePlaylistStatus() {
    const items = expandPanel.querySelectorAll('.playlist-item');
    items.forEach((item, index) => {
      const status = item.querySelector('.playlist-status');
      if (index === state.currentIndex && state.isPlaying) {
        status.textContent = '♪';
      } else {
        status.textContent = '';
      }
    });
  }

  /**
   * 更新进度条
   */
  function updateProgress() {
    if (audio.duration) {
      const progress = (audio.currentTime / audio.duration) * 100;
      const progressFill = expandPanel.querySelector('#progressFill');
      const currentTimeEl = expandPanel.querySelector('#currentTime');
      
      progressFill.style.width = `${progress}%`;
      currentTimeEl.textContent = formatTime(audio.currentTime);
    }
  }

  /**
   * 更新时长显示
   */
  function updateDuration() {
    const totalTimeEl = expandPanel.querySelector('#totalTime');
    totalTimeEl.textContent = formatTime(audio.duration);
    PLAYLIST[state.currentIndex].duration = formatTime(audio.duration);
  }

  /**
   * 格式化时间
   * @param {number} seconds
   * @returns {string}
   */
  function formatTime(seconds) {
    if (isNaN(seconds)) return '0:00';
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  }

  /**
   * 更新主题样式
   */
  function updateThemeStyles() {
    const theme = document.documentElement.getAttribute('data-theme');
    if (theme === 'lucasmia') {
      playerContainer.classList.add('theme-lucasmia');
    } else {
      playerContainer.classList.remove('theme-lucasmia');
    }
  }

  /**
   * 保存状态到 sessionStorage
   */
  function saveState() {
    try {
      const sessionData = {
        isPlaying: state.isPlaying,
        currentIndex: state.currentIndex,
        volume: state.volume,
        isExpanded: state.isExpanded,
        currentTime: audio ? audio.currentTime : 0
      };
      sessionStorage.setItem(SESSION_KEY, JSON.stringify(sessionData));
    } catch (e) {
      console.warn('无法保存播放器状态');
    }
  }

  /**
   * 从 sessionStorage 恢复状态
   */
  function restoreState() {
    try {
      const saved = sessionStorage.getItem(SESSION_KEY);
      if (saved) {
        const sessionData = JSON.parse(saved);
        state.isPlaying = sessionData.isPlaying || false;
        state.currentIndex = sessionData.currentIndex || 0;
        state.volume = sessionData.volume !== undefined ? sessionData.volume : 0.7;
        state.isExpanded = sessionData.isExpanded || false;
        
        // 恢复播放进度
        if (sessionData.currentTime && audio) {
          audio.currentTime = sessionData.currentTime;
        }
        
        // 更新 UI
        if (state.isExpanded) {
          playerContainer.classList.add('expanded');
        }
        
        updateTrackDisplay();
        updatePlaylistHighlight();
        updatePlayState();
      }
    } catch (e) {
      console.warn('无法恢复播放器状态');
    }
  }

  // 页面加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

  // 添加 CSS（通过 JavaScript 注入）
  const style = document.createElement('style');
  style.textContent = `
    /* ========================================
       全局音乐播放器样式
       ======================================== */
    .music-player {
      position: fixed;
      bottom: 2rem;
      right: 5rem;
      z-index: 999;
      font-family: inherit;
    }

    /* 迷你模式 */
    .player-mini {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      overflow: hidden;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
    }

    .player-mini:hover {
      transform: scale(1.05);
      box-shadow: 0 6px 20px rgba(0, 0, 0, 0.2);
    }

    .mini-vinyl {
      width: 40px;
      height: 40px;
    }

    .vinyl-disc {
      width: 100%;
      height: 100%;
      border-radius: 50%;
      background: 
        repeating-radial-gradient(
          circle at center,
          transparent 0px,
          transparent 2px,
          rgba(0, 0, 0, 0.05) 2px,
          rgba(0, 0, 0, 0.05) 4px
        ),
        linear-gradient(135deg, #1a1a1a 0%, #333 50%, #1a1a1a 100%);
      position: relative;
      animation: none;
    }

    .mini-vinyl.playing .vinyl-disc {
      animation: vinylSpin 3s linear infinite;
    }

    @keyframes vinylSpin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }

    .vinyl-label {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 14px;
      height: 14px;
      border-radius: 50%;
      background: linear-gradient(135deg, var(--accent) 0%, var(--accent-hover, var(--accent)) 100%);
    }

    /* 展开面板 */
    .player-expand {
      position: absolute;
      bottom: 70px;
      right: 0;
      width: 300px;
      background: var(--card-bg);
      border: 1px solid var(--border-color);
      border-radius: 12px;
      box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
      opacity: 0;
      visibility: hidden;
      transform: translateY(10px);
      transition: all 0.3s ease;
      overflow: hidden;
    }

    .music-player.expanded .player-expand {
      opacity: 1;
      visibility: visible;
      transform: translateY(0);
    }

    .player-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.8rem 1rem;
      border-bottom: 1px solid var(--border-color);
    }

    .player-title {
      font-size: 0.85rem;
      color: var(--text-muted);
      letter-spacing: 0.05em;
    }

    .player-close {
      background: none;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.3rem;
      border-radius: 4px;
      transition: all 0.2s ease;
    }

    .player-close:hover {
      background: var(--bg-secondary);
      color: var(--text-primary);
    }

    .player-info {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
    }

    .track-vinyl {
      width: 60px;
      height: 60px;
      flex-shrink: 0;
    }

    .track-vinyl .vinyl-disc {
      animation: none;
    }

    .track-vinyl.playing .vinyl-disc {
      animation: vinylSpin 3s linear infinite;
    }

    .track-details {
      flex: 1;
      min-width: 0;
    }

    .track-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--text-title);
      margin-bottom: 0.3rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .track-artist {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    /* 进度条 */
    .player-progress {
      padding: 0 1rem;
    }

    .progress-bar {
      height: 4px;
      background: var(--bg-secondary);
      border-radius: 2px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: var(--accent);
      width: 0%;
      transition: width 0.1s linear;
    }

    .progress-time {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--text-muted);
      margin-top: 0.3rem;
    }

    /* 控制按钮 */
    .player-controls {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 1.5rem;
      padding: 1rem;
    }

    .control-btn {
      background: none;
      border: none;
      color: var(--text-primary);
      cursor: pointer;
      padding: 0.5rem;
      border-radius: 50%;
      transition: all 0.2s ease;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .control-btn:hover {
      color: var(--accent);
      background: var(--bg-secondary);
    }

    .play-btn {
      width: 48px;
      height: 48px;
      background: var(--accent);
      color: var(--btn-text);
    }

    .play-btn:hover {
      background: var(--accent);
      color: var(--btn-text);
      transform: scale(1.05);
    }

    /* 音量控制 */
    .player-volume {
      display: flex;
      align-items: center;
      gap: 0.8rem;
      padding: 0.5rem 1rem 1rem;
      color: var(--text-muted);
    }

    .volume-slider {
      flex: 1;
      height: 4px;
      -webkit-appearance: none;
      appearance: none;
      background: var(--bg-secondary);
      border-radius: 2px;
      cursor: pointer;
    }

    .volume-slider::-webkit-slider-thumb {
      -webkit-appearance: none;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--accent);
      cursor: pointer;
    }

    .volume-slider::-moz-range-thumb {
      width: 12px;
      height: 12px;
      border-radius: 50%;
      background: var(--accent);
      border: none;
      cursor: pointer;
    }

    /* 播放列表 */
    .player-playlist {
      border-top: 1px solid var(--border-color);
      max-height: 200px;
      overflow-y: auto;
    }

    .playlist-item {
      display: flex;
      align-items: center;
      padding: 0.6rem 1rem;
      cursor: pointer;
      transition: background 0.2s ease;
    }

    .playlist-item:hover {
      background: var(--bg-secondary);
    }

    .playlist-item.active {
      background: var(--accent-glow);
    }

    .playlist-number {
      width: 20px;
      font-size: 0.8rem;
      color: var(--text-muted);
    }

    .playlist-title {
      flex: 1;
      font-size: 0.85rem;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .playlist-item.active .playlist-title {
      color: var(--accent);
    }

    .playlist-status {
      width: 20px;
      font-size: 0.8rem;
      color: var(--accent);
    }

    /* LucasMia 主题 */
    .music-player.theme-lucasmia .vinyl-label {
      background: linear-gradient(135deg, #D4789A 0%, #E088AA 100%);
    }

    .music-player.theme-lucasmia .play-btn {
      background: #D4789A;
    }

    .music-player.theme-lucasmia .play-btn:hover {
      background: #E088AA;
    }

    .music-player.theme-lucasmia .progress-fill,
    .music-player.theme-lucasmia .volume-slider::-webkit-slider-thumb,
    .music-player.theme-lucasmia .volume-slider::-moz-range-thumb {
      background: #D4789A;
    }

    /* 响应式 */
    @media (max-width: 768px) {
      .music-player {
        bottom: 1.5rem;
        right: 1.5rem;
      }

      .player-expand {
        width: 280px;
        right: -10px;
      }
    }
  `;
  document.head.appendChild(style);

  // 导出全局 API
  window.MusicPlayer = {
    toggle: togglePlay,
    play: () => playTrack(state.currentIndex),
    pause: () => {
      audio.pause();
      state.isPlaying = false;
      updatePlayState();
    },
    next: playNext,
    prev: playPrev,
    getState: () => ({ ...state })
  };

})();
