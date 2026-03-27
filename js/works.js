/**
 * ========================================
 * CP同人档案馆 - 作品页面脚本
 * ========================================
 */

(function() {
  'use strict';

  // localStorage 键名
  const FAVORITES_KEY = 'works-favorites';
  const COMMENTS_KEY = 'works-comments';
  const COMMENT_LIKES_KEY = 'works-comment-likes';

  // 当前打开的详情作品 ID
  let currentWorkId = null;

  // 作品数据
  const WORKS_DATA = {
    'work-1': {
      id: 'work-1',
      title: '冰雪与烈焰',
      author: '画师：霜月',
      category: '图片',
      categoryClass: 'image',
      date: '2026-01-15',
      placeholderType: 'image'
    },
    'work-2': {
      id: 'work-2',
      title: '永恒的共振',
      author: '作曲：夜阑',
      category: '音乐',
      categoryClass: 'music',
      date: '2026-02-08',
      placeholderType: 'music'
    },
    'work-3': {
      id: 'work-3',
      title: '双生的低语',
      author: '作者：星河',
      category: '文字',
      categoryClass: 'text',
      date: '2026-02-20',
      placeholderType: 'text'
    },
    'work-4': {
      id: 'work-4',
      title: '羁绊的瞬间',
      author: '剪辑：流光',
      category: '视频',
      categoryClass: 'video',
      date: '2026-03-01',
      placeholderType: 'video'
    }
  };

  // 获取封面 SVG
  function getCoverSVG(type) {
    switch(type) {
      case 'music':
        return `<svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1.5">
          <path d="M9 18V5l12-2v13"/>
          <circle cx="6" cy="18" r="3"/>
          <circle cx="18" cy="16" r="3"/>
        </svg>`;
      case 'text':
        return `<svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1">
          <path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/>
          <path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>
          <line x1="8" y1="7" x2="16" y2="7"/>
          <line x1="8" y1="11" x2="14" y2="11"/>
        </svg>`;
      case 'video':
        return `<svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1">
          <polygon points="5 3 19 12 5 21 5 3"/>
        </svg>`;
      default:
        return `<svg viewBox="0 0 24 24" width="64" height="64" fill="none" stroke="currentColor" stroke-width="1">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="M21 15l-5-5L5 21"/>
        </svg>`;
    }
  }

  // 等待 CPData 加载
  function waitForCPData(callback) {
    if (window.CPData) {
      callback();
    } else {
      setTimeout(() => waitForCPData(callback), 50);
    }
  }

  /**
   * 初始化作品页面
   */
  function init() {
    waitForCPData(() => {
      initLayout();
      bindEvents();
      bindBackToTop();
      updateFavoriteBadges();
      updateCommentCounts();

      // 检查是否需要滚动到评论区
      const urlParams = new URLSearchParams(window.location.search);
      const scrollToComments = urlParams.get('comments');
      if (scrollToComments) {
        const workId = urlParams.get('work');
        if (workId) {
          openWorkDetail(workId);
          // 延迟滚动以等待动画完成
          setTimeout(() => {
            const commentsSection = document.getElementById('detailComments');
            if (commentsSection) {
              commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
            }
          }, 400);
        }
      }
    });
  }

  /**
   * 初始化布局
   */
  function initLayout() {
    const worksGrid = document.getElementById('worksGrid');
    if (worksGrid) {
      worksGrid.classList.add('masonry');
    }
  }

  /**
   * 绑定事件
   */
  function bindEvents() {
    // Tab 切换
    const tabBtns = document.querySelectorAll('.tab-btn');
    tabBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const category = this.dataset.category;
        filterWorks(category);
        
        tabBtns.forEach(b => {
          b.classList.remove('active');
          b.setAttribute('aria-selected', 'false');
        });
        this.classList.add('active');
        this.setAttribute('aria-selected', 'true');
      });
    });

    // 布局切换
    const layoutBtns = document.querySelectorAll('.layout-btn');
    const worksGrid = document.getElementById('worksGrid');
    layoutBtns.forEach(btn => {
      btn.addEventListener('click', function() {
        const layout = this.dataset.layout;
        worksGrid.classList.remove('masonry', 'grid');
        worksGrid.classList.add(layout);
        
        layoutBtns.forEach(b => b.classList.remove('active'));
        this.classList.add('active');
      });
    });

    // 作品卡片点击 - 进入详情页
    document.querySelectorAll('.work-card').forEach(card => {
      card.addEventListener('click', function(e) {
        // 如果点击的是按钮，不触发展开
        if (e.target.closest('.btn-action')) return;
        const workId = this.dataset.workId;
        openWorkDetail(workId);
      });
    });

    // 收藏按钮
    document.querySelectorAll('.btn-favorite').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const workId = this.dataset.workId;
        toggleFavorite(workId);
      });
    });

    // 留言按钮
    document.querySelectorAll('.btn-comment').forEach(btn => {
      btn.addEventListener('click', function(e) {
        e.stopPropagation();
        const workId = this.dataset.workId;
        openWorkDetail(workId);
        // 滚动到评论区
        setTimeout(() => {
          const commentsSection = document.getElementById('detailComments');
          if (commentsSection) {
            commentsSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
          }
        }, 400);
      });
    });

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
  }

  /**
   * 筛选作品
   */
  function filterWorks(category) {
    const cards = document.querySelectorAll('.work-card');
    cards.forEach(card => {
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
    const work = WORKS_DATA[workId];
    if (!work) return;

    // 更新 URL
    const url = new URL(window.location);
    url.searchParams.set('work', workId);
    url.searchParams.set('view', 'detail');
    window.history.pushState({}, '', url);

    // 隐藏列表，显示详情
    const listView = document.getElementById('worksListView');
    const detailView = document.getElementById('worksDetailView');
    
    listView.classList.add('hidden');
    detailView.classList.remove('hidden');

    // 更新详情页内容
    const coverPlaceholder = document.getElementById('detailCoverPlaceholder');
    coverPlaceholder.innerHTML = getCoverSVG(work.placeholderType);
    coverPlaceholder.className = `cover-placeholder detail-cover-placeholder ${work.categoryClass}-cover`;

    document.getElementById('detailTitle').textContent = work.title;
    document.getElementById('detailAuthor').textContent = work.author;
    document.getElementById('detailTag').textContent = work.category;
    document.getElementById('detailDate').textContent = work.date;

    // 更新收藏按钮状态
    updateDetailFavoriteButton();

    // 渲染留言列表
    renderCommentsList();
    updateCommentsCount();

    // 滚动到顶部
    window.scrollTo({ top: 0, behavior: 'smooth' });
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
    const listView = document.getElementById('worksListView');
    const detailView = document.getElementById('worksDetailView');
    
    detailView.classList.add('hidden');
    listView.classList.remove('hidden');
  }

  /**
   * 更新详情页收藏按钮
   */
  function updateDetailFavoriteButton() {
    if (!currentWorkId) return;
    const btn = document.getElementById('btnDetailFavorite');
    const icon = btn.querySelector('.favorite-icon-large');
    const text = btn.querySelector('.favorite-text');
    const favorites = getFavorites();

    if (favorites.includes(currentWorkId)) {
      btn.classList.add('liked');
      icon.textContent = '❤';
      text.textContent = '已收藏';
    } else {
      btn.classList.remove('liked');
      icon.textContent = '♡';
      text.textContent = '收藏';
    }
  }

  /**
   * 切换收藏状态
   */
  function toggleFavorite(workId) {
    const favorites = getFavorites();
    const btn = document.querySelector(`.btn-favorite[data-work-id="${workId}"]`);
    const badge = document.querySelector(`.work-card[data-work-id="${workId}"] .favorite-badge`);
    const icon = btn.querySelector('.favorite-icon');
    const count = btn.querySelector('.favorite-count');
    
    if (favorites.includes(workId)) {
      // 取消收藏
      const index = favorites.indexOf(workId);
      favorites.splice(index, 1);
      btn.classList.remove('liked');
      icon.textContent = '♡';
      badge.classList.remove('show');
    } else {
      // 添加收藏
      favorites.push(workId);
      btn.classList.add('liked');
      icon.textContent = '❤';
      badge.classList.add('show');
    }
    
    saveFavorites(favorites);
    count.textContent = favorites.includes(workId) ? '1' : '0';
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
   * 更新收藏标记显示
   */
  function updateFavoriteBadges() {
    const favorites = getFavorites();
    document.querySelectorAll('.work-card').forEach(card => {
      const workId = card.dataset.workId;
      const btn = card.querySelector('.btn-favorite');
      const badge = card.querySelector('.favorite-badge');
      const icon = btn.querySelector('.favorite-icon');
      const count = btn.querySelector('.favorite-count');
      
      if (favorites.includes(workId)) {
        btn.classList.add('liked');
        icon.textContent = '❤';
        badge.classList.add('show');
        count.textContent = '1';
      }
    });
  }

  /**
   * 获取留言列表
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
   * 更新留言数量显示
   */
  function updateCommentCounts() {
    document.querySelectorAll('.work-card').forEach(card => {
      const workId = card.dataset.workId;
      const comments = getComments(workId);
      const count = card.querySelector('.comment-count');
      if (count) {
        count.textContent = comments.length;
      }
    });
  }

  /**
   * 更新评论数量
   */
  function updateCommentsCount() {
    if (!currentWorkId) return;
    const comments = getComments(currentWorkId);
    const countEl = document.getElementById('commentsCount');
    if (countEl) {
      countEl.textContent = `(${comments.length})`;
    }
  }

  /**
   * 渲染留言列表
   */
  function renderCommentsList() {
    if (!currentWorkId) return;
    const list = document.getElementById('commentsList');
    const comments = getComments(currentWorkId);
    const commentLikes = getCommentLikes();
    
    if (comments.length === 0) {
      list.innerHTML = '<p class="comments-list-empty">还没有留言，快来抢沙发吧~</p>';
      return;
    }
    
    list.innerHTML = comments.map((comment, index) => {
      const likes = commentLikes[currentWorkId]?.[comment.id] || 0;
      return `
        <div class="comment-item" data-comment-id="${comment.id}">
          <div class="comment-avatar">${comment.nickname.charAt(0).toUpperCase()}</div>
          <div class="comment-body">
            <div class="comment-header">
              <span class="comment-nickname">${escapeHtml(comment.nickname)}</span>
              <span class="comment-time">${comment.time}</span>
            </div>
            <p class="comment-text">${escapeHtml(comment.content)}</p>
            <button class="btn-like-comment" data-work-id="${currentWorkId}" data-comment-id="${comment.id}">
              <span>❤</span>
              <span class="like-count">${likes}</span>
            </button>
          </div>
        </div>
      `;
    }).join('');

    // 绑定同感按钮
    list.querySelectorAll('.btn-like-comment').forEach(btn => {
      btn.addEventListener('click', function() {
        const workId = this.dataset.workId;
        const commentId = this.dataset.commentId;
        toggleCommentLike(workId, commentId);
      });
    });
  }

  /**
   * 提交留言
   */
  function submitComment() {
    if (!currentWorkId) return;
    const form = document.getElementById('commentsForm');
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
    updateCommentCounts();
    updateCommentsCount();
    renderCommentsList();
    form.reset();
  }

  /**
   * 获取留言点赞数据
   */
  function getCommentLikes() {
    const stored = localStorage.getItem(COMMENT_LIKES_KEY);
    return stored ? JSON.parse(stored) : {};
  }

  /**
   * 保存留言点赞数据
   */
  function saveCommentLikes(data) {
    localStorage.setItem(COMMENT_LIKES_KEY, JSON.stringify(data));
  }

  /**
   * 切换留言同感
   */
  function toggleCommentLike(workId, commentId) {
    const likes = getCommentLikes();
    if (!likes[workId]) likes[workId] = {};
    
    if (likes[workId][commentId]) {
      likes[workId][commentId]--;
      if (likes[workId][commentId] <= 0) {
        delete likes[workId][commentId];
      }
    } else {
      likes[workId][commentId] = 1;
    }
    
    saveCommentLikes(likes);
    renderCommentsList();
  }

  /**
   * HTML 转义
   */
  function escapeHtml(text) {
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
   * 绑定回到顶部按钮
   */
  function bindBackToTop() {
    const btn = document.getElementById('backToTop');
    if (!btn) return;

    window.addEventListener('scroll', function() {
      if (window.scrollY > 300) {
        btn.classList.add('visible');
      } else {
        btn.classList.remove('visible');
      }
    });

    btn.addEventListener('click', function() {
      window.scrollTo({
        top: 0,
        behavior: 'smooth'
      });
    });
  }

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
