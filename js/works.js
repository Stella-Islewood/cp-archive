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
      renderWorks();
    } catch (error) {
      console.error('加载作品失败:', error);
      cachedWorks = [];
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

    // 音乐创作：显示播放按钮 + 歌曲信息 + 链接
    if (type === '音乐') {
      const mediaUrl = img || content;
      const platform = getMediaPlatform(mediaUrl);
      let playerHtml = '';

      if (platform === 'music') {
        const displayUrl = mediaUrl.length > 60 ? mediaUrl.substring(0, 60) + '…' : mediaUrl;
        playerHtml = `
          <div class="work-card-body work-card-body-music">
            <div class="music-icon-wrap">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <div class="music-info">
              <span class="music-song">${escapeHtml(item.title)}</span>
              <span class="music-author">${escapeHtml(item.author || '')}</span>
            </div>
            ${isExternalLink(mediaUrl) ? `<a href="${escapeHtml(mediaUrl)}" target="_blank" rel="noopener noreferrer" class="music-link-btn" title="前往播放">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              播放
            </a>` : ''}
          </div>`;
      } else if (platform === 'bilibili') {
        playerHtml = `
          <div class="work-card-body work-card-body-music">
            <div class="music-icon-wrap">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <div class="music-info">
              <span class="music-song">${escapeHtml(item.title)}</span>
              <span class="music-author">${escapeHtml(item.author || '')}</span>
            </div>
            <a href="${escapeHtml(mediaUrl)}" target="_blank" rel="noopener noreferrer" class="music-link-btn" title="B站">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              B站
            </a>
          </div>`;
      } else if (isExternalLink(mediaUrl)) {
        playerHtml = `
          <div class="work-card-body work-card-body-music">
            <div class="music-icon-wrap">
              <svg viewBox="0 0 24 24" width="28" height="28" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M9 18V5l12-2v13"/>
                <circle cx="6" cy="18" r="3"/>
                <circle cx="18" cy="16" r="3"/>
              </svg>
            </div>
            <div class="music-info">
              <span class="music-song">${escapeHtml(item.title)}</span>
              <span class="music-author">${escapeHtml(item.author || '')}</span>
            </div>
            <a href="${escapeHtml(mediaUrl)}" target="_blank" rel="noopener noreferrer" class="music-link-btn">
              <svg viewBox="0 0 24 24" width="16" height="16" fill="currentColor">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              播放
            </a>
          </div>`;
      } else {
        return buildCardBodyDefault(item);
      }
      return playerHtml;
    }

    // 视频创作
    if (type === '视频') {
      const mediaUrl = img || content;

      if (platform === 'bilibili' || platform === 'youtube') {
        const platformName = platform === 'bilibili' ? 'B站' : 'YouTube';
        const platformLabel = platform === 'bilibili' ? 'B站' : 'YT';
        return `
          <div class="work-card-body work-card-body-video">
            <div class="video-cover-placeholder video-cover-card">
              <svg viewBox="0 0 24 24" width="36" height="36" fill="none" stroke="currentColor" stroke-width="1.5">
                <polygon points="5 3 19 12 5 21 5 3"/>
              </svg>
              <span>${platformName} 视频</span>
            </div>
            ${isExternalLink(mediaUrl) ? `<a href="${escapeHtml(mediaUrl)}" target="_blank" rel="noopener noreferrer" class="video-link-btn" title="${platformName}">
              <svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/>
                <polyline points="15 3 21 3 21 9"/>
                <line x1="10" y1="14" x2="21" y2="3"/>
              </svg>
              ${platformLabel}
            </a>` : ''}
          </div>`;
      }

      if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(mediaUrl)) {
        return `
          <div class="work-card-body work-card-body-video">
            <video src="${escapeHtml(mediaUrl)}" class="card-body-video" preload="none" controls></video>
          </div>`;
      }

      if (isImageUrl(mediaUrl)) {
        return `
          <div class="work-card-body work-card-body-image">
            <img src="${escapeHtml(mediaUrl)}" alt="${escapeHtml(item.title)}" class="card-body-img" loading="lazy">
          </div>`;
      }

      return buildCardBodyDefault(item);
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
   * 构建文字卡片主体
   */
  function buildTextCardBody(item) {
    const content = (item.content || '').trim();
    const isLong = content.length > 200;
    const preview = content.substring(0, 200);
    const escaped = escapeHtml(content);
    const escapedPreview = escapeHtml(preview);

    return `
      <div class="work-card-body work-card-body-text" data-work-id="${item.id}" data-full="${encodeURIComponent(escaped)}">
        <p class="text-body-preview" data-full="${encodeURIComponent(escaped)}">${escapedPreview}${isLong ? '<span class="text-ellipsis">…</span>' : ''}</p>
        ${isLong ? '<button class="text-expand-btn" type="button">展开</button>' : ''}
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
    cachedWorks.forEach(w => {
      commentCounts[w.id] = getComments(w.id).length;
    });

    if (cachedWorks.length === 0) {
      grid.innerHTML = '<p style="text-align:center;color:#888;padding:40px;grid-column:1/-1;">暂无作品数据</p>';
      return;
    }

    grid.innerHTML = cachedWorks.map((item) => {
      const typeClass = getTypeClass(item.type);
      const isFav = favorites.includes(item.id);
      const commentCount = commentCounts[item.id] || 0;
      const isText = item.type === '文字';

      // 卡片主体
      const body = isText
        ? buildTextCardBody(item)
        : buildCardBody(item);

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
    const grid = document.getElementById('worksGrid');

    // 文字卡片：展开/收起内容
    grid.addEventListener('click', function(e) {
      const expandBtn = e.target.closest('.text-expand-btn');
      if (expandBtn) {
        e.stopPropagation();
        const body = expandBtn.closest('.work-card-body-text');
        toggleTextExpand(body, expandBtn);
        return;
      }

      const collapseBtn = e.target.closest('.text-collapse-btn');
      if (collapseBtn) {
        e.stopPropagation();
        const body = collapseBtn.closest('.work-card-body-text');
        const workId = body.dataset.workId;
        collapseText(body, workId);
        return;
      }
    });

    // 卡片主体点击：图片/视频卡片 → 进入详情
    grid.addEventListener('click', function(e) {
      const cardBody = e.target.closest('.work-card-body');
      if (!cardBody) return;
      // 忽略链接、按钮、视频控制
      if (e.target.closest('a, button, video')) return;
      const card = cardBody.closest('.work-card');
      if (!card) return;
      // 忽略文字卡片（文字卡片由 action 按钮或 info 区触发）
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

    // 文字卡片 info 区点击 → 进入详情
    grid.addEventListener('click', function(e) {
      const info = e.target.closest('.work-info');
      if (!info) return;
      const card = info.closest('.work-card');
      if (!card || !card.classList.contains('work-card-text')) return;
      if (e.target.closest('.work-tag')) return; // 忽略标签点击
      openWorkDetail(card.dataset.workId);
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

  /**
   * 切换文字卡片展开/收起
   */
  function toggleTextExpand(body, btn) {
    const workId = body.dataset.workId;
    const full = decodeURIComponent(body.dataset.full);
    const preview = decodeURIComponent(body.querySelector('.text-body-preview').dataset.full).substring(0, 200);
    const isExpanded = body.classList.contains('is-expanded');

    if (isExpanded) {
      // 收起
      body.classList.remove('is-expanded');
      body.querySelector('.text-body-preview').textContent = preview + '…';
      btn.textContent = '展开';
    } else {
      // 展开
      body.classList.add('is-expanded');
      body.querySelector('.text-body-preview').innerHTML = escapeHtml(full).replace(/\n/g, '<br>');
      btn.textContent = '收起';
    }
  }

  /**
   * 收起文字卡片
   */
  function collapseText(body, workId) {
    const preview = decodeURIComponent(body.dataset.full).substring(0, 200);
    body.classList.remove('is-expanded');
    body.querySelector('.text-body-preview').innerHTML = escapeHtml(preview) + '<span class="text-ellipsis">…</span>';
    const btn = body.querySelector('.text-expand-btn');
    if (btn) btn.textContent = '展开';
  }

  /**
   * 筛选作品
   */
  function filterWorks(category) {
    document.querySelectorAll('.work-card').forEach(card => {
      card.style.display = (category === 'all' || card.dataset.category === category) ? '' : 'none';
    });
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
