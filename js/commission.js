/**
 * ========================================
 * CP同人档案馆 - 约稿展示页面脚本
 * 支持多类型内容（图片/文字/音乐/视频）+ 搜索过滤 + 详情页
 * ========================================
 */

(function() {
  'use strict';

  // Supabase 配置
  const SUPABASE_URL = 'https://vbvfrmqwlyitarmnhmyw.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_SB0uqo25MSjOPA4fb8n-eg_bCBiXMzH';
  const COMMENTS_KEY = 'commission-comments';

  // 缓存的约稿数据
  let cachedCommissions = [];
  let displayedCommissions = [];
  window.currentCommissionId = null;

  /**
   * 初始化约稿页面功能
   */
  function init() {
    loadCommissionsFromSupabase();
    bindSearchEvents();
    bindDetailEvents();
    bindBackToTop();
  }

  /**
   * 从 Supabase 加载约稿数据
   */
  async function loadCommissionsFromSupabase() {
    const grid = document.getElementById('commissionGrid');
    if (!grid) return;

    try {
      const theme = localStorage.getItem('cp-archive-theme') || 'lionmio';

      const { data, error } = await supabase
        .createClient(SUPABASE_URL, SUPABASE_KEY)
        .from('commissions')
        .select('*')
        .eq('archive_id', theme)
        .order('created_at', { ascending: false });

      if (error) throw error;

      cachedCommissions = data || [];
      displayedCommissions = [...cachedCommissions];
      renderCommissions();
      initMasonry();
    } catch (error) {
      console.error('加载约稿失败:', error);
      cachedCommissions = [];
      displayedCommissions = [];
      renderCommissions();
    }
  }

  /**
   * 绑定搜索事件
   */
  function bindSearchEvents() {
    const searchInput = document.getElementById('commissionSearch');
    if (!searchInput) return;

    searchInput.addEventListener('input', function() {
      const query = this.value.trim().toLowerCase();
      filterCommissions(query);
    });
  }

  /**
   * 绑定详情页事件
   */
  function bindDetailEvents() {
    const backBtn = document.getElementById('btnBack');
    const listView = document.getElementById('commissionListView');
    const commentsForm = document.getElementById('commentsForm');

    if (backBtn) {
      backBtn.addEventListener('click', closeDetail);
    }

    // 绑定评论表单提交
    if (commentsForm) {
      commentsForm.addEventListener('submit', submitCommissionComment);
    }

    // 使用事件委托绑定卡片点击事件
    if (listView) {
      listView.addEventListener('click', function(e) {
        const card = e.target.closest('.commission-card');
        if (card) {
          const index = parseInt(card.dataset.index);
          openDetail(card, index);
        }
      });
    }

    // ESC 关闭详情
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeDetail();
      }
    });
  }

  // ========== 评论功能 ==========

  /**
   * 获取约稿评论列表（按约稿 id 存储）
   */
  function getCommissionComments(commissionId) {
    const s = localStorage.getItem(COMMENTS_KEY + '-' + commissionId);
    return s ? JSON.parse(s) : [];
  }

  /**
   * 保存约稿评论列表
   */
  function saveCommissionComments(commissionId, comments) {
    localStorage.setItem(COMMENTS_KEY + '-' + commissionId, JSON.stringify(comments));
  }

  /**
   * 更新评论数量
   */
  function updateCommissionCommentsCount() {
    if (!window.currentCommissionId) return;
    const count = getCommissionComments(window.currentCommissionId).length;
    const el = function(id) { return document.getElementById(id); };
    if (el('commentsCount')) el('commentsCount').textContent = '(' + count + ')';
  }

  /**
   * 渲染评论列表
   */
  function renderCommissionCommentsList() {
    if (!window.currentCommissionId) return;
    const list = document.getElementById('commentsList');
    if (!list) return;
    const comments = getCommissionComments(window.currentCommissionId);

    if (!comments.length) {
      list.innerHTML = '<p class="comments-list-empty">还没有留言，快来抢沙发吧~</p>';
      return;
    }

    list.innerHTML = comments.map(function(c) {
      return '<div class="comment-item" data-comment-id="' + c.id + '">' +
        '<div class="comment-avatar">' + (c.nickname || '?').charAt(0).toUpperCase() + '</div>' +
        '<div class="comment-body">' +
        '<div class="comment-header">' +
        '<span class="comment-nickname">' + escapeHtml(c.nickname) + '</span>' +
        '<span class="comment-time">' + (c.time || '') + '</span>' +
        '<button class="btn-delete-comment" onclick="deleteCommissionComment(\'' + c.id + '\')">× 删除</button>' +
        '</div>' +
        '<p class="comment-text">' + escapeHtml(c.content) + '</p>' +
        '</div>' +
        '</div>';
    }).join('');
  }

  /**
   * 删除约稿评论
   */
  function deleteCommissionComment(commentId) {
    if (!confirm('确定删除这条评论吗？')) return;
    if (!window.currentCommissionId) return;
    const comments = getCommissionComments(window.currentCommissionId);
    const filteredComments = comments.filter(function(c) { return c.id !== commentId; });
    saveCommissionComments(window.currentCommissionId, filteredComments);
    renderCommissionCommentsList();
    updateCommissionCommentsCount();
  }

  /**
   * 提交评论
   */
  function submitCommissionComment(e) {
    e.preventDefault();
    if (!window.currentCommissionId) return;
    const form = document.getElementById('commentsForm');
    if (!form) return;
    const nicknameInput = form.querySelector('.comment-nickname');
    const contentInput = form.querySelector('.comment-content');
    if (!nicknameInput || !contentInput) return;
    const nickname = nicknameInput.value.trim();
    const content = contentInput.value.trim();
    if (!nickname || !content) return;

    const comments = getCommissionComments(window.currentCommissionId);
    comments.push({ id: 'c-' + Date.now(), nickname: nickname, content: content, time: formatTime(new Date()) });
    saveCommissionComments(window.currentCommissionId, comments);
    updateCommissionCommentsCount();
    renderCommissionCommentsList();
    form.reset();
  }

  /**
   * 格式化时间
   */
  function formatTime(date) {
    var y = date.getFullYear();
    var m = String(date.getMonth() + 1).padStart(2, '0');
    var d = String(date.getDate()).padStart(2, '0');
    return y + '-' + m + '-' + d;
  }

  /**
   * 过滤约稿
   */
  function filterCommissions(query) {
    if (!query) {
      displayedCommissions = [...cachedCommissions];
    } else {
      displayedCommissions = cachedCommissions.filter(item => {
        const title = (item.title || '').toLowerCase();
        const artist = (item.artist || '').toLowerCase();
        return title.includes(query) || artist.includes(query);
      });
    }
    renderCommissions();
    setTimeout(() => initMasonry(), 50);
  }

  /**
   * 获取约稿的图片数组（兼容旧数据）
   */
  function getCommissionImages(item) {
    let images = [];
    try {
      if (item.images) {
        if (typeof item.images === 'string') {
          images = JSON.parse(item.images);
        } else if (Array.isArray(item.images)) {
          images = item.images;
        }
      }
    } catch (e) {
      images = [];
    }
    // 兼容旧数据：如果没有 images 但有 image_url
    if (images.length === 0 && item.image_url) {
      images = [item.image_url];
    }
    return images;
  }

  /**
   * 判断是否图片 URL
   */
  function isImageUrl(str) {
    if (!str) return false;
    return /\.(jpg|jpeg|png|gif|webp)(\?.*)?$/i.test(str);
  }

  /**
   * 判断是否外部链接
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
   * 获取类型对应的渐变色类
   */
  function getTypeGradientClass(type) {
    const gradients = {
      '图片': 'gradient-image',
      '文字': 'gradient-text',
      '音乐': 'gradient-music',
      '视频': 'gradient-video'
    };
    return gradients[type] || 'gradient-image';
  }

  /**
   * 构建卡片内容（按类型）
   */
  function buildCardBody(item) {
    const type = item.type || '图片';
    const img = item.image_url;
    const images = getCommissionImages(item);
    const content = item.text_content || '';
    const hasMultipleImages = images.length > 1;

    // 图片类型
    if (type === '图片') {
      if (images.length > 0 && isImageUrl(images[0])) {
        return `<div class="card-image">
          <img src="${escapeHtml(images[0])}" alt="${escapeHtml(item.title)}" class="card-img" loading="lazy">
          ${hasMultipleImages ? `<span class="card-multi-badge">${images.length}张</span>` : ''}
        </div>`;
      }
      return `<div class="card-image">
        <div class="image-placeholder ${getTypeGradientClass(type)}">
          <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
        </div>
      </div>`;
    }

    // 文字类型
    if (type === '文字') {
      const preview = content.substring(0, 100);
      return `<div class="card-body-text">
        <p class="text-preview">${escapeHtml(preview)}${content.length > 100 ? '…' : ''}</p>
      </div>`;
    }

    // 音乐类型
    if (type === '音乐') {
      const mediaUrl = img || content;
      const hasLink = isExternalLink(mediaUrl);
      return `<div class="card-body-music">
        <span class="card-music-emoji">🎵</span>
        <div class="card-music-info">
          <span class="card-music-title">${escapeHtml(item.title)}</span>
          <span class="card-music-artist">${escapeHtml(item.artist || '')}</span>
        </div>
        ${hasLink ? `<a href="${escapeHtml(mediaUrl)}" target="_blank" rel="noopener noreferrer" class="card-music-btn" onclick="event.stopPropagation();">🎵 收听</a>` : ''}
      </div>`;
    }

    // 视频类型
    if (type === '视频') {
      const mediaUrl = img || content;
      const hasLink = isExternalLink(mediaUrl);
      return `<div class="card-body-video">
        <span class="card-video-emoji">🎬</span>
        <div class="card-video-info">
          <span class="card-video-title">${escapeHtml(item.title)}</span>
          <span class="card-video-artist">${escapeHtml(item.artist || '')}</span>
        </div>
        ${hasLink ? `<a href="${escapeHtml(mediaUrl)}" target="_blank" rel="noopener noreferrer" class="card-video-btn" onclick="event.stopPropagation();">▶ 观看</a>` : ''}
      </div>`;
    }

    // 默认图片
    return `<div class="card-image">
      <div class="image-placeholder ${getTypeGradientClass(type)}">
        <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="M21 15l-5-5L5 21"/>
        </svg>
      </div>
    </div>`;
  }

  /**
   * 渲染约稿卡片
   */
  function renderCommissions() {
    const grid = document.getElementById('commissionGrid');
    if (!grid) return;

    if (displayedCommissions.length === 0) {
      const query = document.getElementById('commissionSearch').value.trim();
      if (query) {
        grid.innerHTML = '<p class="search-no-results">没有找到相关内容</p>';
      } else {
        grid.innerHTML = '<p style="text-align:center;color:#888;padding:40px;grid-column:1/-1;">暂无约稿数据</p>';
      }
      return;
    }

    grid.innerHTML = displayedCommissions.map((item, index) => {
      const cardBody = buildCardBody(item);
      const type = item.type || '图片';
      const isText = type === '文字';
      const images = getCommissionImages(item);
      const hasMultipleImages = images.length > 1;

      return `
        <article class="commission-card ${isText ? 'commission-card-text' : ''}" data-index="${index}" data-id="${item.id}">
          ${!isText && hasMultipleImages ? `<span class="card-multi-badge-top">${images.length}张图集</span>` : ''}
          ${cardBody}
          <div class="card-info">
            <h3 class="card-title">${escapeHtml(item.title)}</h3>
            <p class="card-artist">画师：${escapeHtml(item.artist || '')}</p>
            <div class="card-meta">
              <span class="card-type-tag">${escapeHtml(type)}</span>
              <span class="card-date">${formatDate(item.created_at)}</span>
            </div>
          </div>
        </article>
      `;
    }).join('');
  }

  /**
   * 初始化瀑布流布局
   */
  function initMasonry() {
    calculateMasonry();
  }

  /**
   * 计算瀑布流每项的高度
   */
  function calculateMasonry() {
    const grid = document.getElementById('commissionGrid');
    if (!grid) return;

    const items = grid.querySelectorAll('.commission-card');
    const rowHeight = 10;
    const rowGap = parseInt(getComputedStyle(grid).gap) || 15;

    items.forEach(item => {
      const image = item.querySelector('.card-image, .card-body-text, .card-body-music, .card-body-video');
      const info = item.querySelector('.card-info');
      if (!image || !info) return;

      const imageHeight = image.offsetHeight || 200;
      const infoHeight = info.offsetHeight;
      const totalHeight = imageHeight + infoHeight;
      const rowSpan = Math.ceil((totalHeight + rowGap) / (rowHeight + rowGap));
      item.style.gridRowEnd = `span ${rowSpan}`;
    });
  }

  /**
   * 打开详情页
   */
  function openDetail(card, index) {
    var item = displayedCommissions[index];
    if (!item) return;

    window.currentCommissionId = item.id;

    var coverPlaceholder = document.getElementById('detailCoverPlaceholder');
    var detailContent = document.getElementById('detailContent');
    var galleryContainer = document.getElementById('galleryContainer');
    var listView = document.getElementById('commissionListView');
    var detailView = document.getElementById('commissionDetailView');

    // 根据类型构建封面区内容
    var type = item.type || '图片';
    var img = item.image_url;
    var content = item.text_content || '';
    var images = getCommissionImages(item);
    var hasMultipleImages = images.length > 1;

    if (type === '图片') {
      if (hasMultipleImages) {
        // 多图模式：显示相册
        if (coverPlaceholder) coverPlaceholder.style.display = 'none';
        if (galleryContainer) {
          galleryContainer.style.display = '';
          initGallery(images);
        }
      } else if (images.length > 0 && isImageUrl(images[0])) {
        // 单图模式
        if (coverPlaceholder) {
          coverPlaceholder.style.display = '';
          coverPlaceholder.innerHTML = '<img src="' + escapeHtml(images[0]) + '" alt="' + escapeHtml(item.title) + '" style="width:100%;height:100%;object-fit:contain;">';
        }
        if (galleryContainer) galleryContainer.style.display = 'none';
      } else {
        // 无图模式
        if (coverPlaceholder) {
          coverPlaceholder.style.display = '';
          coverPlaceholder.innerHTML = '<div class="detail-cover-default ' + getTypeGradientClass(type) + '">' +
            '<svg viewBox="0 0 24 24" width="80" height="80" fill="none" stroke="currentColor" stroke-width="1">' +
            '<rect x="3" y="3" width="18" height="18" rx="2"/>' +
            '<circle cx="8.5" cy="8.5" r="1.5"/>' +
            '<path d="M21 15l-5-5L5 21"/>' +
            '</svg></div>';
        }
        if (galleryContainer) galleryContainer.style.display = 'none';
      }
    } else if (type === '文字') {
      if (coverPlaceholder) {
        coverPlaceholder.style.display = '';
        var textPreview = content.substring(0, 200) + (content.length > 200 ? '...' : '');
        coverPlaceholder.innerHTML = '<div class="detail-cover-text"><p class="detail-text-preview">' + escapeHtml(textPreview) + '</p></div>';
      }
      if (galleryContainer) galleryContainer.style.display = 'none';
    } else if (type === '音乐') {
      if (coverPlaceholder) {
        coverPlaceholder.style.display = '';
        var mediaUrl = img || content;
        var hasLink = isExternalLink(mediaUrl);
        coverPlaceholder.innerHTML = '<div class="detail-cover-media"><span class="detail-media-icon">🎵</span><h3 class="detail-media-title">' + escapeHtml(item.title) + '</h3>' +
          (hasLink ? '<a href="' + escapeHtml(mediaUrl) + '" target="_blank" rel="noopener noreferrer" class="detail-media-btn">🎵 点击收听</a>' : '') + '</div>';
      }
      if (galleryContainer) galleryContainer.style.display = 'none';
    } else if (type === '视频') {
      if (coverPlaceholder) {
        coverPlaceholder.style.display = '';
        var mediaUrl = img || content;
        var hasLink = isExternalLink(mediaUrl);
        coverPlaceholder.innerHTML = '<div class="detail-cover-media"><span class="detail-media-icon">🎬</span><h3 class="detail-media-title">' + escapeHtml(item.title) + '</h3>' +
          (hasLink ? '<a href="' + escapeHtml(mediaUrl) + '" target="_blank" rel="noopener noreferrer" class="detail-media-btn">▶ 点击观看</a>' : '') + '</div>';
      }
      if (galleryContainer) galleryContainer.style.display = 'none';
    }

    // 更新基本信息
    var titleEl = document.getElementById('detailTitle');
    var artistEl = document.getElementById('detailArtist');
    var tagEl = document.getElementById('detailTag');
    var dateEl = document.getElementById('detailDate');
    if (titleEl) titleEl.textContent = item.title || '无标题';
    if (artistEl) artistEl.textContent = '画师：' + (item.artist || '未知');
    if (tagEl) tagEl.textContent = type;
    if (dateEl) dateEl.textContent = formatDate(item.created_at);

    // 构建主体内容（多图不在这里显示，在相册中）
    var hasImages = (images.length > 0) || (img && isImageUrl(img));
    if (detailContent) {
      if (type === '图片') {
        // 只有当确实没有图片时才显示"暂无图片内容"
        if (!hasImages) {
          detailContent.innerHTML = '<div class="detail-content-empty">暂无图片内容</div>';
        } else {
          // 有图片则不显示任何内容（图片在封面区或相册中显示）
          detailContent.innerHTML = '';
        }
      } else if (type === '文字') {
        detailContent.innerHTML = '<div class="detail-content-text">' + formatTextContent(content) + '</div>';
      } else if (type === '音乐') {
        var mediaUrl = img || content;
        var hasLink = isExternalLink(mediaUrl);
        detailContent.innerHTML = '<div class="detail-content-media"><span class="detail-media-icon">🎵</span><h3 class="detail-media-title">' + escapeHtml(item.title) + '</h3>' +
          (hasLink ? '<a href="' + escapeHtml(mediaUrl) + '" target="_blank" rel="noopener noreferrer" class="detail-media-btn">🎵 点击收听完整内容</a>' : '<p style="color:var(--text-muted);">暂无链接</p>') + '</div>';
      } else if (type === '视频') {
        var mediaUrl = img || content;
        var hasLink = isExternalLink(mediaUrl);
        detailContent.innerHTML = '<div class="detail-content-media"><span class="detail-media-icon">🎬</span><h3 class="detail-media-title">' + escapeHtml(item.title) + '</h3>' +
          (hasLink ? '<a href="' + escapeHtml(mediaUrl) + '" target="_blank" rel="noopener noreferrer" class="detail-media-btn">▶ 点击观看完整内容</a>' : '<p style="color:var(--text-muted);">暂无链接</p>') + '</div>';
      } else {
        detailContent.innerHTML = '<div class="detail-content-empty">暂无内容</div>';
      }
    }

    // 加载评论
    renderCommissionCommentsList();
    updateCommissionCommentsCount();

    // 300ms fade 过渡效果
    if (listView) {
      listView.style.opacity = '0';
      listView.style.transition = 'opacity 0.3s ease';
    }

    if (detailView) {
      detailView.style.opacity = '0';
      detailView.style.transition = 'opacity 0.3s ease';
      detailView.classList.remove('hidden');
    }

    setTimeout(function() {
      if (listView) {
        listView.classList.add('hidden');
        listView.style.opacity = '1';
      }

      if (detailView) {
        detailView.style.opacity = '1';
        // 滚动到页面顶部
        window.scrollTo({ top: 0, behavior: 'instant' });
        // 启用详情页滚动
        detailView.style.overflowY = 'auto';
      }
    }, 300);
  }

  // ========== 相册功能 ==========

  var galleryState = {
    images: [],
    currentIndex: 0
  };

  /**
   * 初始化相册
   */
  function initGallery(images) {
    galleryState.images = images;
    galleryState.currentIndex = 0;

    var mainImg = document.getElementById('galleryMainImg');
    var counter = document.getElementById('galleryCounter');
    var thumbsContainer = document.getElementById('galleryThumbs');

    if (!mainImg || !counter || !thumbsContainer) return;

    // 设置主图
    updateGalleryMainImage(0);

    // 生成缩略图
    var thumbsHtml = '';
    for (var i = 0; i < images.length; i++) {
      thumbsHtml += '<img src="' + escapeHtml(images[i]) + '" alt="缩略图' + (i + 1) + '" class="gallery-thumb' + (i === 0 ? ' active' : '') + '" data-index="' + i + '">';
    }
    thumbsContainer.innerHTML = thumbsHtml;

    // 绑定缩略图点击事件
    var thumbs = thumbsContainer.querySelectorAll('.gallery-thumb');
    for (var j = 0; j < thumbs.length; j++) {
      thumbs[j].addEventListener('click', function() {
        var idx = parseInt(this.getAttribute('data-index'));
        setGalleryIndex(idx);
      });
    }

    // 绑定左右切换按钮
    var prevBtn = document.querySelector('.gallery-prev');
    var nextBtn = document.querySelector('.gallery-next');

    if (prevBtn) {
      prevBtn.onclick = function() { galleryPrev(); };
    }
    if (nextBtn) {
      nextBtn.onclick = function() { galleryNext(); };
    }

    // 绑定触摸滑动事件
    bindGalleryTouchEvents();
  }

  /**
   * 更新相册主图
   */
  function updateGalleryMainImage(index) {
    var mainImg = document.getElementById('galleryMainImg');
    var counter = document.getElementById('galleryCounter');
    var thumbsContainer = document.getElementById('galleryThumbs');

    if (!mainImg) return;

    galleryState.currentIndex = index;
    mainImg.src = galleryState.images[index];

    // 更新计数器
    if (counter) {
      counter.textContent = (index + 1) + ' / ' + galleryState.images.length;
    }

    // 更新缩略图高亮
    if (thumbsContainer) {
      var thumbs = thumbsContainer.querySelectorAll('.gallery-thumb');
      for (var i = 0; i < thumbs.length; i++) {
        if (i === index) {
          thumbs[i].classList.add('active');
          thumbs[i].scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        } else {
          thumbs[i].classList.remove('active');
        }
      }
    }
  }

  /**
   * 设置相册当前索引
   */
  function setGalleryIndex(index) {
    if (index < 0) index = galleryState.images.length - 1;
    if (index >= galleryState.images.length) index = 0;
    updateGalleryMainImage(index);
  }

  /**
   * 上一张
   */
  function galleryPrev() {
    setGalleryIndex(galleryState.currentIndex - 1);
  }

  /**
   * 下一张
   */
  function galleryNext() {
    setGalleryIndex(galleryState.currentIndex + 1);
  }

  /**
   * 绑定相册触摸滑动事件
   */
  function bindGalleryTouchEvents() {
    var galleryMain = document.querySelector('.gallery-main');
    if (!galleryMain) return;

    var touchStartX = 0;
    var touchEndX = 0;

    galleryMain.addEventListener('touchstart', function(e) {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });

    galleryMain.addEventListener('touchend', function(e) {
      touchEndX = e.changedTouches[0].clientX;
      var diff = touchStartX - touchEndX;
      // 滑动超过50px才触发
      if (Math.abs(diff) > 50) {
        if (diff > 0) {
          galleryNext();
        } else {
          galleryPrev();
        }
      }
    }, { passive: true });
  }

  /**
   * 关闭详情页
   */
  function closeDetail() {
    const listView = document.getElementById('commissionListView');
    const detailView = document.getElementById('commissionDetailView');

    window.currentCommissionId = null;

    // 300ms fade 过渡效果
    if (detailView) detailView.style.opacity = '0';
    if (listView) {
      listView.style.transition = 'opacity 0.3s ease';
      listView.style.opacity = '0';
    }

    setTimeout(() => {
      if (detailView) {
        detailView.classList.add('hidden');
        detailView.style.opacity = '1';
        detailView.style.overflowY = '';
      }

      if (listView) {
        listView.classList.remove('hidden');
        listView.style.opacity = '1';
      }

      // 滚动回原来位置
      window.scrollTo({ top: 0, behavior: 'instant' });
    }, 300);
  }

  /**
   * 格式化文字内容为适合阅读的HTML
   */
  function formatTextContent(text) {
    if (!text) return '<p style="color:#888;text-align:center;">暂无内容</p>';
    const escaped = escapeHtml(text);
    const paragraphs = escaped.split(/\n{2,}/);
    return paragraphs.map(p => `<p>${p.replace(/\n/g, '<br>')}</p>`).join('');
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

  /**
   * HTML 转义
   */
  function escapeHtml(str) {
    if (!str) return '';
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }

  /**
   * 格式化日期
   */
  function formatDate(dateStr) {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}.${month}.${day}`;
  }

  // 监听主题切换
  window.addEventListener('themechange', function(e) {
    loadCommissionsFromSupabase();
    // 清空搜索
    const searchInput = document.getElementById('commissionSearch');
    if (searchInput) searchInput.value = '';
  });

  // 窗口大小变化时重新计算瀑布流
  let resizeTimer;
  window.addEventListener('resize', () => {
    clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      calculateMasonry();
    }, 100);
  });

  // DOM 加载完成后初始化
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }

})();

// 全局删除约稿评论函数（供 onclick 调用）
window.deleteCommissionComment = function(commentId) {
  if (!confirm('确定删除这条评论吗？')) return;
  const commissionId = window.currentCommissionId;
  if (!commissionId) return;
  const key = 'commission-comments-' + commissionId;
  const stored = localStorage.getItem(key);
  let comments = stored ? JSON.parse(stored) : [];
  comments = comments.filter(c => c.id !== commentId);
  localStorage.setItem(key, JSON.stringify(comments));
  // 调用页面内的渲染函数
  if (typeof renderCommissionCommentsList === 'function') renderCommissionCommentsList();
  if (typeof updateCommissionCommentsCount === 'function') updateCommissionCommentsCount();
};
