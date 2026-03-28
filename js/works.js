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
   * 获取封面 SVG
   */
  function getCoverSVG(type) {
    switch(type) {
      case '音乐':
        return `<svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>`;
      case '文字':
        return `<svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          <line x1="8" y1="7" x2="16" y2="7"/>
          <line x1="8" y1="11" x2="14" y2="11"/>
        </svg>`;
      case '视频':
        return `<svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>`;
      case '玩偶':
        return `<svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1">
          <circle cx="12" cy="8" r="5"/>
          <path d="M3 21v-2a7 7 0 0 1 7-7h4a7 7 0 0 1 7 7v2"/>
        </svg>`;
      case '游戏':
        return `<svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1">
          <rect x="2" y="6" width="20" height="12" rx="2"/>
          <path d="M6 12h4M8 10v4"/>
          <circle cx="16" cy="11" r="1"/>
          <circle cx="18" cy="13" r="1"/>
        </svg>`;
      default:
        return `<svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="M21 15l-5-5L5 21"/>
        </svg>`;
    }
  }

  /**
   * 初始化作品页面
   */
  function init() {
    loadWorksFromSupabase();
    bindEvents();
    bindBackToTop();

    // 检查是否需要滚动到评论区
    const urlParams = new URLSearchParams(window.location.search);
    const scrollToComments = urlParams.get('comments');
    if (scrollToComments) {
      const workId = urlParams.get('work');
      if (workId) {
        openWorkDetail(workId);
        setTimeout(() => {
          const commentsSection = document.getElementById('detailComments');
          if (commentsSection) {
            commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 400);
      }
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
   * 渲染作品卡片
   */
  function renderWorks() {
    const grid = document.getElementById('worksGrid');
    if (!grid) return;

    // 记录当前页面上已收藏的作品
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
      const isMusic = item.type === '音乐';
      const isFav = favorites.includes(item.id);
      const commentCount = commentCounts[item.id] || 0;

      return `
        <article class="work-card ${isMusic ? 'is-music' : ''}" data-category="${typeClass}" data-work-id="${item.id}">
          <div class="favorite-badge ${isFav ? 'show' : ''}" style="${isFav ? '' : 'display:none'}">❤</div>
          ${isMusic ? `
            <div class="vinyl-container">
              <div class="vinyl">
                <div class="vinyl-label"></div>
                <div class="vinyl-hole"></div>
              </div>
            </div>
          ` : ''}
          <div class="work-cover">
            <div class="cover-placeholder ${typeClass}-cover">
              ${getCoverSVG(item.type)}
            </div>
          </div>
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
   * 绑定事件（全部使用事件委托）
   */
  function bindEvents() {
    // ===== 事件委托：作品卡片区域 =====
    const grid = document.getElementById('worksGrid');

    // 卡片点击（排除按钮）—— 进入详情
    grid.addEventListener('click', function(e) {
      const card = e.target.closest('.work-card');
      if (!card) return;
      // 忽略操作按钮
      if (e.target.closest('.btn-action')) return;
      const workId = card.dataset.workId;
      openWorkDetail(workId);
    });

    // 收藏按钮
    grid.addEventListener('click', function(e) {
      const btn = e.target.closest('.btn-favorite');
      if (!btn) return;
      e.stopPropagation();
      const workId = btn.dataset.workId;
      toggleFavorite(workId);
    });

    // 评论按钮
    grid.addEventListener('click', function(e) {
      const btn = e.target.closest('.btn-comment');
      if (!btn) return;
      e.stopPropagation();
      const workId = btn.dataset.workId;
      openWorkDetail(workId);
      setTimeout(() => {
        const commentsSection = document.getElementById('detailComments');
        if (commentsSection) {
          commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
        }
      }, 400);
    });

    // ===== 详情视图事件 =====

    // 返回按钮
    const backBtn = document.getElementById('btnBack');
    if (backBtn) {
      backBtn.addEventListener('click', closeWorkDetail);
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
    if (commentsForm) {
      commentsForm.addEventListener('submit', function(e) {
        e.preventDefault();
        submitComment();
      });
    }

    // ===== Tab 切换（直接绑定，数量少不需委托） =====
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

    // ===== 布局切换 =====
    document.querySelectorAll('.layout-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        const layout = this.dataset.layout;
        const worksGrid = document.getElementById('worksGrid');
        worksGrid.classList.remove('masonry', 'grid');
        worksGrid.classList.add(layout);
        document.querySelectorAll('.layout-btn').forEach(b => b.classList.remove('active'));
        this.classList.add('active');
      });
    });
  }

  /**
   * 筛选作品
   */
  function filterWorks(category) {
    document.querySelectorAll('.work-card').forEach(card => {
      if (category === 'all' || card.dataset.category === category) {
        card.style.display = '';
      } else {
        card.style.display = 'none';
      }
    });
  }

  /**
   * 打开作品详情页
   */
  function openWorkDetail(workId) {
    currentWorkId = workId;
    const work = cachedWorks.find(w => w.id === workId);
    if (!work) return;

    // 更新 URL
    const url = new URL(window.location);
    url.searchParams.set('work', workId);
    url.searchParams.set('view', 'detail');
    window.history.pushState({}, '', url);

    // 隐藏列表，显示详情
    document.getElementById('worksListView').classList.add('hidden');
    document.getElementById('worksDetailView').classList.remove('hidden');

    // 更新封面
    const coverPlaceholder = document.getElementById('detailCoverPlaceholder');
    if (coverPlaceholder) {
      coverPlaceholder.innerHTML = getCoverSVG(work.type);
      coverPlaceholder.className = `cover-placeholder detail-cover-placeholder ${getTypeClass(work.type)}-cover`;
    }

    // 更新基本信息
    const detailTitle = document.getElementById('detailTitle');
    if (detailTitle) detailTitle.textContent = work.title || '无标题';

    const detailAuthor = document.getElementById('detailAuthor');
    if (detailAuthor) detailAuthor.textContent = '作者：' + (work.author || '未知作者');

    const detailTag = document.getElementById('detailTag');
    if (detailTag) detailTag.textContent = work.type || '';

    const detailDate = document.getElementById('detailDate');
    if (detailDate) detailDate.textContent = work.created_at ? formatDate(work.created_at) : '';

    // 更新作品内容区
    const detailContent = document.getElementById('detailContent');
    if (detailContent) {
      detailContent.innerHTML = buildDetailContent(work);
    }

    // 更新收藏按钮
    updateDetailFavoriteButton();

    // 渲染评论
    renderCommentsList();
    updateCommentsCount();

    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * 构建详情页内容 HTML
   */
  function buildDetailContent(work) {
    const parts = [];

    // 1. image_url 图片（优先显示）
    if (work.image_url && work.image_url.trim() !== '') {
      parts.push(`<img src="${escapeHtml(work.image_url)}" alt="${escapeHtml(work.title)}" class="detail-content-img" style="max-width:100%;border-radius:8px;display:block;margin:0 auto 20px;">`);
    }

    // 2. content 内容
    const content = work.content && work.content.trim() !== '' ? work.content.trim() : '';

    if (content !== '') {
      if (isImageUrl(content)) {
        parts.push(`<img src="${escapeHtml(content)}" alt="${escapeHtml(work.title)}" style="max-width:100%;border-radius:8px;display:block;margin:0 auto 20px;">`);
      } else if (isExternalLink(content)) {
        parts.push(`<a href="${escapeHtml(content)}" target="_blank" rel="noopener noreferrer" class="detail-content-link">🔗 ${escapeHtml(content)}</a>`);
      } else {
        parts.push(`<div class="detail-content-text" style="white-space:pre-wrap;line-height:1.8;">${escapeHtml(content)}</div>`);
      }
    }

    if (parts.length === 0) {
      return '<p style="color:#888;text-align:center;padding:20px;">暂无内容</p>';
    }

    return parts.join('');
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
   * 关闭作品详情页
   */
  function closeWorkDetail() {
    currentWorkId = null;

    // 清除 URL 参数
    const url = new URL(window.location);
    url.searchParams.delete('work');
    url.searchParams.delete('view');
    url.searchParams.delete('comments');
    window.history.pushState({}, '', url);

    // 隐藏详情，显示列表
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
    const icon = btn.querySelector('.favorite-icon-large');
    const text = btn.querySelector('.favorite-text');
    const favorites = getFavorites();

    if (favorites.includes(currentWorkId)) {
      btn.classList.add('liked');
      if (icon) icon.textContent = '❤';
      if (text) text.textContent = '已收藏';
    } else {
      btn.classList.remove('liked');
      if (icon) icon.textContent = '♡';
      if (text) text.textContent = '收藏';
    }
  }

  /**
   * 切换收藏状态
   */
  function toggleFavorite(workId) {
    const favorites = getFavorites();
    const isNowFav = favorites.includes(workId);

    if (isNowFav) {
      const idx = favorites.indexOf(workId);
      favorites.splice(idx, 1);
    } else {
      favorites.push(workId);
    }

    saveFavorites(favorites);

    // 更新列表卡片
    const card = document.querySelector(`.work-card[data-work-id="${workId}"]`);
    if (card) {
      const btn = card.querySelector('.btn-favorite');
      const badge = card.querySelector('.favorite-badge');
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
  }

  /**
   * 获取收藏列表
   */
  function getFavorites() {
    const stored = localStorage.getItem(FAVORITES_KEY);
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * 保存收藏列表
   */
  function saveFavorites(favorites) {
    localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }

  /**
   * 获取留言列表（按作品 id 存储）
   */
  function getComments(workId) {
    const stored = localStorage.getItem(`${COMMENTS_KEY}-${workId}`);
    return stored ? JSON.parse(stored) : [];
  }

  /**
   * 保存留言列表
   */
  function saveComments(workId, comments) {
    localStorage.setItem(`${COMMENTS_KEY}-${workId}`, JSON.stringify(comments));
  }

  /**
   * 更新评论数量（详情页标题 + 列表卡片）
   */
  function updateCommentsCount() {
    if (!currentWorkId) return;
    const count = getComments(currentWorkId).length;

    // 详情页标题
    const countEl = document.getElementById('commentsCount');
    if (countEl) countEl.textContent = `(${count})`;

    // 列表卡片
    const card = document.querySelector(`.work-card[data-work-id="${currentWorkId}"] .comment-count`);
    if (card) card.textContent = count;
  }

  /**
   * 渲染留言列表
   */
  function renderCommentsList() {
    if (!currentWorkId) return;
    const list = document.getElementById('commentsList');
    if (!list) return;
    const comments = getComments(currentWorkId);

    if (comments.length === 0) {
      list.innerHTML = '<p class="comments-list-empty">还没有留言，快来抢沙发吧~</p>';
      return;
    }

    list.innerHTML = comments.map(comment => `
      <div class="comment-item" data-comment-id="${comment.id}">
        <div class="comment-avatar">${(comment.nickname || '?').charAt(0).toUpperCase()}</div>
        <div class="comment-body">
          <div class="comment-header">
            <span class="comment-nickname">${escapeHtml(comment.nickname)}</span>
            <span class="comment-time">${comment.time || ''}</span>
          </div>
          <p class="comment-text">${escapeHtml(comment.content)}</p>
        </div>
      </div>
    `).join('');
  }

  /**
   * 提交留言
   */
  function submitComment() {
    if (!currentWorkId) return;
    const form = document.getElementById('commentsForm');
    if (!form) return;
    const nickname = form.querySelector('.comment-nickname').value.trim();
    const content = form.querySelector('.comment-content').value.trim();

    if (!nickname || !content) return;

    const comments = getComments(currentWorkId);
    comments.push({
      id: 'comment-' + Date.now(),
      nickname: nickname,
      content: content,
      time: formatTime(new Date())
    });

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
    const date = new Date(dateStr);
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  }

  /**
   * 绑定回到顶部按钮
   */
  function bindBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;

    window.addEventListener('scroll', function() {
      btn.classList.toggle('visible', window.scrollY > 300);
    });

    btn.addEventListener('click', function() {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  // 监听主题切换，重新加载数据
  window.addEventListener('themechange', function() {
    loadWorksFromSupabase();
  });

  // 监听浏览器前进后退
  window.addEventListener('popstate', function() {
    const url = new URL(window.location);
    if (url.searchParams.get('view') === 'detail' && url.searchParams.get('work')) {
      openWorkDetail(url.searchParams.get('work'));
    } else {
      closeWorkDetail();
    }
  });

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();
