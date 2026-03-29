/**
 * ========================================
 * CP同人档案馆 - 作品页面脚本
 * 从 Supabase 读取数据
 * ========================================
 */

(function() {
  'use strict';

  // Supabase 配置（由 works.html 在 head 中初始化为 window.dbClient）

  // localStorage 键名
  const FAVORITES_KEY = 'works-favorites';
  const COMMENTS_KEY = 'works-comments';

  // 缓存的作品数据
  let cachedWorks = [];
  let displayedWorks = [];

  // 当前打开的详情作品 ID
  let currentWorkId = null;

  /**
   * 初始化作品页面
   */
  function init() {
    loadWorksFromSupabase();
    bindEvents();
    bindBackToTop();

    // 检查是否需要滚动到评论区
    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('comments') && urlParams.get('work')) {
      openWorkDetail(urlParams.get('work'));
      setTimeout(() => {
        const section = document.getElementById('detailComments');
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 400);
    }
  }

  /**
   * 从 Supabase 加载作品数据
   */
  async function loadWorksFromSupabase() {
    const grid = document.getElementById('worksGrid');
    if (!grid) return;

    try {
      const theme = localStorage.getItem('cp-archive-theme') || 'lionmio';

      const { data, error } = await window.dbClient
        .from('works')
        .select('*')
        .eq('archive_id', theme)
        .order('created_at', { ascending: false });

      if (error) throw error;

      cachedWorks = data || [];
      displayedWorks = [...cachedWorks];
      // 清空搜索框
      const searchInput = document.getElementById('worksSearch');
      if (searchInput) searchInput.value = '';
      renderWorks();
    } catch (error) {
      console.error('加载作品失败:', error);
      cachedWorks = [];
      displayedWorks = [];
      renderWorks();
    }
  }

  /**
   * 判断内容来源平台
   */
  function getMediaPlatform(url) {
    if (!url) return null;
    const u = url.toLowerCase();
    if (u.includes('music.163.com') || u.includes('y.music.163.com') || u.includes('music.iqiyi.com') || u.includes('y.qq.com')) return 'music';
    if (u.includes('bilibili.com') || u.includes('b23.tv')) return 'bilibili';
    if (u.includes('youtube.com') || u.includes('youtu.be')) return 'youtube';
    return null;
  }

  /**
   * 判断是否是图片 URL
   */
  function isImageUrl(str) {
    if (!str) return false;
    return /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(str);
  }

  /**
   * 判断是否是外部链接
   */
  function isExternalLink(str) {
    if (!str) return false;
    try {
      const url = new URL(str);
      return url.protocol === 'http:' || url.protocol === 'https:';
    } catch {
      return false;
    }
  }

  /**
   * 构建卡片主体（按类型）
   */
  function buildCardBody(item) {
    const type = item.type;
    const img = item.image_url;
    const content = (item.content || '').trim();

    // 图片创作：有 image_url 直接显示图片
    if (type === '图片') {
      if (img && isImageUrl(img)) {
        return `<div class="work-card-body work-card-body-image">
          <img src="${escapeHtml(img)}" alt="${escapeHtml(item.title)}" class="card-body-img" loading="lazy">
        </div>`;
      }
      return buildCardBodyDefault(item);
    }

    // 玩偶 / 游戏：有图片显示图片，没有显示图标
    if (type === '玩偶' || type === '游戏') {
      if (img && isImageUrl(img)) {
        return `<div class="work-card-body work-card-body-image">
          <img src="${escapeHtml(img)}" alt="${escapeHtml(item.title)}" class="card-body-img" loading="lazy">
        </div>`;
      }
      return buildCardBodyDefault(item);
    }

    // 音乐创作：音符 emoji + 歌曲信息 + 收听按钮
    if (type === '音乐') {
      const mediaUrl = img || content;
      const hasLink = isExternalLink(mediaUrl);
      return `
        <div class="work-card-body work-card-body-music">
          <span class="music-emoji">🎵</span>
          <div class="music-info">
            <span class="music-song">${escapeHtml(item.title)}</span>
            <span class="music-author">${escapeHtml(item.author || '')}</span>
          </div>
          ${hasLink ? `<a href="${escapeHtml(mediaUrl)}" target="_blank" rel="noopener noreferrer" class="music-link-btn">🎵 点击收听</a>` : ''}
        </div>`;
    }

    // 视频创作：emoji + 视频信息 + 观看按钮
    if (type === '视频') {
      const mediaUrl = img || content;
      const hasLink = isExternalLink(mediaUrl);
      return `
        <div class="work-card-body work-card-body-video">
          <span class="video-emoji">🎬</span>
          <div class="video-info">
            <span class="video-title">${escapeHtml(item.title)}</span>
            <span class="video-author">${escapeHtml(item.author || '')}</span>
          </div>
          ${hasLink ? `<a href="${escapeHtml(mediaUrl)}" target="_blank" rel="noopener noreferrer" class="video-link-btn">▶ 点击观看</a>` : ''}
        </div>`;
    }

    // 默认：显示封面占位图
    return buildCardBodyDefault(item);
  }

  /**
   * 构建默认封面占位图（用于图片/玩偶/游戏/未知类型）
   */
  function buildCardBodyDefault(item) {
    const typeClass = getTypeClass(item.type);
    return `
      <div class="work-card-body work-card-body-default">
        <div class="cover-placeholder ${typeClass}-cover">
          ${getCoverSVG(item.type)}
        </div>
      </div>`;
  }

  /**
   * 构建文字卡片主体（纯文字，无封面）
   */
  function buildTextCardBody(item) {
    const content = (item.content || '').trim();
    const previewLength = 150;
    const isLong = content.length > previewLength;
    const preview = content.substring(0, previewLength);
    const escaped = escapeHtml(content);
    const escapedPreview = escapeHtml(preview);

    return `
      <div class="work-card-body work-card-body-text">
        <span class="text-card-tag">${escapeHtml(item.type)}</span>
        <h3 class="text-card-title">${escapeHtml(item.title)}</h3>
        <p class="text-card-author">${escapeHtml(item.author || '未知作者')}</p>
        <p class="text-card-preview">${escapedPreview}${isLong ? '…' : ''}</p>
        ${isLong ? '<button class="text-readmore-btn" type="button">阅读更多 ▾</button>' : ''}
      </div>`;
  }

  /**
   * 渲染作品卡片
   */
  function renderWorks() {
    const grid = document.getElementById('worksGrid');
    if (!grid) return;

    const favorites = getFavorites();
    const commentCounts = {};
    displayedWorks.forEach(w => {
      commentCounts[w.id] = getComments(w.id).length;
    });

    if (displayedWorks.length === 0) {
      const query = document.getElementById('worksSearch').value.trim();
      if (query) {
        grid.innerHTML = '<p class="search-no-results">没有找到相关内容</p>';
      } else {
        grid.innerHTML = '<p style="text-align:center;color:#888;padding:40px;grid-column:1/-1;">暂无作品数据</p>';
      }
      return;
    }

    grid.innerHTML = displayedWorks.map((item) => {
      const typeClass = getTypeClass(item.type);
      const isFav = favorites.includes(item.id);
      const commentCount = commentCounts[item.id] || 0;
      const isText = item.type === '文字';

      // 卡片主体
      const body = isText
        ? buildTextCardBody(item)
        : buildCardBody(item);

      if (isText) {
        // 文字卡片：自带所有信息（标签/标题/作者/预览），底部放操作按钮
        return `
          <article class="work-card work-card-text" data-category="${typeClass}" data-work-id="${item.id}">
            <div class="favorite-badge ${isFav ? 'show' : ''}" style="${isFav ? '' : 'display:none'}">❤</div>
            ${body}
            <div class="work-actions">
              <button class="btn-action btn-favorite" data-work-id="${item.id}">
                <span class="action-icon favorite-icon">${isFav ? '❤' : '♡'}</span>
                <span class="action-count favorite-count">${isFav ? '1' : '0'}</span>
              </button>
              <button class="btn-action btn-comment" data-work-id="${item.id}" data-scroll-to-comments="true">
                <span class="action-icon">💬</span>
                <span class="action-count comment-count">${commentCount}</span>
              </button>
            </div>
          </article>
        `;
      }

      // 其他卡片：保留原有 info 区结构
      return `
        <article class="work-card ${isText ? 'work-card-text' : ''}" data-category="${typeClass}" data-work-id="${item.id}">
          <div class="favorite-badge ${isFav ? 'show' : ''}" style="${isFav ? '' : 'display:none'}">❤</div>
          ${body}
          <div class="work-info">
            <h3 class="work-title">${escapeHtml(item.title)}</h3>
            <p class="work-author">${escapeHtml(item.author || '未知作者')}</p>
            <span class="work-tag">${escapeHtml(item.type)}</span>
          </div>
          <div class="work-actions">
            <button class="btn-action btn-favorite" data-work-id="${item.id}">
              <span class="action-icon favorite-icon">${isFav ? '❤' : '♡'}</span>
              <span class="action-count favorite-count">${isFav ? '1' : '0'}</span>
            </button>
            <button class="btn-action btn-comment" data-work-id="${item.id}" data-scroll-to-comments="true">
              <span class="action-icon">💬</span>
              <span class="action-count comment-count">${commentCount}</span>
            </button>
          </div>
        </article>
      `;
    }).join('');
  }

  /**
   * 获取类型对应的 CSS 类
   */
  function getTypeClass(type) {
    const map = {
      '文字': 'text',
      '图片': 'image',
      '音乐': 'music',
      '视频': 'video',
      '玩偶': 'doll',
      '游戏': 'game'
    };
    return map[type] || 'image';
  }

  /**
   * 获取封面 SVG
   */
  function getCoverSVG(type) {
    switch(type) {
      case '音乐':
        return `<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>`;
      case '文字':
        return `<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          <line x1="8" y1="7" x2="16" y2="7"/>
          <line x1="8" y1="11" x2="14" y2="11"/>
        </svg>`;
      case '视频':
        return `<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>`;
      case '玩偶':
        return `<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1">
          <circle cx="12" cy="8" r="5"/>
          <path d="M3 21v-2a7 7 0 0 1 7-7h4a7 7 0 0 1 7 7v2"/>
        </svg>`;
      case '游戏':
        return `<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1">
          <rect x="2" y="6" width="20" height="12" rx="2"/>
          <path d="M6 12h4M8 10v4"/>
          <circle cx="16" cy="11" r="1"/>
          <circle cx="18" cy="13" r="1"/>
        </svg>`;
      default:
        return `<svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="M21 15l-5-5L5 21"/>
        </svg>`;
    }
  }

  /**
   * 绑定事件（全部使用事件委托）
   */
  function bindEvents() {
    // ========== 搜索功能 ==========
    const searchInput = document.getElementById('worksSearch');
    if (searchInput) {
      searchInput.addEventListener('input', function() {
        applyFilters();
      });
    }

    const grid = document.getElementById('worksGrid');

    // ========== 文字卡片：阅读器弹窗 ==========
    grid.addEventListener('click', function(e) {
      // 阅读更多按钮
      const readmoreBtn = e.target.closest('.text-readmore-btn');
      if (readmoreBtn) {
        e.stopPropagation();
        const card = readmoreBtn.closest('.work-card');
        if (card) openTextReader(card.dataset.workId);
        return;
      }

      // 文字卡片整体点击（不在按钮/标签上）→ 展开阅读器
      const textBody = e.target.closest('.work-card-body-text');
      if (textBody) {
        e.stopPropagation();
        const card = textBody.closest('.work-card');
        if (card) openTextReader(card.dataset.workId);
        return;
      }
    });

    // ========== 卡片主体点击：图片/视频/音乐卡片 → 进入详情 ==========
    grid.addEventListener('click', function(e) {
      const cardBody = e.target.closest('.work-card-body');
      if (!cardBody) return;
      // 忽略链接、按钮、视频
      if (e.target.closest('a, button, video')) return;
      const card = cardBody.closest('.work-card');
      if (!card) return;
      // 文字卡片走阅读器
      if (card.classList.contains('work-card-text')) return;
      openWorkDetail(card.dataset.workId);
    });

    // 收藏按钮
    grid.addEventListener('click', function(e) {
      const btn = e.target.closest('.btn-favorite');
      if (!btn) return;
      e.stopPropagation();
      toggleFavorite(btn.dataset.workId);
    });

    // 评论按钮
    grid.addEventListener('click', function(e) {
      const btn = e.target.closest('.btn-comment');
      if (!btn) return;
      e.stopPropagation();
      openWorkDetail(btn.dataset.workId);
      setTimeout(() => {
        const section = document.getElementById('detailComments');
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 400);
    });

    // Tab 切换
    document.querySelectorAll('.works-tabs .tab-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const category = this.dataset.category;
        filterWorks(category);
        document.querySelectorAll('.works-tabs .tab-btn').forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        this.classList.add('active');
        this.setAttribute('aria-selected', 'true');
      });
    });

    // 布局切换
    document.querySelectorAll('.layout-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const worksGrid = document.getElementById('worksGrid');
        worksGrid.classList.remove('masonry', 'grid');
        worksGrid.classList.add(this.dataset.layout);
        document.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
      });
    });

    // 返回按钮
    const backBtn = document.getElementById('btnBack');
    if (backBtn) backBtn.addEventListener('click', closeWorkDetail);

    // 悬浮沉浸阅读按钮
    const floatBtn = document.getElementById('immersiveFloatBtn');
    if (floatBtn) {
      // 初始隐藏
      floatBtn.style.display = 'none';
      floatBtn.addEventListener('click', function() {
        if (currentTextReaderWorkId) {
          openImmersiveMode(currentTextReaderWorkId);
        }
      });
    }

    // 详情页收藏按钮
    const detailFavBtn = document.getElementById('btnDetailFavorite');
    if (detailFavBtn) {
      detailFavBtn.addEventListener('click', function() {
        if (currentWorkId) {
          toggleFavorite(currentWorkId);
          updateDetailFavoriteButton();
        }
      });
    }

    // 留言表单提交
    const commentsForm = document.getElementById('commentsForm');
    if (commentsForm) commentsForm.addEventListener('submit', submitComment);
  }

  // ========== 文字阅读器 ==========

  /**
   * 打开文字阅读器弹窗
   */
  function openTextReader(workId) {
    const work = cachedWorks.find(w => w.id === workId);
    if (!work) return;

    currentTextReaderWorkId = workId;

    const overlay = document.getElementById('textReaderOverlay');
    const content = work.content || '';

    document.getElementById('readerTag').textContent = work.type || '';
    document.getElementById('readerTitle').textContent = work.title || '无标题';
    document.getElementById('readerAuthor').textContent = work.author ? `文 / ${work.author}` : '未知作者';
    document.getElementById('readerContent').innerHTML = formatTextContent(content);

    // 收藏状态
    const isFav = getFavorites().includes(workId);
    const favBtn = document.getElementById('readerFavoriteBtn');
    const favIcon = favBtn.querySelector('.reader-fav-icon');
    favBtn.classList.toggle('liked', isFav);
    if (favIcon) favIcon.textContent = isFav ? '❤' : '♡';

    // 事件绑定（一次性）
    const newFavBtn = favBtn.cloneNode(true);
    favBtn.parentNode.replaceChild(newFavBtn, favBtn);
    newFavBtn.addEventListener('click', function() {
      toggleFavorite(workId);
      const nowFav = getFavorites().includes(workId);
      newFavBtn.classList.toggle('liked', nowFav);
      const icon = newFavBtn.querySelector('.reader-fav-icon');
      if (icon) icon.textContent = nowFav ? '❤' : '♡';
      // 同步更新卡片上的收藏按钮
      syncFavoriteButton(workId, nowFav);
    });

    const newCommentBtn = document.getElementById('readerCommentBtn').cloneNode(true);
    document.getElementById('readerCommentBtn').parentNode.replaceChild(newCommentBtn, document.getElementById('readerCommentBtn'));
    newCommentBtn.addEventListener('click', function() {
      closeTextReader();
      openWorkDetail(workId);
      setTimeout(() => {
        const section = document.getElementById('detailComments');
        if (section) section.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 300);
    });

    // 关闭按钮
    const closeBtn = document.getElementById('readerClose');
    const newCloseBtn = closeBtn.cloneNode(true);
    closeBtn.parentNode.replaceChild(newCloseBtn, closeBtn);
    newCloseBtn.addEventListener('click', closeTextReader);

    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeTextReader();
    });

    overlay.classList.add('show');
    document.body.style.overflow = 'hidden';

    // 显示悬浮沉浸阅读按钮
    const floatBtn = document.getElementById('immersiveFloatBtn');
    if (floatBtn) {
      floatBtn.style.display = 'flex';
      floatBtn.classList.remove('exit-mode');
    }

    // 打开后滚动到顶部
    setTimeout(() => {
      const modal = document.getElementById('textReaderModal');
      if (modal) modal.scrollTop = 0;
    }, 50);
  }

  /**
   * 关闭文字阅读器弹窗
   */
  function closeTextReader() {
    const overlay = document.getElementById('textReaderOverlay');
    overlay.classList.remove('show');
    // 沉浸模式打开时不能清 overflow
    if (!document.getElementById('immersiveOverlay').classList.contains('show')) {
      document.body.style.overflow = '';
    }
    currentTextReaderWorkId = null;
    // 隐藏悬浮按钮
    const floatBtn = document.getElementById('immersiveFloatBtn');
    if (floatBtn) floatBtn.style.display = 'none';
  }

  /**
   * 将纯文本内容格式化为适合阅读的 HTML（分段）
   */
  function formatTextContent(text) {
    if (!text) return '<p style="color:#888;text-align:center;">暂无内容</p>';
    const escaped = escapeHtml(text);
    const paragraphs = escaped.split(/\n{2,}/);
    return paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
  }

  /**
   * 同步收藏按钮状态到卡片
   */
  function syncFavoriteButton(workId, isFav) {
    const card = document.querySelector(`.work-card[data-work-id="${workId}"]`);
    if (!card) return;
    const btn = card.querySelector('.btn-favorite');
    const icon = btn.querySelector('.favorite-icon');
    const count = btn.querySelector('.favorite-count');
    const badge = card.querySelector('.favorite-badge');

    btn.classList.toggle('liked', isFav);
    if (icon) icon.textContent = isFav ? '❤' : '♡';
    if (count) count.textContent = isFav ? '1' : '0';
    if (badge) {
      badge.style.display = isFav ? '' : 'none';
      badge.classList.toggle('show', isFav);
    }
  }

  // 监听 ESC 关闭阅读器
  document.addEventListener('keydown', function(e) {
    if (e.key === 'Escape') {
      if (document.getElementById('immersiveOverlay') && document.getElementById('immersiveOverlay').classList.contains('show')) {
        closeImmersiveMode();
      } else {
        closeTextReader();
      }
    }
  });

  // ========== 沉浸阅读模式 ==========

  let immersiveScrollHandler = null;
  let immersiveMouseHandler = null;
  let immersiveToolbarTimer = null;
  let currentImmersiveWorkId = null;
  let currentTextReaderWorkId = null;
  let immersiveSavedScrollTop = null;

  /**
   * 打开沉浸阅读模式
   */
  function openImmersiveMode(workId) {
    const work = cachedWorks.find(w => w.id === workId);
    if (!work) return;

    currentImmersiveWorkId = workId;
    const overlay = document.getElementById('immersiveOverlay');
    const contentWrap = document.getElementById('immersiveContentWrap');

    // 填充内容
    document.getElementById('immersiveTag').textContent = work.type || '';
    document.getElementById('immersiveTitle').textContent = work.title || '无标题';
    document.getElementById('immersiveAuthor').textContent = work.author ? `文 / ${work.author}` : '';
    document.getElementById('immersiveTitlePreview').textContent = work.title || '';
    document.getElementById('immersiveText').innerHTML = formatTextContent(work.content || '');

    // 重置状态
    resetImmersiveState();

    // 显示
    overlay.classList.add('show', 'bg-light');
    overlay.classList.remove('bg-cream', 'bg-dark');
    document.getElementById('immersiveToolbar').className = 'immersive-toolbar light';
    document.getElementById('immersiveText').className = 'immersive-text size-medium';
    document.getElementById('immersiveProgress').style.width = '0%';

    // 隐藏工具栏
    document.getElementById('immersiveToolbar').classList.add('hidden');

    // 隐藏悬浮按钮
    const floatBtn = document.getElementById('immersiveFloatBtn');
    if (floatBtn) floatBtn.style.display = 'none';

    // 保存文字阅读器滚动位置，隐藏它
    const textOverlay = document.getElementById('textReaderOverlay');
    immersiveSavedScrollTop = textOverlay.scrollTop;
    textOverlay.classList.remove('show');

    document.body.style.overflow = 'hidden';

    // 滚动到顶部
    contentWrap.scrollTop = 0;

    // 绑定事件
    bindImmersiveEvents();
  }

  /**
   * 重置沉浸模式状态
   */
  function resetImmersiveState() {
    document.querySelectorAll('.immersive-size-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.immersive-size-btn[data-size="medium"]').classList.add('active');
    document.querySelectorAll('.immersive-bg-btn').forEach(b => b.classList.remove('active'));
    document.querySelector('.immersive-bg-btn[data-bg="light"]').classList.add('active');
  }

  /**
   * 关闭沉浸阅读模式
   */
  function closeImmersiveMode() {
    const overlay = document.getElementById('immersiveOverlay');
    overlay.classList.remove('show');

    // 移除滚动监听
    if (immersiveScrollHandler) {
      const contentWrap = document.getElementById('immersiveContentWrap');
      if (contentWrap) contentWrap.removeEventListener('scroll', immersiveScrollHandler);
      immersiveScrollHandler = null;
    }
    // 移除鼠标移动监听
    if (immersiveMouseHandler) {
      overlay.removeEventListener('mousemove', immersiveMouseHandler);
      immersiveMouseHandler = null;
    }
    if (immersiveToolbarTimer) {
      clearTimeout(immersiveToolbarTimer);
      immersiveToolbarTimer = null;
    }

    // 恢复悬浮按钮
    const floatBtn = document.getElementById('immersiveFloatBtn');
    if (floatBtn && currentTextReaderWorkId) {
      floatBtn.style.display = 'flex';
    }

    // 恢复文字阅读器
    const textOverlay = document.getElementById('textReaderOverlay');
    textOverlay.classList.add('show');
    if (immersiveSavedScrollTop !== null) {
      textOverlay.scrollTop = immersiveSavedScrollTop;
      immersiveSavedScrollTop = null;
    }

    currentImmersiveWorkId = null;
  }

  /**
   * 绑定沉浸模式事件
   */
  function bindImmersiveEvents() {
    const overlay = document.getElementById('immersiveOverlay');
    const toolbar = document.getElementById('immersiveToolbar');
    const contentWrap = document.getElementById('immersiveContentWrap');

    // 退出按钮
    const closeBtn = document.getElementById('immersiveClose');
    if (closeBtn) {
      const newBtn = closeBtn.cloneNode(true);
      closeBtn.parentNode.replaceChild(newBtn, closeBtn);
      newBtn.addEventListener('click', closeImmersiveMode);
    }

    // 点击遮罩退出
    overlay.addEventListener('click', function(e) {
      if (e.target === overlay) closeImmersiveMode();
    });

    // 滚动 → 进度条 + 自动隐藏工具栏
    if (immersiveScrollHandler) {
      contentWrap.removeEventListener('scroll', immersiveScrollHandler);
    }
    immersiveScrollHandler = function() {
      const el = document.getElementById('immersiveContent');
      const wrap = document.getElementById('immersiveContentWrap');
      if (!el || !wrap) return;

      const scrollTop = wrap.scrollTop;
      const scrollHeight = el.offsetHeight - wrap.clientHeight;
      const progress = scrollHeight > 0 ? (scrollTop / scrollHeight) * 100 : 100;
      document.getElementById('immersiveProgress').style.width = Math.min(progress, 100) + '%';

      // 显示工具栏
      toolbar.classList.remove('hidden');
      if (immersiveToolbarTimer) clearTimeout(immersiveToolbarTimer);
      immersiveToolbarTimer = setTimeout(() => {
        toolbar.classList.add('hidden');
      }, 2000);
    };
    contentWrap.addEventListener('scroll', immersiveScrollHandler);

    // 鼠标移动 → 显示工具栏
    if (immersiveMouseHandler) {
      overlay.removeEventListener('mousemove', immersiveMouseHandler);
    }
    immersiveMouseHandler = function() {
      toolbar.classList.remove('hidden');
      if (immersiveToolbarTimer) clearTimeout(immersiveToolbarTimer);
      immersiveToolbarTimer = setTimeout(() => {
        toolbar.classList.add('hidden');
      }, 2000);
    };
    overlay.addEventListener('mousemove', immersiveMouseHandler, { passive: true });

    // 字号切换
    document.querySelectorAll('.immersive-size-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const size = this.dataset.size;
        document.querySelectorAll('.immersive-size-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        const text = document.getElementById('immersiveText');
        text.classList.remove('size-small', 'size-medium', 'size-large');
        text.classList.add('size-' + size);
      });
    });

    // 背景色切换
    document.querySelectorAll('.immersive-bg-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const bg = this.dataset.bg;
        document.querySelectorAll('.immersive-bg-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
        overlay.classList.remove('bg-light', 'bg-cream', 'bg-dark');
        overlay.classList.add('bg-' + bg);
        toolbar.classList.remove('light', 'cream', 'dark');
        toolbar.classList.add(bg === 'dark' ? 'dark' : bg === 'cream' ? 'cream' : 'light');
      });
    });
  }

  // ========== 筛选功能 ==========
  function applyFilters() {
    const searchQuery = (document.getElementById('worksSearch') || { value: '' }).value.trim().toLowerCase();
    const activeTab = document.querySelector('.works-tabs .tab-btn.active');
    const category = activeTab ? activeTab.dataset.category : 'all';

    // 从缓存过滤
    let works = cachedWorks;

    // 分类过滤
    if (category !== 'all') {
      const typeMap = { '文字': 'text', '图片': 'image', '音乐': 'music', '视频': 'video', '玩偶': 'doll', '游戏': 'game' };
      works = works.filter(item => {
        return typeMap[item.type] === category;
      });
    }

    // 搜索过滤
    if (searchQuery) {
      works = works.filter(item => {
        const title = (item.title || '').toLowerCase();
        const author = (item.author || '').toLowerCase();
        return title.includes(searchQuery) || author.includes(searchQuery);
      });
    }

    displayedWorks = works;
    renderWorks();
  }

  /**
   * 筛选作品（由 Tab 切换触发）
   */
  function filterWorks(category) {
    applyFilters();
  }

  /**
   * 打开作品详情页
   */
  function openWorkDetail(workId) {
    currentWorkId = workId;
    const work = cachedWorks.find(w => w.id === workId);
    if (!work) return;

    const url = new URL(window.location);
    url.searchParams.set('work', workId);
    url.searchParams.set('view', 'detail');
    window.history.pushState({}, '', url);

    document.getElementById('worksListView').classList.add('hidden');
    document.getElementById('worksDetailView').classList.remove('hidden');

    // 更新封面
    const coverPlaceholder = document.getElementById('detailCoverPlaceholder');
    if (coverPlaceholder) {
      coverPlaceholder.innerHTML = getCoverSVG(work.type);
      coverPlaceholder.className = `cover-placeholder detail-cover-placeholder ${getTypeClass(work.type)}-cover`;
    }

    // 更新基本信息
    const el = id => document.getElementById(id);
    if (el('detailTitle'))   el('detailTitle').textContent   = work.title || '无标题';
    if (el('detailAuthor'))  el('detailAuthor').textContent  = '作者：' + (work.author || '未知作者');
    if (el('detailTag'))     el('detailTag').textContent     = work.type || '';
    if (el('detailDate'))    el('detailDate').textContent    = work.created_at ? formatDate(work.created_at) : '';
    if (el('detailContent')) el('detailContent').innerHTML   = buildDetailContent(work);

    updateDetailFavoriteButton();
    renderCommentsList();
    updateCommentsCount();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * 构建详情页内容 HTML
   */
  function buildDetailContent(work) {
    const parts = [];
    const img = work.image_url || '';
    const content = (work.content || '').trim();

    if (img && isImageUrl(img)) {
      parts.push(`<img src="${escapeHtml(img)}" alt="${escapeHtml(work.title)}" style="max-width:100%;border-radius:8px;display:block;margin:0 auto 20px;">`);
    }

    if (content !== '') {
      if (isImageUrl(content)) {
        parts.push(`<img src="${escapeHtml(content)}" alt="${escapeHtml(work.title)}" style="max-width:100%;border-radius:8px;display:block;margin:0 auto 20px;">`);
      } else if (isExternalLink(content)) {
        parts.push(`<a href="${escapeHtml(content)}" target="_blank" rel="noopener noreferrer" class="detail-content-link" style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.6rem 1.2rem;background:var(--accent);color:white;border-radius:20px;text-decoration:none;font-size:0.9rem;margin-bottom:20px;">🔗 前往链接</a>`);
      } else {
        parts.push(`<div style="white-space:pre-wrap;line-height:1.8;">${escapeHtml(content)}</div>`);
      }
    }

    return parts.length ? parts.join('') : '<p style="color:#888;text-align:center;padding:20px;">暂无内容</p>';
  }

  /**
   * 关闭作品详情页
   */
  function closeWorkDetail() {
    currentWorkId = null;
    const url = new URL(window.location);
    url.searchParams.delete('work');
    url.searchParams.delete('view');
    url.searchParams.delete('comments');
    window.history.pushState({}, '', url);

    document.getElementById('worksDetailView').classList.add('hidden');
    document.getElementById('worksListView').classList.remove('hidden');
  }

  /**
   * 更新详情页收藏按钮
   */
  function updateDetailFavoriteButton() {
    if (!currentWorkId) return;
    const btn = document.getElementById('btnDetailFavorite');
    if (!btn) return;
    const fav = getFavorites().includes(currentWorkId);
    btn.classList.toggle('liked', fav);
    const icon = btn.querySelector('.favorite-icon-large');
    const text = btn.querySelector('.favorite-text');
    if (icon) icon.textContent = fav ? '❤' : '♡';
    if (text) text.textContent = fav ? '已收藏' : '收藏';
  }

  /**
   * 切换收藏状态
   */
  function toggleFavorite(workId) {
    const favs = getFavorites();
    const isNowFav = favs.includes(workId);

    if (isNowFav) favs.splice(favs.indexOf(workId), 1);
    else favs.push(workId);

    saveFavorites(favs);

    // 更新列表卡片
    const card = document.querySelector(`.work-card[data-work-id="${workId}"]`);
    if (!card) return;

    const badge = card.querySelector('.favorite-badge');
    const btn = card.querySelector('.btn-favorite');
    const icon = btn.querySelector('.favorite-icon');
    const count = btn.querySelector('.favorite-count');

    if (!isNowFav) {
      btn.classList.add('liked');
      icon.textContent = '❤';
      count.textContent = '1';
      badge.style.display = '';
      badge.classList.add('show');
    } else {
      btn.classList.remove('liked');
      icon.textContent = '♡';
      count.textContent = '0';
      badge.style.display = 'none';
      badge.classList.remove('show');
    }
  }

  /**
   * 获取收藏列表
   */
  function getFavorites() {
    const s = localStorage.getItem(FAVORITES_KEY);
    return s ? JSON.parse(s) : [];
  }

  /**
   * 保存收藏列表
   */
  function saveFavorites(favs) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favs));
  }

  /**
   * 获取留言列表（按作品 id 存储）
   */
  function getComments(workId) {
    const s = localStorage.getItem(`${COMMENTS_KEY}-${workId}`);
    return s ? JSON.parse(s) : [];
  }

  /**
   * 保存留言列表
   */
  function saveComments(workId, comments) {
    localStorage.setItem(`${COMMENTS_KEY}-${workId}`, JSON.stringify(comments));
  }

  /**
   * 更新评论数量
   */
  function updateCommentsCount() {
    if (!currentWorkId) return;
    const count = getComments(currentWorkId).length;
    const el = id => document.getElementById(id);
    if (el('commentsCount')) el('commentsCount').textContent = `(${count})`;
    const cardCount = document.querySelector(`.work-card[data-work-id="${currentWorkId}"] .comment-count`);
    if (cardCount) cardCount.textContent = count;
  }

  /**
   * 渲染留言列表
   */
  function renderCommentsList() {
    if (!currentWorkId) return;
    const list = document.getElementById('commentsList');
    if (!list) return;
    const comments = getComments(currentWorkId);

    if (!comments.length) {
      list.innerHTML = '<p class="comments-list-empty">还没有留言，快来抢沙发吧~</p>';
      return;
    }

    list.innerHTML = comments.map(c => `
      <div class="comment-item">
        <div class="comment-avatar">${(c.nickname || '?').charAt(0).toUpperCase()}</div>
        <div class="comment-body">
          <div class="comment-header">
            <span class="comment-nickname">${escapeHtml(c.nickname)}</span>
            <span class="comment-time">${c.time || ''}</span>
          </div>
          <p class="comment-text">${escapeHtml(c.content)}</p>
        </div>
      </div>
    `).join('');
  }

  /**
   * 提交留言
   */
  function submitComment(e) {
    e.preventDefault();
    if (!currentWorkId) return;
    const form = document.getElementById('commentsForm');
    if (!form) return;
    const nickname = form.querySelector('.comment-nickname').value.trim();
    const content = form.querySelector('.comment-content').value.trim();
    if (!nickname || !content) return;

    const comments = getComments(currentWorkId);
    comments.push({ id: 'c-' + Date.now(), nickname, content, time: formatTime(new Date()) });
    saveComments(currentWorkId, comments);
    updateCommentsCount();
    renderCommentsList();
    form.reset();
  }

  /**
   * HTML 转义
   */
  function escapeHtml(text) {
    if (!text) return '';
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
  }

  /**
   * 格式化时间
   */
  function formatTime(date) {
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * 格式化日期
   */
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const d = new Date(dateStr);
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;
  }

  /**
   * 绑定回到顶部按钮
   */
  function bindBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;
    window.addEventListener('scroll', () => btn.classList.toggle('visible', window.scrollY > 300));
    btn.addEventListener('click', () => window.scrollTo({ top: 0, behavior: 'smooth' }));
  }

  // 监听主题切换
  window.addEventListener('themechange', loadWorksFromSupabase);

  // 监听浏览器前进后退
  window.addEventListener('popstate', () => {
    const url = new URL(window.location);
    if (url.searchParams.get('view') === 'detail' && url.searchParams.get('work')) {
      openWorkDetail(url.searchParams.get('work'));
    } else {
      closeWorkDetail();
    }
  });

  // 初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
