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
  window.window.currentWorkId = null;

  // 点赞功能（暴露到全局供 onclick 调用）
  window.toggleLike = async function(contentType, contentId) {
    const client = window._authClient || window.dbClient;
    if (!client) return;
    const { data: { session } } = await client.auth.getSession();
    if (!session) { window.location.href = 'auth.html'; return; }

    const userId = session.user.id;
    const { data: existing } = await client
      .from('likes')
      .select('id')
      .eq('user_id', userId)
      .eq('content_type', contentType)
      .eq('content_id', contentId)
      .single();

    if (existing) {
      await client.from('likes').delete().eq('id', existing.id);
    } else {
      await client.from('likes').insert({
        user_id: userId,
        content_type: contentType,
        content_id: contentId
      });
    }

    // 更新 UI
    const card = document.querySelector(`.work-card[data-work-id="${contentId}"]`);
    if (card) {
      const btn = card.querySelector('.btn-favorite');
      const icon = btn.querySelector('.like-icon');
      const badge = card.querySelector('.favorite-badge');
      const isLiked = !existing;
      btn.classList.toggle('liked', isLiked);
      if (icon) icon.textContent = isLiked ? '❤' : '♡';
      if (badge) {
        badge.style.display = isLiked ? '' : 'none';
        badge.classList.toggle('show', isLiked);
      }
    }
  };

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
   * 判断是否是视频文件 URL（直接视频文件）
   */
  function isDirectVideoUrl(str) {
    if (!str) return false;
    return /\.(mp4|webm|ogg)(\?.*)?$/i.test(str);
  }

  /**
   * 判断是否是 Bilibili 链接
   */
  function isBilibiliUrl(str) {
    if (!str) return false;
    return str.includes('bilibili.com') || str.includes('b23.tv') || str.includes('player.bilibili.com');
  }

  /**
   * 判断是否是 YouTube 链接
   */
  function isYouTubeUrl(str) {
    if (!str) return false;
    return str.includes('youtube.com') || str.includes('youtu.be');
  }

  /**
   * 判断是否是 iframe 嵌入代码
   */
  function isIframeEmbed(str) {
    if (!str) return false;
    return str.includes('<iframe') || str.includes('player.bilibili.com') || str.includes('youtube.com/embed');
  }

  /**
   * 获取视频嵌入 HTML
   */
  function getVideoEmbedHtml(url, title) {
    if (!url) return '';
    url = url.trim();

    // 如果已经是 iframe 代码，直接返回
    if (url.startsWith('<iframe')) {
      return url.replace(/width="[^"]*"/, 'width="100%"').replace(/height="[^"]*"/, 'height="400"');
    }

    // Bilibili 检测
    if (isBilibiliUrl(url)) {
      let bvid = '';
      const bilibiliMatch = url.match(/bilibili\.com\/video\/([A-Za-z0-9]+)/i) ||
                           url.match(/b23\.tv\/([A-Za-z0-9]+)/i) ||
                           url.match(/bvid=([A-Za-z0-9]+)/i);
      if (bilibiliMatch) bvid = bilibiliMatch[1];
      if (bvid) {
        return `<iframe src="//player.bilibili.com/player.html?bvid=${bvid}" width="100%" height="400" frameborder="0" allowfullscreen style="border-radius:8px;"></iframe>`;
      }
      // 如果是 player.bilibili.com 链接
      if (url.includes('player.bilibili.com')) {
        return `<iframe src="${url}" width="100%" height="400" frameborder="0" allowfullscreen style="border-radius:8px;"></iframe>`;
      }
    }

    // YouTube 检测
    if (isYouTubeUrl(url)) {
      let videoId = '';
      const youtubeMatch = url.match(/youtube\.com\/watch\?v=([A-Za-z0-9_-]+)/i) ||
                          url.match(/youtu\.be\/([A-Za-z0-9_-]+)/i) ||
                          url.match(/youtube\.com\/embed\/([A-Za-z0-9_-]+)/i);
      if (youtubeMatch) videoId = youtubeMatch[1];
      if (videoId) {
        return `<iframe src="https://www.youtube.com/embed/${videoId}" width="100%" height="400" frameborder="0" allowfullscreen style="border-radius:8px;"></iframe>`;
      }
      // 如果是 youtube.com/embed 链接
      if (url.includes('youtube.com/embed')) {
        return `<iframe src="${url}" width="100%" height="400" frameborder="0" allowfullscreen style="border-radius:8px;"></iframe>`;
      }
    }

    // 直接视频文件
    if (isDirectVideoUrl(url)) {
      return `<video controls width="100%" style="border-radius:8px;max-height:500px;">
        <source src="${escapeHtml(url)}" type="video/${url.endsWith('.webm') ? 'webm' : 'mp4'}">
        您的浏览器不支持视频播放
      </video>`;
    }

    // 如果是外部链接，显示按钮
    if (isExternalLink(url)) {
      return `<a href="${escapeHtml(url)}" target="_blank" rel="noopener noreferrer" class="detail-content-link" style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.6rem 1.2rem;background:var(--accent);color:white;border-radius:20px;text-decoration:none;font-size:0.9rem;margin-bottom:20px;">▶ 前往观看</a>`;
    }

    return '';
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
   * 获取作品的图片数组（兼容旧数据）
   */
  function getWorkImages(work) {
    let images = [];
    try {
      if (work.images) {
        if (typeof work.images === 'string') {
          images = JSON.parse(work.images);
        } else if (Array.isArray(work.images)) {
          images = work.images;
        }
      }
    } catch (e) {
      images = [];
    }
    // 兼容旧数据：如果没有 images 但有 image_url
    if (images.length === 0 && work.image_url) {
      images = [work.image_url];
    }
    return images;
  }

  /**
   * 构建卡片主体（按类型）
   */
  function buildCardBody(item) {
    const type = item.type;
    const img = item.image_url;
    const images = getWorkImages(item);
    const content = (item.content || '').trim();
    const hasMultipleImages = images.length > 1;

    // 图片创作：有 image_url 直接显示图片
    if (type === '图片') {
      if (images.length > 0 && isImageUrl(images[0])) {
        return `<div class="work-card-cover">
          <img src="${escapeHtml(images[0])}" alt="${escapeHtml(item.title)}" loading="lazy">
          ${hasMultipleImages ? `<span class="work-card-multi-badge">${images.length}张</span>` : ''}
        </div>`;
      }
      return buildCardBodyDefault(item);
    }

    // 玩偶 / 游戏：有图片显示图片，没有显示图标
    if (type === '玩偶' || type === '游戏') {
      if (images.length > 0 && isImageUrl(images[0])) {
        return `<div class="work-card-cover">
          <img src="${escapeHtml(images[0])}" alt="${escapeHtml(item.title)}" loading="lazy">
          ${hasMultipleImages ? `<span class="work-card-multi-badge">${images.length}张</span>` : ''}
        </div>`;
      }
      return buildCardBodyDefault(item);
    }

    // 音乐创作：音符 emoji + 歌曲信息 + 收听按钮
    if (type === '音乐') {
      const mediaUrl = img || content;
      const hasLink = isExternalLink(mediaUrl);
      return `
        <div class="work-card-cover gradient-music">
          <span class="cover-icon">🎵</span>
          ${hasLink ? `<a href="${escapeHtml(mediaUrl)}" target="_blank" rel="noopener noreferrer" class="music-link-btn" onclick="event.stopPropagation();">🎵 点击收听</a>` : ''}
        </div>`;
    }

    // 视频创作：支持嵌入 iframe 或本地视频文件
    if (type === '视频') {
      const mediaUrl = img || content;
      const isEmbed = isBilibiliUrl(mediaUrl) || isYouTubeUrl(mediaUrl) || isIframeEmbed(mediaUrl);
      const isDirectVideo = isDirectVideoUrl(mediaUrl);

      // 如果是嵌入链接或本地视频，显示缩略图+播放图标
      if (isEmbed || isDirectVideo) {
        // 获取视频预览缩略图
        let thumbnailHtml = '';

        if (isBilibiliUrl(mediaUrl)) {
          let bvid = '';
          const bilibiliMatch = mediaUrl.match(/bilibili\.com\/video\/([A-Za-z0-9]+)/i) ||
                               mediaUrl.match(/b23\.tv\/([A-Za-z0-9]+)/i);
          if (bilibiliMatch) bvid = bilibiliMatch[1];
          if (bvid) {
            thumbnailHtml = `<img src="https://i0.hdslb.com/bfs/archive/${bvid}.jpg" alt="thumbnail" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;" onerror="this.style.display='none'">`;
          }
        } else if (isYouTubeUrl(mediaUrl)) {
          let videoId = '';
          const youtubeMatch = mediaUrl.match(/youtube\.com\/watch\?v=([A-Za-z0-9_-]+)/i) ||
                              mediaUrl.match(/youtu\.be\/([A-Za-z0-9_-]+)/i);
          if (youtubeMatch) videoId = youtubeMatch[1];
          if (videoId) {
            thumbnailHtml = `<img src="https://img.youtube.com/vi/${videoId}/mqdefault.jpg" alt="thumbnail" style="position:absolute;top:0;left:0;width:100%;height:100%;object-fit:cover;">`;
          }
        }

        const playIcon = `<div style="position:absolute;top:50%;left:50%;transform:translate(-50%,-50%);background:rgba(0,0,0,0.6);border-radius:50%;width:50px;height:50px;display:flex;align-items:center;justify-content:center;"><svg viewBox="0 0 24 24" width="24" height="24" fill="white"><polygon points="5 3 19 12 5 21 5 3"/></svg></div>`;

        return `
          <div class="work-card-cover" style="position:relative;overflow:hidden;background:linear-gradient(135deg, #1a1a2e, #16213e);">
            ${thumbnailHtml}
            ${playIcon}
          </div>`;
      }

      // 普通视频链接
      return `
        <div class="work-card-cover gradient-video">
          <span class="cover-icon">🎬</span>
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
      <div class="work-card-cover">
        <div class="cover-placeholder">
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

    // 获取当前登录用户ID
    const currentUserId = window.UserAuth?.getCurrentUserId() || null;

    if (displayedWorks.length === 0) {
      const query = document.getElementById('worksSearch').value.trim();
      if (query) {
        grid.innerHTML = '<p class="works-grid-empty">没有找到相关作品</p>';
      } else {
        grid.innerHTML = '<p class="works-grid-empty">暂无作品，快来发布第一篇吧</p>';
      }
      return;
    }

    grid.innerHTML = displayedWorks.map((item) => {
      const typeClass = getTypeClass(item.type);
      const isFav = favorites.includes(item.id);
      const commentCount = commentCounts[item.id] || 0;
      const isText = item.type === '文字';
      // 检查是否是当前用户的作品
      const isOwner = currentUserId && item.user_id === currentUserId;

      // 卡片主体
      const body = isText
        ? buildTextCardBody(item)
        : buildCardBody(item);

      if (isText) {
        // 文字卡片
        return `
          <article class="work-card" data-category="${typeClass}" data-work-id="${item.id}">
            <div class="favorite-badge ${isFav ? 'show' : ''}" style="${isFav ? '' : 'display:none'}">❤</div>
            ${body}
            <div class="work-card-actions">
              ${isOwner ? `
              <button class="btn-card-action btn-edit" data-work-id="${item.id}" onclick="editWork('${item.id}')">
                <span>✏️</span>
                <span>编辑</span>
              </button>
              <button class="btn-card-action btn-delete" data-work-id="${item.id}" onclick="deleteWork('${item.id}')">
                <span>🗑️</span>
                <span>删除</span>
              </button>
              ` : ''}
              <button class="btn-card-action btn-favorite" data-work-id="${item.id}" onclick="toggleLike('work', '${item.id}')">
                <span class="like-icon">${isFav ? '❤' : '♡'}</span>
                <span>收藏</span>
              </button>
              <button class="btn-card-action btn-comment" data-work-id="${item.id}">
                <span>💬</span>
                <span>${commentCount}</span>
              </button>
            </div>
          </article>
        `;
      }

      // 其他卡片
      return `
        <article class="work-card" data-category="${typeClass}" data-work-id="${item.id}">
          <div class="favorite-badge ${isFav ? 'show' : ''}" style="${isFav ? '' : 'display:none'}">❤</div>
          ${body}
          <div class="work-card-content">
            <span class="work-type-tag">${escapeHtml(item.type)}</span>
            <h3 class="work-card-title">${escapeHtml(item.title)}</h3>
            <p class="work-card-author">${escapeHtml(item.author || '未知作者')}</p>
            ${item.created_at ? `<p class="work-card-date">${formatDate(item.created_at)}</p>` : ''}
            ${!isText && item.content ? `<p class="work-card-excerpt">${escapeHtml(item.content.substring(0, 80))}${item.content.length > 80 ? '…' : ''}</p>` : ''}
          </div>
          <div class="work-card-actions">
            ${isOwner ? `
            <button class="btn-card-action btn-edit" data-work-id="${item.id}" onclick="editWork('${item.id}')">
              <span>✏️</span>
              <span>编辑</span>
            </button>
            <button class="btn-card-action btn-delete" data-work-id="${item.id}" onclick="deleteWork('${item.id}')">
              <span>🗑️</span>
              <span>删除</span>
            </button>
            ` : ''}
            <button class="btn-card-action btn-favorite" data-work-id="${item.id}" onclick="toggleLike('work', '${item.id}')">
              <span class="like-icon">${isFav ? '❤' : '♡'}</span>
              <span>收藏</span>
            </button>
            <button class="btn-card-action btn-comment" data-work-id="${item.id}">
              <span>💬</span>
              <span>${commentCount}</span>
            </button>
          </div>
        </article>
      `;
    }).join('');
  }

  // 编辑作品（暴露到全局供 onclick 调用）
  window.editWork = function(workId) {
    const currentUserId = window.UserAuth?.getCurrentUserId();
    if (!currentUserId) {
      window.location.href = 'auth.html?redirect=' + encodeURIComponent(window.location.href);
      return;
    }
    window.location.href = 'publish.html?edit=' + workId;
  };

  // 删除作品（暴露到全局供 onclick 调用）
  window.deleteWork = async function(workId) {
    const currentUserId = window.UserAuth?.getCurrentUserId();
    if (!currentUserId) {
      alert('请先登录');
      window.location.href = 'auth.html';
      return;
    }

    // 验证是否是作品所有者
    const work = cachedWorks.find(w => w.id === workId);
    if (!work) {
      alert('作品不存在');
      return;
    }
    if (work.user_id !== currentUserId) {
      alert('您没有权限删除这个作品');
      return;
    }

    if (!confirm('确定要删除这个作品吗？此操作不可恢复。')) return;

    try {
      const { error } = await window.dbClient.from('works').delete().eq('id', workId);
      if (error) throw error;
      alert('删除成功');
      loadWorksFromSupabase();
    } catch (err) {
      console.error('删除失败:', err);
      alert('删除失败: ' + err.message);
    }
  };

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
      // 忽略链接、按钮
      if (e.target.closest('a, button')) return;

      const cardBody = e.target.closest('.work-card-cover, .work-card-body');
      if (!cardBody) return;

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
      toggleLike('work', btn.dataset.workId);
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
        if (window.currentWorkId) {
          toggleLike('work', window.currentWorkId);
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
      toggleLike('work', workId);
      const nowFav = !getFavorites().includes(workId);
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
    const icon = btn.querySelector('.like-icon');
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
    const toolbar = document.getElementById('immersiveToolbar');

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
    toolbar.className = 'immersive-toolbar light';
    document.getElementById('immersiveText').className = 'immersive-text size-medium';
    document.getElementById('immersiveProgress').style.width = '0%';

    // 默认隐藏工具栏（按需显示）
    toolbar.classList.remove('visible');

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
    const mediumBtn = document.querySelector('.immersive-size-btn[data-size="medium"]');
    if (mediumBtn) mediumBtn.classList.add('active');
    document.querySelectorAll('.immersive-bg-btn').forEach(b => b.classList.remove('active'));
    const lightBtn = document.querySelector('.immersive-bg-btn[data-bg="light"]');
    if (lightBtn) lightBtn.classList.add('active');
    // 重置时隐藏工具栏
    const toolbar = document.getElementById('immersiveToolbar');
    if (toolbar) toolbar.classList.remove('visible');
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

    // 滚动 → 进度条 + 按需显示工具栏
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

      // 滚动时显示工具栏
      showToolbar();
    };
    contentWrap.addEventListener('scroll', immersiveScrollHandler, { passive: true });

    // 鼠标移动 → 显示工具栏
    if (immersiveMouseHandler) {
      overlay.removeEventListener('mousemove', immersiveMouseHandler);
    }
    immersiveMouseHandler = function() {
      showToolbar();
    };
    overlay.addEventListener('mousemove', immersiveMouseHandler, { passive: true });

    // 字号切换
    document.querySelectorAll('.immersive-size-btn').forEach(btn => {
      btn.addEventListener('click', function() {
        showToolbar();
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
        showToolbar();
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

  /**
   * 显示工具栏（按需显示，2秒后自动隐藏）
   */
  function showToolbar() {
    const toolbar = document.getElementById('immersiveToolbar');
    if (!toolbar) return;
    toolbar.classList.add('visible');
    if (immersiveToolbarTimer) clearTimeout(immersiveToolbarTimer);
    immersiveToolbarTimer = setTimeout(() => {
      toolbar.classList.remove('visible');
    }, 2000);
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
    window.currentWorkId = workId;
    const work = cachedWorks.find(w => w.id === workId);
    if (!work) return;

    // 记录当前滚动位置
    sessionStorage.setItem('listScrollPos', window.scrollY);

    // 记录浏览历史
    recordBrowseHistory(work.title, 'works', work.id);

    const url = new URL(window.location);
    url.searchParams.set('work', workId);
    url.searchParams.set('view', 'detail');
    window.history.pushState({}, '', url);

    document.getElementById('worksListView').classList.add('hidden');
    document.getElementById('worksDetailView').classList.remove('hidden');

    // 获取图片数组
    const images = getWorkImages(work);
    const hasMultipleImages = images.length > 1;

    // 更新封面和相册
    const coverPlaceholder = document.getElementById('detailCoverPlaceholder');
    const galleryContainer = document.getElementById('galleryContainer');

    if (hasMultipleImages) {
      // 多图模式：显示相册
      if (coverPlaceholder) coverPlaceholder.style.display = 'none';
      if (galleryContainer) {
        galleryContainer.style.display = '';
        initGallery(images);
      }
    } else {
      // 单图模式：显示单张图片
      if (coverPlaceholder) {
        coverPlaceholder.style.display = '';
        if (images.length > 0 && isImageUrl(images[0])) {
          coverPlaceholder.innerHTML = `<img src="${escapeHtml(images[0])}" alt="${escapeHtml(work.title)}" style="width:100%;height:100%;object-fit:contain;border-radius:8px;">`;
        } else {
          coverPlaceholder.innerHTML = getCoverSVG(work.type);
        }
        coverPlaceholder.className = `cover-placeholder detail-cover-placeholder ${getTypeClass(work.type)}-cover`;
      }
      if (galleryContainer) galleryContainer.style.display = 'none';
    }

    // 更新基本信息
    const el = id => document.getElementById(id);
    if (el('detailTitle'))   el('detailTitle').textContent   = work.title || '无标题';
    if (el('detailAuthor'))  el('detailAuthor').textContent  = '作者：' + (work.author || '未知作者');
    if (el('detailTag'))     el('detailTag').textContent     = work.type || '';
    if (el('detailDate'))    el('detailDate').textContent    = work.created_at ? formatDate(work.created_at) : '';
    if (el('detailContent')) el('detailContent').innerHTML   = buildDetailContent(work);

    updateDetailFavoriteButton();
    // 从数据库同步点赞状态
    if (window.updateDetailFavoriteButtonFromDB) {
      window.updateDetailFavoriteButtonFromDB();
    }
    renderCommentsList();
    updateCommentsCount();
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  // ========== 相册功能 ==========

  let galleryState = {
    images: [],
    currentIndex: 0
  };

  /**
   * 初始化相册
   */
  function initGallery(images) {
    galleryState.images = images;
    galleryState.currentIndex = 0;

    const mainImg = document.getElementById('galleryMainImg');
    const counter = document.getElementById('galleryCounter');
    const thumbsContainer = document.getElementById('galleryThumbs');

    if (!mainImg || !counter || !thumbsContainer) return;

    // 设置主图
    updateGalleryMainImage(0);

    // 生成缩略图
    thumbsContainer.innerHTML = images.map((img, index) => `
      <img src="${escapeHtml(img)}" alt="缩略图${index + 1}" class="gallery-thumb ${index === 0 ? 'active' : ''}" data-index="${index}">
    `).join('');

    // 绑定缩略图点击事件
    thumbsContainer.querySelectorAll('.gallery-thumb').forEach(thumb => {
      thumb.addEventListener('click', function() {
        const index = parseInt(this.dataset.index);
        setGalleryIndex(index);
      });
    });

    // 绑定左右切换按钮
    const prevBtn = document.querySelector('.gallery-prev');
    const nextBtn = document.querySelector('.gallery-next');

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
    const mainImg = document.getElementById('galleryMainImg');
    const counter = document.getElementById('galleryCounter');
    const thumbsContainer = document.getElementById('galleryThumbs');

    if (!mainImg) return;

    galleryState.currentIndex = index;
    mainImg.src = galleryState.images[index];

    // 更新计数器
    if (counter) {
      counter.textContent = `${index + 1} / ${galleryState.images.length}`;
    }

    // 更新缩略图高亮
    if (thumbsContainer) {
      thumbsContainer.querySelectorAll('.gallery-thumb').forEach((thumb, i) => {
        thumb.classList.toggle('active', i === index);
        // 确保激活的缩略图在可视区域内
        if (i === index) {
          thumb.scrollIntoView({ behavior: 'smooth', inline: 'center', block: 'nearest' });
        }
      });
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
    const galleryMain = document.querySelector('.gallery-main');
    if (!galleryMain) return;

    let touchStartX = 0;
    let touchEndX = 0;

    galleryMain.addEventListener('touchstart', function(e) {
      touchStartX = e.changedTouches[0].clientX;
    }, { passive: true });

    galleryMain.addEventListener('touchend', function(e) {
      touchEndX = e.changedTouches[0].clientX;
      const diff = touchStartX - touchEndX;
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
   * 构建详情页内容 HTML
   * 注意：图片类作品的多图已在封面区相册显示，这里只返回正文内容（如果有的话）
   */
  function buildDetailContent(work) {
    const images = getWorkImages(work);
    const img = work.image_url || '';
    const content = (work.content || '').trim();
    const type = work.type;

    // 文字类作品：只显示文字内容
    if (type === '文字') {
      return `<div class="article-body">${(work.content || '').replace(/\n/g, '<br>')}</div>`;
    }

    // 图片类作品：图片已在封面区显示，detailContent 只显示正文文字（如果有）
    if (type === '图片') {
      // 多图在封面区相册显示，单图在封面区显示
      // 这里只返回正文文字内容（如果有的话）
      if (content && !isImageUrl(content) && !isExternalLink(content)) {
        return `<div class="article-body">${escapeHtml(content)}</div>`;
      }
      return '';
    }

    // 音乐类作品
    if (type === '音乐') {
      return `<div style="text-align:center;padding:40px;">
        <div style="font-size:3rem">🎵</div>
        <p style="margin:16px 0;font-size:1.2rem;font-weight:600;">${escapeHtml(work.title)}</p>
        ${img && isExternalLink(img) ? `<a href="${escapeHtml(img)}" target="_blank" class="detail-content-link" style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.6rem 1.2rem;background:var(--accent);color:white;border-radius:20px;text-decoration:none;font-size:0.9rem;">🎵 点击收听</a>` : ''}
        ${content && isExternalLink(content) ? `<a href="${escapeHtml(content)}" target="_blank" class="detail-content-link" style="display:inline-flex;align-items:center;gap:0.4rem;padding:0.6rem 1.2rem;background:var(--accent);color:white;border-radius:20px;text-decoration:none;font-size:0.9rem;">🎵 点击收听</a>` : ''}
      </div>`;
    }

    // 视频类作品：视频已在封面区显示
    if (type === '视频') {
      // 视频嵌入在封面区或 detailContent 中显示
      const mediaUrl = img || content;
      const videoEmbed = getVideoEmbedHtml(mediaUrl, work.title);
      if (videoEmbed) {
        return videoEmbed;
      }
      // 如果封面区没有显示视频，这里尝试显示
      if (isDirectVideoUrl(mediaUrl)) {
        return `<video controls width="100%" style="border-radius:8px;max-height:500px;">
          <source src="${escapeHtml(mediaUrl)}" type="video/${mediaUrl.endsWith('.webm') ? 'webm' : 'mp4'}">
          您的浏览器不支持视频播放
        </video>`;
      }
      return '';
    }

    // 其他类型（玩偶/游戏等）：图片已在封面区显示，这里只显示正文
    if (content && !isImageUrl(content) && !isExternalLink(content)) {
      return `<div class="article-body">${escapeHtml(content)}</div>`;
    }

    // 没有任何内容时返回空
    return '';
  }

  /**
   * 关闭作品详情页
   */
  function closeWorkDetail() {
    window.currentWorkId = null;
    const url = new URL(window.location);
    url.searchParams.delete('work');
    url.searchParams.delete('view');
    url.searchParams.delete('comments');
    window.history.pushState({}, '', url);

    document.getElementById('worksDetailView').classList.add('hidden');
    document.getElementById('worksListView').classList.remove('hidden');

    // 恢复滚动位置
    const savedPos = sessionStorage.getItem('listScrollPos');
    if (savedPos) {
      setTimeout(() => {
        window.scrollTo({ top: parseInt(savedPos), behavior: 'instant' });
      }, 50);
      sessionStorage.removeItem('listScrollPos');
    }
  }

  /**
   * 更新详情页收藏按钮
   */
  function updateDetailFavoriteButton() {
    if (!window.currentWorkId) return;
    const btn = document.getElementById('btnDetailFavorite');
    if (!btn) return;
    const fav = getFavorites().includes(window.currentWorkId);
    btn.classList.toggle('liked', fav);
    const icon = btn.querySelector('.favorite-icon-large');
    const text = btn.querySelector('.favorite-text');
    if (icon) icon.textContent = fav ? '❤' : '♡';
    if (text) text.textContent = fav ? '已收藏' : '收藏';
  }

  /**
   * 更新详情页收藏按钮（从数据库获取状态）
   */
  window.updateDetailFavoriteButtonFromDB = async function() {
    if (!window.currentWorkId) return;
    const btn = document.getElementById('btnDetailFavorite');
    if (!btn) return;
    
    const client = window._authClient || window.dbClient;
    if (!client) return;
    
    const { data: { session } } = await client.auth.getSession();
    if (!session) return;
    
    const { data: existing } = await client
      .from('likes')
      .select('id')
      .eq('user_id', session.user.id)
      .eq('content_type', 'work')
      .eq('content_id', window.currentWorkId)
      .single();
    
    const isLiked = !!existing;
    btn.classList.toggle('liked', isLiked);
    const icon = btn.querySelector('.favorite-icon-large');
    const text = btn.querySelector('.favorite-text');
    if (icon) icon.textContent = isLiked ? '❤' : '♡';
    if (text) text.textContent = isLiked ? '已收藏' : '收藏';
  };

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
    const icon = btn.querySelector('.like-icon');
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
    if (!window.currentWorkId) return;
    const count = getComments(window.currentWorkId).length;
    const el = id => document.getElementById(id);
    if (el('commentsCount')) el('commentsCount').textContent = `(${count})`;
    const cardCount = document.querySelector(`.work-card[data-work-id="${window.currentWorkId}"] .comment-count`);
    if (cardCount) cardCount.textContent = count;
  }

  /**
   * 渲染留言列表
   */
  function renderCommentsList() {
    if (!window.currentWorkId) return;
    const list = document.getElementById('commentsList');
    if (!list) return;
    const comments = getComments(window.currentWorkId);

    if (!comments.length) {
      list.innerHTML = '<p class="comments-list-empty">还没有留言，快来抢沙发吧~</p>';
      return;
    }

    list.innerHTML = comments.map(c => `
      <div class="comment-item" data-comment-id="${c.id}">
        <div class="comment-avatar">${(c.nickname || '?').charAt(0).toUpperCase()}</div>
        <div class="comment-body">
          <div class="comment-header">
            <span class="comment-nickname">${escapeHtml(c.nickname)}</span>
            <span class="comment-time">${c.time || ''}</span>
            <button class="btn-delete-comment" onclick="deleteWorkComment('${c.id}')">× 删除</button>
          </div>
          <p class="comment-text">${escapeHtml(c.content)}</p>
        </div>
      </div>
    `).join('');
  }

  /**
   * 删除作品评论
   */
  function deleteWorkComment(commentId) {
    if (!confirm('确定删除这条评论吗？')) return;
    if (!window.currentWorkId) return;
    const comments = getComments(window.currentWorkId);
    const filteredComments = comments.filter(c => c.id !== commentId);
    saveComments(window.currentWorkId, filteredComments);
    renderCommentsList();
    updateCommentsCount();
  }

  /**
   * 提交留言
   */
  async function submitComment(e) {
    e.preventDefault();
    if (!window.currentWorkId) return;
    const form = document.getElementById('commentsForm');
    if (!form) return;
    const content = form.querySelector('.comment-content').value.trim();
    if (!content) return;

    // 自动获取用户名
    const client = window._authClient || window.dbClient;
    let nickname = '游客';
    if (client) {
      const { data: { session } } = await client.auth.getSession();
      if (session) {
        const { data: profile } = await client.from('profiles').select('username').eq('user_id', session.user.id).single();
        nickname = profile?.username || '游客';
      }
    }

    const comments = getComments(window.currentWorkId);
    comments.push({ id: 'c-' + Date.now(), nickname, content, time: formatTime(new Date()) });
    saveComments(window.currentWorkId, comments);
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
   * 记录浏览历史
   */
  function recordBrowseHistory(title, type, id) {
    const history = JSON.parse(localStorage.getItem('browse-history') || '[]');
    // 避免重复记录
    const filtered = history.filter(h => h.id !== id);
    filtered.unshift({
      id: id,
      title: title,
      type: type,
      time: new Date().toLocaleString('zh-CN')
    });
    // 只保留最近50条
    localStorage.setItem('browse-history', JSON.stringify(filtered.slice(0, 50)));
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

// 全局删除作品评论函数（供 onclick 调用）
window.deleteWorkComment = function(commentId) {
  if (!confirm('确定删除这条评论吗？')) return;
  const workId = window.window.currentWorkId;
  if (!workId) return;
  const key = 'works-comments-' + workId;
  const stored = localStorage.getItem(key);
  let comments = stored ? JSON.parse(stored) : [];
  comments = comments.filter(c => c.id !== commentId);
  localStorage.setItem(key, JSON.stringify(comments));
  // 调用页面内的渲染函数
  if (typeof renderCommentsList === 'function') renderCommentsList();
  if (typeof updateCommentsCount === 'function') updateCommentsCount();
};

// 同步点赞状态到 UI（供页面调用）
window.syncLikeStatus = async function(contentType, contentId, elementId) {
  const client = window._authClient || window.dbClient;
  const { data: { session } } = await client.auth.getSession();
  if (!session) return;

  const { data: existing } = await client
    .from('likes')
    .select('id')
    .eq('user_id', session.user.id)
    .eq('content_type', contentType)
    .eq('content_id', contentId)
    .single();

  const isLiked = !!existing;
  const btn = document.getElementById(elementId);
  if (btn) {
    btn.classList.toggle('liked', isLiked);
    const icon = btn.querySelector('.like-icon');
    if (icon) icon.textContent = isLiked ? '❤' : '♡';
  }
};
