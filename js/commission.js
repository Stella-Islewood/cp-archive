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

  // 缓存的约稿数据
  let cachedCommissions = [];
  let displayedCommissions = [];
  let currentCommissionId = null;

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
    const notesToggle = document.getElementById('notesToggle');
    const notesContent = document.getElementById('notesContent');

    if (backBtn) {
      backBtn.addEventListener('click', closeDetail);
    }

    if (notesToggle && notesContent) {
      notesToggle.addEventListener('click', function() {
        this.classList.toggle('expanded');
        notesContent.classList.toggle('expanded');
      });
    }

    // ESC 关闭详情
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape') {
        closeDetail();
      }
    });
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
    const content = item.text_content || '';

    // 图片类型
    if (type === '图片') {
      if (img && isImageUrl(img)) {
        return `<div class="card-image">
          <img src="${escapeHtml(img)}" alt="${escapeHtml(item.title)}" class="card-img" loading="lazy">
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

      return `
        <article class="commission-card ${isText ? 'commission-card-text' : ''}" data-index="${index}" data-id="${item.id}">
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

    bindCardEvents();
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
   * 绑定卡片点击事件
   */
  function bindCardEvents() {
    const cards = document.querySelectorAll('.commission-card');

    cards.forEach((card) => {
      card.addEventListener('click', function() {
        const index = parseInt(this.dataset.index);
        openDetail(this, index);
      });
    });
  }

  /**
   * 打开详情页
   */
  function openDetail(card, index) {
    const item = displayedCommissions[index];
    if (!item) return;

    currentCommissionId = item.id;

    const coverPlaceholder = document.getElementById('detailCoverPlaceholder');
    const notesToggle = document.getElementById('notesToggle');
    const notesContent = document.getElementById('notesContent');
    const notesText = document.getElementById('notesText');
    const detailNotes = document.getElementById('detailNotes');

    // 根据类型构建封面区内容
    const type = item.type || '图片';
    const img = item.image_url;
    const content = item.text_content || '';

    if (type === '图片') {
      if (img && isImageUrl(img)) {
        coverPlaceholder.innerHTML = `<img src="${escapeHtml(img)}" alt="${escapeHtml(item.title)}" style="width:100%;height:100%;object-fit:contain;">`;
      } else {
        coverPlaceholder.innerHTML = `<div class="detail-cover-default ${getTypeGradientClass(type)}">
          <svg viewBox="0 0 24 24" width="80" height="80" fill="none" stroke="currentColor" stroke-width="1">
            <rect x="3" y="3" width="18" height="18" rx="2"/>
            <circle cx="8.5" cy="8.5" r="1.5"/>
            <path d="M21 15l-5-5L5 21"/>
          </svg>
        </div>`;
      }
    } else if (type === '文字') {
      coverPlaceholder.innerHTML = `<div class="detail-cover-text">
        <p class="detail-text-preview">${escapeHtml(content.substring(0, 200))}${content.length > 200 ? '…' : ''}</p>
      </div>`;
    } else if (type === '音乐') {
      const mediaUrl = img || content;
      const hasLink = isExternalLink(mediaUrl);
      coverPlaceholder.innerHTML = `<div class="detail-cover-media">
        <span class="detail-media-icon">🎵</span>
        <h3 class="detail-media-title">${escapeHtml(item.title)}</h3>
        ${hasLink ? `<a href="${escapeHtml(mediaUrl)}" target="_blank" rel="noopener noreferrer" class="detail-media-btn">🎵 点击收听</a>` : ''}
      </div>`;
    } else if (type === '视频') {
      const mediaUrl = img || content;
      const hasLink = isExternalLink(mediaUrl);
      coverPlaceholder.innerHTML = `<div class="detail-cover-media">
        <span class="detail-media-icon">🎬</span>
        <h3 class="detail-media-title">${escapeHtml(item.title)}</h3>
        ${hasLink ? `<a href="${escapeHtml(mediaUrl)}" target="_blank" rel="noopener noreferrer" class="detail-media-btn">▶ 点击观看</a>` : ''}
      </div>`;
    }

    // 更新基本信息
    document.getElementById('detailTitle').textContent = item.title || '无标题';
    document.getElementById('detailArtist').textContent = '画师：' + (item.artist || '未知');
    document.getElementById('detailTag').textContent = type;
    document.getElementById('detailDate').textContent = formatDate(item.created_at);

    // 更新笔记内容
    if (item.founder_notes && item.founder_notes.trim() !== '') {
      notesText.textContent = item.founder_notes;
      detailNotes.style.display = '';
    } else {
      notesText.textContent = '暂无笔记';
      detailNotes.style.display = '';
    }

    // 重置笔记折叠状态
    if (notesToggle) notesToggle.classList.remove('expanded');
    if (notesContent) notesContent.classList.remove('expanded');

    // 显示详情页
    document.getElementById('commissionListView').classList.add('hidden');
    document.getElementById('commissionDetailView').classList.remove('hidden');
    document.body.style.overflow = 'hidden';
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }

  /**
   * 关闭详情页
   */
  function closeDetail() {
    currentCommissionId = null;
    document.getElementById('commissionDetailView').classList.add('hidden');
    document.getElementById('commissionListView').classList.remove('hidden');
    document.body.style.overflow = '';
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
