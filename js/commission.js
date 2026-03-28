/**
 * ========================================
 * CP同人档案馆 - 约稿展示页面脚本
 * 从 Supabase 读取数据
 * ========================================
 */

(function() {
  'use strict';

  // Supabase 配置
  const SUPABASE_URL = 'https://vbvfrmqwlyitarmnhmyw.supabase.co';
  const SUPABASE_KEY = 'sb_publishable_SB0uqo25MSjOPA4fb8n-eg_bCBiXMzH';
  const dbClient = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

  // 缓存的约稿数据
  let cachedCommissions = [];

  /**
   * 初始化约稿页面功能
   */
  function init() {
    loadCommissionsFromSupabase();
    bindLightboxEvents();
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
      
      const { data, error } = await dbClient
        .from('commissions')
        .select('*')
        .eq('archive_id', theme)
        .order('created_at', { ascending: false });

      if (error) throw error;

      cachedCommissions = data || [];
      renderCommissions();
      initMasonry();
    } catch (error) {
      console.error('加载约稿失败:', error);
      cachedCommissions = [];
      renderCommissions();
    }
  }

  /**
   * 渲染约稿卡片
   */
  function renderCommissions() {
    const grid = document.getElementById('commissionGrid');
    if (!grid) return;

    if (cachedCommissions.length === 0) {
      grid.innerHTML = '<p style="text-align:center;color:#888;padding:40px;grid-column:1/-1;">暂无约稿数据</p>';
      return;
    }

    grid.innerHTML = cachedCommissions.map((item, index) => {
      const hasImage = item.image_url && item.image_url.trim() !== '';
      const imageHtml = hasImage 
        ? `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(item.title)}" class="card-img" onerror="this.style.display='none';this.nextElementSibling.style.display='flex';">`
        : '';
      const placeholderClass = index % 3 === 1 ? 'tall' : '';
      
      return `
        <article class="commission-card" data-index="${index}" data-id="${item.id}">
          <div class="card-image">
            ${hasImage ? imageHtml : ''}
            <div class="image-placeholder ${placeholderClass}" style="${hasImage ? 'display:none;' : ''}">
              <svg viewBox="0 0 24 24" width="48" height="48" fill="none" stroke="currentColor" stroke-width="1">
                <rect x="3" y="3" width="18" height="18" rx="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <path d="M21 15l-5-5L5 21"/>
              </svg>
            </div>
          </div>
          <div class="card-info">
            <h3 class="card-title">${escapeHtml(item.title)}</h3>
            <p class="card-artist">画师：${escapeHtml(item.artist)}</p>
            <p class="card-date">${formatDate(item.created_at)}</p>
          </div>
        </article>
      `;
    }).join('');

    // 绑定卡片点击事件
    bindCardEvents();
  }

  /**
   * 初始化瀑布流布局
   */
  function initMasonry() {
    const grid = document.getElementById('commissionGrid');
    if (!grid) return;

    calculateMasonry();
  }

  /**
   * 计算瀑布流每项的高度
   */
  function calculateMasonry() {
    const grid = document.getElementById('commissionGrid');
    const items = grid.querySelectorAll('.commission-card');
    const rowHeight = 10;
    const rowGap = parseInt(getComputedStyle(grid).gap) || 15;

    items.forEach(item => {
      const image = item.querySelector('.card-image');
      const info = item.querySelector('.card-info');
      const imageHeight = image.offsetHeight;
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

    cards.forEach((card, index) => {
      card.addEventListener('click', function() {
        openLightbox(this, index);
      });
    });
  }

  /**
   * 打开 Lightbox
   */
  function openLightbox(card, index) {
    const lightbox = document.getElementById('lightbox');
    const title = card.querySelector('.card-title').textContent;
    const artist = card.querySelector('.card-artist').textContent;
    const date = card.querySelector('.card-date').textContent;
    const item = cachedCommissions[index];

    // 更新 Lightbox 内容
    const imageContainer = lightbox.querySelector('.lightbox-image');
    
    if (item.image_url && item.image_url.trim() !== '') {
      imageContainer.innerHTML = `<img src="${escapeHtml(item.image_url)}" alt="${escapeHtml(title)}" style="max-width:100%;max-height:80vh;object-fit:contain;">`;
    } else {
      imageContainer.innerHTML = `
        <svg viewBox="0 0 24 24" width="120" height="120" fill="none" stroke="currentColor" stroke-width="0.5">
          <rect x="3" y="3" width="18" height="18" rx="2"/>
          <circle cx="8.5" cy="8.5" r="1.5"/>
          <path d="M21 15l-5-5L5 21"/>
        </svg>
      `;
    }

    // 更新笔记内容
    const notesContent = lightbox.querySelector('.notes-content');
    if (item.founder_notes && item.founder_notes.trim() !== '') {
      notesContent.textContent = item.founder_notes;
    } else {
      notesContent.textContent = '暂无笔记';
    }

    // 重置笔记折叠状态
    const notesToggle = document.getElementById('notesToggle');
    const notesContentEl = document.getElementById('notesContent');
    notesToggle.classList.remove('expanded');
    notesContentEl.classList.remove('expanded');

    // 显示 Lightbox
    lightbox.classList.add('active');
    document.body.style.overflow = 'hidden';
  }

  /**
   * 绑定 Lightbox 事件
   */
  function bindLightboxEvents() {
    const lightbox = document.getElementById('lightbox');
    if (!lightbox) return;
    
    const closeBtn = lightbox.querySelector('.lightbox-close');
    const notesToggle = document.getElementById('notesToggle');
    const notesContent = document.getElementById('notesContent');

    // 点击关闭按钮
    closeBtn.addEventListener('click', closeLightbox);

    // 点击背景关闭
    lightbox.addEventListener('click', function(e) {
      if (e.target === lightbox) {
        closeLightbox();
      }
    });

    // ESC 键关闭
    document.addEventListener('keydown', function(e) {
      if (e.key === 'Escape' && lightbox.classList.contains('active')) {
        closeLightbox();
      }
    });

    // 笔记折叠
    if (notesToggle) {
      notesToggle.addEventListener('click', function() {
        this.classList.toggle('expanded');
        notesContent.classList.toggle('expanded');
      });
    }
  }

  /**
   * 关闭 Lightbox
   */
  function closeLightbox() {
    const lightbox = document.getElementById('lightbox');
    lightbox.classList.remove('active');
    document.body.style.overflow = '';
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
